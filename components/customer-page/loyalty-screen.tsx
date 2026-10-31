"use client";

/**
 * The customer's loyalty card (PRD.md 5.7, business-rules.md section 12).
 *
 * Flow: join with an email -> confirm the emailed code -> stamp card. A stamp
 * only ever comes from a one-time code (never from this screen alone):
 *  - "Show your code": the customer shows a 6 digit code that changes every
 *    minute and staff enter it in Stamp mode (Mode A), or
 *  - "Enter the counter code": the customer types the code shown on the
 *    counter screen (Mode B).
 * A full card lets the customer choose ONE reward from the owner's active
 * offers; the reward then shows a code that staff confirm once.
 *
 * MOCK ONLY (Stage 1): state lives in localStorage via `lib/mock/loyalty-store`
 * and the emailed code is shown on screen. Stage 4 replaces both with server
 * calls; this component keeps the same screens.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { BrandTheme } from "@/lib/brand/theme";
import {
  availableOffers,
  cardProgress,
  claimReward,
  claimView,
  ensureMember,
  issueMemberCode,
  markEmailVerified,
  normalizeEmail,
  stampWithCounterCode,
  type ClaimView,
  type LoyaltyState,
  type RewardClaim,
} from "@/lib/loyalty/rules";
import {
  mockCheckEmailCode,
  mockSendEmailCode,
  setSessionMemberId,
  tryLoyalty,
} from "@/lib/mock/loyalty-store";
import { useLoyaltySession, useLoyaltyState, useNow } from "@/lib/use-loyalty";
import { EMAIL_FORMAT_MESSAGE, MAX_EMAIL_LENGTH, isValidEmail } from "@/lib/validation";
import { BackButton } from "./back-button";
import { CheckIcon, GiftIcon } from "./icons";

const PRIMARY_BUTTON =
  "inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-sm rounded-control border border-black/15 bg-white px-lg text-[15px] font-medium text-ink transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const TEXT_BUTTON =
  "inline-flex min-h-[44px] items-center justify-center px-md text-[13px] text-ink-muted underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const INPUT =
  "block min-h-[52px] w-full rounded-control border border-black/15 bg-white px-md text-[16px] text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

type View = "card" | "stamp" | "choose" | "rewards";

type LoyaltyScreenProps = {
  businessName: string;
  theme: BrandTheme;
  onBack: () => void;
};

export function LoyaltyScreen({ businessName, theme, onBack }: LoyaltyScreenProps) {
  const state = useLoyaltyState();
  const [memberId, sessionReady] = useLoyaltySession();
  const now = useNow(1000);
  const [view, setView] = useState<View>("card");
  const [notice, setNotice] = useState<string | null>(null);

  const member = useMemo(
    () => state?.members.find((m) => m.id === memberId && !m.deleted_at) ?? null,
    [state, memberId],
  );

  // A card that no longer exists (deleted by the owner) signs this device out.
  useEffect(() => {
    if (state && sessionReady && memberId && !member) setSessionMemberId(null);
  }, [state, sessionReady, memberId, member]);

  const back = (
    <BackButton
      label="Loyalty card"
      onBack={onBack}
      color={theme.primary}
      onPrimary={theme.onPrimary}
    />
  );

  if (!state || !sessionReady || !now) {
    return (
      <div>
        {back}
        <div className="mt-2xl h-[260px] animate-pulse rounded-card bg-black/5" />
      </div>
    );
  }

  if (!state.program.enabled) {
    return (
      <div>
        {back}
        <div className="mt-2xl rounded-card border border-black/10 bg-white p-xl text-center">
          <p className="text-[17px] font-medium">Loyalty is paused right now</p>
          <p className="mt-sm text-[15px] text-ink-muted">
            Your stamps and rewards are safe. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div>
        {back}
        <JoinFlow businessName={businessName} state={state} theme={theme} />
      </div>
    );
  }

  return (
    <div>
      {back}
      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-lg rounded-control bg-white px-md py-sm text-center text-[14px] text-ink shadow-soft"
        >
          {notice}
        </p>
      ) : null}
      {view === "card" ? (
        <CardView
          state={state}
          memberId={member.id}
          email={member.email ?? ""}
          now={now}
          onStamp={() => {
            setNotice(null);
            setView("stamp");
          }}
          onChoose={() => setView("choose")}
          onRewards={() => setView("rewards")}
        />
      ) : view === "stamp" ? (
        <StampView
          state={state}
          memberId={member.id}
          now={now}
          onDone={(message) => {
            setNotice(message);
            setView("card");
          }}
          onCancel={() => setView("card")}
        />
      ) : view === "choose" ? (
        <ChooseView
          state={state}
          memberId={member.id}
          now={now}
          onDone={() => {
            setNotice("Reward claimed. Show it to staff when you want to use it.");
            setView("rewards");
          }}
          onCancel={() => setView("card")}
        />
      ) : (
        <RewardsView
          state={state}
          memberId={member.id}
          now={now}
          onCard={() => setView("card")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Join: email -> code
// ---------------------------------------------------------------------------

function JoinFlow({
  businessName,
  state,
  theme,
}: {
  businessName: string;
  state: LoyaltyState;
  theme: BrandTheme;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const offers = state.offers.filter((o) => o.active);

  function sendCode() {
    const value = normalizeEmail(email);
    if (!isValidEmail(value)) {
      setError(EMAIL_FORMAT_MESSAGE);
      return;
    }
    setError(null);
    // The real server checks a Turnstile token and rate limits before emailing.
    setDemoCode(mockSendEmailCode(value));
    setCode("");
    setStep("code");
  }

  function confirm() {
    const value = normalizeEmail(email);
    const checked = mockCheckEmailCode(value, code);
    if (!checked.ok) {
      setError(checked.message);
      return;
    }
    const res = tryLoyalty((s) => {
      const ensured = ensureMember(s, value, new Date());
      return markEmailVerified(ensured.state, ensured.member.id, new Date());
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSessionMemberId(res.member.id);
  }

  return (
    <div className="mt-2xl">
      <div className="text-center">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
        >
          <GiftIcon size={28} />
        </span>
        <h2 className="mt-md font-display text-[22px] font-medium leading-tight">
          Collect {state.program.stamps_required} stamps, get a reward
        </h2>
        <p className="mt-sm text-[15px] text-ink-muted">
          Get a stamp each time you visit {businessName}. Complete the card and
          choose your reward.
        </p>
      </div>

      {offers.length > 0 ? (
        <ul className="mt-lg flex flex-wrap justify-center gap-sm" aria-label="Rewards you can win">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="rounded-pill border border-black/10 bg-white px-md py-sm text-[13px] font-medium"
            >
              {offer.title}
            </li>
          ))}
        </ul>
      ) : null}

      {step === "email" ? (
        <form
          className="mt-2xl grid gap-md"
          onSubmit={(event) => {
            event.preventDefault();
            sendCode();
          }}
          noValidate
        >
          <label htmlFor="loyalty-email" className="text-[15px] font-medium">
            Your email
          </label>
          <input
            id="loyalty-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={MAX_EMAIL_LENGTH}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={INPUT}
            aria-describedby={error ? "loyalty-error" : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p id="loyalty-error" role="alert" className="text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
          <button type="submit" className={PRIMARY_BUTTON}>
            Send my code
          </button>
          <p className="text-center text-[13px] text-ink-muted">
            We use your email only for this loyalty card. We send one code to
            confirm it is you.
          </p>
        </form>
      ) : (
        <form
          className="mt-2xl grid gap-md"
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
          noValidate
        >
          <label htmlFor="loyalty-otp" className="text-[15px] font-medium">
            Enter the 6 digit code we sent to {normalizeEmail(email)}
          </label>
          <input
            id="loyalty-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className={`${INPUT} text-center text-[24px] tracking-[0.3em]`}
            aria-describedby={error ? "loyalty-error" : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p id="loyalty-error" role="alert" className="text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
          <button type="submit" className={PRIMARY_BUTTON} disabled={code.length !== 6}>
            Open my card
          </button>
          <div className="flex justify-center gap-md">
            <button type="button" className={TEXT_BUTTON} onClick={sendCode}>
              Send a new code
            </button>
            <button
              type="button"
              className={TEXT_BUTTON}
              onClick={() => {
                setStep("email");
                setError(null);
              }}
            >
              Change email
            </button>
          </div>
          {demoCode ? (
            <p className="rounded-control border border-dashed border-black/20 bg-white px-md py-sm text-center text-[13px] text-ink-muted">
              Demo mode: no email is sent. Your code is{" "}
              <span className="font-medium tabular-nums text-ink">{demoCode}</span>.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

function StampGrid({ required, filled }: { required: number; filled: number }) {
  return (
    <ol
      className="grid grid-cols-5 gap-md"
      aria-label={`${filled} of ${required} stamps collected`}
    >
      {Array.from({ length: required }, (_, index) => {
        const done = index < filled;
        const last = index === required - 1;
        return (
          <li
            key={index}
            className="relative flex aspect-square items-center justify-center rounded-full"
            aria-label={
              done ? `Stamp ${index + 1} collected` : `Stamp ${index + 1} not collected`
            }
          >
            {done ? (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--cp-on-primary)] text-[var(--cp-primary)]">
                <CheckIcon size={22} />
              </span>
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-current opacity-50">
                {last ? (
                  <GiftIcon size={20} />
                ) : (
                  <span className="text-[14px] tabular-nums">{index + 1}</span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CardView({
  state,
  memberId,
  email,
  now,
  onStamp,
  onChoose,
  onRewards,
}: {
  state: LoyaltyState;
  memberId: string;
  email: string;
  now: Date;
  onStamp: () => void;
  onChoose: () => void;
  onRewards: () => void;
}) {
  const progress = cardProgress(state, memberId);
  const left = progress.required - progress.current;
  const myClaims = state.claims.filter((c) => c.member_id === memberId);
  const ready = myClaims.filter((c) => claimView(c, now) === "earned").length;
  const offers = state.offers.filter((o) => o.active);

  return (
    <div className="mt-2xl">
      <p className="truncate text-[13px] text-ink-muted">{email}</p>

      <section
        className="mt-sm rounded-card p-xl"
        style={{ backgroundColor: "var(--cp-primary)", color: "var(--cp-on-primary)" }}
        aria-label="Stamp card"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[19px] font-medium">Stamp card</h2>
          <p className="text-[15px] tabular-nums">
            {progress.current} of {progress.required}
          </p>
        </div>
        <div className="mt-lg">
          <StampGrid required={progress.required} filled={progress.current} />
        </div>
        <p className="mt-lg text-[14px]" role="status" aria-live="polite">
          {progress.pending > 0
            ? "Card complete. Choose your reward."
            : left === 1
              ? "1 more stamp to your reward."
              : `${left} more stamps to your reward.`}
        </p>
      </section>

      <div className="mt-lg grid gap-md">
        {progress.pending > 0 ? (
          <button type="button" className={PRIMARY_BUTTON} onClick={onChoose}>
            <GiftIcon size={22} />
            Choose your reward
          </button>
        ) : null}
        <button
          type="button"
          className={progress.pending > 0 ? SECONDARY_BUTTON : PRIMARY_BUTTON}
          onClick={onStamp}
        >
          Get a stamp
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={onRewards}>
          My rewards{ready > 0 ? ` (${ready} ready)` : ""}
        </button>
      </div>

      {offers.length > 0 ? (
        <section className="mt-2xl" aria-label="Rewards you can win">
          <h3 className="text-[13px] text-ink-muted">Rewards you can win</h3>
          <ul className="mt-sm flex flex-wrap gap-sm">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="rounded-pill border border-black/10 bg-white px-md py-sm text-[13px] font-medium"
              >
                {offer.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-xl flex justify-center">
        <button
          type="button"
          className={TEXT_BUTTON}
          onClick={() => setSessionMemberId(null)}
        >
          Not you? Use another email
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Get a stamp
// ---------------------------------------------------------------------------

function StampView({
  state,
  memberId,
  now,
  onDone,
  onCancel,
}: {
  state: LoyaltyState;
  memberId: string;
  now: Date;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const mode = state.program.stamp_mode;
  const showCode = mode === "member_code" || mode === "both";
  const enterCode = mode === "counter_code" || mode === "both";

  const live = state.tokens.find(
    (t) =>
      t.kind === "member" &&
      t.member_id === memberId &&
      !t.used_at &&
      new Date(t.expires_at).getTime() > now.getTime(),
  );

  // Keep one live code on screen; a fresh one replaces an expired one.
  const needsCode = showCode && !live;
  useEffect(() => {
    if (needsCode) tryLoyalty((s) => issueMemberCode(s, memberId, new Date()));
  }, [needsCode, memberId]);

  // Staff give the stamp from their screen: when the total grows, go back.
  const total = cardProgress(state, memberId).total;
  const startTotal = useRef(total);
  useEffect(() => {
    if (total > startTotal.current) {
      const progress = cardProgress(state, memberId);
      onDone(
        progress.pending > 0
          ? "Stamp added. Your card is complete!"
          : "Stamp added. Thank you!",
      );
    }
  }, [total, state, memberId, onDone]);

  const secondsLeft = live
    ? Math.max(0, Math.ceil((new Date(live.expires_at).getTime() - now.getTime()) / 1000))
    : 0;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitCounterCode() {
    const res = tryLoyalty((s) => stampWithCounterCode(s, { code, memberId }, new Date()));
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onDone(res.completed ? "Stamp added. Your card is complete!" : "Stamp added. Thank you!");
  }

  return (
    <div className="mt-2xl grid gap-xl">
      {showCode ? (
        <section className="rounded-card border border-black/10 bg-white p-xl text-center">
          <h2 className="text-[17px] font-medium">Show this code to staff</h2>
          <p className="mt-xs text-[13px] text-ink-muted">
            Show it after you pay. Staff type it in to give you a stamp.
          </p>
          <p
            className="mt-lg font-display text-[44px] font-medium leading-none tracking-[0.12em] tabular-nums"
            aria-label={live ? `Your code is ${live.code.split("").join(" ")}` : "Getting your code"}
          >
            {live ? `${live.code.slice(0, 3)} ${live.code.slice(3)}` : "--- ---"}
          </p>
          <div
            className="mx-auto mt-lg h-1 w-40 overflow-hidden rounded-full bg-black/10"
            role="presentation"
          >
            <div
              className="h-full bg-[var(--cp-primary)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / 60) * 100}%` }}
            />
          </div>
          <p className="mt-sm text-[13px] tabular-nums text-ink-muted">
            New code in {secondsLeft}s
          </p>
        </section>
      ) : null}

      {enterCode ? (
        <form
          className="rounded-card border border-black/10 bg-white p-xl"
          onSubmit={(event) => {
            event.preventDefault();
            submitCounterCode();
          }}
          noValidate
        >
          <h2 className="text-[17px] font-medium">Or enter the counter code</h2>
          <p className="mt-xs text-[13px] text-ink-muted">
            Ask staff to show the code on their screen.
          </p>
          <label htmlFor="counter-code" className="sr-only">
            Counter code
          </label>
          <input
            id="counter-code"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            className={`${INPUT} mt-md text-center text-[24px] tracking-[0.3em]`}
            aria-describedby={error ? "counter-error" : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p id="counter-error" role="alert" className="mt-sm text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className={`${PRIMARY_BUTTON} mt-md`}
            disabled={code.length !== 6}
          >
            Add my stamp
          </button>
        </form>
      ) : null}

      <button type="button" className={SECONDARY_BUTTON} onClick={onCancel}>
        Back to my card
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Choose a reward
// ---------------------------------------------------------------------------

function ChooseView({
  state,
  memberId,
  now,
  onDone,
  onCancel,
}: {
  state: LoyaltyState;
  memberId: string;
  now: Date;
  onDone: () => void;
  onCancel: () => void;
}) {
  const progress = cardProgress(state, memberId);
  const offers = availableOffers(state, now);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = offers.find((o) => o.id === picked) ?? null;

  if (progress.pending < 1) {
    return (
      <div className="mt-2xl rounded-card border border-black/10 bg-white p-xl text-center">
        <p className="text-[17px] font-medium">No reward to choose yet</p>
        <p className="mt-sm text-[15px] text-ink-muted">
          Complete your stamp card to unlock a reward.
        </p>
        <button type="button" className={`${SECONDARY_BUTTON} mt-lg`} onClick={onCancel}>
          Back to my card
        </button>
      </div>
    );
  }

  function claim() {
    if (!picked) return;
    const res = tryLoyalty((s) => claimReward(s, { memberId, offerId: picked }, new Date()));
    if (!res.ok) {
      setError(res.message);
      setPicked(null);
      return;
    }
    onDone();
  }

  return (
    <div className="mt-2xl">
      <h2 className="font-display text-[22px] font-medium leading-tight">
        Card complete. Choose your reward.
      </h2>
      {offers.length === 0 ? (
        <p className="mt-lg rounded-card border border-black/10 bg-white p-xl text-[15px] text-ink-muted">
          No rewards are available right now. Your full card is saved, so please
          try again soon.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Reward options" className="mt-lg grid gap-md">
          {offers.map((offer) => {
            const on = offer.id === picked;
            return (
              <button
                key={offer.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setPicked(offer.id);
                  setError(null);
                }}
                className={`flex min-h-[64px] w-full items-center gap-md rounded-card border-2 bg-white p-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  on ? "border-[var(--cp-primary)]" : "border-black/10 hover:bg-black/[0.02]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    on
                      ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-[var(--cp-on-primary)]"
                      : "border-black/30"
                  }`}
                  aria-hidden="true"
                >
                  {on ? <CheckIcon size={14} /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[16px] font-medium">{offer.title}</span>
                  {offer.description ? (
                    <span className="text-[13px] text-ink-muted">{offer.description}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-md text-[13px] text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={`${PRIMARY_BUTTON} mt-xl`}
        disabled={!selected}
        onClick={claim}
      >
        {selected ? `Claim ${selected.title}` : "Choose a reward"}
      </button>
      <p className="mt-md text-center text-[13px] text-ink-muted">
        Your choice is final. The reward is valid for {state.program.reward_valid_days} days
        after you claim it.
      </p>
      <div className="mt-sm flex justify-center">
        <button type="button" className={TEXT_BUTTON} onClick={onCancel}>
          Not now
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My rewards
// ---------------------------------------------------------------------------

const VIEW_LABEL: Record<ClaimView, string> = {
  earned: "Ready to use",
  redeemed: "Used",
  expired: "Expired",
  cancelled: "Cancelled",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function RewardCard({ claim, now }: { claim: RewardClaim; now: Date }) {
  const view = claimView(claim, now);
  const live = view === "earned";
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(claim.expires_at).getTime() - now.getTime()) / 86_400_000),
  );
  return (
    <li
      className={`rounded-card border bg-white p-xl ${
        live ? "border-[var(--cp-primary)] border-2" : "border-black/10 opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="text-[17px] font-medium">{claim.title}</p>
          {claim.description ? (
            <p className="text-[13px] text-ink-muted">{claim.description}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-pill px-md py-xs text-[12px] font-medium ${
            live ? "bg-[var(--cp-primary)] text-[var(--cp-on-primary)]" : "bg-black/5 text-ink-muted"
          }`}
        >
          {VIEW_LABEL[view]}
        </span>
      </div>
      {live ? (
        <div className="mt-lg text-center">
          <p className="text-[13px] text-ink-muted">Show this code to staff</p>
          <p className="mt-xs font-display text-[30px] font-medium tracking-[0.1em] tabular-nums">
            {claim.code}
          </p>
          <p className="mt-sm text-[13px] text-ink-muted">
            Valid until {formatDate(claim.expires_at)} ({daysLeft}{" "}
            {daysLeft === 1 ? "day" : "days"} left). It works once.
          </p>
        </div>
      ) : (
        <p className="mt-md text-[13px] text-ink-muted">
          {view === "redeemed" && claim.redeemed_at
            ? `Used on ${formatDate(claim.redeemed_at)}.`
            : view === "expired"
              ? `Expired on ${formatDate(claim.expires_at)}.`
              : "This reward was cancelled by the business."}
        </p>
      )}
    </li>
  );
}

function RewardsView({
  state,
  memberId,
  now,
  onCard,
}: {
  state: LoyaltyState;
  memberId: string;
  now: Date;
  onCard: () => void;
}) {
  const claims = state.claims
    .filter((c) => c.member_id === memberId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return (
    <div className="mt-2xl">
      <h2 className="font-display text-[22px] font-medium leading-tight">My rewards</h2>
      {claims.length === 0 ? (
        <p className="mt-lg rounded-card border border-black/10 bg-white p-xl text-center text-[15px] text-ink-muted">
          No rewards yet. Complete your stamp card to earn one.
        </p>
      ) : (
        <ul className="mt-lg grid gap-md" aria-live="polite">
          {claims.map((claim) => (
            <RewardCard key={claim.id} claim={claim} now={now} />
          ))}
        </ul>
      )}
      <button type="button" className={`${SECONDARY_BUTTON} mt-xl`} onClick={onCard}>
        Back to my card
      </button>
    </div>
  );
}

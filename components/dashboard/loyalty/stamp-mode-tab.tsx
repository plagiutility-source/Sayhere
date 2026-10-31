"use client";

/**
 * Stamp mode: where staff give stamps and confirm rewards.
 *
 * Locked by a staff PIN so every stamp and every redemption carries a name.
 * Three jobs:
 *  1. Give a stamp from the code the customer shows (Mode A).
 *  2. Show the counter code the customer types themselves (Mode B).
 *  3. Redeem a reward code (look it up first, then confirm).
 * Locks again by itself after 5 minutes without use.
 *
 * Stage 3 moves this to its own `/stamp` page with a staff session, so staff
 * never need the owner's login on the counter device.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { identifyStaff } from "@/lib/loyalty/pin";
import {
  claimView,
  issueCounterCode,
  normalizeCode,
  redeemReward,
  stampWithMemberCode,
  type LoyaltyState,
  type RewardClaim,
  type StaffMember,
} from "@/lib/loyalty/rules";
import type { DemoScenario } from "@/lib/mock/demo";
import {
  DEMO_STAFF_PIN,
  getLoyaltyState,
  setLoyaltyState,
  tryLoyalty,
} from "@/lib/mock/loyalty-store";
import { useNow } from "@/lib/use-loyalty";
import { Field, Notice, Panel, btnPrimary, btnSecondary, formatDay, inputCls } from "./ui";

const IDLE_LOCK_MS = 5 * 60_000;

type Message = { kind: "success" | "error" | "info"; text: string } | null;

export function StampModeTab({ state, demo }: { state: LoyaltyState; demo: DemoScenario }) {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [lastUsed, setLastUsed] = useState(0);
  const now = useNow(1000);

  const staff = state.staff.find((s) => s.id === staffId && s.active) ?? null;

  // Lock by itself after a quiet spell, and if the staff member is switched off.
  useEffect(() => {
    if (!staffId || !now) return;
    if (!staff || now.getTime() - lastUsed > IDLE_LOCK_MS) setStaffId(null);
  }, [staffId, staff, now, lastUsed]);

  if (!state.program.enabled) {
    return (
      <Panel title="Stamp mode">
        <Notice kind="info">
          The loyalty program is paused. Turn it on in Settings to give stamps.
        </Notice>
      </Panel>
    );
  }

  if (state.staff.filter((s) => s.active).length === 0) {
    return (
      <Panel title="Stamp mode" description="Add a staff PIN first.">
        <Link
          href={`/loyalty?demo=${demo}&tab=staff`}
          className="text-[13px] font-medium text-brand-blue hover:underline"
        >
          Go to Staff
        </Link>
      </Panel>
    );
  }

  if (!staff || !now) {
    return (
      <UnlockPanel
        onUnlock={(member) => {
          setStaffId(member.id);
          setLastUsed(Date.now());
        }}
      />
    );
  }

  return (
    <Worker
      state={state}
      staff={staff}
      now={now}
      touch={() => setLastUsed(Date.now())}
      onLock={() => setStaffId(null)}
    />
  );
}

function UnlockPanel({ onUnlock }: { onUnlock: (staff: StaffMember) => void }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    const result = await identifyStaff(getLoyaltyState(), pin, new Date());
    setLoyaltyState(result.state);
    setBusy(false);
    setPin("");
    if (result.ok) {
      setMessage(null);
      onUnlock(result.staff);
    } else {
      setMessage({ kind: "error", text: result.message });
    }
  }

  return (
    <Panel
      title="Stamp mode"
      description="Enter your staff PIN. Your name is saved with every stamp you give."
    >
      <form
        className="grid max-w-[320px] gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void unlock();
        }}
      >
        <Field label="Staff PIN" htmlFor="stamp-pin">
          <input
            id="stamp-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            className={inputCls}
          />
        </Field>
        {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
        <button type="submit" className={btnPrimary} disabled={busy || pin.length < 4}>
          Unlock
        </button>
        <p className="text-[12px] text-ink-muted">
          Demo mode: the first staff member is called Counter and uses PIN{" "}
          {DEMO_STAFF_PIN}.
        </p>
      </form>
    </Panel>
  );
}

function Worker({
  state,
  staff,
  now,
  touch,
  onLock,
}: {
  state: LoyaltyState;
  staff: StaffMember;
  now: Date;
  touch: () => void;
  onLock: () => void;
}) {
  const [message, setMessage] = useState<Message>(null);
  const mode = state.program.stamp_mode;
  const showCounter = mode === "counter_code" || mode === "both";
  const acceptMember = mode === "member_code" || mode === "both";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-black/10 bg-white px-5 py-3 shadow-soft">
        <p className="text-[13px] text-ink">
          Signed in as <span className="font-medium">{staff.name}</span>
          <span className="text-ink-muted"> · locks after 5 quiet minutes</span>
        </p>
        <button type="button" className={btnSecondary} onClick={onLock}>
          Lock
        </button>
      </div>

      <div role="status" aria-live="polite">
        {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {acceptMember ? (
          <GiveStamp staff={staff} touch={touch} onMessage={setMessage} />
        ) : (
          <Panel title="Give a stamp">
            <Notice kind="info">
              Customer codes are turned off. Customers use the counter code instead.
            </Notice>
          </Panel>
        )}
        {showCounter ? (
          <CounterCode state={state} now={now} />
        ) : (
          <Panel title="Counter code">
            <Notice kind="info">
              Counter codes are turned off. Customers show you their own code.
            </Notice>
          </Panel>
        )}
      </div>

      <RedeemReward state={state} staff={staff} now={now} touch={touch} onMessage={setMessage} />
    </div>
  );
}

function GiveStamp({
  staff,
  touch,
  onMessage,
}: {
  staff: StaffMember;
  touch: () => void;
  onMessage: (message: Message) => void;
}) {
  const [code, setCode] = useState("");

  function give() {
    touch();
    const res = tryLoyalty((s) => stampWithMemberCode(s, { code, staffId: staff.id }, new Date()));
    if (!res.ok) {
      onMessage({ kind: "error", text: res.message });
      return;
    }
    const left = res.progress.required - res.progress.current;
    onMessage({
      kind: "success",
      text: res.completed
        ? `Stamp given to ${res.member.email}. Their card is complete, so they can choose a reward.`
        : `Stamp given to ${res.member.email}: ${res.progress.current} of ${res.progress.required}, ${left} to go.`,
    });
    setCode("");
  }

  return (
    <Panel
      title="Give a stamp"
      description="Ask the customer to open Get a stamp and read you their code."
    >
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          give();
        }}
      >
        <Field label="Customer's code" htmlFor="member-code" hint="6 digits. It changes every minute and works once.">
          <input
            id="member-code"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className={`${inputCls} tabular-nums tracking-[0.2em]`}
          />
        </Field>
        <button type="submit" className={`${btnPrimary} justify-self-start`} disabled={code.length !== 6}>
          Give stamp
        </button>
      </form>
    </Panel>
  );
}

function CounterCode({ state, now }: { state: LoyaltyState; now: Date }) {
  const live = state.tokens.find(
    (t) => t.kind === "counter" && !t.used_at && new Date(t.expires_at).getTime() > now.getTime(),
  );
  // Keep one live code showing; a used or expired one is replaced at once.
  useEffect(() => {
    if (!live) tryLoyalty((s) => issueCounterCode(s, new Date()));
  }, [live]);

  const secondsLeft = live
    ? Math.max(0, Math.ceil((new Date(live.expires_at).getTime() - now.getTime()) / 1000))
    : 0;

  return (
    <Panel
      title="Counter code"
      description="Customers type this on their phone. It works for one customer, then changes."
    >
      <p
        className="text-center text-[44px] font-medium leading-none tracking-[0.15em] tabular-nums text-ink"
        aria-label={live ? `Counter code ${live.code.split("").join(" ")}` : "Getting a code"}
      >
        {live ? `${live.code.slice(0, 3)} ${live.code.slice(3)}` : "--- ---"}
      </p>
      <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-black/10" role="presentation">
        <div
          className="h-full bg-brand-blue transition-[width] duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / 60) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-center text-[12px] tabular-nums text-ink-muted">
        Changes in {secondsLeft}s
      </p>
    </Panel>
  );
}

function RedeemReward({
  state,
  staff,
  now,
  touch,
  onMessage,
}: {
  state: LoyaltyState;
  staff: StaffMember;
  now: Date;
  touch: () => void;
  onMessage: (message: Message) => void;
}) {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<RewardClaim | null>(null);
  const lookedUp = useRef("");

  function lookUp() {
    touch();
    const key = normalizeCode(code);
    const claim = state.claims.find((c) => normalizeCode(c.code) === key);
    if (!key || !claim) {
      setFound(null);
      onMessage({ kind: "error", text: "No reward matches that code." });
      return;
    }
    lookedUp.current = claim.id;
    setFound(claim);
    onMessage(null);
  }

  // Always show the latest version of the reward that was looked up.
  const current = found ? (state.claims.find((c) => c.id === found.id) ?? found) : null;
  const view = current ? claimView(current, now) : null;
  const member = current ? state.members.find((m) => m.id === current.member_id) : null;

  function confirm() {
    if (!current) return;
    touch();
    const res = tryLoyalty((s) => redeemReward(s, { code: current.code, staffId: staff.id }, new Date()));
    if (!res.ok) {
      onMessage({ kind: "error", text: res.message });
      return;
    }
    onMessage({ kind: "success", text: `“${res.claim.title}” confirmed. Hand it over.` });
    setFound(null);
    setCode("");
  }

  return (
    <Panel
      title="Redeem a reward"
      description="Ask the customer to open My rewards and read you the reward code."
    >
      <form
        className="flex max-w-[420px] flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          lookUp();
        }}
      >
        <div className="min-w-[180px] flex-1">
          <Field label="Reward code" htmlFor="reward-code">
            <input
              id="reward-code"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={9}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              className={`${inputCls} tracking-[0.1em]`}
            />
          </Field>
        </div>
        <button type="submit" className={btnSecondary} disabled={code.trim().length < 8}>
          Look up
        </button>
      </form>

      {current && view ? (
        <div className="mt-4 rounded-card border border-black/10 bg-surface-muted p-4">
          <p className="text-[15px] font-medium text-ink">{current.title}</p>
          {current.description ? (
            <p className="text-[13px] text-ink-muted">{current.description}</p>
          ) : null}
          <p className="mt-2 text-[13px] text-ink-muted">
            For {member?.email ?? "a deleted member"} · valid until {formatDay(current.expires_at)}
          </p>
          {view === "earned" ? (
            <button type="button" className={`${btnPrimary} mt-3`} onClick={confirm}>
              Confirm and use reward
            </button>
          ) : (
            <div className="mt-3">
              <Notice kind="error">
                {view === "redeemed"
                  ? "This reward was already used."
                  : view === "expired"
                    ? "This reward has expired."
                    : "This reward was cancelled."}
              </Notice>
            </div>
          )}
        </div>
      ) : null}
    </Panel>
  );
}

"use client";

/**
 * Program settings: on/off, stamps per card, the rules that stop abuse (gap
 * between stamps, daily cap), how long a chosen reward stays valid, and which
 * ways of getting a stamp are allowed. Every number is clamped to its range
 * (`LOYALTY_LIMITS`) by the same rules the server will use.
 */

import { useEffect, useState } from "react";
import {
  LOYALTY_LIMITS,
  cardProgress,
  normalizeProgram,
  setProgram,
  type LoyaltyProgram,
  type LoyaltyState,
  type StampMode,
} from "@/lib/loyalty/rules";
import { resetLoyaltyDemo, tryLoyalty } from "@/lib/mock/loyalty-store";
import { Field, Notice, Panel, btnDanger, btnPrimary, inputCls } from "./ui";

type Draft = {
  enabled: boolean;
  stamps: string;
  gap: string;
  cap: string;
  days: string;
  mode: StampMode;
};

function toDraft(p: LoyaltyProgram): Draft {
  return {
    enabled: p.enabled,
    stamps: String(p.stamps_required),
    gap: String(p.min_gap_hours),
    cap: String(p.daily_cap),
    days: String(p.reward_valid_days),
    mode: p.stamp_mode,
  };
}

const MODES: { id: StampMode; title: string; text: string }[] = [
  {
    id: "both",
    title: "Both ways (recommended)",
    text: "Staff enter the customer's code, or the customer enters the counter code.",
  },
  {
    id: "member_code",
    title: "Staff enter the customer's code",
    text: "The strongest check. A staff member sees every stamp happen.",
  },
  {
    id: "counter_code",
    title: "Customer enters the counter code",
    text: "Faster at a busy counter. The code changes after every use.",
  },
];

export function SettingsTab({ state }: { state: LoyaltyState }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(state.program));
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Pick up the saved values once they arrive from another tab.
  // Keyed by value, so an unrelated update elsewhere does not wipe unsaved edits.
  const programKey = JSON.stringify(state.program);
  useEffect(() => {
    setDraft(toDraft(JSON.parse(programKey) as LoyaltyProgram));
  }, [programKey]);

  const L = LOYALTY_LIMITS;

  function save() {
    const next = normalizeProgram({
      enabled: draft.enabled,
      stamps_required: Number(draft.stamps),
      min_gap_hours: Number(draft.gap),
      daily_cap: Number(draft.cap),
      reward_valid_days: Number(draft.days),
      stamp_mode: draft.mode,
    });
    const res = tryLoyalty((s) => {
      // A full card waiting for a reward must not be taken away by a new size.
      if (
        next.stamps_required !== s.program.stamps_required &&
        s.members.some((m) => cardProgress(s, m.id).pending > 0)
      ) {
        return {
          ok: false as const,
          message:
            "Some customers have a full card waiting for a reward. Let them choose first, then change the number of stamps.",
        };
      }
      return { ok: true as const, state: setProgram(s, next) };
    });
    setMessage(
      res.ok
        ? { kind: "success", text: "Settings saved." }
        : { kind: "error", text: "message" in res ? res.message : "Could not save." },
    );
  }

  return (
    <div className="grid gap-5">
      <Panel title="Program" description="These rules apply to every stamp from now on.">
        <form
          className="grid max-w-[520px] gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
            />
            Loyalty program is on (customers see the Loyalty card button)
          </label>

          <Field
            label="Stamps to complete a card"
            htmlFor="s-stamps"
            hint={`${L.stampsMin} to ${L.stampsMax}. Can only change while no customer has a full card waiting.`}
          >
            <input
              id="s-stamps"
              inputMode="numeric"
              value={draft.stamps}
              onChange={(event) => setDraft({ ...draft, stamps: event.target.value.replace(/\D/g, "") })}
              className={inputCls}
            />
          </Field>

          <Field
            label="Hours between two stamps for one customer"
            htmlFor="s-gap"
            hint={`${L.gapHoursMin} to ${L.gapHoursMax}. For example 4 stops two stamps from one lunch visit. Use 0 only for testing.`}
          >
            <input
              id="s-gap"
              inputMode="numeric"
              value={draft.gap}
              onChange={(event) => setDraft({ ...draft, gap: event.target.value.replace(/\D/g, "") })}
              className={inputCls}
            />
          </Field>

          <Field
            label="Most stamps per customer in 24 hours"
            htmlFor="s-cap"
            hint={`${L.dailyCapMin} to ${L.dailyCapMax}.`}
          >
            <input
              id="s-cap"
              inputMode="numeric"
              value={draft.cap}
              onChange={(event) => setDraft({ ...draft, cap: event.target.value.replace(/\D/g, "") })}
              className={inputCls}
            />
          </Field>

          <Field
            label="Days a chosen reward stays valid"
            htmlFor="s-days"
            hint={`${L.rewardDaysMin} to ${L.rewardDaysMax}. Unused rewards expire after this.`}
          >
            <input
              id="s-days"
              inputMode="numeric"
              value={draft.days}
              onChange={(event) => setDraft({ ...draft, days: event.target.value.replace(/\D/g, "") })}
              className={inputCls}
            />
          </Field>

          <fieldset>
            <legend className="text-[13px] font-medium text-ink">How customers get a stamp</legend>
            <div className="mt-2 grid gap-2">
              {MODES.map((mode) => (
                <label
                  key={mode.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-card border p-3 text-[13px] ${
                    draft.mode === mode.id ? "border-brand-blue bg-brand-blue/5" : "border-black/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="stamp-mode"
                    checked={draft.mode === mode.id}
                    onChange={() => setDraft({ ...draft, mode: mode.id })}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-ink">{mode.title}</span>
                    <span className="block text-ink-muted">{mode.text}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-muted">
              Your printed review QR is never used for stamps, so a photo of it can not earn one.
            </p>
          </fieldset>

          {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
          <button type="submit" className={`${btnPrimary} justify-self-start`}>
            Save settings
          </button>
        </form>
      </Panel>

      <Panel
        title="Demo data"
        description="Demo mode keeps everything in this browser. Resetting brings back the four example rewards and removes all members, stamps and staff."
      >
        <button
          type="button"
          className={btnDanger}
          onClick={() => {
            resetLoyaltyDemo();
            setMessage({ kind: "success", text: "Demo data reset." });
          }}
        >
          Reset demo data
        </button>
      </Panel>
    </div>
  );
}

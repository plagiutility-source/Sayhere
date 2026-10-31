"use client";

/**
 * Activity: every stamp and reward, newest first, built from the ledger so
 * nothing can be hidden. The owner can void a stamp or cancel an unused
 * reward; both stay in the list, marked, with the reason.
 */

import { useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import {
  activityLog,
  cancelClaim,
  voidStamp,
  type ActivityItem,
  type LoyaltyState,
} from "@/lib/loyalty/rules";
import { tryLoyalty } from "@/lib/mock/loyalty-store";
import { useNow } from "@/lib/use-loyalty";
import { Field, Notice, Panel, btnDanger, btnSecondary, formatWhen, inputCls } from "./ui";

const PAGE = 50;

type Action = { type: "void" | "cancel"; item: ActivityItem } | null;

export function ActivityTab({ state }: { state: LoyaltyState }) {
  const now = useNow(60_000) ?? new Date(0);
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  const items = activityLog(state, now);

  function confirm() {
    if (!action) return;
    const when = new Date();
    const res = tryLoyalty((s) =>
      action.type === "void" && action.item.stampId
        ? voidStamp(s, action.item.stampId, reason, when)
        : action.item.claimId
          ? cancelClaim(s, action.item.claimId, reason, when)
          : { ok: false as const, code: "invalid_input" as const, message: "Nothing to change." },
    );
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setAction(null);
    setReason("");
    setError(null);
  }

  return (
    <Panel
      title="Activity"
      description="Every stamp and reward. Nothing is ever deleted from this list."
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-muted">Nothing yet. Stamps and rewards show up here.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {items.slice(0, shown).map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] ${
                    item.kind === "stamp_voided" || item.kind === "reward_cancelled"
                      ? "text-ink-muted line-through"
                      : "text-ink"
                  }`}
                >
                  {item.text}
                </p>
                <p className="text-[12px] text-ink-muted">{formatWhen(item.at)}</p>
              </div>
              {item.kind === "stamp" ? (
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => {
                    setAction({ type: "void", item });
                    setReason("");
                    setError(null);
                  }}
                >
                  Void stamp
                </button>
              ) : null}
              {item.kind === "reward_chosen" && item.cancellable ? (
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => {
                    setAction({ type: "cancel", item });
                    setReason("");
                    setError(null);
                  }}
                >
                  Cancel reward
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {items.length > shown ? (
        <button type="button" className={`${btnSecondary} mt-4`} onClick={() => setShown(shown + PAGE)}>
          Show more
        </button>
      ) : null}

      <Modal
        open={action !== null}
        title={action?.type === "void" ? "Void this stamp?" : "Cancel this reward?"}
        onClose={() => setAction(null)}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setAction(null)}>
              Go back
            </button>
            <button type="button" className={btnDanger} onClick={confirm}>
              {action?.type === "void" ? "Void stamp" : "Cancel reward"}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-muted">
          {action?.type === "void"
            ? "The stamp stays in your history, marked as voided, and the customer's card goes down by one."
            : "The customer can no longer use this reward. Their stamps are not given back."}
        </p>
        <div className="mt-3">
          <Field label="Reason (optional)" htmlFor="activity-reason">
            <input
              id="activity-reason"
              maxLength={200}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        {error ? (
          <div className="mt-3">
            <Notice kind="error">{error}</Notice>
          </div>
        ) : null}
      </Modal>
    </Panel>
  );
}

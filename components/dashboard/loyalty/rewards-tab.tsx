"use client";

/**
 * Rewards: the 4 to 5 offers a customer chooses from when a card is full.
 * Max 5 active at once. Editing or deleting an offer never changes a reward a
 * customer already chose, because the chosen reward keeps its own copy.
 */

import { useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import {
  LOYALTY_LIMITS,
  deleteOffer,
  saveOffer,
  setOfferActive,
  type LoyaltyState,
  type OfferKind,
  type RewardOffer,
} from "@/lib/loyalty/rules";
import { tryLoyalty } from "@/lib/mock/loyalty-store";
import { Field, Notice, Panel, btnDanger, btnPrimary, btnSecondary, inputCls } from "./ui";

const KIND_LABEL: Record<OfferKind, string> = {
  free_item: "Free item",
  percent_off: "Percent off",
  amount_off: "Amount off",
  custom: "Other",
};

type Draft = {
  id?: string;
  title: string;
  description: string;
  kind: OfferKind;
  monthly: string;
  active: boolean;
};

const EMPTY: Draft = { title: "", description: "", kind: "free_item", monthly: "", active: true };

export function RewardsTab({ state }: { state: LoyaltyState }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<RewardOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = state.offers.filter((o) => o.active).length;
  const sorted = [...state.offers].sort((a, b) => a.sort_order - b.sort_order);

  function save() {
    if (!draft) return;
    const monthly = draft.monthly.trim() === "" ? null : Number(draft.monthly);
    const res = tryLoyalty((s) =>
      saveOffer(s, {
        id: draft.id,
        title: draft.title,
        description: draft.description,
        kind: draft.kind,
        monthly_limit: monthly !== null && Number.isNaN(monthly) ? 0 : monthly,
        active: draft.active,
      }),
    );
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDraft(null);
    setError(null);
    setMessage(draft.id ? "Reward saved." : "Reward added.");
  }

  function toggle(offer: RewardOffer) {
    const res = tryLoyalty((s) => setOfferActive(s, offer.id, !offer.active));
    setMessage(res.ok ? (offer.active ? "Reward paused." : "Reward is active.") : res.message);
  }

  return (
    <div className="grid gap-5">
      <Panel
        title="Rewards customers can choose"
        description={`When a customer completes the card they pick one active reward. ${activeCount} of ${LOYALTY_LIMITS.maxActiveOffers} active.`}
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setError(null);
              setMessage(null);
              setDraft({ ...EMPTY, active: activeCount < LOYALTY_LIMITS.maxActiveOffers });
            }}
          >
            Add reward
          </button>
        }
      >
        {message ? (
          <div className="mb-3">
            <Notice kind="info">{message}</Notice>
          </div>
        ) : null}
        {sorted.length === 0 ? (
          <p className="text-[13px] text-ink-muted">
            No rewards yet. Add one, for example “Free coffee”.
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {sorted.map((offer) => (
              <li key={offer.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink">
                    {offer.title}
                    <span
                      className={`ml-2 rounded-pill px-2 py-0.5 text-[11px] font-medium ${
                        offer.active
                          ? "bg-brand-green/10 text-brand-green-deep"
                          : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      {offer.active ? "Active" : "Paused"}
                    </span>
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {KIND_LABEL[offer.kind]}
                    {offer.description ? ` · ${offer.description}` : ""}
                    {offer.monthly_limit !== null
                      ? ` · max ${offer.monthly_limit} a month`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} onClick={() => toggle(offer)}>
                    {offer.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setError(null);
                      setMessage(null);
                      setDraft({
                        id: offer.id,
                        title: offer.title,
                        description: offer.description,
                        kind: offer.kind,
                        monthly: offer.monthly_limit === null ? "" : String(offer.monthly_limit),
                        active: offer.active,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => setRemoving(offer)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12px] text-ink-muted">
          Changing or deleting a reward never changes one a customer has already
          chosen. They keep the title and terms they picked.
        </p>
      </Panel>

      <Modal
        open={draft !== null}
        title={draft?.id ? "Edit reward" : "Add reward"}
        onClose={() => setDraft(null)}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={save}>
              Save reward
            </button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-3">
            <Field label="Title" htmlFor="offer-title">
              <input
                id="offer-title"
                maxLength={LOYALTY_LIMITS.titleMax}
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className={inputCls}
                placeholder="Free coffee"
              />
            </Field>
            <Field
              label="Terms (optional)"
              htmlFor="offer-description"
              hint="Shown to the customer, for example “Any regular hot coffee”."
            >
              <input
                id="offer-description"
                maxLength={LOYALTY_LIMITS.descriptionMax}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Type" htmlFor="offer-kind">
              <select
                id="offer-kind"
                value={draft.kind}
                onChange={(event) => setDraft({ ...draft, kind: event.target.value as OfferKind })}
                className={inputCls}
              >
                {(Object.keys(KIND_LABEL) as OfferKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Monthly limit (optional)"
              htmlFor="offer-monthly"
              hint="The most customers who can choose this reward each month. Leave empty for no limit."
            >
              <input
                id="offer-monthly"
                inputMode="numeric"
                value={draft.monthly}
                onChange={(event) =>
                  setDraft({ ...draft, monthly: event.target.value.replace(/\D/g, "") })
                }
                className={inputCls}
              />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Active (customers can choose it)
            </label>
            {error ? <Notice kind="error">{error}</Notice> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={removing !== null}
        title="Delete this reward?"
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setRemoving(null)}>
              Keep it
            </button>
            <button
              type="button"
              className={btnDanger}
              onClick={() => {
                if (removing) {
                  const id = removing.id;
                  tryLoyalty((current) => ({
                    ok: true as const,
                    state: deleteOffer(current, id),
                  }));
                  setMessage("Reward deleted.");
                }
                setRemoving(null);
              }}
            >
              Delete reward
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-muted">
          “{removing?.title}” will no longer be offered. Rewards customers have
          already chosen are not affected.
        </p>
      </Modal>
    </div>
  );
}

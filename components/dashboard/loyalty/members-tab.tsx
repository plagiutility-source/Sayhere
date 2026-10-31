"use client";

/**
 * Members: everyone who joined the loyalty card. Deleting a member removes
 * their email and signs out their device; their stamps and rewards stay in the
 * ledger without a name, so the owner's totals still add up.
 */

import { useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import {
  cardProgress,
  claimView,
  deleteMember,
  type LoyaltyMember,
  type LoyaltyState,
} from "@/lib/loyalty/rules";
import { tryLoyalty } from "@/lib/mock/loyalty-store";
import { useNow } from "@/lib/use-loyalty";
import { Panel, btnDanger, btnSecondary, formatDay } from "./ui";

export function MembersTab({ state }: { state: LoyaltyState }) {
  const now = useNow(60_000) ?? new Date(0);
  const [removing, setRemoving] = useState<LoyaltyMember | null>(null);
  const members = state.members
    .filter((m) => !m.deleted_at && m.email_verified_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Panel
      title="Members"
      description="Customers who joined with a confirmed email."
    >
      {members.length === 0 ? (
        <p className="text-[13px] text-ink-muted">
          No members yet. They appear here after a customer joins from your page.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-ink-muted">
              <tr>
                <th className="pb-2 font-normal">Email</th>
                <th className="pb-2 font-normal">Joined</th>
                <th className="pb-2 text-right font-normal">On card</th>
                <th className="pb-2 text-right font-normal">All stamps</th>
                <th className="pb-2 text-right font-normal">Rewards ready</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const progress = cardProgress(state, member.id);
                const ready = state.claims.filter(
                  (c) => c.member_id === member.id && claimView(c, now) === "earned",
                ).length;
                return (
                  <tr key={member.id} className="border-t border-black/5">
                    <td className="max-w-[220px] truncate py-2 pr-2">{member.email}</td>
                    <td className="py-2 pr-2">{formatDay(member.created_at)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {progress.current}/{progress.required}
                      {progress.pending > 0 ? " (full)" : ""}
                    </td>
                    <td className="py-2 text-right tabular-nums">{progress.total}</td>
                    <td className="py-2 text-right tabular-nums">{ready}</td>
                    <td className="py-2 pl-3 text-right">
                      <button type="button" className={btnDanger} onClick={() => setRemoving(member)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={removing !== null}
        title="Delete this member?"
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setRemoving(null)}>
              Keep member
            </button>
            <button
              type="button"
              className={btnDanger}
              onClick={() => {
                if (removing) {
                  const id = removing.id;
                  tryLoyalty((s) => ({ ok: true as const, state: deleteMember(s, id, new Date()) }));
                }
                setRemoving(null);
              }}
            >
              Delete member
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-muted">
          {removing?.email} will be removed and signed out. Their stamps and rewards stay in
          your history without a name. This can not be undone.
        </p>
      </Modal>
    </Panel>
  );
}

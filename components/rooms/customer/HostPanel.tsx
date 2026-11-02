"use client";

import { Icon } from "@/components/rooms/shared/icons";
import { formatTime, joinCountdownText } from "@/lib/rooms/format";
import { effectiveJoinStatus } from "@/lib/rooms/rules";
import type { JoinRequest, Order, Participant } from "@/lib/rooms/types";

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * The demo's `renderHostJoinPanel`: only the host phone sees it, above every
 * customer screen. New phones are approved here and the host reads the code.
 */
export function HostPanel({
  order,
  participant,
  guestUrl,
  requests,
  onApprove,
  onDeny,
  onRegenerate,
}: {
  order: Order;
  participant: Participant;
  guestUrl: string;
  requests: JoinRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const live = requests.filter((request) => {
    const status = effectiveJoinStatus(request);
    return (
      status === "pending" ||
      status === "approved" ||
      status === "locked" ||
      (request.status === "approved" && status === "expired")
    );
  });
  const pending = live.filter((request) => effectiveJoinStatus(request) === "pending");
  const codes = live.filter(
    (request) => request.status === "approved" || request.status === "locked",
  );
  const roster = order.participants || [];

  return (
    <section
      aria-label="Host join approvals"
      className="border-b border-black/10 bg-[var(--cp-bg)] px-3.5 pb-[11px] pt-[13px] text-slate-800"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[9px] font-medium text-[var(--cp-primary)]">
            <Icon name="lock" size={11} /> Host phone · {participant.name}
          </span>
          <p className="mt-1 text-[9.5px] leading-[1.4] text-ink-muted">
            Approve new phones, then read them the 6-digit code.
          </p>
        </div>
        <a
          href={guestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-[6px] border border-black/20 px-2 py-1.5 text-[9px] font-medium text-[var(--cp-primary)]"
        >
          Open guest view
        </a>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {roster.map((person) => (
          <span
            key={person.id}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[9px] text-slate-700"
          >
            <Icon name={person.role === "host" ? "lock" : "users"} size={10} />
            {person.name}
          </span>
        ))}
      </div>

      {pending.map((request) => (
        <div
          key={request.id}
          className="mt-[9px] grid grid-cols-[30px_minmax(0,1fr)] items-start gap-2 rounded-[9px] border border-brand-yellow/60 bg-amber-50 p-[9px]"
        >
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-amber-100 text-[9px] font-semibold text-amber-800">
            {initials(request.name)}
          </span>
          <div className="min-w-0">
            <strong className="block text-[10.5px] font-medium">
              {request.name} wants to join
            </strong>
            <span className="mt-px block text-[8.5px] text-ink-muted">
              New device · {formatTime(request.createdAt)}
            </span>
            <span
              className="mt-0.5 block text-center text-[9.5px] tabular-nums text-ink-muted"
              data-join-expires={request.expiresAt}
            >
              Request expires in {joinCountdownText(request.expiresAt)}
            </span>
          </div>
          <div className="col-start-2 mt-0.5 flex gap-1.5">
            <button
              type="button"
              className="rounded-[6px] bg-brand-green px-2 py-1 text-[9px] font-medium text-white"
              onClick={() => onApprove(request.id)}
            >
              Approve
            </button>
            <button
              type="button"
              className="rounded-[6px] border border-black/15 bg-white px-2 py-1 text-[9px] font-medium text-slate-600"
              onClick={() => onDeny(request.id)}
            >
              Deny
            </button>
          </div>
        </div>
      ))}

      {codes.map((request) => {
        const status = effectiveJoinStatus(request);
        const expired = status === "expired";
        const locked = request.status === "locked";
        const digits = String(request.joinCode || "------").split("");
        return (
          <div
            key={request.id}
            className={
              expired || locked
                ? "mt-[9px] rounded-[9px] border border-red-300 bg-red-50 p-[9px]"
                : "mt-[9px] rounded-[9px] border border-black/15 bg-white/75 p-[9px]"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="block text-[10px] font-medium text-[var(--cp-primary)]">
                  {request.name}&apos;s join code
                </strong>
                <span className="mt-px block text-[8.5px] text-ink-muted">
                  {locked
                    ? "Too many wrong attempts"
                    : expired
                      ? "Code expired"
                      : "Read this code to them"}
                </span>
              </div>
              <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-slate-400" />
            </div>
            <div
              className={
                expired || locked
                  ? "mt-2 grid grid-cols-6 gap-1 opacity-45"
                  : "mt-2 grid grid-cols-6 gap-1"
              }
            >
              {digits.map((digit, index) => (
                <span
                  key={`${request.id}-${index}`}
                  className="grid h-6 place-items-center rounded-[5px] border border-black/10 bg-white font-mono text-[11px] font-medium"
                >
                  {digit}
                </span>
              ))}
            </div>
            {expired || locked ? (
              <p className="mt-1 text-[8.5px] leading-[1.4] text-ink-muted">
                Issue a fresh code to continue.
              </p>
            ) : (
              <p
                className="mt-1 text-[8.5px] leading-[1.4] text-ink-muted"
                data-join-expires={request.codeExpiresAt || ""}
              >
                Expires in {joinCountdownText(request.codeExpiresAt || "")}
              </p>
            )}
            {request.attempts ? (
              <p className="mt-1 text-[8.5px] leading-[1.4] text-ink-muted">
                {request.attempts} of {request.maxAttempts} wrong attempts used.
              </p>
            ) : null}
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="button"
                className="rounded-[5px] bg-[var(--cp-primary)] px-2 py-1 text-[8.5px] font-medium text-white"
                onClick={() => onRegenerate(request.id)}
              >
                New code
              </button>
              <button
                type="button"
                className="rounded-[5px] border border-black/15 bg-white px-2 py-1 text-[8.5px] font-medium text-slate-600"
                onClick={() => onDeny(request.id)}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })}

      {!pending.length && !codes.length ? (
        <p className="mt-2 text-[9px] leading-[1.45] text-ink-muted">
          No one is waiting. Tap “Open guest view” to simulate Rahul’s phone in a new tab.
        </p>
      ) : null}
      <p className="mt-2 text-[8px] leading-[1.4] text-slate-400">
        Demo only: both tabs share this browser&apos;s demo data. On real phones this arrives over
        the server.
      </p>
    </section>
  );
}

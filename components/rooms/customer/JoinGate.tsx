"use client";

import { Icon } from "@/components/rooms/shared/icons";
import { joinCountdownText, money } from "@/lib/rooms/format";
import { orderRounds } from "@/lib/rooms/rules";
import type { JoinRequest, Order } from "@/lib/rooms/types";

const btnDirect =
  "mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--cp-primary)] px-3 py-3 text-center text-xs font-medium text-white";
const btnLink =
  "mt-1.5 block w-full rounded-[10px] border border-black/10 bg-white/70 px-3 py-3 text-center text-xs font-medium text-[var(--cp-primary)]";
const inputClass =
  "h-10 w-full rounded-[9px] border border-black/15 bg-white px-3 text-xs text-ink outline-none focus:border-[var(--cp-primary)]";
const kickerClass =
  "mt-2.5 text-[9.5px] font-medium uppercase tracking-[0.06em] text-slate-500";
const titleClass =
  "mt-1 font-display text-lg font-medium leading-[1.25] text-[var(--cp-primary)]";
const subClass = "mx-auto mt-[5px] max-w-[300px] text-[10.5px] leading-[1.55] text-ink-muted";
const timerClass =
  "mt-[7px] block text-center text-[9.5px] tabular-nums text-ink-muted";
const noteClass =
  "mt-[9px] flex items-start gap-[5px] text-left text-[9px] leading-[1.45] text-ink-muted";

const iconTone: Record<string, string> = {
  form: "bg-[var(--cp-secondary)] text-[var(--cp-primary)]",
  pending: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
};

function JoinBillSummary({ order }: { order: Order }) {
  const rounds = orderRounds(order).length;
  return (
    <div className="my-3 flex items-center gap-2 rounded-[10px] border border-[var(--cp-primary)]/15 bg-white/60 px-2.5 py-[9px] text-left">
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
        <Icon name="receipt" size={16} />
      </span>
      <div>
        <strong className="block text-[10.5px] font-medium text-[var(--cp-primary)]">
          {order.customerName}&apos;s open bill
        </strong>
        <span className="mt-px block text-[9.5px] text-ink-muted">
          #{order.number} · {rounds} round{rounds === 1 ? "" : "s"} · {money(order.total)} so far
        </span>
      </div>
    </div>
  );
}

function GateIcon({ name, tone }: { name: "users" | "clock" | "check" | "lock"; tone: string }) {
  return (
    <div
      className={`mx-auto grid h-[52px] w-[52px] place-items-center rounded-full ${iconTone[tone]}`}
    >
      <Icon name={name} size={22} />
    </div>
  );
}

/**
 * The demo's `renderJoinForm` / `renderJoinGate`: a guest who scanned a spot
 * with an open bill must be approved by the host, then enter the 6-digit code.
 */
export function JoinGate({
  order,
  spotName,
  status,
  request,
  name,
  code,
  codeError,
  onName,
  onCode,
  onAsk,
  onCancel,
  onVerify,
}: {
  order: Order;
  spotName: string;
  status: string | null;
  request: JoinRequest | null;
  name: string;
  code: string;
  codeError: string;
  onName: (value: string) => void;
  onCode: (value: string) => void;
  onAsk: () => void;
  onCancel: () => void;
  onVerify: () => void;
}) {
  const hostName = order.customerName || "the host";

  if (status === "pending" && request) {
    return (
      <div className="pt-[18px] text-center">
        <GateIcon name="clock" tone="pending" />
        <p className={kickerClass}>Waiting for approval</p>
        <h2 className={titleClass}>Request sent to {hostName}</h2>
        <p className={subClass}>
          Keep this page open. {hostName} has two minutes to approve your phone.
        </p>
        <JoinBillSummary order={order} />
        <div className="mt-2.5 flex items-center justify-center gap-[7px] text-[10.5px] text-[var(--cp-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          Waiting for {hostName}...
        </div>
        <p className={timerClass} data-join-expires={request.expiresAt}>
          Request expires in {joinCountdownText(request.expiresAt)}
        </p>
        <button type="button" className={btnLink} onClick={onCancel}>
          Cancel request
        </button>
      </div>
    );
  }

  if (status === "approved" && request) {
    return (
      <div className="pt-[18px] text-center">
        <GateIcon name="check" tone="success" />
        <p className={kickerClass}>Approved by {hostName}</p>
        <h2 className={titleClass}>Ask {hostName} for the code</h2>
        <p className={subClass}>
          {hostName} approved your phone. Enter the 6-digit code shown on their phone.
        </p>
        <JoinBillSummary order={order} />
        <label className="mb-[5px] block text-left text-[10.5px] font-medium text-[var(--cp-primary)]" htmlFor="join-code">
          6-digit code
        </label>
        <input
          id="join-code"
          className={`${inputClass} h-[46px] px-3 text-center text-xl font-medium tracking-[0.32em]`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) => onCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <p className="mt-1 min-h-[14px] text-left text-[9.5px] leading-[1.4] text-red-600">
          {codeError}
        </p>
        <button type="button" className={btnDirect} onClick={onVerify}>
          Join table
        </button>
        <p className={timerClass} data-join-expires={request.codeExpiresAt || ""}>
          Code expires in {joinCountdownText(request.codeExpiresAt || "")}
        </p>
        <p className={noteClass}>
          <Icon name="lock" size={12} className="mt-px shrink-0" />
          <span>The code is single-use. You have {request.maxAttempts} attempts.</span>
        </p>
        <button type="button" className={btnLink} onClick={onCancel}>
          Cancel request
        </button>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="pt-[18px] text-center">
        <GateIcon name="lock" tone="danger" />
        <p className={kickerClass}>Code locked</p>
        <h2 className={titleClass}>Too many wrong codes</h2>
        <p className={subClass}>
          Ask {hostName} to issue a new code, or ask a waiter to verify you at the table.
        </p>
        <JoinBillSummary order={order} />
        <button type="button" className={btnLink} onClick={onCancel}>
          Cancel request
        </button>
      </div>
    );
  }

  if (status === "expired") {
    const codeExpired = request?.status === "approved";
    return (
      <div className="pt-[18px] text-center">
        <GateIcon name="clock" tone="danger" />
        <p className={kickerClass}>{codeExpired ? "Code expired" : "Request expired"}</p>
        <h2 className={titleClass}>
          {codeExpired ? "Ask for a new code" : "Ask again to join"}
        </h2>
        <p className={subClass}>
          {codeExpired
            ? `The 6-digit code expired. ${hostName} can issue a new one from their phone.`
            : `The request timed out. Ask ${hostName} again, or ask a waiter for help.`}
        </p>
        <JoinBillSummary order={order} />
        {codeExpired ? null : (
          <button type="button" className={btnDirect} onClick={onAsk}>
            Ask {hostName} again
          </button>
        )}
        <button type="button" className={btnLink} onClick={onCancel}>
          Cancel request
        </button>
      </div>
    );
  }

  const note =
    status === "denied"
      ? `${hostName} declined this request. You can ask again, or ask a waiter to help.`
      : status === "cancelled"
        ? "That request was cancelled. Ask again when you are ready."
        : `${hostName} needs to approve your phone before you can order. Nothing is added to the bill until you are in.`;

  return (
    <div className="pt-[18px] text-center">
      <GateIcon name="users" tone="form" />
      <p className={kickerClass}>{spotName} · open bill</p>
      <h2 className={titleClass}>Join {hostName}&apos;s table</h2>
      <p className={subClass}>{note}</p>
      <JoinBillSummary order={order} />
      <label
        className="mb-[5px] block text-left text-[10.5px] font-medium text-[var(--cp-primary)]"
        htmlFor="join-name"
      >
        Your name
      </label>
      <input
        id="join-name"
        className={inputClass}
        maxLength={40}
        placeholder="e.g. Rahul"
        autoComplete="name"
        value={name || request?.name || ""}
        onChange={(event) => onName(event.target.value)}
      />
      <button type="button" className={btnDirect} onClick={onAsk}>
        Ask {hostName} to join
      </button>
      <p className={noteClass}>
        <Icon name="lock" size={12} className="mt-px shrink-0" />
        <span>
          {hostName} will see your name, then approve or deny. If approved, a 6-digit code appears
          on their phone and you enter it here.
        </span>
      </p>
    </div>
  );
}

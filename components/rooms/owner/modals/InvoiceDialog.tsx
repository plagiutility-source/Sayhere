"use client";

import { useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { Modal } from "@/components/rooms/shared/Modal";
import { btnOutline, btnPrimary, cx } from "@/components/rooms/shared/ui";
import { EMAIL_MAX } from "@/lib/rooms/constants";
import { formatTime, money, orderSpotName, spotWord } from "@/lib/rooms/format";
import {
  activeStatus,
  markBillEmailed,
  orderRounds,
  sendBillToPhone,
  verifyPayment,
  waiterName,
} from "@/lib/rooms/rules";
import type { Order, PaymentMode, RoundVia } from "@/lib/rooms/types";
import { useRoomsPage } from "@/lib/rooms/adapter";
import { useBusiness } from "@/lib/use-business";
import { useOwner } from "../OwnerProvider";

const sectionHead = "text-[11.5px] leading-[1.55] text-ink-muted";
const errorClass = "mt-1 text-[11px] text-red-700";

function roundViaLabel(via: RoundVia): string {
  const labels: Record<string, string> = {
    customer: "Customer QR",
    reorder: "Added to the same bill",
    punch: "Punched by staff",
    simulated: "Staff entry",
    seed: "Recorded bill",
  };
  return labels[via] || "Customer QR";
}

/** The demo's `openBillModal`: invoice paper, send to phone, email (SIM) and payment. */
export function InvoiceDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { state, save, toast, businessType } = useOwner();
  const business = useBusiness();
  const location = state.locations.find((item) => item.id === order.locId) ?? null;
  const page = useRoomsPage(location ? location.slug : null, "normal");
  const address =
    page.config?.buttons.hours.address?.trim() ||
    page.config?.buttons.directions.value?.trim() ||
    "";
  const [email, setEmail] = useState(order.emailedTo || "");
  const [emailError, setEmailError] = useState("");
  const [mode, setMode] = useState<PaymentMode>("Cash");
  const [amount, setAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const rounds = orderRounds(order);
  const payment = order.payment || null;
  const paid = order.status === "completed";
  const canPay = activeStatus(order.status);
  const canSendToPhone = canPay && Boolean(order.code);
  const billSent = Boolean(order.billSentAt);
  const table = spotWord(businessType, false);
  const billDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const sendPhone = () => {
    const result = sendBillToPhone(state, order.id);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    toast(
      `${result.sentBefore ? "Bill sent again" : "Bill sent"} to ${order.customerName}'s phone — ${money(order.total)}.`,
    );
  };

  const sendEmail = () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setEmailError("Enter a valid email address, like customer@example.com.");
      return;
    }
    const result = markBillEmailed(state, order.id, value);
    if (!result) return;
    save(result.state);
    setEmailError("");
    toast(`Bill #${order.number} sent to ${result.order.emailedTo}.`);
  };

  const verify = () => {
    const value = Number(amount.replace(/,/g, ""));
    const result = verifyPayment(state, order.id, value, mode);
    if (!result.ok) {
      setPaymentError(
        result.error ||
          `That doesn't match the bill total of ${money(order.total)}. Enter the exact amount to close.`,
      );
      return;
    }
    save(result.state);
    setPaymentError("");
    onClose();
    toast(
      `Payment verified — ${money(result.amount)} received. #${order.number} closed and ${orderSpotName(state, result.order)} is free.`,
    );
  };

  return (
    <Modal wide focusFirst={false} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">
            Invoice · {orderSpotName(state, order)}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            #{order.number} · {order.customerName}
            {order.phone ? ` · ${order.phone}` : ""} · {formatTime(order.createdAt)}
          </p>
        </div>
        <button
          type="button"
          className="grid h-[30px] w-[30px] place-items-center rounded-control text-ink-muted hover:bg-surface-muted"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="invoice-print-area mt-4 rounded-[10px] border border-black/10 bg-white p-4">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
          <div>
            <strong className="block text-[13px] font-medium">{business.name}</strong>
            {address ? (
              <span className="block text-[10.5px] text-ink-muted">{address}</span>
            ) : null}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            Invoice
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px]">
          <MetaRow label="Bill" value={`#${order.number}`} />
          <MetaRow label="Date" value={`${billDate} · ${formatTime(order.createdAt)}`} />
          <MetaRow label={order.code ? table : "Type"} value={orderSpotName(state, order)} />
          <MetaRow label="Guests" value={String(order.guests)} />
          <MetaRow label="Customer" value={order.customerName} />
          <MetaRow label="Phone" value={order.phone || "—"} />
          <MetaRow label="Served by" value={waiterName(state, order.locId, order.waiterId)} />
          {order.participants && order.participants.length > 1 ? (
            <MetaRow
              label="Joined phones"
              value={order.participants.map((person) => person.name).join(" · ")}
            />
          ) : null}
          <MetaRow
            label="Payment"
            value={paid ? "Paid" : order.status === "cancelled" ? "No charge" : "Unpaid"}
          />
        </div>

        <div className="mt-3 border-t border-black/10 pt-2">
          <div className="grid grid-cols-[1fr_48px_88px_96px] gap-2 text-[10px] font-medium uppercase tracking-[0.04em] text-ink-muted">
            <span>Item</span>
            <span>Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_48px_88px_96px] gap-2 border-b border-black/5 py-1 text-[11px]"
            >
              <span>{item.name}</span>
              <span>{item.qty}</span>
              <span className="text-right">{money(item.price)}</span>
              <span className="text-right">{money(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <p className="flex items-center justify-between text-[11px] font-medium">
            Order rounds <span className="text-ink-muted">{rounds.length}</span>
          </p>
          {rounds.map((round, index) => (
            <div key={round.id} className="mt-2 border-t border-black/5 pt-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-[10.5px]">
                <strong className="font-medium">Round {index + 1}</strong>
                <span className="text-ink-muted">
                  {formatTime(round.at)} ·{" "}
                  {round.by && round.by !== order.customerName
                    ? `Added by ${round.by}`
                    : roundViaLabel(round.via)}
                </span>
                <b className="font-medium">{money(round.total)}</b>
              </div>
              <p className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">
                {round.items.map((item) => `${item.qty}× ${item.name}`).join(" · ")}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 text-xs">
          <span>
            Total <small className="text-[10px] text-ink-muted">taxes included</small>
          </span>
          <strong className="text-sm font-medium">{money(order.total)}</strong>
        </div>

        {paid ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-green-deep">
            <Icon name="check" size={13} /> Paid {money(payment ? payment.amount : order.total)}
            {payment && payment.mode ? ` via ${payment.mode}` : ""}
            {order.paidAt ? ` · ${formatTime(order.paidAt)}` : ""}
          </p>
        ) : null}
        <p className="mt-2 text-[10.5px] text-ink-muted">Thank you for dining with us.</p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={btnOutline} onClick={() => window.print()}>
          <Icon name="printer" size={15} /> Print invoice
        </button>
        <button type="button" className={btnOutline} onClick={onClose}>
          Done
        </button>
      </div>

      {canSendToPhone ? (
        <div className="mt-4 border-t border-black/5 pt-3">
          <div className="flex flex-col gap-0.5">
            <strong className="text-xs font-medium">
              {billSent ? "Bill sent to the customer" : "Send the bill to the customer"}
            </strong>
            <span className={sectionHead}>
              {billSent
                ? `Sent at ${formatTime(order.billSentAt as string)}. The customer sees the unpaid bill on their phone; download unlocks after payment.`
                : "The customer cannot see the bill until you send it. Send it here, then take payment and close the bill."}
            </span>
          </div>
          <button type="button" className={cx(btnPrimary, "mt-2")} onClick={sendPhone}>
            <Icon name="receipt" size={14} /> {billSent ? "Send bill again" : "Send bill to phone"}
          </button>
        </div>
      ) : null}

      <div className="mt-4 border-t border-black/5 pt-3">
        <div className="flex flex-col gap-0.5">
          <strong className="text-xs font-medium">Email the bill</strong>
          <span className={sectionHead}>
            {order.emailedTo
              ? `Last sent to ${order.emailedTo} · ${formatTime(order.emailedAt as string)}`
              : "Send a copy to the customer."}
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="h-9 min-w-0 flex-1 rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-blue"
            type="email"
            maxLength={EMAIL_MAX}
            value={email}
            placeholder="customer@example.com"
            autoComplete="email"
            aria-label="Bill email"
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError("");
            }}
          />
          <button type="button" className={btnPrimary} onClick={sendEmail}>
            <Icon name="mail" size={14} /> Send
          </button>
        </div>
        {emailError ? <p className={errorClass}>{emailError}</p> : null}
      </div>

      {canPay ? (
        <div className="mt-4 border-t border-black/5 pt-3">
          <div className="flex flex-col gap-0.5">
            <strong className="text-xs font-medium">Payment received?</strong>
            <span className={sectionHead}>
              Enter the exact bill total to verify. This closes the bill and frees the{" "}
              {table.toLowerCase()} and waiter.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              className="h-9 rounded-control border border-ink/15 bg-white px-2 text-[12.5px]"
              aria-label="Payment method"
              value={mode}
              onChange={(event) => setMode(event.target.value as PaymentMode)}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
            </select>
            <input
              className="h-9 min-w-0 flex-1 rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] outline-none focus:border-brand-blue"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="Enter amount received"
              aria-label="Amount received"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                if (paymentError) setPaymentError("");
              }}
            />
            <button type="button" className={btnPrimary} onClick={verify}>
              Verify &amp; close
            </button>
          </div>
          {paymentError ? <p className={errorClass}>{paymentError}</p> : null}
          <p className="mt-1.5 text-[10.5px] leading-[1.5] text-ink-muted">
            The bill can only be closed with the exact total of {money(order.total)}.
          </p>
        </div>
      ) : order.status === "cancelled" ? (
        <div className="mt-4 border-t border-black/5 pt-3 text-[11px] text-ink-muted">
          Cancelled — no charge. This bill is closed.
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1.5 border-t border-black/5 pt-3 text-[11px] text-brand-green-deep">
          <Icon name="check" size={14} /> This bill is paid and closed. The table and waiter are free.
        </div>
      )}
    </Modal>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-muted">{label}</span>
      <strong className="text-right font-medium">{value}</strong>
    </div>
  );
}

"use client";

/**
 * The live controls the rooms feature adds to the app's own top bar: the
 * notification bell with waiting table calls / new orders, and the order-bell
 * sound toggle. It is only rendered for cafe, restaurant and hotel (the same
 * gate as the sidebar), inside the provider mounted by `DashboardLive`.
 *
 * This is deliberately NOT Sayhere's Topbar: it contributes two buttons to an
 * existing header and reuses the app's tokens and the rooms rules.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { cx } from "@/components/rooms/shared/ui";
import {
  formatTime,
  money,
  orderSpotName,
  serviceKindTitle,
  spotWord,
} from "@/lib/rooms/format";
import {
  activeServiceCalls,
  activeStatus,
  countNewOrders,
  newOrders,
  resolveServiceCall,
  sendBillToPhone,
  serviceCallSpotName,
} from "@/lib/rooms/rules";
import type { Order } from "@/lib/rooms/types";
import { useOwner } from "./OwnerProvider";

const ICON_BUTTON =
  "relative flex h-10 w-10 items-center justify-center rounded-control text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export function LiveTopbarActions() {
  const { state, save, toast, soundOn, toggleSound, businessType } = useOwner();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const calls = activeServiceCalls(state);
  const orders = newOrders(state);
  const requests = countNewOrders(state) + calls.length;
  const locationId = state.locations[0]?.id ?? "";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const resolveCall = (id: string) => {
    const result = resolveServiceCall(state, id);
    if (!result.call) return;
    save(result.state);
    toast(
      `${serviceCallSpotName(state, result.call)} \u2014 ${serviceKindTitle(result.call.kind).toLowerCase()} handled.`,
    );
  };

  const sendBill = (order: Order) => {
    const result = sendBillToPhone(state, order.id);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    toast(
      `${result.sentBefore ? "Bill sent again" : "Bill sent"} to ${order.customerName}'s phone \u2014 ${money(order.total)}.`,
    );
  };

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Live table requests"
          aria-expanded={open}
          className={cx(ICON_BUTTON, requests > 0 && "text-brand-blue")}
        >
          <Icon name="bell" size={18} />
          {requests > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-pill bg-red-600 px-1 text-[9px] font-medium text-white">
              {requests}
            </span>
          ) : null}
        </button>

        {open ? (
          <div
            role="dialog"
            aria-label="Live table requests"
            className="absolute right-0 top-12 z-40 w-[330px] max-w-[calc(100vw-28px)] rounded-card border border-black/10 bg-white p-2.5 shadow-soft"
          >
            <div className="flex items-center justify-between px-1 pb-2 pt-0.5">
              <strong className="text-[13px] font-medium text-ink">
                Live requests
              </strong>
              <span className="rounded-pill bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-blue">
                {requests}
              </span>
            </div>

            {calls.length > 0 ? (
              <>
                <p className="mb-0.5 mt-1.5 px-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                  Table calls
                </p>
                {calls.slice(0, 3).map((call) => {
                  const order = call.orderId
                    ? state.orders.find((item) => item.id === call.orderId) ?? null
                    : null;
                  const canSendBill = Boolean(
                    call.kind === "bill" &&
                      order &&
                      activeStatus(order.status) &&
                      !order.billSentAt,
                  );
                  return (
                    <div
                      key={call.id}
                      className="flex items-start gap-2 rounded-control px-2 py-2 hover:bg-surface-muted"
                    >
                      <span
                        className={cx(
                          "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-control",
                          call.kind === "bill"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-brand-blue/10 text-brand-blue",
                        )}
                      >
                        <Icon
                          name={call.kind === "bill" ? "receipt" : "bell"}
                          size={15}
                        />
                      </span>
                      <Link
                        href={{ pathname: "/orders", query: { loc: call.locId } }}
                        className="min-w-0 flex-1"
                        onClick={() => setOpen(false)}
                      >
                        <strong className="block text-[11.5px] font-medium text-ink">
                          {serviceCallSpotName(state, call)} ·{" "}
                          {serviceKindTitle(call.kind)}
                        </strong>
                        <span className="mt-px block truncate text-[10px] text-ink-muted">
                          {call.customerName} · {formatTime(call.createdAt)}
                        </span>
                      </Link>
                      <button
                        type="button"
                        className={cx(
                          "shrink-0 whitespace-nowrap rounded-pill border px-[7px] py-[3px] text-[9px] font-medium",
                          canSendBill
                            ? "border-brand-green bg-brand-green text-white hover:bg-brand-green-deep"
                            : "border-ink/15 bg-white text-slate-700 hover:border-brand-green hover:text-brand-green-deep",
                        )}
                        onClick={() =>
                          canSendBill && order
                            ? sendBill(order)
                            : resolveCall(call.id)
                        }
                      >
                        {canSendBill ? "Send bill" : "Done"}
                      </button>
                    </div>
                  );
                })}
              </>
            ) : null}

            <p className="mb-0.5 mt-1.5 px-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
              New orders
            </p>
            {orders.length > 0 ? (
              orders.slice(0, 4).map((order) => (
                <Link
                  key={order.id}
                  href={{ pathname: "/orders", query: { loc: order.locId } }}
                  className="flex items-start gap-2 rounded-control px-2 py-2 hover:bg-surface-muted"
                  onClick={() => setOpen(false)}
                >
                  <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-pill bg-red-500" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink">
                      {orderSpotName(state, order)} · {money(order.total)}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      {order.customerName} · order #{order.number}
                    </span>
                  </span>
                  <Icon
                    name="arrowRight"
                    size={14}
                    className="mt-0.5 shrink-0 text-ink-muted"
                  />
                </Link>
              ))
            ) : (
              <p className="px-1.5 py-3 text-[11px] leading-[1.5] text-ink-muted">
                {calls.length
                  ? "No new orders right now — the table calls above are still waiting."
                  : `No table calls. Each new order rings here and is highlighted on its ${spotWord(
                      businessType,
                      false,
                    ).toLowerCase()}.`}
              </p>
            )}

            <Link
              href={`/orders${locationId ? `?loc=${locationId}` : ""}`}
              className="mt-3 flex items-center gap-1.5 border-t border-black/5 pt-2.5 text-[11px] font-medium text-brand-blue"
              onClick={() => setOpen(false)}
            >
              Open live orders <Icon name="arrowRight" size={13} />
            </Link>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute order bell" : "Unmute order bell"}
        title={soundOn ? "Order bell is on" : "Order bell is muted"}
        className={cx(ICON_BUTTON, !soundOn && "opacity-60")}
      >
        <Icon name={soundOn ? "soundOn" : "soundOff"} size={18} />
      </button>
    </>
  );
}

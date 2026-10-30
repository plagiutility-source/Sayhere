"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { Badge, cx } from "@/components/rooms/shared/ui";
import { formatTime, money, orderSpotName, serviceKindTitle, spotWord } from "@/lib/rooms/format";
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
import { DEMO_BUSINESS } from "@/lib/rooms/seed";
import { useOwner } from "../OwnerProvider";

/** The demo's notification row names the order's location after the bill number. */
function orderLocationName(state: { locations: Array<{ id: string; name: string }> }, order: Order) {
  const location = state.locations.find((item) => item.id === order.locId);
  return location ? location.name : "";
}

export function Topbar() {
  const { state, save, toast, setNavOpen, soundOn, toggleSound, businessType, resetToken } =
    useOwner();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrap = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const calls = activeServiceCalls(state);
  const waiting = countNewOrders(state);
  const orders = newOrders(state);
  const requests = waiting + calls.length;
  const locationId = state.locations[0]?.id || "";

  const resolveCall = (id: string) => {
    const result = resolveServiceCall(state, id);
    if (!result.call) return;
    save(result.state);
    toast(
      `${serviceCallSpotName(state, result.call)} — ${serviceKindTitle(result.call.kind).toLowerCase()} handled.`,
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
      `${result.sentBefore ? "Bill sent again" : "Bill sent"} to ${order.customerName}'s phone — ${money(order.total)}.`,
    );
  };

  useEffect(() => {
    setNotifOpen(false);
  }, [resetToken, pathname]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (event: MouseEvent) => {
      if (notifWrap.current && !notifWrap.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-black/5 bg-white px-6 max-[640px]:gap-2.5 max-[640px]:px-3.5">
      <button
        type="button"
        className="hidden h-9 w-9 items-center justify-center rounded-control border border-black/10 bg-white text-ink max-[1023px]:inline-flex"
        onClick={() => setNavOpen(true)}
        aria-label="Open menu"
      >
        <Icon name="menu" size={18} />
      </button>

      <div className="flex h-9 flex-[0_1_300px] items-center gap-2 rounded-control bg-surface-muted px-3 text-[13px] text-ink-muted max-[640px]:w-[128px] max-[640px]:flex-none">
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder={`Search orders, ${spotWord(businessType, true).toLowerCase()}…`}
          aria-label="Search"
          className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      <div className="ml-auto flex items-center gap-3.5">
        <div className="relative" ref={notifWrap}>
          <button
            type="button"
            className={cx(
              "relative grid h-9 w-9 place-items-center rounded-pill text-ink-muted hover:bg-surface-muted",
              requests > 0 && "text-brand-blue",
            )}
            onClick={() => setNotifOpen((open) => !open)}
            aria-label="Live table requests"
            aria-expanded={notifOpen}
          >
            <Icon name="bell" size={18} />
            {requests > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-red-600 px-1 text-[9px] font-medium text-white">
                {requests}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="Live table requests"
              className="absolute right-0 top-11 z-40 w-[335px] max-w-[calc(100vw-28px)] rounded-card border border-black/10 bg-white p-2.5 shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
            >
              <div className="flex items-center justify-between px-1 pb-2 pt-0.5">
                <strong className="text-[13px] font-medium">Live requests</strong>
                <Badge tone="blue">{requests}</Badge>
              </div>

              {calls.length > 0 && (
                <>
                  <p className="mb-0.5 mt-1.5 px-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Table calls
                  </p>
                  {calls.slice(0, 3).map((call) => {
                    const callOrder = call.orderId
                      ? state.orders.find((order) => order.id === call.orderId) || null
                      : null;
                    const canSendBill = Boolean(
                      call.kind === "bill" &&
                        callOrder &&
                        activeStatus(callOrder.status) &&
                        !callOrder.billSentAt,
                    );
                    return (
                      <div
                        key={call.id}
                        className="flex items-start gap-2 rounded-[8px] px-2 py-2 hover:bg-surface-muted"
                      >
                        <span
                          className={cx(
                            "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px]",
                            call.kind === "bill"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-brand-blue/[0.08] text-brand-blue",
                          )}
                        >
                          <Icon name={call.kind === "bill" ? "receipt" : "bell"} size={15} />
                        </span>
                        <Link
                          href={{ pathname: "/rooms", query: { loc: call.locId } }}
                          className="min-w-0 flex-1"
                          onClick={() => setNotifOpen(false)}
                        >
                          <strong className="block text-[11.5px] font-medium">
                            {serviceCallSpotName(state, call)} · {serviceKindTitle(call.kind)}
                          </strong>
                          <span className="mt-px block truncate text-[10px] text-ink-muted">
                            {call.customerName} · {formatTime(call.createdAt)} · open{" "}
                            {spotWord(businessType, true).toLowerCase()}
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
                            canSendBill && callOrder ? sendBill(callOrder) : resolveCall(call.id)
                          }
                        >
                          {canSendBill ? "Send bill" : "Done"}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              <p className="mb-0.5 mt-1.5 px-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                New orders
              </p>
              {orders.length > 0 ? (
                orders.slice(0, 4).map((order) => (
                  <Link
                    key={order.id}
                    href={{ pathname: "/orders", query: { loc: order.locId } }}
                    className="flex items-start gap-2 rounded-[8px] px-2 py-2 hover:bg-surface-muted"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-pill bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">
                        {orderSpotName(state, order)} · {money(order.total)}
                      </span>
                      <span className="block text-[11px] text-ink-muted">
                        {order.customerName} · order #{order.number} ·{" "}
                        {orderLocationName(state, order)}
                      </span>
                    </span>
                    <Icon name="arrowRight" size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                  </Link>
                ))
              ) : (
                <p className="px-1.5 py-3 text-[11px] leading-[1.5] text-ink-muted">
                  {calls.length
                    ? "No new orders right now — the table calls above are still waiting."
                    : `No table calls. Each new order or bell rings here and is highlighted on its ${spotWord(businessType, false).toLowerCase()}.`}
                </p>
              )}

              <Link
                href={`/orders${orders[0]?.locId ? `?loc=${orders[0].locId}` : locationId ? `?loc=${locationId}` : ""}`}
                className="mt-3 flex items-center gap-1.5 border-t border-black/5 pt-2.5 text-[11px] font-medium text-brand-blue"
                onClick={() => setNotifOpen(false)}
              >
                Open live orders <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className={cx(
            "grid h-9 w-9 place-items-center rounded-pill text-ink-muted hover:bg-surface-muted",
            !soundOn && "opacity-60",
          )}
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute order bell" : "Unmute order bell"}
          title={soundOn ? "Order bell is on" : "Order bell is muted"}
        >
          <Icon name={soundOn ? "soundOn" : "soundOff"} size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="avatar grid h-8 w-8 place-items-center rounded-pill bg-brand-navy text-[11px] font-medium tracking-[0.03em] text-white">
            {DEMO_BUSINESS.initials}
          </span>
          <div className="max-[640px]:hidden">
            <div className="text-[13px] font-medium">{DEMO_BUSINESS.name}</div>
            <div className="text-[11px] text-ink-muted">
              Pro plan · {businessType === "hotel" ? "Hotel" : "Café"}
            </div>
          </div>
          <Icon name="chevronDown" size={14} className="max-[640px]:hidden" />
        </div>
      </div>
    </header>
  );
}

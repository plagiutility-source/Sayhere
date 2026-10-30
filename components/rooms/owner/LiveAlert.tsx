"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import {
  freshRounds,
  freshServiceCalls,
  LIVE_ALERT_EVENT,
  type LiveAlertDetail,
} from "@/lib/rooms/detect";
import { formatTime, money, orderSpotName, serviceKindTitle, spotWord } from "@/lib/rooms/format";
import {
  activeServiceCalls,
  activeStatus,
  orderRounds,
  serviceCallSpotName,
} from "@/lib/rooms/rules";
import { playBell, startAlertRing, type AlertRing } from "@/lib/rooms/sound";
import { subscribe } from "@/lib/rooms/store";
import { useOwner } from "./OwnerProvider";

type DashboardAlert = LiveAlertDetail;

/**
 * The demo's `detectIncomingOrders` + `detectServiceCalls` + `renderLiveAlert`.
 *
 * Detection only runs for state that arrives through the store subscription
 * (storage event or the 2500 ms poll), so a staff punch or a payment in this
 * tab never rings its own bell. Seed rounds are marked as known on mount.
 */
export function LiveAlerts() {
  const { state, hydrated, soundOn, toast, businessType } = useOwner();
  const pathname = usePathname();
  const [alert, setAlert] = useState<DashboardAlert | null>(null);
  const knownRounds = useRef<Set<string>>(new Set());
  const knownCalls = useRef<Set<string>>(new Set());
  const ring = useRef<AlertRing | null>(null);
  const initialised = useRef(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const stopRing = useCallback(() => {
    ring.current?.stop();
    ring.current = null;
  }, []);

  const startRing = useCallback(() => {
    ring.current?.stop();
    ring.current = startAlertRing(soundRef.current);
  }, []);

  useEffect(() => {
    if (!hydrated || initialised.current) return;
    const initial = stateRef.current;
    initial.orders.forEach((order) => {
      orderRounds(order).forEach((round) => knownRounds.current.add(round.id));
    });
    activeServiceCalls(initial).forEach((call) => knownCalls.current.add(call.id));
    initialised.current = true;

    return subscribe((next) => {
      const rounds = freshRounds(next, knownRounds.current);
      if (rounds.length) {
        startRing();
        const latest = rounds[rounds.length - 1];
        const extra = orderRounds(latest.order).length > 1;
        setAlert({
          orderId: latest.order.id,
          kind: extra ? "round" : "order",
          roundId: latest.round.id,
          at: latest.round.at,
        });
        toastRef.current(
          extra
            ? `Extra order · ${orderSpotName(next, latest.order)} · ${money(latest.round.total)} added to ${latest.order.customerName}'s bill`
            : `New order · ${orderSpotName(next, latest.order)} · ${money(latest.round.total)} from ${latest.order.customerName}`,
        );
      }
      const calls = freshServiceCalls(next, knownCalls.current);
      if (calls.length) {
        playBell(soundRef.current);
        const latest = calls[calls.length - 1];
        toastRef.current(`${serviceCallSpotName(next, latest)} · ${serviceKindTitle(latest.kind)}`);
      }
    });
  }, [hydrated, startRing, stopRing]);

  /* A round created in this tab (punch or simulate) must not ring on the next external sync. */
  useEffect(() => {
    if (!initialised.current) return;
    state.orders.forEach((item) => {
      orderRounds(item).forEach((round) => knownRounds.current.add(round.id));
    });
    activeServiceCalls(state).forEach((call) => knownCalls.current.add(call.id));
  }, [state]);

  useEffect(() => () => ring.current?.stop(), []);

  /* The demo clears the dashboard alert and stops the ring on navigation. */
  useEffect(() => {
    setAlert(null);
    stopRing();
  }, [pathname, stopRing]);

  useEffect(() => {
    if (!soundOn) stopRing();
  }, [soundOn, stopRing]);

  useEffect(() => {
    const onLocalAlert = (event: Event) => {
      const detail = (event as CustomEvent<LiveAlertDetail>).detail;
      if (!detail) return;
      if (detail.roundId) knownRounds.current.add(detail.roundId);
      startRing();
      setAlert(detail);
    };
    window.addEventListener(LIVE_ALERT_EVENT, onLocalAlert);
    return () => window.removeEventListener(LIVE_ALERT_EVENT, onLocalAlert);
  }, [startRing]);

  const order = alert ? state.orders.find((item) => item.id === alert.orderId) || null : null;
  const visible = Boolean(
    alert &&
      order &&
      activeStatus(order.status) &&
      (alert.kind === "round" || order.status === "new"),
  );

  useEffect(() => {
    if (alert && !visible) {
      setAlert(null);
      stopRing();
    }
  }, [alert, visible, stopRing]);

  const dismiss = () => {
    setAlert(null);
    stopRing();
  };

  if (!alert || !order || !visible) return null;

  const isRound = alert.kind === "round";
  const round = alert.roundId
    ? orderRounds(order).find((item) => item.id === alert.roundId) || null
    : null;
  const lines = (round ? round.items : order.items) || [];
  const waiting = state.orders.filter(
    (item) => item.status === "new" && item.locId === order.locId,
  ).length;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      aria-label="New order alert"
      className="fixed right-[22px] top-[76px] z-[80] w-[min(360px,calc(100vw-24px))] rounded-[12px] border border-brand-yellow/60 border-l-4 border-l-brand-yellow bg-amber-50 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] max-[640px]:right-2.5 max-[640px]:top-2.5"
    >
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-amber-100 text-amber-700">
          <Icon name="bell" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-[12.5px] font-semibold text-amber-900">
            {isRound ? "New round" : "New order"} · {orderSpotName(state, order)}
          </strong>
          <span className="mt-0.5 block text-[10px] text-amber-800">
            {order.customerName} · #{order.number} · {formatTime(alert.at)}
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 p-[3px] text-amber-700"
          onClick={dismiss}
          aria-label="Dismiss alert"
        >
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-[7px] gap-y-1 rounded-[8px] bg-white/70 p-2 text-[10px] text-slate-600">
        {lines.map((item) => (
          <span key={item.id}>
            <strong className="font-semibold text-amber-900">{item.qty}×</strong> {item.name}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <strong className="text-[15px] font-semibold text-amber-900">
          {money(round ? round.total : order.total)}
        </strong>
        <span className="text-right text-[9.5px] text-amber-800">
          {isRound
            ? `Added to ${order.customerName}'s bill`
            : waiting > 1
              ? `${waiting} new orders waiting`
              : "Waiting to be accepted"}
        </span>
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <Link
          href={{
            pathname: "/orders",
            query: { loc: order.locId, open: order.code || "direct" },
          }}
          className="flex-1 rounded-[8px] bg-brand-green-deep px-2 py-[7px] text-center text-[10px] font-medium text-white"
          onClick={dismiss}
        >
          View {spotWord(businessType, false).toLowerCase()}
        </Link>
        <button
          type="button"
          className="flex-1 rounded-[8px] border border-brand-yellow/50 px-2 py-[7px] text-[10px] font-medium text-amber-800"
          onClick={dismiss}
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

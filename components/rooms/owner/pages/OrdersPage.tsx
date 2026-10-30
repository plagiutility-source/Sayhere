"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/rooms/shared/icons";
import { PeriodBar } from "../PeriodBar";
import { WaitersCard } from "../WaitersCard";
import { AddWaiterDialog } from "../modals/AddWaiterDialog";
import { InvoiceDialog } from "../modals/InvoiceDialog";
import { PunchDialog } from "../modals/PunchDialog";
import {
  Badge,
  CodePill,
  Delta,
  btnOutline,
  btnPrimary,
  btnSm,
  btnXs,
  cx,
} from "@/components/rooms/shared/ui";
import { PERIODS, type PeriodKey } from "@/lib/rooms/constants";
import { LIVE_ALERT_EVENT } from "@/lib/rooms/detect";
import { simulateOrder } from "@/lib/rooms/simulate";
import {
  deltaLabel,
  displaySpotName,
  formatWhen,
  money,
  orderSpotName,
  periodRangeLabel,
  serviceKindTitle,
  spotWord,
  statusLabel,
} from "@/lib/rooms/format";
import {
  activeServiceCalls,
  activeStatus,
  countNewOrders,
  openSpotCount,
  orderRounds,
  ordersBetween,
  periodWindow,
  previousPeriodWindow,
  resolveServiceCall,
  sendBillToPhone,
  serviceCallSpotName,
  serviceCallsForSpot,
  setOrderStatus,
  statsForRange,
  supportsOrderWifi,
  waiterName,
} from "@/lib/rooms/rules";
import type { Order, Room, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

type OrderFilter = "all" | "new" | "preparing" | "served" | "done";

const FILTERS: Array<[OrderFilter, string]> = [
  ["all", "All"],
  ["new", "New"],
  ["preparing", "Preparing"],
  ["served", "Served"],
  ["done", "Done"],
];

export function OrdersPage() {
  const { state } = useOwner();
  const params = useSearchParams();
  const locId = params.get("loc");
  const open = params.get("open");
  const location = state.locations.find((item) => item.id === locId) ?? state.locations[0];

  if (!location) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location before orders can arrive.
      </div>
    );
  }

  return (
    <OrdersContent
      location={location}
      initialOpen={open ? `${location.id}:${open}` : null}
    />
  );
}

function OrdersContent({
  location,
  initialOpen,
}: {
  location: SpotLocation;
  initialOpen: string | null;
}) {
  const { state, save, toast, businessType } = useOwner();
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [expanded, setExpanded] = useState<string[]>(() =>
    initialOpen ? [initialOpen] : [],
  );
  const previousLocation = useRef(location.id);
  useEffect(() => {
    if (previousLocation.current === location.id) return;
    previousLocation.current = location.id;
    setFilter("all");
    setExpanded([]);
  }, [location.id]);

  useEffect(() => {
    if (!initialOpen) return;
    setExpanded((current) =>
      current.indexOf(initialOpen) === -1 ? [...current, initialOpen] : current,
    );
  }, [initialOpen]);
  const [addWaiterOpen, setAddWaiterOpen] = useState(false);
  const [openBillId, setOpenBillId] = useState<string | null>(null);
  const [punchCode, setPunchCode] = useState<string | null>(null);

  const table = spotWord(businessType, false);
  const tables = spotWord(businessType, true);
  const waiting = countNewOrders(state, location.id);
  const range = periodWindow(period);
  const orders = ordersBetween(state, location.id, range);
  const stats = statsForRange(state, location.id, range);
  const previous = statsForRange(state, location.id, previousPeriodWindow(period));
  const calls = activeServiceCalls(state, location.id);

  const groups: Array<{ room: Room | null; orders: Order[] }> = location.rooms
    .map((room) => ({ room, orders: orders.filter((order) => order.code === room.code) }))
    .filter((group) => group.orders.length > 0);
  const directOrders = orders.filter((order) => !order.code);
  if (directOrders.length) groups.unshift({ room: null, orders: directOrders });

  const filteredGroups = groups
    .map((group) => ({
      room: group.room,
      orders: group.orders.filter((order) => {
        if (filter === "all") return true;
        if (filter === "done") return order.status === "completed" || order.status === "cancelled";
        return order.status === filter;
      }),
    }))
    .filter((group) => group.orders.length > 0);
  const filteredCount = filteredGroups.reduce((sum, group) => sum + group.orders.length, 0);

  const filterCounts: Record<OrderFilter, number> = {
    all: orders.length,
    new: orders.filter((order) => order.status === "new").length,
    preparing: orders.filter((order) => order.status === "preparing").length,
    served: orders.filter((order) => order.status === "served").length,
    done: orders.filter((order) => order.status === "completed" || order.status === "cancelled")
      .length,
  };

  const changePeriod = (key: PeriodKey) => {
    setPeriod(key);
    toast(`Showing ${PERIODS[key].range} — ${periodRangeLabel(key)}.`);
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

  // DEV-ONLY: the demo's simulate-order tool; deleted at merge.
  const simulate = () => {
    const result = simulateOrder(state, location.id);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    const order = result.order;
    const round = orderRounds(order)[0];
    window.dispatchEvent(
      new CustomEvent(LIVE_ALERT_EVENT, {
        detail: {
          orderId: order.id,
          kind: "order",
          roundId: round ? round.id : null,
          at: order.createdAt,
        },
      }),
    );
    const room = location.rooms.find((item) => item.code === order.code) || null;
    toast(
      `New order · ${displaySpotName(businessType, room)} · ${money(order.total)} from ${order.customerName}`,
    );
  };

  const toggleGroup = (key: string) => {
    setExpanded((current) =>
      current.indexOf(key) === -1 ? [...current, key] : current.filter((item) => item !== key),
    );
  };

  const changeStatus = (
    order: Order,
    status: "preparing" | "served" | "completed" | "cancelled",
  ) => {
    const result = setOrderStatus(state, order.id, status);
    if (!result.order) return;
    save(result.state);
    const updated = result.order;
    if (status === "cancelled") {
      toast(`Order #${updated.number} cancelled — no charge.`);
    } else if (status === "completed") {
      toast(
        `#${updated.number} completed — ${orderSpotName(state, updated)} is free and ${waiterName(state, updated.locId, updated.waiterId)} has a slot again.`,
      );
    } else if (status === "preparing" && !order.acceptedAt && updated.code && supportsOrderWifi(businessType)) {
      const wifi = state.configs[`${updated.locId}:rooms`]?.wifi;
      toast(
        wifi && wifi.on
          ? `Order accepted — Wi-Fi is now visible on ${orderSpotName(state, updated)}.`
          : `Order #${updated.number} accepted — the kitchen is preparing it.`,
      );
    } else {
      toast(`Order #${updated.number} · ${statusLabel(status)}.`);
    }
  };

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">Orders</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            {location.name} · {stats.orders} bill{stats.orders === 1 ? "" : "s"} ·{" "}
            {periodRangeLabel(period)}. Grouped by {table.toLowerCase()}, oldest first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} onClick={() => setPunchCode("")}>
            <Icon name="plus" size={15} /> Punch order
          </button>
          {/* DEV-ONLY: simulated customer order; deleted at merge. */}
          <button type="button" className={btnOutline} onClick={simulate}>
            <Icon name="sparkles" size={15} /> Simulate customer order
          </button>
        </div>
      </div>

      <PeriodBar period={period} onChange={changePeriod} />

      {waiting ? (
        <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-yellow/50 bg-amber-50 px-[11px] py-2.5 text-xs leading-[1.5] text-amber-900">
          <Icon name="bell" size={16} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">
              {waiting} new order{waiting === 1 ? "" : "s"}.
            </span>{" "}
            The bell rang and the {table.toLowerCase()} is highlighted below. Open the{" "}
            {table.toLowerCase()} arrow to see the orders and accept.
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-green/[0.18] bg-brand-green/[0.06] px-[11px] py-2.5 text-xs leading-[1.5] text-emerald-900">
          <Icon name="check" size={16} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">You&apos;re caught up.</span> New QR orders ring the bell
            here and show a badge on their own {table.toLowerCase()}.
          </div>
        </div>
      )}

      {calls.length ? (
        <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-yellow/50 bg-amber-50 px-[11px] py-2.5 text-xs leading-[1.5] text-amber-900">
          <Icon name="bell" size={16} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">
              {calls.length} live {table.toLowerCase()} request{calls.length === 1 ? "" : "s"}.
            </span>{" "}
            {calls
              .map(
                (call) =>
                  `${serviceCallSpotName(state, call)} — ${call.kind === "bill" ? "bill" : "waiter"}`,
              )
              .join(" · ")}
            .{" "}
            <a href={`/rooms?loc=${location.id}`} className="font-medium underline">
              Open {tables.toLowerCase()} →
            </a>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <StatCard
          label="Earnings"
          range={PERIODS[period].stat}
          value={money(stats.earnings)}
          foot={
            <Delta
              label={deltaLabel(stats.earnings, previous.earnings, PERIODS[period].previousLabel)}
            />
          }
        />
        <StatCard
          label="Bills"
          range={PERIODS[period].stat}
          value={String(stats.orders)}
          foot={`${money(stats.average)} average · ${money(stats.collected)} collected`}
        />
        <StatCard
          label="Guests"
          range={PERIODS[period].stat}
          value={String(stats.guests)}
          foot={`${stats.averageGuests} per bill · names + optional phones`}
        />
        <StatCard
          label="Open now"
          value={String(openSpotCount(state, location.id))}
          foot={`of ${location.rooms.length} ${tables.toLowerCase()} · ${stats.open} open in range`}
        />
      </div>

      <div className="mt-4 grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_300px]">
        <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex flex-wrap gap-0.5 rounded-[10px] bg-slate-100 p-[3px]"
            role="tablist"
            aria-label="Filter orders"
          >
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-[12.5px] font-medium",
                  filter === key
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
                    : "text-slate-600",
                )}
                onClick={() => setFilter(key)}
              >
                {label}
                {filterCounts[key] ? (
                  <span className="rounded-pill bg-slate-200 px-1.5 text-[10px] font-medium text-slate-700">
                    {filterCounts[key]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <Badge>{filteredCount} shown</Badge>
        </div>

        {filteredGroups.length ? (
          <div className="flex flex-col gap-3">
            {filteredGroups.map((group) => (
              <OrderGroup
                key={group.room ? group.room.code : "direct"}
                location={location}
                room={group.room}
                orders={group.orders}
                expanded={expanded}
                onToggle={toggleGroup}
                onChangeStatus={changeStatus}
                onOpenBill={(order) => setOpenBillId(order.id)}
                onSendBill={sendBill}
                onPunch={(code) => setPunchCode(code)}
              />
            ))}
          </div>
        ) : (
          <section className="rounded-card border border-black/10 bg-white p-7 text-center shadow-soft">
            <strong className="block text-[13px] font-medium text-ink">
              No {filter === "all" ? "bills" : `${filter} bills`} in {PERIODS[period].range}
            </strong>
            <p className="mt-1.5 text-xs leading-[1.55] text-ink-muted">
              Orders placed from a {table.toLowerCase()} QR appear here with the customer&apos;s name
              and a bell at the top of the dashboard.
            </p>
            {/* DEV-ONLY: simulated customer order; deleted at merge. */}
            <button type="button" className={cx(btnPrimary, btnSm, "mt-3")} onClick={simulate}>
              <Icon name="sparkles" size={14} /> Simulate an order
            </button>
          </section>
        )}
        </div>
        <WaitersCard location={location} onAdd={() => setAddWaiterOpen(true)} />
      </div>
      {addWaiterOpen ? (
        <AddWaiterDialog location={location} onClose={() => setAddWaiterOpen(false)} />
      ) : null}
      {punchCode !== null ? (
        <PunchDialog
          location={location}
          initialCode={punchCode}
          onClose={() => setPunchCode(null)}
        />
      ) : null}
      {openBillId
        ? (() => {
            const order = state.orders.find((item) => item.id === openBillId);
            return order ? (
              <InvoiceDialog order={order} onClose={() => setOpenBillId(null)} />
            ) : null;
          })()
        : null}
    </>
  );
}

function StatCard({
  label,
  range,
  value,
  foot,
}: {
  label: string;
  range?: string;
  value: string;
  foot: ReactNode;
}) {
  return (
    <div className="rounded-card border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-baseline gap-1 text-[11.5px] text-ink-muted">
        {label}
        {range ? <span className="text-[10.5px] text-slate-400">{range}</span> : null}
      </div>
      <div className="mt-1 text-xl font-medium leading-tight">{value}</div>
      <div className="mt-1 text-[10.5px] leading-[1.5] text-ink-muted">{foot}</div>
    </div>
  );
}

function OrderGroup({
  location,
  room,
  orders,
  expanded,
  onToggle,
  onChangeStatus,
  onOpenBill,
  onSendBill,
  onPunch,
}: {
  location: SpotLocation;
  room: Room | null;
  orders: Order[];
  expanded: string[];
  onToggle: (key: string) => void;
  onChangeStatus: (order: Order, status: "preparing" | "served" | "cancelled") => void;
  onOpenBill: (order: Order) => void;
  onSendBill: (order: Order) => void;
  onPunch: (code: string) => void;
}) {
  const { state, save, toast, businessType } = useOwner();
  const direct = !room;
  const key = `${location.id}:${direct ? "direct" : room.code}`;
  const isOpen = expanded.indexOf(key) !== -1;
  const spotLabel = direct ? "Direct punch" : displaySpotName(businessType, room);
  const newCount = orders.filter((order) => order.status === "new").length;
  const earnings = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const waiters = Array.from(new Set(orders.map((order) => order.waiterId).filter(Boolean)))
    .map((id) => waiterName(state, location.id, id))
    .join(", ");
  const calls = direct ? [] : serviceCallsForSpot(state, location.id, room.code);
  const billCall = calls.find((call) => call.kind === "bill");
  const billOrder = billCall ? state.orders.find((order) => order.id === billCall.orderId) : null;
  const canSendBill = Boolean(
    billOrder && activeStatus(billOrder.status) && !billOrder.billSentAt,
  );

  const markHandled = (id: string) => {
    const result = resolveServiceCall(state, id);
    if (!result.call) return;
    save(result.state);
    toast(
      `${serviceCallSpotName(state, result.call)} — ${serviceKindTitle(result.call.kind).toLowerCase()} handled.`,
    );
  };

  return (
    <section
      className={cx(
        "overflow-hidden rounded-card border bg-white shadow-soft",
        newCount ? "border-brand-yellow/60" : "border-black/10",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            type="button"
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-control border border-black/10 text-ink-muted hover:bg-surface-muted"
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Hide" : "Show"} orders for ${spotLabel}`}
            title={isOpen ? "Hide orders" : "Show orders"}
            onClick={() => onToggle(key)}
          >
            <Icon name="chevronDown" size={16} className={cx(isOpen && "rotate-180")} />
          </button>
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-brand-blue/10 text-brand-blue">
            <Icon name={direct ? "receipt" : "rooms"} size={17} />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
              {spotLabel}{" "}
              {direct ? <CodePill>NO TABLE</CodePill> : <CodePill>{room.code.toUpperCase()}</CodePill>}
              {newCount ? <Badge tone="new">{newCount} new</Badge> : null}
              {calls.length ? (
                <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-1.5 py-0.5 text-[9.5px] text-amber-800">
                  <Icon name={calls[0].kind === "bill" ? "receipt" : "bell"} size={10} />
                  {calls[0].kind === "bill" ? "Bill requested" : "Call waiter"}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[11px] leading-[1.5] text-ink-muted">
              {direct
                ? "Punched by staff — not tied to a table"
                : waiters
                  ? `Served by ${waiters}`
                  : "No waiter assigned yet"}{" "}
              · {money(earnings)} in this period · {orders.length} bill
              {orders.length === 1 ? "" : "s"} ·{" "}
              {isOpen ? "all orders shown" : "open the arrow to see orders"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {canSendBill && billOrder ? (
            <button
              type="button"
              className={cx(btnPrimary, btnXs)}
              onClick={() => onSendBill(billOrder)}
            >
              <Icon name="receipt" size={12} /> Send bill
            </button>
          ) : null}
          {calls.length ? (
            <button
              type="button"
              className={cx(canSendBill ? btnOutline : btnPrimary, btnXs)}
              onClick={() => markHandled(calls[0].id)}
            >
              <Icon name="check" size={12} /> Mark handled
            </button>
          ) : null}
          <button
            type="button"
            className={cx(btnOutline, btnXs)}
            onClick={() => onPunch(room ? room.code : "")}
          >
            <Icon name="plus" size={12} /> Punch
          </button>
        </div>
      </header>

      {isOpen ? (
        <div className="flex flex-col">
          {orders.map((order, index) => (
            <OrderRow
              key={order.id}
              order={order}
              index={index}
              onChangeStatus={onChangeStatus}
              onOpenBill={onOpenBill}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OrderRow({
  order,
  index,
  onChangeStatus,
  onOpenBill,
}: {
  order: Order;
  index: number;
  onChangeStatus: (order: Order, status: "preparing" | "served" | "cancelled") => void;
  onOpenBill: (order: Order) => void;
}) {
  const { state, businessType } = useOwner();
  const rounds = orderRounds(order);
  const tags: ReactNode[] = [];
  if (rounds.length > 1) {
    tags.push(
      <span
        key="rounds"
        className="rounded-pill bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
        title="Items were added to this same bill"
      >
        {rounds.length} rounds
      </span>,
    );
  }
  const latestRound = rounds[rounds.length - 1];
  if (latestRound && latestRound.by && latestRound.by !== order.customerName) {
    tags.push(
      <span key="by" className="rounded-pill bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
        {latestRound.by}&apos;s round
      </span>,
    );
  }
  if (!order.code) {
    tags.push(
      <span key="direct" className="rounded-pill bg-brand-yellow/20 px-1.5 py-0.5 text-[10px] text-yellow-900">
        Direct punch
      </span>,
    );
  } else if (order.source === "punch") {
    tags.push(
      <span key="punched" className="rounded-pill bg-brand-yellow/20 px-1.5 py-0.5 text-[10px] text-yellow-900">
        Punched
      </span>,
    );
  }
  if (order.payment) {
    tags.push(
      <span key="paid" className="rounded-pill bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-green-deep">
        Paid
      </span>,
    );
  }
  if (order.billSentAt && activeStatus(order.status)) {
    tags.push(
      <span key="sent" className="rounded-pill bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
        Bill sent
      </span>,
    );
  }

  const tone =
    order.status === "new"
      ? "blue"
      : order.status === "preparing"
        ? "amber"
        : order.status === "served"
          ? "green"
          : "neutral";

  return (
    <div className="grid grid-cols-[26px_minmax(0,1.2fr)_minmax(0,1fr)_120px_88px_96px_auto] items-start gap-3 border-b border-black/5 px-4 py-3 text-[11.5px] last:border-b-0 max-[1100px]:grid-cols-[26px_minmax(0,1fr)_auto]">
      <span
        className="mt-0.5 grid h-5 w-5 place-items-center rounded-pill bg-surface-muted text-[10px] font-medium text-slate-600"
        title={`Bill sequence for this ${spotWord(businessType, false).toLowerCase()}`}
      >
        {index + 1}
      </span>
      <div className="min-w-0">
        <strong className="block text-xs font-medium">
          #{order.number}{" "}
          <span className="font-normal text-ink-muted">{formatWhen(order.createdAt)}</span>
        </strong>
        <span className="block">{order.customerName}</span>
        <span className="block text-[10.5px] text-ink-muted">
          {order.phone || "No phone"} · {order.guests} guest{order.guests === 1 ? "" : "s"}
        </span>
        {tags.length ? <span className="mt-1 flex flex-wrap gap-1">{tags}</span> : null}
      </div>
      <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-[10.5px] text-slate-600 max-[1100px]:col-span-2 max-[1100px]:col-start-2">
        {order.items.map((item) => (
          <span key={item.id}>
            <strong className="font-medium">{item.qty}×</strong> {item.name}
          </span>
        ))}
      </div>
      <div className="max-[1100px]:col-span-2 max-[1100px]:col-start-2">
        <span className="inline-flex items-center gap-1 rounded-pill bg-surface-muted px-1.5 py-0.5 text-[10.5px] text-slate-600">
          <Icon name="users" size={12} /> {waiterName(state, order.locId, order.waiterId)}
        </span>
      </div>
      <div className="text-right text-xs font-medium max-[1100px]:col-span-2 max-[1100px]:col-start-2 max-[1100px]:text-left">
        {money(order.total)}
      </div>
      <div className="max-[1100px]:col-span-2 max-[1100px]:col-start-2">
        <Badge tone={tone}>{statusLabel(order.status)}</Badge>
      </div>
      <div className="flex flex-col items-end gap-1.5 max-[1100px]:col-span-2 max-[1100px]:col-start-2 max-[1100px]:items-start">
        {order.status === "new" ? (
          <>
            <button
              type="button"
              className={cx(btnPrimary, btnXs)}
              onClick={() => onChangeStatus(order, "preparing")}
            >
              Accept order
            </button>
            <button
              type="button"
              className={cx(btnOutline, btnXs, "text-red-700")}
              onClick={() => onChangeStatus(order, "cancelled")}
            >
              Cancel
            </button>
          </>
        ) : null}
        {order.status === "preparing" ? (
          <button
            type="button"
            className={cx(btnPrimary, btnXs)}
            onClick={() => onChangeStatus(order, "served")}
          >
            Mark served
          </button>
        ) : null}
        {order.status === "served" ? (
          <button
            type="button"
            className={cx(btnPrimary, btnXs)}
            onClick={() => onOpenBill(order)}
          >
            <Icon name="receipt" size={12} /> Bill &amp; payment
          </button>
        ) : null}
        {order.status === "completed" ? (
          <button
            type="button"
            className={cx(btnOutline, btnXs)}
            onClick={() => onOpenBill(order)}
          >
            <Icon name="receipt" size={12} /> View bill
          </button>
        ) : null}
        {order.status !== "served" && order.status !== "completed" && order.status !== "cancelled" ? (
          <button
            type="button"
            className={cx(btnOutline, btnXs)}
            onClick={() => onOpenBill(order)}
          >
            Bill
          </button>
        ) : null}
        {order.status === "cancelled" ? (
          <span className="text-[10.5px] text-ink-muted">No charge</span>
        ) : null}
      </div>
    </div>
  );
}

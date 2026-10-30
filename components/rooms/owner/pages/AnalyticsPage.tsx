"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/rooms/shared/icons";
import { LocalTime } from "@/components/rooms/shared/LocalTime";
import { PeriodBar } from "../PeriodBar";
import {
  Badge,
  CodePill,
  Delta,
  btnOutline,
  btnPrimary,
  btnSm,
  cx,
} from "@/components/rooms/shared/ui";
import { PERIODS, type PeriodKey } from "@/lib/rooms/constants";
import {
  deltaLabel,
  displaySpotName,
  money,
  orderSpotName,
  periodRangeLabel,
  spotWord,
  statusLabel,
} from "@/lib/rooms/format";
import {
  activeStatus,
  dailySeries,
  orderRounds,
  ordersBetween,
  periodWindow,
  previousPeriodWindow,
  spotMatches,
  waiterName,
} from "@/lib/rooms/rules";
import { downloadReport } from "@/lib/rooms/report";
import type { Order, Room, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

export function AnalyticsPage() {
  const { state } = useOwner();
  const params = useSearchParams();
  const locId = params.get("loc");
  const location = state.locations.find((item) => item.id === locId) ?? state.locations[0];

  if (!location) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location before analytics can show anything.
      </div>
    );
  }

  return <AnalyticsContent location={location} initialSpot={params.get("spot") || "all"} />;
}

function AnalyticsContent({
  location,
  initialSpot,
}: {
  location: SpotLocation;
  initialSpot: string;
}) {
  const { state, toast, businessType } = useOwner();
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [spot, setSpot] = useState(initialSpot);
  const previousBusiness = useRef(businessType);
  const previousLocation = useRef(location.id);
  useEffect(() => {
    if (previousBusiness.current === businessType) return;
    previousBusiness.current = businessType;
    setSpot("all");
  }, [businessType]);
  useEffect(() => {
    if (previousLocation.current === location.id) return;
    previousLocation.current = location.id;
    setSpot("all");
  }, [location.id]);
  const spotLabel = spotWord(businessType, false);
  const spotsLabel = spotWord(businessType, true);

  const allPeriod = ordersBetween(state, location.id, periodWindow(period));
  const previousPeriod = ordersBetween(state, location.id, previousPeriodWindow(period));
  const directOrders = allPeriod.filter((order) => !order.code);
  const spotIsKnown = location.rooms.some((room) => room.code === spot);
  const activeSpot =
    spot === "all" || (spot === "direct" && directOrders.length) || spotIsKnown ? spot : "all";
  const scoped = allPeriod.filter((order) => spotMatches(order, activeSpot));
  const valid = scoped.filter((order) => order.status !== "cancelled");
  const allValid = allPeriod.filter((order) => order.status !== "cancelled");
  const allGuests = allValid.reduce((sum, order) => sum + Number(order.guests || 0), 0);
  const previousScoped = previousPeriod.filter(
    (order) => spotMatches(order, activeSpot) && order.status !== "cancelled",
  );
  const earnings = valid.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const previousEarnings = previousScoped.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );
  const guests = valid.reduce((sum, order) => sum + Number(order.guests || 0), 0);
  const average = valid.length ? Math.round(earnings / valid.length) : 0;
  const collected = valid
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const previousCollected = previousScoped
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const openBills = valid.filter((order) => activeStatus(order.status));
  const newCount = allPeriod.filter((order) => order.status === "new").length;
  const cancelled = scoped.length - valid.length;
  const selectedRoom =
    activeSpot === "all" || activeSpot === "direct"
      ? null
      : location.rooms.find((room) => room.code === activeSpot) || null;
  const selectedLabel =
    activeSpot === "direct"
      ? "Direct punch"
      : selectedRoom
        ? displaySpotName(businessType, selectedRoom)
        : `All ${spotsLabel.toLowerCase()}`;

  const breakdown = location.rooms.map((room) => {
    const spotOrders = allPeriod.filter(
      (order) => order.code === room.code && order.status !== "cancelled",
    );
    return {
      room: room as Room | null,
      key: room.code,
      label: displaySpotName(businessType, room),
      orders: spotOrders.length,
      guests: spotOrders.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: spotOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: spotOrders.some((order) => activeStatus(order.status)),
    };
  });
  const directValid = directOrders.filter((order) => order.status !== "cancelled");
  if (directValid.length) {
    breakdown.push({
      room: null,
      key: "direct",
      label: "Direct punch",
      orders: directValid.length,
      guests: directValid.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: directValid.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: directValid.some((order) => activeStatus(order.status)),
    });
  }
  const totalEarnings = breakdown.reduce((sum, row) => sum + row.earnings, 0);
  const maxEarnings = Math.max(1, ...breakdown.map((row) => row.earnings));
  const days = dailySeries(state, location.id, period);
  const trendMax = Math.max(1, ...days.map((day) => day.earnings));
  const best = days.reduce(
    (top, day) => (day.earnings > top.earnings ? day : top),
    days[0],
  );
  const dayAverage = Math.round(totalEarnings / days.length);
  const activeDays = days.filter((day) => day.orders > 0).length;
  const rangeLabel = periodRangeLabel(period);
  const compare = PERIODS[period].previousLabel;

  const changePeriod = (key: PeriodKey) => {
    setPeriod(key);
    toast(`Showing ${PERIODS[key].range} — ${periodRangeLabel(key)}.`);
  };

  const chooseSpot = (code: string) => {
    setSpot(code);
  };

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">Analytics</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            {location.name} · {PERIODS[period].range}, {rangeLabel}. Earnings and orders by{" "}
            {spotLabel.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] font-medium text-ink"
            aria-label={`Filter by ${spotLabel.toLowerCase()}`}
            value={activeSpot}
            onChange={(event) => chooseSpot(event.target.value)}
          >
            <option value="all">All {spotsLabel.toLowerCase()}</option>
            {location.rooms.map((room) => (
              <option key={room.code} value={room.code}>
                {displaySpotName(businessType, room)} ({room.code.toUpperCase()})
              </option>
            ))}
            {directOrders.length ? (
              <option value="direct">Direct punch · no table</option>
            ) : null}
          </select>
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              downloadReport(
                state,
                location.id,
                period,
                activeSpot === "all" ? null : activeSpot,
                toast,
              )
            }
          >
            <Icon name="download" size={15} /> Download report
          </button>
        </div>
      </div>

      <PeriodBar period={period} onChange={changePeriod} />

      <div className="grid gap-3 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <StatCard
          label={`Earnings · ${selectedLabel}`}
          value={money(earnings)}
          foot={<Delta label={deltaLabel(earnings, previousEarnings, compare)} />}
        />
        <StatCard
          label="Bills"
          range={PERIODS[period].stat}
          value={String(valid.length)}
          foot={`${money(average)} average · ${newCount} new awaiting`}
        />
        <StatCard
          label="Guests"
          value={String(guests)}
          foot={`${valid.length ? Math.round((guests / valid.length) * 10) / 10 : 0} per bill · ${cancelled} cancelled excluded`}
        />
        <StatCard
          label="Collected"
          value={money(collected)}
          foot={
            <>
              <Delta label={deltaLabel(collected, previousCollected, compare)} /> ·{" "}
              {openBills.length} open
            </>
          }
        />
      </div>

      <section className="mt-3 rounded-card border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-medium">Earnings trend</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              {PERIODS[period].range} · all {spotsLabel.toLowerCase()} · day by day
            </p>
          </div>
          <Badge tone="blue">{money(totalEarnings)}</Badge>
        </div>
        <div
          className="mt-3 flex h-[122px] items-end gap-1"
          role="img"
          aria-label={`Daily earnings for ${rangeLabel}`}
        >
          {days.map((day) => (
            <div
              key={day.date.toISOString()}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${day.full} · ${money(day.earnings)} · ${day.orders} bill${
                day.orders === 1 ? "" : "s"
              }`}
            >
              <span className="flex h-[96px] w-full items-end rounded-t-[3px] bg-slate-100">
                <span
                  className="block w-full rounded-t-[3px] bg-brand-blue/70"
                  style={{
                    height: `${
                      day.earnings
                        ? Math.max(6, Math.round((day.earnings / trendMax) * 100))
                        : 0
                    }%`,
                  }}
                />
              </span>
              <span className="w-full truncate text-center text-[8px] text-ink-muted">
                {day.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 text-[10.5px] text-ink-muted">
          <span>
            Best day{" "}
            <strong className="font-medium text-ink">
              {best && best.earnings ? `${best.full} · ${money(best.earnings)}` : "No sales yet"}
            </strong>
          </span>
          <span>
            Daily average <strong className="font-medium text-ink">{money(dayAverage)}</strong>
          </span>
        </div>
      </section>

      <section className="mt-3 rounded-card border border-black/10 bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-2 pt-3">
          <div>
            <p className="text-[12.5px] font-medium">{spotLabel}-wise earnings</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              {PERIODS[period].range} · all {spotsLabel.toLowerCase()}. Click a row to filter the
              whole page.
            </p>
          </div>
          <Badge tone="blue">{money(totalEarnings)} total</Badge>
        </div>
        <div className="px-4 pb-3" role="table" aria-label={`Earnings by ${spotLabel}`}>
          <div
            role="row"
            className="grid grid-cols-[minmax(0,1.4fr)_42px_48px_78px_64px] items-center gap-2 border-b border-black/5 py-1.5 text-[9.5px] uppercase tracking-wide text-slate-400"
          >
            <span>{spotLabel}</span>
            <span>Bills</span>
            <span>Guests</span>
            <span className="text-right">Earnings</span>
            <span>Share</span>
          </div>
          <button
            type="button"
            role="row"
            className={cx(
              "grid w-full grid-cols-[minmax(0,1.4fr)_42px_48px_78px_64px] items-center gap-2 border-b border-black/5 py-2 text-left text-[11px] hover:bg-surface-muted/60",
              activeSpot === "all" && "bg-brand-blue/[0.04]",
            )}
            onClick={() => chooseSpot("all")}
          >
            <span className="flex flex-wrap items-center gap-1.5">
              All {spotsLabel.toLowerCase()} <Badge>{location.rooms.length}</Badge>
            </span>
            <span>{allValid.length}</span>
            <span>{allGuests}</span>
            <span className="text-right text-[11.5px] font-medium">{money(totalEarnings)}</span>
            <span className="h-1 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full w-full rounded-full bg-brand-blue/70" />
            </span>
          </button>
          {breakdown.map((row) => (
            <button
              key={row.key}
              type="button"
              role="row"
              className={cx(
                "grid w-full grid-cols-[minmax(0,1.4fr)_42px_48px_78px_64px] items-center gap-2 border-b border-black/5 py-2 text-left text-[11px] last:border-b-0 hover:bg-surface-muted/60",
                activeSpot === row.key && "bg-brand-blue/[0.04]",
              )}
              onClick={() => chooseSpot(row.key)}
            >
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="min-w-0 truncate">{row.label}</span>
                {row.room ? (
                  <CodePill>{row.room.code.toUpperCase()}</CodePill>
                ) : (
                  <Badge>No table</Badge>
                )}
                {row.open ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green" title="Open order" />
                ) : null}
              </span>
              <span>{row.orders}</span>
              <span>{row.guests}</span>
              <span className="text-right text-[11.5px] font-medium">{money(row.earnings)}</span>
              <span className="h-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-brand-blue/70"
                  style={{ width: `${Math.round((row.earnings / maxEarnings) * 100)}%` }}
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-card border border-black/10 bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div>
            <p className="text-[12.5px] font-medium">Day-wise earnings</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              {rangeLabel} · all {spotsLabel.toLowerCase()} · {activeDays} active day
              {activeDays === 1 ? "" : "s"} · best{" "}
              {best && best.earnings ? `${best.full} (${money(best.earnings)})` : "no sales yet"}
            </p>
          </div>
          <Badge>{money(dayAverage)} / day</Badge>
        </div>
        <div className="px-4 pb-3">
          <div className="grid grid-cols-[minmax(0,1.5fr)_50px_55px_90px] gap-2 border-b border-black/5 py-1.5 text-[9.5px] uppercase tracking-wide text-slate-400">
            <span>Day</span>
            <span>Bills</span>
            <span>Guests</span>
            <span className="text-right">Earnings</span>
          </div>
          {days
            .slice()
            .reverse()
            .map((day) => (
              <div
                key={day.date.toISOString()}
                className={cx(
                  "grid grid-cols-[minmax(0,1.5fr)_50px_55px_90px] gap-2 border-b border-black/5 py-1.5 text-[11px] last:border-b-0",
                  !day.orders && "text-slate-400",
                )}
              >
                <span>{day.full}</span>
                <span>{day.orders}</span>
                <span>{day.guests}</span>
                <span className="text-right font-medium">{money(day.earnings)}</span>
              </div>
            ))}
        </div>
      </section>

      <section className="mt-3 rounded-card border border-black/10 bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div>
            <p className="text-[12.5px] font-medium">Bill details · {selectedLabel}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              Every bill in {PERIODS[period].range}, newest first. The CSV download includes the
              same rows.
            </p>
          </div>
          <button
            type="button"
            className={cx(btnOutline, btnSm)}
            onClick={() =>
              downloadReport(
                state,
                location.id,
                period,
                activeSpot === "all" ? null : activeSpot,
                toast,
              )
            }
          >
            <Icon name="download" size={14} /> CSV
          </button>
        </div>
        {scoped.length ? (
          <div className="flex flex-col">
            {scoped
              .slice()
              .reverse()
              .map((order) => (
                <BillRow key={order.id} order={order} />
              ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-[11px] text-ink-muted">
            No bills for {selectedLabel} in {PERIODS[period].range}. Place one from a{" "}
            {spotLabel.toLowerCase()} QR, use Simulate order, or switch the range.
          </p>
        )}
      </section>
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
  foot: React.ReactNode;
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

function BillRow({ order }: { order: Order }) {
  const { state } = useOwner();
  const rounds = orderRounds(order);
  const tone =
    order.status === "new"
      ? "blue"
      : order.status === "preparing"
        ? "amber"
        : order.status === "served"
          ? "green"
          : "neutral";
  return (
    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_60px_auto] items-start gap-2 border-b border-black/5 px-4 py-2.5 text-[11px] last:border-b-0 max-[1100px]:grid-cols-[minmax(0,1fr)_auto]">
      <span className="min-w-0">
        <strong className="block text-[11.5px] font-medium">
          #{order.number}{" "}
          <span className="font-normal text-ink-muted">
            <LocalTime value={order.createdAt} />
          </span>
        </strong>
        <span className="block text-[10.5px] text-ink-muted">
          {orderSpotName(state, order)} · {order.customerName} · {rounds.length} round
          {rounds.length === 1 ? "" : "s"}
        </span>
      </span>
      <span className="min-w-0 text-[10.5px] leading-[1.5] text-slate-600 max-[1100px]:col-span-2 max-[1100px]:col-start-1">
        {order.items.map((item) => `${item.qty}× ${item.name}`).join(", ")}
      </span>
      <span className="min-w-0 truncate text-[10.5px] text-ink-muted max-[1100px]:col-span-2 max-[1100px]:col-start-1">
        {waiterName(state, order.locId, order.waiterId)}
      </span>
      <span className="text-right text-[11.5px] font-medium max-[1100px]:col-start-2 max-[1100px]:text-left">
        {money(order.total)}
      </span>
      <Badge tone={tone}>{statusLabel(order.status)}</Badge>
    </div>
  );
}

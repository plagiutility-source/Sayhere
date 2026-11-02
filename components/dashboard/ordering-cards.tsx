"use client";

/**
 * Merge M9 — tables/rooms ordering cards on the owner Dashboard and Analytics
 * pages, rendered as a NEW SECTION BELOW the existing review content.
 *
 * Every number comes from the rooms store's real orders for the business's
 * first real location; nothing here reads the standalone demo fixtures. The
 * section only mounts for cafe/restaurant/hotel (`supportsTableOrdering`, the
 * same gate as the sidebar and the live layer), so salon/gym/retail pages
 * render exactly as before.
 *
 * Styling reuses the app's own card, stat-card and bar-chart components; the
 * only injected colour is the business theme's primary, as on the existing
 * dashboard chart.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { useOwner, useOwnerOptional } from "@/components/rooms/owner/OwnerProvider";
import { PeriodBar } from "@/components/rooms/owner/PeriodBar";
import { LocalTime } from "@/components/rooms/shared/LocalTime";
import { getBrandTheme } from "@/lib/brand/theme";
import type { ScanDayBucket } from "@/lib/dashboard/metrics";
import { useRoomsBusiness } from "@/lib/rooms/adapter";
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
  dailySeries,
  ordersBetween,
  periodWindow,
  previousPeriodWindow,
  statsForRange,
} from "@/lib/rooms/rules";
import type { DailyPoint, RangeStats } from "@/lib/rooms/rules";
import type { Order, RoomsState, SpotLocation } from "@/lib/rooms/types";
import { useBusiness } from "@/lib/use-business";
import { BarChart } from "./bar-chart";
import { CardSkeleton, StatCardSkeleton } from "./skeletons";
import { StatCard } from "./stat-card";

type SpotRow = {
  key: string;
  label: string;
  code: string | null;
  orders: number;
  guests: number;
  earnings: number;
  open: boolean;
};

type OrderingView = {
  stats: RangeStats;
  previous: RangeStats;
  days: DailyPoint[];
  buckets: ScanDayBucket[];
  best: DailyPoint | null;
  rows: SpotRow[];
  maxEarnings: number;
  recent: Order[];
};

type StatDelta = { text: string; direction: "up" | "down" | "flat" | "none" };

const OUTLINE_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink hover:bg-surface-muted";
const PRIMARY_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy";

/** The rooms store's daily series in the app's bar-chart bucket shape. */
function buildOrderingView(
  state: RoomsState,
  location: SpotLocation,
  period: PeriodKey,
  now: Date,
): OrderingView {
  const stats = statsForRange(state, location.id, periodWindow(period, now));
  const previous = statsForRange(state, location.id, previousPeriodWindow(period, now));
  const days = dailySeries(state, location.id, period, now);
  const bestIndex = days.reduce(
    (top, day, index) => (day.orders > days[top].orders ? index : top),
    0,
  );
  const best = days[bestIndex] && days[bestIndex].orders > 0 ? days[bestIndex] : null;
  const buckets: ScanDayBucket[] = days.map((day, index) => ({
    label: day.label,
    date: day.date.toISOString(),
    count: day.orders,
    isBusiest: Boolean(best) && index === bestIndex,
  }));

  const valid = ordersBetween(state, location.id, periodWindow(period, now)).filter(
    (order) => order.status !== "cancelled",
  );
  const rows: SpotRow[] = location.rooms.map((room) => {
    const roomOrders = valid.filter((order) => order.code === room.code);
    return {
      key: room.code,
      label: displaySpotName(state.businessType, room),
      code: room.code,
      orders: roomOrders.length,
      guests: roomOrders.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: roomOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: roomOrders.some((order) => order.status !== "completed"),
    };
  });
  const direct = valid.filter((order) => !order.code);
  if (direct.length) {
    rows.push({
      key: "direct",
      label: "Direct punch",
      code: null,
      orders: direct.length,
      guests: direct.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: direct.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: direct.some((order) => order.status !== "completed"),
    });
  }
  const maxEarnings = Math.max(1, ...rows.map((row) => row.earnings));
  const recent = valid
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )
    .slice(0, 4);

  return { stats, previous, days, buckets, best, rows, maxEarnings, recent };
}

function statDelta(current: number, previous: number, previousLabel: string): StatDelta {
  const delta = deltaLabel(current, previous, previousLabel);
  const direction: StatDelta["direction"] =
    delta.tone === "up" || delta.tone === "down" || delta.tone === "flat"
      ? delta.tone
      : "none";
  return { text: delta.text, direction };
}

function LoadingSection() {
  return (
    <section className="flex flex-col gap-3" aria-label="Table ordering loading">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CardSkeleton bodyHeight={160} />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton bodyHeight={140} />
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  location,
  spots,
  period,
}: {
  title: string;
  subtitle: string;
  location: SpotLocation;
  spots: string;
  period: PeriodKey;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium text-ink">{title}</h2>
        <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        <p className="mt-0.5 text-[11px] text-ink-muted">
          {location.name} · {PERIODS[period].range} · live orders.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/rooms?loc=${location.id}`} className={OUTLINE_BUTTON}>
          Manage {spots.toLowerCase()}
        </Link>
        <Link href={`/orders?loc=${location.id}`} className={PRIMARY_BUTTON}>
          Open orders
        </Link>
      </div>
    </div>
  );
}

function NoLocationsCard() {
  return (
    <Card title="Table ordering">
      <div className="py-6 text-center">
        <p className="text-[13px] font-medium text-ink">No locations yet</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Add a location before table orders can appear here.
        </p>
      </div>
    </Card>
  );
}

function SpotRows({
  rows,
  maxEarnings,
  color,
  spots,
}: {
  rows: SpotRow[];
  maxEarnings: number;
  color: string;
  spots: string;
}) {
  if (!rows.length) {
    return (
      <p className="text-[13px] text-ink-muted">
        No {spots.toLowerCase()} yet. Add one from the Tables page to start taking
        orders.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <div
          key={row.key}
          className="border-b border-black/5 py-2.5 first:pt-0 last:border-b-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className="font-medium text-ink">{row.label}</span>
            {row.code ? (
              <span className="rounded-control border border-black/10 bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] tracking-[0.02em] text-ink-muted">
                {row.code.toUpperCase()}
              </span>
            ) : (
              <span className="text-[10px] text-ink-muted">No table</span>
            )}
            {row.open ? (
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-green"
                title="Open bill"
              />
            ) : null}
            <span className="ml-auto tabular-nums text-ink">{money(row.earnings)}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {row.orders} bill{row.orders === 1 ? "" : "s"} · {row.guests} guest
            {row.guests === 1 ? "" : "s"}
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-pill bg-surface-muted">
            <div
              className="h-full rounded-pill"
              style={{
                width: `${Math.round((row.earnings / maxEarnings) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BillList({
  orders,
  state,
}: {
  orders: Order[];
  state: RoomsState;
}) {
  if (!orders.length) {
    return (
      <p className="text-[13px] text-ink-muted">
        No bills yet. A customer order from a table QR, or a punch from the Orders
        page, will appear here.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders?loc=${order.locId}`}
          className="flex flex-wrap items-center gap-2 border-b border-black/5 py-2.5 text-[12px] last:border-b-0 hover:bg-surface-muted/60"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-ink">
              {orderSpotName(state, order)}
            </span>
            <span className="text-[11px] text-ink-muted">
              #{order.number} · <LocalTime value={order.createdAt} mode="time" />
            </span>
          </span>
          <span className="max-w-[40%] truncate text-[11px] text-ink-muted">
            {order.customerName || "Guest"}
          </span>
          <span className="tabular-nums font-medium text-ink">{money(order.total)}</span>
          <span className="text-[11px] text-ink-muted">{statusLabel(order.status)}</span>
        </Link>
      ))}
    </div>
  );
}

function DashboardOrderingBody() {
  const owner = useOwnerOptional();
  if (!owner) return null;
  return <DashboardOrderingContent />;
}

function DashboardOrderingContent() {
  const { state, hydrated } = useOwner();
  const business = useBusiness();
  const theme = useMemo(() => getBrandTheme(business), [business]);
  const [period, setPeriod] = useState<PeriodKey>("today");
  const location = state.locations[0] ?? null;
  const view = useMemo(
    () => (location ? buildOrderingView(state, location, period, new Date()) : null),
    [state, location, period],
  );

  if (!hydrated) return <LoadingSection />;
  if (!location || !view) return <NoLocationsCard />;

  const spots = spotWord(state.businessType, true);
  const spot = spotWord(state.businessType, false);
  const previousLabel = PERIODS[period].previousLabel;

  const summary = view.best
    ? `Busiest day: ${view.best.full}, ${view.best.orders} bill${
        view.best.orders === 1 ? "" : "s"
      }.`
    : "No bills in this period.";

  return (
    <section className="flex flex-col gap-3" aria-label={`${spot} ordering`}>
      <SectionHeader
        title={`${spot} ordering`}
        subtitle={`Live bills from your ${spots.toLowerCase()}, next to your review activity.`}
        location={location}
        spots={spots}
        period={period}
      />

      <PeriodBar period={period} onChange={setPeriod} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Earnings"
          value={money(view.stats.earnings)}
          delta={statDelta(view.stats.earnings, view.previous.earnings, previousLabel)}
        />
        <StatCard
          label="Bills"
          value={String(view.stats.orders)}
          delta={{
            text: `${money(view.stats.average)} average bill · ${view.stats.open} open`,
            direction: "none",
          }}
        />
        <StatCard
          label="Guests"
          value={String(view.stats.guests)}
          delta={{
            text: `${view.stats.averageGuests} per bill · ${view.stats.paidOrders} paid`,
            direction: "none",
          }}
        />
        <StatCard
          label="Collected"
          value={money(view.stats.collected)}
          delta={statDelta(view.stats.collected, view.previous.collected, previousLabel)}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Card title="Bills by day" className="h-full lg:col-span-3">
          <BarChart buckets={view.buckets} color={theme.primary} summary={summary} />
          <p className="mt-3 text-[12px] text-ink-muted">
            {view.best
              ? `Best day ${view.best.full} · ${view.best.orders} bill${
                  view.best.orders === 1 ? "" : "s"
                } · ${money(view.best.earnings)}`
              : `No bills in ${PERIODS[period].range}.`}
          </p>
        </Card>
        <Card title={`${spots} earnings`} className="h-full lg:col-span-2">
          <SpotRows
            rows={view.rows}
            maxEarnings={view.maxEarnings}
            color={theme.primary}
            spots={spots}
          />
          <p className="mt-3 border-t border-black/5 pt-3 text-[12px] text-ink-muted">
            {money(view.rows.reduce((sum, row) => sum + row.earnings, 0))} across{" "}
            {view.rows.length} row{view.rows.length === 1 ? "" : "s"}
          </p>
        </Card>
      </div>

      <Card
        title="Recent bills"
        description={`Newest first · ${periodRangeLabel(period)}. Live orders stay grouped in Orders.`}
      >
        <BillList orders={view.recent} state={state} />
      </Card>
    </section>
  );
}

export function DashboardOrderingSection() {
  const business = useRoomsBusiness();
  if (!business) return null;
  return <DashboardOrderingBody />;
}

function AnalyticsOrderingBody() {
  const owner = useOwnerOptional();
  if (!owner) return null;
  return <AnalyticsOrderingContent />;
}

function AnalyticsOrderingContent() {
  const { state, hydrated } = useOwner();
  const business = useBusiness();
  const theme = useMemo(() => getBrandTheme(business), [business]);
  const [period, setPeriod] = useState<PeriodKey>("today");
  const location = state.locations[0] ?? null;
  const view = useMemo(
    () => (location ? buildOrderingView(state, location, period, new Date()) : null),
    [state, location, period],
  );

  if (!hydrated) return <LoadingSection />;
  if (!location || !view) return <NoLocationsCard />;

  const spots = spotWord(state.businessType, true);
  const spot = spotWord(state.businessType, false);
  const previousLabel = PERIODS[period].previousLabel;
  const totalEarnings = view.rows.reduce((sum, row) => sum + row.earnings, 0);
  const dayAverage = view.days.length
    ? Math.round(totalEarnings / view.days.length)
    : 0;

  return (
    <section className="flex flex-col gap-3" aria-label={`${spot} ordering analytics`}>
      <SectionHeader
        title={`${spot} ordering analytics`}
        subtitle={`Bills and earnings by ${spot.toLowerCase()}, from your live orders.`}
        location={location}
        spots={spots}
        period={period}
      />

      <PeriodBar period={period} onChange={setPeriod} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Earnings"
          value={money(view.stats.earnings)}
          delta={statDelta(view.stats.earnings, view.previous.earnings, previousLabel)}
        />
        <StatCard
          label="Bills"
          value={String(view.stats.orders)}
          delta={{
            text: `${money(view.stats.average)} average · ${view.stats.open} open`,
            direction: "none",
          }}
        />
        <StatCard
          label="Guests"
          value={String(view.stats.guests)}
          delta={{
            text: `${view.stats.averageGuests} per bill · ${view.stats.paidOrders} paid`,
            direction: "none",
          }}
        />
        <StatCard
          label="Collected"
          value={money(view.stats.collected)}
          delta={statDelta(view.stats.collected, view.previous.collected, previousLabel)}
        />
      </div>

      <Card
        title="Bills by day"
        description={`${PERIODS[period].range} · all ${spots.toLowerCase()} · day by day.`}
      >
        <BarChart buckets={view.buckets} color={theme.primary} summary={`Daily bills for ${periodRangeLabel(period)}.`} />
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-ink-muted">
          <span>
            Best day{" "}
            <strong className="font-medium text-ink">
              {view.best
                ? `${view.best.full} · ${money(view.best.earnings)}`
                : "No sales yet"}
            </strong>
          </span>
          <span>
            Daily average{" "}
            <strong className="font-medium text-ink">{money(dayAverage)}</strong>
          </span>
        </div>
      </Card>

      <Card
        title={`${spot}-wise earnings`}
        description={`${PERIODS[period].range} · all ${spots.toLowerCase()}.`}
      >
        <div role="table" aria-label={`Earnings by ${spot.toLowerCase()}`}>
          <div
            role="row"
            className="grid grid-cols-[minmax(0,1fr)_56px_56px_92px] items-center gap-2 border-b border-black/5 pb-1.5 text-[11px] text-ink-muted"
          >
            <span role="columnheader">{spot}</span>
            <span role="columnheader">Bills</span>
            <span role="columnheader">Guests</span>
            <span role="columnheader" className="text-right">
              Earnings
            </span>
          </div>
          {view.rows.length ? (
            view.rows.map((row) => (
              <div
                key={row.key}
                role="row"
                className="border-b border-black/5 py-2 text-[12px] last:border-b-0"
              >
                <div
                  role="cell"
                  className="grid grid-cols-[minmax(0,1fr)_56px_56px_92px] items-center gap-2"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="min-w-0 truncate text-ink">{row.label}</span>
                    {row.code ? (
                      <span className="rounded-control border border-black/10 bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {row.code.toUpperCase()}
                      </span>
                    ) : null}
                    {row.open ? (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-brand-green"
                        title="Open bill"
                      />
                    ) : null}
                  </span>
                  <span className="tabular-nums text-ink-muted">{row.orders}</span>
                  <span className="tabular-nums text-ink-muted">{row.guests}</span>
                  <span className="text-right font-medium tabular-nums text-ink">
                    {money(row.earnings)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-pill bg-surface-muted">
                  <div
                    className="h-full rounded-pill"
                    style={{
                      width: `${Math.round((row.earnings / view.maxEarnings) * 100)}%`,
                      backgroundColor: theme.primary,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-[13px] text-ink-muted">
              No {spots.toLowerCase()} yet. Add one from the Tables page to start
              taking orders.
            </p>
          )}
          <div className="mt-3 border-t border-black/5 pt-3 text-[12px] text-ink-muted">
            {money(totalEarnings)} total · {view.stats.orders} bill
            {view.stats.orders === 1 ? "" : "s"} in {PERIODS[period].range}
          </div>
        </div>
      </Card>

      <Card
        title="Day-wise earnings"
        description={`${periodRangeLabel(period)} · newest first.`}
      >
        <div role="table" aria-label="Day-wise earnings">
          <div
            role="row"
            className="grid grid-cols-[minmax(0,1fr)_56px_56px_92px] items-center gap-2 border-b border-black/5 pb-1.5 text-[11px] text-ink-muted"
          >
            <span role="columnheader">Day</span>
            <span role="columnheader">Bills</span>
            <span role="columnheader">Guests</span>
            <span role="columnheader" className="text-right">
              Earnings
            </span>
          </div>
          {view.days
            .slice()
            .reverse()
            .map((day) => (
              <div
                key={day.date.toISOString()}
                role="row"
                className="grid grid-cols-[minmax(0,1fr)_56px_56px_92px] items-center gap-2 border-b border-black/5 py-2 text-[12px] last:border-b-0"
              >
                <span role="cell" className="min-w-0 truncate text-ink">
                  {day.full}
                </span>
                <span role="cell" className="tabular-nums text-ink-muted">
                  {day.orders}
                </span>
                <span role="cell" className="tabular-nums text-ink-muted">
                  {day.guests}
                </span>
                <span
                  role="cell"
                  className="text-right font-medium tabular-nums text-ink"
                >
                  {money(day.earnings)}
                </span>
              </div>
            ))}
        </div>
      </Card>
    </section>
  );
}

export function AnalyticsOrderingSection() {
  const business = useRoomsBusiness();
  if (!business) return null;
  return <AnalyticsOrderingBody />;
}

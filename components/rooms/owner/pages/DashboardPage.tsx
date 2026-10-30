"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/rooms/shared/icons";
import { QrArt } from "@/components/rooms/shared/QrArt";
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
  formatWhen,
  money,
  orderSpotName,
  periodRangeLabel,
  spotWord,
  statusLabel,
} from "@/lib/rooms/format";
import {
  activeServiceCalls,
  activeStatus,
  countNewOrders,
  dailySeries,
  ordersBetween,
  periodWindow,
  previousPeriodWindow,
  serviceCallSpotName,
  statsForRange,
} from "@/lib/rooms/rules";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import { downloadReport } from "@/lib/rooms/report";
import type { Order, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

export function DashboardPage() {
  const { state } = useOwner();
  const params = useSearchParams();
  const locId = params.get("loc");
  const location = state.locations.find((item) => item.id === locId) ?? state.locations[0];

  if (!location) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location before the dashboard can show anything.
      </div>
    );
  }

  return <DashboardContent location={location} />;
}

function DashboardContent({ location }: { location: SpotLocation }) {
  const { state, toast, businessType, origin } = useOwner();
  const [period, setPeriod] = useState<PeriodKey>("today");
  const spot = spotWord(businessType, false);
  const spots = spotWord(businessType, true);
  const waiting = countNewOrders(state, location.id);
  const range = periodWindow(period);
  const stats = statsForRange(state, location.id, range);
  const previous = statsForRange(state, location.id, previousPeriodWindow(period));
  const calls = activeServiceCalls(state, location.id);
  const orders = ordersBetween(state, location.id, range);
  const recent = orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )
    .slice(0, 4);
  const days = dailySeries(state, location.id, period);
  const max = Math.max(1, ...days.map((day) => day.earnings));
  const best = days.reduce(
    (top, day) => (day.earnings > top.earnings ? day : top),
    days[0],
  );
  const average = Math.round(stats.earnings / days.length);

  const source = orders.filter((order) => order.status !== "cancelled");
  const rows = location.rooms.map((room) => {
    const spotOrders = source.filter((order) => order.code === room.code);
    return {
      key: room.code,
      label: displaySpotName(businessType, room),
      code: room.code,
      orders: spotOrders.length,
      guests: spotOrders.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: spotOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: spotOrders.some((order) => activeStatus(order.status)),
    };
  });
  const direct = source.filter((order) => !order.code);
  if (direct.length) {
    rows.push({
      key: "direct",
      label: "Direct punch",
      code: "",
      orders: direct.length,
      guests: direct.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: direct.reduce((sum, order) => sum + Number(order.total || 0), 0),
      open: direct.some((order) => activeStatus(order.status)),
    });
  }
  const snapshotTotal = rows.reduce((sum, row) => sum + row.earnings, 0);
  const snapshotMax = Math.max(1, ...rows.map((row) => row.earnings));
  const demoCode = location.rooms[0] ? location.rooms[0].code : "reception";
  const demoPath = spotPath(location.slug, demoCode);
  const demoUrl = absoluteUrl(origin, demoPath);

  const changePeriod = (key: PeriodKey) => {
    setPeriod(key);
    toast(`Showing ${PERIODS[key].range} — ${periodRangeLabel(key)}.`);
  };

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">Dashboard</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            {location.name} · {PERIODS[period].range} · live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/analytics?loc=${location.id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-control border border-ink/15 bg-white px-3.5 text-[13px] font-medium text-ink hover:bg-surface-muted"
          >
            <Icon name="analytics" size={15} /> Full analytics
          </Link>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-control border border-ink/15 bg-white px-3.5 text-[13px] font-medium text-ink hover:bg-surface-muted"
            onClick={() => downloadReport(state, location.id, period, null, toast)}
          >
            <Icon name="download" size={15} /> Download report
          </button>
        </div>
      </div>

      <PeriodBar period={period} onChange={changePeriod} />

      {calls.length ? (
        <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-yellow/50 bg-amber-50 px-[11px] py-2.5 text-xs leading-[1.5] text-amber-900">
          <Icon name="bell" size={16} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">
              {calls.length} live {spot.toLowerCase()} request{calls.length === 1 ? "" : "s"}.
            </span>{" "}
            {calls
              .map(
                (call) =>
                  `${serviceCallSpotName(state, call)} — ${call.kind === "bill" ? "bill" : "waiter"}`,
              )
              .join(" · ")}
            .{" "}
            <Link href={`/rooms?loc=${location.id}`} className="font-medium underline">
              Open {spots.toLowerCase()} →
            </Link>
          </div>
        </div>
      ) : null}

      {waiting ? (
        <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-yellow/50 bg-amber-50 px-[11px] py-2.5 text-xs leading-[1.5] text-amber-900">
          <Icon name="alert" size={16} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">
              {waiting} new order{waiting === 1 ? "" : "s"} waiting to be accepted.
            </span>{" "}
            <Link href={`/orders?loc=${location.id}`} className="font-medium underline">
              Open live orders →
            </Link>
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
          foot={`${money(stats.average)} average bill · ${stats.open} open`}
        />
        <StatCard
          label="Guests"
          range={PERIODS[period].stat}
          value={String(stats.guests)}
          foot={`${stats.averageGuests} per bill · ${stats.paidOrders} paid`}
        />
        <StatCard
          label="Collected"
          range={PERIODS[period].stat}
          value={money(stats.collected)}
          foot={
            <Delta
              label={deltaLabel(
                stats.collected,
                previous.collected,
                PERIODS[period].previousLabel,
              )}
            />
          }
        />
      </div>

      <div className="mt-3 grid items-start gap-3 min-[1100px]:grid-cols-2">
        <section className="rounded-card border border-black/10 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-medium">Earnings trend</p>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                {PERIODS[period].range} · all {spots.toLowerCase()} · day by day
              </p>
            </div>
            <Badge tone="blue">{money(stats.earnings)}</Badge>
          </div>
          <div
            className="mt-3 flex h-[122px] items-end gap-1"
            role="img"
            aria-label={`Daily earnings for ${periodRangeLabel(period)}`}
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
                        day.earnings ? Math.max(6, Math.round((day.earnings / max) * 100)) : 0
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
              Daily average <strong className="font-medium text-ink">{money(average)}</strong>
            </span>
          </div>
        </section>

        <section className="rounded-card border border-black/10 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-medium">{spots}-wise earnings</p>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                {PERIODS[period].range} · click for the full report
              </p>
            </div>
            <Link
              href={`/analytics?loc=${location.id}`}
              className="inline-flex h-[29px] items-center rounded-[7px] border border-ink/15 bg-white px-2 text-[11.5px] font-medium hover:bg-surface-muted"
            >
              Analytics
            </Link>
          </div>
          <div className="mt-2 flex flex-col">
            {rows.map((row) => (
              <Link
                key={row.key}
                href={`/analytics?loc=${location.id}`}
                className="flex flex-col gap-1 border-b border-black/5 py-2 last:border-b-0"
              >
                <span className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                  <strong className="font-medium">{row.label}</strong>
                  {row.code ? <CodePill>{row.code.toUpperCase()}</CodePill> : <Badge>No table</Badge>}
                  {row.open ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" title="Open bill" />
                  ) : null}
                  <span className="ml-auto text-[11.5px] font-medium">{money(row.earnings)}</span>
                </span>
                <span className="flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                  <span>
                    {row.orders} bill{row.orders === 1 ? "" : "s"} · {row.guests} guest
                    {row.guests === 1 ? "" : "s"}
                  </span>
                  <span className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-brand-blue/70"
                      style={{
                        width: `${Math.round((row.earnings / snapshotMax) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-2 border-t border-black/5 pt-2 text-[10.5px] text-ink-muted">
            {money(snapshotTotal)} across {rows.length} {rows.length === 1 ? "row" : "rows"}
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-card border border-black/10 bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div>
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium">
              Recent bills <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            </p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              Newest first · {periodRangeLabel(period)}. Live orders stay grouped in Orders.
            </p>
          </div>
          <Link
            href={`/orders?loc=${location.id}`}
            className="inline-flex h-8 items-center rounded-control border border-ink/15 bg-white px-2.5 text-xs font-medium hover:bg-surface-muted"
          >
            View all{waiting ? ` · ${waiting} new` : ""}
          </Link>
        </div>
        {recent.length ? (
          <div className="flex flex-col">
            {recent.map((order) => (
              <MiniOrder key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-[11px] text-ink-muted">
            No bills in {PERIODS[period].range}. Scan a {spot.toLowerCase()} QR or switch the range.
          </p>
        )}
      </section>

      <section className="mt-3 flex flex-col gap-4 rounded-card border border-black/10 bg-white p-4 shadow-soft min-[900px]:flex-row min-[900px]:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-brand-blue">
            <Icon name="sparkles" size={14} /> New feature concept
          </p>
          <h2 className="mt-1.5 text-[17px] font-medium leading-[1.35]">
            One QR per {spot.toLowerCase()}. One page to edit.
          </h2>
          <p className="mt-1.5 max-w-[640px] text-[11.5px] leading-[1.6] text-ink-muted">
            Every {spot.toLowerCase()} gets its own permanent QR and link. All of them open the
            location&apos;s shared {spots.toLowerCase()} page, so a single change updates every QR
            while orders still arrive tagged with the exact {spot.toLowerCase()}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/rooms?loc=${location.id}`} className={cx(btnPrimary, btnSm)}>
              <Icon name="qr" size={14} /> Open {spots.toLowerCase()} QRs
            </Link>
            <Link
              href={`/customer-page?loc=${location.id}&kind=rooms`}
              className={cx(btnOutline, btnSm)}
            >
              <Icon name="edit" size={14} /> Edit {spots.toLowerCase()} page
            </Link>
            <Link href={demoPath} className={cx(btnOutline, btnSm)}>
              <Icon name="external" size={14} /> Preview a {spot.toLowerCase()} QR
            </Link>
          </div>
        </div>
        <div className="w-[146px] shrink-0 self-center rounded-card border border-black/10 bg-white p-2.5 max-[900px]:w-[132px]">
          <QrArt url={demoUrl} />
        </div>
      </section>

      <section
        className="mt-3 flex flex-col rounded-card border border-black/10 bg-white px-4 shadow-soft"
        aria-label="Recent feedback"
      >
        {[
          {
            message: "“Cold brew was excellent and the order arrived in minutes.”",
            meta: `${spot} 2 · 18 min ago · positive`,
            negative: false,
          },
          {
            message: "“Loved the free refill — did not expect that.”",
            meta: `${spot} 1 · 1 hr ago · positive`,
            negative: false,
          },
          {
            message: "“Waiter was busy, but the QR ordering still worked perfectly.”",
            meta: `${spot} 3 · 3 hrs ago · private message`,
            negative: true,
          },
        ].map((feedback) => (
          <div
            key={feedback.meta}
            className="flex items-start gap-2.5 border-b border-black/5 py-3 last:border-b-0"
          >
            <span
              className={cx(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                feedback.negative ? "bg-slate-300" : "bg-brand-green",
              )}
            />
            <div>
              <p className="text-[11.5px] leading-[1.5]">{feedback.message}</p>
              <p className="mt-1 text-[10px] text-ink-muted">{feedback.meta}</p>
            </div>
          </div>
        ))}
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
  range: string;
  value: string;
  foot: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-baseline gap-1 text-[11.5px] text-ink-muted">
        {label} <span className="text-[10.5px] text-slate-400">{range}</span>
      </div>
      <div className="mt-1 text-xl font-medium leading-tight">{value}</div>
      <div className="mt-1 text-[10.5px] leading-[1.5] text-ink-muted">{foot}</div>
    </div>
  );
}

function MiniOrder({ order }: { order: Order }) {
  const { state } = useOwner();
  const tone =
    order.status === "new"
      ? "blue"
      : order.status === "preparing"
        ? "amber"
        : order.status === "served"
          ? "green"
          : "neutral";
  return (
    <Link
      href={`/orders?loc=${order.locId}`}
      className="flex flex-wrap items-center gap-2 border-b border-black/5 px-4 py-2.5 text-[11.5px] last:border-b-0 hover:bg-surface-muted/60"
    >
      <span className="min-w-0 flex-[1.2]">
        <strong className="block font-medium">{orderSpotName(state, order)}</strong>
        <span className="text-[10px] text-ink-muted">
          #{order.number} · {formatWhen(order.createdAt)}
        </span>
      </span>
      <span className="min-w-0 flex-1 text-[11px]">
        {order.customerName}{" "}
        <span className="text-[10px] text-ink-muted">
          · {order.guests} guest{order.guests === 1 ? "" : "s"}
        </span>
      </span>
      <span className="text-[11.5px] font-medium">{money(order.total)}</span>
      <Badge tone={tone}>{statusLabel(order.status)}</Badge>
    </Link>
  );
}

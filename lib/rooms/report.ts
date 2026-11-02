/**
 * The demo's `downloadReport`: a CSV of one period, optionally filtered to a
 * spot. BOM + CRLF, cancelled bills excluded, and every value quoted. The
 * filename names the location slug, scope, period and day.
 */

import {
  dateKey,
  displaySpotName,
  orderSpotName,
  periodRangeLabel,
  spotWord,
  statusLabel,
} from "./format";
import {
  orderRounds,
  ordersBetween,
  periodWindow,
  sourceLabel,
  spotMatches,
  waiterName,
} from "./rules";
import type { PeriodKey } from "./constants";
import type { RoomsState } from "./types";

function csvCell(value: string | number | null | undefined): string {
  const text = String(value == null ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}

export type ReportResult = {
  filename: string;
  content: string;
  count: number;
  label: string;
};

export function buildReport(
  state: RoomsState,
  locId: string,
  period: PeriodKey,
  code: string | null,
  now: Date | number = new Date(),
): ReportResult | null {
  const location = state.locations.find((item) => item.id === locId);
  if (!location) return null;
  const direct = code === "direct";
  const rows = ordersBetween(state, locId, periodWindow(period, now)).filter(
    (order) => order.status !== "cancelled" && spotMatches(order, code),
  );
  const spot = code && !direct ? location.rooms.find((room) => room.code === code) || null : null;
  const label = direct
    ? "Direct punch"
    : spot
      ? displaySpotName(state.businessType, spot)
      : `All ${spotWord(state.businessType, true).toLowerCase()}`;
  const header = [
    "Bill",
    "Placed at",
    "Type",
    "Table / room",
    "QR code",
    "Customer",
    "Phone",
    "Guests",
    "Waiter",
    "Rounds",
    "Items",
    "Total",
    "Status",
    "Payment",
  ];
  const lines = [
    header,
    ...rows.map((order) => [
      order.number,
      new Date(order.createdAt).toLocaleString("en-IN"),
      sourceLabel(order),
      orderSpotName(state, order),
      order.code ? order.code.toUpperCase() : "\u2014",
      order.customerName,
      order.phone || "",
      order.guests,
      waiterName(state, order.locId, order.waiterId),
      orderRounds(order).length,
      order.items.map((item) => `${item.qty} x ${item.name}`).join(" | "),
      order.total,
      statusLabel(order.status),
      order.payment
        ? `${order.payment.mode} ${order.payment.amount}`
        : order.status === "completed"
          ? "Paid"
          : "Unpaid",
    ]),
  ].map((row) => row.map(csvCell).join(","));

  return {
    filename: `syehere-${location.slug}-${direct ? "direct" : spot ? spot.code : "all"}-${period}-${dateKey(now)}.csv`,
    content: `\ufeff${lines.join("\r\n")}`,
    count: rows.length,
    label,
  };
}

export function downloadReport(
  state: RoomsState,
  locId: string,
  period: PeriodKey,
  code: string | null,
  notify: (message: string) => void,
  now: Date | number = new Date(),
): void {
  const report = buildReport(state, locId, period, code, now);
  if (!report) return;
  const blob = new Blob([report.content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = report.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  notify(
    `Report downloaded — ${report.count} bill${report.count === 1 ? "" : "s"} for ${report.label} · ${periodRangeLabel(period)}.`,
  );
}

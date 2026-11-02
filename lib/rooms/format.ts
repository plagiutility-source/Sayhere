/**
 * Formatting helpers, ported from the demo's `app.js`
 * (`money`, `formatTime`, `formatDay`, `formatWhen`, `periodRangeLabel`,
 * `deltaLabel`, `spotWord`, `displaySpotName`, `statusLabel`,
 * `serviceKindLabel/Title`, `orderSpotName`).
 *
 * Deviation (spec-sanctioned): `deltaLabel` returns a tone and plain text
 * instead of an HTML string, because the port may not use
 * `dangerouslySetInnerHTML`. The rendered wording is identical.
 */

import { CURRENCY_LOCALE, CURRENCY_SYMBOL, PERIODS, type PeriodKey } from "./constants";
import type { Order, OrderItem, OrderStatus, Room, RoomsState, ServiceKind } from "./types";

/** `YYYY-M-D` in the browser's local time (the demo's `todayKey`). */
export function dateKey(value?: string | number | Date): string {
  const date = value === undefined ? new Date() : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function isTodayOrder(order: Order, now: Date | string | number = new Date()): boolean {
  return dateKey(order.createdAt) === dateKey(now);
}

export function startOfDay(value?: string | number | Date): Date {
  const date = value === undefined ? new Date() : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function orderItemsTotal(items: OrderItem[] | null | undefined): number {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0,
  );
}

/** `₹180` / `₹1,80,000` — the demo's `money`. */
export function money(value: number | string | null | undefined): string {
  return `${CURRENCY_SYMBOL}${Number(value || 0).toLocaleString(CURRENCY_LOCALE)}`;
}

/**
 * Open item O1 — the SaaS `MenuItem.price` is a string (`"Rs 180"`, and free
 * text such as `"from Rs 1500"`). Returns the first number in the string, or
 * null when there is none: those items cannot be ordered and show "Ask staff".
 */
export function parseMenuPrice(price: string | null | undefined): number | null {
  const match = String(price ?? "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function formatTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString(CURRENCY_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(value: string | number | Date): string {
  return new Date(value).toLocaleDateString(CURRENCY_LOCALE, { day: "numeric", month: "short" });
}

export function formatWhen(value: string | number | Date, now: Date | string | number = new Date()): string {
  if (dateKey(new Date(value)) === dateKey(now)) return formatTime(value);
  return `${formatDay(value)} \u00b7 ${formatTime(value)}`;
}

/** "Today, 30 Oct 2026" / "24 Oct \u2013 30 Oct, 2026" (demo `periodRangeLabel`). */
export function periodRangeLabel(key: PeriodKey, now: Date | string | number = new Date()): string {
  const def = PERIODS[key] || PERIODS.today;
  const end = new Date(now);
  const start = startOfDay(end);
  start.setDate(start.getDate() - (def.days - 1));
  if (def.days === 1) {
    return end.toLocaleDateString(CURRENCY_LOCALE, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = sameYear ? formatDay(start) : `${formatDay(start)} ${start.getFullYear()}`;
  return `${startText} \u2013 ${formatDay(end)}, ${end.getFullYear()}`;
}

export type DeltaTone = "up" | "down" | "flat" | "new" | "none";

export type DeltaLabel = {
  /** Drives the arrow and colour in the UI (`up` / `down` / `flat` / `new` / `none`). */
  tone: DeltaTone;
  /** Wording after the arrow, e.g. "12% vs yesterday". */
  text: string;
  /** Signed percentage change, or null when there is no previous period. */
  percent: number | null;
};

export function deltaLabel(current: number, previous: number, previousLabel: string): DeltaLabel {
  if (!previous) {
    return current
      ? { tone: "new", text: "New in this period", percent: null }
      : { tone: "none", text: "No activity in this period", percent: null };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (!change) return { tone: "flat", text: `Flat vs ${previousLabel}`, percent: 0 };
  return {
    tone: change > 0 ? "up" : "down",
    text: `${Math.abs(change)}% vs ${previousLabel}`,
    percent: change,
  };
}

/** Table/Tables for a cafe or restaurant, Room/Rooms for a hotel. */
export function spotWord(businessType: string, plural: boolean): string {
  const hotel = businessType === "hotel";
  if (hotel) return plural ? "Rooms" : "Room";
  return plural ? "Tables" : "Table";
}

/** Rewrites a leading "Table"/"Room" in the stored name to the current word. */
export function displaySpotName(businessType: string, room: Pick<Room, "name"> | null): string {
  if (!room) return spotWord(businessType, false);
  if (businessType === "hotel") return room.name.replace(/^Table\b/, "Room");
  return room.name.replace(/^Room\b/, "Table");
}

export function statusLabel(status: OrderStatus | string): string {
  const labels: Record<string, string> = {
    new: "New",
    preparing: "Preparing",
    served: "Served",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export function serviceKindLabel(kind: ServiceKind): string {
  return kind === "bill" ? "asked for the bill" : "called a waiter";
}

export function serviceKindTitle(kind: ServiceKind): string {
  return kind === "bill" ? "Bill requested" : "Call waiter";
}

/** "Table 1" / "Room 5" / "Direct punch" / "QR3" (demo `orderSpotName`). */
export function orderSpotName(state: RoomsState, order: Order): string {
  if (!order.code) return "Direct punch";
  const location = state.locations.find((item) => item.id === order.locId);
  const spot = location ? location.rooms.find((room) => room.code === order.code) || null : null;
  return spot ? displaySpotName(state.businessType, spot) : String(order.code || "").toUpperCase();
}

/** "0:42" countdown text for join requests. */
export function joinCountdownText(value: string | number | Date, now: Date | number = new Date()): string {
  const ms = new Date(value).getTime() - new Date(now).getTime();
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "4:59" window text for a paid bill. */
export function billWindowText(ms: number): string {
  const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

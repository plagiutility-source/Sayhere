/**
 * Pure dashboard metrics (PRD.md 5.1 / 5, business-rules.md 1).
 *
 * Every number the dashboard shows is computed here from the mock rows, never
 * hard-coded in a component. Stage 4 keeps these functions and only swaps the
 * data source, so nothing here reads React, the clock or module state: `now` is
 * always passed in.
 *
 * NOT built: "avg rating" (PRD 5.1). No doc defines where a star rating comes
 * from and schema.sql has no rating column — owner decision 2026-10-01, logged
 * as an open question in PROGRESS.md.
 */

import type { MockFeedback, MockScanEvent } from "@/lib/mock/dashboard";

const DAY_MS = 86_400_000;

export type WeekOverWeek = { current: number; previous: number };

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

/** Total scans in the mock window ("Total scans" stat card). */
export function totalScans(scans: readonly MockScanEvent[]): number {
  return scans.length;
}

/** Reviews collected = feedback where the customer left a Google review. */
export function reviewsCollected(feedback: readonly MockFeedback[]): number {
  return feedback.filter((row) => row.google_review_left === 1).length;
}

/** Pending feedback = negative and not yet replied to by the owner. */
export function pendingFeedback(feedback: readonly MockFeedback[]): number {
  return feedback.filter(
    (row) => row.sentiment === "negative" && row.owner_replied === 0,
  ).length;
}

/**
 * Feedback intercepted = negative feedback kept private (never posted to
 * Google). The docs only name the metric (PRD 5); deriving it from
 * `sentiment = negative` is logged as an assumption in PROGRESS.md.
 */
export function feedbackIntercepted(feedback: readonly MockFeedback[]): number {
  return feedback.filter((row) => row.sentiment === "negative").length;
}

export function positiveCount(feedback: readonly MockFeedback[]): number {
  return feedback.filter((row) => row.sentiment === "positive").length;
}

/** Positive rate as a 0..1 fraction (0 when there is no feedback yet). */
export function positiveRate(feedback: readonly MockFeedback[]): number {
  if (feedback.length === 0) return 0;
  return positiveCount(feedback) / feedback.length;
}

// ---------------------------------------------------------------------------
// Window helpers
// ---------------------------------------------------------------------------

function inWindow(
  createdAt: string,
  now: Date,
  fromDaysAgo: number,
  toDaysAgo = 0,
): boolean {
  const t = new Date(createdAt).getTime();
  const start = now.getTime() - fromDaysAgo * DAY_MS;
  const end = now.getTime() - toDaysAgo * DAY_MS;
  return t >= start && t < end;
}

export function countScansInWindow(
  scans: readonly MockScanEvent[],
  now: Date,
  fromDaysAgo: number,
  toDaysAgo = 0,
): number {
  return scans.filter((s) => inWindow(s.created_at, now, fromDaysAgo, toDaysAgo))
    .length;
}

function weekOverWeek<T>(
  items: readonly T[],
  now: Date,
  getDate: (item: T) => string,
  matches: (item: T) => boolean = () => true,
): WeekOverWeek {
  const current = items.filter(
    (item) =>
      matches(item) && inWindow(getDate(item), now, 7, 0),
  ).length;
  const previous = items.filter(
    (item) =>
      matches(item) && inWindow(getDate(item), now, 14, 7),
  ).length;
  return { current, previous };
}

export function scanWeekOverWeek(
  scans: readonly MockScanEvent[],
  now: Date,
): WeekOverWeek {
  return weekOverWeek(scans, now, (s) => s.created_at);
}

export function reviewsWeekOverWeek(
  feedback: readonly MockFeedback[],
  now: Date,
): WeekOverWeek {
  return weekOverWeek(
    feedback,
    now,
    (f) => f.created_at,
    (f) => f.google_review_left === 1,
  );
}

export function pendingWeekOverWeek(
  feedback: readonly MockFeedback[],
  now: Date,
): WeekOverWeek {
  return weekOverWeek(
    feedback,
    now,
    (f) => f.created_at,
    (f) => f.sentiment === "negative" && f.owner_replied === 0,
  );
}

/** Intercepted (negative) feedback per week, for the analytic delta. */
export function interceptedWeekOverWeek(
  feedback: readonly MockFeedback[],
  now: Date,
): WeekOverWeek {
  return weekOverWeek(
    feedback,
    now,
    (f) => f.created_at,
    (f) => f.sentiment === "negative",
  );
}

/** Positive rate within a window, or null when the window has no feedback. */
function rateInWindow(
  feedback: readonly MockFeedback[],
  now: Date,
  fromDaysAgo: number,
  toDaysAgo: number,
): number | null {
  const rows = feedback.filter((f) =>
    inWindow(f.created_at, now, fromDaysAgo, toDaysAgo),
  );
  if (rows.length === 0) return null;
  return positiveCount(rows) / rows.length;
}

export type RateWeekOverWeek = {
  current: number | null;
  previous: number | null;
};

export function positiveRateWeekOverWeek(
  feedback: readonly MockFeedback[],
  now: Date,
): RateWeekOverWeek {
  return {
    current: rateInWindow(feedback, now, 7, 0),
    previous: rateInWindow(feedback, now, 14, 7),
  };
}

/** Delta label for a rate, e.g. "+4pts vs last week". */
export function formatPointsDelta(week: RateWeekOverWeek): {
  text: string;
  direction: "up" | "down" | "flat" | "none";
} {
  const { current, previous } = week;
  if (current === null) return { text: "No data yet", direction: "none" };
  if (previous === null) {
    return {
      text: `${Math.round(current * 100)}% this week`,
      direction: current > 0 ? "up" : "flat",
    };
  }
  const diff = Math.round((current - previous) * 100);
  if (diff === 0) return { text: "Same as last week", direction: "flat" };
  return {
    text: `${diff > 0 ? "+" : "−"}${Math.abs(diff)}pts vs last week`,
    direction: diff > 0 ? "up" : "down",
  };
}

/**
 * Delta label for a stat card. Reads "No data yet" when both weeks are empty
 * (the empty state in PRD 5.2), otherwise a signed percentage (or an absolute
 * count when the previous week was zero).
 */
export function formatDelta(week: WeekOverWeek): {
  text: string;
  direction: "up" | "down" | "flat" | "none";
} {
  const { current, previous } = week;
  if (current === 0 && previous === 0) {
    return { text: "No data yet", direction: "none" };
  }
  if (previous === 0) {
    return {
      text: `+${current} vs last week`,
      direction: current > 0 ? "up" : "flat",
    };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "Same as last week", direction: "flat" };
  const sign = pct > 0 ? "+" : "−"; // true minus sign
  return {
    text: `${sign}${Math.abs(pct)}% vs last week`,
    direction: pct > 0 ? "up" : "down",
  };
}

// ---------------------------------------------------------------------------
// Scan activity chart (daily / weekly / monthly)
// ---------------------------------------------------------------------------

/** Chart period on the dashboard and analytics screens. */
export type ScanRange = "daily" | "weekly" | "monthly";

export const SCAN_RANGES: readonly { id: ScanRange; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type ScanDayBucket = {
  /** Short axis label, e.g. "Thu", "22 Sep" or "Sep". */
  label: string;
  /** Full label for the screen-reader summary, e.g. "Thursday, 24 Sep". */
  fullLabel?: string;
  /** ISO date (UTC) of the START of the bucket. */
  date: string;
  count: number;
  isBusiest: boolean;
};

function countScansBetween(
  scans: readonly MockScanEvent[],
  start: number,
  end: number,
): number {
  return scans.filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= start && t < end;
  }).length;
}

/** Marks the busiest bucket; ties keep the earliest. */
function markBusiest(buckets: ScanDayBucket[]): ScanDayBucket[] {
  const max = Math.max(...buckets.map((b) => b.count));
  if (max > 0) {
    const first = buckets.find((b) => b.count === max);
    if (first) first.isBusiest = true;
  }
  return buckets;
}

function shortDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** Seven daily buckets ending today (oldest first). */
export function dailyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  const buckets: ScanDayBucket[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = new Date(now.getTime() - offset * DAY_MS);
    const start = Date.UTC(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth(),
      dayStart.getUTCDate(),
    );
    const end = start + DAY_MS;
    const weekday = new Date(start).getUTCDay();
    buckets.push({
      label: WEEKDAY_LABELS[weekday],
      fullLabel: `${WEEKDAY_FULL[weekday]}, ${shortDay(start)}`,
      date: new Date(start).toISOString(),
      count: countScansBetween(scans, start, end),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

/** Eight rolling seven-day buckets ending today (oldest first). */
export function weeklyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  const buckets: ScanDayBucket[] = [];
  for (let offset = 7; offset >= 0; offset--) {
    const end = now.getTime() - offset * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    buckets.push({
      label: shortDay(start),
      fullLabel: shortDay(start),
      date: new Date(start).toISOString(),
      count: countScansBetween(scans, start, end),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

/** Six calendar months including the current one (oldest first). */
export function monthlyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  const buckets: ScanDayBucket[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const start = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - offset,
      1,
    );
    const end = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - offset + 1,
      1,
    );
    const startDate = new Date(start);
    const month = startDate.getUTCMonth();
    buckets.push({
      label: MONTHS_SHORT[month],
      fullLabel: `${MONTHS[month]} ${startDate.getUTCFullYear()}`,
      date: startDate.toISOString(),
      count: countScansBetween(scans, start, end),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

/** The chart buckets for the selected period. */
export function scanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
  range: ScanRange,
): ScanDayBucket[] {
  if (range === "weekly") return weeklyScanBuckets(scans, now);
  if (range === "monthly") return monthlyScanBuckets(scans, now);
  return dailyScanBuckets(scans, now);
}

const RANGE_NOUN: Record<ScanRange, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

const RANGE_EMPTY: Record<ScanRange, string> = {
  daily: "No scans in the last 7 days.",
  weekly: "No scans in the last 8 weeks.",
  monthly: "No scans in the last 6 months.",
};

/** Screen-reader summary, e.g. "Busiest week: 24 Sep, 210 scans." */
export function busiestBucketSummary(
  buckets: readonly ScanDayBucket[],
  range: ScanRange,
): string {
  const busiest = buckets.find((b) => b.isBusiest);
  if (!busiest || busiest.count === 0) return RANGE_EMPTY[range];
  const label = busiest.fullLabel ?? busiest.label;
  const scans = busiest.count === 1 ? "1 scan" : `${busiest.count} scans`;
  return `Busiest ${RANGE_NOUN[range]}: ${label}, ${scans}.`;
}

// ---------------------------------------------------------------------------
// Engagement extras (PRD 5.1)
// ---------------------------------------------------------------------------

/**
 * Days since the most recent negative feedback. When there has never been a
 * negative, the streak runs from the earliest feedback row; with no feedback at
 * all the streak is 0 (and the banner is hidden).
 */
export function streakDaysWithoutNegative(
  feedback: readonly MockFeedback[],
  now: Date,
): number {
  if (feedback.length === 0) return 0;
  const negatives = feedback.filter((f) => f.sentiment === "negative");
  if (negatives.length === 0) {
    const earliest = feedback.reduce((min, f) =>
      f.created_at < min.created_at ? f : min,
    );
    return Math.max(0, Math.floor((now.getTime() - new Date(earliest.created_at).getTime()) / DAY_MS));
  }
  const latest = negatives.reduce((max, f) =>
    f.created_at > max.created_at ? f : max,
  );
  return Math.max(0, Math.floor((now.getTime() - new Date(latest.created_at).getTime()) / DAY_MS));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2026-11-01" -> "1 November 2026" (no Intl, so SSR and client match). */
export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Whole-number percentage label, e.g. "72%". */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Short "time ago" label built from whole days (deterministic, no Intl). */
export function timeAgo(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const days = Math.floor(diff / DAY_MS);
  if (days <= 0) {
    const hours = Math.floor(diff / 3_600_000);
    if (hours <= 0) return "just now";
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

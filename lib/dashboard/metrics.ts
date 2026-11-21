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

/** Pending feedback = negative and not yet replied to by the owner. */
export function pendingFeedback(feedback: readonly MockFeedback[]): number {
  return feedback.filter(
    (row) => row.sentiment === "negative" && row.owner_replied === 0,
  ).length;
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

type TimedRow = { created_at: string };

function countBetween<T extends TimedRow>(
  rows: readonly T[],
  start: number,
  end: number,
  matches: (row: T) => boolean = () => true,
): number {
  return rows.filter((row) => {
    const t = new Date(row.created_at).getTime();
    return t >= start && t < end && matches(row);
  }).length;
}

/** Intercepted = negative feedback kept private. */
const isIntercepted = (row: MockFeedback) => row.sentiment === "negative";

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

function dailyBuckets<T extends TimedRow>(
  rows: readonly T[],
  now: Date,
  matches?: (row: T) => boolean,
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
      count: countBetween(rows, start, end, matches),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

function weeklyBuckets<T extends TimedRow>(
  rows: readonly T[],
  now: Date,
  matches?: (row: T) => boolean,
): ScanDayBucket[] {
  const buckets: ScanDayBucket[] = [];
  for (let offset = 7; offset >= 0; offset--) {
    const end = now.getTime() - offset * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    buckets.push({
      label: shortDay(start),
      fullLabel: shortDay(start),
      date: new Date(start).toISOString(),
      count: countBetween(rows, start, end, matches),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

function monthlyBuckets<T extends TimedRow>(
  rows: readonly T[],
  now: Date,
  matches?: (row: T) => boolean,
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
      count: countBetween(rows, start, end, matches),
      isBusiest: false,
    });
  }
  return markBusiest(buckets);
}

/** Seven daily buckets ending today (oldest first). */
export function dailyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  return dailyBuckets(scans, now);
}

/** Eight rolling seven-day buckets ending today (oldest first). */
export function weeklyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  return weeklyBuckets(scans, now);
}

/** Six calendar months including the current one (oldest first). */
export function monthlyScanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
): ScanDayBucket[] {
  return monthlyBuckets(scans, now);
}

/** The scan chart buckets for the selected period. */
export function scanBuckets(
  scans: readonly MockScanEvent[],
  now: Date,
  range: ScanRange,
): ScanDayBucket[] {
  if (range === "weekly") return weeklyBuckets(scans, now);
  if (range === "monthly") return monthlyBuckets(scans, now);
  return dailyBuckets(scans, now);
}

/** The intercepted-feedback chart buckets for the selected period. */
export function feedbackBuckets(
  feedback: readonly MockFeedback[],
  now: Date,
  range: ScanRange,
): ScanDayBucket[] {
  if (range === "weekly") return weeklyBuckets(feedback, now, isIntercepted);
  if (range === "monthly") return monthlyBuckets(feedback, now, isIntercepted);
  return dailyBuckets(feedback, now, isIntercepted);
}

const RANGE_NOUN: Record<ScanRange, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

/** The window each chart range covers, for the total-scans stat card. */
export const SCAN_RANGE_WINDOW: Record<ScanRange, string> = {
  daily: "Last 7 days",
  weekly: "Last 8 weeks",
  monthly: "Last 6 months",
};

/** The two period-aware metrics shown in the activity charts. */
export type ActivityMetric = "scans" | "intercepted";

/** Total scans inside the selected window (the sum of its chart buckets). */
export function scanTotalForRange(
  scans: readonly MockScanEvent[],
  now: Date,
  range: ScanRange,
): number {
  return scanBuckets(scans, now, range).reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
}

/** Intercepted feedback inside the selected window (the sum of its buckets). */
export function interceptedTotalForRange(
  feedback: readonly MockFeedback[],
  now: Date,
  range: ScanRange,
): number {
  return feedbackBuckets(feedback, now, range).reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
}

const RANGE_EMPTY: Record<ActivityMetric, Record<ScanRange, string>> = {
  scans: {
    daily: "No scans in the last 7 days.",
    weekly: "No scans in the last 8 weeks.",
    monthly: "No scans in the last 6 months.",
  },
  intercepted: {
    daily: "No intercepted feedback in the last 7 days.",
    weekly: "No intercepted feedback in the last 8 weeks.",
    monthly: "No intercepted feedback in the last 6 months.",
  },
};

/** Screen-reader summary, e.g. "Busiest week: 24 Sep, 210 scans." */
export function busiestBucketSummary(
  buckets: readonly ScanDayBucket[],
  range: ScanRange,
  metric: ActivityMetric = "scans",
): string {
  const busiest = buckets.find((b) => b.isBusiest);
  if (!busiest || busiest.count === 0) return RANGE_EMPTY[metric][range];
  const label = busiest.fullLabel ?? busiest.label;
  const count =
    metric === "scans"
      ? `${busiest.count} ${busiest.count === 1 ? "scan" : "scans"}`
      : `${busiest.count} intercepted`;
  return `Busiest ${RANGE_NOUN[range]}: ${label}, ${count}.`;
}

// ---------------------------------------------------------------------------
// Engagement extras (PRD 5.1)
// ---------------------------------------------------------------------------

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

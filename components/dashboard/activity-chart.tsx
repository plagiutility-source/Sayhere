"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  busiestBucketSummary,
  feedbackBuckets,
  scanBuckets,
  SCAN_RANGES,
  type ActivityMetric,
  type ScanRange,
} from "@/lib/dashboard/metrics";
import type { MockFeedback, MockScanEvent } from "@/lib/mock/dashboard";
import { BarChart } from "./bar-chart";

const CAPTIONS: Record<
  ActivityMetric,
  Record<ScanRange, { table: string; note: string }>
> = {
  scans: {
    daily: {
      table: "Scans per day in the last 7 days",
      note: "Last 7 days, day by day.",
    },
    weekly: {
      table: "Scans per week in the last 8 weeks",
      note: "Last 8 weeks, week by week.",
    },
    monthly: {
      table: "Scans per month in the last 6 months",
      note: "Last 6 months, month by month.",
    },
  },
  intercepted: {
    daily: {
      table: "Intercepted feedback per day in the last 7 days",
      note: "Last 7 days, day by day.",
    },
    weekly: {
      table: "Intercepted feedback per week in the last 8 weeks",
      note: "Last 8 weeks, week by week.",
    },
    monthly: {
      table: "Intercepted feedback per month in the last 6 months",
      note: "Last 6 months, month by month.",
    },
  },
};

const TITLES: Record<ActivityMetric, string> = {
  scans: "Scans",
  intercepted: "Feedback intercepted",
};

const DESCRIPTIONS: Record<ActivityMetric, string> = {
  scans: "Only scans, counted once. Tap a bar for its exact count.",
  intercepted:
    "Negative feedback kept private, counted once. Tap a bar for its exact count.",
};

/**
 * Period-aware activity chart shared by the dashboard and analytics screens.
 * With `metric="intercepted"` it counts negative feedback kept private instead
 * of scans, using the same daily / weekly / monthly buckets and clickable bars.
 */
export function ActivityChart({
  scans = [],
  feedback = [],
  metric = "scans",
  now,
  color,
  range,
  onRangeChange,
  title,
  description,
  className = "",
}: {
  scans?: readonly MockScanEvent[];
  feedback?: readonly MockFeedback[];
  metric?: ActivityMetric;
  now: Date;
  color: string;
  /** Controlled period, shared with the page's stat card for this metric. */
  range: ScanRange;
  onRangeChange: (range: ScanRange) => void;
  title?: string;
  description?: string;
  className?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // A new period has different buckets, so clear any bar picked in the old one.
  useEffect(() => setSelectedDate(null), [range]);

  const buckets = useMemo(
    () =>
      metric === "intercepted"
        ? feedbackBuckets(feedback, now, range)
        : scanBuckets(scans, now, range),
    [metric, scans, feedback, now, range],
  );
  const summary = busiestBucketSummary(buckets, range, metric);
  const caption = CAPTIONS[metric][range];
  const selected = buckets.find((bucket) => bucket.date === selectedDate) ?? null;
  const unit = metric === "scans" ? "scan" : "intercepted";

  return (
    <Card
      title={title ?? TITLES[metric]}
      description={description ?? DESCRIPTIONS[metric]}
      className={className}
      action={
        <div
          role="group"
          aria-label={metric === "scans" ? "Scan chart period" : "Feedback chart period"}
          className="inline-flex rounded-pill border border-black/10 bg-surface-muted p-0.5"
        >
          {SCAN_RANGES.map((item) => {
            const active = item.id === range;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onRangeChange(item.id)}
                className={`inline-flex h-7 items-center rounded-pill px-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                  active
                    ? "bg-white font-medium text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      }
    >
      <BarChart
        buckets={buckets}
        color={color}
        summary={summary}
        caption={caption.table}
        unitOne={unit}
        unitMany={unit === "scan" ? "scans" : "intercepted"}
        tableHead={metric === "scans" ? "Scans" : "Intercepted"}
        selectedDate={selectedDate}
        onSelect={(date) =>
          setSelectedDate((current) => (current === date ? null : date))
        }
      />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        {selected ? (
          <p role="status" className="text-[12px] font-medium text-ink">
            {selected.fullLabel ?? selected.label}: {selected.count}{" "}
            {selected.count === 1 ? unit : unit === "scan" ? "scans" : "intercepted"}
          </p>
        ) : (
          <p className="text-[12px] text-ink-muted">{summary}</p>
        )}
        <p className="text-[11px] text-ink-muted">
          {selected ? "Tap the bar again to clear." : caption.note}
        </p>
      </div>
    </Card>
  );
}

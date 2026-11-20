"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  busiestBucketSummary,
  scanBuckets,
  SCAN_RANGES,
  type ScanRange,
} from "@/lib/dashboard/metrics";
import type { MockScanEvent } from "@/lib/mock/dashboard";
import { BarChart } from "./bar-chart";

const CAPTIONS: Record<ScanRange, { table: string; note: string }> = {
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
};

/**
 * Scan-only chart: the total number of scans per day, week or month. There is
 * no QR/link split — every scan is one count — and the same component is
 * used on the dashboard and the analytics page.
 */
export function ScanActivity({
  scans,
  now,
  color,
  range,
  onRangeChange,
  title = "Scans",
  description = "Only scans, counted once. Tap a bar for its exact count.",
  className = "",
}: {
  scans: readonly MockScanEvent[];
  now: Date;
  color: string;
  /** Controlled period, shared with the page's total-scans stat card. */
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
    () => scanBuckets(scans, now, range),
    [scans, now, range],
  );
  const summary = busiestBucketSummary(buckets, range);
  const caption = CAPTIONS[range];
  const selected = buckets.find((bucket) => bucket.date === selectedDate) ?? null;

  return (
    <Card
      title={title}
      description={description}
      className={className}
      action={
        <div
          role="group"
          aria-label="Chart period"
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
        selectedDate={selectedDate}
        onSelect={(date) =>
          setSelectedDate((current) => (current === date ? null : date))
        }
      />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        {selected ? (
          <p role="status" className="text-[12px] font-medium text-ink">
            {selected.fullLabel ?? selected.label}: {selected.count}{" "}
            {selected.count === 1 ? "scan" : "scans"}
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

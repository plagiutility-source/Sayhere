"use client";

import type { ScanDayBucket } from "@/lib/dashboard/metrics";

type BarChartProps = {
  buckets: readonly ScanDayBucket[];
  /** Business primary colour from getBrandTheme. */
  color: string;
  /** Screen-reader summary, e.g. "Busiest day: Thursday, 42 scans". */
  summary: string;
  /** Caption for the screen-reader data table, e.g. "Scans per month". */
  caption?: string;
  /** When set, every bar becomes a button that reports its ISO date. */
  onSelect?: (date: string) => void;
  /** ISO date of the bar drawn in full colour (the clicked bar). */
  selectedDate?: string | null;
};

/**
 * Scan activity: one bar per bucket, 160px container, bars capped at 24px wide
 * with 4px rounded top corners and a flush baseline (PRD.md 5.2). The busiest
 * bucket uses the full business colour; the rest use it at 30%. With `onSelect`
 * every bar is a button, so the owner can click a day/week/month to read its
 * exact scan count. A screen-reader summary and a data table expose the same
 * numbers.
 */
export function BarChart({
  buckets,
  color,
  summary,
  caption = "Scans per day in the last 7 days",
  onSelect,
  selectedDate = null,
}: BarChartProps) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const interactive = Boolean(onSelect);

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div
        className="flex h-[160px] items-end gap-2"
        aria-hidden={interactive ? undefined : "true"}
      >
        {buckets.map((bucket) => {
          const selected = selectedDate === bucket.date;
          const height = `${(bucket.count / max) * 100}%`;
          const minHeight = bucket.count > 0 ? 4 : 0;
          const background = bucket.isBusiest || selected ? color : `${color}4D`;
          const label = `${bucket.fullLabel ?? bucket.label}: ${bucket.count} scan${
            bucket.count === 1 ? "" : "s"
          }`;

          if (!interactive) {
            return (
              <div
                key={bucket.date}
                className="flex h-full flex-1 items-end justify-center"
              >
                <div
                  className="w-full max-w-[24px] rounded-t-[4px]"
                  style={{ height, minHeight, backgroundColor: background }}
                />
              </div>
            );
          }

          return (
            <div
              key={bucket.date}
              className="flex h-full flex-1 items-end justify-center"
            >
              <button
                type="button"
                onClick={() => onSelect?.(bucket.date)}
                aria-pressed={selected}
                aria-label={label}
                title={label}
                className="group flex h-full w-full cursor-pointer items-end justify-center rounded-t-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                <span
                  className={`block w-full max-w-[24px] rounded-t-[4px] transition-opacity group-hover:opacity-80 ${
                    selected ? "ring-2 ring-ink/40" : ""
                  }`}
                  style={{ height, minHeight, backgroundColor: background }}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {buckets.map((bucket) => (
          <span
            key={bucket.date}
            className={`flex-1 text-center text-[11px] ${
              bucket.isBusiest || selectedDate === bucket.date
                ? "font-medium text-ink"
                : "text-ink-muted"
            }`}
          >
            {bucket.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Scans</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.date}>
              <td>{bucket.fullLabel ?? bucket.label}</td>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

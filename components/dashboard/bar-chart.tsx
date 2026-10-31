import type { ScanDayBucket } from "@/lib/dashboard/metrics";

type BarChartProps = {
  buckets: readonly ScanDayBucket[];
  /** Business primary colour from getBrandTheme. */
  color: string;
  /** Screen-reader summary, e.g. "Busiest day: Thursday, 42 scans". */
  summary: string;
};

/**
 * Weekly scan activity: 7 bars, 160px container, bars capped at 24px wide with
 * 4px rounded top corners and a flush baseline (PRD.md 5.2). The busiest day
 * uses the full business colour; the rest use it at 30%. A screen-reader
 * summary and a data table expose the same numbers.
 */
export function BarChart({ buckets, color, summary }: BarChartProps) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div className="flex h-[160px] items-end gap-2" aria-hidden="true">
        {buckets.map((bucket) => (
          <div
            key={bucket.date}
            className="flex h-full flex-1 items-end justify-center"
          >
            <div
              className="w-full max-w-[24px] rounded-t-[4px]"
              style={{
                height: `${(bucket.count / max) * 100}%`,
                minHeight: bucket.count > 0 ? 4 : 0,
                backgroundColor: bucket.isBusiest ? color : `${color}4D`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {buckets.map((bucket) => (
          <span
            key={bucket.date}
            className={`flex-1 text-center text-[11px] ${
              bucket.isBusiest ? "font-medium text-ink" : "text-ink-muted"
            }`}
          >
            {bucket.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Scans per day in the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Scans</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.date}>
              <td>{bucket.label}</td>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

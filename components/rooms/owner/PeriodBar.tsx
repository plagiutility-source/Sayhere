"use client";

import { PERIODS, type PeriodKey } from "@/lib/rooms/constants";
import { periodRangeLabel } from "@/lib/rooms/format";
import { cx } from "@/components/rooms/shared/ui";

/** The demo's `renderPeriodBar`: Today / Week / 15 days / Month plus the range. */
export function PeriodBar({
  period,
  onChange,
}: {
  period: PeriodKey;
  onChange: (key: PeriodKey) => void;
}) {
  const def = PERIODS[period] || PERIODS.today;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div
        className="inline-flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]"
        role="tablist"
        aria-label="Date range"
      >
        {(Object.keys(PERIODS) as PeriodKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={period === key}
            title={PERIODS[key].range}
            className={cx(
              "inline-flex h-8 items-center rounded-control px-3 text-[12.5px] font-medium",
              period === key
                ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
                : "text-slate-600",
            )}
            onClick={() => onChange(key)}
          >
            {PERIODS[key].label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        <span>Showing {def.range}</span>
        <strong className="font-medium text-ink">{periodRangeLabel(period)}</strong>
      </div>
    </div>
  );
}

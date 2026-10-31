import type { WeekOverWeek } from "@/lib/dashboard/metrics";
import { formatDelta } from "@/lib/dashboard/metrics";

type DeltaDisplay = {
  text: string;
  direction: "up" | "down" | "flat" | "none";
};

type StatCardProps = {
  label: string;
  value: string;
  /** Pass a week-over-week pair, or a precomputed delta (e.g. points). */
  week?: WeekOverWeek;
  delta?: DeltaDisplay;
};

const DIRECTION_CLASS: Record<string, string> = {
  up: "text-brand-green-deep",
  down: "text-ink-muted",
  flat: "text-ink-muted",
  none: "text-ink-muted",
};

/**
 * One stat card: label (12px sentence case), value (24px medium, tabular),
 * week-over-week delta (11px). Fixed min-height 88px so the grid never jumps
 * (PRD.md 5.2).
 */
export function StatCard({ label, value, week, delta: provided }: StatCardProps) {
  const delta = provided ?? (week ? formatDelta(week) : { text: "", direction: "none" as const });
  return (
    <div className="flex min-h-[88px] flex-col justify-between rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className="mt-2 text-[24px] font-medium leading-none tabular-nums text-ink">
        {value}
      </p>
      <p className={`mt-2 text-[11px] ${DIRECTION_CLASS[delta.direction]}`}>
        {delta.text}
      </p>
    </div>
  );
}

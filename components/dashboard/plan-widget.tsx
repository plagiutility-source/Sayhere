import { formatLongDate } from "@/lib/dashboard/metrics";
import type { MockPlanStatus } from "@/lib/mock/dashboard";
import { limitLabel, type Plan } from "@/lib/mock/plans";

type PlanWidgetProps = {
  status: MockPlanStatus;
  plan: Plan;
  /** Business primary colour from getBrandTheme. */
  color: string;
};

/**
 * Plan status (PRD.md 5): plan name, scans used / limit with a progress bar,
 * locations used / limit, and the date the scan count resets. All limits come
 * from `lib/mock/plans.ts`.
 */
export function PlanWidget({ status, plan, color }: PlanWidgetProps) {
  const pct =
    status.scan_limit !== null && status.scan_limit > 0
      ? Math.min(100, Math.round((status.scans_used / status.scan_limit) * 100))
      : 0;

  return (
    <div className="flex h-full flex-col rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] text-ink-muted">Current plan</p>
        <p className="text-[13px] font-medium text-ink">{plan.name}</p>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="text-ink-muted">Scans used</span>
          <span className="tabular-nums text-ink">
            {limitLabel(status.scans_used)} / {limitLabel(status.scan_limit)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Scans used this cycle"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-surface-muted"
        >
          <div
            className="h-full rounded-pill"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between text-[12px]">
        <span className="text-ink-muted">Locations</span>
        <span className="tabular-nums text-ink">
          {limitLabel(status.locations_used)} /{" "}
          {limitLabel(status.location_limit)}
        </span>
      </div>

      <p className="mt-auto pt-4 text-[12px] text-ink-muted">
        Scan count resets on {formatLongDate(status.scan_reset_at)}.
      </p>
    </div>
  );
}

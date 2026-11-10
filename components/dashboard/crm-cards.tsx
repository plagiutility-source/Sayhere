"use client";

/**
 * CRM cards on the dashboard and analytics pages. Rendered only for the four
 * general-category types on Pro+, so café/restaurant/hotel pages keep their
 * existing content unchanged. Numbers come from the same mock CRM store as
 * `/crm`; plan gating is shared with the nav and routes.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Card } from "@/components/card";
import type { CrmBusinessType } from "@/lib/crm/access";
import { supportsCrm, supportsCrmType } from "@/lib/crm/access";
import { defaultCrmConfig } from "@/lib/crm/config";
import { crmStats } from "@/lib/crm/rules";
import { withDemo } from "@/lib/mock/demo";
import type { PlanId } from "@/lib/mock/plans";
import { useCrm } from "@/lib/use-crm";
import { useBusiness } from "@/lib/use-business";
import { CardSkeleton, StatCardSkeleton } from "./skeletons";
import { StatCard } from "./stat-card";

function CrmLoadingSection() {
  return (
    <section className="flex flex-col gap-3" aria-busy="true" aria-label="Loading contacts">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <CardSkeleton bodyHeight={140} />
    </section>
  );
}

function CrmSectionBody({
  type,
  variant,
}: {
  type: CrmBusinessType;
  variant: "dashboard" | "analytics";
}) {
  const fallback = useMemo(() => defaultCrmConfig(type), [type]);
  const demo = useSearchParams().get("demo");
  const { state } = useCrm(fallback);

  if (!state) return <CrmLoadingSection />;

  const stats = crmStats(state);
  const tasksEnabled = state.config.modules.tasks;
  const pipelineEnabled = state.config.modules.pipeline;
  const won = stats.byStage
    .filter((row) => row.stage.kind === "won")
    .reduce((sum, row) => sum + row.count, 0);
  const conversion = stats.total ? Math.round((won / stats.total) * 100) : 0;
  const max = Math.max(1, ...stats.byStage.map((row) => row.count));

  return (
    <section className="flex flex-col gap-3" aria-label="Contacts and pipeline">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-medium text-ink">
            {variant === "dashboard" ? "Contacts" : "Contacts and pipeline"}
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            {variant === "dashboard"
              ? "Your pipeline at a glance, next to your review activity."
              : "How contacts move through the stages you defined."}
          </p>
        </div>
        <Link
          href={withDemo("/crm", demo)}
          className="text-[12px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          Open contacts
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contacts"
          value={String(stats.total)}
          delta={{
            text: `${stats.new30} new in the last 30 days`,
            direction: "none",
          }}
        />
        {variant === "dashboard" ? (
          <>
            <StatCard
              label={tasksEnabled ? "Tasks due today" : "New (30 days)"}
              value={String(tasksEnabled ? stats.tasksDue : stats.new30)}
              delta={{
                text: tasksEnabled
                  ? `${stats.tasksOverdue} overdue`
                  : "Added in the last 30 days",
                direction:
                  tasksEnabled && stats.tasksOverdue ? "down" : "none",
              }}
            />
            <StatCard
              label="Opted in"
              value={String(stats.optedIn)}
              delta={{
                text: "Consent recorded for later",
                direction: "none",
              }}
            />
            <StatCard
              label="Won"
              value={String(won)}
              delta={{
                text: `${conversion}% of all contacts`,
                direction: "none",
              }}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Won"
              value={String(won)}
              delta={{
                text: `${conversion}% conversion`,
                direction: "none",
              }}
            />
            <StatCard
              label="Opted in"
              value={String(stats.optedIn)}
              delta={{
                text: `${stats.total ? Math.round((stats.optedIn / stats.total) * 100) : 0}% of contacts`,
                direction: "none",
              }}
            />
            <StatCard
              label={tasksEnabled ? "Open tasks" : "Stages"}
              value={String(
                tasksEnabled
                  ? state.tasks.filter((task) => task.status === "open").length
                  : stats.byStage.length,
              )}
              delta={{
                text: tasksEnabled
                  ? `${stats.tasksDue} due today · ${stats.tasksOverdue} overdue`
                  : "In your pipeline",
                direction:
                  tasksEnabled && stats.tasksOverdue ? "down" : "none",
              }}
            />
          </>
        )}
      </div>

      {pipelineEnabled ? (
      <Card
        title="Pipeline"
        description={`${stats.total} contact${stats.total === 1 ? "" : "s"} across ${stats.byStage.length} stages.`}
      >
        <div className="flex flex-col gap-3">
          {stats.byStage.map((row) => (
            <div key={row.stage.id}>
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="flex items-center gap-1.5 text-ink">
                  {row.stage.name}
                  {row.stage.kind !== "open" ? (
                    <span className="rounded-pill bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted">
                      {row.stage.kind}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-ink-muted">{row.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-surface-muted">
                <div
                  className="h-full rounded-pill bg-brand-blue"
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      ) : null}
    </section>
  );
}

function CrmSection({
  planId,
  variant,
}: {
  planId: PlanId;
  variant: "dashboard" | "analytics";
}) {
  const business = useBusiness();
  if (!supportsCrm(business.business_type, planId)) return null;
  if (!supportsCrmType(business.business_type)) return null;
  return <CrmSectionBody type={business.business_type} variant={variant} />;
}

export function DashboardCrmSection({ planId }: { planId: PlanId }) {
  return <CrmSection planId={planId} variant="dashboard" />;
}

export function AnalyticsCrmSection({ planId }: { planId: PlanId }) {
  return <CrmSection planId={planId} variant="analytics" />;
}

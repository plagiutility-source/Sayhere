"use client";

/**
 * Route gate for the CRM. The business type and the mock plan live in client
 * storage, so the real check has to run after mount. Before mount we show the
 * page skeleton, so the static café profile never flashes a 404.
 *
 * Access is exactly `supportsCrm`: salon, gym, retail and other on Starter or
 * above. Free, café, restaurant, hotel and unknown types get the branded 404.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { CardSkeleton, StatCardSkeleton } from "@/components/dashboard/skeletons";
import { crmLimitsFor, supportsCrm } from "@/lib/crm/access";
import { getDashboardMock } from "@/lib/mock/dashboard";
import { resolveDemoScenario } from "@/lib/mock/demo";
import { seedCrmDemoBusiness } from "@/lib/mock/crm-demo";
import { useBusiness } from "@/lib/use-business";

export function CrmLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading contacts">
      <div>
        <div className="h-6 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <CardSkeleton bodyHeight={120} />
      <CardSkeleton bodyHeight={220} />
    </div>
  );
}

export function CrmNotFound() {
  return (
    <div className="mx-auto max-w-xl py-3xl text-center">
      <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
        404
      </p>
      <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">
        Contacts are available on Starter and above for salons, gyms, retail and
        other businesses. The link may also be out of date.
      </p>
      <div className="mt-2xl flex flex-wrap justify-center gap-md">
        <ButtonLink href="/dashboard" size="lg">
          Back to dashboard
        </ButtonLink>
        <ButtonLink href="/billing" variant="secondary" size="lg">
          View plans
        </ButtonLink>
      </div>
    </div>
  );
}

export function CrmHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function CrmGate({ children }: { children: ReactNode }) {
  const business = useBusiness();
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo");
  const scenario = resolveDemoScenario(demo);
  const plan = getDashboardMock(scenario).plan;
  const [mounted, setMounted] = useState(false);
  const seeded = useRef(false);
  const hasAccess = supportsCrm(business.business_type, plan.id);
  // A shared demo URL can arrive before onboarding has seeded a profile, or
  // before the browser has run the demo entry route. Seed only when a demo
  // scenario is explicitly requested and its plan includes the CRM.
  const shouldSeed =
    mounted && Boolean(demo) && crmLimitsFor(plan.id) !== null && !hasAccess;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!shouldSeed || seeded.current) return;
    seeded.current = true;
    seedCrmDemoBusiness();
  }, [shouldSeed]);

  if (!mounted || shouldSeed) return <CrmLoading />;
  if (!hasAccess) return <CrmNotFound />;
  return <>{children}</>;
}

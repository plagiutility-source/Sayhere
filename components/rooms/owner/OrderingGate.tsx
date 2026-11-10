"use client";

/**
 * Route gate for the ordering-only pages. The business type and the plan live
 * in client storage, so the check has to run on the client.
 *
 * Two different refusals:
 * - The category never gets ordering (salon, gym, retail, other, unknown): the
 *   app's normal branded 404, exactly as before.
 * - The category gets ordering but the plan does not (café/hotel on Starter):
 *   a plan-feature panel with an upgrade link, not a 404, because the page
 *   exists for this business on Pro and Growth.
 */

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { getDashboardMock } from "@/lib/mock/dashboard";
import { resolveDemoScenario } from "@/lib/mock/demo";
import { supportsOrdering } from "@/lib/plan-features";
import { useBusiness } from "@/lib/use-business";
import { useOwnerOptional } from "./OwnerProvider";

/**
 * The gate runs on the client because the mock business type lives in
 * localStorage, so a real server-side 404 is not possible. Calling
 * `notFound()` here would hit the route error boundary instead of Next's
 * not-found boundary, so render the branded 404 directly. The live provider
 * is also checked so a type change (café -> salon) cannot leave a child
 * calling `useOwner` after its provider has unmounted.
 */
function OrderingNotFound() {
  return (
    <div className="mx-auto max-w-xl py-3xl text-center">
      <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
        404
      </p>
      <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-2xl flex flex-wrap justify-center gap-md">
        <ButtonLink href="/dashboard" size="lg">
          Back to dashboard
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}

export function OrderingGate({ children }: { children: ReactNode }) {
  const business = useBusiness();
  const owner = useOwnerOptional();
  const searchParams = useSearchParams();
  const demo = resolveDemoScenario(searchParams.get("demo"));
  const plan = getDashboardMock(demo).plan;

  if (!owner || !supportsTableOrdering(business.business_type)) {
    return <OrderingNotFound />;
  }

  if (!supportsOrdering(business.business_type, plan.id)) {
    return (
      <PlanFeatureGate
        title="Ordering is not included on your plan"
        message={`Table and room ordering is included on Pro, Growth and Enterprise. You are on ${plan.name}. Loyalty and the rest of your review product keep working as before.`}
        demo={demo}
      />
    );
  }

  return <>{children}</>;
}

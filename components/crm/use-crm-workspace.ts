"use client";

/**
 * Shared wiring for the three CRM screens: business profile, demo scenario,
 * plan gate, limits and the mock store. One hook so every screen agrees on the
 * same access decision and the same localStorage blob.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  defaultCrmConfig,
  type CrmConfig,
} from "@/lib/crm/config";
import {
  crmLimitsFor,
  supportsCrmType,
} from "@/lib/crm/access";
import { getDashboardMock } from "@/lib/mock/dashboard";
import { resolveDemoScenario } from "@/lib/mock/demo";
import type { Plan } from "@/lib/mock/plans";
import { useCrm } from "@/lib/use-crm";
import { useBusiness } from "@/lib/use-business";

export type CrmWorkspace = {
  state: ReturnType<typeof useCrm>["state"];
  update: ReturnType<typeof useCrm>["update"];
  reset: ReturnType<typeof useCrm>["reset"];
  plan: Plan;
  demo: string | null;
  demoSuffix: string;
  fallback: CrmConfig | null;
  limits: ReturnType<typeof crmLimitsFor>;
};

export function useCrmWorkspace(): CrmWorkspace {
  const business = useBusiness();
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo");
  const scenario = resolveDemoScenario(demo);
  const plan = useMemo(() => getDashboardMock(scenario).plan, [scenario]);
  // The business profile is read from localStorage after mount. Wait for that
  // read before choosing a preset, so a salon never seeds the "other" preset.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const crmType =
    hydrated && supportsCrmType(business.business_type)
      ? business.business_type
      : null;
  const fallback = useMemo(
    () => (crmType ? defaultCrmConfig(crmType) : null),
    [crmType],
  );
  const { state, update, reset } = useCrm(fallback);
  const limits = crmLimitsFor(plan.id);
  const demoSuffix = demo ? `?demo=${encodeURIComponent(demo)}` : "";

  return { state, update, reset, plan, demo, demoSuffix, fallback, limits };
}

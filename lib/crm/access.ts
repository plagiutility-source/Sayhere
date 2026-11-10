/**
 * The CRM access gate.
 *
 * Approved scope (CRM_FEATURE.md): salon, gym, retail and other businesses on
 * Pro or above (2026-11-09 pricing restructure; Starter no longer includes the
 * CRM). Café, restaurant and hotel keep table/room ordering and are false here
 * in v1. Everything fails closed: unknown, missing or wrongly-cased types and
 * plans without a `crm` block get no access.
 */

import type { PlanId } from "@/lib/mock/plans";
import { plans, type CrmPlanLimits } from "@/lib/mock/plans";

/** The only business types that get the CRM in v1. */
export const CRM_BUSINESS_TYPES = ["salon", "gym", "retail", "other"] as const;

export type CrmBusinessType = (typeof CRM_BUSINESS_TYPES)[number];

/** True only for the four general-category types. */
export function supportsCrmType(value: unknown): value is CrmBusinessType {
  return (
    typeof value === "string" &&
    (CRM_BUSINESS_TYPES as readonly string[]).includes(value)
  );
}

/** The plan's CRM limits, or null when the plan does not include CRM. */
export function crmLimitsFor(
  planId: PlanId | null | undefined,
): CrmPlanLimits | null {
  if (!planId) return null;
  return plans[planId]?.crm ?? null;
}

/** The one access decision used by the nav, the routes and the dashboard cards. */
export function supportsCrm(
  businessType: unknown,
  planId: PlanId | null | undefined,
): boolean {
  return supportsCrmType(businessType) && crmLimitsFor(planId) !== null;
}

/**
 * The plan + category feature gate — the ONE place that answers "does this
 * business get this feature?".
 *
 * Pricing restructure (2026-11-09, owner request):
 * - Starter ₹199: the review product only (review funnel, customer page,
 *   feedback, analytics). No loyalty, no table/room ordering, no CRM and no
 *   Google auto-reply.
 * - Pro ₹299: adds loyalty, plus ONE category feature — table/room ordering for
 *   café, restaurant and hotel, or the CRM for salon, gym, retail and other.
 * - Growth ₹499: everything, including Google auto-reply.
 *
 * The category decision is not copied here: `supportsTableOrdering` owns which
 * types get ordering and `supportsCrm` owns which types get the CRM. This module
 * only adds the plan flag on top, so every surface (nav, routes, dashboard
 * cards, editor) uses the same answer. Unknown or missing plans fail closed.
 */

import { supportsTableOrdering } from "@/lib/category/ordering";
import { plans, type PlanId } from "@/lib/mock/plans";

/** True when the plan includes the loyalty card and rewards. */
export function supportsLoyalty(
  planId: PlanId | null | undefined,
): boolean {
  if (!planId) return false;
  return plans[planId]?.loyalty === true;
}

/** True for café, restaurant and hotel on a plan that includes ordering. */
export function supportsOrdering(
  businessType: unknown,
  planId: PlanId | null | undefined,
): boolean {
  if (!planId) return false;
  return supportsTableOrdering(businessType) && plans[planId]?.table_ordering === true;
}

/** Re-exported so callers need one import for all three paid features. */
export { supportsCrm } from "@/lib/crm/access";

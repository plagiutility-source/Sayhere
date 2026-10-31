/**
 * MOCK ONLY, replaced in Stage 6.
 *
 * Billing state for `/billing`, keyed by demo scenario. Field names mirror
 * schema.sql so Stage 6 can swap this module for real queries:
 * - `subscriptions`: plan, status, current_period_start, current_period_end,
 *   grace_period_ends_at, cancel_at_period_end (business-rules.md 5.2);
 * - `cancellation_requests`: reason, feedback_text, status, created_at
 *   (business-rules.md 5.1);
 * - `payment_attempts`: plan, amount_paise, currency, status, paid_at.
 *
 * The plan override also lives here: `lib/mock/dashboard.ts` asks for it, so an
 * upgrade in the mock changes the plan everywhere (dashboard shell, customer
 * page limits). Amounts always come from `lib/mock/plans.ts`, never hard-coded.
 */

import type { DemoScenario } from "@/lib/mock/demo";
import { plans, type PlanId } from "@/lib/mock/plans";

export type MockSubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "suspended";

/** business-rules.md 5.1. */
export type MockCancellationStatus =
  | "pending"
  | "contacted"
  | "retained"
  | "finalized"
  | "withdrawn";

export type MockPaymentStatus =
  | "created"
  | "paid"
  | "failed"
  | "amount_mismatch";

export type MockPaymentAttempt = {
  id: string;
  plan: PlanId;
  amount_paise: number;
  currency: "INR";
  status: MockPaymentStatus;
  created_at: string;
  paid_at: string | null;
};

export type MockCancellationRequest = {
  reason: string;
  feedback_text: string | null;
  status: MockCancellationStatus;
  created_at: string;
};

export type MockBilling = {
  subscription: {
    plan: PlanId;
    status: MockSubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    grace_period_ends_at: string | null;
    cancel_at_period_end: 0 | 1;
  };
  /** A downgrade scheduled for the end of the cycle (business-rules.md 3). */
  scheduled_plan: PlanId | null;
  cancellation: MockCancellationRequest | null;
  payments: MockPaymentAttempt[];
};

/** Reasons from business-rules.md section 5 (the dropdown list). */
export const CANCEL_REASONS = [
  "Too expensive",
  "Missing a feature",
  "Switching to another tool",
  "Not using it enough",
  "Other",
] as const;

/** MOCK dates (deterministic, like MOCK_NOW in lib/mock/dashboard.ts). */
const PERIOD_START = "2026-10-01";
const PERIOD_END = "2026-11-01";
const GRACE_END = "2026-10-04";
const PENDING_CREATED_AT = "2026-09-29T09:00:00.000Z";

const planOverrides = new Map<DemoScenario, PlanId>();
const store = new Map<DemoScenario, MockBilling>();

/** The mock upgrade recorded by `/billing` (null = the scenario's own plan). */
export function getMockPlanOverride(scenario: DemoScenario): PlanId | null {
  return planOverrides.get(scenario) ?? null;
}

function payment(
  id: string,
  planId: PlanId,
  status: MockPaymentStatus,
  created_at: string,
  paid_at: string | null,
): MockPaymentAttempt {
  return {
    id,
    plan: planId,
    amount_paise: plans[planId].price_inr_paise ?? 0,
    currency: "INR",
    status,
    created_at,
    paid_at,
  };
}

/** Past payments for the invoice table; Free/Enterprise have none yet. */
function paymentsFor(planId: PlanId, scenario: DemoScenario): MockPaymentAttempt[] {
  if (planId === "free" || planId === "enterprise") return [];
  const rows = [
    payment(`pay_${planId}_sep`, planId, "paid", "2026-09-01T06:00:00.000Z", "2026-09-01T06:02:00.000Z"),
    payment(`pay_${planId}_oct`, planId, "paid", "2026-10-01T06:00:00.000Z", "2026-10-01T06:02:00.000Z"),
  ];
  if (scenario === "past-due") {
    rows[1] = payment(
      `pay_${planId}_oct_failed`,
      planId,
      "failed",
      "2026-10-01T06:00:00.000Z",
      null,
    );
  }
  return rows;
}

function createBilling(scenario: DemoScenario, basePlan: PlanId): MockBilling {
  const base: MockBilling = {
    subscription: {
      plan: basePlan,
      status: "active",
      current_period_start: PERIOD_START,
      current_period_end: PERIOD_END,
      grace_period_ends_at: null,
      cancel_at_period_end: 0,
    },
    scheduled_plan: null,
    cancellation: null,
    payments: paymentsFor(basePlan, scenario),
  };

  if (scenario === "cancel-pending") {
    return {
      ...base,
      cancellation: {
        reason: "Too expensive",
        feedback_text: "Trying to cut costs this quarter.",
        status: "pending",
        created_at: PENDING_CREATED_AT,
      },
    };
  }

  if (scenario === "cancel-finalized") {
    return {
      ...base,
      subscription: { ...base.subscription, cancel_at_period_end: 1 },
      cancellation: {
        reason: "Switching to another tool",
        feedback_text: null,
        status: "finalized",
        created_at: "2026-09-25T09:00:00.000Z",
      },
    };
  }

  if (scenario === "past-due") {
    return {
      ...base,
      subscription: {
        ...base.subscription,
        status: "past_due",
        grace_period_ends_at: GRACE_END,
      },
    };
  }

  return base;
}

/**
 * The scenario's billing state. `basePlan` is the plan the scenario starts on
 * (from `planForScenario`, i.e. `getDashboardMock(scenario).plan.id`); once the
 * mock user upgrades, the override wins.
 */
export function getMockBilling(
  scenario: DemoScenario,
  basePlan: PlanId,
): MockBilling {
  const existing = store.get(scenario);
  if (existing) return existing;
  const created = createBilling(scenario, basePlan);
  store.set(scenario, created);
  return created;
}

// ---------------------------------------------------------------------------
// Mock mutations (Stage 6 replaces these with server routes + webhooks).
// ---------------------------------------------------------------------------

/** business-rules.md 2: effective immediately, limits unlock, scans are kept. */
export function mockUpgradePlan(scenario: DemoScenario, planId: PlanId): void {
  planOverrides.set(scenario, planId);
  const billing = store.get(scenario);
  if (billing) {
    billing.subscription.plan = planId;
    billing.subscription.status = "active";
    billing.subscription.grace_period_ends_at = null;
    billing.scheduled_plan = null;
  }
}

/** business-rules.md 3: takes effect at the END of the current cycle. */
export function mockScheduleDowngrade(
  scenario: DemoScenario,
  planId: PlanId,
): void {
  const billing = store.get(scenario);
  if (billing) billing.scheduled_plan = planId;
}

/** business-rules.md 5: records the request as `pending` (renewal untouched). */
export function mockSubmitCancellation(
  scenario: DemoScenario,
  input: { reason: string; feedback_text: string | null },
): void {
  const billing = store.get(scenario);
  if (!billing) return;
  billing.cancellation = {
    reason: input.reason,
    feedback_text: input.feedback_text,
    status: "pending",
    created_at: PENDING_CREATED_AT,
  };
}

/** business-rules.md 5.2 rule 5: owner changes their mind before the plan ends. */
export function mockKeepMyPlan(scenario: DemoScenario): void {
  const billing = store.get(scenario);
  if (!billing || !billing.cancellation) return;
  billing.cancellation.status = "withdrawn";
  billing.subscription.cancel_at_period_end = 0;
}

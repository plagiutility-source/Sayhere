"use client";

/**
 * `/billing` (PRD.md 4 and 6, business-rules.md sections 2–5B). FRONTEND ONLY
 * (Stage 1): the plan comparison, the demo checkout, the scheduled downgrade,
 * the invoice rows and the cancellation flow all read/write the in-memory mock
 * (`lib/mock/billing.ts`). No payment provider is called and no refund action
 * exists anywhere (refunds are admin-only, section 5A).
 *
 * Plan names, prices and limits come only from `lib/mock/plans.ts`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Select } from "@/components/select";
import { getBrandTheme } from "@/lib/brand/theme";
import { formatLongDate } from "@/lib/dashboard/metrics";
import {
  CANCEL_REASONS,
  getMockBilling,
  mockKeepMyPlan,
  mockScheduleDowngrade,
  mockSubmitCancellation,
  mockUpgradePlan,
  type MockPaymentAttempt,
} from "@/lib/mock/billing";
import { getDashboardMock } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import {
  aiImageAllowanceLabel,
  formatInrPaise,
  limitLabel,
  planOrder,
  planPriceLabel,
  plans,
  type Plan,
  type PlanId,
} from "@/lib/mock/plans";
import { Modal } from "./modal";
import { PlanWidget } from "./plan-widget";
import { ReauthDialog } from "./reauth-dialog";
import { SectionError } from "./section-error";

/** The exact confirmation text from business-rules.md section 5. */
const CANCELLATION_CONFIRMATION =
  "Thanks for letting us know. Our team will reach out within 48 hours before your cancellation is finalized.";

/** The exact warning from business-rules.md section 5.3. */
const EXTRA_LOCATIONS_WARNING =
  "Extra locations will be switched off when your plan ends.";

const planRank: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  growth: 3,
  enterprise: 4,
};

type PlanAction = "current" | "upgrade" | "downgrade" | "contact";

function planAction(plan: Plan, current: PlanId): PlanAction {
  if (plan.id === current) return "current";
  if (!plan.self_serve) {
    // Free is a downgrade target, Enterprise is arranged with the team.
    return plan.price_inr_paise === null ? "contact" : "downgrade";
  }
  return planRank[plan.id] > planRank[current] ? "upgrade" : "downgrade";
}

/** Owner-facing label for a payment_attempts status (never internal detail). */
function paymentStatusLabel(status: MockPaymentAttempt["status"]): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "created":
      return "Pending";
    case "failed":
    case "amount_mismatch":
      return "Failed";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Payment failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Suspended";
  }
}

export function BillingContent({ demo }: { demo: DemoScenario }) {
  const [revision, setRevision] = useState(0);
  const [recovered, setRecovered] = useState(false);
  const mock = useMemo(() => getDashboardMock(demo), [demo, revision]);
  const billing = getMockBilling(demo, mock.plan.id);
  const plan = plans[billing.subscription.plan];
  // MOCK ONLY, removed in Stage 4: colours come from the shared profile.
  const business = useMockBusiness(mock.business, demo !== "long-name");
  const theme = useMemo(() => getBrandTheme(business), [business]);

  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [downgradePlan, setDowngradePlan] = useState<PlanId | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function refresh() {
    setRevision((value) => value + 1);
  }

  if (mock.loading) return <BillingSkeleton />;

  if (mock.error && !recovered) {
    return (
      <div>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">Billing</h1>
        <SectionError label="billing" onRetry={() => setRecovered(true)} />
      </div>
    );
  }

  const subscription = billing.subscription;
  const cancellation = billing.cancellation;
  const cancelOpen =
    cancellation?.status === "pending" || cancellation?.status === "contacted";
  const cancelFinalized = cancellation?.status === "finalized";
  const paidPlan =
    plan.id === "starter" || plan.id === "pro" || plan.id === "growth";
  const canStartCancellation =
    paidPlan && (!cancellation || cancellation.status === "retained" || cancellation.status === "withdrawn");

  function handleUpgrade() {
    if (!checkoutPlan) return;
    mockUpgradePlan(demo, checkoutPlan);
    setStatus(
      `Your plan has been upgraded to ${plans[checkoutPlan].name} — here's what's new.`,
    );
    setCheckoutPlan(null);
    refresh();
  }

  function handleDowngrade() {
    if (!downgradePlan) return;
    mockScheduleDowngrade(demo, downgradePlan);
    setStatus(
      `Downgrade scheduled. Your ${plan.name} plan stays active until ${formatLongDate(
        subscription.current_period_end,
      )}, then moves to ${plans[downgradePlan].name}.`,
    );
    setDowngradePlan(null);
    refresh();
  }

  function handleKeepMyPlan() {
    mockKeepMyPlan(demo);
    setStatus(`You're staying on the ${plan.name} plan. Nothing else changes.`);
    setSubmitted(false);
    refresh();
  }

  function handleSubmitCancellation(event: React.FormEvent) {
    event.preventDefault();
    mockSubmitCancellation(demo, {
      reason,
      // feedback_text has no documented max — left free text (open question).
      feedback_text: feedbackText.trim() || null,
    });
    setReasonOpen(false);
    setSubmitted(true);
    setFeedbackText("");
    refresh();
  }

  const target = checkoutPlan ? plans[checkoutPlan] : null;
  const lowerPlan = downgradePlan ? plans[downgradePlan] : null;
  const downgradeWarnings: string[] = [];
  // business-rules.md 3: warn if current usage exceeds what the lower plan
  // allows, regardless of the current plan's own limit (Enterprise is
  // unlimited but still has 2 real locations and a real scan count).
  if (lowerPlan) {
    if (
      lowerPlan.monthly_scans !== null &&
      mock.status.scans_used > lowerPlan.monthly_scans
    ) {
      downgradeWarnings.push(
        `You are using ${limitLabel(mock.status.scans_used)} scans this cycle, and ${lowerPlan.name} allows ${limitLabel(lowerPlan.monthly_scans)}.`,
      );
    }
    if (
      lowerPlan.locations !== null &&
      mock.status.locations_used > lowerPlan.locations
    ) {
      downgradeWarnings.push(
        `You have ${mock.status.locations_used} locations, and ${lowerPlan.name} allows ${limitLabel(lowerPlan.locations)}.`,
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">Billing</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Your plan, your invoices, and what happens when you change plans.
        </p>
      </header>

      {/* Banners. Past due uses the business-rules.md 4 wording (the doc gives
          the email text, not a dashboard text — logged as an open question). */}
      {subscription.status === "past_due" ? (
        <div
          role="status"
          className="rounded-card border border-red-200 bg-red-50 px-xl py-lg"
        >
          <p className="text-[13px] text-ink">
            Your payment failed — please update your payment method within 3
            days to avoid service interruption.
          </p>
          {subscription.grace_period_ends_at ? (
            <p className="mt-1 text-[12px] text-ink-muted">
              Grace period ends on {formatLongDate(subscription.grace_period_ends_at)}.
            </p>
          ) : null}
        </div>
      ) : null}

      {cancelOpen ? (
        <div
          role="status"
          className="rounded-card border border-amber-200 bg-amber-50 px-xl py-lg text-[13px] text-amber-900"
        >
          Cancellation requested. Our team will contact you within 48 hours. Your
          plan stays active until {formatLongDate(subscription.current_period_end)}.
        </div>
      ) : null}

      {cancelFinalized ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-card border border-amber-200 bg-amber-50 px-xl py-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-[13px] text-amber-900">
            Your plan ends on {formatLongDate(subscription.current_period_end)}.
            After that you will be moved to the Free plan.
          </p>
          <button
            type="button"
            onClick={handleKeepMyPlan}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-control bg-brand-blue px-4 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            Keep my plan
          </button>
        </div>
      ) : null}

      {status ? (
        <p
          role="status"
          className="rounded-card border border-black/10 bg-white px-xl py-lg text-[13px] text-ink shadow-soft"
        >
          {status}
        </p>
      ) : null}

      {submitted ? (
        <p
          role="status"
          className="rounded-card border border-brand-green/30 bg-brand-green/10 px-xl py-lg text-[13px] text-brand-green-deep"
        >
          {CANCELLATION_CONFIRMATION}
        </p>
      ) : null}

      {billing.scheduled_plan ? (
        <p className="text-[12px] text-ink-muted">
          Downgrade to {plans[billing.scheduled_plan].name} scheduled for{" "}
          {formatLongDate(subscription.current_period_end)}.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanWidget status={mock.status} plan={plan} color={theme.primary} />
          <div className="flex flex-col rounded-card border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-[12px] text-ink-muted">Plan details</p>
            <dl className="mt-4 grid gap-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Price</dt>
                <dd className="tabular-nums">{planPriceLabel(plan)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Status</dt>
                <dd>{statusLabel(subscription.status)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">
                  {plan.id === "free" ? "Billing" : "Renews on"}
                </dt>
                <dd>
                  {plan.id === "free"
                    ? "Free forever"
                    : formatLongDate(subscription.current_period_end)}
                </dd>
              </div>
            </dl>
            <a
              href="#compare"
              className="mt-auto pt-4 text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Compare plans
            </a>
          </div>
        </div>

        <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
          <p className="text-[12px] text-ink-muted">When your plan changes</p>
          <ul className="mt-3 grid gap-2 text-[12px] leading-relaxed text-ink-muted">
            <li>Upgrades unlock new limits immediately; your scan count is kept.</li>
            <li>Downgrades take effect at the end of the current cycle.</li>
            <li>Refunds are never automatic and never self-serve.</li>
          </ul>
        </div>
      </div>

      <section id="compare" aria-labelledby="compare-heading" className="scroll-mt-24">
        <h2 id="compare-heading" className="text-[16px] font-medium text-ink">
          Plan comparison
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {planOrder.map((id) => {
            const row = plans[id];
            const action = planAction(row, plan.id);
            const isCurrent = action === "current";
            return (
              <div
                key={id}
                className={`flex flex-col rounded-card border bg-white p-5 shadow-soft ${
                  isCurrent ? "border-brand-blue" : "border-black/10"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-medium text-ink">{row.name}</h3>
                  {isCurrent ? (
                    <span className="rounded-pill bg-brand-blue/10 px-2 py-0.5 text-[11px] font-medium text-brand-blue">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[20px] font-medium text-ink">
                  {planPriceLabel(row)}
                </p>
                <dl className="mt-4 grid flex-1 gap-2 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Locations</dt>
                    <dd>{limitLabel(row.locations)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Monthly scans</dt>
                    <dd>{limitLabel(row.monthly_scans)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Google auto-reply</dt>
                    <dd>{row.google_auto_reply ? "Yes" : "No"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Menu items</dt>
                    <dd>{limitLabel(row.page.menu_items)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">AI dish photos</dt>
                    <dd>{aiImageAllowanceLabel(row.page.ai_images)}</dd>
                  </div>
                </dl>

                <div className="mt-5">
                  {action === "current" ? (
                    <p className="text-[12px] text-ink-muted">Your current plan</p>
                  ) : action === "upgrade" ? (
                    <button
                      type="button"
                      onClick={() => setCheckoutPlan(id)}
                      className="inline-flex h-10 w-full items-center justify-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                    >
                      Upgrade to {row.name}
                    </button>
                  ) : action === "downgrade" ? (
                    <button
                      type="button"
                      onClick={() => setDowngradePlan(id)}
                      className="inline-flex h-10 w-full items-center justify-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                    >
                      Downgrade to {row.name}
                    </button>
                  ) : (
                    <Link
                      href="/contact"
                      className="inline-flex h-10 w-full items-center justify-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                    >
                      Contact us
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-ink-muted">
          Enterprise is arranged with our team and is not bought at checkout.
        </p>
      </section>

      <section aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="text-[16px] font-medium text-ink">
          Invoice history
        </h2>
        {billing.payments.length === 0 ? (
          <p className="mt-3 rounded-card border border-black/10 bg-white p-5 text-[13px] text-ink-muted shadow-soft">
            No payments yet.
          </p>
        ) : (
          /* No PDF download: no doc defines one (logged as an open question). */
          <div className="mt-3 overflow-x-auto rounded-card border border-black/10 bg-white shadow-soft">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/10 text-[12px] text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                  <th scope="col" className="px-4 py-3 font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((row) => (
                  <tr key={row.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 tabular-nums">
                      {formatLongDate(row.paid_at ?? row.created_at)}
                    </td>
                    <td className="px-4 py-3">{plans[row.plan].name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.amount_paise === 0
                        ? "—"
                        : formatInrPaise(row.amount_paise)}
                    </td>
                    <td className="px-4 py-3">{paymentStatusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {paidPlan ? (
        <section aria-labelledby="cancel-heading" className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
          <h2 id="cancel-heading" className="text-[16px] font-medium text-ink">
            Cancel plan
          </h2>
          <p className="mt-2 text-[13px] text-ink-muted">
            Cancelling is not instant: our team reaches out first, and your plan
            stays active until the end of the current cycle.
          </p>
          {canStartCancellation ? (
            <button
              type="button"
              onClick={() => setReauthOpen(true)}
              className="mt-3 inline-flex h-10 items-center rounded-control border border-red-700/30 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel plan
            </button>
          ) : (
            <p className="mt-3 text-[12px] text-ink-muted">
              {cancelFinalized
                ? "Use “Keep my plan” above if you changed your mind."
                : "A cancellation request is already open."}
            </p>
          )}
        </section>
      ) : null}

      {/* Demo checkout (PRD.md 6: upgrade unlocks instantly; scans are kept). */}
      <Modal
        open={target !== null}
        title="Demo checkout"
        onClose={() => setCheckoutPlan(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCheckoutPlan(null)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Upgrade to {target?.name}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          This is a demo checkout. No payment is taken and nothing is charged. In
          the real product Cashfree takes the payment and the plan unlocks
          immediately; your scan count is always kept.
        </p>
        {target ? (
          <p className="mt-2 text-[13px] text-ink-muted">
            {target.name} unlocks {limitLabel(target.monthly_scans)} scans a month
            and {limitLabel(target.locations)} locations.
          </p>
        ) : null}
      </Modal>

      <Modal
        open={lowerPlan !== null}
        title={`Downgrade to ${lowerPlan?.name}?`}
        onClose={() => setDowngradePlan(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDowngradePlan(null)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDowngrade}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Schedule downgrade
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          Downgrades take effect at the END of the current billing cycle. Your{" "}
          {plan.name} plan stays active until{" "}
          {formatLongDate(subscription.current_period_end)}.
        </p>
        {downgradeWarnings.map((warning) => (
          <p key={warning} className="mt-2 text-[13px] text-amber-800">
            {warning}
          </p>
        ))}
      </Modal>

      {/* Cancel flow (business-rules.md 5): re-auth → reason form → confirmation. */}
      <ReauthDialog
        open={reauthOpen}
        description="Cancelling your plan is a sensitive action. Confirm it's you to continue."
        confirmLabel="Continue"
        onClose={() => setReauthOpen(false)}
        onConfirm={() => {
          setReauthOpen(false);
          setReasonOpen(true);
        }}
      />

      <Modal
        open={reasonOpen}
        title="Why are you cancelling?"
        onClose={() => setReasonOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReasonOpen(false)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Not now
            </button>
            <button
              type="submit"
              form="cancel-form"
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Send request
            </button>
          </>
        }
      >
        <form id="cancel-form" onSubmit={handleSubmitCancellation}>
          <Select
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {CANCEL_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <div className="mt-3">
            <label
              htmlFor="cancel-feedback"
              className="block text-[13px] font-medium"
            >
              Anything else? (optional)
            </label>
            <textarea
              id="cancel-feedback"
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              rows={3}
              className="mt-sm w-full rounded-control border border-black/20 bg-white px-md py-sm text-[14px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
          </div>
          {/* business-rules.md 5.3: warn before submitting when >1 location. */}
          {mock.status.locations_used > 1 ? (
            <p className="mt-3 text-[13px] text-amber-800">
              {EXTRA_LOCATIONS_WARNING}
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}

/** Loading state (the `loading` demo scenario) with the page's dimensions. */
function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-5 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-card border border-black/10 bg-white shadow-soft" />
          <div className="h-40 animate-pulse rounded-card border border-black/10 bg-white shadow-soft" />
        </div>
        <div className="h-40 animate-pulse rounded-card border border-black/10 bg-white shadow-soft" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-card border border-black/10 bg-white shadow-soft"
          />
        ))}
      </div>
    </div>
  );
}

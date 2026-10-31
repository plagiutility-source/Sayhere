import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Payment Policy — Syehere",
  description:
    "Billing, renewal, failed payment, upgrade, downgrade and tax rules for Syehere paid plans.",
};

const toc = [
  { id: "billing", heading: "1. Billing" },
  { id: "non-refundable", heading: "2. Non-Refundable" },
  { id: "failed-payments", heading: "3. Failed Payments" },
  { id: "upgrades", heading: "4. Upgrades" },
  { id: "downgrades", heading: "5. Downgrades" },
  { id: "currency-and-taxes", heading: "6. Currency & Taxes" },
] as const;

export default function PaymentPolicyPage() {
  return (
    <LegalPage title="Payment Policy" sections={toc} lastUpdated="[DATE]">
      <LegalSection id="billing" heading="1. Billing">
        <p>
          Paid plans are billed monthly in advance and renew automatically until
          cancelled.
        </p>
      </LegalSection>

      <LegalSection id="non-refundable" heading="2. Non-Refundable">
        <p>
          Payments are non-refundable once a billing cycle has begun, except
          where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="failed-payments" heading="3. Failed Payments">
        <p>
          If a recurring payment fails, a 3-day grace period applies. Failure to
          resolve payment within this window will result in service suspension.
          We are not liable for any business impact resulting from suspension due
          to non-payment.
        </p>
      </LegalSection>

      <LegalSection id="upgrades" heading="4. Upgrades">
        <p>
          Take effect immediately; the new plan&apos;s charge (prorated or full,
          per your billing engine&apos;s logic) is billed at time of upgrade.
        </p>
      </LegalSection>

      <LegalSection id="downgrades" heading="5. Downgrades">
        <p>
          Take effect at the end of the current billing cycle; no partial refund
          is issued for the unused portion of the higher plan.
        </p>
      </LegalSection>

      <LegalSection id="currency-and-taxes" heading="6. Currency & Taxes">
        <p>
          Indian customers are billed in ₹ via Cashfree. Paid-plan billing for
          international customers is not yet available; they may sign up and use
          the Free tier only until a second payment provider (e.g. Stripe) is
          added for global/USD billing. Applicable taxes (GST, VAT, sales tax)
          will be added where legally required once international billing is
          live.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

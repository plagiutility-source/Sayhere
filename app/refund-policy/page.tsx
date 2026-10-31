import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { site } from "@/lib/mock/site";

export const metadata: Metadata = {
  title: "Refund Policy — Syehere",
  description:
    "Syehere refund rules for plan payments and cancellations. Syehere is a digital service; no physical delivery.",
};

const toc = [
  { id: "digital-service", heading: "1. Digital service" },
  { id: "plan-payments", heading: "2. Plan payments are non-refundable" },
  { id: "downgrades", heading: "3. Downgrades" },
  { id: "cancellation-mid-cycle", heading: "4. Cancellation mid-cycle" },
  { id: "requesting-a-refund", heading: "5. Requesting a refund" },
] as const;

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" sections={toc} lastUpdated="[DATE]">
      <LegalSection id="digital-service" heading="1. Digital service">
        <p className="font-medium text-ink">
          Syehere is a digital service; no physical delivery.
        </p>
      </LegalSection>

      <LegalSection
        id="plan-payments"
        heading="2. Plan payments are non-refundable"
      >
        <p>
          Paid plans are billed monthly in advance and renew automatically until
          cancelled. Payments are non-refundable once a billing cycle has begun,
          except where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="downgrades" heading="3. Downgrades">
        <p>
          Downgrades take effect at the end of the current billing cycle; no
          partial refund is issued for the unused portion of the higher plan.
        </p>
      </LegalSection>

      <LegalSection
        id="cancellation-mid-cycle"
        heading="4. Cancellation mid-cycle"
      >
        <p>
          No partial-month or pro-rated refunds are issued for cancellation
          mid-cycle. Service and access continue uninterrupted through the end
          of the current paid billing cycle, regardless of when the request was
          submitted.
        </p>
      </LegalSection>

      <LegalSection id="requesting-a-refund" heading="5. Requesting a refund">
        <p>
          Refunds are not automatic. Any refund is issued at our discretion or
          where required by law, and only by our team after review. To ask about
          a refund, contact{" "}
          <a
            href={`mailto:${site.supportEmail}`}
            className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            {site.supportEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

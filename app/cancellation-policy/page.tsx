import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cancellation Policy — Syehere",
  description:
    "How to cancel a Syehere paid plan, what happens to your data and when charges stop.",
};

const toc = [
  { id: "how-to-cancel", heading: "1. How to cancel" },
  { id: "review-within-48-hours", heading: "2. Review within 48 hours" },
  { id: "access-continues", heading: "3. Access continues to the cycle end" },
  { id: "no-partial-month-refunds", heading: "4. No partial-month refunds" },
  { id: "data-after-your-plan-ends", heading: "5. Data after your plan ends" },
  { id: "refunds-are-not-automatic", heading: "6. Refunds are not automatic" },
] as const;

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      sections={toc}
      lastUpdated="[DATE]"
    >
      <LegalSection id="how-to-cancel" heading="1. How to cancel">
        <p>
          Cancellation requests must be submitted through the in-app
          cancellation form, including a reason for cancellation.
        </p>
      </LegalSection>

      <LegalSection
        id="review-within-48-hours"
        heading="2. Review within 48 hours"
      >
        <p>
          Submitting a cancellation request does not immediately terminate the
          account. Our team will review and reach out within 48 hours. Once the
          cancellation is confirmed (or, if it is still undecided 2 days before
          your renewal date, automatically), no further charges are made.
        </p>
      </LegalSection>

      <LegalSection
        id="access-continues"
        heading="3. Access continues to the cycle end"
      >
        <p>
          Service and access continue uninterrupted through the end of the
          current paid billing cycle, regardless of when the request was
          submitted. After that, your account moves to the Free plan; it is not
          closed or deleted.
        </p>
      </LegalSection>

      <LegalSection
        id="no-partial-month-refunds"
        heading="4. No partial-month refunds"
      >
        <p>
          No partial-month or pro-rated refunds are issued for cancellation
          mid-cycle.
        </p>
      </LegalSection>

      <LegalSection
        id="data-after-your-plan-ends"
        heading="5. Data after your plan ends"
      >
        <p>
          When a paid plan ends, your account moves to the Free plan and your
          data (feedback history, analytics, branding) is kept. Any additional
          locations beyond the Free plan&apos;s limit are switched off and kept
          for a limited period (currently {"{RETENTION_DAYS_AFTER_CANCEL}"} days)
          in case you upgrade again, after which they and their data are
          permanently deleted, in line with our Privacy Policy. You may delete
          your whole account at any time.
        </p>
      </LegalSection>

      <LegalSection
        id="refunds-are-not-automatic"
        heading="6. Refunds are not automatic"
      >
        <p>
          Refunds are not automatic. Any refund is issued at our discretion or
          where required by law, and only by our team after review.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

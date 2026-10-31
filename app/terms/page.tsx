import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — Syehere",
  description:
    "The terms that govern use of the Syehere review funnel platform.",
};

const toc = [
  { id: "service-description", heading: "1. Service Description" },
  { id: "account-responsibility", heading: "2. Account Responsibility" },
  { id: "acceptable-use", heading: "3. Acceptable Use" },
  { id: "service-availability", heading: "4. Service Availability" },
  { id: "limitation-of-liability", heading: "5. Limitation of Liability" },
  { id: "changes-to-terms", heading: "6. Changes to Terms" },
  { id: "governing-law", heading: "7. Governing Law" },
  { id: "customer-page-content", heading: "8. Customer Page Content" },
] as const;

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" sections={toc} lastUpdated="[DATE]">
      <LegalSection id="service-description" heading="1. Service Description">
        <p>
          Syehere provides a software platform to help businesses collect and
          manage customer feedback and reviews. The service is provided
          &quot;as is&quot; and &quot;as available,&quot; without warranties of
          any kind.
        </p>
      </LegalSection>

      <LegalSection
        id="account-responsibility"
        heading="2. Account Responsibility"
      >
        <p>
          The business owner is solely responsible for the accuracy of
          information provided (business name, logo, Google Review link) and for
          compliance with Google&apos;s review policies and any applicable local
          advertising/consumer protection laws.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" heading="3. Acceptable Use">
        <p>
          Businesses may not use the platform to solicit fake reviews,
          manipulate ratings dishonestly, or violate Google&apos;s review
          guidelines. We reserve the right to suspend or terminate accounts
          found in violation, without refund.
        </p>
      </LegalSection>

      <LegalSection
        id="service-availability"
        heading="4. Service Availability"
      >
        <p>
          We do not guarantee uninterrupted or error-free service. Scheduled
          maintenance or third-party outages (Google, payment providers,
          hosting) may affect availability.
        </p>
      </LegalSection>

      <LegalSection
        id="limitation-of-liability"
        heading="5. Limitation of Liability"
      >
        <p>
          To the maximum extent permitted by law, Syehere and its operators are
          not liable for indirect, incidental, or consequential damages arising
          from use of the service, including lost revenue, lost reviews, or
          reputational harm.
        </p>
      </LegalSection>

      <LegalSection id="changes-to-terms" heading="6. Changes to Terms">
        <p>
          We may update these terms from time to time. Material changes will be
          communicated via email or in-app notice with at least 30 days&apos;
          notice where required by law.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" heading="7. Governing Law">
        <p>
          [To be specified based on where the business is legally registered —
          needs lawyer input given dual India/Global market.]
        </p>
      </LegalSection>

      <LegalSection
        id="customer-page-content"
        heading="8. Customer Page Content"
      >
        <p>
          Businesses are solely responsible for all content they add to their
          customer page (menus, prices, offers, links, Wi-Fi details and other
          text), including its accuracy and legality, and for having the rights
          to any text they use. Content must not be misleading, infringing,
          unlawful, or link to harmful or deceptive sites. We may hide or remove
          content, or suspend the page, at our discretion without notice. Any
          Wi-Fi password added to the page is visible to everyone who opens the
          page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

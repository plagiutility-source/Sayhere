import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Syehere",
  description:
    "How Syehere collects, uses and protects owner and customer data, including Google user data.",
};

const toc = [
  { id: "who-we-are", heading: "1. Who we are" },
  { id: "who-this-covers", heading: "2. Who this covers" },
  { id: "what-we-collect", heading: "3. What we collect" },
  { id: "google-user-data", heading: "4. Google user data" },
  { id: "how-we-use-data", heading: "5. How we use data" },
  { id: "processors", heading: "6. Who we share data with" },
  { id: "retention", heading: "7. How long we keep data" },
  { id: "security", heading: "8. Security" },
  { id: "your-rights", heading: "9. Your rights and choices" },
  { id: "cookies", heading: "10. Cookies" },
  { id: "children", heading: "11. Children" },
  { id: "changes", heading: "12. Changes" },
  { id: "contact", heading: "13. Contact" },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={toc}
      lastUpdated="[DATE]"
    >
      <LegalSection id="who-we-are" heading="1. Who we are">
        <p>
          Syehere (&quot;we&quot;, &quot;us&quot;) is operated by [LEGAL NAME /
          BUSINESS NAME], [REGISTERED ADDRESS], [COUNTRY]. Contact for privacy
          questions and requests: [SUPPORT EMAIL].
        </p>
      </LegalSection>

      <LegalSection id="who-this-covers" heading="2. Who this covers">
        <ul className="grid gap-md">
          <li>
            <strong className="text-ink">Business owners</strong> who sign up to
            Syehere (&quot;you&quot;).
          </li>
          <li>
            <strong className="text-ink">Customers</strong> of those businesses
            who scan a QR code or tap an NFC tag and use a business&apos;s review
            page or leave private feedback. For customer data, the business owner
            decides why it is collected; we process it for them to provide the
            service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="what-we-collect" heading="3. What we collect">
        <p className="font-medium text-ink">From business owners</p>
        <ul className="grid gap-md">
          <li>
            Account details: name, email address, login credentials (handled by
            Firebase Authentication; we do not store your password).
          </li>
          <li>
            Business details: business name, type, tagline, logo, brand colours,
            location names, Google review link, social links, and the content you
            add to your customer page (menu, prices, offers, hours, contact
            details, Wi-Fi details).
          </li>
          <li>
            Category and onboarding proof: your locked business
            category (Restaurant &amp; Café, Hotel or Other business), the
            category name you typed to confirm it, business address, city, PIN
            code, business phone, and a proof number by category (FSSAI licence
            for food; number of rooms plus GSTIN or a local trade/tourism licence
            for hotel; optional GSTIN for other businesses). These are
            format-checked; we never claim a number is government-verified.
          </li>
          <li>
            Billing: plan, subscription status and payment references. Card and
            UPI details are handled by Cashfree; we never see or store full card
            numbers.
          </li>
          <li>
            Auto-reply setup request (only if you ask us to set it up): your
            name, business name, business type, the email linked to your Google
            Business Profile, and your phone number. We use it only to contact
            you and set up auto-reply.
          </li>
          <li>
            Settings and usage: auto-reply settings and templates, feedback you
            view, scan counts, and audit logs of important actions.
          </li>
          <li>Google connection (only if you connect it): see section 4.</li>
        </ul>

        <p className="mt-md font-medium text-ink">
          From customers of a business
        </p>
        <ul className="grid gap-md">
          <li>
            Private feedback you choose to submit: the message and any contact
            details you type in.
          </li>
          <li>
            Anonymous usage data: a scan or button-tap counter. We create a{" "}
            <strong className="text-ink">
              one-way hashed visitor identifier
            </strong>{" "}
            from technical details (such as IP address and browser type) plus a
            daily changing salt. We do <strong className="text-ink">not</strong>{" "}
            store your raw IP address.
          </li>
          <li>Strictly necessary technical data such as security logs.</li>
        </ul>

        <p>
          We do not sell personal data. We do not use it for advertising.
        </p>
      </LegalSection>

      <LegalSection
        id="google-user-data"
        heading="4. Google user data (Business Profile connection)"
      >
        <p className="text-[13px] italic">
          [Paste the &quot;Google user data&quot; paragraph from
          google-approval.md section 8, final wording after the AI-provider
          check.]
        </p>

        <div className="rounded-card border-l-4 border-brand-blue bg-surface-muted p-lg">
          <p>
            <strong className="text-ink">Google user data.</strong> If you
            connect your Google Business Profile, Syehere accesses your Business
            Profile account and location names, and the reviews for the location
            you select, using the <code>business.manage</code> permission. We use
            this data only to show you your reviews and to post replies you have
            enabled. We store an encrypted access token and refresh token on our
            servers until you disconnect or delete your account. We do not sell
            Google user data, use it for advertising, or allow humans to read it
            except with your consent, to investigate abuse or security issues, or
            where required by law. Syehere&apos;s use and transfer of information
            received from Google APIs will adhere to the Google API Services User
            Data Policy, including the Limited Use requirements. To draft
            replies, the text and star rating of a review are sent to our AI
            providers (Groq and Google Gemini). They process it only to generate
            the reply and are not permitted to use it to train their models. You
            can disconnect in Settings, or revoke access at any time in your
            Google Account permissions. On disconnect or account deletion we
            delete stored tokens (and stored review data, if any) within [X]
            days. Contact: [support email].
          </p>
        </div>

        <p>
          In short: if you connect Google, we read the names of your Business
          Profile accounts and locations, and the reviews of the location you
          choose, and post replies you have enabled, using the{" "}
          <code>business.manage</code> permission. Syehere&apos;s use and
          transfer of information received from Google APIs adheres to the
          Google API Services User Data Policy, including the Limited Use
          requirements. Access tokens are stored encrypted and deleted when you
          disconnect or delete your account. You can also revoke access any time
          at https://myaccount.google.com/permissions.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-data" heading="5. How we use data">
        <ul className="grid gap-md">
          <li>
            To provide the service: review pages, QR/NFC links, dashboard,
            feedback notifications, weekly reports, auto-replies.
          </li>
          <li>
            To generate text with AI: AI-written review suggestions use only the
            business type/name and star context. AI-written replies to Google
            reviews use the review&apos;s star rating, reviewer first name and
            review text. We do <strong className="text-ink">not</strong> send
            customers&apos; private feedback or owners&apos; personal data to AI
            providers.
          </li>
          <li>
            To bill you, prevent abuse and fraud, secure the service, and meet
            legal duties.
          </li>
          <li>
            To contact you about your account, service changes and support.
          </li>
        </ul>
        <p>
          We do not use Google user data to train AI models or for advertising.
        </p>
      </LegalSection>

      <LegalSection id="processors" heading="6. Who we share data with (processors)">
        <p>
          We use these providers to run the service, only as needed for the
          purposes above:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <caption className="sr-only">
              Service providers and what each is used for
            </caption>
            <thead>
              <tr className="border-b border-black/10">
                <th scope="col" className="py-sm pr-lg font-medium text-ink">
                  Provider
                </th>
                <th scope="col" className="py-sm font-medium text-ink">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Google Firebase", "Login and sessions"],
                ["Turso", "Database"],
                ["Cloudflare (R2)", "Logo and QR file storage"],
                ["Vercel", "Hosting and scheduled jobs"],
                ["Upstash", "Rate limiting"],
                ["Resend", "Sending emails"],
                ["Cashfree", "Payments and subscriptions"],
                ["Groq and Google Gemini", "AI text generation (see section 5)"],
                [
                  "Google (Business Profile API)",
                  "Only if you connect your Google Business Profile",
                ],
              ].map(([provider, purpose]) => (
                <tr key={provider} className="border-b border-black/5">
                  <th
                    scope="row"
                    className="py-sm pr-lg align-top font-normal text-ink"
                  >
                    {provider}
                  </th>
                  <td className="py-sm align-top">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          [Adjust to the final stack.] We may also disclose data if required by
          law or to protect rights and safety. If we are sold or merge, data may
          transfer to the new owner under the same protections.
        </p>
        <p>
          <strong className="text-ink">International transfers:</strong> some
          providers store data outside your country. [Lawyer to confirm the
          transfer basis wording for India and your other markets.]
        </p>
      </LegalSection>

      <LegalSection id="retention" heading="7. How long we keep data">
        <ul className="grid gap-md">
          <li>Account and business data: while your account is active.</li>
          <li>Anonymous scan and page events: deleted after 90 days.</li>
          <li>
            If a paid plan ends: your account moves to the Free plan and data is
            kept; extra locations beyond the Free limit are switched off and
            deleted after [RETENTION_DAYS_AFTER_CANCEL, default 90] days.
          </li>
          <li>
            Google tokens: deleted when you disconnect, cancel or delete your
            account. [Deleted within X days.]
          </li>
          <li>
            When you delete your account: your data and files are permanently
            deleted, except records we must keep by law (for example payment and
            tax records) [lawyer to confirm periods].
          </li>
          <li>
            Onboarding proof is kept while the account exists.
          </li>
          <li>
            Backups: [state the backup retention and that deleted data leaves
            backups within X days].
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="security" heading="8. Security">
        <p>
          HTTPS everywhere, encrypted Google tokens (AES-256-GCM), access
          controls that keep every business&apos;s data separate, rate limiting,
          and hashed visitor identifiers. No system is perfectly secure.
        </p>
        <p>
          <strong className="text-ink">Data breach:</strong> if a personal data
          breach affects you we will notify affected users and the authorities as
          required by applicable law [lawyer to confirm exact timelines and
          wording under the DPDP Act].
        </p>
      </LegalSection>

      <LegalSection id="your-rights" heading="9. Your rights and choices">
        <p>
          You can access, correct or delete your data, withdraw consent, and
          disconnect Google at any time in Settings. Customers can ask the
          business, or us at [SUPPORT EMAIL], to delete feedback they submitted.
          We respond within [X] days. [Lawyer to add the rights and
          grievance-officer details the DPDP Act and other applicable laws
          require, including a named grievance contact.]
        </p>
      </LegalSection>

      <LegalSection id="cookies" heading="10. Cookies">
        <p>
          We use only strictly necessary cookies: a secure login session cookie
          (and a separate one for admin staff). We do not use advertising
          cookies. [If you later add analytics, update this section and add a
          consent notice.]
        </p>
      </LegalSection>

      <LegalSection id="children" heading="11. Children">
        <p>
          Syehere is for businesses and is not directed at children under [18 /
          local age]. We do not knowingly collect their data. [Lawyer to review
          DPDP rules on children&apos;s data for customer-facing pages.]
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="12. Changes">
        <p>
          We will post updates here with a new date, and notify owners by email
          for material changes, especially anything affecting how Google user
          data is used.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="13. Contact">
        <p>
          [LEGAL NAME], [ADDRESS], [SUPPORT EMAIL], [GRIEVANCE OFFICER NAME AND
          EMAIL].
        </p>
      </LegalSection>
    </LegalPage>
  );
}

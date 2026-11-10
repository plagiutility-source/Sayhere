import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Section } from "@/components/section";
import { publicNavLinks, site } from "@/lib/mock/site";

export const metadata: Metadata = {
  title: "Contact — Syehere",
  description:
    "Contact Syehere support by email or phone, or write to our registered address.",
};

/** Only these two contact channels are published (cashfree-approval.md §1). */
const channels = [
  {
    label: "Email support",
    value: site.supportEmail,
    href: `mailto:${site.supportEmail}`,
    note: "Account, billing, review funnel and Google connection questions.",
  },
  {
    label: "Phone",
    value: site.supportPhone,
    href: `tel:${site.supportPhone.replace(/[^+\d]/g, "")}`,
    note: "Our team also calls owners who ask us to set up Google auto-reply.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar
        productName={site.productName}
        links={publicNavLinks}
        cta={{ label: "Start free", href: "/signup" }}
      />

      <main>
        <Section width="wide" className="pt-2xl">
          <div className="max-w-3xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
              Contact
            </p>
            <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[36px]">
              Contact Syehere
            </h1>
            <p className="mt-lg text-[16px] leading-relaxed text-ink-muted">
              One email address and one phone number is all you need. Both reach
              the same small support team.
            </p>
          </div>
        </Section>

        <Section width="wide">
          <div className="grid gap-md sm:grid-cols-2">
            {channels.map((channel) => (
              <Card key={channel.label} title={channel.label}>
                <a
                  href={channel.href}
                  className="text-[15px] font-medium text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  {channel.value}
                </a>
                <p className="mt-sm text-[13px] leading-relaxed text-ink-muted">
                  {channel.note}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-2xl grid gap-2xl md:grid-cols-[1fr_1.4fr]">
            <Card title="Registered address">
              <address className="not-italic text-[13px] leading-relaxed text-ink">
                {site.legalBusinessName}
                <br />
                {site.registeredAddress}
                <br />
                {site.country}
              </address>
            </Card>

            <div className="text-[14px] leading-relaxed text-ink-muted">
              <h2 className="font-display text-[18px] font-medium text-ink sm:text-[20px]">
                Before you write
              </h2>
              <ul className="mt-md grid gap-sm">
                <li>
                  Plans, prices and what each includes are on{" "}
                  <Link
                    href="/pricing"
                    className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    our pricing page
                  </Link>
                  .
                </li>
                <li>
                  Billing, renewal, downgrade and refund rules are in the{" "}
                  <Link
                    href="/payment-policy"
                    className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Payment Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/cancellation-policy"
                    className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Cancellation Policy
                  </Link>
                  .
                </li>
                <li>
                  How we handle personal data, including Google user data, is in
                  our{" "}
                  <Link
                    href="/privacy"
                    className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Privacy Policy
                  </Link>
                  .
                </li>
              </ul>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Section } from "@/components/section";
import {
  aiImageAllowanceLabel,
  limitLabel,
  planOrder,
  planPriceLabel,
  plans,
  type Plan,
} from "@/lib/mock/plans";
import { publicNavLinks, site } from "@/lib/mock/site";

export const metadata: Metadata = {
  title: "Pricing — Syehere",
  description:
    "Syehere plan prices in INR: Free, Starter and Pro, with locations, monthly scans and auto-reply availability. Enterprise is arranged with our team.",
};

/** Only self-serve plans go through checkout; the rest use contact wording. */
function ctaFor(plan: Plan): { label: string; href: string } {
  if (plan.self_serve) {
    return { label: "Get started", href: "/sign-up" };
  }
  return { label: "Contact us", href: "/contact" };
}

export default function PricingPage() {
  return (
    <>
      <Navbar
        productName={site.productName}
        links={publicNavLinks}
        cta={{ label: "Start free", href: "/sign-up" }}
      />

      <main>
        <Section width="wide" className="pt-2xl">
          <div className="max-w-3xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
              Pricing
            </p>
            <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[36px]">
              Plans and pricing
            </h1>
            <p className="mt-lg text-[16px] leading-relaxed text-ink-muted">
              Prices are in INR and match what our payment provider charges.
              Every plan includes the review funnel, the customer page and the
              dashboard. Google review auto-reply is on every plan except
              Starter.
            </p>
          </div>
        </Section>

        <Section width="wide">
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            {planOrder.map((id) => {
              const plan = plans[id];
              const cta = ctaFor(plan);
              return (
                <div
                  key={id}
                  className="flex flex-col rounded-card border border-black/10 bg-white p-lg shadow-soft"
                >
                  <h2 className="text-[15px] font-medium">{plan.name}</h2>
                  <p className="mt-md text-[24px] font-medium">
                    {planPriceLabel(plan)}
                  </p>

                  <dl className="mt-lg grid flex-1 gap-sm text-[13px]">
                    <div className="flex justify-between gap-md">
                      <dt className="text-ink-muted">Locations</dt>
                      <dd>{limitLabel(plan.locations)}</dd>
                    </div>
                    <div className="flex justify-between gap-md">
                      <dt className="text-ink-muted">Monthly scans</dt>
                      <dd>{limitLabel(plan.monthly_scans)}</dd>
                    </div>
                    <div className="flex justify-between gap-md">
                      <dt className="text-ink-muted">Google auto-reply</dt>
                      <dd>{plan.google_auto_reply ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between gap-md">
                      <dt className="text-ink-muted">AI dish photos</dt>
                      <dd>{aiImageAllowanceLabel(plan.page.ai_images)}</dd>
                    </div>
                    <div className="flex justify-between gap-md">
                      <dt className="text-ink-muted">Billing cycle</dt>
                      <dd>{plan.price_inr_paise === null ? "—" : "Monthly"}</dd>
                    </div>
                  </dl>

                  {plan.id === "starter" ? (
                    <p className="mt-md text-[12px] leading-relaxed text-ink-muted">
                      Google review auto-reply is not included on Starter.
                    </p>
                  ) : null}

                  {plan.id === "free" ? (
                    <p className="mt-md text-[12px] leading-relaxed text-ink-muted">
                      ₹0 — no payment needed. Questions before you start?{" "}
                      <Link
                        href="/contact"
                        className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        Contact us
                      </Link>
                      .
                    </p>
                  ) : null}

                  {plan.id === "enterprise" ? (
                    <p className="mt-md text-[12px] leading-relaxed text-ink-muted">
                      Unlimited locations and scans, priced for your business.
                      Contact us and our team will arrange it with you.
                    </p>
                  ) : null}

                  <div className="mt-xl">
                    <ButtonLink
                      href={cta.href}
                      size="md"
                      variant={plan.id === "pro" ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {cta.label}
                    </ButtonLink>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2xl grid gap-lg text-[13px] leading-relaxed text-ink-muted">
            <p>
              <strong className="text-ink">Billing cycle:</strong> paid plans are
              billed monthly in advance and renew automatically until cancelled.
            </p>
            <p>
              <strong className="text-ink">Currency and taxes:</strong> Indian
              customers are billed in ₹ via Cashfree. Paid-plan billing for
              international customers is not yet available; they may sign up and
              use the Free tier only until a second payment provider is added for
              global/USD billing. Applicable taxes (GST, VAT, sales tax) will be
              added where legally required once international billing is live.
            </p>
            <p>
              Free is free forever and does not need a payment. Enterprise is
              arranged with our team, so both show{" "}
              <Link
                href="/contact"
                className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Contact us
              </Link>{" "}
              rather than a checkout.
            </p>
            <p>
              By subscribing you agree to our{" "}
              <Link
                href="/terms"
                className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Terms &amp; Conditions
              </Link>
              ,{" "}
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
              . Refund rules are in the{" "}
              <Link
                href="/refund-policy"
                className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Refund Policy
              </Link>
              .
            </p>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

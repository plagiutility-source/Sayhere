import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { Navbar } from "@/components/navbar";
import { Section } from "@/components/section";
import {
  limitLabel,
  planOrder,
  planPriceLabel,
  plans,
  type Plan,
} from "@/lib/mock/plans";
import { site } from "@/lib/mock/site";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Google data", href: "#google-data" },
];

const steps = [
  {
    title: "The customer scans or taps",
    body: "A QR code on the table or an NFC tag at the counter opens your page. No app to install, no login, nothing to download.",
  },
  {
    title: "Thumbs up, or thumbs down?",
    body: "Two big buttons and one tap. Both open the same page with two clear choices: continue to Google, or send the owner a private message.",
  },
  {
    title: "A review to copy, or a private message",
    body: "Customers answer a few quick questions and get a short, natural review to copy in one tap. Private messages land straight in your dashboard.",
  },
];

const features = [
  {
    title: "A review funnel, not a link",
    body: "Every customer gets two fair choices — continue to Google, or write to you privately. Nothing is hidden, and the review block always stays first.",
  },
  {
    title: "QR and NFC that keep working",
    body: "The printed code points at a permanent short link, so you can change what is behind it any time without reprinting anything.",
  },
  {
    title: "AI-written review text",
    body: "Customers answer a few quick questions — what they had, what they liked — and get a short, natural review to copy. One tap, and it is on your Google listing.",
  },
  {
    title: "Private messages, handled by you",
    body: "Any customer can reach you and our team directly through a private form, while the problem is still fixable.",
  },
  {
    title: "Google review auto-reply",
    body: "New reviews get a reply drafted and posted for you, 24 to 48 hours after they arrive. Available on every plan except Starter.",
  },
  {
    title: "Your own customer page",
    body: "Optionally add a menu, hours, Wi-Fi, call and directions buttons under the review block, and switch any of them off later.",
  },
];

// Matches the Google-data wording in google-approval.md section 8 and the
// Privacy Policy; keep the two in step when either changes.
const googleDataPoints = [
  "We read your Business Profile account and location names, and the reviews for the location you connect, using Google's business.manage permission.",
  "We use that data only to show you your reviews and to post the replies you have enabled.",
  "We do not sell Google user data, use it for advertising, or use it to train AI models.",
  "You can disconnect in Settings, or revoke access any time in your Google Account permissions. We then delete the stored tokens.",
  "Syehere's use and transfer of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.",
];

function planCta(plan: Plan): { label: string; href: string } {
  if (plan.id === "enterprise") {
    return { label: "Contact us", href: `mailto:${site.supportEmail}` };
  }
  if (plan.id === "free") {
    return { label: "Start free", href: "/signup" };
  }
  return { label: "Get started", href: "/signup" };
}

export default function HomePage() {
  return (
    <>
      <Navbar
        productName={site.productName}
        links={navLinks}
        signInHref="/login"
        cta={{ label: "Get started", href: "/signup" }}
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue/5 via-white to-brand-green/10">
          <div className="mx-auto grid max-w-6xl gap-3xl px-lg py-3xl sm:px-xl lg:grid-cols-2 lg:items-center lg:py-[64px]">
            <div>
              <Logo variant="horizontal" height={30} className="mb-xl" />
              <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
                Review funnel for local businesses
              </p>
              <h1 className="mt-md font-display text-[32px] font-medium leading-[1.15] sm:text-[44px]">
                More Google reviews, and fewer public complaints.
              </h1>
              <p className="mt-lg max-w-xl text-[16px] leading-relaxed text-ink-muted">
                One scan opens a fair choice: continue to Google with a review
                written from their answers, or send you a private message — so
                a complaint reaches you, not your rating.
              </p>
              <div className="mt-2xl flex flex-wrap gap-md">
                <ButtonLink href="/signup" size="lg">
                  Start free
                </ButtonLink>
                <ButtonLink href="#pricing" variant="secondary" size="lg">
                  See pricing
                </ButtonLink>
              </div>
              <p className="mt-lg text-[13px] text-ink-muted">
                Free plan includes{" "}
                {limitLabel(plans.free.monthly_scans)} scans a month. No
                payment needed to start.
              </p>
            </div>

            {/* Illustrative mock of the customer page (not a real screenshot). */}
            <div className="rounded-card bg-gradient-to-br from-brand-blue/10 to-brand-green/15 p-2xl">
              <div className="mx-auto max-w-[320px] rounded-card border border-black/10 bg-white p-lg shadow-soft">
                <div className="flex items-center gap-md">
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 rounded-pill bg-gradient-to-br from-brand-blue to-brand-green"
                  />
                  <div>
                    <p className="text-[13px] font-medium">Your business</p>
                    <p className="text-[12px] text-ink-muted">
                      How was your experience?
                    </p>
                  </div>
                </div>
                <div className="mt-lg grid gap-sm">
                  <div className="rounded-control bg-brand-green px-lg py-lg text-center font-medium text-white">
                    Great
                  </div>
                  <div className="rounded-control border border-ink bg-white px-lg py-lg text-center font-medium text-ink">
                    Not great
                  </div>
                </div>
                <p className="mt-md text-center text-[12px] text-ink-muted">
                  No app. No login. One tap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <Section
          id="how-it-works"
          title="How it works"
          subtitle="Three taps, from the table to Google."
        >
          <ol className="grid gap-md md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-card border border-black/10 bg-white p-lg shadow-soft"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-pill bg-brand-blue/10 text-[13px] font-medium text-brand-blue">
                  {index + 1}
                </span>
                <h3 className="mt-lg text-[15px] font-medium">{step.title}</h3>
                <p className="mt-sm text-[13px] leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Features */}
        <Section
          className="bg-surface-muted"
          title="Everything you need to collect reviews"
          subtitle="No app for customers, no extra hardware for you beyond the code you print."
        >
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} title={feature.title}>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {feature.body}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Pricing */}
        <Section
          id="pricing"
          title="Simple pricing"
          subtitle="Every plan includes the review funnel, the customer page and the dashboard. Google review auto-reply is on every plan except Starter."
        >
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {planOrder.map((id) => {
              const plan = plans[id];
              const cta = planCta(plan);
              return (
                <div
                  key={id}
                  className="flex flex-col rounded-card border border-black/10 bg-white p-lg shadow-soft"
                >
                  <h3 className="text-[15px] font-medium">{plan.name}</h3>
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
                  </dl>
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
          <p className="mt-lg text-[13px] text-ink-muted">
            Prices are in INR and match what our payment provider charges. Only
            the Enterprise plan has more than one location.
          </p>
        </Section>

        {/* How we use your Google data */}
        <Section
          id="google-data"
          className="bg-surface-muted"
          title="How we use your Google data"
          subtitle="The short version. The full detail is in our Privacy Policy."
        >
          <div className="grid gap-2xl lg:grid-cols-[2fr_1fr]">
            <ul className="grid gap-md">
              {googleDataPoints.map((point) => (
                <li key={point} className="flex gap-md text-[14px] leading-relaxed text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-pill bg-brand-green"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Card title="Deletion and support">
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Send deletion or data questions to{" "}
                <a
                  href={`mailto:${site.supportEmail}`}
                  className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  {site.supportEmail}
                </a>
                . Read the full details in our{" "}
                <Link
                  href="/privacy"
                  className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </Card>
          </div>
        </Section>

        {/* Closing call to action */}
        <Section>
          <div className="rounded-card bg-gradient-to-r from-brand-blue to-brand-green px-2xl py-3xl text-center">
            <h2 className="font-display text-[24px] font-medium text-white sm:text-[28px]">
              Ready to turn scans into reviews?
            </h2>
            <p className="mx-auto mt-md max-w-xl text-[15px] leading-relaxed text-white/90">
              Set up your review funnel in a few minutes, then print the code
              and put it on every table and counter.
            </p>
            <div className="mt-2xl flex justify-center">
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Start free
              </ButtonLink>
            </div>
            <p className="mt-lg text-[13px] text-white/90">
              Questions? Email{" "}
              <a
                href={`mailto:${site.supportEmail}`}
                className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {site.supportEmail}
              </a>
            </p>
          </div>
        </Section>
      </main>

      {/* Shared footer supplies the registered business name, support email and
          phone, and the full public policy link set. */}
      <Footer />
    </>
  );
}

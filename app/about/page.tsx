import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Section } from "@/components/section";
import { publicNavLinks, site } from "@/lib/mock/site";

export const metadata: Metadata = {
  title: "About — Syehere",
  description:
    "Syehere is a review funnel platform that turns QR scans into Google reviews, with a fair two-way choice on every scan: post publicly, or message the owner privately.",
};

const pillars = [
  {
    title: "A review funnel",
    body: "A QR code or NFC tag opens one page. Customers choose between continuing to Google with a review written from their answers, or sending the owner a private message — two equally clear options.",
  },
  {
    title: "QR and NFC, printed once",
    body: "Codes point at a permanent short link, so changing what is behind them never means reprinting the code on your tables and counters.",
  },
  {
    title: "AI-written reviews and replies",
    body: "Customers answer a few quick questions and get short, natural review text to copy in one tap. Google reviews can also be answered automatically, 24 to 48 hours after they arrive.",
  },
  {
    title: "A dashboard that shows the numbers",
    body: "Scans, reviews collected, average rating and the private messages customers send you, so you can fix a problem early.",
  },
];

export default function AboutPage() {
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
              About
            </p>
            <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[36px]">
              About Syehere
            </h1>
            <p className="mt-lg text-[16px] leading-relaxed text-ink-muted">
              Syehere is a review funnel for local businesses — cafés,
              restaurants, salons, gyms, retail shops and more. A customer scans
              the QR code on the table or taps the NFC tag at the counter, chooses
              whether they are happy, and Syehere routes them either to a Google
              review or to a private message to the owner. No app, no login, one
              tap.
            </p>
            <p className="mt-md text-[16px] leading-relaxed text-ink-muted">
              The goal is simple: collect more reviews from customers who had a
              good experience, and hear about the bad ones privately, while the
              problem can still be fixed.
            </p>
          </div>
        </Section>

        <Section
          className="bg-surface-muted"
          width="wide"
          title="What Syehere does"
          subtitle="Everything on one small page your customers already know how to use."
        >
          <div className="grid gap-md sm:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title} title={pillar.title}>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {pillar.body}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        <Section width="wide" title="Who we are">
          <div className="grid gap-2xl md:grid-cols-[1.4fr_1fr]">
            <div className="text-[14px] leading-relaxed text-ink-muted">
              <p>
                Syehere is operated by{" "}
                <strong className="text-ink">
                  {site.legalBusinessName}
                </strong>
                , registered at {site.registeredAddress}, {site.country}.
              </p>
              <p className="mt-md">
                We are a small team building a focused product: help a business
                earn the reviews it deserves without gaming anyone. Syehere does
                not write fake reviews and does not buy ratings; it only makes it
                easier for a real, happy customer to say so.
              </p>
              <p className="mt-md">
                Questions, or want a walkthrough before you sign up?{" "}
                <Link
                  href="/contact"
                  className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Contact us
                </Link>
                .
              </p>
            </div>
            <Card title="Registered business details">
              <dl className="grid gap-sm text-[13px]">
                <div>
                  <dt className="text-ink-muted">Business name</dt>
                  <dd className="text-ink">{site.legalBusinessName}</dd>
                </div>
                <div className="mt-sm">
                  <dt className="text-ink-muted">Registered address</dt>
                  <dd className="text-ink">{site.registeredAddress}</dd>
                </div>
                <div className="mt-sm">
                  <dt className="text-ink-muted">Country</dt>
                  <dd className="text-ink">{site.country}</dd>
                </div>
              </dl>
            </Card>
          </div>
          <div className="mt-2xl flex flex-wrap gap-md">
            <ButtonLink href="/pricing" size="lg">
              See pricing
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contact us
            </ButtonLink>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

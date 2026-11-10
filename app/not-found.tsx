import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { publicNavLinks, site } from "@/lib/mock/site";

export const metadata: Metadata = {
  title: "Page not found — Syehere",
  description: "The page you were looking for could not be found.",
};

/**
 * Branded 404 (security-and-reliability.md 5A item 7). Friendly wording only:
 * no internals, no error text, nothing about how the site is built.
 */
export default function NotFound() {
  return (
    <>
      <Navbar
        productName={site.productName}
        links={publicNavLinks}
        cta={{ label: "Start free", href: "/signup" }}
      />

      <main className="px-lg py-3xl sm:px-xl">
        <div className="mx-auto max-w-xl py-3xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
            404
          </p>
          <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
            We couldn&apos;t find that page.
          </h1>
          <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">
            The link may be out of date, or the page may have moved. You can head
            back home, or get in touch with{" "}
            <a
              href={`mailto:${site.supportEmail}`}
              className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {site.supportEmail}
            </a>{" "}
            and we will point you the right way.
          </p>
          <div className="mt-2xl flex flex-wrap justify-center gap-md">
            <ButtonLink href="/" size="lg">
              Back to home
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

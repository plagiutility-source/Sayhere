"use client";

import { Button, ButtonLink } from "@/components/button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { publicNavLinks, site } from "@/lib/mock/site";

/**
 * Branded route error boundary (security-and-reliability.md 5A item 7).
 *
 * MUST NOT render `error.message`, `error.stack` or any provider text. The only
 * thing surfaced from the error is Next's own short `digest`, which support can
 * quote. Nothing is logged to the browser console (5A item 11).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Navbar
        productName={site.productName}
        links={publicNavLinks}
        cta={{ label: "Start free", href: "/sign-up" }}
      />

      <main className="px-lg py-3xl sm:px-xl">
        <div className="mx-auto max-w-xl py-3xl text-center">
          <h1 className="font-display text-[28px] font-medium leading-tight sm:text-[34px]">
            Something went wrong on our side.
          </h1>
          <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">
            The page could not be loaded. Please try again — if it keeps
            happening, contact us and quote the reference below.
          </p>

          {error.digest ? (
            <p className="mt-lg text-[13px] text-ink-muted">
              Reference: <span className="font-medium text-ink">{error.digest}</span>
            </p>
          ) : null}

          <div className="mt-2xl flex flex-wrap justify-center gap-md">
            <Button size="lg" onClick={() => reset()}>
              Try again
            </Button>
            <ButtonLink href="/" variant="secondary" size="lg">
              Back to home
            </ButtonLink>
          </div>

          <p className="mt-xl text-[13px] text-ink-muted">
            Need help now?{" "}
            <a
              href={`mailto:${site.supportEmail}`}
              className="text-ink underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {site.supportEmail}
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review page not found",
  robots: { index: false, follow: false },
};

/**
 * Shown for an unknown slug or one that fails the `^[a-z0-9]{6}$` format check.
 * Friendly wording only — no internals, no error text (security 5A).
 */
export default function ReviewNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-lg">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-[22px] font-medium leading-tight">
          We couldn&apos;t find that review page.
        </h1>
        <p className="mt-md text-[15px] text-ink-muted">
          The link may be out of date or mistyped. Ask the business for their
          latest link or QR code.
        </p>
      </div>
    </main>
  );
}

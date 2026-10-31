import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Focused shell for the auth screens (/login, /signup, /forgot-password,
 * /verify-email): the product logo, one centered card column and a way back to
 * the marketing site. No public navbar or footer here, so nothing competes with
 * the form. Onboarding has its own wizard shell.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/* Brand hairline, matching the logo gradient (brand-guide.md). */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-brand-blue to-brand-green"
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-lg py-xl sm:px-xl">
        <Link
          href="/"
          aria-label="Syehere home"
          className="inline-flex items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <Logo variant="horizontal" height={26} />
        </Link>
        <Link
          href="/"
          className="text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          Back to home
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-lg pb-3xl pt-sm sm:px-xl">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="px-lg py-xl text-center text-[12px] text-ink-muted sm:px-xl">
        Syehere turns happy customers into Google reviews.
      </footer>
    </div>
  );
}

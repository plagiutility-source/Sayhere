import Link from "next/link";
import { ButtonLink } from "./button";
import { Logo } from "./logo";

export type NavLink = { label: string; href: string };

type NavbarProps = {
  productName?: string;
  links?: readonly NavLink[];
  signInHref?: string;
  cta?: NavLink;
};

/** Sticky top navigation for the public marketing pages. */
export function Navbar({
  productName = "Syehere",
  links = [],
  signInHref = "/login",
  cta,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-lg px-lg sm:px-xl"
      >
        <Link
          href="/"
          aria-label={`${productName} home`}
          className="flex items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <Logo variant="horizontal" height={26} />
        </Link>

        <div className="hidden items-center gap-xl md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-lg">
          <Link
            href={signInHref}
            className="hidden text-[14px] font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue sm:inline"
          >
            Sign in
          </Link>
          {cta ? (
            <ButtonLink href={cta.href} size="md">
              {cta.label}
            </ButtonLink>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

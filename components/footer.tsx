import Link from "next/link";
import { Logo } from "./logo";
import { publicFooterLinks, site } from "@/lib/mock/site";

export type FooterLink = { label: string; href: string };

type FooterProps = {
  productName?: string;
  tagline?: string;
  /** Registered business name; required on every public page by Cashfree. */
  legalBusinessName?: string;
  supportEmail?: string;
  supportPhone?: string;
  links?: readonly FooterLink[];
};

/**
 * Public footer: brand, registered business name, support email and phone, and
 * the policy links every public page must carry (cashfree-approval.md §1).
 * Defaults come from `lib/mock/site.ts`, so a page only needs `<Footer />`.
 */
export function Footer({
  productName = site.productName,
  tagline = site.tagline,
  legalBusinessName = site.legalBusinessName,
  supportEmail = site.supportEmail,
  supportPhone = site.supportPhone,
  links = publicFooterLinks,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-surface-muted">
      <div className="mx-auto max-w-6xl px-lg py-3xl sm:px-xl">
        <div className="flex flex-col gap-2xl md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo variant="horizontal" height={26} />
            {tagline ? (
              <p className="mt-md text-[13px] text-ink-muted">{tagline}</p>
            ) : null}
            <p className="mt-lg text-[13px] text-ink">
              {legalBusinessName}
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-sm">
            <h2 className="text-[12px] uppercase tracking-[0.05em] text-ink-muted">
              Syehere
            </h2>
            <ul className="grid gap-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-sm">
            <h2 className="text-[12px] uppercase tracking-[0.05em] text-ink-muted">
              Support
            </h2>
            <a
              href={`mailto:${supportEmail}`}
              className="text-[13px] text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {supportEmail}
            </a>
            <a
              href={`tel:${supportPhone.replace(/[^+\d]/g, "")}`}
              className="text-[13px] text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {supportPhone}
            </a>
          </div>
        </div>

        <p className="mt-2xl text-[12px] text-ink-muted">
          © {year} {productName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

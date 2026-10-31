import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { legalDraftNotice, publicNavLinks, site } from "@/lib/mock/site";

export type LegalTocItem = { id: string; heading: string };

type LegalPageProps = {
  title: string;
  /** Kept as the `[DATE]` placeholder until the owner sets a real date. */
  lastUpdated?: string;
  /** Provide for long pages; a table of contents is shown for 4+ sections. */
  sections?: readonly LegalTocItem[];
  children: ReactNode;
};

/**
 * Shared shell for the public legal pages: the public nav, a readable-width
 * article, a title, "last updated", the draft notice and an optional table of
 * contents. Reuses the 1A Navbar/Footer rather than a second design system.
 */
export function LegalPage({
  title,
  lastUpdated = "[DATE]",
  sections = [],
  children,
}: LegalPageProps) {
  const showToc = sections.length >= 4;

  return (
    <>
      <Navbar
        productName={site.productName}
        links={publicNavLinks}
        cta={{ label: "Start free", href: "/sign-up" }}
      />

      <main className="px-lg py-3xl sm:px-xl">
        <article className="mx-auto max-w-3xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
            Legal
          </p>
          <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-sm text-[13px] text-ink-muted">
            Last updated: {lastUpdated}
          </p>

          <p
            role="note"
            className="mt-lg rounded-control border border-brand-yellow bg-brand-yellow/20 px-lg py-md text-[13px] font-medium text-ink"
          >
            {legalDraftNotice}
          </p>

          {showToc ? (
            <nav
              aria-label="On this page"
              className="mt-2xl rounded-card border border-black/10 bg-surface-muted p-lg"
            >
              <h2 className="text-[13px] font-medium">On this page</h2>
              <ol className="mt-sm grid gap-sm text-[13px]">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="mt-2xl grid gap-2xl">{children}</div>
        </article>
      </main>

      <Footer />
    </>
  );
}

type LegalSectionProps = {
  id: string;
  heading: string;
  children: ReactNode;
};

/** One numbered section of a legal page, with the section id as its anchor. */
export function LegalSection({ id, heading, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-[18px] font-medium text-ink sm:text-[20px]">
        {heading}
      </h2>
      <div className="mt-md grid gap-md text-[14px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

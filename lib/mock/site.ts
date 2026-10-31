/**
 * Site-level mock data: product name, contact details and the public page links.
 *
 * Every business/contact value here is a PLACEHOLDER on purpose. The real
 * registered business name, support email, phone number, registered address and
 * production domain are owner decisions listed as open items in PROGRESS.md
 * ("Open decisions"), and Cashfree cannot activate the account until they are
 * supplied. This is frontend-only mock data for Stage 1; wire it to real config
 * in a later stage.
 *
 * NEVER replace these with a plausible-looking real name, phone number or
 * address. Keep the [BRACKET] form so unfinished values stay visible on the
 * page until the owner fills them in.
 */

export const site = {
  productName: "Syehere",
  tagline: "Turn happy customers into Google reviews.",
  description:
    "Syehere turns one QR scan into more Google reviews — with a fair choice on every scan: post publicly, or message the owner privately.",

  // Owner-supplied values (PROGRESS.md "Open decisions"). Brackets are
  // deliberate: do not invent these.
  legalBusinessName: "[REGISTERED BUSINESS NAME]",
  supportEmail: "[SUPPORT EMAIL]",
  supportPhone: "[SUPPORT PHONE]",
  registeredAddress: "[REGISTERED ADDRESS]",
  country: "[COUNTRY]",
  domain: "[PRODUCTION DOMAIN]",
} as const;

/** Public marketing / legal pages, in navigation order. */
export const publicNavLinks = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * The link set that MUST appear in the footer of every public page
 * (cashfree-approval.md section 1 and the 1B task rules).
 */
export const publicFooterLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Payment Policy", href: "/payment-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
] as const;

/** Shown on every legal page while the wording is still unreviewed. */
export const legalDraftNotice =
  "Draft for development. Not yet reviewed by a lawyer.";

/** The legal docs all carry "Last updated: [DATE]"; the owner sets the real date. */
export const legalLastUpdated = "[DATE]";

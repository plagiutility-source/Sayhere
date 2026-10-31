/**
 * Client-side validation limits and helpers for the auth + onboarding forms.
 *
 * Every limit here comes from the docs — do not invent new ones:
 * - Email 254 and business name 100 / tagline 120 / URLs 2048:
 *   security-and-reliability.md section 4A.
 * - Password minimum 8: security-and-reliability.md section 1
 *   (Firebase console password policy of at least 8 characters).
 * - Google review host allowlist: security-and-reliability.md section 4.
 *
 * These run in the browser only to give a friendly message; Stage 3 enforces
 * the same rules on the server (security-and-reliability.md section 4A).
 */

export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_BUSINESS_NAME_LENGTH = 100;
export const MAX_TAGLINE_LENGTH = 120;
export const MAX_REVIEW_URL_LENGTH = 2048;

/** Exactly the allowlist in security-and-reliability.md section 4. */
export const GOOGLE_REVIEW_HOSTS = [
  "google.com",
  "g.page",
  "goo.gl",
  "maps.app.goo.gl",
  "search.google.com",
] as const;

/** Matches any host that is, or is a subdomain of, one of the allowlisted hosts. */
export function isAllowedGoogleReviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return GOOGLE_REVIEW_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/**
 * Returns an error message, or `undefined` when the value is acceptable.
 * Empty is handled by the caller so it can say "required" instead.
 */
export function validateGoogleReviewUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length > MAX_REVIEW_URL_LENGTH) {
    return `Keep the link under ${MAX_REVIEW_URL_LENGTH} characters.`;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Enter a valid link starting with https://";
  }
  if (url.protocol !== "https:") {
    return "The link must start with https://";
  }
  if (!isAllowedGoogleReviewHost(url.hostname)) {
    return "That is not a Google review link. Use a google.com, g.page, goo.gl, maps.app.goo.gl or search.google.com link.";
  }
  return undefined;
}

/** Loose but safe email check: shape only, never a claim that the address exists. */
export function isValidEmail(value: string): boolean {
  if (value.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Shared message so every form words the requirement the same way. */
export const EMAIL_FORMAT_MESSAGE = "Enter a valid email address.";
export const PASSWORD_LENGTH_MESSAGE = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;

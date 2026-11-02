/**
 * Public links for the QR codes (spec section 14 item 2: the QR encodes
 * `${origin}/r/<slug>/<code>`; the reception QR keeps the existing
 * `/r/<slug>` page).
 */

/** The path a QR encodes. `code` of `reception` is the existing page. */
export function spotPath(slug: string, code: string): string {
  return code === "reception" ? `/r/${slug}` : `/r/${slug}/${code}`;
}

/** Prepend the runtime origin so the QR works from a phone camera. */
export function absoluteUrl(origin: string, path: string): string {
  return `${origin}${path}`;
}

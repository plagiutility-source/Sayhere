"use client";

import { qrDataUrl } from "@/lib/rooms/qr";
import { cx } from "./ui";

/**
 * Renders the demo's QR SVG through an `<img>` data URL, so the markup is
 * identical without `dangerouslySetInnerHTML`. Callers pass a full URL built
 * with `absoluteUrl(origin, spotPath(slug, code))` once the origin is known.
 */
export function QrArt({ url, className }: { url: string; className?: string }) {
  return <img src={qrDataUrl(url)} alt="QR code" className={cx("block h-auto w-full", className)} />;
}

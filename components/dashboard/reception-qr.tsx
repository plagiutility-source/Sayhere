"use client";

/**
 * The scannable reception QR for one location — the code a customer scans to
 * open the review/customer page (`/r/<slug>`).
 *
 * The review funnel is the core product: it is on every plan (Free and Starter
 * included) and for every business type. So this QR is NOT behind
 * `supportsOrdering` — that gate exists for the per-table/room QR codes, which
 * only café, restaurant and hotel get. Before this, `/locations` showed only a
 * "QR code: built in a later stage" placeholder to salon, gym, retail and other
 * businesses (and to every Starter business), so those owners had no code to
 * print.
 *
 * The QR encodes the ABSOLUTE url, and the origin is only known in the browser,
 * so it is read after mount. Server render and the first client render both
 * show the same neutral box (no hydration mismatch), then the real code
 * appears.
 */

import { useEffect, useState } from "react";
import { QrArt } from "@/components/rooms/shared/QrArt";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";

export function ReceptionQr({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!origin) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-control border border-dashed border-black/15 bg-surface-muted p-3 text-center">
        <span className="text-[12px] text-ink-muted">Preparing your QR…</span>
      </div>
    );
  }

  const url = absoluteUrl(origin, spotPath(slug, "reception"));

  return <QrArt url={url} />;
}

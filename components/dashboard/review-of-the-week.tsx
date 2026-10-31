"use client";

import { useState } from "react";
import { ShareIcon } from "./icons";

/**
 * Engagement extra (PRD.md 5.1): "review of the week" callout with a one-tap
 * share button. Uses the Web Share API when available and falls back to the
 * clipboard with a "Copied" status message. No social SDKs, no console logging.
 *
 * The docs do not say exactly what text is shared, so a short product line is
 * used; logged as an open question in PROGRESS.md.
 */
export function ReviewOfTheWeek({
  businessName,
  customer,
  color,
}: {
  businessName: string;
  customer: string;
  color: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `Another happy customer at ${businessName}!`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: businessName, text });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled the share sheet; nothing to do.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-black/10 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[12px] text-ink-muted">Review of the week</p>
        <p className="mt-1 truncate text-[13px] text-ink">
          <span className="font-medium">{customer}</span> left a Google review
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-9 items-center gap-2 rounded-control px-3 text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          style={{ backgroundColor: color }}
        >
          <ShareIcon size={16} />
          Share
        </button>
        <span role="status" aria-live="polite" className="text-[12px] text-ink-muted">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </div>
  );
}

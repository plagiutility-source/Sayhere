"use client";

import { RefreshIcon } from "./icons";

/**
 * Inline error state for one dashboard section (PRD.md 5.2 error state). Short
 * friendly wording only — no technical detail, variable or provider names
 * (security-and-reliability.md 5A).
 */
export function SectionError({
  onRetry,
  label,
}: {
  onRetry: () => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-4">
      <p className="text-[13px] text-ink-muted">
        {label
          ? `Couldn't load ${label}. Please try again.`
          : "Couldn't load this section. Please try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        <RefreshIcon size={16} />
        Retry
      </button>
    </div>
  );
}

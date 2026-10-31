"use client";

/**
 * The fair chooser (owner request, 2026-10-14). After the thumbs tap, EVERY
 * customer sees this same page: two equally clear options — continue to Google
 * or send a private message to the owner. No dark patterns: same size, same
 * weight, nothing hidden or greyed out.
 */

import type { BrandTheme } from "@/lib/brand/theme";
import { BackButton } from "./back-button";
import { ChatIcon, StarIcon } from "./icons";

export function ChoiceScreen({
  businessName,
  theme,
  onGoogle,
  onContact,
  onBack,
}: {
  businessName: string;
  theme: BrandTheme;
  onGoogle: () => void;
  onContact: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <BackButton
        label="Thank you!"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />

      <p className="mt-lg text-center text-[16px] leading-relaxed text-ink">
        How would you like to continue?
      </p>
      <p className="mt-xs text-center text-[14px] text-ink-muted">
        Both options help {businessName} — pick whichever feels right.
      </p>

      <div className="mt-xl grid gap-md">
        <button
          type="button"
          onClick={onGoogle}
          className="flex w-full items-center gap-md rounded-card bg-[var(--cp-primary)] p-lg text-left text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span className="shrink-0">
            <StarIcon size={26} />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-medium">
              Continue on Google
            </span>
            <span className="mt-xs block text-[13px] opacity-90">
              Share your experience publicly in a Google review.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onContact}
          className="flex w-full items-center gap-md rounded-card border border-black/15 bg-white p-lg text-left text-ink transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span className="shrink-0" style={{ color: theme.primary }}>
            <ChatIcon size={26} />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-medium">
              Contact the owner
            </span>
            <span className="mt-xs block text-[13px] text-ink-muted">
              Send a private message — the owner and our team read every one.
            </span>
          </span>
        </button>
      </div>

      <p className="mt-lg text-center text-[13px] text-ink-muted">
        No wrong choice — you can always do both.
      </p>
    </div>
  );
}

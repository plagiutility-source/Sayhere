"use client";

/**
 * Google options (owner request, 2026-10-14). The plain "post a review on
 * Google" button is ALWAYS visible — the questions are an extra offer, never a
 * gate. An invalid Google link is hidden with the neutral message, the same
 * rule the review screen uses (security-and-reliability.md).
 */

import type { BrandTheme } from "@/lib/brand/theme";
import { BackButton } from "./back-button";
import { ListIcon, StarIcon } from "./icons";

export function GoogleScreen({
  theme,
  reviewUrl,
  reviewUrlValid,
  onWriteForMe,
  onBack,
}: {
  theme: BrandTheme;
  reviewUrl: string;
  reviewUrlValid: boolean;
  onWriteForMe: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <BackButton
        label="Google review"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />

      <p className="mt-lg text-center text-[15px] text-ink-muted">
        Two ways to do it — pick whichever feels easier.
      </p>

      <div className="mt-xl grid gap-md">
        {reviewUrlValid ? (
          <>
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <StarIcon size={22} />
              Post a review on Google
            </a>
            <p className="text-center text-[12px] text-ink-muted">
              Opens Google — write whatever feels right.
            </p>
          </>
        ) : (
          <p
            role="status"
            className="rounded-control border border-black/10 bg-surface-muted px-md py-sm text-center text-[13px] text-ink-muted"
          >
            The Google link isn&apos;t available right now. You can still tell
            the owner below — that reaches a real person.
          </p>
        )}

        <section className="rounded-card border border-black/10 bg-white p-lg text-left shadow-soft">
          <h2 className="flex items-center gap-sm text-[17px] font-medium">
            <span style={{ color: theme.primary }}>
              <ListIcon size={22} />
            </span>
            Want us to write it for you?
          </h2>
          <p className="mt-sm text-[13px] leading-relaxed text-ink-muted">
            Answer a few quick questions and we&apos;ll write a review you can
            copy and paste on Google.
          </p>
          <button
            type="button"
            onClick={onWriteForMe}
            className="mt-md inline-flex h-11 w-full items-center justify-center rounded-control border border-[var(--cp-primary)] px-lg text-[15px] font-medium text-[var(--cp-primary)] transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Write it for me
          </button>
        </section>

        {reviewUrlValid ? (
          <p className="text-center text-[12px] text-ink-muted">
            The Google button above always works — the questions are optional.
          </p>
        ) : null}
      </div>
    </div>
  );
}

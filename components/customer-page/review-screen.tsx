"use client";

import { useEffect, useState } from "react";
import type { BrandTheme } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import { Confetti } from "./confetti";
import { CheckIcon, CopyIcon, StarIcon } from "./icons";
import {
  fallbackReviewText,
  generateReviewText,
  type ReviewAnswers,
  type ReviewGenMode,
} from "@/lib/mock/review";

type ReviewScreenProps = {
  slug: string;
  businessType: BusinessType;
  theme: BrandTheme;
  reviewUrl: string;
  reviewUrlValid: boolean;
  mode: ReviewGenMode;
  /** "Write it for me" answers; only these are used in the review text. */
  answers: ReviewAnswers;
  /** Clear path to the thank-you screen after copying or posting. */
  onContinue: () => void;
  onBack: () => void;
};

/**
 * Copies text with the Clipboard API, falling back to select-the-text +
 * `execCommand("copy")` when the API is unavailable. No library.
 */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the selection fallback
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function ReviewScreen({
  slug,
  businessType,
  theme,
  reviewUrl,
  reviewUrlValid,
  mode,
  answers,
  onContinue,
  onBack,
}: ReviewScreenProps) {
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCopied(false);

    // TODO(stage 5): verify the Cloudflare Turnstile token here (server-side
    // siteverify) BEFORE requesting AI text. Nothing is loaded in Stage 1.
    generateReviewText(slug, { businessType, mode, answers })
      .then((result) => {
        if (!active) return;
        setText(result.text);
        setUsedFallback(result.usedFallback);
        setLoading(false);
      })
      .catch(() => {
        // Both providers failed in the real build -> pre-written fallback
        // template, with no error shown to the customer (section 8).
        if (!active) return;
        setText(fallbackReviewText(businessType));
        setUsedFallback(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, businessType, mode, answers]);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    setCopied(ok);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-11 items-center gap-xs rounded-control px-sm text-[14px] font-medium text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        ← Back
      </button>

      <div className="relative mt-lg">
        {!loading && !usedFallback ? <Confetti /> : null}

        <h1
          className="text-center font-display text-[22px] font-medium leading-tight"
          style={{ color: theme.primary }}
        >
          Your review is ready
        </h1>
        <p className="mt-sm text-center text-[14px] text-ink-muted">
          Copy it, then paste it on Google.
        </p>

        {/* Turnstile placeholder: the bot check runs before generation in Stage 5. */}
        <p className="mt-sm text-center text-[12px] text-ink-muted">
          Bot check placeholder — wired in a later stage.
        </p>

        <div
          className="mt-lg rounded-card border border-black/10 bg-white p-lg shadow-soft"
          aria-live="polite"
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="flex items-start gap-sm">
              <span style={{ color: theme.starColor }} className="mt-[2px] shrink-0">
                <StarIcon size={20} />
              </span>
              <p
                data-testid="generated-review"
                className="select-text text-[17px] leading-relaxed text-ink"
              >
                {text}
              </p>
            </div>
          )}
        </div>

        {!loading ? (
          <div className="mt-lg grid gap-md">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {copied ? <CheckIcon size={22} /> : <CopyIcon size={22} />}
              {copied ? "Copied" : "Copy review"}
            </button>
            <span role="status" aria-live="polite" className="sr-only">
              {copied ? "Review copied to clipboard" : ""}
            </span>

            {reviewUrlValid ? (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => setPosted(true)}
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control border border-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-primary)] transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Post to Google
              </a>
            ) : (
              <p
                className="rounded-control border border-black/10 bg-surface-muted px-md py-sm text-center text-[13px] text-ink-muted"
                role="status"
              >
                The Google link isn&apos;t available right now. Copy your review
                and paste it on Google yourself.
              </p>
            )}
          </div>
        ) : null}

        {!loading && (copied || posted) ? (
          <button
            type="button"
            onClick={onContinue}
            className="mt-lg w-full text-center text-[14px] font-medium text-ink-muted underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Continue
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-sm" aria-hidden="true">
      <div className="h-4 w-11/12 animate-pulse rounded bg-black/10" />
      <div className="h-4 w-full animate-pulse rounded bg-black/10" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  canConfirmCategory,
  categoryTextMatches,
} from "@/lib/category/confirm";
import {
  CATEGORY_CARDS,
  CATEGORY_POPUP_COPY,
  countdownLabel,
  typeToConfirmLabel,
} from "@/lib/category/copy";
import { CATEGORY_LABELS, type BusinessCategory } from "@/lib/category/types";
import { lockCategory, type CategoryLock } from "@/lib/mock/category-store";

type CategoryWarningPopupProps = {
  category: BusinessCategory;
  /** Closes the popup and clears the typed text (the ONLY way out). */
  onClosed: () => void;
  onLocked: (lock: CategoryLock) => void;
};

/**
 * The full-screen warning popup for the category gate.
 *
 * Covers the whole screen, traps focus, locks body scroll, ignores Esc and
 * outside clicks, blocks paste/drop, and enables the confirm button only when
 * the typed text matches AND 3 seconds have passed. The click handler checks
 * both again, writes the lock immediately, and only then lets the flow move on.
 */
export function CategoryWarningPopup({
  category,
  onClosed,
  onLocked,
}: CategoryWarningPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const openedAt = useRef(new Date());
  const [typed, setTyped] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string>();
  const [announcement, setAnnouncement] = useState("");

  const elapsed = now.getTime() - openedAt.current.getTime();
  const ready = elapsed >= 3000;
  const remaining = Math.max(0, Math.ceil((3000 - elapsed) / 1000));
  const matches = categoryTextMatches(category, typed);
  const card = CATEGORY_CARDS[category];

  // Countdown ticker.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 100);
    return () => window.clearInterval(timer);
  }, []);

  // Announce readiness once, politely.
  useEffect(() => {
    if (ready) setAnnouncement(CATEGORY_POPUP_COPY.readyAnnouncement);
  }, [ready]);

  // Focus trap, body scroll lock and focus restoration.
  useEffect(() => {
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Esc must NOT close the popup.
        event.preventDefault();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, []);

  function confirm() {
    const result = canConfirmCategory({
      category,
      typed,
      openedAt: openedAt.current,
      now: new Date(),
    });
    if (!result.ok) {
      setError(
        result.code === "too_soon"
          ? "Wait for the countdown to finish."
          : "Type the category name exactly as shown.",
      );
      return;
    }
    const lock = lockCategory({
      category,
      typedText: typed,
      confirmedAt: new Date(),
    });
    if (!lock) {
      setError(CATEGORY_POPUP_COPY.genericError);
      return;
    }
    onLocked(lock);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/60 sm:items-center sm:p-lg">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-popup-title"
        aria-describedby="category-popup-sub"
        tabIndex={-1}
        className="h-full w-full overflow-y-auto bg-white p-xl outline-none sm:h-auto sm:max-w-lg sm:rounded-card sm:shadow-soft"
      >
        <div className="flex items-start gap-md">
          <span className="mt-xs text-red-700" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3.5 21.5 20H2.5L12 3.5Z" />
              <path d="M12 9.5v4.5M12 17.2v.2" />
            </svg>
          </span>
          <div>
            <h2
              id="category-popup-title"
              className="font-display text-[22px] font-medium"
            >
              {CATEGORY_POPUP_COPY.headline}
            </h2>
            <p id="category-popup-sub" className="mt-sm text-[13px] leading-relaxed text-ink-muted">
              {CATEGORY_POPUP_COPY.subline}
            </p>
          </div>
        </div>

        <p className="mt-xl font-display text-[26px] font-medium">
          {CATEGORY_LABELS[category]}
        </p>

        <div className="mt-lg grid gap-lg sm:grid-cols-2">
          <section aria-labelledby="category-popup-gets">
            <h3 id="category-popup-gets" className="text-[13px] font-medium">
              You will get
            </h3>
            <ul className="mt-sm grid gap-xs text-[13px] leading-relaxed text-ink-muted">
              {card.gets.map((item) => (
                <li key={item} className="flex gap-xs">
                  <span aria-hidden="true" className="text-brand-green">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="category-popup-not-gets">
            <h3 id="category-popup-not-gets" className="text-[13px] font-medium">
              You will NOT get
            </h3>
            <ul className="mt-sm grid gap-xs text-[13px] leading-relaxed text-ink-muted">
              {card.doesNotGet.map((item) => (
                <li key={item} className="flex gap-xs">
                  <span aria-hidden="true" className="text-red-700">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-xl">
          <label htmlFor="category-confirm-text" className="block text-[13px] font-medium">
            {typeToConfirmLabel(category)}
          </label>
          <div className="relative mt-sm">
            <input
              id="category-confirm-text"
              name="category_confirm_text"
              type="text"
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value);
                setError(undefined);
              }}
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "category-confirm-error" : undefined}
              className={`h-12 w-full rounded-control border px-md pr-12 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                error ? "border-red-700" : "border-black/20"
              }`}
              placeholder={CATEGORY_LABELS[category]}
            />
            {matches ? (
              <span
                aria-hidden="true"
                className="absolute right-md top-1/2 -translate-y-1/2 text-brand-green"
              >
                ✓
              </span>
            ) : null}
          </div>
          <p className="mt-xs text-[11px] text-ink-muted">
            Paste is blocked here on purpose. Type it yourself.
          </p>
          {error ? (
            <p id="category-confirm-error" className="mt-xs text-[12px] text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="mt-xl grid gap-sm sm:grid-cols-2">
          <button
            type="button"
            onClick={onClosed}
            className="h-12 rounded-control border border-ink bg-white px-lg text-[14px] font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            {CATEGORY_POPUP_COPY.back}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready || !matches}
            className="h-12 rounded-control bg-brand-blue px-lg text-[14px] font-medium text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            {ready ? CATEGORY_POPUP_COPY.confirm : countdownLabel(remaining)}
          </button>
        </div>
      </div>
    </div>
  );
}

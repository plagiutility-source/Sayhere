"use client";

import { CATEGORY_CARDS, CATEGORY_POPUP_COPY } from "@/lib/category/copy";
import { CATEGORY_LABELS, type BusinessCategory } from "@/lib/category/types";
import { CategoryLockBadge } from "./category-lock-badge";

type CategoryPickerProps = {
  /** The confirmed category, or null while the owner is still choosing. */
  locked: BusinessCategory | null;
  /** The card under the open popup. */
  selected?: BusinessCategory | null;
  onSelect: (category: BusinessCategory) => void;
};

function CategoryIcon({ category }: { category: BusinessCategory }) {
  const common = {
    "aria-hidden": true,
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (category === "food") {
    return (
      <svg {...common}>
        <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11" />
        <circle cx="16.5" cy="12.5" r="4.5" />
      </svg>
    );
  }
  if (category === "hotel") {
    return (
      <svg {...common}>
        <path d="M3 19V8M3 15h18v4M21 19v-4a3 3 0 0 0-3-3h-7v3" />
        <circle cx="7" cy="11" r="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 10h16v10H4V10ZM3 10l2-5h14l2 5" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

/**
 * Step 1 of onboarding: three large cards, none selected. Choosing a card opens
 * the full-screen warning popup; nothing is saved until the popup confirms.
 * Once locked the other cards are removed (not disabled).
 */
export function CategoryPicker({
  locked,
  selected,
  onSelect,
}: CategoryPickerProps) {
  if (locked) {
    const card = CATEGORY_CARDS[locked];
    return (
      <div className="rounded-card border border-black/10 bg-white p-xl">
        <div className="flex flex-col items-start gap-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand-blue">
              <CategoryIcon category={locked} />
            </span>
            <div>
              <p className="text-[16px] font-medium">{CATEGORY_LABELS[locked]}</p>
              <p className="mt-xs text-[13px] text-ink-muted">{card.line}</p>
            </div>
          </div>
          <CategoryLockBadge category={locked} size="md" />
        </div>
        <p className="mt-lg text-[13px] text-ink-muted">
          {CATEGORY_POPUP_COPY.lockedLine}
        </p>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="sr-only">Business category</legend>
      <div className="grid gap-md sm:grid-cols-3">
        {(Object.keys(CATEGORY_CARDS) as BusinessCategory[]).map((category) => {
          const card = CATEGORY_CARDS[category];
          const isSelected = selected === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(category)}
              className={`flex min-h-[128px] flex-col items-start rounded-card border p-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-black/15 bg-white hover:bg-surface-muted"
              }`}
            >
              <span className="text-brand-blue">
                <CategoryIcon category={category} />
              </span>
              <span className="mt-md text-[15px] font-medium">{card.label}</span>
              <span className="mt-xs text-[13px] leading-relaxed text-ink-muted">
                {card.line}
              </span>
              <span className="mt-auto pt-md text-[11px] font-medium uppercase tracking-[0.04em] text-ink-muted">
                {CATEGORY_POPUP_COPY.cannotChange}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

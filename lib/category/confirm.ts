/**
 * The second verification of the category.
 *
 * The owner must type the category's OWN display name. The internal value
 * (`food`, `hotel`, `general`) never matches, so copying the stored value from
 * dev tools cannot confirm a category.
 */

import {
  CATEGORY_LABELS,
  type BusinessCategory,
} from "./types";

/** The 3-second guard before the confirm button becomes usable. */
export const CATEGORY_CONFIRM_DELAY_MS = 3000;

/**
 * Normalize the typed text and the display name the same way, so
 * `Restaurant & Café`, `restaurant & cafe`, `RESTAURANT AND CAFÉ` and
 * `  Restaurant   &   Café ` all compare equal.
 */
export function normalizeCategoryText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True only when the typed text is the category's display name. Unknown
 * categories never match (fail closed).
 */
export function categoryTextMatches(category: unknown, typed: unknown): boolean {
  if (typeof typed !== "string") return false;
  if (category !== "food" && category !== "hotel" && category !== "general") {
    return false;
  }
  const label = CATEGORY_LABELS[category as BusinessCategory];
  return normalizeCategoryText(typed) === normalizeCategoryText(label);
}

export type ConfirmCategoryResult =
  | { ok: true }
  | { ok: false; code: "text_mismatch" | "too_soon" };

/**
 * The real gate behind the confirm button: the text must match AND at least
 * 3 seconds must have passed since the popup opened. The click handler calls
 * this again; it never trusts the disabled state alone.
 */
export function canConfirmCategory({
  category,
  typed,
  openedAt,
  now,
}: {
  category: unknown;
  typed: unknown;
  openedAt: Date;
  now: Date;
}): ConfirmCategoryResult {
  if (!categoryTextMatches(category, typed)) {
    return { ok: false, code: "text_mismatch" };
  }
  const elapsed = now.getTime() - openedAt.getTime();
  if (!Number.isFinite(elapsed) || elapsed < CATEGORY_CONFIRM_DELAY_MS) {
    return { ok: false, code: "too_soon" };
  }
  return { ok: true };
}

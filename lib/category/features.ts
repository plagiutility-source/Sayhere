/**
 * Category normalization shared by the lock guard, the mock store and onboarding.
 *
 * Golden rule: FAIL CLOSED. A missing, unknown, wrongly-cased or non-string
 * category behaves exactly like `general`.
 */

import type { BusinessCategory } from "./types";

/**
 * Normalize a stored category. Unknown, missing, empty, wrongly-cased or
 * non-string values become `general`.
 */
export function normalizeCategory(value: unknown): BusinessCategory {
  if (value === "food" || value === "hotel" || value === "general") {
    return value;
  }
  return "general";
}

/**
 * The category lock: no path may change it.
 *
 * `guardBusinessPatch` is called before any business-profile write. The
 * database has the same guard in the `businesses_category_is_locked` trigger,
 * so a bug in code cannot change a category either.
 */

import { normalizeCategory } from "./features";
import {
  TYPES_BY_CATEGORY,
  categoryOfType,
  type BusinessCategory,
  type CategoryProfileFields,
} from "./types";

export type GuardResult =
  | { ok: true }
  | { ok: false; code: "category_locked" | "type_not_in_category" };

/** Fields that can never be changed once the category is locked. */
const LOCKED_FIELDS = [
  "business_category",
  "category_confirm_text",
  "category_confirmed_at",
] as const;

/**
 * Validate a proposed business-profile patch against the saved profile.
 * Changing the category or its confirmation is refused; a business type must
 * belong to the locked category (and a hotel can only be `hotel`).
 */
export function guardBusinessPatch(
  current: CategoryProfileFields,
  patch: Record<string, unknown>,
): GuardResult {
  for (const field of LOCKED_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(patch, field) &&
      patch[field] !== current[field]
    ) {
      return { ok: false, code: "category_locked" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "business_type")) {
    const category = normalizeCategory(current.business_category);
    const type = patch.business_type;
    if (
      typeof type !== "string" ||
      !(TYPES_BY_CATEGORY[category] as readonly string[]).includes(type)
    ) {
      return { ok: false, code: "type_not_in_category" };
    }
  }

  return { ok: true };
}

export type MigratedCategoryFields = {
  business_category: string;
  category_confirm_text: string;
  category_confirmed_at: string;
  verification_status: string;
};

/**
 * Give a profile saved before the category lock a category from its type.
 *
 * The built-in demo business is approved so the Stage 1 demo works; every other
 * legacy account starts `pending`. Running it twice returns the same values.
 */
export function migrateLegacyCategory<T extends CategoryProfileFields>(
  profile: T,
  isBuiltInDemo = false,
): T & MigratedCategoryFields {
  const raw = profile.business_category;
  const existingText =
    typeof profile.category_confirm_text === "string"
      ? profile.category_confirm_text
      : "legacy";
  const existingConfirmedAt =
    typeof profile.category_confirmed_at === "string"
      ? profile.category_confirmed_at
      : "";
  const existingStatus =
    typeof profile.verification_status === "string"
      ? profile.verification_status
      : isBuiltInDemo
        ? "approved"
        : "pending";

  const usable =
    raw === "food" || raw === "hotel" || raw === "general";
  if (usable || (raw !== undefined && raw !== null && raw !== "")) {
    // A present-but-garbage value is preserved; every rule treats it as
    // `general` (fail closed) until the developer resets the mock.
    return {
      ...profile,
      business_category: String(raw),
      category_confirm_text: existingText,
      category_confirmed_at: existingConfirmedAt,
      verification_status: existingStatus,
    };
  }

  return {
    ...profile,
    business_category: categoryOfType(profile.business_type),
    category_confirm_text: "legacy",
    category_confirmed_at: existingConfirmedAt,
    verification_status: isBuiltInDemo ? "approved" : "pending",
  };
}

/** Convenience for callers that only need the normalized category. */
export function lockedCategory(value: unknown): BusinessCategory {
  return normalizeCategory(value);
}

/**
 * The 3 locked business categories.
 *
 * Every business has exactly one category, chosen once at sign-up and locked
 * forever. This module owns the category vocabulary; the allowed/not-allowed
 * decisions live in `features.ts` and nothing else may copy the matrix.
 */

/** The stored category value. */
export type BusinessCategory = "food" | "hotel" | "general";

/** The name shown to people, per category. */
export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  food: "Restaurant & Café",
  hotel: "Hotel",
  general: "Other business",
};

/** Business types that can belong to a category (7, each in exactly one). */
export type CategoryBusinessType =
  | "cafe"
  | "restaurant"
  | "hotel"
  | "salon"
  | "gym"
  | "retail"
  | "other";

export const TYPES_BY_CATEGORY: Record<
  BusinessCategory,
  readonly CategoryBusinessType[]
> = {
  food: ["cafe", "restaurant"],
  hotel: ["hotel"],
  general: ["salon", "gym", "retail", "other"],
};

/** The category of a business type; unknown types fail closed to `general`. */
export function categoryOfType(type: unknown): BusinessCategory {
  if (typeof type !== "string") return "general";
  for (const category of Object.keys(TYPES_BY_CATEGORY) as BusinessCategory[]) {
    if ((TYPES_BY_CATEGORY[category] as readonly string[]).includes(type)) {
      return category;
    }
  }
  return "general";
}

/** The category-bearing shape of a saved business profile. */
export type CategoryProfileFields = {
  business_category?: unknown;
  category_confirm_text?: unknown;
  category_confirmed_at?: unknown;
  business_type?: unknown;
  verification_status?: unknown;
};

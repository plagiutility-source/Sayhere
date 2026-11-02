/**
 * The table/room QR ordering gate.
 *
 * ROOMS_QR_SPEC.md section 1: only cafe, restaurant and hotel get the feature.
 * Salon, gym, retail and other must see nothing new, so this fails closed for
 * every other value, including missing, unknown or wrongly-cased types.
 *
 * `categoryOfType()` is the existing type -> category vocabulary, so a type it
 * does not know can never pass. The category alone is not enough (salon is
 * `general` like gym and retail, but so is nothing that should pass), which is
 * why the three allowed types are listed rather than the category matrix
 * copied: `lib/category/features.ts` stays the only place that owns categories.
 */

import { categoryOfType } from "./types";

/** The only business types that get table/room QR ordering. */
export const TABLE_ORDERING_TYPES = ["cafe", "restaurant", "hotel"] as const;

export type TableOrderingBusinessType = (typeof TABLE_ORDERING_TYPES)[number];

/**
 * True when this business type gets ordering on tables/rooms.
 *
 * Unknown, missing or non-string values are false, matching the fail-closed
 * rule used by `normalizeCategory()`.
 */
export function supportsTableOrdering(
  businessType: unknown,
): businessType is TableOrderingBusinessType {
  if (typeof businessType !== "string") return false;
  if (categoryOfType(businessType) === "general") return false;
  return (TABLE_ORDERING_TYPES as readonly string[]).includes(businessType);
}

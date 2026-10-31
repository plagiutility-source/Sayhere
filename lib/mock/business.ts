/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * The mock's slug rules. In the real product a `review_pages.slug` is a random
 * permanent `^[a-z0-9]{6}$` string issued once per location
 * (security-and-reliability.md 4B item 8; business-rules.md 9 — a slug is never
 * re-issued). Stage 1 has no database, so the mock reserves ONE slug per
 * business type and onboarding issues the one that belongs to the type the
 * owner picked: a gym never gets the café's `cafe01`.
 *
 * Each reserved slug also has its own static `/r/[slug]` page
 * (`lib/mock/customer-page.ts`), so the link works even in a browser that has no
 * saved profile; a browser that does have one overlays the owner's own business
 * on top (`components/customer-page/customer-page.tsx`).
 *
 * Field names and the slug shape still match schema.sql, so Stage 4 replaces
 * `slugForType()` with the real "insert location -> issue slug" call with no
 * renaming.
 */

import type { BusinessType } from "@/lib/brand/tokens";

/**
 * The slug the mock issues per business type. Every value is `^[a-z0-9]{6}$`,
 * matching the confirmed `review_pages.slug` format.
 */
export const MOCK_TYPE_SLUGS: Record<BusinessType, string> = {
  cafe: "cafe01",
  restaurant: "resto1",
  hotel: "hotel1",
  salon: "glam01",
  gym: "gym001",
  retail: "store1",
  other: "other1",
};

/** The default mock business's slug (the 1D café demo / `/r/cafe01`). */
export const MOCK_REVIEW_SLUG = MOCK_TYPE_SLUGS.cafe;

/** The permanent slug the mock issues for a new business of this type. */
export function slugForType(type: BusinessType): string {
  return MOCK_TYPE_SLUGS[type];
}

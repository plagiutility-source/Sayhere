/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * Locations + review links for the `/locations` screen and the customer-page
 * editor. Field names match the `review_pages` table in schema.sql (`slug`,
 * `location_name`, `google_review_url`, `nfc_enabled`, `is_active`) so Stage 4
 * can swap this for real queries with no renaming. `scans_used` is a
 * display-only extra (the real per-location count is derived from `scan_events`
 * in Stage 4).
 *
 * Everything here is DERIVED from the shared business profile
 * (`lib/mock/store.ts`), so a gym never shows the café's name or slug: the
 * primary location's name/slug/link come from the profile the owner set up in
 * onboarding or Settings. The DEFAULT profile (a fresh visitor) still produces
 * exactly the old café demo — `cafe01`, "Brew and Bean", 955 scans — so every
 * `?demo=` scenario looks unchanged. A profile saved by onboarding/Settings is a
 * brand-new business, so its counters start at 0.
 *
 * Mutations (add location, regenerate link) live in the in-memory maps below so
 * they survive remounts but never leak between scenarios. Stage 4 replaces them
 * with real inserts/updates.
 */

import { type DemoScenario } from "@/lib/mock/demo";

export type MockLocation = {
  id: string;
  business_id: string;
  /** Permanent `^[a-z0-9]{6}$` slug; the only value a QR/NFC ever encodes. */
  slug: string;
  location_name: string;
  /** Per-location override; falls back to the business link when null (rules 9). */
  google_review_url: string | null;
  nfc_enabled: 0 | 1;
  is_active: 0 | 1;
  created_at: string;
  /** MOCK display only — Stage 4 derives it from `scan_events`. */
  scans_used: number;
};

/**
 * The bits of the business profile this module needs. Kept structural on
 * purpose: the store imports this module, so importing the store back would
 * make a cycle.
 */
export type LocationOwner = {
  name: string;
  /** The location's permanent slug (schema.sql: `review_pages.slug`). */
  slug: string;
  /** The business-level Google review link fallback (rules 9). */
  google_review_url: string;
};

const BUSINESS_ID = "biz_brew_and_bean";

/** Short link format from PRD.md 5.3. Display only; the real domain is TBD. */
export function shortLink(slug: string): string {
  return `syehere.co/${slug}`;
}

/**
 * Next free sibling slug for a new location. The base slug's letters and digit
 * width are kept, so `cafe01` -> `cafe02`, `gym001` -> `gym002`, `resto1` ->
 * `resto2`; every candidate must stay `^[a-z0-9]{6}$`
 * (security-and-reliability.md 4B).
 */
export function nextMockSlug(
  existing: readonly string[],
  baseSlug: string,
): string {
  const match = /^([a-z]{2,5})(\d{1,3})$/.exec(baseSlug);
  if (match) {
    const prefix = match[1];
    const width = match[2].length;
    const start = Number.parseInt(match[2], 10);
    for (let n = start + 1; n <= start + 98; n++) {
      const slug = `${prefix}${String(n).padStart(width, "0")}`;
      if (slug.length === 6 && !existing.includes(slug)) return slug;
    }
  }
  for (let n = 2; n < 100; n++) {
    const slug = `loc${String(n).padStart(3, "0")}`;
    if (!existing.includes(slug)) return slug;
  }
  return "loc999";
}

/**
 * The untouched locations for one business: the primary location always exists,
 * and the `enterprise` scenario adds a second one (its own slug and QR, rule 9).
 * `demoNumbers` keeps the static café demo's original sample counters.
 */
function baseLocations(
  owner: LocationOwner,
  scenario: DemoScenario,
  demoNumbers: boolean,
): MockLocation[] {
  const primary: MockLocation = {
    id: `loc_${owner.slug}`,
    business_id: BUSINESS_ID,
    slug: owner.slug,
    location_name: owner.name,
    google_review_url: null, // uses the business-level fallback
    nfc_enabled: 1,
    is_active: 1,
    created_at: "2026-09-12T09:00:00.000Z",
    scans_used: demoNumbers ? 955 : 0,
  };
  if (scenario !== "enterprise") return [primary];
  const siblingSlug = nextMockSlug([owner.slug], owner.slug);
  return [
    primary,
    {
      id: `loc_${siblingSlug}`,
      business_id: BUSINESS_ID,
      slug: siblingSlug,
      location_name: `${owner.name} — Lower Parel`,
      google_review_url: demoNumbers
        ? "https://g.page/r/mock-lower-parel/review"
        : null,
      nfc_enabled: 1,
      is_active: 1,
      created_at: "2026-09-28T09:00:00.000Z",
      scans_used: demoNumbers ? 312 : 0,
    },
  ];
}

/** Locations added in this session (mock only; Stage 4 inserts real rows). */
const addedLocations = new Map<DemoScenario, MockLocation[]>();

/** Regenerated review links, keyed by location id (mock only). */
const linkOverrides = new Map<DemoScenario, Record<string, string>>();

/**
 * Locations for one business + scenario: the derived base plus this session's
 * added locations, with any regenerated review link applied. A plain, fresh
 * array every call, so callers can use it as render data.
 */
export function locationsForBusiness(
  owner: LocationOwner,
  scenario: DemoScenario,
  demoNumbers: boolean,
): MockLocation[] {
  const overrides = linkOverrides.get(scenario);
  const extra = addedLocations.get(scenario) ?? [];
  return [...baseLocations(owner, scenario, demoNumbers), ...extra].map(
    (location) => {
      const override = overrides?.[location.id];
      return override ? { ...location, google_review_url: override } : location;
    },
  );
}

/**
 * Adds a location with a NEW slug and its own review link (business-rules.md 9:
 * a new slug is only ever issued when the owner explicitly adds a location).
 */
export function mockAddLocation(
  scenario: DemoScenario,
  owner: LocationOwner,
  input: { location_name: string; google_review_url: string },
): MockLocation {
  const existing = locationsForBusiness(owner, scenario, false).map(
    (location) => location.slug,
  );
  const slug = nextMockSlug(existing, owner.slug);
  const location: MockLocation = {
    id: `loc_${slug}`,
    business_id: BUSINESS_ID,
    slug,
    location_name: input.location_name,
    google_review_url: input.google_review_url,
    nfc_enabled: 1,
    is_active: 1,
    created_at: new Date().toISOString(),
    scans_used: 0,
  };
  const list = addedLocations.get(scenario) ?? [];
  list.push(location);
  addedLocations.set(scenario, list);
  return location;
}

/**
 * Regenerates the review link IN PLACE — the slug (and therefore every printed
 * QR and written NFC tag) stays the same (business-rules.md 9).
 */
export function mockRegenerateReviewLink(
  scenario: DemoScenario,
  locationId: string,
  googleReviewUrl: string,
): void {
  const overrides = { ...(linkOverrides.get(scenario) ?? {}) };
  overrides[locationId] = googleReviewUrl;
  linkOverrides.set(scenario, overrides);
}

/**
 * Whether `slug` is one of this business's own location slugs (derived slugs
 * plus the locations added in this session). Pure — it takes the profile as an
 * argument on purpose, so the customer page can decide ownership during the
 * first render without touching localStorage (no hydration mismatch).
 *
 * The other demo businesses (full01, salon1, pause1) are never in these lists,
 * so saved data can never leak into them.
 */
export function businessOwnsSlug(
  owner: LocationOwner,
  slug: string,
): boolean {
  return ["enterprise", "normal"].some((scenario) =>
    locationsForBusiness(owner, scenario as DemoScenario, false).some(
      (location) => location.slug === slug,
    ),
  );
}

/** "Reset demo data": forget this session's mock location edits. */
export function resetMockLocations(): void {
  addedLocations.clear();
  linkOverrides.clear();
}

/** Effective review link: the per-location override, else the business fallback. */
export function reviewUrlFor(
  location: MockLocation,
  businessFallback: string,
): string {
  return location.google_review_url ?? businessFallback;
}

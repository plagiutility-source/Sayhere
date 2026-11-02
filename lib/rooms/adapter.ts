"use client";

/**
 * The bridge between the Review SaaS's real mock data and the rooms feature.
 *
 * Everything the standalone build read from its own demo constants comes from
 * here instead (ROOMS_QR_SPEC.md section 13):
 * - business name, type, tagline, colours, time zone -> `useBusiness()`
 * - locations (id, slug, name) -> `useMockLocations()`
 * - menu, hours, contact, announcement, buttons -> the stored page config for
 *   that slug (`getStoredPageData`), falling back to the static page
 * - prices: the app stores text ("Rs 180"), `parseMenuPrice()` turns it into a
 *   number; anything unreadable is not orderable and shows "Ask staff"
 *
 * A business starts with NO spots and NO orders: `initialRoomsState()` keys
 * every room and waiter map by the real location id and leaves them empty.
 *
 * The pure functions are exported so `scripts/rooms-rules-check.ts` can test
 * them without a browser; the hooks are the client entry points for the pages
 * that land in the next phases.
 */

import { useMemo } from "react";
import { getBrandTheme } from "@/lib/brand/theme";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { WEEKDAY_ORDER } from "@/lib/customer-page";
import { getMockReviewPage } from "@/lib/mock/customer-page";
import type {
  MenuItem,
  PageConfig,
  SocialLinks,
  Weekday,
} from "@/lib/mock/customer-page";
import type { DemoScenario } from "@/lib/mock/demo";
import type { MockLocation } from "@/lib/mock/locations";
import type { BusinessProfile, StoredPageData } from "@/lib/mock/store";
import { useBusiness, useMockLocations, useStoredPageData } from "@/lib/use-business";
import { money, parseMenuPrice } from "./format";
import type {
  RoomsPageConfig,
  RoomsState,
  SpotBusinessType,
  SpotLocation,
} from "./types";

/* ------------------------------------------------------------------------- */
/* Business                                                                  */
/* ------------------------------------------------------------------------- */

export type RoomsBusinessView = {
  name: string;
  initials: string;
  type: SpotBusinessType;
  tagline: string;
  theme: { primary: string; secondary: string; bg: string };
  timeZone: string;
  slug: string;
};

/** The rooms view of a business, or null when the type does not get ordering. */
export function businessView(profile: BusinessProfile): RoomsBusinessView | null {
  const type = supportsTableOrdering(profile.business_type)
    ? profile.business_type
    : null;
  if (!type) return null;
  const brand = getBrandTheme(profile);
  return {
    name: profile.name,
    initials: initialsFromBusiness(profile.name),
    type,
    tagline: profile.tagline,
    theme: {
      primary: profile.primary_color,
      secondary: profile.secondary_color,
      bg: brand.pageBackground,
    },
    timeZone: profile.time_zone,
    slug: profile.slug,
  };
}

/** "Brew and Bean" -> "BB" (first + last word); never empty. */
export function initialsFromBusiness(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "S";
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase() || "S";
}

/* ------------------------------------------------------------------------- */
/* Locations -> spots (rooms and waiters keyed by the real location id)       */
/* ------------------------------------------------------------------------- */

/** One real location as a rooms spot; no rooms and no waiters yet. */
export function locationSpot(location: MockLocation): SpotLocation {
  return {
    id: location.id,
    name: location.location_name,
    slug: location.slug,
    scans: 0,
    active: location.is_active === 1,
    rooms: [],
    waiters: [],
  };
}

export function locationSpots(locations: readonly MockLocation[]): SpotLocation[] {
  return locations.map(locationSpot);
}

/**
 * The state a brand-new business starts from: every real location is present
 * under its own id, with no spots, no waiters, no orders and no calls.
 */
export function initialRoomsState(
  locations: readonly MockLocation[],
  businessType: SpotBusinessType,
): RoomsState {
  return {
    locations: locationSpots(locations),
    configs: {},
    orders: [],
    joinRequests: [],
    serviceCalls: [],
    businessType,
    savedAt: 0,
  };
}

/** The same empty state, for callers that already hold adapter spots. */
export function initialStateFromSpots(
  spots: readonly SpotLocation[],
  businessType: SpotBusinessType,
): RoomsState {
  return {
    locations: spots.map((spot) => ({ ...spot, rooms: [], waiters: [] })),
    configs: {},
    orders: [],
    joinRequests: [],
    serviceCalls: [],
    businessType,
    savedAt: 0,
  };
}

/* ------------------------------------------------------------------------- */
/* Menu                                                                      */
/* ------------------------------------------------------------------------- */

export type RoomsMenuItem = {
  id: string;
  name: string;
  /** Null when the price text has no number (not orderable, "Ask staff"). */
  price: number | null;
  priceLabel: string;
  details: string;
  tag: string | null;
  soldOut: boolean;
  orderable: boolean;
  image: MenuItem["image"] | null;
};

export type RoomsMenuCategory = { name: string; items: RoomsMenuItem[] };
export type RoomsMenu = { categories: RoomsMenuCategory[] };

function idPart(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

/** Stable id from category + name, for menu items saved before ids existed. */
export function fallbackMenuItemId(categoryName: string, itemName: string): string {
  return `mid_${idPart(categoryName)}_${idPart(itemName)}`;
}

function uniqueItemId(
  categoryName: string,
  itemName: string,
  taken: ReadonlySet<string>,
): string {
  const base = fallbackMenuItemId(categoryName, itemName);
  let candidate = base;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function menuItemFromMenuItem(
  item: MenuItem,
  categoryName: string,
): RoomsMenuItem {
  const price = parseMenuPrice(item.price);
  const savedId = typeof item.id === "string" ? item.id.trim() : "";
  return {
    id: savedId || fallbackMenuItemId(categoryName, item.name),
    name: item.name,
    price,
    priceLabel: price === null ? "Ask staff" : money(price),
    details: item.details,
    tag: item.tag,
    soldOut: item.sold_out,
    orderable: price !== null && !item.sold_out,
    image: item.image ?? null,
  };
}

/** The app's one menu (page config) as rooms menu categories. */
export function menuFromConfig(config: PageConfig | null): RoomsMenu {
  if (!config) return { categories: [] };
  const taken = new Set<string>();
  const categories: RoomsMenuCategory[] = [];
  for (const category of config.menu.categories) {
    const items: RoomsMenuItem[] = [];
    for (const item of category.items) {
      const mapped = menuItemFromMenuItem(item, category.name);
      const id = taken.has(mapped.id)
        ? uniqueItemId(category.name, item.name, taken)
        : mapped.id;
      taken.add(id);
      items.push({ ...mapped, id });
    }
    if (items.length) categories.push({ name: category.name, items });
  }
  return { categories };
}

/** Every orderable item, keyed by id (what the cart and punch dialog need). */
export function menuItemsById(menu: RoomsMenu): Record<string, RoomsMenuItem> {
  const items: Record<string, RoomsMenuItem> = {};
  for (const category of menu.categories) {
    for (const item of category.items) items[item.id] = item;
  }
  return items;
}

/* ------------------------------------------------------------------------- */
/* Hours and contact                                                         */
/* ------------------------------------------------------------------------- */

const DAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type RoomsHoursRow = { day: string; hours: string };
export type RoomsHours = {
  on: boolean;
  rows: RoomsHoursRow[];
  note: string;
  phone: string;
  address: string;
};

/** "09:00" -> "9:00" (the demo's wording, no leading zero). */
function clockText(value: string): string {
  const [hour, minute] = value.split(":");
  const parsed = Number.parseInt(hour ?? "", 10);
  return Number.isFinite(parsed) ? `${parsed}:${minute ?? "00"}` : value;
}

export function hoursFromConfig(config: PageConfig | null): RoomsHours {
  const hours = config?.buttons.hours;
  const rows = WEEKDAY_ORDER.map((day) => {
    const entry = hours?.week[day];
    const text =
      !entry || entry.closed || entry.ranges.length === 0
        ? "Closed"
        : entry.ranges
            .map((range) => `${clockText(range.open)} \u2013 ${clockText(range.close)}`)
            .join(", ");
    return { day: DAY_LABELS[day], hours: text };
  });
  return {
    on: Boolean(hours?.on),
    rows,
    note: hours?.note ?? "",
    phone: hours?.phone ?? "",
    address: hours?.address ?? "",
  };
}

export type RoomsContact = {
  phone: string;
  address: string;
  callPhone: string;
  directions: string;
};

export function contactFromConfig(config: PageConfig | null): RoomsContact {
  const buttons = config?.buttons;
  return {
    phone: buttons?.hours.phone || buttons?.call.phone || "",
    address:
      buttons?.hours.address ||
      (buttons?.directions.on ? buttons.directions.value : "") ||
      "",
    callPhone: buttons?.call.on ? buttons.call.phone : "",
    directions: buttons?.directions.on ? buttons.directions.value : "",
  };
}

/* ------------------------------------------------------------------------- */
/* Page config (what the public table page will read)                        */
/* ------------------------------------------------------------------------- */

export function socialsFromConfig(
  socials: SocialLinks | undefined,
): RoomsPageConfig["socials"] {
  return {
    ...(socials?.instagram?.on && socials.instagram.url
      ? { instagram: socials.instagram.url }
      : {}),
    ...(socials?.website?.on && socials.website.url
      ? { website: socials.website.url }
      : {}),
  };
}

/**
 * The table page's config, built from the same page config the customer page
 * uses: one menu, one set of hours, one contact. No demo values.
 */
export function roomsPageConfigFrom(
  config: PageConfig | null,
  socials: SocialLinks | undefined,
  fallbackMenuTitle: string,
): RoomsPageConfig {
  const buttons = config?.buttons;
  const custom = buttons?.custom_links.find(
    (link) => link.on && link.label.trim() && link.url,
  );
  return {
    announcement: {
      on: Boolean(config?.announcement.on),
      text: config?.announcement.text ?? "",
    },
    thankYou: config?.thank_you ?? "",
    wifi: {
      on: Boolean(buttons?.wifi.on),
      ssid: buttons?.wifi.ssid ?? "",
      password: buttons?.wifi.password ?? "",
    },
    menu: {
      on: Boolean(buttons?.menu.on),
      title: buttons?.menu.title || fallbackMenuTitle,
    },
    hours: {
      on: Boolean(buttons?.hours.on),
      phone: buttons?.hours.phone ?? "",
      address: buttons?.hours.address ?? "",
    },
    call: {
      on: Boolean(buttons?.call.on),
      phone: buttons?.call.phone ?? "",
    },
    directions: {
      on: Boolean(buttons?.directions.on),
      value: buttons?.directions.value ?? "",
    },
    custom: custom
      ? { on: true, label: custom.label, url: custom.url }
      : { on: false, label: "", url: "" },
    socials: socialsFromConfig(socials),
  };
}

/* ------------------------------------------------------------------------- */
/* Hooks                                                                     */
/* ------------------------------------------------------------------------- */

/** The rooms view of the current business; null for ineligible types. */
export function useRoomsBusiness(): RoomsBusinessView | null {
  const profile = useBusiness();
  return useMemo(() => businessView(profile), [profile]);
}

/** The real locations as spots (empty rooms/waiters), keyed by location id. */
export function useRoomsLocations(scenario: DemoScenario): SpotLocation[] {
  const locations = useMockLocations(scenario);
  return useMemo(() => locationSpots(locations), [locations]);
}

export type RoomsPageSource = {
  config: PageConfig | null;
  socials: SocialLinks | undefined;
};

/**
 * The page content for one location slug: what the editor saved wins, else the
 * static mock for that slug. `null` until after mount (same pattern as
 * `useStoredPageData`), so the first paint matches the server.
 */
export function useRoomsPage(
  slug: string | null,
  scenario: DemoScenario,
): RoomsPageSource {
  void scenario;
  const stored: StoredPageData | null = useStoredPageData(slug);
  const fallback = slug ? getMockReviewPage(slug) : null;
  const config = stored ? stored.page_config : fallback?.page_config ?? null;
  const socials = stored?.social_links ?? fallback?.business.social_links;
  return { config, socials };
}

/** The one menu, mapped and priced, for one location slug. */
export function useRoomsMenu(
  slug: string | null,
  scenario: DemoScenario,
): RoomsMenu {
  const page = useRoomsPage(slug, scenario);
  return useMemo(() => menuFromConfig(page.config), [page.config]);
}

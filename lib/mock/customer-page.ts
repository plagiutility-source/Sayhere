/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * Fake businesses and review pages for the public customer page (`/r/[slug]`).
 * Every field name matches the real tables so Stage 4 can swap this module for a
 * real query with no renaming:
 * - `businesses`: id, name, business_type, tagline, logo_url, primary_color,
 *   secondary_color, color_source, google_review_url, social_links (schema.sql,
 *   PRD.md 5.5.13).
 * - `review_pages`: id, business_id, slug, location_name, google_review_url
 *   (per-location override), is_active, page_custom_hidden, page_config
 *   (schema.sql, PRD.md 5.5.13).
 *
 * `time_zone` is mock-only: PRD.md 5.4.1 and 5.5.7 require a business time zone
 * (used for "Open now" and the announcement end date) but schema.sql's
 * `businesses` table does not list a column yet. Logged as a schema gap in
 * PROGRESS.md; flagged here rather than hidden.
 *
 * Purple/default colours are reused from `businessPresets` so the hex values are
 * not copied a second time. `logo_url` is null so the built-in vector logo shows.
 */

import { businessPresets, type BusinessType } from "@/lib/brand/tokens";
import type { ColorSource } from "@/lib/brand/theme";
import type { DemoScenario } from "@/lib/mock/demo";
import type { PlanId } from "@/lib/mock/plans";
import { MENU_ITEM_ID_PATTERN } from "@/lib/validation/page-config";

export type SocialKey = "instagram" | "facebook" | "youtube" | "x" | "website";
export type SocialLink = { on: boolean; url: string };
export type SocialLinks = Partial<Record<SocialKey, SocialLink>>;

export type MenuTag = "New" | "Popular" | "Veg" | "Spicy";

/**
 * An approved AI-generated dish photo (AI_MENU_PHOTOS.md). Only OUR reference
 * is stored, never an owner-supplied URL: `key` names a file we generated and
 * stored ourselves (Stage 4: a random Cloudflare R2 object key; Stage 1 mock:
 * a random id with a drawn placeholder picked by `variant`). `ai` is always
 * true and drives the "AI-generated" label shown to customers.
 */
export type MenuImage = {
  key: string;
  variant: number;
  ai: true;
};

export type MenuItem = {
  name: string;
  price: string;
  details: string;
  tag: MenuTag | null;
  sold_out: boolean;
  /** Optional so existing items and saved data without a photo stay valid. */
  image?: MenuImage | null;
  /** Optional until the save/load path assigns one (master 4.5). */
  id?: string;
};
export type MenuCategory = { name: string; items: MenuItem[] };
export type MenuConfig = { categories: MenuCategory[] };

/** Weekday keys for the manual hours builder (PRD.md 5.5.7 allows two ranges). */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type TimeRange = { open: string; close: string };
export type DayHours = { closed: boolean; ranges: TimeRange[] };
export type WeekHours = Record<Weekday, DayHours>;

/** The `page_config` JSON shape from PRD.md 5.5.13 (strict; no extra keys). */
export type PageConfig = {
  announcement: { on: boolean; text: string; end_date: string | null };
  thank_you: string;
  buttons: {
    menu: { on: boolean; title: string };
    wifi: { on: boolean; ssid: string; password: string };
    hours: { on: boolean; phone: string; address: string; week: WeekHours; note: string };
    call: { on: boolean; phone: string };
    whatsapp: { on: boolean; phone: string };
    directions: { on: boolean; value: string };
    /** Pay now (owner decision): UPI ID max 50, name max 30; no amount. */
    pay: { on: boolean; upi_id: string; name: string };
    custom_links: { on: boolean; label: string; url: string }[];
  };
  menu: MenuConfig;
};

export type MockBusiness = {
  id: string;
  name: string;
  business_type: BusinessType;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  color_source: ColorSource;
  google_review_url: string;
  social_links: SocialLinks;
  /** `businesses.plan` (schema.sql): free, starter, pro, enterprise. */
  plan: PlanId;
  /** MOCK ONLY — see the file header. */
  time_zone: string;
};

export type MockReviewPage = {
  id: string;
  business_id: string;
  slug: string;
  location_name: string | null;
  /** Per-location override; falls back to the business URL when null. */
  google_review_url: string | null;
  is_active: boolean;
  page_custom_hidden: boolean;
  page_config: PageConfig | null;
  business: MockBusiness;
};

/** Same host allowlist as `validateGoogleReviewUrl` (security section 4). */
const REVIEW_URL_CAFE = "https://g.page/r/brew-and-bean/review";
const REVIEW_URL_RESTAURANT = "https://search.google.com/local/writereview?placeid=example";
/** Generic Google Maps mock link, reused by the salon + type demo pages. */
const REVIEW_URL_MAPS = "https://maps.app.goo.gl/example";

const ALL_DAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** 09:00–21:00 every day except Sunday (closed). */
function standardWeek(): WeekHours {
  const day: DayHours = { closed: false, ranges: [{ open: "09:00", close: "21:00" }] };
  return ALL_DAYS.reduce((week, key) => {
    week[key] = key === "sun" ? { closed: true, ranges: [] } : { ...day };
    return week;
  }, {} as WeekHours);
}

function business(
  type: BusinessType,
  overrides: Partial<MockBusiness>,
): MockBusiness {
  const preset = businessPresets[type];
  return {
    id: `biz_${type}_mock`,
    name: `${type} mock`,
    business_type: type,
    tagline: preset.tagline,
    logo_url: null,
    primary_color: preset.primary,
    secondary_color: preset.secondary,
    color_source: "preset",
    google_review_url: REVIEW_URL_CAFE,
    social_links: {},
    plan: "starter",
    time_zone: "Asia/Kolkata",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Scenario 1 — `cafe01`: café, nothing customized (page_config null),
// two social icons (Instagram + Website). The plain default page.
// ---------------------------------------------------------------------------
const brewAndBean = business("cafe", {
  id: "biz_brew_and_bean",
  name: "Brew and Bean",
  tagline: businessPresets.cafe.tagline,
  google_review_url: REVIEW_URL_CAFE,
  social_links: {
    instagram: { on: true, url: "https://instagram.com/brewandbean" },
    website: { on: true, url: "https://brewandbean.example" },
    facebook: { on: false, url: "" },
  },
});

// ---------------------------------------------------------------------------
// Scenario 2 — `full01`: restaurant with a full customization: announcement
// (with end date), thank-you message, a manual menu with lists/items (incl. a
// Sold out item), hours and contact, Call, WhatsApp, Directions and two custom
// link buttons.
// ---------------------------------------------------------------------------
const spiceRoute = business("restaurant", {
  id: "biz_spice_route",
  name: "Spice Route",
  tagline: businessPresets.restaurant.tagline,
  google_review_url: REVIEW_URL_RESTAURANT,
  plan: "pro",
  social_links: {
    instagram: { on: true, url: "https://instagram.com/spiceroute" },
    facebook: { on: true, url: "https://facebook.com/spiceroute" },
    youtube: { on: true, url: "https://youtube.com/@spiceroute" },
    website: { on: false, url: "" },
  },
});

const demoFullConfig: PageConfig = {
  announcement: {
    on: true,
    text: "Buy 1 get 1 free on cold brew, this week only.",
    end_date: "2027-12-31",
  },
  thank_you: "Thank you for the feedback — we would love to see you again soon!",
  buttons: {
    menu: { on: true, title: "Our menu" },
    wifi: { on: false, ssid: "", password: "" },
    hours: {
      on: true,
      phone: "+919876543210",
      address: "12 Linking Road, Bandra West, Mumbai",
      week: standardWeek(),
      note: "",
    },
    call: { on: true, phone: "+919876543210" },
    whatsapp: { on: true, phone: "+919876543210" },
    directions: { on: true, value: "12 Linking Road, Bandra West, Mumbai" },
    pay: { on: true, upi_id: "spiceroute@okbank", name: "Spice Route" },
    custom_links: [
      { on: true, label: "Order online", url: "https://spiceroute.example/order" },
      { on: true, label: "Book a table", url: "https://spiceroute.example/book" },
      // Intentionally off: proves an off item keeps its value but is not shown.
      { on: false, label: "Gift cards", url: "https://spiceroute.example/gift" },
      // Intentionally on but invalid (http, not https): proves an on-but-invalid
      // item is not shown to customers (business-rules.md 11 rule 17).
      { on: true, label: "Legacy menu", url: "http://insecure.example/legacy" },
    ],
  },
  menu: {
    categories: [
      {
        name: "Coffee",
        items: [
          {
            name: "Cold brew",
            price: "Rs 180",
            details: "Cold-steeped 12 hours, served over ice",
            tag: "Popular",
            sold_out: false,
          },
          { name: "Cappuccino", price: "Rs 160", details: "", tag: null, sold_out: false },
        ],
      },
      {
        name: "Bites",
        items: [
          {
            name: "Veg sandwich",
            price: "Rs 140",
            details: "Grilled bread, cucumber, tomato, cheese, chutney",
            tag: "Veg",
            sold_out: false,
          },
          { name: "Brownie", price: "Rs 120", details: "", tag: null, sold_out: true },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Scenario 3 — `salon1`: salon with exactly 3 shown buttons (Services and
// prices, Hours and contact, one custom link) to prove the odd-count re-flow.
// ---------------------------------------------------------------------------
const luxeSalon = business("salon", {
  id: "biz_luxe_salon",
  name: "Luxe Salon",
  tagline: businessPresets.salon.tagline,
  google_review_url: REVIEW_URL_MAPS,
  social_links: {
    instagram: { on: true, url: "https://instagram.com/luxesalon" },
  },
});

const demoSalonConfig: PageConfig = {
  announcement: { on: false, text: "", end_date: null },
  thank_you: "",
  buttons: {
    menu: { on: true, title: "" }, // empty title -> "Services and prices" for a salon
    wifi: { on: false, ssid: "", password: "" },
    hours: {
      on: true,
      phone: "+919812345678",
      address: "5 Hill Road, Bandra West, Mumbai",
      week: standardWeek(),
      note: "Closed on public holidays",
    },
    call: { on: false, phone: "" },
    whatsapp: { on: false, phone: "" },
    directions: { on: false, value: "" },
    pay: { on: false, upi_id: "", name: "" },
    custom_links: [
      { on: true, label: "Book now", url: "https://luxesalon.example/book" },
    ],
  },
  menu: {
    categories: [
      {
        name: "Hair",
        items: [
          { name: "Haircut", price: "Rs 500", details: "", tag: null, sold_out: false },
          { name: "Hair colour", price: "from Rs 1500", details: "", tag: "Popular", sold_out: false },
        ],
      },
      {
        name: "Spa",
        items: [
          { name: "Head massage", price: "Rs 700", details: "30 minutes", tag: null, sold_out: true },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Scenario 4 — `pause1`: neutral "temporarily unavailable" page. `is_active`
// = false is the mock stand-in for a suspended business or one that has used all
// its monthly scans (business-rules.md sections 1 and 4).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Type demo pages — one per reserved mock slug (lib/mock/business.ts).
//
// Onboarding issues the slug for the chosen business type, so `/r/glam01` and
// friends must exist even in a browser with no saved profile: the server
// renders the type's demo business below, and a browser that DOES have the
// saved profile overlays the owner's own business on top
// (components/customer-page/customer-page.tsx). These pages have no
// customization (page_config null), exactly like the fresh cafe01 demo.
// ---------------------------------------------------------------------------

function typeDemoPage(
  slug: string,
  type: BusinessType,
  name: string,
  googleReviewUrl: string,
): MockReviewPage {
  return {
    id: `page_${slug}`,
    business_id: `biz_${slug}`,
    slug,
    location_name: null,
    google_review_url: null,
    is_active: true,
    page_custom_hidden: false,
    page_config: null,
    business: business(type, {
      id: `biz_${slug}`,
      name,
      google_review_url: googleReviewUrl,
    }),
  };
}

const pausedCafe = business("cafe", {
  id: "biz_paused_cafe",
  name: "Corner Cafe",
  tagline: businessPresets.cafe.tagline,
  google_review_url: REVIEW_URL_CAFE,
  social_links: { instagram: { on: true, url: "https://instagram.com/cornercafe" } },
  plan: "free",
});

export const mockReviewPages: Record<string, MockReviewPage> = {
  cafe01: {
    id: "page_cafe01",
    business_id: brewAndBean.id,
    slug: "cafe01",
    location_name: "Brew and Bean — Bandra",
    google_review_url: null,
    is_active: true,
    page_custom_hidden: false,
    page_config: null,
    business: brewAndBean,
  },
  full01: {
    id: "page_full01",
    business_id: spiceRoute.id,
    slug: "full01",
    location_name: "Spice Route — Bandra",
    google_review_url: null,
    is_active: true,
    page_custom_hidden: false,
    page_config: demoFullConfig,
    business: spiceRoute,
  },
  salon1: {
    id: "page_salon1",
    business_id: luxeSalon.id,
    slug: "salon1",
    location_name: "Luxe Salon — Bandra",
    google_review_url: null,
    is_active: true,
    page_custom_hidden: false,
    page_config: demoSalonConfig,
    business: luxeSalon,
  },
  pause1: {
    id: "page_pause1",
    business_id: pausedCafe.id,
    slug: "pause1",
    location_name: "Corner Cafe — Bandra",
    google_review_url: null,
    is_active: false,
    page_custom_hidden: false,
    page_config: null,
    business: pausedCafe,
  },
  // Reserved per-type slugs: what the mock onboarding issues, so the URL a new
  // business is shown always resolves (lib/mock/business.ts).
  resto1: typeDemoPage("resto1", "restaurant", "The Green Table", REVIEW_URL_RESTAURANT),
  hotel1: typeDemoPage("hotel1", "hotel", "Hotel Sai Palace", REVIEW_URL_MAPS),
  glam01: typeDemoPage("glam01", "salon", "Glow Studio", REVIEW_URL_MAPS),
  gym001: typeDemoPage("gym001", "gym", "Iron Yard Gym", REVIEW_URL_MAPS),
  store1: typeDemoPage("store1", "retail", "Northside Supply", REVIEW_URL_MAPS),
  other1: typeDemoPage("other1", "other", "Studio Nine", REVIEW_URL_MAPS),
};

/** Lookup by slug. Unknown slugs return null (the route shows not-found). */
export function getMockReviewPage(slug: string): MockReviewPage | null {
  return mockReviewPages[slug] ?? null;
}

/** The URL a review should actually post to (location override else business). */
export function effectiveGoogleReviewUrl(page: MockReviewPage): string {
  return page.google_review_url ?? page.business.google_review_url;
}

// ---------------------------------------------------------------------------
// Editor store (MOCK ONLY) — the `/customer-page` editor's in-memory save
// target. Keyed by demo scenario + location so edits survive remounts but never
// leak between scenarios. Stage 4 replaces these functions with API calls.
// ---------------------------------------------------------------------------

/** An empty config: everything off, no menu, no announcement. */
export function emptyPageConfig(): PageConfig {
  return {
    announcement: { on: false, text: "", end_date: null },
    thank_you: "",
    buttons: {
      menu: { on: false, title: "" },
      wifi: { on: false, ssid: "", password: "" },
      hours: { on: false, phone: "", address: "", week: standardWeek(), note: "" },
      call: { on: false, phone: "" },
      whatsapp: { on: false, phone: "" },
      directions: { on: false, value: "" },
      pay: { on: false, upi_id: "", name: "" },
      custom_links: [],
    },
    menu: { categories: [] },
  };
}

/**
 * The `enterprise` scenario's second location has a small saved config so
 * "Copy from another location" (rules 11.10) has real content to copy.
 */
function enterpriseCopyConfig(): PageConfig {
  const base = emptyPageConfig();
  return {
    ...base,
    thank_you: "Thanks for visiting our Lower Parel store!",
    buttons: {
      ...base.buttons,
      menu: { on: true, title: "Our menu" },
      hours: {
        on: true,
        phone: "+919800011122",
        address: "Ground floor, Lower Parel, Mumbai",
        week: standardWeek(),
        note: "",
      },
    },
    menu: {
      categories: [
        {
          name: "Coffee",
          items: [
            { name: "Filter coffee", price: "Rs 120", details: "", tag: null, sold_out: false },
            { name: "Iced latte", price: "Rs 190", details: "", tag: "New", sold_out: false },
          ],
        },
      ],
    },
  };
}

/**
 * The `over-limit` scenario: 65 named menu items, left over after a downgrade
 * to Starter (limit 60, lib/mock/plans.ts) — nothing was deleted (rules 11.5).
 */
function overLimitConfig(): PageConfig {
  const names = ["Starters", "Mains", "Breads", "Desserts", "Drinks"];
  const categories: MenuCategory[] = names.map((name, c) => ({
    name,
    items: Array.from({ length: 13 }, (_, i) => ({
      name: `Item ${c * 13 + i + 1}`,
      price: `Rs ${100 + c * 13 + i}`,
      details: "",
      tag: null,
      sold_out: false,
    })),
  }));
  const base = emptyPageConfig();
  return {
    ...base,
    buttons: { ...base.buttons, menu: { on: true, title: "Our menu" } },
    menu: { categories },
  };
}

/** A stable 16-character lowercase id for a menu item. */
function menuItemId(): string {
  return `itm_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/**
 * Give every menu item a stable id (master 4.5). A second run returns the same
 * config, so ids never change once assigned.
 */
export function ensureMenuItemIds(config: PageConfig): PageConfig {
  let changed = false;
  const categories: MenuCategory[] = config.menu.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      if (typeof item.id === "string" && MENU_ITEM_ID_PATTERN.test(item.id)) {
        return item;
      }
      changed = true;
      return { ...item, id: menuItemId() };
    }),
  }));
  return changed ? { ...config, menu: { ...config.menu, categories } } : config;
}

const configStore = new Map<string, PageConfig | null>();
const socialStore = new Map<DemoScenario, SocialLinks>();

function configKey(scenario: DemoScenario, locationId: string): string {
  return `${scenario}:${locationId}`;
}

/** The saved config for one location (null = default page), or its scenario default. */
export function getMockPageConfig(
  scenario: DemoScenario,
  locationId: string,
): PageConfig | null {
  const key = configKey(scenario, locationId);
  if (configStore.has(key)) return configStore.get(key) ?? null;
  const initial =
    scenario === "over-limit"
      ? overLimitConfig()
      : scenario === "enterprise" && locationId === "loc_cafe02"
        ? enterpriseCopyConfig()
        : null;
  configStore.set(key, initial);
  return initial;
}

/** Save replaces the location's whole config (PRD 5.5.2: no draft state). */
export function saveMockPageConfig(
  scenario: DemoScenario,
  locationId: string,
  config: PageConfig | null,
): void {
  configStore.set(
    configKey(scenario, locationId),
    config ? ensureMenuItemIds(config) : null,
  );
}

/** Business-level social links (kept when "Reset to default" clears a page). */
export function getMockSocialLinks(scenario: DemoScenario): SocialLinks {
  let links = socialStore.get(scenario);
  if (!links) {
    links = Object.fromEntries(
      Object.entries(brewAndBean.social_links).map(([key, value]) => [
        key,
        { ...value },
      ]),
    ) as SocialLinks;
    socialStore.set(scenario, links);
  }
  return links;
}

export function saveMockSocialLinks(
  scenario: DemoScenario,
  links: SocialLinks,
): void {
  socialStore.set(scenario, links);
}

/** `page_custom_hidden` = 1 (admin hid the custom page): the editor shows a banner. */
export function isPageCustomHidden(scenario: DemoScenario): boolean {
  return scenario === "page_custom_hidden";
}

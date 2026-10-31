/**
 * MOCK ONLY, removed in Stage 4 when the database is connected.
 *
 * The ONE shared business profile for the current mock business (the one that
 * owns /r/cafe01 and its locations). Stage 1 has no database, so onboarding and
 * Settings write the profile into `localStorage` and every screen reads it from
 * here (through `useBusiness()` / `getBusiness()`), instead of reading the
 * static `lib/mock/business.ts` mock.
 *
 * Field names match the `businesses` table in schema.sql (`name`,
 * `business_type`, `tagline`, `logo_url`, `primary_color`, `secondary_color`,
 * `color_source`, `google_review_url`, `time_zone`) so Stage 4 can swap this
 * module for a real row with no renaming.
 *
 * Limits: this data applies only to the current mock business. It must never
 * create a new valid slug, un-pause a paused business, or change plan/limits.
 * Other demo businesses (full01, salon1, pause1) keep their own static data
 * because they are read by slug, not from here.
 *
 * Nothing leaves the browser. Stored values are never trusted: they are parsed
 * in a try/catch, validated with the same rules as the forms, and any invalid
 * field falls back to the static default.
 */

import { businessPresets, businessTypes, type BusinessType } from "@/lib/brand/tokens";
import type { ColorSource } from "@/lib/brand/theme";
import { categoryTextMatches } from "@/lib/category/confirm";
import { guardBusinessPatch, migrateLegacyCategory } from "@/lib/category/lock";
import {
  TYPES_BY_CATEGORY,
  categoryOfType,
  type BusinessCategory,
} from "@/lib/category/types";
import { MOCK_REVIEW_SLUG, slugForType } from "@/lib/mock/business";
import {
  MAX_ANNOUNCEMENT_LENGTH,
  MAX_CUSTOM_LINK_LABEL_LENGTH,
  MAX_MENU_CATEGORY_NAME_LENGTH,
  MAX_MENU_ITEM_DETAILS_LENGTH,
  MAX_MENU_ITEM_NAME_LENGTH,
  MAX_MENU_ITEM_PRICE_LENGTH,
  MAX_MENU_TITLE_LENGTH,
  MAX_THANK_YOU_LENGTH,
  MENU_TAGS,
  SLUG_PATTERN,
  WEEKDAY_ORDER,
  stripUnsafeText,
} from "@/lib/customer-page";
import {
  emptyPageConfig,
  mockReviewPages,
  type MenuConfig,
  type PageConfig,
  type SocialKey,
  type SocialLinks,
  type WeekHours,
} from "@/lib/mock/customer-page";
import {
  businessOwnsSlug,
  resetMockLocations,
} from "@/lib/mock/locations";
import {
  isValidHttpsUrl,
  isValidMenuImage,
  isValidPhone,
  isValidSocialUrl,
  MAX_CUSTOM_LINKS,
  MAX_HOURS_NOTE_LENGTH,
  MAX_MAPS_ADDRESS_LENGTH,
  MAX_MENU_CATEGORIES,
  MAX_PAYEE_NAME_LENGTH,
  MAX_UPI_ID_LENGTH,
} from "@/lib/validation/page-config";
import {
  MAX_BUSINESS_NAME_LENGTH,
  MAX_REVIEW_URL_LENGTH,
  MAX_TAGLINE_LENGTH,
  validateGoogleReviewUrl,
} from "@/lib/validation";

export { MOCK_REVIEW_SLUG };

/** One versioned key; bump the version when the shape changes. */
export const BUSINESS_STORAGE_KEY = "syehere.mock.business.v1";

/** Cleary-fake uploaded-logo URL kept for backwards compatibility only. */
const LEGACY_UPLOADED_LOGO_PREFIX = "mock://uploaded-logo/";

export type BusinessProfile = {
  /** The permanent `review_pages.slug` issued for the primary location. */
  slug: string;
  name: string;
  business_type: BusinessType;
  tagline: string;
  /** `null` = the default vector logo for the business type. */
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  color_source: ColorSource;
  google_review_url: string;
  time_zone: string;
  /** Chosen once at onboarding step 1 and never changeable. */
  business_category: BusinessCategory;
  category_confirm_text: string;
  category_confirmed_at: string;
  /** JSON proof collected at onboarding (format-checked only). */
  onboarding_proof: string | null;
  verification_status: "pending" | "approved" | "rejected";
};

/** Client-side logo rules (security-and-reliability.md 4): no SVG, 1 MB max. */
export const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_MAX_SOURCE_BYTES = 1024 * 1024;
/** Downscale target so the data URL fits in localStorage. */
export const LOGO_MAX_EDGE = 256;
/** Above this many characters a stored data URL is dropped on read. */
const LOGO_MAX_DATA_URL_LENGTH = 200_000;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const DATA_LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/**
 * Slugs that belong to the OTHER demo businesses (read by slug, never from the
 * shared profile). The stored profile may never claim one, so full01 / salon1 /
 * pause1 always keep their own static data.
 */
const OTHER_DEMO_SLUGS = ["full01", "salon1", "pause1"];

/**
 * The static fallback: the café mock that owns /r/cafe01. Nothing here is
 * duplicated by hand — the values come from the same mocks the app already
 * uses, so a cancelled change always returns to what Stage 1 shows today.
 */
export function defaultBusiness(): BusinessProfile {
  const page = mockReviewPages[MOCK_REVIEW_SLUG];
  const business = page.business;
  // Per-location override first (null on the primary demo location), then the
  // per-page override, then the business URL — the same order the app uses.
  const google_review_url =
    page.google_review_url ?? business.google_review_url;
  return {
    slug: MOCK_REVIEW_SLUG,
    name: business.name,
    business_type: business.business_type,
    tagline: business.tagline ?? "",
    logo_url: business.logo_url,
    primary_color: business.primary_color,
    secondary_color: business.secondary_color,
    color_source: business.color_source,
    google_review_url,
    time_zone: business.time_zone,
    business_category: categoryOfType(business.business_type),
    category_confirm_text: "legacy",
    category_confirmed_at: "",
    onboarding_proof: null,
    // The built-in café demo is already reviewed; a new account starts pending.
    verification_status: "approved",
  };
}

/**
 * A logo value that can actually be rendered: a small data URL or an https URL.
 * The legacy `mock://uploaded-logo/...` values from older sessions are not
 * renderable, so callers fall back to the default vector logo / name initial.
 */
export function displayableLogo(value: string | null): string | null {
  if (!value) return null;
  if (DATA_LOGO.test(value) || value.startsWith("https://")) return value;
  return null;
}

function isBusinessType(value: unknown): value is BusinessType {
  return (
    typeof value === "string" &&
    (businessTypes as readonly string[]).includes(value)
  );
}

function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** `null` is a valid value (default logo); invalid values fall back. */
function sanitizeLogo(value: unknown, fallback: string | null): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fallback;
  if (value.length === 0) return fallback;
  if (value.startsWith(LEGACY_UPLOADED_LOGO_PREFIX) && value.length <= 200) {
    return value;
  }
  if (DATA_LOGO.test(value) && value.length <= LOGO_MAX_DATA_URL_LENGTH) {
    return value;
  }
  if (value.startsWith("https://") && value.length <= MAX_REVIEW_URL_LENGTH) {
    return value;
  }
  return fallback;
}

function sanitizeGoogleReviewUrl(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length <= MAX_REVIEW_URL_LENGTH) {
    const trimmed = value.trim();
    if (!validateGoogleReviewUrl(trimmed)) return trimmed;
  }
  return fallback;
}

/**
 * Merge an untrusted object over a trusted base. Every invalid or missing field
 * falls back to the base (the previous value, or the static mock).
 */
export function sanitizeBusiness(
  raw: unknown,
  base: BusinessProfile,
): BusinessProfile {
  const row =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  const name =
    typeof row.name === "string" &&
    row.name.trim().length >= 1 &&
    row.name.trim().length <= MAX_BUSINESS_NAME_LENGTH
      ? row.name.trim()
      : base.name;

  const tagline =
    typeof row.tagline === "string" &&
    row.tagline.length <= MAX_TAGLINE_LENGTH
      ? row.tagline.trim()
      : base.tagline;

  // A profile saved before the dynamic-business fix has no slug: fall back to
  // the slug its stored type would be issued, not the café's (a stored gym
  // profile must not start showing /r/cafe01).
  const slugFallback = isBusinessType(row.business_type)
    ? slugForType(row.business_type)
    : base.slug;
  const slug =
    typeof row.slug === "string" &&
    SLUG_PATTERN.test(row.slug) &&
    !OTHER_DEMO_SLUGS.includes(row.slug)
      ? row.slug
      : slugFallback;

  const category: BusinessCategory =
    row.business_category === "food" ||
    row.business_category === "hotel" ||
    row.business_category === "general"
      ? row.business_category
      : base.business_category;
  const requestedType = isBusinessType(row.business_type)
    ? row.business_type
    : base.business_type;
  // The type must belong to the locked category; a mismatch falls back to the
  // first type of the category (the database CHECK has the same rule).
  const business_type = (TYPES_BY_CATEGORY[category] as readonly string[]).includes(
    requestedType,
  )
    ? requestedType
    : TYPES_BY_CATEGORY[category][0];

  return {
    slug,
    name,
    business_type,
    tagline,
    logo_url: sanitizeLogo(row.logo_url, base.logo_url),
    primary_color: isValidHex(row.primary_color)
      ? row.primary_color.toUpperCase()
      : base.primary_color,
    secondary_color: isValidHex(row.secondary_color)
      ? row.secondary_color.toUpperCase()
      : base.secondary_color,
    color_source: row.color_source === "custom" ? "custom" : "preset",
    google_review_url: sanitizeGoogleReviewUrl(
      row.google_review_url,
      base.google_review_url,
    ),
    time_zone: validTimeZone(row.time_zone) ? row.time_zone : base.time_zone,
    business_category: category,
    category_confirm_text:
      typeof row.category_confirm_text === "string" &&
      row.category_confirm_text.length <= 100
        ? row.category_confirm_text
        : base.category_confirm_text,
    category_confirmed_at:
      typeof row.category_confirmed_at === "string" &&
      row.category_confirmed_at.length <= 40
        ? row.category_confirmed_at
        : base.category_confirmed_at,
    onboarding_proof:
      row.onboarding_proof === null
        ? null
        : typeof row.onboarding_proof === "string" &&
            row.onboarding_proof.length <= 4000
          ? row.onboarding_proof
          : base.onboarding_proof,
    verification_status:
      row.verification_status === "pending" ||
      row.verification_status === "approved" ||
      row.verification_status === "rejected"
        ? row.verification_status
        : base.verification_status,
  };
}

/**
 * The keep-in-memory fallback: when `localStorage` is full or unavailable (for
 * example a very large logo), the profile still changes for this session and a
 * friendly note tells the user it will not survive a reload.
 */
let memoryBusiness: BusinessProfile | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function readStorage(): BusinessProfile {
  const fallback = defaultBusiness();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(BUSINESS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // One-time migration for profiles saved before the category lock. The
    // built-in café demo is approved; every other legacy account is pending.
    const migrated = migrateLegacyCategory(
      parsed,
      parsed.slug === MOCK_REVIEW_SLUG,
    );
    return sanitizeBusiness(migrated, fallback);
  } catch {
    return fallback;
  }
}

/** The shared profile. Never throws and always returns a usable object. */
export function getBusiness(): BusinessProfile {
  if (memoryBusiness) return memoryBusiness;
  return readStorage();
}

/**
 * Whether a profile was actually saved. A saved profile is a brand-new
 * business, so its mock counters start at 0 instead of the café demo's sample
 * numbers (lib/mock/locations.ts).
 */
export function hasStoredBusiness(): boolean {
  if (memoryBusiness) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(BUSINESS_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export type SaveBusinessResult = {
  /** `false` when the profile changed only in memory (storage failed). */
  ok: boolean;
  business: BusinessProfile;
};

export type SaveBusinessOptions = {
  /**
   * Only onboarding passes this, to write the first category choice. Every
   * other save is refused when it would change the category or its audit
   * fields, or move the type outside the category.
   */
  allowCategorySetup?: boolean;
};

/** Merge a partial profile, validate it and persist it. Never throws. */
export function saveBusiness(
  patch: Partial<BusinessProfile>,
  options: SaveBusinessOptions = {},
): SaveBusinessResult {
  const base = getBusiness();
  if (options.allowCategorySetup) {
    const category = patch.business_category;
    if (
      (category !== "food" && category !== "hotel" && category !== "general") ||
      !categoryTextMatches(category, patch.category_confirm_text ?? "") ||
      !(TYPES_BY_CATEGORY[category] as readonly string[]).includes(
        patch.business_type ?? "",
      )
    ) {
      return { ok: false, business: base };
    }
  } else {
    const guard = guardBusinessPatch(base, patch);
    if (!guard.ok) return { ok: false, business: base };
  }
  const next = sanitizeBusiness({ ...base, ...patch }, base);
  if (typeof window === "undefined") {
    memoryBusiness = next;
    emit();
    return { ok: false, business: next };
  }
  try {
    window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(next));
    memoryBusiness = null;
    emit();
    return { ok: true, business: next };
  } catch {
    // Storage full/unavailable: keep the value for this session only.
    memoryBusiness = next;
    emit();
    return { ok: false, business: next };
  }
}

/** Back to the static mock (the "Reset demo data" action). */
export function resetBusiness(): BusinessProfile {
  memoryBusiness = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(BUSINESS_STORAGE_KEY);
    } catch {
      // Ignore: there was nothing readable anyway.
    }
  }
  // Forget this session's mock location edits too, so everything returns to the
  // static café demo.
  resetMockLocations();
  const fallback = defaultBusiness();
  emit();
  return fallback;
}

/**
 * Subscribe to profile changes in this tab (a save/reset) and in other tabs
 * (the browser's `storage` event), so an already-open page re-renders.
 */
export function subscribeBusiness(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === BUSINESS_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------------------------------------------------------------------------
// Logo upload helper (client only, mock only)
// ---------------------------------------------------------------------------

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = url;
  });
}

/**
 * Downscale a chosen logo with a canvas to at most 256 px on its longest side
 * and return a small data URL (WebP when the browser supports it, else PNG), so
 * the result fits in localStorage. Validation (type/size) happens in the forms
 * before this is called; it never throws for a valid image.
 */
export async function logoDataUrlFromFile(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || LOGO_MAX_EDGE;
    const height = image.naturalHeight || LOGO_MAX_EDGE;
    const scale = Math.min(1, LOGO_MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return "";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL("image/webp", 0.85);
    if (!dataUrl.startsWith("data:image/webp")) {
      // WebP is not supported by this browser: fall back to PNG.
      dataUrl = canvas.toDataURL("image/png");
    }
    if (dataUrl.length > LOGO_MAX_DATA_URL_LENGTH) {
      dataUrl = canvas.toDataURL("image/webp", 0.6);
    }
    return dataUrl;
  } catch {
    return "";
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Preset colours for a business type (never copied by hand). */
export function presetColorsFor(type: BusinessType): {
  primary_color: string;
  secondary_color: string;
} {
  const preset = businessPresets[type];
  return {
    primary_color: preset.primary,
    secondary_color: preset.secondary,
  };
}

// ---------------------------------------------------------------------------
// Saved customer-page content (MOCK ONLY, removed in Stage 4)
// ---------------------------------------------------------------------------
//
// The editor's Save used to write into an in-memory map, so "View live page"
// (a NEW tab) and any reload showed the static mock only. The saved
// `page_config` + business-level `social_links` now live in one localStorage
// record keyed by slug, and the public page reads it after mount — the same
// pattern as the business profile above. Other demo slugs have no record and
// keep their static data; admin-hidden pages stay hidden.

/** One versioned key for the whole slug map; bump on shape changes. */
export const PAGE_STORAGE_KEY = "syehere.mock.pages.v1";

/** security-and-reliability.md 4C: serialized page_config ≤ 100 KB. */
const MAX_PAGE_CONFIG_CHARS = 100_000;
/** security-and-reliability.md 4C: menu items per location never > 300. */
const MAX_MENU_ITEM_TOTAL = 300;

const SOCIAL_KEYS: SocialKey[] = [
  "instagram",
  "facebook",
  "youtube",
  "x",
  "website",
];

/** What the editor saved for one slug. `null` config = default page. */
export type StoredPageData = {
  page_config: PageConfig | null;
  social_links: SocialLinks | null;
};

type PageRecord = Record<string, StoredPageData>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return stripUnsafeText(value).slice(0, max);
}

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

function safeTime(value: unknown): string {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) return "";
  const [hour, minute] = value.split(":").map((part) => Number.parseInt(part, 10));
  return hour > 23 || minute > 59 ? "" : value;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function safeWeek(raw: unknown, fallback: WeekHours): WeekHours {
  if (!isRecord(raw)) return fallback;
  const week = {} as WeekHours;
  for (const day of WEEKDAY_ORDER) {
    const entry = isRecord(raw[day]) ? raw[day] : null;
    if (!entry) {
      week[day] = fallback[day];
      continue;
    }
    const closed = entry.closed === true;
    const ranges = Array.isArray(entry.ranges)
      ? entry.ranges.slice(0, 2).flatMap((range) => {
          if (!isRecord(range)) return [];
          const open = safeTime(range.open);
          const close = safeTime(range.close);
          return open && close ? [{ open, close }] : [];
        })
      : [];
    week[day] = closed ? { closed: true, ranges: [] } : { closed: false, ranges };
  }
  return week;
}

function sanitizeMenu(raw: unknown): MenuConfig {
  if (!isRecord(raw) || !Array.isArray(raw.categories)) return { categories: [] };
  let itemBudget = MAX_MENU_ITEM_TOTAL;
  const categories = raw.categories.slice(0, MAX_MENU_CATEGORIES).flatMap((category) => {
    if (!isRecord(category) || !Array.isArray(category.items)) return [];
    const items = category.items.slice(0, itemBudget).flatMap((item) => {
      if (!isRecord(item)) return [];
      const name = safeText(item.name, MAX_MENU_ITEM_NAME_LENGTH);
      if (!name) return [];
      const tag =
        typeof item.tag === "string" &&
        (MENU_TAGS as readonly string[]).includes(item.tag)
          ? (item.tag as MenuConfig["categories"][number]["items"][number]["tag"])
          : null;
      return [
        {
          name,
          price: safeText(item.price, MAX_MENU_ITEM_PRICE_LENGTH),
          details: safeText(item.details, MAX_MENU_ITEM_DETAILS_LENGTH),
          tag,
          sold_out: item.sold_out === true,
          // Rebuilt field by field: no extra keys survive (AI_MENU_PHOTOS.md).
          ...(isValidMenuImage(item.image)
            ? {
                image: {
                  key: item.image.key,
                  variant: item.image.variant,
                  ai: true as const,
                },
              }
            : {}),
        },
      ];
    });
    itemBudget -= items.length;
    if (items.length === 0) return [];
    return [
      {
        name: safeText(category.name, MAX_MENU_CATEGORY_NAME_LENGTH),
        items,
      },
    ];
  });
  return { categories };
}

/**
 * Rebuild a safe PageConfig from untrusted data. Wrong types are replaced by
 * the empty-page defaults; text is stripped/clamped to the documented limits;
 * menu items are capped at 300 per location (security 4C). Link validity is
 * enforced at render time by the same predicates the editor uses, so an
 * invalid on-but-empty item simply never shows.
 */
export function sanitizePageConfig(raw: unknown): PageConfig | null {
  if (raw === null) return null;
  if (!isRecord(raw)) return null;

  let serialized = "";
  try {
    serialized = JSON.stringify(raw);
  } catch {
    return null;
  }
  if (serialized.length > MAX_PAGE_CONFIG_CHARS) return null;

  const base = emptyPageConfig();
  const announcement = isRecord(raw.announcement) ? raw.announcement : {};
  const buttons = isRecord(raw.buttons) ? raw.buttons : {};
  const menuButton = isRecord(buttons.menu) ? buttons.menu : {};
  const wifi = isRecord(buttons.wifi) ? buttons.wifi : {};
  const hours = isRecord(buttons.hours) ? buttons.hours : {};
  const call = isRecord(buttons.call) ? buttons.call : {};
  const whatsapp = isRecord(buttons.whatsapp) ? buttons.whatsapp : {};
  const directions = isRecord(buttons.directions) ? buttons.directions : {};
  const pay = isRecord(buttons.pay) ? buttons.pay : {};

  const customLinks = (Array.isArray(buttons.custom_links)
    ? buttons.custom_links
    : []
  )
    .slice(0, MAX_CUSTOM_LINKS)
    .flatMap((link) => {
      if (!isRecord(link)) return [];
      const label = safeText(link.label, MAX_CUSTOM_LINK_LABEL_LENGTH);
      const url = typeof link.url === "string" ? link.url.trim().slice(0, 2048) : "";
      return [
        {
          on: link.on === true,
          label,
          url: isValidHttpsUrl(url) ? url : "",
        },
      ];
    });

  const phone = (value: unknown): string => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().slice(0, 20);
    return isValidPhone(trimmed) ? trimmed : "";
  };

  return {
    announcement: {
      on: announcement.on === true,
      text: safeText(announcement.text, MAX_ANNOUNCEMENT_LENGTH),
      end_date:
        typeof announcement.end_date === "string" &&
        DATE_PATTERN.test(announcement.end_date)
          ? announcement.end_date
          : null,
    },
    thank_you: safeText(raw.thank_you, MAX_THANK_YOU_LENGTH),
    buttons: {
      menu: {
        on: menuButton.on === true,
        title: safeText(menuButton.title, MAX_MENU_TITLE_LENGTH),
      },
      wifi: {
        on: wifi.on === true,
        ssid: safeText(wifi.ssid, 100),
        password: safeText(wifi.password, 100),
      },
      hours: {
        on: hours.on === true,
        phone: phone(hours.phone),
        address: safeText(hours.address, MAX_MAPS_ADDRESS_LENGTH),
        week: safeWeek(hours.week, base.buttons.hours.week),
        note: safeText(hours.note, MAX_HOURS_NOTE_LENGTH),
      },
      call: { on: call.on === true, phone: phone(call.phone) },
      whatsapp: { on: whatsapp.on === true, phone: phone(whatsapp.phone) },
      directions: {
        // Either a plain address (≤ 200) or a Google Maps link (≤ 2048).
        on: directions.on === true,
        value: safeText(directions.value, 2048),
      },
      pay: {
        on: pay.on === true,
        upi_id: safeText(pay.upi_id, MAX_UPI_ID_LENGTH),
        name: safeText(pay.name, MAX_PAYEE_NAME_LENGTH),
      },
      custom_links: customLinks,
    },
    menu: sanitizeMenu(raw.menu),
  };
}

/** Social links from untrusted data; invalid URLs are blanked (never shown). */
export function sanitizeSocialLinks(raw: unknown): SocialLinks | null {
  if (raw === null) return null;
  if (!isRecord(raw)) return null;
  const links: SocialLinks = {};
  for (const key of SOCIAL_KEYS) {
    const entry = raw[key];
    if (!isRecord(entry)) continue;
    const url = typeof entry.url === "string" ? entry.url.trim().slice(0, 2048) : "";
    links[key] = {
      on: entry.on === true,
      url: isValidSocialUrl(key, url) ? url : "",
    };
  }
  return links;
}

/** Keep-in-memory fallback for the page records (same idea as the profile). */
let memoryPages: PageRecord | null = null;

const pageListeners = new Set<() => void>();

function emitPages(): void {
  for (const listener of pageListeners) listener();
}

function readPageRecord(): PageRecord {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const record: PageRecord = {};
    for (const [slug, value] of Object.entries(parsed)) {
      if (!SLUG_PATTERN.test(slug) || !isRecord(value)) continue;
      record[slug] = {
        page_config: sanitizePageConfig(value.page_config),
        social_links: sanitizeSocialLinks(value.social_links),
      };
    }
    return record;
  } catch {
    return {};
  }
}

function writePageRecord(record: PageRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PAGE_STORAGE_KEY, JSON.stringify(record));
    memoryPages = null;
    return true;
  } catch {
    memoryPages = record;
    return false;
  }
}

/**
 * Slugs owned by the current mock business (its own locations). Saved page
 * content is only ever applied to these, so the other demo businesses
 * (full01, salon1, pause1) keep their static data even if storage is edited by
 * hand.
 */
export function isCurrentBusinessSlug(slug: string): boolean {
  return businessOwnsSlug(getBusiness(), slug);
}

/**
 * What the editor saved for one slug, or `null` when nothing was saved (the
 * caller then keeps the static/scenario mock). Read fresh every call and
 * sanitized, so hand-edited localStorage can never break the page.
 */
export function getStoredPageData(slug: string): StoredPageData | null {
  if (!SLUG_PATTERN.test(slug)) return null;
  const record = memoryPages ?? readPageRecord();
  return record[slug] ?? null;
}

/** Merge one slug's saved page data (partial: only the keys given change). */
export function saveStoredPageData(
  slug: string,
  patch: { page_config?: PageConfig | null; social_links?: SocialLinks | null },
): { ok: boolean; data: StoredPageData | null } {
  if (!SLUG_PATTERN.test(slug)) return { ok: false, data: null };
  const record = { ...(memoryPages ?? readPageRecord()) };
  const existing = record[slug] ?? { page_config: null, social_links: null };
  const next: StoredPageData = {
    page_config:
      patch.page_config !== undefined
        ? sanitizePageConfig(patch.page_config)
        : existing.page_config,
    social_links:
      patch.social_links !== undefined
        ? sanitizeSocialLinks(patch.social_links)
        : existing.social_links,
  };
  record[slug] = next;
  const ok = writePageRecord(record);
  emitPages();
  return { ok, data: next };
}

/** Remove one slug's saved data (back to the static mock for that page). */
export function resetStoredPageData(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) return;
  const record = { ...(memoryPages ?? readPageRecord()) };
  delete record[slug];
  writePageRecord(record);
  emitPages();
}

/** Subscribe to saved-page changes in this tab and in other tabs. */
export function subscribePageData(listener: () => void): () => void {
  pageListeners.add(listener);
  if (typeof window === "undefined") {
    return () => pageListeners.delete(listener);
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PAGE_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    pageListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The live page's effective config + socials (pure, so it is easy to reason
 * about): a saved record wins over the static mock, an admin-hidden page stays
 * hidden, and social links saved by the editor replace the static ones.
 */
export function resolveStoredPage(
  stored: StoredPageData | null,
  fallbackConfig: PageConfig | null,
  fallbackSocials: SocialLinks | undefined,
  customHidden: boolean,
): { config: PageConfig | null; social_links: SocialLinks | undefined } {
  return {
    config: customHidden ? null : stored ? stored.page_config : fallbackConfig,
    social_links: stored?.social_links ?? fallbackSocials,
  };
}

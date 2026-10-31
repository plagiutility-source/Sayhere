/**
 * Pure presentation/validation helpers for the public customer page
 * (`/r/[slug]`). No backend, no React — safe to import from the server route
 * and from the client component.
 *
 * Rules live in security-and-reliability.md section 4C (content + links) and
 * PRD.md 5.5, business-rules.md section 11.
 */

import { type BusinessType } from "@/lib/brand/tokens";
import {
  EMAIL_FORMAT_MESSAGE,
  isAllowedGoogleReviewHost,
  isValidEmail,
  MAX_EMAIL_LENGTH,
} from "@/lib/validation";
// Link / phone / maps primitives live in ONE place shared with the editor
// (lib/validation/page-config.ts) and are re-exported below for existing
// callers, so there is no second implementation to drift.
import {
  buildMapsLink,
  buildTelLink,
  buildWhatsAppLink,
  isCustomLinkShown,
  isHoursShown,
  isPayShown,
  isValidHttpsUrl,
  isValidMapsValue,
  isValidPhone,
  isValidSocialUrl,
  MAX_CUSTOM_LINKS,
  namedMenuItemCount,
} from "@/lib/validation/page-config";

export {
  buildMapsLink,
  buildTelLink,
  buildWhatsAppLink,
  isHoursShown,
  isValidHttpsUrl,
  isValidMapsValue,
  isValidPhone,
  isValidSocialUrl,
  MAX_CUSTOM_LINKS,
  namedMenuItemCount,
} from "@/lib/validation/page-config";
import type {
  MenuCategory,
  MenuConfig,
  PageConfig,
  SocialKey,
  SocialLinks,
  WeekHours,
  Weekday,
} from "@/lib/mock/customer-page";

/**
 * The exact `review_pages.slug` format, confirmed by the owner for T2:
 * 6 lowercase alphanumeric characters (security-and-reliability.md 4B item 8).
 * Validated before any slug lookup.
 */
export const SLUG_PATTERN = /^[a-z0-9]{6}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Allowed menu tags (security 4C / PRD 5.5.6). */
export const MENU_TAGS = ["New", "Popular", "Veg", "Spicy"] as const;

/** Text limits enforced by the mock shape (security 4C). */
export const MAX_ANNOUNCEMENT_LENGTH = 160;
export const MAX_THANK_YOU_LENGTH = 160;
export const MAX_MENU_TITLE_LENGTH = 40;
export const MAX_MENU_CATEGORY_NAME_LENGTH = 40;
export const MAX_MENU_ITEM_NAME_LENGTH = 60;
export const MAX_MENU_ITEM_DETAILS_LENGTH = 160;
export const MAX_MENU_ITEM_PRICE_LENGTH = 20;
export const MAX_CUSTOM_LINK_LABEL_LENGTH = 30;
export const MAX_FEEDBACK_LENGTH = 1000;
export const MAX_CUSTOM_LINK_URL_LENGTH = 2048;

/**
 * Removes control characters and zero-width / bidi override characters from
 * owner-supplied text (security 4C). React still escapes the text on render.
 */
export function stripUnsafeText(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
}

/** Cuts a value to a documented maximum (used only to clamp mock display). */
export function clampText(input: string, max: number): string {
  const trimmed = stripUnsafeText(input).trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

// isBlockedHost / isValidHttpsUrl / isValidSocialUrl live in
// lib/validation/page-config.ts and are re-exported above.

/** Only the social icons that are on AND valid are shown (business-level). */
export function shownSocialIcons(
  links: SocialLinks | undefined,
): { key: SocialKey; url: string }[] {
  if (!links) return [];
  const order: SocialKey[] = ["instagram", "facebook", "youtube", "x", "website"];
  return order
    .map((key) => ({ key, entry: links[key] }))
    .filter(
      (item): item is { key: SocialKey; entry: { on: boolean; url: string } } =>
        Boolean(item.entry?.on) && isValidSocialUrl(item.key, item.entry?.url ?? ""),
    )
    .map((item) => ({ key: item.key, url: item.entry.url.trim() }));
}

// isValidPhone / buildTelLink / buildWhatsAppLink / isValidMapsValue /
// buildMapsLink live in lib/validation/page-config.ts and are re-exported
// above (server-built tel:/wa.me/Maps links come from those helpers).

export type FeedbackValidation =
  | { ok: true }
  | { ok: false; field: "message" | "email"; message: string };

/**
 * Feedback form validation (security section 3 / 4A): message required,
 * trimmed, 1..1000; email optional, max 254, simple format. The error text is
 * the documented friendly message, not raw schema output (security 5A item 4).
 */
export function validateFeedback(input: {
  message: string;
  email?: string;
}): FeedbackValidation {
  const message = input.message.trim();
  if (message.length < 1 || message.length > MAX_FEEDBACK_LENGTH) {
    return {
      ok: false,
      field: "message",
      message: "Please enter 1 to 1000 characters.",
    };
  }
  const email = input.email?.trim() ?? "";
  if (
    email.length > 0 &&
    (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email))
  ) {
    return { ok: false, field: "email", message: EMAIL_FORMAT_MESSAGE };
  }
  return { ok: true };
}

/** `google_review_url` must pass this before it is used as a link target. */
export function isValidReviewUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && isAllowedGoogleReviewHost(url.hostname);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Button labels and visibility ("shown only when on AND value valid", rule 17).
// ---------------------------------------------------------------------------

/** Menu label adapts to the business type (PRD 5.5.6). */
export function menuLabel(type: BusinessType): string {
  switch (type) {
    case "cafe":
    case "restaurant":
    case "hotel":
      return "Menu";
    case "salon":
    case "gym":
      return "Services and prices";
    case "retail":
    case "other":
      return "Products";
  }
}

/** PRD 5.5.6: the Menu button shows only when at least one item has a name. */
export function menuHasNamedItem(menu: PageConfig["menu"]): boolean {
  return namedMenuItemCount(menu) > 0;
}

/**
 * business-rules.md 11 rule 5 (downgrade): the public page renders only the
 * first N named items in the owner's order. `null` = unlimited. Categories that
 * end up with no shown item are omitted, exactly like an empty category.
 */
export function limitedMenuCategories(
  menu: MenuConfig,
  limit: number | null,
): MenuCategory[] {
  let left = limit === null ? Number.POSITIVE_INFINITY : Math.max(0, limit);
  const result: MenuCategory[] = [];
  for (const category of menu.categories) {
    if (left <= 0) break;
    const named = category.items.filter(
      (item) => stripUnsafeText(item.name).trim().length > 0,
    );
    const shown =
      left === Number.POSITIVE_INFINITY ? named : named.slice(0, left);
    left -= shown.length;
    if (shown.length > 0) {
      result.push({ name: category.name, items: shown });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Shown buttons (computed at render time, never stored — business-rules 11 rule 18).
// Order is fixed in v1: Menu, Hours and contact, Call, WhatsApp, Directions,
// Pay now, then custom link buttons (PRD 5.5.5). Wi-Fi is Phase 4B-D and is
// not built.
// ---------------------------------------------------------------------------

export type CustomerButtonKind =
  | "menu"
  | "hours"
  | "call"
  | "whatsapp"
  | "directions"
  | "pay"
  | "loyalty"
  | "custom";

export type CustomerButton = {
  key: string;
  kind: CustomerButtonKind;
  label: string;
  /** Direct action (Call / WhatsApp / Directions / custom link). */
  href?: string;
  /** In-page screen this button opens. */
  screen?: "menu" | "hours" | "pay" | "loyalty";
};

/** The menu title shown to customers: the owner's title else the type label. */
export function menuTitle(
  config: PageConfig,
  businessType: BusinessType,
): string {
  return clampText(
    config.buttons.menu.title.trim() || menuLabel(businessType),
    MAX_MENU_TITLE_LENGTH,
  );
}

/** An item is shown only when it is on AND its value is valid (rule 17). */
export function shownButtons(
  config: PageConfig,
  businessType: BusinessType,
): CustomerButton[] {
  const b = config.buttons;
  const buttons: CustomerButton[] = [];

  if (b.menu.on && menuHasNamedItem(config.menu)) {
    buttons.push({
      key: "menu",
      kind: "menu",
      label: menuTitle(config, businessType),
      screen: "menu",
    });
  }
  if (b.hours.on && isHoursShown(b.hours)) {
    buttons.push({
      key: "hours",
      kind: "hours",
      label: "Hours and contact",
      screen: "hours",
    });
  }
  if (b.call.on && isValidPhone(b.call.phone)) {
    buttons.push({
      key: "call",
      kind: "call",
      label: "Call",
      href: buildTelLink(b.call.phone),
    });
  }
  if (b.whatsapp.on && isValidPhone(b.whatsapp.phone)) {
    buttons.push({
      key: "whatsapp",
      kind: "whatsapp",
      label: "WhatsApp",
      href: buildWhatsAppLink(b.whatsapp.phone),
    });
  }
  if (b.directions.on && isValidMapsValue(b.directions.value)) {
    buttons.push({
      key: "directions",
      kind: "directions",
      label: "Directions",
      href: buildMapsLink(b.directions.value),
    });
  }
  // Pay now (owner decision, Pay button spec): shown only when On AND valid.
  // The customer-side link itself is built by the Pay screen via `payLink`.
  if (isPayShown(b.pay)) {
    buttons.push({ key: "pay", kind: "pay", label: "Pay now", screen: "pay" });
  }

  // Custom link buttons: every plan, hard cap 20 (security 4C). https only.
  b.custom_links.slice(0, MAX_CUSTOM_LINKS).forEach((link, index) => {
    const label = clampText(link.label, MAX_CUSTOM_LINK_LABEL_LENGTH);
    if (isCustomLinkShown(link) && label) {
      buttons.push({
        key: `custom-${index}`,
        kind: "custom",
        label,
        href: link.url.trim(),
      });
    }
  });

  return buttons;
}

/** The shown custom links (for the thank-you page, PRD 5.5.10). */
export function shownCustomLinks(
  config: PageConfig,
  businessType: BusinessType,
): CustomerButton[] {
  return shownButtons(config, businessType).filter(
    (button) => button.kind === "custom",
  );
}

/** The render-time grid layout: odd last button stretches, 0 draws nothing. */
export function isStretchedTile(index: number, total: number): boolean {
  return total % 2 === 1 && index === total - 1;
}

// ---------------------------------------------------------------------------
// Time helpers (announcement end date + "Open now", evaluated in the business
// time zone — business-rules.md 11 rule 12, PRD 5.5.7).
// ---------------------------------------------------------------------------

function zonedParts(
  now: Date,
  timeZone: string,
): { weekday: Weekday; hour: number; minute: number; date: string } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, Weekday> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  const weekday = weekdayMap[get("weekday")] ?? "mon";
  const rawHour = Number.parseInt(get("hour"), 10);
  const hour = Number.isNaN(rawHour) ? 0 : rawHour % 24;
  const minute = Number.parseInt(get("minute"), 10) || 0;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { weekday, hour, minute, date };
}

/**
 * The announcement text to show, or `null` when off/hidden/expired. ONE copy
 * shared by the public route and the client page (so saved content can be
 * re-derived after mount with the same rules).
 */
export function visibleAnnouncementText(
  config: PageConfig | null,
  now: Date,
  timeZone: string,
): string | null {
  if (!config?.announcement.on) return null;
  if (!isAnnouncementActive(config.announcement.end_date, now, timeZone)) {
    return null;
  }
  const text = stripUnsafeText(config.announcement.text)
    .trim()
    .slice(0, MAX_ANNOUNCEMENT_LENGTH);
  return text || null;
}

/**
 * business-rules.md 11 rule 12: after the end date the banner is not shown.
 * `end_date` is a `YYYY-MM-DD` string; inclusive of the end date itself.
 */
export function isAnnouncementActive(
  endDate: string | null,
  now: Date,
  timeZone: string,
): boolean {
  if (!endDate) return true;
  return zonedParts(now, timeZone).date <= endDate;
}

/** "Open now" / "Closed" from the weekly hours in the business time zone. */
export function isOpenNow(
  week: WeekHours,
  now: Date,
  timeZone: string,
): boolean {
  const { weekday, hour, minute } = zonedParts(now, timeZone);
  const day = week[weekday];
  if (!day || day.closed) return false;
  const minutes = hour * 60 + minute;
  return day.ranges.some((range) => {
    const open = toMinutes(range.open);
    const close = toMinutes(range.close);
    if (open === null || close === null) return false;
    // Ranges that cross midnight (e.g. 18:00–02:00).
    if (close <= open) return minutes >= open || minutes < close;
    return minutes >= open && minutes < close;
  });
}

function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export const WEEKDAY_ORDER: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

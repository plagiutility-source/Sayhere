/**
 * Customer-page content rules as pure functions — ONE place
 * (security-and-reliability.md 4C, PRD.md 5.5.4/5.5.5/5.5.7/5.5.13,
 * business-rules.md section 11, customer-page-ui-spec.md 2.4).
 *
 * The editor uses these for inline errors and status badges; the public
 * renderer (`lib/customer-page.ts`) uses the same predicates, so "shown only
 * when On AND valid" is one rule. Stage 3 mirrors them as the shared zod
 * schema on the save route. No zod here (loop rule): plain functions only.
 *
 * Owner-supplied strings are never HTML — React escapes them on render; text
 * is additionally stripped of control/zero-width/bidi characters in
 * `lib/customer-page.ts` (`stripUnsafeText`).
 */

import type {
  MenuConfig,
  MenuImage,
  PageConfig,
  SocialKey,
  SocialLinks,
} from "@/lib/mock/customer-page";

/** Custom link buttons per location — hard cap 20 on every plan (4C). */
export const MAX_CUSTOM_LINKS = 20;

/** UPI ID max 50 and payee name max 30 are OWNER DECISIONS (Pay button spec). */
export const MAX_UPI_ID_LENGTH = 50;
export const MAX_PAYEE_NAME_LENGTH = 30;

/** Address max 200 (4C); links max 2048. */
export const MAX_MAPS_ADDRESS_LENGTH = 200;
export const MAX_LINK_LENGTH = 2048;

/** Menu lists max 12 per location (PRD 5.5.6). */
export const MAX_MENU_CATEGORIES = 12;

/**
 * Menu photo reference (AI_MENU_PHOTOS.md). The key is a server-generated
 * random id, never a URL, so an owner can never point the page at an outside
 * image (security 4C: no hotlinking). `variant` picks the Stage 1 placeholder
 * drawing and is ignored once real images are stored in R2.
 */
export const MENU_IMAGE_VARIANTS = 3;
export const MENU_IMAGE_KEY_PATTERN = /^[a-z0-9-]{8,40}$/;

export function isValidMenuImage(value: unknown): value is MenuImage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const image = value as Record<string, unknown>;
  return (
    typeof image.key === "string" &&
    MENU_IMAGE_KEY_PATTERN.test(image.key) &&
    typeof image.variant === "number" &&
    Number.isInteger(image.variant) &&
    image.variant >= 0 &&
    image.variant < MENU_IMAGE_VARIANTS &&
    image.ai === true
  );
}

/**
 * Menu item ids for ordering (master 4.5). Optional on old saved configs; when
 * present, the format is fixed so a guest can never invent an id.
 */
export const MENU_ITEM_ID_PATTERN = /^itm_[a-z0-9]{16}$/;

export function isValidMenuItemId(value: unknown): value is string {
  return typeof value === "string" && MENU_ITEM_ID_PATTERN.test(value);
}

/** Weekly hours note max 100 (PRD 5.5.7). */
export const MAX_HOURS_NOTE_LENGTH = 100;

// ---------------------------------------------------------------------------
// Primitives (kept here so the editor and the renderer share exactly one copy;
// lib/customer-page.ts re-exports them for existing callers).
// ---------------------------------------------------------------------------

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // raw IPv4
  if (host.includes(":")) return true; // raw IPv6
  return false;
}

/** `https://` only, ≤ 2048 chars, no credentials, no localhost/private/raw IP. */
export function isValidHttpsUrl(
  value: string,
  max = MAX_LINK_LENGTH,
): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (isBlockedHost(url.hostname)) return false;
  return true;
}

const SOCIAL_HOSTS: Record<SocialKey, readonly string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com"],
  youtube: ["youtube.com", "youtu.be"],
  x: ["x.com", "twitter.com"],
  website: [], // any https host
};

/** Per-platform host allowlist for social icons (PRD 5.5.4). */
export function isValidSocialUrl(key: SocialKey, value: string): boolean {
  if (!isValidHttpsUrl(value)) return false;
  const hosts = SOCIAL_HOSTS[key];
  if (hosts.length === 0) return true;
  const host = new URL(value.trim()).hostname.toLowerCase();
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** 7 to 15 digits, optional leading `+` (security 4C / PRD 5.5.7). */
export function isValidPhone(value: string): boolean {
  return /^\+?\d{7,15}$/.test(value.trim());
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.trim()}`;
}

export function buildWhatsAppLink(phone: string): string {
  return `https://wa.me/${phone.trim().replace(/^\+/, "")}`;
}

/** Google Maps host allowlist (PRD 5.5.7). */
function isAllowedMapsHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  if (host === "google.com" || host.endsWith(".google.com")) {
    return url.pathname.startsWith("/maps");
  }
  return false;
}

/** A plain address (≤ 200 chars) or a Google Maps link. */
export function isValidMapsValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_MAPS_ADDRESS_LENGTH) return false;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return true; // plain address text
  return isValidHttpsUrl(trimmed) && isAllowedMapsHost(new URL(trimmed));
}

/** Builds a Maps search link from a validated address, or returns a valid link. */
export function buildMapsLink(value: string): string {
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

// ---------------------------------------------------------------------------
// Inline error texts (exactly ui-spec 2.4). Empty values are handled by the
// caller/issue list ("Needs a link"); these return undefined when acceptable.
// ---------------------------------------------------------------------------

/** Any https link; no credentials; no localhost/raw IP. */
export function linkError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_LINK_LENGTH) {
    return `Keep the link under ${MAX_LINK_LENGTH} characters.`;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Link must start with https://";
  }
  if (url.protocol !== "https:") return "Link must start with https://";
  if (url.username || url.password) {
    return "Links cannot contain a username or password";
  }
  if (isBlockedHost(url.hostname)) return "That host is not allowed.";
  return undefined;
}

const SOCIAL_HOST_LABEL: Record<SocialKey, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  youtube: "youtube.com",
  x: "x.com",
  website: "",
};

/** Social link: https + the platform host allowlist. */
export function socialLinkError(
  key: SocialKey,
  value: string,
): string | undefined {
  const base = linkError(value);
  if (base) return base;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!isValidSocialUrl(key, trimmed)) {
    return `Link must be on ${SOCIAL_HOST_LABEL[key]}`;
  }
  return undefined;
}

/** Phone / WhatsApp number. */
export function phoneError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!isValidPhone(trimmed)) {
    return "Enter 7 to 15 digits, with an optional + at the start";
  }
  return undefined;
}

/** Hours and contact address (max 200, same cap as Directions — security 4C). */
export function addressError(value: string): string | undefined {
  if (value.trim().length > MAX_MAPS_ADDRESS_LENGTH) {
    return `Keep the address under ${MAX_MAPS_ADDRESS_LENGTH} characters.`;
  }
  return undefined;
}

/** Weekly hours note (max 100 — PRD 5.5.7). */
export function hoursNoteError(value: string): string | undefined {
  if (value.trim().length > MAX_HOURS_NOTE_LENGTH) {
    return `Keep the note under ${MAX_HOURS_NOTE_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * PRD 5.5.4 (Hours and contact): phone must be valid if entered and either a
 * phone number or an address must be present. Shared by the editor and the
 * public renderer, so "shown only when On AND valid" is one rule.
 */
export function isHoursShown(
  hours: PageConfig["buttons"]["hours"],
): boolean {
  const phone = hours.phone.trim();
  if (phone && !isValidPhone(phone)) return false;
  return phone.length > 0 || hours.address.trim().length > 0;
}

/**
 * PRD 5.5.6: an item counts only once it has a name; unnamed items are ignored
 * by the customer view and by the plan limit.
 */
export function namedMenuItemCount(menu: MenuConfig): number {
  return menu.categories.reduce(
    (sum, category) =>
      sum + category.items.filter((item) => item.name.trim().length > 0).length,
    0,
  );
}

/** Directions: an address (≤ 200) or a Google Maps link. */
export function mapsValueError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_MAPS_ADDRESS_LENGTH) {
    return `Keep the address under ${MAX_MAPS_ADDRESS_LENGTH} characters.`;
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined; // plain address
  const base = linkError(trimmed);
  if (base) return base;
  if (!isValidMapsValue(trimmed)) return "Link must be on google.com";
  return undefined;
}

/** UPI ID: name@handle — letters/digits/dot/dash/underscore, then @, then letters only. */
const UPI_ID_PATTERN = /^[A-Za-z0-9._-]+@[A-Za-z]+$/;

export function upiIdError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_UPI_ID_LENGTH) {
    return `Keep the UPI ID under ${MAX_UPI_ID_LENGTH} characters.`;
  }
  if (!UPI_ID_PATTERN.test(trimmed)) return "Enter a UPI ID like name@bank";
  return undefined;
}

export function payeeNameError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_PAYEE_NAME_LENGTH) {
    return `Keep the name under ${MAX_PAYEE_NAME_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * THE server-side rule for the Pay button, mirrored here: the ONLY allowed
 * `upi:` URL is built from the validated UPI ID and payee name, URL-encoded,
 * with `cu=INR` and no amount parameter. The owner never types a link, and no
 * other scheme is ever allowed (security 4C).
 */
export function payLink(upiId: string, name: string): string {
  return `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
    name.trim(),
  )}&cu=INR`;
}

// ---------------------------------------------------------------------------
// "On AND valid" predicates (one rule for the editor and the renderer).
// ---------------------------------------------------------------------------

export function isPayShown(pay: PageConfig["buttons"]["pay"]): boolean {
  return (
    pay.on &&
    upiIdError(pay.upi_id) === undefined &&
    pay.upi_id.trim().length > 0 &&
    pay.name.trim().length > 0 &&
    pay.name.trim().length <= MAX_PAYEE_NAME_LENGTH
  );
}

export function isCustomLinkShown(
  link: PageConfig["buttons"]["custom_links"][number],
): boolean {
  return (
    link.on &&
    link.label.trim().length > 0 &&
    link.label.trim().length <= 30 &&
    isValidHttpsUrl(link.url)
  );
}

export function isSocialShown(
  key: SocialKey,
  link: { on: boolean; url: string } | undefined,
): boolean {
  return Boolean(link?.on) && isValidSocialUrl(key, link?.url ?? "");
}

/**
 * business-rules.md 11 rule 5 (downgrade): after the plan shrinks, nothing is
 * deleted — the editor shows "Over your plan limit: upgrade or remove items"
 * with the count and Save is blocked until the content fits (or the owner
 * deletes items; deleting is always allowed). `null` = unlimited plan.
 */
export function menuLimitIssue(
  config: PageConfig,
  limit: number | null,
): PageConfigIssue | null {
  if (limit === null) return null;
  const count = namedMenuItemCount(config.menu);
  if (count <= limit) return null;
  return {
    key: "row-menu",
    label: "Menu",
    message: `Over your plan limit: upgrade or remove items (${count} of ${limit}).`,
  };
}

// ---------------------------------------------------------------------------
// Save blocking (rules 11.17): every On item that is empty or invalid.
// ---------------------------------------------------------------------------

export type PageConfigIssue = {
  /** Row id in the editor, so "Fix N items" can jump to it. */
  key: string;
  label: string;
  message: string;
};

export function pageConfigIssues(
  config: PageConfig,
  socials: SocialLinks,
): PageConfigIssue[] {
  const issues: PageConfigIssue[] = [];
  const b = config.buttons;

  if (config.announcement.on && !config.announcement.text.trim()) {
    issues.push({
      key: "row-announcement",
      label: "Announcement",
      message: "Enter the announcement text.",
    });
  }

  if (b.call.on) {
    if (!b.call.phone.trim()) {
      issues.push({
        key: "row-call",
        label: "Call",
        message: "Enter a phone number.",
      });
    } else if (phoneError(b.call.phone)) {
      issues.push({
        key: "row-call",
        label: "Call",
        message: phoneError(b.call.phone) as string,
      });
    }
  }

  if (b.whatsapp.on) {
    if (!b.whatsapp.phone.trim()) {
      issues.push({
        key: "row-whatsapp",
        label: "WhatsApp",
        message: "Enter a WhatsApp number.",
      });
    } else if (phoneError(b.whatsapp.phone)) {
      issues.push({
        key: "row-whatsapp",
        label: "WhatsApp",
        message: phoneError(b.whatsapp.phone) as string,
      });
    }
  }

  if (b.directions.on) {
    if (!b.directions.value.trim()) {
      issues.push({
        key: "row-directions",
        label: "Directions",
        message: "Enter an address or a Google Maps link.",
      });
    } else if (mapsValueError(b.directions.value)) {
      issues.push({
        key: "row-directions",
        label: "Directions",
        message: mapsValueError(b.directions.value) as string,
      });
    }
  }

  if (b.hours.on) {
    const phoneIssue = phoneError(b.hours.phone);
    if (phoneIssue) {
      issues.push({ key: "row-hours", label: "Hours and contact", message: phoneIssue });
    } else if (!b.hours.phone.trim() && !b.hours.address.trim()) {
      issues.push({
        key: "row-hours",
        label: "Hours and contact",
        message: "Enter a phone number or an address.",
      });
    } else {
      const addressIssue = addressError(b.hours.address);
      if (addressIssue) {
        issues.push({
          key: "row-hours",
          label: "Hours and contact",
          message: addressIssue,
        });
      }
    }
  }

  // PRD 5.5.4 (Menu): the item is valid only with at least one named item, so
  // an On-but-empty menu cannot be saved (rule 11.17); the customer page simply
  // keeps the button hidden until then.
  if (b.menu.on && namedMenuItemCount(config.menu) === 0) {
    issues.push({
      key: "row-menu",
      label: "Menu",
      message: "Add at least one item with a name, or turn the Menu button off.",
    });
  }

  if (b.pay.on) {
    if (!b.pay.upi_id.trim()) {
      issues.push({
        key: "row-pay",
        label: "Pay now",
        message: "Enter your UPI ID.",
      });
    } else if (upiIdError(b.pay.upi_id)) {
      issues.push({
        key: "row-pay",
        label: "Pay now",
        message: upiIdError(b.pay.upi_id) as string,
      });
    }
    if (!b.pay.name.trim()) {
      issues.push({
        key: "row-pay",
        label: "Pay now",
        message: "Enter the name customers will see.",
      });
    }
  }

  b.custom_links.forEach((link, index) => {
    if (!link.on) return;
    const key = `row-custom-${index}`;
    if (!link.label.trim()) {
      issues.push({
        key,
        label: "Link button",
        message: "Enter a label.",
      });
    }
    if (!link.url.trim()) {
      issues.push({ key, label: "Link button", message: "Paste the link." });
    } else if (linkError(link.url)) {
      issues.push({
        key,
        label: "Link button",
        message: linkError(link.url) as string,
      });
    }
  });

  const socialKeys: SocialKey[] = [
    "instagram",
    "facebook",
    "youtube",
    "x",
    "website",
  ];
  for (const key of socialKeys) {
    const link = socials[key];
    if (!link?.on) continue;
    if (!link.url.trim()) {
      issues.push({
        key: `row-${key}`,
        label: key,
        message: "Paste the link.",
      });
    } else if (socialLinkError(key, link.url)) {
      issues.push({
        key: `row-${key}`,
        label: key,
        message: socialLinkError(key, link.url) as string,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Tables/Rooms page (merge M7) — a second tab on the SAME page config.
//
// The reception page keeps owning the one menu; this page only sets its title
// and the buttons/contact the table QR page shows. Optional on older saved
// configs, so `rooms_page` absent = the empty draft below.
// ---------------------------------------------------------------------------

export type RoomsPageDraft = {
  announcement: { on: boolean; text: string };
  thank_you: string;
  wifi: { on: boolean; ssid: string; password: string };
  menu_title: string;
  hours: { on: boolean; phone: string; address: string };
  call: { on: boolean; phone: string };
  directions: { on: boolean; value: string };
  custom: { on: boolean; label: string; url: string };
};

/** Same limits as the feature's own text rules (spec section 6). */
export const MAX_ROOMS_ANNOUNCEMENT_LENGTH = 160;
export const MAX_ROOMS_THANK_YOU_LENGTH = 160;
export const MAX_ROOMS_MENU_TITLE_LENGTH = 60;
export const MAX_ROOMS_CUSTOM_LABEL_LENGTH = 30;

/** Everything off, nothing filled in — what a new rooms page starts as. */
export function emptyRoomsPageDraft(): RoomsPageDraft {
  return {
    announcement: { on: false, text: "" },
    thank_you: "",
    wifi: { on: false, ssid: "", password: "" },
    menu_title: "",
    hours: { on: false, phone: "", address: "" },
    call: { on: false, phone: "" },
    directions: { on: false, value: "" },
    custom: { on: false, label: "", url: "" },
  };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Rebuild the draft from untrusted data; invalid values fall back clean. */
export function sanitizeRoomsPageDraft(
  raw: unknown,
  fallback: RoomsPageDraft,
): RoomsPageDraft {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...fallback };
  }
  const row = record(raw);
  const announcement = record(row.announcement);
  const wifi = record(row.wifi);
  const hours = record(row.hours);
  const call = record(row.call);
  const directions = record(row.directions);
  const custom = record(row.custom);
  const url = text(custom.url, MAX_LINK_LENGTH).trim();
  return {
    announcement: {
      on: announcement.on === true,
      text: text(announcement.text, MAX_ROOMS_ANNOUNCEMENT_LENGTH),
    },
    thank_you: text(row.thank_you, MAX_ROOMS_THANK_YOU_LENGTH),
    wifi: {
      on: wifi.on === true,
      ssid: text(wifi.ssid, 100),
      password: text(wifi.password, 100),
    },
    menu_title: text(row.menu_title, MAX_ROOMS_MENU_TITLE_LENGTH),
    hours: {
      on: hours.on === true,
      phone: text(hours.phone, 20),
      address: text(hours.address, MAX_MAPS_ADDRESS_LENGTH),
    },
    call: { on: call.on === true, phone: text(call.phone, 20) },
    directions: {
      on: directions.on === true,
      value: text(directions.value, MAX_LINK_LENGTH),
    },
    custom: {
      on: custom.on === true,
      label: text(custom.label, MAX_ROOMS_CUSTOM_LABEL_LENGTH),
      url: isValidHttpsUrl(url) ? url : "",
    },
  };
}

/** The same "On AND valid" save blocking as the reception tab (rules 11.17). */
export function roomsPageDraftIssues(draft: RoomsPageDraft): PageConfigIssue[] {
  const issues: PageConfigIssue[] = [];

  if (draft.announcement.on && !draft.announcement.text.trim()) {
    issues.push({
      key: "rooms-announcement",
      label: "Announcement",
      message: "Enter the announcement text.",
    });
  }

  if (draft.wifi.on && !draft.wifi.ssid.trim()) {
    issues.push({
      key: "rooms-wifi",
      label: "Wi-Fi",
      message: "Enter the Wi-Fi network name.",
    });
  }

  if (draft.hours.on) {
    const phoneIssue = phoneError(draft.hours.phone);
    if (phoneIssue) {
      issues.push({ key: "rooms-hours", label: "Hours and contact", message: phoneIssue });
    } else if (!draft.hours.phone.trim() && !draft.hours.address.trim()) {
      issues.push({
        key: "rooms-hours",
        label: "Hours and contact",
        message: "Enter a phone number or an address.",
      });
    } else if (addressError(draft.hours.address)) {
      issues.push({
        key: "rooms-hours",
        label: "Hours and contact",
        message: addressError(draft.hours.address) as string,
      });
    }
  }

  if (draft.call.on) {
    if (!draft.call.phone.trim()) {
      issues.push({ key: "rooms-call", label: "Call", message: "Enter a phone number." });
    } else if (phoneError(draft.call.phone)) {
      issues.push({
        key: "rooms-call",
        label: "Call",
        message: phoneError(draft.call.phone) as string,
      });
    }
  }

  if (draft.directions.on) {
    if (!draft.directions.value.trim()) {
      issues.push({
        key: "rooms-directions",
        label: "Directions",
        message: "Enter an address or a Google Maps link.",
      });
    } else if (mapsValueError(draft.directions.value)) {
      issues.push({
        key: "rooms-directions",
        label: "Directions",
        message: mapsValueError(draft.directions.value) as string,
      });
    }
  }

  if (draft.custom.on) {
    if (!draft.custom.label.trim()) {
      issues.push({ key: "rooms-custom", label: "Custom link", message: "Enter a label." });
    }
    if (!draft.custom.url.trim()) {
      issues.push({
        key: "rooms-custom",
        label: "Custom link",
        message: "Paste the link.",
      });
    } else if (linkError(draft.custom.url)) {
      issues.push({
        key: "rooms-custom",
        label: "Custom link",
        message: linkError(draft.custom.url) as string,
      });
    }
  }

  return issues;
}

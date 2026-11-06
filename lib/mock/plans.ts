/**
 * Plan names, prices and limits — the ONE place they live.
 *
 * Values and field names mirror the `plans` seed in schema.sql (which is the
 * server-side source of truth) and PRD.md section 4. Never hardcode a plan
 * price, location limit or scan limit in a component; import from here.
 *
 * `null` means unlimited (locations / monthly_scans) or "custom, contact us"
 * (price). Money is an integer number of paise (INR minor units).
 */

export type PlanId = "free" | "starter" | "pro" | "growth" | "enterprise";

/**
 * AI dish photo allowance (AI_MENU_PHOTOS.md). ALWAYS a number, never null:
 * every image costs real money, so there is no "unlimited" tier (Enterprise
 * gets a larger number, raised by an admin). `period` says when it resets:
 * `lifetime` = a one-time trial that never refills (Free), `month` = refills
 * every billing cycle (paid plans).
 */
export type AiImageAllowance = {
  limit: number;
  period: "lifetime" | "month";
};

export type PlanPageLimits = {
  /** Menu item limit, or null for unlimited within the security hard cap. */
  menu_items: number | null;
  /** Custom link limit; null = no plan limit on every plan. */
  custom_links: number | null;
  /** AI-generated dish photos (see AiImageAllowance). */
  ai_images: AiImageAllowance;
};

export type Plan = {
  id: PlanId;
  /** Display label only; the schema stores just the plan key. */
  name: string;
  price_inr_paise: number | null;
  locations: number | null;
  monthly_scans: number | null;
  self_serve: boolean;
  google_auto_reply: boolean;
  page: PlanPageLimits;
};

export const plans: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price_inr_paise: 0,
    locations: 1,
    monthly_scans: 10,
    self_serve: false,
    google_auto_reply: true,
    page: {
      menu_items: 10,
      custom_links: null,
      ai_images: { limit: 3, period: "lifetime" },
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    price_inr_paise: 19900,
    locations: 1,
    monthly_scans: 1000,
    self_serve: true,
    google_auto_reply: false,
    page: {
      menu_items: 60,
      custom_links: null,
      ai_images: { limit: 15, period: "month" },
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price_inr_paise: 29900,
    locations: 1,
    monthly_scans: 10000,
    self_serve: true,
    google_auto_reply: true,
    page: {
      menu_items: 150,
      custom_links: null,
      ai_images: { limit: 40, period: "month" },
    },
  },
  growth: {
    id: "growth",
    name: "Growth",
    price_inr_paise: 49900,
    locations: 1,
    monthly_scans: 25000,
    self_serve: true,
    google_auto_reply: true,
    page: {
      menu_items: 200,
      custom_links: null,
      ai_images: { limit: 60, period: "month" },
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price_inr_paise: null,
    locations: null,
    monthly_scans: null,
    self_serve: false,
    google_auto_reply: true,
    page: {
      menu_items: null,
      custom_links: null,
      ai_images: { limit: 100, period: "month" },
    },
  },
};

/** Plan display order (Free, Starter, Pro, Enterprise). */
export const planOrder: PlanId[] = ["free", "starter", "pro", "growth", "enterprise"];

/** Deterministic Indian digit grouping (no Intl, so SSR and client match). */
function groupIndian(value: number): string {
  const digits = String(value);
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${lastThree}`;
}

/** "₹499" from 49900 paise. */
export function formatInrPaise(paise: number): string {
  return `₹${groupIndian(Math.round(paise / 100))}`;
}

/**
 * Exact money for invoices and payments: paise are kept when present, so
 * ₹5,239.20 never rounds to ₹5,239 on a document. Non-negative amounts only
 * (invoices cannot go below zero).
 */
export function formatInrPaiseExact(paise: number): string {
  const safe = Math.max(0, Math.round(paise));
  const rupees = Math.floor(safe / 100);
  const fraction = safe % 100;
  return fraction === 0
    ? `₹${groupIndian(rupees)}`
    : `₹${groupIndian(rupees)}.${String(fraction).padStart(2, "0")}`;
}

/** Price line for a plan card, e.g. "₹0", "₹499/month" or "Contact us". */
export function planPriceLabel(plan: Plan): string {
  if (plan.price_inr_paise === null) return "Contact us";
  if (plan.price_inr_paise === 0) return "₹0";
  return `${formatInrPaise(plan.price_inr_paise)}/month`;
}

/** "Unlimited" for null, otherwise a grouped number. */
export function limitLabel(value: number | null): string {
  return value === null ? "Unlimited" : groupIndian(value);
}

/** "3 one-time" / "15 per month" for plan cards and the editor. */
export function aiImageAllowanceLabel(allowance: AiImageAllowance): string {
  return allowance.period === "lifetime"
    ? `${allowance.limit} (one-time trial)`
    : `${allowance.limit} per month`;
}

/**
 * MOCK ONLY, replaced in Stage 4 by the server routes in AI_MENU_PHOTOS.md.
 *
 * Stage 1 has no backend, so the AI photo "provider" and the credit ledger are
 * simulated in the browser. The behaviour mirrors the real design on purpose:
 *
 *  - a credit is RESERVED before generation starts and REFUNDED if it fails;
 *  - a plan allowance, a daily hard cap and a cooldown all apply;
 *  - the result is a draft the owner must approve before it is saved.
 *
 * Nothing here calls any AI service and nothing leaves the browser. A dish
 * whose name contains "(fail)" simulates a provider failure so the refund path
 * can be tried by hand. Stored values are never trusted: they are parsed in a
 * try/catch and every field is range-checked.
 *
 * In Stage 4 the counters become columns on `businesses` (+ `ai_image_jobs`),
 * and `reserve` becomes ONE conditional UPDATE so two parallel requests can
 * never spend the same credit (schema.sql, AI_MENU_PHOTOS.md section 5).
 */

import {
  AI_IMAGE_COOLDOWN_MS,
  AI_IMAGE_DAILY_CAP,
  AI_IMAGE_FAILURE_MESSAGE,
  buildMenuImagePrompt,
  type AiImageBlockReason,
} from "@/lib/ai-images";
import type { MenuImage } from "@/lib/mock/customer-page";
import type { AiImageAllowance } from "@/lib/mock/plans";
import { MENU_IMAGE_VARIANTS } from "@/lib/validation/page-config";

/** One versioned key for the mock ledger; bump on shape changes. */
export const AI_IMAGE_STORAGE_KEY = "syehere.mock.ai-images.v1";

/** How long the simulated provider takes. */
const MOCK_GENERATION_MS = 1_600;

type Ledger = {
  lifetime_used: number;
  month: string; // YYYY-MM the month counter belongs to
  month_used: number;
  day: string; // YYYY-MM-DD the day counter belongs to
  day_used: number;
  last_at: number; // ms timestamp of the last accepted generation
};

export type AiImageUsage = {
  limit: number;
  period: AiImageAllowance["period"];
  used: number;
  remaining: number;
  dailyUsed: number;
  dailyRemaining: number;
};

/**
 * What a reserved credit needs to be refunded correctly. `count` is how many
 * credits one reservation took: 1 for a single generate tap, more for a menu
 * PDF import (see `reserveAiImageBatch`).
 */
export type AiImageTicket = {
  month: string;
  day: string;
  prevLastAt: number;
  count?: number;
};

export type ReserveResult =
  | { ok: true; ticket: AiImageTicket }
  | { ok: false; reason: AiImageBlockReason };

/** A bulk reservation for one import job. */
export type BatchReserveResult =
  | {
      ok: true;
      ticket: AiImageTicket;
      /** Credits actually taken (may be less than requested). */
      count: number;
      /** Null when every requested photo fitted. */
      limitedBy: "plan" | "daily_cap" | null;
    }
  | { ok: false; reason: "no_credits" | "daily_cap" };

export class AiImageError extends Error {
  constructor(message = AI_IMAGE_FAILURE_MESSAGE) {
    super(message);
    this.name = "AiImageError";
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function monthKey(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function dayKey(now: Date): string {
  return `${monthKey(now)}-${pad(now.getDate())}`;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, 1_000_000)
    : 0;
}

/** A ms timestamp: finite, never negative, never in the future. */
function timestamp(value: unknown, now: Date): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= now.getTime()
    ? value
    : 0;
}

function emptyLedger(now: Date): Ledger {
  return {
    lifetime_used: 0,
    month: monthKey(now),
    month_used: 0,
    day: dayKey(now),
    day_used: 0,
    last_at: 0,
  };
}

/** Reads the ledger and rolls the month/day counters forward when due. */
function readLedger(now: Date): Ledger {
  const fresh = emptyLedger(now);
  if (typeof window === "undefined") return fresh;
  try {
    const raw = window.localStorage.getItem(AI_IMAGE_STORAGE_KEY);
    if (!raw) return fresh;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fresh;
    }
    const row = parsed as Record<string, unknown>;
    const ledger: Ledger = {
      lifetime_used: count(row.lifetime_used),
      month: typeof row.month === "string" ? row.month : fresh.month,
      month_used: count(row.month_used),
      day: typeof row.day === "string" ? row.day : fresh.day,
      day_used: count(row.day_used),
      last_at: timestamp(row.last_at, now),
    };
    if (ledger.month !== fresh.month) {
      ledger.month = fresh.month;
      ledger.month_used = 0;
    }
    if (ledger.day !== fresh.day) {
      ledger.day = fresh.day;
      ledger.day_used = 0;
    }
    return ledger;
  } catch {
    return fresh;
  }
}

function writeLedger(ledger: Ledger): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AI_IMAGE_STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    // Storage full or blocked: the mock simply forgets; nothing breaks.
  }
}

/** The usage the editor shows for the current plan allowance. */
export function readAiImageUsage(allowance: AiImageAllowance): AiImageUsage {
  const ledger = readLedger(new Date());
  const used =
    allowance.period === "lifetime" ? ledger.lifetime_used : ledger.month_used;
  return {
    limit: allowance.limit,
    period: allowance.period,
    used,
    remaining: Math.max(0, allowance.limit - used),
    dailyUsed: ledger.day_used,
    dailyRemaining: Math.max(0, AI_IMAGE_DAILY_CAP - ledger.day_used),
  };
}

/**
 * Takes MANY credits at once for one menu import, or says why not.
 *
 * A batch is ONE job, so the per-tap cooldown does not apply between its
 * photos; the plan allowance and the daily hard cap still do. Returns the
 * number of photos the owner can actually get, so the import can fill the rest
 * of the menu without photos instead of failing.
 */
export function reserveAiImageBatch(
  allowance: AiImageAllowance,
  requested: number,
): BatchReserveResult {
  const now = new Date();
  const ledger = readLedger(now);
  const used =
    allowance.period === "lifetime" ? ledger.lifetime_used : ledger.month_used;
  const planLeft = Math.max(0, allowance.limit - used);
  const dayLeft = Math.max(0, AI_IMAGE_DAILY_CAP - ledger.day_used);
  if (planLeft === 0) return { ok: false, reason: "no_credits" };
  if (dayLeft === 0) return { ok: false, reason: "daily_cap" };
  const wanted = Math.max(0, Math.min(Math.floor(requested), 1_000));
  const count = Math.min(wanted, planLeft, dayLeft);
  if (count === 0) return { ok: false, reason: "no_credits" };
  const ticket: AiImageTicket = {
    month: ledger.month,
    day: ledger.day,
    prevLastAt: ledger.last_at,
    count,
  };
  ledger.lifetime_used += count;
  ledger.month_used += count;
  ledger.day_used += count;
  ledger.last_at = now.getTime();
  writeLedger(ledger);
  return {
    ok: true,
    ticket,
    count,
    limitedBy: count < wanted ? (planLeft < dayLeft ? "plan" : "daily_cap") : null,
  };
}

/** Takes one credit BEFORE generation, or says why not (nothing is spent). */
export function reserveAiImage(allowance: AiImageAllowance): ReserveResult {
  const now = new Date();
  const ledger = readLedger(now);
  const used =
    allowance.period === "lifetime" ? ledger.lifetime_used : ledger.month_used;
  if (used >= allowance.limit) return { ok: false, reason: "no_credits" };
  if (ledger.day_used >= AI_IMAGE_DAILY_CAP) {
    return { ok: false, reason: "daily_cap" };
  }
  if (now.getTime() - ledger.last_at < AI_IMAGE_COOLDOWN_MS) {
    return { ok: false, reason: "cooldown" };
  }
  const ticket: AiImageTicket = {
    month: ledger.month,
    day: ledger.day,
    prevLastAt: ledger.last_at,
  };
  ledger.lifetime_used += 1;
  ledger.month_used += 1;
  ledger.day_used += 1;
  ledger.last_at = now.getTime();
  writeLedger(ledger);
  return { ok: true, ticket };
}

/** Gives reserved credit(s) back (provider failure). Idempotent per ticket use. */
export function refundAiImage(ticket: AiImageTicket): void {
  const ledger = readLedger(new Date());
  const refunded = Math.max(1, Math.min(ticket.count ?? 1, 1_000));
  ledger.lifetime_used = Math.max(0, ledger.lifetime_used - refunded);
  if (ledger.month === ticket.month) {
    ledger.month_used = Math.max(0, ledger.month_used - refunded);
  }
  if (ledger.day === ticket.day) {
    ledger.day_used = Math.max(0, ledger.day_used - refunded);
  }
  ledger.last_at = ticket.prevLastAt;
  writeLedger(ledger);
}

function randomKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().toLowerCase();
  }
  return `mock-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

/**
 * Simulated provider call. Resolves with a DRAFT image reference (the owner
 * still has to approve it) or throws `AiImageError`. `avoidVariant` makes
 * "Regenerate" look different from the picture just shown.
 */
export function mockGenerateMenuImage(input: {
  name: string;
  details: string;
  avoidVariant?: number;
}): Promise<MenuImage> {
  return new Promise((resolve, reject) => {
    // Same gate the real server uses: no usable name, no provider call.
    if (!buildMenuImagePrompt(input.name, input.details)) {
      reject(new AiImageError("Enter an item name first."));
      return;
    }
    window.setTimeout(() => {
      if (/\(fail\)/i.test(input.name)) {
        reject(new AiImageError());
        return;
      }
      const choices = Array.from(
        { length: MENU_IMAGE_VARIANTS },
        (_, index) => index,
      ).filter((index) => index !== input.avoidVariant);
      const variant = choices[Math.floor(Math.random() * choices.length)];
      resolve({ key: randomKey(), variant, ai: true });
    }, MOCK_GENERATION_MS);
  });
}

/** How long the simulated batch provider takes, once for the whole job. */
const MOCK_IMPORT_PHOTO_MS = 1_400;

/**
 * Simulated batch provider for a menu PDF import (one job, many photos).
 * The caller has ALREADY reserved the credits with `reserveAiImageBatch`;
 * this only turns them into draft image references. Variants cycle so an
 * imported list looks varied, matching what real generated photos would do.
 */
export async function mockGenerateImportPhotos(
  count: number,
): Promise<MenuImage[]> {
  const wanted = Math.max(0, Math.min(Math.floor(count), 1_000));
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, MOCK_IMPORT_PHOTO_MS);
  });
  return Array.from({ length: wanted }, (_, index) => ({
    key: randomKey(),
    variant: index % MENU_IMAGE_VARIANTS,
    ai: true as const,
  }));
}

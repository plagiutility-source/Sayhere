/**
 * MOCK ONLY, removed in Stage 4 when the database is connected.
 *
 * Keeps the loyalty state in `localStorage` and runs every action through the
 * pure rules in `lib/loyalty/rules.ts`. Because the owner dashboard and the
 * customer page share one browser, you can walk the WHOLE flow on one device:
 * join as a customer, open Stamp mode as staff in another tab, give a stamp,
 * complete the card, choose a reward and redeem it.
 *
 * IMPORTANT: localStorage is not secure. Anyone can edit it in dev tools, so
 * this mock proves the flow, not the fraud protection. Real protection starts
 * in Stage 3, when these same rules run on the server.
 *
 * Stored data is never trusted: it is parsed in a try/catch and anything that
 * does not look right falls back to a fresh state.
 */

import {
  emptyLoyaltyState,
  normalizeProgram,
  type LoyaltyState,
} from "@/lib/loyalty/rules";
import { addStaff } from "@/lib/loyalty/pin";

export const LOYALTY_STORAGE_KEY = "syehere.mock.loyalty.v1";
export const LOYALTY_SESSION_KEY = "syehere.mock.loyalty.session.v1";
const CHANGE_EVENT = "syehere:loyalty-changed";

/** Demo PIN so the mock Stamp mode works straight away. */
export const DEMO_STAFF_PIN = "1234";

let memory: LoyaltyState | null = null;
let memorySession: string | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Shape check only; the rules clamp every number again on use. */
function sanitize(raw: unknown): LoyaltyState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const lists = ["offers", "staff", "members", "stamps", "claims", "tokens"] as const;
  for (const key of lists) if (!Array.isArray(raw[key])) return null;
  if (!isRecord(raw.program) || !isRecord(raw.pin_lock)) return null;
  const lock = raw.pin_lock;
  return {
    version: 1,
    program: normalizeProgram(raw.program as never),
    offers: (raw.offers as LoyaltyState["offers"]).slice(0, 50),
    staff: (raw.staff as LoyaltyState["staff"]).slice(0, 20),
    members: (raw.members as LoyaltyState["members"]).slice(0, 5000),
    stamps: (raw.stamps as LoyaltyState["stamps"]).slice(-50000),
    claims: (raw.claims as LoyaltyState["claims"]).slice(-20000),
    tokens: (raw.tokens as LoyaltyState["tokens"]).slice(-500),
    pin_lock: {
      failures: typeof lock.failures === "number" ? lock.failures : 0,
      locked_until: typeof lock.locked_until === "string" ? lock.locked_until : null,
    },
  };
}

/** First run: a program with four example rewards (the owner edits them). */
export function seedLoyaltyState(): LoyaltyState {
  const state = emptyLoyaltyState();
  const examples: [string, string, "free_item" | "percent_off"][] = [
    ["Free coffee", "Any regular hot coffee", "free_item"],
    ["Free dessert", "Any dessert from the counter", "free_item"],
    ["20% off your bill", "One visit only", "percent_off"],
    ["Free sandwich", "Any sandwich from the menu", "free_item"],
  ];
  return {
    ...state,
    offers: examples.map(([title, description, kind], index) => ({
      id: `offer_demo${index + 1}`,
      title,
      description,
      kind,
      monthly_limit: null,
      active: true,
      sort_order: index + 1,
    })),
  };
}

export function getLoyaltyState(): LoyaltyState {
  if (memory) return memory;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOYALTY_STORAGE_KEY);
      if (raw) {
        const parsed = sanitize(JSON.parse(raw));
        if (parsed) {
          memory = parsed;
          return parsed;
        }
      }
    } catch {
      // Fall through to a fresh state.
    }
  }
  memory = seedLoyaltyState();
  return memory;
}

/** Reads fresh from storage so two open tabs never overwrite each other. */
function readFresh(): LoyaltyState {
  memory = null;
  return getLoyaltyState();
}

function persist(state: LoyaltyState) {
  memory = state;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the in-memory copy keeps this tab working.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Read-modify-write in one step. `fn` gets the latest state and returns the
 * new state plus whatever the caller needs (a result, an error).
 */
export function updateLoyalty<T>(
  fn: (state: LoyaltyState) => { state: LoyaltyState } & T,
): T {
  const result = fn(readFresh());
  persist(result.state);
  return result;
}

/** Like `updateLoyalty` but for actions that may fail (state unchanged on fail). */
export function tryLoyalty<R extends { ok: boolean }>(
  fn: (state: LoyaltyState) => R & { state?: LoyaltyState },
): R {
  const result = fn(readFresh());
  if (result.state) persist(result.state);
  return result;
}

export function setLoyaltyState(state: LoyaltyState) {
  persist(state);
}

export function resetLoyaltyDemo() {
  memory = null;
  persist(seedLoyaltyState());
  setSessionMemberId(null);
  void ensureDemoStaff();
}

export function subscribeLoyalty(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOYALTY_STORAGE_KEY || event.key === LOYALTY_SESSION_KEY) {
      memory = null;
      callback();
    }
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Adds the demo staff member (PIN 1234) the first time, so Stamp mode works. */
export async function ensureDemoStaff(): Promise<void> {
  const state = readFresh();
  if (state.staff.length > 0) return;
  const result = await addStaff(state, { name: "Counter", pin: DEMO_STAFF_PIN }, new Date());
  if (result.ok) persist(result.state);
}

// ---------------------------------------------------------------------------
// Customer device session (stands in for the signed-in cookie of Stage 3)
// ---------------------------------------------------------------------------

export function getSessionMemberId(): string | null {
  if (typeof window === "undefined") return memorySession;
  try {
    return window.localStorage.getItem(LOYALTY_SESSION_KEY) ?? memorySession;
  } catch {
    return memorySession;
  }
}

export function setSessionMemberId(memberId: string | null) {
  memorySession = memberId;
  if (typeof window === "undefined") return;
  try {
    if (memberId) window.localStorage.setItem(LOYALTY_SESSION_KEY, memberId);
    else window.localStorage.removeItem(LOYALTY_SESSION_KEY);
  } catch {
    // Keep the in-memory value.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ---------------------------------------------------------------------------
// Mock email code (stands in for the Resend email of Stage 3)
// ---------------------------------------------------------------------------

type PendingOtp = { email: string; code: string; expiresAt: number; tries: number };
let pendingOtp: PendingOtp | null = null;

const OTP_TTL_MS = 10 * 60_000;
const OTP_MAX_TRIES = 5;

/**
 * MOCK: "sends" a 6 digit code. The real server emails it with Resend, stores
 * only a hash, rate-limits by IP and email, and checks a Turnstile token first.
 * The mock returns the code so the screen can show it.
 */
export function mockSendEmailCode(email: string, now = Date.now()): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  pendingOtp = { email: email.trim().toLowerCase(), code, expiresAt: now + OTP_TTL_MS, tries: 0 };
  return code;
}

export function mockCheckEmailCode(
  email: string,
  code: string,
  now = Date.now(),
): { ok: true } | { ok: false; message: string } {
  const pending = pendingOtp;
  if (!pending || pending.email !== email.trim().toLowerCase()) {
    return { ok: false, message: "Ask for a new code and try again." };
  }
  if (pending.expiresAt <= now) {
    pendingOtp = null;
    return { ok: false, message: "That code has expired. Ask for a new one." };
  }
  if (pending.tries >= OTP_MAX_TRIES) {
    pendingOtp = null;
    return { ok: false, message: "Too many wrong tries. Ask for a new code." };
  }
  if (pending.code !== code.trim()) {
    pending.tries += 1;
    return { ok: false, message: "That code is not right." };
  }
  pendingOtp = null;
  return { ok: true };
}

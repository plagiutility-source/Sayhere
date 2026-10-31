/**
 * Staff PINs for Stamp mode (business-rules.md section 12).
 *
 * A PIN identifies which staff member gave a stamp or confirmed a reward, so
 * the owner can see who did what. PINs are stored salted and hashed, never in
 * clear text. Wrong guesses lock Stamp mode for a few minutes.
 *
 * MOCK NOTE: this uses one SHA-256 round from the browser's Web Crypto so the
 * mock works without a package. Stage 3 MUST use a slow password hash
 * (scrypt or argon2) on the server, because a 4 to 6 digit PIN is easy to
 * brute-force against a fast hash if the table ever leaks.
 */

import {
  LOYALTY_LIMITS,
  cleanStaffName,
  isValidPin,
  newId,
  validateStaffName,
  type LoyaltyState,
  type Rng,
  type StaffMember,
} from "./rules";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

function newSalt(rng: Rng): string {
  let out = "";
  for (let i = 0; i < 16; i++) out += Math.floor(rng() * 16).toString(16);
  return out;
}

export type PinFail = { ok: false; message: string };

/** Adds a staff member. The PIN must be unique among active staff. */
export async function addStaff(
  state: LoyaltyState,
  input: { name: string; pin: string },
  now: Date,
  rng: Rng = Math.random,
): Promise<{ ok: true; state: LoyaltyState; staff: StaffMember } | PinFail> {
  const nameError = validateStaffName(input.name);
  if (nameError) return { ok: false, message: nameError };
  if (!isValidPin(input.pin)) {
    return {
      ok: false,
      message: `The PIN must be ${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits.`,
    };
  }
  if (state.staff.length >= LOYALTY_LIMITS.maxStaff) {
    return {
      ok: false,
      message: `You can add up to ${LOYALTY_LIMITS.maxStaff} staff members.`,
    };
  }
  for (const other of state.staff.filter((s) => s.active)) {
    if ((await hashPin(input.pin, other.pin_salt)) === other.pin_hash) {
      return { ok: false, message: "Another staff member already uses that PIN." };
    }
  }
  const salt = newSalt(rng);
  const staff: StaffMember = {
    id: newId("staff", rng),
    name: cleanStaffName(input.name),
    pin_salt: salt,
    pin_hash: await hashPin(input.pin, salt),
    active: true,
    created_at: now.toISOString(),
  };
  return { ok: true, state: { ...state, staff: [...state.staff, staff] }, staff };
}

export async function changePin(
  state: LoyaltyState,
  staffId: string,
  pin: string,
  rng: Rng = Math.random,
): Promise<{ ok: true; state: LoyaltyState } | PinFail> {
  if (!isValidPin(pin)) {
    return {
      ok: false,
      message: `The PIN must be ${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits.`,
    };
  }
  for (const other of state.staff.filter((s) => s.active && s.id !== staffId)) {
    if ((await hashPin(pin, other.pin_salt)) === other.pin_hash) {
      return { ok: false, message: "Another staff member already uses that PIN." };
    }
  }
  const salt = newSalt(rng);
  const hash = await hashPin(pin, salt);
  return {
    ok: true,
    state: {
      ...state,
      staff: state.staff.map((s) =>
        s.id === staffId ? { ...s, pin_salt: salt, pin_hash: hash } : s,
      ),
    },
  };
}

export type IdentifyResult =
  | { ok: true; state: LoyaltyState; staff: StaffMember }
  | { ok: false; state: LoyaltyState; message: string; locked: boolean };

/**
 * Finds the active staff member whose PIN matches. Five wrong tries lock the
 * screen for five minutes (the lock is per business, because a wrong PIN can
 * not be tied to a person).
 */
export async function identifyStaff(
  state: LoyaltyState,
  pin: string,
  now: Date,
): Promise<IdentifyResult> {
  const lockedUntil = state.pin_lock.locked_until
    ? new Date(state.pin_lock.locked_until).getTime()
    : 0;
  if (lockedUntil > now.getTime()) {
    const minutes = Math.ceil((lockedUntil - now.getTime()) / 60_000);
    return {
      ok: false,
      state,
      locked: true,
      message: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  if (isValidPin(pin)) {
    for (const staff of state.staff.filter((s) => s.active)) {
      if ((await hashPin(pin, staff.pin_salt)) === staff.pin_hash) {
        return {
          ok: true,
          staff,
          state: { ...state, pin_lock: { failures: 0, locked_until: null } },
        };
      }
    }
  }
  const failures = state.pin_lock.failures + 1;
  const lock = failures >= LOYALTY_LIMITS.pinMaxFailures;
  return {
    ok: false,
    locked: lock,
    message: lock
      ? "Too many wrong PINs. Stamp mode is locked for 5 minutes."
      : "That PIN is not right.",
    state: {
      ...state,
      pin_lock: {
        failures: lock ? 0 : failures,
        locked_until: lock
          ? new Date(now.getTime() + LOYALTY_LIMITS.pinLockMs).toISOString()
          : null,
      },
    },
  };
}

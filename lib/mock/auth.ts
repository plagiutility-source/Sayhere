/**
 * MOCK ONLY, remove in Stage 3.
 *
 * Fake async auth used to exercise every UI state while the app is still
 * frontend-only. There is NO backend, NO Firebase and NO network call here.
 * Stage 3 replaces this module with the real Firebase client + `/api/auth`
 * calls; nothing else in the UI should change.
 *
 * Test triggers (also listed in PROGRESS.md):
 * - any email + any password that is not the demo account below => wrong
 *   credentials (5 failed tries for one email then too-many-attempts);
 * - `toomany@example.com` => too-many-attempts straight away;
 * - `error@example.com` => generic failure;
 * - `slow@example.com` => the same flow after ~2.5s, so the submitting state
 *   is visible;
 * - `unverified@example.com` => the verify-email screen still says "not yet".
 */

import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

/** The one "registered" demo account for the mock sign-in. */
export const MOCK_SIGN_IN_ACCOUNT = {
  email: "owner@example.com",
  password: "password123",
} as const;

export const mockAuthTriggers = {
  slowEmail: "slow@example.com",
  tooManyEmail: "toomany@example.com",
  genericErrorEmail: "error@example.com",
  unverifiedEmail: "unverified@example.com",
} as const;

export const authMessages = {
  // security-and-reliability.md 5A item 5: ALL credential failures show this,
  // so an attacker cannot tell a wrong password from an unknown email.
  wrongCredentials: "Incorrect email or password.",
  // auth/too-many-requests gets a friendly retry message instead.
  tooManyAttempts: "Too many attempts. Please wait a minute and try again.",
  // Non-credential failure (network/server). Short, friendly, no detail.
  generic: "Something went wrong. Please try again.",
  // Generic on purpose: identical whether or not the email exists.
  resetSent: "If that email is registered, a reset link has been sent.",
  verificationSent:
    "If that email is registered, a new verification link has been sent.",
  notVerified:
    "We have not seen a verification for that email yet. Check your inbox, then try again.",
} as const;

export type AuthFailureCode =
  | "wrong_credentials"
  | "too_many_attempts"
  | "generic";

export type MockAuthResult =
  | { ok: true }
  | { ok: false; code: AuthFailureCode };

/** Firebase itself throttles these calls; the mock mimics the same ceiling. */
const MAX_ATTEMPTS_BEFORE_THROTTLE = 5;

const attempts = new Map<string, number>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForEmail(email: string): Promise<void> {
  return delay(email.trim().toLowerCase() === mockAuthTriggers.slowEmail ? 2500 : 600);
}

export function signInErrorMessage(code: AuthFailureCode): string {
  if (code === "wrong_credentials") return authMessages.wrongCredentials;
  if (code === "too_many_attempts") return authMessages.tooManyAttempts;
  return authMessages.generic;
}

export async function mockSignIn(
  email: string,
  password: string,
): Promise<MockAuthResult> {
  const key = email.trim().toLowerCase();
  await waitForEmail(key);

  if (key === mockAuthTriggers.tooManyEmail) {
    return { ok: false, code: "too_many_attempts" };
  }
  if (key === mockAuthTriggers.genericErrorEmail) {
    return { ok: false, code: "generic" };
  }

  const failures = attempts.get(key) ?? 0;
  if (failures >= MAX_ATTEMPTS_BEFORE_THROTTLE) {
    return { ok: false, code: "too_many_attempts" };
  }

  const isDemoAccount =
    key === MOCK_SIGN_IN_ACCOUNT.email && password === MOCK_SIGN_IN_ACCOUNT.password;

  if (isDemoAccount) {
    attempts.delete(key);
    return { ok: true };
  }

  attempts.set(key, failures + 1);
  return { ok: false, code: "wrong_credentials" };
}

export async function mockSignUp(
  email: string,
  password: string,
): Promise<MockAuthResult> {
  const key = email.trim().toLowerCase();
  await waitForEmail(key);
  if (key === mockAuthTriggers.genericErrorEmail) {
    return { ok: false, code: "generic" };
  }
  // Mock only: no account is stored, so signup always "succeeds" and the UI
  // moves on to email verification.
  void password;
  return { ok: true };
}

export async function mockSignInWithGoogle(): Promise<MockAuthResult> {
  await delay(900);
  return { ok: true };
}

/** Always resolves the same way, whatever the email (no enumeration). */
export async function mockRequestPasswordReset(
  email: string,
): Promise<MockAuthResult> {
  await waitForEmail(email);
  return { ok: true };
}

/** Always resolves the same way, whatever the email (no enumeration). */
export async function mockResendVerificationEmail(
  email: string,
): Promise<MockAuthResult> {
  await waitForEmail(email);
  return { ok: true };
}

export async function mockCheckEmailVerified(
  email: string,
): Promise<MockAuthResult> {
  await delay(900);
  if (email.trim().toLowerCase() === mockAuthTriggers.unverifiedEmail) {
    return { ok: false, code: "generic" };
  }
  return { ok: true };
}

export { MIN_PASSWORD_LENGTH };

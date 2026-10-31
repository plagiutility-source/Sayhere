/**
 * MOCK ONLY, remove in Stage 4.
 *
 * The ONE dev-only helper behind the `?demo=` query parameter on the dashboard
 * routes. Stage 4 deletes this file and reads the real session/business instead.
 *
 *   normal            (default) — a café on Starter with ~12 weeks of scans and feedback
 *   empty                       — brand-new signup: zero scans, zero feedback
 *   loading                     — skeleton cards (matching each card's dimensions)
 *   error                       — analytics fail; each card/section offers inline Retry
 *   limit                       — scans used = plan limit (paused + banner + upgrade)
 *   long-name                   — very long business name + email (overflow/truncation)
 *   free | starter | pro        — the same café on that plan (1 location, that plan's limits)
 *   enterprise                  — Enterprise: unlimited limits and 2 locations
 *   over-limit                  — menu items above the plan limit after a downgrade (T4)
 *   cancel-pending              — cancellation requested, waiting for support (business-rules 5.1)
 *   cancel-finalized            — cancellation finalized: the plan ends on the cycle date
 *   past-due                    — failed renewal inside the grace period (business-rules 4)
 *   page_custom_hidden          — admin hid the custom page (editor banner)
 *   auto-reply-pending          — auto-reply request waiting for support (T7)
 *   auto-reply-contacted        — support has contacted the owner (T7)
 *   auto-reply-on               — auto-reply live for the business (T7)
 *   auto-reply-paused           — auto-reply live but scans are at the plan limit (T7)
 *   auto-reply-closed           — old request closed; a new one can be sent (T7)
 */

export const demoScenarios = [
  "normal",
  "empty",
  "loading",
  "error",
  "limit",
  "long-name",
  "free",
  "starter",
  "pro",
  "enterprise",
  "over-limit",
  "cancel-pending",
  "cancel-finalized",
  "past-due",
  "page_custom_hidden",
  "auto-reply-pending",
  "auto-reply-contacted",
  "auto-reply-on",
  "auto-reply-paused",
  "auto-reply-closed",
] as const;

export type DemoScenario = (typeof demoScenarios)[number];

/** Normalise an unknown `?demo=` value to a known scenario (default `normal`). */
export function resolveDemoScenario(
  value: string | string[] | undefined | null,
): DemoScenario {
  const raw = Array.isArray(value) ? value[0] : value;
  return (demoScenarios as readonly string[]).includes(raw ?? "")
    ? (raw as DemoScenario)
    : "normal";
}

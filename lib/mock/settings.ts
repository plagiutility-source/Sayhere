/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * The `/settings` view of the shared business profile (PRD.md 5.4.1/5.4.2):
 * it reads and writes `lib/mock/store.ts` (one localStorage profile), so a save
 * here is visible on the dashboard, the editor preview and the public page.
 * Nothing is uploaded and no API is called.
 *
 * `owner_email` is display-only and NOT part of the shared profile: the real
 * email lives on the Firebase user (schema.sql) and changing it is a Firebase
 * operation. It is kept per demo scenario so the mock keeps behaving the same.
 */

import type { BusinessType } from "@/lib/brand/tokens";
import { businessTypeLabels } from "@/lib/brand/tokens";
import { getDashboardMock } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import {
  defaultBusiness,
  getBusiness,
  saveBusiness,
  type BusinessProfile,
} from "@/lib/mock/store";

export type MockSettings = BusinessProfile & {
  /** Display-only (see the file header). */
  owner_email: string;
};

/** Fallback list when Intl.supportedValuesOf("timeZone") is unavailable. */
export const FALLBACK_TIME_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

/**
 * The time-zone dropdown options: `Intl.supportedValuesOf("timeZone")` when the
 * runtime has it, else the small fallback list (PRD.md 5.4.1).
 */
export function timeZoneOptions(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    try {
      const values = intl.supportedValuesOf("timeZone");
      if (Array.isArray(values) && values.length > 0) return values;
    } catch {
      // Older runtimes throw for unknown keys; use the fallback list.
    }
  }
  return [...FALLBACK_TIME_ZONES];
}

/** Per-scenario display email (never part of the shared profile). */
const emailStore = new Map<DemoScenario, string>();

/**
 * The static-mock settings (no localStorage read). Used as the first render on
 * the server and during hydration so it always matches, before the post-mount
 * read swaps in the stored profile (`useMockSettings`).
 */
export function staticMockSettings(scenario: DemoScenario): MockSettings {
  return {
    ...defaultBusiness(),
    owner_email: ownerEmailFor(scenario),
  };
}

function ownerEmailFor(scenario: DemoScenario): string {
  return (
    emailStore.get(scenario) ??
    getDashboardMock(scenario).business.owner_email
  );
}

/** The scenario's business profile (the one shared localStorage profile). */
export function getMockSettings(scenario: DemoScenario): MockSettings {
  return { ...getBusiness(), owner_email: ownerEmailFor(scenario) };
}

export type SaveSettingsResult = {
  settings: MockSettings;
  /** `false` when the profile changed only in memory (storage failed). */
  persisted: boolean;
};

/**
 * Save replaces the profile fields given (PRD.md 5.4.1: "Save changes") and
 * writes them through to the shared store. `owner_email` stays local to this
 * mock screen.
 */
export function saveMockSettings(
  scenario: DemoScenario,
  patch: Partial<MockSettings>,
): SaveSettingsResult {
  const { owner_email, ...profilePatch } = patch;
  if (owner_email !== undefined) emailStore.set(scenario, owner_email);

  const result =
    Object.keys(profilePatch).length > 0
      ? saveBusiness(profilePatch)
      : { ok: true, business: getBusiness() };

  return {
    settings: { ...result.business, owner_email: getMockSettings(scenario).owner_email },
    persisted: result.ok,
  };
}

/** Business type label for UI copy (the schema stores the key only). */
export function settingsTypeLabel(type: BusinessType): string {
  return businessTypeLabels[type];
}

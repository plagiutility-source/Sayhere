"use client";

/**
 * MOCK ONLY, removed in Stage 4 when the database is connected.
 *
 * The ONE way client components read the shared business profile
 * (`lib/mock/store.ts`). Starts from the static mock so the server render and
 * the first client render match, then reads localStorage after mount and
 * re-renders whenever the profile changes (this tab or another tab).
 */

import { useEffect, useMemo, useState } from "react";
import type { ColorSource } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import type { DemoScenario } from "@/lib/mock/demo";
import {
  locationsForBusiness,
  type MockLocation,
} from "@/lib/mock/locations";
import {
  getMockSettings,
  staticMockSettings,
  type MockSettings,
} from "@/lib/mock/settings";
import {
  defaultBusiness,
  getBusiness,
  getStoredPageData,
  hasStoredBusiness,
  subscribeBusiness,
  subscribePageData,
  type BusinessProfile,
  type StoredPageData,
} from "@/lib/mock/store";

/** The fields the shared profile can override on any screen's static base. */
type BusinessLike = {
  name: string;
  business_type: BusinessType;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  color_source: ColorSource;
};

/** The shared profile; always usable (static mock until the post-mount read). */
export function useBusiness(): BusinessProfile {
  const [business, setBusiness] = useState<BusinessProfile>(() =>
    defaultBusiness(),
  );

  useEffect(() => {
    const sync = () => setBusiness(getBusiness());
    sync();
    return subscribeBusiness(sync);
  }, []);

  return business;
}

/**
 * The `/settings` view of the shared profile: static mock for the server render
 * and hydration, then the stored profile after mount (no hydration mismatch).
 */
export function useMockSettings(
  scenario: DemoScenario,
  revision = 0,
): MockSettings {
  const [settings, setSettings] = useState<MockSettings>(() =>
    staticMockSettings(scenario),
  );

  useEffect(() => {
    const sync = () => setSettings(getMockSettings(scenario));
    sync();
    return subscribeBusiness(sync);
  }, [scenario, revision]);

  return settings;
}

/**
 * The customer-page content the editor saved for one slug (MOCK ONLY). `null`
 * on the server and during hydration; the saved record is read after mount so
 * the public page first shows the static mock, then re-renders with the saved
 * page — the same pattern as the business profile.
 */
export function useStoredPageData(slug: string | null): StoredPageData | null {
  const [data, setData] = useState<StoredPageData | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      return;
    }
    const sync = () => setData(getStoredPageData(slug));
    sync();
    return subscribePageData(sync);
  }, [slug]);

  return data;
}

/**
 * A screen's static base business with the stored profile applied on top.
 * `live = false` keeps a base that deliberately differs (the `long-name` demo
 * scenario), so the shared profile never breaks a scenario's purpose; the base
 * is merged over the DEFAULT profile so the screen still has a full business
 * shape (slug, review link, time zone) without the stored values.
 */
export function useMockBusiness<T extends BusinessLike>(
  base: T,
  live = true,
): T & BusinessProfile {
  const stored = useBusiness();
  return useMemo(
    () =>
      (live
        ? { ...base, ...stored }
        : { ...defaultBusiness(), ...base }) as T & BusinessProfile,
    [base, stored, live],
  );
}

/**
 * The current business's locations, derived from the shared profile so a gym
 * never shows the café's name, slug or link (MOCK ONLY, removed in Stage 4).
 *
 * - The static café demo (no saved profile) keeps its original sample numbers;
 *   a saved profile is a new business, so its counters start at 0.
 * - `revision` re-reads after a mock mutation (add location / regenerate link).
 * - `live = false` keeps a scenario's deliberate base (the `long-name` demo).
 */
export function useMockLocations(
  scenario: DemoScenario,
  revision = 0,
  live = true,
): MockLocation[] {
  const business = useBusiness();
  const [stored, setStored] = useState(false);

  useEffect(() => {
    const sync = () => setStored(hasStoredBusiness());
    sync();
    return subscribeBusiness(sync);
  }, []);

  return useMemo(() => {
    const owner = live ? business : defaultBusiness();
    return locationsForBusiness(owner, scenario, !live || !stored);
  }, [business, scenario, stored, live, revision]);
}

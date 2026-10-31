"use client";

/**
 * MOCK ONLY, removed in Stage 4 when the database is connected.
 *
 * The ONE way client components read the loyalty state. Returns `null` until
 * the browser has mounted, so the server render and the first client render
 * match (no hydration warning); the stored state arrives right after mount and
 * updates whenever it changes in this tab or another tab.
 */

import { useCallback, useEffect, useState } from "react";
import type { LoyaltyState } from "@/lib/loyalty/rules";
import {
  ensureDemoStaff,
  getLoyaltyState,
  getSessionMemberId,
  subscribeLoyalty,
} from "@/lib/mock/loyalty-store";

export function useLoyaltyState(
  options: { seedDemoStaff?: boolean } = {},
): LoyaltyState | null {
  const { seedDemoStaff = false } = options;
  const [state, setState] = useState<LoyaltyState | null>(null);

  useEffect(() => {
    const sync = () => setState(getLoyaltyState());
    sync();
    // MOCK ONLY: the dashboard adds one demo staff member (PIN 1234).
    if (seedDemoStaff) void ensureDemoStaff();
    return subscribeLoyalty(sync);
  }, [seedDemoStaff]);

  return state;
}

/** The customer's signed-in card on this device (null = not signed in). */
export function useLoyaltySession(): [string | null, boolean] {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setMemberId(getSessionMemberId());
      setReady(true);
    };
    sync();
    return subscribeLoyalty(sync);
  }, []);

  return [memberId, ready];
}

/** A clock that ticks, for countdowns and expiry. Starts null (SSR-safe). */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  const tick = useCallback(() => setNow(new Date()), []);

  useEffect(() => {
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [tick, intervalMs]);

  return now;
}

"use client";

/**
 * Mounts the rooms feature's live layer on every dashboard route, but only for
 * the business types that get table/room ordering (cafe, restaurant, hotel).
 *
 * Other types render their children exactly as before: no provider, no polling,
 * no alerts, no title changes. The gate is the same `supportsTableOrdering`
 * helper the sidebar uses, so the nav and the live layer can never disagree.
 *
 * Merge-time addition: the provider is seeded from the SaaS's own locations
 * (`initialRoomsState`), so a new business starts with no spots and no orders
 * and a stored blob from the standalone demo is never adopted.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { resolveDemoScenario } from "@/lib/mock/demo";
import { initialStateFromSpots, useRoomsBusiness, useRoomsLocations } from "@/lib/rooms/adapter";
import { activeServiceCalls, countNewOrders } from "@/lib/rooms/rules";
import { LiveAlerts } from "./LiveAlert";
import { OwnerProvider, useOwner } from "./OwnerProvider";
import { SpotDialogs } from "./modals/SpotDialogs";

/**
 * `(N) Live table request · Syehere` while requests are waiting (spec 9.7).
 * When nothing is waiting the app's own page title is left untouched.
 */
function LiveDocumentTitle() {
  const { state } = useOwner();
  const requests = countNewOrders(state) + activeServiceCalls(state).length;

  useEffect(() => {
    if (!requests) return;
    const previous = document.title;
    document.title = `(${requests}) Live table request \u00b7 Syehere`;
    return () => {
      document.title = previous;
    };
  }, [requests]);

  return null;
}

export function DashboardLive({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const scenario = resolveDemoScenario(searchParams.get("demo"));
  // null for every type that does not get table/room ordering.
  const business = useRoomsBusiness();
  const spots = useRoomsLocations(scenario);
  const initialState = useMemo(
    () => (business ? initialStateFromSpots(spots, business.type) : null),
    [business, spots],
  );

  if (!business) return <>{children}</>;

  return (
    <OwnerProvider initialState={initialState ?? undefined}>
      {children}
      <SpotDialogs />
      <LiveAlerts />
      <LiveDocumentTitle />
    </OwnerProvider>
  );
}

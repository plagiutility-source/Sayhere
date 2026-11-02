"use client";

/**
 * Mounts the rooms feature's live layer on every dashboard route, but only for
 * the business types that get table/room ordering (cafe, restaurant, hotel).
 *
 * Other types render their children exactly as before: no provider, no polling,
 * no alerts, no title changes. The gate is the same `supportsTableOrdering`
 * helper the sidebar uses, so the nav and the live layer can never disagree.
 */

import { useEffect, type ReactNode } from "react";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { activeServiceCalls, countNewOrders } from "@/lib/rooms/rules";
import { useBusiness } from "@/lib/use-business";
import { LiveAlerts } from "./LiveAlert";
import { OwnerProvider, useOwner } from "./OwnerProvider";

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
  const business = useBusiness();
  if (!supportsTableOrdering(business.business_type)) return <>{children}</>;

  return (
    <OwnerProvider>
      {children}
      <LiveAlerts />
      <LiveDocumentTitle />
    </OwnerProvider>
  );
}

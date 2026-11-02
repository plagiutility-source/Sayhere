"use client";

/**
 * Route gate for the ordering-only pages. The business type lives in the mock
 * profile (client storage), so the check has to run on the client; a salon or
 * gym hitting `/orders` or `/rooms` directly gets the app's normal 404.
 */

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { useBusiness } from "@/lib/use-business";

export function OrderingGate({ children }: { children: ReactNode }) {
  const business = useBusiness();
  if (!supportsTableOrdering(business.business_type)) notFound();
  return <>{children}</>;
}

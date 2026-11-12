/**
 * MOCK ONLY, removed in Stage 4 (the real session/business query replaces it).
 *
 * Server-side read of the saved business profile. The record itself lives in
 * the browser (`lib/mock/store.ts`), so the server reads the compact cookie
 * mirror `saveBusiness` keeps in step with it. Returns `null` when this browser
 * has no saved profile, which keeps the static demo exactly as it was.
 */

import { cookies } from "next/headers";
import { BUSINESS_COOKIE_NAME, parseBusinessCookie, type BusinessProfile } from "@/lib/mock/store";

/** The saved profile for this request, or `null` for the static demo. */
export async function getServerBusiness(): Promise<BusinessProfile | null> {
  const store = await cookies();
  return parseBusinessCookie(store.get(BUSINESS_COOKIE_NAME)?.value);
}

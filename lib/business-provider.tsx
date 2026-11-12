"use client";

/**
 * MOCK ONLY, removed in Stage 4.
 *
 * Supplies the shared business profile to the whole route so the SERVER render
 * and the first client render already agree on it.
 *
 * `initial` comes from the cookie mirror (`lib/mock/server-business.ts`), which
 * `saveBusiness` writes next to the localStorage record. Before this, the
 * server could only render the static café/type demo and the owner's own name
 * appeared after mount — a visible flash of "Brew and Bean" (or the type demo's
 * name) on the dashboard, the customer page and every QR target.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  defaultBusiness,
  getBusiness,
  hasStoredBusiness,
  subscribeBusiness,
  syncBusinessCookie,
  type BusinessProfile,
} from "@/lib/mock/store";

const BusinessContext = createContext<BusinessProfile | null>(null);

export function BusinessProvider({
  initial,
  children,
}: {
  /** The profile the server read from the cookie; `null` = static demo. */
  initial: BusinessProfile | null;
  children: ReactNode;
}) {
  const [business, setBusiness] = useState<BusinessProfile>(
    () => initial ?? defaultBusiness(),
  );

  useEffect(() => {
    const sync = () => {
      const stored = getBusiness();
      setBusiness(stored);
      // Profiles saved before the cookie mirror existed get one on first load,
      // so the NEXT server render is correct too.
      syncBusinessCookie(hasStoredBusiness() ? stored : null);
    };
    sync();
    return subscribeBusiness(sync);
  }, []);

  return (
    <BusinessContext.Provider value={business}>
      {children}
    </BusinessContext.Provider>
  );
}

/** The provided profile, or `null` outside a provider. */
export function useProvidedBusiness(): BusinessProfile | null {
  return useContext(BusinessContext);
}

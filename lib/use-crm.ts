"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrmConfig } from "@/lib/crm/config";
import type { CrmState } from "@/lib/crm/rules";
import {
  loadCrmState,
  resetCrmDemo,
  saveCrmState,
  subscribeCrm,
} from "@/lib/mock/crm-store";

/**
 * Loads the mock CRM after mount (never during SSR, so hydration is safe) and
 * keeps every mounted CRM view in sync.
 */
export function useCrm(fallbackConfig: CrmConfig | null) {
  const [state, setState] = useState<CrmState | null>(null);
  // A stable key lets the preset change reseed/attach without an effect loop.
  // Null means the business type is not known yet: do not seed a store, or the
  // first render's fallback preset would be persisted before hydration.
  const configKey = fallbackConfig ? JSON.stringify(fallbackConfig) : "";

  useEffect(() => {
    if (!fallbackConfig) return;
    const sync = () => setState(loadCrmState(fallbackConfig));
    sync();
    return subscribeCrm(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const update = useCallback(
    (mutate: (current: CrmState) => CrmState) => {
      if (!fallbackConfig) return;
      const next = mutate(loadCrmState(fallbackConfig));
      saveCrmState(next);
      setState(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configKey],
  );

  const reset = useCallback(() => {
    if (!fallbackConfig) return;
    setState(resetCrmDemo(fallbackConfig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  return { state, update, reset };
}

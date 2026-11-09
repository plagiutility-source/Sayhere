"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { seedCrmDemoBusiness } from "@/lib/mock/crm-demo";
import { CrmLoading } from "./CrmGate";

/**
 * Public preview entry point for the CRM. A fresh browser has no saved
 * business profile, so `/crm` correctly fails closed. This route creates the
 * salon demo once, then sends the visitor to the Growth-scenario CRM.
 *
 * It is deliberately not linked from the product UI: it is only for sharing
 * the mock demo with someone who has not been through onboarding.
 */
export function CrmDemoBootstrap() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    seedCrmDemoBusiness();
    router.replace("/crm?demo=growth");
  }, [router]);

  return <CrmLoading />;
}

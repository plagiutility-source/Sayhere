"use client";

/**
 * Route gate for the ordering-only pages. The business type lives in the mock
 * profile (client storage), so the check has to run on the client; a salon or
 * gym hitting `/orders` or `/rooms` directly gets the app's normal 404.
 */

import type { ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { useBusiness } from "@/lib/use-business";
import { useOwnerOptional } from "./OwnerProvider";

/**
 * The gate runs on the client because the mock business type lives in
 * localStorage, so a real server-side 404 is not possible. Calling
 * `notFound()` here would hit the route error boundary instead of Next's
 * not-found boundary, so render the branded 404 directly. The live provider
 * is also checked so a type change (café -> salon) cannot leave a child
 * calling `useOwner` after its provider has unmounted.
 */
function OrderingNotFound() {
  return (
    <div className="mx-auto max-w-xl py-3xl text-center">
      <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-brand-green">
        404
      </p>
      <h1 className="mt-md font-display text-[28px] font-medium leading-tight sm:text-[34px]">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-lg text-[15px] leading-relaxed text-ink-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-2xl flex flex-wrap justify-center gap-md">
        <ButtonLink href="/dashboard" size="lg">
          Back to dashboard
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}

export function OrderingGate({ children }: { children: ReactNode }) {
  const business = useBusiness();
  const owner = useOwnerOptional();
  if (!owner || !supportsTableOrdering(business.business_type)) {
    return <OrderingNotFound />;
  }
  return <>{children}</>;
}

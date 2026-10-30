"use client";

import Link from "next/link";
import { useOwner } from "../OwnerProvider";

/**
 * DEV-ONLY: the concept demo bar. Deleted at merge (spec section 2).
 */
export function DemoBar() {
  const { businessType, setBusinessType, resetDemo, toast } = useOwner();

  return (
    <div className="mb-[22px] flex items-center gap-2.5 rounded-[10px] border border-brand-yellow/50 bg-amber-50 px-3 py-[9px] text-xs text-amber-900 max-[640px]:flex-wrap max-[640px]:items-start">
      <span className="whitespace-nowrap rounded-pill bg-brand-yellow px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-yellow-900">
        Concept demo
      </span>
      <label className="flex items-center gap-1.5">
        <span>Outlet</span>
        <select
          className="h-6 rounded-[6px] border border-yellow-900/20 bg-white px-1 text-[11.5px]"
          aria-label="Outlet category"
          value={businessType === "hotel" ? "hotel" : "cafe"}
          onChange={(event) => {
            const next = event.target.value === "hotel" ? "hotel" : "cafe";
            setBusinessType(next);
            toast(
              next === "hotel"
                ? "Hotel mode — every screen now says Rooms."
                : "Café / restaurant mode — every screen now says Tables.",
            );
          }}
        >
          <option value="cafe">Café / restaurant · Tables</option>
          <option value="hotel">Hotel · Rooms</option>
        </select>
      </label>
      <span className="max-[640px]:leading-[1.5]">
        QR ordering + live orders · mock data only · nothing here touches your repo
      </span>
      <Link
        href="/r/cafe01/qr4"
        className="ml-auto whitespace-nowrap font-medium underline max-[640px]:ml-0"
      >
        Try join approval
      </Link>
      <button
        type="button"
        className="whitespace-nowrap rounded-[7px] border border-yellow-900/20 bg-white px-[9px] py-[5px] text-[11.5px] hover:bg-amber-100 max-[640px]:ml-0"
        onClick={resetDemo}
      >
        Reset demo
      </button>
    </div>
  );
}

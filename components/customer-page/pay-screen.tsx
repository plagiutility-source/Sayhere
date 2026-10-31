"use client";

/**
 * The Pay screen (owner decision — the authoritative Pay button spec).
 *
 * Shows "You're paying", the payee name and the UPI ID (both always visible so
 * a customer can verify them — anti-scam), ONE big "Pay now" button and a
 * small, quiet "Copy UPI ID" fallback with a "Copied" status for desktop and
 * in-app browsers. No app list, no amount, no payment status: the phone decides
 * what opens, and Syehere never handles money.
 *
 * The `upi://pay` link is built ONLY from the validated UPI ID and payee name
 * (`payLink`, security 4C); the owner never types a link and no other `upi:`
 * URL is ever allowed.
 */

import { useState } from "react";
import type { BrandTheme } from "@/lib/brand/theme";
import type { PageConfig } from "@/lib/mock/customer-page";
import { payLink } from "@/lib/validation/page-config";
import { BackButton } from "./back-button";
import { CopyIcon } from "./icons";

export function PayScreen({
  pay,
  theme,
  onBack,
}: {
  pay: PageConfig["buttons"]["pay"];
  theme: BrandTheme;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const upiId = pay.upi_id.trim();
  const name = pay.name.trim();
  const link = payLink(upiId, name);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const area = document.createElement("textarea");
        area.value = upiId;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Leave the ID visible; the customer can still read and type it.
    }
  }

  return (
    <div>
      <BackButton
        label="Pay"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />

      <div className="mt-2xl text-center">
        <p className="text-[15px] text-ink-muted">You&apos;re paying</p>
        <p className="mt-1 text-[22px] font-medium">{name}</p>
        <p className="mt-1 text-[15px] tabular-nums text-ink-muted">{upiId}</p>
      </div>

      {/* A plain link: the phone decides which app opens. No target/blank. */}
      <a
        href={link}
        className="mt-xl inline-flex min-h-[56px] w-full items-center justify-center rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Pay now
      </a>

      <div className="mt-lg flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-[44px] items-center gap-xs px-3 text-[13px] text-ink-muted underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <CopyIcon size={14} />
          Copy UPI ID
        </button>
        <span
          role="status"
          aria-live="polite"
          className="text-[12px] text-ink-muted"
        >
          {copied ? "Copied" : ""}
        </span>
      </div>

      <p className="mt-xl text-center text-[13px] text-ink-muted">
        Check the name before you pay.
      </p>
    </div>
  );
}

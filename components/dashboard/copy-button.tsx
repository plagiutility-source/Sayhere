"use client";

/**
 * Copy-to-clipboard button with a visible "Copied" status message.
 * Clipboard API first, `execCommand` fallback (same approach as the customer
 * review screen). No library.
 */

import { useState } from "react";

async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback.
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

type CopyButtonProps = {
  value: string;
  /** Accessible name, e.g. "Copy short link". Visible label stays "Copy". */
  label: string;
};

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        Copy
      </button>
      <span role="status" aria-live="polite" className="text-[12px] text-ink-muted">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}

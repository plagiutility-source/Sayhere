"use client";

/**
 * One row in the customer-page editor (customer-page-ui-spec.md 2.3):
 * automatic icon, name, an optional amber status badge ("Needs a link" when On
 * but empty; "Check link" when invalid), the Activate control and the
 * expanding field(s) with a one-line helper text shown only while On.
 *
 * Turning an item off hides its fields and KEEPS the saved value (rule 17).
 */

import type { ReactNode } from "react";
import { ActivateButton } from "./activate-button";

export type ItemBadge = "needs" | "check" | null;

export function EditorItemRow({
  id,
  icon,
  name,
  badge,
  on,
  onToggle,
  control,
  disabled = false,
  alwaysShowFields = false,
  helper,
  children,
  highlight = false,
}: {
  id: string;
  icon: ReactNode;
  name: string;
  badge: ItemBadge;
  on: boolean;
  onToggle: (next: boolean) => void;
  /** Replace the right-hand control (defaults to the Activate control). */
  control?: ReactNode;
  /**
   * Disable the Activate control until its value is known (post-mount store
   * reads, e.g. the Loyalty card switch).
   */
  disabled?: boolean;
  /** For rows without an on/off flag (the thank-you message). */
  alwaysShowFields?: boolean;
  helper?: string;
  children?: ReactNode;
  highlight?: boolean;
}) {
  const showFields = alwaysShowFields || on;

  return (
    <li
      id={id}
      className={`scroll-mt-24 rounded-card border bg-white p-4 shadow-soft transition-colors ${
        highlight ? "border-brand-yellow bg-amber-50" : "border-black/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-[13px] text-ink">
          <span className="shrink-0 text-ink-muted">{icon}</span>
          <span className="truncate">{name}</span>
          {badge ? (
            <span className="inline-flex shrink-0 items-center rounded-pill bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              {badge === "needs" ? "Needs a link" : "Check link"}
            </span>
          ) : null}
        </span>
        {control ?? (
          <ActivateButton
            on={on}
            onToggle={onToggle}
            name={name}
            disabled={disabled}
          />
        )}
      </div>

      {showFields && children ? (
        <div className="mt-3">
          {children}
          {helper ? (
            <p className="mt-2 text-[12px] text-ink-muted">{helper}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

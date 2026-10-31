"use client";

/**
 * The ONE Activate / Active control (PRD.md 5.5.3, ui-spec 2.2).
 *
 * Off: white fill, 1.5 px border in the primary text token, label "Activate".
 * On:  solid #1D4ED8 fill, white text + tick, label "Active".
 * Min height 36 px, 8 px radius, 13 px medium label, `aria-pressed`, and the
 * state is never shown by colour alone (label and tick change too).
 *
 * Used by every on/off choice in the editor and by "Mark sold out".
 */

import { CheckIcon } from "./icons";

type ActivateButtonProps = {
  on: boolean;
  onToggle: (next: boolean) => void;
  /** The item name, so the accessible name says what is being toggled. */
  name: string;
  disabled?: boolean;
};

export function ActivateButton({
  on,
  onToggle,
  name,
  disabled = false,
}: ActivateButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!on)}
      aria-pressed={on}
      aria-label={`${name}: ${on ? "Active" : "Activate"}`}
      disabled={disabled}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        on
          ? "bg-[#1D4ED8] text-white hover:bg-brand-navy"
          : "border-[1.5px] border-ink bg-white text-ink hover:bg-surface-muted"
      }`}
    >
      {on ? <CheckIcon size={14} /> : null}
      {on ? "Active" : "Activate"}
    </button>
  );
}

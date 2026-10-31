"use client";

import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  children: ReactNode;
};

/** Dropdown with a real label, hint and inline error, wired for a11y. */
export function Select({
  label,
  hint,
  error,
  id,
  className = "",
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={selectId} className="block text-[13px] font-medium">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-sm h-10 w-full rounded-control border bg-white px-md text-[14px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
          error ? "border-red-700" : "border-black/20"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={hintId} className="mt-xs text-[12px] text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-xs text-[12px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

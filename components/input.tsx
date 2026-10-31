"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
};

/** Text input with a real label, hint and inline error, wired for a11y. */
export function Input({ label, hint, error, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-[13px] font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-sm h-10 w-full rounded-control border px-md text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue ${
          error ? "border-red-700" : "border-black/20"
        } ${className}`}
        {...props}
      />
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

"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
};

/**
 * Password input with a real label, hint, inline error and a show/hide toggle.
 * Mirrors `components/input.tsx` so the two sit together without looking
 * different. The toggle reports its state with `aria-pressed` and its label
 * names the action, not the state.
 */
export function PasswordInput({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
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
      <div className="relative mt-sm">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-10 w-full rounded-control border py-0 pl-md pr-[68px] text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue ${
            error ? "border-red-700" : "border-black/20"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-xs top-1/2 -translate-y-1/2 rounded-control px-sm py-xs text-[12px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
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

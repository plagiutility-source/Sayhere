"use client";

/**
 * Small shared pieces for the Loyalty dashboard tabs. Same look as the other
 * dashboard screens: Syehere product palette, weights 400/500 only.
 */

import type { ReactNode } from "react";

export const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex h-9 items-center justify-center gap-2 rounded-control border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50";
export const inputCls =
  "h-10 w-full rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
      {title || action ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-[15px] font-medium text-ink">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[13px] text-ink-muted">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title || action ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-[12px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Notice({
  kind,
  children,
}: {
  kind: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tone =
    kind === "success"
      ? "border-brand-green/30 bg-brand-green/10 text-brand-green-deep"
      : kind === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-black/10 bg-surface-muted text-ink-muted";
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-control border px-3 py-2 text-[13px] ${tone}`}
    >
      {children}
    </p>
  );
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

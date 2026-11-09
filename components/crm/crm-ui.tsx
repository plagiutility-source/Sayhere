import type { ReactNode } from "react";
import type { CrmStageKind } from "@/lib/crm/config";
import type { CrmServiceStatus } from "@/lib/crm/rules";
import { contactInitials, paymentStatusLabel } from "./crm-utils";

const AVATAR_TONES = [
  "bg-[#E8F0FE] text-[#1D4ED8]",
  "bg-[#E6F4F2] text-[#0F766E]",
  "bg-[#FEF3C7] text-[#92400E]",
  "bg-[#FCE7F3] text-[#9D174D]",
  "bg-[#EDE9FE] text-[#5B21B6]",
  "bg-[#E0F2FE] text-[#0369A1]",
];

function toneFor(name: string): string {
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return AVATAR_TONES[total % AVATAR_TONES.length];
}

export function CrmAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizes = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-[10px]",
    md: "h-9 w-9 text-[11px]",
    lg: "h-14 w-14 text-[17px]",
  };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${sizes[size]} ${toneFor(name)}`}
    >
      {contactInitials(name)}
    </span>
  );
}

export function StageBadge({
  name,
  kind,
}: {
  name: string;
  kind: CrmStageKind;
}) {
  const dot =
    kind === "won"
      ? "bg-brand-green"
      : kind === "lost"
        ? "bg-red-500"
        : "bg-brand-blue";
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-[4px] border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-ink">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function PaymentBadge({ status }: { status: CrmServiceStatus }) {
  const tones =
    status === "paid"
      ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
      : status === "partial"
        ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
        : "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${tones}`}
    >
      {paymentStatusLabel(status)}
    </span>
  );
}

export function CrmMetric({
  label,
  value,
  hint,
  valueClassName = "text-ink",
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 bg-white px-4 py-3 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 truncate text-[19px] font-medium leading-tight tabular-nums ${valueClassName}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-[10px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function CrmTabs<T extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: readonly { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto"
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`relative flex h-10 shrink-0 items-center gap-2 px-3 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              selected
                ? "font-medium text-brand-blue"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  selected
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {item.count}
              </span>
            ) : null}
            {selected ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-blue"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function CrmEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-[20px] text-ink-muted"
      >
        ＋
      </span>
      <p className="mt-3 text-[13px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-muted">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

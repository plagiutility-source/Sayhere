import type { ReactNode } from "react";

/** Tiny class-name joiner (the scaffold has no `clsx`). */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* Buttons — the demo's `.btn`, `.btn-primary`, `.btn-outline`, `.btn-sm`, `.btn-xs`. */
export const btn =
  "inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-control text-[13px] font-medium transition-colors";
export const btnPrimary = cx(btn, "h-10 bg-brand-blue px-3.5 text-white hover:bg-brand-navy");
export const btnOutline = cx(btn, "h-10 border border-ink/15 bg-white px-3.5 text-ink hover:bg-surface-muted");
export const btnSm = "h-8 px-2.5 text-xs";
export const btnXs = "h-[29px] rounded-[7px] px-2 text-[11.5px]";

/* Badges — `.badge`, `.badge-green`, `.badge-amber`, `.badge-blue`, `.badge-new`. */
const badgeBase =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-[7px] py-0.5 text-[10.5px] font-medium tracking-[0.02em]";
const badgeTones = {
  neutral: "bg-slate-100 text-slate-600",
  green: "bg-brand-green/10 text-brand-green-deep",
  amber: "bg-brand-yellow/20 text-yellow-800",
  blue: "bg-brand-blue/10 text-brand-blue",
  new: "bg-brand-yellow text-[9px] uppercase tracking-[0.05em] text-yellow-900",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cx(badgeBase, badgeTones[tone], className)}>{children}</span>;
}

/** The demo's `.code-pill` — permanent QR codes such as `QR1`. */
export function CodePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[5px] border border-black/10 bg-white px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.02em] text-slate-700">
      {children}
    </span>
  );
}

/** The demo's `.switch`; the hidden checkbox is still keyboard reachable. */
export function Switch({
  checked,
  onChange,
  label,
  title,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  title?: string;
}) {
  return (
    <label className="relative inline-block h-[22px] w-[38px] shrink-0" title={title}>
      <input
        type="checkbox"
        className="peer absolute h-0 w-0 opacity-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <span className="absolute inset-0 cursor-pointer rounded-pill bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-brand-blue peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue" />
    </label>
  );
}

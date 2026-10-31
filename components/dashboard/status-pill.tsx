export type FeedbackStatus = "positive" | "needs_reply" | "negative";

const STYLES: Record<FeedbackStatus, { label: string; className: string }> = {
  positive: {
    label: "Positive",
    className: "bg-brand-green/10 text-brand-green-deep",
  },
  needs_reply: {
    label: "Needs reply",
    className: "bg-amber-100 text-amber-800",
  },
  // A replied negative: the docs define no separate "Replied" status, so it
  // keeps the plain negative label rather than inventing one.
  negative: {
    label: "Negative",
    className: "bg-surface-muted text-ink-muted",
  },
};

/**
 * Feedback status pill. Status is never shown by color alone: the text label
 * is always present (PRD.md 5.2). Fixed width so pills align in a column.
 */
export function StatusPill({ status }: { status: FeedbackStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex w-[92px] shrink-0 items-center justify-center rounded-pill px-2 py-1 text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  /** Optional control aligned to the right of the title (e.g. a range switch). */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Soft, bordered surface used for grouped content. */
export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: CardProps) {
  const hasHeader = Boolean(title || description || action);
  return (
    <div
      className={`rounded-card border border-black/10 bg-white p-lg shadow-soft ${className}`}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="text-[15px] font-medium">{title}</h3> : null}
            {description ? (
              <p className="mt-sm text-[13px] text-ink-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children ? (
        <div className={hasHeader ? "mt-lg" : ""}>{children}</div>
      ) : null}
    </div>
  );
}

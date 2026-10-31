import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

/** Soft, bordered surface used for grouped content. */
export function Card({ title, description, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-card border border-black/10 bg-white p-lg shadow-soft ${className}`}
    >
      {title ? <h3 className="text-[15px] font-medium">{title}</h3> : null}
      {description ? (
        <p className="mt-sm text-[13px] text-ink-muted">{description}</p>
      ) : null}
      {children ? (
        <div className={title || description ? "mt-lg" : ""}>{children}</div>
      ) : null}
    </div>
  );
}

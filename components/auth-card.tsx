import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Shared white card used by every screen in the `(auth)` layout. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="rounded-card border border-black/10 bg-white p-2xl shadow-soft">
      <h1 className="font-display text-[24px] font-medium">{title}</h1>
      {description ? (
        <p className="mt-sm text-[14px] text-ink-muted">{description}</p>
      ) : null}
      <div className="mt-2xl">{children}</div>
    </div>
  );
}

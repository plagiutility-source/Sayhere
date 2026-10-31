import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** `default` = max-w-5xl, `wide` = max-w-6xl. */
  width?: "default" | "wide";
  className?: string;
};

/** Page section: consistent container width and vertical rhythm. */
export function Section({
  id,
  title,
  subtitle,
  children,
  width = "default",
  className = "",
}: SectionProps) {
  return (
    <section id={id} className={`px-lg py-3xl sm:px-xl ${className}`}>
      <div className={`mx-auto ${width === "wide" ? "max-w-6xl" : "max-w-5xl"}`}>
        {title ? (
          <header className="max-w-2xl">
            <h2 className="font-display text-[24px] font-medium sm:text-[28px]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-md text-[15px] text-ink-muted">{subtitle}</p>
            ) : null}
          </header>
        ) : null}
        <div className={title ? "mt-2xl" : ""}>{children}</div>
      </div>
    </section>
  );
}

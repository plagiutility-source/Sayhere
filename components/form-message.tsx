import type { ReactNode } from "react";

type FormMessageProps = {
  /** `error` is announced immediately; `info` is a polite status update. */
  variant?: "error" | "info";
  children: ReactNode;
  className?: string;
};

const variants = {
  error: "border-red-700/30 bg-red-50 text-red-800",
  info: "border-brand-blue/20 bg-brand-blue/5 text-ink",
} as const;

/** Form-level message linked to the form, not to a single field. */
export function FormMessage({
  variant = "error",
  children,
  className = "",
}: FormMessageProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-control border px-md py-sm text-[13px] ${variants[variant]} ${className}`}
    >
      {children}
    </p>
  );
}

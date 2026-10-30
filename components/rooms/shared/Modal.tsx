"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./ui";

/**
 * The demo's modal shell: centred card, Escape and overlay click close,
 * the first input focused and selected 30 ms after opening.
 */
export function Modal({
  wide,
  onClose,
  children,
}: {
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const input = panel.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    );
    const timer = window.setTimeout(() => {
      input?.focus();
      input?.select?.();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.28)]",
          wide ? "max-w-[470px]" : "max-w-[430px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

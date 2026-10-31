"use client";

/**
 * The shared "Discard changes?" navigation guard (PRD.md 5.4 and 5.5.2):
 * blocks tab close (beforeunload) and in-app same-origin link clicks while a
 * form has unsaved edits. Extracted from the settings plumbing in 1F T7 so the
 * Auto-reply request form uses exactly the same behaviour. Stage 4 can switch
 * this to router events once navigation is real.
 */

import { useEffect } from "react";

export const DISCARD_MESSAGE = "Discard changes?";

export function useDiscardGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/")) return;
      const current = `${window.location.pathname}${window.location.search}`;
      if (href === current) return; // clicking the tab that is already open
      if (!window.confirm(DISCARD_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [dirty]);
}

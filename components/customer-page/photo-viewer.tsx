"use client";

/**
 * Full-screen dish photo (AI_MENU_PHOTOS.md section 3). Opens when a customer
 * taps a menu thumbnail and covers the whole phone screen.
 *
 *  - "Fit" (default) shows the whole photo, nothing cropped, on black.
 *  - "Fill screen" covers the entire screen, cropping the edges a little.
 *  - Close button, Escape key, and focus handling are built in; the page
 *    behind does not scroll while the photo is open.
 *  - The photo is always labelled as AI-generated, so customers are not
 *    misled about the real dish.
 *
 * `fixed inset-0` covers the real page; inside the dashboard preview the
 * phone frame has a transform, which keeps this overlay inside the frame.
 */

import { useEffect, useRef, useState } from "react";
import { MenuPhoto } from "@/components/menu-photo";
import type { MenuImage } from "@/lib/mock/customer-page";
import { CloseIcon } from "./icons";

export function PhotoViewer({
  name,
  price,
  details,
  image,
  onClose,
}: {
  name: string;
  price: string;
  details: string;
  image: MenuImage;
  onClose: () => void;
}) {
  const [fill, setFill] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables =
        panelRef.current?.querySelectorAll<HTMLElement>("button") ?? [];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo of ${name}`}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      <div
        className={
          fill ? "absolute inset-0" : "relative min-h-0 flex-1"
        }
      >
        <MenuPhoto
          image={image}
          name={name}
          fit={fill ? "cover" : "contain"}
        />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-md">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon size={22} />
        </button>
        <button
          type="button"
          onClick={() => setFill((current) => !current)}
          aria-pressed={fill}
          className="inline-flex h-11 items-center rounded-pill bg-black/60 px-lg text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {fill ? "Fit" : "Fill screen"}
        </button>
      </div>

      <div
        className={`px-lg pb-lg pt-md ${
          fill ? "absolute inset-x-0 bottom-0 bg-black/65" : "flex-none bg-black"
        }`}
      >
        <div className="flex items-baseline justify-between gap-md">
          <p className="text-[17px] font-medium">{name}</p>
          {price ? (
            <p className="shrink-0 text-[15px] tabular-nums">{price}</p>
          ) : null}
        </div>
        {details ? (
          <p className="mt-xs text-[13px] text-white/80">{details}</p>
        ) : null}
        <p className="mt-sm text-[11px] text-white/80">
          AI-generated image, for illustration
        </p>
      </div>
    </div>
  );
}

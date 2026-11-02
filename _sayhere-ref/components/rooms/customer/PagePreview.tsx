"use client";

import { Icon } from "@/components/rooms/shared/icons";
import { DEMO_BUSINESS } from "@/lib/rooms/seed";
import type { RoomsPageConfig } from "@/lib/rooms/types";

/**
 * The demo's `renderCustomerHome(draft, { preview: true })` inside the editor
 * phone. Links and actions cannot leave the preview; they show the two demo
 * messages instead.
 */
export function PagePreview({
  config,
  onPreview,
}: {
  config: RoomsPageConfig;
  onPreview: (kind: "link" | "action") => void;
}) {
  const tiles = [
    config.menu.on
      ? { key: "menu", icon: "utensils" as const, label: config.menu.title.trim() || "Menu", kind: "action" as const }
      : null,
    config.hours.on
      ? { key: "hours", icon: "clock" as const, label: "Hours and contact", kind: "action" as const }
      : null,
    config.call.on
      ? { key: "call", icon: "phone" as const, label: "Call", kind: "link" as const }
      : null,
    config.directions.on && config.directions.value.trim()
      ? { key: "directions", icon: "map" as const, label: "Directions", kind: "link" as const }
      : null,
    config.custom.on && config.custom.label.trim()
      ? { key: "custom", icon: "link" as const, label: config.custom.label, kind: "link" as const }
      : null,
  ].filter(Boolean);

  return (
    <div className="px-4 pb-6 pt-5 text-center">
      {config.announcement.on && config.announcement.text.trim() ? (
        <div className="mb-4 rounded-control bg-[var(--cp-primary)] px-2.5 py-2 text-center text-[10px] leading-[1.45] text-white">
          {config.announcement.text.slice(0, 160)}
        </div>
      ) : null}
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--cp-secondary)] font-display text-lg font-medium tracking-[0.02em] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.initials}
      </div>
      <h1 className="mt-2 text-center font-display text-[20px] font-medium leading-[1.2] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.name}
      </h1>
      <p className="mt-[3px] text-center text-[11.5px] text-slate-600">{DEMO_BUSINESS.tagline}</p>

      <p className="mt-5 text-center text-[12px] font-medium text-slate-700">
        How was your experience?
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-[10px] border border-black/10 bg-white/70 p-2 text-left"
          onClick={() => onPreview("action")}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
            <Icon name="thumbUp" size={15} />
          </span>
          <span>
            <strong className="block text-[10.5px] font-medium">Great</strong>
            <span className="block text-[9.5px] leading-[1.4] text-ink-muted">
              Continue on Google or message the owner.
            </span>
          </span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-[10px] border border-black/10 bg-white/70 p-2 text-left"
          onClick={() => onPreview("action")}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
            <Icon name="thumbDown" size={15} />
          </span>
          <span>
            <strong className="block text-[10.5px] font-medium">Not great</strong>
            <span className="block text-[9.5px] leading-[1.4] text-ink-muted">
              Tell the owner privately — we read every message.
            </span>
          </span>
        </button>
      </div>

      {tiles.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tiles.map((tile) =>
            tile ? (
              <button
                key={tile.key}
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-[10px] border border-black/10 bg-white/70 px-2 py-2.5 text-center text-[10.5px] text-[var(--cp-primary)]"
                onClick={() => onPreview(tile.kind)}
              >
                <Icon name={tile.icon} size={18} />
                <span>{tile.label}</span>
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {config.socials.instagram || config.socials.website ? (
        <div className="mt-3 flex justify-center gap-2">
          {config.socials.instagram ? (
            <button
              type="button"
              aria-label="Instagram"
              className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/70 text-[var(--cp-primary)]"
              onClick={() => onPreview("link")}
            >
              <Icon name="instagram" size={14} />
            </button>
          ) : null}
          {config.socials.website ? (
            <button
              type="button"
              aria-label="Website"
              className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/70 text-[var(--cp-primary)]"
              onClick={() => onPreview("link")}
            >
              <Icon name="globe" size={14} />
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-center text-[8.5px] leading-[1.5] text-ink-muted">
        Powered by Syehere · live preview
      </p>
    </div>
  );
}

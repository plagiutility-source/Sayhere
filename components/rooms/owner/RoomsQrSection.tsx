"use client";

/**
 * The ordering-specific QR panel for the existing `/locations` page.
 *
 * It adds a "Tables/Rooms QR" section below the untouched locations list and
 * reuse the page's already-selected location — there is no second location
 * list here. Spots come from the rooms provider, keyed by the real location id,
 * and the 12-per-location cap is the feature's own `MAX_ROOMS_PER_LOCATION`
 * (enforced by `openAdd` and shown here before the button).
 */

import Link from "next/link";
import { useState } from "react";
import { QrArt } from "@/components/rooms/shared/QrArt";
import { copyText } from "@/components/rooms/shared/clipboard";
import type { MockLocation } from "@/lib/mock/locations";
import { MAX_ROOMS_PER_LOCATION } from "@/lib/rooms/constants";
import { displaySpotName, isTodayOrder, spotWord } from "@/lib/rooms/format";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import { toggleRoomActive } from "@/lib/rooms/rules";
import type { Room } from "@/lib/rooms/types";
import { useOwner } from "./OwnerProvider";

const OUTLINE_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-control border border-black/15 bg-white px-2.5 text-[12px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2";

const SMALL_BUTTON =
  "inline-flex h-8 flex-1 items-center justify-center rounded-control border border-black/15 bg-white px-1.5 text-[11px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";

export function RoomsQrSection({ location }: { location: MockLocation }) {
  const { state, save, toast, origin, openAdd, openQr, businessType } = useOwner();
  const [kind, setKind] = useState<"reception" | "rooms">("rooms");

  const spot = state.locations.find((item) => item.id === location.id) ?? null;
  const tables = spotWord(businessType, true);
  const table = spotWord(businessType, false);
  const rooms = spot?.rooms ?? [];
  const activeCount = rooms.filter((room) => room.active).length;
  const atCap = rooms.length >= MAX_ROOMS_PER_LOCATION;
  const receptionUrl = absoluteUrl(origin, spotPath(location.slug, "reception"));

  const tabClass = (selected: boolean) =>
    `inline-flex h-8 flex-1 items-center justify-center rounded-control px-3 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
      selected ? "bg-white text-ink shadow-soft" : "text-ink-muted hover:text-ink"
    }`;

  const toggle = (code: string) => {
    const result = toggleRoomActive(state, location.id, code);
    if (!result) return;
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    toast(result.message);
  };

  return (
    <section aria-labelledby="rooms-qr-heading" className="mt-6">
      <h2
        id="rooms-qr-heading"
        className="text-[13px] font-medium text-ink"
      >
        {tables} QR
      </h2>
      <p className="mt-1 max-w-[640px] text-[12px] text-ink-muted">
        Every {table.toLowerCase()} has its own permanent QR and shares this
        location&apos;s {tables.toLowerCase()} page. Orders arrive tagged with
        the exact {table.toLowerCase()}.
      </p>

      <div className="mt-4 overflow-hidden rounded-card border border-black/10 bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">
              {location.location_name}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-ink-muted">
              {rooms.length} of {MAX_ROOMS_PER_LOCATION} {table.toLowerCase()} QRs ·{" "}
              {activeCount} active
            </p>
          </div>
          <button
            type="button"
            disabled={atCap}
            onClick={() => openAdd(location.id)}
            title={
              atCap
                ? `Limit: ${MAX_ROOMS_PER_LOCATION} room QRs per location.`
                : undefined
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-control bg-brand-blue px-3 text-[12.5px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add {table.toLowerCase()} QR
          </button>
        </div>

        <div
          className="mx-4 mt-3 flex w-[calc(100%-32px)] gap-0.5 rounded-control bg-surface-muted p-[3px]"
          role="tablist"
          aria-label="QR type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={kind === "reception"}
            onClick={() => setKind("reception")}
            className={tabClass(kind === "reception")}
          >
            Reception QR
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === "rooms"}
            onClick={() => setKind("rooms")}
            className={tabClass(kind === "rooms")}
          >
            {tables} QR
          </button>
        </div>

        <div className="p-4">
          {kind === "reception" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="w-[120px] shrink-0 rounded-control border border-black/10 bg-white p-1.5">
                <QrArt url={receptionUrl} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-pill bg-brand-blue/10 px-2 py-0.5 text-[11px] font-medium text-brand-blue">
                  Existing page
                </span>
                <p className="mt-1.5 text-[12.5px] font-medium text-ink">
                  Reception QR
                </p>
                <p className="mt-1 break-all font-mono text-[10.5px] text-ink-muted">
                  /r/{location.slug}
                </p>
                <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-muted">
                  Kept exactly as it is today. {tables} QRs are separate and
                  never change this page.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Link
                    className={OUTLINE_BUTTON}
                    href={spotPath(location.slug, "reception")}
                  >
                    Preview
                  </Link>
                  <Link
                    className="inline-flex h-8 items-center justify-center rounded-control bg-brand-blue px-2.5 text-[12px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                    href={{ pathname: "/customer-page", query: { loc: location.id } }}
                  >
                    Edit page
                  </Link>
                </div>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-control border border-dashed border-black/15 bg-surface-muted/60 px-4 py-7 text-center text-[12px] text-ink-muted">
              <strong className="mb-1 block text-[13px] font-medium text-ink">
                No {table.toLowerCase()} QRs yet
              </strong>
              Add the first {table.toLowerCase()} QR. It will open the shared{" "}
              {tables.toLowerCase()} page for this location.
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => openAdd(location.id)}
                  className="inline-flex h-9 items-center rounded-control bg-brand-blue px-3 text-[12.5px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                >
                  Add {table.toLowerCase()} QR
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {rooms.map((room) => (
                <QrTile
                  key={room.code}
                  location={location}
                  room={room}
                  onToggle={() => toggle(room.code)}
                  onQr={() => openQr(location.id, room.code)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function QrTile({
  location,
  room,
  onToggle,
  onQr,
}: {
  location: MockLocation;
  room: Room;
  onToggle: () => void;
  onQr: () => void;
}) {
  const { state, toast, origin, businessType } = useOwner();
  const url = absoluteUrl(origin, spotPath(location.slug, room.code));
  const label = displaySpotName(businessType, room);
  const newCount = state.orders.filter(
    (order) =>
      order.locId === location.id &&
      order.code === room.code &&
      order.status === "new" &&
      isTodayOrder(order),
  ).length;

  return (
    <article
      className={`flex flex-col gap-2 rounded-control border border-black/10 p-3 ${
        room.active ? "bg-white" : "bg-surface-muted"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink">
            {label}
            {newCount > 0 ? (
              <span className="ml-1.5 inline-flex items-center rounded-pill bg-brand-yellow px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.05em] text-yellow-900">
                {newCount} new
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            <span className="rounded-pill border border-black/10 px-1.5 py-0.5 font-mono text-[10px]">
              {room.code.toUpperCase()}
            </span>
            {room.active ? "" : " · Paused"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={room.active}
          className={OUTLINE_BUTTON}
        >
          {room.active ? "Pause" : "Activate"}
        </button>
      </div>

      <div
        className={`grid place-items-center rounded-control border border-black/5 bg-white p-1.5 ${
          room.active ? "" : "opacity-40 grayscale"
        }`}
      >
        <QrArt url={url} />
      </div>

      <p className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] text-ink-muted">
        /r/{location.slug}/{room.code}
      </p>

      <div className="flex gap-1.5">
        <button type="button" className={SMALL_BUTTON} onClick={onQr}>
          QR
        </button>
        <button
          type="button"
          className={SMALL_BUTTON}
          onClick={() => void copyText(url, () => toast("Link copied."))}
        >
          Copy
        </button>
        <Link className={SMALL_BUTTON} href={spotPath(location.slug, room.code)}>
          Preview
        </Link>
      </div>
    </article>
  );
}

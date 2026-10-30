"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/rooms/shared/icons";
import { QrArt } from "@/components/rooms/shared/QrArt";
import { copyText } from "@/components/rooms/shared/clipboard";
import {
  Badge,
  CodePill,
  Switch,
  btnOutline,
  btnPrimary,
  btnSm,
  btnXs,
  cx,
} from "@/components/rooms/shared/ui";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import { displaySpotName, isTodayOrder, spotWord } from "@/lib/rooms/format";
import { toggleRoomActive } from "@/lib/rooms/rules";
import type { Room, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

export function LocationsPage() {
  const { state, toast, businessType } = useOwner();
  const params = useSearchParams();
  const kind = params.get("kind") === "reception" ? "reception" : "rooms";
  const locId = params.get("loc");
  const selected = state.locations.find((location) => location.id === locId) ?? state.locations[0];

  const tables = spotWord(businessType, true);
  const table = spotWord(businessType, false);

  if (!selected) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location to start creating {table.toLowerCase()} QRs.
      </div>
    );
  }

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">Locations</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            Every location keeps its reception QR and now has its own set of{" "}
            {table.toLowerCase()} QRs with live ordering.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cx(btnOutline, "gap-[7px]")}
            onClick={() => toast("Add location isn't part of this concept demo.")}
          >
            <Icon name="plus" size={15} /> Add location
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_430px]">
        <section aria-labelledby="locations-heading">
          <p id="locations-heading" className="mb-2.5 text-[13px] font-medium">
            Your locations
          </p>
          <div className="flex flex-col gap-3">
            {state.locations.map((location) => {
              const isSelected = location.id === selected.id;
              const activeRooms = location.rooms.filter((room) => room.active).length;
              return (
                <article
                  key={location.id}
                  className={cx(
                    "rounded-card border bg-white p-4 shadow-soft",
                    isSelected ? "border-brand-blue" : "border-black/10",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{location.name}</p>
                      <p className="mt-[3px] text-[12.5px] text-ink-muted">
                        syehere.co/{location.slug}
                      </p>
                      <div className="mt-[9px] flex flex-wrap items-center gap-2 text-[11.5px] text-ink-muted">
                        <Badge tone="green">Active</Badge>
                        <span>{location.scans} scans this cycle</span>
                        <span>·</span>
                        <span>
                          {location.rooms.length} {table.toLowerCase()} QR
                          {location.rooms.length === 1 ? "" : "s"} · {activeRooms} active
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-[7px]">
                      <Link
                        className={cx(btnOutline, btnSm)}
                        href={{
                          pathname: "/locations",
                          query: { loc: location.id, kind: "reception" },
                        }}
                      >
                        Reception QR
                      </Link>
                      <Link
                        className={cx(btnPrimary, btnSm)}
                        href={{
                          pathname: "/locations",
                          query: { loc: location.id, kind: "rooms" },
                        }}
                      >
                        {tables} QR · {location.rooms.length}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-brand-navy">
            <Icon name="sparkles" size={15} className="mt-px shrink-0" />
            <div>
              <span className="font-medium">How it fits together:</span> a {table.toLowerCase()} QR
              never gets its own content. It points at the location&apos;s shared {tables} page, so
              editing that page once updates every QR. Orders still arrive tagged with the exact{" "}
              {table.toLowerCase()}. The reception page is separate and untouched.
            </div>
          </div>
        </section>

        <aside className="min-[1100px]:sticky min-[1100px]:top-[88px]">
          <QrPanel location={selected} kind={kind} />
        </aside>
      </div>
    </>
  );
}

function QrPanel({
  location,
  kind,
}: {
  location: SpotLocation;
  kind: "reception" | "rooms";
}) {
  const { businessType } = useOwner();
  const tables = spotWord(businessType, true);
  const tabClass = (active: boolean) =>
    cx(
      "inline-flex h-8 flex-1 items-center justify-center rounded-control px-3 text-[12.5px] font-medium",
      active ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]" : "text-slate-600",
    );

  return (
    <div className="overflow-hidden rounded-card border border-black/10 bg-white shadow-soft">
      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div>
            <p className="text-[13px] font-medium">QR codes</p>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">{location.name}</p>
          </div>
          <Badge>syehere.co/{location.slug}</Badge>
        </div>
        <div
          className="mt-3 flex w-full gap-0.5 rounded-[10px] bg-slate-100 p-[3px]"
          role="tablist"
          aria-label="QR type"
        >
          <Link
            href={{ pathname: "/locations", query: { loc: location.id, kind: "reception" } }}
            role="tab"
            aria-selected={kind === "reception"}
            className={tabClass(kind === "reception")}
          >
            Reception QR
          </Link>
          <Link
            href={{ pathname: "/locations", query: { loc: location.id, kind: "rooms" } }}
            role="tab"
            aria-selected={kind === "rooms"}
            className={tabClass(kind === "rooms")}
          >
            {tables} QR
          </Link>
        </div>
      </div>
      <div className="px-4 pb-4 pt-3.5">
        {kind === "reception" ? (
          <ReceptionPanel location={location} />
        ) : (
          <RoomsPanel location={location} />
        )}
      </div>
    </div>
  );
}

function ReceptionPanel({ location }: { location: SpotLocation }) {
  const { businessType, origin } = useOwner();
  const tables = spotWord(businessType, true);
  const url = absoluteUrl(origin, spotPath(location.slug, "reception"));
  return (
    <>
      <div className="flex gap-3.5 rounded-[11px] border border-black/10 bg-white p-3">
        <div className="w-[108px] flex-[0_0_108px]">
          <QrArt url={url} />
        </div>
        <div className="flex min-w-0 flex-col gap-[7px]">
          <div className="flex flex-wrap gap-[5px]">
            <Badge tone="blue">Existing page</Badge>
            <Badge tone="green">Active</Badge>
          </div>
          <p className="text-[12.5px] font-medium">Reception QR</p>
          <p className="break-all font-mono text-[10px] text-ink-muted">/r/{location.slug}</p>
          <p className="text-[11.5px] text-ink-muted">
            Kept exactly as it is today. The {tables} pages are separate and cannot change this
            content.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Link className={cx(btnOutline, btnXs)} href={spotPath(location.slug, "reception")}>
              Preview
            </Link>
            <Link
              className={cx(btnPrimary, btnXs)}
              href={{ pathname: "/customer-page", query: { loc: location.id, kind: "reception" } }}
            >
              Edit page
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-black/5 pt-3 text-[11.5px] leading-[1.55] text-ink-muted">
        This QR is printed once and points at the permanent slug. {tables} QRs do not replace it or
        compete with it — they are an extra set for {tables.toLowerCase()}.
      </p>
    </>
  );
}

function RoomsPanel({ location }: { location: SpotLocation }) {
  const { businessType, openAdd } = useOwner();
  const tables = spotWord(businessType, true);
  const table = spotWord(businessType, false);
  const rooms = location.rooms;
  const active = rooms.filter((room) => room.active).length;

  return (
    <>
      <div className="flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-brand-navy">
        <Icon name="sparkles" size={15} className="mt-px shrink-0" />
        <div>
          <span className="font-medium">One page, every {table.toLowerCase()}.</span> Editing the{" "}
          {tables} page updates all {rooms.length} {table.toLowerCase()} QR page
          {rooms.length === 1 ? "" : "s"} at this location.
          {rooms.length
            ? ""
            : ` Add your first ${table.toLowerCase()} QR to get started.`}
          <br />
          <Link
            href={{ pathname: "/customer-page", query: { loc: location.id, kind: "rooms" } }}
            className="font-medium underline"
          >
            Edit {tables} page →
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {rooms.map((room) => (
          <QrCard key={room.code} location={location} room={room} />
        ))}
        <button
          type="button"
          className="flex min-h-[210px] flex-col items-center justify-center gap-[7px] rounded-[11px] border-[1.5px] border-dashed border-ink/20 bg-slate-50/60 p-3.5 text-center text-[11.5px] text-ink-muted hover:border-brand-blue hover:bg-brand-blue/[0.03] hover:text-brand-blue"
          onClick={() => openAdd(location.id)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-pill bg-brand-blue/[0.08] text-brand-blue">
            <Icon name="plus" size={18} />
          </span>
          <span>
            <strong className="font-medium text-slate-700">Add QR</strong>
            <br />
            New {table.toLowerCase()}
          </span>
        </button>
      </div>

      <p className="mt-3 border-t border-black/5 pt-3 text-[11.5px] leading-[1.55] text-ink-muted">
        {active} of {rooms.length} {table.toLowerCase()} QR{rooms.length === 1 ? "" : "s"} active ·
        Codes are permanent. Renaming a {table.toLowerCase()} keeps its QR working; pausing one
        shows “not available” without freeing the code.
      </p>
    </>
  );
}

function QrCard({ location, room }: { location: SpotLocation; room: Room }) {
  const { state, save, toast, origin, openQr, businessType } = useOwner();
  const url = absoluteUrl(origin, spotPath(location.slug, room.code));
  const newCount = state.orders.filter(
    (order) =>
      order.locId === location.id &&
      order.code === room.code &&
      order.status === "new" &&
      isTodayOrder(order),
  ).length;
  const label = displaySpotName(businessType, room);

  const toggle = () => {
    const result = toggleRoomActive(state, location.id, room.code);
    if (!result) return;
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    toast(result.message);
  };

  return (
    <article
      className={cx(
        "flex flex-col gap-2 rounded-[11px] border border-black/10 bg-white p-[11px]",
        !room.active && "bg-neutral-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-medium">
            {label}
            {newCount > 0 && <Badge tone="new" className="ml-1.5">{newCount} new</Badge>}
          </p>
          <p className="mt-[3px] text-[10.5px] text-ink-muted">
            <CodePill>{room.code.toUpperCase()}</CodePill>
            {room.active ? "" : " · Paused"}
          </p>
        </div>
        <Switch
          checked={room.active}
          onChange={toggle}
          label={`Toggle ${label} QR`}
          title={room.active ? "Pause this QR" : "Activate this QR"}
        />
      </div>

      <div
        className={cx(
          "grid place-items-center rounded-[9px] border border-black/5 bg-white p-[7px]",
          !room.active && "opacity-[0.42] grayscale",
        )}
      >
        <QrArt url={url} />
      </div>

      <p className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] text-ink-muted">
        /r/{location.slug}/{room.code}
      </p>

      <div className="flex gap-[5px]">
        <button
          type="button"
          className={cx(btnOutline, "flex-1 px-1.5 text-[11px]")}
          onClick={() => openQr(location.id, room.code)}
        >
          QR
        </button>
        <button
          type="button"
          className={cx(btnOutline, "flex-1 px-1.5 text-[11px]")}
          onClick={() => void copyText(url, () => toast("Link copied."))}
        >
          Copy
        </button>
        <Link
          className={cx(btnOutline, "flex-1 px-1.5 text-[11px]")}
          href={spotPath(location.slug, room.code)}
        >
          Preview
        </Link>
      </div>
    </article>
  );
}


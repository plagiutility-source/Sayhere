"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/rooms/shared/icons";
import { QrArt } from "@/components/rooms/shared/QrArt";
import { Badge, CodePill, Switch, btnOutline, btnPrimary, btnSm, btnXs, cx } from "@/components/rooms/shared/ui";
import { displaySpotName, isTodayOrder, spotWord } from "@/lib/rooms/format";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import {
  activeStatus,
  countNewOrders,
  serviceCallsForSpot,
  toggleRoomActive,
  waiterName,
} from "@/lib/rooms/rules";
import type { Room, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

export function RoomsPage() {
  const { state, businessType } = useOwner();
  const params = useSearchParams();
  const locId = params.get("loc");
  const location = state.locations.find((item) => item.id === locId) ?? state.locations[0];

  if (!location) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location before creating {spotWord(businessType, false).toLowerCase()} QRs.
      </div>
    );
  }

  return <RoomsContent location={location} />;
}

function RoomsContent({ location }: { location: SpotLocation }) {
  const { state, businessType, openAdd } = useOwner();
  const tables = spotWord(businessType, true);
  const table = spotWord(businessType, false);
  const rooms = location.rooms;
  const active = rooms.filter((room) => room.active).length;
  const openOrders = state.orders.filter(
    (order) => order.locId === location.id && activeStatus(order.status) && isTodayOrder(order),
  );
  const waiting = countNewOrders(state, location.id);

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">{tables}</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            Every {table.toLowerCase()} has its own permanent QR and shares the location&apos;s{" "}
            {tables} page. Live orders show up here too.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className={btnOutline}
            href={{ pathname: "/orders", query: { loc: location.id } }}
          >
            <Icon name="receipt" size={15} /> Live orders{waiting ? ` · ${waiting} new` : ""}
          </Link>
          <button type="button" className={btnPrimary} onClick={() => openAdd(location.id)}>
            <Icon name="plus" size={15} /> Add {table.toLowerCase()} QR
          </button>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]"
          aria-label="Location"
        >
          {state.locations.map((item) => {
            const itemActive = item.id === location.id;
            return (
              <Link
                key={item.id}
                href={{ pathname: "/rooms", query: { loc: item.id } }}
                className={cx(
                  "inline-flex h-8 items-center rounded-control px-3 text-[12.5px] font-medium",
                  itemActive
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
                    : "text-slate-600",
                )}
              >
                {item.name.split("—")[1]?.trim() || item.name}
              </Link>
            );
          })}
        </div>
        <Badge>
          {rooms.length} {table.toLowerCase()} QR{rooms.length === 1 ? "" : "s"} · {active} active ·{" "}
          {openOrders.length} with open orders
        </Badge>
      </div>

      <div className="my-4 flex flex-wrap items-center gap-2.5 rounded-[11px] border border-brand-blue/[0.16] bg-brand-blue/[0.045] px-[15px] py-[13px]">
        <div className="min-w-[220px] flex-1 text-xs leading-[1.5] text-brand-navy">
          <strong className="font-medium">
            All {rooms.length} {table.toLowerCase()} QR{rooms.length === 1 ? "" : "s"} at{" "}
            {location.name} open one shared page.
          </strong>{" "}
          A single edit updates every {table.toLowerCase()}. Viewers still land on their own link, so
          scans and orders stay attributable.
        </div>
        <Link
          className={cx(btnOutline, btnSm)}
          href={{ pathname: "/customer-page", query: { loc: location.id, kind: "rooms" } }}
        >
          <Icon name="edit" size={14} /> Edit {tables} page
        </Link>
        <button
          type="button"
          className={cx(btnPrimary, btnSm)}
          onClick={() => openAdd(location.id)}
        >
          <Icon name="plus" size={14} /> Add {table.toLowerCase()}
        </button>
      </div>

      <section className="rounded-card border border-black/10 bg-white shadow-soft">
        {rooms.length === 0 ? (
          <div className="px-[18px] py-7 text-center text-xs text-ink-muted">
            <strong className="mb-1 block text-[13px] font-medium text-ink">
              No {table.toLowerCase()} QRs yet
            </strong>
            Add the first {table.toLowerCase()} QR. It will use the shared {tables} page for this
            location.
            <div className="mt-3">
              <button
                type="button"
                className={cx(btnPrimary, btnSm)}
                onClick={() => openAdd(location.id)}
              >
                <Icon name="plus" size={14} /> Add {table.toLowerCase()} QR
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {rooms.map((room) => (
              <RoomRow key={room.code} location={location} room={room} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-3.5 flex items-start gap-[9px] rounded-[9px] border border-brand-green/[0.18] bg-brand-green/[0.06] px-[11px] py-2.5 text-xs leading-[1.5] text-emerald-900">
        <Icon name="lock" size={15} className="mt-px shrink-0" />
        <div>
          {tables} links use a permanent code such as <CodePill>QR1</CodePill>. Renaming the{" "}
          {table.toLowerCase()} or the location does not change the QR. Pausing a QR keeps its code
          reserved so it can never accidentally point at another {table.toLowerCase()}.
        </div>
      </div>
    </>
  );
}

function RoomRow({ location, room }: { location: SpotLocation; room: Room }) {
  const { state, save, toast, origin, openRename, openQr, businessType } = useOwner();
  const tables = spotWord(businessType, true);
  const url = absoluteUrl(origin, spotPath(location.slug, room.code));
  const label = displaySpotName(businessType, room);

  const orders = state.orders.filter(
    (order) =>
      order.locId === location.id &&
      order.code === room.code &&
      activeStatus(order.status) &&
      isTodayOrder(order),
  );
  const newCount = orders.filter((order) => order.status === "new").length;
  const calls = serviceCallsForSpot(state, location.id, room.code);
  const waiters = Array.from(new Set(orders.map((order) => order.waiterId).filter(Boolean)))
    .map((id) => waiterName(state, location.id, id))
    .join(", ");

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
    <div
      className={cx(
        "grid grid-cols-[58px_minmax(0,1fr)_64px_150px_84px_auto] items-center gap-3 border-b border-black/5 px-4 py-[13px] last:border-b-0",
        "max-[1100px]:grid-cols-[52px_minmax(0,1fr)_auto]",
        !room.active && "bg-neutral-50",
      )}
    >
      <div
        className={cx(
          "h-[52px] w-[52px] rounded-control border border-black/5 bg-white p-1",
          !room.active && "opacity-40 grayscale",
        )}
      >
        <QrArt url={url} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
          {label} <CodePill>{room.code.toUpperCase()}</CodePill>
          {newCount > 0 && <Badge tone="new">{newCount} new</Badge>}
        </div>
        <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] text-ink-muted">
          syehere.co/{location.slug}/{room.code}
        </p>
      </div>

      <div className="text-right max-[1100px]:hidden">
        <strong className="block text-sm font-medium">{room.scans}</strong>
        <span className="text-[10.5px] text-ink-muted">scans</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {calls.map((call) => (
          <span
            key={call.id}
            className={cx(
              "inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[10.5px] font-medium",
              call.kind === "bill"
                ? "bg-brand-yellow/20 text-yellow-800"
                : "bg-brand-blue/10 text-brand-blue",
            )}
          >
            <Icon name={call.kind === "bill" ? "receipt" : "bell"} size={10} />{" "}
            {call.kind === "bill" ? "Bill requested" : "Call waiter"}
          </span>
        ))}
        {orders.length > 0 ? (
          <span className="inline-flex items-center rounded-pill bg-brand-green/10 px-1.5 py-0.5 text-[10.5px] font-medium text-brand-green-deep">
            {orders.length} open
          </span>
        ) : (
          <span className="inline-flex items-center rounded-pill bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-500">
            No open orders
          </span>
        )}
        {waiters && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-muted">
            <Icon name="users" size={11} /> {waiters}
          </span>
        )}
      </div>

      <div>
        <Badge tone={room.active ? "green" : "amber"}>{room.active ? "Active" : "Paused"}</Badge>
      </div>

      <div className="flex flex-wrap justify-end gap-[5px] max-[1100px]:col-start-2 max-[1100px]:col-end-[-1] max-[1100px]:justify-start">
        <Switch
          checked={room.active}
          onChange={toggle}
          label={`Toggle ${label} QR`}
          title={room.active ? "Pause this QR" : "Activate this QR"}
        />
        <Link
          className={cx(btnOutline, btnXs)}
          href={{ pathname: "/orders", query: { loc: location.id } }}
        >
          Orders{newCount ? ` · ${newCount}` : ""}
        </Link>
        <button
          type="button"
          className={cx(btnOutline, btnXs)}
          onClick={() => openRename(location.id, room.code)}
        >
          Rename
        </button>
        <button
          type="button"
          className={cx(btnOutline, btnXs)}
          onClick={() => openQr(location.id, room.code)}
        >
          QR
        </button>
        <Link className={cx(btnOutline, btnXs)} href={spotPath(location.slug, room.code)}>
          Preview
        </Link>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { Modal } from "@/components/rooms/shared/Modal";
import { btnOutline, btnPrimary, cx } from "@/components/rooms/shared/ui";
import { CART_MAX_QTY, GUESTS_OPTIONS, NAME_MAX, PHONE_MAX } from "@/lib/rooms/constants";
import { displaySpotName, money, orderSpotName } from "@/lib/rooms/format";
import { createPunchOrder, findOpenBill, waiterName } from "@/lib/rooms/rules";
import { useRoomsMenu } from "@/lib/rooms/adapter";
import { playBell } from "@/lib/rooms/sound";
import type { OrderItem, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

const fieldLabel = "text-[11.5px] font-medium text-slate-600";
const optional = "font-normal text-ink-muted";
const inputClass =
  "h-9 w-full rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/[0.12]";
const hintClass = "mt-1 block text-[10.5px] leading-[1.5] text-ink-muted";
const closeClass =
  "grid h-[30px] w-[30px] place-items-center rounded-control text-ink-muted hover:bg-surface-muted";
const stepClass =
  "grid h-6 w-6 place-items-center rounded-pill border border-ink/10 bg-white text-ink";
const addClass =
  "rounded-pill border border-brand-blue bg-white px-2.5 py-1 text-[10px] font-medium text-brand-blue";

/** The demo's `openPunchModal`: a table punch joins that table's open bill, a direct punch starts one. */
export function PunchDialog({
  location,
  initialCode,
  onClose,
}: {
  location: SpotLocation;
  initialCode: string;
  onClose: () => void;
}) {
  const { state, save, toast, soundOn } = useOwner();
  const [code, setCode] = useState(initialCode);
  const [items, setItems] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [waiterId, setWaiterId] = useState("");

  const openBill = code ? findOpenBill(state, location.id, code) : null;
  const selectedRoom = code ? location.rooms.find((room) => room.code === code) || null : null;
  const waiters = location.waiters || [];
  // The app's own menu (page config), priced and plan-limited; the standalone
  // demo menu is gone. Sold-out or unpriced items cannot be punched.
  const menu = useRoomsMenu(location.slug, "normal");
  const menuItems: Record<string, { id: string; name: string; price: number }> = {};
  for (const category of menu.categories) {
    for (const item of category.items) {
      if (item.orderable && item.price !== null) {
        menuItems[item.id] = { id: item.id, name: item.name, price: item.price };
      }
    }
  }

  const lines: OrderItem[] = Object.keys(items)
    .filter((id) => items[id] > 0 && menuItems[id])
    .map((id) => ({
      id,
      name: menuItems[id].name,
      price: menuItems[id].price,
      qty: items[id],
    }));
  const total = lines.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = lines.reduce((sum, item) => sum + item.qty, 0);

  const changeQty = (id: string, step: number) => {
    setItems((current) => {
      const next = { ...current };
      const qty = Math.max(0, Math.min(CART_MAX_QTY, (next[id] || 0) + step));
      if (qty) next[id] = qty;
      else delete next[id];
      return next;
    });
  };

  const submit = () => {
    const result = createPunchOrder(state, {
      locId: location.id,
      code: code || null,
      lines,
      name,
      phone,
      guests,
      waiterId: waiterId || null,
    });
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    onClose();
    playBell(soundOn);
    toast(
      result.added
        ? `Added ${money(result.round.total)} to ${result.order.customerName}'s bill #${result.order.number} — no new bill.`
        : `Punched #${result.order.number} · ${orderSpotName(state, result.order)} · ${money(result.order.total)}.`,
    );
  };

  return (
    <Modal wide focusFirst={false} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">Punch order</p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            {location.name} · staff-entered, no customer scan needed.
          </p>
        </div>
        <button type="button" className={closeClass} onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mb-3 flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-blue-900">
        <Icon name="sparkles" size={15} className="mt-px shrink-0" />
        <div>
          A table punch joins that table&apos;s open bill. A <strong>direct punch</strong> has no
          table and appears under “Direct punch” in Orders and Analytics.
        </div>
      </div>

      <div className="flex flex-col gap-[5px]">
        <label className={fieldLabel} htmlFor="punch-spot">
          Add to
        </label>
        <select
          id="punch-spot"
          className={inputClass}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        >
          <option value="">Direct punch — no table</option>
          {location.rooms.map((room) => (
            <option key={room.code} value={room.code}>
              {displaySpotName(state.businessType, room)} · {room.code.toUpperCase()}
            </option>
          ))}
        </select>
        <span className={hintClass}>
          {openBill
            ? `Adds to ${openBill.customerName}'s open bill #${openBill.number} — no new bill.`
            : selectedRoom
              ? `Starts a new bill at ${displaySpotName(state.businessType, selectedRoom)}.`
              : "No table is attached to this bill."}
        </span>
      </div>

      <p className="mt-4 text-[9px] uppercase tracking-[0.06em] text-ink-muted">Choose items</p>
      <div className="mt-1.5 max-h-[238px] overflow-y-auto rounded-[10px] border border-ink/10 bg-white px-2.5 py-1">
        {menu.categories.map((category, categoryIndex) => {
          const rows = category.items.filter(
            (item) => item.orderable && item.price !== null,
          );
          if (!rows.length) return null;
          return (
            <div key={category.name}>
              <p
                className={cx(
                  "mb-[3px] text-[8.5px] uppercase tracking-[0.06em] text-ink-muted",
                  categoryIndex ? "mt-2" : "mt-1",
                )}
              >
                {category.name}
              </p>
              {rows.map((item) => {
                const qty = items[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 border-b border-gray-100 py-[7px] last:border-b-0"
                  >
                    <div className="min-w-0">
                      <strong className="block text-[11px] font-medium">{item.name}</strong>
                      <span className="mt-px block text-[9.5px] text-ink-muted">
                        {money(item.price ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-[5px]">
                      {qty ? (
                        <button
                          type="button"
                          className={stepClass}
                          onClick={() => changeQty(item.id, -1)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          <Icon name="minus" size={12} />
                        </button>
                      ) : null}
                      {qty ? <span className="min-w-4 text-center text-[10px] font-medium">{qty}</span> : null}
                      <button
                        type="button"
                        className={qty ? stepClass : addClass}
                        onClick={() => changeQty(item.id, 1)}
                        aria-label={`Add one ${item.name}`}
                      >
                        {qty ? <Icon name="plus" size={12} /> : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!Object.keys(menuItems).length ? (
          <p className="px-1 py-3 text-[11px] leading-[1.5] text-ink-muted">
            No orderable menu items yet. Add prices to the menu on the customer page,
            then punch an order.
          </p>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2.5 rounded-[8px] bg-surface-muted px-2.5 py-[9px] text-[11px]">
        <span>
          {count} item{count === 1 ? "" : "s"}
        </span>
        <strong className="text-sm font-medium">{money(total)}</strong>
      </div>

      {openBill ? (
        <div className="mt-3 flex items-start gap-[7px] rounded-[9px] bg-blue-50 px-2.5 py-[9px] text-blue-800">
          <Icon name="receipt" size={15} className="mt-px shrink-0" />
          <div>
            <strong className="block text-[10.5px] font-medium">
              {openBill.customerName}&apos;s bill
            </strong>
            <span className="mt-0.5 block text-[9.5px] leading-[1.45]">
              #{openBill.number} · {money(openBill.total)} before this round ·{" "}
              {waiterName(state, openBill.locId, openBill.waiterId)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-2 max-[640px]:grid-cols-1">
          <div className="flex flex-col gap-[5px]">
            <label className={fieldLabel} htmlFor="punch-name">
              Customer name <span className={optional}>(optional)</span>
            </label>
            <input
              id="punch-name"
              className={inputClass}
              maxLength={NAME_MAX}
              placeholder="Walk-in"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <label className={fieldLabel} htmlFor="punch-phone">
              Phone <span className={optional}>(optional)</span>
            </label>
            <input
              id="punch-phone"
              className={inputClass}
              maxLength={PHONE_MAX}
              inputMode="tel"
              placeholder="+91…"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <label className={fieldLabel} htmlFor="punch-guests">
              Guests
            </label>
            <select
              id="punch-guests"
              className={inputClass}
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            >
              {GUESTS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <label className={fieldLabel} htmlFor="punch-waiter">
              Waiter <span className={optional}>(optional)</span>
            </label>
            <select
              id="punch-waiter"
              className={inputClass}
              value={waiterId}
              onChange={(event) => setWaiterId(event.target.value)}
            >
              <option value="">No waiter</option>
              {waiters.map((waiter) => (
                <option key={waiter.id} value={waiter.id} disabled={!waiter.active}>
                  {waiter.name}
                  {waiter.active ? "" : " · paused"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-[18px] flex justify-end gap-2">
        <button type="button" className={btnOutline} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={submit}>
          <Icon name="receipt" size={14} /> Punch order · {money(total)}
        </button>
      </div>
    </Modal>
  );
}

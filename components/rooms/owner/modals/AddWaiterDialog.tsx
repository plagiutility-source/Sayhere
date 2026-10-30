"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { Modal } from "@/components/rooms/shared/Modal";
import { btnOutline, btnPrimary } from "@/components/rooms/shared/ui";
import { WAITER_MAX_ADD_OPTIONS } from "@/lib/rooms/constants";
import { spotWord } from "@/lib/rooms/format";
import { addWaiter } from "@/lib/rooms/rules";
import type { SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

const fieldLabel = "text-[11.5px] font-medium text-slate-600";
const inputClass =
  "h-9 w-full rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/[0.12]";
const hintClass = "text-[10.5px] leading-[1.5] text-ink-muted";
const closeClass =
  "grid h-[30px] w-[30px] place-items-center rounded-control text-ink-muted hover:bg-surface-muted";

/** The demo's `openAddWaiterModal`: name, max 2–6 (default 3), then `addWaiter`. */
export function AddWaiterDialog({
  location,
  onClose,
}: {
  location: SpotLocation;
  onClose: () => void;
}) {
  const { state, save, toast, businessType } = useOwner();
  const table = spotWord(businessType, false);
  const tables = spotWord(businessType, true);
  const [name, setName] = useState("");
  const [max, setMax] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const result = addWaiter(state, location.id, name, max);
    if (!result) return;
    if (!result.ok) {
      inputRef.current?.focus();
      toast(result.error);
      return;
    }
    save(result.state);
    onClose();
    toast(result.message);
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">Add waiter</p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            {location.name} · set how many {tables.toLowerCase()} they can handle at once.
          </p>
        </div>
        <button type="button" className={closeClass} onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex flex-col gap-[5px]">
          <label className={fieldLabel} htmlFor="new-waiter-name">
            Name
          </label>
          <input
            id="new-waiter-name"
            ref={inputRef}
            className={inputClass}
            maxLength={30}
            placeholder="Waiter name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-col gap-[5px]">
          <label className={fieldLabel} htmlFor="new-waiter-max">
            Maximum {tables.toLowerCase()} at a time
          </label>
          <select
            id="new-waiter-max"
            className={inputClass}
            value={max}
            onChange={(event) => setMax(Number(event.target.value))}
          >
            {WAITER_MAX_ADD_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value} {tables.toLowerCase()}
              </option>
            ))}
          </select>
          <span className={hintClass}>
            When they reach the limit, customers see “At capacity” and cannot pick them until a{" "}
            {table.toLowerCase()} is freed.
          </span>
        </div>
      </div>

      <div className="mt-[18px] flex justify-end gap-2">
        <button type="button" className={btnOutline} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={submit}>
          Add waiter
        </button>
      </div>
    </Modal>
  );
}

"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/rooms/shared/icons";
import { Modal } from "@/components/rooms/shared/Modal";
import { QrArt } from "@/components/rooms/shared/QrArt";
import { copyText } from "@/components/rooms/shared/clipboard";
import { CodePill, btnOutline, btnPrimary } from "@/components/rooms/shared/ui";
import { spotWord } from "@/lib/rooms/format";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import { qrFilename, qrSvg } from "@/lib/rooms/qr";
import { addRoom, getLocation, nextRoomCode, renameRoom } from "@/lib/rooms/rules";
import type { Room, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

const fieldLabel = "text-[11.5px] font-medium text-slate-600";
const inputClass =
  "h-9 w-full rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/[0.12]";
const hintClass = "text-[10.5px] text-ink-muted";
const closeClass =
  "grid h-[30px] w-[30px] place-items-center rounded-control text-ink-muted hover:bg-surface-muted";
const footClass = "mt-[18px] flex justify-end gap-2";

export function SpotDialogs() {
  const { dialog, state } = useOwner();
  if (!dialog) return null;
  const location = getLocation(state, dialog.locId);
  if (!location) return null;

  if (dialog.kind === "add") {
    return <AddDialog key={`add-${location.id}`} location={location} />;
  }

  const room = location.rooms.find((item) => item.code === dialog.code);
  if (!room) return null;

  if (dialog.kind === "rename") {
    return <RenameDialog key={`rename-${room.code}`} location={location} room={room} />;
  }
  return <QrDialog key={`qr-${room.code}`} location={location} room={room} />;
}

function AddDialog({ location }: { location: SpotLocation }) {
  const { state, save, closeDialog, toast, businessType } = useOwner();
  const table = spotWord(businessType, false);
  const tables = spotWord(businessType, true);
  const [name, setName] = useState(`${table} ${location.rooms.length + 1}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const code = nextRoomCode(location);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      toast("Enter a room name.");
      return;
    }
    const result = addRoom(state, location.id, trimmed);
    if (!result) return;
    if (!result.ok) {
      toast(result.error);
      return;
    }
    save(result.state);
    closeDialog();
    toast(result.message);
  };

  return (
    <Modal onClose={closeDialog}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">Add {table.toLowerCase()} QR</p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            A new {table.toLowerCase()} gets its own permanent QR, link and live order feed.
          </p>
        </div>
        <button type="button" className={closeClass} onClick={closeDialog} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-3.5 flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-brand-navy">
          <Icon name="sparkles" size={15} className="mt-px shrink-0" />
          <div>
            It shares the {tables} page with every other {table.toLowerCase()} at {location.name}.
            Editing that page updates this QR too — orders stay separate per {table.toLowerCase()}.
          </div>
        </div>

        <div className="flex flex-col gap-[5px]">
          <label className={fieldLabel} htmlFor="new-room-name">
            {table} name
          </label>
          <input
            id="new-room-name"
            ref={inputRef}
            className={inputClass}
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <span className={hintClass}>
            Customers see this name at checkout, and every order is tagged with it.
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-[5px]">
          <label className={fieldLabel}>Permanent link code</label>
          <div>
            <CodePill>{code.toUpperCase()}</CodePill>
          </div>
          <span className={hintClass}>Assigned when you create the QR. It never changes.</span>
        </div>
      </div>

      <div className={footClass}>
        <button type="button" className={btnOutline} onClick={closeDialog}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={create}>
          Create QR
        </button>
      </div>
    </Modal>
  );
}

function RenameDialog({ location, room }: { location: SpotLocation; room: Room }) {
  const { state, save, closeDialog, toast, businessType } = useOwner();
  const table = spotWord(businessType, false);
  const [name, setName] = useState(room.name);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a room name.");
      inputRef.current?.focus();
      return;
    }
    const result = renameRoom(state, location.id, room.code, trimmed);
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    save(result.state);
    closeDialog();
    toast(result.message);
  };

  return (
    <Modal onClose={closeDialog}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">Rename {table.toLowerCase()}</p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            The QR, link and past orders stay exactly the same.
          </p>
        </div>
        <button type="button" className={closeClass} onClick={closeDialog} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex flex-col gap-[5px]">
          <label className={fieldLabel} htmlFor="rename-room-name">
            {table} name
          </label>
          <input
            id="rename-room-name"
            ref={inputRef}
            className={inputClass}
            maxLength={40}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />
          <span className={hintClass}>
            Code {room.code.toUpperCase()} · /r/{location.slug}/{room.code}
          </span>
          {error && <span className="mt-1.5 text-[10.5px] text-red-700">{error}</span>}
        </div>
      </div>

      <div className={footClass}>
        <button type="button" className={btnOutline} onClick={closeDialog}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={saveName}>
          Save name
        </button>
      </div>
    </Modal>
  );
}

function QrDialog({ location, room }: { location: SpotLocation; room: Room }) {
  const { closeDialog, toast, origin, businessType } = useOwner();
  const url = absoluteUrl(origin, spotPath(location.slug, room.code));

  const download = () => {
    const blob = new Blob([qrSvg(url)], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = qrFilename(location.slug, room.code);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1500);
    toast("QR downloaded as SVG.");
  };

  return (
    <Modal wide onClose={closeDialog}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">{room.name}</p>
          <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-muted">
            {location.name} · permanent code {room.code.toUpperCase()}
          </p>
        </div>
        <button type="button" className={closeClass} onClick={closeDialog} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-4">
        <div className="mx-auto mb-3 grid w-[232px] max-w-full place-items-center rounded-card border border-black/10 bg-white p-2.5">
          <QrArt url={url} />
        </div>
        <p className="break-all rounded-control bg-surface-muted px-2.5 py-2 text-center font-mono text-[10.5px] leading-[1.5] text-slate-600">
          {url}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${btnOutline} flex-1`}
            onClick={() => void copyText(url, () => toast("Link copied."))}
          >
            <Icon name="copy" size={15} /> Copy link
          </button>
          <button type="button" className={`${btnPrimary} flex-1`} onClick={download}>
            <Icon name="download" size={15} /> Download SVG
          </button>
        </div>
        <p className="mt-2.5 text-center text-[10.5px] leading-[1.5] text-ink-muted">
          Print this once. Renaming the {spotWord(businessType, false).toLowerCase()} keeps the QR
          working;
          pausing it keeps the code reserved.
        </p>
      </div>
    </Modal>
  );
}

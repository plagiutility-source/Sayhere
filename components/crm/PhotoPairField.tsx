"use client";

/**
 * Two optional photos attached to one visit. Photos are resized before they
 * reach the CRM store; the owner must confirm the client agreed to them.
 * Camera capture is requested on phones, with the normal picker as fallback.
 */

import { useId, useState } from "react";
import { PhotoIcon } from "@/components/dashboard/icons";
import {
  CRM_PHOTO_ACCEPTED_TYPES,
  compressCrmPhoto,
} from "@/lib/crm/photos";

type Props = {
  before: string | null;
  after: string | null;
  consent: boolean;
  onChange: (patch: {
    before_photo: string | null;
    after_photo: string | null;
    photo_consent: boolean;
  }) => void;
  error?: string;
};

function PhotoSlot({
  label,
  hint,
  value,
  busy,
  onPick,
  onRemove,
}: {
  label: string;
  hint: string;
  value: string | null;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = useId();
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-medium text-ink">{label}</p>
      {value ? (
        <div className="mt-1.5 overflow-hidden rounded-control border border-black/10 bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`${label} treatment photo`}
            className="h-28 w-full object-cover"
          />
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="text-[10px] text-ink-muted">Stored privately</span>
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] font-medium text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="mt-1.5 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed border-black/20 bg-[#FBFCFE] px-2 text-center hover:border-brand-blue/50 hover:bg-brand-blue/[0.03] focus-within:ring-2 focus-within:ring-brand-blue"
        >
          <PhotoIcon size={20} />
          <span className="text-[11px] font-medium text-ink">
            {busy ? "Preparing photo…" : "Add photo"}
          </span>
          <span className="text-[9px] leading-tight text-ink-muted">{hint}</span>
          <input
            id={inputId}
            type="file"
            accept={CRM_PHOTO_ACCEPTED_TYPES.join(",")}
            capture="environment"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPick(file);
            }}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}

export function PhotoPairField({
  before,
  after,
  consent,
  onChange,
  error,
}: Props) {
  const [busy, setBusy] = useState<"before" | "after" | null>(null);
  const [localError, setLocalError] = useState("");

  async function pick(slot: "before" | "after", file: File) {
    setLocalError("");
    setBusy(slot);
    try {
      const dataUrl = await compressCrmPhoto(file);
      onChange({
        before_photo: slot === "before" ? dataUrl : before,
        after_photo: slot === "after" ? dataUrl : after,
        photo_consent: consent,
      });
    } catch (caught) {
      setLocalError(
        caught instanceof Error
          ? caught.message
          : "Could not prepare that photo. Try another image.",
      );
    } finally {
      setBusy(null);
    }
  }

  const hasPhoto = Boolean(before || after);
  const shownError = localError || error;

  return (
    <fieldset className="rounded-control border border-black/10 bg-white p-3">
      <legend className="px-1 text-[12px] font-medium text-ink">
        Before / after photos
      </legend>
      <p className="text-[10px] leading-relaxed text-ink-muted">
        Optional. Keep them private to the client record; ask before taking or
        uploading a photo. Photos are compressed for this demo and are never
        shared publicly.
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <PhotoSlot
          label="Before"
          hint="Camera or gallery"
          value={before}
          busy={busy === "before"}
          onPick={(file) => void pick("before", file)}
          onRemove={() =>
            onChange({ before_photo: null, after_photo: after, photo_consent: consent })
          }
        />
        <PhotoSlot
          label="After"
          hint="Camera or gallery"
          value={after}
          busy={busy === "after"}
          onPick={(file) => void pick("after", file)}
          onRemove={() =>
            onChange({ before_photo: before, after_photo: null, photo_consent: consent })
          }
        />
      </div>
      {hasPhoto ? (
        <label className="mt-3 flex items-start gap-2 rounded-control bg-[#F8FAFC] px-2.5 py-2 text-[11px] leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) =>
              onChange({
                before_photo: before,
                after_photo: after,
                photo_consent: event.target.checked,
              })
            }
            className="mt-0.5 h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
          />
          <span>
            I confirm this client agreed to these before/after photos being stored
            in their record.
          </span>
        </label>
      ) : null}
      {shownError ? (
        <p role="alert" className="mt-2 text-[11px] text-red-700">
          {shownError}
        </p>
      ) : null}
    </fieldset>
  );
}

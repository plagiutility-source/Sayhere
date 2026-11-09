"use client";

/** A private before/after view for one visit. */

import { Modal } from "@/components/dashboard/modal";
import type { CrmServiceEntry } from "@/lib/crm/rules";
import { formatCrmDate } from "./crm-utils";

function PhotoPanel({
  label,
  src,
}: {
  label: string;
  src: string | null;
}) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-control border border-black/10 bg-[#F8FAFC]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${label} visit photo`}
            className="max-h-[380px] w-full object-contain"
          />
        ) : (
          <div className="flex h-48 items-center justify-center text-[11px] text-ink-muted">
            No {label.toLowerCase()} photo
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 text-[11px] font-medium text-ink">
        {label}
      </figcaption>
    </figure>
  );
}

export function PhotoViewerDialog({
  open,
  entry,
  onClose,
}: {
  open: boolean;
  entry: CrmServiceEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;
  return (
    <Modal
      open={open}
      title="Before / after photos"
      onClose={onClose}
      panelClassName="max-w-[820px]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/10 pb-3">
        <div>
          <p className="text-[13px] font-medium text-ink">{entry.service}</p>
          <p className="mt-0.5 text-[10px] text-ink-muted">
            {formatCrmDate(`${entry.entry_date}T00:00:00`)}
          </p>
        </div>
        <span className="rounded-[4px] border border-black/10 bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted">
          {entry.photo_consent ? "Client consent recorded" : "Consent not recorded"}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PhotoPanel label="Before" src={entry.before_photo} />
        <PhotoPanel label="After" src={entry.after_photo} />
      </div>
      {entry.notes ? (
        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          {entry.notes}
        </p>
      ) : null}
      <p className="mt-3 border-t border-black/5 pt-2 text-[10px] text-ink-muted">
        These photos are private to this CRM record and are never shown on the
        public customer page. Remove them by editing the work record.
      </p>
    </Modal>
  );
}

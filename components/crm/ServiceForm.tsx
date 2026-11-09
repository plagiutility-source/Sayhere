"use client";

/**
 * Adds or edits one work/payment record. The service is what was delivered,
 * the total is what it cost, and the paid amount is how much the client has
 * actually settled. A blank paid field means unpaid.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { CRM_PAYMENT_METHOD_LABELS } from "@/lib/crm/config";
import {
  liveContacts,
  todayKey,
  validateServiceInput,
  type CrmPaymentMethod,
  type CrmServiceDraft,
  type CrmServiceEntry,
  type CrmState,
} from "@/lib/crm/rules";
import { formatCrmMoney } from "./crm-utils";
import { CrmAvatar, PaymentBadge } from "./crm-ui";
import { PhotoPairField } from "./PhotoPairField";

const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

const PAYMENT_METHODS = Object.entries(CRM_PAYMENT_METHOD_LABELS) as [
  CrmPaymentMethod,
  string,
][];

type FormState = {
  contact_id: string;
  service: string;
  entry_date: string;
  billed: string;
  paid: string;
  payment_method: CrmPaymentMethod;
  notes: string;
  before_photo: string | null;
  after_photo: string | null;
  photo_consent: boolean;
};

function initialState(
  state: CrmState,
  initial?: CrmServiceEntry,
  fixedContactId?: string,
): FormState {
  const contacts = liveContacts(state);
  return {
    contact_id:
      initial?.contact_id ??
      fixedContactId ??
      contacts[0]?.id ??
      "",
    service: initial?.service ?? "",
    entry_date: initial?.entry_date ?? todayKey(new Date()),
    billed: initial ? String(initial.billed) : "",
    paid: initial ? String(initial.paid) : "",
    payment_method: initial?.payment_method ?? "upi",
    notes: initial?.notes ?? "",
    before_photo: initial?.before_photo ?? null,
    after_photo: initial?.after_photo ?? null,
    photo_consent: initial?.photo_consent ?? false,
  };
}

export function ServiceForm({
  state,
  initial,
  fixedContactId,
  onSubmit,
  onCancel,
}: {
  state: CrmState;
  initial?: CrmServiceEntry;
  /** On a contact record the client is fixed; on the global ledger it is not. */
  fixedContactId?: string;
  onSubmit: (draft: CrmServiceDraft) => Record<string, string> | null;
  onCancel: () => void;
}) {
  const contacts = liveContacts(state);
  const [form, setForm] = useState<FormState>(() =>
    initialState(state, initial, fixedContactId),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedContact = contacts.find((contact) => contact.id === form.contact_id);
  const billed = Math.max(0, Number(form.billed) || 0);
  const paid = Math.max(0, Number(form.paid) || 0);
  const balance = Math.max(0, billed - paid);
  const previewStatus =
    paid >= billed ? "paid" : paid > 0 ? "partial" : "unpaid";
  const firstError = Object.values(errors)[0];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: CrmServiceDraft = {
      contact_id: form.contact_id,
      service: form.service,
      entry_date: form.entry_date,
      billed,
      paid,
      payment_method: form.payment_method,
      notes: form.notes,
      before_photo: form.before_photo,
      after_photo: form.after_photo,
      photo_consent: form.photo_consent,
    };
    const found = validateServiceInput(state, draft);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const returned = onSubmit(draft);
    if (returned) setErrors(returned);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {firstError ? (
        <p
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {firstError}
        </p>
      ) : null}

      {fixedContactId && selectedContact ? (
        <div className="flex items-center gap-2 rounded-control border border-black/10 bg-surface-muted px-3 py-2">
          <CrmAvatar name={selectedContact.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[11px] text-ink-muted">Client</p>
            <p className="truncate text-[13px] font-medium text-ink">
              {selectedContact.name}
            </p>
          </div>
        </div>
      ) : (
        <Select
          label="Client"
          value={form.contact_id}
          onChange={(event) => set("contact_id", event.target.value)}
          error={errors.contact_id}
        >
          <option value="">Choose a client</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </Select>
      )}

      <Input
        label="Work done / service"
        value={form.service}
        onChange={(event) => set("service", event.target.value)}
        error={errors.service}
        placeholder="Hair colour, annual membership, winter jacket…"
        maxLength={120}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date"
          type="date"
          value={form.entry_date}
          onChange={(event) => set("entry_date", event.target.value)}
          error={errors.entry_date}
          required
        />
        <Select
          label="Payment method"
          value={form.payment_method}
          onChange={(event) =>
            set("payment_method", event.target.value as CrmPaymentMethod)
          }
          error={errors.payment_method}
        >
          {PAYMENT_METHODS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Total cost (₹)"
          type="number"
          inputMode="decimal"
          min="0"
          max="10000000"
          step="0.01"
          value={form.billed}
          onChange={(event) => set("billed", event.target.value)}
          error={errors.billed}
          disabled={Boolean(initial?.invoice)}
          hint={
            initial?.invoice
              ? "The invoice controls this total. Edit the invoice to change it."
              : "What the work was billed at."
          }
          placeholder="0"
        />
        <Input
          label="Amount paid (₹)"
          type="number"
          inputMode="decimal"
          min="0"
          max="10000000"
          step="0.01"
          value={form.paid}
          onChange={(event) => set("paid", event.target.value)}
          error={errors.paid}
          hint="Leave blank if nothing has been paid."
          placeholder="0"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-black/10 bg-[#F8FAFC] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-muted">
            Balance
          </p>
          <p className="mt-0.5 text-[16px] font-medium tabular-nums text-ink">
            {formatCrmMoney(balance)}
          </p>
        </div>
        <PaymentBadge status={previewStatus} />
      </div>

      <PhotoPairField
        before={form.before_photo}
        after={form.after_photo}
        consent={form.photo_consent}
        error={errors.before_photo ?? errors.after_photo ?? errors.photo_consent}
        onChange={(patch) =>
          setForm((current) => ({ ...current, ...patch }))
        }
      />

      <div>
        <label
          htmlFor="crm-service-notes"
          className="block text-[13px] font-medium"
        >
          Notes (optional)
        </label>
        <textarea
          id="crm-service-notes"
          value={form.notes}
          onChange={(event) => set("notes", event.target.value)}
          rows={3}
          maxLength={2_000}
          className={TEXTAREA}
          placeholder="Products used, package details, balance due date…"
        />
        {errors.notes ? (
          <p className="mt-xs text-[12px] text-red-700">{errors.notes}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initial ? "Save changes" : "Save work & payment"}
        </Button>
      </div>
    </form>
  );
}

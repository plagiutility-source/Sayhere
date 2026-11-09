"use client";

/**
 * Creates a new invoice (with its work record) or edits an existing one.
 * Invoice amounts are summed from line items, so the printed bill and the
 * ledger total cannot drift apart.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import {
  CRM_MAX_INVOICE_LINES,
  CRM_MAX_INVOICE_DESCRIPTION,
  CRM_MAX_INVOICE_NOTES,
  CRM_MAX_TERMS,
  CRM_MAX_TAX_PERCENT,
  CRM_PAYMENT_METHOD_LABELS,
} from "@/lib/crm/config";
import {
  invoiceTotals,
  liveContacts,
  nextInvoiceNumber,
  todayKey,
  type CrmInvoiceDraft,
  type CrmPaymentMethod,
  type CrmServiceEntry,
  type CrmState,
} from "@/lib/crm/rules";
import { formatCrmMoney } from "./crm-utils";
import { CrmAvatar, PaymentBadge } from "./crm-ui";

const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

const PAYMENT_METHODS = Object.entries(CRM_PAYMENT_METHOD_LABELS) as [
  CrmPaymentMethod,
  string,
][];

type LineState = {
  key: string;
  description: string;
  quantity: string;
  rate: string;
};

type FormState = {
  contact_id: string;
  service: string;
  entry_date: string;
  issue_date: string;
  due_date: string;
  lines: LineState[];
  discount: string;
  tax_percent: string;
  paid: string;
  payment_method: CrmPaymentMethod;
  notes: string;
  terms: string;
};

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateKey;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function lineKey(): string {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function initialState(
  state: CrmState,
  initial?: CrmServiceEntry,
  fixedContactId?: string,
): FormState {
  const contacts = liveContacts(state);
  const today = todayKey(new Date());
  const entryDate = initial?.entry_date ?? today;
  const invoice = initial?.invoice ?? null;
  const issue = invoice?.issue_date ?? today;
  const lines: LineState[] = invoice?.lines.length
    ? invoice.lines.map((line) => ({
        key: line.id,
        description: line.description,
        quantity: String(line.quantity),
        rate: String(line.rate),
      }))
    : [
        {
          key: lineKey(),
          description: initial?.service ?? "",
          quantity: "1",
          rate: initial ? String(initial.billed) : "",
        },
      ];
  return {
    contact_id:
      initial?.contact_id ?? fixedContactId ?? contacts[0]?.id ?? "",
    service: initial?.service ?? "",
    entry_date: entryDate,
    issue_date: issue,
    due_date:
      invoice?.due_date ??
      addDays(issue, state.config.billing.default_due_days),
    lines,
    discount: invoice ? String(invoice.discount) : "",
    tax_percent: invoice
      ? String(invoice.tax_percent)
      : String(state.config.billing.default_tax_percent || ""),
    paid: initial ? String(initial.paid) : "",
    payment_method: initial?.payment_method ?? "upi",
    notes: invoice?.notes ?? "",
    terms: invoice?.terms ?? state.config.billing.terms,
  };
}

export function InvoiceForm({
  state,
  initial,
  fixedContactId,
  onSubmit,
  onCancel,
}: {
  state: CrmState;
  /** An existing work record to invoice, or an existing invoice to edit. */
  initial?: CrmServiceEntry;
  fixedContactId?: string;
  onSubmit: (draft: CrmInvoiceDraft) => Record<string, string> | null;
  onCancel: () => void;
}) {
  const contacts = liveContacts(state);
  const [form, setForm] = useState<FormState>(() =>
    initialState(state, initial, fixedContactId),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedContact = contacts.find((contact) => contact.id === form.contact_id);
  const number = initial?.invoice?.number ?? nextInvoiceNumber(state);
  const previewTotals = invoiceTotals(
    form.lines.map((line) => ({
      quantity: Number(line.quantity) || 0,
      rate: Number(line.rate) || 0,
    })),
    Number(form.discount) || 0,
    Number(form.tax_percent) || 0,
  );
  const paid = Math.max(0, Number(form.paid) || 0);
  const balance = Math.max(0, previewTotals.total - paid);
  const previewStatus =
    paid >= previewTotals.total && previewTotals.total > 0
      ? "paid"
      : paid > 0
        ? "partial"
        : "unpaid";
  const firstError = Object.values(errors)[0];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function patchLine(key: string, patch: Partial<LineState>) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addLine() {
    if (form.lines.length >= CRM_MAX_INVOICE_LINES) return;
    setForm((current) => ({
      ...current,
      lines: [
        ...current.lines,
        { key: lineKey(), description: "", quantity: "1", rate: "" },
      ],
    }));
  }

  function removeLine(key: string) {
    setForm((current) => ({
      ...current,
      lines:
        current.lines.length > 1
          ? current.lines.filter((line) => line.key !== key)
          : current.lines,
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: CrmInvoiceDraft = {
      entry_id: initial?.id ?? null,
      contact_id: form.contact_id,
      service: form.service,
      entry_date: form.entry_date,
      issue_date: form.issue_date,
      due_date: form.due_date,
      lines: form.lines.map((line) => ({
        description: line.description,
        quantity: Number(line.quantity) || 0,
        rate: Number(line.rate) || 0,
      })),
      discount: Number(form.discount) || 0,
      tax_percent: Number(form.tax_percent) || 0,
      paid: Number(form.paid) || 0,
      payment_method: form.payment_method,
      notes: form.notes,
      terms: form.terms,
    };
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-black/10 bg-[#F8FAFC] px-3 py-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-ink-muted">
            {initial?.invoice ? "Editing invoice" : "New invoice"}
          </p>
          <p className="mt-0.5 text-[15px] font-medium tabular-nums text-ink">
            {number}
          </p>
        </div>
        {selectedContact ? (
          <div className="flex items-center gap-2">
            <CrmAvatar name={selectedContact.name} size="sm" />
            <div className="text-right">
              <p className="text-[10px] text-ink-muted">Bill to</p>
              <p className="max-w-[220px] truncate text-[12px] font-medium text-ink">
                {selectedContact.name}
              </p>
            </div>
          </div>
        ) : null}
      </div>

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
        label="Work / invoice title"
        value={form.service}
        onChange={(event) => set("service", event.target.value)}
        error={errors.service}
        placeholder="Hair colour, facial package, clinic treatment…"
        maxLength={120}
        required
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Work date"
          type="date"
          value={form.entry_date}
          onChange={(event) => set("entry_date", event.target.value)}
          error={errors.entry_date}
          required
        />
        <Input
          label="Invoice date"
          type="date"
          value={form.issue_date}
          onChange={(event) => set("issue_date", event.target.value)}
          error={errors.issue_date}
          required
        />
        <Input
          label="Due date"
          type="date"
          value={form.due_date}
          onChange={(event) => set("due_date", event.target.value)}
          error={errors.due_date}
          required
        />
      </div>

      <section className="rounded-control border border-black/10">
        <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
          <div>
            <p className="text-[12px] font-medium text-ink">Invoice lines</p>
            <p className="mt-0.5 text-[10px] text-ink-muted">
              Add each service, product or package the client is paying for.
            </p>
          </div>
          <button
            type="button"
            onClick={addLine}
            disabled={form.lines.length >= CRM_MAX_INVOICE_LINES}
            className="text-[10px] font-medium text-brand-blue disabled:opacity-40 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            + Add line
          </button>
        </div>
        <div className="flex flex-col divide-y divide-black/5">
          {form.lines.map((line, index) => (
            <div
              key={line.key}
              className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_70px_100px_92px_24px] sm:items-end"
            >
              <label className="min-w-0 text-[10px] font-medium text-ink-muted">
                Description
                <input
                  value={line.description}
                  onChange={(event) =>
                    patchLine(line.key, { description: event.target.value })
                  }
                  maxLength={CRM_MAX_INVOICE_DESCRIPTION}
                  aria-label={`Description for line ${index + 1}`}
                  placeholder="Haircut & finish"
                  className="mt-1 h-9 w-full rounded-control border border-black/20 px-2 text-[12px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </label>
              <label className="text-[10px] font-medium text-ink-muted">
                Qty
                <input
                  type="number"
                  min="0.01"
                  max="999"
                  step="0.01"
                  value={line.quantity}
                  onChange={(event) =>
                    patchLine(line.key, { quantity: event.target.value })
                  }
                  aria-label={`Quantity for line ${index + 1}`}
                  className="mt-1 h-9 w-full rounded-control border border-black/20 px-2 text-[12px] tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </label>
              <label className="text-[10px] font-medium text-ink-muted">
                Rate (₹)
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  step="0.01"
                  value={line.rate}
                  onChange={(event) =>
                    patchLine(line.key, { rate: event.target.value })
                  }
                  aria-label={`Rate for line ${index + 1}`}
                  className="mt-1 h-9 w-full rounded-control border border-black/20 px-2 text-[12px] tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </label>
              <p className="text-[12px] tabular-nums text-ink sm:pb-2 sm:text-right">
                {formatCrmMoney(
                  (Number(line.quantity) || 0) * (Number(line.rate) || 0),
                )}
              </p>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                disabled={form.lines.length <= 1}
                aria-label={`Remove line ${index + 1}`}
                className="h-9 text-[15px] text-ink-muted disabled:opacity-30 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue sm:pb-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {errors.lines ? (
          <p role="alert" className="border-t border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {errors.lines}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 rounded-control border border-black/10 bg-[#F8FAFC] p-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-ink-muted">Subtotal</span>
            <span className="tabular-nums text-ink">
              {formatCrmMoney(previewTotals.subtotal)}
            </span>
          </div>
          <label className="flex items-center justify-between gap-3 text-[11px] text-ink-muted">
            Discount (₹)
            <input
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              value={form.discount}
              onChange={(event) => set("discount", event.target.value)}
              className="h-8 w-24 rounded-control border border-black/20 bg-white px-2 text-right text-[12px] tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-[11px] text-ink-muted">
            Tax (%)
            <input
              type="number"
              min="0"
              max={CRM_MAX_TAX_PERCENT}
              step="0.01"
              value={form.tax_percent}
              onChange={(event) => set("tax_percent", event.target.value)}
              className="h-8 w-24 rounded-control border border-black/20 bg-white px-2 text-right text-[12px] tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
          </label>
          <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-2 text-[13px]">
            <span className="font-medium text-ink">Invoice total</span>
            <span className="text-[17px] font-medium tabular-nums text-ink">
              {formatCrmMoney(previewTotals.total)}
            </span>
          </div>
          {errors.discount ? (
            <p className="text-[10px] text-red-700">{errors.discount}</p>
          ) : null}
          {errors.tax_percent ? (
            <p className="text-[10px] text-red-700">{errors.tax_percent}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 border-t border-black/10 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
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
            hint="Leave blank until the client pays."
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-muted">Balance</span>
            <span className="text-[13px] font-medium tabular-nums text-ink">
              {formatCrmMoney(balance)}
            </span>
            <PaymentBadge status={previewStatus} />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="crm-invoice-notes" className="block text-[13px] font-medium">
          Invoice notes (optional)
        </label>
        <textarea
          id="crm-invoice-notes"
          value={form.notes}
          onChange={(event) => set("notes", event.target.value)}
          rows={2}
          maxLength={CRM_MAX_INVOICE_NOTES}
          className={TEXTAREA}
          placeholder="Package details, aftercare, next appointment…"
        />
        {errors.notes ? (
          <p className="mt-xs text-[11px] text-red-700">{errors.notes}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="crm-invoice-terms" className="block text-[13px] font-medium">
          Terms / footer
        </label>
        <textarea
          id="crm-invoice-terms"
          value={form.terms}
          onChange={(event) => set("terms", event.target.value)}
          rows={2}
          maxLength={CRM_MAX_TERMS}
          className={TEXTAREA}
          placeholder="Thank you for your business."
        />
        {errors.terms ? (
          <p className="mt-xs text-[11px] text-red-700">{errors.terms}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4">
        <p className="text-[10px] text-ink-muted">
          Invoices stay private to your CRM. Print or save as PDF from the
          invoice view.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initial?.invoice ? "Save invoice" : "Create invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
}

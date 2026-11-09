"use client";

/**
 * A print-ready invoice. The ledger entry is the financial source of truth, so
 * the printed total, paid amount and balance come from the same work record as
 * the CRM. "Print / Save PDF" uses the browser print dialog.
 */

import { Button } from "@/components/button";
import { Modal } from "@/components/dashboard/modal";
import type { CrmConfig } from "@/lib/crm/config";
import {
  invoiceTotals,
  serviceBalance,
  serviceStatus,
  type CrmContact,
  type CrmServiceEntry,
} from "@/lib/crm/rules";
import { useBusiness } from "@/lib/use-business";
import { formatCrmDate, formatCrmMoney } from "./crm-utils";
import { PaymentBadge } from "./crm-ui";

export function InvoiceDialog({
  open,
  entry,
  contact,
  config,
  onClose,
  onEdit,
}: {
  open: boolean;
  entry: CrmServiceEntry | null;
  contact: CrmContact | null;
  config: CrmConfig;
  onClose: () => void;
  onEdit?: (entry: CrmServiceEntry) => void;
}) {
  const business = useBusiness();
  const invoice = entry?.invoice ?? null;
  const totals = invoice
    ? invoiceTotals(invoice.lines, invoice.discount, invoice.tax_percent)
    : null;
  const balance = entry ? serviceBalance(entry) : 0;
  const billing = config.billing;

  if (!entry || !invoice || !totals) return null;

  return (
    <Modal
      open={open}
      title={`Invoice ${invoice.number}`}
      onClose={onClose}
      panelClassName="max-w-[760px]"
      footer={
        <>
          {onEdit ? (
            <Button
              variant="secondary"
              onClick={() => {
                onEdit(entry);
              }}
            >
              Edit invoice
            </Button>
          ) : null}
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </>
      }
    >
      <div className="invoice-print-area rounded-card border border-black/10 bg-white p-5 text-ink">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-[17px] font-medium leading-tight">{business.name}</p>
            {billing.address ? (
              <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-ink-muted">
                {billing.address}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-ink-muted">
              {[billing.phone, billing.email].filter(Boolean).join(" · ")}
            </p>
            {billing.gstin ? (
              <p className="mt-0.5 text-[10px] text-ink-muted">
                GSTIN: {billing.gstin}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brand-blue">
              Invoice
            </p>
            <p className="mt-1 text-[16px] font-medium tabular-nums">{invoice.number}</p>
            <p className="mt-1 text-[10px] text-ink-muted">
              Issued {formatCrmDate(`${invoice.issue_date}T00:00:00`)}
            </p>
            <p className="text-[10px] text-ink-muted">
              Due {formatCrmDate(`${invoice.due_date}T00:00:00`)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Bill to
            </p>
            <p className="mt-1 text-[13px] font-medium">
              {contact?.name ?? "Client"}
            </p>
            {contact?.company ? (
              <p className="text-[11px] text-ink-muted">{contact.company}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {[contact?.email, contact?.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Payment
            </p>
            <div className="mt-1 flex sm:justify-end">
              <PaymentBadge status={serviceStatus(entry)} />
            </div>
            <p className="mt-1 text-[10px] text-ink-muted">
              Work date {formatCrmDate(`${entry.entry_date}T00:00:00`)}
            </p>
          </div>
        </div>

        <table className="mt-5 w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-black/10 bg-[#F8FAFC]">
              <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                Description
              </th>
              <th className="px-2 py-2 text-right text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                Qty
              </th>
              <th className="px-2 py-2 text-right text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                Rate
              </th>
              <th className="px-2 py-2 text-right text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-black/5">
                <td className="px-2 py-2.5 text-[11px]">{line.description}</td>
                <td className="px-2 py-2.5 text-right text-[11px] tabular-nums text-ink-muted">
                  {line.quantity}
                </td>
                <td className="px-2 py-2.5 text-right text-[11px] tabular-nums text-ink-muted">
                  {formatCrmMoney(line.rate)}
                </td>
                <td className="px-2 py-2.5 text-right text-[11px] tabular-nums">
                  {formatCrmMoney(line.quantity * line.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 ml-auto flex max-w-[280px] flex-col gap-1.5 text-[11px]">
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Subtotal</span>
            <span className="tabular-nums">{formatCrmMoney(totals.subtotal)}</span>
          </div>
          {totals.discount ? (
            <div className="flex justify-between gap-4">
              <span className="text-ink-muted">Discount</span>
              <span className="tabular-nums">−{formatCrmMoney(totals.discount)}</span>
            </div>
          ) : null}
          {totals.tax ? (
            <div className="flex justify-between gap-4">
              <span className="text-ink-muted">
                Tax ({invoice.tax_percent}%)
              </span>
              <span className="tabular-nums">{formatCrmMoney(totals.tax)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between gap-4 border-t border-black/10 pt-1.5 text-[13px] font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatCrmMoney(entry.billed)}</span>
          </div>
          <div className="flex justify-between gap-4 text-brand-green-deep">
            <span>Paid</span>
            <span className="tabular-nums">{formatCrmMoney(entry.paid)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-black/10 pt-1.5 font-medium">
            <span>Balance due</span>
            <span className="tabular-nums">{formatCrmMoney(balance)}</span>
          </div>
        </div>

        {invoice.notes ? (
          <div className="mt-4 border-t border-black/10 pt-3">
            <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-muted">
              {invoice.notes}
            </p>
          </div>
        ) : null}
        <p className="mt-4 border-t border-black/10 pt-3 text-[10px] leading-relaxed text-ink-muted">
          {invoice.terms || "Thank you for your business."}
        </p>
      </div>
    </Modal>
  );
}

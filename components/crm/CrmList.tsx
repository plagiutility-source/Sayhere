"use client";

/**
 * `/crm` — the CRM workspace. Four working views share one mock store:
 * contacts, the owner's pipeline, the work/payment ledger and invoices. Every
 * number comes from lib/crm/rules.ts, so the list, board, ledger and bills
 * cannot disagree.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/dashboard/modal";
import {
  ArrowRightIcon,
  CrmIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UploadIcon,
} from "@/components/dashboard/icons";
import type { CrmFieldDef, CrmStage, CrmStageKind } from "@/lib/crm/config";
import {
  addContact,
  addServiceEntry,
  contactTags,
  contactsToCsv,
  crmInvoiceStats,
  crmServiceStats,
  crmStats,
  fieldValueText,
  invoicesFor,
  openTasksFor,
  saveInvoice,
  serviceStatus,
  todayKey,
  type CrmContact,
  type CrmServiceEntry,
  type CrmState,
} from "@/lib/crm/rules";
import { AddColumnDialog } from "./AddColumnDialog";
import { CrmLoading } from "./CrmGate";
import { ContactForm } from "./ContactForm";
import { ImportDialog } from "./ImportDialog";
import { InvoiceDialog } from "./InvoiceDialog";
import { InvoiceForm } from "./InvoiceForm";
import { ServiceForm } from "./ServiceForm";
import {
  CrmAvatar,
  CrmEmptyState,
  CrmMetric,
  CrmTabs,
  PaymentBadge,
  StageBadge,
} from "./crm-ui";
import { useCrmWorkspace } from "./use-crm-workspace";
import {
  downloadCsv,
  formatCrmDate,
  formatCrmMoney,
  formatCrmShortDate,
} from "./crm-utils";

type View = "contacts" | "pipeline" | "payments" | "invoices";

const VIEW_ITEMS = [
  { id: "contacts" as const, label: "Contacts" },
  { id: "pipeline" as const, label: "Pipeline" },
  { id: "payments" as const, label: "Work & payments" },
  { id: "invoices" as const, label: "Invoices" },
];

const TOP_ACTION =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-black/15 bg-white px-2.5 text-[12px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
const SELECT =
  "h-9 max-w-full rounded-control border border-black/15 bg-white px-2 text-[12px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
const TH =
  "whitespace-nowrap px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted";

function stageOf(state: CrmState, contact: CrmContact): CrmStage | null {
  return state.config.stages.find((stage) => stage.id === contact.stage_id) ?? null;
}

function stageKindTone(kind: CrmStageKind): string {
  if (kind === "won") return "text-brand-green-deep";
  if (kind === "lost") return "text-red-700";
  return "text-brand-blue";
}

function ContactRow({
  contact,
  state,
  demoSuffix,
  fields,
}: {
  contact: CrmContact;
  state: CrmState;
  demoSuffix: string;
  fields: CrmFieldDef[];
}) {
  const stage = stageOf(state, contact);
  const work = crmServiceStats(state, contact.id);
  const tags = contactTags(state, contact.id);
  const openTasks = openTasksFor(state, contact.id).length;
  const lastWork = work.last;
  return (
    <tr className="group border-b border-black/5 last:border-0 hover:bg-[#F9FBFE]">
      <td className="px-3 py-2.5">
        <Link
          href={`/crm/${contact.id}${demoSuffix}`}
          className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <CrmAvatar name={contact.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-brand-blue group-hover:underline">
              {contact.name}
            </span>
            <span className="mt-0.5 block max-w-[260px] truncate text-[10px] text-ink-muted">
              {contact.email ?? contact.phone ?? "No contact details"}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col items-start gap-1">
          {stage ? <StageBadge name={stage.name} kind={stage.kind} /> : "—"}
          {tags.length ? (
            <span className="max-w-[120px] truncate text-[10px] text-ink-muted">
              {tags.map((tag) => tag.name).join(", ")}
            </span>
          ) : null}
        </div>
      </td>
      {fields.map((field) => {
        const value = fieldValueText(contact.custom_fields[field.key]);
        return (
          <td key={field.key} className="px-3 py-2.5">
            <span
              title={value || undefined}
              className={`block max-w-[170px] truncate text-[11px] ${
                value ? "text-ink" : "text-ink-muted"
              }`}
            >
              {value || "—"}
            </span>
          </td>
        );
      })}
      <td className="px-3 py-2.5">
        {lastWork ? (
          <>
            <span className="block max-w-[200px] truncate text-[11px] text-ink">
              {lastWork.service}
            </span>
            <span className="mt-0.5 block text-[10px] text-ink-muted">
              {formatCrmShortDate(`${lastWork.entry_date}T00:00:00`)}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-ink-muted">No work logged</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-ink">
        {formatCrmMoney(work.billed)}
      </td>
      <td className="px-3 py-2.5 text-right">
        <span
          className={`text-[11px] font-medium tabular-nums ${
            work.outstanding > 0 ? "text-red-700" : "text-brand-green-deep"
          }`}
        >
          {work.outstanding > 0 ? formatCrmMoney(work.outstanding) : "Settled"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-[11px] text-ink-muted">
        {openTasks ? `${openTasks} open` : "—"}
      </td>
      <td className="px-3 py-2.5 text-right">
        <Link
          href={`/crm/${contact.id}${demoSuffix}`}
          aria-label={`Open ${contact.name}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <ArrowRightIcon size={14} />
        </Link>
      </td>
    </tr>
  );
}

function ContactCard({
  contact,
  state,
  demoSuffix,
  fields,
}: {
  contact: CrmContact;
  state: CrmState;
  demoSuffix: string;
  fields: CrmFieldDef[];
}) {
  const stage = stageOf(state, contact);
  const work = crmServiceStats(state, contact.id);
  const tags = contactTags(state, contact.id);
  const customValues = fields
    .map((field) => ({
      label: field.label,
      value: fieldValueText(contact.custom_fields[field.key]),
    }))
    .filter((item) => item.value)
    .slice(0, 2);
  return (
    <Link
      href={`/crm/${contact.id}${demoSuffix}`}
      className="block border-b border-black/5 p-3 last:border-0 hover:bg-[#F9FBFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
    >
      <div className="flex items-start gap-2.5">
        <CrmAvatar name={contact.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-medium text-brand-blue">
              {contact.name}
            </p>
            <ArrowRightIcon size={14} />
          </div>
          <p className="mt-0.5 truncate text-[10px] text-ink-muted">
            {contact.email ?? contact.phone ?? "No contact details"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {stage ? <StageBadge name={stage.name} kind={stage.kind} /> : null}
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="rounded-[4px] bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
          {customValues.length ? (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {customValues.map((item) => (
                <p
                  key={item.label}
                  className="max-w-[150px] truncate text-[10px] text-ink-muted"
                >
                  <span>{item.label}</span>{" "}
                  <span className="font-medium text-ink">{item.value}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-black/5 pt-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.05em] text-ink-muted">Last work</p>
          <p className="mt-0.5 truncate text-[11px] text-ink">
            {work.last?.service ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.05em] text-ink-muted">Billed</p>
          <p className="mt-0.5 text-[11px] tabular-nums text-ink">
            {formatCrmMoney(work.billed)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.05em] text-ink-muted">Due</p>
          <p
            className={`mt-0.5 text-[11px] font-medium tabular-nums ${
              work.outstanding > 0 ? "text-red-700" : "text-brand-green-deep"
            }`}
          >
            {work.outstanding > 0 ? formatCrmMoney(work.outstanding) : "Settled"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function LedgerRow({
  entry,
  contact,
  demoSuffix,
  onCreateInvoice,
  onViewInvoice,
}: {
  entry: CrmServiceEntry;
  contact: CrmContact | undefined;
  demoSuffix: string;
  onCreateInvoice: (entry: CrmServiceEntry) => void;
  onViewInvoice: (entry: CrmServiceEntry) => void;
}) {
  const balance = Math.max(0, entry.billed - entry.paid);
  return (
    <tr className="border-b border-black/5 last:border-0 hover:bg-[#F9FBFE]">
      <td className="px-3 py-2.5">
        <p className="max-w-[250px] truncate text-[12px] font-medium text-ink">
          {entry.service}
        </p>
        {entry.notes ? (
          <p className="mt-0.5 max-w-[310px] truncate text-[10px] text-ink-muted">
            {entry.notes}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2.5">
        {contact ? (
          <Link
            href={`/crm/${contact.id}${demoSuffix}`}
            className="text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            {contact.name}
          </Link>
        ) : (
          <span className="text-[11px] text-ink-muted">Deleted client</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-ink-muted">
        {formatCrmDate(`${entry.entry_date}T00:00:00`)}
      </td>
      <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-ink">
        {formatCrmMoney(entry.billed)}
      </td>
      <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-brand-green-deep">
        {formatCrmMoney(entry.paid)}
      </td>
      <td className="px-3 py-2.5 text-right text-[11px] font-medium tabular-nums text-ink">
        {formatCrmMoney(balance)}
      </td>
      <td className="px-3 py-2.5">
        <PaymentBadge status={serviceStatus(entry)} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {entry.invoice ? (
            <button
              type="button"
              onClick={() => onViewInvoice(entry)}
              className="text-[10px] font-medium tabular-nums text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {entry.invoice.number}
            </button>
          ) : contact ? (
            <button
              type="button"
              onClick={() => onCreateInvoice(entry)}
              className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Create bill
            </button>
          ) : null}
          {contact ? (
            <Link
              href={`/crm/${contact.id}${demoSuffix}`}
              aria-label={`Open ${contact.name}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <ArrowRightIcon size={14} />
            </Link>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function LedgerCard({
  entry,
  contact,
  demoSuffix,
  onCreateInvoice,
  onViewInvoice,
}: {
  entry: CrmServiceEntry;
  contact: CrmContact | undefined;
  demoSuffix: string;
  onCreateInvoice: (entry: CrmServiceEntry) => void;
  onViewInvoice: (entry: CrmServiceEntry) => void;
}) {
  const balance = Math.max(0, entry.billed - entry.paid);
  return (
    <div className="border-b border-black/5 p-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-ink">{entry.service}</p>
          <p className="mt-0.5 truncate text-[10px] text-ink-muted">
            {formatCrmDate(`${entry.entry_date}T00:00:00`)}
            {contact ? ` · ${contact.name}` : ""}
          </p>
        </div>
        <PaymentBadge status={serviceStatus(entry)} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex gap-4 text-[10px] text-ink-muted">
          <span>
            Billed{" "}
            <strong className="font-medium tabular-nums text-ink">
              {formatCrmMoney(entry.billed)}
            </strong>
          </span>
          <span>
            Paid{" "}
            <strong className="font-medium tabular-nums text-brand-green-deep">
              {formatCrmMoney(entry.paid)}
            </strong>
          </span>
        </div>
        <span className="text-[11px] font-medium tabular-nums text-ink">
          {formatCrmMoney(balance)} due
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {contact ? (
          <Link
            href={`/crm/${contact.id}${demoSuffix}`}
            className="inline-flex text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Open client record
          </Link>
        ) : null}
        {entry.invoice ? (
          <button
            type="button"
            onClick={() => onViewInvoice(entry)}
            className="text-[10px] font-medium tabular-nums text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            View {entry.invoice.number}
          </button>
        ) : contact ? (
          <button
            type="button"
            onClick={() => onCreateInvoice(entry)}
            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Create invoice
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CrmList() {
  const { state, limits, update, demoSuffix, plan } = useCrmWorkspace();
  const [view, setView] = useState<View>("contacts");
  const [modal, setModal] = useState<"add" | "import" | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [paymentQuery, setPaymentQuery] = useState("");
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceEntry, setInvoiceEntry] = useState<CrmServiceEntry | null>(null);
  const [invoiceView, setInvoiceView] = useState<CrmServiceEntry | null>(null);

  const stats = useMemo(() => (state ? crmStats(state) : null), [state]);
  const contacts = useMemo(
    () => (state ? state.contacts.filter((contact) => !contact.deleted_at) : []),
    [state],
  );
  const visibleFields = useMemo(
    () =>
      state
        ? state.config.fields.filter(
            (field) => !field.archived && field.show_in_list,
          )
        : [],
    [state],
  );
  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );
  const entries = useMemo(
    () =>
      state
        ? state.service_entries
            .filter((entry) => !entry.deleted_at)
            .slice()
            .sort((a, b) => {
              if (a.entry_date !== b.entry_date) {
                return b.entry_date.localeCompare(a.entry_date);
              }
              return b.created_at.localeCompare(a.created_at);
            })
        : [],
    [state],
  );

  const filteredContacts = useMemo(() => {
    if (!state) return [];
    const search = query.trim().toLowerCase();
    const result = contacts.filter((contact) => {
      if (stageFilter !== "all" && contact.stage_id !== stageFilter) return false;
      if (!search) return true;
      const text = [
        contact.name,
        contact.email,
        contact.phone,
        contact.company,
        ...state.config.fields
          .filter((field) => !field.archived)
          .map((field) => fieldValueText(contact.custom_fields[field.key])),
        ...contactTags(state, contact.id).map((tag) => tag.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(search);
    });
    return result.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.last_activity_at ?? b.updated_at).getTime() -
          new Date(a.last_activity_at ?? a.updated_at).getTime(),
    );
  }, [state, contacts, query, stageFilter, sort]);

  const filteredEntries = useMemo(() => {
    const search = paymentQuery.trim().toLowerCase();
    if (!search) return entries;
    return entries.filter((entry) => {
      const contact = contactMap.get(entry.contact_id);
      return [entry.service, entry.notes, contact?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [entries, paymentQuery, contactMap]);

  const invoices = useMemo(
    () => (state ? invoicesFor(state) : []),
    [state],
  );
  const invoiceStats = useMemo(
    () => (state ? crmInvoiceStats(state) : null),
    [state],
  );
  const filteredInvoices = useMemo(() => {
    const search = invoiceQuery.trim().toLowerCase();
    if (!search) return invoices;
    return invoices.filter((entry) => {
      const contact = contactMap.get(entry.contact_id);
      return [
        entry.invoice?.number ?? "",
        entry.service,
        contact?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [invoices, invoiceQuery, contactMap]);

  if (!state || !limits || !stats || !invoiceStats) return <CrmLoading />;

  const activeClients =
    stats.byStage.find((row) => row.stage.kind === "won")?.count ?? 0;
  const conversion = stats.total ? Math.round((activeClients / stats.total) * 100) : 0;
  const hasFilters = Boolean(query) || stageFilter !== "all";
  const today = todayKey(new Date());

  function exportCsv() {
    if (!state) return;
    downloadCsv(
      `contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      contactsToCsv(state),
    );
  }

  function openInvoiceFor(entry: CrmServiceEntry | null) {
    setInvoiceView(null);
    setInvoiceEntry(entry);
    setInvoiceOpen(true);
  }

  function closeInvoiceForm() {
    setInvoiceOpen(false);
    setInvoiceEntry(null);
  }

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] bg-[#F4F6F9] sm:-mx-6">
      <header className="border-b border-black/10 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-brand-blue text-white">
              <CrmIcon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                Syehere CRM
              </p>
              <h1 className="truncate text-[21px] font-medium leading-tight text-ink">
                Contacts
              </h1>
              <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                {stats.total} client{stats.total === 1 ? "" : "s"} ·{" "}
                {stats.services.count} work record
                {stats.services.count === 1 ? "" : "s"} ·{" "}
                {invoiceStats.count} invoice{invoiceStats.count === 1 ? "" : "s"} ·{" "}
                {plan.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/crm/settings${demoSuffix}`}
              className={TOP_ACTION}
              aria-label="CRM settings"
              title="CRM settings"
            >
              <SettingsIcon size={14} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => setModal("import")}
              className={TOP_ACTION}
            >
              <UploadIcon size={14} />
              Import
            </button>
            <button
              type="button"
              onClick={() => setServiceOpen(true)}
              disabled={contacts.length === 0}
              className={`${TOP_ACTION} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <PlusIcon size={14} />
              Log work
            </button>
            <button
              type="button"
              onClick={() => openInvoiceFor(null)}
              disabled={contacts.length === 0}
              className={`${TOP_ACTION} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <PlusIcon size={14} />
              Invoice
            </button>
            <Button
              onClick={() => setModal("add")}
              className="h-9 px-3 text-[12px]"
            >
              <PlusIcon size={14} />
              New contact
            </Button>
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <CrmTabs
            items={VIEW_ITEMS.map((item) => ({
              ...item,
              count:
                item.id === "contacts"
                  ? stats.total
                  : item.id === "payments"
                    ? stats.services.count
                    : item.id === "invoices"
                      ? invoiceStats.count
                      : stats.total,
            }))}
            active={view}
            onChange={setView}
            label="CRM views"
          />
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {notice ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-brand-green/20 bg-brand-green/5 px-4 py-2.5 text-[12px] text-ink"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-black/10 bg-black/10 lg:grid-cols-5">
          <CrmMetric
            label="Total clients"
            value={String(stats.total)}
            hint={`${stats.new30} new in the last 30 days`}
          />
          <CrmMetric
            label="Billed"
            value={formatCrmMoney(stats.services.billed)}
            hint={`${stats.services.count} work records`}
          />
          <CrmMetric
            label="Collected"
            value={formatCrmMoney(stats.services.paid)}
            valueClassName="text-brand-green-deep"
            hint="Payments received"
          />
          <CrmMetric
            label="Outstanding"
            value={formatCrmMoney(stats.services.outstanding)}
            valueClassName={stats.services.outstanding ? "text-red-700" : "text-brand-green-deep"}
            hint={`${stats.services.unpaid} record${stats.services.unpaid === 1 ? "" : "s"} with a balance`}
          />
          <CrmMetric
            label="Active clients"
            value={String(activeClients)}
            hint={`${conversion}% of all clients`}
            valueClassName="text-brand-blue"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {view === "contacts" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[14px] font-medium text-ink">All contacts</h2>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  Showing {filteredContacts.length} of {contacts.length}
                  {hasFilters ? " · filtered" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStageFilter("all");
                      setQuery("");
                    }}
                    className="text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Clear filters
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setColumnsOpen(true)}
                  title="Add a custom column"
                  className="inline-flex h-8 items-center gap-1.5 rounded-control border border-black/15 bg-white px-2 text-[11px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  <PlusIcon size={13} />
                  Add column
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={contacts.length === 0}
                  className="inline-flex h-8 items-center gap-1.5 rounded-control border border-black/15 bg-white px-2 text-[11px] text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  <DownloadIcon size={13} />
                  Export
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-b border-black/5 bg-[#FBFCFE] px-3 py-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
                  <SearchIcon size={14} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, phone or tag"
                  aria-label="Search contacts"
                  className="h-9 w-full rounded-control border border-black/15 bg-white pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                  aria-label="Filter by stage"
                  className={SELECT}
                >
                  <option value="all">All stages</option>
                  {state.config.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "recent" | "name")
                  }
                  aria-label="Sort contacts"
                  className={SELECT}
                >
                  <option value="recent">Recently active</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            {contacts.length === 0 ? (
              <CrmEmptyState
                title="No contacts yet"
                description="Add your first client, or import the list you already keep in a spreadsheet."
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setModal("add")}>
                      <PlusIcon size={15} />
                      New contact
                    </Button>
                    <Button variant="secondary" onClick={() => setModal("import")}>
                      <UploadIcon size={15} />
                      Import CSV
                    </Button>
                  </div>
                }
              />
            ) : filteredContacts.length === 0 ? (
              <CrmEmptyState
                title="No contacts match"
                description="Try a different search, or clear the stage filter."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table
                    className="w-full border-collapse text-left"
                    style={{ minWidth: `${840 + visibleFields.length * 150}px` }}
                  >
                    <thead className="bg-white">
                      <tr className="border-b border-black/5">
                        <th className={TH}>Contact</th>
                        <th className={TH}>Stage</th>
                        {visibleFields.map((field) => (
                          <th key={field.key} className={TH} title={field.label}>
                            <span className="block max-w-[150px] truncate">
                              {field.label}
                            </span>
                          </th>
                        ))}
                        <th className={TH}>Last work</th>
                        <th className={`${TH} text-right`}>Billed</th>
                        <th className={`${TH} text-right`}>Outstanding</th>
                        <th className={TH}>Tasks</th>
                        <th className={TH}>
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <ContactRow
                          key={contact.id}
                          contact={contact}
                          state={state}
                          demoSuffix={demoSuffix}
                          fields={visibleFields}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">
                  {filteredContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      state={state}
                      demoSuffix={demoSuffix}
                      fields={visibleFields}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}

        {view === "pipeline" ? (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-medium text-ink">Pipeline</h2>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Every stage is defined by you. Values come from logged work.
                </p>
              </div>
              <Link
                href={`/crm/settings${demoSuffix}`}
                className="text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Manage stages
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-3">
                {state.config.stages.map((stage) => {
                  const items = contacts
                    .filter((contact) => contact.stage_id === stage.id)
                    .sort((a, b) => {
                      const aWork = crmServiceStats(state, a.id);
                      const bWork = crmServiceStats(state, b.id);
                      return bWork.billed - aWork.billed;
                    });
                  const stageValue = items.reduce(
                    (sum, contact) =>
                      sum + crmServiceStats(state, contact.id).billed,
                    0,
                  );
                  return (
                    <section
                      key={stage.id}
                      className="w-[264px] shrink-0 overflow-hidden rounded-card border border-black/10 bg-[#F8FAFC]"
                      aria-label={`${stage.name} stage`}
                    >
                      <div className="border-b border-black/10 bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                stage.kind === "won"
                                  ? "bg-brand-green"
                                  : stage.kind === "lost"
                                    ? "bg-red-500"
                                    : "bg-brand-blue"
                              }`}
                            />
                            <span className="truncate text-[11px] font-medium text-ink">
                              {stage.name}
                            </span>
                          </span>
                          <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] tabular-nums text-ink-muted">
                            {items.length}
                          </span>
                        </div>
                        <p className={`mt-0.5 text-[10px] tabular-nums ${stageKindTone(stage.kind)}`}>
                          {formatCrmMoney(stageValue)} billed
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 p-2">
                        {items.map((contact) => {
                          const work = crmServiceStats(state, contact.id);
                          return (
                            <Link
                              key={contact.id}
                              href={`/crm/${contact.id}${demoSuffix}`}
                              className="rounded-control border border-black/10 bg-white p-2.5 shadow-[0_1px_1px_rgba(15,23,42,0.03)] hover:border-brand-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              <div className="flex items-start gap-2">
                                <CrmAvatar name={contact.name} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[12px] font-medium text-ink">
                                    {contact.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-[10px] text-ink-muted">
                                    {work.last?.service ?? contact.email ?? contact.phone ?? "No details"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/5 pt-2">
                                <span className="text-[10px] tabular-nums text-ink-muted">
                                  {formatCrmMoney(work.billed)}
                                </span>
                                <span
                                  className={`text-[10px] font-medium tabular-nums ${
                                    work.outstanding > 0
                                      ? "text-red-700"
                                      : "text-brand-green-deep"
                                  }`}
                                >
                                  {work.outstanding > 0
                                    ? `${formatCrmMoney(work.outstanding)} due`
                                    : "Settled"}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                        {items.length === 0 ? (
                          <p className="px-2 py-8 text-center text-[10px] text-ink-muted">
                            No contacts in this stage.
                          </p>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {view === "payments" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[14px] font-medium text-ink">Work & payments</h2>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  What was done, what it cost, and what the client paid — across every client.
                </p>
              </div>
              <Button
                onClick={() => setServiceOpen(true)}
                disabled={contacts.length === 0}
                className="h-9 px-3 text-[12px]"
              >
                <PlusIcon size={14} />
                Log work
              </Button>
            </div>
            <div className="border-b border-black/5 bg-[#FBFCFE] px-3 py-2">
              <div className="relative max-w-md">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
                  <SearchIcon size={14} />
                </span>
                <input
                  type="search"
                  value={paymentQuery}
                  onChange={(event) => setPaymentQuery(event.target.value)}
                  placeholder="Search work, note or client"
                  aria-label="Search work and payments"
                  className="h-9 w-full rounded-control border border-black/15 bg-white pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </div>
            </div>
            {entries.length === 0 ? (
              <CrmEmptyState
                title="No work logged yet"
                description="Record the first service, sale or session along with its cost and payment."
                action={
                  <Button
                    onClick={() => setServiceOpen(true)}
                    disabled={contacts.length === 0}
                  >
                    <PlusIcon size={15} />
                    Log work & payment
                  </Button>
                }
              />
            ) : filteredEntries.length === 0 ? (
              <CrmEmptyState
                title="No records match"
                description="Try a different client, service or note."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className={TH}>Work</th>
                        <th className={TH}>Client</th>
                        <th className={TH}>Date</th>
                        <th className={`${TH} text-right`}>Billed</th>
                        <th className={`${TH} text-right`}>Paid</th>
                        <th className={`${TH} text-right`}>Balance</th>
                        <th className={TH}>Status</th>
                        <th className={TH}>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => (
                        <LedgerRow
                          key={entry.id}
                          entry={entry}
                          contact={contactMap.get(entry.contact_id)}
                          demoSuffix={demoSuffix}
                          onCreateInvoice={openInvoiceFor}
                          onViewInvoice={setInvoiceView}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">
                  {filteredEntries.map((entry) => (
                    <LedgerCard
                      key={entry.id}
                      entry={entry}
                      contact={contactMap.get(entry.contact_id)}
                      demoSuffix={demoSuffix}
                      onCreateInvoice={openInvoiceFor}
                      onViewInvoice={setInvoiceView}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}

        {view === "invoices" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[14px] font-medium text-ink">Invoices & bills</h2>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  {invoiceStats.count} invoice{invoiceStats.count === 1 ? "" : "s"} ·{" "}
                  {formatCrmMoney(invoiceStats.billed)} billed ·{" "}
                  {formatCrmMoney(invoiceStats.outstanding)} outstanding
                  {invoiceStats.overdue
                    ? ` · ${invoiceStats.overdue} overdue`
                    : ""}
                </p>
              </div>
              <Button
                onClick={() => openInvoiceFor(null)}
                disabled={contacts.length === 0}
                className="h-9 px-3 text-[12px]"
              >
                <PlusIcon size={14} />
                New invoice
              </Button>
            </div>
            <div className="border-b border-black/5 bg-[#FBFCFE] px-3 py-2">
              <div className="relative max-w-md">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
                  <SearchIcon size={14} />
                </span>
                <input
                  type="search"
                  value={invoiceQuery}
                  onChange={(event) => setInvoiceQuery(event.target.value)}
                  placeholder="Search invoice number, client or work"
                  aria-label="Search invoices"
                  className="h-9 w-full rounded-control border border-black/15 bg-white pl-8 pr-2 text-[12px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
              </div>
            </div>
            {invoices.length === 0 ? (
              <CrmEmptyState
                title="No invoices yet"
                description="Create a bill from an existing work record, or start a new invoice and its visit together."
                action={
                  <Button
                    onClick={() => openInvoiceFor(null)}
                    disabled={contacts.length === 0}
                  >
                    <PlusIcon size={15} />
                    New invoice
                  </Button>
                }
              />
            ) : filteredInvoices.length === 0 ? (
              <CrmEmptyState
                title="No invoices match"
                description="Try a different invoice number, client or service."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className={TH}>Invoice</th>
                        <th className={TH}>Client</th>
                        <th className={TH}>Issued</th>
                        <th className={TH}>Due</th>
                        <th className={`${TH} text-right`}>Total</th>
                        <th className={`${TH} text-right`}>Paid</th>
                        <th className={`${TH} text-right`}>Balance</th>
                        <th className={TH}>Status</th>
                        <th className={TH}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((entry) => {
                        const invoice = entry.invoice;
                        if (!invoice) return null;
                        const contact = contactMap.get(entry.contact_id);
                        const balance = Math.max(0, entry.billed - entry.paid);
                        const overdue = invoice.due_date < today && balance > 0;
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-black/5 last:border-0 hover:bg-[#F9FBFE]"
                          >
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => setInvoiceView(entry)}
                                className="text-[12px] font-medium tabular-nums text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                              >
                                {invoice.number}
                              </button>
                              <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-ink-muted">
                                {entry.service}
                              </p>
                            </td>
                            <td className="px-3 py-2.5">
                              {contact ? (
                                <Link
                                  href={`/crm/${contact.id}${demoSuffix}`}
                                  className="text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                  {contact.name}
                                </Link>
                              ) : (
                                <span className="text-[11px] text-ink-muted">Deleted client</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-ink-muted">
                              {formatCrmDate(`${invoice.issue_date}T00:00:00`)}
                            </td>
                            <td
                              className={`whitespace-nowrap px-3 py-2.5 text-[11px] ${
                                overdue ? "font-medium text-red-700" : "text-ink-muted"
                              }`}
                            >
                              {formatCrmDate(`${invoice.due_date}T00:00:00`)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-ink">
                              {formatCrmMoney(entry.billed)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-brand-green-deep">
                              {formatCrmMoney(entry.paid)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-[11px] font-medium tabular-nums text-ink">
                              {formatCrmMoney(balance)}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap items-center gap-1">
                                <PaymentBadge status={serviceStatus(entry)} />
                                {overdue ? (
                                  <span className="text-[9px] font-medium text-red-700">
                                    Overdue
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setInvoiceView(entry)}
                                className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => openInvoiceFor(entry)}
                                className="ml-3 text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">
                  {filteredInvoices.map((entry) => {
                    const invoice = entry.invoice;
                    if (!invoice) return null;
                    const contact = contactMap.get(entry.contact_id);
                    const balance = Math.max(0, entry.billed - entry.paid);
                    const overdue = invoice.due_date < today && balance > 0;
                    return (
                      <div key={entry.id} className="border-b border-black/5 p-3 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium tabular-nums text-ink">
                              {invoice.number}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-ink-muted">
                              {entry.service}
                              {contact ? ` · ${contact.name}` : ""}
                            </p>
                          </div>
                          <PaymentBadge status={serviceStatus(entry)} />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 rounded-control bg-[#F8FAFC] p-2 text-[10px]">
                          <div>
                            <p className="text-ink-muted">Total</p>
                            <p className="mt-0.5 tabular-nums text-ink">
                              {formatCrmMoney(entry.billed)}
                            </p>
                          </div>
                          <div>
                            <p className="text-ink-muted">Paid</p>
                            <p className="mt-0.5 tabular-nums text-brand-green-deep">
                              {formatCrmMoney(entry.paid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-ink-muted">Balance</p>
                            <p className="mt-0.5 tabular-nums text-ink">
                              {formatCrmMoney(balance)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] text-ink-muted">
                          Issued {formatCrmShortDate(`${invoice.issue_date}T00:00:00`)} · Due{" "}
                          {formatCrmShortDate(`${invoice.due_date}T00:00:00`)}
                          {overdue ? (
                            <span className="font-medium text-red-700"> · Overdue</span>
                          ) : null}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setInvoiceView(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            View bill
                          </button>
                          <button
                            type="button"
                            onClick={() => openInvoiceFor(entry)}
                            className="text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            Edit invoice
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>

      <Modal
        open={modal === "add"}
        title="New contact"
        onClose={() => setModal(null)}
        panelClassName="max-w-[560px]"
      >
        <ContactForm
          state={state}
          onCancel={() => setModal(null)}
          onSubmit={(draft) => {
            const result = addContact(state, draft, limits);
            if (!result.ok) return result.errors;
            update(() => result.state);
            setModal(null);
            setView("contacts");
            setNotice("Contact added.");
            return null;
          }}
        />
      </Modal>

      <Modal
        open={modal === "import"}
        title="Import contacts"
        onClose={() => setModal(null)}
        panelClassName="max-w-[620px]"
      >
        <ImportDialog
          state={state}
          limits={limits}
          onCancel={() => setModal(null)}
          onDone={(next, added, failed) => {
            update(() => next);
            setModal(null);
            setNotice(
              `Imported ${added} contact${added === 1 ? "" : "s"}${
                failed ? ` · ${failed} row${failed === 1 ? "" : "s"} skipped` : ""
              }.`,
            );
          }}
        />
      </Modal>

      <Modal
        open={columnsOpen}
        title="Add a column"
        onClose={() => setColumnsOpen(false)}
        panelClassName="max-w-[520px]"
      >
        <AddColumnDialog
          state={state}
          limits={limits}
          onCancel={() => setColumnsOpen(false)}
          onAdded={(next, label) => {
            update(() => next);
            setColumnsOpen(false);
            setNotice(`“${label}” column added.`);
          }}
        />
      </Modal>

      <Modal
        open={serviceOpen}
        title="Log work & payment"
        onClose={() => setServiceOpen(false)}
        panelClassName="max-w-[620px]"
      >
        <ServiceForm
          state={state}
          onCancel={() => setServiceOpen(false)}
          onSubmit={(draft) => {
            const result = addServiceEntry(state, draft);
            if (!result.ok) return result.errors;
            update(() => result.state);
            setServiceOpen(false);
            setView("payments");
            setNotice("Work and payment saved.");
            return null;
          }}
        />
      </Modal>

      <Modal
        open={invoiceOpen}
        title={
          invoiceEntry?.invoice
            ? "Edit invoice"
            : invoiceEntry
              ? "Create invoice"
              : "New invoice"
        }
        onClose={closeInvoiceForm}
        panelClassName="max-w-[760px]"
      >
        <InvoiceForm
          key={invoiceEntry?.id ?? "new-invoice"}
          state={state}
          initial={invoiceEntry ?? undefined}
          fixedContactId={invoiceEntry?.contact_id}
          onCancel={closeInvoiceForm}
          onSubmit={(draft) => {
            const result = saveInvoice(state, draft);
            if (!result.ok) return result.errors;
            update(() => result.state);
            closeInvoiceForm();
            setView("invoices");
            setNotice(
              result.created
                ? `Invoice ${result.invoice.number} created.`
                : `Invoice ${result.invoice.number} updated.`,
            );
            setInvoiceView(result.entry);
            return null;
          }}
        />
      </Modal>

      <InvoiceDialog
        open={Boolean(invoiceView)}
        entry={invoiceView}
        contact={
          invoiceView ? contactMap.get(invoiceView.contact_id) ?? null : null
        }
        config={state.config}
        onClose={() => setInvoiceView(null)}
        onEdit={(entry) => openInvoiceFor(entry)}
      />
    </div>
  );
}

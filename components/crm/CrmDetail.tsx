"use client";

/**
 * `/crm/[id]` — a compact CRM record page. The header carries the commercial
 * picture; tabs hold the contact details, work/payment ledger, activity and
 * follow-ups. All writes still go through lib/crm/rules.ts.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { CloseIcon, PhotoIcon, PlusIcon } from "@/components/dashboard/icons";
import { Modal } from "@/components/dashboard/modal";
import {
  addActivity,
  addServiceEntry,
  addTask,
  changeContactStage,
  generateReport,
  contactTags,
  crmServiceStats,
  deleteServiceEntry,
  deleteTask,
  fieldValueText,
  openTasksFor,
  saveInvoice,
  saveReport,
  serviceStatus,
  softDeleteContact,
  toggleTask,
  updateContact,
  updateServiceEntry,
  type CrmActivityKind,
  type CrmReportDraft,
  type CrmServiceEntry,
} from "@/lib/crm/rules";
import { CrmLoading } from "./CrmGate";
import { ContactForm } from "./ContactForm";
import { InvoiceDialog } from "./InvoiceDialog";
import { InvoiceForm } from "./InvoiceForm";
import { PatientReportDialog } from "./PatientReportDialog";
import { PhotoViewerDialog } from "./PhotoViewerDialog";
import { ReportForm } from "./ReportForm";
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
  activityLabel,
  consentLabel,
  dueLabel,
  formatCrmDate,
  formatCrmDateTime,
  formatCrmMoney,
  paymentMethodLabel,
  sourceLabel,
} from "./crm-utils";

const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

type Tab = "overview" | "work" | "reports" | "photos" | "activity" | "tasks";

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-card border border-black/10 bg-white ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[10px] text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ConsentPill({ value }: { value: string }) {
  const tone =
    value === "opted_in"
      ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
      : value === "opted_out"
        ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
        : "bg-surface-muted text-ink-muted border-black/10";
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {consentLabel(value)}
    </span>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[12px] leading-relaxed text-ink">
        {children}
      </dd>
    </div>
  );
}

export function CrmDetail({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { state, limits, update, demoSuffix } = useCrmWorkspace();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noteKind, setNoteKind] = useState<CrmActivityKind>("note");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskError, setTaskError] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CrmServiceEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CrmServiceEntry | null>(null);
  const [invoiceEntry, setInvoiceEntry] = useState<CrmServiceEntry | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceView, setInvoiceView] = useState<CrmServiceEntry | null>(null);
  const [photoView, setPhotoView] = useState<CrmServiceEntry | null>(null);
  const [reportEntry, setReportEntry] = useState<CrmServiceEntry | null>(null);
  const [reportEditorOpen, setReportEditorOpen] = useState(false);
  const [reportView, setReportView] = useState<CrmServiceEntry | null>(null);

  if (!state || !limits) return <CrmLoading />;

  const contact = state.contacts.find(
    (item) => item.id === contactId && !item.deleted_at,
  );
  if (!contact) {
    return (
      <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] bg-[#F4F6F9] p-4 sm:-mx-6 sm:p-6">
        <div className="rounded-card border border-black/10 bg-white p-8 text-center">
          <h1 className="text-[18px] font-medium text-ink">Contact not found</h1>
          <p className="mt-1 text-[12px] text-ink-muted">
            This contact may have been deleted, or the link is out of date.
          </p>
          <Link
            href={`/crm${demoSuffix}`}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-control bg-brand-blue px-3 text-[12px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Back to contacts
          </Link>
        </div>
      </div>
    );
  }

  const tags = contactTags(state, contact.id);
  const fields = state.config.fields.filter((field) => !field.archived);
  const activities = state.activities
    .filter(
      (activity) => activity.contact_id === contact.id && !activity.deleted_at,
    )
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const tasks = state.tasks
    .filter((task) => task.contact_id === contact.id)
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return a.due_on.localeCompare(b.due_on);
    });
  const serviceEntries = state.service_entries
    .filter(
      (entry) => entry.contact_id === contact.id && !entry.deleted_at,
    )
    .slice()
    .sort((a, b) => {
      if (a.entry_date !== b.entry_date) return b.entry_date.localeCompare(a.entry_date);
      return b.created_at.localeCompare(a.created_at);
    });
  const work = crmServiceStats(state, contact.id);
  const openCount = openTasksFor(state, contact.id).length;
  const stage = state.config.stages.find((item) => item.id === contact.stage_id);
  const latestWork = serviceEntries[0] ?? null;
  const photoEntries = serviceEntries.filter(
    (entry) => entry.before_photo || entry.after_photo,
  );
  const reportEntries = serviceEntries.filter((entry) => entry.report);
  const invoicedCount = serviceEntries.filter((entry) => entry.invoice).length;
  const pipelineEnabled = state.config.modules.pipeline;
  const tasksEnabled = state.config.modules.tasks;
  const tagsEnabled = state.config.modules.tags;

  // Kept non-null for the handlers below.
  const currentContact = contact;
  const currentState = state;
  const currentLimits = limits;

  const tabItems: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "work", label: "Work & payments", count: serviceEntries.length },
    { id: "reports", label: "Reports", count: reportEntries.length },
    { id: "photos", label: "Photos", count: photoEntries.length },
    { id: "activity", label: "Activity", count: activities.length },
    ...(tasksEnabled
      ? [{ id: "tasks" as const, label: "Tasks", count: openCount }]
      : []),
  ];

  function moveStage(stageId: string) {
    const result = changeContactStage(currentState, currentContact.id, stageId);
    if (result.ok) update(() => result.state);
  }

  function addNote() {
    const result = addActivity(currentState, currentContact.id, noteKind, note);
    if (!result.ok) {
      setNoteError(result.error);
      return;
    }
    update(() => result.state);
    setNote("");
    setNoteError("");
    setNotice("Activity added.");
  }

  function createTask() {
    const result = addTask(
      currentState,
      currentContact.id,
      taskTitle,
      taskDue || null,
      currentLimits,
    );
    if (!result.ok) {
      setTaskError(result.error);
      return;
    }
    update(() => result.state);
    setTaskTitle("");
    setTaskDue("");
    setTaskError("");
  }

  function openNewWork() {
    setEditingEntry(null);
    setServiceOpen(true);
  }

  function openEditWork(entry: CrmServiceEntry) {
    setEditingEntry(entry);
    setServiceOpen(true);
  }

  function saveWork(draft: Parameters<typeof addServiceEntry>[1]) {
    const result = editingEntry
      ? updateServiceEntry(currentState, editingEntry.id, draft)
      : addServiceEntry(currentState, draft);
    if (!result.ok) return result.errors;
    update(() => result.state);
    setServiceOpen(false);
    setEditingEntry(null);
    setTab("work");
    setNotice(editingEntry ? "Work & payment updated." : "Work & payment added.");
    return null;
  }

  function openInvoiceFor(entry: CrmServiceEntry | null) {
    setInvoiceView(null);
    setInvoiceEntry(entry);
    setInvoiceOpen(true);
  }

  function openReportEditor(entry: CrmServiceEntry) {
    setReportView(null);
    setReportEntry(entry);
    setReportEditorOpen(true);
  }

  function generateReportFor(entry: CrmServiceEntry) {
    const result = generateReport(currentState, entry.id);
    if (!result.ok) {
      setNotice(
        result.errors.doctor_name ||
          result.errors.report ||
          "Could not generate this report. Check the visit and report settings.",
      );
      return;
    }
    update(() => result.state);
    setTab("reports");
    setNotice(
      `Report ${result.report.number} generated. Add details and client consent before sharing.`,
    );
    setReportView(result.entry);
  }

  function saveReportDraft(draft: CrmReportDraft) {
    if (!reportEntry) return { entry: "That visit was not found." };
    const result = saveReport(currentState, reportEntry.id, draft);
    if (!result.ok) return result.errors;
    update(() => result.state);
    setReportEditorOpen(false);
    setReportEntry(null);
    setTab("reports");
    setNotice(
      result.created
        ? `Report ${result.report.number} generated.`
        : `Report ${result.report.number} updated.`,
    );
    setReportView(result.entry);
    return null;
  }

  function saveInvoiceDraft(draft: Parameters<typeof saveInvoice>[1]) {
    const result = saveInvoice(currentState, draft);
    if (!result.ok) return result.errors;
    update(() => result.state);
    setInvoiceOpen(false);
    setInvoiceEntry(null);
    setTab("work");
    setNotice(
      result.created
        ? `Invoice ${result.invoice.number} created.`
        : `Invoice ${result.invoice.number} updated.`,
    );
    setInvoiceView(result.entry);
    return null;
  }

  function confirmDeleteWork() {
    if (!deletingEntry) return;
    const result = deleteServiceEntry(currentState, deletingEntry.id);
    if (result.ok) {
      update(() => result.state);
      setDeletingEntry(null);
      setNotice("Work record removed.");
    }
  }

  function confirmDelete() {
    const result = softDeleteContact(currentState, currentContact.id);
    if (result.ok) {
      update(() => result.state);
      router.push(`/crm${demoSuffix}`);
    }
  }

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] bg-[#F4F6F9] sm:-mx-6">
      <header className="border-b border-black/10 bg-white">
        <div className="px-4 pt-3 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[10px] text-ink-muted"
          >
            <Link
              href={`/crm${demoSuffix}`}
              className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Contacts
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate">{contact.name}</span>
          </nav>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <CrmAvatar name={contact.name} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[21px] font-medium leading-tight text-ink">
                    {contact.name}
                  </h1>
                  {stage ? <StageBadge name={stage.name} kind={stage.kind} /> : null}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      {contact.email}
                    </a>
                  ) : null}
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      {contact.phone}
                    </a>
                  ) : null}
                  {contact.company ? <span>{contact.company}</span> : null}
                  <span>Client since {formatCrmDate(contact.created_at)}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <ConsentPill value={contact.consent_status} />
                  {tagsEnabled
                    ? tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-[4px] bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted"
                        >
                          {tag.name}
                        </span>
                      ))
                    : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditing(true)}
                className="h-9 px-3 text-[12px]"
              >
                Edit
              </Button>
              <Button onClick={openNewWork} className="h-9 px-3 text-[12px]">
                <PlusIcon size={14} />
                Log work & payment
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-t-card border border-b-0 border-black/10 bg-black/10 lg:grid-cols-4">
            <CrmMetric
              label="Lifetime billed"
              value={formatCrmMoney(work.billed)}
              hint={`${work.count} work record${work.count === 1 ? "" : "s"}`}
            />
            <CrmMetric
              label="Collected"
              value={formatCrmMoney(work.paid)}
              valueClassName="text-brand-green-deep"
              hint="Payments received"
            />
            <CrmMetric
              label="Outstanding"
              value={formatCrmMoney(work.outstanding)}
              valueClassName={work.outstanding ? "text-red-700" : "text-brand-green-deep"}
              hint={work.outstanding ? "Needs follow-up" : "Nothing due"}
            />
            <CrmMetric
              label="Last work"
              value={latestWork ? latestWork.service : "No work yet"}
              hint={
                latestWork
                  ? formatCrmDate(`${latestWork.entry_date}T00:00:00`)
                  : "Log the first service"
              }
            />
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <CrmTabs
            items={tabItems}
            active={tab}
            onChange={setTab}
            label="Contact record"
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

        {tab === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <div className="flex flex-col gap-4">
              <Panel
                title="Contact information"
                action={
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Edit details
                  </button>
                }
              >
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailItem label="Email">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                  <DetailItem label="Phone">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        {contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                  <DetailItem label="Company">{contact.company ?? "—"}</DetailItem>
                  <DetailItem label="Added via">{sourceLabel(contact.source)}</DetailItem>
                  <DetailItem label="Consent recorded">
                    {contact.consent_at ? formatCrmDate(contact.consent_at) : "—"}
                  </DetailItem>
                  <DetailItem label="Last activity">
                    {formatCrmDateTime(contact.last_activity_at)}
                  </DetailItem>
                </dl>
              </Panel>

              <Panel
                title="Business details"
                description="Fields you defined in CRM settings."
                action={
                  <Link
                    href={`/crm/settings${demoSuffix}`}
                    className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    Manage fields
                  </Link>
                }
              >
                {fields.length ? (
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {fields.map((field) => (
                      <DetailItem key={field.key} label={field.label}>
                        {fieldValueText(contact.custom_fields[field.key]) || "—"}
                      </DetailItem>
                    ))}
                  </dl>
                ) : (
                  <p className="text-[12px] text-ink-muted">
                    No custom fields yet. Add them in CRM settings to capture
                    details that matter to your business.
                  </p>
                )}
              </Panel>

              <div className="rounded-card border border-red-200 bg-white p-4">
                <p className="text-[12px] font-medium text-ink">Delete this contact</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Removes the contact from the list and pipeline. Work records stay
                  in the mock data but are no longer shown.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  className="mt-2 text-[11px] font-medium text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Delete contact
                </button>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              {pipelineEnabled ? (
                <Panel title="Pipeline">
                  <div className="flex items-center gap-2">
                    {stage ? <StageBadge name={stage.name} kind={stage.kind} /> : null}
                  </div>
                  <div className="mt-3">
                    <Select
                      label="Move to stage"
                      value={contact.stage_id}
                      onChange={(event) => moveStage(event.target.value)}
                    >
                      {state.config.stages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Panel>
              ) : null}

              <Panel
                title="Latest work"
                action={
                  <button
                    type="button"
                    onClick={() => setTab("work")}
                    className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    View all
                  </button>
                }
              >
                {latestWork ? (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-medium text-ink">
                        {latestWork.service}
                      </p>
                      <PaymentBadge status={serviceStatus(latestWork)} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {formatCrmDate(`${latestWork.entry_date}T00:00:00`)} ·{" "}
                      {paymentMethodLabel(latestWork.payment_method)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-2 text-[11px]">
                      <span className="text-ink-muted">
                        Billed{" "}
                        <strong className="font-medium tabular-nums text-ink">
                          {formatCrmMoney(latestWork.billed)}
                        </strong>
                      </span>
                      <span className="text-right text-ink-muted">
                        Balance{" "}
                        <strong className="font-medium tabular-nums text-ink">
                          {formatCrmMoney(
                            Math.max(0, latestWork.billed - latestWork.paid),
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[12px] text-ink-muted">
                      Nothing logged yet. Add what you did, the cost and what the
                      client paid.
                    </p>
                    <Button
                      onClick={openNewWork}
                      className="mt-3 h-8 px-2.5 text-[11px]"
                    >
                      <PlusIcon size={13} />
                      Log work
                    </Button>
                  </div>
                )}
              </Panel>

              {tasksEnabled ? (
                <Panel
                  title="Open tasks"
                  description={`${openCount} open`}
                  action={
                    <button
                      type="button"
                      onClick={() => setTab("tasks")}
                      className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      Manage
                    </button>
                  }
                >
                  {openCount ? (
                    <ul className="flex flex-col gap-2">
                      {tasks
                        .filter((task) => task.status === "open")
                        .slice(0, 3)
                        .map((task) => (
                          <li key={task.id} className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] text-ink">{task.title}</p>
                              <p className="text-[10px] text-ink-muted">
                                {dueLabel(task.due_on)}
                              </p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-ink-muted">
                      No open follow-ups. Create one when the next step is clear.
                    </p>
                  )}
                </Panel>
              ) : null}
            </aside>
          </div>
        ) : null}

        {tab === "work" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-medium text-ink">Work & payments</h2>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  {serviceEntries.length} record{serviceEntries.length === 1 ? "" : "s"} ·{" "}
                  {formatCrmMoney(work.billed)} billed ·{" "}
                  {formatCrmMoney(work.outstanding)} outstanding · {invoicedCount}{" "}
                  invoiced
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => openInvoiceFor(null)}
                  className="h-9 px-3 text-[12px]"
                >
                  New invoice
                </Button>
                <Button onClick={openNewWork} className="h-9 px-3 text-[12px]">
                  <PlusIcon size={14} />
                  Add work & payment
                </Button>
              </div>
            </div>

            {serviceEntries.length === 0 ? (
              <CrmEmptyState
                title="No work logged yet"
                description="Record the first service, session or sale with its cost and payment."
                action={
                  <Button onClick={openNewWork}>
                    <PlusIcon size={15} />
                    Add work & payment
                  </Button>
                }
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Date
                        </th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Work
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Billed
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Paid
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Balance
                        </th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Status
                        </th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Photos
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceEntries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-black/5 last:border-0 hover:bg-[#F9FBFE]"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-ink-muted">
                            {formatCrmDate(`${entry.entry_date}T00:00:00`)}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="max-w-[300px] truncate text-[12px] font-medium text-ink">
                              {entry.service}
                            </p>
                            {entry.notes ? (
                              <p className="mt-0.5 max-w-[360px] truncate text-[10px] text-ink-muted">
                                {entry.notes}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-ink">
                            {formatCrmMoney(entry.billed)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-brand-green-deep">
                            {formatCrmMoney(entry.paid)}
                            <span className="mt-0.5 block text-[9px] text-ink-muted">
                              {paymentMethodLabel(entry.payment_method)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-medium tabular-nums text-ink">
                            {formatCrmMoney(Math.max(0, entry.billed - entry.paid))}
                          </td>
                          <td className="px-3 py-2.5">
                            <PaymentBadge status={serviceStatus(entry)} />
                          </td>
                          <td className="px-3 py-2.5">
                            {entry.before_photo || entry.after_photo ? (
                              <button
                                type="button"
                                onClick={() => setPhotoView(entry)}
                                aria-label={`View before and after photos for ${entry.service}`}
                                className="flex items-center gap-1 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                              >
                                {entry.before_photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={entry.before_photo}
                                    alt=""
                                    className="h-7 w-7 rounded-[4px] border border-black/10 object-cover"
                                  />
                                ) : null}
                                {entry.after_photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={entry.after_photo}
                                    alt=""
                                    className="h-7 w-7 rounded-[4px] border border-black/10 object-cover"
                                  />
                                ) : null}
                                <span className="ml-0.5 text-[10px] font-medium text-brand-blue">
                                  View
                                </span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-ink-muted">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {entry.invoice ? (
                                <button
                                  type="button"
                                  onClick={() => setInvoiceView(entry)}
                                  className="text-[10px] font-medium tabular-nums text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                  {entry.invoice.number}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openInvoiceFor(entry)}
                                  className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                  Bill
                                </button>
                              )}
                              {entry.report ? (
                                <button
                                  type="button"
                                  onClick={() => setReportView(entry)}
                                  title={`View report ${entry.report.number}`}
                                  className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                  Report
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => generateReportFor(entry)}
                                  className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                >
                                  Generate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditWork(entry)}
                                className="text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingEntry(entry)}
                                className="text-[10px] font-medium text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">
                  {serviceEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-b border-black/5 p-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-ink">
                            {entry.service}
                          </p>
                          <p className="mt-0.5 text-[10px] text-ink-muted">
                            {formatCrmDate(`${entry.entry_date}T00:00:00`)} ·{" "}
                            {paymentMethodLabel(entry.payment_method)}
                          </p>
                        </div>
                        <PaymentBadge status={serviceStatus(entry)} />
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 rounded-control bg-[#F8FAFC] p-2 text-[10px]">
                        <div>
                          <p className="text-ink-muted">Billed</p>
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
                            {formatCrmMoney(Math.max(0, entry.billed - entry.paid))}
                          </p>
                        </div>
                      </div>
                      {entry.notes ? (
                        <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                          {entry.notes}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {entry.before_photo || entry.after_photo ? (
                          <button
                            type="button"
                            onClick={() => setPhotoView(entry)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            <PhotoIcon size={12} />
                            Photos
                          </button>
                        ) : null}
                        {entry.invoice ? (
                          <button
                            type="button"
                            onClick={() => setInvoiceView(entry)}
                            className="text-[10px] font-medium tabular-nums text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            {entry.invoice.number}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openInvoiceFor(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            Create invoice
                          </button>
                        )}
                        {entry.report ? (
                          <button
                            type="button"
                            onClick={() => setReportView(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            View report
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => generateReportFor(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            Generate report
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditWork(entry)}
                          className="text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEntry(entry)}
                          className="text-[10px] font-medium text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}

        {tab === "reports" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-medium text-ink">
                  Reports & plans
                </h2>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  {reportEntries.length} report{reportEntries.length === 1 ? "" : "s"}{" "}
                  · one report per visit · private until shared
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/crm/settings${demoSuffix}`}
                  className="text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Report settings
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => setTab("work")}
                  className="h-9 px-3 text-[12px]"
                >
                  View visits
                </Button>
              </div>
            </div>
            <p className="border-b border-black/5 bg-[#FBFCFE] px-4 py-2 text-[10px] leading-relaxed text-ink-muted">
              Provider details, signature and approval wording come from CRM
              settings. Add the visit details, plan and before/after photos; the
              client copy can be printed as PDF or shared as a private file.
            </p>
            {serviceEntries.length === 0 ? (
              <CrmEmptyState
                title="No visits to report on"
                description="Log the consultation or treatment first, then generate its report."
                action={
                  <Button onClick={openNewWork}>
                    <PlusIcon size={15} />
                    Log a visit
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-black/5">
                {serviceEntries.map((entry) => {
                  const report = entry.report;
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12px] font-medium text-ink">
                            {entry.service}
                          </p>
                          {report ? (
                            <span className="rounded-[4px] border border-brand-blue/20 bg-brand-blue/[0.06] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-brand-blue">
                              {report.number}
                            </span>
                          ) : (
                            <span className="rounded-[4px] border border-black/10 bg-surface-muted px-1.5 py-0.5 text-[9px] text-ink-muted">
                              No report yet
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {formatCrmDate(`${entry.entry_date}T00:00:00`)}
                          {report?.doctor_name
                            ? ` · ${report.doctor_name}`
                            : " · Provider not recorded"}
                        </p>
                        {report?.diagnosis ? (
                          <p className="mt-1 max-w-[680px] truncate text-[10px] text-ink-muted">
                            {report.diagnosis}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        {report ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setReportView(entry)}
                              className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              View report
                            </button>
                            <button
                              type="button"
                              onClick={() => openReportEditor(entry)}
                              className="text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              Edit
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => generateReportFor(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            Generate report
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {tab === "photos" ? (
          <section className="overflow-hidden rounded-card border border-black/10 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-ink-muted">
                  <PhotoIcon size={16} />
                </span>
                <div>
                  <h2 className="text-[13px] font-medium text-ink">
                    Before / after photos
                  </h2>
                  <p className="mt-0.5 text-[10px] text-ink-muted">
                    {photoEntries.length} visit{photoEntries.length === 1 ? "" : "s"}{" "}
                    with photos · private to your workspace
                  </p>
                </div>
              </div>
              <Button
                onClick={openNewWork}
                className="h-9 px-3 text-[12px]"
              >
                <PlusIcon size={14} />
                Log visit with photos
              </Button>
            </div>
            <p className="border-b border-black/5 bg-[#FBFCFE] px-4 py-2 text-[10px] leading-relaxed text-ink-muted">
              Ask the client before taking or uploading a photo. These images are
              never shown on the public customer page.
            </p>
            {photoEntries.length === 0 ? (
              <CrmEmptyState
                title="No photos yet"
                description="Add a before and after photo when you log a treatment, styling session or clinic visit."
                action={
                  <Button onClick={openNewWork}>
                    <PlusIcon size={15} />
                    Log a visit
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {photoEntries.map((entry) => {
                  const invoice = entry.invoice;
                  return (
                    <article
                      key={entry.id}
                      className="overflow-hidden rounded-card border border-black/10 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setPhotoView(entry)}
                        aria-label={`View before and after photos for ${entry.service}`}
                        className="grid w-full grid-cols-2 gap-px bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        <span className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#F8FAFC]">
                          {entry.before_photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entry.before_photo}
                              alt="Before treatment"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-ink-muted">No before</span>
                          )}
                        </span>
                        <span className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#F8FAFC]">
                          {entry.after_photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entry.after_photo}
                              alt="After treatment"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-ink-muted">No after</span>
                          )}
                        </span>
                      </button>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-[12px] font-medium text-ink">
                            {entry.service}
                          </p>
                          {invoice ? (
                            <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
                              {invoice.number}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {formatCrmDate(`${entry.entry_date}T00:00:00`)} ·{" "}
                          <span
                            className={
                              entry.photo_consent
                                ? "text-brand-green-deep"
                                : "text-red-700"
                            }
                          >
                            {entry.photo_consent
                              ? "Consent recorded"
                              : "Consent missing"}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-black/5 pt-2">
                          <button
                            type="button"
                            onClick={() => setPhotoView(entry)}
                            className="text-[10px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          >
                            View photos
                          </button>
                          {invoice ? (
                            <button
                              type="button"
                              onClick={() => setInvoiceView(entry)}
                              className="text-[10px] font-medium tabular-nums text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              View invoice
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openInvoiceFor(entry)}
                              className="text-[10px] font-medium text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                            >
                              Create invoice
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {tab === "activity" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
            <Panel title="Log activity" description="What happened with this client?">
              <div className="flex flex-col gap-3">
                <Select
                  label="Type"
                  value={noteKind}
                  onChange={(event) =>
                    setNoteKind(event.target.value as CrmActivityKind)
                  }
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="visit">Visit</option>
                </Select>
                <div>
                  <label
                    htmlFor="crm-note"
                    className="block text-[13px] font-medium"
                  >
                    What happened?
                  </label>
                  <textarea
                    id="crm-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className={TEXTAREA}
                    placeholder="Prefers evening appointments…"
                  />
                </div>
                {noteError ? (
                  <p role="alert" className="text-[12px] text-red-700">
                    {noteError}
                  </p>
                ) : null}
                <div className="flex justify-end">
                  <Button onClick={addNote} disabled={!note.trim()}>
                    Add activity
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="Activity timeline" description={`${activities.length} entries`}>
              {activities.length ? (
                <ol className="relative flex flex-col gap-4 border-l border-black/10 pl-4">
                  {activities.map((activity) => (
                    <li key={activity.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          activity.kind === "system" ? "bg-ink-muted" : "bg-brand-blue"
                        }`}
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[11px] font-medium text-ink">
                          {activityLabel(activity.kind)}
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {formatCrmDateTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">
                        {activity.body}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[12px] text-ink-muted">
                  No activity yet. Log a call, email, visit or note.
                </p>
              )}
            </Panel>
          </div>
        ) : null}

        {tab === "tasks" && tasksEnabled ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
            <Panel title="New follow-up" description="Keep the next step visible.">
              <div className="flex flex-col gap-3">
                <Input
                  label="Task"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Call about renewal"
                  maxLength={120}
                />
                <Input
                  label="Due date"
                  type="date"
                  value={taskDue}
                  onChange={(event) => setTaskDue(event.target.value)}
                />
                {taskError ? (
                  <p role="alert" className="text-[12px] text-red-700">
                    {taskError}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-ink-muted">
                    {openCount} open task{openCount === 1 ? "" : "s"} · plan allows{" "}
                    {limits.open_tasks.toLocaleString("en-IN")}.
                  </p>
                  <Button onClick={createTask} disabled={!taskTitle.trim()}>
                    Add task
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="Tasks" description={`${tasks.length} total`}>
              {tasks.length ? (
                <ul className="divide-y divide-black/5">
                  {tasks.map((task) => {
                    const done = task.status === "done";
                    const overdue =
                      !done &&
                      task.due_on !== null &&
                      task.due_on < new Date().toISOString().slice(0, 10);
                    return (
                      <li key={task.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => {
                            const result = toggleTask(currentState, task.id);
                            if (result.ok) update(() => result.state);
                          }}
                          aria-label={`Mark ${task.title} as ${done ? "open" : "done"}`}
                          className="mt-0.5 h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[12px] ${
                              done ? "text-ink-muted line-through" : "text-ink"
                            }`}
                          >
                            {task.title}
                          </p>
                          <p
                            className={`mt-0.5 text-[10px] ${
                              overdue ? "text-red-700" : "text-ink-muted"
                            }`}
                          >
                            {done ? "Done" : dueLabel(task.due_on)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const result = deleteTask(currentState, task.id);
                            if (result.ok) update(() => result.state);
                          }}
                          aria-label={`Delete task ${task.title}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        >
                          <CloseIcon size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[12px] text-ink-muted">
                  No tasks yet. Add a follow-up so this client does not go cold.
                </p>
              )}
            </Panel>
          </div>
        ) : null}
      </div>

      <Modal
        open={editing}
        title="Edit contact"
        onClose={() => setEditing(false)}
        panelClassName="max-w-[560px]"
      >
        <ContactForm
          state={state}
          initial={contact}
          onCancel={() => setEditing(false)}
          onSubmit={(draft) => {
            const result = updateContact(state, contact.id, draft, limits);
            if (!result.ok) return result.errors;
            update(() => result.state);
            setEditing(false);
            setNotice("Contact updated.");
            return null;
          }}
        />
      </Modal>

      <Modal
        open={serviceOpen}
        title={editingEntry ? "Edit work & payment" : "Log work & payment"}
        onClose={() => {
          setServiceOpen(false);
          setEditingEntry(null);
        }}
        panelClassName="max-w-[620px]"
      >
        <ServiceForm
          key={editingEntry?.id ?? "new"}
          state={state}
          initial={editingEntry ?? undefined}
          fixedContactId={contact.id}
          onCancel={() => {
            setServiceOpen(false);
            setEditingEntry(null);
          }}
          onSubmit={saveWork}
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
        onClose={() => {
          setInvoiceOpen(false);
          setInvoiceEntry(null);
        }}
        panelClassName="max-w-[760px]"
      >
        <InvoiceForm
          key={invoiceEntry?.id ?? "new-invoice"}
          state={state}
          initial={invoiceEntry ?? undefined}
          fixedContactId={contact.id}
          onCancel={() => {
            setInvoiceOpen(false);
            setInvoiceEntry(null);
          }}
          onSubmit={saveInvoiceDraft}
        />
      </Modal>

      <InvoiceDialog
        open={Boolean(invoiceView)}
        entry={invoiceView}
        contact={contact}
        config={state.config}
        onClose={() => setInvoiceView(null)}
        onEdit={(entry) => openInvoiceFor(entry)}
      />

      <Modal
        open={reportEditorOpen && Boolean(reportEntry)}
        title={
          reportEntry?.report
            ? `Edit ${state.config.report.report_title.toLowerCase()}`
            : `Generate ${state.config.report.report_title.toLowerCase()}`
        }
        onClose={() => {
          setReportEditorOpen(false);
          setReportEntry(null);
        }}
        panelClassName="max-w-[820px]"
      >
        {reportEntry ? (
          <ReportForm
            key={reportEntry.id}
            state={state}
            entry={reportEntry}
            initial={reportEntry.report}
            onCancel={() => {
              setReportEditorOpen(false);
              setReportEntry(null);
            }}
            onSubmit={saveReportDraft}
            settingsHref={`/crm/settings${demoSuffix}`}
          />
        ) : null}
      </Modal>

      <PatientReportDialog
        open={Boolean(reportView)}
        entry={reportView}
        contact={contact}
        config={state.config}
        onClose={() => setReportView(null)}
        onEdit={(entry) => openReportEditor(entry)}
      />

      <PhotoViewerDialog
        open={Boolean(photoView)}
        entry={photoView}
        onClose={() => setPhotoView(null)}
      />

      <Modal
        open={Boolean(deletingEntry)}
        title="Remove work record?"
        onClose={() => setDeletingEntry(null)}
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          {deletingEntry
            ? `Remove “${deletingEntry.service}”, its payment history${
                deletingEntry.before_photo || deletingEntry.after_photo
                  ? ", photos"
                  : ""
              }${
                deletingEntry.invoice
                  ? ` and invoice ${deletingEntry.invoice.number}`
                  : ""
              }${
                deletingEntry.report
                  ? ` and report ${deletingEntry.report.number}`
                  : ""
              } from this client?`
            : ""}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingEntry(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteWork}
            className="bg-red-700 hover:bg-red-800"
          >
            Remove record
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleting}
        title="Delete contact?"
        onClose={() => setDeleting(false)}
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          {contact.name} will be removed from contacts and from the pipeline.
          Their notes, tasks, photos and invoices stay in the demo data until you
          reset it, but the contact and their work records are hidden.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="bg-red-700 hover:bg-red-800"
          >
            Delete contact
          </Button>
        </div>
      </Modal>
    </div>
  );
}

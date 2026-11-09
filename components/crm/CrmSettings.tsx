"use client";

/**
 * `/crm/settings` — the owner-defined part of the CRM. Field names/types and
 * the pipeline are validated on save against the plan limits and against the
 * contacts that reference a stage, so removing a stage can never orphan data.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Modal } from "@/components/dashboard/modal";
import {
  CRM_FIELD_TYPE_LABELS,
  CRM_HARD_LIMITS,
  CRM_MAX_APPROVAL_TEXT,
  CRM_MAX_BILLING_ADDRESS,
  CRM_MAX_DUE_DAYS,
  CRM_MAX_EMAIL,
  CRM_MAX_GSTIN,
  CRM_MAX_INVOICE_PREFIX,
  CRM_MAX_PROVIDER_NAME,
  CRM_MAX_PROVIDER_QUALIFICATION,
  CRM_MAX_PROVIDER_REGISTRATION,
  CRM_MAX_PROVIDER_SIGNATURE,
  CRM_MAX_REPORT_FOOTER,
  CRM_MAX_REPORT_LABEL,
  CRM_MAX_REPORT_TITLE,
  CRM_MAX_OPTIONS,
  CRM_MAX_PHONE,
  CRM_MAX_TAX_PERCENT,
  CRM_MAX_TERMS,
  cloneConfig,
  nextFieldKey,
  type CrmConfig,
  type CrmFieldDef,
  type CrmFieldType,
  type CrmStageKind,
} from "@/lib/crm/config";
import {
  liveContacts,
  removeStage,
  validateCrmConfig,
} from "@/lib/crm/rules";
import { CrmHeader, CrmLoading } from "./CrmGate";
import { useCrmWorkspace } from "./use-crm-workspace";

const FIELD_TYPES = Object.entries(CRM_FIELD_TYPE_LABELS) as [
  CrmFieldType,
  string,
][];

const STAGE_KINDS: { value: CrmStageKind; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const TEXT_INPUT =
  "h-9 w-full rounded-control border border-black/20 px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

export function CrmSettings() {
  const { state, limits, update, reset, plan, demoSuffix } = useCrmWorkspace();
  const [draft, setDraft] = useState<CrmConfig | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<CrmFieldType>("text");
  const [newOptions, setNewOptions] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newShow, setNewShow] = useState(true);
  const [newStage, setNewStage] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    setDraft((current) => current ?? cloneConfig(state.config));
  }, [state]);

  if (!state || !limits || !draft) return <CrmLoading />;

  const fieldLimit = Math.min(limits.fields, CRM_HARD_LIMITS.fields);
  const stageLimit = Math.min(limits.stages, CRM_HARD_LIMITS.stages);
  const deleteStage = draft.stages.find((stage) => stage.id === deleteStageId);
  const deleteCount = deleteStage
    ? liveContacts(state).filter((contact) => contact.stage_id === deleteStage.id)
        .length
    : 0;
  // Narrows once for the handlers below (closures do not keep the guard's type).
  const currentState = state;
  const currentLimits = limits;

  function patchField(key: string, patch: Partial<CrmFieldDef>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.key === key ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  }

  function patchBilling(patch: Partial<CrmConfig["billing"]>) {
    setDraft((current) =>
      current
        ? { ...current, billing: { ...current.billing, ...patch } }
        : current,
    );
  }

  function patchReport(patch: Partial<CrmConfig["report"]>) {
    setDraft((current) =>
      current
        ? { ...current, report: { ...current.report, ...patch } }
        : current,
    );
  }

  function addField() {
    if (!draft) return;
    setError("");
    setNotice("");
    const label = newLabel.trim();
    if (!label) {
      setError("Give the field a name.");
      return;
    }
    if (draft.fields.length >= fieldLimit) {
      setError(
        `Your plan allows ${fieldLimit} custom fields. Upgrade for more.`,
      );
      return;
    }
    const options =
      newType === "select" || newType === "multi_select"
        ? newOptions
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean)
        : [];
    if (
      (newType === "select" || newType === "multi_select") &&
      (options.length < 1 || options.length > CRM_MAX_OPTIONS)
    ) {
      setError(`Add 1 to ${CRM_MAX_OPTIONS} options.`);
      return;
    }
    const field: CrmFieldDef = {
      key: nextFieldKey(label, draft),
      label,
      type: newType,
      required: newRequired,
      show_in_list: newShow,
      options,
      archived: false,
    };
    setDraft({ ...draft, fields: [...draft.fields, field] });
    setNewLabel("");
    setNewOptions("");
    setNewRequired(false);
    setNewShow(true);
    setNewType("text");
  }

  function addStage() {
    if (!draft) return;
    setError("");
    setNotice("");
    const name = newStage.trim();
    if (!name) {
      setError("Give the stage a name.");
      return;
    }
    if (draft.stages.length >= stageLimit) {
      setError(`Your plan allows ${stageLimit} stages.`);
      return;
    }
    if (draft.stages.some((stage) => stage.name.toLowerCase() === name.toLowerCase())) {
      setError("That stage name is already used.");
      return;
    }
    setDraft({
      ...draft,
      stages: [
        ...draft.stages,
        { id: `stg_custom_${Date.now()}`, name, kind: "open" },
      ],
    });
    setNewStage("");
  }

  function moveStage(index: number, direction: -1 | 1) {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.stages.length) return;
    const stages = [...draft.stages];
    const [item] = stages.splice(index, 1);
    stages.splice(target, 0, item);
    setDraft({ ...draft, stages });
  }

  function askDelete(stageId: string) {
    if (!draft) return;
    const other = draft.stages.find((stage) => stage.id !== stageId);
    setDestination(other?.id ?? "");
    setDeleteStageId(stageId);
  }

  function confirmDeleteStage() {
    if (!draft || !deleteStageId) return;
    const base = { ...currentState, config: cloneConfig(draft) };
    const result = removeStage(base, deleteStageId, destination);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    update(() => result.state);
    setDraft(cloneConfig(result.state.config));
    setDeleteStageId(null);
    setNotice("Stage removed.");
    setError("");
  }

  function save() {
    if (!draft) return;
    const issues = validateCrmConfig(draft, currentLimits, currentState.contacts);
    if (issues.length) {
      setError(issues[0]);
      setNotice("");
      return;
    }
    update((current) => ({ ...current, config: cloneConfig(draft) }));
    setError("");
    setNotice("CRM settings saved.");
  }

  function resetDemo() {
    reset();
    setDraft(null);
    setResetOpen(false);
    setError("");
    setNotice("Demo data reset.");
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/crm${demoSuffix}`}
        className="text-[12px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        ← Contacts
      </Link>

      <CrmHeader
        title="CRM settings"
        subtitle="Make the fields, pipeline and invoice details fit your business. Changes apply to every contact."
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              Reset demo data
            </Button>
            <Button onClick={save}>Save changes</Button>
          </>
        }
      />

      {error ? (
        <p
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-control border border-brand-green/20 bg-brand-green/5 px-3 py-2 text-[12px] text-brand-green-deep"
        >
          {notice}
        </p>
      ) : null}

      <Card title="Plan limits">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] text-ink-muted">Contacts</dt>
            <dd className="mt-0.5 tabular-nums text-ink">
              {liveContacts(state).length.toLocaleString("en-IN")} /{" "}
              {limits.contacts.toLocaleString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-muted">Custom fields</dt>
            <dd className="mt-0.5 tabular-nums text-ink">
              {draft.fields.length} / {fieldLimit}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-muted">Stages</dt>
            <dd className="mt-0.5 tabular-nums text-ink">
              {draft.stages.length} / {stageLimit}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-muted">Tags</dt>
            <dd className="mt-0.5 tabular-nums text-ink">
              {state.tags.length} / {limits.tags}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] text-ink-muted">
          You are on {plan.name}.{" "}
          <Link
            href="/billing"
            className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Compare plans
          </Link>
          .
        </p>
      </Card>

      <Card title="Modules">
        <div className="flex flex-col gap-3">
          {(
            [
              ["pipeline", "Pipeline", "Show the stage board and stage picker."],
              ["tasks", "Follow-up tasks", "Show tasks on contacts and in the list."],
              ["tags", "Tags", "Add your own tags to group contacts."],
            ] as const
          ).map(([key, label, description]) => (
            <label key={key} className="flex items-start gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.modules[key]}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    modules: { ...draft.modules, [key]: event.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
              />
              <span>
                <span className="block font-medium text-ink">{label}</span>
                <span className="block text-[11px] text-ink-muted">{description}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Invoice details">
        <p className="text-[12px] text-ink-muted">
          These seller details print on every invoice. They stay on this device
          with the rest of the demo data.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="crm-billing-address"
              className="block text-[13px] font-medium"
            >
              Business address
            </label>
            <textarea
              id="crm-billing-address"
              value={draft.billing.address}
              onChange={(event) =>
                patchBilling({ address: event.target.value })
              }
              rows={2}
              maxLength={CRM_MAX_BILLING_ADDRESS}
              className={TEXTAREA}
              placeholder="Shop / clinic address, street, city, PIN code"
            />
          </div>
          <Input
            label="Invoice phone"
            value={draft.billing.phone}
            onChange={(event) => patchBilling({ phone: event.target.value })}
            maxLength={CRM_MAX_PHONE}
            placeholder="+91 98200 11001"
          />
          <Input
            label="Invoice email"
            type="email"
            value={draft.billing.email}
            onChange={(event) => patchBilling({ email: event.target.value })}
            maxLength={CRM_MAX_EMAIL}
            placeholder="hello@yourbusiness.in"
          />
          <Input
            label="GSTIN (optional)"
            value={draft.billing.gstin}
            onChange={(event) =>
              patchBilling({
                gstin: event.target.value
                  .toUpperCase()
                  .replace(/[^0-9A-Z]/g, "")
                  .slice(0, CRM_MAX_GSTIN),
              })
            }
            maxLength={CRM_MAX_GSTIN}
            hint="15 characters. Leave blank if you are not GST registered."
            placeholder="27ABCDE1234F1Z5"
          />
          <Input
            label="Invoice prefix"
            value={draft.billing.invoice_prefix}
            onChange={(event) =>
              patchBilling({
                invoice_prefix: event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, CRM_MAX_INVOICE_PREFIX),
              })
            }
            maxLength={CRM_MAX_INVOICE_PREFIX}
            hint="2 to 8 letters or numbers, e.g. INV or SALON."
            placeholder="INV"
          />
          <Input
            label="Default tax (%)"
            type="number"
            inputMode="decimal"
            min="0"
            max={CRM_MAX_TAX_PERCENT}
            step="0.01"
            value={draft.billing.default_tax_percent}
            onChange={(event) =>
              patchBilling({
                default_tax_percent:
                  event.target.value === ""
                    ? 0
                    : Number(event.target.value),
              })
            }
            hint={`0 to ${CRM_MAX_TAX_PERCENT}%. Applied to new invoices.`}
          />
          <Input
            label="Default payment due (days)"
            type="number"
            inputMode="numeric"
            min="0"
            max={CRM_MAX_DUE_DAYS}
            step="1"
            value={draft.billing.default_due_days}
            onChange={(event) =>
              patchBilling({
                default_due_days:
                  event.target.value === "" ? 0 : Number(event.target.value),
              })
            }
            hint={`0 to ${CRM_MAX_DUE_DAYS} days after the invoice date.`}
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="crm-billing-terms"
              className="block text-[13px] font-medium"
            >
              Invoice terms / footer
            </label>
            <textarea
              id="crm-billing-terms"
              value={draft.billing.terms}
              onChange={(event) => patchBilling({ terms: event.target.value })}
              rows={2}
              maxLength={CRM_MAX_TERMS}
              className={TEXTAREA}
              placeholder="Thank you for your business."
            />
          </div>
        </div>
      </Card>

      <Card title="Report & provider details">
        <p className="text-[12px] leading-relaxed text-ink-muted">
          These details fill every new report automatically. Use the words your
          business uses — clinic, salon, gym or any other service business.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="Report title"
            value={draft.report.report_title}
            onChange={(event) => patchReport({ report_title: event.target.value })}
            maxLength={CRM_MAX_REPORT_TITLE}
            placeholder="Service report"
            hint="For example: Patient report, Client report or Session report."
          />
          <Input
            label="Recipient label"
            value={draft.report.recipient_label}
            onChange={(event) => patchReport({ recipient_label: event.target.value })}
            maxLength={CRM_MAX_REPORT_LABEL}
            placeholder="Client"
            hint="Patient, Client, Member or Customer."
          />
          <Input
            label="Provider label"
            value={draft.report.provider_label}
            onChange={(event) => patchReport({ provider_label: event.target.value })}
            maxLength={CRM_MAX_REPORT_LABEL}
            placeholder="Service provider"
            hint="Doctor / practitioner, Trainer, Stylist or Consultant."
          />
          <Input
            label="Provider name"
            value={draft.report.provider_name}
            onChange={(event) => patchReport({ provider_name: event.target.value })}
            maxLength={CRM_MAX_PROVIDER_NAME}
            placeholder="Dr. Ananya Rao / Coach Arjun"
            hint="Required before a report can be generated."
          />
          <Input
            label="Qualification / certification"
            value={draft.report.provider_qualification}
            onChange={(event) =>
              patchReport({ provider_qualification: event.target.value })
            }
            maxLength={CRM_MAX_PROVIDER_QUALIFICATION}
            placeholder="MBBS, MD / Certified trainer"
            hint="Leave blank if this does not apply to your business."
          />
          <Input
            label="Registration / licence no."
            value={draft.report.provider_registration}
            onChange={(event) =>
              patchReport({ provider_registration: event.target.value })
            }
            maxLength={CRM_MAX_PROVIDER_REGISTRATION}
            placeholder="MH-12345 / optional"
          />
          <Input
            label="Signature line"
            value={draft.report.provider_signature}
            onChange={(event) =>
              patchReport({ provider_signature: event.target.value })
            }
            maxLength={CRM_MAX_PROVIDER_SIGNATURE}
            placeholder="Dr. Ananya Rao"
            hint="Printed above the signature line. Falls back to the provider name."
          />
          <Input
            label="Approval wording"
            value={draft.report.approval_text}
            onChange={(event) =>
              patchReport({ approval_text: event.target.value })
            }
            maxLength={CRM_MAX_APPROVAL_TEXT}
            placeholder="Reviewed and approved by the service provider."
            hint="Printed with the signature on the client copy."
          />
          <Input
            label="Plan / prescription section title"
            value={draft.report.plan_title}
            onChange={(event) => patchReport({ plan_title: event.target.value })}
            maxLength={CRM_MAX_REPORT_LABEL}
            placeholder="Plan / prescription"
            hint="Use Prescription, Workout plan, Aftercare plan or Recommendations."
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="crm-report-footer"
              className="block text-[13px] font-medium"
            >
              Report footer note
            </label>
            <textarea
              id="crm-report-footer"
              value={draft.report.footer_note}
              onChange={(event) =>
                patchReport({ footer_note: event.target.value })
              }
              rows={2}
              maxLength={CRM_MAX_REPORT_FOOTER}
              className={TEXTAREA}
              placeholder="This report is private and intended for the named client."
            />
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
          Reports are generated from these saved details. A report can still be
          edited individually without changing the settings for future reports.
        </p>
      </Card>

      <Card title="Custom fields">
        <p className="text-[12px] text-ink-muted">
          Field keys and types cannot change after a field is created. Archive a
          field to hide it from new contacts; its saved values are kept.
        </p>

        <div className="mt-3">
          {draft.fields.length ? (
            draft.fields.map((field) => (
              <div
                key={field.key}
                className="border-b border-black/5 py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_130px_auto] sm:items-center">
                  <input
                    value={field.label}
                    onChange={(event) =>
                      patchField(field.key, { label: event.target.value })
                    }
                    aria-label={`Label for ${field.key}`}
                    maxLength={40}
                    className={TEXT_INPUT}
                  />
                  <code className="truncate rounded-control bg-surface-muted px-2 py-1.5 text-[11px] text-ink-muted">
                    {field.key}
                  </code>
                  <span className="text-[11px] text-ink-muted">
                    {CRM_FIELD_TYPE_LABELS[field.type]}
                    {field.archived ? " · archived" : ""}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <label className="flex items-center gap-1 text-ink">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          patchField(field.key, { required: event.target.checked })
                        }
                        className="h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1 text-ink">
                      <input
                        type="checkbox"
                        checked={field.show_in_list}
                        onChange={(event) =>
                          patchField(field.key, {
                            show_in_list: event.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
                      />
                      In list
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        patchField(field.key, { archived: !field.archived })
                      }
                      className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      {field.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>
                {field.type === "select" || field.type === "multi_select" ? (
                  <input
                    value={field.options.join(", ")}
                    onChange={(event) =>
                      patchField(field.key, {
                        options: event.target.value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                    aria-label={`Options for ${field.key}`}
                    placeholder="Option one, Option two"
                    className={`${TEXT_INPUT} mt-2`}
                  />
                ) : null}
              </div>
            ))
          ) : (
            <p className="py-3 text-[13px] text-ink-muted">No custom fields yet.</p>
          )}
        </div>

        <div className="mt-4 rounded-control border border-dashed border-black/15 bg-surface-muted/60 p-3">
          <p className="text-[12px] font-medium text-ink">Add a custom field</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
            <Input
              label="Label"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Preferred service"
              maxLength={40}
            />
            <Select
              label="Type"
              value={newType}
              onChange={(event) => setNewType(event.target.value as CrmFieldType)}
            >
              {FIELD_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          {newType === "select" || newType === "multi_select" ? (
            <Input
              label="Options"
              value={newOptions}
              onChange={(event) => setNewOptions(event.target.value)}
              hint="Separate with commas."
              placeholder="Haircut, Colour, Facial"
              className="mt-2"
            />
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px]">
            <label className="flex items-center gap-1 text-ink">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(event) => setNewRequired(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
              />
              Required
            </label>
            <label className="flex items-center gap-1 text-ink">
              <input
                type="checkbox"
                checked={newShow}
                onChange={(event) => setNewShow(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
              />
              Show in list
            </label>
            <Button type="button" onClick={addField} className="h-8 px-3 text-[12px]">
              Add field
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Pipeline stages">
        <p className="text-[12px] text-ink-muted">
          One won and one lost stage, at least one open stage. Reorder with the
          arrows; the order here is the board order.
        </p>

        <div className="mt-3">
          {draft.stages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex flex-wrap items-center gap-2 border-b border-black/5 py-2.5 first:pt-0 last:border-b-0 last:pb-0"
            >
              <input
                value={stage.name}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  })
                }
                aria-label={`Name for stage ${index + 1}`}
                maxLength={32}
                className={`${TEXT_INPUT} min-w-[160px] flex-1`}
              />
              <select
                value={stage.kind}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? { ...item, kind: event.target.value as CrmStageKind }
                        : item,
                    ),
                  })
                }
                aria-label={`Type for ${stage.name}`}
                className="h-9 rounded-control border border-black/20 bg-white px-2 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {STAGE_KINDS.map((kind) => (
                  <option
                    key={kind.value}
                    value={kind.value}
                    disabled={
                      kind.value === "won" &&
                      draft.stages.some(
                        (item) => item.kind === "won" && item.id !== stage.id,
                      )
                    }
                  >
                    {kind.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveStage(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${stage.name} up`}
                  className="flex h-8 w-8 items-center justify-center rounded-control border border-black/10 text-[13px] text-ink disabled:opacity-40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStage(index, 1)}
                  disabled={index === draft.stages.length - 1}
                  aria-label={`Move ${stage.name} down`}
                  className="flex h-8 w-8 items-center justify-center rounded-control border border-black/10 text-[13px] text-ink disabled:opacity-40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => askDelete(stage.id)}
                  disabled={draft.stages.length <= 2}
                  className="ml-1 text-[11px] font-medium text-red-700 disabled:opacity-40 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <Input
              label="New stage"
              value={newStage}
              onChange={(event) => setNewStage(event.target.value)}
              placeholder="Consultation"
              maxLength={32}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addStage}
            disabled={!newStage.trim()}
          >
            Add stage
          </Button>
        </div>
      </Card>

      <Modal
        open={resetOpen}
        title="Reset demo data?"
        onClose={() => setResetOpen(false)}
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          This replaces the CRM contacts, notes, tasks, tags, photos, invoices and
          settings in this browser with the seeded demo. It cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button onClick={resetDemo} className="bg-red-700 hover:bg-red-800">
            Reset demo data
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteStageId)}
        title="Remove stage"
        onClose={() => setDeleteStageId(null)}
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          {deleteStage ? `Remove “${deleteStage.name}”?` : "Remove this stage?"}{" "}
          {deleteCount
            ? `${deleteCount} contact${deleteCount === 1 ? "" : "s"} will move to the stage you choose.`
            : "No contacts are in this stage."}
        </p>
        {deleteCount ? (
          <div className="mt-3">
            <Select
              label="Move contacts to"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              {draft.stages
                .filter((stage) => stage.id !== deleteStageId)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
            </Select>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteStageId(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteStage}
            disabled={!destination}
            className="bg-red-700 hover:bg-red-800"
          >
            Remove stage
          </Button>
        </div>
      </Modal>
    </div>
  );
}

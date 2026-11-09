"use client";

/**
 * Writes the report attached to one visit. Provider, signature and approval
 * wording come from CRM settings; the visit content and plan rows are stored on
 * the work record alongside the photos they refer to.
 */

import Link from "next/link";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import {
  CRM_MAX_MEDICINE_DOSE,
  CRM_MAX_MEDICINE_DURATION,
  CRM_MAX_MEDICINE_FREQUENCY,
  CRM_MAX_MEDICINE_INSTRUCTIONS,
  CRM_MAX_MEDICINE_NAME,
  CRM_MAX_REPORT_MEDICINES,
  CRM_PATIENT_GENDER_LABELS,
} from "@/lib/crm/config";
import {
  nextReportNumber,
  type CrmClinicalReport,
  type CrmReportDraft,
  type CrmServiceEntry,
  type CrmState,
} from "@/lib/crm/rules";
import { formatCrmDate } from "./crm-utils";
import { CrmAvatar } from "./crm-ui";

const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

type MedicineRow = {
  key: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type FormState = {
  doctor_name: string;
  doctor_qualification: string;
  doctor_registration: string;
  patient_age: string;
  patient_gender: CrmReportDraft["patient_gender"];
  chief_complaint: string;
  diagnosis: string;
  examination: string;
  tests: string;
  treatment: string;
  medicines: MedicineRow[];
  advice: string;
  follow_up_date: string;
  include_photos: boolean;
  share_consent: boolean;
};

function medicineKey(): string {
  return `med_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function blankMedicine(): MedicineRow {
  return {
    key: medicineKey(),
    name: "",
    dose: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

function initialForm(
  state: CrmState,
  entry: CrmServiceEntry,
  initial: CrmClinicalReport | null,
  photosAvailable: boolean,
): FormState {
  const previous = state.service_entries
    .filter(
      (item) =>
        item.contact_id === entry.contact_id &&
        item.id !== entry.id &&
        item.report !== null,
    )
    .sort((a, b) =>
      (b.report?.updated_at ?? "").localeCompare(a.report?.updated_at ?? ""),
    )[0]?.report;

  const settings = state.config.report;
  return {
    doctor_name:
      initial?.doctor_name ??
      (settings.provider_name || previous?.doctor_name || ""),
    doctor_qualification:
      initial?.doctor_qualification ??
      (settings.provider_qualification || previous?.doctor_qualification || ""),
    doctor_registration:
      initial?.doctor_registration ??
      (settings.provider_registration || previous?.doctor_registration || ""),
    patient_age: initial?.patient_age ?? "",
    patient_gender: initial?.patient_gender ?? "",
    chief_complaint: initial?.chief_complaint ?? "",
    diagnosis: initial?.diagnosis ?? "",
    examination: initial?.examination ?? "",
    tests: initial?.tests ?? "",
    treatment: initial?.treatment || entry.service,
    medicines:
      initial?.medicines.length
        ? initial.medicines.map((medicine) => ({
            key: medicine.id,
            name: medicine.name,
            dose: medicine.dose,
            frequency: medicine.frequency,
            duration: medicine.duration,
            instructions: medicine.instructions,
          }))
        : [blankMedicine()],
    advice: initial?.advice ?? "",
    follow_up_date: initial?.follow_up_date ?? "",
    include_photos: Boolean(initial?.include_photos && photosAvailable),
    share_consent: initial?.share_consent ?? false,
  };
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  rows = 3,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`${TEXTAREA} ${error ? "border-red-700" : ""}`}
      />
      {hint ? (
        <p id={hintId} className="mt-xs text-[12px] text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-xs text-[12px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-control border border-black/10 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 bg-[#FBFCFE] px-3 py-2.5">
        <div>
          <h3 className="text-[12px] font-medium text-ink">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-3 p-3">{children}</div>
    </section>
  );
}

export function ReportForm({
  state,
  entry,
  initial,
  onCancel,
  onSubmit,
  settingsHref,
}: {
  state: CrmState;
  entry: CrmServiceEntry;
  initial?: CrmClinicalReport | null;
  onCancel: () => void;
  onSubmit: (draft: CrmReportDraft) => Record<string, string> | null;
  settingsHref: string;
}) {
  const contact = state.contacts.find((item) => item.id === entry.contact_id);
  const settings = state.config.report;
  const photosAvailable = Boolean(
    entry.photo_consent && (entry.before_photo || entry.after_photo),
  );
  const [form, setForm] = useState<FormState>(() =>
    initialForm(state, entry, initial ?? null, photosAvailable),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstError = Object.values(errors)[0];
  const reportNumber = initial?.number ?? nextReportNumber(state);
  const providerName =
    form.doctor_name.trim() || settings.provider_name.trim();
  const providerReady = Boolean(providerName);
  const providerLine = [
    form.doctor_qualification.trim() || settings.provider_qualification.trim(),
    form.doctor_registration.trim()
      ? `Reg. ${form.doctor_registration.trim()}`
      : settings.provider_registration.trim()
        ? `Reg. ${settings.provider_registration.trim()}`
        : "",
  ]
    .filter(Boolean)
    .join(" · ");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMedicine(key: string, patch: Partial<MedicineRow>) {
    setForm((current) => ({
      ...current,
      medicines: current.medicines.map((medicine) =>
        medicine.key === key ? { ...medicine, ...patch } : medicine,
      ),
    }));
  }

  function addMedicine() {
    if (form.medicines.length >= CRM_MAX_REPORT_MEDICINES) return;
    setForm((current) => ({
      ...current,
      medicines: [...current.medicines, blankMedicine()],
    }));
  }

  function removeMedicine(key: string) {
    if (form.medicines.length <= 1) return;
    setForm((current) => ({
      ...current,
      medicines: current.medicines.filter((medicine) => medicine.key !== key),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: CrmReportDraft = {
      doctor_name: form.doctor_name,
      doctor_qualification: form.doctor_qualification,
      doctor_registration: form.doctor_registration,
      patient_age: form.patient_age,
      patient_gender: form.patient_gender,
      chief_complaint: form.chief_complaint,
      diagnosis: form.diagnosis,
      examination: form.examination,
      tests: form.tests,
      treatment: form.treatment,
      medicines: form.medicines.map((medicine) => ({
        name: medicine.name,
        dose: medicine.dose,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instructions: medicine.instructions,
      })),
      advice: form.advice,
      follow_up_date: form.follow_up_date || null,
      include_photos: form.include_photos,
      share_consent: form.share_consent,
    };
    const returned = onSubmit(draft);
    if (returned) setErrors(returned);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-brand-blue/15 bg-brand-blue/[0.04] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-brand-blue">
            {settings.report_title}
          </p>
          <p className="mt-0.5 text-[15px] font-medium tabular-nums text-ink">
            {reportNumber}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-muted">
            {formatCrmDate(`${entry.entry_date}T00:00:00`)} · {entry.service}
          </p>
        </div>
        {contact ? (
          <div className="flex min-w-0 items-center gap-2">
            <CrmAvatar name={contact.name} size="sm" />
            <div className="min-w-0 text-right">
              <p className="truncate text-[12px] font-medium text-ink">
                {contact.name}
              </p>
              <p className="text-[10px] text-ink-muted">
                {contact.phone || contact.email || settings.recipient_label}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {firstError ? (
        <p
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {firstError}
        </p>
      ) : null}

      <Section
        title={settings.provider_label}
        description="Saved once in CRM settings and filled in automatically for every report."
      >
        <div className="rounded-control border border-black/10 bg-[#FBFCFE] p-3">
          <p className="text-[13px] font-medium text-ink">
            {providerName || `Add a ${settings.provider_label.toLowerCase()} in CRM settings`}
          </p>
          {providerLine ? (
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              {providerLine}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
            {settings.approval_text}
          </p>
          <Link
            href={settingsHref}
            className="mt-2 inline-block text-[11px] font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Edit provider details in CRM settings
          </Link>
        </div>
        {!providerReady ? (
          <p role="alert" className="text-[11px] leading-relaxed text-amber-700">
            Add the provider name and approval details in CRM settings before
            generating a report. You do not need a doctor or degree for every
            business; use Trainer, Stylist, Consultant or any wording that fits.
          </p>
        ) : null}
        {errors.doctor_name || errors.doctor_qualification || errors.doctor_registration ? (
          <p role="alert" className="text-[11px] text-red-700">
            {errors.doctor_name || errors.doctor_qualification || errors.doctor_registration}
          </p>
        ) : null}
      </Section>

      <Section
        title={settings.recipient_label}
        description={`The ${settings.recipient_label.toLowerCase()} details come from this CRM record.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Age"
            value={form.patient_age}
            onChange={(event) => set("patient_age", event.target.value)}
            error={errors.patient_age}
            placeholder="e.g. 34 or 8 months"
            maxLength={20}
          />
          <Select
            label="Gender"
            value={form.patient_gender}
            onChange={(event) =>
              set(
                "patient_gender",
                event.target.value as CrmReportDraft["patient_gender"],
              )
            }
            error={errors.patient_gender}
          >
            <option value="">Not specified</option>
            {Object.entries(CRM_PATIENT_GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-[10px] leading-relaxed text-ink-muted">
          The {settings.recipient_label.toLowerCase()}&apos;s name, phone and
          email are taken from the contact record, so they never need to be
          typed twice.
        </p>
      </Section>

      <Section
        title="Report details"
        description={`Only the sections you fill in appear on the ${settings.recipient_label.toLowerCase()} copy.`}
      >
        <TextAreaField
          label="Concern / reason for visit"
          value={form.chief_complaint}
          onChange={(value) => set("chief_complaint", value)}
          error={errors.chief_complaint}
          placeholder="What the client came in with, or the goal for this visit…"
          rows={2}
        />
        <TextAreaField
          label="Assessment / result"
          value={form.diagnosis}
          onChange={(value) => set("diagnosis", value)}
          error={errors.diagnosis}
          placeholder="Findings, result, diagnosis or progress note…"
          rows={3}
        />
        <TextAreaField
          label="Observations / findings"
          value={form.examination}
          onChange={(value) => set("examination", value)}
          error={errors.examination}
          placeholder="Measurements, observations or relevant history…"
          rows={2}
        />
        <TextAreaField
          label="Checks / tests"
          value={form.tests}
          onChange={(value) => set("tests", value)}
          error={errors.tests}
          placeholder="Tests, measurements or review plan…"
          rows={2}
        />
        <TextAreaField
          label="Service / treatment"
          value={form.treatment}
          onChange={(value) => set("treatment", value)}
          error={errors.treatment}
          placeholder="What was done during this visit…"
          rows={2}
        />
      </Section>

      <Section
        title={settings.plan_title}
        description={`Medicines, recommendations or plan items for the ${settings.recipient_label.toLowerCase()}.`}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={addMedicine}
            disabled={form.medicines.length >= CRM_MAX_REPORT_MEDICINES}
            className="h-8 px-2.5 text-[11px]"
          >
            + Add item
          </Button>
        }
      >
        {form.medicines.map((medicine, index) => (
          <fieldset
            key={medicine.key}
            className="rounded-control border border-black/10 bg-[#FBFCFE] p-3"
          >
            <legend className="px-1 text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
              Item {index + 1}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Item / medicine name"
                  value={medicine.name}
                  onChange={(event) =>
                    updateMedicine(medicine.key, { name: event.target.value })
                  }
                  placeholder="e.g. Cetirizine 10 mg or home workout"
                  maxLength={CRM_MAX_MEDICINE_NAME}
                />
              </div>
              <Input
                label="Dose"
                value={medicine.dose}
                onChange={(event) =>
                  updateMedicine(medicine.key, { dose: event.target.value })
                }
                placeholder="1 tablet"
                maxLength={CRM_MAX_MEDICINE_DOSE}
              />
              <Input
                label="Frequency"
                value={medicine.frequency}
                onChange={(event) =>
                  updateMedicine(medicine.key, { frequency: event.target.value })
                }
                placeholder="Once daily after food"
                maxLength={CRM_MAX_MEDICINE_FREQUENCY}
              />
              <Input
                label="Duration"
                value={medicine.duration}
                onChange={(event) =>
                  updateMedicine(medicine.key, { duration: event.target.value })
                }
                placeholder="5 days"
                maxLength={CRM_MAX_MEDICINE_DURATION}
              />
              <Input
                label="Instructions"
                value={medicine.instructions}
                onChange={(event) =>
                  updateMedicine(medicine.key, {
                    instructions: event.target.value,
                  })
                }
                placeholder="Avoid alcohol…"
                maxLength={CRM_MAX_MEDICINE_INSTRUCTIONS}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeMedicine(medicine.key)}
                disabled={form.medicines.length <= 1}
                className="text-[10px] font-medium text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                Remove item
              </button>
            </div>
          </fieldset>
        ))}
        {errors.medicines ? (
          <p role="alert" className="text-[11px] text-red-700">
            {errors.medicines}
          </p>
        ) : null}
      </Section>

      <Section title="Advice and follow-up">
        <TextAreaField
          label="Advice / aftercare"
          value={form.advice}
          onChange={(value) => set("advice", value)}
          error={errors.advice}
          placeholder="Aftercare, diet, activity, next steps or warning signs…"
          rows={3}
        />
        <Input
          label="Follow-up date"
          type="date"
          value={form.follow_up_date}
          onChange={(event) => set("follow_up_date", event.target.value)}
          error={errors.follow_up_date}
          hint={`Optional. The ${settings.recipient_label.toLowerCase()} copy prints this date.`}
        />
      </Section>

      <Section
        title={`${settings.recipient_label} copy and privacy`}
        description="The report stays in this CRM until you share it."
      >
        <label className="flex items-start gap-2 rounded-control border border-black/10 bg-[#F8FAFC] px-2.5 py-2 text-[11px] leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={form.include_photos}
            disabled={!photosAvailable}
            onChange={(event) => set("include_photos", event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue disabled:opacity-40"
          />
          <span>
            Include this visit&apos;s before/after photos in the client copy.
            {!photosAvailable
              ? " Add photos to the visit and record client consent first."
              : ""}
          </span>
        </label>
        {errors.include_photos ? (
          <p role="alert" className="text-[11px] text-red-700">
            {errors.include_photos}
          </p>
        ) : null}
        <label className="flex items-start gap-2 rounded-control border border-black/10 bg-[#F8FAFC] px-2.5 py-2 text-[11px] leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={form.share_consent}
            onChange={(event) => set("share_consent", event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
          />
          <span>
            The {settings.recipient_label.toLowerCase()} agreed to receive this
            report electronically. This is required before sharing photos.
          </span>
        </label>
        {errors.share_consent ? (
          <p role="alert" className="text-[11px] text-red-700">
            {errors.share_consent}
          </p>
        ) : null}
        <p className="text-[10px] leading-relaxed text-ink-muted">
          Sharing creates a private, self-contained report file on this device.
          It is not uploaded to a public web page.
        </p>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4">
        <p className="text-[10px] text-ink-muted">
          One report per visit. You can edit it later without changing the visit
          or invoice.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!providerReady}>
            {initial ? "Save report" : "Generate report"}
          </Button>
        </div>
      </div>
    </form>
  );
}

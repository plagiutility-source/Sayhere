/**
 * The ONE place the CRM rules live (CRM_FEATURE.md, business-rules.md 15).
 *
 * Everything here is pure: no React, no localStorage, no clock unless passed
 * in. The mock store and the UI call these functions, and
 * `scripts/crm-rules-check.ts` tests them without a browser. Stage 3 reuses the
 * same functions on the server.
 */

import type { CrmPlanLimits } from "@/lib/mock/plans";
import { isValidEmail } from "@/lib/validation";
import {
  CRM_FIELD_KEY_PATTERN,
  CRM_HARD_LIMITS,
  CRM_INVOICE_PREFIX_PATTERN,
  CRM_MAX_ACTIVITY,
  CRM_MAX_AMOUNT,
  CRM_MAX_APPROVAL_TEXT,
  CRM_MAX_BILLING_ADDRESS,
  CRM_MAX_COMPANY,
  CRM_MAX_DOCTOR_NAME,
  CRM_MAX_DOCTOR_QUALIFICATION,
  CRM_MAX_DOCTOR_REGISTRATION,
  CRM_MAX_DUE_DAYS,
  CRM_MAX_EMAIL,
  CRM_MAX_GSTIN,
  CRM_MAX_INVOICE_DESCRIPTION,
  CRM_MAX_INVOICE_LINES,
  CRM_MAX_INVOICE_NOTES,
  CRM_MAX_INVOICE_PREFIX,
  CRM_MAX_TAX_PERCENT,
  CRM_MAX_TERMS,
  CRM_MAX_FIELD_LABEL,
  CRM_MAX_LONG_TEXT,
  CRM_MAX_NAME,
  CRM_MAX_OPTION_LENGTH,
  CRM_MAX_OPTIONS,
  CRM_MAX_MEDICINE_DOSE,
  CRM_MAX_MEDICINE_DURATION,
  CRM_MAX_MEDICINE_FREQUENCY,
  CRM_MAX_MEDICINE_INSTRUCTIONS,
  CRM_MAX_MEDICINE_NAME,
  CRM_MAX_PATIENT_AGE,
  CRM_MAX_PAYMENT_NOTE,
  CRM_MAX_PROVIDER_NAME,
  CRM_MAX_PROVIDER_QUALIFICATION,
  CRM_MAX_PROVIDER_REGISTRATION,
  CRM_MAX_PROVIDER_SIGNATURE,
  CRM_MAX_REPORT_COMPLAINT,
  CRM_MAX_REPORT_FOOTER,
  CRM_MAX_REPORT_LABEL,
  CRM_MAX_REPORT_TITLE,
  CRM_MAX_REPORT_MEDICINES,
  CRM_MAX_REPORT_SECTION,
  CRM_MAX_SERVICE,
  CRM_MAX_STAGE_NAME,
  CRM_MAX_TAG,
  CRM_MAX_TAGS_PER_CONTACT,
  CRM_MAX_TASK_TITLE,
  CRM_MAX_TEXT,
  CRM_MIN_STAGES,
  CRM_PATIENT_GENDER_LABELS,
  CRM_PAYMENT_METHOD_LABELS,
  firstOpenStage,
  nextFieldKey,
  type CrmConfig,
  type CrmFieldDef,
  type CrmPatientGender,
  type CrmFieldType,
  type CrmStage,
} from "./config";
import { isCrmPhotoDataUrl } from "./photos";

export type CrmConsentStatus = "unknown" | "opted_in" | "opted_out";
export type CrmContactSource = "manual" | "import" | "feedback" | "loyalty" | "order";
export type CrmActivityKind = "note" | "call" | "email" | "visit" | "system";
export type CrmValue = string | number | boolean | string[] | null;

export type CrmContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage_id: string;
  custom_fields: Record<string, CrmValue>;
  consent_status: CrmConsentStatus;
  consent_source: string | null;
  consent_at: string | null;
  source: CrmContactSource;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CrmActivity = {
  id: string;
  contact_id: string;
  kind: CrmActivityKind;
  body: string;
  created_by: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type CrmTask = {
  id: string;
  contact_id: string;
  title: string;
  due_on: string | null;
  status: "open" | "done";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmTag = { id: string; name: string; created_at: string };

export type CrmContactTag = { contact_id: string; tag_id: string };

export type CrmPaymentMethod = keyof typeof CRM_PAYMENT_METHOD_LABELS;

export type CrmInvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type CrmInvoice = {
  /** Stable, human-readable number, e.g. INV-0001. */
  number: string;
  issue_date: string;
  due_date: string;
  lines: CrmInvoiceLine[];
  /** Absolute discount in rupees. */
  discount: number;
  tax_percent: number;
  notes: string;
  terms: string;
  created_at: string;
  updated_at: string;
};

export type CrmServiceEntry = {
  id: string;
  contact_id: string;
  /** The work, service or item delivered. */
  service: string;
  entry_date: string;
  /** Whole rupees or two-decimal amounts; never negative. */
  billed: number;
  paid: number;
  payment_method: CrmPaymentMethod;
  notes: string;
  /** Compressed data URLs; private to the CRM in the Stage 1 mock. */
  before_photo: string | null;
  after_photo: string | null;
  /** Required when either photo is present. */
  photo_consent: boolean;
  /** Present only when this visit has been turned into an invoice. */
  invoice: CrmInvoice | null;
  /** Present only when a patient report / prescription was written for this visit. */
  report: CrmClinicalReport | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CrmReportMedicine = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

/** A patient-facing report attached to one visit. Stage 1 keeps it in localStorage. */
export type CrmClinicalReport = {
  number: string;
  doctor_name: string;
  doctor_qualification: string;
  doctor_registration: string;
  patient_age: string;
  patient_gender: CrmPatientGender | "";
  chief_complaint: string;
  diagnosis: string;
  examination: string;
  tests: string;
  treatment: string;
  medicines: CrmReportMedicine[];
  advice: string;
  follow_up_date: string | null;
  include_photos: boolean;
  /** The patient agreed to receive this report (and any selected photos). */
  share_consent: boolean;
  created_at: string;
  updated_at: string;
};

export type CrmReportDraft = {
  doctor_name: string;
  doctor_qualification: string;
  doctor_registration: string;
  patient_age: string;
  patient_gender: CrmPatientGender | "";
  chief_complaint: string;
  diagnosis: string;
  examination: string;
  tests: string;
  treatment: string;
  medicines: Omit<CrmReportMedicine, "id">[];
  advice: string;
  follow_up_date: string | null;
  include_photos: boolean;
  share_consent: boolean;
};

export type CrmServiceDraft = {
  contact_id: string;
  service: string;
  entry_date: string;
  billed: number;
  paid: number;
  payment_method: CrmPaymentMethod;
  notes: string;
  before_photo: string | null;
  after_photo: string | null;
  photo_consent: boolean;
};

export type CrmServiceStatus = "paid" | "partial" | "unpaid";

export type CrmInvoiceDraft = {
  /** Existing work record, or null when creating a new invoice + work entry. */
  entry_id: string | null;
  contact_id: string;
  service: string;
  entry_date: string;
  issue_date: string;
  due_date: string;
  lines: { description: string; quantity: number; rate: number }[];
  discount: number;
  tax_percent: number;
  paid: number;
  payment_method: CrmPaymentMethod;
  notes: string;
  terms: string;
};

export type CrmInvoiceTotals = {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
};

export type CrmState = {
  version: 1;
  config: CrmConfig;
  contacts: CrmContact[];
  activities: CrmActivity[];
  tasks: CrmTask[];
  tags: CrmTag[];
  contact_tags: CrmContactTag[];
  service_entries: CrmServiceEntry[];
  /** Monotonic invoice counter; deleted invoices never reuse a number. */
  invoice_seq: number;
  /** Monotonic patient-report counter; deleted reports never reuse a number. */
  report_seq: number;
};

export type CrmContactDraft = {
  name: string;
  email: string;
  phone: string;
  company: string;
  stage_id: string;
  custom_fields: Record<string, string | string[] | boolean>;
  consent_status: CrmConsentStatus;
  tags: string[];
};

export type CrmConfigIssue = string;

const DAY_MS = 86_400_000;
const DUPLICATE_EMAIL = "That email address is already a contact.";

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Digits plus an optional leading `+`, so "+91 98200 11001" -> "+919820011001". */
export function normalizePhone(value: string | null | undefined): string {
  // Exports prefix formula-looking cells with `'`; strip it before checking for
  // the leading `+`, so a CSV round-trip keeps the country-code plus.
  const raw = (value ?? "").trim().replace(/^'/, "");
  const plus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return digits ? `${plus ? "+" : ""}${digits}` : "";
}

export function isValidCrmPhone(value: string | null | undefined): boolean {
  const phone = normalizePhone(value);
  return /^\+?[0-9]{7,15}$/.test(phone);
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function todayKey(now: Date, timeZone = "Asia/Kolkata"): string {
  return dateKeyInTimeZone(now, timeZone);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function empty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function validateCustomValue(
  field: CrmFieldDef,
  value: string | string[] | boolean | undefined,
): string | undefined {
  if (empty(value)) {
    return field.required ? "This field is required." : undefined;
  }
  switch (field.type) {
    case "text": {
      if (typeof value !== "string") return "Enter text.";
      if (value.trim().length > CRM_MAX_TEXT) {
        return `Keep this under ${CRM_MAX_TEXT} characters.`;
      }
      return undefined;
    }
    case "long_text": {
      if (typeof value !== "string") return "Enter text.";
      if (value.trim().length > CRM_MAX_LONG_TEXT) {
        return `Keep this under ${CRM_MAX_LONG_TEXT} characters.`;
      }
      return undefined;
    }
    case "number": {
      if (typeof value === "boolean" || Array.isArray(value)) return "Enter a number.";
      if (!Number.isFinite(Number(value))) return "Enter a number.";
      return undefined;
    }
    case "date": {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Choose a valid date.";
      }
      if (Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        return "Choose a valid date.";
      }
      return undefined;
    }
    case "select": {
      if (typeof value !== "string" || !field.options.includes(value)) {
        return "Choose one of the options.";
      }
      return undefined;
    }
    case "multi_select": {
      if (!Array.isArray(value) || value.some((item) => !field.options.includes(item))) {
        return "Choose from the options.";
      }
      return undefined;
    }
    case "checkbox": {
      if (typeof value !== "boolean") return "Choose yes or no.";
      return undefined;
    }
    default:
      return "Choose a valid value.";
  }
}

/** Friendly field key -> first error message, used by forms and imports. */
export function validateContactInput(
  input: CrmContactDraft,
  state: CrmState,
  contactId?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  if (!name) errors.name = "Enter a name.";
  else if (name.length > CRM_MAX_NAME) {
    errors.name = `Keep the name under ${CRM_MAX_NAME} characters.`;
  }

  const email = normalizeEmail(input.email);
  if (email.length > CRM_MAX_EMAIL) {
    errors.email = `Keep the email under ${CRM_MAX_EMAIL} characters.`;
  } else if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = normalizePhone(input.phone);
  if (phone && !isValidCrmPhone(phone)) {
    errors.phone = "Use 7 to 15 digits for the phone number.";
  }

  if (!email && !phone) {
    errors.contact = "Add an email address or phone number.";
  }

  if ((input.company ?? "").trim().length > CRM_MAX_COMPANY) {
    errors.company = `Keep the company under ${CRM_MAX_COMPANY} characters.`;
  }

  if (!state.config.stages.some((stage) => stage.id === input.stage_id)) {
    errors.stage_id = "Choose a stage.";
  }

  const tags = input.tags.map((tag) => tag.trim()).filter(Boolean);
  if (tags.length > CRM_MAX_TAGS_PER_CONTACT) {
    errors.tags = `Use up to ${CRM_MAX_TAGS_PER_CONTACT} tags on a contact.`;
  } else if (tags.some((tag) => tag.length > CRM_MAX_TAG)) {
    errors.tags = `Keep each tag under ${CRM_MAX_TAG} characters.`;
  }

  for (const field of state.config.fields) {
    if (field.archived) continue;
    const message = validateCustomValue(field, input.custom_fields[field.key]);
    if (message) errors[`custom:${field.key}`] = message;
  }

  if (
    email &&
    state.contacts.some(
      (contact) =>
        !contact.deleted_at &&
        contact.id !== contactId &&
        normalizeEmail(contact.email) === email,
    )
  ) {
    errors.email = DUPLICATE_EMAIL;
  }

  return errors;
}

/**
 * Config validation. `contacts` is passed so removing a stage that still holds
 * contacts is refused (the move must happen first).
 */
export function validateCrmConfig(
  config: CrmConfig,
  limits: CrmPlanLimits,
  contacts: CrmContact[] = [],
): CrmConfigIssue[] {
  const issues: string[] = [];
  if (config.version !== 1) issues.push("Unsupported config version.");

  const billing = config.billing;
  if (!billing) {
    issues.push("Invoice details are missing.");
  } else {
    if (billing.address.length > CRM_MAX_BILLING_ADDRESS) {
      issues.push(`Keep the invoice address under ${CRM_MAX_BILLING_ADDRESS} characters.`);
    }
    if (billing.phone.length > 20) {
      issues.push("Keep the invoice phone under 20 characters.");
    }
    if (billing.email.trim() && !isValidEmail(billing.email)) {
      issues.push("Enter a valid invoice email address.");
    }
    if (billing.gstin && !/^[0-9A-Z]{15}$/.test(billing.gstin)) {
      issues.push("Enter a valid 15-character GSTIN, or leave it blank.");
    }
    if (
      billing.invoice_prefix.length > CRM_MAX_INVOICE_PREFIX ||
      !CRM_INVOICE_PREFIX_PATTERN.test(billing.invoice_prefix)
    ) {
      issues.push("Use 2 to 8 letters or numbers for the invoice prefix.");
    }
    if (
      !Number.isFinite(billing.default_tax_percent) ||
      billing.default_tax_percent < 0 ||
      billing.default_tax_percent > CRM_MAX_TAX_PERCENT
    ) {
      issues.push(`Default tax must be between 0 and ${CRM_MAX_TAX_PERCENT}%.`);
    }
    if (
      !Number.isInteger(billing.default_due_days) ||
      billing.default_due_days < 0 ||
      billing.default_due_days > CRM_MAX_DUE_DAYS
    ) {
      issues.push(`Default due days must be between 0 and ${CRM_MAX_DUE_DAYS}.`);
    }
    if (billing.terms.length > CRM_MAX_TERMS) {
      issues.push(`Keep invoice terms under ${CRM_MAX_TERMS} characters.`);
    }
  }

  const report = config.report;
  if (report) {
    const limits: [keyof typeof report, number, string][] = [
      ["report_title", CRM_MAX_REPORT_TITLE, "report title"],
      ["recipient_label", CRM_MAX_REPORT_LABEL, "recipient label"],
      ["provider_label", CRM_MAX_REPORT_LABEL, "provider label"],
      ["provider_name", CRM_MAX_PROVIDER_NAME, "provider name"],
      ["provider_qualification", CRM_MAX_PROVIDER_QUALIFICATION, "qualification"],
      ["provider_registration", CRM_MAX_PROVIDER_REGISTRATION, "registration"],
      ["provider_signature", CRM_MAX_PROVIDER_SIGNATURE, "signature"],
      ["approval_text", CRM_MAX_APPROVAL_TEXT, "approval wording"],
      ["plan_title", CRM_MAX_REPORT_LABEL, "plan title"],
      ["footer_note", CRM_MAX_REPORT_FOOTER, "report footer"],
    ];
    for (const [key, max, label] of limits) {
      if (report[key].length > max) {
        issues.push(`Keep the ${label} under ${max} characters.`);
      }
    }
    if (!report.report_title.trim()) issues.push("Add a report title.");
    if (!report.recipient_label.trim()) issues.push("Add a recipient label.");
    if (!report.provider_label.trim()) issues.push("Add a provider label.");
    if (!report.plan_title.trim()) issues.push("Add a plan section title.");
  } else {
    issues.push("Report details are missing.");
  }

  const fieldLimit = Math.min(limits.fields, CRM_HARD_LIMITS.fields);
  if (config.fields.length > fieldLimit) {
    issues.push(`You can add up to ${fieldLimit} custom fields on your plan.`);
  }

  const keys = new Set<string>();
  const labels = new Set<string>();
  for (const field of config.fields) {
    if (!CRM_FIELD_KEY_PATTERN.test(field.key)) {
      issues.push("Field keys must start with a letter and use lowercase letters, numbers or underscores.");
    }
    if (keys.has(field.key)) issues.push("Field names must be unique.");
    keys.add(field.key);
    if (!field.label.trim() || field.label.trim().length > CRM_MAX_FIELD_LABEL) {
      issues.push(`Keep each field label between 1 and ${CRM_MAX_FIELD_LABEL} characters.`);
    }
    const normalizedLabel = field.label.trim().toLowerCase();
    if (normalizedLabel && labels.has(normalizedLabel)) {
      issues.push("Column names must be unique.");
    }
    labels.add(normalizedLabel);
    if (field.type === "select" || field.type === "multi_select") {
      if (field.options.length < 1 || field.options.length > CRM_MAX_OPTIONS) {
        issues.push(`Add 1 to ${CRM_MAX_OPTIONS} options for ${field.label || "each choice field"}.`);
      }
      const seen = new Set<string>();
      for (const option of field.options) {
        const value = option.trim();
        if (!value || value.length > CRM_MAX_OPTION_LENGTH) {
          issues.push(`Each option needs 1 to ${CRM_MAX_OPTION_LENGTH} characters.`);
        }
        if (seen.has(value.toLowerCase())) {
          issues.push(`Options for ${field.label || "a field"} must be unique.`);
        }
        seen.add(value.toLowerCase());
      }
    }
  }

  const stageLimit = Math.min(limits.stages, CRM_HARD_LIMITS.stages);
  if (config.stages.length < CRM_MIN_STAGES) {
    issues.push("Add at least two stages.");
  }
  if (config.stages.length > stageLimit) {
    issues.push(`Your plan allows up to ${stageLimit} stages.`);
  }
  const stageNames = new Set<string>();
  const stageIds = new Set<string>();
  for (const stage of config.stages) {
    const name = stage.name.trim();
    if (!name || name.length > CRM_MAX_STAGE_NAME) {
      issues.push(`Keep each stage name between 1 and ${CRM_MAX_STAGE_NAME} characters.`);
    }
    if (stageNames.has(name.toLowerCase())) {
      issues.push("That stage name is already used.");
    }
    stageNames.add(name.toLowerCase());
    if (stageIds.has(stage.id)) issues.push("Stage ids must be unique.");
    stageIds.add(stage.id);
  }
  if (config.stages.filter((stage) => stage.kind === "won").length !== 1) {
    issues.push("Keep one won and one lost stage.");
  }
  if (config.stages.filter((stage) => stage.kind === "lost").length !== 1) {
    issues.push("Keep one won and one lost stage.");
  }
  if (!config.stages.some((stage) => stage.kind === "open")) {
    issues.push("Keep at least one open stage.");
  }

  const configStageIds = new Set(config.stages.map((stage) => stage.id));
  if (
    contacts.some(
      (contact) => !contact.deleted_at && !configStageIds.has(contact.stage_id),
    )
  ) {
    issues.push("Move the contacts in this stage before deleting it.");
  }

  return Array.from(new Set(issues));
}

export type CrmFieldDraft = {
  label: string;
  type: CrmFieldType;
  options?: string[];
  required?: boolean;
  show_in_list?: boolean;
};

export type AddCrmFieldResult =
  | { ok: true; state: CrmState; field: CrmFieldDef }
  | { ok: false; error: string };

/** Add one validated custom column without bypassing plan limits. */
export function addCrmField(
  state: CrmState,
  draft: CrmFieldDraft,
  limits: CrmPlanLimits,
): AddCrmFieldResult {
  const label = draft.label.trim();
  if (!label) return { ok: false, error: "Give the column a name." };

  const fieldLimit = Math.min(limits.fields, CRM_HARD_LIMITS.fields);
  if (state.config.fields.length >= fieldLimit) {
    return {
      ok: false,
      error: `Your plan allows ${fieldLimit} custom columns. Upgrade for more.`,
    };
  }

  const options =
    draft.type === "select" || draft.type === "multi_select"
      ? (draft.options ?? [])
          .map((option) => option.trim())
          .filter(Boolean)
      : [];
  const field: CrmFieldDef = {
    key: nextFieldKey(label, state.config),
    label,
    type: draft.type,
    required: draft.required ?? false,
    show_in_list: draft.show_in_list ?? true,
    options,
    archived: false,
  };
  const config: CrmConfig = {
    ...state.config,
    fields: [...state.config.fields, field],
  };
  const issues = validateCrmConfig(config, limits, state.contacts);
  if (issues.length) return { ok: false, error: issues[0] };
  return { ok: true, state: { ...state, config }, field };
}

export function stageById(config: CrmConfig, stageId: string): CrmStage | null {
  return config.stages.find((stage) => stage.id === stageId) ?? null;
}

export function stageName(config: CrmConfig, stageId: string): string {
  return stageById(config, stageId)?.name ?? "Unknown stage";
}

export function liveContacts(state: CrmState): CrmContact[] {
  return state.contacts.filter((contact) => !contact.deleted_at);
}

export function contactTags(state: CrmState, contactId: string): CrmTag[] {
  const ids = new Set(
    state.contact_tags
      .filter((link) => link.contact_id === contactId)
      .map((link) => link.tag_id),
  );
  return state.tags.filter((tag) => ids.has(tag.id));
}

export function openTasksFor(state: CrmState, contactId: string): CrmTask[] {
  return state.tasks.filter(
    (task) => task.contact_id === contactId && task.status === "open",
  );
}

export type CrmStageCount = { stage: CrmStage; count: number };

export type CrmServiceStats = {
  count: number;
  billed: number;
  paid: number;
  outstanding: number;
  unpaid: number;
  last: CrmServiceEntry | null;
};

export type CrmStats = {
  total: number;
  new30: number;
  byStage: CrmStageCount[];
  tasksDue: number;
  tasksOverdue: number;
  optedIn: number;
  services: CrmServiceStats;
};

export function crmStats(
  state: CrmState,
  now = new Date(),
  timeZone = "Asia/Kolkata",
): CrmStats {
  const contacts = liveContacts(state);
  const today = todayKey(now, timeZone);
  const cutoff = now.getTime() - 30 * DAY_MS;
  const openTasks = state.tasks.filter((task) => task.status === "open");
  return {
    total: contacts.length,
    new30: contacts.filter(
      (contact) => new Date(contact.created_at).getTime() >= cutoff,
    ).length,
    byStage: state.config.stages.map((stage) => ({
      stage,
      count: contacts.filter((contact) => contact.stage_id === stage.id).length,
    })),
    tasksDue: openTasks.filter((task) => task.due_on === today).length,
    tasksOverdue: openTasks.filter(
      (task) => Boolean(task.due_on) && task.due_on! < today,
    ).length,
    optedIn: contacts.filter((contact) => contact.consent_status === "opted_in")
      .length,
    services: crmServiceStats(state),
  };
}

export function serviceEntriesFor(
  state: CrmState,
  contactId: string,
): CrmServiceEntry[] {
  return state.service_entries
    .filter(
      (entry) => entry.contact_id === contactId && !entry.deleted_at,
    )
    .slice()
    .sort((a, b) => {
      if (a.entry_date !== b.entry_date) return b.entry_date.localeCompare(a.entry_date);
      return b.created_at.localeCompare(a.created_at);
    });
}

/** Visits with a patient report, newest report first. */
export function reportsFor(
  state: CrmState,
  contactId?: string,
): CrmServiceEntry[] {
  return state.service_entries
    .filter(
      (entry) =>
        !entry.deleted_at &&
        entry.report !== null &&
        (!contactId || entry.contact_id === contactId),
    )
    .slice()
    .sort((a, b) => {
      const aDate = a.report?.updated_at ?? a.updated_at;
      const bDate = b.report?.updated_at ?? b.updated_at;
      return bDate.localeCompare(aDate);
    });
}

export function serviceBalance(entry: CrmServiceEntry): number {
  return Math.max(0, Math.round((entry.billed - entry.paid) * 100) / 100);
}

export function serviceStatus(entry: CrmServiceEntry): CrmServiceStatus {
  if (entry.paid >= entry.billed) return "paid";
  if (entry.paid > 0) return "partial";
  return "unpaid";
}

export function crmServiceStats(
  state: CrmState,
  contactId?: string,
): CrmServiceStats {
  const liveContactIds = new Set(
    state.contacts
      .filter((contact) => !contact.deleted_at)
      .map((contact) => contact.id),
  );
  const entries = state.service_entries
    .filter(
      (entry) =>
        !entry.deleted_at &&
        liveContactIds.has(entry.contact_id) &&
        (!contactId || entry.contact_id === contactId),
    )
    .slice()
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const billed = entries.reduce((sum, entry) => sum + entry.billed, 0);
  const paid = entries.reduce((sum, entry) => sum + entry.paid, 0);
  return {
    count: entries.length,
    billed: Math.round(billed * 100) / 100,
    paid: Math.round(paid * 100) / 100,
    outstanding: Math.max(0, Math.round((billed - paid) * 100) / 100),
    unpaid: entries.filter((entry) => serviceStatus(entry) !== "paid").length,
    last: entries[0] ?? null,
  };
}

function validDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function moneyText(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function validateServiceInput(
  state: CrmState,
  input: CrmServiceDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const contact = state.contacts.find(
    (item) => item.id === input.contact_id && !item.deleted_at,
  );
  if (!contact) errors.contact_id = "Choose a client.";
  const service = input.service.trim();
  if (!service) errors.service = "Describe the work or service.";
  else if (service.length > CRM_MAX_SERVICE) {
    errors.service = `Keep the service under ${CRM_MAX_SERVICE} characters.`;
  }
  if (!validDateKey(input.entry_date)) errors.entry_date = "Choose a valid date.";
  const billed = roundMoney(Number(input.billed));
  const paid = roundMoney(Number(input.paid));
  if (!Number.isFinite(billed) || billed < 0) {
    errors.billed = "Enter a valid total cost.";
  } else if (billed > CRM_MAX_AMOUNT) {
    errors.billed = "That amount is too large.";
  }
  if (!Number.isFinite(paid) || paid < 0) {
    errors.paid = "Enter a valid amount paid.";
  } else if (paid > billed) {
    errors.paid = "Amount paid cannot be more than the total cost.";
  }
  if (!(input.payment_method in CRM_PAYMENT_METHOD_LABELS)) {
    errors.payment_method = "Choose a payment method.";
  }
  if (input.notes.length > CRM_MAX_PAYMENT_NOTE) {
    errors.notes = `Keep notes under ${CRM_MAX_PAYMENT_NOTE} characters.`;
  }
  if (input.before_photo && !isCrmPhotoDataUrl(input.before_photo)) {
    errors.before_photo = "Choose a JPG, PNG or WebP photo.";
  }
  if (input.after_photo && !isCrmPhotoDataUrl(input.after_photo)) {
    errors.after_photo = "Choose a JPG, PNG or WebP photo.";
  }
  if ((input.before_photo || input.after_photo) && !input.photo_consent) {
    errors.photo_consent = "Confirm the client agreed to these photos.";
  }
  return errors;
}

type ServiceOk = { ok: true; state: CrmState; entry: CrmServiceEntry };
type ServiceFail = { ok: false; errors: Record<string, string> };

export function addServiceEntry(
  state: CrmState,
  input: CrmServiceDraft,
  now = new Date(),
): ServiceOk | ServiceFail {
  const errors = validateServiceInput(state, input);
  if (Object.keys(errors).length) return { ok: false, errors };
  const service = input.service.trim();
  const timestamp = now.toISOString();
  const entry: CrmServiceEntry = {
    id: makeId("svc"),
    contact_id: input.contact_id,
    service,
    entry_date: input.entry_date,
    billed: roundMoney(Number(input.billed)),
    paid: roundMoney(Number(input.paid)),
    payment_method: input.payment_method,
    notes: input.notes.trim(),
    before_photo: input.before_photo ?? null,
    after_photo: input.after_photo ?? null,
    photo_consent: Boolean(input.photo_consent),
    invoice: null,
    report: null,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  };
  return {
    ok: true,
    entry,
    state: {
      ...state,
      service_entries: [...state.service_entries, entry],
      contacts: state.contacts.map((contact) =>
        contact.id === entry.contact_id
          ? {
              ...contact,
              last_activity_at: timestamp,
              updated_at: timestamp,
            }
          : contact,
      ),
      activities: [
        ...state.activities,
        systemActivity(
          entry.contact_id,
          `Work logged: ${service} · ${moneyText(entry.billed)} · ${moneyText(entry.paid)} paid.`,
          now,
        ),
      ],
    },
  };
}

export function updateServiceEntry(
  state: CrmState,
  entryId: string,
  input: CrmServiceDraft,
  now = new Date(),
): ServiceOk | ServiceFail {
  const existing = state.service_entries.find(
    (entry) => entry.id === entryId && !entry.deleted_at,
  );
  if (!existing) return { ok: false, errors: { entry: "That record was not found." } };
  const errors = validateServiceInput(state, {
    ...input,
    contact_id: existing.contact_id,
  });
  const nextBilled = roundMoney(Number(input.billed));
  if (existing.invoice && nextBilled !== existing.billed) {
    errors.billed = "Change the total from the invoice.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const timestamp = now.toISOString();
  const nextService = input.service.trim();
  const entry: CrmServiceEntry = {
    ...existing,
    service: nextService,
    entry_date: input.entry_date,
    billed: nextBilled,
    paid: roundMoney(Number(input.paid)),
    payment_method: input.payment_method,
    notes: input.notes.trim(),
    before_photo: input.before_photo ?? null,
    after_photo: input.after_photo ?? null,
    photo_consent: Boolean(input.photo_consent),
    invoice: existing.invoice
      ? {
          ...existing.invoice,
          lines: existing.invoice.lines.map((line, index) =>
            index === 0 && line.description === existing.service
              ? { ...line, description: nextService }
              : line,
          ),
          updated_at: timestamp,
        }
      : null,
    updated_at: timestamp,
  };
  return {
    ok: true,
    entry,
    state: {
      ...state,
      service_entries: state.service_entries.map((item) =>
        item.id === entryId ? entry : item,
      ),
      contacts: state.contacts.map((contact) =>
        contact.id === entry.contact_id
          ? { ...contact, last_activity_at: timestamp, updated_at: timestamp }
          : contact,
      ),
      activities: [
        ...state.activities,
        systemActivity(
          entry.contact_id,
          `Work record updated: ${entry.service} · ${moneyText(entry.billed)} · ${moneyText(entry.paid)} paid.`,
          now,
        ),
      ],
    },
  };
}

export function deleteServiceEntry(
  state: CrmState,
  entryId: string,
  now = new Date(),
): Mutation {
  const existing = state.service_entries.find(
    (entry) => entry.id === entryId && !entry.deleted_at,
  );
  if (!existing) return { ok: false, error: "That record was not found." };
  const timestamp = now.toISOString();
  return {
    ok: true,
    state: {
      ...state,
      service_entries: state.service_entries.map((entry) =>
        entry.id === entryId
          ? { ...entry, deleted_at: timestamp, updated_at: timestamp }
          : entry,
      ),
      activities: [
        ...state.activities,
        systemActivity(
          existing.contact_id,
          `Work record removed: ${existing.service}.`,
          now,
        ),
      ],
    },
  };
}

export function invoiceTotals(
  lines: { quantity: number; rate: number }[],
  discount: number,
  taxPercent: number,
): CrmInvoiceTotals {
  const subtotal = roundMoney(
    lines.reduce(
      (sum, line) =>
        sum +
        Math.max(0, Number(line.quantity) || 0) *
          Math.max(0, Number(line.rate) || 0),
      0,
    ),
  );
  const safeDiscount = roundMoney(
    Math.min(subtotal, Math.max(0, Number(discount) || 0)),
  );
  const taxable = roundMoney(subtotal - safeDiscount);
  const safeTax = Math.min(
    CRM_MAX_TAX_PERCENT,
    Math.max(0, Number(taxPercent) || 0),
  );
  const tax = roundMoney((taxable * safeTax) / 100);
  return { subtotal, discount: safeDiscount, taxable, tax, total: roundMoney(taxable + tax) };
}

/** The next number never reuses a deleted invoice's number. */
export function nextInvoiceNumber(state: CrmState): string {
  const prefix = state.config.billing?.invoice_prefix || "INV";
  const next = Math.max(0, Math.floor(state.invoice_seq || 0)) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

/** The next report number never reuses a deleted or replaced report. */
export function nextReportNumber(state: CrmState): string {
  const next = Math.max(0, Math.floor(state.report_seq || 0)) + 1;
  return `RPT-${String(next).padStart(4, "0")}`;
}

export function invoicesFor(state: CrmState): CrmServiceEntry[] {
  return state.service_entries
    .filter((entry) => !entry.deleted_at && entry.invoice !== null)
    .slice()
    .sort((a, b) => {
      const aDate = a.invoice?.issue_date ?? a.entry_date;
      const bDate = b.invoice?.issue_date ?? b.entry_date;
      if (aDate !== bDate) return bDate.localeCompare(aDate);
      return b.created_at.localeCompare(a.created_at);
    });
}

export type CrmInvoiceStats = {
  count: number;
  billed: number;
  paid: number;
  outstanding: number;
  overdue: number;
};

export function crmInvoiceStats(
  state: CrmState,
  now = new Date(),
  timeZone = "Asia/Kolkata",
): CrmInvoiceStats {
  const today = todayKey(now, timeZone);
  const invoices = invoicesFor(state);
  const billed = invoices.reduce((sum, entry) => sum + entry.billed, 0);
  const paid = invoices.reduce((sum, entry) => sum + entry.paid, 0);
  return {
    count: invoices.length,
    billed: roundMoney(billed),
    paid: roundMoney(paid),
    outstanding: roundMoney(Math.max(0, billed - paid)),
    overdue: invoices.filter(
      (entry) =>
        Boolean(entry.invoice && entry.invoice.due_date < today) &&
        serviceBalance(entry) > 0,
    ).length,
  };
}

export function validateInvoiceDraft(
  state: CrmState,
  input: CrmInvoiceDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const contact = state.contacts.find(
    (item) => item.id === input.contact_id && !item.deleted_at,
  );
  if (!contact) errors.contact_id = "Choose a client.";

  const existing = input.entry_id
    ? state.service_entries.find(
        (entry) => entry.id === input.entry_id && !entry.deleted_at,
      )
    : null;
  if (input.entry_id && !existing) errors.entry = "That work record was not found.";
  if (existing && existing.contact_id !== input.contact_id) {
    errors.contact_id = "Keep the invoice on the same client.";
  }

  const service = input.service.trim();
  if (!service) errors.service = "Describe the work or service.";
  else if (service.length > CRM_MAX_SERVICE) {
    errors.service = `Keep the service under ${CRM_MAX_SERVICE} characters.`;
  }
  if (!validDateKey(input.entry_date)) errors.entry_date = "Choose a valid work date.";
  if (!validDateKey(input.issue_date)) errors.issue_date = "Choose a valid issue date.";
  if (!validDateKey(input.due_date)) errors.due_date = "Choose a valid due date.";
  if (
    validDateKey(input.issue_date) &&
    validDateKey(input.due_date) &&
    input.due_date < input.issue_date
  ) {
    errors.due_date = "The due date cannot be before the issue date.";
  }

  if (
    input.lines.length < 1 ||
    input.lines.length > CRM_MAX_INVOICE_LINES
  ) {
    errors.lines = `Add 1 to ${CRM_MAX_INVOICE_LINES} invoice lines.`;
  } else {
    const description = input.lines.find((line) => !line.description.trim());
    const tooLong = input.lines.find(
      (line) => line.description.trim().length > CRM_MAX_INVOICE_DESCRIPTION,
    );
    const badQuantity = input.lines.find(
      (line) =>
        !Number.isFinite(Number(line.quantity)) ||
        Number(line.quantity) <= 0 ||
        Number(line.quantity) > 999,
    );
    const badRate = input.lines.find(
      (line) =>
        !Number.isFinite(Number(line.rate)) ||
        Number(line.rate) < 0 ||
        Number(line.rate) > CRM_MAX_AMOUNT,
    );
    if (description) errors.lines = "Describe every invoice line.";
    else if (tooLong) {
      errors.lines = `Keep each line under ${CRM_MAX_INVOICE_DESCRIPTION} characters.`;
    } else if (badQuantity) errors.lines = "Each quantity must be between 1 and 999.";
    else if (badRate) errors.lines = "Enter a valid rate for every line.";
  }

  const totals = invoiceTotals(
    input.lines,
    input.discount,
    input.tax_percent,
  );
  if (!Number.isFinite(Number(input.discount)) || Number(input.discount) < 0) {
    errors.discount = "Enter a valid discount.";
  } else if (totals.subtotal > 0 && Number(input.discount) > totals.subtotal) {
    errors.discount = "The discount cannot be more than the subtotal.";
  }
  if (
    !Number.isFinite(Number(input.tax_percent)) ||
    Number(input.tax_percent) < 0 ||
    Number(input.tax_percent) > CRM_MAX_TAX_PERCENT
  ) {
    errors.tax_percent = `Enter tax between 0 and ${CRM_MAX_TAX_PERCENT}%.`;
  }
  if (totals.total <= 0) errors.lines = "Add at least one priced invoice line.";

  const paid = roundMoney(Number(input.paid));
  if (!Number.isFinite(paid) || paid < 0) {
    errors.paid = "Enter a valid amount paid.";
  } else if (paid > totals.total) {
    errors.paid = "Amount paid cannot be more than the invoice total.";
  }
  if (!(input.payment_method in CRM_PAYMENT_METHOD_LABELS)) {
    errors.payment_method = "Choose a payment method.";
  }
  if (input.notes.length > CRM_MAX_INVOICE_NOTES) {
    errors.notes = `Keep invoice notes under ${CRM_MAX_INVOICE_NOTES} characters.`;
  }
  if (input.terms.length > CRM_MAX_TERMS) {
    errors.terms = `Keep invoice terms under ${CRM_MAX_TERMS} characters.`;
  }
  return errors;
}

export type InvoiceOk = {
  ok: true;
  state: CrmState;
  entry: CrmServiceEntry;
  invoice: CrmInvoice;
  created: boolean;
};
export type InvoiceFail = { ok: false; errors: Record<string, string> };

/**
 * Creates an invoice and its work record together, or edits an existing work
 * record's invoice. `billed` is always the invoice total - one source of truth.
 */
export function saveInvoice(
  state: CrmState,
  input: CrmInvoiceDraft,
  now = new Date(),
): InvoiceOk | InvoiceFail {
  const errors = validateInvoiceDraft(state, input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const existing = input.entry_id
    ? state.service_entries.find(
        (entry) => entry.id === input.entry_id && !entry.deleted_at,
      )
    : undefined;
  const totals = invoiceTotals(
    input.lines,
    input.discount,
    input.tax_percent,
  );
  const timestamp = now.toISOString();
  const created = !existing?.invoice;
  const number = existing?.invoice?.number ?? nextInvoiceNumber(state);
  const invoice: CrmInvoice = {
    number,
    issue_date: input.issue_date,
    due_date: input.due_date,
    lines: input.lines.map((line) => ({
      id: makeId("invl"),
      description: line.description.trim(),
      quantity: Math.round(Number(line.quantity) * 100) / 100,
      rate: roundMoney(Number(line.rate)),
    })),
    discount: roundMoney(Number(input.discount)),
    tax_percent: Math.round(Number(input.tax_percent) * 100) / 100,
    notes: input.notes.trim(),
    terms: input.terms.trim(),
    created_at: existing?.invoice?.created_at ?? timestamp,
    updated_at: timestamp,
  };

  const entry: CrmServiceEntry = existing
    ? {
        ...existing,
        service: input.service.trim(),
        entry_date: input.entry_date,
        billed: totals.total,
        paid: roundMoney(Number(input.paid)),
        payment_method: input.payment_method,
        invoice,
        updated_at: timestamp,
      }
    : {
        id: makeId("svc"),
        contact_id: input.contact_id,
        service: input.service.trim(),
        entry_date: input.entry_date,
        billed: totals.total,
        paid: roundMoney(Number(input.paid)),
        payment_method: input.payment_method,
        notes: "",
        before_photo: null,
        after_photo: null,
        photo_consent: false,
        invoice,
        report: null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      };

  const nextState: CrmState = {
    ...state,
    invoice_seq: created ? state.invoice_seq + 1 : state.invoice_seq,
    service_entries: existing
      ? state.service_entries.map((item) => (item.id === existing.id ? entry : item))
      : [...state.service_entries, entry],
    contacts: state.contacts.map((contact) =>
      contact.id === entry.contact_id
        ? { ...contact, last_activity_at: timestamp, updated_at: timestamp }
        : contact,
    ),
    activities: [
      ...state.activities,
      systemActivity(
        entry.contact_id,
        created
          ? `Invoice ${number} created: ${entry.service} · ${moneyText(entry.billed)} · ${moneyText(entry.paid)} paid.`
          : `Invoice ${number} updated: ${entry.service} · ${moneyText(entry.billed)} · ${moneyText(entry.paid)} paid.`,
        now,
      ),
    ],
  };

  return { ok: true, state: nextState, entry, invoice, created };
}

export type ReportOk = {
  ok: true;
  state: CrmState;
  entry: CrmServiceEntry;
  report: CrmClinicalReport;
  created: boolean;
};
export type ReportFail = { ok: false; errors: Record<string, string> };

function reportText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

/** Rules for the patient report attached to one visit. */
export function validateReportDraft(
  state: CrmState,
  entryId: string,
  input: CrmReportDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const entry = state.service_entries.find(
    (item) => item.id === entryId && !item.deleted_at,
  );
  if (!entry) errors.entry = "That visit was not found. Log the visit first.";

  const provider = state.config.report;
  const providerName = input.doctor_name.trim() || provider.provider_name.trim();
  if (!providerName) {
    errors.doctor_name =
      "Add the service provider's name in CRM settings before generating a report.";
  } else if (providerName.length > CRM_MAX_PROVIDER_NAME) {
    errors.doctor_name = `Keep the provider name under ${CRM_MAX_PROVIDER_NAME} characters.`;
  }
  const qualification = input.doctor_qualification.trim() || provider.provider_qualification.trim();
  if (qualification.length > CRM_MAX_PROVIDER_QUALIFICATION) {
    errors.doctor_qualification = `Keep qualifications under ${CRM_MAX_PROVIDER_QUALIFICATION} characters.`;
  }
  const registration = input.doctor_registration.trim() || provider.provider_registration.trim();
  if (registration.length > CRM_MAX_PROVIDER_REGISTRATION) {
    errors.doctor_registration = `Keep the registration number under ${CRM_MAX_PROVIDER_REGISTRATION} characters.`;
  }
  if (input.patient_age.trim().length > CRM_MAX_PATIENT_AGE) {
    errors.patient_age = `Keep age under ${CRM_MAX_PATIENT_AGE} characters.`;
  }
  if (
    input.patient_gender !== "" &&
    !(input.patient_gender in CRM_PATIENT_GENDER_LABELS)
  ) {
    errors.patient_gender = "Choose a patient gender.";
  }
  if (input.chief_complaint.trim().length > CRM_MAX_REPORT_COMPLAINT) {
    errors.chief_complaint = `Keep the complaint under ${CRM_MAX_REPORT_COMPLAINT} characters.`;
  }
  if (input.diagnosis.trim().length > CRM_MAX_REPORT_SECTION) {
    errors.diagnosis = `Keep the assessment under ${CRM_MAX_REPORT_SECTION} characters.`;
  }
  for (const key of ["examination", "tests", "treatment", "advice"] as const) {
    if (input[key].trim().length > CRM_MAX_REPORT_SECTION) {
      errors[key] = `Keep this section under ${CRM_MAX_REPORT_SECTION} characters.`;
    }
  }

  if (input.medicines.length > CRM_MAX_REPORT_MEDICINES) {
    errors.medicines = `Add up to ${CRM_MAX_REPORT_MEDICINES} medicines.`;
  } else {
    input.medicines.forEach((medicine) => {
      const hasAny = [
        medicine.name,
        medicine.dose,
        medicine.frequency,
        medicine.duration,
        medicine.instructions,
      ].some((value) => value.trim());
      if (!hasAny) return;
      if (!medicine.name.trim()) {
        errors.medicines = "Add a medicine name, or remove the empty row.";
      } else if (medicine.name.trim().length > CRM_MAX_MEDICINE_NAME) {
        errors.medicines = `Keep medicine names under ${CRM_MAX_MEDICINE_NAME} characters.`;
      } else if (medicine.dose.trim().length > CRM_MAX_MEDICINE_DOSE) {
        errors.medicines = `Keep the dose under ${CRM_MAX_MEDICINE_DOSE} characters.`;
      } else if (medicine.frequency.trim().length > CRM_MAX_MEDICINE_FREQUENCY) {
        errors.medicines = `Keep the frequency under ${CRM_MAX_MEDICINE_FREQUENCY} characters.`;
      } else if (medicine.duration.trim().length > CRM_MAX_MEDICINE_DURATION) {
        errors.medicines = `Keep the duration under ${CRM_MAX_MEDICINE_DURATION} characters.`;
      } else if (medicine.instructions.trim().length > CRM_MAX_MEDICINE_INSTRUCTIONS) {
        errors.medicines = `Keep instructions under ${CRM_MAX_MEDICINE_INSTRUCTIONS} characters.`;
      }
    });
  }

  if (input.follow_up_date) {
    if (!validDateKey(input.follow_up_date)) {
      errors.follow_up_date = "Choose a valid follow-up date.";
    } else if (entry && input.follow_up_date < entry.entry_date) {
      errors.follow_up_date = "The follow-up cannot be before the visit.";
    }
  }

  if (input.include_photos && entry && !entry.before_photo && !entry.after_photo) {
    errors.include_photos = "This visit has no before/after photos to include.";
  }
  if (input.include_photos && !input.share_consent) {
    errors.share_consent = "Confirm the client agreed to receive this report.";
  }

  return errors;
}

/** Create or update the one report attached to a work record. */
export function saveReport(
  state: CrmState,
  entryId: string,
  input: CrmReportDraft,
  now = new Date(),
): ReportOk | ReportFail {
  const errors = validateReportDraft(state, entryId, input);
  if (Object.keys(errors).length) return { ok: false, errors };
  const existing = state.service_entries.find(
    (entry) => entry.id === entryId && !entry.deleted_at,
  );
  if (!existing) return { ok: false, errors: { entry: "That visit was not found." } };

  const timestamp = now.toISOString();
  const previous = existing.report;
  const created = !previous;
  const provider = state.config.report;
  const medicines: CrmReportMedicine[] = input.medicines
    .filter((medicine) =>
      [medicine.name, medicine.dose, medicine.frequency, medicine.duration, medicine.instructions].some(
        (value) => value.trim(),
      ),
    )
    .slice(0, CRM_MAX_REPORT_MEDICINES)
    .map((medicine, index) => ({
      id: previous?.medicines[index]?.id ?? makeId("med"),
      name: reportText(medicine.name, CRM_MAX_MEDICINE_NAME),
      dose: reportText(medicine.dose, CRM_MAX_MEDICINE_DOSE),
      frequency: reportText(medicine.frequency, CRM_MAX_MEDICINE_FREQUENCY),
      duration: reportText(medicine.duration, CRM_MAX_MEDICINE_DURATION),
      instructions: reportText(medicine.instructions, CRM_MAX_MEDICINE_INSTRUCTIONS),
    }));

  const report: CrmClinicalReport = {
    number: previous?.number ?? nextReportNumber(state),
    doctor_name: reportText(
      input.doctor_name || provider.provider_name,
      CRM_MAX_PROVIDER_NAME,
    ),
    doctor_qualification: reportText(
      input.doctor_qualification || provider.provider_qualification,
      CRM_MAX_PROVIDER_QUALIFICATION,
    ),
    doctor_registration: reportText(
      input.doctor_registration || provider.provider_registration,
      CRM_MAX_PROVIDER_REGISTRATION,
    ),
    patient_age: reportText(input.patient_age, CRM_MAX_PATIENT_AGE),
    patient_gender: input.patient_gender,
    chief_complaint: reportText(input.chief_complaint, CRM_MAX_REPORT_COMPLAINT),
    diagnosis: reportText(input.diagnosis, CRM_MAX_REPORT_SECTION),
    examination: reportText(input.examination, CRM_MAX_REPORT_SECTION),
    tests: reportText(input.tests, CRM_MAX_REPORT_SECTION),
    treatment: reportText(input.treatment, CRM_MAX_REPORT_SECTION),
    medicines,
    advice: reportText(input.advice, CRM_MAX_REPORT_SECTION),
    follow_up_date: input.follow_up_date || null,
    include_photos: Boolean(
      input.include_photos && (existing.before_photo || existing.after_photo),
    ),
    share_consent: Boolean(input.share_consent),
    created_at: previous?.created_at ?? timestamp,
    updated_at: timestamp,
  };

  const entry: CrmServiceEntry = {
    ...existing,
    report,
    updated_at: timestamp,
  };
  const nextState: CrmState = {
    ...state,
    report_seq: created ? Math.max(0, state.report_seq || 0) + 1 : state.report_seq,
    service_entries: state.service_entries.map((item) =>
      item.id === entryId ? entry : item,
    ),
    contacts: state.contacts.map((contact) =>
      contact.id === entry.contact_id
        ? { ...contact, last_activity_at: timestamp, updated_at: timestamp }
        : contact,
    ),
    activities: [
      ...state.activities,
      systemActivity(
        entry.contact_id,
        `${created ? "Report created" : "Report updated"} ${report.number}: ${entry.service}.`,
        now,
      ),
    ],
  };

  return { ok: true, state: nextState, entry, report, created };
}

/** A one-click report starts with the provider details from settings. */
export function generatedReportDraft(entry: CrmServiceEntry): CrmReportDraft {
  return {
    doctor_name: "",
    doctor_qualification: "",
    doctor_registration: "",
    patient_age: "",
    patient_gender: "",
    chief_complaint: "",
    diagnosis: "",
    examination: "",
    tests: "",
    treatment: entry.service,
    medicines: [],
    advice: "",
    follow_up_date: null,
    include_photos: false,
    share_consent: false,
  };
}

/** Create the first report for a visit without making the owner retype settings. */
export function generateReport(
  state: CrmState,
  entryId: string,
  now = new Date(),
): ReportOk | ReportFail {
  const entry = state.service_entries.find(
    (item) => item.id === entryId && !item.deleted_at,
  );
  if (!entry) return { ok: false, errors: { entry: "That visit was not found." } };
  if (entry.report) {
    return { ok: false, errors: { report: "This visit already has a report." } };
  }
  return saveReport(state, entryId, generatedReportDraft(entry), now);
}

/**
 * Rebuilds an invoice from untrusted storage. Invalid invoices are dropped, so
 * a hand-edited localStorage value can never break the CRM or print a bogus
 * document. The store also checks that the invoice total matches the ledger.
 */
export function parseCrmInvoice(raw: unknown): CrmInvoice | null {
  if (!isRecord(raw)) return null;
  const number = typeof raw.number === "string" ? raw.number.trim() : "";
  const issue = typeof raw.issue_date === "string" ? raw.issue_date : "";
  const due = typeof raw.due_date === "string" ? raw.due_date : "";
  if (!number || number.length > 32) return null;
  if (!validDateKey(issue) || !validDateKey(due) || due < issue) return null;
  const rawLines = Array.isArray(raw.lines) ? raw.lines : [];
  if (rawLines.length < 1 || rawLines.length > CRM_MAX_INVOICE_LINES) return null;
  const lines: CrmInvoiceLine[] = [];
  for (let index = 0; index < rawLines.length; index += 1) {
    const line = rawLines[index];
    if (!isRecord(line)) return null;
    const description =
      typeof line.description === "string" ? line.description.trim() : "";
    const quantity = Number(line.quantity);
    const rate = Number(line.rate);
    if (!description || description.length > CRM_MAX_INVOICE_DESCRIPTION) return null;
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999) return null;
    if (!Number.isFinite(rate) || rate < 0 || rate > CRM_MAX_AMOUNT) return null;
    lines.push({
      id:
        typeof line.id === "string" && line.id.length <= 40
          ? line.id
          : `invl_${index + 1}`,
      description,
      quantity: Math.round(quantity * 100) / 100,
      rate: roundMoney(rate),
    });
  }
  const discount = Number(raw.discount);
  const tax = Number(raw.tax_percent);
  if (!Number.isFinite(discount) || discount < 0) return null;
  if (!Number.isFinite(tax) || tax < 0 || tax > CRM_MAX_TAX_PERCENT) return null;
  return {
    number,
    issue_date: issue,
    due_date: due,
    lines,
    discount: roundMoney(discount),
    tax_percent: Math.round(tax * 100) / 100,
    notes:
      typeof raw.notes === "string" ? raw.notes.slice(0, CRM_MAX_INVOICE_NOTES) : "",
    terms:
      typeof raw.terms === "string" ? raw.terms.slice(0, CRM_MAX_TERMS) : "",
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

/** Rebuilds a patient report from untrusted storage; malformed reports are dropped. */
export function parseCrmReport(raw: unknown): CrmClinicalReport | null {
  if (!isRecord(raw)) return null;
  const number = typeof raw.number === "string" ? raw.number.trim() : "";
  const doctor_name =
    typeof raw.doctor_name === "string" ? raw.doctor_name.trim() : "";
  const diagnosis =
    typeof raw.diagnosis === "string" ? raw.diagnosis.trim() : "";
  if (!number || number.length > 32) return null;
  if (!doctor_name || doctor_name.length > CRM_MAX_DOCTOR_NAME) return null;
  if (diagnosis.length > CRM_MAX_REPORT_SECTION) return null;

  const patient_gender =
    typeof raw.patient_gender === "string" && raw.patient_gender in CRM_PATIENT_GENDER_LABELS
      ? (raw.patient_gender as CrmPatientGender)
      : "";
  const medicines: CrmReportMedicine[] = [];
  const rawMedicines = Array.isArray(raw.medicines) ? raw.medicines : [];
  for (let index = 0; index < rawMedicines.length && medicines.length < CRM_MAX_REPORT_MEDICINES; index += 1) {
    const medicine = rawMedicines[index];
    if (!isRecord(medicine)) continue;
    const name = typeof medicine.name === "string" ? medicine.name.trim() : "";
    if (!name || name.length > CRM_MAX_MEDICINE_NAME) continue;
    medicines.push({
      id:
        typeof medicine.id === "string" && medicine.id.length <= 40
          ? medicine.id
          : `med_${index + 1}`,
      name,
      dose: typeof medicine.dose === "string" ? medicine.dose.slice(0, CRM_MAX_MEDICINE_DOSE) : "",
      frequency:
        typeof medicine.frequency === "string"
          ? medicine.frequency.slice(0, CRM_MAX_MEDICINE_FREQUENCY)
          : "",
      duration:
        typeof medicine.duration === "string"
          ? medicine.duration.slice(0, CRM_MAX_MEDICINE_DURATION)
          : "",
      instructions:
        typeof medicine.instructions === "string"
          ? medicine.instructions.slice(0, CRM_MAX_MEDICINE_INSTRUCTIONS)
          : "",
    });
  }

  const followRaw = typeof raw.follow_up_date === "string" ? raw.follow_up_date : "";
  return {
    number,
    doctor_name,
    doctor_qualification:
      typeof raw.doctor_qualification === "string"
        ? raw.doctor_qualification.slice(0, CRM_MAX_DOCTOR_QUALIFICATION)
        : "",
    doctor_registration:
      typeof raw.doctor_registration === "string"
        ? raw.doctor_registration.slice(0, CRM_MAX_DOCTOR_REGISTRATION)
        : "",
    patient_age:
      typeof raw.patient_age === "string"
        ? raw.patient_age.slice(0, CRM_MAX_PATIENT_AGE)
        : "",
    patient_gender,
    chief_complaint:
      typeof raw.chief_complaint === "string"
        ? raw.chief_complaint.slice(0, CRM_MAX_REPORT_COMPLAINT)
        : "",
    diagnosis,
    examination:
      typeof raw.examination === "string"
        ? raw.examination.slice(0, CRM_MAX_REPORT_SECTION)
        : "",
    tests:
      typeof raw.tests === "string" ? raw.tests.slice(0, CRM_MAX_REPORT_SECTION) : "",
    treatment:
      typeof raw.treatment === "string"
        ? raw.treatment.slice(0, CRM_MAX_REPORT_SECTION)
        : "",
    medicines,
    advice:
      typeof raw.advice === "string" ? raw.advice.slice(0, CRM_MAX_REPORT_SECTION) : "",
    follow_up_date: validDateKey(followRaw) ? followRaw : null,
    include_photos: raw.include_photos === true,
    share_consent: raw.share_consent === true,
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

type MutationOk = { ok: true; state: CrmState };
type MutationFail = { ok: false; error: string };
type Mutation = MutationOk | MutationFail;

type ContactOk = { ok: true; state: CrmState; contact: CrmContact };
type ContactFail = { ok: false; errors: Record<string, string> };

function systemActivity(
  contactId: string,
  body: string,
  now: Date,
): CrmActivity {
  return {
    id: makeId("act"),
    contact_id: contactId,
    kind: "system",
    body,
    created_by: "system",
    created_at: now.toISOString(),
    deleted_at: null,
  };
}

type TagResult =
  | { ok: true; state: CrmState; tagIds: string[] }
  | { ok: false; error: string };

function ensureTags(
  state: CrmState,
  names: string[],
  limits: CrmPlanLimits,
  now: Date,
): TagResult {
  const unique = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed) unique.set(trimmed.toLowerCase(), trimmed);
  }
  const tags = [...state.tags];
  const tagIds: string[] = [];
  const tagLimit = Math.min(limits.tags, CRM_HARD_LIMITS.tags);
  for (const name of unique.values()) {
    let tag = tags.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      if (tags.length >= tagLimit) {
        return { ok: false, error: `You can use up to ${tagLimit} tags on your plan.` };
      }
      tag = { id: makeId("tag"), name, created_at: now.toISOString() };
      tags.push(tag);
    }
    tagIds.push(tag.id);
  }
  return { ok: true, state: { ...state, tags }, tagIds };
}

export function addContact(
  state: CrmState,
  input: CrmContactDraft,
  limits: CrmPlanLimits,
  now = new Date(),
): ContactOk | ContactFail {
  const errors = validateContactInput(input, state);
  if (Object.keys(errors).length) return { ok: false, errors };

  const tagResult = ensureTags(state, input.tags, limits, now);
  if (!tagResult.ok) return { ok: false, errors: { tags: tagResult.error } };

  const live = liveContacts(state).length;
  const contactLimit = Math.min(limits.contacts, CRM_HARD_LIMITS.contacts);
  if (live >= contactLimit) {
    return {
      ok: false,
      errors: {
        contact: `Your plan allows ${contactLimit} contacts. Upgrade to add more.`,
      },
    };
  }

  const timestamp = now.toISOString();
  const contact: CrmContact = {
    id: makeId("crm"),
    name: input.name.trim(),
    email: normalizeEmail(input.email) || null,
    phone: normalizePhone(input.phone) || null,
    company: input.company.trim() || null,
    stage_id: input.stage_id,
    custom_fields: { ...input.custom_fields },
    consent_status: input.consent_status,
    consent_source: input.consent_status === "unknown" ? null : "manual",
    consent_at: input.consent_status === "unknown" ? null : timestamp,
    source: "manual",
    last_activity_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  };

  const contact_tags = tagResult.tagIds.map((tagId) => ({
    contact_id: contact.id,
    tag_id: tagId,
  }));

  let next: CrmState = {
    ...tagResult.state,
    contacts: [...tagResult.state.contacts, contact],
    contact_tags: [...tagResult.state.contact_tags, ...contact_tags],
  };
  next = {
    ...next,
    activities: [
      ...next.activities,
      systemActivity(contact.id, "Contact created.", now),
    ],
  };
  return { ok: true, state: next, contact };
}

export function updateContact(
  state: CrmState,
  contactId: string,
  input: CrmContactDraft,
  limits: CrmPlanLimits,
  now = new Date(),
): ContactOk | ContactFail {
  const existing = state.contacts.find(
    (contact) => contact.id === contactId && !contact.deleted_at,
  );
  if (!existing) return { ok: false, errors: { contact: "That contact was not found." } };

  const errors = validateContactInput(input, state, contactId);
  if (Object.keys(errors).length) return { ok: false, errors };

  const tagResult = ensureTags(state, input.tags, limits, now);
  if (!tagResult.ok) return { ok: false, errors: { tags: tagResult.error } };

  const timestamp = now.toISOString();
  const consentChanged = existing.consent_status !== input.consent_status;
  const contact: CrmContact = {
    ...existing,
    name: input.name.trim(),
    email: normalizeEmail(input.email) || null,
    phone: normalizePhone(input.phone) || null,
    company: input.company.trim() || null,
    stage_id: input.stage_id,
    custom_fields: { ...input.custom_fields },
    consent_status: input.consent_status,
    consent_source: consentChanged ? "manual" : existing.consent_source,
    consent_at: consentChanged ? timestamp : existing.consent_at,
    updated_at: timestamp,
  };

  const contact_tags = tagResult.tagIds.map((tagId) => ({
    contact_id: contact.id,
    tag_id: tagId,
  }));

  return {
    ok: true,
    state: {
      ...tagResult.state,
      contacts: tagResult.state.contacts.map((item) =>
        item.id === contactId ? contact : item,
      ),
      contact_tags: [
        ...tagResult.state.contact_tags.filter((link) => link.contact_id !== contactId),
        ...contact_tags,
      ],
    },
    contact,
  };
}

export function changeContactStage(
  state: CrmState,
  contactId: string,
  stageId: string,
  now = new Date(),
): Mutation {
  const stage = stageById(state.config, stageId);
  if (!stage) return { ok: false, error: "Choose a stage." };
  const contact = state.contacts.find(
    (item) => item.id === contactId && !item.deleted_at,
  );
  if (!contact) return { ok: false, error: "That contact was not found." };
  if (contact.stage_id === stageId) return { ok: true, state };

  const timestamp = now.toISOString();
  return {
    ok: true,
    state: {
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === contactId
          ? { ...item, stage_id: stageId, updated_at: timestamp, last_activity_at: timestamp }
          : item,
      ),
      activities: [
        ...state.activities,
        systemActivity(contactId, `Moved to ${stage.name}.`, now),
      ],
    },
  };
}

export function softDeleteContact(
  state: CrmState,
  contactId: string,
  now = new Date(),
): Mutation {
  if (!state.contacts.some((contact) => contact.id === contactId && !contact.deleted_at)) {
    return { ok: false, error: "That contact was not found." };
  }
  const timestamp = now.toISOString();
  return {
    ok: true,
    state: {
      ...state,
      contacts: state.contacts.map((contact) =>
        contact.id === contactId
          ? { ...contact, deleted_at: timestamp, updated_at: timestamp }
          : contact,
      ),
      service_entries: state.service_entries.map((entry) =>
        entry.contact_id === contactId && !entry.deleted_at
          ? { ...entry, deleted_at: timestamp, updated_at: timestamp }
          : entry,
      ),
    },
  };
}

export function addActivity(
  state: CrmState,
  contactId: string,
  kind: CrmActivityKind,
  body: string,
  now = new Date(),
): Mutation {
  const contact = state.contacts.find(
    (item) => item.id === contactId && !item.deleted_at,
  );
  if (!contact) return { ok: false, error: "That contact was not found." };
  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > CRM_MAX_ACTIVITY) {
    return { ok: false, error: `Keep notes under ${CRM_MAX_ACTIVITY} characters.` };
  }
  const timestamp = now.toISOString();
  return {
    ok: true,
    state: {
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === contactId
          ? { ...item, last_activity_at: timestamp, updated_at: timestamp }
          : item,
      ),
      activities: [
        ...state.activities,
        {
          id: makeId("act"),
          contact_id: contactId,
          kind,
          body: text,
          created_by: "owner",
          created_at: timestamp,
          deleted_at: null,
        },
      ],
    },
  };
}

export function addTask(
  state: CrmState,
  contactId: string,
  title: string,
  dueOn: string | null,
  limits: CrmPlanLimits,
  now = new Date(),
): Mutation {
  const contact = state.contacts.find(
    (item) => item.id === contactId && !item.deleted_at,
  );
  if (!contact) return { ok: false, error: "That contact was not found." };
  const text = title.trim();
  if (!text) return { ok: false, error: "Enter a task." };
  if (text.length > CRM_MAX_TASK_TITLE) {
    return { ok: false, error: `Keep the task under ${CRM_MAX_TASK_TITLE} characters.` };
  }
  if (dueOn && !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
    return { ok: false, error: "Choose a valid date." };
  }
  const open = state.tasks.filter((task) => task.status === "open").length;
  const limit = Math.min(limits.open_tasks, CRM_HARD_LIMITS.open_tasks);
  if (open >= limit) {
    return { ok: false, error: `You can have up to ${limit} open tasks on your plan.` };
  }
  const timestamp = now.toISOString();
  return {
    ok: true,
    state: {
      ...state,
      tasks: [
        ...state.tasks,
        {
          id: makeId("task"),
          contact_id: contactId,
          title: text,
          due_on: dueOn,
          status: "open",
          completed_at: null,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
    },
  };
}

export function toggleTask(
  state: CrmState,
  taskId: string,
  now = new Date(),
): Mutation {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return { ok: false, error: "That task was not found." };
  const timestamp = now.toISOString();
  const done = task.status === "open";
  return {
    ok: true,
    state: {
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: done ? "done" : "open",
              completed_at: done ? timestamp : null,
              updated_at: timestamp,
            }
          : item,
      ),
    },
  };
}

export function deleteTask(state: CrmState, taskId: string): Mutation {
  if (!state.tasks.some((task) => task.id === taskId)) {
    return { ok: false, error: "That task was not found." };
  }
  return {
    ok: true,
    state: { ...state, tasks: state.tasks.filter((task) => task.id !== taskId) },
  };
}

/**
 * Deletes a stage after moving its contacts to `destinationId`. The config is
 * validated by the caller before saving; this keeps the operation atomic.
 */
export function removeStage(
  state: CrmState,
  stageId: string,
  destinationId: string,
  now = new Date(),
): Mutation {
  const stage = stageById(state.config, stageId);
  const destination = stageById(state.config, destinationId);
  if (!stage || !destination || stageId === destinationId) {
    return { ok: false, error: "Choose a stage to move the contacts to." };
  }
  const timestamp = now.toISOString();
  const moving = state.contacts.filter(
    (contact) => !contact.deleted_at && contact.stage_id === stageId,
  );
  return {
    ok: true,
    state: {
      ...state,
      config: {
        ...state.config,
        stages: state.config.stages.filter((item) => item.id !== stageId),
      },
      contacts: state.contacts.map((contact) =>
        contact.stage_id === stageId
          ? { ...contact, stage_id: destinationId, updated_at: timestamp }
          : contact,
      ),
      activities: [
        ...state.activities,
        ...moving.map((contact) =>
          systemActivity(contact.id, `Moved to ${destination.name}.`, now),
        ),
      ],
    },
  };
}

/** A simple, quote-aware CSV parser (RFC 4180-style, UTF-8 BOM tolerated). */
export function parseCsvRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

export type CrmCsvIssue = {
  row: number;
  reason: string;
  kind: "invalid" | "duplicate";
};

export type CrmCsvDraft = { row: number; draft: CrmContactDraft };

export type CrmCsvParse = {
  drafts: CrmCsvDraft[];
  issues: CrmCsvIssue[];
  total: number;
  headers: string[];
};

function parseConsent(value: string): CrmConsentStatus | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return "unknown";
  if (normalized === "opted_in" || normalized === "opted in" || normalized === "yes") {
    return "opted_in";
  }
  if (normalized === "opted_out" || normalized === "opted out" || normalized === "no") {
    return "opted_out";
  }
  return null;
}

export function parseContactCsv(
  text: string,
  state: CrmState,
  limits: CrmPlanLimits,
  now = new Date(),
): CrmCsvParse {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return {
      drafts: [],
      issues: [{ row: 1, reason: "The file needs a header row and at least one contact.", kind: "invalid" }],
      total: 0,
      headers: rows[0] ?? [],
    };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const known = new Set([
    "name",
    "email",
    "phone",
    "company",
    "stage",
    "tags",
    "consent",
    ...state.config.fields.filter((field) => !field.archived).map((field) => field.key),
  ]);
  const unknown = headers.filter((header) => header && !known.has(header));
  if (unknown.length) {
    return {
      drafts: [],
      issues: unknown.map((header) => ({
        row: 1,
        reason: `Unknown column: ${header}.`,
        kind: "invalid",
      })),
      total: 0,
      headers,
    };
  }
  const nameIndex = headers.indexOf("name");
  if (nameIndex === -1) {
    return {
      drafts: [],
      issues: [{ row: 1, reason: "Import needs a name column.", kind: "invalid" }],
      total: 0,
      headers,
    };
  }

  const fields = new Map(
    state.config.fields
      .filter((field) => !field.archived)
      .map((field) => [field.key, field]),
  );
  const drafts: CrmCsvDraft[] = [];
  const issues: CrmCsvIssue[] = [];
  let working = state;
  let total = 0;

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 1;
    if (!row.some((value) => value.trim() !== "")) continue;
    total += 1;

    const get = (key: string): string => {
      const column = headers.indexOf(key);
      return column === -1 ? "" : (row[column] ?? "").trim();
    };

    const stageValue = get("stage");
    const stage = stageValue
      ? state.config.stages.find(
          (item) => item.name.toLowerCase() === stageValue.toLowerCase(),
        ) ?? null
      : firstOpenStage(state.config);
    if (!stage) {
      issues.push({ row: rowNumber, reason: "Choose a stage.", kind: "invalid" });
      continue;
    }

    const consent = parseConsent(get("consent"));
    if (!consent) {
      issues.push({
        row: rowNumber,
        reason: "Consent must be unknown, opted_in or opted_out.",
        kind: "invalid",
      });
      continue;
    }

    const custom_fields: Record<string, string | string[] | boolean> = {};
    for (const [key, field] of fields) {
      const raw = get(key);
      if (field.type === "multi_select") {
        custom_fields[key] = raw
          ? raw.split(";").map((item) => item.trim()).filter(Boolean)
          : [];
      } else if (field.type === "checkbox") {
        custom_fields[key] = /^(yes|true|1)$/i.test(raw);
      } else {
        custom_fields[key] = raw;
      }
    }

    const draft: CrmContactDraft = {
      name: row[nameIndex]?.trim() ?? "",
      email: get("email"),
      phone: get("phone"),
      company: get("company"),
      stage_id: stage.id,
      custom_fields,
      consent_status: consent,
      tags: get("tags")
        ? get("tags").split(";").map((tag) => tag.trim()).filter(Boolean)
        : [],
    };

    const errors = validateContactInput(draft, working);
    if (Object.keys(errors).length) {
      const first = Object.values(errors)[0];
      issues.push({
        row: rowNumber,
        reason: first,
        kind: errors.email === DUPLICATE_EMAIL ? "duplicate" : "invalid",
      });
      continue;
    }

    const added = addContact(working, draft, limits, now);
    if (!added.ok) {
      const first = Object.values(added.errors)[0] ?? "Row could not be imported.";
      issues.push({ row: rowNumber, reason: first, kind: "invalid" });
      continue;
    }
    working = added.state;
    drafts.push({ row: rowNumber, draft });
  }

  return { drafts, issues, total, headers };
}

export function importContacts(
  state: CrmState,
  drafts: CrmCsvDraft[],
  limits: CrmPlanLimits,
  now = new Date(),
): { state: CrmState; added: number; failed: number } {
  let working = state;
  let added = 0;
  let failed = 0;
  for (const { draft } of drafts) {
    const result = addContact(working, draft, limits, now);
    if (result.ok) {
      working = result.state;
      added += 1;
    } else {
      failed += 1;
    }
  }
  return { state: working, added, failed };
}

/** Text used in the list, detail and export for one custom value. */
export function fieldValueText(value: CrmValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * RFC-4180 cell with CSV-injection protection: formula-leading values get a
 * `'` prefix before quoting, so a spreadsheet shows text and never executes.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function contactsToCsv(state: CrmState, config: CrmConfig = state.config): string {
  const fields = config.fields.filter((field) => !field.archived);
  const headers = [
    "name",
    "email",
    "phone",
    "company",
    "stage",
    "tags",
    "consent",
    "created_at",
    "last_activity_at",
    ...fields.map((field) => field.key),
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const contact of liveContacts(state)) {
    const tags = contactTags(state, contact.id)
      .map((tag) => tag.name)
      .join(";");
    const values = [
      contact.name,
      contact.email ?? "",
      contact.phone ?? "",
      contact.company ?? "",
      stageName(state.config, contact.stage_id),
      tags,
      contact.consent_status,
      contact.created_at,
      contact.last_activity_at ?? "",
      ...fields.map((field) => fieldValueText(contact.custom_fields[field.key])),
    ];
    lines.push(values.map(csvCell).join(","));
  }
  return lines.join("\r\n");
}

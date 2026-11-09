/**
 * CRM configuration: presets, field/stage shapes and hard limits.
 *
 * The owner starts from a preset for their business type and then edits fields,
 * stages and module switches inside the plan limits (CRM_FEATURE.md sections 4
 * and 6). Nothing here touches contact data; the config is saved as validated
 * JSON, never as per-business code.
 */

import type { CrmBusinessType } from "./access";

export type CrmFieldType =
  | "text"
  | "long_text"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "checkbox";

export type CrmStageKind = "open" | "won" | "lost";

export type CrmFieldDef = {
  /** Immutable machine key, `^[a-z][a-z0-9_]{1,29}$`. */
  key: string;
  label: string;
  type: CrmFieldType;
  required: boolean;
  show_in_list: boolean;
  options: string[];
  archived: boolean;
};

export type CrmStage = {
  /** Stable id, never reused. Renaming changes only `name`. */
  id: string;
  name: string;
  kind: CrmStageKind;
};

export type CrmModules = {
  pipeline: boolean;
  tasks: boolean;
  tags: boolean;
};

/**
 * Seller details used on every invoice. These are optional because a small
 * owner may not have a GSTIN, but address and contact details make the printed
 * bill useful in the real world.
 */
export type CrmBillingSettings = {
  address: string;
  phone: string;
  email: string;
  gstin: string;
  invoice_prefix: string;
  default_tax_percent: number;
  default_due_days: number;
  terms: string;
};

export type CrmReportSettings = {
  /** What the owner calls the document on the patient copy. */
  report_title: string;
  /** Who receives it: Patient, Client, Member, Customer, etc. */
  recipient_label: string;
  /** Who prepares it: Doctor, Trainer, Stylist, Consultant, etc. */
  provider_label: string;
  provider_name: string;
  /** Degree or certification. Blank is valid for trainers and stylists. */
  provider_qualification: string;
  /** Medical registration or business licence. Optional for every type. */
  provider_registration: string;
  /** Text printed on the signature line; falls back to the provider name. */
  provider_signature: string;
  /** Approval sentence printed with the signature. */
  approval_text: string;
  /** Section heading for medicines, aftercare, recommendations or a plan. */
  plan_title: string;
  /** Footer note printed on the patient copy. */
  footer_note: string;
};

export type CrmConfig = {
  version: 1;
  preset: CrmBusinessType;
  modules: CrmModules;
  fields: CrmFieldDef[];
  stages: CrmStage[];
  billing: CrmBillingSettings;
  report: CrmReportSettings;
};

/** The safe starting point when a profile has no invoice details yet. */
export function defaultCrmBillingSettings(): CrmBillingSettings {
  return {
    address: "",
    phone: "",
    email: "",
    gstin: "",
    invoice_prefix: "INV",
    default_tax_percent: 0,
    default_due_days: 7,
    terms: "Thank you for your business.",
  };
}

/** The safe starting point for a business that has not described its report yet. */
export function defaultCrmReportSettings(): CrmReportSettings {
  return {
    report_title: "Service report",
    recipient_label: "Client",
    provider_label: "Service provider",
    provider_name: "",
    provider_qualification: "",
    provider_registration: "",
    provider_signature: "",
    approval_text: "Approved by the service provider.",
    plan_title: "Plan / prescription",
    footer_note:
      "This report was prepared for the client and is intended for their personal use. Keep it private. Contact us if you have questions.",
  };
}

/**
 * Browser data is not trusted. Normalise billing settings without throwing so
 * an old CRM config keeps working after this feature is added.
 */
export function sanitizeCrmBillingSettings(
  raw: unknown,
): CrmBillingSettings {
  const base = defaultCrmBillingSettings();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const row = raw as Record<string, unknown>;
  const text = (value: unknown, max: number, fallback: string): string =>
    typeof value === "string" ? value.slice(0, max) : fallback;
  const number = (
    value: unknown,
    min: number,
    max: number,
    fallback: number,
  ): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed)
      ? Math.min(max, Math.max(min, parsed))
      : fallback;
  };
  const prefix = text(row.invoice_prefix, CRM_MAX_INVOICE_PREFIX, base.invoice_prefix)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return {
    address: text(row.address, CRM_MAX_BILLING_ADDRESS, base.address).trim(),
    phone: text(row.phone, CRM_MAX_PHONE, base.phone).trim(),
    email: text(row.email, CRM_MAX_EMAIL, base.email).trim(),
    gstin: text(row.gstin, CRM_MAX_GSTIN, base.gstin).trim().toUpperCase(),
    invoice_prefix: prefix || base.invoice_prefix,
    default_tax_percent: Math.round(
      number(row.default_tax_percent, 0, CRM_MAX_TAX_PERCENT, base.default_tax_percent) * 100,
    ) / 100,
    default_due_days: Math.round(
      number(row.default_due_days, 0, CRM_MAX_DUE_DAYS, base.default_due_days),
    ),
    terms: text(row.terms, CRM_MAX_TERMS, base.terms),
  };
}

/**
 * Old configs do not have report wording; fill safe defaults so saved CRM data
 * keeps loading after the report feature and business terminology change.
 */
export function sanitizeCrmReportSettings(raw: unknown): CrmReportSettings {
  const base = defaultCrmReportSettings();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const row = raw as Record<string, unknown>;
  const text = (value: unknown, max: number, fallback: string): string =>
    typeof value === "string" ? value.slice(0, max) : fallback;
  return {
    report_title: text(row.report_title, CRM_MAX_REPORT_TITLE, base.report_title).trim() || base.report_title,
    recipient_label:
      text(row.recipient_label, CRM_MAX_REPORT_LABEL, base.recipient_label).trim() ||
      base.recipient_label,
    provider_label:
      text(row.provider_label, CRM_MAX_REPORT_LABEL, base.provider_label).trim() ||
      base.provider_label,
    provider_name: text(row.provider_name, CRM_MAX_PROVIDER_NAME, base.provider_name).trim(),
    provider_qualification: text(
      row.provider_qualification,
      CRM_MAX_PROVIDER_QUALIFICATION,
      base.provider_qualification,
    ).trim(),
    provider_registration: text(
      row.provider_registration,
      CRM_MAX_PROVIDER_REGISTRATION,
      base.provider_registration,
    ).trim(),
    provider_signature: text(
      row.provider_signature,
      CRM_MAX_PROVIDER_SIGNATURE,
      base.provider_signature,
    ).trim(),
    approval_text: text(
      row.approval_text,
      CRM_MAX_APPROVAL_TEXT,
      base.approval_text,
    ).trim() || base.approval_text,
    plan_title:
      text(row.plan_title, CRM_MAX_REPORT_LABEL, base.plan_title).trim() || base.plan_title,
    footer_note:
      text(row.footer_note, CRM_MAX_REPORT_FOOTER, base.footer_note).trim() ||
      base.footer_note,
  };
}

/** Hard caps from security-and-reliability.md section 4F. */
export const CRM_HARD_LIMITS = {
  contacts: 100_000,
  fields: 30,
  stages: 8,
  tags: 50,
  open_tasks: 20_000,
  import_rows: 10_000,
} as const;

export const CRM_MAX_NAME = 120;
export const CRM_MAX_EMAIL = 254;
export const CRM_MAX_PHONE = 20;
export const CRM_MAX_COMPANY = 120;
export const CRM_MAX_TEXT = 200;
export const CRM_MAX_LONG_TEXT = 2_000;
export const CRM_MAX_ACTIVITY = 2_000;
export const CRM_MAX_TASK_TITLE = 120;
export const CRM_MAX_SERVICE = 120;
export const CRM_MAX_PAYMENT_NOTE = 2_000;
export const CRM_MAX_AMOUNT = 10_000_000;
export const CRM_MAX_INVOICE_LINES = 8;
export const CRM_MAX_INVOICE_DESCRIPTION = 120;
export const CRM_MAX_INVOICE_NOTES = 2_000;
export const CRM_MAX_BILLING_ADDRESS = 300;
export const CRM_MAX_TERMS = 500;
export const CRM_MAX_GSTIN = 20;
export const CRM_MAX_INVOICE_PREFIX = 8;
export const CRM_MAX_TAX_PERCENT = 50;
export const CRM_MAX_DUE_DAYS = 90;
export const CRM_INVOICE_PREFIX_PATTERN = /^[A-Z0-9]{2,8}$/;
export const CRM_MAX_REPORT_TITLE = 60;
export const CRM_MAX_REPORT_LABEL = 40;
export const CRM_MAX_PROVIDER_NAME = 120;
export const CRM_MAX_PROVIDER_QUALIFICATION = 120;
export const CRM_MAX_PROVIDER_REGISTRATION = 60;
export const CRM_MAX_PROVIDER_SIGNATURE = 120;
export const CRM_MAX_APPROVAL_TEXT = 240;
export const CRM_MAX_REPORT_FOOTER = 600;

/** Patient report / prescription limits (Stage 1 mock). */
export const CRM_MAX_REPORT_MEDICINES = 10;
export const CRM_MAX_DOCTOR_NAME = 120;
export const CRM_MAX_DOCTOR_QUALIFICATION = 120;
export const CRM_MAX_DOCTOR_REGISTRATION = 40;
export const CRM_MAX_PATIENT_AGE = 20;
export const CRM_MAX_REPORT_COMPLAINT = 1_000;
export const CRM_MAX_REPORT_SECTION = 2_000;
export const CRM_MAX_MEDICINE_NAME = 120;
export const CRM_MAX_MEDICINE_DOSE = 60;
export const CRM_MAX_MEDICINE_FREQUENCY = 60;
export const CRM_MAX_MEDICINE_DURATION = 60;
export const CRM_MAX_MEDICINE_INSTRUCTIONS = 300;
export const CRM_PATIENT_GENDER_LABELS = {
  female: "Female",
  male: "Male",
  other: "Other",
  undisclosed: "Prefer not to say",
} as const;
export type CrmPatientGender = keyof typeof CRM_PATIENT_GENDER_LABELS;
export const CRM_PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank transfer",
  other: "Other",
} as const;
export const CRM_MAX_TAG = 24;
export const CRM_MAX_STAGE_NAME = 32;
export const CRM_MAX_FIELD_LABEL = 40;
export const CRM_MAX_OPTIONS = 20;
export const CRM_MAX_OPTION_LENGTH = 40;
export const CRM_MAX_TAGS_PER_CONTACT = 10;
export const CRM_MIN_STAGES = 2;
export const CRM_CONFIG_MAX_BYTES = 100 * 1024;
export const CRM_CSV_MAX_BYTES = 2 * 1024 * 1024;

/** Custom field keys are immutable once created. */
export const CRM_FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{1,29}$/;

export const CRM_FIELD_TYPE_LABELS: Record<CrmFieldType, string> = {
  text: "Short text",
  long_text: "Long text",
  number: "Number",
  date: "Date",
  select: "Single choice",
  multi_select: "Multiple choice",
  checkbox: "Yes / no",
};

export const CRM_CONSENT_LABELS = {
  unknown: "Unknown",
  opted_in: "Opted in",
  opted_out: "Opted out",
} as const;

type PresetField = Omit<CrmFieldDef, "archived">;
type PresetStage = CrmStage;

type CrmPreset = {
  fields: PresetField[];
  stages: PresetStage[];
};

function field(
  key: string,
  label: string,
  type: CrmFieldType,
  options: string[] = [],
  required = false,
  show_in_list = true,
): PresetField {
  return { key, label, type, required, show_in_list, options };
}

export const CRM_PRESETS: Record<CrmBusinessType, CrmPreset> = {
  salon: {
    fields: [
      field("preferred_service", "Preferred service", "select", [
        "Haircut",
        "Colour",
        "Facial",
        "Other",
      ]),
      field("preferred_staff", "Preferred staff", "text"),
      field("birthday", "Birthday", "date"),
      field("last_visit", "Last visit", "date"),
      field("referral_source", "Referral source", "select", [
        "Walk-in",
        "Instagram",
        "Google",
        "Friend",
        "Other",
      ]),
    ],
    stages: [
      { id: "stg_salon_new", name: "New", kind: "open" },
      { id: "stg_salon_contacted", name: "Contacted", kind: "open" },
      { id: "stg_salon_interested", name: "Interested", kind: "open" },
      { id: "stg_salon_active", name: "Active client", kind: "won" },
      { id: "stg_salon_lost", name: "Lost", kind: "lost" },
    ],
  },
  gym: {
    fields: [
      field("membership_plan", "Membership plan", "select", [
        "Monthly",
        "Quarterly",
        "Annual",
      ]),
      field("joined_on", "Joined on", "date"),
      field("renewal_on", "Renewal on", "date"),
      field("goal", "Goal", "text"),
    ],
    stages: [
      { id: "stg_gym_new", name: "New", kind: "open" },
      { id: "stg_gym_trial", name: "Trial", kind: "open" },
      { id: "stg_gym_active", name: "Active member", kind: "won" },
      { id: "stg_gym_expiring", name: "Expiring", kind: "open" },
      { id: "stg_gym_lost", name: "Lost", kind: "lost" },
    ],
  },
  retail: {
    fields: [
      field("preferred_category", "Preferred category", "text"),
      field("size", "Size", "text"),
      field("birthday", "Birthday", "date"),
      field("last_purchase", "Last purchase", "date"),
      field("interests", "Interests", "multi_select", [
        "Fashion",
        "Home",
        "Beauty",
        "Electronics",
        "Other",
      ]),
    ],
    stages: [
      { id: "stg_retail_new", name: "New", kind: "open" },
      { id: "stg_retail_interested", name: "Interested", kind: "open" },
      { id: "stg_retail_purchased", name: "Purchased", kind: "won" },
      { id: "stg_retail_repeat", name: "Repeat customer", kind: "open" },
      { id: "stg_retail_lost", name: "Lost", kind: "lost" },
    ],
  },
  other: {
    fields: [
      field("role", "Role", "text"),
      field("source", "Source", "select", [
        "Referral",
        "Website",
        "Walk-in",
        "Event",
        "Other",
      ]),
      field("next_step", "Next step", "text"),
    ],
    stages: [
      { id: "stg_other_new", name: "New", kind: "open" },
      { id: "stg_other_contacted", name: "Contacted", kind: "open" },
      { id: "stg_other_qualified", name: "Qualified", kind: "open" },
      { id: "stg_other_customer", name: "Customer", kind: "won" },
      { id: "stg_other_lost", name: "Lost", kind: "lost" },
    ],
  },
};

/** A fresh, editable config for a business type (never shared by reference). */
export function defaultCrmConfig(type: CrmBusinessType): CrmConfig {
  const preset = CRM_PRESETS[type];
  return {
    version: 1,
    preset: type,
    modules: { pipeline: true, tasks: true, tags: true },
    fields: preset.fields.map((item) => ({ ...item, options: [...item.options], archived: false })),
    stages: preset.stages.map((stage) => ({ ...stage })),
    billing: defaultCrmBillingSettings(),
    report: defaultCrmReportSettings(),
  };
}

/** "Preferred service" -> "preferred_service", with a safe fallback. */
export function keyFromLabel(label: string): string {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return key && /^[a-z]/.test(key) ? key : `field_${key || "custom"}`;
}

/** A unique, immutable key for a new custom column. */
export function nextFieldKey(label: string, config: CrmConfig): string {
  const base = keyFromLabel(label).slice(0, 26);
  let key = base.length >= 2 ? base : `${base || "field"}_1`;
  let counter = 2;
  while (config.fields.some((field) => field.key === key)) {
    key = `${base.slice(0, 24)}_${counter}`;
    counter += 1;
  }
  return key;
}

export function cloneConfig(config: CrmConfig): CrmConfig {
  return {
    version: 1,
    preset: config.preset,
    modules: { ...config.modules },
    fields: config.fields.map((item) => ({
      ...item,
      options: [...item.options],
    })),
    stages: config.stages.map((stage) => ({ ...stage })),
    billing: { ...config.billing },
    report: { ...config.report },
  };
}

/** The first open stage — the default for new contacts and imports. */
export function firstOpenStage(config: CrmConfig): CrmStage | null {
  return config.stages.find((stage) => stage.kind === "open") ?? config.stages[0] ?? null;
}

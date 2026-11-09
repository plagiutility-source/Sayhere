/**
 * MOCK ONLY, removed in Stage 4.
 *
 * The CRM's browser store, one blob for the current mock business. Saved under
 * `syehere.mock.crm.v1`; another tab's write wins through the storage event.
 * The real tables are in schema.sql ("CRM (STAGE 2 PROPOSAL)").
 *
 * Stored data is never trusted: it is parsed in try/catch, shape-checked, and
 * anything malformed falls back to a fresh seed. No customer page or public
 * route reads this store.
 */

import {
  CRM_PAYMENT_METHOD_LABELS,
  sanitizeCrmBillingSettings,
  sanitizeCrmReportSettings,
  type CrmConfig,
} from "@/lib/crm/config";
import { isCrmPhotoDataUrl } from "@/lib/crm/photos";
import {
  invoiceTotals,
  parseCrmInvoice,
  parseCrmReport,
  todayKey,
  type CrmActivity,
  type CrmClinicalReport,
  type CrmContact,
  type CrmContactTag,
  type CrmPaymentMethod,
  type CrmServiceEntry,
  type CrmState,
  type CrmTag,
  type CrmTask,
  type CrmValue,
} from "@/lib/crm/rules";

export const CRM_STORAGE_KEY = "syehere.mock.crm.v1";
const CHANGE_EVENT = "syehere:crm-changed";
const DAY_MS = 86_400_000;

let memory: CrmState | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isoDaysAgo(days: number, now: Date): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

function dateOnly(offsetDays: number, now: Date): string {
  return new Date(now.getTime() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

function sampleValue(
  field: CrmConfig["fields"][number],
  index: number,
  now: Date,
): CrmValue {
  const texts = ["Regular", "Walk-in", "Google", "Referral", "Evening"];
  switch (field.type) {
    case "text":
      return texts[index % texts.length];
    case "long_text":
      return "";
    case "number":
      return index + 1;
    case "date":
      return dateOnly(-(index * 7), now);
    case "select":
      return field.options[index % Math.max(1, field.options.length)] ?? "";
    case "multi_select":
      return field.options.length ? [field.options[0]] : [];
    case "checkbox":
      return index % 2 === 0;
    default:
      return "";
  }
}

type SeedWork = {
  service: string;
  billed: number;
  paid: number;
  method: CrmPaymentMethod;
  notes: string;
};

const SEED_WORK: Record<CrmConfig["preset"], SeedWork[]> = {
  salon: [
    { service: "Haircut & finish", billed: 1_200, paid: 1_200, method: "cash", notes: "Regular trim; preferred stylist was available." },
    { service: "Hair colour & gloss", billed: 4_500, paid: 4_500, method: "upi", notes: "Colour package with aftercare advice." },
    { service: "Skin consultation & fade", billed: 1_500, paid: 500, method: "upi", notes: "Deposit paid; balance due on the next visit." },
    { service: "Hydrating facial", billed: 1_800, paid: 0, method: "card", notes: "Quoted the facial package; payment pending." },
    { service: "Grooming package", billed: 6_000, paid: 6_000, method: "bank", notes: "Corporate grooming package, paid in full." },
  ],
  gym: [
    { service: "Monthly membership", billed: 2_500, paid: 2_500, method: "upi", notes: "Current month renewed." },
    { service: "Personal training × 4", billed: 4_000, paid: 4_000, method: "card", notes: "Four sessions completed." },
    { service: "Trial week", billed: 1_000, paid: 500, method: "cash", notes: "Deposit paid; balance due after trial." },
    { service: "Body composition review", billed: 800, paid: 0, method: "upi", notes: "Review booked for next week." },
    { service: "Annual membership", billed: 18_000, paid: 18_000, method: "bank", notes: "Annual plan paid in full." },
  ],
  retail: [
    { service: "Winter jacket", billed: 3_200, paid: 3_200, method: "card", notes: "Exchanged once for a larger size." },
    { service: "Kurta set", billed: 2_400, paid: 2_400, method: "upi", notes: "Alteration included." },
    { service: "Accessories hold", billed: 1_500, paid: 500, method: "upi", notes: "Deposit received; items held for two days." },
    { service: "Fragrance consultation", billed: 900, paid: 0, method: "card", notes: "Wants to compare two options." },
    { service: "Festive gift set", billed: 5_500, paid: 5_500, method: "bank", notes: "Corporate gifting order." },
  ],
  other: [
    { service: "Discovery consultation", billed: 1_500, paid: 1_500, method: "upi", notes: "Scope reviewed; proposal requested." },
    { service: "Brand strategy workshop", billed: 8_000, paid: 8_000, method: "bank", notes: "Half-day workshop completed." },
    { service: "Proposal review", billed: 2_000, paid: 500, method: "upi", notes: "Deposit paid; final review scheduled." },
    { service: "Website audit", billed: 3_000, paid: 0, method: "card", notes: "Audit quoted; awaiting approval." },
    { service: "Retainer — October", billed: 15_000, paid: 15_000, method: "bank", notes: "Monthly retainer, paid in full." },
  ],
};

/** Attach a few realistic jobs/payments so a fresh CRM is not an empty ledger. */
function seedServiceEntries(
  config: CrmConfig,
  contacts: CrmContact[],
  now: Date,
): CrmServiceEntry[] {
  const entries: CrmServiceEntry[] = [];
  const work = SEED_WORK[config.preset] ?? SEED_WORK.other;
  const contactsForWork = [
    contacts[0],
    contacts[1],
    contacts[2],
    contacts[3],
    contacts[0],
  ];
  work.forEach((item, index) => {
    const contact = contactsForWork[index];
    if (!contact) return;
    const daysAgo = [2, 12, 9, 21, 45][index] ?? index * 7;
    const timestamp = isoDaysAgo(Math.max(daysAgo, 1), now);
    entries.push({
      id: `svc_seed_${index + 1}`,
      contact_id: contact.id,
      service: item.service,
      entry_date: dateOnly(-daysAgo, now),
      billed: item.billed,
      paid: item.paid,
      payment_method: item.method,
      notes: item.notes,
      before_photo: null,
      after_photo: null,
      photo_consent: false,
      invoice: null,
      report: null,
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null,
    });
  });
  return entries;
}

/** Deterministic, friendly demo data sized to the owner's current fields. */
export function seedCrmState(config: CrmConfig, now = new Date()): CrmState {
  const open = config.stages.filter((stage) => stage.kind === "open");
  const won = config.stages.find((stage) => stage.kind === "won");
  const lost = config.stages.find((stage) => stage.kind === "lost");
  const at = (index: number): string =>
    config.stages[Math.min(index, config.stages.length - 1)]?.id ??
    config.stages[0]?.id ??
    "stg_new";

  const tags: CrmTag[] = ["Regular", "Referral", "VIP"].map((name, index) => ({
    id: `tag_seed_${index + 1}`,
    name,
    created_at: isoDaysAgo(60 - index * 5, now),
  }));

  const people = [
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+919820011001",
      company: null,
      consent: "opted_in" as const,
      stage: won?.id ?? open[open.length - 1]?.id ?? at(0),
      daysAgo: 60,
      tags: ["Regular", "VIP"],
    },
    {
      name: "Arjun Mehta",
      email: "arjun@example.com",
      phone: "+919820011002",
      company: null,
      consent: "opted_in" as const,
      stage: open[1]?.id ?? at(1),
      daysAgo: 9,
      tags: ["Referral"],
    },
    {
      name: "Neha Kapoor",
      email: "neha@example.com",
      phone: null,
      company: null,
      consent: "unknown" as const,
      stage: open[2]?.id ?? at(2),
      daysAgo: 21,
      tags: ["Regular"],
    },
    {
      name: "Rohit Verma",
      email: "rohit@example.com",
      phone: "+919820011004",
      company: "Verma & Co.",
      consent: "opted_out" as const,
      stage: lost?.id ?? at(config.stages.length - 1),
      daysAgo: 45,
      tags: [],
    },
  ];

  const contacts: CrmContact[] = people.map((person, index) => ({
    id: `crm_seed_${index + 1}`,
    name: person.name,
    email: person.email,
    phone: person.phone,
    company: person.company,
    stage_id: person.stage,
    custom_fields: Object.fromEntries(
      config.fields
        .filter((field) => !field.archived)
        .map((field) => [field.key, sampleValue(field, index, now)]),
    ),
    consent_status: person.consent,
    consent_source: person.consent === "unknown" ? null : "manual",
    consent_at: person.consent === "unknown" ? null : isoDaysAgo(person.daysAgo, now),
    source: index === 2 ? "import" : index === 3 ? "feedback" : "manual",
    last_activity_at: isoDaysAgo(index + 1, now),
    created_at: isoDaysAgo(person.daysAgo, now),
    updated_at: isoDaysAgo(index, now),
    deleted_at: null,
  }));

  const contact_tags: CrmContactTag[] = [];
  people.forEach((person, index) => {
    for (const name of person.tags) {
      const tag = tags.find((item) => item.name === name);
      if (tag) contact_tags.push({ contact_id: contacts[index].id, tag_id: tag.id });
    }
  });

  const activities: CrmActivity[] = [
    {
      id: "act_seed_1",
      contact_id: contacts[0].id,
      kind: "note",
      body: "Prefers evening appointments. Ask about the colour package next visit.",
      created_by: "owner",
      created_at: isoDaysAgo(1, now),
      deleted_at: null,
    },
    {
      id: "act_seed_2",
      contact_id: contacts[1].id,
      kind: "call",
      body: "Called about the renewal. Asked for a callback next week.",
      created_by: "owner",
      created_at: isoDaysAgo(3, now),
      deleted_at: null,
    },
    {
      id: "act_seed_3",
      contact_id: contacts[2].id,
      kind: "system",
      body: "Contact imported from CSV.",
      created_by: "system",
      created_at: isoDaysAgo(21, now),
      deleted_at: null,
    },
    {
      id: "act_seed_4",
      contact_id: contacts[3].id,
      kind: "email",
      body: "Sent the price list. They have not replied.",
      created_by: "owner",
      created_at: isoDaysAgo(12, now),
      deleted_at: null,
    },
  ];

  const tasks: CrmTask[] = [
    {
      id: "task_seed_1",
      contact_id: contacts[0].id,
      title: "Confirm next visit",
      due_on: todayKey(now),
      status: "open",
      completed_at: null,
      created_at: isoDaysAgo(2, now),
      updated_at: isoDaysAgo(2, now),
    },
    {
      id: "task_seed_2",
      contact_id: contacts[1].id,
      title: "Follow up on renewal",
      due_on: dateOnly(-2, now),
      status: "open",
      completed_at: null,
      created_at: isoDaysAgo(4, now),
      updated_at: isoDaysAgo(4, now),
    },
    {
      id: "task_seed_3",
      contact_id: contacts[2].id,
      title: "Send welcome message",
      due_on: dateOnly(-5, now),
      status: "done",
      completed_at: isoDaysAgo(4, now),
      created_at: isoDaysAgo(9, now),
      updated_at: isoDaysAgo(4, now),
    },
  ];

  const service_entries = seedServiceEntries(config, contacts, now);
  // One completed example makes the patient-report flow visible on a fresh
  // demo; it is attached to the existing skin-consultation visit, not a second
  // ledger record.
  const reportEntry = service_entries[2];
  if (reportEntry) {
    const reportCreated = isoDaysAgo(9, now);
    const sampleReport: CrmClinicalReport = {
      number: "RPT-0001",
      doctor_name: "Dr. Ananya Rao",
      doctor_qualification: "MBBS, MD (Dermatology)",
      doctor_registration: "MH-12345",
      patient_age: "29",
      patient_gender: "female",
      chief_complaint: "Recurring breakouts and uneven skin tone for three months.",
      diagnosis: "Mild acne with post-inflammatory hyperpigmentation.",
      examination:
        "Tender papules on both cheeks; no cystic lesions. Skin type: combination.",
      tests: "No tests required today. Review response in four weeks.",
      treatment:
        "Skin consultation and a gentle salicylic cleanse in clinic.",
      medicines: [
        {
          id: "med_seed_1",
          name: "Adapalene 0.1% gel",
          dose: "Thin layer",
          frequency: "Once at night",
          duration: "6 weeks",
          instructions: "Apply to dry skin. Use SPF 50 every morning.",
        },
        {
          id: "med_seed_2",
          name: "Cetirizine 10 mg",
          dose: "1 tablet",
          frequency: "Once daily",
          duration: "5 days",
          instructions: "After dinner if itching persists.",
        },
      ],
      advice:
        "Use a gentle cleanser, avoid picking, and pause actives if irritation increases. Sunscreen daily.",
      follow_up_date: dateOnly(21, now),
      include_photos: false,
      share_consent: true,
      created_at: reportCreated,
      updated_at: reportCreated,
    };
    reportEntry.report = sampleReport;
  }

  return {
    version: 1,
    config,
    contacts,
    activities,
    tasks,
    tags,
    contact_tags,
    service_entries,
    invoice_seq: 0,
    report_seq: reportEntry ? 1 : 0,
  };
}

function sanitize(raw: unknown): CrmState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const config = raw.config;
  if (
    !isRecord(config) ||
    config.version !== 1 ||
    !Array.isArray(config.fields) ||
    !Array.isArray(config.stages) ||
    config.stages.length < 2 ||
    !isRecord(config.modules)
  ) {
    return null;
  }
  if (!Array.isArray(raw.contacts) || !Array.isArray(raw.activities)) return null;
  if (!Array.isArray(raw.tasks) || !Array.isArray(raw.tags) || !Array.isArray(raw.contact_tags)) {
    return null;
  }

  const typedConfig: CrmConfig = {
    ...(config as unknown as CrmConfig),
    billing: sanitizeCrmBillingSettings(
      (config as Record<string, unknown>).billing,
    ),
    report: sanitizeCrmReportSettings(
      (config as Record<string, unknown>).report,
    ),
  };
  const stageIds = new Set(typedConfig.stages.map((stage) => stage.id));
  const fallbackStage = typedConfig.stages.find((stage) => stage.kind === "open")?.id ?? typedConfig.stages[0].id;

  const contacts = (raw.contacts as unknown[])
    .filter(isRecord)
    .filter(
      (contact) =>
        typeof contact.id === "string" &&
        typeof contact.name === "string" &&
        typeof contact.stage_id === "string",
    )
    .map((contact) => ({
      ...(contact as unknown as CrmContact),
      stage_id: stageIds.has(contact.stage_id as string)
        ? (contact.stage_id as string)
        : fallbackStage,
      custom_fields: isRecord(contact.custom_fields)
        ? (contact.custom_fields as Record<string, CrmValue>)
        : {},
      deleted_at: typeof contact.deleted_at === "string" ? contact.deleted_at : null,
    }));

  const contactIds = new Set(contacts.map((contact) => contact.id));
  const rawEntries = Array.isArray(raw.service_entries) ? raw.service_entries : null;
  const service_entries = rawEntries
    ? rawEntries
        .filter(isRecord)
        .filter(
          (entry) =>
            typeof entry.id === "string" &&
            typeof entry.contact_id === "string" &&
            contactIds.has(entry.contact_id) &&
            typeof entry.service === "string" &&
            typeof entry.entry_date === "string" &&
            typeof entry.billed === "number" &&
            Number.isFinite(entry.billed) &&
            entry.billed >= 0 &&
            typeof entry.paid === "number" &&
            Number.isFinite(entry.paid) &&
            entry.paid >= 0 &&
            entry.paid <= entry.billed,
        )
        .map((entry) => {
          const billed = entry.billed as number;
          const parsedInvoice = parseCrmInvoice(entry.invoice);
          const invoiceTotal = parsedInvoice
            ? invoiceTotals(
                parsedInvoice.lines,
                parsedInvoice.discount,
                parsedInvoice.tax_percent,
              ).total
            : null;
          return {
            ...(entry as unknown as CrmServiceEntry),
            service: (entry.service as string).slice(0, 120),
            notes: typeof entry.notes === "string" ? entry.notes.slice(0, 2_000) : "",
            payment_method:
              typeof entry.payment_method === "string" &&
              entry.payment_method in CRM_PAYMENT_METHOD_LABELS
                ? (entry.payment_method as CrmPaymentMethod)
                : "other",
            before_photo: isCrmPhotoDataUrl(entry.before_photo)
              ? entry.before_photo
              : null,
            after_photo: isCrmPhotoDataUrl(entry.after_photo)
              ? entry.after_photo
              : null,
            photo_consent: entry.photo_consent === true,
            invoice:
              parsedInvoice && invoiceTotal !== null &&
              Math.abs(invoiceTotal - billed) < 0.01
                ? parsedInvoice
                : null,
            report: parseCrmReport(entry.report),
            deleted_at:
              typeof entry.deleted_at === "string" ? entry.deleted_at : null,
          };
        })
    : seedServiceEntries(typedConfig, contacts, new Date());

  const storedSeq =
    typeof raw.invoice_seq === "number" &&
    Number.isInteger(raw.invoice_seq) &&
    raw.invoice_seq >= 0
      ? raw.invoice_seq
      : 0;
  const maxInvoiceSeq = service_entries.reduce((max, entry) => {
    const suffix = entry.invoice?.number.match(/(\d+)$/)?.[1];
    return Math.max(max, suffix ? Number(suffix) : 0);
  }, 0);
  const storedReportSeq =
    typeof raw.report_seq === "number" &&
    Number.isInteger(raw.report_seq) &&
    raw.report_seq >= 0
      ? raw.report_seq
      : 0;
  const maxReportSeq = service_entries.reduce((max, entry) => {
    const suffix = entry.report?.number.match(/(\d+)$/)?.[1];
    return Math.max(max, suffix ? Number(suffix) : 0);
  }, 0);

  return {
    version: 1,
    config: typedConfig,
    contacts,
    activities: (raw.activities as CrmActivity[]).filter(Boolean),
    tasks: (raw.tasks as CrmTask[]).filter(Boolean),
    tags: (raw.tags as CrmTag[]).filter(Boolean),
    contact_tags: (raw.contact_tags as CrmContactTag[]).filter(Boolean),
    service_entries,
    invoice_seq: Math.max(storedSeq, maxInvoiceSeq),
    report_seq: Math.max(storedReportSeq, maxReportSeq),
  };
}

/**
 * Read the CRM for a business. No window (SSR) gets an in-memory seed; the
 * client seeds after mount so server and first client render match.
 */
export function loadCrmState(fallback: CrmConfig): CrmState {
  if (memory) return memory;
  if (typeof window === "undefined") return seedCrmState(fallback);
  try {
    const raw = window.localStorage.getItem(CRM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const state = sanitize(parsed);
      if (state) {
        memory = state;
        if (
          isRecord(parsed) &&
          (!Array.isArray(parsed.service_entries) ||
            typeof parsed.report_seq !== "number")
        ) {
          try {
            window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(state));
          } catch {
            // The migrated copy still works in memory for this tab.
          }
        }
        return state;
      }
    }
  } catch {
    // Corrupt or unavailable storage reseeds below.
  }
  const seeded = seedCrmState(fallback);
  memory = seeded;
  try {
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // Private mode / quota: keep the in-memory copy working.
  }
  return seeded;
}

export function saveCrmState(state: CrmState): void {
  memory = state;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode: the in-memory state is still current for this tab.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Settings -> Reset demo data. Never deletes real data (there is none yet). */
export function resetCrmDemo(fallback: CrmConfig): CrmState {
  memory = null;
  const seeded = seedCrmState(fallback);
  saveCrmState(seeded);
  return seeded;
}

/** Same-tab custom event plus cross-tab `storage` notifications. */
export function subscribeCrm(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => {
    memory = null;
    listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === CRM_STORAGE_KEY) {
      memory = null;
      listener();
    }
  };
  window.addEventListener(CHANGE_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

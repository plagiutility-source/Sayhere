/**
 * Rules check for the CRM mock layer. Run with `npm run crm-check`.
 *
 * Covers the binding rules in CRM_FEATURE.md / business-rules.md section 15:
 * access by type and plan, contact validation and limits, stage moves/removal,
 * task limits, consent, soft delete, CSV parsing/import/export and injection
 * protection. No browser or localStorage is needed.
 */

import { crmLimitsFor, supportsCrm, supportsCrmType } from "../lib/crm/access";
import {
  CRM_MAX_APPROVAL_TEXT,
  defaultCrmConfig,
  defaultCrmReportSettings,
  firstOpenStage,
  sanitizeCrmReportSettings,
  type CrmConfig,
} from "../lib/crm/config";
import {
  addActivity,
  addContact,
  addCrmField,
  addServiceEntry,
  addTask,
  changeContactStage,
  contactsToCsv,
  crmInvoiceStats,
  crmServiceStats,
  crmStats,
  csvCell,
  deleteServiceEntry,
  deleteTask,
  generateReport,
  importContacts,
  invoiceTotals,
  invoicesFor,
  liveContacts,
  nextInvoiceNumber,
  nextReportNumber,
  normalizePhone,
  parseContactCsv,
  parseCrmReport,
  parseCsvRows,
  removeStage,
  reportsFor,
  saveInvoice,
  saveReport,
  serviceBalance,
  serviceEntriesFor,
  serviceStatus,
  softDeleteContact,
  toggleTask,
  updateServiceEntry,
  validateContactInput,
  validateCrmConfig,
  validateInvoiceDraft,
  validateReportDraft,
  validateServiceInput,
  type CrmContactDraft,
  type CrmInvoiceDraft,
  type CrmReportDraft,
  type CrmServiceDraft,
  type CrmState,
} from "../lib/crm/rules";
import { seedCrmState } from "../lib/mock/crm-store";
import { plans } from "../lib/mock/plans";

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean): void {
  if (condition) passed += 1;
  else failures.push(name);
}

function eq<T>(name: string, actual: T, expected: T): void {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  check(`${name} — expected ${expectedText}, got ${actualText}`, actualText === expectedText);
}

const NOW = new Date("2026-10-30T12:00:00");
const limits = plans.pro.crm;
if (!limits) throw new Error("Pro must include CRM limits");
const config = defaultCrmConfig("salon");
const base = seedCrmState(config, NOW);

function draft(overrides: Partial<CrmContactDraft> = {}): CrmContactDraft {
  return {
    name: "Test Person",
    email: `test${Math.random().toString(36).slice(2, 8)}@example.com`,
    phone: "",
    company: "",
    stage_id: firstOpenStage(config)?.id ?? config.stages[0].id,
    custom_fields: {},
    consent_status: "unknown",
    tags: [],
    ...overrides,
  };
}

function cloneConfig(change: (current: CrmConfig) => CrmConfig): CrmConfig {
  return change({
    ...config,
    modules: { ...config.modules },
    fields: config.fields.map((field) => ({ ...field, options: [...field.options] })),
    stages: config.stages.map((stage) => ({ ...stage })),
  });
}

/* Access ------------------------------------------------------------ */
check("no access salon on starter", !supportsCrm("salon", "starter"));
check("access salon on pro", supportsCrm("salon", "pro"));
check("access gym on pro", supportsCrm("gym", "pro"));
check("access retail on growth", supportsCrm("retail", "growth"));
check("access other on enterprise", supportsCrm("other", "enterprise"));
check("cafe is out of scope", !supportsCrm("cafe", "pro"));
check("restaurant is out of scope", !supportsCrm("restaurant", "pro"));
check("hotel is out of scope", !supportsCrm("hotel", "pro"));
check("free plan is out of scope", !supportsCrm("salon", "free"));
check("unknown type fails closed", !supportsCrm("spa", "pro"));
check("mixed-case type fails closed", !supportsCrmType("Salon"));
check("free has no crm limits", crmLimitsFor("free") === null);
eq("starter has no CRM limits", crmLimitsFor("starter"), null);
eq("pro field limit", crmLimitsFor("pro")?.fields, 12);
eq("growth stage limit", crmLimitsFor("growth")?.stages, 8);
eq("enterprise task limit", crmLimitsFor("enterprise")?.open_tasks, 20000);

/* Presets ----------------------------------------------------------- */
eq("salon preset stages", config.stages.length, 5);
eq("salon has one won stage", config.stages.filter((stage) => stage.kind === "won").length, 1);
eq("salon has one lost stage", config.stages.filter((stage) => stage.kind === "lost").length, 1);
eq("gym preset fields", defaultCrmConfig("gym").fields.length, 4);
eq("default config validates", validateCrmConfig(config, limits, base.contacts), []);
check("preset field show-in-list exists", config.fields.some((field) => field.show_in_list));

/* Custom columns ---------------------------------------------------- */
const addedColumn = addCrmField(
  base,
  { label: "Membership expiry", type: "date", show_in_list: true },
  limits,
);
check("custom column can be added", addedColumn.ok);
if (addedColumn.ok) {
  eq(
    "custom column count",
    addedColumn.state.config.fields.length,
    config.fields.length + 1,
  );
  eq("custom column gets a key", addedColumn.field.key, "membership_expiry");
  check("custom column appears in the list", addedColumn.field.show_in_list);
  const duplicateLabel = addCrmField(
    addedColumn.state,
    { label: "membership expiry", type: "text" },
    limits,
  );
  check("duplicate column label is refused", !duplicateLabel.ok);
}
const limitFields: CrmConfig["fields"] = Array.from(
  { length: limits.fields },
  (_, index) => ({
    key: `limit_field_${index}`,
    label: `Limit field ${index}`,
    type: "text" as const,
    required: false,
    show_in_list: true,
    options: [],
    archived: false,
  }),
);
const atLimit = addCrmField(
  { ...base, config: { ...base.config, fields: limitFields } },
  { label: "One too many", type: "text" },
  limits,
);
check("custom column limit is enforced", !atLimit.ok);

/* Contact validation ------------------------------------------------ */
eq("missing name", validateContactInput(draft({ name: " " }), base).name, "Enter a name.");
eq(
  "missing email and phone",
  validateContactInput(draft({ email: "", phone: "" }), base).contact,
  "Add an email address or phone number.",
);
eq(
  "bad email",
  validateContactInput(draft({ email: "not-an-email" }), base).email,
  "Enter a valid email address.",
);
eq(
  "bad phone",
  validateContactInput(draft({ email: "", phone: "123" }), base).phone,
  "Use 7 to 15 digits for the phone number.",
);
eq(
  "unknown stage",
  validateContactInput(draft({ stage_id: "stg_nope" }), base).stage_id,
  "Choose a stage.",
);
eq(
  "duplicate email is case-insensitive",
  validateContactInput(draft({ email: "PRIYA@EXAMPLE.COM" }), base).email,
  "That email address is already a contact.",
);
const requiredConfig = cloneConfig((current) => ({
  ...current,
  fields: current.fields.map((field, index) =>
    index === 0 ? { ...field, required: true } : field,
  ),
}));
const requiredState: CrmState = { ...base, config: requiredConfig };
const requiredKey = requiredConfig.fields[0].key;
check(
  "required custom field",
  Boolean(
    validateContactInput(draft({ custom_fields: { [requiredKey]: "" } }), requiredState)[
      `custom:${requiredKey}`
    ],
  ),
);

/* Add/update -------------------------------------------------------- */
const added = addContact(base, draft({ name: "New Person", tags: ["Regular"] }), limits, NOW);
check("add contact succeeds", added.ok);
if (added.ok) {
  eq("added count", liveContacts(added.state).length, 5);
  eq("added name trimmed", added.contact.name, "New Person");
  check("tag linked", added.state.contact_tags.some((link) => link.contact_id === added.contact.id));
  check("created activity", added.state.activities.some((activity) => activity.contact_id === added.contact.id));
  const full = addContact(
    { ...added.state },
    draft({ email: "another@example.com" }),
    { ...limits, contacts: 5 },
    NOW,
  );
  check("contact limit blocks the next add", !full.ok);
}
const phoneOnly = addContact(base, draft({ email: "", phone: "+91 98200 11999" }), limits, NOW);
check("phone-only contact is valid", phoneOnly.ok);
if (phoneOnly.ok) eq("phone normalized", phoneOnly.contact.phone, "+919820011999");

/* Stages ------------------------------------------------------------ */
const moved = changeContactStage(base, base.contacts[0].id, base.config.stages[4].id, NOW);
check("stage move succeeds", moved.ok);
if (moved.ok) {
  eq("stage changed", moved.state.contacts[0].stage_id, base.config.stages[4].id);
  check(
    "stage move logged",
    moved.state.activities.some((activity) => activity.body === "Moved to Lost."),
  );
}
const removed = removeStage(
  { ...base, config: cloneConfig((current) => current) },
  "stg_salon_interested",
  "stg_salon_new",
  NOW,
);
check("remove stage succeeds", removed.ok);
if (removed.ok) {
  check(
    "stage removed from config",
    !removed.state.config.stages.some((stage) => stage.id === "stg_salon_interested"),
  );
  eq(
    "contacts moved before removal",
    removed.state.contacts.find((contact) => contact.id === "crm_seed_3")?.stage_id,
    "stg_salon_new",
  );
}
const badRemove = removeStage(base, "stg_salon_interested", "stg_salon_interested", NOW);
check("remove stage refuses the same destination", !badRemove.ok);

/* Config validation -------------------------------------------------- */
check(
  "field limit is enforced",
  validateCrmConfig(config, { ...limits, fields: 2 }, base.contacts).some((issue) =>
    issue.includes("custom fields"),
  ),
);
const duplicateStage = cloneConfig((current) => ({
  ...current,
  stages: current.stages.map((stage, index) =>
    index === 1 ? { ...stage, name: current.stages[0].name } : stage,
  ),
}));
check(
  "duplicate stage names are rejected",
  validateCrmConfig(duplicateStage, limits, base.contacts).some((issue) =>
    issue.includes("already used"),
  ),
);
const noWon = cloneConfig((current) => ({
  ...current,
  stages: current.stages.map((stage) => ({ ...stage, kind: "open" as const })),
}));
check(
  "one won stage is required",
  validateCrmConfig(noWon, limits, base.contacts).some((issue) => issue.includes("won")),
);
const badKey = cloneConfig((current) => ({
  ...current,
  fields: current.fields.map((field, index) =>
    index === 0 ? { ...field, key: "Bad Key" } : field,
  ),
}));
check(
  "field keys are pattern-checked",
  validateCrmConfig(badKey, limits, base.contacts).length > 0,
);

/* Notes and tasks ---------------------------------------------------- */
const noted = addActivity(base, base.contacts[0].id, "note", "Prefers evening slots.", NOW);
check("note added", noted.ok);
if (noted.ok) {
  eq(
    "note body stored",
    noted.state.activities[noted.state.activities.length - 1].body,
    "Prefers evening slots.",
  );
  eq(
    "last activity updated",
    noted.state.contacts[0].last_activity_at,
    NOW.toISOString(),
  );
}
const blankNote = addActivity(base, base.contacts[0].id, "note", "   ", NOW);
check("blank note rejected", !blankNote.ok);

const task = addTask(base, base.contacts[0].id, "Call back", "2026-11-02", limits, NOW);
check("task added", task.ok);
if (task.ok) {
  const created = task.state.tasks[task.state.tasks.length - 1];
  eq("task open", created.status, "open");
  const toggled = toggleTask(task.state, created.id, NOW);
  check("task toggled", toggled.ok && toggled.state.tasks.find((item) => item.id === created.id)?.status === "done");
  const deleted = deleteTask(toggled.ok ? toggled.state : task.state, created.id);
  check("task deleted", deleted.ok && !deleted.state.tasks.some((item) => item.id === created.id));
}
const taskLimit = addTask(
  base,
  base.contacts[0].id,
  "One too many",
  null,
  { ...limits, open_tasks: 2 },
  NOW,
);
check("open task limit blocks", !taskLimit.ok);

/* Stats -------------------------------------------------------------- */
const stats = crmStats(base, NOW);
eq("stats total", stats.total, 4);
eq("stats opted in", stats.optedIn, 2);
eq("stats due today", stats.tasksDue, 1);
eq("stats overdue", stats.tasksOverdue, 1);
eq("stats stage rows", stats.byStage.length, config.stages.length);
eq(
  "stats won count",
  stats.byStage.find((row) => row.stage.kind === "won")?.count,
  1,
);

/* Work and payments -------------------------------------------------- */
const seededWork = crmServiceStats(base);
eq("seeded work records", seededWork.count, 5);
eq("seeded billed total", seededWork.billed, 15000);
eq("seeded collected total", seededWork.paid, 12200);
eq("seeded outstanding total", seededWork.outstanding, 2800);
eq("contact work records", serviceEntriesFor(base, "crm_seed_1").length, 2);
eq("partial payment status", serviceStatus(base.service_entries[2]), "partial");
eq("unpaid balance", serviceBalance(base.service_entries[3]), 1800);

const workDraft: CrmServiceDraft = {
  contact_id: "crm_seed_1",
  service: "Beard trim",
  entry_date: "2026-10-30",
  billed: 750,
  paid: 250,
  payment_method: "upi",
  notes: "Paid a deposit.",
  before_photo: null,
  after_photo: null,
  photo_consent: false,
};
const addedWork = addServiceEntry(base, workDraft, NOW);
check("work entry added", addedWork.ok);
if (addedWork.ok) {
  eq("work count after add", crmServiceStats(addedWork.state).count, 6);
  eq("contact billed after add", crmServiceStats(addedWork.state, "crm_seed_1").billed, 7950);
  eq("contact balance after add", crmServiceStats(addedWork.state, "crm_seed_1").outstanding, 500);
  check("work add logged", addedWork.state.activities.some((activity) => activity.body.includes("Work logged")));
  eq(
    "work add updates contact activity",
    addedWork.state.contacts.find((contact) => contact.id === "crm_seed_1")?.last_activity_at,
    NOW.toISOString(),
  );
  const paidUp = updateServiceEntry(
    addedWork.state,
    addedWork.entry.id,
    { ...workDraft, paid: 750 },
    NOW,
  );
  check("work payment edited", paidUp.ok);
  if (paidUp.ok) {
    eq("edited balance is zero", serviceBalance(paidUp.entry), 0);
    eq("edited status is paid", serviceStatus(paidUp.entry), "paid");
    const removedWork = deleteServiceEntry(paidUp.state, addedWork.entry.id, NOW);
    check("work entry removed", removedWork.ok);
    if (removedWork.ok) {
      eq("work count after remove", crmServiceStats(removedWork.state).count, 5);
    }
  }
}
eq(
  "work requires a service",
  validateServiceInput(base, { ...workDraft, service: " " }).service,
  "Describe the work or service.",
);
eq(
  "work date is validated",
  validateServiceInput(base, { ...workDraft, entry_date: "2026-02-31" }).entry_date,
  "Choose a valid date.",
);
eq(
  "payment cannot exceed total",
  validateServiceInput(base, { ...workDraft, paid: 900 }).paid,
  "Amount paid cannot be more than the total cost.",
);
const workForDeleted = addServiceEntry(
  base,
  { ...workDraft, contact_id: "crm_missing" },
  NOW,
);
check("work requires a live contact", !workForDeleted.ok);

/* Visit photos -------------------------------------------------------- */
const PHOTO_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=";
eq(
  "photo needs client consent",
  validateServiceInput(base, {
    ...workDraft,
    before_photo: PHOTO_PNG,
  }).photo_consent,
  "Confirm the client agreed to these photos.",
);
eq(
  "svg photos are rejected",
  validateServiceInput(base, {
    ...workDraft,
    before_photo: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    photo_consent: true,
  }).before_photo,
  "Choose a JPG, PNG or WebP photo.",
);
const photoWork = addServiceEntry(
  base,
  {
    ...workDraft,
    before_photo: PHOTO_PNG,
    after_photo: PHOTO_PNG,
    photo_consent: true,
  },
  NOW,
);
check("visit photos saved with consent", photoWork.ok);
if (photoWork.ok) {
  eq("before photo stored", photoWork.entry.before_photo, PHOTO_PNG);
  check("photo consent stored", photoWork.entry.photo_consent);
}

/* Invoices ------------------------------------------------------------ */
const totals = invoiceTotals(
  [
    { quantity: 2, rate: 1000 },
    { quantity: 1, rate: 500 },
  ],
  100,
  18,
);
eq("invoice subtotal", totals.subtotal, 2500);
eq("invoice taxable after discount", totals.taxable, 2400);
eq("invoice tax", totals.tax, 432);
eq("invoice total", totals.total, 2832);
eq("first invoice number", nextInvoiceNumber(base), "INV-0001");

const invoiceDraft: CrmInvoiceDraft = {
  entry_id: base.service_entries[0].id,
  contact_id: base.service_entries[0].contact_id,
  service: base.service_entries[0].service,
  entry_date: base.service_entries[0].entry_date,
  issue_date: "2026-10-30",
  due_date: "2026-11-06",
  lines: [
    { description: "Haircut & finish", quantity: 1, rate: 1000 },
    { description: "Aftercare kit", quantity: 2, rate: 250 },
  ],
  discount: 100,
  tax_percent: 18,
  paid: 500,
  payment_method: "upi",
  notes: "Thank you",
  terms: "Due within 7 days",
};
const savedInvoice = saveInvoice(base, invoiceDraft, NOW);
check("invoice saved on an existing visit", savedInvoice.ok);
if (savedInvoice.ok) {
  eq("invoice number assigned", savedInvoice.invoice.number, "INV-0001");
  eq("invoice drives the ledger total", savedInvoice.entry.billed, 1652);
  eq("invoice sequence advances", savedInvoice.state.invoice_seq, 1);
  eq("paid amount kept", savedInvoice.entry.paid, 500);
  eq("invoice listed", invoicesFor(savedInvoice.state).length, 1);
  eq("next invoice number advances", nextInvoiceNumber(savedInvoice.state), "INV-0002");
  eq("invoice notes saved", savedInvoice.invoice.notes, "Thank you");
  eq(
    "invoice totals account for discount and tax",
    invoiceTotals(savedInvoice.invoice.lines, 100, 18).total,
    1652,
  );
  const invoiceStats = crmInvoiceStats(savedInvoice.state, NOW);
  eq("invoice stats count", invoiceStats.count, 1);
  eq("invoice stats billed", invoiceStats.billed, 1652);
  eq("invoice stats outstanding", invoiceStats.outstanding, 1152);
  eq("invoice stats overdue", invoiceStats.overdue, 0);

  const editedInvoice = saveInvoice(
    savedInvoice.state,
    { ...invoiceDraft, lines: [{ description: "Haircut & finish", quantity: 1, rate: 1200 }], discount: 0, paid: 1200 },
    NOW,
  );
  check("invoice can be edited", editedInvoice.ok);
  if (editedInvoice.ok) {
    eq("editing keeps the number", editedInvoice.invoice.number, "INV-0001");
    eq("editing does not advance the sequence", editedInvoice.state.invoice_seq, 1);
    eq("edited invoice total", editedInvoice.entry.billed, 1416);
  }

  const locked = updateServiceEntry(
    savedInvoice.state,
    savedInvoice.entry.id,
    {
      contact_id: savedInvoice.entry.contact_id,
      service: savedInvoice.entry.service,
      entry_date: savedInvoice.entry.entry_date,
      billed: savedInvoice.entry.billed + 1,
      paid: savedInvoice.entry.paid,
      payment_method: savedInvoice.entry.payment_method,
      notes: savedInvoice.entry.notes,
      before_photo: savedInvoice.entry.before_photo,
      after_photo: savedInvoice.entry.after_photo,
      photo_consent: savedInvoice.entry.photo_consent,
    },
    NOW,
  );
  check("invoiced total cannot be edited from the visit", !locked.ok);
  if (!locked.ok) {
    check("locked total explains the invoice", Boolean(locked.errors.billed));
  }
}
const badDueDate = validateInvoiceDraft(base, {
  ...invoiceDraft,
  due_date: "2026-10-01",
});
eq(
  "invoice due date follows issue date",
  badDueDate.due_date,
  "The due date cannot be before the issue date.",
);
const overpaid = validateInvoiceDraft(base, { ...invoiceDraft, paid: 5000 });
eq(
  "invoice payment cannot exceed total",
  overpaid.paid,
  "Amount paid cannot be more than the invoice total.",
);
const badBilling = cloneConfig((current) => ({
  ...current,
  billing: {
    ...current.billing,
    invoice_prefix: "I",
    default_tax_percent: 60,
    gstin: "nope",
  },
}));
check(
  "invoice settings are validated",
  validateCrmConfig(badBilling, limits, base.contacts).length >= 3,
);

/* Patient reports ---------------------------------------------------- */
const seededReportEntry = base.service_entries[2];
check("seed carries a patient report", Boolean(seededReportEntry?.report));
if (seededReportEntry?.report) {
  eq("seeded report number", seededReportEntry.report.number, "RPT-0001");
  eq("seeded report has medicines", seededReportEntry.report.medicines.length, 2);
  check("seeded report has privacy consent", seededReportEntry.report.share_consent);
}
eq("report count includes the sample", reportsFor(base).length, 1);
eq("first new report number", nextReportNumber(base), "RPT-0002");

const reportEntryId = base.service_entries[0].id;
const reportDraft: CrmReportDraft = {
  doctor_name: "Dr. Test",
  doctor_qualification: "MBBS",
  doctor_registration: "TEST-1",
  patient_age: "34",
  patient_gender: "female",
  chief_complaint: "Itching for a week.",
  diagnosis: "Contact dermatitis.",
  examination: "Localised erythema.",
  tests: "None today.",
  treatment: "Consultation and barrier cream.",
  medicines: [
    {
      name: "Cetirizine 10 mg",
      dose: "1 tablet",
      frequency: "Once at night",
      duration: "5 days",
      instructions: "After food.",
    },
  ],
  advice: "Avoid the trigger and keep the area moisturised.",
  follow_up_date: "2026-11-20",
  include_photos: false,
  share_consent: false,
};
eq(
  "report provider is resolved from settings",
  defaultCrmConfig("salon").report.provider_label,
  "Service provider",
);
const oldReportSettings = sanitizeCrmReportSettings(undefined);
eq(
  "old configs receive report settings",
  oldReportSettings.report_title,
  defaultCrmReportSettings().report_title,
);
const badReport = cloneConfig((current) => ({
  ...current,
  report: {
    ...current.report,
    report_title: " ",
    approval_text: "x".repeat(CRM_MAX_APPROVAL_TEXT + 1),
  },
}));
check(
  "report settings are validated",
  validateCrmConfig(badReport, limits, base.contacts).length >= 2,
);
eq(
  "report provider is required when settings are blank",
  validateReportDraft(base, reportEntryId, { ...reportDraft, doctor_name: " " }).doctor_name,
  "Add the service provider's name in CRM settings before generating a report.",
);
eq(
  "blank diagnosis is allowed for generated drafts",
  validateReportDraft(base, reportEntryId, { ...reportDraft, diagnosis: " " }).diagnosis,
  undefined,
);
eq(
  "prescription row needs a name",
  validateReportDraft(base, reportEntryId, {
    ...reportDraft,
    medicines: [{ ...reportDraft.medicines[0], name: " " }],
  }).medicines,
  "Add a medicine name, or remove the empty row.",
);
eq(
  "follow-up cannot precede the visit",
  validateReportDraft(base, reportEntryId, { ...reportDraft, follow_up_date: "2026-01-01" })
    .follow_up_date,
  "The follow-up cannot be before the visit.",
);
eq(
  "photos need consent in the report",
  validateReportDraft(base, reportEntryId, {
    ...reportDraft,
    include_photos: true,
    share_consent: true,
  }).include_photos,
  "This visit has no before/after photos to include.",
);

const reportSettingsBase: CrmState = {
  ...base,
  config: cloneConfig((current) => ({
    ...current,
    report: {
      ...current.report,
      provider_name: "Dr. Settings",
      provider_qualification: "MBBS",
      provider_registration: "SET-1",
    },
  })),
};
const generatedReport = generateReport(reportSettingsBase, reportEntryId, NOW);
check("one-click report generates from settings", generatedReport.ok);
if (generatedReport.ok) {
  eq("generated report number", generatedReport.report.number, "RPT-0002");
  eq("generated report provider", generatedReport.report.doctor_name, "Dr. Settings");
  eq("generated report qualification", generatedReport.report.doctor_qualification, "MBBS");
  eq("generated report starts as private", generatedReport.report.share_consent, false);
  eq("generated report uses the visit service", generatedReport.report.treatment, base.service_entries[0].service);
  eq("generated report leaves assessment open", generatedReport.report.diagnosis, "");
  eq("generated report advances the sequence", generatedReport.state.report_seq, 2);
}

const reportBaseBilled = base.service_entries[0].billed;
const savedReport = saveReport(base, reportEntryId, reportDraft, NOW);
check("patient report saves on a visit", savedReport.ok);
if (savedReport.ok) {
  eq("new report number", savedReport.report.number, "RPT-0002");
  eq("report sequence advances", savedReport.state.report_seq, 2);
  eq("report preserves the work total", savedReport.entry.billed, reportBaseBilled);
  eq("report is attached to its visit", savedReport.entry.report?.number, "RPT-0002");
  eq("reports list grows", reportsFor(savedReport.state).length, 2);
  eq("next report number advances", nextReportNumber(savedReport.state), "RPT-0003");

  const editedReport = saveReport(
    savedReport.state,
    reportEntryId,
    { ...reportDraft, diagnosis: "Updated dermatitis diagnosis.", medicines: [] },
    NOW,
  );
  check("patient report can be edited", editedReport.ok);
  if (editedReport.ok) {
    eq("editing keeps the report number", editedReport.report.number, "RPT-0002");
    eq("editing does not advance the sequence", editedReport.state.report_seq, 2);
    eq("edited diagnosis saved", editedReport.report.diagnosis, "Updated dermatitis diagnosis.");
    eq("empty prescription rows are dropped", editedReport.report.medicines.length, 0);

    const parsedReport = parseCrmReport(
      JSON.parse(JSON.stringify(editedReport.report)),
    );
    check("stored report parses back", Boolean(parsedReport));
    if (parsedReport) {
      eq("parsed report number", parsedReport.number, "RPT-0002");
      eq("parsed report diagnosis", parsedReport.diagnosis, "Updated dermatitis diagnosis.");
      eq("parsed report gender", parsedReport.patient_gender, "female");
    }
    eq("doctor is still required when parsing", parseCrmReport({ ...editedReport.report, doctor_name: "" }), null);
    check(
      "blank assessment parses as a draft",
      Boolean(parseCrmReport({ ...editedReport.report, diagnosis: "" })),
    );
  }
}

if (photoWork.ok) {
  const photoReport = saveReport(
    photoWork.state,
    photoWork.entry.id,
    { ...reportDraft, include_photos: true, share_consent: true },
    NOW,
  );
  check("consented photos can join the patient copy", photoReport.ok);
  if (photoReport.ok) {
    check("photo inclusion is stored", photoReport.report.include_photos);
  }
  const noConsent = saveReport(
    photoWork.state,
    photoWork.entry.id,
    { ...reportDraft, include_photos: true, share_consent: false },
    NOW,
  );
  check("photo sharing without consent is refused", !noConsent.ok);
  if (!noConsent.ok) {
    check("photo consent error is explicit", Boolean(noConsent.errors.share_consent));
  }
}

/* Soft delete -------------------------------------------------------- */
const deleted = softDeleteContact(base, base.contacts[0].id, NOW);
check("soft delete succeeds", deleted.ok);
if (deleted.ok) {
  eq("soft delete hides from live", liveContacts(deleted.state).length, 3);
  eq(
    "soft delete keeps the row",
    deleted.state.contacts.filter((contact) => contact.id === base.contacts[0].id).length,
    1,
  );
  eq("soft delete hides work from live totals", crmServiceStats(deleted.state).count, 3);
  check(
    "soft delete marks the work records",
    deleted.state.service_entries
      .filter((entry) => entry.contact_id === base.contacts[0].id)
      .every((entry) => Boolean(entry.deleted_at)),
  );
}

/* CSV ---------------------------------------------------------------- */
const parsedRows = parseCsvRows('name,email\n"Sharma, Priya",priya@example.com\n');
eq("quoted comma stays one cell", parsedRows[1][0], "Sharma, Priya");
eq("csv cell is always quoted", csvCell("plain"), '"plain"');
eq("csv formula is escaped", csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
check("csv cell escapes quotes", csvCell('a "b"').includes('""'));

const csvText = [
  "name,email,phone,stage,tags,consent",
  "CSV Person,csv@example.com,,New,Regular;VIP,opted_in",
  "CSV Person 2,csv2@example.com,,New,,unknown",
].join("\n");
const parsed = parseContactCsv(csvText, base, limits, NOW);
eq("csv total", parsed.total, 2);
eq("csv valid drafts", parsed.drafts.length, 2);
eq("csv issues", parsed.issues.length, 0);
const imported = importContacts(base, parsed.drafts, limits, NOW);
eq("csv imported", imported.added, 2);
eq("csv imported state", liveContacts(imported.state).length, 6);

const duplicateCsv = [
  "name,email",
  "First,dup@example.com",
  "Second,dup@example.com",
].join("\n");
const duplicateParse = parseContactCsv(duplicateCsv, base, limits, NOW);
eq("csv duplicate is skipped", duplicateParse.issues.length, 1);
eq("csv duplicate kind", duplicateParse.issues[0].kind, "duplicate");
eq("csv duplicate only one draft", duplicateParse.drafts.length, 1);

const unknownCsv = ["name,email,favourite_colour", "A,a@example.com,Blue"].join("\n");
const unknownParse = parseContactCsv(unknownCsv, base, limits, NOW);
check(
  "unknown column is rejected",
  unknownParse.issues.some((issue) => issue.reason.includes("Unknown column")),
);

const badConsent = ["name,email,consent", "A,a@example.com,sometimes"].join("\n");
const badConsentParse = parseContactCsv(badConsent, base, limits, NOW);
check(
  "invalid consent is rejected",
  badConsentParse.issues.some((issue) => issue.reason.includes("Consent")),
);

const exportText = contactsToCsv(base);
check("export has the header", exportText.startsWith('"name","email","phone","company","stage"'));
check("export includes a seeded contact", exportText.includes("Priya Sharma"));
eq(
  "exported phone keeps + on round-trip",
  normalizePhone("'+919820011001"),
  "+919820011001",
);
const formulaContact = addContact(base, draft({ name: "=Bad", email: "bad@example.com" }), limits, NOW);
if (formulaContact.ok) {
  check(
    "export neutralises a formula name",
    contactsToCsv(formulaContact.state).includes('"\'=Bad"'),
  );
}

/* Done --------------------------------------------------------------- */
if (failures.length) {
  console.error(`${failures.length} CRM check(s) failed:`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`${passed} CRM checks passed`);
}

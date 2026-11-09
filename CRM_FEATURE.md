# CRM for Salon, Gym, Retail and Other Businesses

Owner-approved feature (2026-11-06). Owners of `salon`, `gym`, `retail` and `other` businesses get a
small, owner-configurable CRM: contacts, owner-defined fields, a simple pipeline, notes, follow-up
tasks, tags, a manual work/payment ledger, client before/after photos, printable invoices/bills and
reports/plans with editable business wording, plus CSV import/export.

**Status: Phase 1 mock UI built, including patient reports.** The routes, screens, browser store,
plan/category gate, presets, validation, CSV flow, invoice and patient-report flows and rules check
exist in this worktree. No API, migration or server enforcement is built yet: this is still the
Stage 1 localStorage mock. Stage 2 tables are proposed in `schema.sql`; do not treat them as
applied.

This file is the detailed spec. PRD.md section 5.9, business-rules.md section 15 and
security-and-reliability.md section 4F point here.

---

## 1. Decisions

| Topic | Decision |
|---|---|
| Who gets it first | `salon`, `gym`, `retail` and `other` (the `general` category). Café, restaurant and hotel keep table/room ordering and are **not** part of v1 |
| Plans | Starter and above. Free sees no CRM navigation and gets a branded 404 on `/crm` |
| V1 modules | Contacts, owner-defined fields, pipeline stages, notes, follow-up tasks, tags, manual work/payment records, before/after visit photos, invoices/bills, patient reports/prescriptions, CSV import/export |
| Customization | Presets by business type, then the owner edits fields, stages and module switches inside fixed limits. Configuration is validated JSON, never per-business code |
| Not in v1 | Appointment booking/calendar (PRD section 11 already excludes it), marketing campaigns, bulk email/WhatsApp, online payment collection, automated GST filing, staff logins, duplicate merge, workflow automation, a public patient portal or permanent live report link |
| Data | Stage 1 mock in `localStorage`; Stage 2 tables in `schema.sql`; the patient copy is a self-contained file shared by the owner, not a public web page |
| Enforcement | Server-side in Stage 3. The UI mirrors the plan/category gate and never decides it |

---

## 2. Who gets it

- A new helper (`lib/crm/access.ts`, proposed) decides access: the business type must be
  `salon`, `gym`, `retail` or `other` **and** the plan must be `starter`, `pro`, `growth` or
  `enterprise`. Missing, unknown or wrongly-cased values fail closed. Café/restaurant/hotel are
  false in v1.
- The sidebar gets a **CRM** item after Locations, shown only when access is true. `/crm`,
  `/crm/[id]` and `/crm/settings` render the branded not-found page for every other business — the
  same pattern as `OrderingGate`, with no internal detail and no hint that the feature exists.
- Free plan: the item is hidden and the routes 404. Downgrading to Free makes CRM **read-only** for
  `RETENTION_DAYS_AFTER_CANCEL` (default 90) days, then the data is deleted (section 9).
- Owner only in v1. Staff/member logins and per-staff assignment are a later phase.

---

## 3. Vocabulary

| Term | Meaning |
|---|---|
| Contact | One person the owner knows. Has a name, optional email/phone, a stage, tags, consent and custom field values |
| Built-in field | `name`, `email`, `phone`, `company`. Fixed labels and validation; cannot be archived |
| Custom field | An owner-defined field stored in `crm_contacts.custom_fields` and defined in the CRM config |
| Stage | One step in the owner's pipeline (for example New, Contacted, Active, Lost). Exactly one won and one lost stage |
| Activity | An append-only timeline entry: note, call, email (logged manually), visit or system event |
| Task | A dated follow-up attached to a contact. **Not** a booking or appointment |
| Work record | A manual log of what was delivered, its billed amount, the amount paid and the payment method. This is bookkeeping, not payment collection. It can also hold before/after photos and one invoice |
| Photo | An optional before and/or after image attached to one visit. Resized in the browser, private to the owner's workspace, and stored only with recorded client consent |
| Invoice | A printable bill attached to a work record. Its line items, discount and tax produce the ledger total; it never creates a second payment record |
| Report / plan | A service summary attached to one work record. Terminology, provider details and approval wording are owner settings; it reuses the visit's date, service and consented photos and can be printed or shared as a private file |
| Tag | A free-label grouping the owner creates; up to 10 per contact |
| Preset | The starting fields/stages for a business type, applied once and then editable |
| Module | A switch the owner can turn off: pipeline, tasks, tags. Notes and consent are always on |
| Config | The validated JSON object that holds field definitions, stages and module switches |

---

## 4. Presets

A preset is only a starting point. The owner can rename, reorder, archive or add inside the limits in
section 6. Applying a preset never changes existing contact data.

| Preset | Suggested custom fields | Suggested stages |
|---|---|---|
| Salon | Preferred service (select: Haircut, Colour, Facial, Other), Preferred staff (text), Birthday (date), Last visit (date), Referral source (select: Walk-in, Instagram, Google, Friend, Other) | New, Contacted, Interested, Active client, Lost |
| Gym | Membership plan (select: Monthly, Quarterly, Annual), Joined on (date), Renewal on (date), Goal (text) | New, Trial, Active member, Expiring, Lost |
| Retail | Preferred category (text), Size (text), Birthday (date), Last purchase (date), Interests (multi-select: Fashion, Home, Beauty, Electronics, Other) | New, Interested, Purchased, Repeat customer, Lost |
| Other | Role (text), Source (select: Referral, Website, Walk-in, Event, Other), Next step (text) | New, Contacted, Qualified, Customer, Lost |

`company` is a built-in field, so the "Other" preset does not redefine it.

**Reset to preset** is behind a confirm. Fields and stages are replaced; field values stay in
`custom_fields` but archived fields are hidden. If the current stage of any contact is removed, the
owner must choose a destination stage first (section 6.2).

---

## 5. Owner flows

### 5.1 `/crm` — contact list

The Phase 1 mock is a compact CRM workspace with four views: **Contacts**, **Pipeline**,
**Work & payments** and **Invoices**. A commercial summary strip shows total clients, billed,
collected, outstanding and active clients. The Contacts table shows the client, stage, active
custom columns, last work, billed, outstanding and open tasks; the Pipeline board shows billed
value per stage; the Work & payments view is a cross-client ledger with date, billed, paid, balance
and paid/part-paid/unpaid status; the Invoices view lists bills with issue/due dates, totals,
balance and overdue state, and supports search, view, edit and print.

- Search by name, email, phone, company, tag or any custom-column value. Filters: stage (when the
  pipeline module is on), tag, consent. Sort: recently updated (default), name A–Z, newest.
- **Add column** sits above the contacts table. It opens a compact, validation-backed builder for
  column name, type, choices, required and Show in table. The new column appears immediately and is
  available on contact forms, search, CSV import/export and the contact detail. Rename, visibility
  and archive controls remain in CRM settings.
- Columns: contact, stage, every active field with Show in table, last work, billed, outstanding,
  open tasks and the record link. Narrow screens render the same rows as record cards.
- 25 rows per page with "Page X of Y" in the staged backend; the Phase 1 mock shows the full list.
- **New contact** opens a form (name required, email or phone required, stage, consent, custom
  fields). Duplicate email inside the same business is refused (section 7).
- **Export CSV** downloads the current filter, up to the plan's export cap (section 6.5).
- Empty state: preset-aware copy ("No clients yet. Add your first client or import a CSV.").
  Loading: skeletons with the table's dimensions. Error: one inline Retry, no technical detail.

### 5.2 `/crm/[id]` — contact detail

- Header: name, contact methods, stage selector, tags, consent status, created date.
- Built-in and active custom fields, editable inline; archived fields are hidden but their values are
  kept.
- Timeline of activities, newest first, with a note composer (1–2000 characters) and "Log a call" /
  "Log a visit" shortcuts. Activities are append-only in v1.
- Tasks: add a title and optional due date, mark done, reopen. Overdue tasks are derived from the
  business time zone, never stored as a status.
- Delete contact: confirm, then soft delete. Copy: "Delete this contact? Their notes and tasks are
  removed too. This cannot be undone after 30 days."
- The Phase 1 header carries four commercial highlights (lifetime billed, collected, outstanding and
  last work). Tabs separate Overview, Work & payments, Reports, Photos, Activity and Tasks.
  Overview keeps contact information, custom fields, stage, latest work and open tasks together.

#### 5.2.1 Work & payments

- Each record captures the client, what was done, the date, the total cost, the amount paid, the
  payment method (cash, UPI, card, bank transfer or other), optional notes, optional before/after
  photos and photo consent.
- Balance and status are derived, never entered: `billed - paid`, with Paid, Part paid and Unpaid
  badges. A paid amount cannot exceed the total or be negative.
- The editor adds and corrects records. Editing the paid amount is how the owner records a later
  payment; deleting a record is a soft delete and leaves an audit activity.
- Billed, collected and outstanding roll up per contact, in the list and across the Work & payments
  ledger. These are bookkeeping totals only; the product never processes a payment.

#### 5.2.2 Before/after photos

- The visit editor offers one optional **Before** and one optional **After** photo. On a phone the
  file input asks for the camera; the gallery is the fallback. JPG, PNG and WebP are accepted, up to
  12 MB before compression.
- Each photo is resized to a maximum edge of 900 px and re-encoded before storage. SVG and other
  document formats are refused. Stage 1 keeps a compressed raster data URL in `localStorage`;
  Stage 2 uploads to private object storage and stores only the object key/URL.
- The owner must tick "I confirm this client agreed to these before/after photos being stored in
  their record" whenever a photo is present. Removing the last photo clears that requirement.
- Photos appear on the contact's **Photos** tab as a before/after pair, on the work row as a small
  preview, and in a larger side-by-side viewer. They never appear on the public customer page.
- A photo is private to the business, not searchable, and not included in CSV export. Deleting the
  work record hides the photos with it; the normal soft-delete/retention rules apply.

#### 5.2.3 Invoices and bills

- Any work record can become an invoice, or the owner can create an invoice and its work record in
  one form. Each work record has **at most one** invoice.
- Invoice fields: client, work title, work date, issue date, due date, up to 8 line items
  (description, quantity, rate), absolute discount, tax %, amount paid, payment method, notes and
  terms. Numbers are proposed and configurable in Settings (default `INV-0001`).
- Line totals, subtotal, discount, tax, total, paid and balance are previewed live. The invoice
  total becomes the work record's `billed` amount, so the printed bill and the ledger cannot drift
  apart. Payments are still edited on the work record: there is no second payment ledger.
- Once a work record has an invoice, its total is locked in the visit editor; change the total from
  the invoice instead. Editing an invoice keeps its number. Deleting the work record deletes the
  invoice.
- **Print / Save PDF** uses the browser print dialog on a clean, paper-style bill with the seller
  details from Settings, bill-to details, line items, totals, paid/balance, notes and terms.
- Invoice status is derived from the existing payment state. Due date is separate from the work
  date; a balance past its due date is shown as **Overdue**.

#### 5.2.4 Invoice details in Settings

- The seller address, phone, email, optional 15-character GSTIN, invoice prefix, default tax %,
  default due days and footer terms are stored in the CRM config. They print on every invoice and
  can be changed without touching past bills' numbers or totals.
- Prefix: 2–8 letters/numbers, uppercased. Default tax: 0–50%. Default due: 0–90 days.
- Changing the prefix affects only newly numbered invoices; existing numbers are never reused or
  renumbered.

#### 5.2.5 Reports and plans

- Any CRM business — clinic, salon, gym, trainer, consultant or other — can generate **one report**
  on a visit. The visit remains the source of truth for the service, date, billed/paid amounts and
  before/after photos; the report adds a document without creating a second ledger or photo record.
- Report terminology and provider identity live in **Settings → Report & provider details**. Owners
  edit the report title, recipient label (Patient, Client, Member, Customer), provider label (Doctor,
  Trainer, Stylist, Consultant), provider name, qualification/certification, registration/licence,
  signature line, approval wording, plan section heading and footer note. Qualification and
  registration may be blank, so no doctor or degree is required.
- **Generate report** on a visit creates the report immediately. It uses the saved provider details
  and the visit's service, starts private with no photos or sharing consent, and leaves the
  assessment/plan open. The owner can then **Edit report** to add the service notes, plan and photos;
  generated drafts are labelled as drafts until an assessment is added.
- Report content fields: recipient age/gender, concern/reason for visit, assessment/result (optional
  for a generated draft), observations/findings, checks/tests, service/treatment, up to 10 plan rows
  (name, dose, frequency, duration, instructions), advice/aftercare, optional follow-up date, an
  include-photos flag and a client-share consent flag. Recipient name, phone and email come from the
  contact; age and gender live on the report because they can change over time.
- Provider name, qualification and registration are copied onto each saved report. The signature,
  approval wording, labels, plan heading and footer are rendered from the current report settings.
- Report numbers are automatic and monotonic (`RPT-0001`) and survive edits; a deleted report's
  number is never reused. One visit can have at most one report, just like its invoice.
- The **Reports** tab lists every visit with its report number, provider and assessment. A visit row
  offers **Generate report** or **View report**, and the same actions appear on the visit card.
- The **client copy** is a clean document with the practice details from Settings, recipient and
  provider blocks, service sections, the configured plan table, selected photos, advice, follow-up,
  approval wording and signature. It is intentionally outside the owner CRM chrome.
- **Print / Save PDF** uses the browser print dialog on the `.report-print-area`. **Share report**
  creates a self-contained HTML file on the device (inline CSS and embedded compressed photos) and
  uses the Web Share sheet where available, with a download fallback. The file is private; nothing
  is uploaded to a public URL in Phase 1.
- Before/after photos can be included only when the visit already has recorded client photo consent
  **and** the owner confirms the client agreed to receive the report electronically. Photos are
  omitted from the client copy otherwise. The same rule is enforced by the rules check.
- Report text is trimmed and length-limited; the report is sanitized when read back from storage and
  dropped if its required number or provider name is missing. Client-copy HTML escapes every
  owner-entered value and only embeds validated raster data URLs.
- A work-record delete confirms that its payment history, photos, invoice and report go with it.

### 5.3 `/crm/settings` — customization

- Report & provider details: title, recipient/provider labels, provider name and optional
  qualification, registration, signature, approval wording, plan heading and footer. These fill new
  reports automatically and use business-neutral defaults.
- Preset picker, field builder, stage builder, module switches and plan-limit meters. The same
  validated column builder is available directly from Contacts, so adding a column does not require
  opening Settings; Settings is the full editor for renaming, visibility and archive.
- Save / Discard / Reset to preset with the same unsaved-changes guard as the customer-page editor.
- Preview of the contact form and the stage list updates from the draft.
- The Save button is blocked while an item is invalid, with "Fix N items to save" and an inline jump
  to the first invalid field.
- Plan-limit messages: "You can add up to {n} custom fields on your plan.", "Your plan allows up to
  {n} stages.", "You have used {used} of {limit} contacts."

### 5.4 Import

1. Choose a `.csv` file (max 2 MB, max rows per plan).
2. Map headers if they do not match exactly, then preview the first 20 rows.
3. The owner sees valid, duplicate and invalid counts before importing.
4. Import valid rows only; duplicates and invalid rows are listed in the report, nothing is
   updated in v1. A row is never silently dropped.
5. The report can be downloaded as CSV. Import completes with a summary and the list refreshes.

### 5.5 Export

- UTF-8 CSV named `crm-contacts-YYYY-MM-DD.csv`, downloaded with `Cache-Control: no-store`.
- Columns: `name,email,phone,company,stage,tags,consent,created_at,last_activity_at` plus every
  active custom field key. Archived fields and activities are not exported.
- Every value is quoted; cells beginning with `=`, `+`, `-` or `@` are prefixed with `'` so a
  spreadsheet cannot execute them (CSV injection). Export is audited.

### 5.6 Accessibility and states

- Every control is a real button/input/select with a visible label; no drag-only interaction. Stage
  reordering uses Move up / Move down buttons.
- Focus returns after dialogs close; Escape closes dialogs; the skip link and table semantics follow
  the existing dashboard shell.
- Loading, empty, error and over-limit states exist on the list, detail and settings screens.

---

## 6. Customization rules and limits

### 6.1 Fields

- Built-in: `name` (required, 1–120), `email` (optional, 254, valid format), `phone` (optional,
  7–15 digits with optional leading `+`), `company` (optional, 120). A contact needs a name and at
  least one of email/phone.
- Custom field definition: `key`, `label`, `type`, `required`, `show_in_list`, `options`, `archived`.
- `key` matches `^[a-z][a-z0-9_]{1,29}$`, is unique inside the business and is **immutable** after
  creation. It is generated from the label and shown read-only in the editor.
- `label` 1–40 characters. `type` is one of `text` (200), `long_text` (2000), `number`, `date`
  (`YYYY-MM-DD`), `select` (one option), `multi_select` (array of options), `checkbox`. The type is
  immutable once the field has a value; create a new field and archive the old one instead.
- `select`/`multi_select` have 1–20 options, each 1–40 characters, unique and non-empty.
- A required custom field is enforced on create and edit, never retroactively on old contacts.
- Archiving keeps stored values and removes the field from forms, list columns, filters and exports.
  It is reversible.
- Limits: at most the plan's custom-field count; hard cap 30 fields per business.

### 6.2 Stages

- 2–8 stages, unique names (case-insensitive, 1–32 characters), ordered, with exactly one `won` and
  one `lost` stage; the rest are `open`. At least one open stage always exists.
- Stage ids are stable (`stg_` + random) and never reused. Renaming changes the label only.
- Moving contacts between stages is a normal edit; the move is written to `crm_activities` as a
  system entry.
- Deleting a stage requires a destination stage for every contact in it and cannot delete the last
  open stage. The move and delete happen in one transaction.
- Turning the pipeline module off hides stages but keeps each contact's `stage_id`; turning it on
  shows them again.

### 6.3 Modules

| Module | Default | Off means |
|---|---|---|
| Pipeline | on | Stage column, stage filter and stage select hidden; data kept |
| Tasks | on | Tasks section hidden; data kept |
| Tags | on | Tag column, tag filter and tag editor hidden; links kept |
| Notes/consent | always on | Not switchable; consent is a legal record |

### 6.4 Config shape and validation

```json
{
  "version": 1,
  "preset": "salon",
  "modules": { "pipeline": true, "tasks": true, "tags": true },
  "fields": [
    {
      "key": "preferred_service",
      "label": "Preferred service",
      "type": "select",
      "required": false,
      "show_in_list": true,
      "options": ["Haircut", "Colour", "Facial", "Other"],
      "archived": false
    }
  ],
  "stages": [
    { "id": "stg_new", "name": "New", "kind": "open" },
    { "id": "stg_active", "name": "Active client", "kind": "won" },
    { "id": "stg_lost", "name": "Lost", "kind": "lost" }
  ],
  "billing": {
    "address": "12 Market Road, Pune 411001",
    "phone": "+91 98200 11001",
    "email": "hello@example.in",
    "gstin": "",
    "invoice_prefix": "INV",
    "default_tax_percent": 0,
    "default_due_days": 7,
    "terms": "Thank you for your business."
  }
}
```

- The server validates the whole object with pure functions before saving; unknown keys, duplicate
  keys/stage ids, invalid option lists, missing won/lost stages and plan-limit breaches are rejected.
- Maximum size 100 KB, version integer, one config row per business. The invoice (`billing`) block
  is optional in old stored configs and is normalised with safe defaults when read. A breaking shape
  change bumps `version`; readers accept known versions and migrate forward, never guess.
- The client can never set a count, plan limit, `business_id` or consent record. The server reads
  limits from the plan setting and rejects anything above them.
- Saving config never deletes contact data. Removed fields are archived; removed stages require a
  destination first.

### 6.5 Plan limits

| Plan | CRM | Contacts | Custom fields | Stages | Tags | Open tasks | CSV rows per import |
|---|---|---|---|---|---|---|---|
| Free | No | — | — | — | — | — | — |
| Starter | Yes | 500 | 8 | 5 | 5 | 200 | 1,000 |
| Pro | Yes | 2,000 | 12 | 6 | 15 | 1,000 | 5,000 |
| Growth | Yes | 10,000 | 20 | 8 | 30 | 5,000 | 10,000 |
| Enterprise | Yes, custom | up to 100,000 | up to 30 | 8 | up to 50 | up to 20,000 | 10,000 |

Hard caps apply to every plan: 100,000 contacts, 30 fields, 8 stages, 50 tags, 20,000 open tasks,
10,000 rows and 2 MB per import. These numbers are proposals to confirm before launch; they move
into the `plans` setting (and `lib/mock/plans.ts`) when the mock UI is built, so there is one source
of truth.

Downgrade behaviour: existing contacts stay and are readable. Creating contacts above the new limit is
blocked with the upgrade message; nothing is deleted. Below Free, CRM becomes read-only for the
retention window and is then purged (section 9). Work, photo and invoice records are not separately
capped in Phase 1; they belong to a contact and disappear with it. A work record has at most one
invoice, and photos are compressed so the browser-storage mock stays small.

---

## 7. Data model

Stage 2 tables (`schema.sql`, section "CRM (STAGE 2 PROPOSAL)"):

| Table | Purpose |
|---|---|
| `crm_configs` | One validated JSON config per business, versioned, 100 KB cap; includes seller invoice details, the invoice counter and the report counter |
| `crm_contacts` | Person record; built-ins, `stage_id`, `custom_fields` JSON, consent, source, soft delete |
| `crm_service_entries` | Manual work/payment ledger: service, date, billed/paid amounts, method, notes, photo URLs/consent, soft delete |
| `crm_invoices` | One printable bill per work record: number, issue/due dates, discount, tax, notes, terms |
| `crm_invoice_lines` | Ordered invoice line items: description, quantity, rate |
| `crm_patient_reports` | One patient-facing report/prescription per work record: doctor, patient details, clinical sections, follow-up, photo/share flags |
| `crm_report_medicines` | Ordered prescription rows (max 10): name, dose, frequency, duration, instructions |
| `crm_activities` | Append-only timeline entries (note, call, email, visit, system) |
| `crm_tasks` | Dated follow-ups with `open`/`done` status |
| `crm_tags` | Owner-created labels, unique per business (case-insensitive) |
| `crm_contact_tags` | Many-to-many tag links, tenant-scoped |

Rules:

- Every row carries `business_id`; every query filters by the session's `business_id`, never an id
  from the request (security section 2).
- Email is lower-cased and trimmed; a partial unique index prevents two live contacts with the same
  email in one business. Phone is not unique (families share numbers) but a duplicate warning is
  shown before saving.
- `custom_fields` is a JSON object keyed by custom field `key`. Values are validated against the
  config on every write; unknown keys are dropped and reported, never stored.
- `last_activity_at` is updated when an activity or completed task is written, so list sorting does
  not need a join.
- Work amounts are integer paise in the database and displayed as INR. `paid_paise` is constrained
  to `0..billed_paise`; balance and status are derived, never stored. An invoice's total is the same
  `billed_paise` value, not a second total.
- Visit photos are private object-storage keys or URLs plus a `photo_consent` flag; they are never
  public, never in CSV export and are deleted with their work record. The Stage 1 mock stores small
  compressed data URLs in browser storage only.
- Invoice numbers are unique per business and monotonic (`crm_configs.invoice_seq`); a deleted
  invoice's number is never reused. Invoice lines are tenant-scoped through their invoice.
- A patient report is attached to one `crm_service_entries` row and has no payment fields of its
  own. Report numbers are unique per business and monotonic (`crm_configs.report_seq`); deleting a
  visit deletes its report and prescription rows by cascade. Report share consent and photo
  inclusion are recorded flags, never inferred from the contact's general consent status.
- Deleting a contact sets `deleted_at`; its activities, tasks and work records are hidden and purged
  with it.
- Contact deletion, config changes, work-record edits, imports and exports are written to `audit_logs`.

---

## 8. CSV import/export format

- Header row required. Required column: `name`. Optional: `email`, `phone`, `company`, `stage`,
  `tags`, `consent`, plus custom field keys.
- `tags` is a `;`-separated list; unknown tags are created up to the plan limit, the rest are
  reported. `consent` accepts `unknown`, `opted_in`, `opted_out` (case-insensitive).
- `stage` matches a stage name case-insensitively; an unknown stage is an error row, not a silent
  default.
- Duplicate email against a live contact in the same business is skipped and reported. V1 never
  updates an existing contact from a CSV.
- Invalid rows are reported as `Row N: reason` and do not block the valid rows. The owner sees the
  counts before confirming.
- Export includes only active fields and the fixed columns in section 5.5. Formula-leading cells are
  prefixed with `'`; import treats every cell as text and never evaluates formulas or HTML.
- PDFs, XLSX and image uploads are not accepted. The file is parsed in memory and never stored.

---

## 9. Consent, privacy and retention

- `consent_status` is `unknown` (default), `opted_in` or `opted_out`; `consent_source` records where
  it came from (manual, import, feedback, customer page, loyalty) and `consent_at` when it changed.
- V1 sends **no** marketing email or WhatsApp. Consent and DND are recorded so a later campaign
  feature cannot message someone who opted out. Transactional contact by the owner is outside the
  product.
- Contact PII is visible only to the authenticated owner of that business. It is never logged, never
  placed in URLs, never exported to a third party, and never included in analytics events.
- Patient reports are sensitive clinical records. The Phase 1 copy is generated in the browser and
  shared only as a private file; it is never written to a public URL or analytics event. A future
  authenticated patient portal needs its own access-control design before it is enabled.
- Before/after photos are sensitive client images: private to the owner's workspace, access-controlled
  in Stage 2, not indexed or public, and stored only after explicit photo consent. Invoices contain
  the same contact details and are private for the same reason.
- Owner can export a contact's data (CSV) and delete it. Support handles data-subject requests using
  the same export/delete paths.
- Soft-deleted contacts are purged after 30 days by the daily cron, together with their activities,
  tasks and tag links.
- When a business downgrades to Free, CRM is read-only for `RETENTION_DAYS_AFTER_CANCEL` (default
  90) days; the owner can still export. After that window the contacts, activities, tasks and tags
  are deleted. This matches the retention rule in business-rules.md section 5B.
- No card data, UPI credentials or provider keys exist anywhere in this feature.

---

## 10. Analytics and dashboard

A CRM section appears **below** the existing dashboard and analytics content, only when access is
true. Existing cards, numbers and charts are unchanged.

| Metric | Definition |
|---|---|
| Total contacts | Live contacts (not soft-deleted) |
| New contacts (30 days) | `created_at` in the last 30 days, business time zone |
| Contacts by stage | Live contacts grouped by `stage_id`; won and lost shown separately |
| Tasks due today | Open tasks with `due_on` equal to today in the business time zone |
| Tasks overdue | Open tasks with `due_on` before today |
| Opted in | Live contacts with `consent_status = opted_in` |
| Billed | Sum of live work records' billed amounts |
| Collected | Sum of live work records' paid amounts |
| Outstanding | Billed minus collected, floored at zero |
| Invoices | Live work records with an invoice |
| Invoice billed | Sum of live invoiced work records' billed amounts |
| Invoice outstanding | Invoice billed minus invoice paid, floored at zero |
| Invoices overdue | Unpaid invoices whose due date is before today |

Billed, collected and outstanding on the CRM pages come only from logged work records. No deal value
or forecast is invented. The existing dashboard/analytics section remains contact- and
pipeline-based. Empty store shows zeros with honest empty text and a skeleton until the client store
hydrates, matching the ordering cards.

---

## 11. Copy and errors

| Situation | Message |
|---|---|
| Missing name | Enter a name. |
| No contact method | Add an email address or phone number. |
| Invalid email | Enter a valid email address. |
| Invalid phone | Use 7 to 15 digits for the phone number. |
| Duplicate email | That email address is already a contact. |
| Duplicate field label | Column names must be unique. |
| Field limit | You can add up to {n} custom fields on your plan. |
| Too few stages | Add at least two stages. |
| Missing won/lost | Keep one won and one lost stage. |
| Duplicate stage name | That stage name is already used. |
| Deleting a used stage | Move the contacts in this stage before deleting it. |
| Contact limit | Your plan allows {n} contacts. Upgrade to add more. |
| Import too large | Choose a CSV file under 2 MB. |
| Import row error | Row {n}: {reason}. |
| No service | Describe the work or service. |
| Invalid work date | Choose a valid date. |
| Invalid total | Enter a valid total cost. |
| Paid over total | Amount paid cannot be more than the total cost. |
| Photo without consent | Confirm the client agreed to these photos. |
| Photo too large | Choose a photo under 12 MB. |
| Invalid photo format | Choose a JPG, PNG or WebP photo. |
| Invoiced total edit | Change the total from the invoice. |
| Invoice due date | The due date cannot be before the issue date. |
| Invoice paid over total | Amount paid cannot be more than the invoice total. |
| Invalid GSTIN | Enter a valid 15-character GSTIN, or leave it blank. |
| Invalid invoice prefix | Use 2 to 8 letters or numbers for the invoice prefix. |
| Delete contact | Delete this contact? Their notes and tasks are removed too. This cannot be undone after 30 days. |

No message reveals internals, stack traces, ids or another business's data.

---

## 12. Acceptance tests

1. A salon on Starter sees CRM in the sidebar; the same salon on Free gets a branded 404 on `/crm`,
   `/crm/[id]` and `/crm/settings`.
2. A café, restaurant or hotel gets the same 404 and no CRM navigation, even by typing the URL.
3. An unknown or missing business type is treated as no access (fail closed).
4. Starter cannot create a 9th custom field or a 6th stage; the message names the plan limit.
5. A custom field key is immutable; a second field with the same key is refused.
6. Archiving a field keeps its stored values and removes it from forms, filters and export.
7. Deleting a stage with contacts is refused until a destination is chosen; the move is atomic.
8. Exactly one won and one lost stage are required; the last open stage cannot be deleted.
9. Two live contacts with the same email in one business are refused; a different business may use
   the same email.
10. Importing 3 valid, 1 duplicate and 2 invalid rows adds 3 contacts and reports the other 3 with row
    numbers; no existing contact is changed.
11. Exporting a contact whose field starts with `=cmd` writes `'=cmd`; a spreadsheet does not
    execute it.
12. A contact name containing `<script>alert(1)</script>` renders as plain text in the list, detail,
    CSV and dashboard.
13. Every CRM query is scoped by the session's `business_id`; a contact id from another business
    returns 404 and never leaks its data.
14. Deleting a contact hides it immediately and purges it after 30 days; export before deletion
    includes its consent.
15. After a downgrade to Free, CRM is read-only, existing contacts stay readable and exportable for
    90 days, then the data is purged.
16. Turning the pipeline module off hides stages but keeps each contact's stage; turning it back on
    restores them.
17. Logging work with a total of ₹3,500 and ₹1,500 paid shows Part paid, ₹2,000 outstanding and adds
    ₹3,500 billed / ₹1,500 collected to the workspace totals.
18. Editing that record's paid amount to ₹3,500 shows Paid, zero outstanding and a consistent
    collected total; a paid amount above the total is refused.
19. From Contacts, **Add column** creates "Membership expiry" (date) and the new column appears in
    the table immediately, on every contact form, in search and in CSV import/export. A duplicate
    label or the 9th Starter column is refused with the plan-limit message.
20. Logging a visit with a before photo, an after photo and consent shows both images on the
    contact's Photos tab and in the work row. Removing consent blocks the save; an SVG or a photo
    over 12 MB is refused; CSV export does not include the images.
21. Creating an invoice with 2 line items, a discount and tax previews the correct total, sets the
    work record's billed amount to that total, and shows the same paid/balance in the ledger.
22. The first invoice is `INV-0001`, the next is `INV-0002`; editing an invoice keeps its number and
    does not advance the sequence. Editing the visit's total while invoiced is refused with "Change
    the total from the invoice."
23. An invoice with a due date before its issue date, or a paid amount above its total, is refused.
    Printing shows the seller details, bill-to, line items, totals, balance, notes and terms.
24. Invoice settings reject a one-character prefix, tax above 50% and an invalid GSTIN; valid seller
    details appear on the next printed invoice.

---

## 13. Build plan

| Phase | Work | Status |
|---|---|---|
| 0. Spec | This file, PRD 5.9, business-rules 15, security 4F, `schema.sql` CRM tables, README link | Done with this change |
| 1. Mock UI | `lib/crm/access.ts`, `lib/crm/config.ts` (presets/limits/billing/validation), `lib/crm/photos.ts`, `lib/crm/rules.ts`, `lib/mock/crm-store.ts` (`syehere.mock.crm.v1`), `/crm` with contacts/pipeline/work-payment/invoice views, `/crm/[id]` record tabs including photos and bills, `/crm/settings` with invoice details, `components/crm/*`, nav gate, dashboard cards, `scripts/crm-rules-check.ts` | Done in this change (Stage 1 mock) |
| 2. Schema | Apply the CRM tables in the Stage 2 Turso database, add the tests/seed fixtures | Stage 2 |
| 3. Backend | Owner-authenticated routes, tenant checks, config validation, CSV import/export, audit entries | Stage 3 |
| 4. Connect | Replace the mock store, keep the same rules module, regression checks (`typecheck`, `build`, `rooms-check`, `crm-rules-check`) | Stage 4 |
| 5. Integrations | "Save as contact" from feedback/loyalty, duplicate merge, staff access, optional email/WhatsApp campaigns | Later, separately approved |

Phase 0 added only the spec and proposed tables. Phase 1 now adds the mock UI; phases 2–4 remain.

---

## 14. Open questions

1. Confirm the proposed plan limits in section 6.5 (especially whether Free should get a small
   teaser instead of no CRM at all).
2. Should café/restaurant/hotel be able to opt in later, and from where (Settings or support)?
3. Do we need duplicate merge in v1, or is "skip and report" enough for CSV?
4. Should staff members get scoped CRM access, or is owner-only enough for launch?
5. Should import ever update an existing contact (matched by email)? V1 deliberately does not.
6. Is 90 days the right post-downgrade read-only window, and 30 days the right purge window?
7. Appointment booking remains out of scope per PRD section 11; confirm it stays out of CRM v1.

---

## 15. Change log

- 2026-11-06 — Spec created with the approved scope: salon/gym/retail/other first, Starter and above,
  contacts + custom fields + pipeline + notes/tasks + CSV, appointment booking excluded.
- 2026-11-06 — Phase 1 mock UI built: gate/presets/rules/store, list, detail, settings, CSV
  import/export, nav and dashboard/analytics cards, plan limits in `lib/mock/plans.ts` and the
  `schema.sql` seed, and `npm run crm-check`. No backend or migration yet.
- 2026-11-06 — CRM workspace reshaped around Zoho/Salesforce-style object views (contacts table,
  pipeline board, cross-client ledger) and a new manual work/payment ledger. Added billed, collected
  and outstanding summaries, paid/part-paid/unpaid status, service editor, edit/delete, seed data and
  `crm_service_entries` in the proposed schema. The ledger is bookkeeping only; no payment is
  processed.
- 2026-11-07 — Added visit before/after photos with explicit consent, a Photos tab and private
  side-by-side viewer; printable invoices/bills with line items, discount, tax, numbering, payment
  state and print/save-PDF; invoice settings (seller details, prefix, default tax/due terms); an
  Invoices view with search and overdue state; and photo/invoice validation, storage and schema —
  still the Stage 1 mock. Checks grew from 113 to 145.

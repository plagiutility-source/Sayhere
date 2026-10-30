# Tables & Rooms QR Ordering — Feature Spec

Status: Phase 0 (spec and freeze). Written 2026-10-30 from a full read of the concept demo
`_demo-rooms-feature/` (`index.html`, `app.js` ~5,600 lines, `styles.css` ~6,200 lines,
`assets/`) and of the `Review-SaaS-main` repo (Next.js 15, React 19, TypeScript, Tailwind 3).

**Source of truth:** the demo's behaviour. This spec describes it. Where this spec and the demo
differ, the demo wins, **except** for items listed in section 14 (intentional differences).
Function names in brackets, for example `[findOpenBill]`, point to the demo's `app.js`.

Companion files: `ROOMS_QR_PARITY_CHECKLIST.md` (every screen, action, rule, message and
screenshot to match) and `ROOMS_QR_PROGRESS.md` (phased task list for the AI agent).

---

## 1. Owner decisions (settled 2026-10-30)

| # | Question | Decision |
|---|---|---|
| 1 | Which plans include table/room ordering? | **Every plan** (free, starter, pro, enterprise). No plan gate. |
| 2 | Do table scans count toward `monthly_scans`? | **No.** Table/room QR scans never count toward the plan scan limit. |
| 3 | Which business types get it? | **cafe, restaurant, hotel.** Hidden for salon, gym, retail, other. |
| 4 | Table page editor fields | **Exactly as the demo** (the simpler flat form in section 9.6). Not the richer reception editor. |
| 5 | Payment | **Manual.** The owner types the amount received. No payment gateway for this feature. |

Consequences:
- No plan checks anywhere in this feature. Do not read `lib/mock/plans.ts` for it.
- Table scans are never written to `scans_used` or any plan counter. A per-table `scans` number
  exists for display only (see open item O4).
- Wi-Fi on the table page is allowed only for cafe, restaurant and hotel, which is the same set as
  the feature itself, so no extra check is needed beyond the feature gate `[supportsOrderWifi]`.

## 2. Scope

**In scope (build):** everything the demo does for owners and customers, listed in sections 9 and 10.

**Dev-only in the standalone project, removed at merge (section 13):** the demo bar (outlet
select, "Try join approval", "Reset demo"), "Simulate customer order", and the scan bar
(Back to demo, Copy link, Edit page, View other page). These exist in the standalone build so the
parity audit can be run, and are deleted in Phase 8.

**Out of scope for Stage 1:** real backend, database, real-time delivery to other phones, real
email sending, online payment, server-side join codes. See section 15.

**Demo placeholders that must NOT be ported as features:** muted sidebar items (Feedback, Loyalty,
Billing, Settings) — the SaaS already has these pages; the "New feature concept" marketing card
and the fake feedback list on the dashboard; the "See it on the owner dashboard (demo)" link on
the order-done screen; the fake `call` / `directions` / `custom` toasts (real tel:, maps and
https links must be used instead); the "review writer" toast (the SaaS already has a real flow).

## 3. Terminology

A **spot** is a table (cafe, restaurant) or a room (hotel). `spotWord(plural)` returns
Table/Tables or Room/Rooms from the business type. `displaySpotName(room)` rewrites a leading
"Table" to "Room" (hotel) or a leading "Room" to "Table" (otherwise) in the stored name.
Every label in the UI uses these, so switching the business type changes every screen.
A **bill** is one running tab at one spot; the code calls it an "order". Extra items on the same
bill are **rounds**. The **host** is the first phone on a bill. Other phones are **guests**.

## 4. Architecture for the standalone build

The standalone project is a clean Next.js project with the same stack and configuration as the
SaaS (copy `package.json` dependencies, `tsconfig.json`, `tailwind.config.ts`,
`postcss.config.mjs`, `next.config.ts`, `app/globals.css`, `lib/brand/*`). It contains **only new
code**, namespaced so the merge is a copy:

```
lib/rooms/        types.ts constants.ts format.ts rules.ts seed.ts store.ts qr.ts
                  report.ts bill-pdf.ts sound.ts vendor/qrcode.js
components/rooms/ owner/ (shell, pages, modals)   customer/ (screens)   shared/ (ui pieces)
app/(dashboard)/  dashboard, locations, rooms, orders, analytics, customer-page
app/r/[slug]/[code]/page.tsx     public table/room page
scripts/rooms-rules-check.ts
reference/_demo-rooms-feature/   the untouched demo, for side-by-side comparison. Never merged.
```

Rules:
- Route files are thin wrappers (about 3 lines). All page content lives in
  `components/rooms/owner/pages/*`, so at merge the same components mount inside the SaaS
  `(dashboard)` layout with no rewrite.
- No `dangerouslySetInnerHTML`. The demo builds HTML strings and escapes with `esc()`; React
  escapes by default.
- No new npm packages. The demo's `assets/qrcode.js` is vendored as
  `lib/rooms/vendor/qrcode.js` with its licence header intact. Note this in the session log.
- Use Tailwind utilities and the SaaS tokens (section 12). Do not copy `styles.css` wholesale.
- Colours come from `lib/brand/tokens.ts` / Tailwind classes. Never hardcode hex in components.
- Storage keys follow the SaaS naming, not the demo's: `syehere.mock.rooms.v1`,
  `syehere.mock.rooms.sound`, `syehere.mock.rooms.device`.
- State is parsed in try/catch and validated; invalid data falls back to seed (same approach as
  `lib/mock/store.ts`).

## 5. Data model (TypeScript, mirrors the demo exactly)

```ts
export type SpotBusinessType = "cafe" | "restaurant" | "hotel";
export type OrderStatus = "new" | "preparing" | "served" | "completed" | "cancelled";
export type OrderSource = "customer" | "punch" | "simulated" | "seed";
export type RoundVia = "customer" | "reorder" | "punch" | "simulated" | "seed";
export type PaymentMode = "Cash" | "UPI" | "Card";
export type ServiceKind = "waiter" | "bill";
export type JoinStatus = "pending" | "approved" | "joined" | "denied" | "cancelled" | "locked";
export type EffectiveJoinStatus = JoinStatus | "expired"; // derived, never stored

export type Room = { id: string; code: string; name: string; active: boolean; scans: number };
export type Waiter = { id: string; name: string; maxTables: number; active: boolean };
export type SpotLocation = {
  id: string; name: string; slug: string; scans: number; active: boolean;
  waiters: Waiter[]; rooms: Room[];
};
export type OrderItem = { id: string; name: string; price: number; qty: number };
export type Round = {
  id: string; at: string; items: OrderItem[]; total: number; via: RoundVia;
  by?: string | null; participantId?: string | null;
};
export type Participant = {
  id: string; name: string; deviceId: string; role: "host" | "guest";
  joinedAt: string; requestId?: string;
};
export type Payment = { amount: number; mode: PaymentMode; at: string };
export type Order = {
  id: string; number: number; locId: string; code: string | null; billId: string;
  customerName: string; phone: string; guests: number; waiterId: string | null;
  hostDeviceId?: string | null; participants: Participant[];
  items: OrderItem[]; total: number; status: OrderStatus;
  createdAt: string; updatedAt: string; acceptedAt?: string; paidAt?: string;
  payment?: Payment; billSentAt?: string; emailedTo?: string; emailedAt?: string;
  source: OrderSource; rounds: Round[];
};
export type JoinRequest = {
  id: string; orderId: string; locId: string; code: string; deviceId: string; name: string;
  status: JoinStatus; createdAt: string; expiresAt: string; attempts: number; maxAttempts: number;
  joinCode: string | null; codeExpiresAt: string | null;
  approvedAt?: string; deniedAt?: string; joinedAt?: string;
};
export type ServiceCall = {
  id: string; locId: string; code: string; kind: ServiceKind; status: "open" | "done";
  createdAt: string; resolvedAt?: string; orderId: string; customerName: string;
};
export type RoomsPageConfig = {
  announcement: { on: boolean; text: string };
  thankYou: string;
  wifi: { on: boolean; ssid: string; password: string };
  menu: { on: boolean; title: string };
  hours: { on: boolean; phone: string; address: string };
  call: { on: boolean; phone: string };
  directions: { on: boolean; value: string };
  custom: { on: boolean; label: string; url: string };
  socials: { instagram?: string; website?: string };
};
export type RoomsState = {
  locations: SpotLocation[];
  configs: Record<string, RoomsPageConfig>;   // key: `${locId}:reception` | `${locId}:rooms`
  orders: Order[]; joinRequests: JoinRequest[]; serviceCalls: ServiceCall[];
  businessType: SpotBusinessType; savedAt: number;
};
```

A `code` of `null` on an order means a **direct punch** (no table). Codes are permanent
(`qr1`, `qr2`, ...). `[nextRoomCode]` starts at `rooms.length + 1` and skips existing codes.

## 6. Constants (exact values from the demo)

| Constant | Value |
|---|---|
| Paid-bill window `PAID_BILL_WINDOW_MS` | 5 minutes |
| Join request expiry | 2 minutes |
| Join code | 6 digits, `100000–999999`, valid 5 minutes |
| Join `maxAttempts` | 5 (then status `locked`) |
| Max rooms per location | 12 (open item O8) |
| Waiter `maxTables` | clamp 1–8; add dialog offers 2–6, default 3; row dropdown offers 1–8 |
| Guests | clamped 1–12 on save; dropdowns offer 1–8; default 2 |
| Cart quantity per item | 0–20 (punch also max 20) |
| Name / phone / waiter name / room name / email | slice 40 / 20 / 30 / 40 / 120 |
| Announcement / thank-you | max 160 each |
| Feedback message | max 1000 |
| Order number | `max(existing numbers, 1040) + 1` |
| Poll interval | 2500 ms; countdown tick 1000 ms |
| Alert ring | rings at 0, 2, 4, 6, 8 s then stops (10 s window); only if sound on |
| Bell sound | WebAudio: 880 Hz triangle, then 1174.66 Hz and 1567.98 Hz sine; step 0.16 s; gain 0.22 / 0.12 / 0.12; decay 0.65 s |
| Periods | today (1 day), week (7), fortnight "15 days" (15), month "30 days" (30) |
| Trend label step | 1 day if ≤7 days, 2 if ≤15, else 5 |
| Currency | `₹` + `toLocaleString("en-IN")` |

## 7. Rules (pure functions in `lib/rooms/rules.ts`)

All take `state` (and `now` where time matters, to make them testable) and never touch the DOM.

- **R1 `activeStatus(s)`** — true for `new`, `preparing`, `served`.
- **R2 `findOpenBill(locId, code)`** — null if no code. Otherwise the order at that location and
  code with an active status, newest by `updatedAt || createdAt`.
- **R3 `waiterLoad(locId, waiterId)`** — number of **distinct codes** among orders with that
  location and waiter, a code, an active status, and `createdAt` today.
- **R4 `availableWaiters(locId)`** — waiters that are `active` and have `waiterLoad < maxTables`.
- **R5 `placeOrder` (customer)** — re-read latest state first (newer `savedAt` wins). Validate in
  this order: cart not empty; location and room exist; if an open bill exists, the device must be
  a participant (or become host when the bill has no host, see R7), else error; if there is no
  open bill the name is required and the chosen waiter must still be available. With an open bill:
  merge item lines, recompute total, set status back to `new`, append a round with
  `via: "reorder"`, `by: participant.name`. Without: create a bill (number via R-numbering,
  host participant with `deviceId`, `hostDeviceId`, first round `via: "customer"`, `source:
  "customer"`, waiter = chosen or first available or null). Reset cart and checkout draft.
- **R6 `mergeItemLines`** — add qty to an existing line with the same item id, else push a copy.
- **R7 `resolveScanParticipation(order)`** — returns the existing participant for this device; if
  the bill has participants, only the host's device resolves; if it has none (staff-punched) and
  no host, **the first device that resolves becomes host** (see 16, risk E1).
- **R8 Join lifecycle** — `requestJoin`, `approveJoinRequest`, `denyJoinRequest`,
  `cancelJoinRequest`, `regenerateJoinCode`, `verifyJoinCode`, `effectiveJoinStatus` (pending past
  `expiresAt` → `expired`; approved past `codeExpiresAt` → `expired`). State machine in 8.2.
- **R9 `requestService(kind)`** — needs an open bill, else toast. Returns the existing open call
  of the same kind for that spot. Otherwise **replaces** all open calls for that spot with one
  new call (so "bill" replaces "waiter" and vice versa).
- **R10 `resolveServiceCall`**, **`sendBillToPhone`** (sets `billSentAt`, marks that spot's open
  `bill` calls `done`; refused if no code or bill closed), **`verifyPayment`** (see 8.1),
  **`setOrderStatus`** (accepts only preparing, served, completed, cancelled; sets `acceptedAt`
  the first time it becomes preparing; completed sets `paidAt` if missing).
- **R11 Wi-Fi** — `wifiUnlockedForOrder(order, config)`: config wifi on, feature gate passes,
  order has a code, status is active **and** accepted (`acceptedAt` set or status preparing or
  served).
- **R12 Paid-bill visibility** — `recentPaidBill(locId, code, deviceId)`: completed, `paidAt`
  within 5 minutes, and the device is host or participant. `canSeeBill` = host device or
  participant.
- **R13 Analytics** — `periodWindow` (start of day minus `days-1`, to now), `previousPeriodWindow`
  (same length ending the millisecond before), `statsForRange` (cancelled excluded; `earnings` =
  sum of totals; `collected` = completed only; `average` = round(earnings/orders); `averageGuests`
  to 1 decimal; `open` = active count), `dailySeries`, `deltaLabel`.
- **R14 Punch** — table punch joins an open bill (round `via: "punch"`, status back to `new`);
  otherwise new bill with `source: "punch"`, no host, waiter only if active and (direct or
  under capacity). Direct punch has `code: null`.
- **R15 Rooms** — add (cap 12, permanent code), rename (name only), toggle active (paused QR keeps
  its code and shows "not available" to customers).
- **R16 Waiters** — add (name required, unique case-insensitive per location, clamp 1–8), toggle,
  change max, remove (blocked while `waiterLoad > 0`, confirm first).

## 8. State machines

### 8.1 Bill (order) status
```
new ──Accept order──▶ preparing ──Mark served──▶ served ──Bill & payment──▶ (verify exact amount)──▶ completed
 │                                                                                    paidAt, payment{amount,mode}
 └──Cancel (only from new)──▶ cancelled (no charge)
reorder / punch on an open bill sets status back to `new` (even from preparing or served).
```
The owner UI offers exactly these buttons: `new` → Accept order, Cancel (+ Bill); `preparing` →
Mark served (+ Bill); `served` → Bill & payment; `completed` → View bill; `cancelled` → "No
charge". Completion happens **only** through payment verification, which requires the entered
amount to equal `order.total` to the paisa.

### 8.2 Join request
```
pending ──host Approve──▶ approved(code, 5 min, attempts 0) ──correct code──▶ joined (guest added)
pending ──2 min──▶ expired            approved ──code 5 min──▶ expired
pending/approved ──host Deny──▶ denied    guest Cancel ──▶ cancelled
approved ──5 wrong codes──▶ locked ──host "New code"──▶ approved
```
One request per device per bill is reused while `pending` or `approved`.

### 8.3 Service call
`open` → `done` (owner "Mark handled" / "Done", or sending the bill resolves a `bill` call).

### 8.4 Customer screen (`publicScreen`)
`home` | `menu` | `cart` | `checkout` | `order-done` | `service` | `service-sent` | `bill` | `wifi` |
`hours` | `chooser` | `google` | `feedback` | `thanks`. A device that is not on an open bill
sees the **join gate** instead, with sub-states form / pending / approved / locked / expired /
denied / cancelled. Resets to `home` on navigation.

## 9. Owner screens

Shared: every owner page except the editor has the **period bar** (Today / Week / 15 days / Month,
showing the range label). Location is carried as `?loc=<id>` (default first location).

1. **Dashboard** — page head (title, sub, Full analytics, Download report), period bar, live
   request banner, new-orders banner, 4 stat cards (Earnings, Bills, Guests, Collected, each with
   delta vs previous period), trend card (daily earnings bars, best day, daily average),
   spot-wise earnings snapshot (incl. "Direct punch" row when present), recent bills (4 newest).
2. **Locations** — location cards (name, `syehere.co/<slug>`, scans, QR counts, Reception QR and
   Tables/Rooms QR buttons) and the QR panel with Reception / Spots tabs. Reception tab: QR card
   labelled "Existing page" pointing at the existing page. Spots tab: QR cards with active
   toggle, QR / Copy / Preview, "N new" badge, and an Add QR tile.
3. **Tables/Rooms page** — location switcher, counts, shared-page strip, room rows (QR thumb,
   code pill, scans, call chips, open count, waiter names, status, Send bill, Mark handled, toggle,
   Orders, Rename, QR, Preview). Add / rename modals.
4. **Orders** — period bar, banners, stat cards (Earnings, Bills, Guests, Open now), filter
   (All, New, Preparing, Served, Done) with counts, groups per spot (and a "Direct punch" group),
   each collapsible (collapsed by default; state kept in memory), rows with status actions, tags
   (N rounds, "X's round", Direct punch, Punched, Paid, Bill sent), and the **Waiters card**
   (load bar, Available / At capacity / Paused, Max dropdown, toggle, remove, add).
5. **Analytics** — spot filter (all / each spot / direct), 4 stat cards, trend, spot-wise table
   (click to filter), day-wise table, bill details list, CSV download.
6. **Customer page editor** — two tabs (Reception page / Spots page). Field list (exact):
   Announcement (on, text ≤160); Thank-you (textarea ≤160, counter); Buttons: Menu (on, title),
   Wi-Fi (on, ssid, password), Hours and contact (on, phone, address), Call (on, phone),
   Directions (on, value), Custom link (on, label, url "Must start with https://"); locked row
   "Review buttons — Always shown". Dirty tracking, Save, Discard, Reset to default (confirm),
   "View live page" (auto-saves if dirty), unsaved-changes confirm on leaving, live phone
   preview with a spot selector. All spots at a location share one Spots page.
7. **Chrome** — sidebar (Dashboard, Feedback, Analytics, Locations, Orders with new-count badge,
   Tables/Rooms with "New" badge, Customer page, Loyalty, Billing, Settings in the SaaS), topbar
   (search box, notifications bell with live requests panel, sound toggle, business chip), document
   title `(N) Live table request · Syehere`.
8. **Modals** — Add spot, Rename, QR (SVG download, copy link), Bill/Invoice (print, send to
   phone, email [simulated], payment verify), Punch order, Add waiter.
9. **Live alert** — floating card for a new order or new round with Dismiss and View; rings per
   section 6; suppressed on the customer page.

Business-type-specific rules: Wi-Fi unlock text and Wi-Fi availability follow section 1.

## 10. Customer screens

See the checklist for every element. Summary of behaviour:

- **Home**: announcement, logo initials, business name, tagline, "Ordering for <spot>" chip,
  open-bill card, joined chip (guests), paid-bill card, service panel (host/guest on an open
  bill), review question (thumb up / down → chooser), button grid (Menu, Bill, Paid bill,
  Wi-Fi when unlocked, Hours, Call, Directions, Custom), socials, cart pill, footer.
- **Menu**: categories, items with tag, details, price, Add / quantity stepper (only on a spot
  page), service strip when on an open bill, cart bar, order note.
- **Cart → Checkout**: new bill asks name (required), phone (optional), guests, waiter (Any
  available or a specific available waiter; busy/paused ones disabled with badges); continuing
  bill hides those and shows "Add to bill".
- **Order done**: summary card with this round, status "With the kitchen", Call waiter, Back,
  Wi-Fi (if unlocked), View bill (if sent), Order something else.
- **Service**: Waiter or Bill buttons, "Already asked at HH:MM" hints; **service-sent** confirmation.
- **Bill**: unpaid banner (download locked) or paid banner with a 5-minute countdown and PDF
  download; after the window closes the page returns to the chooser.
- **Join gate and host panel**: full flow in 8.2, with countdown timers refreshed every second.
- **Unavailable**: unknown code, or a paused QR.

## 11. Exports

- **CSV report** (`downloadReport`): BOM + CRLF; columns Bill, Placed at, Type, Table / room, QR
  code, Customer, Phone, Guests, Waiter, Rounds, Items (`"2 x Name | ..."`), Total, Status,
  Payment. Excludes cancelled. File name `syehere-<slug>-<direct|code|all>-<period>-<date>.csv`.
- **Bill PDF** (`billPdfBlob`): hand-written single-page A4 PDF, Helvetica, with business name,
  address, bill number and time, spot, customer, waiter and guests, rounds with items, total,
  and a green "PAID <amount> via <mode>" bar. Keep this generator as-is (no PDF package).
- **QR SVG**: `qrcode(0, "M")`, modules as one `<path>`, white background, quiet zone of 2,
  file name `syehere-<slug>-<code>.svg`.
- **Print invoice**: `window.print()` with the `@media print` rules.

## 12. Styling

The demo's CSS variables are identical to the SaaS brand tokens: blue `#1D4ED8`, navy `#12307A`,
green `#0E9F6E`, green-deep `#0B7A55`, yellow `#FFC61A`, ink `#1F2937`, muted `#6B7280`, bg
`#F7F8FA`, surface `#FFFFFF`. The cafe business preset (`#213D36`, `#C5DBC8`, `#EDF4EE`) is the
demo's customer-page theme. Use the existing Tailwind colours (`brand.*`, `ink.*`, `surface.*`,
`preset.*`).

- Radius 12px (cards), 8px (controls). Shadows: `0 1px 2px rgba(15,23,42,.06), 0 1px 3px
  rgba(15,23,42,.08)` and `0 18px 45px rgba(15,23,42,.18)` (modals). Line colours
  `rgba(15,23,42,.10)` and `.06`.
- Breakpoints used by the demo (min/max widths to reproduce): 1399, 1279, 1100, 1023, 900, 720,
  640, 420. Print rules exist for invoice and report.
- Animations: `live-pulse`, `call-pulse`, `live-alert-in`.
- Fonts: Inter plus system stack. The demo also imports Poppins (500, 600); see open item O2.
- Theme for customer pages comes from three CSS variables `--cp-primary`, `--cp-secondary`,
  `--cp-bg` set from the business colours.

## 13. Merge map (Phase 8)

| Change | Where |
|---|---|
| New files | copy `lib/rooms/`, `components/rooms/`, `scripts/rooms-rules-check.ts`; **not** `reference/` |
| Public page | add `app/r/[slug]/[code]/page.tsx`; **do not edit** `app/r/[slug]/page.tsx` |
| Sidebar | `components/dashboard/nav.ts`: add Orders and Tables/Rooms, visible only for cafe, restaurant, hotel |
| Feature gate | add a `tableOrdering` entry in `lib/category/features.ts` for cafe, restaurant, hotel |
| Customer page | add a "Tables/Rooms page" tab to the existing editor using the demo's flat form; the Reception tab stays the existing editor untouched |
| Locations | add the Reception/Spots QR panel to the existing locations page |
| Dashboard / Analytics | add the ordering cards as a new section; existing content untouched (open item O3) |
| Menu and hours | the table page must read the **real** menu and weekly hours from the existing page config instead of the demo's hardcoded menu and hours (open item O1) |
| Business data | name, logo initials, tagline, colours, address and Google review URL from the business profile (`useBusiness()`), not the demo's constants |
| Locations data | location id, slug and name come from `lib/mock/locations.ts`; rooms and waiters are new data keyed by location |
| Remove | all dev-only items listed in section 2 |
| Docs | update `PRD.md`, `business-rules.md`, `security-and-reliability.md`, `schema.sql`, `PROGRESS.md` |
| Git | branch `feat/rooms-qr-stage1`, one commit per task, CI green before merge |

## 14. Intentional differences from the demo (Stage 1)

1. Next.js routes with `?loc=` instead of hash routes; customer URL `/r/<slug>/<code>`.
2. The QR encodes `${origin}/r/<slug>/<code>`; the demo encoded `origin + #/scan/...`.
3. Storage keys renamed (section 4).
4. The customer-page "Powered by" footer, business name, address, colours and menu come from data
   props, not constants.
5. Time uses the browser's local time in standalone; at merge use the business `time_zone`.
6. "Demo limit: 12 room QRs per location." wording changes to "Limit: ..." (open item O8).
7. Real `tel:`, maps and https links replace the demo's placeholder toasts.

Everything else must match the demo, including wording.

## 15. Stage 2 hardening (not built in Stage 1)

Server-side bills, rounds and join codes (hashed, rate-limited, single use); per-record writes
with transactions (two phones ordering at once, one waiter slot taken twice); persistent device
cookie instead of `sessionStorage`; real-time delivery (polling or server-sent events) from
customer to owner; owner authentication on all owner pages; per-business rate limits and abuse
protection on public endpoints; real email provider for "email the bill"; staff-punched bills
must not hand the host role to the first scanner; timezone handling; retention of orders and
join data; audit entries for payment verification. Proposed tables: `spots`, `waiters`,
`bills`, `bill_rounds`, `bill_items`, `join_requests`, `service_calls`, `rooms_page_configs`.

## 16. Known demo behaviours (replicate in Stage 1, flag for Stage 2)

- **E1** A staff-punched bill has no host; the first device that scans becomes host.
- **E2** Join codes are generated and checked in the browser.
- **E3** Device id is per browser tab (`sessionStorage`), which is how two tabs simulate two phones.
- **E4** `waiterLoad` only counts today's bills, while `findOpenBill` has no date limit, so an
  open bill from yesterday does not count against a waiter.
- **E5** A reorder or punch resets an already served bill to `new`.
- **E6** The whole state is saved as one blob; the newest `savedAt` wins.
- **E7** Per-table `scans` is never incremented in the demo (seed values only).

## 17. Open items (defaults apply until you answer)

| # | Item | Default |
|---|---|---|
| O1 | Menu price in the SaaS `MenuItem` looks like text; the cart needs a number. Verify in Phase 1 and add `parseMenuPrice()`. | Items whose price cannot be parsed cannot be ordered and show "Ask staff". |
| O2 | Poppins (500, 600) is imported by the demo; confirm whether the SaaS already uses it. | Use whatever the SaaS already loads; do not add a new font. |
| O3 | How the demo dashboard merges with the existing dashboard. | Add as a new section below existing content. |
| O4 | When a table scan is counted for the display-only per-table `scans`. | +1 when an active spot page opens, once per device per 30 minutes; never counted against the plan limit. |
| O5 | Reception page ordering. | Reception has no ordering, as in the demo. |
| O6 | Time zone at merge. | Business `time_zone`. |
| O7 | Currency. | INR, `en-IN` formatting. |
| O8 | Is 12 spots per location the real cap? | Keep 12. |

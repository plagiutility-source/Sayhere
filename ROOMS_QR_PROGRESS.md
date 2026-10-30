# Tables & Rooms QR Ordering — Build Progress Tracker

Last updated: 2026-10-30 (Phase 6 task 3 done; screenshots blocked)
Project: `syehere-rooms-standalone` (standalone build, then merged into `Review-SaaS-main`)
Build environment: Freebuff. Builder: DeepSeek V4.1 Flash. Reviewer: GLM 5.3 Flash.

## Rules for the AI coding agent
- Read this file, `ROOMS_QR_SPEC.md` and `ROOMS_QR_PARITY_CHECKLIST.md` fully before any work,
  every session. Then read the last Session Log entry and continue from the first unchecked task.
- The demo (`reference/_demo-rooms-feature/`) is the source of truth for behaviour and wording.
  Do not invent behaviour. Do not "improve" the demo. If the spec and the demo disagree, the demo
  wins unless the difference is listed in spec section 14.
- Work on ONE task at a time, in order. After each task: tick `[x]`, add a one-line note of what
  was built (and any deviation), update "Last updated".
- Never tick a task until it runs. Every task must leave `npm run typecheck` and `npm run build`
  passing. Phase 1 onward must also keep `npx tsx scripts/rooms-rules-check.ts` passing.
- If blocked, mark `[BLOCKED: reason]` and move to the next unblocked task. Do not skip silently.
- Do not start a new phase until the current phase is all `[x]` or `[BLOCKED]` and its "Done when"
  line is true.
- Port functions one by one from the demo: open the demo function, port it to TypeScript, keep the
  same names where possible, and write the matching check in the rules script.
- No new npm packages. Vendored `qrcode.js` is allowed (log it). No `dangerouslySetInnerHTML`.
  No hardcoded hex colours; use Tailwind tokens. No `localStorage` keys except the three in spec
  section 4.
- Never ask the owner to paste real secrets into this chat. This feature needs none.
- New code lives only in the namespaced folders in spec section 4. Route files stay thin.
- Context is limited: when a file in the demo is large, read it in ranges, not all at once.
- **Resume protocol:** work may span many days because of daily usage limits. Each phase is
  self-contained. Stop cleanly at any task boundary and log where you stopped.
- **Review step (end of every phase):** run the phase through the reviewer model with this
  prompt: "Compare the built files against ROOMS_QR_PARITY_CHECKLIST.md section(s) <X>. List only
  mismatches, with file and line. Do not suggest improvements." Fix every mismatch, then tick.

## Phase 0 — Spec and freeze
- [x] `ROOMS_QR_SPEC.md` written.
- [x] `ROOMS_QR_PARITY_CHECKLIST.md` written.
- [x] `ROOMS_QR_PROGRESS.md` written.
- [x] Demo copied untouched to `reference/_demo-rooms-feature/` — verified 2026-10-30:
  `index.html` (6 lines of markup), `app.js` 5,576 lines, `styles.css` 6,188 lines, `assets/` =
  `qrcode.js`, `logo-horizontal.svg`, `logo-icon.svg`. Repo clean, files unmodified.
- [BLOCKED: owner must capture] Golden screenshots (checklist section G) from the running demo,
  saved as `reference/screens/<id>-<width>.png` at widths 390 / 768 / 1280.
- [x] Open items O1–O8: defaults applied (below). O1 answered by owner.

**Phase 0 verification.** Every bracketed function reference in the spec was checked against
`reference/_demo-rooms-feature/app.js`: `[findOpenBill]` (line 830), `[nextRoomCode]` (634) and
`[supportsOrderWifi]` all exist — **no mismatch**. The 63 other named functions from the spec
(rules, seed, format, QR, live detectors, CSV/PDF exports) also exist. Two expected absences, not
mismatches: `qrcode` is the global exported by `assets/qrcode.js` (called at `app.js:2009`), and
`parseMenuPrice` is new in the port (O1).

**Open items — defaults in force for the whole build:**
- **O1 answered** (2026-10-30): `MenuItem.price` is a `string` such as `"Rs 180"` (also free text
  like `"from Rs 1500"` in `lib/mock/customer-page.ts`). `parseMenuPrice()` reads the number out of
  the string; unparseable prices show "Ask staff" and cannot be ordered.
- **O2**: no new font. Use the SaaS `Inter` UI stack and the existing `Poppins` display stack from
  `tailwind.config.ts`; add no font import.
- **O3**: ordering cards go in a new section below the existing Dashboard / Analytics content.
- **O4**: the display-only per-spot `scans` increments +1 when an active spot page opens, once per
  device per 30 minutes; never counted against the plan limit.
- **O5**: the reception page has no ordering.
- **O6**: at merge, times use the business `time_zone`; standalone uses browser local time.
- **O7**: INR, `₹` + `toLocaleString("en-IN")`.
- **O8**: cap stays 12 spots per location; wording is "Limit: ..." not "Demo limit: ...".

Done when: the three files exist, the demo is copied unchanged, screenshots are saved.
Status: three files ✅, demo ✅, screenshots **[BLOCKED: owner must capture]** — does not block
Phase 1.

## Phase 1 — Foundation (types, rules, store, seed, QR, tests)
- [x] Scaffold — SaaS `package.json` deps, `tsconfig.json` (adds `reference/` to `exclude`),
  `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `app/globals.css`, `lib/brand/*`;
  scripts `dev`, `build`, `start`, `typecheck` identical to the SaaS. `npm install` created
  `package-lock.json` (the SaaS copy shipped none); no versions changed.
- [x] O1 verified — `MenuItem.price` is `string` (`"Rs 180"`, and `"from Rs 1500"` free text).
  `parseMenuPrice()` added to `lib/rooms/format.ts`: first number in the string, `null` when there
  is none (those items show "Ask staff" and cannot be ordered).
- [x] `lib/rooms/types.ts` — spec section 5, exactly.
- [x] `lib/rooms/constants.ts` — spec section 6, exactly (+ `PERIODS`, input limits, `STORAGE_KEYS`).
- [x] `lib/rooms/format.ts` — `money`, `formatTime`, `formatWhen`, `formatDay`, `deltaLabel`,
  `spotWord`, `displaySpotName`, `statusLabel`, `serviceKindLabel/Title`, `orderSpotName`, plus
  `periodRangeLabel`, `joinCountdownText`, `billWindowText`, `orderItemsTotal`, `dateKey`.
- [x] `lib/rooms/seed.ts` — `configTemplate`, `seedWaiters`, `seedOrders`, `seedHistoryOrders`,
  `seedState`, `ensureShape` (bill id, billId, first round, participants, host); demo
  BUSINESS/MENU/WEEK fixtures live here for the later phases.
- [x] `lib/rooms/rules.ts` — R1–R16 as pure functions taking `state` + `now`; every mutating rule
  clones and returns the next state instead of touching globals.
- [x] `lib/rooms/store.ts` — load/validate/persist/subscribe, `storage` event + 2500 ms poll,
  newest `savedAt` wins, device id in `sessionStorage`, sound preference, `useRoomsState()`.
- [x] `lib/rooms/qr.ts` + `lib/rooms/vendor/qrcode.js` — demo SVG output; vendored with its licence
  header plus one added `export default qrcode` line and `qrcode.d.ts` types.
- [x] `lib/rooms/sound.ts` — bell (880/1174.66/1567.98 Hz, 0.16 s step, 0.65 s decay) and the
  10 s ring (0, 2, 4, 6, 8 s).
- [x] `scripts/rooms-rules-check.ts` — all 28 groups from checklist section F, plus O1 price
  parsing: **124 checks passed**.

Deviations from the demo (all deliberate, for the reviewer):
- Pure rules take `businessType` explicitly (`spotWord`, `displaySpotName`,
  `wifiUnlockedForOrder`) instead of reading a module-level global.
- `deltaLabel` returns `{ tone, text, percent }` instead of an HTML string (no
  `dangerouslySetInnerHTML`); the rendered wording is identical.
- Demo-only `ensureShape` migrations (adding `qr4`, `historySeed`) are skipped: this project starts
  from the seed. Only the spec's migrations are implemented.
- Add-room cap message uses "Limit: 12 room QRs per location." (spec section 14 item 6).
- QR module colours stay `#111827` on `#ffffff` for scannability (documented in `qr.ts`), not brand
  tokens: brand colours can break scanning.
- `setOrderStatus` returns `order: null` for a status outside preparing/served/completed/cancelled
  instead of silently re-rendering.

Done when: the rules check prints `N checks passed` with every group covered, typecheck and build
pass, and no component code exists yet. **True — 124 checks passed, typecheck ✅, build ✅, no
components yet.**

## Phase 2 — Owner shell, Locations, Spots page and dialogs
- [x] Dev shell — sidebar (groups, `New` badge, active yellow bar, 72 px rail below 1280, drawer
  below 1024), topbar (search, live-requests bell with badge and panel, sound toggle, business
  chip), page frame, mobile drawer with backdrop. Dev-only parts marked `// DEV-ONLY`.
- [x] Dev bar — outlet select (café/restaurant ⇄ hotel), Try join approval, Reset demo.
- [x] Route wrappers — `app/(dashboard)/layout.tsx` plus 3-line `/locations` and `/rooms` pages;
  `lib/rooms/links.ts` builds the spec section 14 QR URLs.
- [x] Locations — location cards, QR panel with Reception / Tables tabs, QR card, reception card.
- [x] Tables/Rooms page — toolbar (location switcher + counts), shared strip, rows with QR thumb,
  code pill, scans, call/open chips, waiter names, status, toggle, Orders, Rename, QR, Preview.
- [x] Dialogs — Add, Rename, QR (copy link, SVG download); shared `Modal` closes on Escape and
  overlay click and focuses the first input.
- [x] Toasts and clipboard helper — 3 s toast; clipboard API with textarea fallback.
- [x] Room active toggle, rename, add (cap 12, permanent code).

Deviations / notes for the reviewer:
- `lib/rooms/links.ts` is new but lives in `lib/rooms/`; it is the demo's `pageUrl` (spec 14).
- Vendored `qrcode.js`: the UMD wrapper was removed as well as adding the ESM export. Next treats
  the file as ESM, and the `module.exports` branch threw during prerender.
- Dashboard, Feedback, Analytics, Orders and Customer page are later phases, so their sidebar
  items show the demo's `not-in-demo` toast for now; at merge they become the real SaaS links
  (checklist A.40).
- The notifications panel shipped read-only (lists calls and new orders, links to the Tables page);
  Phase 4 adds Done, Send bill and the Orders links.
- Row “Send bill” / “Mark handled” buttons arrive with Phases 4–5; the seed has no service calls,
  so S03–S05, S14–S16 and S23 are unaffected.
- The demo logos were copied to `public/rooms/` unchanged.
- The dashboard routes are `force-dynamic` so `?loc=` / `?kind=` render on the server.

Done when: checklist A rows 1–9 and 38–41 pass; screenshots S03–S05, S14–S16 and S23 (Rooms) match
at 390, 768 and 1280; reviewer pass done. **Code paths and wording verified; screenshot parity
[BLOCKED: owner must capture].**

## Phase 3 — Customer ordering (scan page core)
- [x] `app/r/[slug]/[code]/page.tsx` and a placeholder `app/r/[slug]/page.tsx` for the reception
  preview (placeholder is deleted at merge). Both are thin async wrappers over `ScanPage`.
- [x] Scan page frame, themed with `--cp-primary`, `--cp-secondary`, `--cp-bg`; unavailable states
  (unknown code and paused QR), scan bar with Copy link and the other-page link.

Phase 3 notes so far:
- Customer pages use `useRoomsState()` directly, so Copy link has a small local toast instead of
  the owner `OwnerProvider` host.
- Unknown location slugs get the same “isn't linked to a table” card, with Back to Tables pointing
  at `/rooms` (the demo cannot route an unknown location; this is defensive only).
- `ScanPage.tsx` holds the frame plus every customer screen; the cart is local state and resets
  when the QR changes (the demo's `ensureCart`).
- E1 is implemented as an effect: the first phone to open a staff-created bill becomes its host
  and the updated order is persisted before other screens read it.
- The Wi-Fi screen is implemented now because the seed's accepted bill on QR1 unlocks it; the
  Bill screen and the join gate stay in Phase 5, so their tiles/buttons are not rendered yet.
- Google's “Write it for me” has no standalone writer flow; it shows the same concept-demo toast
  used elsewhere. Phase 8 replaces it with the SaaS review writer (checklist C).
- [x] Home, menu (with service strip), cart bar and cart pill, cart, checkout (new and
  continuing), order done.
- [x] Waiter picker with Available, At capacity and Paused states.
- [x] `placeOrder` wired to the rules; new bill and reorder both work (continuing only when this
  device is a participant; the join gate is Phase 5).
- [x] Service screens: panel, chooser, sent; `requestService` wired.
- [x] Chooser, Google, Feedback, Thanks, Hours screens. Reuse the SaaS components at merge; in
  standalone build them to match the demo.
- [x] Per-spot scan counter (open item O4), display only — increments once per device per 30
  minutes via a sessionStorage throttle; the location total and plan limits are untouched.

**Phase 3 complete** — every task above is ticked. `npm run typecheck` ✅, `npm run build` ✅,
rules check 124 ✅. Reviewer pass on the Phase 3 checklist-B subset found no code mismatches;
the Google writer placeholder and the Phase 5 bill/join rows are logged above. Screenshot parity
remains [BLOCKED: owner must capture].

Done when: checklist B rows for add/dec item, cart, checkout, pick waiter, place order, menu,
home, service, hours, thumb, google, contact, feedback and chooser pass; screenshots S30, S33–S41,
S54–S60 match; reviewer pass done.

## Phase 4 — Owner Orders and live alerts
- [x] Orders page: banners, stat cards, filters with counts, spot groups (collapsible), order
  rows with tags and status buttons, Direct punch group. Built 2026-10-30: `/orders` route +
  `components/rooms/owner/pages/OrdersPage.tsx`, shared `owner/PeriodBar.tsx`, `Delta` in
  `shared/ui.tsx`; status toasts copied from the demo's `setOrderStatus`. Invoice and Punch
  buttons land with tasks 3 and 4.
- [x] Waiters card and the Add waiter dialog; max, toggle and remove. Built 2026-10-30:
  `components/rooms/owner/WaitersCard.tsx` + `modals/AddWaiterDialog.tsx`, wired into the Orders
  aside; load bar, status badge, max 1–8, pause switch, remove confirm and every toast come from
  `rules.ts`.
- [x] Invoice dialog: items, rounds, print, send to phone, email (SIM), payment verify.
  Built 2026-10-30: `modals/InvoiceDialog.tsx` (invoice paper, rounds, print, send to phone,
  email SIM, Cash/UPI/Card exact-amount verify), `markBillEmailed()` rule (+2 checks, 126 now),
  the demo's `@media print` behaviour in `globals.css`, and the row / group bill buttons wired.
- [x] Punch dialog (table and direct). Built 2026-10-30: `modals/PunchDialog.tsx`, the page-head
  "Punch order" button and a "Punch" button on every spot group (direct groups open without a
  table); table punches join the open bill through `createPunchOrder`, direct punches start a new
  one, the customer fields hide when a bill is joined, and the demo's `punch-add`/`punch-dec`
  handlers are the 20-max quantity controls.
- [x] Notifications panel, topbar badge, sidebar Orders badge, document title. Built 2026-10-30:
  the bell panel lists live calls (Send bill / Done, demo toasts), new orders link to `/orders`
  with the red unread dot, the sidebar Orders item links to `/orders` and shows the waiting badge
  (white on red while orders wait), and `AppShell` sets the demo's `updateDocumentTitle` text.
- [x] Live alert card, ring timing, bell, sound toggle, `handleExternalState` rules (checklist D).
  Built 2026-10-30: `owner/LiveAlert.tsx` (unseen rounds and calls only, New order vs New round,
  ring start/stop, dismiss, View table/room opening that group), `lib/rooms/detect.ts` with 6 new
  checks (132 now), the group call chip and "Mark handled" button, and a `hydrated` flag so stored
  state never rings on load. The editor-dirty and scan-page guards wait for Phases 5–6, where
  those screens exist.
- [x] `simulate-order` (DEV-ONLY). Built 2026-10-30: `lib/rooms/simulate.ts` (prefers quiet spots,
  random name / 1–2 items / free waiter, injectable random for the checks), the page-head and
  empty-state buttons, and a local `LIVE_ALERT_EVENT` so the simulated order rings without waiting
  for the poll. Marked `// DEV-ONLY` for deletion at merge.

Done when: checklist A rows 10–37 relevant to Orders pass; section D passes for incoming orders and
service calls; screenshots S06–S08, S17–S22 match; reviewer pass done.

## Phase 5 — Joining, bill and Wi-Fi (customer and host)
- [x] Join gate: form, pending, approved, locked, expired, denied, cancelled. Built 2026-10-30:
  `components/rooms/customer/JoinGate.tsx` + `ScanPage` wiring above every customer screen when a
  bill is open and this device isn't on it; name form, 2-minute pending, 6-digit approved with
  attempts left, locked, expired (request vs code), denied and cancelled copy from the demo, with
  `data-join-expires` hooks for task 3's ticker.
- [x] Host panel: roster, pending request, code card, New code, Cancel; "Open guest view".
  Built 2026-10-30: `components/rooms/customer/HostPanel.tsx`, shown only when the participant is
  the host, above every customer screen; roster chips, Approve/Deny with the demo toasts, the
  6-digit code card with attempts and expired/locked states, New code, Cancel, the empty hint and
  the demo-only note.
- [x] Countdown timers (1 s tick). Built 2026-10-30: a 1 s interval in `ScanPage` re-renders the
  join gate and host timers and re-evaluates `effectiveJoinStatus`, so pending/approved requests
  expire on screen; the bill window reuses the same tick when the bill screen lands in task 4.
- [x] Bill screen (unpaid and paid), paid-bill card, download PDF (`bill-pdf.ts`), 5-minute window.
  Built 2026-10-30: the `bill` screen in `ScanPage` (paid/unpaid banner, bill paper with rounds,
  total and paid line), the 5-minute window on the tick, Download bill through the new
  `lib/rooms/bill-pdf.ts` (the demo's hand-built PDF port), the home paid-bill card and the Bill /
  Paid bill tiles, and the demo's 1.2 s move to the review after download.
- [x] Wi-Fi screen and the unlock rule; Wi-Fi tile on home and on order-done. Built in Phase 3
  and verified 2026-10-30 against the demo's `screen === "wifi"`: same title, subtitle, SSID,
  password, Copy password and lock note; the tile only shows when `wifiUnlockedForOrder` and the
  order-done button uses the live bill. Added the demo's guard so a locked screen falls back home.
- [x] `detectJoinEvents`, `detectBillSent`, `detectPaidBill` and the scan-signature re-render.
  Built 2026-10-30: a ref-backed detector effect in `ScanPage` seeds the current state, then bells
  and toasts host join requests, guest approved/denied/expired/locked, bill sent (moving home /
  service-sent / order-done to the bill) and payment (moving to the bill); the customer title is
  `${business} · ${spot}`. React re-renders on every newer saved state, so the demo's separate
  scan-signature guard is unnecessary and has no visible difference.

Done when: checklist B rows for join, bill, wifi pass; section D passes for join, bill and paid;
screenshots S42–S53 and S61 match; reviewer pass done.

## Phase 6 — Editor, Dashboard, Analytics and exports
- [x] Customer page editor (both tabs): rows, dirty tracking, save, discard, reset, view live,
  leave confirm, phone preview with spot selector and the preview-click rule. Built 2026-10-30:
  `/customer-page` + `owner/pages/CustomerPageEditor.tsx` and customer `PagePreview.tsx`; page
  head (location select, Reset, Save, View live), tabs with counts, blue/amber banners,
  announcement and thank-you with counters, six toggle rows with deep-path fields, footer
  Save/Discard, JSON dirty tracking, confirm on tab/location change, beforeunload, preview spot
  selector and the two preview-only toasts; saves `configs[loc:kind]` with the demo's wording.
- [x] Dashboard: period bar, banners, stat cards, trend card, spot snapshot, recent bills.
  Built 2026-10-30: `/dashboard` + `owner/pages/DashboardPage.tsx`, linked from the sidebar and
  the root redirect; service and new-order banners, four stat cards with deltas, earnings trend,
  spot snapshot and the four newest bills. "Full analytics" links to the task-3 route; the CSV
  button arrives with task 4.
- [x] Analytics: spot filter, stat cards, trend, spot table, day table, bill details.
  Built 2026-10-30: `/analytics` + `owner/pages/AnalyticsPage.tsx`, linked from the sidebar and
  the dashboard. The select (rooms, direct punch, all) filters the page, invalid spots fall back
  to all, stat cards compare with the previous range, and the location-wide trend, clickable spot
  table, reversed day table and newest-first bill rows match the demo. CSV buttons arrive with
  task 4.
- [ ] CSV report (`report.ts`), hotel mode checked on every page.

Done when: checklist A rows 11–14, 22, 33–34 pass; screenshots S01–S02, S09–S13 and S23 match;
reviewer pass done.

## Phase 7 — Parity audit
- [ ] Walk the whole parity checklist (A–G) against the running demo, side by side, at 390, 768
  and 1280. Fix every mismatch.
- [ ] Run each message in checklist E and compare wording.
- [ ] Run through the demo's three main flows twice (first order and reorder; join with code;
  bill and payment), once with each model reviewing.
- [ ] Hotel mode full pass.
- [ ] `npm run typecheck`, `npm run build` and the rules check pass.

Done when: every row in the checklist is ticked and the reviewer reports zero mismatches.

## Phase 8 — Merge into the SaaS repo
- [ ] Create branch `feat/rooms-qr-stage1` from latest `main` of `Review-SaaS-main`.
- [ ] Copy `lib/rooms/`, `components/rooms/`, `scripts/rooms-rules-check.ts`, the new routes.
  Do not copy `reference/` or dev-only code. Delete all `// DEV-ONLY` blocks.
- [ ] Wire the sidebar in `components/dashboard/nav.ts` (Orders, Tables/Rooms), shown only for
  cafe, restaurant and hotel; add `tableOrdering` to `lib/category/features.ts`.
- [ ] Replace demo constants with real data: business profile, location slug and name, real menu
  and hours (using `parseMenuPrice`), colours, time zone.
- [ ] Add the Tables/Rooms tab to the existing customer page editor; leave the reception editor
  untouched. Add the QR panel to Locations. Add ordering cards to Dashboard and Analytics (O3).
- [ ] Replace placeholder buttons with real `tel:`, maps and https links.
- [ ] Confirm `app/r/[slug]/page.tsx` is unchanged.
- [ ] Update `PRD.md`, `business-rules.md`, `security-and-reliability.md`, `schema.sql` (Stage 2
  tables as proposed in spec section 15), and `PROGRESS.md`.
- [ ] CI green (`npm ci`, `npm run typecheck`, `npm run build`), plus the three existing check
  scripts and the new one. Open a pull request; do not commit to `main`.

Done when: CI is green, existing pages are visually unchanged, and the full flow works inside the
SaaS for a cafe, a restaurant and a hotel business and is hidden for a salon.

## Model trial (Phase 1, once)
Run the Phase 1 rules task once with each model on the same prompt. Keep the one whose rules check
passes with fewer fixes as the builder; use the other as reviewer. Log the result below.

## Session Log
- 2026-10-30 — **Phase 6 task 3 done** (branch `feat/rooms-standalone`). Analytics is live at
  `/analytics` and linked from the sidebar and Dashboard: the spot select filters every card and
  the bill list (unknown or missing direct-punch spots fall back to all), the four cards use the
  demo's scope and previous-range deltas, the earnings trend stays location-wide, and the spot
  table, reversed day table and newest-first bill details follow the demo's wording. CSV download
  is still task 4. `npm run typecheck` ✅, `npm run build` ✅ (`/analytics` 4.9 kB), rules check 139
  ✅. Next: task 4 (CSV report and the hotel-mode pass).
- 2026-10-30 — **Phase 6 task 2 done** (branch `feat/rooms-standalone`). The dashboard now lives at
  `/dashboard` (root redirects there, sidebar item active): the shared period bar, live service and
  new-order banners, earnings/bills/guests/collected stat cards with deltas, the day-by-day
  earnings trend with best day and daily average, the spot-wise snapshot with direct-punch row and
  analytics links, and the four newest bills with the waiting badge on View all. Feature card and
  feedback strip are outside this checklist item; Download report lands with task 4.
  `npm run typecheck` ✅, `npm run build` ✅ (`/dashboard` 4.47 kB), rules check 139 ✅. Next: task 3
  (Analytics).
- 2026-10-30 — **Phase 6 task 1 done** (branch `feat/rooms-standalone`). The customer page editor is
  live at `/customer-page`: both tabs, the demo's banners, every row and field (announcement and
  thank-you counters, menu/wifi/hours/call/directions/custom, locked review row), Save/Discard/
  Reset/View live, JSON dirty tracking, confirm on tab or location change, beforeunload, and a
  phone preview with the spot selector and the two preview-only toasts. `npm run typecheck` ✅,
  `npm run build` ✅ (`/customer-page` 6.15 kB), rules check 139 ✅. Next: task 2 (Dashboard).
- 2026-10-30 — **Phase 5 code complete** (branch `feat/rooms-standalone`). Tasks 5–6: verified the
  Wi-Fi screen/tiles against the demo (and made a locked screen fall back home), then added the
  ref-backed join/bill/paid detectors — host request bell + toast, guest approved/denied/expired/
  locked toasts, bill-sent and payment bells that switch home/service-sent/order-done to the bill —
  plus the customer title `${business} · ${spot}`; countdowns ride the existing 1 s tick.
  Reviewer pass (checklist B join/bill/wifi and section D): no further mismatches; the demo's
  scan-signature guard is not needed because React re-renders on newer state. `npm run typecheck` ✅,
  `npm run build` ✅ (`/r/[slug]/[code]` 136 kB first load), rules check 139 ✅. Screenshots S42–S53
  and S61 remain [BLOCKED: owner must capture]. Next: Phase 6 after approval.
- 2026-10-30 — **Phase 5 task 4 done** (branch `feat/rooms-standalone`). The customer bill screen
  now covers unpaid and paid bills with the demo's banner copy, rounds paper, paid line and
  5-minute window; the home page gains the paid-bill card plus Bill/Paid bill tiles, and Download
  bill uses the ported hand-built PDF in `lib/rooms/bill-pdf.ts` before moving to the review.
  `npm run typecheck` ✅, `npm run build` ✅, rules check 139 ✅. Next: task 5 (verify the Wi-Fi
  screen/unlock), then task 6 (join/bill/paid detectors).
- 2026-10-30 — **Phase 5 tasks 2–3 done** (branch `feat/rooms-standalone`). Task 2: the host
  phone now gets the join panel above every customer screen — roster chips, pending approvals with
  Approve/Deny, the read-aloud 6-digit card with attempts and expired/locked styling, New code,
  Cancel and Open guest view, all with the demo's toasts. Task 3: a 1 s interval in `ScanPage`
  drives the join/host countdowns and re-checks expiries. `npm run typecheck` ✅, `npm run build` ✅,
  rules check 139 ✅. Next: task 4 (bill screen, paid-bill card and PDF).
- 2026-10-30 — **Phase 5 task 1 done** (branch `feat/rooms-standalone`). The host-approved join
  gate now replaces the customer screens whenever this device scans a spot with an open bill it
  isn't on: name form, pending with the 2-minute timer, approved 6-digit entry with attempts left,
  locked, expired (request vs code), denied and cancelled, all through `requestJoin`,
  `cancelJoinRequest` and `verifyJoinCode` with the demo's toast wording. `npm run typecheck` ✅,
  `npm run build` ✅, rules check 139 ✅. Next: task 2 (host panel). Note: the countdown displays are
  still static until task 3 adds the 1 s tick.
- 2026-10-30 — **Phase 4 code complete** (branch `feat/rooms-standalone`). Task 7 added the
  DEV-ONLY simulated order with its page-head and empty-state buttons. Reviewer pass (checklist
  A 15–32 and section D): two mismatches found and fixed — "View table/room" now expands the spot
  group when Orders is already open, and rounds created in this tab (punch/simulate) no longer ring
  again on the next external sync. Everything else matched: panel actions, resolve-service wording,
  sound toggle stopping the ring, order filters/status buttons, bill email/phone/verify, punch
  quantities, waiter actions and title. `npm run typecheck` ✅, `npm run build` ✅ (`/orders`
  12.7 kB), rules check 139 ✅. Screenshots S06–S08 and S17–S22 remain [BLOCKED: owner must
  capture]. Next: Phase 5 after approval.
- 2026-10-30 — **Phase 4 task 6 done** (branch `feat/rooms-standalone`). Live events: the
  storage/poll subscription now feeds `freshRounds` / `freshServiceCalls` (new `lib/rooms/detect.ts`,
  +6 checks), the alert card shows New order vs New round, starts the 10 s ring, stops on dismiss or
  when the order is no longer active/new, and "View table/room" opens `/orders` with that group
  expanded. Group headers show the call chip and a Mark handled button; the provider exposes
  `hydrated` so the first stored load does not ring. `npm run typecheck` ✅, `npm run build` ✅,
  rules check 132 ✅. Next: task 7 (`simulate-order`, DEV-ONLY), then the Phase 4 review.
- 2026-10-30 — **Phase 4 task 5 done** (branch `feat/rooms-standalone`). The live-requests panel
  now shows up to three calls with Send bill / Done (the demo's `sendBillToPhone` and
  `resolveServiceCall` paths and their toasts), new orders link to `/orders` with the red unread
  dot, the panel uses the demo's 335 px / 10 px sizing, the sidebar Orders item links to `/orders`
  with the waiting badge (white on red when orders wait), and `AppShell` applies the demo's
  document title `(n) Live table request · Syehere` / `Syehere — Tables, orders & QR pages`.
  Group `Mark handled` and the live alert remain in task 6. `npm run typecheck` ✅,
  `npm run build` ✅, rules check 126 ✅. Next: task 6 (live alert card, ring/bell, checklist D).
- 2026-10-30 — **Phase 4 task 4 done** (branch `feat/rooms-standalone`). The Punch dialog: page-head
  "Punch order", a "Punch" button on every spot group (the Direct punch group has no table), the
  add-to picker with the demo's open-bill / new-bill hint, the demo menu with Add / plus / minus up
  to 20 per item, the running item count and total, the open-bill note that replaces the customer
  fields, and `createPunchOrder` for both paths with the demo's two toasts. `npm run typecheck` ✅,
  `npm run build` ✅ (`/orders` 11.4 kB), rules check 126 ✅. Next: task 5 (notifications panel,
  topbar badge, sidebar Orders badge and document title).
- 2026-10-30 — **Phase 4 tasks 1–3 done** (branch `feat/rooms-standalone`). Orders page (period
  bar, banners, stat cards, filters with counts, collapsible groups, Direct punch group, row tags
  and status buttons), Waiters card + Add waiter dialog, and the Invoice dialog (print, send to
  phone, email SIM, exact-amount payment verify). `npm run typecheck` ✅, `npm run build` ✅
  (`/orders` dynamic), rules check 126 ✅. Next: task 4 (Punch dialog), then 5–7 (notifications
  and title, live alert + detectors, simulate-order). Mark handled and the live alert stay in
  tasks 5–6.
- 2026-10-30 — **Audit of Phases 0–3** (read-only) + approved fixes. `npm install`, typecheck,
  build and the rules check all passed; 124 checks. Three audit items fixed and pushed: the topbar
  notification row now names the order's location and shows the demo's arrow, `lib/rooms/qr.ts`
  uses the documented QR dark colour in its fallback instead of a fourth hex, and `tsx` is now a
  declared dev dependency so `npm ci` can run the rules check. Open item unchanged: golden
  screenshots still `[BLOCKED: owner must capture]`.
- 2026-10-30 — Phase 0 files written. Waiting on owner tasks in Phase 0.
- 2026-10-30 — **Phase 0 complete** (branch `feat/rooms-standalone`). Planning files present; demo
  folder verified unchanged (`app.js` 5,576 lines); bracketed spec functions all exist (no
  mismatch); O1–O8 defaults applied, O1 answered (`price` is a string → `parseMenuPrice()`).
  Deviations: none. Blocked: golden screenshots (checklist G) — owner must capture at 390/768/1280.
  Next: Phase 1 (foundation).
- 2026-10-30 — **Phase 1 complete** (branch `feat/rooms-standalone`). Scaffold plus the whole
  `lib/rooms/` foundation: types, constants, format (+`parseMenuPrice`), seed, rules R1–R16, store,
  QR (vendored `qrcode.js`), sound, and `scripts/rooms-rules-check.ts` (124 checks covering all 28
  checklist-F groups). `npm run typecheck` ✅, `npm run build` ✅, no component code. Deviations
  listed in the phase section. Next: Phase 2 (owner shell, Locations, Spots page and dialogs).
  Reviewer pass (checklist section F): 28/28 groups covered, no code mismatches. One checklist
  wording issue: F.22 says the previous window has "the same length"; the demo ends it one
  millisecond before the current window starts, so a partial day makes it longer. `rules.ts`
  `previousPeriodWindow` follows the demo; the checklist row is the inaccurate part.
- 2026-10-30 — **Phase 2 complete** (branch `feat/rooms-standalone`). Owner shell + demo bar,
  Locations and Tables/Rooms pages, Add/Rename/QR dialogs, toasts and clipboard. `npm run
  typecheck` ✅, `npm run build` ✅ (`/locations` and `/rooms` dynamic), rules check 124 ✅, both
  pages return 200 with the expected server HTML. Screenshot parity [BLOCKED: owner must capture].
  Next: Phase 3 (customer ordering).
  Reviewer pass (checklist A 1–9, 38–41): no mismatches. A.40 is the merge-time sidebar wiring;
  the standalone keeps the demo toast. Screenshot rows remain [BLOCKED: owner must capture].
- 2026-10-30 — **Phase 3 in progress** (branch `feat/rooms-standalone`). Tasks 1–2 done: the
  `/r/[slug]/[code]` spot route and `/r/[slug]` reception placeholder, the themed scan frame, scan
  bar, Copy link and both unavailable states. `npm run typecheck` ✅, `npm run build` ✅ (four
  dynamic routes), rules check 124 ✅; HTTP: a valid QR, an unknown code, the reception page and an
  unknown slug all return 200 with the expected copy. Next: customer screens (home, menu, cart,
  checkout, order done).
- 2026-10-30 — Phase 3 tasks 3–7 done. The customer flow now runs home → menu (service strip) →
  cart → checkout (new and continuing, waiter picker) → order done, plus the service chooser/sent
  screens, Wi-Fi and chooser/Google/feedback/thanks/hours. `npm run typecheck` ✅, `npm run build`
  ✅, rules check 124 ✅; SSR checks: QR home, reception (no “Ordering for”) and an unknown code all
  200 with the expected copy. Click-through and screenshots remain owner-verified (no browser
  automation here). Next: task 8 (per-spot scan counter), then the Phase 3 review.
- 2026-10-30 — **Phase 3 complete** (branch `feat/rooms-standalone`). Added the O4 scan counter
  (sessionStorage throttle, one per device per 30 minutes) and closed the parity gaps the review
  found: the menu service strip now shows the active call, and the home panel shows the live
  waiter/bill request times. `npm run typecheck` ✅, `npm run build` ✅, rules check 124 ✅.
  Reviewer pass (checklist B subset for Phase 3): no code mismatches; Google's writer remains a
  placeholder and the bill/join rows stay Phase 5. Screenshots [BLOCKED: owner must capture].
  Next: Phase 4 (owner Orders and live alerts).

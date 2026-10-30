# Tables & Rooms QR Ordering — Build Progress Tracker

Last updated: 2026-10-30
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
- [ ] Scaffold: new Next.js project with the SaaS `package.json` dependencies, `tsconfig.json`,
  `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `app/globals.css`, `lib/brand/*`.
  Add scripts `dev`, `build`, `start`, `typecheck` identical to the SaaS.
- [ ] Verify open item O1: read `lib/mock/customer-page.ts` in the SaaS (`MenuItem.price` type)
  and write `parseMenuPrice()` accordingly. Log the result.
- [ ] `lib/rooms/types.ts` — spec section 5, exactly.
- [ ] `lib/rooms/constants.ts` — spec section 6, exactly.
- [ ] `lib/rooms/format.ts` — `money`, `formatTime`, `formatWhen`, `formatDay`, `deltaLabel`,
  `spotWord`, `displaySpotName`, `statusLabel`, `serviceKindLabel/Title`, `orderSpotName`.
- [ ] `lib/rooms/seed.ts` — `configTemplate`, `seedWaiters`, `seedOrders`, `seedHistoryOrders`
  (demo lines ~148–420), `seedState`, `ensureShape` (migrations: give every bill an id, billId,
  first round, participants, host).
- [ ] `lib/rooms/rules.ts` — spec section 7, R1–R16, as pure functions taking `state` and `now`.
- [ ] `lib/rooms/store.ts` — load, validate, persist, subscribe; cross-tab updates via the
  `storage` event and a 2500 ms poll; newest `savedAt` wins; device id in `sessionStorage`;
  `useRoomsState()` hook.
- [ ] `lib/rooms/qr.ts` and `lib/rooms/vendor/qrcode.js` — vendored from the demo, SVG output as
  in the demo.
- [ ] `lib/rooms/sound.ts` — bell and ring timing from spec section 6.
- [ ] `scripts/rooms-rules-check.ts` — all 28 groups from checklist section F.

Done when: the rules check prints `N checks passed` with every group covered, typecheck and build
pass, and no component code exists yet.

## Phase 2 — Owner shell, Locations, Spots page and dialogs
- [ ] Dev shell: sidebar, topbar (search, notifications bell, sound toggle, business chip), page
  frame, mobile drawer. Mark dev-only parts `// DEV-ONLY`.
- [ ] Dev bar: outlet select, Try join approval, Reset demo (DEV-ONLY).
- [ ] Route wrappers and page components for `locations` and `rooms`.
- [ ] Locations: location cards, QR panel with Reception and Spots tabs, QR card, reception card.
- [ ] Spots page: toolbar, shared strip, room rows with call chips and actions.
- [ ] Dialogs: Add spot, Rename, QR (copy link, SVG download). Shared `Modal` with Escape and
  overlay close.
- [ ] Toasts, clipboard helper.
- [ ] Room active toggle, rename, add (cap 12).

Done when: checklist A rows 1–9 and 38–41 pass; screenshots S03–S05, S14–S16 and S23 (Rooms) match
at 390, 768 and 1280; reviewer pass done.

## Phase 3 — Customer ordering (scan page core)
- [ ] `app/r/[slug]/[code]/page.tsx` and a placeholder `app/r/[slug]/page.tsx` for the reception
  preview (placeholder is deleted at merge).
- [ ] Scan page frame, themed with `--cp-primary`, `--cp-secondary`, `--cp-bg`; unavailable states.
- [ ] Home, menu (with service strip), cart bar and cart pill, cart, checkout (new and
  continuing), order done.
- [ ] Waiter picker with Available, At capacity and Paused states.
- [ ] `placeOrder` wired to the rules; new bill and reorder both work.
- [ ] Service screens: panel, chooser, sent; `requestService` wired.
- [ ] Chooser, Google, Feedback, Thanks, Hours screens. Reuse the SaaS components at merge; in
  standalone build them to match the demo.
- [ ] Per-spot scan counter (open item O4), display only.

Done when: checklist B rows for add/dec item, cart, checkout, pick waiter, place order, menu,
home, service, hours, thumb, google, contact, feedback and chooser pass; screenshots S30, S33–S41,
S54–S60 match; reviewer pass done.

## Phase 4 — Owner Orders and live alerts
- [ ] Orders page: banners, stat cards, filters with counts, spot groups (collapsible), order
  rows with tags and status buttons, Direct punch group.
- [ ] Waiters card and the Add waiter dialog; max, toggle and remove.
- [ ] Invoice dialog: items, rounds, print, send to phone, email (SIM), payment verify.
- [ ] Punch dialog (table and direct).
- [ ] Notifications panel, topbar badge, sidebar Orders badge, document title.
- [ ] Live alert card, ring timing, bell, sound toggle, `handleExternalState` rules (checklist D).
- [ ] `simulate-order` (DEV-ONLY).

Done when: checklist A rows 10–37 relevant to Orders pass; section D passes for incoming orders and
service calls; screenshots S06–S08, S17–S22 match; reviewer pass done.

## Phase 5 — Joining, bill and Wi-Fi (customer and host)
- [ ] Join gate: form, pending, approved, locked, expired, denied, cancelled.
- [ ] Host panel: roster, pending request, code card, New code, Cancel; "Open guest view".
- [ ] Countdown timers (1 s tick).
- [ ] Bill screen (unpaid and paid), paid-bill card, download PDF (`bill-pdf.ts`), 5-minute window.
- [ ] Wi-Fi screen and the unlock rule; Wi-Fi tile on home and on order-done.
- [ ] `detectJoinEvents`, `detectBillSent`, `detectPaidBill` and the scan-signature re-render.

Done when: checklist B rows for join, bill, wifi pass; section D passes for join, bill and paid;
screenshots S42–S53 and S61 match; reviewer pass done.

## Phase 6 — Editor, Dashboard, Analytics and exports
- [ ] Customer page editor (both tabs): rows, dirty tracking, save, discard, reset, view live,
  leave confirm, phone preview with spot selector and the preview-click rule.
- [ ] Dashboard: period bar, banners, stat cards, trend card, spot snapshot, recent bills.
- [ ] Analytics: spot filter, stat cards, trend, spot table, day table, bill details.
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
- 2026-10-30 — Phase 0 files written. Waiting on owner tasks in Phase 0.
- 2026-10-30 — **Phase 0 complete** (branch `feat/rooms-standalone`). Planning files present; demo
  folder verified unchanged (`app.js` 5,576 lines); bracketed spec functions all exist (no
  mismatch); O1–O8 defaults applied, O1 answered (`price` is a string → `parseMenuPrice()`).
  Deviations: none. Blocked: golden screenshots (checklist G) — owner must capture at 390/768/1280.
  Next: Phase 1 (foundation).

# Tables & Rooms QR Ordering — Parity Checklist

Companion to `ROOMS_QR_SPEC.md`. Every line below must be true in the standalone build before
Phase 7 (parity audit) can be ticked. Tick `[x]` only after you have run the demo and the build
side by side and seen it match.

Legend: **DEV** = exists in the standalone build only and is deleted at merge. **REPLACE** = the
demo shows a placeholder; build the real behaviour. **SIM** = simulated in Stage 1 (no real
sending). Bracketed names are functions in the demo's `app.js`.

---

## A. Owner click actions (42, from `data-action`)

| # | Action | Behaviour | Tick |
|---|---|---|---|
| 1 | `add-room` | Open the Add dialog; blocked at 12 spots with the limit toast | [ ] |
| 2 | `create-room` | Name required (toast "Enter a room name."), slice 40, permanent next code, toast `${name} added — it has its own permanent QR (QR3) and a live order feed.` | [ ] |
| 3 | `rename-room` | Open Rename dialog | [ ] |
| 4 | `rename-save` | Name required (inline error), name only changes, toast "Room renamed — the QR and link did not change." | [ ] |
| 5 | `view-qr` | QR dialog with URL, Copy link, Download SVG | [ ] |
| 6 | `download-qr` | Downloads the SVG, toast "QR downloaded as SVG." | [ ] |
| 7 | `copy-link` | Copies the URL (clipboard fallback), toast | [ ] |
| 8 | `close-modal` | Closes the dialog; Escape and overlay click also close | [ ] |
| 9 | `panel-kind` | Switch Reception / Spots tab in the QR panel | [ ] |
| 10 | `editor-kind` | Switch editor tab; confirm "Discard unsaved changes?" if dirty | [ ] |
| 11 | `save-config` | Saves the draft for that location and kind; toast depends on kind (see E) | [ ] |
| 12 | `discard-config` | Restores the saved copy, toast "Changes discarded." | [ ] |
| 13 | `reset-config` | Confirm "Reset this page to the default content?", loads defaults unsaved, toast "Default page loaded — save to publish it." | [ ] |
| 14 | `view-live` | Saves if dirty (with toast), then opens the live page | [ ] |
| 15 | `toggle-notifications` | Opens/closes the live requests panel; outside click closes | [ ] |
| 16 | `toggle-sound` | Persists the preference; on → plays bell; off → stops ring; toasts (see E) | [ ] |
| 17 | `resolve-service` | Marks a call done, toast `${spot} — ${kind title lowercase} handled.` | [ ] |
| 18 | `toggle-order-group` | Expands/collapses a spot's group (memory only) | [ ] |
| 19 | `dismiss-live-alert` | Hides the alert and stops the ring | [ ] |
| 20 | `open-live-alert` | Expands that spot's group, hides the alert, goes to Orders | [ ] |
| 21 | `order-filter` | All / New / Preparing / Served / Done | [ ] |
| 22 | `period-filter` | Sets period, toast `Showing ${range} — ${range label}.` | [ ] |
| 23 | `order-status` | Calls `setOrderStatus` (preparing, served, cancelled from the UI) | [ ] |
| 24 | `open-bill` | Invoice dialog | [ ] |
| 25 | `print-bill` | `window.print()` | [ ] |
| 26 | `send-bill` | Email the bill: validate address, store `emailedTo/At`, toast. **SIM** | [ ] |
| 27 | `send-bill-phone` | Sets `billSentAt`, resolves bill calls (see rules) | [ ] |
| 28 | `verify-payment` | Exact amount only; closes the bill | [ ] |
| 29 | `punch-order` | Open Punch dialog (optionally for a given spot) | [ ] |
| 30 | `punch-add` / 31 `punch-dec` | Quantity 0–20 per item; dialog re-renders | [ ] |
| 32 | `create-punch` | Creates or appends a punch round (see rules) | [ ] |
| 33 | `analytics-spot` | Filters the analytics page by a table row | [ ] |
| 34 | `download-report` | CSV of the current period and spot | [ ] |
| 35 | `add-waiter` | Open Add waiter dialog | [ ] |
| 36 | `create-waiter` | Name required, unique, clamp 1–8, toast `${name} added — can handle ${n} tables at a time.` | [ ] |
| 37 | `remove-waiter` | Blocked while loaded; confirm `Remove ${name} from this location?` | [ ] |
| 38 | `open-sidebar` / 39 `close-sidebar` | Mobile drawer (merged app uses the SaaS shell) | [ ] |
| 40 | `not-in-demo` | **REPLACE** — the muted sidebar items link to the real SaaS pages | [ ] |
| 41 | `reset-demo` | **DEV** — confirm "Reset the demo to its starting state.", reseed, reset all transient state, toast "Demo reset to its starting state." | [ ] |
| 42 | `simulate-order` | **DEV** — random spot (prefers quiet ones), random name, 1–2 items, random waiter; rings the alert | [ ] |

## B. Customer actions (30, from `data-cp-action`)

`add-item` [ ] · `dec-item` [ ] · `cart` (empty → toast "Your cart is empty — add something from
the menu.") [ ] · `checkout` (empty → "Add something from the menu first.") [ ] · `pick-waiter` [ ]
· `place-order` [ ] · `join-request` [ ] · `join-cancel` [ ] · `join-approve` [ ] · `join-deny` [ ] ·
`join-regenerate` [ ] · `join-verify` [ ] · `thumb` (both thumbs → chooser) [ ] · `google` [ ] ·
`contact` [ ] · `submit-feedback` (empty → "Please write a short message.") [ ] · `bill` [ ] ·
`download-bill` (only when completed; otherwise "The bill is not paid yet.") [ ] · `home` [ ] ·
`menu` [ ] · `service` [ ] · `service-waiter` / `service-bill` [ ] · `hours` [ ] · `wifi`
(locked → "Wi-Fi is available only after your order is accepted.") [ ] · `copy-wifi` (toast
"Wi-Fi password copied.") [ ] · `call` **REPLACE** with `tel:` [ ] · `directions` **REPLACE** with
Google Maps [ ] · `custom` **REPLACE** with the https link [ ] · `write` **REPLACE** with the
existing review-writer flow [ ].

Editor preview rule: inside the phone preview, links toast "This is the live preview. Open the
live page to follow links." and customer actions toast "Live preview — open “View live page” to
click through." [ ]

## C. Change, input and key handlers

- [ ] Editor location select (confirm if dirty), room active toggle, preview spot select,
  analytics spot select, waiter max select, waiter active toggle, punch spot and fields,
  checkout fields (guests numeric), editor `data-field` with deep paths (`wifi.ssid`).
- [ ] Toggling a field ending in `.on` re-renders the editor; text fields only refresh the preview
  and the dirty state.
- [ ] Dirty = JSON of draft differs from saved JSON.
- [ ] Join code input strips non-digits, max 6. Enter in the name field clicks Ask; Enter in the
  code field clicks Join.
- [ ] Route change resets: draft, dirty, preview spot, public screen to home, cart, checkout
  draft and error, last order and round, punch draft, notification panel, analytics spot, order
  filter, join drafts and errors, last scan signature, last service call, dashboard alert;
  stops the ring, closes dialogs, closes the mobile drawer.
- [ ] **DEV** business-type select (café/restaurant ⇄ hotel): updates the labels everywhere and
  resets the analytics spot.

## D. Live events

- [ ] `handleExternalState`: ignore if the stored `savedAt` is not newer. If newer: run detectors,
  update the title; on a customer page re-render only when the **scan signature** changes; on the
  editor do not re-render while dirty; do not re-render while a dialog is open; otherwise re-render.
- [ ] Sources: `storage` event and a 2500 ms poll.
- [ ] `detectIncomingOrders` — fires for each unseen round id; skips on the customer page; starts
  the ring, shows the alert (`round` vs `order`), toast (see E).
- [ ] `detectServiceCalls` — bell + toast for unseen calls; skips on the customer page.
- [ ] `detectJoinEvents` — host gets bell + toast for a new pending request; the requester gets a
  toast when its status changes to approved, denied, expired or locked.
- [ ] `detectBillSent` — bell + toast, and moves the customer from home / service-sent /
  order-done to the bill screen.
- [ ] `detectPaidBill` — bell + toast, same screen switch.
- [ ] Every second: join countdowns (`data-join-expires`) and bill countdowns
  (`data-bill-expires`); when the paid-bill window closes on the bill screen, go to the chooser.
- [ ] Document title: `(N) Live table request · Syehere` when N = new orders + open calls,
  otherwise `Syehere — Tables, orders & QR pages`; customer page title is `${business} · ${spot}`.
- [ ] Alert is cleared if the order is no longer active, or (for an order alert) no longer `new`.

## E. Verbatim messages (copy exactly)

Order placement: "Your cart is empty. Add something from the menu." · "This QR is no longer
available. Ask a member of staff for help." · "Ask the table host to approve your phone before
adding to this bill." · "Please add your name so the waiter knows who ordered." · "That waiter just
took another table. Pick someone else or choose Any available."

Service: "Place an order first — then you can call a waiter or ask for the bill." ·
`${spot} · ${Call waiter | Bill requested}`.

Join: "This bill is closed." · "You are already on this bill." · `Request sent to ${host}. Waiting
for approval.` · `Approved — read the code to ${name}.` · `Request from ${name} declined.` · "Join
request cancelled." · `New code for ${name}.` · "Enter your name so the host knows who is joining."
· "This bill is no longer open. Ask a member of staff for help." · "Too many wrong attempts. Ask the
host for a new code." · "This join request is no longer active." · "Enter the 6-digit code shown on
the host's phone." · "Too many wrong attempts. Ask the host to send a new code." · `That code
doesn't match. N attempt(s) left.` · `You joined ${host}'s bill #${n}.` · `${name} wants to join
${spot}.` · "Approved — enter the 6-digit code shown on the host's phone." · "The host declined this
join request." · "That join code expired — ask the host for a new one." · "Too many wrong codes —
ask the host for a new one."

Bill: "Your bill is ready — pay at the counter. Download unlocks after payment." · "Payment
received — thanks! Your bill is ready to download." · "No bill is open yet." · "Ask the waiter for
the bill first — the counter will send it to your phone." · "Direct punch bills have no customer
session to send to." · "This bill is already closed — start a new order instead." ·
`${Bill sent|Bill sent again} to ${name}'s phone — ${money}.` · "Enter a valid email address, like
customer@example.com." · `Bill #${n} sent to ${email} (demo).` · `That doesn't match the bill total of
${money}. Enter the exact amount to close.` · `Payment verified — ${money} received. #${n} closed
and ${spot} is free.`

Status: `Order #${n} cancelled — no charge.` · `#${n} completed — ${spot} is free and ${waiter} has
a slot again.` · `Order accepted — Wi-Fi is now visible on ${spot}.` (when Wi-Fi is on) ·
`Order #${n} accepted — the kitchen is preparing it.` · `Order #${n} · ${Label}.`

Live: `New order · ${spot} · ${money} from ${name}` · `Extra order · ${spot} · ${money} added to
${name}'s bill`.

Punch: "Add at least one item before punching the order." · `Added ${money} to ${name}'s bill
#${n} — no new bill.` · `Punched #${n} · ${spot} · ${money}.`

Editor save: rooms with spots → `Saved — all ${n} ${spot} QR page(s) now show this content.`;
rooms with none → `Saved — add a ${spot} QR and this page will appear on it.`; reception →
`Saved — the reception page is updated. ${Spot} QR pages are unchanged.` Sound: "Order bell is on —
new orders ring for 10 seconds." · "Order bell muted — on-screen notifications still appear." Rooms:
`${name} QR is active again.` · `${name} QR paused — the link is reserved and shows “not available”.`
Waiters: `${name} is accepting new orders again.` · `${name} paused — customers will not see them at
checkout.` · `${name} can now handle ${n} ${spots} at a time.` · "That waiter is already on the team."
· `${name} still has ${n} open ${spots}. Complete those orders first.` · "Enter a waiter name." ·
`${name} removed.` Report: `Report downloaded — ${n} bill(s) for ${label} · ${range}.`

Every other string: copy from the demo source. When unsure, search `app.js` for the text.

## F. Rules test list (`scripts/rooms-rules-check.ts`, prints `N checks passed`)

1. `activeStatus` true for new, preparing, served; false for completed, cancelled.
2. `findOpenBill`: newest active at the same location and code; null without a code; ignores completed.
3. Order numbering: empty → 1041; max 1050 → 1051.
4. `waiterLoad`: distinct codes only; ignores yesterday, completed, and null codes.
5. `availableWaiters`: excludes inactive and at-capacity waiters.
6. `placeOrder` new bill: host participant, round `customer`, waiter auto = first available.
7. `placeOrder` with an open bill and the host device: round `reorder`, lines merged, total
   recomputed, status reset to `new`, still one bill.
8. `placeOrder` with an open bill and an unknown device: error text exact.
9. `placeOrder` errors: empty cart, missing name, unavailable chosen waiter.
10. `resolveScanParticipation`: a hostless punch bill → first device becomes host, second gets null.
11. `requestJoin`: pending, expires in 2 minutes, repeat call returns the same request, participant
    gets "You are already on this bill.".
12. `effectiveJoinStatus`: pending after 2 min → expired; approved after code expiry → expired.
13. `approveJoinRequest`: 6-digit code, 5-minute expiry, attempts 0.
14. `verifyJoinCode`: wrong code increments; fifth wrong → locked; correct → joined and guest
    added; short code → exact message.
15. `regenerateJoinCode` resets attempts and status.
16. `requestService`: no bill → null; same kind returns the existing call; other kind replaces.
17. `sendBillToPhone`: sets `billSentAt`, resolves open bill calls; refuses punch without code;
    refuses closed bills.
18. `verifyPayment`: mismatch rejected; exact (to the paisa) closes; `waiterLoad` drops.
19. `setOrderStatus`: `acceptedAt` set once; invalid status ignored; cancelled.
20. `wifiUnlockedForOrder`: false before accept; true preparing and served; false completed; false
    when Wi-Fi off; false for a business type outside cafe, restaurant, hotel.
21. `recentPaidBill`: true within 5 minutes for participants only; false after; false for others.
22. `statsForRange`: cancelled excluded; collected = completed; average rounded; previous window
    has the same length.
23. `dailySeries`: length = days; label step rule.
24. Punch: joins an open bill (`punch` round); direct punch has `code: null`; table punch respects
    waiter capacity.
25. Rooms: `nextRoomCode` skips used; add blocked at 12; rename keeps the code.
26. Waiters: duplicate name rejected case-insensitively; remove blocked under load; clamp 1–8.
27. `spotWord` / `displaySpotName` for hotel and cafe.
28. Corrupt or invalid stored JSON falls back to the seed.

## G. Golden screenshot set (take from the demo before building)

Widths: **390**, **768**, **1280**. Save as `reference/screens/<id>-<width>.png`.

Owner: S01 Dashboard (today) · S02 Dashboard (month) · S03 Locations, Spots tab · S04 Locations,
Reception tab · S05 Spots page · S06 Orders (groups collapsed) · S07 Orders (one group expanded,
mixed statuses) · S08 Orders, filter Served · S09 Analytics (all) · S10 Analytics (one table) ·
S11 Editor, Spots tab · S12 Editor, Reception tab · S13 Editor with unsaved changes · S14 Add spot
dialog · S15 Rename dialog · S16 QR dialog · S17 Invoice, unpaid · S18 Invoice, paid · S19 Punch
dialog · S20 Add waiter dialog · S21 Notifications panel open · S22 Live alert · S23 Hotel mode
(Rooms) of S03, S06 and S09.

Customer: S30 Home, no bill · S31 Home with open bill (host) · S32 Home as joined guest · S33 Menu,
browsing · S34 Menu with cart bar · S35 Cart · S36 Checkout, new bill · S37 Checkout, continuing ·
S38 Order done (new) · S39 Order done (added to bill) · S40 Service chooser · S41 Service sent ·
S42 Join form · S43 Join pending · S44 Join approved (code entry) · S45 Join locked · S46 Join
expired · S47 Join denied · S48 Host panel with a request · S49 Host panel with a code · S50 Bill,
unpaid · S51 Bill, paid with countdown · S52 Paid-bill card on home · S53 Wi-Fi · S54 Hours · S55
Chooser · S56 Google · S57 Feedback · S58 Thanks · S59 Unavailable (unknown code) · S60 Unavailable
(paused QR) · S61 Wi-Fi tile hidden before accept.

Pass rule: at each width the layout, spacing, colours, text and states match. Any visible
difference is a bug unless it is listed in `ROOMS_QR_SPEC.md` section 14.

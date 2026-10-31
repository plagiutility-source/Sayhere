# Business Rules

These are the rules that are easy to get wrong if left implicit. Build exactly
to this spec — do not infer different behavior.

## 1. Plan Limits

| Plan | Price (INR) | Locations | Monthly Scans | Google review auto-reply |
|---|---|---|---|---|
| Free | ₹0 | 1 | 10 | Yes |
| Starter | ₹499 | 1 | 1,000 | No |
| Pro | ₹699 | 1 | 10,000 | Yes |
| Enterprise | Custom | Unlimited | Unlimited | Yes |

- Only Enterprise can have more than 1 location. Free, Starter and Pro are all 1 location.
- The auto-reply column is the plan's `google_auto_reply` flag in the `plans` setting (true/false).
- **Adding a location:** the "Add location" route checks `locations_used < plans.<plan>.locations` on the server, using the
  plan from the session and `getPlans()` (never from the request). Over the limit returns 403 with "Extra locations are
  available on the Enterprise plan". The UI button is disabled for the same case (PRD.md section 5).

- These numbers are for reading. At runtime, plan prices and limits come ONLY from the
  `plans` row in `system_settings` (see security-and-reliability.md section 6A). This includes
  the customer page limits below.

### Customer page limits (quantity limits; every plan has every block type)
| Plan | Menu / price items (per location) | Custom link buttons (per location, every business type) |
|---|---|---|
| Free | 10 | No plan limit |
| Starter | 60 | No plan limit |
| Pro | 150 | No plan limit |
| Enterprise | Unlimited (hard caps in security-and-reliability.md 4C still apply) | No plan limit |

Custom link buttons are the same on every plan: the owner adds as many as needed. Only the hard security
cap in security-and-reliability.md 4C applies (20 per location).

There is no photo gallery and no owner image upload on the customer page. The only photos are the
AI-generated menu item photos we create and store (rule 20 and AI_MENU_PHOTOS.md); AI photo
allowances per plan are in the plan table below.

Social links, contact and hours, announcement, Wi-Fi and the thank-you message have no plan limit
(only the field-size caps in 4C). These values are proposals; confirm or edit them in the `plans`
setting (admin `/admin/plans`).
- **Scan count resets** on the business's monthly anchor date: each month from the signup date for Free,
  and the subscription renewal date for paid plans. The next reset moment is stored in
  `businesses.scan_reset_at`. The reset happens **lazily on the first request after that moment**
  (set `scans_used = 0`, move `scan_reset_at` forward one month, clear `scan_limit_notified_at`), so a paused
  business is back the moment its reset time passes, not up to a day later. The daily cron does the same as a backstop.
- **When a business uses all its scans (`scans_used >= scan_limit`), the customer side stops working until the
  count resets or the owner upgrades.** This includes the QR code, the NFC tag and the short link:
  - The public review page, AI review text, Post to Google and the feedback form all show the same neutral
    "temporarily unavailable" page used for suspended businesses (rule in section 4). It never shows an error
    and never mentions the scan limit, so the owner's customers are not told why.
  - **Counting is atomic:** `UPDATE businesses SET scans_used = scans_used + 1 WHERE id = ? AND scans_used < scan_limit`.
    If no row changed, the limit is reached and the unavailable page is shown. Two visitors at the same moment can
    never push the count past the limit. Plans with no limit (`scan_limit` unlimited) skip this check.
  - **A visitor already counted can finish.** A visitor whose scan was counted (or who already has a counted
    scan for that page in the last 30 minutes, the dedupe window in security-and-reliability.md section 3) is
    allowed to complete the flow even if their scan was the last one. Only brand-new visitors see the unavailable page.
  - **The owner's dashboard stays fully open** (feedback, analytics, billing). It shows a red banner: "Scan limit
    reached. Your QR page, auto-replies and weekly reports are paused until {scan_reset_at}. Upgrade to turn
    everything back on now."
  - **One email per cycle** ("Scan limit reached", email template 12), guarded by `scan_limit_notified_at`.
  - **Upgrade restores service instantly.** `scans_used` is kept and compared with the new, higher limit
    (Free at 10 of 10 upgrading to Starter becomes 10 of 1,000). Nothing is reset by upgrading.
  - **Admin can reset or extend.** An admin can reset `scans_used` to 0 for one business (for example after a
    bot attack). It needs a reason and is written to `audit_logs` (admin-spec.md).
  - **Everything pauses, not only the customer page.** While the limit is reached, the daily cron also skips this business
    for Google auto-reply and the weekly email report (no replies are posted, no report is sent). The customer side,
    auto-reply and weekly report all resume on their own after the reset or an upgrade. Auto-reply then
    picks up reviews that still have no reply; weekly reports missed during the pause are not sent later.
  - **Still working while paused:** only the owner's dashboard and billing (so they can read feedback, upgrade and pay)
    and account emails (payment, plan, security, scan-limit). Nothing else runs.

## 2. Plan Upgrades
- Effective immediately upon successful payment.
- New limits (scans, locations, features) unlock instantly.
- Confirmation email sent immediately: "Your plan has been upgraded to [Plan] —
  here's what's new."

## 3. Plan Downgrades
- Take effect at the END of the current billing cycle, not immediately.
- If a business is currently using more locations/scans than the lower plan
  allows, warn them before confirming the downgrade.

## 4. Failed Recurring Payment
1. Payment attempt fails (Cashfree webhook).
2. Business enters a 3-day grace period. Status = `past_due`.
3. Email sent immediately: "Your payment failed — please update your payment
   method within 3 days to avoid service interruption."
4. If not resolved within 3 days: business status = `suspended`.
   - Review pages stop functioning for customers (show a neutral "temporarily
     unavailable" message, not an error).
   - Owner dashboard remains accessible so they can update payment and reactivate.
5. On successful payment update: status returns to `active` immediately,
   confirmation email sent.

## 5. Cancellation Flow
- Cancellation is NOT instant self-serve.
- Flow:
  1. Owner clicks "Cancel Plan" in dashboard.
  2. Shown a reason form: dropdown (e.g. "Too expensive," "Missing a feature,"
     "Switching to another tool," "Not using it enough," "Other") + optional
     free-text feedback field.
  3. On submit: show confirmation message — "Thanks for letting us know. Our
     team will reach out within 48 hours before your cancellation is finalized."
  4. Record the request in `cancellation_requests` with status `pending`.
  5. Service continues, uninterrupted, until the end of the current paid
     billing cycle regardless of when the cancellation request was submitted.
  6. Admin panel surfaces all open cancellation requests for the SaaS owner
     to review/contact.
- Do not auto-refund. Refund policy is covered in the Payment Policy page.
  Admin-issued refunds are covered in section 5A.

### 5.1 Cancellation request statuses
| Status | Meaning | Set by |
|---|---|---|
| `pending` | Owner submitted the form; nobody has reached out yet | System (on submit) |
| `contacted` | Admin has reached out to the owner | Admin |
| `retained` | Owner decided to stay; nothing changes | Admin, or owner via **Keep my plan** |
| `finalized` | Cancellation confirmed; renewal stopped; plan ends at cycle end | Admin, or system (rule 3) |
| `withdrawn` | Owner used **Keep my plan** after it was finalized but before the plan ended | Owner |

(`resolved` no longer exists; it never said what actually happened.)

### 5.2 What finalizes a cancellation
1. **Submitting the form** creates the request as `pending`, sends the "Cancellation request
   received" email and starts the 48-hour promise. It does NOT stop renewal yet.
2. **Admin finalizes** (button on `/admin/cancellations` or the client page, optional note):
   - set `subscriptions.cancel_at_period_end = 1`, `cancelled_at = now`,
     `cancel_finalized_by = admin email`;
   - cancel auto-renewal at Cashfree so no further charge is taken (service continues,
     the current cycle is already paid);
   - set the request to `finalized`, send the "Your plan will end" email (email template 9);
   - write `cancellation.finalized` to `audit_logs`.
3. **Renewal guard (automatic, in the daily cron):** any request still `pending` or
   `contacted` whose subscription renews within 2 days is finalized exactly as in rule 2,
   with `cancel_finalized_by = 'system'`. The owner must never be charged again while the team
   is still deciding. The admin list marks it "auto-finalized".
4. **Admin retains:** **Owner is staying** sets `retained`; nothing else changes; audit-logged.
5. **Owner can change their mind** until the plan ends via **Keep my plan** on the Billing page.
   It sets the request to `withdrawn` (or `retained`) and clears `cancel_at_period_end`. If Cashfree
   auto-renewal was already cancelled, the owner goes through checkout again for the same plan
   (a new mandate, charged at that time); show this clearly before they confirm.
6. **SLA visibility:** requests still `pending` after 48 hours show an **Overdue** badge on the
   admin dashboard and cancellations list.

### 5.3 Owner-facing behavior
- While `pending` or `contacted`: Billing banner "Cancellation requested. Our team will contact
  you within 48 hours. Your plan stays active until {billing_cycle_end}."
- After `finalized`: banner "Your plan ends on {date}. After that you will be moved to the Free
  plan." with a **Keep my plan** button.
- Before submitting the cancel form, if the owner has more than 1 location, warn: "Extra
  locations will be switched off when your plan ends."

### 5.4 End of the paid cycle (daily cron)
For every subscription with `cancel_at_period_end = 1` and `current_period_end <= now`:
1. Set `subscriptions.status = 'cancelled'`.
2. Set `businesses.plan = 'free'`; set `scan_limit` and `location_limit` from
   `getPlans().free` (never hard-coded); reset `scans_used = 0`; clear `billing_cycle_end`.
3. Keep the OLDEST location active. Set `is_active = 0` and `deactivated_at = now` on the others.
   Deactivated review pages show the neutral "temporarily unavailable" page; their slugs are kept.
4. Keep `businesses.status = 'active'`. The account is NOT locked and NOT deleted. The
   `cancelled` business status is not used for plan cancellation; the admin "cancelled" count
   comes from cancelled subscriptions.
5. Keep feedback, analytics, branding and the Google connection.
6. Send the "Your paid plan has ended" email (template 10) and write `subscription.ended`
   (actor `system`) to `audit_logs`.

**Safety net:** if a payment webhook for this subscription arrives after finalization, do NOT
upgrade or extend. Log it, flag it on the admin dashboard as "charge after cancellation", and
let the admin issue a refund (section 5A).

## 5A. Refunds (admin-issued only)
- Payments are non-refundable by default (Payment Policy). A refund is a discretionary or
  legally required exception, decided and issued only by an admin. Owners never self-serve a
  refund and cancelling never creates one automatically.
- Only payments with `payment_attempts.status = 'paid'` can be refunded.
- Amount must be more than 0 and at most `paid amount - sum of refunds that are not failed`.
  Validate on the server.
- Only one refund may be in flight (`requested` or `processing`) per payment. Use our own
  refund id as the idempotency key so a retry or double click cannot refund twice.
- Required: a reason (max 1000 chars) and admin re-authentication within the last 10 minutes.
- Method: `cashfree_api` (server calls the Cashfree refund API) or `manual_record` (records a
  refund already made manually in the Cashfree dashboard; no API call).
  Verify the exact Cashfree refund endpoint, fields and refund webhook in the current Cashfree
  docs before building (provider-reference.md).
- Status flow: `requested` -> `processing` -> `succeeded` or `failed`, updated from the
  signature-verified Cashfree refund webhook.
- Optional "Also end the paid plan now": moves the business to Free immediately (same steps as
  5.4, but today), sets the subscription to cancelled and stops Cashfree auto-renewal.
  Without it, a refund NEVER changes the plan by itself.
- Send the "Refund issued" email (template 8) and write `refund.issued` to `audit_logs`.
- Admin-only: no owner-callable route may create or read `refunds`.

## 5B. Data retention after a plan ends
Because a finalized cancellation moves the owner to Free (5.4), most data simply stays.
| Data | After the plan ends |
|---|---|
| Account, login, branding, primary location, feedback, analytics | Kept, no expiry |
| Extra locations (beyond Free's limit), their scan events, customer page content | Deactivated, then purged after `RETENTION_DAYS_AFTER_CANCEL` (default 90) days |
| Feedback tied to a purged location | Deleted with it (the purge job deletes these rows explicitly) |
| `scan_events` | Existing 90-day rule |
| Payment, refund and audit records | Kept as legally required, personal identifiers removed where possible |
| Onboarding proof (address, phone, licence numbers) | Kept while the account exists; deleted with the account |


- One constant, `RETENTION_DAYS_AFTER_CANCEL`, read from config in one place. Never repeat the
  number in code, emails or policy text.
- **Reactivation:** if the owner upgrades before purge to a plan whose location limit allows it,
  deactivated locations are switched back on (`is_active = 1`, `deactivated_at = null`), oldest
  first, up to the new limit, with the SAME slugs so old printed QR codes work again.
- **Warning email** 7 days before purge: "Your extra locations will be permanently removed on
  {date}. Upgrade to keep them."
- The daily cron does the purge and writes `retention.purged` per business to `audit_logs`.
- Owner-initiated account deletion is separate and immediate
  (security-and-reliability.md section 7). Retention never delays a deletion.
- Not decided: whether long-inactive Free accounts are ever purged. Nothing here deletes them.

## 6. Google Review Auto-Reply Timing
- **v1 activation is through support, not self-serve (PRD.md 5.4.3).** The owner sends a request form; an admin contacts
  them, completes the Google link and marks the request Active. `businesses.auto_reply_enabled` defaults to 0 and is set to 1
  ONLY by that admin action (audit-logged). The cron processes a business only when ALL are true: plan flag
  `google_auto_reply = true`, `auto_reply_enabled = 1`, Google connection healthy, location mapped, scan limit not reached.
- **Request rules:** only plans with `google_auto_reply = true` can send a request (Starter gets 403 and sees "Please upgrade
  your plan"). One open request (`pending` or `contacted`) per business; a second submit returns a friendly "You already have a
  request in progress". Max 3 submits per hour per business. Statuses: `pending`, `contacted`, `active`, `closed`.
  Admin marking `active` for a business whose plan has no auto-reply is refused.
- **Contact and connect (decided):** our team contacts the owner by email or phone call within 48 hours of the request
  (`contact_method` = `email` or `phone` is recorded). The owner signs in to Google themselves during that contact. The
  **Connect Google** button is shown only while the request is `contacted` and the plan still includes auto-reply.
- **Plan gate:** auto-reply runs only for plans with `google_auto_reply = true` (Free, Pro, Enterprise).
  Starter does not get it.
  - The daily cron skips any business whose current plan has the flag off, even if `auto_reply_enabled = 1`.
  - Any route that turns auto-reply on or saves templates returns 403 for a plan without the flag.
    The check reads the plan from the server (session + `getPlans()`), never from the request.
  - Upgrading from Starter to Pro unlocks it instantly (section 2). The owner then connects Google
    and turns the switch on; it is not auto-enabled.
  - Moving to Starter (downgrade at cycle end, section 3) pauses auto-reply. Stored templates and the Google
    connection are kept, so it resumes if the owner upgrades again. Send one email when it is paused.
  - Free and Pro keep it, so a Pro to Free move changes nothing here.
- **Scan-limit pause:** the cron also skips any business that has reached its scan limit (section 1), even on a plan
  that includes auto-reply. It resumes after the reset or an upgrade.
- Replies are NOT posted immediately when a new Google review is detected.
- Minimum delay: 24 hours from when the review was posted.
- A scheduled job checks for reviews older than 24 hours with no reply yet,
  generates a reply, and posts it via the Google Business Profile API.
- Cron cadence note: Vercel's free (Hobby) tier limits cron jobs to once per
  day. A once-daily check is sufficient here — it still respects the 24-hour
  minimum delay, replies just land sometime within the 24-48 hour window
  instead of exactly at 24 hours. If tighter timing is needed later, upgrade
  to a Vercel Pro plan or trigger the job externally (e.g. a free cron
  service like cron-job.org calling a protected API route).
- Reply generation: try Groq first; if it errors or times out, fall back to
  Gemini so a reply is never silently skipped.
- Reply tone by rating:
  - 5★ / 4★: enthusiastic thanks
  - 3★: acknowledgment + commitment to improve
  - 2★ / 1★: apology + invitation to contact directly (not another public plea)
- (Later, PRD.md 5.4.3A; not in v1) Owner can disable auto-reply per business, or edit the reply templates. In v1 only an admin turns it on or off.
- If Google rejects the token (`invalid_grant`, or a 401/403 a refresh cannot fix): set `google_connection_status = 'needs_reconnect'`,
  skip that business in the cron, show the dashboard banner and send ONE email (`google_reconnect_notified_at`). Resume after the owner reconnects.
- Only locations mapped via `review_pages.gbp_location_name` are processed; unmapped locations are skipped.
- (Later, not in v1) Per rating group (4-5 star, 3 star, 1-2 star) the owner chooses `AI-written` or `My template`
  (PRD.md 5.4.3). In `My template` mode the placeholders are filled and posted with no AI call.
  If a template is empty or invalid at post time, fall back to AI for that reply so no review
  is skipped.

## 7. Password Reset
- Standard "forgot password" email flow via Firebase Auth.
- Reset link expires after a reasonable window (Firebase default is fine, ~1 hour).
- No account lockout after failed reset attempts beyond Firebase's own defaults.
- Reset requests are also rate-limited and answered with a generic message; see
  security-and-reliability.md sections 1 and 3.

## 8. Admin Access
- `/admin` is a completely separate authenticated surface.
- Access restricted to emails listed in `ADMIN_EMAILS` (or the `admin_users`
  table) — never the same login flow or session as a business owner.
- Every admin action that changes state (suspend, reactivate, manual plan change,
  refund issued, cancellation finalized or retained, plan price edit, broadcast email)
  must be written to `audit_logs`.
- Session lengths: owner 48 hours, admin 24 hours with a 30-minute idle timeout.
  Full session, cookie and re-authentication rules are in security-and-reliability.md.

## 9. Review Link / QR Regeneration
- The QR/NFC code always encodes a permanent `review_pages.slug` — never the
  raw Google review URL. This is what makes it "dynamic."
- Clicking "Regenerate" after pasting a new Google review link updates
  `google_review_url` in place on the existing `review_pages` row. It must
  NOT create a new slug or a new QR code — any already-printed QR code,
  table tent, or NFC tag must keep working without reprinting.
- A brand-new slug (and therefore a new QR code) is only ever issued when the
  owner explicitly adds a new location. Never issue one silently as a side
  effect of editing an existing location's link.
- For multi-location businesses (Enterprise plan only), each
  `review_pages` row can carry its own `google_review_url`. If a location's
  override is null, fall back to the business-level `google_review_url`.

## 10. Brand Color Rules
- `businesses.primary_color` / `secondary_color` are the single source of
  truth for the dashboard header/accents, the QR code logo-overlay color,
  and the weekly email report header — never store or compute the color
  separately in more than one place.
- `businesses.color_source` records whether the current colors came from a
  business-type preset (`preset`) or the owner's own picker (`custom`).
  Selecting a preset chip overwrites both colors and sets this to `preset`;
  editing either color input sets it to `custom`.
- Changing business type after signup does NOT overwrite a `custom` color
  selection — only re-applies the type's preset if `color_source = preset`.
- The dashboard's sidebar/navigation chrome is NOT driven by these colors
  (it stays neutral/product-level per PRD.md 5.1) — only the content area,
  QR code, and emails pick up the business's color.
- Derived values live in ONE helper, `getBrandTheme(business)`, used by the
  customer page, dashboard content area, QR generator, and email header. It
  returns `primary`, `secondary`, `pageBackground`, `starColor`, and
  `onPrimary`. No other code may compute these.
  - `color_source = preset`: `pageBackground` comes from the per-type table in
    brand-guide.md ("Page Background and Star Color").
  - `color_source = custom`: `pageBackground` = secondary at 15% over white.
  - `starColor` = secondary, or primary if secondary has under 1.5:1 contrast
    against `pageBackground`.
  - `onPrimary` = white or #1F2937, whichever has better contrast.
- Custom color picker: warn (do not block) if the chosen primary has under
  4.5:1 contrast with its `onPrimary` text, or is too light for the QR code to
  scan reliably.

## 11. Customer Page (owner-customizable landing page)
Spec: PRD.md section 5.5. Rules that must be built exactly:

1. **Default page.** If `review_pages.page_config` is null, or `page_custom_hidden = 1`, the public
   page is the default: header, review block, and social icons if any. Nothing else is shown.
2. **Review block is mandatory and first.** A saved config that removes it, disables it, or places
   another block above it (other than the announcement banner) is rejected with a 400.
3. **Structured content only.** Every field is validated by the shared zod schema. No HTML, CSS,
   JavaScript, Markdown or embeds. All text is HTML-escaped on render (security-and-reliability.md 4C).
4. **Plan limits are enforced on the server at save time**, from `getPlans()`: menu items per location
   (custom link buttons have no plan limit, only the 4C hard cap). Over the limit = 400 with a friendly
   message. The client-side disabled buttons are convenience only.
5. **Downgrade behavior.** When limits shrink (plan ends, or admin changes the plan), nothing is
   deleted. The public page shows only the first N items (the first N menu items in the owner's order), and the editor shows "Over your plan limit: upgrade or remove
   items" with the count. Saving is blocked until the content fits the limit, except the owner may
   still delete or reorder items.
6. **Live immediately, cached safely.** A successful save publishes at once (no draft state) and
   revalidates the cached public page. Failed validation never changes the live page.
7. **Slug never changes.** Editing, resetting or hiding the page never creates or changes a slug.
8. **Suspended, scan-limit-reached or unavailable businesses** show the neutral "temporarily unavailable" page for the
   whole customer page, custom blocks included (existing rules in sections 1 and 4).
9. **Scan counting is unaffected.** Only the initial page load counts as a scan (with the existing
   dedupe). Switching tabs or scrolling counts nothing. Phase D `page_events` are separate from scans
   and never touch `scans_used`.
10. **Per location.** Announcement, thank-you message, menu, hours and contact, buttons and Wi-Fi are
    stored per location. Social icons and header (name, logo, tagline) are business-level. Pro owners
    can **Copy from another location** (copies content).
11. **Reset to default** sets `page_config = null` for that location. Social icons are kept.
12. **Announcement end date.** After the end date the banner is not shown (no deletion). Date is
    evaluated in the business time zone.
13. **Business-type suggestions never auto-enable blocks** (PRD.md 5.5.9). Changing business type
    does not alter the page content.
14. **Admin moderation.** An admin can hide a location's custom content (`page_custom_hidden = 1`)
    and restore it. The owner sees a banner in the editor: "Your custom page is hidden by Syehere.
    Contact support." Every hide or restore writes `page.custom_hidden` / `page.custom_restored` to
    `audit_logs`. Admins cannot edit an owner's content.
15. **Wi-Fi block (Phase D).** Shows the password to anyone who opens the page. The editor warns the
    owner about this before enabling it.
16. **Analytics (Phase D).** Count menu opens, link clicks, call and WhatsApp taps, and Directions taps
    as `page_events`, only for event types and link ids that exist in the saved config; rate-limited
    and deduped by `visitor_hash`; pruned at 90 days.
17. **Every button and social icon is individually removable.** Each has an `on` flag. Turning one off
    keeps its saved value. An item is shown to customers only when `on` is true AND its value is valid
    (PRD.md 5.5.4). The save route rejects an `on` item whose value is empty or invalid with a 400 and
    a field-level message.
18. **Adaptive layout is computed at render time**, never stored: count the shown buttons, 2 columns,
    an odd last button stretches to full width, zero buttons draws no grid, zero social icons draws no
    icon row (PRD.md 5.5.5). Button order is fixed in v1.
19. **Custom link buttons are available on every plan and for every business type.** There is no plan limit
    and no business-type restriction, so a café, salon or restaurant can add "Order online" or "Book now"
    as custom links. Only the hard cap (security-and-reliability.md 4C)   and the https rules apply. Changing
    business type never hides or removes custom links.
20. **The menu is imported from a PDF or built manually.** There is no menu URL field and no owner-uploaded
    or owner-linked images. A menu PDF goes directly to private storage, is processed for that import only
    and is deleted immediately after extraction (within 24 hours at the latest); it is never published or
    linked. The owner reviews what AI found before it is added. A PDF import reserves all its AI photos in
    ONE batch against the same plan allowance and daily cap, and a failed batch refunds every credit. If
    only part of the allowance is available, the import creates that many photos and the remaining items
    are added without one; it never overspends credits.
    The only image on a menu item is an AI-generated photo that the owner approved (AI_MENU_PHOTOS.md):
    the item stores OUR image key, never a URL, and a key that does not belong to this business is
    rejected. AI photos use plan credits (Free 3 one-time, Starter 15/month, Pro 40/month, Enterprise
    100/month; never unlimited); a failed generation refunds the credit; a downgrade keeps existing
    photos and stops new generation. A menu config with an unknown key is rejected. The Menu button is shown only when at least one item has a name.
    Everything except the item name is optional (price, "What's in it", tag, sold out).
21. **Call, WhatsApp and Directions act directly** (tel:, wa.me, Google Maps link built by the server
    from validated values). Menu, Wi-Fi and Hours and contact open their own screen with a back arrow.
22. **Pay now (owner decision, 2026-10-02).** A button that lets customers pay the owner directly over
    UPI. The owner turns it on with the Activate control and enters a UPI ID (max 50; `name@handle` —
    letters, digits, dot, dash, underscore, then `@`, then letters only) and the payee name (required,
    max 30). The app builds `upi://pay?pa=...&pn=...&cu=INR` ONLY from the validated values, every
    value URL-encoded; the owner never types a link, there is no amount and no payment status, and
    Syehere never handles money. Shown only when On AND valid, in the fixed order after Directions and
    before custom links. The Pay screen always shows the payee name and UPI ID so the customer can
    verify them (anti-scam); Copy UPI ID is the fallback where the link cannot open. No list of UPI
    apps and no device detection: the phone decides what opens.


---

## 12. Loyalty Program (stamp card + rewards)
Spec: PRD.md section 5.7. Code: `lib/loyalty/rules.ts` (the ONE place these rules live). Rules that must be built exactly:

1. **Optional, per business.** A business has at most one program (`loyalty_programs`). The customer page shows the
   **Loyalty card** button first in the grid only while the program is on. It is not a `page_config` button. Loyalty is
   available on every plan, and loyalty actions do NOT count toward `scans_used` (owner decision pending, see PROGRESS.md
   open decisions). If the business is suspended or at its scan limit the whole customer page is already unavailable.
2. **Identity = confirmed email.** A card exists only after the customer confirms an emailed 6 digit code (10 minutes,
   5 tries). Sending the code needs a Turnstile token, a rate limit per IP and per email, and one email per 60 seconds.
   The email is used only for this card (privacy-policy.md). Members can be deleted by the owner; the email is removed and
   the ledger rows stay without a name.
3. **The printed review QR is never a stamp source.** Anyone can photograph it. A stamp needs a one-time code:
   - **Mode A (`member_code`)**: the customer's card shows a 6 digit code that changes every 60 seconds; a staff member
     enters (Stage 3: or scans) it in Stamp mode.
   - **Mode B (`counter_code`)**: Stamp mode shows a 6 digit code; the signed-in customer types (Stage 3: or scans) it.
   - The owner picks `member_code`, `counter_code` or `both` (default `both`).
4. **One-time codes.** A code lives 60 seconds and works once. Using it marks `used_at` in the same transaction as the stamp.
   A code refused for "too soon" or "daily limit" is NOT consumed. Only one live counter code exists at a time; a new
   customer code replaces that customer's old one. Stage 3 stores only a hash of each code and generates it with a CSPRNG.
5. **Abuse limits (owner-tunable inside fixed ranges, clamped on the server):** hours between two stamps for one member
   0 to 72 (default 4); stamps per member per rolling 24 hours 1 to 5 (default 1). A stamp is also refused while the program
   is off or the member's email is not confirmed.
6. **The balance is derived, never stored.** `valid stamps = stamps where voided_at is null`;
   `cards completed = floor(valid stamps / stamps_required)`; `rewards waiting = cards completed − rewards already chosen`.
   Extra stamps carry over to the next card. `loyalty_stamps` and `loyalty_reward_claims` are append-only: the only allowed
   UPDATEs are void (`voided_at`, `void_reason`), redeem, and cancel. No route may set a balance.
7. **Changing `stamps_required`** (3 to 20, default 10) is refused while any member has a full card waiting for a reward,
   because the derived balance would change under them. It applies to all cards from then on.
8. **Reward offers (the 4 to 5 rewards).** The owner keeps up to 20 offers, at most **5 active** at once. Fields: title
   (2 to 40), description (up to 120), type (`free_item`, `percent_off`, `amount_off`, `custom`), optional monthly limit
   (whole number, counted per calendar month in UTC), active. Paused or over-limit offers are hidden from the choice list.
9. **Choosing a reward.** A member with a full card picks ONE active offer. The server creates a claim that **copies**
   the title and description, gets a unique code (`XXXX-XXXX`, no look-alike characters) and expires after
   `reward_valid_days` (7 to 365, default 30). The choice is final. Editing, pausing or deleting the offer later never
   changes a claim already made. A claim can only be created when `rewards waiting >= 1`, so rewards can not be handed out
   by staff or by the owner without a completed card.
10. **Redeeming.** Staff look the code up (shows reward, member, expiry), then confirm. Confirm is ONE conditional UPDATE
    (`status = 'earned' AND expires_at > now`); exactly one changed row means success, so two staff can never redeem the
    same reward. Expiry is derived from `expires_at`, never stored as a status. The staff member is recorded.
11. **Staff and PINs.** Up to 10 staff per business, each with a name and a 4 to 6 digit PIN, unique among active staff,
    stored as a slow salted hash. Every stamp (Mode A) and every redemption records `staff_id`. Five wrong PINs lock Stamp
    mode for 5 minutes. Stamp mode locks itself after 5 quiet minutes. Turning a staff member off stops their PIN at once;
    history stays. Stage 3: Stamp mode gets its own `/stamp` route with a staff session cookie, so counter staff never need
    the owner's login on the counter device.
12. **Owner control.** The owner can void a stamp and cancel an unused reward (both stay in the ledger with a reason), turn
    a staff member off, pause an offer, pause the whole program (stamps stop; existing stamps and unexpired rewards are
    kept and rewards can still be redeemed), and delete a member. Activity is built from the ledger so nothing can be hidden.
13. **No stamp for leaving a Google review.** Google does not tell us who reviewed, so it would be fakeable. Not built.
14. **Tenant isolation.** Every query on a `loyalty_*` table filters by the business resolved from the session or the
    slug, never from a client-supplied business id. The customer's own card is read from their signed session cookie.
15. **Plan end / downgrade.** Data is kept. Follow 5B for any purge decision (open). Account deletion deletes all
    `loyalty_*` rows with the business.

---

## 13. Business category (locked)

1. Every business has exactly one category: `food` (Restaurant & Café), `hotel` (Hotel) or `general` (Other business).
2. It is chosen in onboarding step 1 by selecting a card AND typing the category name in a full-screen warning popup.
3. It is locked at that moment. No screen, form, query string, saved browser value or API can change it.
4. A wrong choice is fixed only by Syehere support deleting and re-creating the account (documented, not built).
5. The business type must belong to the category: food `cafe` or `restaurant`; hotel `hotel`; general `salon`, `gym`,
   `retail` or `other`. A type outside the category is refused.
6. All locations share the business category; a new location never asks for one.
7. An unknown, missing or unreadable category is treated as `general` (fail closed).
8. Onboarding collects address, city, PIN code, business phone and a proof number by category (FSSAI for food;
   rooms plus GSTIN or a local licence for hotel; nothing for general). These are format checks only.

---

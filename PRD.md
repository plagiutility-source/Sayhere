# Syehere — Product Requirements Document

## 0. Technology Stack

| Component | Technology | Notes |
|---|---|---|
| Frontend | Next.js + Tailwind | |
| Auth | Firebase | Email/password + Google login |
| Database | Turso | SQLite/libSQL dialect — see schema.sql for tenant-isolation caveat |
| Email | Resend | Transactional + weekly reports |
| Payments | Cashfree | India-only for now — see section 2 |
| Storage | Cloudflare R2 | Business logos |
| AI | Groq (primary) + Google Gemini (fallback) | Review text generation, auto-reply text |
| Hosting | Vercel | Includes cron jobs for weekly reports + auto-reply |

Full credential list: see `.env.example`. Provider documentation references
for the build agent to pull from directly: see `provider-reference.md`.

## 1. Product Summary
A multi-tenant SaaS where business owners manage how customers leave reviews —
funneling happy customers to Google Reviews and unhappy ones to a private
feedback form instead. Fully self-service: a business owner should be able to
sign up, set up, and run the entire system with zero support from the SaaS team.

## 2. Target Market
Both India and Global for product usage, but **payments are India-only for now**
via Cashfree (₹ pricing). Global/USD payment support (e.g. Stripe) is deferred —
international customers can sign up and use the Free tier, but paid-plan
checkout is not yet available to them. Revisit this once Cashfree's
international coverage is confirmed or a second payment provider is added.

## 3. Core User Flows

### 3.1 Business Owner Flow
1. Sign up (email/password or Google/Firebase auth) — under 30 seconds
2. Onboarding wizard (4 steps):
   - Step 1: Category (Restaurant & Café, Hotel, Other business): chosen once, confirmed by typing the name in a full-screen warning popup, locked forever
   - Step 2: Business name, business type (only the types inside the locked category), tagline, address, city, PIN code, business phone, and a category proof (FSSAI for food, rooms plus GSTIN or licence for hotel)
   - Step 3: Upload logo OR auto-assign a default vector logo + color theme by business type
   - Step 4: Paste Google Review URL → system auto-generates the review funnel link
3. System auto-generates: QR code (with logo overlay) + short review link + NFC-compatible link
4. Dashboard is live immediately — no manual setup, no waiting on support

**QR code behavior (dynamic, not static):** the QR/NFC code encodes a permanent
redirect slug (`review_pages.slug`, e.g. `r/abc123`) — never the raw Google
review URL directly. The Google link, branding, and the review flow
behind that slug can change at any time without invalidating or requiring a
reprint of already-printed QR codes/table tents. This also enables
`scan_events.source` tracking (qr / nfc / link), which a static QR pointing
straight at Google would not allow.
- Open decision: when an owner hits "Regenerate" after changing their Google
  link, does it update the redirect target in place (recommended — keeps
  printed codes valid) or issue a brand-new slug (breaks anything already
  printed)? Default to in-place update; only issue a new slug when the owner
  explicitly adds a new location/QR.

### 3.2 Customer Flow ("the magic moment")
```
Customer taps NFC / scans QR
        ↓
"How was your experience?"   👍 Great        👎 Not great
        ↓                              ↓
        +---- both thumbs open the SAME page ----+
        ↓
How would you like to continue?
  • Continue on Google          (equal weight, clear, nothing hidden)
  • Contact the owner           (private message to the owner + our team)
        ↓                              ↓
Google screen:                    Private feedback form
"Post a review on Google"         (message + optional email)
button is ALWAYS visible,               ↓
plus "Write it for me"            Saved to dashboard; the owner and
→ a few short questions           our team are notified; the customer
(what did you have, spend,        then sees the appreciation message
who with, what you liked)         ("we truly appreciate you taking
        ↓                         the time to help us improve")
Review built ONLY from
those answers, [Copy review]
[Post to Google]
        ↓
Thank-you page + social links
```
No login required for the customer. No app install. Mobile-first, one tap to
copy a review, one tap to open Google.

**Fair by design (owner request, 2026-10-14).** Both thumbs land on the same
chooser, and the two choices carry equal visual weight — no dark patterns, no
hidden or greyed-out Google link. On the Google screen the plain "Post a review
on Google" button is always visible; the questions are an extra offer, never a
gate, and every question is optional. A customer who chooses the private
message always sees the appreciation message ("we appreciate you taking the
time to help us improve").

**Customizable landing page:** the page shown after the scan is the owner's **Customer page**
(section 5.5). By default it is exactly the flow above. Owners can optionally switch on tap-to-open
buttons under the review buttons (menu or price list, Wi-Fi, hours and contact, call, WhatsApp,
directions) and social icons. Each one can be removed on its own and the page re-flows automatically.
The review block always stays first.

### 3.3 Google Review Auto-Reply
- Integrates with the Google Business Profile API (OAuth per business)
- New reviews are detected, but replies are delayed ~24 hours (not instant),
  checked via a cron job running every few hours
- AI (Groq, primary; Gemini as fallback if Groq errors or times out) generates
  a reply based on star rating / sentiment
- **v1: set up through support.** The owner clicks Google review auto-reply, taps **Contact support** and fills a short request form; our team then connects it with them (PRD.md 5.4.3). Self-serve on/off and reply templates come later (5.4.3A)
- **Plan-gated:** available on Free, Pro and Enterprise only. On Starter the owner sees "Please upgrade your plan" and no form (see 5.4.3 and business-rules.md section 6)
- Requires two Google approvals (Basic API Access + OAuth verification) and a public homepage and Privacy Policy; see google-approval.md

## 4. Pricing (max 5 features shown per plan; free tier = all features, tightly limited usage)

| Plan | Price | Locations | Monthly Scans | Google review auto-reply |
|---|---|---|---|---|
| Free | $0 / ₹0 | 1 | 10 | Yes |
| Starter | $9.99 / ₹499 | 1 | 1,000 | **No** |
| Pro | $13.99 / ₹699 | 1 | 10,000 | Yes |
| Enterprise | Custom | Unlimited | Unlimited | Yes |

**When a business uses all its monthly scans, everything pauses: its QR code, NFC tag and review page (customers see a
neutral "temporarily unavailable" page), Google auto-reply and the weekly report, until the count resets on the billing
date or the owner upgrades.** Only the owner's dashboard and billing stay open. See business-rules.md section 1.

Only Enterprise has more than 1 location. **Google review auto-reply is available only on Free, Pro
and Enterprise; Starter does not include it** (rules: business-rules.md section 6).

All plans include: AI review generation, weekly email reports, and a customizable customer page
(menu/price list, links, contact and hours; quantity limits per plan, see business-rules.md
section 1). Google auto-reply is included on every plan except Starter.
Free tier exists purely so a prospective customer can see the whole system work,
not to run a real business on.

## 5. Dashboard Requirements (Owner)
- Plan status widget: current plan name, scans used / limit (progress bar), locations used / limit, and the date the scan count resets
- **Scan-limit banner:** when scans used reach the limit, a red banner on every dashboard screen: "Scan limit reached. Your QR page, auto-replies and weekly reports are paused until {date}. Upgrade to turn everything back on now." with an Upgrade button
- **Add location button** (dashboard header, Locations screen, brand preview): shown and enabled only when locations used < the plan's limit.
  On Free, Starter and Pro (limit 1) it is disabled with "Extra locations are available on the Enterprise plan" and a **Contact us** link
  (Enterprise is arranged by an admin, it cannot be bought at checkout). Enforced on the server too (business-rules.md section 1).
- Recent feedback feed (real-time), each item tagged Positive / Needs reply
- Review links: QR code, NFC link, direct link — downloadable/shareable
- Analytics: rating average, % positive, scan count, feedback intercepted count
- Billing section: current plan, upgrade/downgrade, cancel option, invoice history

### 5.1 Layout & Visual Design
_See `dashboard-ui-owner-dashboard.png` for the reference mockup (note: this
mockup was built before the final logo/palette below — regenerate with the
actual blue-green/yellow treatment before handing to design)._
- Shell: fixed left sidebar (Dashboard, Feedback, Analytics, Locations, Customer page,
  Loyalty / General: Billing, Settings) + top bar (search, notifications, avatar +
  business name). Sidebar chrome uses Syehere's own product palette — the
  logo's blue-to-green gradient, `#1D4ED8` → `#0E9F6E`, white/off-white nav
  text, with the yellow accent `#FFC61A` reserved for a single small mark
  (e.g. a status dot) — NOT per-business themed, so the product feels
  consistent regardless of which client is logged in. See brand-guide.md
  "Product Brand Identity" section. Only the content area picks up the
  business's own brand color.
- Logo: `syehere-logo-horizontal-v5.svg` in the sidebar header;
  `syehere-icon-logo-v5.svg` for favicon/collapsed-rail icon state.
- Stat cards (4-up grid): total scans, reviews collected, avg rating, pending
  feedback — each with a week-over-week delta, not just a raw number.
- Weekly scan activity: 7-day bar chart, one day highlighted (busiest day).
- Positive rate: circular gauge (ring + %), not a bar, for at-a-glance scannability.
- Recent feedback: avatar-initial rows with a colored status pill (Positive /
  Needs reply), not a plain table.
- Engagement extras: streak banner (e.g. "14-day streak with no negative
  reviews") and a "review of the week" callout with a one-tap social-share
  button — intended to make the dashboard something owners want to check, not
  just a reporting screen.

### 5.2 Detailed Layout & Component Specification
This section defines structure, spacing, sizing, and behavior only — color
values are intentionally excluded (see section 8.1).

**Grid & shell**
- Two-column shell: fixed sidebar + fluid content area. Sidebar width: 240px
  desktop, collapses to icon-only rail (64px) between 1024–1280px viewport,
  becomes an off-canvas drawer (hidden by default, hamburger-triggered) below
  1024px.
- Content area max-width: 1200px, centered, with 24px horizontal padding on
  desktop, 16px on tablet, 16px on mobile.
- Top bar height: 64px fixed, sticky on scroll. Contains: search (left,
  320px max-width), notification bell + avatar/business name (right).
- Vertical rhythm inside content area: 24px gap between major sections
  (header block → stat cards → chart/gauge row → feedback list).

**Typography scale**
- Page title ("Dashboard"): 20px / weight 500 / line-height 1.3
- Section subtitle (under page title): 13px / weight 400 / text-secondary
- Card label (e.g. "Total scans"): 12px / weight 400, uppercase NOT used —
  sentence case
- Card value (the big number): 22–24px / weight 500 / tabular figures
- Delta text ("+4pts vs last week"): 11px / weight 400
- Nav item label: 13px / weight 400 (500 when active)
- Body copy in lists/rows: 13px / weight 400
- Never use more than two font weights on a single screen (400 regular,
  500 medium) — no bold (600/700) anywhere in the UI.

**Spacing scale** (use consistently, do not introduce arbitrary values)
- 4 / 8 / 12 / 16 / 20 / 24 / 32 px — component-internal gaps and padding
  should always snap to this scale.
- Card internal padding: 16–20px.
- Gap between cards in a grid: 12px.
- Gap between icon and label (nav items, list rows): 8–10px.

**Stat card grid**
- Desktop: 4 columns, equal width, 12px gap.
- Tablet (768–1024px): 2 columns x 2 rows.
- Mobile (<768px): single column, stacked, full width.
- Each card: fixed min-height 88px so the grid doesn't jump when delta text
  is present vs. absent.

**Charts & gauges**
- Weekly bar chart: fixed height 160–180px container; bars capped at 24px
  width, 4px rounded top corners, flush baseline (no rounding at bottom).
- Gauge (positive rate): fixed 80–96px diameter ring, 8–10px stroke width,
  percentage centered in 15–16px medium weight text.
- Both chart and gauge live in equal-height cards side by side on desktop
  (roughly 60/40 width split); stack vertically on mobile.

**Feedback list rows**
- Row height: 44–48px including padding.
- Layout per row: 26px avatar-initial circle → name + one-line detail
  (truncate with ellipsis, never wrap to a second line) → status pill
  right-aligned, fixed width so pills align in a column.
- Max 5 rows visible before a "View all" link/button; no infinite unpaginated
  list on the dashboard itself.

**Sidebar nav**
- Icon size: 16–18px, consistent across all nav items.
- Active item: distinguished by a filled/tinted row background and a left
  accent bar (3–4px), not by icon color alone (accessibility: don't rely on
  color-only state).
- Section labels ("Menu", "General"): 10px, letter-spacing 0.05em, uppercase
  — the one deliberate uppercase exception, reserved for these group labels
  only.
- Bottom-of-sidebar space reserved for a single promotional or upgrade
  card max — do not stack multiple promo cards (matches "don't add
  unnecessary" direction from earlier).

**States to design for (often missed)**
- Empty state: dashboard with zero scans yet (new signup) — replace stat
  cards' delta text with "No data yet" and the chart/gauge with a light
  placeholder + a prompt to share the QR code, not a broken 0%/blank chart.
- Loading state: skeleton cards (shimmer or flat gray blocks matching each
  card's exact dimensions) — never a layout shift when real data loads in.
- Overflow state: business name / email long enough to overflow the top bar
  avatar area — must truncate with ellipsis, never wrap or push the
  notification bell off-screen.
- Error state: if analytics fail to load, show an inline retry affordance
  per card/section, not a full-page error that blocks the rest of the
  dashboard.

**Responsive behavior summary**
| Breakpoint | Sidebar | Stat cards | Chart + gauge |
|---|---|---|---|
| ≥1280px | Full (240px) | 4 columns | Side by side |
| 1024–1279px | Icon rail (64px) | 4 columns | Side by side |
| 768–1023px | Off-canvas drawer | 2x2 grid | Side by side |
| <768px | Off-canvas drawer | 1 column | Stacked |

**Accessibility & interaction**
- Minimum tap target: 40x40px for any icon-only button (bell, nav items in
  collapsed rail).
- Focus states must be visible (outline/ring) for keyboard navigation across
  nav items, buttons, and inputs — do not remove default focus styling
  without replacing it.
- All icons that convey meaning (status pills, streak flame, etc.) must pair
  with text, never rely on icon/color alone.

### 5.3 Review Link / QR Setup Screen
_See `dashboard-ui-qr-setup.png` for the reference mockup._
- Owner pastes their Google review link once; "Generate"/"Regenerate" produces:
  a QR code (logo overlay in the business's brand color), a short link
  (`syehere.co/{slug}`), and a separate NFC tap link.
  - Short link and NFC link are kept distinct: the short link is for printed
    material, the NFC link is what's written to the physical NFC tag.
- Download options: PNG (digital use), PDF (print-shop ready), SVG (embeddable
  in the owner's own signage design).

### 5.4 Settings (Owner)
The sidebar item **Settings** (under "General") opens one `/settings` page with 5 tabs, using the
same shell, spacing and typography rules as 5.1/5.2. Every tab has its own **Save changes**
button, inline validation errors, a success toast, and a "Discard changes?" prompt when leaving
with unsaved edits. Each tab has skeleton loading and an inline retry on load failure.

| Tab | Purpose |
|---|---|
| 1. Business profile | Name, type, tagline, time zone, logo |
| 2. Appearance | Colors (section 8.1, unchanged) |
| 3. Auto-reply | v1: Contact support and request form, or "Please upgrade your plan" on Starter (5.4.3). Later: on/off + reply templates (5.4.3A) |
| 4. Google connection | **Tab is later, hidden in v1.** In v1 the same connect flow (5.4.4) is started from the Connect Google button on the Auto-reply status card once support has marked the request Contacted |
| 5. Account & security | Email, password, delete account (5.4.5) |

Social links are no longer a Settings tab. They are edited on the **Customer page** editor (5.5.4).

**5.4.1 Business profile**
| Field | Rules |
|---|---|
| Business name | Required, max 100 chars, plain text |
| Category | Read-only line with a lock badge: `Restaurant & Café`, `Hotel` or `Other business`. Fixed when the account was created and cannot be changed by any screen or API (business-rules.md section 13) |
| Business type | Read-only category plus a type dropdown limited to that category (Café or Restaurant; Hotel; Salon, Gym, Retail or Other). The category can never be changed. If `color_source = preset`, changing the type re-applies that type's colors. If `custom`, colors are untouched (business-rules.md section 10). Show a note saying which will happen |
| Tagline | Optional, max 120 chars |
| Time zone | Dropdown (default from browser); used for "Open now" on the customer page and for weekly report timing |
| Logo | Upload / replace / **Remove logo** (removing returns to the default vector logo for the business type and deletes the file from R2). Same upload rules as PROGRESS.md Phase 2 |
| Google review link | **Read-only here**, with a "Manage in Locations" link. It is edited only on the Review links screen (5.3), so there is one place to change it |

Saving takes effect on the review page immediately. No new slug is ever created here.

**5.4.2 Social links**: moved to the Customer page editor, see 5.5.4.

**5.4.3 Auto-reply: request setup through support (v1)** (Google review replies; see business-rules.md section 6)

In v1 the owner does not switch auto-reply on themselves. They ask our support team to set it up.

*Where the owner clicks.* Two entry points open the same screen: the **Google review auto-reply** card on the dashboard
(shows the current status and a **Manage auto-reply** button) and **Settings → Auto-reply**.

*By plan:*
| Plan | What the owner sees after clicking |
|---|---|
| Starter | "Google review auto-reply is available on the Pro plan. Please upgrade your plan." with an **Upgrade plan** button (goes to Billing). No Contact support button and no form. |
| Free, Pro, Enterprise | A short explanation ("We set up Google review auto-reply with you. Contact support and our team will get it running.") and a **Contact support** button that opens the request form page. |

*Request form page* (`/settings/auto-reply/request`, owner login required). Every field is required:
| Field | Rules |
|---|---|
| Your name | 2 to 80 characters |
| Business name | 2 to 100 characters, prefilled from Business profile and editable |
| Type of business | Dropdown: Café, Restaurant, Salon, Gym, Retail, Other; prefilled from Business profile |
| Registered email ID linked with your Google Business Profile | Valid email, max 254. Helper text: "The Google account email you used to create your Google Business Profile." |
| Phone number | 7 to 15 digits, optional leading `+` (same rule as Call and WhatsApp) |

Buttons: **Send request** and **Cancel**. Inline validation, "Discard changes?" prompt if leaving with edits.

*After sending:* a confirmation screen, "Request received. Our team will contact you within 48 hours." The Auto-reply screen
then shows a status card instead of the button: **Pending**, **Contacted**, **On** (auto-reply is live) or **Closed**,
with the request date. While a request is Pending or Contacted the owner cannot send another one. After **Closed** they can send a new one.

*What happens next (decided):* the admin sees the request on `/admin/auto-reply-requests` (admin-spec.md) and **contacts the owner by
email or phone call within 48 hours** (using the email and phone from the form; the admin records which one was used). The team
connects the owner's Google Business Profile with them during that contact. Google only lets the owner's own Google account grant
access, so the owner signs in to Google themselves while support guides them. When the admin marks the request **Contacted**, a
**Connect Google** button appears on the owner's Auto-reply status card. It starts the Google OAuth flow and account/location
picker described in 5.4.4 (this is the only place the connect flow is used in v1; the Google connection tab stays hidden).
Once the connection shows Connected, the admin marks the request **Active**. Only that admin action sets
`businesses.auto_reply_enabled = 1`.
Until then the auto-reply job skips the business. The owner gets two emails: "Auto-reply request received" and "Auto-reply is on"
(email-templates.md 13 and 14).

*Rules:* the plan gate is enforced on the server (Starter gets 403 on the form page and on submit). The auto-reply job still skips a
business that has hit its scan limit, or whose plan no longer includes auto-reply (business-rules.md sections 1 and 6).

**5.4.3A Self-serve auto-reply settings (later, NOT built in v1)**
Kept for when Google approval is done and support no longer has to set each business up (google-approval.md). Do not build in v1.
0. **Pauses at the scan limit.** While the business has used all its scans, auto-reply is paused (business-rules.md section 1).
   Plan gate: available on Free, Pro and Enterprise only (`plans.<plan>.google_auto_reply`). On Starter the whole
   Auto-reply screen is read-only with a "Google auto-reply is available on the Pro plan" message and an Upgrade button;
   the master switch and templates cannot be changed. Enforced on the server too (business-rules.md section 6).
1. **Master switch** (`businesses.auto_reply_enabled`). Disabled with "Connect Google first" if Google is not connected.
2. Info line: "Replies are posted 24 to 48 hours after a review, never instantly."
3. Three template cards:

| Card | Ratings | Default tone |
|---|---|---|
| Positive | 4 and 5 stars | Enthusiastic thanks |
| Neutral | 3 stars | Acknowledge + commit to improve |
| Negative | 1 and 2 stars | Apology + invite to contact directly |

Each card has: a **mode toggle** (`AI-written` default, or `My template`); a template text box
(only in `My template` mode; max 1000 chars, plain text); placeholder insert buttons for
`{{reviewer_name}}` and `{{business_name}}` (any other `{{...}}` is rejected); a **Preview**
button (sample reviewer name); and **Reset to default**.

- `My template` mode: the job fills the placeholders and posts that text. No AI call is made.
- `AI-written` mode: unchanged (Groq first, Gemini fallback). Customer feedback text is never sent to AI.
- If a template is empty or invalid at post time, fall back to `AI-written` for that reply; never skip a reply.
- Stored in `businesses.auto_reply_templates` (JSON text):
  `{"positive":{"mode":"ai","text":""},"neutral":{"mode":"ai","text":""},"negative":{"mode":"ai","text":""}}`

**5.4.4 Google connection (the flow is built in v1 and started from the status card in 5.4.3; the Settings tab itself is later and hidden)**
Shows Connected (with the Google account email), Needs reconnect, or Not connected.
- Above the **Connect** button show the in-product disclosure (google-approval.md section 8). **Connect** starts Google OAuth
  (separate from Firebase "Sign in with Google"; that login does not give Business Profile access).
- After connecting, the owner **picks the Business Profile account and location** for each of their Syehere locations.
  Each Google location can be mapped to one Syehere location only.
- **Needs reconnect** (Google revoked or expired access): red banner on the dashboard and here, auto-reply paused, one email to the owner.
- **Disconnect** requires re-authentication within the last 10 minutes, revokes the token at Google, deletes stored tokens and
  mapped locations, and turns auto-reply off. OAuth tokens are never returned to the browser.
- If the platform's Google API access is not yet approved, the Connect button is disabled with "Google auto-reply is being enabled" (admin-visible flag), never a raw error.

**5.4.5 Account & security**
Change email and change password (re-authentication required); **Log out of all devices**;
**Delete account** (re-authentication required; behavior per security-and-reliability.md section 7;
show what will be deleted and require typing the business name to confirm).

### 5.5 Customer Page (owner-customizable landing page)
The page a customer lands on after scanning the QR or tapping the NFC tag is the **Customer
page**. It has a default (the review flow) and the owner may extend it, optionally, with
**tap-to-open buttons** (menu or price list, Wi-Fi, hours and contact, call, WhatsApp, directions)
and **social icons**. The home page stays short: each button opens its own screen, or its own
action, instead of listing everything on one long page. The owner never has to touch it; nothing is
required. Exact screens and wireframes: `customer-page-ui-spec.md`.

**5.5.1 Principles**
1. **Default first.** With no customization the page is: business header (logo, name, tagline),
   the review block (thumbs up / thumbs down), and social icons if the owner added any. Nothing else.
2. **The review block is mandatory and always first.** It cannot be turned off, removed or moved
   below other blocks (an announcement banner may sit above it). Buttons and icons appear below it,
   so customization never lowers review conversion.
3. **Tap-to-open, not one long page.** The home page shows a grid of icon buttons. Menu, Wi-Fi and
   Hours and contact open their own screen with a back arrow. Call, WhatsApp and Directions act
   immediately (phone call, WhatsApp chat, Google Maps) with no extra screen.
4. **Every button and every social icon is individually removable.** Each one has an
   **Activate / Active** control (5.5.3). Turning one off hides it and the page re-flows
   automatically (5.5.5). Its saved value is kept, so turning it back on needs no retyping.
5. **Structured fields only.** Owners fill fields in fixed templates. No HTML, CSS, JavaScript,
   Markdown or embeds, ever (security-and-reliability.md section 4C).
6. **No galleries or owner photos on the customer page.** The one upload is a menu PDF used
   to build the list (5.5.6): it goes directly to private storage, is used only for that import and
   is deleted within 24 hours, and is never shown, linked or served to customers. The images are the
   business logo (Settings) and the AI-generated dish photos on menu items that WE generate and store
   (5.5.6, AI_MENU_PHOTOS.md). Owners never upload photos or paste image links.
7. **Same QR and NFC, always.** Editing the page never changes the slug (business-rules.md 9).
8. **Quantity limits by plan, not feature locks.** Every plan can use every block type; plans differ
   only in how much they can add (business-rules.md section 1 and 11). The one plan-gated feature in the
   product is Google review auto-reply (PRD.md section 4).
9. **Fast.** The public page is mobile-first and must feel instant (brand-guide.md Mobile-First Rules).

**5.5.2 Editor screen** (`/customer-page`, sidebar item **Customer page**, under "Menu")
- Desktop: two columns. Left = editor. Right = sticky **live phone preview** (375 px wide frame)
  that updates on every keystroke and every Activate tap. Below 1024 px: a **Preview** button opens
  the preview in a drawer.
- Left column, top to bottom: "Suggested for your business" chips (5.5.9), the **Buttons** list, the
  **Social icons** list, and a locked **Review buttons** row ("Always shown").
- Each button or icon is one row: its automatic icon, its name, an optional status badge, and the
  **Activate / Active** control. When active, the row expands to show its field(s) and a one-line
  helper text (5.5.4).
- Top bar: location selector (only when the business has more than 1 location), **Save changes**,
  **Discard**, **Reset to default**, **View live page** (opens the real page in a new tab), and
  usage meters (for example "Menu items 12 / 60").
- Save publishes immediately (no draft state). Leaving with unsaved edits shows "Discard changes?".
- Empty, loading and error states as in 5.2 (skeletons, inline retry, never a blank editor).
- **Reset to default** asks for confirmation and clears the page customization for that location.
  Social icons are kept (they are business-level).

**5.5.3 Activate control (owner side)**
One control style for every on/off choice in the editor, including "Mark sold out" on a menu item.
- **Off:** white fill, 1.5 px black border (the primary text color token, so it stays visible in dark
  mode), label **Activate**.
- **On:** solid blue fill `#1D4ED8`, white text and a tick icon, label **Active**.
- Minimum height 36 px, 8 px radius, 13 px medium-weight label. Exposed as a toggle button
  (`aria-pressed`). The state is never shown by color alone: the label and tick change too.
- No white-on-white or grey "ghost" toggles anywhere in the owner editor.
- **Status badge** next to the control (small amber pill): **Needs a link** when the item is Active but
  its required field is empty; **Check link** when the value is invalid. An Active item with a missing
  or invalid value is **not shown to customers** and cannot be saved as valid content (the editor
  shows the inline error and blocks Save until it is fixed or the item is turned off).

**5.5.4 Buttons, social icons and their fields**
Icons are automatic (Tabler outline set). The owner never picks an icon.

| Item | Auto icon | Owner enters | What the customer gets on tap | Check |
|---|---|---|---|---|
| Menu (label adapts: Menu, Services and prices, Products) | by business type: café cup, restaurant fork and knife, hotel bell, salon scissors, gym dumbbell, retail bag, other list | Builds the list manually or imports a menu PDF with AI (5.5.6). No link option | Opens the Menu screen | At least one item with a name |
| Wi-Fi (Phase D) | wifi | Network name (max 32), password (max 63) | Opens a screen with the network, password and **Copy password** | Network name not empty |
| Hours and contact | clock | Phone, address, weekly hours, optional note (5.5.7) | Opens a screen with "Open now" or "Closed", hours, address and a Call button | Phone valid if entered; phone or address present |
| Call | phone | Phone number | Starts a phone call (link built by the server) | 7 to 15 digits, optional leading `+` |
| WhatsApp | brand-whatsapp | WhatsApp number | Opens a WhatsApp chat (`wa.me` link built by the server) | 7 to 15 digits, optional leading `+` |
| Directions | map | Address text, or a Google Maps link | Opens Google Maps | Address max 200; a link must match the Google Maps allowlist |
| Pay now | currency-rupee | **UPI ID** (letters, digits, dot, dash, underscore, then `@`, then letters only; max 50) and **Name shown to customers** (required, max 30) | Opens the Pay screen: payee name, UPI ID, one **Pay now** link and a **Copy UPI ID** fallback | UPI ID matches the format and the name is present; shown only when On AND valid |
| Custom link button (every plan and business type, no plan limit; 5.5.8) | link | Label (max 30) and https link | Opens the link | https only, security-and-reliability.md 4C |
| Instagram | brand-instagram | Link | Opens the link | https, host `instagram.com` |
| Facebook | brand-facebook | Link | Opens the link | https, host `facebook.com`, `fb.com` |
| YouTube | brand-youtube | Link | Opens the link | https, host `youtube.com`, `youtu.be` |
| X | brand-x | Link | Opens the link | https, host `x.com`, `twitter.com` |
| Website | world | Link | Opens the link | any `https://` URL |

Rules for every link field:
- `https` only. Reject `http:`, `javascript:`, `data:`, and URLs with credentials. Max 2048 chars.
- Social hosts must match the platform allowlist (an Instagram field rejects a Facebook link).
  Website and custom links accept any https host, except `localhost` and raw IP addresses.
- Validation runs as the owner types (inline error under the field, plain language, for example
  "Link must be on instagram.com") and again on the server at save time.
- Empty or invalid = the item is hidden from customers.
- Phone numbers are stored as digits with an optional `+`. The server builds `tel:` and `wa.me` links;
  the owner never types a link for Call or WhatsApp.
- Links render with `target="_blank" rel="noopener noreferrer nofollow"`.
- WhatsApp is a **button** only (not also a social icon). Social icons are: Instagram, Facebook,
  YouTube, X, Website.

**Pay button rules** (owner decision, 2026-10-02 — the authoritative spec for this item):
- The app builds the ONLY allowed link, `upi://pay?pa=<UPI ID>&pn=<payee name>&cu=INR`, from the
  validated UPI ID and payee name, every value URL-encoded. The owner never types a link; no amount
  parameter and no other `upi:` URL is ever allowed.
- Limits decided by the owner: UPI ID max 50 characters, payee name required max 30.
- No list of UPI apps and no device detection: the phone decides what opens. Where the link cannot
  open (desktop, some in-app browsers), the quiet **Copy UPI ID** button is the fallback.
- Syehere never handles money: no amount, no payment confirmation, no payment status. The Pay screen
  always shows the payee name and UPI ID so the customer can verify them (anti-scam).

**5.5.5 Adaptive layout (nothing to configure)**
Home page order: announcement banner (optional, above the review block), header, review block,
button grid, social icon row.
- **Button grid:** 2 columns. Only Active items with a valid value are counted, `n` = that count.
  - `n = 0`: the grid is not drawn at all.
  - `n = 1`: one full-width button.
  - `n` even: rows of two.
  - `n` odd (3, 5, ...): rows of two, and the last button stretches to full width.
  - Order is fixed in v1: Menu, Wi-Fi, Hours and contact, Call, WhatsApp, Directions, **Pay now**,
    then custom link buttons. (Owner reordering is out of scope for v1.)
  - Each button: icon above the label, at least 70 px tall (50 px for a stretched last button),
    at least 44 px tap target, business colors.
- **Social icons:** one centered row, wraps on narrow phones, 44 x 44 px tap targets. Hidden when
  none are Active.
- Turning any item on or off re-flows the page instantly in the preview and on the live page after Save.
- Colors come from `primary_color` / `secondary_color` (section 8.1). Page background, star color, and
  text-on-primary come from `getBrandTheme()` (business-rules.md section 10) and adjust automatically for
  every business type and for custom colors.
- Minimum tap target 44 x 44 px; body text at least 16 px; one-tap Call, WhatsApp and Copy actions.

**5.5.6 Menu / Services and prices (PDF import or manual builder, optional)**
There is no menu link option and no photo upload. The owner either uploads a **menu PDF** (max 8 MB)
that our AI reads into lists, items, prices and details for review before saving, or builds the list
by hand; everything except the item name is optional. The PDF goes directly to private storage, is
used only for that import and is deleted immediately after extraction (within 24 hours at the latest);
it is never stored with the page, served to customers or linked anywhere. An item can also have one
**AI-generated dish photo** (below).
- **PDF import:** the owner can uncheck anything AI found before it is added. Imported photos are
  created automatically for up to the plan's remaining AI-photo credits and the daily cap; all the
  credits for one import are reserved as a single batch, and a failed batch refunds every credit. The
  import never exceeds the plan menu-item limit or the 12-list cap. In Stage 1 the extraction step is
  a labelled demo; the upload, review, limits and save are real.
- Label adapts to the business type: **Menu** (café, restaurant, hotel), **Services and prices** (salon,
  gym), **Products** (retail, other). The owner can rename the title (max 40 chars).
- **Lists (categories):** up to 12, each with a name (max 40), added with **Add category**.
- **Items** inside a list, added with **Add item**:
  - Item name (required, max 60) and price text (optional, max 20; free text so "₹180", "from 500"
    or "Ask us" all work).
  - **Add details (optional)** reveals: **What's in it** (max 160, for example ingredients or
    preparation: "Grilled bread, cucumber, tomato, cheese, mint chutney"), **Tag** (None, New,
    Popular, Veg, Spicy) and **Mark sold out**.
  - Remove an item or a list with its remove icon.
- Sold out items stay on the menu, greyed out with a "Sold out" chip; nothing is deleted.
- Item limit per location comes from the plan (business-rules.md section 1). The counter shows
  "Items 4 / 60". At the limit, Add item shows "Item limit reached. Upgrade for more items."
- **Customer view:** each list is a heading with its items below. Each item shows the name, tag chip
  and price, with the "What's in it" text underneath in small type. Items without a name are ignored.
- The **Menu button is shown to customers only when at least one item has a name.**
- Prices on the public customer page are display text; there is no ordering or online payment.
- Drag-and-drop reorder of lists and items is nice-to-have and may follow after v1 launch.
- **AI dish photo (per item, optional).** Full spec: AI_MENU_PHOTOS.md.
  - **Add photo** on an item (needs an item name first) opens a dialog. The server makes a
    professional food photo from the item name and "What's in it"; the owner never writes a prompt.
  - The owner sees the photo first and chooses **Use this photo**, **Make another** or **Discard**.
    Nothing is attached until they approve. **Change photo** and **Remove photo** follow.
  - Every photo uses one plan credit: Free 3 (one-time trial), Starter 15 / month, Pro 40 / month,
    Enterprise 100 / month. There is no unlimited tier. A failed generation refunds the credit.
    Extra caps (daily per business, cooldown, global budget, admin switches) are in
    AI_MENU_PHOTOS.md section 4. Counter shown in the editor: "AI photos 3 / 3 left".
  - **Customer view:** the item shows a small thumbnail; tapping it opens the photo full screen
    (**Fit** by default, **Fill screen** to cover the whole phone), with the name, price and details.
    The page says photos are AI-generated for illustration. Items without a photo are unchanged.
  - Existing photos stay after a downgrade; only new generation stops.

**5.5.7 Contact and hours, Wi-Fi**
- Phone and WhatsApp number: digits with optional leading `+`, 7 to 15 digits (E.164 style).
- Address: plain text (max 200). The server builds a Google Maps search link from the address, or the
  owner pastes a Google Maps link (host allowlist `google.com/maps`, `maps.app.goo.gl`, `goo.gl/maps`).
- Hours: for each weekday, open and close time (24h `HH:MM`, allow two ranges) or **Closed**; plus an
  optional note (max 100, for example "Closed on public holidays"). The screen shows "Open now" or
  "Closed" computed in the business's time zone (a time zone dropdown lives in Business profile).
- Wi-Fi (Phase D): shows the password to anyone who opens the page. The editor warns the owner
  before it can be activated (business-rules.md 11, rule 15).

**5.5.8 Removed and restricted options**
- **Photo gallery: removed** for every business type (no owner image uploads on the customer page).
  The only photos are AI-generated menu item photos (5.5.6).
- **Menu link / external menu: removed.** Menus are imported from a PDF or built manually (5.5.6);
  an external menu link is never accepted.
- **Order online and Book now are not built-in buttons** for any business type. An owner who wants
  them adds them as custom link buttons.
- **Custom link buttons are available on every plan and for every business type** (café, restaurant,
  salon, gym, retail, other, hotel). The owner can add as many as they need, each with a label and an https
  link (for example "Order online", "Book now", "Join / Membership"). There is **no plan limit**; only
  the hard security cap applies (security-and-reliability.md 4C). They follow the same Activate control
  and https rules as every other button.

**5.5.9 Suggested items by business type** (chips only; nothing is auto-enabled)
| Type | Suggested |
|---|---|
| Café | Menu, Wi-Fi, Hours and contact, Directions, Instagram |
| Restaurant | Menu, Hours and contact, Call, Directions, Instagram |
| Hotel | Menu, Breakfast, Mains, Laundry, Spa, Hours and contact, Directions |
| Salon | Services and prices, Hours and contact, Call, WhatsApp, Directions, Instagram |
| Gym | Services and prices, Hours and contact, Call, "Join / Membership" link, Instagram |
| Retail | Products, Hours and contact, Directions, Instagram |
| Other | Hours and contact, Instagram, Website |

**5.5.10 Thank-you page**
After a happy review or private feedback, show the thank-you message (optional, max 160), the social
icons, and any custom link buttons.

**5.5.11 Plan limits** live in the `plans` setting under a `page` object per plan
(`menu_items`, and `custom_links`, which is `null` = no plan limit on every plan) and are read via `getPlans()`; see business-rules.md section 1. Hard
security caps (security-and-reliability.md 4C) apply on every plan, including Enterprise.

**5.5.12 Build phases** (PROGRESS.md Phase 4B)
- **A:** editor shell, Activate control, adaptive grid and preview, announcement, thank-you message,
  social icons, hours and contact, Call, WhatsApp, Directions, custom link buttons (all business types).
- **B:** manual menu / price list builder and its screens, business-type suggestions, downgrade behavior.
- **C:** multi-location pages and "Copy from another location" (only Enterprise has more than 1 location).
- **D:** Wi-Fi block and per-block analytics (menu views, link clicks, call taps).

**5.5.13 Data model**
- `review_pages.page_config` (JSON text, one per location; `null` = default page), with
  `page_config_version` and `page_updated_at`. Validated on every write by one shared zod schema.
  Shape (every button has `on` plus its own fields; an item is shown only when `on` is true and its
  value is valid):
  ```
  { "announcement": {"on": true, "text": "", "end_date": null},
    "thank_you": "",
    "buttons": {
      "menu":       {"on": true, "title": ""},
      "wifi":       {"on": false, "ssid": "", "password": ""},
      "hours":      {"on": true, "phone": "", "address": "", "week": {...}, "note": ""},
      "call":       {"on": false, "phone": ""},
      "whatsapp":   {"on": false, "phone": ""},
      "directions": {"on": true, "value": ""},
      "pay":        {"on": false, "upi_id": "", "name": ""},
      "custom_links": [{"on": true, "label": "", "url": ""}]   // every plan and business type; no plan limit
    },
    "menu": {"categories": [{"name": "", "items": [
      {"name": "", "price": "", "details": "", "tag": null, "sold_out": false}]}]} }
  ```
- `businesses.social_links` (JSON text) for social icons, business-level, allowlisted keys only:
  `instagram`, `facebook`, `youtube`, `x`, `website`, each as `{"on": true, "url": ""}`.
- Admins can hide a location's custom content without deleting it (`review_pages.page_custom_hidden`),
  which makes the page fall back to the default (admin-spec.md).
- Analytics (Phase D): `page_events` table, pruned at 90 days.

### 5.6 Public marketing site (required for Google OAuth verification)
Public pages on the production domain, no login needed, HTTPS:
- `/` **Homepage**: Syehere name and logo (same as the Google consent screen), a clear description of what the product does
  (review funnel, QR/NFC, AI review text, auto-reply to Google reviews), pricing summary, links to Privacy Policy and Terms in the header or footer, and a support email.
  It must not be only a login page.
- A short **"How we use your Google data"** block on the homepage (or a clearly linked section of `/privacy`): what we access (account and location names, reviews of the chosen location), why (show reviews, post replies the owner enabled), that we do not sell it or use it for ads or AI training, that owners can disconnect or revoke any time, and where to send deletion requests (support email). Must match the Privacy Policy and the consent screen wording.
- **Cashfree activation pages (see cashfree-approval.md):** `/about` (what Syehere is, registered business name), `/contact` (one support email + one valid phone number + registered address), `/pricing` (Free, Starter and Pro with price in INR, locations, monthly scans, auto-reply availability, billing cycle and taxes; Enterprise shown as "Contact us" with no price. Values come from `getPlans()`, so the page always matches what Cashfree charges), `/refund-policy` (built from legal-pages.md Payment and Cancellation policies, plus "digital service, no physical delivery"). The **registered business name, support email and phone** appear in the footer of every public page.
- `/privacy`, `/terms`: public, no login, same domain as the homepage; the Privacy Policy includes the Google-data section from google-approval.md section 8.
- Homepage and Privacy Policy URLs are exactly the ones entered on the Google consent screen.
- The homepage may be a simple static Next.js page reusing the brand guide; it is separate from owners' customer pages.

### 5.7 Loyalty program (stamp card + rewards)
Rules: business-rules.md section 12. Tables: schema.sql "LOYALTY PROGRAM". Code: `lib/loyalty/rules.ts`.

**Goal:** let a business reward regulars with a digital stamp card, with no way to fake a stamp.

**Customer (on the customer page, `/r/[slug]`)**
- A **Loyalty card** tile appears first in the button grid while the owner's program is on.
- Not joined: a short pitch ("Collect N stamps, get a reward"), the reward names, an email field, then a 6 digit code
  emailed to that address. After confirming, the card opens and stays signed in on that device.
- **Card:** N stamp circles (filled, dashed empty, a gift icon on the last), "x of N", "n more stamps to your reward",
  **Get a stamp**, **My rewards**, the list of rewards they can win, and "Not you? Use another email".
- **Get a stamp:** shows a 6 digit code with a 60 second countdown (staff enter it) and a field for the counter code
  (customer enters it), depending on the owner's mode. Returns to the card with "Stamp added" when done.
- **Full card:** **Choose your reward** lists the owner's active offers; the customer picks one and taps **Claim**.
  The choice is final; the reward is valid for the owner's number of days.
- **My rewards:** each reward with a status (Ready to use, Used, Expired, Cancelled). A ready reward shows its code, the
  expiry date and days left, and works once.
- Paused program: "Loyalty is paused right now. Your stamps and rewards are safe."

**Owner (`/loyalty`, new item in the sidebar, tabs):**
- **Overview:** setup checklist, stats (members, stamps, rewards chosen and used), per-reward and per-staff tables.
- **Stamp mode:** staff PIN, then Give a stamp (customer's code), the Counter code, and Redeem a reward (look up, then confirm).
- **Rewards:** add, edit, pause, delete up to 5 active offers (title, terms, type, optional monthly limit).
- **Staff:** add staff with a PIN, change a PIN, turn a person on or off.
- **Members:** list with card progress and rewards ready; delete a member.
- **Activity:** every stamp and reward, newest first; void a stamp, cancel an unused reward, each with a reason.
- **Settings:** program on/off, stamps per card, hours between stamps, stamps per 24 hours, reward validity days, and
  how a stamp is given (both, staff enter the customer's code, customer enters the counter code).
- The same program on/off switch also appears in the **customer-page editor** as the "Loyalty card" row (first in the
  Buttons list, applied immediately), so the owner can hide the tile without leaving the page they are editing
  (owner request, 2026-10-14).

**Not in v1:** points per amount spent, a QR/camera scan of the codes (the codes are typed in Stage 1; Stage 3 adds QR using
the `qrcode` package already listed in provider-reference.md), Apple/Google Wallet passes, SMS or WhatsApp verification,
birthday or win-back messages, stamps for Google reviews.

### 5.8 Table & room QR ordering (café, restaurant, hotel)
Merged 2026-11-02. Only businesses whose type is `cafe`, `restaurant` or `hotel` see this feature;
`salon`, `gym`, `retail` and `other` see no new navigation, page, card or QR control.

**Owner**
- **Orders** (`/orders`) and **Tables/Rooms** (`/rooms`, labelled "Rooms" for a hotel) appear after
  Locations in the sidebar. The existing dashboard live layer adds the request bell, order-bell sound
  toggle and a "(N) Live table request" title while requests wait.
- Each location holds up to 12 tables/rooms. A spot has a name, a permanent code and its own QR
  (`/r/<slug>/<code>`); it can be paused (the printed code stays valid and shows "not available") and
  renamed. The Tables/Rooms QR panel lives on **Locations**, and a **Tables/Rooms page** tab in the
  Customer page editor edits the announcement, thank-you, Wi-Fi, menu title, hours/contact, call,
  directions and one custom link.
- Orders screen: accept (`new` → `preparing`), mark served, bill & payment, cancel (only from `new`),
  direct punch (staff order with no table), add/rename spots and manage waiters.
- Dashboard and Analytics gain an ordering section **below** the existing cards/charts: orders,
  earnings, average bill, collected, open tables, a 7/30/90-day bar chart and recent bills. Existing
  cards, numbers and charts are unchanged.

**Customer**
- Scanning a spot QR opens that table/room page: the business header, review block, menu from the
  Customer page, cart and checkout (name, optional phone, guests, waiter choice), or a join gate when
  a bill is already open.
- Joining an open bill needs the host's approval and a 6-digit code (5 minutes, 5 attempts); the
  request itself expires after 2 minutes. A reorder adds a round to the same bill.
- Calling a waiter or asking for the bill creates one live request for the spot; the owner resolves it
  from the Orders screen. When the counter sends the bill it appears on the customer's phone; payment is
  recorded by staff (Cash, UPI or Card) and **no money moves online**. A paid bill can be downloaded as a
  PDF for 5 minutes and then leads into the review flow.
- Prices are display text parsed with `parseMenuPrice()`. An item whose price cannot be parsed, or is
  sold out, cannot be ordered and shows "Ask staff"/"Sold out". Currency is INR (`en-IN`).
- Per-table scan counts are display-only and do not count against the plan's scan limit.

**Stage 1 boundary:** orders, bills, join requests and service calls live in this browser's
localStorage (one blob, newest `savedAt` wins); there is no server, email or realtime channel. The
Stage 2 tables and hardening are in `schema.sql` and security-and-reliability.md section 4E.

## 6. Billing Behavior
- Upgrade: unlocks instantly, confirmation email sent immediately
- Downgrade: takes effect at end of current billing cycle
- Failed recurring payment: grace period (recommend 3 days) → service suspended if unresolved
- Cancellation flow: reason form (dropdown + optional free text) → "Our team will
  reach out within 48 hours" message → request is `pending` → admin contacts the owner
  → admin **finalizes** (or marks the owner as staying) → service continues until the end
  of the paid cycle → the business then moves to the **Free** plan (not locked, not deleted).
  If a request is still undecided 2 days before renewal, the system finalizes it
  automatically so the owner is never charged after asking to cancel. The owner can click
  **Keep my plan** until the plan ends. Full rules: business-rules.md section 5.
- Refunds: never automatic and never self-serve. Only an admin can issue one
  (admin-spec.md, business-rules.md section 5A).
- Data retention after a plan ends: only extra locations beyond the Free limit are
  switched off, kept `RETENTION_DAYS_AFTER_CANCEL` (default 90) days, then purged.
  Everything else is kept (business-rules.md section 5B).

## 7. Auth Requirements
- Firebase email/password + Google login
- Forgot password / reset-via-email flow required
- Admin auth is separate and whitelisted by email (not the same login as customers)

## 8. Branding & Customization
- Business owners can upload their own logo and pick a color theme
- If no logo is uploaded, assign a default vector logo + theme based on business type
  (see brand-guide.md)
- Review page, QR code, and emails should reflect the business's branding
- The customer landing page (section 5.5) is where owners add a menu or price list, social icons and
  buttons; the business colors apply to all of it

### 8.1 Color Customization (Settings)
_See `dashboard-ui-brand-colors.png` for the reference mockup._
- Appearance settings screen offers two paths:
  1. **Preset chips** — one per business type from the brand-guide.md table
     (café, restaurant, hotel, salon, gym, retail); selecting one instantly applies
     both primary and secondary colors.
  2. **Custom color picker** — two color inputs (primary, secondary) for
     owners who want an exact brand color instead of a preset; overrides the
     preset but is stored in the same `primary_color`/`secondary_color`
     fields.
- Live preview renders the dashboard header, buttons, and stat cards in the
  selected colors before the owner saves, so there's no guessing.
- Whichever color is saved here is the single source of truth that also
  drives the QR code logo-overlay color and the weekly email report header —
  one setting, three surfaces. Page background and star color are derived from it automatically.
- The reference mockup image shows the old preset colors; use the values in brand-guide.md.
- The dashboard's neutral sidebar/nav chrome (see 5.1) does NOT pick up this
  color — only the content area, QR, and emails do. Revisit if a fully themed
  sidebar is preferred instead.

## 9. Admin Panel (internal, for the SaaS owner)
Separate `/admin` surface (see admin-spec.md) to track all clients, revenue,
cancellations, refunds, and system health without touching the customer-facing app.

## 10. Legal & Policy
Terms & Conditions, Payment Policy, and Cancellation Policy pages are required
before launch — drafted business-favorably, but must be reviewed by an actual
lawyer or legal template service before going live (see legal-pages.md).
A **Privacy Policy** is also required before launch and before Google verification, including the Google-data disclosure
and Limited Use statement (google-approval.md section 8).

## 11. Out of Scope (for v1)
- Native mobile apps (customer + owner experience is mobile web only)
- In-app support chat / ticketing system
- Multi-language UI on the marketing site and owner dashboard
- Owner-supplied HTML, CSS, JavaScript or embeds on the customer page (structured blocks only)
- Remote or online ordering, online payment collection, and appointment booking.
- Photo gallery or any owner image upload on the customer page (menu photos are AI-generated by us,
  never uploaded; see AI_MENU_PHOTOS.md)

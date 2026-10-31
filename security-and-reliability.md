# Syehere — Security & Reliability Spec

This file is binding, like PRD.md and business-rules.md. Where it conflicts with
another file on a security topic, this file wins. Rules use MUST / MUST NOT. Each
section ends with **Acceptance tests** — a task is not done until they pass.

Written for an AI coding agent running a fast, mid-tier model: follow these rules
literally, do not "improve" them, and do not skip one because it seems unlikely to matter.

---

## 1. Sessions & Authentication

| Surface | Session lifetime | Idle timeout |
|---|---|---|
| Business owner | **48 hours** (absolute) | none |
| Admin (`/admin`) | **24 hours** (absolute) | **30 minutes** |

- Login happens with the Firebase client SDK. The client then sends the ID token to
  `POST /api/auth/session`, which verifies it with Firebase Admin and sets a **Firebase
  session cookie** via `createSessionCookie({ expiresIn })`:
  - owner: `expiresIn = 48 * 60 * 60 * 1000`
  - admin: `expiresIn = 24 * 60 * 60 * 1000`
  (Firebase allows 5 minutes to 14 days, so both are valid.)
- Owner and admin sessions MUST use **separate cookie names** (`syehere_session`,
  `syehere_admin_session`). An owner cookie never grants admin access and vice versa.
- Cookie flags on both: `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/`,
  `Max-Age` equal to the session lifetime.
- Every protected route and API handler MUST call `verifySessionCookie(cookie, true)`
  (the `true` = check revocation) server-side. Never trust a client-supplied user or
  business id.
- **Admin idle timeout:** set a second HttpOnly cookie `syehere_admin_last_seen` (timestamp)
  on every admin request. If the gap is over 30 minutes, clear both cookies and redirect
  to admin login.
- **Admin authorization** is checked on every admin request: the verified email MUST be in
  `ADMIN_EMAILS` (or `admin_users`). A valid Firebase login alone is NOT enough.
- **Revoke on credential change:** after a password change or reset, call
  `revokeRefreshTokens(uid)` and clear the current cookie so all other sessions die.
- **Re-authentication for sensitive actions** (owner must have logged in within the last
  10 minutes, otherwise prompt for password): change password, change email, cancel
  subscription, disconnect Google, delete account. The same 10-minute rule applies to an
  **admin** issuing a refund or finalizing a cancellation.
- **Logout** clears the cookie and calls `revokeRefreshTokens(uid)`.
- **Email verification** is required before an owner can complete onboarding or
  generate a QR code.
- **Password reset link:** Firebase's link lifetime (about 1 hour) is not configurable.
  This is an accepted deviation. Mitigations: rate-limit reset requests (section 3), and
  show the same generic message whether or not the email exists ("If that email is
  registered, a reset link has been sent").
- **Firebase console settings to enable** (manual, done by the owner, not the agent):
  Email enumeration protection, and password policy of at least 8 characters.
- Login and password-reset calls made directly from the browser to Firebase are throttled
  by Firebase itself (`auth/too-many-requests`). Show a friendly message for that error.
  Our own limiter covers our own routes (section 3).

**Acceptance tests**
- Cookie shows HttpOnly + Secure + SameSite in browser dev tools.
- An owner cookie sent to any `/admin` route is rejected.
- Changing the password on device A logs out device B on its next request.
- Admin idle for 31 minutes is redirected to login.
- Deleting the cookie and calling any protected API returns 401.

---

## 2. Authorization & Tenant Isolation (IDOR)

- Every query on `review_pages`, `feedback`, `scan_events`, `subscriptions`, or any
  `loyalty_*` table MUST go through the single data-access module and include
  `WHERE business_id = ?`, where `business_id` is resolved server-side from the verified session
  (see schema.sql, last section).
- Guest endpoints resolve the session from the secret cookie, never from an id in the request body or URL.
- The business category is read from the saved business row. A request can never supply or change it.
- API routes that take an id in the URL or body (feedback id, review page id, etc.) MUST
  verify that the row belongs to the session's business before reading, updating or
  deleting. Return **404** (not 403) when it does not belong, so ids cannot be probed.
- Ids MUST be random (UUID/nanoid). Never use sequential integers.
- Role checks happen server-side. Hiding a button is not authorization.
- No default accounts, no seeded admin, no hardcoded credentials, no `/test`, `/debug`,
  `/seed` or similar endpoints in the codebase.

**Acceptance tests (agent must write and run these)**
- Create Business A and Business B. Logged in as A, request B's feedback id, review page
  id and subscription: every one returns 404.
- Logged in as A, call every state-changing endpoint with B's id in the body: nothing on
  B changes.

---

## 3. Rate Limiting, Bot Protection & Abuse

**Rate limiter:** use Upstash Redis with `@upstash/ratelimit` (free tier is enough).
It works on Vercel serverless, where in-memory counters do not. Key on client IP from
the `x-forwarded-for` header. On limit exceeded, return **429** with a `Retry-After` header.

| Endpoint | Limit |
|---|---|
| `POST /api/auth/session` (login → cookie) | 10 / minute / IP |
| Any password-reset request route we own | 3 / hour / IP |
| Public feedback submit | 5 / hour / IP / review page |
| Public AI review-text generation | 10 / hour / IP, plus a daily cap per business |
| Public review page load (`/r/[slug]`) | 60 / minute / IP |
| Signup | 5 / hour / IP |
| Logo upload | 10 / hour / business |
| Menu PDF signed upload + extraction | 5 / hour / business, one active import at a time, 40 pages max |
| AI dish photo generation | 3 / minute / business, one running job at a time, 10 / day / business on every plan, plus the plan credits and the global daily budget (AI_MENU_PHOTOS.md section 4). A menu PDF import counts as one job slot and its photos count against the same daily cap and plan credits |
| All other authenticated API routes | 120 / minute / business |

**Bot protection on public forms:** use **Cloudflare Turnstile** (free, no CAPTCHA
puzzles for most users) on the feedback form and AI-generation trigger. The token MUST be
verified server-side against Turnstile's siteverify endpoint before doing any work.
Also add a hidden honeypot field; if it is filled, silently accept and discard.

**Scan-quota protection:** scan limits are per plan, so an attacker could burn a
business's quota by hammering its public URL.
- Compute `visitor_hash = SHA256(ip + user_agent + VISITOR_HASH_SALT + current_date)`. Never store raw IPs.
- Do NOT count a scan if the same `visitor_hash` already has a `scan_events` row for that
  review page in the last 30 minutes.
- Do NOT count requests with obvious bot/crawler/link-preview user agents, or HEAD/prefetch requests.
- Reaching the scan limit **pauses the whole customer side** (QR, NFC, short link, AI text, feedback) with the
  neutral "temporarily unavailable" page until the count resets or the plan is upgraded (business-rules.md section 1).
  Because a paused page is the cost of a burned quota, the protections above matter more: the count is an atomic
  conditional update, and a counted visitor can finish their flow.
- **Extra quota-burn cap (proposal, confirm):** at most 20 counted scans per IP per hour per review page
  (configurable constant, read from config in one place). Beyond it, further requests from that IP are not
  counted and get the neutral page. Watch for a business that hits its limit unusually fast (for example more
  than 50 percent of its limit in one hour) and flag it on the admin dashboard.
- An admin can reset `scans_used` for a business after an attack; it is audit-logged.

**Feedback input:** max 1000 characters, trimmed; reject empty. Stored text is treated
as untrusted forever (section 5).

**Business-logic abuse**
- One free tier per verified email. Signing up again with a new email is allowed, but
  the same email cannot restart a plan or reset counters.
- Plan prices come from a server-side plan table. The client sends only a plan id, never
  an amount, discount or quantity.
- Paid features unlock only after the server confirms payment (section 6), never from a
  redirect or client-side "success" flag.

**Acceptance tests**
- 6th feedback submission from one IP for one page within an hour returns 429.
- Feedback POST without a valid Turnstile token is rejected.
- Refreshing a review page 20 times in a minute adds at most 1 scan.
- Modifying the amount in a checkout request body has no effect on the charged amount.

---

## 4. Input Handling, Output Safety & Uploads

- **SQL:** parameterized queries only, plus the dynamic-query rules in section 4B. Never build SQL
  with string concatenation or template literals.
- **XSS:** rely on React's default escaping. `dangerouslySetInnerHTML` is forbidden.
  Feedback text, business names and any user text MUST be HTML-escaped when inserted
  into **emails** (Resend templates). Owner dashboard shows feedback as plain text only.
- **URLs:** `google_review_url` MUST be validated as `https://` and on a Google host
  (`google.com`, `g.page`, `goo.gl`, `maps.app.goo.gl`, `search.google.com`) before saving,
  so the review redirect cannot be turned into an open redirect. Social links: `https://` only.
- **Schema validation:** validate every request body with zod (or equivalent); reject
  unknown/oversized fields. Cap request body size.
- **Onboarding validation:** run every onboarding gate on the server: business name
  (2–100, at least 2 letters, not one repeated character, not a blocked whole name), address line 5–120,
  city 2–60, PIN `^[1-9][0-9]{5}$`, phone `^[6-9][0-9]{9}$`, FSSAI exactly 14 digits, GSTIN
  `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` uppercase, local licence 5–30 letters/digits/`-`/`/`,
  declared tables 1–200 and rooms 1–500. These are format checks only; never show "verified".
- **Honeypot:** the onboarding form has a hidden `company_website` field; a non-empty value is
  silently discarded with the generic error and nothing is saved.
- A business type that is unknown, or outside the locked category, returns **400** and never saves.
- **Logo upload:**
  - Allowed: PNG, JPEG, WebP. **SVG uploads are NOT allowed** (they can carry scripts).
  - Max 1 MB. Check the file's magic bytes server-side, not just the extension or MIME header.
  - Re-encode with `sharp` (this strips embedded payloads and metadata) and resize.
    All other size, dimension and quota limits are in section 4A.
  - Store in R2 under a random filename generated server-side. Never use the client's filename.
  - Serve from the R2 public domain, not from the app's origin.
  - The built-in default preset logos (brand-guide.md) are our own SVGs and are exempt.
- **Menu PDF upload (direct to R2):**
  - Only `application/pdf`, max 8 MB and max 40 pages. Check the `%PDF-` magic bytes; reject
    encrypted, password-protected, truncated or malformed files. Read it as data only: never execute
    JavaScript, embedded files, forms or launch actions.
  - The browser uploads directly to R2 with a short-lived signed PUT (5 minutes) scoped to one random
    object key under `menu-imports/<business_id>/`. R2 credentials never reach the browser. Sign
    `Content-Type` and `Content-Length` where the provider supports it; otherwise verify the stored
    object's size with a HEAD before reading it. The bucket stays private with no public URL.
  - Issue the signed URL only from an authenticated, origin-checked route, rate-limited as in section 3.
    Allow one active import per business.
  - Extract with a provider/model that accepts PDF input (Gemini; Groq stays for text and replies).
    Send the PDF only for extraction, with no training or retention opt-in. Timeout 90 seconds, at most
    one retry. Delete the R2 object in a `finally` and by a 24-hour lifecycle rule; never serve or link it.
  - Treat the PDF's text as untrusted. An instruction inside the PDF ("ignore previous instructions")
    must not change the task, tools or output schema. Validate the provider's JSON with zod, clamp every
    field, ignore unknown keys, drop rows without a name and never render extracted text as HTML.
- **Customer PII in logs:** do not log customer names, emails, phones, notes or feedback contents.
  Log ids and counts only.
- **Response filtering:** API responses return only the fields the client needs. NEVER
  return `google_oauth_token`, `google_oauth_refresh_token`, other tenants' data, or
  internal fields.
- **Google OAuth tokens:** encrypt with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`
  (32 random bytes, base64), with a fresh random IV per value, stored as `iv:tag:ciphertext`.
  Decrypt only in the server code that calls Google.
- **Google OAuth flow:** authorize URL uses a random single-use `state` bound to the owner's session (10-minute expiry, verified
  on callback); never log authorization codes or tokens; verify the granted scope; on Disconnect, account deletion or cancellation
  call Google's token revocation endpoint and delete the stored tokens (google-approval.md section 10).
- **Google data sent to AI providers:** only star rating, reviewer first name and review text; never other Google fields; do not
  keep review text after the reply is posted.

**Acceptance tests**
- Feedback containing `<script>alert(1)</script>` shows as literal text in the dashboard
  and in the notification email.
- Uploading a `.svg`, a renamed `.exe`, or a 5 MB PNG is rejected.
- A 9 MB PDF, a non-PDF renamed `.pdf`, an encrypted PDF and a 41-page PDF are rejected before
  extraction. An expired or reused signed URL cannot upload.
- An object key from another business cannot be extracted. A temporary menu PDF is gone within
  24 hours and is never reachable from the public domain.
- A PDF containing "ignore previous instructions" still returns only the menu JSON schema; no page
  content is executed and no unknown field reaches the saved menu.
- A `google_review_url` of `https://evil.example/x` or `javascript:...` is rejected.
- `grep` of the database row for a connected business shows the token as ciphertext.
- A callback with a missing, reused or wrong `state` is rejected; a callback from a logged-out browser is rejected.
- Disconnect revokes at Google and leaves no token in the row.

---

## 4A. Size Limits & Quotas (protects cost, storage and service quality)

All limits are enforced **on the server** (zod schemas and route checks). Browser-side
checks are only for a friendly message. Vercel Functions reject JSON/route-handler request
bodies over 4.5 MB, so the menu PDF does NOT go through the app route: the browser uploads it
directly to R2 with a signed PUT (section 4), and the app receives only the object key and
metadata. All other uploads go through the app and must stay well under 4.5 MB.

**Uploads**

| Item | Limit |
|---|---|
| Logo file size | 1 MB max |
| Logo dimensions (input) | 4000 x 4000 px max; set `sharp` `limitInputPixels` (about 16 million) so a tiny "decompression bomb" file cannot exhaust memory |
| Logo stored version | re-encoded to WebP/PNG, max 512 x 512 px (should end up well under 150 KB) |
| Logos per business | 1. A new upload replaces the old one, and the old R2 file is deleted |
| QR codes | Generated on demand for PNG/PDF/SVG downloads and not stored per download. At most one stored QR image per review page, overwritten on regenerate |
| Menu PDF | 8 MB max, 40 pages max, PDF only. One active import per business. Private R2 object for at most 24 hours, deleted immediately after extraction; never part of the 20 MB business storage quota |
| AI dish photos | Generated by us, never uploaded by owners. Stored as re-encoded WebP: full size about 1080 x 1620 plus a small thumbnail, random names. At most one photo per menu item. Unapproved drafts are deleted after 24 hours. Full rules and cost caps: AI_MENU_PHOTOS.md |
| Total R2 storage per business | 20 MB (logo + AI dish photos). Reject beyond it |
| Upload route body | Applies to app-routed uploads such as the logo: stop reading the request stream once it passes 1.5 MB and return 413. Do not trust the `Content-Length` header alone. The menu PDF bypasses this route through the signed R2 PUT |
| Other file uploads | The menu PDF is the only other upload; it is never shown on the customer page and is deleted within 24 hours. Any new upload feature needs its own limits added here first |

**Text and request sizes**

| Field | Max |
|---|---|
| Business name | 100 characters |
| Customer feedback text | 1000 characters |
| Customer name / contact fields, if collected | 100 characters; email 254 characters |
| Google review URL, each social link | 2048 characters |
| Auto-reply template (each) | 1000 characters, only `{{reviewer_name}}` and `{{business_name}}` placeholders allowed |
| Tagline | 120 characters |
| Social link (each) | 2048 characters, https only, per-platform host allowlist (PRD.md 5.5.4) |
| Cancellation reason | 1000 characters |
| Cancellation decision note / refund reason | 1000 characters |
| Admin broadcast subject / body | 200 / 20,000 characters |
| Search and filter query strings | 200 characters |
| Any other JSON API request body | 100 KB |

Longer values are rejected with a 400 and a clear message. They are never silently truncated,
except customer feedback, which the form itself also caps.

**Volume caps (per business unless noted)**

| Item | Cap | When exceeded |
|---|---|---|
| Feedback submissions stored | 300 per day | Customer still sees the normal thank-you page. Extra rows are not stored, and the owner gets one alert email that day |
| AI review-text generations | 200 per day | Use the fallback pre-written templates (section 8) |
| Emails triggered by user actions (verification resend, etc.) | 5 per hour per user | 429 |
| Admin broadcast emails | Batched sending, at most one broadcast running at a time | Second one waits or is refused |
| Locations, scans | Per plan (PRD.md pricing) | Per business-rules.md |
| `scan_events` retention | 90 days | Daily cleanup job (section 7) |

**Cost alarms (manual, done by the owner, not the agent):** set a spending limit or
billing alert on every metered service before launch: Groq and Google AI (Gemini) usage,
Resend plan limit, Cloudflare R2, Turso, Upstash, and Vercel. A bot or bug can only cost
what the limit allows.

**Acceptance tests**
- A 2 MB PNG, a 6000 x 6000 px image, and a tiny file that decompresses to a huge image are all rejected without crashing the server.
- Uploading a second logo leaves only one file for that business in R2.
- Uploading past the 5 MB storage quota is rejected.
- A 5,000-character feedback body and a 200 KB JSON body are rejected.
- After 300 stored feedback rows in a day, the customer page still works and no new rows are added.

---

## 4B. SQL Injection Rules

Binding values with `args` is safe. Injection happens in the places where binding is not
possible or where someone forgot it. These rules cover those places.

1. **One place for SQL.** All SQL lives in the data-access module (`lib/db/`). Calls to the
   database client's `execute`, `batch` or `executeMultiple` are forbidden anywhere else
   (routes, components, cron handlers, admin pages).
2. **Values are always bound.** Every value goes in `args`. No `${...}` template
   interpolation and no `+` concatenation inside any SQL string, ever. This includes values
   that came from our own database (second-order injection): data read back from the DB,
   such as a business name, is still untrusted when used in a later query.
3. **Identifiers never come from input.** Column names, table names and `ASC`/`DESC` cannot be
   bound, so they must come from an **allowlist of fixed strings in code**. Example:
   the request sends `sort=newest`, the server maps it via
   `{ newest: "created_at DESC", oldest: "created_at ASC", rating: "rating DESC" }`,
   and any unknown key returns 400. The same applies to filter fields and to dynamic
   `UPDATE ... SET` clauses (build the SET list only from an allowlist of column names,
   and bind the values).
4. **Search (`LIKE`):** bind the value, and escape the user's `\`, `%` and `_` characters
   and add `ESCAPE '\'` so a search for `%` does not match everything. Cap search terms at
   200 characters (section 4A).
5. **Pagination:** `limit` and `offset` are validated as whole numbers with zod
   (`limit` 1 to 100, `offset` 0 to 10000) and bound as `args`. Never inserted as text.
6. **`IN (...)` lists:** build one `?` per item from the array length (max 100 items) and bind
   each value. Never join user values into the list.
7. **Multi-statement execution** (`executeMultiple`) is for migrations run by the owner
   only. Never call it with anything that came from a request.
8. **Format checks before the database:** ids and slugs are validated against their exact
   format (for example the nanoid alphabet and length) with zod before any query.
   This is a second layer, not a replacement for binding.
9. **No schema changes at runtime.** No route or job may run `CREATE`, `ALTER` or `DROP`.
   The schema is changed only by the owner running migrations manually.
10. **Least privilege:** one server-only database token, never in client code or any
    `NEXT_PUBLIC_` variable. If the Turso plan supports read-only tokens, use one for jobs
    that only read (verify in the Turso docs). The agent must not assume this exists.
11. **Automated check:** add `npm run check:sql` (a small script) that fails if (a) the database
    client's `execute`/`batch` appears outside `lib/db/`, or (b) a SQL keyword string
    (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) contains `${` or is joined with `+`. Run it
    before every deploy and as part of the Phase 8 security gate.
12. **Optional owner check:** run `sqlmap` against your own staging site only (never anyone
    else's site) before launch.

**Acceptance tests (agent must write and run these)**
- Submit `' OR 1=1 --`, `'; DROP TABLE feedback; --`, `" OR ""="` and `%` in the feedback form,
  every search box, business name fields, and as slug or id URL parameters. Each is stored or
  searched as plain text, and the tables and row counts are unchanged afterwards.
- `sort=created_at; DROP TABLE x`, `sort=nonexistent` and `sort=` return 400.
- `limit=-1`, `limit=0`, `limit=100000` and `offset=-5` return 400.
- Logged in as Business A, search for `' OR business_id != '`: only A's own rows can appear.
- A search for `%` returns only rows that actually contain a percent sign.
- Add a deliberately bad line (a template-literal SQL query) and confirm `npm run check:sql`
  fails, then remove it and confirm it passes.

---

## 4C. Customer Page Content (owner-supplied content on a public page)

The Customer page (PRD.md 5.5) lets owners put their own text and links on a page shown to
the public on OUR domain. That makes it a phishing, XSS and abuse surface. These rules are binding.

**Content rules (MUST / MUST NOT)**
- MUST accept only the structured fields in PRD.md 5.5 through one shared zod schema (strict: unknown
  keys are rejected). MUST NOT accept HTML, CSS, JavaScript, Markdown or embeds/iframes anywhere.
- MUST HTML-escape every owner-supplied string on render (React default escaping;
  `dangerouslySetInnerHTML` is forbidden). Strip control characters and zero-width/bidi override characters.
- MUST validate every URL: `https` only; no credentials; no `localhost`, private or loopback IPs or raw
  IP hosts; max 2048 chars; social links also match the per-platform host allowlist; map links match the
  Google Maps allowlist. `tel:` and `wa.me` links are built by the SERVER from a validated phone number,
  never from owner-supplied URL text.
- MUST render external links with `target="_blank" rel="noopener noreferrer nofollow"`.
- MUST build the Pay button's `upi://pay` link ONLY from the validated UPI ID and payee name
  (`upi://pay?pa=...&pn=...&cu=INR`, every value URL-encoded, no amount). `upi:` is allowed for this
  one link only; `javascript:`, `data:` and every other scheme stay rejected. The owner never types a link.
- MUST NOT load images from owner-supplied URLs (no hotlinking). The customer page has no owner-uploaded
  images; the only images are the business logo and the AI dish photos, both re-encoded and stored by
  us, served from one fixed storage domain; CSP `img-src` allows only `'self'`, `data:` and that domain.
  A menu item stores our image key (`^[a-z0-9-]{8,40}$`), never a URL.
- MUST NOT use owner-supplied text in page `<title>`, meta tags or redirects without escaping.
- Analytics events (Phase D) accept only allowlisted `event_type` values and only `target_key`s that exist
  in the saved config; the URL to open is never taken from the request.

**Limits (server-enforced; hard caps apply to every plan including Enterprise)**

| Item | Hard cap |
|---|---|
| Serialized `page_config` per location | 100 KB. The save route accepts a body up to 128 KB (exception to the 100 KB JSON default) |
| Announcement text / thank-you message | 160 characters each |
| Menu block title / category name | 40 characters |
| Categories per location | 12 |
| Item name / description / price text | 60 / 160 / 20 characters |
| Menu items per location | Plan limit, and never more than 300 |
| Custom link button label | 30 characters |
| Custom link buttons per location | No plan limit, hard cap of 20. Allowed on every plan and every business type |
| Menu tag | Allowlist only: New, Popular, Veg, Spicy, or none |
| Directions field | Address up to 200 characters, or a Google Maps link (host allowlist) |
| Address / hours note | 200 / 100 characters |
| Phone and WhatsApp number | 7 to 15 digits, optional leading `+` |
| UPI ID (Pay button) | 50 characters (owner decision); format `name@handle` — letters, digits, dot, dash, underscore, then `@`, then letters only |
| Pay-button payee name | 30 characters (owner decision) |
| Wi-Fi name / password | 32 / 63 characters |
| Page save rate | 30 saves per hour per business |

- The public page reads a cached copy of the config and is revalidated on save; the config is never
  fetched from the client with a client-supplied business id.
- Owner content is untrusted forever: it is escaped on the page AND in any email or admin view that shows it.

**Acceptance tests**
- A menu item containing `<script>alert(1)</script>` displays as plain text on the public page.
- Custom links using `javascript:`, `data:`, `http:`, a raw IP, `localhost`, or credentials are rejected.
- An Instagram field pointing at another host is rejected; a `wa.me` link is built server-side.
- A config that removes or moves the review block, has unknown keys, or exceeds 100 KB is rejected.
- On the Free plan the 11th menu item is rejected; the 21st custom link is rejected on every plan; the 301st menu item is rejected on Enterprise.
- Any config with a menu URL field is rejected. A café, salon or restaurant config with valid `custom_links` is accepted.
- An `on` button or icon with an empty or invalid value is rejected on save and is never rendered on the public page.
- Call and WhatsApp values that are not 7 to 15 digits are rejected; the `tel:` and `wa.me` links are built server-side.
- A page-event request with an unknown `target_key` or event type is rejected and never redirects.
- An owner cannot read or write another business's `page_config` (tenant-isolation test extended to
  every page endpoint).
- After account deletion, no logo or QR files remain in storage.

---

## 4D. Auto-reply Setup Request Form (owner-supplied personal data)

- Authenticated owners only; `business_id` from the session, never from the body. Strict zod schema with exactly the five fields
  (owner name, business name, business type from the allowlist, Google account email, phone). The business
  type allowlist is `cafe`, `restaurant`, `hotel`, `salon`, `gym`, `retail`, `other`. Unknown fields return 400.
- Limits: name 80, business name 100, email 254, phone 7 to 15 digits with optional leading `+`. Text is trimmed, stored as
  untrusted, escaped everywhere it is shown (admin page and emails).
- Plan gate on the server: a plan without `google_auto_reply` gets 403 on the form page and on submit.
- One open request per business; max 3 submits per hour per business; honeypot field, silently discarded.
- The **Connect Google** route works only for the logged-in owner, only while their request is `contacted`, and only on a plan with `google_auto_reply`. It uses the OAuth rules in google-approval.md (single-use `state`, scope check).
- Only admins can read `auto_reply_requests` across businesses; an owner sees only their own row's status. `admin_note` is never
  returned to owners.

**Acceptance tests**
- A Starter owner opening the form page or posting to it gets 403.
- A Free or Pro owner submitting twice gets one request and a friendly "already in progress" message.
- An extra field, an unknown business type, a bad email or a 6-digit phone is rejected with 400.
- A request naming another business's id in the body is ignored; the row belongs to the logged-in business.
- An owner cookie cannot activate, close or list requests.
- Connect Google is refused while the request is `pending`, `active` or `closed`, and for a Starter plan.

---

## 5. Security Headers, CORS, Errors, Secrets

- **Headers on every response** (configure in `next.config.js` `headers()`):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (and CSP `frame-ancestors 'none'`)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`: start from `default-src 'self'`, then allow only what the app
    needs: Cloudflare Turnstile (`challenges.cloudflare.com`), Firebase Auth
    (`*.googleapis.com`, `*.firebaseapp.com`), the R2 public domain for images, and
    Google Fonts if used. Test every page and tighten; do not use `unsafe-eval`.
- **CORS:** no `Access-Control-Allow-Origin: *`. The API is same-origin only. Webhooks and
  cron routes are server-to-server and need no CORS.
- **CSRF:** cookies are `SameSite=Lax`, and all state-changing routes use POST/PUT/PATCH/
  DELETE (never GET). Additionally, reject state-changing requests whose `Origin` header
  is present and not equal to `NEXT_PUBLIC_APP_URL`.
- **Errors:** clients get a generic message plus a correlation id (random id). Full detail
  goes to server logs only. Never return stack traces, SQL, file paths or env values.
  The full error-disclosure rules are in section 5A.
- **Startup validation:** validate all required env vars with zod on boot. If a critical
  one (Turso, Firebase, Cashfree, encryption key) is missing, the app MUST fail fast with a
  clear message, not run half-configured.
- **Secrets:** no secret in source, comments or logs. Only the Firebase web config,
  `NEXT_PUBLIC_APP_URL`, the Turnstile site key and `NEXT_PUBLIC_SENTRY_DSN` (a DSN is
  designed to be public) may use the `NEXT_PUBLIC_` prefix. Any
  other `NEXT_PUBLIC_` variable is a bug.
- **Logging:** never log emails, tokens, feedback text, phone numbers or request bodies.
  Log ids and event names only. Use `[REDACTED]` where a value must be referenced.
- **Exposure check:** `/.env`, `/.git`, source maps with secrets, API docs and verbose
  health endpoints MUST NOT be reachable in production. Turn production source maps off.
- **Dependencies:** commit the lockfile, run `npm audit` before deploy, and enable
  Dependabot (or equivalent) on the repository. No abandoned or unknown packages.

**Acceptance tests**
- `curl -I` on the live site shows all headers above.
- Deliberately breaking a DB query returns a generic error + correlation id, no stack trace.
- Starting the app with `TURSO_AUTH_TOKEN` unset fails immediately with a clear message.
- `grep -r "NEXT_PUBLIC_" .` shows only the allowed variables.

---

## 5A. Error Disclosure Rules (never reveal how the system is built)

Attackers use error messages to map the system: table and column names, file paths,
libraries, providers, which accounts exist. A visitor must learn only that something failed,
plus a reference id to quote to support.

1. **One fixed error format for every API route:**
   `{ "error": { "code": "INTERNAL", "message": "Something went wrong. Please try again.", "requestId": "abc123" } }`
   Allowed codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`,
   `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `INTERNAL`. Messages are fixed sentences written by
   us, never text taken from a library or provider.
2. **One central handler.** Every route handler is wrapped by a single helper (for example
   `withErrorHandling`). It logs the real error and the `requestId` on the server (with personal
   data redacted, section 5) and returns the fixed format. This includes unknown API routes,
   wrong HTTP methods (405) and malformed JSON, which return the same format.
3. **Forbidden in any response body:** `e.message`, `e.stack`, `e.code`, `e.cause`, raw zod
   issues, SQL text, and any error text or body from Firebase, Turso, Cashfree, Resend,
   Groq, Gemini, R2 or Upstash. Map provider failures to one of the allowed codes.
4. **Validation errors** return `VALIDATION_FAILED` plus, per field, a short fixed message using
   the public form field names, for example `{ "feedback": "Please enter 1 to 1000 characters" }`.
   Never return the schema, internal field names or raw zod output.
5. **Identical answers where differences leak information:**
   - Wrong password, unknown email and any other Firebase sign-in failure
     (`auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`) all show one
     message: "Incorrect email or password." `auth/too-many-requests` shows a friendly retry message.
   - Password reset is generic (section 1).
   - A missing, expired, revoked or malformed session all return the same
     `UNAUTHORIZED` message: "Please sign in again."
   - Another business's record and a nonexistent record both return `NOT_FOUND` (section 2).
6. **Admin area:** anyone without a valid admin session (including a signed-in owner) gets the
   normal site 404 for every `/admin` page and admin API, not a 403 and not a redirect that
   confirms the area exists. The admin login page (`/admin/login`) is the only exception and
   reveals nothing else. This is an extra layer; the real protection is the checks in section 1.
7. **Branded error pages:** create `app/error.tsx`, `app/global-error.tsx` and
   `app/not-found.tsx` with plain friendly wording and the site's branding. They may show
   only a short reference id. Never render `error.message` or the stack. In production Next.js
   already hides server error text from the browser; do not undo this by passing messages
   through props, cookies or query strings.
8. **Headers:** set `poweredByHeader: false` in `next.config.js`, so responses do not say
   `X-Powered-By: Next.js`. Do not add custom headers containing versions, hostnames, or
   internal names.
9. **Production mode only:** production runs a production build (`next build` + `next start` or
   Vercel's default), never `next dev`. No `DEBUG`-style variables exist in `.env.example` or
   in the Vercel production settings. Production browser source maps stay off.
10. **Preview deployments:** turn on Vercel Deployment Protection for preview URLs so only
    logged-in team members can open them (manual setting, done by the owner; verify it
    is on). Previews often run half-finished code with verbose errors.
11. **Browser code:** no `console.log` or `console.error` of API responses, errors or tokens
    in client-side code.
12. **Minimal responses for machines:** webhook and cron routes return only `{"ok":true}`
    (or a bare 401/400/500 with no diagnostic text). Detail goes to server logs only.
13. **Startup and config errors:** the exact missing-variable message goes only to server
    or build logs. A visitor sees the friendly "temporarily unavailable" page, never variable names.
14. **Logs stay private:** anything sent to Sentry passes through the same scrubbing as
    section 8. Logs and error reports are never exposed on any public route.
15. **Accepted limits:** some facts cannot be hidden (the site is served by Vercel; login is
    Firebase-based). The goal is to hide anything that helps an attacker, not to make the
    site invisible. Hiding details is a second layer, and the checks in sections 1 to 4B remain
    the real protection.

**Acceptance tests (agent must write an automated `npm run test:leaks` and run it)**
For each case below, the response body and headers must NOT contain any of:
`SQLITE`, `libsql`, `turso`, `firebase`, `cashfree`, `node_modules`, `.ts:`, `.js:`, `at Object.`,
`stack`, `column`, `no such table`, or the project id.
- A deliberately broken database query.
- Malformed JSON in a request body, a wrong HTTP method, and a nonexistent API route.
- A payload that fails validation (message must use only the public field names).
- A missing environment variable at startup.
- A Firebase sign-in with a wrong password versus an unknown email: identical response.
- An expired session versus a garbage session cookie: identical response.
- A signed-in owner requesting `/admin` and `/api/admin/...` gets the normal 404.
- `curl -I` on the site shows no `X-Powered-By` header.
- The 404 and 500 pages show only friendly text and a reference id.

---

## 6. Payments & Webhooks (Cashfree)

- **Verify the signature** of every webhook using the raw request body, per
  provider-reference.md. Invalid signature returns 401 and is logged (without the body).
- **Replay protection:** reject webhooks whose timestamp header is older than 5 minutes,
  and record every processed event id in `processed_webhook_events` (insert first; on
  duplicate key, return 200 and do nothing). A replayed or retried event must never
  extend a subscription twice.
- **Server-side confirmation:** before unlocking a paid plan, follow section 6A. The browser
  redirect after checkout is a UI hint only and unlocks nothing.
- Failed-payment and grace-period behavior follows business-rules.md section 4.

**Acceptance tests**
- Replaying the same webhook payload twice changes state once.
- A webhook with a tampered body or wrong signature is rejected.
- Visiting the "payment success" URL without a paid subscription does not unlock the plan.

---

## 6A. Pricing Integrity (the client never sets a price)

**Principle:** the browser may only say *which plan it wants*. The server decides what
it costs, who is paying, and whether payment really happened.

- **Single source of truth:** plan prices and limits live in the `plans` row of
  `system_settings` (seeded in schema.sql, editable only by admins, per admin-spec.md).
  No price, limit or plan name is hardcoded in front-end code or duplicated in route handlers.
  PRD.md and business-rules.md show the same numbers for humans; the database row is what runs.
- **Checkout request:** `POST /api/billing/checkout` accepts exactly one field:
  `{ "plan": "starter" | "pro" }`, validated with zod as a strict schema. If the body
  contains anything else (`amount`, `price`, `currency`, `discount`, `quantity`, `businessId`),
  return 400. Do not just ignore extra fields.
- **Who is paying:** `business_id` comes from the verified session, never from the body.
- **Which plans can be bought:** only plans with `self_serve: true` (Starter, Pro). Free and
  Enterprise are refused with 400. Unknown plan ids are refused.
- **Amount:** the server reads the price from the `plans` setting, and sends that to
  Cashfree. Where Cashfree supports fixed plans, create them once with our amounts and store
  the Cashfree plan id server-side; the client never supplies or sees an amount to submit.
- **Record it:** insert a `payment_attempts` row with the plan, `amount_paise`, and currency
  copied at creation time, plus the Cashfree subscription id.
- **Confirm before unlocking:** on a payment-success webhook, verify the signature (section 6),
  then look up the matching `payment_attempts` row and fetch the subscription/payment
  from Cashfree's API. Only upgrade if all of these are true: the status is paid; the
  paid amount and currency equal the stored `amount_paise` and `currency`; the attempt
  belongs to the business being upgraded; and the attempt has not already been marked paid.
  Otherwise set the attempt to `amount_mismatch`, do NOT upgrade, and write a log entry for admins.
- **Limits are read from the plan row:** scans and locations allowed for a business come
  from the `plans` setting for that business's `plan` value on the server. The dashboard
  and public pages never decide limits from client data.
- **Changing prices:** an admin edit of the `plans` setting is written to `audit_logs`, and
  applies to NEW checkouts only. Existing subscribers keep their current price until they
  change plan. (This is the default. Confirm with the owner, see PROGRESS.md open decisions.)
- **Plan changes** happen only through a confirmed payment (above) or an audited admin
  action. There is no client-callable route that sets `businesses.plan` or `subscriptions.plan`.
- **Discounts/coupons:** none in v1. If added later, the code is validated, applied and
  marked used on the server, with a usage limit per code, and it must be added to this section first.
- **Currency:** only INR through Cashfree for now (PRD.md section 2). Never accept a currency from the client.

**Acceptance tests (agent must write and run these)**
- Send checkout with an extra `amount: 1` field: rejected with 400, nothing created.
- Send checkout with `plan: "enterprise"`, `"free"` and `"gold"`: all rejected.
- Send a checkout for Business B's id in the body while logged in as A: rejected, and any
  attempt created belongs to A.
- Open the payment-success URL without paying: plan unchanged.
- Simulate a signed webhook whose paid amount differs from the stored `amount_paise`:
  attempt becomes `amount_mismatch`, plan unchanged.
- Replay a valid webhook: plan and period change once.
- Search the front-end bundle and API responses for a hardcoded price: none found.

---

## 7. Cron Jobs & Data Lifecycle

- Every cron route MUST verify `Authorization: Bearer ${CRON_SECRET}` and return 401 otherwise.
- **Daily cleanup job** (fold into the existing daily cron, since Hobby-tier cron is
  daily-only): delete `scan_events` and `page_events` older than 90 days. Keep at least 14 days so the
  week-over-week stats work.
- **Temporary menu PDFs:** delete every `menu-imports/` R2 object older than 24 hours, in addition to
  deleting each object immediately after extraction. Add an R2 lifecycle rule as the backstop for a
  crashed request. These files are never part of the business's 20 MB storage quota.
- **Account deletion** (owner-initiated, requires re-authentication):
  1. Cancel any active Cashfree subscription.
  2. Delete the business row; foreign keys cascade to review pages, feedback, scan events,
     subscriptions and loyalty rows.
  3. Delete the logo and QR files from R2.
  4. Delete the Firebase Auth user.
  5. Keep `audit_logs` and payment records only as legally required, with personal
     identifiers removed where possible.
  6. Send a confirmation email.
- **Retention after cancellation:** a finalized cancellation moves the owner to Free
  (business-rules.md 5.4); nothing is deleted except extra locations, which are purged after
  `RETENTION_DAYS_AFTER_CANCEL` days (default **90**, subject to owner confirmation). Implement
  it as one constant read from config, so it can be changed in one place. Full rules:
  business-rules.md 5B.
- **Daily cron duties** (all inside the existing daily cron, each behind `CRON_SECRET`):
  1. Renewal guard: finalize open cancellation requests whose subscription renews within 2 days.
  2. Plan end: move finalized cancellations to Free when `current_period_end` has passed and
     deactivate extra locations.
  3. Retention purge: delete deactivated locations (and their scan events, feedback, customer page content) older
     than `RETENTION_DAYS_AFTER_CANCEL`; send the 7-day warning email first; audit-log each purge.
**Acceptance tests**
- Calling a cron route without the secret returns 401.
- After account deletion, no rows or R2 files for that business remain, and login fails.
  (Refund and legally required payment records are the only exception; see schema.sql open item.)
- A temporary menu PDF is deleted immediately after extraction and, if the request crashes, within 24 hours.
- On the cycle end date a finalized business is on Free with limits from `getPlans().free`, only
  its oldest location is active, and no feedback or analytics were deleted.
- An open cancellation request with renewal in under 2 days is finalized by the cron.
- A payment webhook after finalization does not upgrade or extend anything and raises an admin flag.
- Deactivated locations older than `RETENTION_DAYS_AFTER_CANCEL` are purged; the primary location
  is untouched; upgrading before purge reactivates them with the same slugs.
- An owner cookie calling any refund or cancellation-decision route is rejected.
- A refund larger than the refundable balance, a second refund in flight for the same payment, or
  a refund without a reason or without recent re-authentication is rejected; a double click creates
  one refund.

---

## 8. Reliability & Monitoring

- **Error monitoring:** Sentry (free tier) on server and client, with `sendDefaultPii: false`
  and scrubbing of request bodies. Optional: the app must run without `SENTRY_DSN`.
- **Health endpoint:** `GET /api/health` returns only `{"ok":true}` with status 200. No
  versions, no env info, no DB details. Point a free uptime monitor (UptimeRobot or
  Better Stack) at it and at one public `/r/[slug]` page, with email alerts.
- **Database outage:** wrap DB calls in try/catch with one retry. If Turso is unreachable, show
  a friendly "temporarily unavailable, please try again" page. Never crash with a raw error.
- **External-service failures:** Groq → Gemini fallback (existing rule). If both AI
  providers fail, the customer flow still works: fall back to a set of pre-written generic
  positive review templates. Resend failures are logged and retried by the next cron; they
  never block the user action.
- **Backups:** check what backup / point-in-time restore your Turso plan provides and turn it on.
  Do a restore test once before launch. Nice-to-have: a weekly export of key tables to R2.
- **DDoS:** Vercel provides baseline protection. For extra safety, put Cloudflare in front
  of the domain and use its free rate limiting on `/r/*`. Optional but recommended.
- **Transport:** HTTPS only (Vercel default). The Turso `libsql://` connection is TLS by default; do not
  downgrade it.

**Acceptance tests**
- A thrown test error appears in Sentry with no user data.
- The health route reveals no version, env, database or system internals.
- With the DB URL deliberately wrong locally, a public page shows the friendly page, not a stack trace.
- Uptime monitor reports up and sends a test alert.

---

## 9. Privacy & Incident Response

- Privacy Policy MUST list: what is collected (owner email/name/business info, customer
  feedback text, hashed visitor identifiers), which processors receive data (Firebase,
  Turso, Resend, Cloudflare, Groq, Gemini, Cashfree, Google), and how to request deletion. It MUST also contain the
  Google-data / Limited Use section from google-approval.md section 8.
- Do not send customer feedback text or owner personal data to the AI providers. The AI
  generation call needs only the business type/name and the star context.
- Add a **data breach notification** section to the Privacy Policy. India's DPDP Act has
  breach-notification duties; have a lawyer confirm exact wording and timelines
  (this is not legal advice).
- Keep a one-page internal incident checklist: rotate the exposed key, revoke sessions
  (`revokeRefreshTokens` for affected users), check `audit_logs`, notify affected users.

---

## 10. Pre-Launch Security Gate

Before deploy, run these five reviews against the finished codebase, one at a time, and
record the summary of each in PROGRESS.md. They follow the structure of the
"5 Security Checks" guide by Mayank Shah (vibe-coding-security-prompts.pdf), which
the project owner has.

1. **Secret leaks** — no secrets in code, git history, logs, or `NEXT_PUBLIC_*` variables.
2. **Personal data flow** — map what personal data is collected, stored and sent to third
   parties; strip logs; confirm deletion works.
3. **Production audit** — env validation, debug code removed, error handling and
   disclosure (5A, run `npm run test:leaks`), headers, rate limits, CORS, DB TLS.
4. **Deep audit of auth and payments** — IDOR, session/reset flows, webhook and price
   integrity, input handling and uploads, SQL injection (4B, run `npm run check:sql` and
   the payload tests).
5. **Attacker's-perspective review** — ID manipulation, login bypass, privilege escalation,
   abuse of rate limits, content injection, exposed internals, business-logic abuse.

**Category acceptance tests:** the `category_locked` trigger test and the category fail-closed
tests (missing, unknown, wrong case and a number behave as `general`).

Re-run check 5 after every major feature added later. A human security review is
recommended before taking real payments at scale.

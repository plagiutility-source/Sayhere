# Admin Panel Specification

## Purpose
A separate, internally-facing surface for the SaaS owner to monitor and manage
every client and the health of the system — completely distinct from the
customer-facing app.

## Access
- Route: `/admin` (fully separate layout, not nested under customer dashboard)
- Auth: Firebase auth, but gated by an email whitelist (`ADMIN_EMAILS` env var
  or the `admin_users` table) — a customer login must never grant admin access
- Every state-changing admin action is written to `audit_logs`

## Design Consistency
The admin panel shares the same shell conventions as the owner dashboard
(sidebar nav, typography scale, spacing scale, card patterns — see PRD.md
5.1/5.2) so the product feels like one system. The one deliberate difference:
admin chrome uses the neutral/product palette only — it never picks up any
individual client's brand color, even when viewing that client's detail page
(their branding appears only inside a preview/embed, not as the page's own
theme).

## Routes

| Route | Purpose |
|---|---|
| `/admin/login` | Separate admin login |
| `/admin/dashboard` | Overview: total users, MRR, churn, recent signups, pending cancellations, failed payments |
| `/admin/clients` | Searchable/filterable list of all businesses |
| `/admin/clients/[id]` | Full detail view of one business: plan, usage, feedback, billing history, Billing section with paid payments and Issue refund |
| `/admin/subscriptions` | All active/past-due/cancelled subscriptions |
| `/admin/revenue` | MRR, ARR, revenue by plan, churn rate |
| `/admin/cancellations` | Open cancellation requests (reason, status, overdue badge) with Mark contacted / Finalize / Owner is staying |
| `/admin/auto-reply-requests` | Owner requests to set up Google review auto-reply: name, business, type, Google account email, phone, plan, status, age (Overdue badge after 48 hours). Actions: Mark contacted (choose email or phone call; shows the owner the Connect Google button) / Activate / Close with a note |
| `/admin/refunds` | Read-only list of all refunds, filterable by status; each row links to the client |
| `/admin/broadcast` | Send an email to all users / a plan segment / a business-type segment |
| `/admin/plans` | Edit plan names, prices, and limits (including customer page limits: menu items, custom links, and the Google auto-reply on/off flag per plan) |
| `/admin/templates` | Edit email template content (all templates in email-templates.md) |
| `/admin/logs` | Audit log of all admin actions |

## Key Actions Available to Admin

| Action | Effect |
|---|---|
| Suspend business | Sets `status = suspended`, review page shows unavailable message |
| Reactivate business | Sets `status = active` |
| Approve or reject a business | Sets `verification_status` to `approved` or `rejected` after checking its onboarding proof (address, phone, FSSAI, GSTIN or local licence). Audit-logged |
| Manually change plan | Overrides plan/limits without going through payment provider |
| Reset scan count | Sets one business's `scans_used` to 0 (for example after a bot attack or a mistake). Required reason. Audit-logged as `scans.reset` |
| Activate auto-reply | On an `auto_reply_requests` row: sets status `active` and `businesses.auto_reply_enabled = 1`, emails the owner (template 14). Refused if the plan has no auto-reply. Audit-logged `autoreply.activated` |
| Close auto-reply request | Sets status `closed` with an internal note; turns `auto_reply_enabled` off if it was on. Audit-logged `autoreply.closed` |
| View usage | Scans used, feedback count, last activity |
| Mark cancellation as contacted | Sets `cancellation_requests.status = contacted` |
| Finalize cancellation | Sets status `finalized`, `subscriptions.cancel_at_period_end = 1`, stops Cashfree auto-renewal, emails the owner; service runs to the end of the paid cycle, then the business moves to Free (business-rules.md 5.2, 5.4). Audit-logged |
| Owner is staying | Sets status `retained`; nothing else changes. Audit-logged |
| Issue refund | On `/admin/clients/[id]` Billing section, per paid payment: amount, required reason, method (Cashfree API or record-only), optional "Also end the paid plan now". Needs admin re-authentication within 10 minutes. Creates a `refunds` row, emails the owner, audit-logged as `refund.issued` (business-rules.md 5A) |
| Hide / restore custom page content | On `/admin/clients/[id]`, per location: **Hide custom page** sets `review_pages.page_custom_hidden = 1` so the public page falls back to the default review page; **Restore** sets it to 0. Used for abuse, phishing or policy violations. Audit-logged as `page.custom_hidden` / `page.custom_restored`; the owner sees a banner in their editor (business-rules.md 11). Admins cannot edit owner content |
| Send broadcast email | Logged in `broadcast_logs`, sent via Resend |
| Edit plan pricing/limits | Updates the `plans` row in `system_settings`; audit-logged; applies to new checkouts only (security-and-reliability.md section 6A) |
| View branding preview | Read-only preview of a client's logo/colors and customer page (including custom blocks) as they appear on their review page, QR, and emails — for support troubleshooting, not editable from admin |
| Regenerate a client's QR (support only) | Updates `review_pages.google_review_url` in place, same as the owner's own "Regenerate" — must NOT issue a new slug; only create a new `review_pages` row if the client is explicitly adding a location |

**Business detail view:** the category is shown read-only and cannot be edited, and the business type dropdown is limited to that category. A wrongly categorised account is fixed only by support deleting and re-creating it (documented).

## Dashboard Metrics to Surface
- Total users (all-time, this month, this week)
- Active vs suspended vs cancelled businesses
- MRR / ARR
- Revenue breakdown by plan
- New MRR / expansion MRR / churned MRR this month
- Count of pending cancellation requests
- Count of currently past-due/failed payments
- Count of overdue cancellation requests (still `pending` after 48 hours)
- Count of "charge after cancellation" flags (payment received after a cancellation was finalized)
- Businesses by category (food, hotel, general)

## Security Notes
- Rate-limit admin login attempts
- Do not expose any admin route or API endpoint without server-side auth
  verification (not just a client-side redirect)
- Consider requiring 2FA for admin login given the sensitivity of billing/data access
- Issuing a refund and finalizing a cancellation require the admin to have logged in within the
  last 10 minutes (same re-authentication rule as owner sensitive actions)
- No owner-callable route may create, read or change `refunds` or cancellation decisions
- Approvals (business verification) are written to `audit_logs` with the admin id, the target business, the action and the time

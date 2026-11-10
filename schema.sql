-- Syehere Database Schema
-- Target: Turso (libSQL / SQLite dialect)
-- Notes vs Postgres:
--   - No native UUID type -> store as TEXT, generate in app code (e.g. crypto.randomUUID())
--   - No JSONB -> store JSON as TEXT, parse/stringify in app code
--   - No Row-Level Security -> tenant isolation MUST be enforced in application
--     code / API layer (always filter every query by business_id from the
--     authenticated session). This is the single most important security rule
--     in this stack — there is no database-level safety net.
--   - Booleans stored as INTEGER (0/1)
--   - Timestamps stored as TEXT (ISO 8601) or INTEGER (unix epoch) — this
--     schema uses TEXT ISO 8601 for readability.

-- ============================================================
-- BUSINESSES (Tenants)
-- ============================================================
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,                  -- app-generated UUID
  firebase_uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  business_category TEXT NOT NULL CHECK (business_category IN ('food', 'hotel', 'general')), -- chosen ONCE in onboarding step 1, then LOCKED (trigger businesses_category_is_locked). food = Restaurant & Cafe, hotel = Hotel, general = Other business
  category_confirm_text TEXT NOT NULL,  -- the name the owner TYPED in the confirmation box (audit); 'legacy' for accounts created before the lock
  category_confirmed_at TEXT NOT NULL,  -- when the owner confirmed the full-screen popup
  business_type TEXT NOT NULL,          -- food: cafe, restaurant. hotel: hotel. general: salon, gym, retail, other
  onboarding_proof TEXT,                -- JSON: address, city, pincode, phone, registration_type (fssai|gstin|licence), registration_number, declared_units. Format-checked only, never shown as "verified"
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')), -- business verification status
  verified_at TEXT,
  verified_by TEXT,                     -- admin id (audit text, no FK)
  tagline TEXT,
  time_zone TEXT NOT NULL DEFAULT 'Asia/Kolkata', -- IANA zone for "Open now" on the customer page and weekly report timing; dropdown in Business profile (PRD.md 5.4.1, 5.5.7). India-first default.
  logo_url TEXT,                        -- null = use default vector logo by type
  primary_color TEXT,
  secondary_color TEXT,                 -- page background / star color are derived, not stored (business-rules.md section 10)
  color_source TEXT NOT NULL DEFAULT 'preset', -- preset (business-type default) or custom (owner-picked)
  google_review_url TEXT,               -- default/fallback link; a location can override via review_pages.google_review_url
  google_oauth_token TEXT,              -- encrypted at app layer before storing
  google_oauth_refresh_token TEXT,
  google_account_email TEXT,            -- shown in Settings > Google connection (display only)
  google_account_name TEXT,             -- Business Profile account resource name chosen by the owner; not a secret
  google_connection_status TEXT NOT NULL DEFAULT 'not_connected', -- not_connected, connected, needs_reconnect (google-approval.md section 10)
  google_connected_at TEXT,
  google_reconnect_notified_at TEXT,    -- so the owner gets ONE reconnect email, not one per cron run
  auto_reply_enabled INTEGER NOT NULL DEFAULT 0,   -- v1: set to 1 ONLY by an admin marking an auto_reply_requests row active (PRD.md 5.4.3)
  auto_reply_templates TEXT,            -- JSON: {positive|neutral|negative: {mode: ai|custom, text}}; see PRD.md 5.4.3
  social_links TEXT,                    -- JSON with allowlisted keys only: instagram, facebook, youtube, x, website, each stored as {"on": true, "url": "..."}; edited on the Customer page, see PRD.md 5.5.4 and 5.5.13
  plan TEXT NOT NULL DEFAULT 'free',    -- free, starter, pro, enterprise
  status TEXT NOT NULL DEFAULT 'active',-- active, past_due, suspended, cancelled
  scan_limit INTEGER NOT NULL DEFAULT 10,
  scans_used INTEGER NOT NULL DEFAULT 0,
  location_limit INTEGER NOT NULL DEFAULT 1,
  billing_cycle_end TEXT,               -- ISO 8601
  scan_reset_at TEXT,                   -- ISO 8601. Next moment scans_used resets to 0 (Free: rolling month from signup; paid: renewal date). Reset happens lazily on the first request after this time, cron is a backstop (business-rules.md section 1)
  scan_limit_notified_at TEXT,          -- set when the "Scan limit reached" email is sent; cleared on reset, so the owner gets ONE email per cycle
  ai_images_used INTEGER NOT NULL DEFAULT 0,          -- AI dish photo credits used in the current period (AI_MENU_PHOTOS.md). Reserved by ONE conditional UPDATE before generation, refunded if the provider fails
  ai_images_lifetime_used INTEGER NOT NULL DEFAULT 0, -- total ever; the Free one-time trial is checked against this
  ai_images_reset_at TEXT,              -- ISO 8601. Next moment ai_images_used resets to 0 (paid plans: the billing cycle date). NULL on Free: the trial never refills
  ai_images_disabled INTEGER NOT NULL DEFAULT 0,   -- 1 = an admin switched AI photos off for this business (abuse); checked on every generate
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  CONSTRAINT category_matches_type CHECK (
    (business_category = 'food' AND business_type IN ('cafe', 'restaurant'))
    OR (business_category = 'hotel' AND business_type = 'hotel')
    OR (business_category = 'general' AND business_type IN ('salon', 'gym', 'retail', 'other'))
  )
);

CREATE INDEX idx_businesses_firebase_uid ON businesses(firebase_uid);

-- ============================================================
-- REVIEW PAGES (QR / NFC targets — one per location)
-- ============================================================
-- IMPORTANT — dynamic QR behavior: `slug` is the ONLY value ever encoded in
-- the printed/exported QR code or written to an NFC tag. It must never
-- change once generated. Every other column here (google_review_url,
-- is_active, location_name) can be edited freely at any time — the QR/NFC
-- code keeps working because it only points at the slug, not at the data
-- behind it. "Regenerate" in the UI updates google_review_url in place; it
-- must NOT issue a new slug unless the owner is explicitly adding a new
-- location (see business-rules.md, Review Link / QR Regeneration).
CREATE TABLE review_pages (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,            -- exactly 6 lowercase alphanumerics, ^[a-z0-9]{6}$ (security-and-reliability.md 4B item 8); permanent, never regenerated in place
  location_name TEXT,
  google_review_url TEXT,               -- per-location override; falls back to businesses.google_review_url if null
  gbp_location_name TEXT,               -- Business Profile location resource name mapped to this location for auto-reply; UNIQUE across businesses (see index below)
  qr_code_url TEXT,
  nfc_enabled INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  deactivated_at TEXT,                  -- set when switched off after a paid plan ends; drives the retention purge (business-rules.md 5B)
  page_config TEXT,                     -- this is the Counter page for hotel and food businesses: JSON customer page content for this location (buttons with on flags and values, manual menu); NULL = default page. Max 100 KB, validated by one shared module
  page_config_version INTEGER NOT NULL DEFAULT 1, -- schema version of page_config, for future migrations
  page_updated_at TEXT,
  spots_page_config TEXT,               -- the Rooms/Tables page for hotel and food businesses: same shape, rules and 100 KB limit as page_config; NULL = not created yet
  spots_page_config_version INTEGER NOT NULL DEFAULT 1,
  spots_page_updated_at TEXT,
  page_custom_hidden INTEGER NOT NULL DEFAULT 0, -- 1 = admin hid the custom content; public page falls back to the default
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_pages_business_id ON review_pages(business_id);
CREATE INDEX idx_review_pages_slug ON review_pages(slug);
CREATE UNIQUE INDEX idx_review_pages_gbp_location ON review_pages(gbp_location_name) WHERE gbp_location_name IS NOT NULL;

-- ============================================================
-- FEEDBACK (customer submissions)
-- ============================================================
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_page_id TEXT REFERENCES review_pages(id) ON DELETE SET NULL,
  sentiment TEXT NOT NULL,              -- positive, negative
  message TEXT,                         -- for negative feedback
  customer_email TEXT,                  -- optional
  google_review_left INTEGER NOT NULL DEFAULT 0,
  owner_replied INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feedback_business_id ON feedback(business_id);

-- ============================================================
-- SCAN EVENTS (analytics; keep lightweight, prune periodically)
-- ============================================================
CREATE TABLE scan_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_page_id TEXT REFERENCES review_pages(id) ON DELETE SET NULL,
  source TEXT,                          -- qr, nfc, link
  visitor_hash TEXT,                    -- SHA-256(ip + user-agent + daily salt); never store raw IP.
                                        -- Used to dedupe repeat scans (see security-and-reliability.md section 4)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_scan_events_business_id ON scan_events(business_id);
CREATE INDEX idx_scan_events_dedupe ON scan_events(review_page_id, visitor_hash, created_at);

-- ============================================================
-- PAGE EVENTS (Phase D analytics for the customer page; keep lightweight, prune at 90 days)
-- ============================================================
-- Never counts toward scans_used. event_type must be one of an allowlist in code
-- (menu_view, link_click, call_tap, whatsapp_tap, directions_tap, wifi_copy) and target_key
-- must exist in the location's saved page_config. See business-rules.md 11.
CREATE TABLE page_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_page_id TEXT REFERENCES review_pages(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  target_key TEXT,                      -- e.g. the custom button id
  visitor_hash TEXT,                    -- same hashing as scan_events; never store raw IP
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_page_events_business_id ON page_events(business_id);
CREATE INDEX idx_page_events_dedupe ON page_events(review_page_id, event_type, target_key, visitor_hash, created_at);

-- ============================================================
-- AI DISH PHOTO JOBS (AI_MENU_PHOTOS.md)
-- ============================================================
-- One row per generation attempt. The credit lives on `businesses.ai_images_used`;
-- this table is the audit trail, the idempotency guard (a double-click or a
-- retried request with the same key can never create a second job or charge a
-- second credit) and the source for the admin spend view. The prompt text is
-- NOT stored, only its hash (it is rebuilt server-side from the item name and
-- details, never typed by the owner). `batch_id` groups the photos reserved by
-- one menu PDF import so the whole batch can be refunded (AI_MENU_PHOTOS.md 4).
CREATE TABLE ai_image_jobs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_page_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  batch_id TEXT,                        -- groups one menu PDF import; null for a single Add photo
  idempotency_key TEXT NOT NULL,        -- client-generated per click (or batch_id + image index)
  status TEXT NOT NULL DEFAULT 'reserved', -- reserved, generating, ready, failed, approved, discarded, expired
  credit_charged INTEGER NOT NULL DEFAULT 1, -- 1 while the credit is spent; set to 0 when it is refunded (failed)
  prompt_hash TEXT NOT NULL,            -- SHA-256 of the server-built prompt
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  image_key TEXT,                       -- R2 key of the full-size draft/approved image (random, server-generated, never owner-supplied)
  thumb_key TEXT,                       -- R2 key of the small menu thumbnail
  provider_cost_paise INTEGER,          -- what the provider charged, for the admin spend view
  failure_code TEXT,                    -- provider_error, safety_blocked, timeout
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE (business_id, idempotency_key)
);

CREATE INDEX idx_ai_image_jobs_business_day ON ai_image_jobs(business_id, created_at);
CREATE INDEX idx_ai_image_jobs_status ON ai_image_jobs(status, created_at);
CREATE INDEX idx_ai_image_jobs_batch ON ai_image_jobs(business_id, batch_id);

-- ============================================================
-- SUBSCRIPTIONS / BILLING (Cashfree only)
-- ============================================================
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'cashfree',
  provider_subscription_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,                 -- active, past_due, cancelled, suspended
  current_period_start TEXT,
  current_period_end TEXT,
  grace_period_ends_at TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0, -- set when a cancellation is finalized (business-rules.md 5.2)
  cancelled_at TEXT,
  cancel_finalized_by TEXT,             -- admin email, or 'system' for the renewal guard
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);

-- ============================================================
-- PAYMENT ATTEMPTS (what WE created, so webhooks can be checked against it)
-- ============================================================
-- Insert a row when the server creates a Cashfree subscription/checkout. The amount comes
-- from the `plans` setting, never from the request. When a payment webhook arrives, match
-- it to this row (by provider_subscription_id or our own reference) and verify the
-- paid amount and currency equal amount_paise / currency BEFORE upgrading the plan.
CREATE TABLE payment_attempts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,                   -- starter, pro (self_serve plans only)
  amount_paise INTEGER NOT NULL,        -- copied from the plans setting at creation time
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'cashfree',
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- created, paid, failed, amount_mismatch
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

CREATE INDEX idx_payment_attempts_business_id ON payment_attempts(business_id);
CREATE INDEX idx_payment_attempts_provider_sub ON payment_attempts(provider_subscription_id);

-- ============================================================
-- CANCELLATION REQUESTS
-- ============================================================
CREATE TABLE cancellation_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  feedback_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, contacted, retained, finalized, withdrawn (business-rules.md 5.1)
  subscription_id TEXT,
  contacted_at TEXT,
  decided_at TEXT,
  decided_by TEXT,                      -- admin email, 'system' or 'owner'
  decision_note TEXT,                   -- max 1000 chars
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cancellation_requests_business_id ON cancellation_requests(business_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(status);

-- ============================================================
-- AUTO-REPLY SETUP REQUESTS (v1: owner asks support to set up Google review auto-reply; PRD.md 5.4.3)
-- ============================================================
CREATE TABLE auto_reply_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,             -- 2 to 80 chars
  business_name TEXT NOT NULL,          -- 2 to 100 chars
  business_type TEXT NOT NULL,          -- cafe, restaurant, hotel, salon, gym, retail, other (allowlist)
  google_account_email TEXT NOT NULL,   -- the email the Google Business Profile was created with, max 254
  phone TEXT NOT NULL,                  -- 7 to 15 digits, optional leading +
  status TEXT NOT NULL DEFAULT 'pending', -- pending, contacted, active, closed
  contact_method TEXT,                  -- email or phone: how support reached the owner (set when marked contacted)
  contacted_at TEXT,
  decided_at TEXT,
  decided_by TEXT,                      -- admin email
  admin_note TEXT,                      -- internal only, max 1000 chars, never shown to the owner
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_auto_reply_requests_business_id ON auto_reply_requests(business_id);
CREATE INDEX idx_auto_reply_requests_status ON auto_reply_requests(status);
-- Enforce one open request per business in code (and with this partial unique index):
CREATE UNIQUE INDEX idx_auto_reply_requests_one_open ON auto_reply_requests(business_id) WHERE status IN ('pending', 'contacted');

-- ============================================================
-- REFUNDS (admin-issued only; see business-rules.md 5A)
-- ============================================================
-- No foreign keys on purpose: business and payment rows are deleted on account deletion,
-- but refund records must be kept as legally required. Personal identifiers can be removed
-- later without losing the money trail.
CREATE TABLE refunds (
  id TEXT PRIMARY KEY,                  -- our refund id; also the idempotency key
  business_id TEXT,                     -- no FK; set null on account deletion
  payment_attempt_id TEXT NOT NULL,     -- no FK; the payment being refunded
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  reason TEXT NOT NULL,                 -- max 1000 chars
  method TEXT NOT NULL,                 -- cashfree_api, manual_record
  provider_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'requested', -- requested, processing, succeeded, failed
  also_ended_plan INTEGER NOT NULL DEFAULT 0,
  issued_by TEXT NOT NULL,              -- admin email
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_refunds_payment ON refunds(payment_attempt_id);
CREATE INDEX idx_refunds_business ON refunds(business_id);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SYSTEM SETTINGS (editable plan limits, prices, etc.)
-- Store `value` as a JSON string, parse in application code.
-- ============================================================
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,                  -- JSON string
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SEED: server-side source of truth for plan prices and limits.
-- Checkout, plan limits and the dashboard plan widget MUST read this row. Prices are
-- NEVER accepted from the client (see security-and-reliability.md section 6A).
-- Money is stored as an integer in paise (INR minor units) to avoid float errors.
-- `page.ai_images` is {limit, period} and is NEVER null: every AI image costs real money, so there is no unlimited AI photo tier (period `lifetime` = one-time trial that never refills, `month` = refills each billing cycle; AI_MENU_PHOTOS.md). `null` for locations/monthly_scans (and for the other `page` limits) means unlimited within the hard security caps in security-and-reliability.md 4C. `self_serve: false` means the
-- plan can never be bought through checkout (Free is assigned at signup; Enterprise
-- is arranged manually by an admin).
-- `google_auto_reply` (boolean) gates Google review auto-reply: true on free, growth and enterprise;
-- false on starter and pro (business-rules.md section 6).
-- `loyalty` and `table_ordering` (booleans) gate the loyalty card and table/room ordering; `crm` (limits or null)
-- gates the CRM. Starter has all three off; Pro has loyalty plus the one category feature; Growth and Enterprise
-- have everything (business-rules.md section 1). Enforced server-side, never read from the client.
-- International / USD paid billing is deferred (PRD.md section 2), so only INR exists.
INSERT INTO system_settings (id, key, value) VALUES (
  'setting_plans',
  'plans',
  '{"free":{"price_inr_paise":0,"locations":1,"monthly_scans":10,"self_serve":false,"google_auto_reply":true,"loyalty":true,"table_ordering":true,"page":{"menu_items":10,"custom_links":null,"ai_images":{"limit":3,"period":"lifetime"}},"crm":null},"starter":{"price_inr_paise":19900,"locations":1,"monthly_scans":1000,"self_serve":true,"google_auto_reply":false,"loyalty":false,"table_ordering":false,"page":{"menu_items":60,"custom_links":null,"ai_images":{"limit":15,"period":"month"}},"crm":null},"pro":{"price_inr_paise":29900,"locations":1,"monthly_scans":10000,"self_serve":true,"google_auto_reply":false,"loyalty":true,"table_ordering":true,"page":{"menu_items":150,"custom_links":null,"ai_images":{"limit":40,"period":"month"}},"crm":{"contacts":2000,"fields":12,"stages":6,"tags":15,"open_tasks":1000,"import_rows":5000}},"growth":{"price_inr_paise":49900,"locations":1,"monthly_scans":25000,"self_serve":true,"google_auto_reply":true,"loyalty":true,"table_ordering":true,"page":{"menu_items":200,"custom_links":null,"ai_images":{"limit":60,"period":"month"}},"crm":{"contacts":10000,"fields":20,"stages":8,"tags":30,"open_tasks":5000,"import_rows":10000}},"enterprise":{"price_inr_paise":null,"locations":null,"monthly_scans":null,"self_serve":false,"google_auto_reply":true,"loyalty":true,"table_ordering":true,"page":{"menu_items":null,"custom_links":null,"ai_images":{"limit":100,"period":"month"}},"crm":{"contacts":100000,"fields":30,"stages":8,"tags":50,"open_tasks":20000,"import_rows":10000}}}'
);

-- SEED: global AI dish photo switches (AI_MENU_PHOTOS.md section 5). Read on EVERY
-- generate call. Ships OFF and with no budget on purpose: an admin turns it on only
-- after the launch gates in AI_MENU_PHOTOS.md section 11 are done. When
-- `daily_budget_paise` is reached the feature pauses itself until the next day.
INSERT INTO system_settings (id, key, value) VALUES (
  'setting_ai_images',
  'ai_images',
  '{"enabled":false,"daily_budget_paise":null,"business_daily_cap":10,"cooldown_seconds":3}'
);

-- ============================================================
-- BROADCAST EMAIL LOGS
-- ============================================================
CREATE TABLE broadcast_logs (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipients_count INTEGER NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- AUDIT LOGS (admin actions)
-- ============================================================
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,                         -- JSON string
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- PROCESSED WEBHOOK EVENTS (idempotency / replay protection)
-- ============================================================
-- Insert the provider's event/order id BEFORE acting on a webhook. If the insert
-- fails on the PRIMARY KEY, the event was already processed: return 200 and do nothing.
CREATE TABLE processed_webhook_events (
  event_id TEXT PRIMARY KEY,            -- provider event id, or order_id + event type
  provider TEXT NOT NULL DEFAULT 'cashfree',
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- LOYALTY PROGRAM (stamp card + rewards) — business-rules.md section 12
-- ============================================================
-- One program per business. Stamps and rewards are an APPEND-ONLY LEDGER: the
-- customer's balance is calculated from `loyalty_stamps` and
-- `loyalty_reward_claims`, never stored as an editable number, so it cannot be
-- bumped by a bug or a hand-edit. Every query MUST filter by business_id
-- (see TENANT ISOLATION below). The rules live in lib/loyalty/rules.ts and run
-- inside ONE transaction (libSQL batch) per action.

CREATE TABLE loyalty_programs (
  business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 1,
  stamps_required INTEGER NOT NULL DEFAULT 10,    -- 3..20
  min_gap_hours INTEGER NOT NULL DEFAULT 4,       -- 0..72, between two stamps for one member
  daily_cap INTEGER NOT NULL DEFAULT 1,           -- 1..5 stamps per member per rolling 24 hours
  reward_valid_days INTEGER NOT NULL DEFAULT 30,  -- 7..365
  stamp_mode TEXT NOT NULL DEFAULT 'both',        -- member_code, counter_code, both
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The 4-5 rewards the owner offers. At most 5 active at once (enforced in app code).
CREATE TABLE loyalty_reward_offers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                  -- 2..40 characters
  description TEXT,                     -- up to 120 characters
  kind TEXT NOT NULL,                   -- free_item, percent_off, amount_off, custom
  monthly_limit INTEGER,                -- null = unlimited; counted per calendar month (UTC)
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_loyalty_reward_offers_business ON loyalty_reward_offers(business_id);

-- People who staff the counter. PIN identifies who gave each stamp / confirmed
-- each reward. Store a slow salted hash (scrypt/argon2), never the PIN.
CREATE TABLE loyalty_staff (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,     -- 5 wrong PINs lock Stamp mode for 5 minutes
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_loyalty_staff_business ON loyalty_staff(business_id);

-- A customer's card. Identified by a CONFIRMED email (code emailed through
-- Resend). Deleting a member removes the email; ledger rows stay, anonymous.
CREATE TABLE loyalty_members (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT,                           -- lower-cased; null after deletion
  email_verified_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_loyalty_members_email ON loyalty_members(business_id, email) WHERE email IS NOT NULL;

-- STAMP LEDGER (append-only). Never UPDATE or DELETE a row except to set
-- voided_at / void_reason when the owner voids a stamp.
CREATE TABLE loyalty_stamps (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES loyalty_members(id),
  staff_id TEXT REFERENCES loyalty_staff(id), -- null when the customer used the counter code
  method TEXT NOT NULL,                 -- member_code, counter_code
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  voided_at TEXT,
  void_reason TEXT
);

CREATE INDEX idx_loyalty_stamps_member ON loyalty_stamps(business_id, member_id, created_at);

-- REWARD CLAIMS: a reward a customer chose after completing a card. Title and
-- description are COPIED from the offer at that moment, so later edits or
-- deletes of the offer never change a reward already chosen. Expiry is derived
-- from expires_at, not stored as a status.
CREATE TABLE loyalty_reward_claims (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES loyalty_members(id),
  offer_id TEXT,                        -- no foreign key on purpose: the offer may be deleted
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,                   -- e.g. K4MP-92QX, unique per business
  status TEXT NOT NULL DEFAULT 'earned',-- earned, redeemed, cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  redeemed_at TEXT,
  redeemed_by TEXT REFERENCES loyalty_staff(id),
  cancelled_at TEXT,
  cancel_reason TEXT
);

CREATE UNIQUE INDEX idx_loyalty_claims_code ON loyalty_reward_claims(business_id, code);
CREATE INDEX idx_loyalty_claims_member ON loyalty_reward_claims(business_id, member_id);
-- Redeem with ONE conditional update so two staff can never redeem the same
-- reward: UPDATE ... SET status='redeemed' WHERE id=? AND business_id=? AND
-- status='earned' AND expires_at > ?  -> exactly 1 row changed means success.

-- ONE-TIME STAMP CODES (60 second life). Store only a hash of the code.
-- kind 'member' = shown on the customer's card; 'counter' = shown on the staff
-- screen. A code works once (used_at). Delete rows older than 10 minutes.
CREATE TABLE loyalty_tokens (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                   -- member, counter
  member_id TEXT REFERENCES loyalty_members(id),
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX idx_loyalty_tokens_lookup ON loyalty_tokens(business_id, kind, code_hash);

-- EMAIL CONFIRMATION CODES for joining a card (6 digits, 10 minutes, 5 tries).
-- Rate limit by IP and by email and check a Turnstile token before sending.
CREATE TABLE loyalty_email_codes (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX idx_loyalty_email_codes_lookup ON loyalty_email_codes(business_id, email, created_at);

-- ============================================================
-- CATEGORY GUARDS: the database refuses what the code must also refuse.
-- A bug in code can never change a locked category.
-- ============================================================

-- 1. The category and its confirmation can never change.
CREATE TRIGGER businesses_category_is_locked
BEFORE UPDATE OF business_category, category_confirm_text, category_confirmed_at ON businesses
BEGIN
  SELECT RAISE(ABORT, 'category_locked')
  WHERE NEW.business_category IS NOT OLD.business_category
     OR NEW.category_confirm_text IS NOT OLD.category_confirm_text
     OR NEW.category_confirmed_at IS NOT OLD.category_confirmed_at;
END;

-- ============================================================
-- TENANT ISOLATION — READ THIS
-- ============================================================
-- Turso/SQLite has no Row-Level Security. Every single query touching
-- review_pages, feedback, scan_events, subscriptions, any loyalty_* table,
-- or any payment/refund table MUST include
-- `WHERE business_id = ?` bound to the authenticated user's own business_id,
-- resolved server-side from their verified Firebase session — NEVER from a
-- client-supplied parameter. Missing this check anywhere is a full data leak
-- across tenants. Recommend wrapping all data access in a single data-access
-- module that always requires and applies business_id, rather than writing
-- raw queries per-route.

-- ============================================================
-- OPEN ITEM: PAYMENT RECORDS vs ACCOUNT DELETION
-- ============================================================
-- payment_attempts and subscriptions above cascade-delete with the business, but
-- security-and-reliability.md section 7 says payment records must be kept as legally
-- required. Decide which wins (ask a lawyer/accountant) and either drop those cascades
-- or copy the needed fields into a separate ledger before deletion. The `refunds` table
-- already avoids foreign keys for this reason.

-- ============================================================
-- TABLE & ROOM QR ORDERING (STAGE 2 — PROPOSED, NOT BUILT)
-- ============================================================
-- Stage 1 merges the ordering UI with browser-local state (one localStorage blob).
-- These tables are the Stage 2 server model from the feature spec: hashed single-use
-- join codes, per-record writes in transactions, owner authentication and realtime.
-- `review_pages.id` is the location (the existing per-location row). Money is stored
-- as integer paise, like the other billing tables. Every table below is tenant-scoped:
-- every query MUST filter by the session's business_id (see TENANT ISOLATION above).
-- `review_pages.spots_page_config` already stores the SaaS page editor's Rooms page;
-- consolidate it with `rooms_page_configs` before building, rather than keeping two
-- sources of truth.

-- One table/room per location. `code` is permanent once issued (qr1, qr2, ...); pausing
-- keeps it reserved. `scans` is display-only and never counts toward scans_used.
CREATE TABLE spots (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  scans INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (location_id, code)
);

CREATE INDEX idx_spots_business_id ON spots(business_id);
CREATE INDEX idx_spots_location ON spots(location_id);

-- Staff who can take tables/rooms. Load is derived from today's active bills, never stored.
CREATE TABLE waiters (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_tables INTEGER NOT NULL DEFAULT 3 CHECK (max_tables BETWEEN 1 AND 8),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_waiters_business_id ON waiters(business_id);
CREATE INDEX idx_waiters_location ON waiters(location_id);
CREATE UNIQUE INDEX idx_waiters_location_name ON waiters(location_id, name COLLATE NOCASE);

-- One running tab. `spot_id` is NULL only for a direct staff punch; `code` is NULL then too.
-- Completion is only through payment verification (amount must equal total_paise exactly).
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  spot_id TEXT REFERENCES spots(id) ON DELETE SET NULL,
  waiter_id TEXT REFERENCES waiters(id) ON DELETE SET NULL,
  number INTEGER NOT NULL,
  code TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT,
  guests INTEGER NOT NULL DEFAULT 2 CHECK (guests BETWEEN 1 AND 12),
  host_device_id TEXT,                  -- Stage 2 replaces this with a signed capability/participant row
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'served', 'completed', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'customer' CHECK (source IN ('customer', 'punch')),
  total_paise INTEGER NOT NULL DEFAULT 0,
  payment_amount_paise INTEGER,
  payment_mode TEXT CHECK (payment_mode IS NULL OR payment_mode IN ('Cash', 'UPI', 'Card')),
  accepted_at TEXT,
  paid_at TEXT,
  bill_sent_at TEXT,
  emailed_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (location_id, number)
);

CREATE INDEX idx_bills_business_id ON bills(business_id);
CREATE INDEX idx_bills_location_status ON bills(location_id, status, created_at);
CREATE INDEX idx_bills_spot ON bills(spot_id, status);
CREATE INDEX idx_bills_waiter ON bills(waiter_id, created_at);

-- A bill has one or more rounds; a reorder/punch appends a round. `via` records the source.
CREATE TABLE bill_rounds (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  round_no INTEGER NOT NULL,
  via TEXT NOT NULL CHECK (via IN ('customer', 'reorder', 'punch')),
  by_name TEXT,
  participant_id TEXT,
  total_paise INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (bill_id, round_no)
);

CREATE INDEX idx_bill_rounds_bill ON bill_rounds(bill_id, round_no);

-- Immutable line snapshots: menu names and prices are copied when ordered, so later
-- menu edits never rewrite an old bill.
CREATE TABLE bill_items (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL REFERENCES bill_rounds(id) ON DELETE CASCADE,
  menu_item_id TEXT,                    -- loose reference into page_config JSON; NULL for a free-text punch
  name TEXT NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 20),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX idx_bill_items_round ON bill_items(round_id);

-- One reusable request per device per bill. Store only a hash of the 6-digit join code;
-- code life 5 minutes, 5 attempts, request life 2 minutes. Enforced in the database in
-- Stage 2, not in the browser.
CREATE TABLE join_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'joined', 'denied', 'cancelled', 'locked')),
  join_code_hash TEXT,
  code_expires_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT NOT NULL,
  approved_at TEXT,
  denied_at TEXT,
  joined_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (bill_id, device_id)
);

CREATE INDEX idx_join_requests_bill_status ON join_requests(bill_id, status);
CREATE INDEX idx_join_requests_business ON join_requests(business_id, created_at);

-- One open call per spot: asking for the bill replaces an open waiter call and vice versa.
CREATE TABLE service_calls (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  spot_id TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  bill_id TEXT REFERENCES bills(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('waiter', 'bill')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  customer_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX idx_service_calls_location_status ON service_calls(location_id, status, created_at);
CREATE UNIQUE INDEX idx_service_calls_one_open ON service_calls(spot_id) WHERE status = 'open';

-- Stage 2 Rooms/Tables page content. The Stage 1 app stores this in `review_pages.spots_page_config`;
-- consolidate before building (see note above). `config` is the same validated JSON shape and 100 KB cap.
CREATE TABLE rooms_page_configs (
  location_id TEXT PRIMARY KEY REFERENCES review_pages(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  config TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_rooms_page_configs_business ON rooms_page_configs(business_id);

-- ============================================================
-- CRM (STAGE 2 PROPOSAL) — spec: CRM_FEATURE.md
-- Owner-side contacts for salon, gym, retail and other (general-category)
-- businesses. Not customer-facing. Every query MUST filter by business_id
-- (see TENANT ISOLATION above). No marketing message is sent in v1, so
-- consent is recorded, not acted on.
-- Per-plan limits (contacts, fields, stages, tags, tasks, import rows) are in
-- CRM_FEATURE.md section 6.5, mirrored in lib/mock/plans.ts and in the
-- `plans` seed above. Hard caps: 100,000 contacts,
-- 30 fields, 8 stages, 50 tags, 20,000 open tasks, 10,000 rows and 2 MB per
-- import.
-- ============================================================

-- One validated JSON config per business: custom field definitions, pipeline
-- stages, module switches and seller invoice details (`config.billing`). Max
-- 100 KB, versioned. Stage ids are referenced by crm_contacts.stage_id but are
-- NOT a foreign key (they live in this JSON and are validated on every write).
-- invoice_seq is per business, monotonic, and never reused by a deleted bill.
CREATE TABLE crm_configs (
  business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  config TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  invoice_seq INTEGER NOT NULL DEFAULT 0 CHECK (invoice_seq >= 0),
  report_seq INTEGER NOT NULL DEFAULT 0 CHECK (report_seq >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A person the owner knows. `custom_fields` is a JSON object keyed by the
-- field `key` defined in crm_configs; values are validated against that
-- config on every write. Soft delete (`deleted_at`) for 30 days, then purge.
-- Email is unique per business when present; phone is not (families share it).
CREATE TABLE crm_contacts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                   -- 1..120
  email TEXT,                           -- lower-cased, trimmed; null allowed
  phone TEXT,                           -- 7..15 digits, optional leading +
  company TEXT,                         -- 0..120
  stage_id TEXT NOT NULL,               -- id from crm_configs.config.stages
  custom_fields TEXT NOT NULL DEFAULT '{}',
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'opted_in', 'opted_out')),
  consent_source TEXT,                  -- manual, import, feedback, loyalty, order
  consent_at TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'feedback', 'loyalty', 'order')),
  last_activity_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE UNIQUE INDEX idx_crm_contacts_email ON crm_contacts(business_id, lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_crm_contacts_stage ON crm_contacts(business_id, stage_id, updated_at);
CREATE INDEX idx_crm_contacts_recent ON crm_contacts(business_id, updated_at DESC);
CREATE INDEX idx_crm_contacts_phone ON crm_contacts(business_id, phone);

-- The manual work/payment ledger. This is bookkeeping, not payment collection:
-- no card, UPI or provider credentials are stored. Amounts are integer paise so
-- money never passes through floating point. Balance and paid/part-paid/unpaid
-- status are derived in the application; paid can never exceed billed.
-- Photos are optional object-storage keys (never public URLs) and require the
-- client's recorded consent. The Stage 1 mock stores compressed data URLs in
-- browser storage; Stage 2 uploads to private R2 and stores only the key.
CREATE TABLE crm_service_entries (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  service TEXT NOT NULL,                -- 1..120
  entry_date TEXT NOT NULL,             -- YYYY-MM-DD, business time zone
  billed_paise INTEGER NOT NULL CHECK (billed_paise >= 0),
  paid_paise INTEGER NOT NULL DEFAULT 0 CHECK (paid_paise >= 0),
  payment_method TEXT NOT NULL DEFAULT 'other'
    CHECK (payment_method IN ('cash', 'upi', 'card', 'bank', 'other')),
  notes TEXT NOT NULL DEFAULT '',       -- 0..2000
  before_photo_key TEXT,                -- private R2 key, null when absent
  after_photo_key TEXT,                 -- private R2 key, null when absent
  photo_consent INTEGER NOT NULL DEFAULT 0
    CHECK (photo_consent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  CHECK (paid_paise <= billed_paise),
  CHECK (before_photo_key IS NULL AND after_photo_key IS NULL OR photo_consent = 1)
);

CREATE INDEX idx_crm_service_entries_contact
  ON crm_service_entries(business_id, contact_id, entry_date DESC);
CREATE INDEX idx_crm_service_entries_recent
  ON crm_service_entries(business_id, entry_date DESC);

-- A printable bill attached to one work record. The work record's billed_paise
-- is the invoice total, so payments remain in crm_service_entries and there is
-- no second payment ledger. invoice_seq on crm_configs produces the number.
CREATE TABLE crm_invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_entry_id TEXT NOT NULL UNIQUE
    REFERENCES crm_service_entries(id) ON DELETE CASCADE,
  number TEXT NOT NULL,                 -- e.g. INV-0001, unique per business
  issue_date TEXT NOT NULL,             -- YYYY-MM-DD
  due_date TEXT NOT NULL,               -- YYYY-MM-DD, >= issue_date
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  tax_percent_bp INTEGER NOT NULL DEFAULT 0
    CHECK (tax_percent_bp BETWEEN 0 AND 5000), -- 18% = 1800 basis points
  notes TEXT NOT NULL DEFAULT '',       -- 0..2000
  terms TEXT NOT NULL DEFAULT '',       -- 0..500
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (due_date >= issue_date),
  UNIQUE (business_id, number)
);

CREATE INDEX idx_crm_invoices_business
  ON crm_invoices(business_id, issue_date DESC);
CREATE INDEX idx_crm_invoices_due
  ON crm_invoices(business_id, due_date);

-- Ordered invoice lines. quantity_hundredths keeps fractional quantities exact
-- (2.50 = 250); rate_paise is integer paise. The invoice total is derived from
-- these lines, the discount and the tax, then cached as billed_paise on the
-- work record so the ledger and the printed bill stay identical.
CREATE TABLE crm_invoice_lines (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES crm_invoices(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 7),
  description TEXT NOT NULL,            -- 1..120
  quantity_hundredths INTEGER NOT NULL
    CHECK (quantity_hundredths > 0 AND quantity_hundredths <= 99900),
  rate_paise INTEGER NOT NULL CHECK (rate_paise >= 0),
  UNIQUE (invoice_id, position)
);

CREATE INDEX idx_crm_invoice_lines_invoice
  ON crm_invoice_lines(business_id, invoice_id, position);

-- Patient-facing clinical report / prescription attached one-to-one to a work
-- record. The visit remains the source for date, service, amount and photos;
-- this table only adds clinical content. `report_seq` on crm_configs produces
-- the number. A report is shared only as a private self-contained file until a
-- later authenticated patient portal is approved.
CREATE TABLE crm_patient_reports (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_entry_id TEXT NOT NULL UNIQUE
    REFERENCES crm_service_entries(id) ON DELETE CASCADE,
  number TEXT NOT NULL,                 -- e.g. RPT-0001, unique per business
  doctor_name TEXT NOT NULL,            -- 1..120
  doctor_qualification TEXT NOT NULL DEFAULT '', -- 0..120
  doctor_registration TEXT NOT NULL DEFAULT '',  -- 0..40
  patient_age TEXT NOT NULL DEFAULT '', -- 0..20, kept as entered (e.g. "8 months")
  patient_gender TEXT CHECK (
    patient_gender IS NULL OR patient_gender IN ('female', 'male', 'nonbinary', 'prefer_not_to_say')
  ),
  chief_complaint TEXT NOT NULL DEFAULT '', -- 0..2000
  diagnosis TEXT NOT NULL,              -- 1..2000
  examination TEXT NOT NULL DEFAULT '', -- 0..2000
  tests TEXT NOT NULL DEFAULT '',       -- 0..2000
  treatment TEXT NOT NULL DEFAULT '',   -- 0..2000
  advice TEXT NOT NULL DEFAULT '',      -- 0..2000
  follow_up_date TEXT,                  -- YYYY-MM-DD, nullable
  include_photos INTEGER NOT NULL DEFAULT 0
    CHECK (include_photos IN (0, 1)),
  share_consent INTEGER NOT NULL DEFAULT 0
    CHECK (share_consent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (business_id, number)
);

CREATE INDEX idx_crm_patient_reports_business
  ON crm_patient_reports(business_id, updated_at DESC);
CREATE INDEX idx_crm_patient_reports_contact
  ON crm_patient_reports(business_id, service_entry_id);

-- Ordered prescription rows. A report has at most 10; position is dense and
-- starts at zero so the patient copy prints in the doctor's entered order.
CREATE TABLE crm_report_medicines (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL REFERENCES crm_patient_reports(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9),
  name TEXT NOT NULL,                   -- 1..120
  dose TEXT NOT NULL DEFAULT '',        -- 0..80
  frequency TEXT NOT NULL DEFAULT '',   -- 0..80
  duration TEXT NOT NULL DEFAULT '',    -- 0..80
  instructions TEXT NOT NULL DEFAULT '',-- 0..240
  UNIQUE (report_id, position)
);

CREATE INDEX idx_crm_report_medicines_report
  ON crm_report_medicines(business_id, report_id, position);

-- Append-only timeline. Notes/calls/visits are never edited; `deleted_at` is a
-- soft hide for the owner and remains in the audit trail.
CREATE TABLE crm_activities (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('note', 'call', 'email', 'visit', 'system')),
  body TEXT NOT NULL,                   -- 1..2000 characters
  created_by TEXT,                      -- owner user id; 'system' for automatic entries
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX idx_crm_activities_contact ON crm_activities(business_id, contact_id, created_at DESC);

-- Follow-ups, not bookings. `due_on` is a date (YYYY-MM-DD) in the business
-- time zone; overdue is derived, never stored as a status.
CREATE TABLE crm_tasks (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                  -- 1..120
  due_on TEXT,                          -- nullable
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_crm_tasks_open ON crm_tasks(business_id, status, due_on);

CREATE TABLE crm_tags (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                   -- 1..24
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (business_id, name COLLATE NOCASE)
);

-- Many-to-many tag links. business_id is duplicated on purpose so every query
-- can filter by tenant without joining crm_contacts first.
CREATE TABLE crm_contact_tags (
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_crm_contact_tags_tag ON crm_contact_tags(business_id, tag_id);

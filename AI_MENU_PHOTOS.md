# AI Dish Photos for the Menu

Owner-approved feature (2026-10-14). Owners can generate a professional dish photo for a menu item
with AI. Customers see a small thumbnail in the menu and can open the photo full screen.

**Status:** Phase 1 (UI + mock generation + mock credits) is built. Phase 2 (real image provider,
real credits, R2 storage) is NOT built and must not start before Stage 2/4 (database, API routes,
R2, Upstash) exist. Real AI keys must never be placed in browser code.

This feature reverses the old "menus are text only" rule. PRD 5.5.6, business-rules 11.20 and
security 4A/4C were updated to match; this file is the detailed spec they point to.

---

## 1. Decisions (owner-approved)

| Topic | Decision |
|---|---|
| What AI makes | One dish photo per item from the item name and "What's in it". Text to image only. No "upload my photo and enhance it" in v1 |
| Prompt | Built by the server (`buildMenuImagePrompt` in `lib/ai-images.ts`). Owners never type a prompt |
| Approval | A generated photo is a draft. It is attached to the item only after the owner taps "Use this photo" |
| Customer view | Thumbnail in the list. Tap opens the photo full screen. Default **Fit** (whole photo); a "Fill screen" button covers the whole phone |
| Label | Customers always see "AI-generated image, for illustration" in the viewer and a one-line note under the menu |
| Orientation | Portrait 2:3 so it fills a phone screen well |

### Plan allowances (placeholders, finalize before launch, see section 11)

| Plan | AI photos | Resets |
|---|---|---|
| Free | 3 | Never (one-time trial) |
| Starter | 15 | Every billing month |
| Pro | 40 | Every billing month |
| Enterprise | 100 (an admin can raise it per business) | Every billing month |

There is **no unlimited tier**. Numbers live in `plans.page.ai_images` (`schema.sql` seed and
`lib/mock/plans.ts`). Rule of thumb for the final numbers: allowance x cost per image should stay
around 10 to 15 percent of the plan price. Check the provider's current price per image first; do not
guess it.

---

## 2. Owner flow

1. Customer page editor > Menu > an item. Each item has a photo square with **Add photo**
   (**Change photo** and **Remove photo** once it has one).
2. Add photo needs an item name first ("Enter an item name first, so the photo matches the dish.").
3. The dialog shows the remaining count, for example "3 of 3 AI photos left (one-time trial)".
4. **Make photo** reserves one credit and generates. The dialog cannot be closed while it works.
5. The owner sees the photo and picks **Use this photo**, **Make another** (uses another credit) or
   **Discard** (the credit stays used, the work was done).
6. If generation fails, the credit is refunded and the owner sees a plain message.
7. Out of credits: no Make photo button; a clear message and a link to Billing (Free), or "they
   refill when your next billing month starts" (paid).
8. The photo is saved with the rest of the page when the owner saves (same Save as every other edit).

**Menu PDF import (one batch).** After the owner reviews an imported menu, photos for the selected
dishes are reserved as ONE batch: up to `min(selected dishes, remaining plan credits, daily room)`.
Each dish gets one photo, attached only after the owner presses **Add N items**. If the whole batch
cannot run, every reserved credit is refunded. If an individual image fails, only that credit is
refunded; the other photos still attach. The import counts as one running job for concurrency, but
every provider call is still one image (`n = 1`). The owner sees how many selected dishes will get a
photo before confirming and can uncheck dishes to fit the allowance.

Downgrade: existing photos stay. Only new generation stops (same idea as business-rules 11.5).

## 3. Customer flow

- Menu screen: items with a photo show a 72 px thumbnail on the right. Items without a photo look
  exactly as before.
- Tap the thumbnail: full-screen viewer (`components/customer-page/photo-viewer.tsx`) with the photo,
  the dish name, price, "What's in it", and the AI label.
- **Fit** shows the entire photo. **Fill screen** covers the entire phone and crops the edges a little.
- Close with the X button or Escape. The page behind does not scroll while it is open, and focus
  returns to the thumbnail.

---

## 4. Cost protection (the most important part)

Every image costs real money. These layers all apply, in this order, on every generate call:

1. **Feature switch.** `system_settings.ai_images.enabled` must be true. Ships `false`.
2. **Eligibility.** Signed-in owner, verified email, business `status = active` (not past_due,
   suspended or cancelled), `ai_images_disabled = 0`, and the page belongs to this business.
3. **Plan allowance.** Credits left on the plan (see 1). Free is a lifetime trial.
4. **Daily hard cap per business**, on every plan: `business_daily_cap` (10 per day).
5. **Cooldown and concurrency.** At most one running job or menu-import batch per business; a short
   cooldown between starts (`cooldown_seconds`); plus an Upstash rate limit per business per minute.
6. **Global daily budget.** `daily_budget_paise` in `system_settings.ai_images`. When today's
   provider spend reaches it, generation pauses for everyone until the next day, and an admin is
   alerted at 70 and 90 percent.
7. **Admin kill switches:** global (`enabled`) and per business (`ai_images_disabled`).
8. **Provider-side spending limit.** Set a hard monthly cap in the provider's console. This is the
   real safety net if every rule above had a bug.
9. **One image per provider request, fixed size.** No provider batch (n = 1 per call), no custom
   sizes, no free-text prompts. A menu PDF import may make several single-image calls, but all its
   credits are reserved once and grouped by `ai_image_jobs.batch_id`.
10. **Idempotency.** The client sends a key per click; the same key never creates a second job or a
    second charge (`ai_image_jobs UNIQUE (business_id, idempotency_key)`).

### Reserve, generate, settle

```
1  Validate input (item name, ownership, plan, status)              -> 4xx, nothing spent
2  Atomic reserve (ONE statement, so parallel requests cannot overspend):
     UPDATE businesses SET ai_images_used = ai_images_used + 1, ai_images_lifetime_used = ai_images_lifetime_used + 1
      WHERE id = ? AND ai_images_disabled = 0 AND <plan allowance not reached> AND <daily cap not reached>
   0 rows changed -> "no credits" / "daily limit", nothing spent
3  Insert ai_image_jobs (status reserved) with the idempotency key
4  Call the provider (timeout, no automatic retries that could double-charge)
5a Success: re-encode, store draft in R2, status ready, return the draft reference
5b Failure or safety block: refund (ai_images_used - 1), status failed, credit_charged = 0
6  Owner approves -> status approved, the item's `image` is saved with page_config
   Owner discards or never approves -> status discarded / expired; the credit stays used
```

Draft images that are never approved are deleted from R2 after 24 hours (cron).

### Menu PDF import batch

```
1  Validate the import: PDF object belongs to this business, reviewed selection has N dishes,
   N <= plan slots left, N <= AI credits left, N <= daily room                     -> 4xx, nothing spent
2  ONE atomic reserve for M = min(N, credits left, daily room):
     UPDATE businesses SET ai_images_used = ai_images_used + M, ... WHERE <all caps still hold>
3  Insert M ai_image_jobs rows in one transaction with:
     - the same batch_id (a random import id)
     - one per-image idempotency key (batch_id + index), so a retry cannot double-charge
     - status reserved, credit_charged = 1
   If the insert fails, refund the reservation before returning; no orphan credits.
4  Generate the M images one request at a time. Attach a ready draft to its selected dish.
   On a single failure: refund that row (ai_images_used - 1, credit_charged = 0).
   On a whole-batch failure/cancel: refund every still-reserved row in one transaction.
5  The owner saves the page -> each attached job becomes approved. Unapproved drafts expire and
   their R2 files are deleted after 24 hours; their credits stay used.
```

A partial allowance never blocks the import: the editor says "N of M selected items get an AI photo"
and the rest are added without one. Only the menu items are limited by the plan, not the import itself.

---

## 5. Data model (Phase 2)

Already added to `schema.sql`:

- `businesses.ai_images_used`, `ai_images_lifetime_used`, `ai_images_reset_at`, `ai_images_disabled`
- table `ai_image_jobs` (audit trail, idempotency, spend), including `batch_id` for menu-import
  photo groups. `batch_id` is null for a normal single **Add photo**; all rows from one import share
  it so the whole batch can be refunded in one action. Per-image idempotency keys remain unique.
- `system_settings` row `ai_images` (ships `enabled: false`, no budget set)
- `plans.page.ai_images` = `{ limit, period }` in the plans seed

Menu item shape (`lib/mock/customer-page.ts`): `image?: { key, variant, ai: true } | null`.
`key` is OUR random id (Stage 4: the R2 object key), never an owner-supplied URL. The save route's zod
schema must accept only `^[a-z0-9-]{8,40}$` keys that exist in `ai_image_jobs` for this business with
status approved, and reject any unknown key in the object.

## 6. API routes (Phase 2)

| Route | Purpose |
|---|---|
| `POST /api/menu-import/upload-url` | Authenticated, origin-checked. Returns a 5-minute signed R2 PUT for one random `menu-imports/<business_id>/<key>.pdf` object plus the key. Never returns R2 credentials |
| `POST /api/menu-import` | Verifies the uploaded object (size, `%PDF-`, page count, same business), extracts via the PDF-capable provider with zod validation, deletes the object in a `finally`, and returns the reviewed menu shape. No photos are created here |
| `POST /api/menu-photos/import-batch` | Reserves up to N credits under one `batch_id`, creates single-image jobs for the selected dishes and returns their drafts + remaining credits |
| `POST /api/menu-photos/generate` | Runs steps 1 to 5 above. Body: location id, item name, details, idempotency key. Returns the draft reference + remaining credits |
| `POST /api/menu-photos/approve` | Marks a ready draft approved (owner confirmed). Idempotent |
| `DELETE /api/menu-photos/[key]` | Removes a photo and its R2 files when an owner removes the photo or the item |
| `GET /api/menu-photos/usage` | Credits left, daily left, period reset date |
| Admin: `/admin` spend view | Today's spend, per business usage, switches (global and per business), audit log |

All routes: authenticated, CSRF/origin checked like other owner routes, zod-validated, rate limited.

## 7. Image and storage

- Generate portrait 2:3. Re-encode with `sharp` to WebP: full size about 1080 x 1620 (a few hundred
  KB at most) and a thumbnail about 160 x 240. Strip metadata. Random file names.
- Served only from the one fixed R2 public domain (`R2_PUBLIC_DOMAIN`). CSP `img-src` adds only that
  domain. No hotlinking, ever.
- Per-business R2 storage cap rises from 5 MB to 20 MB (security 4A) to hold the photos.
- Deleting a menu item, removing a photo, deleting a location or the account deletes the R2 files.
- `<img>` gets `width` and `height`, `loading="lazy"` for thumbnails, and a meaningful `alt`.

## 8. Safety and privacy

- The prompt is the only thing sent to the photo provider: a fixed food-photo style plus the cleaned
  dish name and details. Nothing about the owner, the business, or customers is sent for a photo.
- Menu PDF extraction is separate: the PDF is sent only to the PDF-capable extraction provider, only
  to read the menu, with no training/retention opt-in, and the R2 object is deleted immediately after
  extraction and within 24 hours at the latest (security-and-reliability.md section 4).
- Cleaned text only (letters, digits and a few marks), so text cannot act as an instruction.
- Block outputs the provider flags; refund the credit.
- The AI label is mandatory on the customer page (avoid misleading customers about the real dish).
- Privacy Policy and Terms must name the image provider and say photos are AI-generated before launch.
- Owners can always remove a photo. Admins can remove any photo and disable AI photos for a business.

## 9. Mock (Phase 1) vs real (Phase 2)

| Phase 1 file | Becomes in Phase 2 |
|---|---|
| `lib/mock/ai-images.ts` (browser credit ledger, fake provider, "(fail)" test name) | Deleted. Replaced by the routes in section 6 |
| `lib/menu-import.ts` `mockExtractMenuFromPdf` (labelled sample menu) | Kept as validation/merge helpers; the demo extractor is replaced by `POST /api/menu-import` |
| `components/dashboard/menu-import-dialog.tsx` | Kept; upload becomes the signed R2 PUT, then the extract call; review/limits/save unchanged |
| `components/menu-photo.tsx` (drawn placeholder) | Renders the real R2 `<img>` (same props) |
| `lib/mock/plans.ts` `ai_images` | Read from the `plans` seed row |
| `lib/ai-images.ts` (constants, prompt builder, messages) | Kept, shared by the server routes |
| `components/dashboard/menu-photo-dialog.tsx`, `photo-viewer.tsx`, `menu-screen.tsx` | Kept; only the generate call changes |

To try the refund path in the mock, give a dish a name that contains "(fail)".

## 10. Tests Phase 2 must pass

- Two parallel generate calls with 1 credit left: exactly one succeeds.
- The same idempotency key twice: one job, one credit.
- Import with 5 selected dishes and 2 credits left: exactly 2 jobs, 3 dishes without photos, no overspend.
- Import batch where the provider fails every call: all reserved credits refunded, no photos attached.
- Import batch where one image fails: only that credit is refunded; the successful drafts still attach.
- Replaying the same import apply (same batch idempotency key) creates no second batch and charges once.
- Provider failure and safety block: credit refunded, nothing attached.
- Free owner after 3 photos: refused, no provider call. Paid owner at the monthly limit: refused;
  after the reset date: allowed.
- 11th generation in a day: refused on any plan. Past-due or suspended business: refused.
- Global budget reached: refused for everyone; admin kill switch: refused.
- Saving a menu with a made-up `image.key`, another business's key, or a URL: rejected.
- Removing an item or photo deletes the R2 files; an unapproved draft is deleted after 24 hours.
- A downgrade keeps existing photos and stops new generation.

## 11. Launch gates (all required before `enabled: true`)

1. Image provider and model chosen; current price per image verified from the provider's pricing page.
2. Allowances in section 1 recalculated from that price; plan table, pricing page and `schema.sql` updated.
3. Provider-side hard spending limit set; `daily_budget_paise` set; alerts wired.
4. R2 bucket, public domain and CSP updated; cleanup cron running.
5. Privacy Policy and Terms updated (provider named, AI-generated photos, temporary menu PDFs).
6. Menu PDF upload gates: direct-to-R2 signed PUT, 8 MB / 40 pages, private bucket, deletion within
   24 hours, real extraction and import-batch route implemented (security-and-reliability.md 4/4A).
7. Section 10 tests pass.

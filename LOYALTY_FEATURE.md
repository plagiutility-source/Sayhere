# LOYALTY FEATURE: ONE FILE (instructions + loop prompt + all code)

This single file contains everything to add the loyalty program (stamp card + rewards)
to the Review-SaaS / Syehere repo:
  PART 1  what it is and how to apply it (you read this)
  PART 2  the loop prompt for Freebuff (DeepSeek): paste it as one message
  PART 3  the complete code, as one git patch (29 files: 16 new, 13 edited)

Status: frontend with MOCK data (like the rest of your repo at Stage 1). The database and
server are specified in schema.sql and business-rules.md section 12 but NOT built yet.
Verified before sending: patch applies cleanly to the original repo, `tsc` passes,
`next build` passes, 97 rule checks pass.

======================================================================
PART 1: HOW TO USE THIS FILE
======================================================================
A) With git yourself (fastest, exact):
   1. git checkout -b feature/loyalty
   2. Save this file in the repo root as LOYALTY_FEATURE.md
   3. Extract the patch:
        awk '/^<<<<PATCH_START>>>>$/{f=1;next}/^<<<<PATCH_END>>>>$/{f=0}f' LOYALTY_FEATURE.md > loyalty.patch
   4. git apply --check loyalty.patch      (prints nothing = OK)
      git apply loyalty.patch
   5. npm ci && npx tsc --noEmit && npx tsx scripts/loyalty-rules-check.ts && npx next build
      (tsc prints nothing; rules check ends with "97 passed, 0 failed"; build lists /loyalty)
   6. rm loyalty.patch LOYALTY_FEATURE.md   (so they are not committed), then commit and push.

B) With Freebuff: put this file in the repo root, then paste PART 2 as one message.

Try it: npm run dev. Dashboard sidebar > Loyalty. Customer page /r/<slug> > Loyalty card.
Join with any email (demo code shown on screen). Customer: Get a stamp. Dashboard: Loyalty >
Stamp mode > PIN 1234 > enter the customer's 6 digit code. In Loyalty > Settings set
"Hours between two stamps" to 0 and "Stamps to complete a card" to 3 to test quickly.

Limits: mock data lives in localStorage (anyone can edit it), so this proves the flow, not the
security. Real fake-stamp protection starts in Stage 3 when lib/loyalty/rules.ts runs on the
server (TODO list in PROGRESS.md, "1G checklist"). Not changed: package.json, lockfile, env.

======================================================================
PART 2: LOOP PROMPT FOR FREEBUFF (paste everything between the two lines as ONE message)
======================================================================
------------------------------ PASTE FROM HERE ------------------------------
You are adding a finished, tested feature to my existing Next.js repo (Syehere, Review-SaaS).
The code is ALREADY WRITTEN. It is in the file LOYALTY_FEATURE.md in the repo root, inside
PART 3, as a git patch between the lines <<<<PATCH_START>>>> and <<<<PATCH_END>>>>.
Your job is to apply it exactly and verify it in a loop until every check passes.
You are NOT designing or rewriting anything.

HARD RULES (never break these)
1. Apply the patch EXACTLY. Do not "improve", shorten, reformat, rename or re-write any of it.
   Do not change logic.
2. Do not edit package.json or package-lock.json. Do not install any new package.
3. Do not touch files that the patch does not touch. Do not delete or move existing files.
4. Do not invent files, functions or imports. If something is missing, stop and ask me.
5. Work on the current git branch only. Do not push, merge or force anything. Do not commit
   unless I say "commit".
6. If a command cannot run in this environment, tell me which one and give me the exact
   command to run myself. Never say a check passed unless you ran it and saw the output.

STEP 1: extract the patch
Run exactly:
  awk '/^<<<<PATCH_START>>>>$/{f=1;next}/^<<<<PATCH_END>>>>$/{f=0}f' LOYALTY_FEATURE.md > loyalty.patch
Check that loyalty.patch starts with "diff --git" and ends with a normal diff line. If you
cannot run shell commands, copy the text between the two marker lines, character for
character, into a new file loyalty.patch.

STEP 2: apply it
  git apply --check loyalty.patch      (PASS = prints nothing)
  git apply loyalty.patch
If --check fails because my repo changed since the patch was made:
  run `git apply --reject loyalty.patch`. New files will still be created. For every
  *.rej file, open it and apply each failed hunk by hand to the matching file with the
  smallest edit that keeps my existing code and adds the loyalty lines. Then delete the
  *.rej files. The edits are small and only touch these files: lib/customer-page.ts,
  components/customer-page/{icons,button-grid,customer-page}.tsx, app/r/[slug]/page.tsx,
  components/dashboard/{icons.tsx,nav.ts}, and docs (PRD.md, business-rules.md, schema.sql,
  email-templates.md, privacy-policy.md, PROGRESS.md). If a DOC hunk fails, skip it and tell me.

STEP 3: THE VERIFY LOOP (repeat until B, C and D all pass, maximum 8 rounds)
  A. npm ci                                        (round 1, or if node_modules is missing)
  B. npx tsc --noEmit                              PASS = prints nothing
  C. npx tsx scripts/loyalty-rules-check.ts        PASS = last line is "97 passed, 0 failed"
  D. npx next build                                PASS = completes and route list shows /loyalty
If something fails:
  1. Read the FIRST error only; note the file and line.
  2. Fix only that cause with the smallest change (usually a missing import, or a hunk applied
     wrongly by hand). Compare the broken file with the matching "+" lines in the patch; the
     patch is the source of truth.
  3. Re-run the check that failed, then continue the round.
Never "fix" an error by deleting a feature, using `any`, adding // @ts-ignore, changing the
logic of lib/loyalty/rules.ts, or editing package.json. If round 8 still fails, STOP and send
me: the failing command, the full first error, the file changed in each round, your diagnosis.

STEP 4: clean up and report
Delete loyalty.patch (keep LOYALTY_FEATURE.md until I say). Report in exactly this format:
- Files created: (list)
- Files edited: (list)
- B (tsc): PASS/FAIL + output
- C (rules): final line printed
- D (build): PASS/FAIL, and whether /loyalty is in the route list
- Skipped or different from this prompt: (list, or "nothing")
- git status --short output
Then stop and wait. Do not start any backend, database or API work; that is a later task.

WHAT I SHOULD SEE WHEN IT WORKS (build nothing else)
- Sidebar has "Loyalty" opening /loyalty with 7 tabs (Overview, Stamp mode, Rewards, Staff,
  Members, Activity, Settings).
- My customer page /r/<my slug> shows a "Loyalty card" tile first in the button grid.
- A customer can join with an email (demo code shown on screen), see the stamp card, get a stamp.
- Loyalty > Stamp mode unlocks with demo PIN 1234 and gives a stamp from the customer's code.
------------------------------- PASTE TO HERE -------------------------------

======================================================================
PART 3: THE CODE (git patch, do not edit). Everything between the two marker lines.
======================================================================
<<<<PATCH_START>>>>
diff --git a/PRD.md b/PRD.md
index 3f4e6dc..e9f4285 100644
--- a/PRD.md
+++ b/PRD.md
@@ -600,6 +600,39 @@ Public pages on the production domain, no login needed, HTTPS:
 - Homepage and Privacy Policy URLs are exactly the ones entered on the Google consent screen.
 - The homepage may be a simple static Next.js page reusing the brand guide; it is separate from owners' customer pages.
 
+### 5.7 Loyalty program (stamp card + rewards)
+Rules: business-rules.md section 12. Tables: schema.sql "LOYALTY PROGRAM". Code: `lib/loyalty/rules.ts`.
+
+**Goal:** let a business reward regulars with a digital stamp card, with no way to fake a stamp.
+
+**Customer (on the customer page, `/r/[slug]`)**
+- A **Loyalty card** tile appears first in the button grid while the owner's program is on.
+- Not joined: a short pitch ("Collect N stamps, get a reward"), the reward names, an email field, then a 6 digit code
+  emailed to that address. After confirming, the card opens and stays signed in on that device.
+- **Card:** N stamp circles (filled, dashed empty, a gift icon on the last), "x of N", "n more stamps to your reward",
+  **Get a stamp**, **My rewards**, the list of rewards they can win, and "Not you? Use another email".
+- **Get a stamp:** shows a 6 digit code with a 60 second countdown (staff enter it) and a field for the counter code
+  (customer enters it), depending on the owner's mode. Returns to the card with "Stamp added" when done.
+- **Full card:** **Choose your reward** lists the owner's active offers; the customer picks one and taps **Claim**.
+  The choice is final; the reward is valid for the owner's number of days.
+- **My rewards:** each reward with a status (Ready to use, Used, Expired, Cancelled). A ready reward shows its code, the
+  expiry date and days left, and works once.
+- Paused program: "Loyalty is paused right now. Your stamps and rewards are safe."
+
+**Owner (`/loyalty`, new item in the sidebar, tabs):**
+- **Overview:** setup checklist, stats (members, stamps, rewards chosen and used), per-reward and per-staff tables.
+- **Stamp mode:** staff PIN, then Give a stamp (customer's code), the Counter code, and Redeem a reward (look up, then confirm).
+- **Rewards:** add, edit, pause, delete up to 5 active offers (title, terms, type, optional monthly limit).
+- **Staff:** add staff with a PIN, change a PIN, turn a person on or off.
+- **Members:** list with card progress and rewards ready; delete a member.
+- **Activity:** every stamp and reward, newest first; void a stamp, cancel an unused reward, each with a reason.
+- **Settings:** program on/off, stamps per card, hours between stamps, stamps per 24 hours, reward validity days, and
+  how a stamp is given (both, staff enter the customer's code, customer enters the counter code).
+
+**Not in v1:** points per amount spent, a QR/camera scan of the codes (the codes are typed in Stage 1; Stage 3 adds QR using
+the `qrcode` package already listed in provider-reference.md), Apple/Google Wallet passes, SMS or WhatsApp verification,
+birthday or win-back messages, stamps for Google reviews.
+
 ## 6. Billing Behavior
 - Upgrade: unlocks instantly, confirmation email sent immediately
 - Downgrade: takes effect at end of current billing cycle
diff --git a/PROGRESS.md b/PROGRESS.md
index ac01a7a..dd8f01f 100644
--- a/PROGRESS.md
+++ b/PROGRESS.md
@@ -129,6 +129,7 @@ Build order is layered, NOT the Phase order below. Frontier order:
   - 1D customer review page
   - 1E dashboard shell + Dashboard + Feedback + Analytics
   - 1F Locations + Customer page editor + Billing + Settings
+  - 1G Loyalty program (stamp card + rewards), owner-requested addition
 - Stage 2: Database
 - Stage 3: Backend core
 - Stage 4: Connect (wire frontend to backend)
@@ -963,6 +964,42 @@ T3–T7 not started. This checklist was added by the 1F run on 2026-10-02.
   - `components/dashboard/shell.tsx`: the top-right avatar renders the uploaded
     logo (`data:`/https) when one exists, else the name initial as before.
 
+### 1G checklist (Stage 1, step 1G) — FRONTEND ONLY, mock data, no backend
+Added 2026-10-11 at the owner's request: a loyalty program where every stamp is real. Spec: PRD.md 5.7,
+business-rules.md section 12, schema.sql "LOYALTY PROGRAM". Defaults used (owner decisions still open, see
+"Open decisions"): email confirmation (not phone), stamp mode "both", choose-one-reward on a full card,
+all plans, loyalty does not count toward scans, multiple staff PINs, mock data first.
+- [x] L1. Rules engine `lib/loyalty/rules.ts` (pure, no browser/DB/clock) + `lib/loyalty/pin.ts` (PIN hash, uniqueness,
+      lockout). One-time 60 second codes (single use, not consumed by a "too soon" refusal), cooldown, rolling 24 hour
+      cap, derived balance with carry-over, append-only ledger with void/cancel, reward claim copies the offer, monthly
+      offer limit, max 5 active offers, redeem once, expiry derived, member delete keeps the ledger.
+      Verified: `npx tsx scripts/loyalty-rules-check.ts` -> 97 passed, 0 failed.
+- [x] L2. Mock store `lib/mock/loyalty-store.ts` (localStorage `syehere.mock.loyalty.v1`, sanitised on read, memory
+      fallback, cross-tab updates) + `lib/use-loyalty.ts` hooks (state is null until mount, so no hydration mismatch).
+      Demo staff "Counter" with PIN 1234 is created on first dashboard visit. The emailed code is shown on screen
+      (demo mode). MOCK ONLY: localStorage can be edited, so this proves the flow, not the fraud protection.
+- [x] L3. Customer page: `components/customer-page/loyalty-screen.tsx` (join with email + code, stamp card, Get a stamp,
+      Choose reward, My rewards, paused state). A "Loyalty card" tile is added first in the button grid for the current
+      mock business's slugs while the program is on (`CustomerButton` kind/screen `loyalty`, `?screen=loyalty` deep
+      link allowed). Uses the page's brand CSS variables, 44 px+ targets, font weights 400/500 only.
+- [x] L4. Dashboard: `/loyalty` with tabs Overview, Stamp mode, Rewards, Staff, Members, Activity, Settings
+      (`components/dashboard/loyalty/*`), new sidebar item with `LoyaltyIcon`.
+- [x] L5. Docs: schema.sql loyalty tables, business-rules.md 12, PRD.md 5.7, email-templates.md 15, privacy-policy.md 3.
+- [x] Verified: `tsc` and `next build` pass; every route 200. No headless browser here, so two simulated-DOM walks (jsdom +
+      Testing Library, test-only packages installed with `--no-save`, scripts not kept) drove the real components:
+      customer flow 20/20 (join, wrong code, stamp by staff in another tab, stamp by counter code, complete card, choose
+      reward, staff redeem updates the customer screen, deleted member signed out, paused program) and owner flow 20/20
+      (PIN refused/accepted, wrong code refused, 3 stamps, reward redeemed once and a second try blocked, lock, 5 rewards
+      with the 6th kept paused, duplicate PIN refused, resize blocked while a full card waits, days clamped, void stamp).
+- [ ] Stage 3 TODO (real protection): run `rules.ts` on the server in one libSQL transaction per action; Turnstile +
+      Upstash rate limits on join/send-code/verify and on Stamp mode PIN; Resend email (template 15); signed httpOnly
+      session cookie for the customer; staff session cookie and a separate `/stamp` route; CSPRNG codes stored as hashes;
+      slow PIN hash (scrypt/argon2); QR display/scan via the `qrcode` package; redeem as ONE conditional UPDATE; prune old
+      tokens; extend the scenario tests with real HTTP (replay, cross-tenant, concurrency).
+- [ ] Known limitation to settle before Stage 3: `stamps_required` is one number per program and the balance is derived from
+      it, so a change affects every card (refused while a full card is waiting). If owners must change it freely, store
+      the size per card cycle instead.
+
 ---
 
 ## Phase 0: Google approvals (owner tasks, START FIRST, they take weeks; see google-approval.md)
@@ -1299,6 +1336,9 @@ cancellation acceptance tests in security-and-reliability.md section 7 pass.
 findings, and a real payment + password reset have been tested end to end.
 
 ## Open decisions (owner must answer; agent must not guess)
+- Loyalty (1G, defaults applied until answered): (1) stamp mode both vs one; (2) email vs phone/WhatsApp verification
+  (phone adds a paid provider); (3) which plans get loyalty and whether it counts toward scans; (4) stamp card only vs
+  points per spend; (5) one owner PIN vs several staff PINs; (6) Stage 3 timing for real fraud protection.
 - Confirm `RETENTION_DAYS_AFTER_CANCEL` (spec default: 90 days; only extra locations are
   purged, see business-rules.md 5B), and the 2-day renewal guard (business-rules.md 5.2)
 - Confirm that a finalized cancellation means "move to Free", not "close the account"
@@ -1755,3 +1795,9 @@ findings, and a real payment + password reset have been tested end to end.
   the post-mount overlay was verified through the script, hydration safety is by
   construction (first render uses the default profile). Next: unchanged —
   Stage 2 (Database) on a `feat/stage-2-*` branch.
+
+- 2026-10-11 — Loyalty program (owner request, step 1G, mock data only): added the rules engine, mock store, customer
+  Loyalty card screens and the `/loyalty` owner dashboard, plus schema, business rules, PRD 5.7, email template 15 and a
+  privacy-policy line. Defaults used where the owner had not answered yet (listed under Open decisions). Verified `tsc`,
+  `next build`, 97 rule checks and two 20-check simulated-DOM walks. Real anti-fake protection needs Stage 3 (server);
+  the Stage 3 TODO list is in the 1G checklist. Next: unchanged — Stage 2 (Database), including the loyalty tables.
diff --git a/app/(dashboard)/loyalty/page.tsx b/app/(dashboard)/loyalty/page.tsx
new file mode 100644
index 0000000..f763603
--- /dev/null
+++ b/app/(dashboard)/loyalty/page.tsx
@@ -0,0 +1,12 @@
+import { LoyaltyContent } from "@/components/dashboard/loyalty/loyalty-content";
+import { resolveDemoScenario } from "@/lib/mock/demo";
+
+export default async function LoyaltyPage({
+  searchParams,
+}: {
+  searchParams: Promise<Record<string, string | string[] | undefined>>;
+}) {
+  const params = await searchParams;
+  const demo = resolveDemoScenario(params.demo);
+  return <LoyaltyContent demo={demo} />;
+}
diff --git a/app/r/[slug]/page.tsx b/app/r/[slug]/page.tsx
index 4b61aa2..c4762a5 100644
--- a/app/r/[slug]/page.tsx
+++ b/app/r/[slug]/page.tsx
@@ -48,6 +48,7 @@ const SCREENS: CustomerScreen[] = [
   "menu",
   "hours",
   "pay",
+  "loyalty",
 ];
 
 function parseInitialScreen(
diff --git a/business-rules.md b/business-rules.md
index bc829ae..8fbbfbb 100644
--- a/business-rules.md
+++ b/business-rules.md
@@ -386,3 +386,58 @@ Spec: PRD.md section 5.5. Rules that must be built exactly:
     verify them (anti-scam); Copy UPI ID is the fallback where the link cannot open. No list of UPI
     apps and no device detection: the phone decides what opens.
 
+
+---
+
+## 12. Loyalty Program (stamp card + rewards)
+Spec: PRD.md section 5.7. Code: `lib/loyalty/rules.ts` (the ONE place these rules live). Rules that must be built exactly:
+
+1. **Optional, per business.** A business has at most one program (`loyalty_programs`). The customer page shows the
+   **Loyalty card** button first in the grid only while the program is on. It is not a `page_config` button. Loyalty is
+   available on every plan, and loyalty actions do NOT count toward `scans_used` (owner decision pending, see PROGRESS.md
+   open decisions). If the business is suspended or at its scan limit the whole customer page is already unavailable.
+2. **Identity = confirmed email.** A card exists only after the customer confirms an emailed 6 digit code (10 minutes,
+   5 tries). Sending the code needs a Turnstile token, a rate limit per IP and per email, and one email per 60 seconds.
+   The email is used only for this card (privacy-policy.md). Members can be deleted by the owner; the email is removed and
+   the ledger rows stay without a name.
+3. **The printed review QR is never a stamp source.** Anyone can photograph it. A stamp needs a one-time code:
+   - **Mode A (`member_code`)**: the customer's card shows a 6 digit code that changes every 60 seconds; a staff member
+     enters (Stage 3: or scans) it in Stamp mode.
+   - **Mode B (`counter_code`)**: Stamp mode shows a 6 digit code; the signed-in customer types (Stage 3: or scans) it.
+   - The owner picks `member_code`, `counter_code` or `both` (default `both`).
+4. **One-time codes.** A code lives 60 seconds and works once. Using it marks `used_at` in the same transaction as the stamp.
+   A code refused for "too soon" or "daily limit" is NOT consumed. Only one live counter code exists at a time; a new
+   customer code replaces that customer's old one. Stage 3 stores only a hash of each code and generates it with a CSPRNG.
+5. **Abuse limits (owner-tunable inside fixed ranges, clamped on the server):** hours between two stamps for one member
+   0 to 72 (default 4); stamps per member per rolling 24 hours 1 to 5 (default 1). A stamp is also refused while the program
+   is off or the member's email is not confirmed.
+6. **The balance is derived, never stored.** `valid stamps = stamps where voided_at is null`;
+   `cards completed = floor(valid stamps / stamps_required)`; `rewards waiting = cards completed − rewards already chosen`.
+   Extra stamps carry over to the next card. `loyalty_stamps` and `loyalty_reward_claims` are append-only: the only allowed
+   UPDATEs are void (`voided_at`, `void_reason`), redeem, and cancel. No route may set a balance.
+7. **Changing `stamps_required`** (3 to 20, default 10) is refused while any member has a full card waiting for a reward,
+   because the derived balance would change under them. It applies to all cards from then on.
+8. **Reward offers (the 4 to 5 rewards).** The owner keeps up to 20 offers, at most **5 active** at once. Fields: title
+   (2 to 40), description (up to 120), type (`free_item`, `percent_off`, `amount_off`, `custom`), optional monthly limit
+   (whole number, counted per calendar month in UTC), active. Paused or over-limit offers are hidden from the choice list.
+9. **Choosing a reward.** A member with a full card picks ONE active offer. The server creates a claim that **copies**
+   the title and description, gets a unique code (`XXXX-XXXX`, no look-alike characters) and expires after
+   `reward_valid_days` (7 to 365, default 30). The choice is final. Editing, pausing or deleting the offer later never
+   changes a claim already made. A claim can only be created when `rewards waiting >= 1`, so rewards can not be handed out
+   by staff or by the owner without a completed card.
+10. **Redeeming.** Staff look the code up (shows reward, member, expiry), then confirm. Confirm is ONE conditional UPDATE
+    (`status = 'earned' AND expires_at > now`); exactly one changed row means success, so two staff can never redeem the
+    same reward. Expiry is derived from `expires_at`, never stored as a status. The staff member is recorded.
+11. **Staff and PINs.** Up to 10 staff per business, each with a name and a 4 to 6 digit PIN, unique among active staff,
+    stored as a slow salted hash. Every stamp (Mode A) and every redemption records `staff_id`. Five wrong PINs lock Stamp
+    mode for 5 minutes. Stamp mode locks itself after 5 quiet minutes. Turning a staff member off stops their PIN at once;
+    history stays. Stage 3: Stamp mode gets its own `/stamp` route with a staff session cookie, so counter staff never need
+    the owner's login on the counter device.
+12. **Owner control.** The owner can void a stamp and cancel an unused reward (both stay in the ledger with a reason), turn
+    a staff member off, pause an offer, pause the whole program (stamps stop; existing stamps and unexpired rewards are
+    kept and rewards can still be redeemed), and delete a member. Activity is built from the ledger so nothing can be hidden.
+13. **No stamp for leaving a Google review.** Google does not tell us who reviewed, so it would be fakeable. Not built.
+14. **Tenant isolation.** Every query on a `loyalty_*` table filters by the business resolved from the session or the
+    slug, never from a client-supplied business id. The customer's own card is read from their signed session cookie.
+15. **Plan end / downgrade.** Data is kept. Follow 5B for any purge decision (open). Account deletion deletes all
+    `loyalty_*` rows with the business.
diff --git a/components/customer-page/button-grid.tsx b/components/customer-page/button-grid.tsx
index 1ff268b..88be376 100644
--- a/components/customer-page/button-grid.tsx
+++ b/components/customer-page/button-grid.tsx
@@ -5,6 +5,7 @@ import { isStretchedTile, type CustomerButton } from "@/lib/customer-page";
 import {
   ClockIcon,
   CurrencyRupeeIcon,
+  GiftIcon,
   LinkIcon,
   ListIcon,
   MapIcon,
@@ -38,6 +39,8 @@ function ButtonIcon({
       return <MapIcon size={26} />;
     case "pay":
       return <CurrencyRupeeIcon size={26} />;
+    case "loyalty":
+      return <GiftIcon size={26} />;
     case "custom":
       return <LinkIcon size={26} />;
   }
@@ -59,6 +62,7 @@ type ButtonGridProps = {
   onOpenMenu: () => void;
   onOpenHours: () => void;
   onOpenPay: () => void;
+  onOpenLoyalty: () => void;
 };
 
 /**
@@ -72,6 +76,7 @@ export function ButtonGrid({
   onOpenMenu,
   onOpenHours,
   onOpenPay,
+  onOpenLoyalty,
 }: ButtonGridProps) {
   if (buttons.length === 0) return null;
 
@@ -114,7 +119,9 @@ export function ButtonGrid({
                 ? onOpenMenu
                 : button.screen === "hours"
                   ? onOpenHours
-                  : onOpenPay
+                  : button.screen === "loyalty"
+                    ? onOpenLoyalty
+                    : onOpenPay
             }
             className={classes}
           >
diff --git a/components/customer-page/customer-page.tsx b/components/customer-page/customer-page.tsx
index 217c84b..10f1fac 100644
--- a/components/customer-page/customer-page.tsx
+++ b/components/customer-page/customer-page.tsx
@@ -8,6 +8,7 @@ import type { ReviewGenMode } from "@/lib/mock/review";
 import { businessOwnsSlug } from "@/lib/mock/locations";
 import { displayableLogo, resolveStoredPage } from "@/lib/mock/store";
 import { useBusiness, useStoredPageData } from "@/lib/use-business";
+import { useLoyaltyState } from "@/lib/use-loyalty";
 import {
   clampText,
   isOpenNow,
@@ -22,6 +23,7 @@ import { BackButton } from "./back-button";
 import { ButtonGrid } from "./button-grid";
 import { FeedbackScreen, UnhappyOptions } from "./feedback-screen";
 import { HoursScreen } from "./hours-screen";
+import { LoyaltyScreen } from "./loyalty-screen";
 import { MehIcon, SmileIcon } from "./icons";
 import { MenuScreen } from "./menu-screen";
 import { PayScreen } from "./pay-screen";
@@ -37,7 +39,8 @@ export type CustomerScreen =
   | "thanks"
   | "menu"
   | "hours"
-  | "pay";
+  | "pay"
+  | "loyalty";
 
 export type CustomerPageProps = {
   slug: string;
@@ -129,9 +132,26 @@ export function CustomerPage(props: CustomerPageProps) {
     effectiveConfig?.thank_you ?? "",
     MAX_THANK_YOU_LENGTH,
   );
-  const buttons = effectiveConfig
+  const configButtons = effectiveConfig
     ? shownButtons(effectiveConfig, effectiveBusiness.business_type)
     : [];
+  // Loyalty card tile: shown first when the owner's program is on. It is not a
+  // page_config button; it is controlled by the Loyalty dashboard (PRD 5.7).
+  // MOCK ONLY: the program is read from localStorage after mount and applies to
+  // the current mock business's slugs only (same rule as the saved page content).
+  const loyaltyState = useLoyaltyState();
+  const loyaltyOn = ownsSlug && loyaltyState?.program.enabled === true;
+  const buttons: CustomerButton[] = loyaltyOn
+    ? [
+        {
+          key: "loyalty",
+          kind: "loyalty",
+          label: "Loyalty card",
+          screen: "loyalty",
+        },
+        ...configButtons,
+      ]
+    : configButtons;
   const customLinks = effectiveConfig
     ? shownCustomLinks(effectiveConfig, effectiveBusiness.business_type)
     : [];
@@ -190,6 +210,7 @@ export function CustomerPage(props: CustomerPageProps) {
             onOpenMenu={() => setScreen("menu")}
             onOpenHours={() => setScreen("hours")}
             onOpenPay={() => setScreen("pay")}
+            onOpenLoyalty={() => setScreen("loyalty")}
             onHappy={() => {
               setPath("happy");
               setScreen("review");
@@ -256,6 +277,12 @@ export function CustomerPage(props: CustomerPageProps) {
             theme={theme}
             onBack={goHome}
           />
+        ) : screen === "loyalty" && ownsSlug ? (
+          <LoyaltyScreen
+            businessName={effectiveBusiness.name}
+            theme={theme}
+            onBack={goHome}
+          />
         ) : (
           <StubScreen
             title={stubTitle(screen)}
@@ -284,6 +311,7 @@ const STUB_TITLES: Record<Exclude<CustomerScreen, "home">, string> = {
   menu: "Menu",
   hours: "Hours and contact",
   pay: "Pay",
+  loyalty: "Loyalty card",
 };
 
 function stubTitle(screen: CustomerScreen): string {
@@ -299,6 +327,7 @@ function HomeScreen({
   onOpenMenu,
   onOpenHours,
   onOpenPay,
+  onOpenLoyalty,
   onHappy,
   onUnhappy,
 }: {
@@ -310,6 +339,7 @@ function HomeScreen({
   onOpenMenu: () => void;
   onOpenHours: () => void;
   onOpenPay: () => void;
+  onOpenLoyalty: () => void;
   onHappy: () => void;
   onUnhappy: () => void;
 }) {
@@ -383,6 +413,7 @@ function HomeScreen({
         onOpenMenu={onOpenMenu}
         onOpenHours={onOpenHours}
         onOpenPay={onOpenPay}
+        onOpenLoyalty={onOpenLoyalty}
       />
 
       <SocialRow icons={socials} color={theme.primary} className="mt-2xl" />
diff --git a/components/customer-page/icons.tsx b/components/customer-page/icons.tsx
index 6f67928..caf7533 100644
--- a/components/customer-page/icons.tsx
+++ b/components/customer-page/icons.tsx
@@ -198,3 +198,14 @@ export function WorldIcon(props: IconProps) {
     </Svg>
   );
 }
+
+export function GiftIcon(props: IconProps) {
+  return (
+    <Svg {...props}>
+      <rect x="3" y="8" width="18" height="4" rx="1" />
+      <path d="M12 8v13" />
+      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
+      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
+    </Svg>
+  );
+}
diff --git a/components/customer-page/loyalty-screen.tsx b/components/customer-page/loyalty-screen.tsx
new file mode 100644
index 0000000..ef5896e
--- /dev/null
+++ b/components/customer-page/loyalty-screen.tsx
@@ -0,0 +1,871 @@
+"use client";
+
+/**
+ * The customer's loyalty card (PRD.md 5.7, business-rules.md section 12).
+ *
+ * Flow: join with an email -> confirm the emailed code -> stamp card. A stamp
+ * only ever comes from a one-time code (never from this screen alone):
+ *  - "Show your code": the customer shows a 6 digit code that changes every
+ *    minute and staff enter it in Stamp mode (Mode A), or
+ *  - "Enter the counter code": the customer types the code shown on the
+ *    counter screen (Mode B).
+ * A full card lets the customer choose ONE reward from the owner's active
+ * offers; the reward then shows a code that staff confirm once.
+ *
+ * MOCK ONLY (Stage 1): state lives in localStorage via `lib/mock/loyalty-store`
+ * and the emailed code is shown on screen. Stage 4 replaces both with server
+ * calls; this component keeps the same screens.
+ */
+
+import { useEffect, useMemo, useRef, useState } from "react";
+import type { BrandTheme } from "@/lib/brand/theme";
+import {
+  availableOffers,
+  cardProgress,
+  claimReward,
+  claimView,
+  ensureMember,
+  issueMemberCode,
+  markEmailVerified,
+  normalizeEmail,
+  stampWithCounterCode,
+  type ClaimView,
+  type LoyaltyState,
+  type RewardClaim,
+} from "@/lib/loyalty/rules";
+import {
+  mockCheckEmailCode,
+  mockSendEmailCode,
+  setSessionMemberId,
+  tryLoyalty,
+} from "@/lib/mock/loyalty-store";
+import { useLoyaltySession, useLoyaltyState, useNow } from "@/lib/use-loyalty";
+import { EMAIL_FORMAT_MESSAGE, MAX_EMAIL_LENGTH, isValidEmail } from "@/lib/validation";
+import { BackButton } from "./back-button";
+import { CheckIcon, GiftIcon } from "./icons";
+
+const PRIMARY_BUTTON =
+  "inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
+const SECONDARY_BUTTON =
+  "inline-flex min-h-[48px] w-full items-center justify-center gap-sm rounded-control border border-black/15 bg-white px-lg text-[15px] font-medium text-ink transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
+const TEXT_BUTTON =
+  "inline-flex min-h-[44px] items-center justify-center px-md text-[13px] text-ink-muted underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
+const INPUT =
+  "block min-h-[52px] w-full rounded-control border border-black/15 bg-white px-md text-[16px] text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
+
+type View = "card" | "stamp" | "choose" | "rewards";
+
+type LoyaltyScreenProps = {
+  businessName: string;
+  theme: BrandTheme;
+  onBack: () => void;
+};
+
+export function LoyaltyScreen({ businessName, theme, onBack }: LoyaltyScreenProps) {
+  const state = useLoyaltyState();
+  const [memberId, sessionReady] = useLoyaltySession();
+  const now = useNow(1000);
+  const [view, setView] = useState<View>("card");
+  const [notice, setNotice] = useState<string | null>(null);
+
+  const member = useMemo(
+    () => state?.members.find((m) => m.id === memberId && !m.deleted_at) ?? null,
+    [state, memberId],
+  );
+
+  // A card that no longer exists (deleted by the owner) signs this device out.
+  useEffect(() => {
+    if (state && sessionReady && memberId && !member) setSessionMemberId(null);
+  }, [state, sessionReady, memberId, member]);
+
+  const back = (
+    <BackButton
+      label="Loyalty card"
+      onBack={onBack}
+      color={theme.primary}
+      onPrimary={theme.onPrimary}
+    />
+  );
+
+  if (!state || !sessionReady || !now) {
+    return (
+      <div>
+        {back}
+        <div className="mt-2xl h-[260px] animate-pulse rounded-card bg-black/5" />
+      </div>
+    );
+  }
+
+  if (!state.program.enabled) {
+    return (
+      <div>
+        {back}
+        <div className="mt-2xl rounded-card border border-black/10 bg-white p-xl text-center">
+          <p className="text-[17px] font-medium">Loyalty is paused right now</p>
+          <p className="mt-sm text-[15px] text-ink-muted">
+            Your stamps and rewards are safe. Please check back soon.
+          </p>
+        </div>
+      </div>
+    );
+  }
+
+  if (!member) {
+    return (
+      <div>
+        {back}
+        <JoinFlow businessName={businessName} state={state} theme={theme} />
+      </div>
+    );
+  }
+
+  return (
+    <div>
+      {back}
+      {notice ? (
+        <p
+          role="status"
+          aria-live="polite"
+          className="mt-lg rounded-control bg-white px-md py-sm text-center text-[14px] text-ink shadow-soft"
+        >
+          {notice}
+        </p>
+      ) : null}
+      {view === "card" ? (
+        <CardView
+          state={state}
+          memberId={member.id}
+          email={member.email ?? ""}
+          now={now}
+          onStamp={() => {
+            setNotice(null);
+            setView("stamp");
+          }}
+          onChoose={() => setView("choose")}
+          onRewards={() => setView("rewards")}
+        />
+      ) : view === "stamp" ? (
+        <StampView
+          state={state}
+          memberId={member.id}
+          now={now}
+          onDone={(message) => {
+            setNotice(message);
+            setView("card");
+          }}
+          onCancel={() => setView("card")}
+        />
+      ) : view === "choose" ? (
+        <ChooseView
+          state={state}
+          memberId={member.id}
+          now={now}
+          onDone={() => {
+            setNotice("Reward claimed. Show it to staff when you want to use it.");
+            setView("rewards");
+          }}
+          onCancel={() => setView("card")}
+        />
+      ) : (
+        <RewardsView
+          state={state}
+          memberId={member.id}
+          now={now}
+          onCard={() => setView("card")}
+        />
+      )}
+    </div>
+  );
+}
+
+// ---------------------------------------------------------------------------
+// Join: email -> code
+// ---------------------------------------------------------------------------
+
+function JoinFlow({
+  businessName,
+  state,
+  theme,
+}: {
+  businessName: string;
+  state: LoyaltyState;
+  theme: BrandTheme;
+}) {
+  const [step, setStep] = useState<"email" | "code">("email");
+  const [email, setEmail] = useState("");
+  const [code, setCode] = useState("");
+  const [error, setError] = useState<string | null>(null);
+  const [demoCode, setDemoCode] = useState<string | null>(null);
+  const offers = state.offers.filter((o) => o.active);
+
+  function sendCode() {
+    const value = normalizeEmail(email);
+    if (!isValidEmail(value)) {
+      setError(EMAIL_FORMAT_MESSAGE);
+      return;
+    }
+    setError(null);
+    // The real server checks a Turnstile token and rate limits before emailing.
+    setDemoCode(mockSendEmailCode(value));
+    setCode("");
+    setStep("code");
+  }
+
+  function confirm() {
+    const value = normalizeEmail(email);
+    const checked = mockCheckEmailCode(value, code);
+    if (!checked.ok) {
+      setError(checked.message);
+      return;
+    }
+    const res = tryLoyalty((s) => {
+      const ensured = ensureMember(s, value, new Date());
+      return markEmailVerified(ensured.state, ensured.member.id, new Date());
+    });
+    if (!res.ok) {
+      setError(res.message);
+      return;
+    }
+    setSessionMemberId(res.member.id);
+  }
+
+  return (
+    <div className="mt-2xl">
+      <div className="text-center">
+        <span
+          className="inline-flex h-14 w-14 items-center justify-center rounded-full"
+          style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
+        >
+          <GiftIcon size={28} />
+        </span>
+        <h2 className="mt-md font-display text-[22px] font-medium leading-tight">
+          Collect {state.program.stamps_required} stamps, get a reward
+        </h2>
+        <p className="mt-sm text-[15px] text-ink-muted">
+          Get a stamp each time you visit {businessName}. Complete the card and
+          choose your reward.
+        </p>
+      </div>
+
+      {offers.length > 0 ? (
+        <ul className="mt-lg flex flex-wrap justify-center gap-sm" aria-label="Rewards you can win">
+          {offers.map((offer) => (
+            <li
+              key={offer.id}
+              className="rounded-pill border border-black/10 bg-white px-md py-sm text-[13px] font-medium"
+            >
+              {offer.title}
+            </li>
+          ))}
+        </ul>
+      ) : null}
+
+      {step === "email" ? (
+        <form
+          className="mt-2xl grid gap-md"
+          onSubmit={(event) => {
+            event.preventDefault();
+            sendCode();
+          }}
+          noValidate
+        >
+          <label htmlFor="loyalty-email" className="text-[15px] font-medium">
+            Your email
+          </label>
+          <input
+            id="loyalty-email"
+            type="email"
+            inputMode="email"
+            autoComplete="email"
+            maxLength={MAX_EMAIL_LENGTH}
+            value={email}
+            onChange={(event) => setEmail(event.target.value)}
+            placeholder="you@example.com"
+            className={INPUT}
+            aria-describedby={error ? "loyalty-error" : undefined}
+            aria-invalid={error ? true : undefined}
+          />
+          {error ? (
+            <p id="loyalty-error" role="alert" className="text-[13px] text-red-700">
+              {error}
+            </p>
+          ) : null}
+          <button type="submit" className={PRIMARY_BUTTON}>
+            Send my code
+          </button>
+          <p className="text-center text-[13px] text-ink-muted">
+            We use your email only for this loyalty card. We send one code to
+            confirm it is you.
+          </p>
+        </form>
+      ) : (
+        <form
+          className="mt-2xl grid gap-md"
+          onSubmit={(event) => {
+            event.preventDefault();
+            confirm();
+          }}
+          noValidate
+        >
+          <label htmlFor="loyalty-otp" className="text-[15px] font-medium">
+            Enter the 6 digit code we sent to {normalizeEmail(email)}
+          </label>
+          <input
+            id="loyalty-otp"
+            inputMode="numeric"
+            autoComplete="one-time-code"
+            maxLength={6}
+            value={code}
+            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
+            className={`${INPUT} text-center text-[24px] tracking-[0.3em]`}
+            aria-describedby={error ? "loyalty-error" : undefined}
+            aria-invalid={error ? true : undefined}
+          />
+          {error ? (
+            <p id="loyalty-error" role="alert" className="text-[13px] text-red-700">
+              {error}
+            </p>
+          ) : null}
+          <button type="submit" className={PRIMARY_BUTTON} disabled={code.length !== 6}>
+            Open my card
+          </button>
+          <div className="flex justify-center gap-md">
+            <button type="button" className={TEXT_BUTTON} onClick={sendCode}>
+              Send a new code
+            </button>
+            <button
+              type="button"
+              className={TEXT_BUTTON}
+              onClick={() => {
+                setStep("email");
+                setError(null);
+              }}
+            >
+              Change email
+            </button>
+          </div>
+          {demoCode ? (
+            <p className="rounded-control border border-dashed border-black/20 bg-white px-md py-sm text-center text-[13px] text-ink-muted">
+              Demo mode: no email is sent. Your code is{" "}
+              <span className="font-medium tabular-nums text-ink">{demoCode}</span>.
+            </p>
+          ) : null}
+        </form>
+      )}
+    </div>
+  );
+}
+
+// ---------------------------------------------------------------------------
+// The card
+// ---------------------------------------------------------------------------
+
+function StampGrid({ required, filled }: { required: number; filled: number }) {
+  return (
+    <ol
+      className="grid grid-cols-5 gap-md"
+      aria-label={`${filled} of ${required} stamps collected`}
+    >
+      {Array.from({ length: required }, (_, index) => {
+        const done = index < filled;
+        const last = index === required - 1;
+        return (
+          <li
+            key={index}
+            className="relative flex aspect-square items-center justify-center rounded-full"
+            aria-label={
+              done ? `Stamp ${index + 1} collected` : `Stamp ${index + 1} not collected`
+            }
+          >
+            {done ? (
+              <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--cp-on-primary)] text-[var(--cp-primary)]">
+                <CheckIcon size={22} />
+              </span>
+            ) : (
+              <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-current opacity-50">
+                {last ? (
+                  <GiftIcon size={20} />
+                ) : (
+                  <span className="text-[14px] tabular-nums">{index + 1}</span>
+                )}
+              </span>
+            )}
+          </li>
+        );
+      })}
+    </ol>
+  );
+}
+
+function CardView({
+  state,
+  memberId,
+  email,
+  now,
+  onStamp,
+  onChoose,
+  onRewards,
+}: {
+  state: LoyaltyState;
+  memberId: string;
+  email: string;
+  now: Date;
+  onStamp: () => void;
+  onChoose: () => void;
+  onRewards: () => void;
+}) {
+  const progress = cardProgress(state, memberId);
+  const left = progress.required - progress.current;
+  const myClaims = state.claims.filter((c) => c.member_id === memberId);
+  const ready = myClaims.filter((c) => claimView(c, now) === "earned").length;
+  const offers = state.offers.filter((o) => o.active);
+
+  return (
+    <div className="mt-2xl">
+      <p className="truncate text-[13px] text-ink-muted">{email}</p>
+
+      <section
+        className="mt-sm rounded-card p-xl"
+        style={{ backgroundColor: "var(--cp-primary)", color: "var(--cp-on-primary)" }}
+        aria-label="Stamp card"
+      >
+        <div className="flex items-baseline justify-between">
+          <h2 className="font-display text-[19px] font-medium">Stamp card</h2>
+          <p className="text-[15px] tabular-nums">
+            {progress.current} of {progress.required}
+          </p>
+        </div>
+        <div className="mt-lg">
+          <StampGrid required={progress.required} filled={progress.current} />
+        </div>
+        <p className="mt-lg text-[14px]" role="status" aria-live="polite">
+          {progress.pending > 0
+            ? "Card complete. Choose your reward."
+            : left === 1
+              ? "1 more stamp to your reward."
+              : `${left} more stamps to your reward.`}
+        </p>
+      </section>
+
+      <div className="mt-lg grid gap-md">
+        {progress.pending > 0 ? (
+          <button type="button" className={PRIMARY_BUTTON} onClick={onChoose}>
+            <GiftIcon size={22} />
+            Choose your reward
+          </button>
+        ) : null}
+        <button
+          type="button"
+          className={progress.pending > 0 ? SECONDARY_BUTTON : PRIMARY_BUTTON}
+          onClick={onStamp}
+        >
+          Get a stamp
+        </button>
+        <button type="button" className={SECONDARY_BUTTON} onClick={onRewards}>
+          My rewards{ready > 0 ? ` (${ready} ready)` : ""}
+        </button>
+      </div>
+
+      {offers.length > 0 ? (
+        <section className="mt-2xl" aria-label="Rewards you can win">
+          <h3 className="text-[13px] text-ink-muted">Rewards you can win</h3>
+          <ul className="mt-sm flex flex-wrap gap-sm">
+            {offers.map((offer) => (
+              <li
+                key={offer.id}
+                className="rounded-pill border border-black/10 bg-white px-md py-sm text-[13px] font-medium"
+              >
+                {offer.title}
+              </li>
+            ))}
+          </ul>
+        </section>
+      ) : null}
+
+      <div className="mt-xl flex justify-center">
+        <button
+          type="button"
+          className={TEXT_BUTTON}
+          onClick={() => setSessionMemberId(null)}
+        >
+          Not you? Use another email
+        </button>
+      </div>
+    </div>
+  );
+}
+
+// ---------------------------------------------------------------------------
+// Get a stamp
+// ---------------------------------------------------------------------------
+
+function StampView({
+  state,
+  memberId,
+  now,
+  onDone,
+  onCancel,
+}: {
+  state: LoyaltyState;
+  memberId: string;
+  now: Date;
+  onDone: (message: string) => void;
+  onCancel: () => void;
+}) {
+  const mode = state.program.stamp_mode;
+  const showCode = mode === "member_code" || mode === "both";
+  const enterCode = mode === "counter_code" || mode === "both";
+
+  const live = state.tokens.find(
+    (t) =>
+      t.kind === "member" &&
+      t.member_id === memberId &&
+      !t.used_at &&
+      new Date(t.expires_at).getTime() > now.getTime(),
+  );
+
+  // Keep one live code on screen; a fresh one replaces an expired one.
+  const needsCode = showCode && !live;
+  useEffect(() => {
+    if (needsCode) tryLoyalty((s) => issueMemberCode(s, memberId, new Date()));
+  }, [needsCode, memberId]);
+
+  // Staff give the stamp from their screen: when the total grows, go back.
+  const total = cardProgress(state, memberId).total;
+  const startTotal = useRef(total);
+  useEffect(() => {
+    if (total > startTotal.current) {
+      const progress = cardProgress(state, memberId);
+      onDone(
+        progress.pending > 0
+          ? "Stamp added. Your card is complete!"
+          : "Stamp added. Thank you!",
+      );
+    }
+  }, [total, state, memberId, onDone]);
+
+  const secondsLeft = live
+    ? Math.max(0, Math.ceil((new Date(live.expires_at).getTime() - now.getTime()) / 1000))
+    : 0;
+
+  const [code, setCode] = useState("");
+  const [error, setError] = useState<string | null>(null);
+
+  function submitCounterCode() {
+    const res = tryLoyalty((s) => stampWithCounterCode(s, { code, memberId }, new Date()));
+    if (!res.ok) {
+      setError(res.message);
+      return;
+    }
+    onDone(res.completed ? "Stamp added. Your card is complete!" : "Stamp added. Thank you!");
+  }
+
+  return (
+    <div className="mt-2xl grid gap-xl">
+      {showCode ? (
+        <section className="rounded-card border border-black/10 bg-white p-xl text-center">
+          <h2 className="text-[17px] font-medium">Show this code to staff</h2>
+          <p className="mt-xs text-[13px] text-ink-muted">
+            Show it after you pay. Staff type it in to give you a stamp.
+          </p>
+          <p
+            className="mt-lg font-display text-[44px] font-medium leading-none tracking-[0.12em] tabular-nums"
+            aria-label={live ? `Your code is ${live.code.split("").join(" ")}` : "Getting your code"}
+          >
+            {live ? `${live.code.slice(0, 3)} ${live.code.slice(3)}` : "--- ---"}
+          </p>
+          <div
+            className="mx-auto mt-lg h-1 w-40 overflow-hidden rounded-full bg-black/10"
+            role="presentation"
+          >
+            <div
+              className="h-full bg-[var(--cp-primary)] transition-[width] duration-1000 ease-linear"
+              style={{ width: `${(secondsLeft / 60) * 100}%` }}
+            />
+          </div>
+          <p className="mt-sm text-[13px] tabular-nums text-ink-muted">
+            New code in {secondsLeft}s
+          </p>
+        </section>
+      ) : null}
+
+      {enterCode ? (
+        <form
+          className="rounded-card border border-black/10 bg-white p-xl"
+          onSubmit={(event) => {
+            event.preventDefault();
+            submitCounterCode();
+          }}
+          noValidate
+        >
+          <h2 className="text-[17px] font-medium">Or enter the counter code</h2>
+          <p className="mt-xs text-[13px] text-ink-muted">
+            Ask staff to show the code on their screen.
+          </p>
+          <label htmlFor="counter-code" className="sr-only">
+            Counter code
+          </label>
+          <input
+            id="counter-code"
+            inputMode="numeric"
+            autoComplete="off"
+            maxLength={6}
+            value={code}
+            onChange={(event) => {
+              setCode(event.target.value.replace(/\D/g, ""));
+              setError(null);
+            }}
+            className={`${INPUT} mt-md text-center text-[24px] tracking-[0.3em]`}
+            aria-describedby={error ? "counter-error" : undefined}
+            aria-invalid={error ? true : undefined}
+          />
+          {error ? (
+            <p id="counter-error" role="alert" className="mt-sm text-[13px] text-red-700">
+              {error}
+            </p>
+          ) : null}
+          <button
+            type="submit"
+            className={`${PRIMARY_BUTTON} mt-md`}
+            disabled={code.length !== 6}
+          >
+            Add my stamp
+          </button>
+        </form>
+      ) : null}
+
+      <button type="button" className={SECONDARY_BUTTON} onClick={onCancel}>
+        Back to my card
+      </button>
+    </div>
+  );
+}
+
+// ---------------------------------------------------------------------------
+// Choose a reward
+// ---------------------------------------------------------------------------
+
+function ChooseView({
+  state,
+  memberId,
+  now,
+  onDone,
+  onCancel,
+}: {
+  state: LoyaltyState;
+  memberId: string;
+  now: Date;
+  onDone: () => void;
+  onCancel: () => void;
+}) {
+  const progress = cardProgress(state, memberId);
+  const offers = availableOffers(state, now);
+  const [picked, setPicked] = useState<string | null>(null);
+  const [error, setError] = useState<string | null>(null);
+  const selected = offers.find((o) => o.id === picked) ?? null;
+
+  if (progress.pending < 1) {
+    return (
+      <div className="mt-2xl rounded-card border border-black/10 bg-white p-xl text-center">
+        <p className="text-[17px] font-medium">No reward to choose yet</p>
+        <p className="mt-sm text-[15px] text-ink-muted">
+          Complete your stamp card to unlock a reward.
+        </p>
+        <button type="button" className={`${SECONDARY_BUTTON} mt-lg`} onClick={onCancel}>
+          Back to my card
+        </button>
+      </div>
+    );
+  }
+
+  function claim() {
+    if (!picked) return;
+    const res = tryLoyalty((s) => claimReward(s, { memberId, offerId: picked }, new Date()));
+    if (!res.ok) {
+      setError(res.message);
+      setPicked(null);
+      return;
+    }
+    onDone();
+  }
+
+  return (
+    <div className="mt-2xl">
+      <h2 className="font-display text-[22px] font-medium leading-tight">
+        Card complete. Choose your reward.
+      </h2>
+      {offers.length === 0 ? (
+        <p className="mt-lg rounded-card border border-black/10 bg-white p-xl text-[15px] text-ink-muted">
+          No rewards are available right now. Your full card is saved, so please
+          try again soon.
+        </p>
+      ) : (
+        <div role="radiogroup" aria-label="Reward options" className="mt-lg grid gap-md">
+          {offers.map((offer) => {
+            const on = offer.id === picked;
+            return (
+              <button
+                key={offer.id}
+                type="button"
+                role="radio"
+                aria-checked={on}
+                onClick={() => {
+                  setPicked(offer.id);
+                  setError(null);
+                }}
+                className={`flex min-h-[64px] w-full items-center gap-md rounded-card border-2 bg-white p-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
+                  on ? "border-[var(--cp-primary)]" : "border-black/10 hover:bg-black/[0.02]"
+                }`}
+              >
+                <span
+                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
+                    on
+                      ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-[var(--cp-on-primary)]"
+                      : "border-black/30"
+                  }`}
+                  aria-hidden="true"
+                >
+                  {on ? <CheckIcon size={14} /> : null}
+                </span>
+                <span className="flex min-w-0 flex-1 flex-col">
+                  <span className="text-[16px] font-medium">{offer.title}</span>
+                  {offer.description ? (
+                    <span className="text-[13px] text-ink-muted">{offer.description}</span>
+                  ) : null}
+                </span>
+              </button>
+            );
+          })}
+        </div>
+      )}
+      {error ? (
+        <p role="alert" className="mt-md text-[13px] text-red-700">
+          {error}
+        </p>
+      ) : null}
+      <button
+        type="button"
+        className={`${PRIMARY_BUTTON} mt-xl`}
+        disabled={!selected}
+        onClick={claim}
+      >
+        {selected ? `Claim ${selected.title}` : "Choose a reward"}
+      </button>
+      <p className="mt-md text-center text-[13px] text-ink-muted">
+        Your choice is final. The reward is valid for {state.program.reward_valid_days} days
+        after you claim it.
+      </p>
+      <div className="mt-sm flex justify-center">
+        <button type="button" className={TEXT_BUTTON} onClick={onCancel}>
+          Not now
+        </button>
+      </div>
+    </div>
+  );
+}
+
+// ---------------------------------------------------------------------------
+// My rewards
+// ---------------------------------------------------------------------------
+
+const VIEW_LABEL: Record<ClaimView, string> = {
+  earned: "Ready to use",
+  redeemed: "Used",
+  expired: "Expired",
+  cancelled: "Cancelled",
+};
+
+function formatDate(iso: string): string {
+  return new Intl.DateTimeFormat("en-IN", {
+    day: "numeric",
+    month: "short",
+    year: "numeric",
+  }).format(new Date(iso));
+}
+
+function RewardCard({ claim, now }: { claim: RewardClaim; now: Date }) {
+  const view = claimView(claim, now);
+  const live = view === "earned";
+  const daysLeft = Math.max(
+    0,
+    Math.ceil((new Date(claim.expires_at).getTime() - now.getTime()) / 86_400_000),
+  );
+  return (
+    <li
+      className={`rounded-card border bg-white p-xl ${
+        live ? "border-[var(--cp-primary)] border-2" : "border-black/10 opacity-80"
+      }`}
+    >
+      <div className="flex items-start justify-between gap-md">
+        <div className="min-w-0">
+          <p className="text-[17px] font-medium">{claim.title}</p>
+          {claim.description ? (
+            <p className="text-[13px] text-ink-muted">{claim.description}</p>
+          ) : null}
+        </div>
+        <span
+          className={`shrink-0 rounded-pill px-md py-xs text-[12px] font-medium ${
+            live ? "bg-[var(--cp-primary)] text-[var(--cp-on-primary)]" : "bg-black/5 text-ink-muted"
+          }`}
+        >
+          {VIEW_LABEL[view]}
+        </span>
+      </div>
+      {live ? (
+        <div className="mt-lg text-center">
+          <p className="text-[13px] text-ink-muted">Show this code to staff</p>
+          <p className="mt-xs font-display text-[30px] font-medium tracking-[0.1em] tabular-nums">
+            {claim.code}
+          </p>
+          <p className="mt-sm text-[13px] text-ink-muted">
+            Valid until {formatDate(claim.expires_at)} ({daysLeft}{" "}
+            {daysLeft === 1 ? "day" : "days"} left). It works once.
+          </p>
+        </div>
+      ) : (
+        <p className="mt-md text-[13px] text-ink-muted">
+          {view === "redeemed" && claim.redeemed_at
+            ? `Used on ${formatDate(claim.redeemed_at)}.`
+            : view === "expired"
+              ? `Expired on ${formatDate(claim.expires_at)}.`
+              : "This reward was cancelled by the business."}
+        </p>
+      )}
+    </li>
+  );
+}
+
+function RewardsView({
+  state,
+  memberId,
+  now,
+  onCard,
+}: {
+  state: LoyaltyState;
+  memberId: string;
+  now: Date;
+  onCard: () => void;
+}) {
+  const claims = state.claims
+    .filter((c) => c.member_id === memberId)
+    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
+  return (
+    <div className="mt-2xl">
+      <h2 className="font-display text-[22px] font-medium leading-tight">My rewards</h2>
+      {claims.length === 0 ? (
+        <p className="mt-lg rounded-card border border-black/10 bg-white p-xl text-center text-[15px] text-ink-muted">
+          No rewards yet. Complete your stamp card to earn one.
+        </p>
+      ) : (
+        <ul className="mt-lg grid gap-md" aria-live="polite">
+          {claims.map((claim) => (
+            <RewardCard key={claim.id} claim={claim} now={now} />
+          ))}
+        </ul>
+      )}
+      <button type="button" className={`${SECONDARY_BUTTON} mt-xl`} onClick={onCard}>
+        Back to my card
+      </button>
+    </div>
+  );
+}
diff --git a/components/dashboard/icons.tsx b/components/dashboard/icons.tsx
index 056a3e8..bffc9e3 100644
--- a/components/dashboard/icons.tsx
+++ b/components/dashboard/icons.tsx
@@ -95,6 +95,17 @@ export function SettingsIcon(props: IconProps) {
   );
 }
 
+export function LoyaltyIcon(props: IconProps) {
+  return (
+    <Icon {...props}>
+      <rect x="3" y="8" width="18" height="4" rx="1" />
+      <path d="M12 8v13" />
+      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
+      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
+    </Icon>
+  );
+}
+
 export function SearchIcon(props: IconProps) {
   return (
     <Icon {...props}>
diff --git a/components/dashboard/loyalty/activity-tab.tsx b/components/dashboard/loyalty/activity-tab.tsx
new file mode 100644
index 0000000..7d0536d
--- /dev/null
+++ b/components/dashboard/loyalty/activity-tab.tsx
@@ -0,0 +1,152 @@
+"use client";
+
+/**
+ * Activity: every stamp and reward, newest first, built from the ledger so
+ * nothing can be hidden. The owner can void a stamp or cancel an unused
+ * reward; both stay in the list, marked, with the reason.
+ */
+
+import { useState } from "react";
+import { Modal } from "@/components/dashboard/modal";
+import {
+  activityLog,
+  cancelClaim,
+  voidStamp,
+  type ActivityItem,
+  type LoyaltyState,
+} from "@/lib/loyalty/rules";
+import { tryLoyalty } from "@/lib/mock/loyalty-store";
+import { useNow } from "@/lib/use-loyalty";
+import { Field, Notice, Panel, btnDanger, btnSecondary, formatWhen, inputCls } from "./ui";
+
+const PAGE = 50;
+
+type Action = { type: "void" | "cancel"; item: ActivityItem } | null;
+
+export function ActivityTab({ state }: { state: LoyaltyState }) {
+  const now = useNow(60_000) ?? new Date(0);
+  const [action, setAction] = useState<Action>(null);
+  const [reason, setReason] = useState("");
+  const [error, setError] = useState<string | null>(null);
+  const [shown, setShown] = useState(PAGE);
+
+  const items = activityLog(state, now);
+
+  function confirm() {
+    if (!action) return;
+    const when = new Date();
+    const res = tryLoyalty((s) =>
+      action.type === "void" && action.item.stampId
+        ? voidStamp(s, action.item.stampId, reason, when)
+        : action.item.claimId
+          ? cancelClaim(s, action.item.claimId, reason, when)
+          : { ok: false as const, code: "invalid_input" as const, message: "Nothing to change." },
+    );
+    if (!res.ok) {
+      setError(res.message);
+      return;
+    }
+    setAction(null);
+    setReason("");
+    setError(null);
+  }
+
+  return (
+    <Panel
+      title="Activity"
+      description="Every stamp and reward. Nothing is ever deleted from this list."
+    >
+      {items.length === 0 ? (
+        <p className="text-[13px] text-ink-muted">Nothing yet. Stamps and rewards show up here.</p>
+      ) : (
+        <ul className="divide-y divide-black/5">
+          {items.slice(0, shown).map((item) => (
+            <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
+              <div className="min-w-0 flex-1">
+                <p
+                  className={`text-[13px] ${
+                    item.kind === "stamp_voided" || item.kind === "reward_cancelled"
+                      ? "text-ink-muted line-through"
+                      : "text-ink"
+                  }`}
+                >
+                  {item.text}
+                </p>
+                <p className="text-[12px] text-ink-muted">{formatWhen(item.at)}</p>
+              </div>
+              {item.kind === "stamp" ? (
+                <button
+                  type="button"
+                  className={btnDanger}
+                  onClick={() => {
+                    setAction({ type: "void", item });
+                    setReason("");
+                    setError(null);
+                  }}
+                >
+                  Void stamp
+                </button>
+              ) : null}
+              {item.kind === "reward_chosen" && item.cancellable ? (
+                <button
+                  type="button"
+                  className={btnDanger}
+                  onClick={() => {
+                    setAction({ type: "cancel", item });
+                    setReason("");
+                    setError(null);
+                  }}
+                >
+                  Cancel reward
+                </button>
+              ) : null}
+            </li>
+          ))}
+        </ul>
+      )}
+      {items.length > shown ? (
+        <button type="button" className={`${btnSecondary} mt-4`} onClick={() => setShown(shown + PAGE)}>
+          Show more
+        </button>
+      ) : null}
+
+      <Modal
+        open={action !== null}
+        title={action?.type === "void" ? "Void this stamp?" : "Cancel this reward?"}
+        onClose={() => setAction(null)}
+        footer={
+          <>
+            <button type="button" className={btnSecondary} onClick={() => setAction(null)}>
+              Go back
+            </button>
+            <button type="button" className={btnDanger} onClick={confirm}>
+              {action?.type === "void" ? "Void stamp" : "Cancel reward"}
+            </button>
+          </>
+        }
+      >
+        <p className="text-[13px] text-ink-muted">
+          {action?.type === "void"
+            ? "The stamp stays in your history, marked as voided, and the customer's card goes down by one."
+            : "The customer can no longer use this reward. Their stamps are not given back."}
+        </p>
+        <div className="mt-3">
+          <Field label="Reason (optional)" htmlFor="activity-reason">
+            <input
+              id="activity-reason"
+              maxLength={200}
+              value={reason}
+              onChange={(event) => setReason(event.target.value)}
+              className={inputCls}
+            />
+          </Field>
+        </div>
+        {error ? (
+          <div className="mt-3">
+            <Notice kind="error">{error}</Notice>
+          </div>
+        ) : null}
+      </Modal>
+    </Panel>
+  );
+}
diff --git a/components/dashboard/loyalty/loyalty-content.tsx b/components/dashboard/loyalty/loyalty-content.tsx
new file mode 100644
index 0000000..2d1ab25
--- /dev/null
+++ b/components/dashboard/loyalty/loyalty-content.tsx
@@ -0,0 +1,104 @@
+"use client";
+
+/**
+ * `/loyalty` (PRD.md 5.7). One page with tabs, same pattern as `/settings`:
+ * Overview, Stamp mode, Rewards, Staff, Members, Activity, Settings.
+ *
+ * MOCK ONLY (Stage 1): state comes from `lib/mock/loyalty-store` (localStorage)
+ * through the pure rules in `lib/loyalty/rules.ts`. Stage 4 swaps the store for
+ * server calls; the screens stay. In Stage 3 Stamp mode also gets its own
+ * `/stamp` route with a staff session, so counter staff never need the owner's
+ * login.
+ */
+
+import Link from "next/link";
+import { useSearchParams } from "next/navigation";
+import type { DemoScenario } from "@/lib/mock/demo";
+import { useLoyaltyState } from "@/lib/use-loyalty";
+import { ActivityTab } from "./activity-tab";
+import { MembersTab } from "./members-tab";
+import { OverviewTab } from "./overview-tab";
+import { RewardsTab } from "./rewards-tab";
+import { SettingsTab } from "./settings-tab";
+import { StaffTab } from "./staff-tab";
+import { StampModeTab } from "./stamp-mode-tab";
+
+const TABS = [
+  { id: "overview", label: "Overview" },
+  { id: "stamp", label: "Stamp mode" },
+  { id: "rewards", label: "Rewards" },
+  { id: "staff", label: "Staff" },
+  { id: "members", label: "Members" },
+  { id: "activity", label: "Activity" },
+  { id: "settings", label: "Settings" },
+] as const;
+
+export type LoyaltyTabId = (typeof TABS)[number]["id"];
+
+function resolveTab(value: string | null): LoyaltyTabId {
+  return TABS.find((tab) => tab.id === value)?.id ?? "overview";
+}
+
+export function LoyaltyContent({ demo }: { demo: DemoScenario }) {
+  const searchParams = useSearchParams();
+  const active = resolveTab(searchParams.get("tab"));
+  const state = useLoyaltyState({ seedDemoStaff: true });
+
+  return (
+    <div>
+      <header>
+        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">Loyalty</h1>
+        <p className="mt-1 text-[13px] text-ink-muted">
+          Reward regulars with a stamp card. Stamps only come from one-time
+          codes, so they can not be faked.
+        </p>
+      </header>
+
+      <nav
+        aria-label="Loyalty tabs"
+        className="mt-5 flex flex-wrap gap-1 border-b border-black/10"
+      >
+        {TABS.map((tab) => {
+          const isActive = tab.id === active;
+          return (
+            <Link
+              key={tab.id}
+              href={`/loyalty?demo=${demo}&tab=${tab.id}`}
+              aria-current={isActive ? "page" : undefined}
+              className={`-mb-px inline-flex h-10 items-center border-b-2 px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
+                isActive
+                  ? "border-brand-blue text-brand-blue"
+                  : "border-transparent text-ink-muted hover:text-ink"
+              }`}
+            >
+              {tab.label}
+            </Link>
+          );
+        })}
+      </nav>
+
+      <div className="mt-5">
+        {!state ? (
+          <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
+            <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
+            <div className="mt-5 h-24 w-full animate-pulse rounded-control bg-surface-muted" />
+          </div>
+        ) : active === "overview" ? (
+          <OverviewTab state={state} demo={demo} />
+        ) : active === "stamp" ? (
+          <StampModeTab state={state} demo={demo} />
+        ) : active === "rewards" ? (
+          <RewardsTab state={state} />
+        ) : active === "staff" ? (
+          <StaffTab state={state} />
+        ) : active === "members" ? (
+          <MembersTab state={state} />
+        ) : active === "activity" ? (
+          <ActivityTab state={state} />
+        ) : (
+          <SettingsTab state={state} />
+        )}
+      </div>
+    </div>
+  );
+}
diff --git a/components/dashboard/loyalty/members-tab.tsx b/components/dashboard/loyalty/members-tab.tsx
new file mode 100644
index 0000000..13a4c78
--- /dev/null
+++ b/components/dashboard/loyalty/members-tab.tsx
@@ -0,0 +1,112 @@
+"use client";
+
+/**
+ * Members: everyone who joined the loyalty card. Deleting a member removes
+ * their email and signs out their device; their stamps and rewards stay in the
+ * ledger without a name, so the owner's totals still add up.
+ */
+
+import { useState } from "react";
+import { Modal } from "@/components/dashboard/modal";
+import {
+  cardProgress,
+  claimView,
+  deleteMember,
+  type LoyaltyMember,
+  type LoyaltyState,
+} from "@/lib/loyalty/rules";
+import { tryLoyalty } from "@/lib/mock/loyalty-store";
+import { useNow } from "@/lib/use-loyalty";
+import { Panel, btnDanger, btnSecondary, formatDay } from "./ui";
+
+export function MembersTab({ state }: { state: LoyaltyState }) {
+  const now = useNow(60_000) ?? new Date(0);
+  const [removing, setRemoving] = useState<LoyaltyMember | null>(null);
+  const members = state.members
+    .filter((m) => !m.deleted_at && m.email_verified_at)
+    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
+
+  return (
+    <Panel
+      title="Members"
+      description="Customers who joined with a confirmed email."
+    >
+      {members.length === 0 ? (
+        <p className="text-[13px] text-ink-muted">
+          No members yet. They appear here after a customer joins from your page.
+        </p>
+      ) : (
+        <div className="overflow-x-auto">
+          <table className="w-full min-w-[560px] text-left text-[13px]">
+            <thead className="text-ink-muted">
+              <tr>
+                <th className="pb-2 font-normal">Email</th>
+                <th className="pb-2 font-normal">Joined</th>
+                <th className="pb-2 text-right font-normal">On card</th>
+                <th className="pb-2 text-right font-normal">All stamps</th>
+                <th className="pb-2 text-right font-normal">Rewards ready</th>
+                <th className="pb-2" />
+              </tr>
+            </thead>
+            <tbody>
+              {members.map((member) => {
+                const progress = cardProgress(state, member.id);
+                const ready = state.claims.filter(
+                  (c) => c.member_id === member.id && claimView(c, now) === "earned",
+                ).length;
+                return (
+                  <tr key={member.id} className="border-t border-black/5">
+                    <td className="max-w-[220px] truncate py-2 pr-2">{member.email}</td>
+                    <td className="py-2 pr-2">{formatDay(member.created_at)}</td>
+                    <td className="py-2 text-right tabular-nums">
+                      {progress.current}/{progress.required}
+                      {progress.pending > 0 ? " (full)" : ""}
+                    </td>
+                    <td className="py-2 text-right tabular-nums">{progress.total}</td>
+                    <td className="py-2 text-right tabular-nums">{ready}</td>
+                    <td className="py-2 pl-3 text-right">
+                      <button type="button" className={btnDanger} onClick={() => setRemoving(member)}>
+                        Delete
+                      </button>
+                    </td>
+                  </tr>
+                );
+              })}
+            </tbody>
+          </table>
+        </div>
+      )}
+
+      <Modal
+        open={removing !== null}
+        title="Delete this member?"
+        onClose={() => setRemoving(null)}
+        footer={
+          <>
+            <button type="button" className={btnSecondary} onClick={() => setRemoving(null)}>
+              Keep member
+            </button>
+            <button
+              type="button"
+              className={btnDanger}
+              onClick={() => {
+                if (removing) {
+                  const id = removing.id;
+                  tryLoyalty((s) => ({ ok: true as const, state: deleteMember(s, id, new Date()) }));
+                }
+                setRemoving(null);
+              }}
+            >
+              Delete member
+            </button>
+          </>
+        }
+      >
+        <p className="text-[13px] text-ink-muted">
+          {removing?.email} will be removed and signed out. Their stamps and rewards stay in
+          your history without a name. This can not be undone.
+        </p>
+      </Modal>
+    </Panel>
+  );
+}
diff --git a/components/dashboard/loyalty/overview-tab.tsx b/components/dashboard/loyalty/overview-tab.tsx
new file mode 100644
index 0000000..532fffb
--- /dev/null
+++ b/components/dashboard/loyalty/overview-tab.tsx
@@ -0,0 +1,163 @@
+"use client";
+
+import Link from "next/link";
+import { StatCard } from "@/components/dashboard/stat-card";
+import { loyaltyStats, type LoyaltyState } from "@/lib/loyalty/rules";
+import { useBusiness } from "@/lib/use-business";
+import type { DemoScenario } from "@/lib/mock/demo";
+import { useNow } from "@/lib/use-loyalty";
+import { Panel } from "./ui";
+
+const none = { text: "", direction: "none" } as const;
+
+export function OverviewTab({ state, demo }: { state: LoyaltyState; demo: DemoScenario }) {
+  const now = useNow(60_000) ?? new Date(0);
+  const business = useBusiness();
+  const stats = loyaltyStats(state, now);
+  const activeOffers = state.offers.filter((o) => o.active).length;
+  const activeStaff = state.staff.filter((s) => s.active).length;
+
+  const steps = [
+    {
+      done: state.program.enabled,
+      text: "Turn the program on",
+      href: `/loyalty?demo=${demo}&tab=settings`,
+    },
+    {
+      done: activeOffers > 0,
+      text: "Add at least one reward customers can choose",
+      href: `/loyalty?demo=${demo}&tab=rewards`,
+    },
+    {
+      done: activeStaff > 0,
+      text: "Add a staff PIN for Stamp mode",
+      href: `/loyalty?demo=${demo}&tab=staff`,
+    },
+  ];
+  const ready = steps.every((s) => s.done);
+
+  return (
+    <div className="grid gap-5">
+      {!ready ? (
+        <Panel
+          title="Finish setting up"
+          description="Customers see the Loyalty card button once the program is on."
+        >
+          <ul className="grid gap-2">
+            {steps.map((step) => (
+              <li key={step.text} className="flex items-center gap-3 text-[13px]">
+                <span
+                  aria-hidden="true"
+                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
+                    step.done ? "bg-brand-green text-white" : "border border-black/20"
+                  }`}
+                >
+                  {step.done ? "✓" : ""}
+                </span>
+                {step.done ? (
+                  <span className="text-ink-muted line-through">{step.text}</span>
+                ) : (
+                  <Link href={step.href} className="font-medium text-brand-blue hover:underline">
+                    {step.text}
+                  </Link>
+                )}
+              </li>
+            ))}
+          </ul>
+        </Panel>
+      ) : null}
+
+      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
+        <StatCard label="Members" value={String(stats.members)} delta={{ ...none, text: `${stats.newThisWeek} new this week` }} />
+        <StatCard label="Stamps given" value={String(stats.stampsTotal)} delta={{ ...none, text: `${stats.stampsThisWeek} this week` }} />
+        <StatCard label="Rewards chosen" value={String(stats.rewardsChosen)} delta={{ ...none, text: `${stats.rewardsOpen} waiting to be used` }} />
+        <StatCard label="Rewards used" value={String(stats.rewardsRedeemed)} delta={{ ...none, text: `${stats.rewardsExpired} expired` }} />
+      </div>
+
+      <div className="grid gap-5 lg:grid-cols-2">
+        <Panel title="Rewards" description="How often each reward is chosen and used.">
+          {stats.perOffer.length === 0 ? (
+            <p className="text-[13px] text-ink-muted">No rewards yet.</p>
+          ) : (
+            <table className="w-full text-left text-[13px]">
+              <thead className="text-ink-muted">
+                <tr>
+                  <th className="pb-2 font-normal">Reward</th>
+                  <th className="pb-2 text-right font-normal">Chosen</th>
+                  <th className="pb-2 text-right font-normal">Used</th>
+                </tr>
+              </thead>
+              <tbody>
+                {stats.perOffer.map((row) => (
+                  <tr key={row.offerId} className="border-t border-black/5">
+                    <td className="py-2 pr-2">{row.title}</td>
+                    <td className="py-2 text-right tabular-nums">{row.chosen}</td>
+                    <td className="py-2 text-right tabular-nums">{row.redeemed}</td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          )}
+        </Panel>
+
+        <Panel title="Staff" description="Who gave stamps and confirmed rewards.">
+          {stats.perStaff.length === 0 ? (
+            <p className="text-[13px] text-ink-muted">No staff yet.</p>
+          ) : (
+            <table className="w-full text-left text-[13px]">
+              <thead className="text-ink-muted">
+                <tr>
+                  <th className="pb-2 font-normal">Name</th>
+                  <th className="pb-2 text-right font-normal">Stamps</th>
+                  <th className="pb-2 text-right font-normal">Rewards</th>
+                </tr>
+              </thead>
+              <tbody>
+                {stats.perStaff.map((row) => (
+                  <tr key={row.staffId} className="border-t border-black/5">
+                    <td className="py-2 pr-2">{row.name}</td>
+                    <td className="py-2 text-right tabular-nums">{row.stamps}</td>
+                    <td className="py-2 text-right tabular-nums">{row.redemptions}</td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          )}
+          <p className="mt-3 text-[12px] text-ink-muted">
+            Stamps a customer enters from the counter code are not tied to one
+            staff member, so they are not counted here.
+          </p>
+        </Panel>
+      </div>
+
+      <Panel
+        title="Try it on this device"
+        description="Demo mode: everything is saved in this browser only."
+      >
+        <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-muted">
+          <li>
+            Open{" "}
+            <a
+              href={`/r/${business.slug}`}
+              target="_blank"
+              rel="noopener noreferrer"
+              className="font-medium text-brand-blue hover:underline"
+            >
+              your customer page
+            </a>{" "}
+            and tap Loyalty card. Join with any email; the code is shown on screen.
+          </li>
+          <li>
+            Tap Get a stamp. Then open the Stamp mode tab, unlock it with PIN
+            1234 and enter the code the customer sees.
+          </li>
+          <li>
+            Repeat until the card is full. In demo mode you can set the gap
+            between stamps to 0 in Settings so you do not have to wait.
+          </li>
+          <li>Choose a reward on the customer page, then redeem its code in Stamp mode.</li>
+        </ol>
+      </Panel>
+    </div>
+  );
+}
diff --git a/components/dashboard/loyalty/rewards-tab.tsx b/components/dashboard/loyalty/rewards-tab.tsx
new file mode 100644
index 0000000..8a8eac6
--- /dev/null
+++ b/components/dashboard/loyalty/rewards-tab.tsx
@@ -0,0 +1,284 @@
+"use client";
+
+/**
+ * Rewards: the 4 to 5 offers a customer chooses from when a card is full.
+ * Max 5 active at once. Editing or deleting an offer never changes a reward a
+ * customer already chose, because the chosen reward keeps its own copy.
+ */
+
+import { useState } from "react";
+import { Modal } from "@/components/dashboard/modal";
+import {
+  LOYALTY_LIMITS,
+  deleteOffer,
+  saveOffer,
+  setOfferActive,
+  type LoyaltyState,
+  type OfferKind,
+  type RewardOffer,
+} from "@/lib/loyalty/rules";
+import { tryLoyalty } from "@/lib/mock/loyalty-store";
+import { Field, Notice, Panel, btnDanger, btnPrimary, btnSecondary, inputCls } from "./ui";
+
+const KIND_LABEL: Record<OfferKind, string> = {
+  free_item: "Free item",
+  percent_off: "Percent off",
+  amount_off: "Amount off",
+  custom: "Other",
+};
+
+type Draft = {
+  id?: string;
+  title: string;
+  description: string;
+  kind: OfferKind;
+  monthly: string;
+  active: boolean;
+};
+
+const EMPTY: Draft = { title: "", description: "", kind: "free_item", monthly: "", active: true };
+
+export function RewardsTab({ state }: { state: LoyaltyState }) {
+  const [draft, setDraft] = useState<Draft | null>(null);
+  const [removing, setRemoving] = useState<RewardOffer | null>(null);
+  const [error, setError] = useState<string | null>(null);
+  const [message, setMessage] = useState<string | null>(null);
+
+  const activeCount = state.offers.filter((o) => o.active).length;
+  const sorted = [...state.offers].sort((a, b) => a.sort_order - b.sort_order);
+
+  function save() {
+    if (!draft) return;
+    const monthly = draft.monthly.trim() === "" ? null : Number(draft.monthly);
+    const res = tryLoyalty((s) =>
+      saveOffer(s, {
+        id: draft.id,
+        title: draft.title,
+        description: draft.description,
+        kind: draft.kind,
+        monthly_limit: monthly !== null && Number.isNaN(monthly) ? 0 : monthly,
+        active: draft.active,
+      }),
+    );
+    if (!res.ok) {
+      setError(res.message);
+      return;
+    }
+    setDraft(null);
+    setError(null);
+    setMessage(draft.id ? "Reward saved." : "Reward added.");
+  }
+
+  function toggle(offer: RewardOffer) {
+    const res = tryLoyalty((s) => setOfferActive(s, offer.id, !offer.active));
+    setMessage(res.ok ? (offer.active ? "Reward paused." : "Reward is active.") : res.message);
+  }
+
+  return (
+    <div className="grid gap-5">
+      <Panel
+        title="Rewards customers can choose"
+        description={`When a customer completes the card they pick one active reward. ${activeCount} of ${LOYALTY_LIMITS.maxActiveOffers} active.`}
+        action={
+          <button
+            type="button"
+            className={btnPrimary}
+            onClick={() => {
+              setError(null);
+              setMessage(null);
+              setDraft({ ...EMPTY, active: activeCount < LOYALTY_LIMITS.maxActiveOffers });
+            }}
+          >
+            Add reward
+          </button>
+        }
+      >
+        {message ? (
+          <div className="mb-3">
+            <Notice kind="info">{message}</Notice>
+          </div>
+        ) : null}
+        {sorted.length === 0 ? (
+          <p className="text-[13px] text-ink-muted">
+            No rewards yet. Add one, for example “Free coffee”.
+          </p>
+        ) : (
+          <ul className="divide-y divide-black/5">
+            {sorted.map((offer) => (
+              <li key={offer.id} className="flex flex-wrap items-center gap-3 py-3">
+                <div className="min-w-0 flex-1">
+                  <p className="text-[14px] font-medium text-ink">
+                    {offer.title}
+                    <span
+                      className={`ml-2 rounded-pill px-2 py-0.5 text-[11px] font-medium ${
+                        offer.active
+                          ? "bg-brand-green/10 text-brand-green-deep"
+                          : "bg-surface-muted text-ink-muted"
+                      }`}
+                    >
+                      {offer.active ? "Active" : "Paused"}
+                    </span>
+                  </p>
+                  <p className="text-[13px] text-ink-muted">
+                    {KIND_LABEL[offer.kind]}
+                    {offer.description ? ` · ${offer.description}` : ""}
+                    {offer.monthly_limit !== null
+                      ? ` · max ${offer.monthly_limit} a month`
+                      : ""}
+                  </p>
+                </div>
+                <div className="flex flex-wrap gap-2">
+                  <button type="button" className={btnSecondary} onClick={() => toggle(offer)}>
+                    {offer.active ? "Pause" : "Activate"}
+                  </button>
+                  <button
+                    type="button"
+                    className={btnSecondary}
+                    onClick={() => {
+                      setError(null);
+                      setMessage(null);
+                      setDraft({
+                        id: offer.id,
+                        title: offer.title,
+                        description: offer.description,
+                        kind: offer.kind,
+                        monthly: offer.monthly_limit === null ? "" : String(offer.monthly_limit),
+                        active: offer.active,
+                      });
+                    }}
+                  >
+                    Edit
+                  </button>
+                  <button type="button" className={btnDanger} onClick={() => setRemoving(offer)}>
+                    Delete
+                  </button>
+                </div>
+              </li>
+            ))}
+          </ul>
+        )}
+        <p className="mt-4 text-[12px] text-ink-muted">
+          Changing or deleting a reward never changes one a customer has already
+          chosen. They keep the title and terms they picked.
+        </p>
+      </Panel>
+
+      <Modal
+        open={draft !== null}
+        title={draft?.id ? "Edit reward" : "Add reward"}
+        onClose={() => setDraft(null)}
+        footer={
+          <>
+            <button type="button" className={btnSecondary} onClick={() => setDraft(null)}>
+              Cancel
+            </button>
+            <button type="button" className={btnPrimary} onClick={save}>
+              Save reward
+            </button>
+          </>
+        }
+      >
+        {draft ? (
+          <div className="grid gap-3">
+            <Field label="Title" htmlFor="offer-title">
+              <input
+                id="offer-title"
+                maxLength={LOYALTY_LIMITS.titleMax}
+                value={draft.title}
+                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
+                className={inputCls}
+                placeholder="Free coffee"
+              />
+            </Field>
+            <Field
+              label="Terms (optional)"
+              htmlFor="offer-description"
+              hint="Shown to the customer, for example “Any regular hot coffee”."
+            >
+              <input
+                id="offer-description"
+                maxLength={LOYALTY_LIMITS.descriptionMax}
+                value={draft.description}
+                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
+                className={inputCls}
+              />
+            </Field>
+            <Field label="Type" htmlFor="offer-kind">
+              <select
+                id="offer-kind"
+                value={draft.kind}
+                onChange={(event) => setDraft({ ...draft, kind: event.target.value as OfferKind })}
+                className={inputCls}
+              >
+                {(Object.keys(KIND_LABEL) as OfferKind[]).map((kind) => (
+                  <option key={kind} value={kind}>
+                    {KIND_LABEL[kind]}
+                  </option>
+                ))}
+              </select>
+            </Field>
+            <Field
+              label="Monthly limit (optional)"
+              htmlFor="offer-monthly"
+              hint="The most customers who can choose this reward each month. Leave empty for no limit."
+            >
+              <input
+                id="offer-monthly"
+                inputMode="numeric"
+                value={draft.monthly}
+                onChange={(event) =>
+                  setDraft({ ...draft, monthly: event.target.value.replace(/\D/g, "") })
+                }
+                className={inputCls}
+              />
+            </Field>
+            <label className="flex items-center gap-2 text-[13px] text-ink">
+              <input
+                type="checkbox"
+                checked={draft.active}
+                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
+              />
+              Active (customers can choose it)
+            </label>
+            {error ? <Notice kind="error">{error}</Notice> : null}
+          </div>
+        ) : null}
+      </Modal>
+
+      <Modal
+        open={removing !== null}
+        title="Delete this reward?"
+        onClose={() => setRemoving(null)}
+        footer={
+          <>
+            <button type="button" className={btnSecondary} onClick={() => setRemoving(null)}>
+              Keep it
+            </button>
+            <button
+              type="button"
+              className={btnDanger}
+              onClick={() => {
+                if (removing) {
+                  const id = removing.id;
+                  tryLoyalty((current) => ({
+                    ok: true as const,
+                    state: deleteOffer(current, id),
+                  }));
+                  setMessage("Reward deleted.");
+                }
+                setRemoving(null);
+              }}
+            >
+              Delete reward
+            </button>
+          </>
+        }
+      >
+        <p className="text-[13px] text-ink-muted">
+          “{removing?.title}” will no longer be offered. Rewards customers have
+          already chosen are not affected.
+        </p>
+      </Modal>
+    </div>
+  );
+}
diff --git a/components/dashboard/loyalty/settings-tab.tsx b/components/dashboard/loyalty/settings-tab.tsx
new file mode 100644
index 0000000..d8512d1
--- /dev/null
+++ b/components/dashboard/loyalty/settings-tab.tsx
@@ -0,0 +1,232 @@
+"use client";
+
+/**
+ * Program settings: on/off, stamps per card, the rules that stop abuse (gap
+ * between stamps, daily cap), how long a chosen reward stays valid, and which
+ * ways of getting a stamp are allowed. Every number is clamped to its range
+ * (`LOYALTY_LIMITS`) by the same rules the server will use.
+ */
+
+import { useEffect, useState } from "react";
+import {
+  LOYALTY_LIMITS,
+  cardProgress,
+  normalizeProgram,
+  setProgram,
+  type LoyaltyProgram,
+  type LoyaltyState,
+  type StampMode,
+} from "@/lib/loyalty/rules";
+import { resetLoyaltyDemo, tryLoyalty } from "@/lib/mock/loyalty-store";
+import { Field, Notice, Panel, btnDanger, btnPrimary, inputCls } from "./ui";
+
+type Draft = {
+  enabled: boolean;
+  stamps: string;
+  gap: string;
+  cap: string;
+  days: string;
+  mode: StampMode;
+};
+
+function toDraft(p: LoyaltyProgram): Draft {
+  return {
+    enabled: p.enabled,
+    stamps: String(p.stamps_required),
+    gap: String(p.min_gap_hours),
+    cap: String(p.daily_cap),
+    days: String(p.reward_valid_days),
+    mode: p.stamp_mode,
+  };
+}
+
+const MODES: { id: StampMode; title: string; text: string }[] = [
+  {
+    id: "both",
+    title: "Both ways (recommended)",
+    text: "Staff enter the customer's code, or the customer enters the counter code.",
+  },
+  {
+    id: "member_code",
+    title: "Staff enter the customer's code",
+    text: "The strongest check. A staff member sees every stamp happen.",
+  },
+  {
+    id: "counter_code",
+    title: "Customer enters the counter code",
+    text: "Faster at a busy counter. The code changes after every use.",
+  },
+];
+
+export function SettingsTab({ state }: { state: LoyaltyState }) {
+  const [draft, setDraft] = useState<Draft>(() => toDraft(state.program));
+  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
+
+  // Pick up the saved values once they arrive from another tab.
+  // Keyed by value, so an unrelated update elsewhere does not wipe unsaved edits.
+  const programKey = JSON.stringify(state.program);
+  useEffect(() => {
+    setDraft(toDraft(JSON.parse(programKey) as LoyaltyProgram));
+  }, [programKey]);
+
+  const L = LOYALTY_LIMITS;
+
+  function save() {
+    const next = normalizeProgram({
+      enabled: draft.enabled,
+      stamps_required: Number(draft.stamps),
+      min_gap_hours: Number(draft.gap),
+      daily_cap: Number(draft.cap),
+      reward_valid_days: Number(draft.days),
+      stamp_mode: draft.mode,
+    });
+    const res = tryLoyalty((s) => {
+      // A full card waiting for a reward must not be taken away by a new size.
+      if (
+        next.stamps_required !== s.program.stamps_required &&
+        s.members.some((m) => cardProgress(s, m.id).pending > 0)
+      ) {
+        return {
+          ok: false as const,
+          message:
+            "Some customers have a full card waiting for a reward. Let them choose first, then change the number of stamps.",
+        };
+      }
+      return { ok: true as const, state: setProgram(s, next) };
+    });
+    setMessage(
+      res.ok
+        ? { kind: "success", text: "Settings saved." }
+        : { kind: "error", text: "message" in res ? res.message : "Could not save." },
+    );
+  }
+
+  return (
+    <div className="grid gap-5">
+      <Panel title="Program" description="These rules apply to every stamp from now on.">
+        <form
+          className="grid max-w-[520px] gap-4"
+          onSubmit={(event) => {
+            event.preventDefault();
+            save();
+          }}
+        >
+          <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
+            <input
+              type="checkbox"
+              checked={draft.enabled}
+              onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
+            />
+            Loyalty program is on (customers see the Loyalty card button)
+          </label>
+
+          <Field
+            label="Stamps to complete a card"
+            htmlFor="s-stamps"
+            hint={`${L.stampsMin} to ${L.stampsMax}. Can only change while no customer has a full card waiting.`}
+          >
+            <input
+              id="s-stamps"
+              inputMode="numeric"
+              value={draft.stamps}
+              onChange={(event) => setDraft({ ...draft, stamps: event.target.value.replace(/\D/g, "") })}
+              className={inputCls}
+            />
+          </Field>
+
+          <Field
+            label="Hours between two stamps for one customer"
+            htmlFor="s-gap"
+            hint={`${L.gapHoursMin} to ${L.gapHoursMax}. For example 4 stops two stamps from one lunch visit. Use 0 only for testing.`}
+          >
+            <input
+              id="s-gap"
+              inputMode="numeric"
+              value={draft.gap}
+              onChange={(event) => setDraft({ ...draft, gap: event.target.value.replace(/\D/g, "") })}
+              className={inputCls}
+            />
+          </Field>
+
+          <Field
+            label="Most stamps per customer in 24 hours"
+            htmlFor="s-cap"
+            hint={`${L.dailyCapMin} to ${L.dailyCapMax}.`}
+          >
+            <input
+              id="s-cap"
+              inputMode="numeric"
+              value={draft.cap}
+              onChange={(event) => setDraft({ ...draft, cap: event.target.value.replace(/\D/g, "") })}
+              className={inputCls}
+            />
+          </Field>
+
+          <Field
+            label="Days a chosen reward stays valid"
+            htmlFor="s-days"
+            hint={`${L.rewardDaysMin} to ${L.rewardDaysMax}. Unused rewards expire after this.`}
+          >
+            <input
+              id="s-days"
+              inputMode="numeric"
+              value={draft.days}
+              onChange={(event) => setDraft({ ...draft, days: event.target.value.replace(/\D/g, "") })}
+              className={inputCls}
+            />
+          </Field>
+
+          <fieldset>
+            <legend className="text-[13px] font-medium text-ink">How customers get a stamp</legend>
+            <div className="mt-2 grid gap-2">
+              {MODES.map((mode) => (
+                <label
+                  key={mode.id}
+                  className={`flex cursor-pointer items-start gap-3 rounded-card border p-3 text-[13px] ${
+                    draft.mode === mode.id ? "border-brand-blue bg-brand-blue/5" : "border-black/10"
+                  }`}
+                >
+                  <input
+                    type="radio"
+                    name="stamp-mode"
+                    checked={draft.mode === mode.id}
+                    onChange={() => setDraft({ ...draft, mode: mode.id })}
+                    className="mt-0.5"
+                  />
+                  <span>
+                    <span className="block font-medium text-ink">{mode.title}</span>
+                    <span className="block text-ink-muted">{mode.text}</span>
+                  </span>
+                </label>
+              ))}
+            </div>
+            <p className="mt-2 text-[12px] text-ink-muted">
+              Your printed review QR is never used for stamps, so a photo of it can not earn one.
+            </p>
+          </fieldset>
+
+          {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
+          <button type="submit" className={`${btnPrimary} justify-self-start`}>
+            Save settings
+          </button>
+        </form>
+      </Panel>
+
+      <Panel
+        title="Demo data"
+        description="Demo mode keeps everything in this browser. Resetting brings back the four example rewards and removes all members, stamps and staff."
+      >
+        <button
+          type="button"
+          className={btnDanger}
+          onClick={() => {
+            resetLoyaltyDemo();
+            setMessage({ kind: "success", text: "Demo data reset." });
+          }}
+        >
+          Reset demo data
+        </button>
+      </Panel>
+    </div>
+  );
+}
diff --git a/components/dashboard/loyalty/staff-tab.tsx b/components/dashboard/loyalty/staff-tab.tsx
new file mode 100644
index 0000000..7cb4dbf
--- /dev/null
+++ b/components/dashboard/loyalty/staff-tab.tsx
@@ -0,0 +1,189 @@
+"use client";
+
+/**
+ * Staff: people who can use Stamp mode. Each has a name and a PIN (4 to 6
+ * digits, stored hashed). The PIN shows who gave each stamp and who confirmed
+ * each reward. Turning a person off stops their PIN at once; their history
+ * stays.
+ */
+
+import { useState } from "react";
+import { addStaff, changePin } from "@/lib/loyalty/pin";
+import { LOYALTY_LIMITS, setStaffActive, type LoyaltyState, type StaffMember } from "@/lib/loyalty/rules";
+import { DEMO_STAFF_PIN, getLoyaltyState, setLoyaltyState } from "@/lib/mock/loyalty-store";
+import { Field, Notice, Panel, btnPrimary, btnSecondary, formatDay, inputCls } from "./ui";
+
+export function StaffTab({ state }: { state: LoyaltyState }) {
+  const [name, setName] = useState("");
+  const [pin, setPin] = useState("");
+  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
+  const [editing, setEditing] = useState<string | null>(null);
+  const [newPin, setNewPin] = useState("");
+
+  async function add() {
+    const res = await addStaff(getLoyaltyState(), { name, pin }, new Date());
+    if (!res.ok) {
+      setMessage({ kind: "error", text: res.message });
+      return;
+    }
+    setLoyaltyState(res.state);
+    setName("");
+    setPin("");
+    setMessage({ kind: "success", text: `${res.staff.name} was added.` });
+  }
+
+  async function savePin(staff: StaffMember) {
+    const res = await changePin(getLoyaltyState(), staff.id, newPin);
+    if (!res.ok) {
+      setMessage({ kind: "error", text: res.message });
+      return;
+    }
+    setLoyaltyState(res.state);
+    setEditing(null);
+    setNewPin("");
+    setMessage({ kind: "success", text: `New PIN saved for ${staff.name}.` });
+  }
+
+  function toggle(staff: StaffMember) {
+    setLoyaltyState(setStaffActive(getLoyaltyState(), staff.id, !staff.active));
+    setMessage({
+      kind: "success",
+      text: staff.active ? `${staff.name} can no longer use Stamp mode.` : `${staff.name} can use Stamp mode again.`,
+    });
+  }
+
+  const stampsBy = (id: string) => state.stamps.filter((s) => s.staff_id === id && !s.voided_at).length;
+
+  return (
+    <div className="grid gap-5">
+      <Panel
+        title="Staff"
+        description="Each person gets their own PIN, so every stamp and reward has a name next to it."
+      >
+        {message ? (
+          <div className="mb-3">
+            <Notice kind={message.kind}>{message.text}</Notice>
+          </div>
+        ) : null}
+        {state.staff.length === 0 ? (
+          <p className="text-[13px] text-ink-muted">No staff yet. Add the first person below.</p>
+        ) : (
+          <ul className="divide-y divide-black/5">
+            {state.staff.map((staff) => (
+              <li key={staff.id} className="py-3">
+                <div className="flex flex-wrap items-center gap-3">
+                  <div className="min-w-0 flex-1">
+                    <p className="text-[14px] font-medium text-ink">
+                      {staff.name}
+                      <span
+                        className={`ml-2 rounded-pill px-2 py-0.5 text-[11px] font-medium ${
+                          staff.active
+                            ? "bg-brand-green/10 text-brand-green-deep"
+                            : "bg-surface-muted text-ink-muted"
+                        }`}
+                      >
+                        {staff.active ? "Active" : "Off"}
+                      </span>
+                    </p>
+                    <p className="text-[13px] text-ink-muted">
+                      {stampsBy(staff.id)} stamps given · added {formatDay(staff.created_at)}
+                    </p>
+                  </div>
+                  <div className="flex gap-2">
+                    <button
+                      type="button"
+                      className={btnSecondary}
+                      onClick={() => {
+                        setEditing(editing === staff.id ? null : staff.id);
+                        setNewPin("");
+                      }}
+                    >
+                      Change PIN
+                    </button>
+                    <button type="button" className={btnSecondary} onClick={() => toggle(staff)}>
+                      {staff.active ? "Turn off" : "Turn on"}
+                    </button>
+                  </div>
+                </div>
+                {editing === staff.id ? (
+                  <form
+                    className="mt-3 flex max-w-[360px] flex-wrap items-end gap-3"
+                    onSubmit={(event) => {
+                      event.preventDefault();
+                      void savePin(staff);
+                    }}
+                  >
+                    <div className="min-w-[160px] flex-1">
+                      <Field label="New PIN" htmlFor={`pin-${staff.id}`}>
+                        <input
+                          id={`pin-${staff.id}`}
+                          type="password"
+                          inputMode="numeric"
+                          autoComplete="off"
+                          maxLength={LOYALTY_LIMITS.pinMax}
+                          value={newPin}
+                          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
+                          className={inputCls}
+                        />
+                      </Field>
+                    </div>
+                    <button type="submit" className={btnPrimary} disabled={newPin.length < LOYALTY_LIMITS.pinMin}>
+                      Save PIN
+                    </button>
+                  </form>
+                ) : null}
+              </li>
+            ))}
+          </ul>
+        )}
+      </Panel>
+
+      <Panel title="Add staff" description={`Up to ${LOYALTY_LIMITS.maxStaff} people.`}>
+        <form
+          className="grid max-w-[360px] gap-3"
+          onSubmit={(event) => {
+            event.preventDefault();
+            void add();
+          }}
+        >
+          <Field label="Name" htmlFor="staff-name">
+            <input
+              id="staff-name"
+              maxLength={LOYALTY_LIMITS.staffNameMax}
+              value={name}
+              onChange={(event) => setName(event.target.value)}
+              className={inputCls}
+            />
+          </Field>
+          <Field
+            label="PIN"
+            htmlFor="staff-pin"
+            hint={`${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits. Each person needs a different PIN.`}
+          >
+            <input
+              id="staff-pin"
+              type="password"
+              inputMode="numeric"
+              autoComplete="off"
+              maxLength={LOYALTY_LIMITS.pinMax}
+              value={pin}
+              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
+              className={inputCls}
+            />
+          </Field>
+          <button
+            type="submit"
+            className={`${btnPrimary} justify-self-start`}
+            disabled={name.trim().length < LOYALTY_LIMITS.staffNameMin || pin.length < LOYALTY_LIMITS.pinMin}
+          >
+            Add staff
+          </button>
+        </form>
+        <p className="mt-4 text-[12px] text-ink-muted">
+          Demo mode: the first person, Counter, was created with PIN {DEMO_STAFF_PIN}. Change it
+          before going live.
+        </p>
+      </Panel>
+    </div>
+  );
+}
diff --git a/components/dashboard/loyalty/stamp-mode-tab.tsx b/components/dashboard/loyalty/stamp-mode-tab.tsx
new file mode 100644
index 0000000..aad2e8f
--- /dev/null
+++ b/components/dashboard/loyalty/stamp-mode-tab.tsx
@@ -0,0 +1,422 @@
+"use client";
+
+/**
+ * Stamp mode: where staff give stamps and confirm rewards.
+ *
+ * Locked by a staff PIN so every stamp and every redemption carries a name.
+ * Three jobs:
+ *  1. Give a stamp from the code the customer shows (Mode A).
+ *  2. Show the counter code the customer types themselves (Mode B).
+ *  3. Redeem a reward code (look it up first, then confirm).
+ * Locks again by itself after 5 minutes without use.
+ *
+ * Stage 3 moves this to its own `/stamp` page with a staff session, so staff
+ * never need the owner's login on the counter device.
+ */
+
+import Link from "next/link";
+import { useEffect, useRef, useState } from "react";
+import { identifyStaff } from "@/lib/loyalty/pin";
+import {
+  claimView,
+  issueCounterCode,
+  normalizeCode,
+  redeemReward,
+  stampWithMemberCode,
+  type LoyaltyState,
+  type RewardClaim,
+  type StaffMember,
+} from "@/lib/loyalty/rules";
+import type { DemoScenario } from "@/lib/mock/demo";
+import {
+  DEMO_STAFF_PIN,
+  getLoyaltyState,
+  setLoyaltyState,
+  tryLoyalty,
+} from "@/lib/mock/loyalty-store";
+import { useNow } from "@/lib/use-loyalty";
+import { Field, Notice, Panel, btnPrimary, btnSecondary, formatDay, inputCls } from "./ui";
+
+const IDLE_LOCK_MS = 5 * 60_000;
+
+type Message = { kind: "success" | "error" | "info"; text: string } | null;
+
+export function StampModeTab({ state, demo }: { state: LoyaltyState; demo: DemoScenario }) {
+  const [staffId, setStaffId] = useState<string | null>(null);
+  const [lastUsed, setLastUsed] = useState(0);
+  const now = useNow(1000);
+
+  const staff = state.staff.find((s) => s.id === staffId && s.active) ?? null;
+
+  // Lock by itself after a quiet spell, and if the staff member is switched off.
+  useEffect(() => {
+    if (!staffId || !now) return;
+    if (!staff || now.getTime() - lastUsed > IDLE_LOCK_MS) setStaffId(null);
+  }, [staffId, staff, now, lastUsed]);
+
+  if (!state.program.enabled) {
+    return (
+      <Panel title="Stamp mode">
+        <Notice kind="info">
+          The loyalty program is paused. Turn it on in Settings to give stamps.
+        </Notice>
+      </Panel>
+    );
+  }
+
+  if (state.staff.filter((s) => s.active).length === 0) {
+    return (
+      <Panel title="Stamp mode" description="Add a staff PIN first.">
+        <Link
+          href={`/loyalty?demo=${demo}&tab=staff`}
+          className="text-[13px] font-medium text-brand-blue hover:underline"
+        >
+          Go to Staff
+        </Link>
+      </Panel>
+    );
+  }
+
+  if (!staff || !now) {
+    return (
+      <UnlockPanel
+        onUnlock={(member) => {
+          setStaffId(member.id);
+          setLastUsed(Date.now());
+        }}
+      />
+    );
+  }
+
+  return (
+    <Worker
+      state={state}
+      staff={staff}
+      now={now}
+      touch={() => setLastUsed(Date.now())}
+      onLock={() => setStaffId(null)}
+    />
+  );
+}
+
+function UnlockPanel({ onUnlock }: { onUnlock: (staff: StaffMember) => void }) {
+  const [pin, setPin] = useState("");
+  const [message, setMessage] = useState<Message>(null);
+  const [busy, setBusy] = useState(false);
+
+  async function unlock() {
+    setBusy(true);
+    const result = await identifyStaff(getLoyaltyState(), pin, new Date());
+    setLoyaltyState(result.state);
+    setBusy(false);
+    setPin("");
+    if (result.ok) {
+      setMessage(null);
+      onUnlock(result.staff);
+    } else {
+      setMessage({ kind: "error", text: result.message });
+    }
+  }
+
+  return (
+    <Panel
+      title="Stamp mode"
+      description="Enter your staff PIN. Your name is saved with every stamp you give."
+    >
+      <form
+        className="grid max-w-[320px] gap-3"
+        onSubmit={(event) => {
+          event.preventDefault();
+          void unlock();
+        }}
+      >
+        <Field label="Staff PIN" htmlFor="stamp-pin">
+          <input
+            id="stamp-pin"
+            type="password"
+            inputMode="numeric"
+            autoComplete="off"
+            maxLength={6}
+            value={pin}
+            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
+            className={inputCls}
+          />
+        </Field>
+        {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
+        <button type="submit" className={btnPrimary} disabled={busy || pin.length < 4}>
+          Unlock
+        </button>
+        <p className="text-[12px] text-ink-muted">
+          Demo mode: the first staff member is called Counter and uses PIN{" "}
+          {DEMO_STAFF_PIN}.
+        </p>
+      </form>
+    </Panel>
+  );
+}
+
+function Worker({
+  state,
+  staff,
+  now,
+  touch,
+  onLock,
+}: {
+  state: LoyaltyState;
+  staff: StaffMember;
+  now: Date;
+  touch: () => void;
+  onLock: () => void;
+}) {
+  const [message, setMessage] = useState<Message>(null);
+  const mode = state.program.stamp_mode;
+  const showCounter = mode === "counter_code" || mode === "both";
+  const acceptMember = mode === "member_code" || mode === "both";
+
+  return (
+    <div className="grid gap-5">
+      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-black/10 bg-white px-5 py-3 shadow-soft">
+        <p className="text-[13px] text-ink">
+          Signed in as <span className="font-medium">{staff.name}</span>
+          <span className="text-ink-muted"> · locks after 5 quiet minutes</span>
+        </p>
+        <button type="button" className={btnSecondary} onClick={onLock}>
+          Lock
+        </button>
+      </div>
+
+      <div role="status" aria-live="polite">
+        {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}
+      </div>
+
+      <div className="grid gap-5 lg:grid-cols-2">
+        {acceptMember ? (
+          <GiveStamp staff={staff} touch={touch} onMessage={setMessage} />
+        ) : (
+          <Panel title="Give a stamp">
+            <Notice kind="info">
+              Customer codes are turned off. Customers use the counter code instead.
+            </Notice>
+          </Panel>
+        )}
+        {showCounter ? (
+          <CounterCode state={state} now={now} />
+        ) : (
+          <Panel title="Counter code">
+            <Notice kind="info">
+              Counter codes are turned off. Customers show you their own code.
+            </Notice>
+          </Panel>
+        )}
+      </div>
+
+      <RedeemReward state={state} staff={staff} now={now} touch={touch} onMessage={setMessage} />
+    </div>
+  );
+}
+
+function GiveStamp({
+  staff,
+  touch,
+  onMessage,
+}: {
+  staff: StaffMember;
+  touch: () => void;
+  onMessage: (message: Message) => void;
+}) {
+  const [code, setCode] = useState("");
+
+  function give() {
+    touch();
+    const res = tryLoyalty((s) => stampWithMemberCode(s, { code, staffId: staff.id }, new Date()));
+    if (!res.ok) {
+      onMessage({ kind: "error", text: res.message });
+      return;
+    }
+    const left = res.progress.required - res.progress.current;
+    onMessage({
+      kind: "success",
+      text: res.completed
+        ? `Stamp given to ${res.member.email}. Their card is complete, so they can choose a reward.`
+        : `Stamp given to ${res.member.email}: ${res.progress.current} of ${res.progress.required}, ${left} to go.`,
+    });
+    setCode("");
+  }
+
+  return (
+    <Panel
+      title="Give a stamp"
+      description="Ask the customer to open Get a stamp and read you their code."
+    >
+      <form
+        className="grid gap-3"
+        onSubmit={(event) => {
+          event.preventDefault();
+          give();
+        }}
+      >
+        <Field label="Customer's code" htmlFor="member-code" hint="6 digits. It changes every minute and works once.">
+          <input
+            id="member-code"
+            inputMode="numeric"
+            autoComplete="off"
+            maxLength={6}
+            value={code}
+            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
+            className={`${inputCls} tabular-nums tracking-[0.2em]`}
+          />
+        </Field>
+        <button type="submit" className={`${btnPrimary} justify-self-start`} disabled={code.length !== 6}>
+          Give stamp
+        </button>
+      </form>
+    </Panel>
+  );
+}
+
+function CounterCode({ state, now }: { state: LoyaltyState; now: Date }) {
+  const live = state.tokens.find(
+    (t) => t.kind === "counter" && !t.used_at && new Date(t.expires_at).getTime() > now.getTime(),
+  );
+  // Keep one live code showing; a used or expired one is replaced at once.
+  useEffect(() => {
+    if (!live) tryLoyalty((s) => issueCounterCode(s, new Date()));
+  }, [live]);
+
+  const secondsLeft = live
+    ? Math.max(0, Math.ceil((new Date(live.expires_at).getTime() - now.getTime()) / 1000))
+    : 0;
+
+  return (
+    <Panel
+      title="Counter code"
+      description="Customers type this on their phone. It works for one customer, then changes."
+    >
+      <p
+        className="text-center text-[44px] font-medium leading-none tracking-[0.15em] tabular-nums text-ink"
+        aria-label={live ? `Counter code ${live.code.split("").join(" ")}` : "Getting a code"}
+      >
+        {live ? `${live.code.slice(0, 3)} ${live.code.slice(3)}` : "--- ---"}
+      </p>
+      <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-black/10" role="presentation">
+        <div
+          className="h-full bg-brand-blue transition-[width] duration-1000 ease-linear"
+          style={{ width: `${(secondsLeft / 60) * 100}%` }}
+        />
+      </div>
+      <p className="mt-2 text-center text-[12px] tabular-nums text-ink-muted">
+        Changes in {secondsLeft}s
+      </p>
+    </Panel>
+  );
+}
+
+function RedeemReward({
+  state,
+  staff,
+  now,
+  touch,
+  onMessage,
+}: {
+  state: LoyaltyState;
+  staff: StaffMember;
+  now: Date;
+  touch: () => void;
+  onMessage: (message: Message) => void;
+}) {
+  const [code, setCode] = useState("");
+  const [found, setFound] = useState<RewardClaim | null>(null);
+  const lookedUp = useRef("");
+
+  function lookUp() {
+    touch();
+    const key = normalizeCode(code);
+    const claim = state.claims.find((c) => normalizeCode(c.code) === key);
+    if (!key || !claim) {
+      setFound(null);
+      onMessage({ kind: "error", text: "No reward matches that code." });
+      return;
+    }
+    lookedUp.current = claim.id;
+    setFound(claim);
+    onMessage(null);
+  }
+
+  // Always show the latest version of the reward that was looked up.
+  const current = found ? (state.claims.find((c) => c.id === found.id) ?? found) : null;
+  const view = current ? claimView(current, now) : null;
+  const member = current ? state.members.find((m) => m.id === current.member_id) : null;
+
+  function confirm() {
+    if (!current) return;
+    touch();
+    const res = tryLoyalty((s) => redeemReward(s, { code: current.code, staffId: staff.id }, new Date()));
+    if (!res.ok) {
+      onMessage({ kind: "error", text: res.message });
+      return;
+    }
+    onMessage({ kind: "success", text: `“${res.claim.title}” confirmed. Hand it over.` });
+    setFound(null);
+    setCode("");
+  }
+
+  return (
+    <Panel
+      title="Redeem a reward"
+      description="Ask the customer to open My rewards and read you the reward code."
+    >
+      <form
+        className="flex max-w-[420px] flex-wrap items-end gap-3"
+        onSubmit={(event) => {
+          event.preventDefault();
+          lookUp();
+        }}
+      >
+        <div className="min-w-[180px] flex-1">
+          <Field label="Reward code" htmlFor="reward-code">
+            <input
+              id="reward-code"
+              autoComplete="off"
+              autoCapitalize="characters"
+              maxLength={9}
+              value={code}
+              onChange={(event) => setCode(event.target.value.toUpperCase())}
+              placeholder="ABCD-EFGH"
+              className={`${inputCls} tracking-[0.1em]`}
+            />
+          </Field>
+        </div>
+        <button type="submit" className={btnSecondary} disabled={code.trim().length < 8}>
+          Look up
+        </button>
+      </form>
+
+      {current && view ? (
+        <div className="mt-4 rounded-card border border-black/10 bg-surface-muted p-4">
+          <p className="text-[15px] font-medium text-ink">{current.title}</p>
+          {current.description ? (
+            <p className="text-[13px] text-ink-muted">{current.description}</p>
+          ) : null}
+          <p className="mt-2 text-[13px] text-ink-muted">
+            For {member?.email ?? "a deleted member"} · valid until {formatDay(current.expires_at)}
+          </p>
+          {view === "earned" ? (
+            <button type="button" className={`${btnPrimary} mt-3`} onClick={confirm}>
+              Confirm and use reward
+            </button>
+          ) : (
+            <div className="mt-3">
+              <Notice kind="error">
+                {view === "redeemed"
+                  ? "This reward was already used."
+                  : view === "expired"
+                    ? "This reward has expired."
+                    : "This reward was cancelled."}
+              </Notice>
+            </div>
+          )}
+        </div>
+      ) : null}
+    </Panel>
+  );
+}
diff --git a/components/dashboard/loyalty/ui.tsx b/components/dashboard/loyalty/ui.tsx
new file mode 100644
index 0000000..16c4fdd
--- /dev/null
+++ b/components/dashboard/loyalty/ui.tsx
@@ -0,0 +1,111 @@
+"use client";
+
+/**
+ * Small shared pieces for the Loyalty dashboard tabs. Same look as the other
+ * dashboard screens: Syehere product palette, weights 400/500 only.
+ */
+
+import type { ReactNode } from "react";
+
+export const btnPrimary =
+  "inline-flex h-9 items-center justify-center gap-2 rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
+export const btnSecondary =
+  "inline-flex h-9 items-center justify-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-50";
+export const btnDanger =
+  "inline-flex h-9 items-center justify-center gap-2 rounded-control border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50";
+export const inputCls =
+  "h-10 w-full rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue";
+
+export function Panel({
+  title,
+  description,
+  action,
+  children,
+}: {
+  title?: string;
+  description?: string;
+  action?: ReactNode;
+  children: ReactNode;
+}) {
+  return (
+    <section className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
+      {title || action ? (
+        <div className="flex flex-wrap items-start justify-between gap-3">
+          <div>
+            {title ? (
+              <h2 className="text-[15px] font-medium text-ink">{title}</h2>
+            ) : null}
+            {description ? (
+              <p className="mt-1 text-[13px] text-ink-muted">{description}</p>
+            ) : null}
+          </div>
+          {action}
+        </div>
+      ) : null}
+      <div className={title || action ? "mt-4" : ""}>{children}</div>
+    </section>
+  );
+}
+
+export function Field({
+  label,
+  htmlFor,
+  hint,
+  children,
+}: {
+  label: string;
+  htmlFor: string;
+  hint?: string;
+  children: ReactNode;
+}) {
+  return (
+    <div>
+      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
+        {label}
+      </label>
+      <div className="mt-1">{children}</div>
+      {hint ? <p className="mt-1 text-[12px] text-ink-muted">{hint}</p> : null}
+    </div>
+  );
+}
+
+export function Notice({
+  kind,
+  children,
+}: {
+  kind: "success" | "error" | "info";
+  children: ReactNode;
+}) {
+  const tone =
+    kind === "success"
+      ? "border-brand-green/30 bg-brand-green/10 text-brand-green-deep"
+      : kind === "error"
+        ? "border-red-200 bg-red-50 text-red-700"
+        : "border-black/10 bg-surface-muted text-ink-muted";
+  return (
+    <p
+      role={kind === "error" ? "alert" : "status"}
+      aria-live="polite"
+      className={`rounded-control border px-3 py-2 text-[13px] ${tone}`}
+    >
+      {children}
+    </p>
+  );
+}
+
+export function formatWhen(iso: string): string {
+  return new Intl.DateTimeFormat("en-IN", {
+    day: "numeric",
+    month: "short",
+    hour: "numeric",
+    minute: "2-digit",
+  }).format(new Date(iso));
+}
+
+export function formatDay(iso: string): string {
+  return new Intl.DateTimeFormat("en-IN", {
+    day: "numeric",
+    month: "short",
+    year: "numeric",
+  }).format(new Date(iso));
+}
diff --git a/components/dashboard/nav.ts b/components/dashboard/nav.ts
index 5353b21..074f23c 100644
--- a/components/dashboard/nav.ts
+++ b/components/dashboard/nav.ts
@@ -5,6 +5,7 @@ import {
   DashboardIcon,
   FeedbackIcon,
   LocationIcon,
+  LoyaltyIcon,
   PageIcon,
   SettingsIcon,
 } from "./icons";
@@ -35,6 +36,7 @@ export const dashboardNav: readonly DashboardNavGroup[] = [
       { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
       { label: "Locations", href: "/locations", icon: LocationIcon },
       { label: "Customer page", href: "/customer-page", icon: PageIcon },
+      { label: "Loyalty", href: "/loyalty", icon: LoyaltyIcon },
     ],
   },
   {
diff --git a/email-templates.md b/email-templates.md
index f1d7115..b6e315c 100644
--- a/email-templates.md
+++ b/email-templates.md
@@ -242,3 +242,19 @@ after they arrive, never instantly. You can see everything on your dashboard.
 [Go to your dashboard →]
 
 — The Syehere Team
+
+---
+
+## 15. Loyalty Card: Confirm Your Email (customer)
+Sent to the customer (not the owner) when they join a business's loyalty card. Plain text, no tracking links.
+**Subject:** Your {{business_name}} loyalty card code: {{code}}
+
+Hi,
+
+Your code to open your {{business_name}} loyalty card is:
+
+{{code}}
+
+It works for 10 minutes. If you did not ask for this, you can ignore this email.
+
+— {{business_name}} (loyalty card by Syehere)
diff --git a/lib/customer-page.ts b/lib/customer-page.ts
index 86e2853..ae783e7 100644
--- a/lib/customer-page.ts
+++ b/lib/customer-page.ts
@@ -224,6 +224,7 @@ export type CustomerButtonKind =
   | "whatsapp"
   | "directions"
   | "pay"
+  | "loyalty"
   | "custom";
 
 export type CustomerButton = {
@@ -233,7 +234,7 @@ export type CustomerButton = {
   /** Direct action (Call / WhatsApp / Directions / custom link). */
   href?: string;
   /** In-page screen this button opens. */
-  screen?: "menu" | "hours" | "pay";
+  screen?: "menu" | "hours" | "pay" | "loyalty";
 };
 
 /** The menu title shown to customers: the owner's title else the type label. */
diff --git a/lib/loyalty/pin.ts b/lib/loyalty/pin.ts
new file mode 100644
index 0000000..a088639
--- /dev/null
+++ b/lib/loyalty/pin.ts
@@ -0,0 +1,167 @@
+/**
+ * Staff PINs for Stamp mode (business-rules.md section 12).
+ *
+ * A PIN identifies which staff member gave a stamp or confirmed a reward, so
+ * the owner can see who did what. PINs are stored salted and hashed, never in
+ * clear text. Wrong guesses lock Stamp mode for a few minutes.
+ *
+ * MOCK NOTE: this uses one SHA-256 round from the browser's Web Crypto so the
+ * mock works without a package. Stage 3 MUST use a slow password hash
+ * (scrypt or argon2) on the server, because a 4 to 6 digit PIN is easy to
+ * brute-force against a fast hash if the table ever leaks.
+ */
+
+import {
+  LOYALTY_LIMITS,
+  cleanStaffName,
+  isValidPin,
+  newId,
+  validateStaffName,
+  type LoyaltyState,
+  type Rng,
+  type StaffMember,
+} from "./rules";
+
+function toHex(buffer: ArrayBuffer): string {
+  return [...new Uint8Array(buffer)]
+    .map((byte) => byte.toString(16).padStart(2, "0"))
+    .join("");
+}
+
+export async function hashPin(pin: string, salt: string): Promise<string> {
+  const data = new TextEncoder().encode(`${salt}:${pin}`);
+  return toHex(await crypto.subtle.digest("SHA-256", data));
+}
+
+function newSalt(rng: Rng): string {
+  let out = "";
+  for (let i = 0; i < 16; i++) out += Math.floor(rng() * 16).toString(16);
+  return out;
+}
+
+export type PinFail = { ok: false; message: string };
+
+/** Adds a staff member. The PIN must be unique among active staff. */
+export async function addStaff(
+  state: LoyaltyState,
+  input: { name: string; pin: string },
+  now: Date,
+  rng: Rng = Math.random,
+): Promise<{ ok: true; state: LoyaltyState; staff: StaffMember } | PinFail> {
+  const nameError = validateStaffName(input.name);
+  if (nameError) return { ok: false, message: nameError };
+  if (!isValidPin(input.pin)) {
+    return {
+      ok: false,
+      message: `The PIN must be ${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits.`,
+    };
+  }
+  if (state.staff.length >= LOYALTY_LIMITS.maxStaff) {
+    return {
+      ok: false,
+      message: `You can add up to ${LOYALTY_LIMITS.maxStaff} staff members.`,
+    };
+  }
+  for (const other of state.staff.filter((s) => s.active)) {
+    if ((await hashPin(input.pin, other.pin_salt)) === other.pin_hash) {
+      return { ok: false, message: "Another staff member already uses that PIN." };
+    }
+  }
+  const salt = newSalt(rng);
+  const staff: StaffMember = {
+    id: newId("staff", rng),
+    name: cleanStaffName(input.name),
+    pin_salt: salt,
+    pin_hash: await hashPin(input.pin, salt),
+    active: true,
+    created_at: now.toISOString(),
+  };
+  return { ok: true, state: { ...state, staff: [...state.staff, staff] }, staff };
+}
+
+export async function changePin(
+  state: LoyaltyState,
+  staffId: string,
+  pin: string,
+  rng: Rng = Math.random,
+): Promise<{ ok: true; state: LoyaltyState } | PinFail> {
+  if (!isValidPin(pin)) {
+    return {
+      ok: false,
+      message: `The PIN must be ${LOYALTY_LIMITS.pinMin} to ${LOYALTY_LIMITS.pinMax} digits.`,
+    };
+  }
+  for (const other of state.staff.filter((s) => s.active && s.id !== staffId)) {
+    if ((await hashPin(pin, other.pin_salt)) === other.pin_hash) {
+      return { ok: false, message: "Another staff member already uses that PIN." };
+    }
+  }
+  const salt = newSalt(rng);
+  const hash = await hashPin(pin, salt);
+  return {
+    ok: true,
+    state: {
+      ...state,
+      staff: state.staff.map((s) =>
+        s.id === staffId ? { ...s, pin_salt: salt, pin_hash: hash } : s,
+      ),
+    },
+  };
+}
+
+export type IdentifyResult =
+  | { ok: true; state: LoyaltyState; staff: StaffMember }
+  | { ok: false; state: LoyaltyState; message: string; locked: boolean };
+
+/**
+ * Finds the active staff member whose PIN matches. Five wrong tries lock the
+ * screen for five minutes (the lock is per business, because a wrong PIN can
+ * not be tied to a person).
+ */
+export async function identifyStaff(
+  state: LoyaltyState,
+  pin: string,
+  now: Date,
+): Promise<IdentifyResult> {
+  const lockedUntil = state.pin_lock.locked_until
+    ? new Date(state.pin_lock.locked_until).getTime()
+    : 0;
+  if (lockedUntil > now.getTime()) {
+    const minutes = Math.ceil((lockedUntil - now.getTime()) / 60_000);
+    return {
+      ok: false,
+      state,
+      locked: true,
+      message: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
+    };
+  }
+  if (isValidPin(pin)) {
+    for (const staff of state.staff.filter((s) => s.active)) {
+      if ((await hashPin(pin, staff.pin_salt)) === staff.pin_hash) {
+        return {
+          ok: true,
+          staff,
+          state: { ...state, pin_lock: { failures: 0, locked_until: null } },
+        };
+      }
+    }
+  }
+  const failures = state.pin_lock.failures + 1;
+  const lock = failures >= LOYALTY_LIMITS.pinMaxFailures;
+  return {
+    ok: false,
+    locked: lock,
+    message: lock
+      ? "Too many wrong PINs. Stamp mode is locked for 5 minutes."
+      : "That PIN is not right.",
+    state: {
+      ...state,
+      pin_lock: {
+        failures: lock ? 0 : failures,
+        locked_until: lock
+          ? new Date(now.getTime() + LOYALTY_LIMITS.pinLockMs).toISOString()
+          : null,
+      },
+    },
+  };
+}
diff --git a/lib/loyalty/rules.ts b/lib/loyalty/rules.ts
new file mode 100644
index 0000000..f28cb07
--- /dev/null
+++ b/lib/loyalty/rules.ts
@@ -0,0 +1,1101 @@
+/**
+ * Loyalty program rules as PURE functions — ONE place (business-rules.md
+ * section 12, PRD.md 5.7).
+ *
+ * Why this file exists: a loyalty card is only worth something if stamps can
+ * not be faked. Every rule that decides "does this person get a stamp / a
+ * reward" lives here, takes the whole state plus `now`, and returns a NEW
+ * state or a typed error. Nothing here touches a browser, a database or the
+ * clock.
+ *
+ * - Stage 1 (now): `lib/mock/loyalty-store.ts` keeps the state in
+ *   localStorage and calls these functions, so the owner and customer screens
+ *   behave exactly like the real thing. localStorage can be edited by anyone,
+ *   so the mock is NOT secure — it only proves the flow.
+ * - Stage 3: the same functions run on the server inside one database
+ *   transaction per action (libSQL batch), with `business_id` on every row.
+ *   The customer's browser then only ever sends a code and receives a result;
+ *   it can never send "give me a stamp".
+ *
+ * Anti-fake rules enforced here:
+ *  1. A stamp needs a one-time code that expires in 60 seconds. The code comes
+ *     either from the customer's card (staff types/scans it) or from the
+ *     counter screen (customer types/scans it). The printed review QR is never
+ *     a stamp source.
+ *  2. A code works once. A used or expired code is rejected.
+ *  3. Cooldown between stamps and a rolling 24 hour cap per customer.
+ *  4. The stamp balance is DERIVED from an append-only ledger. It is never a
+ *     number anyone can edit. Voiding keeps the row, marked voided.
+ *  5. A reward exists only after a full card, is chosen from the owner's
+ *     active offers, copies the offer terms, and can be redeemed once.
+ *  6. Staff identity is recorded on every stamp and redemption.
+ *
+ * Stage 3 notes: generate codes with a CSPRNG and store only a hash; hash
+ * staff PINs with a slow hash (scrypt/argon2); keep the same limits.
+ */
+
+// ---------------------------------------------------------------------------
+// Limits (owner-tunable values are clamped to these ranges)
+// ---------------------------------------------------------------------------
+
+export const LOYALTY_LIMITS = {
+  /** Stamps needed to complete a card. */
+  stampsMin: 3,
+  stampsMax: 20,
+  /** Minimum hours between two stamps for one customer. */
+  gapHoursMin: 0,
+  gapHoursMax: 72,
+  /** Stamps per customer per rolling 24 hours. */
+  dailyCapMin: 1,
+  dailyCapMax: 5,
+  /** Days a chosen reward stays valid. */
+  rewardDaysMin: 7,
+  rewardDaysMax: 365,
+  /** Offers: at most 5 active at once, 20 stored in total. */
+  maxActiveOffers: 5,
+  maxOffers: 20,
+  titleMax: 40,
+  descriptionMax: 120,
+  monthlyLimitMax: 100000,
+  /** Staff. */
+  maxStaff: 10,
+  staffNameMin: 2,
+  staffNameMax: 40,
+  pinMin: 4,
+  pinMax: 6,
+  /** Codes. */
+  codeTtlMs: 60_000,
+  rewardCodeAlphabet: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
+  /** PIN lockout. */
+  pinMaxFailures: 5,
+  pinLockMs: 5 * 60_000,
+  /** Housekeeping: used/expired codes older than this are dropped. */
+  tokenKeepMs: 10 * 60_000,
+} as const;
+
+// ---------------------------------------------------------------------------
+// Types (field names match the loyalty tables in schema.sql)
+// ---------------------------------------------------------------------------
+
+export type StampMode = "member_code" | "counter_code" | "both";
+export type StampMethod = "member_code" | "counter_code";
+export type OfferKind = "free_item" | "percent_off" | "amount_off" | "custom";
+
+export type LoyaltyProgram = {
+  enabled: boolean;
+  stamps_required: number;
+  min_gap_hours: number;
+  daily_cap: number;
+  reward_valid_days: number;
+  stamp_mode: StampMode;
+};
+
+export type RewardOffer = {
+  id: string;
+  title: string;
+  description: string;
+  kind: OfferKind;
+  /** Max claims per calendar month (UTC); null = unlimited. */
+  monthly_limit: number | null;
+  active: boolean;
+  sort_order: number;
+};
+
+export type StaffMember = {
+  id: string;
+  name: string;
+  pin_hash: string;
+  pin_salt: string;
+  active: boolean;
+  created_at: string;
+};
+
+export type LoyaltyMember = {
+  id: string;
+  email: string | null;
+  email_verified_at: string | null;
+  created_at: string;
+  /** Set when the member is deleted; the email is removed, the ledger stays. */
+  deleted_at: string | null;
+};
+
+export type StampEntry = {
+  id: string;
+  member_id: string;
+  staff_id: string | null;
+  method: StampMethod;
+  created_at: string;
+  voided_at: string | null;
+  void_reason: string | null;
+};
+
+export type ClaimStatus = "earned" | "redeemed" | "cancelled";
+
+export type RewardClaim = {
+  id: string;
+  member_id: string;
+  offer_id: string;
+  /** Copied from the offer when chosen; later offer edits never change it. */
+  title: string;
+  description: string;
+  code: string;
+  status: ClaimStatus;
+  created_at: string;
+  expires_at: string;
+  redeemed_at: string | null;
+  redeemed_by: string | null;
+  cancelled_at: string | null;
+  cancel_reason: string | null;
+};
+
+export type StampToken = {
+  id: string;
+  kind: "member" | "counter";
+  member_id: string | null;
+  code: string;
+  created_at: string;
+  expires_at: string;
+  used_at: string | null;
+};
+
+export type PinLock = { failures: number; locked_until: string | null };
+
+export type LoyaltyState = {
+  version: 1;
+  program: LoyaltyProgram;
+  offers: RewardOffer[];
+  staff: StaffMember[];
+  members: LoyaltyMember[];
+  stamps: StampEntry[];
+  claims: RewardClaim[];
+  tokens: StampToken[];
+  pin_lock: PinLock;
+};
+
+/** Every error the rules can return. Messages are plain, customer-safe text. */
+export type LoyaltyErrorCode =
+  | "program_off"
+  | "member_not_found"
+  | "email_not_verified"
+  | "mode_disabled"
+  | "invalid_code"
+  | "too_soon"
+  | "daily_cap"
+  | "no_reward_pending"
+  | "offer_unavailable"
+  | "reward_not_found"
+  | "reward_expired"
+  | "reward_used"
+  | "reward_cancelled"
+  | "staff_not_found"
+  | "stamp_not_found"
+  | "already_voided"
+  | "claim_not_cancellable"
+  | "invalid_input"
+  | "limit_reached";
+
+export type Fail = { ok: false; code: LoyaltyErrorCode; message: string };
+export type Done<T> = { ok: true; state: LoyaltyState } & T;
+export type Result<T = object> = Done<T> | Fail;
+
+export type Rng = () => number;
+
+function fail(code: LoyaltyErrorCode, message: string): Fail {
+  return { ok: false, code, message };
+}
+
+// ---------------------------------------------------------------------------
+// Small helpers
+// ---------------------------------------------------------------------------
+
+/** Removes control, zero-width and bidi characters (security 4C). */
+function clean(input: string): string {
+  // eslint-disable-next-line no-control-regex
+  return input
+    .replace(
+      // eslint-disable-next-line no-control-regex
+      /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,
+      "",
+    )
+    .trim();
+}
+
+function clamp(value: number, min: number, max: number): number {
+  if (!Number.isFinite(value)) return min;
+  return Math.min(max, Math.max(min, Math.round(value)));
+}
+
+export function newId(prefix: string, rng: Rng = Math.random): string {
+  let out = "";
+  for (let i = 0; i < 12; i++) {
+    out += Math.floor(rng() * 36).toString(36);
+  }
+  return `${prefix}_${out}`;
+}
+
+function randomDigits(length: number, rng: Rng): string {
+  let out = "";
+  for (let i = 0; i < length; i++) out += Math.floor(rng() * 10).toString();
+  return out;
+}
+
+function randomRewardCode(rng: Rng): string {
+  const alphabet = LOYALTY_LIMITS.rewardCodeAlphabet;
+  const pick = () => alphabet[Math.floor(rng() * alphabet.length)];
+  let a = "";
+  let b = "";
+  for (let i = 0; i < 4; i++) {
+    a += pick();
+    b += pick();
+  }
+  return `${a}-${b}`;
+}
+
+/** Customers and staff may type codes with spaces or dashes; ignore both. */
+export function normalizeCode(input: string): string {
+  return input.replace(/[\s-]/g, "").toUpperCase();
+}
+
+const iso = (date: Date) => date.toISOString();
+const ms = (value: string) => new Date(value).getTime();
+
+// ---------------------------------------------------------------------------
+// Defaults and validation
+// ---------------------------------------------------------------------------
+
+export function defaultProgram(): LoyaltyProgram {
+  return {
+    enabled: true,
+    stamps_required: 10,
+    min_gap_hours: 4,
+    daily_cap: 1,
+    reward_valid_days: 30,
+    stamp_mode: "both",
+  };
+}
+
+export function emptyLoyaltyState(): LoyaltyState {
+  return {
+    version: 1,
+    program: defaultProgram(),
+    offers: [],
+    staff: [],
+    members: [],
+    stamps: [],
+    claims: [],
+    tokens: [],
+    pin_lock: { failures: 0, locked_until: null },
+  };
+}
+
+const MODES: StampMode[] = ["member_code", "counter_code", "both"];
+const KINDS: OfferKind[] = ["free_item", "percent_off", "amount_off", "custom"];
+
+/** Clamps every owner-tunable field into its allowed range. */
+export function normalizeProgram(input: Partial<LoyaltyProgram>): LoyaltyProgram {
+  const base = defaultProgram();
+  const L = LOYALTY_LIMITS;
+  return {
+    enabled: typeof input.enabled === "boolean" ? input.enabled : base.enabled,
+    stamps_required: clamp(
+      input.stamps_required ?? base.stamps_required,
+      L.stampsMin,
+      L.stampsMax,
+    ),
+    min_gap_hours: clamp(
+      input.min_gap_hours ?? base.min_gap_hours,
+      L.gapHoursMin,
+      L.gapHoursMax,
+    ),
+    daily_cap: clamp(
+      input.daily_cap ?? base.daily_cap,
+      L.dailyCapMin,
+      L.dailyCapMax,
+    ),
+    reward_valid_days: clamp(
+      input.reward_valid_days ?? base.reward_valid_days,
+      L.rewardDaysMin,
+      L.rewardDaysMax,
+    ),
+    stamp_mode: MODES.includes(input.stamp_mode as StampMode)
+      ? (input.stamp_mode as StampMode)
+      : base.stamp_mode,
+  };
+}
+
+export function setProgram(
+  state: LoyaltyState,
+  input: Partial<LoyaltyProgram>,
+): LoyaltyState {
+  return {
+    ...state,
+    program: normalizeProgram({ ...state.program, ...input }),
+  };
+}
+
+export type OfferInput = {
+  id?: string;
+  title: string;
+  description: string;
+  kind: OfferKind;
+  monthly_limit: number | null;
+  active: boolean;
+};
+
+/** Creates or edits an offer. Max 5 active, 20 stored. */
+export function saveOffer(
+  state: LoyaltyState,
+  input: OfferInput,
+  rng: Rng = Math.random,
+): Result<{ offer: RewardOffer }> {
+  const L = LOYALTY_LIMITS;
+  const title = clean(input.title);
+  const description = clean(input.description);
+  if (title.length < 2 || title.length > L.titleMax) {
+    return fail(
+      "invalid_input",
+      `Give the reward a title of 2 to ${L.titleMax} characters.`,
+    );
+  }
+  if (description.length > L.descriptionMax) {
+    return fail(
+      "invalid_input",
+      `Keep the description under ${L.descriptionMax} characters.`,
+    );
+  }
+  if (!KINDS.includes(input.kind)) {
+    return fail("invalid_input", "Choose a reward type.");
+  }
+  let monthly: number | null = null;
+  if (input.monthly_limit !== null) {
+    if (
+      !Number.isInteger(input.monthly_limit) ||
+      input.monthly_limit < 1 ||
+      input.monthly_limit > L.monthlyLimitMax
+    ) {
+      return fail(
+        "invalid_input",
+        "The monthly limit must be a whole number from 1 up, or left empty.",
+      );
+    }
+    monthly = input.monthly_limit;
+  }
+
+  const existing = input.id
+    ? state.offers.find((offer) => offer.id === input.id)
+    : undefined;
+  if (input.id && !existing) {
+    return fail("invalid_input", "That reward no longer exists.");
+  }
+  if (!existing && state.offers.length >= L.maxOffers) {
+    return fail("limit_reached", `You can store up to ${L.maxOffers} rewards.`);
+  }
+  const activeOthers = state.offers.filter(
+    (offer) => offer.active && offer.id !== existing?.id,
+  ).length;
+  if (input.active && activeOthers >= L.maxActiveOffers) {
+    return fail(
+      "limit_reached",
+      `Only ${L.maxActiveOffers} rewards can be active at once. Pause one first.`,
+    );
+  }
+
+  const offer: RewardOffer = {
+    id: existing?.id ?? newId("offer", rng),
+    title,
+    description,
+    kind: input.kind,
+    monthly_limit: monthly,
+    active: input.active,
+    sort_order:
+      existing?.sort_order ??
+      state.offers.reduce((max, o) => Math.max(max, o.sort_order), 0) + 1,
+  };
+  const offers = existing
+    ? state.offers.map((o) => (o.id === existing.id ? offer : o))
+    : [...state.offers, offer];
+  return { ok: true, state: { ...state, offers }, offer };
+}
+
+/** Deleting an offer never touches rewards already chosen (they hold a copy). */
+export function deleteOffer(state: LoyaltyState, offerId: string): LoyaltyState {
+  return { ...state, offers: state.offers.filter((o) => o.id !== offerId) };
+}
+
+export function setOfferActive(
+  state: LoyaltyState,
+  offerId: string,
+  active: boolean,
+): Result {
+  const offer = state.offers.find((o) => o.id === offerId);
+  if (!offer) return fail("invalid_input", "That reward no longer exists.");
+  if (
+    active &&
+    !offer.active &&
+    state.offers.filter((o) => o.active).length >=
+      LOYALTY_LIMITS.maxActiveOffers
+  ) {
+    return fail(
+      "limit_reached",
+      `Only ${LOYALTY_LIMITS.maxActiveOffers} rewards can be active at once. Pause one first.`,
+    );
+  }
+  return {
+    ok: true,
+    state: {
+      ...state,
+      offers: state.offers.map((o) => (o.id === offerId ? { ...o, active } : o)),
+    },
+  };
+}
+
+// ---------------------------------------------------------------------------
+// Members and derived card progress
+// ---------------------------------------------------------------------------
+
+export function findMember(
+  state: LoyaltyState,
+  memberId: string,
+): LoyaltyMember | undefined {
+  return state.members.find((m) => m.id === memberId && !m.deleted_at);
+}
+
+export function normalizeEmail(email: string): string {
+  return clean(email).toLowerCase();
+}
+
+/** Finds the member for this email, or creates an unverified one. */
+export function ensureMember(
+  state: LoyaltyState,
+  email: string,
+  now: Date,
+  rng: Rng = Math.random,
+): { state: LoyaltyState; member: LoyaltyMember } {
+  const key = normalizeEmail(email);
+  const existing = state.members.find((m) => m.email === key && !m.deleted_at);
+  if (existing) return { state, member: existing };
+  const member: LoyaltyMember = {
+    id: newId("mem", rng),
+    email: key,
+    email_verified_at: null,
+    created_at: iso(now),
+    deleted_at: null,
+  };
+  return { state: { ...state, members: [...state.members, member] }, member };
+}
+
+/** Called after the emailed code is confirmed. */
+export function markEmailVerified(
+  state: LoyaltyState,
+  memberId: string,
+  now: Date,
+): Result<{ member: LoyaltyMember }> {
+  const member = findMember(state, memberId);
+  if (!member) return fail("member_not_found", "We couldn't find that card.");
+  const updated = { ...member, email_verified_at: member.email_verified_at ?? iso(now) };
+  return {
+    ok: true,
+    state: {
+      ...state,
+      members: state.members.map((m) => (m.id === memberId ? updated : m)),
+    },
+    member: updated,
+  };
+}
+
+/** Removes the personal data; the stamp/reward ledger rows stay (anonymous). */
+export function deleteMember(
+  state: LoyaltyState,
+  memberId: string,
+  now: Date,
+): LoyaltyState {
+  return {
+    ...state,
+    members: state.members.map((m) =>
+      m.id === memberId ? { ...m, email: null, deleted_at: iso(now) } : m,
+    ),
+    tokens: state.tokens.filter((t) => t.member_id !== memberId),
+  };
+}
+
+export type CardProgress = {
+  /** All valid (not voided) stamps ever. */
+  total: number;
+  required: number;
+  /** Stamps on the current card, 0..required (a full card shows `required`). */
+  current: number;
+  /** Full cards whose reward has not been chosen yet. */
+  pending: number;
+  /** Rewards chosen so far (any status). */
+  claimed: number;
+};
+
+/**
+ * The balance is derived, never stored:
+ *   cards completed = floor(valid stamps / required)
+ *   pending         = cards completed − rewards already chosen
+ * Extra stamps carry over to the next card automatically.
+ */
+export function cardProgress(
+  state: LoyaltyState,
+  memberId: string,
+): CardProgress {
+  const required = state.program.stamps_required;
+  const total = state.stamps.filter(
+    (s) => s.member_id === memberId && !s.voided_at,
+  ).length;
+  const claimed = state.claims.filter((c) => c.member_id === memberId).length;
+  const pending = Math.max(0, Math.floor(total / required) - claimed);
+  const raw = total - claimed * required;
+  const current = pending > 0 ? required : Math.max(0, Math.min(required - 1, raw));
+  return { total, required, current, pending, claimed };
+}
+
+// ---------------------------------------------------------------------------
+// One-time codes
+// ---------------------------------------------------------------------------
+
+function pruneTokens(tokens: StampToken[], now: Date): StampToken[] {
+  const cutoff = now.getTime() - LOYALTY_LIMITS.tokenKeepMs;
+  return tokens.filter((t) => ms(t.expires_at) > cutoff);
+}
+
+function isLive(token: StampToken, now: Date): boolean {
+  return !token.used_at && ms(token.expires_at) > now.getTime();
+}
+
+function uniqueDigits(tokens: StampToken[], now: Date, rng: Rng): string {
+  const live = new Set(tokens.filter((t) => isLive(t, now)).map((t) => t.code));
+  for (let i = 0; i < 50; i++) {
+    const code = randomDigits(6, rng);
+    if (!live.has(code)) return code;
+  }
+  return randomDigits(6, rng);
+}
+
+function modeAllows(program: LoyaltyProgram, method: StampMethod): boolean {
+  return program.stamp_mode === "both" || program.stamp_mode === method;
+}
+
+/** The customer's own code (Mode A): staff enter or scan it. */
+export function issueMemberCode(
+  state: LoyaltyState,
+  memberId: string,
+  now: Date,
+  rng: Rng = Math.random,
+): Result<{ token: StampToken }> {
+  if (!state.program.enabled) {
+    return fail("program_off", "The loyalty program is paused right now.");
+  }
+  const member = findMember(state, memberId);
+  if (!member) return fail("member_not_found", "We couldn't find that card.");
+  if (!member.email_verified_at) {
+    return fail("email_not_verified", "Confirm your email to use your card.");
+  }
+  if (!modeAllows(state.program, "member_code")) {
+    return fail("mode_disabled", "Ask the staff to give you a counter code.");
+  }
+  // One live code per customer: a new one replaces the old one.
+  const kept = pruneTokens(state.tokens, now).filter(
+    (t) => !(t.kind === "member" && t.member_id === memberId && isLive(t, now)),
+  );
+  const token: StampToken = {
+    id: newId("tok", rng),
+    kind: "member",
+    member_id: memberId,
+    code: uniqueDigits(kept, now, rng),
+    created_at: iso(now),
+    expires_at: iso(new Date(now.getTime() + LOYALTY_LIMITS.codeTtlMs)),
+    used_at: null,
+  };
+  return { ok: true, state: { ...state, tokens: [...kept, token] }, token };
+}
+
+/** The counter code (Mode B): shown on the staff screen, typed by the customer. */
+export function issueCounterCode(
+  state: LoyaltyState,
+  now: Date,
+  rng: Rng = Math.random,
+): Result<{ token: StampToken }> {
+  if (!state.program.enabled) {
+    return fail("program_off", "The loyalty program is paused right now.");
+  }
+  if (!modeAllows(state.program, "counter_code")) {
+    return fail("mode_disabled", "Counter codes are turned off.");
+  }
+  // Only one live counter code at a time.
+  const kept = pruneTokens(state.tokens, now).filter(
+    (t) => !(t.kind === "counter" && isLive(t, now)),
+  );
+  const token: StampToken = {
+    id: newId("tok", rng),
+    kind: "counter",
+    member_id: null,
+    code: uniqueDigits(kept, now, rng),
+    created_at: iso(now),
+    expires_at: iso(new Date(now.getTime() + LOYALTY_LIMITS.codeTtlMs)),
+    used_at: null,
+  };
+  return { ok: true, state: { ...state, tokens: [...kept, token] }, token };
+}
+
+// ---------------------------------------------------------------------------
+// Stamps
+// ---------------------------------------------------------------------------
+
+function addStamp(
+  state: LoyaltyState,
+  memberId: string,
+  method: StampMethod,
+  staffId: string | null,
+  now: Date,
+  rng: Rng,
+): Result<{ stamp: StampEntry; progress: CardProgress; completed: boolean }> {
+  const program = state.program;
+  if (!program.enabled) {
+    return fail("program_off", "The loyalty program is paused right now.");
+  }
+  const member = findMember(state, memberId);
+  if (!member) return fail("member_not_found", "We couldn't find that card.");
+  if (!member.email_verified_at) {
+    return fail("email_not_verified", "This card's email is not confirmed yet.");
+  }
+  if (!modeAllows(program, method)) {
+    return fail("mode_disabled", "This way of getting a stamp is turned off.");
+  }
+
+  const mine = state.stamps.filter(
+    (s) => s.member_id === memberId && !s.voided_at,
+  );
+  const nowMs = now.getTime();
+
+  // Cooldown since the last valid stamp.
+  const last = mine.reduce((max, s) => Math.max(max, ms(s.created_at)), 0);
+  const gapMs = program.min_gap_hours * 3_600_000;
+  if (last && nowMs - last < gapMs) {
+    const minutes = Math.ceil((gapMs - (nowMs - last)) / 60_000);
+    const wait =
+      minutes >= 90
+        ? `${Math.ceil(minutes / 60)} hours`
+        : `${minutes} minute${minutes === 1 ? "" : "s"}`;
+    return fail("too_soon", `Next stamp available in about ${wait}.`);
+  }
+
+  // Rolling 24 hour cap.
+  const inDay = mine.filter((s) => nowMs - ms(s.created_at) < 86_400_000).length;
+  if (inDay >= program.daily_cap) {
+    return fail("daily_cap", "Today's stamp limit is reached. Come back tomorrow.");
+  }
+
+  const before = cardProgress(state, memberId);
+  const stamp: StampEntry = {
+    id: newId("stamp", rng),
+    member_id: memberId,
+    staff_id: staffId,
+    method,
+    created_at: iso(now),
+    voided_at: null,
+    void_reason: null,
+  };
+  const next: LoyaltyState = { ...state, stamps: [...state.stamps, stamp] };
+  const progress = cardProgress(next, memberId);
+  return {
+    ok: true,
+    state: next,
+    stamp,
+    progress,
+    completed: progress.pending > before.pending,
+  };
+}
+
+function activeStaff(state: LoyaltyState, staffId: string): StaffMember | undefined {
+  return state.staff.find((s) => s.id === staffId && s.active);
+}
+
+/**
+ * Mode A: staff enter the customer's code. The code is consumed only when the
+ * stamp is actually given (a "too soon" answer does not burn it).
+ */
+export function stampWithMemberCode(
+  state: LoyaltyState,
+  input: { code: string; staffId: string },
+  now: Date,
+  rng: Rng = Math.random,
+): Result<{
+  stamp: StampEntry;
+  member: LoyaltyMember;
+  progress: CardProgress;
+  completed: boolean;
+}> {
+  if (!activeStaff(state, input.staffId)) {
+    return fail("staff_not_found", "Enter a staff PIN first.");
+  }
+  const code = normalizeCode(input.code);
+  const token = state.tokens.find(
+    (t) => t.kind === "member" && t.code === code && isLive(t, now),
+  );
+  if (!code || !token || !token.member_id) {
+    return fail("invalid_code", "That code is wrong or has expired.");
+  }
+  const added = addStamp(state, token.member_id, "member_code", input.staffId, now, rng);
+  if (!added.ok) return added;
+  const member = findMember(added.state, token.member_id)!;
+  return {
+    ...added,
+    state: {
+      ...added.state,
+      tokens: added.state.tokens.map((t) =>
+        t.id === token.id ? { ...t, used_at: iso(now) } : t,
+      ),
+    },
+    member,
+  };
+}
+
+/** Mode B: the signed-in customer types the code shown on the counter screen. */
+export function stampWithCounterCode(
+  state: LoyaltyState,
+  input: { code: string; memberId: string },
+  now: Date,
+  rng: Rng = Math.random,
+): Result<{ stamp: StampEntry; progress: CardProgress; completed: boolean }> {
+  const code = normalizeCode(input.code);
+  const token = state.tokens.find(
+    (t) => t.kind === "counter" && t.code === code && isLive(t, now),
+  );
+  if (!code || !token) {
+    return fail("invalid_code", "That code is wrong or has expired.");
+  }
+  const added = addStamp(state, input.memberId, "counter_code", null, now, rng);
+  if (!added.ok) return added;
+  return {
+    ...added,
+    state: {
+      ...added.state,
+      // The counter code is single use: the next customer needs a fresh one.
+      tokens: added.state.tokens.map((t) =>
+        t.id === token.id ? { ...t, used_at: iso(now) } : t,
+      ),
+    },
+  };
+}
+
+/** Owner voids a stamp. The row stays in the ledger, marked voided. */
+export function voidStamp(
+  state: LoyaltyState,
+  stampId: string,
+  reason: string,
+  now: Date,
+): Result {
+  const stamp = state.stamps.find((s) => s.id === stampId);
+  if (!stamp) return fail("stamp_not_found", "That stamp no longer exists.");
+  if (stamp.voided_at) return fail("already_voided", "That stamp is already voided.");
+  return {
+    ok: true,
+    state: {
+      ...state,
+      stamps: state.stamps.map((s) =>
+        s.id === stampId
+          ? { ...s, voided_at: iso(now), void_reason: clean(reason).slice(0, 200) || null }
+          : s,
+      ),
+    },
+  };
+}
+
+// ---------------------------------------------------------------------------
+// Rewards
+// ---------------------------------------------------------------------------
+
+function monthKey(date: Date): string {
+  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
+}
+
+/** Offers a customer may choose right now: active and under the monthly limit. */
+export function availableOffers(state: LoyaltyState, now: Date): RewardOffer[] {
+  const key = monthKey(now);
+  return state.offers
+    .filter((offer) => {
+      if (!offer.active) return false;
+      if (offer.monthly_limit === null) return true;
+      const used = state.claims.filter(
+        (c) => c.offer_id === offer.id && monthKey(new Date(c.created_at)) === key,
+      ).length;
+      return used < offer.monthly_limit;
+    })
+    .sort((a, b) => a.sort_order - b.sort_order);
+}
+
+/** A full card lets the customer choose ONE reward from the active offers. */
+export function claimReward(
+  state: LoyaltyState,
+  input: { memberId: string; offerId: string },
+  now: Date,
+  rng: Rng = Math.random,
+): Result<{ claim: RewardClaim }> {
+  if (!state.program.enabled) {
+    return fail("program_off", "The loyalty program is paused right now.");
+  }
+  const member = findMember(state, input.memberId);
+  if (!member) return fail("member_not_found", "We couldn't find that card.");
+  if (cardProgress(state, input.memberId).pending < 1) {
+    return fail("no_reward_pending", "Complete your card to choose a reward.");
+  }
+  const offer = availableOffers(state, now).find((o) => o.id === input.offerId);
+  if (!offer) {
+    return fail(
+      "offer_unavailable",
+      "That reward isn't available right now. Please choose another.",
+    );
+  }
+  const taken = new Set(state.claims.map((c) => c.code));
+  let code = randomRewardCode(rng);
+  for (let i = 0; i < 50 && taken.has(code); i++) code = randomRewardCode(rng);
+
+  const claim: RewardClaim = {
+    id: newId("claim", rng),
+    member_id: input.memberId,
+    offer_id: offer.id,
+    title: offer.title,
+    description: offer.description,
+    code,
+    status: "earned",
+    created_at: iso(now),
+    expires_at: iso(
+      new Date(now.getTime() + state.program.reward_valid_days * 86_400_000),
+    ),
+    redeemed_at: null,
+    redeemed_by: null,
+    cancelled_at: null,
+    cancel_reason: null,
+  };
+  return { ok: true, state: { ...state, claims: [...state.claims, claim] }, claim };
+}
+
+export type ClaimView = "earned" | "redeemed" | "expired" | "cancelled";
+
+/** Expiry is derived from the clock, never stored. */
+export function claimView(claim: RewardClaim, now: Date): ClaimView {
+  if (claim.status === "redeemed") return "redeemed";
+  if (claim.status === "cancelled") return "cancelled";
+  return ms(claim.expires_at) <= now.getTime() ? "expired" : "earned";
+}
+
+/** Staff redeem a reward code at the counter. Works once. */
+export function redeemReward(
+  state: LoyaltyState,
+  input: { code: string; staffId: string },
+  now: Date,
+): Result<{ claim: RewardClaim }> {
+  if (!activeStaff(state, input.staffId)) {
+    return fail("staff_not_found", "Enter a staff PIN first.");
+  }
+  const code = normalizeCode(input.code);
+  const claim = state.claims.find((c) => normalizeCode(c.code) === code);
+  if (!code || !claim) {
+    return fail("reward_not_found", "No reward matches that code.");
+  }
+  const view = claimView(claim, now);
+  if (view === "redeemed") return fail("reward_used", "This reward was already used.");
+  if (view === "cancelled") return fail("reward_cancelled", "This reward was cancelled.");
+  if (view === "expired") return fail("reward_expired", "This reward has expired.");
+  const updated: RewardClaim = {
+    ...claim,
+    status: "redeemed",
+    redeemed_at: iso(now),
+    redeemed_by: input.staffId,
+  };
+  return {
+    ok: true,
+    state: {
+      ...state,
+      claims: state.claims.map((c) => (c.id === claim.id ? updated : c)),
+    },
+    claim: updated,
+  };
+}
+
+/** Owner cancels a reward that has not been used. Logged, never deleted. */
+export function cancelClaim(
+  state: LoyaltyState,
+  claimId: string,
+  reason: string,
+  now: Date,
+): Result {
+  const claim = state.claims.find((c) => c.id === claimId);
+  if (!claim || claim.status !== "earned") {
+    return fail("claim_not_cancellable", "Only unused rewards can be cancelled.");
+  }
+  return {
+    ok: true,
+    state: {
+      ...state,
+      claims: state.claims.map((c) =>
+        c.id === claimId
+          ? {
+              ...c,
+              status: "cancelled",
+              cancelled_at: iso(now),
+              cancel_reason: clean(reason).slice(0, 200) || null,
+            }
+          : c,
+      ),
+    },
+  };
+}
+
+// ---------------------------------------------------------------------------
+// Staff (PIN hashing lives in pin.ts because it is async)
+// ---------------------------------------------------------------------------
+
+export function isValidPin(pin: string): boolean {
+  return /^\d+$/.test(pin) &&
+    pin.length >= LOYALTY_LIMITS.pinMin &&
+    pin.length <= LOYALTY_LIMITS.pinMax;
+}
+
+export function validateStaffName(name: string): string | undefined {
+  const value = clean(name);
+  const L = LOYALTY_LIMITS;
+  if (value.length < L.staffNameMin || value.length > L.staffNameMax) {
+    return `Enter a name of ${L.staffNameMin} to ${L.staffNameMax} characters.`;
+  }
+  return undefined;
+}
+
+export function cleanStaffName(name: string): string {
+  return clean(name);
+}
+
+export function setStaffActive(
+  state: LoyaltyState,
+  staffId: string,
+  active: boolean,
+): LoyaltyState {
+  return {
+    ...state,
+    staff: state.staff.map((s) => (s.id === staffId ? { ...s, active } : s)),
+  };
+}
+
+// ---------------------------------------------------------------------------
+// Owner stats (derived)
+// ---------------------------------------------------------------------------
+
+export type LoyaltyStats = {
+  members: number;
+  newThisWeek: number;
+  stampsTotal: number;
+  stampsThisWeek: number;
+  rewardsChosen: number;
+  rewardsRedeemed: number;
+  rewardsExpired: number;
+  rewardsOpen: number;
+  perOffer: { offerId: string; title: string; chosen: number; redeemed: number }[];
+  perStaff: { staffId: string; name: string; stamps: number; redemptions: number }[];
+};
+
+export function loyaltyStats(state: LoyaltyState, now: Date): LoyaltyStats {
+  const week = 7 * 86_400_000;
+  const members = state.members.filter((m) => !m.deleted_at && m.email_verified_at);
+  const valid = state.stamps.filter((s) => !s.voided_at);
+  const views = state.claims.map((c) => claimView(c, now));
+  const offerIds = new Set([
+    ...state.offers.map((o) => o.id),
+    ...state.claims.map((c) => c.offer_id),
+  ]);
+  return {
+    members: members.length,
+    newThisWeek: members.filter((m) => now.getTime() - ms(m.created_at) < week).length,
+    stampsTotal: valid.length,
+    stampsThisWeek: valid.filter((s) => now.getTime() - ms(s.created_at) < week).length,
+    rewardsChosen: state.claims.length,
+    rewardsRedeemed: views.filter((v) => v === "redeemed").length,
+    rewardsExpired: views.filter((v) => v === "expired").length,
+    rewardsOpen: views.filter((v) => v === "earned").length,
+    perOffer: [...offerIds].map((offerId) => {
+      const claims = state.claims.filter((c) => c.offer_id === offerId);
+      return {
+        offerId,
+        title:
+          state.offers.find((o) => o.id === offerId)?.title ??
+          claims[0]?.title ??
+          "Removed reward",
+        chosen: claims.length,
+        redeemed: claims.filter((c) => c.status === "redeemed").length,
+      };
+    }),
+    perStaff: state.staff.map((s) => ({
+      staffId: s.id,
+      name: s.name,
+      stamps: valid.filter((x) => x.staff_id === s.id).length,
+      redemptions: state.claims.filter((c) => c.redeemed_by === s.id).length,
+    })),
+  };
+}
+
+export type ActivityItem = {
+  id: string;
+  at: string;
+  kind: "stamp" | "stamp_voided" | "reward_chosen" | "reward_redeemed" | "reward_cancelled";
+  text: string;
+  /** Present on stamps so the owner can void them. */
+  stampId?: string;
+  voided?: boolean;
+  claimId?: string;
+  cancellable?: boolean;
+};
+
+/** Newest first. Built from the ledger, so nothing can be hidden from it. */
+export function activityLog(state: LoyaltyState, now: Date): ActivityItem[] {
+  const who = (memberId: string) => {
+    const m = state.members.find((x) => x.id === memberId);
+    return m?.email ?? "Deleted member";
+  };
+  const staff = (id: string | null) =>
+    id ? (state.staff.find((s) => s.id === id)?.name ?? "Staff") : null;
+  const items: ActivityItem[] = [];
+  for (const s of state.stamps) {
+    const by = staff(s.staff_id);
+    const how = s.method === "member_code" ? `by ${by ?? "staff"}` : "with the counter code";
+    items.push({
+      id: s.id,
+      at: s.created_at,
+      kind: s.voided_at ? "stamp_voided" : "stamp",
+      text: `${s.voided_at ? "Voided stamp for" : "Stamp for"} ${who(s.member_id)}, given ${how}${
+        s.void_reason ? ` (${s.void_reason})` : ""
+      }`,
+      stampId: s.id,
+      voided: Boolean(s.voided_at),
+    });
+  }
+  for (const c of state.claims) {
+    items.push({
+      id: `${c.id}-chosen`,
+      at: c.created_at,
+      kind: "reward_chosen",
+      text: `${who(c.member_id)} chose “${c.title}”`,
+      claimId: c.id,
+      cancellable: claimView(c, now) === "earned",
+    });
+    if (c.redeemed_at) {
+      items.push({
+        id: `${c.id}-redeemed`,
+        at: c.redeemed_at,
+        kind: "reward_redeemed",
+        text: `“${c.title}” used by ${who(c.member_id)}, confirmed by ${staff(c.redeemed_by) ?? "staff"}`,
+      });
+    }
+    if (c.cancelled_at) {
+      items.push({
+        id: `${c.id}-cancelled`,
+        at: c.cancelled_at,
+        kind: "reward_cancelled",
+        text: `“${c.title}” for ${who(c.member_id)} was cancelled${
+          c.cancel_reason ? ` (${c.cancel_reason})` : ""
+        }`,
+      });
+    }
+  }
+  return items.sort((a, b) => ms(b.at) - ms(a.at));
+}
diff --git a/lib/mock/loyalty-store.ts b/lib/mock/loyalty-store.ts
new file mode 100644
index 0000000..1430810
--- /dev/null
+++ b/lib/mock/loyalty-store.ts
@@ -0,0 +1,247 @@
+/**
+ * MOCK ONLY, removed in Stage 4 when the database is connected.
+ *
+ * Keeps the loyalty state in `localStorage` and runs every action through the
+ * pure rules in `lib/loyalty/rules.ts`. Because the owner dashboard and the
+ * customer page share one browser, you can walk the WHOLE flow on one device:
+ * join as a customer, open Stamp mode as staff in another tab, give a stamp,
+ * complete the card, choose a reward and redeem it.
+ *
+ * IMPORTANT: localStorage is not secure. Anyone can edit it in dev tools, so
+ * this mock proves the flow, not the fraud protection. Real protection starts
+ * in Stage 3, when these same rules run on the server.
+ *
+ * Stored data is never trusted: it is parsed in a try/catch and anything that
+ * does not look right falls back to a fresh state.
+ */
+
+import {
+  emptyLoyaltyState,
+  normalizeProgram,
+  type LoyaltyState,
+} from "@/lib/loyalty/rules";
+import { addStaff } from "@/lib/loyalty/pin";
+
+export const LOYALTY_STORAGE_KEY = "syehere.mock.loyalty.v1";
+export const LOYALTY_SESSION_KEY = "syehere.mock.loyalty.session.v1";
+const CHANGE_EVENT = "syehere:loyalty-changed";
+
+/** Demo PIN so the mock Stamp mode works straight away. */
+export const DEMO_STAFF_PIN = "1234";
+
+let memory: LoyaltyState | null = null;
+let memorySession: string | null = null;
+
+function isRecord(value: unknown): value is Record<string, unknown> {
+  return typeof value === "object" && value !== null && !Array.isArray(value);
+}
+
+/** Shape check only; the rules clamp every number again on use. */
+function sanitize(raw: unknown): LoyaltyState | null {
+  if (!isRecord(raw) || raw.version !== 1) return null;
+  const lists = ["offers", "staff", "members", "stamps", "claims", "tokens"] as const;
+  for (const key of lists) if (!Array.isArray(raw[key])) return null;
+  if (!isRecord(raw.program) || !isRecord(raw.pin_lock)) return null;
+  const lock = raw.pin_lock;
+  return {
+    version: 1,
+    program: normalizeProgram(raw.program as never),
+    offers: (raw.offers as LoyaltyState["offers"]).slice(0, 50),
+    staff: (raw.staff as LoyaltyState["staff"]).slice(0, 20),
+    members: (raw.members as LoyaltyState["members"]).slice(0, 5000),
+    stamps: (raw.stamps as LoyaltyState["stamps"]).slice(-50000),
+    claims: (raw.claims as LoyaltyState["claims"]).slice(-20000),
+    tokens: (raw.tokens as LoyaltyState["tokens"]).slice(-500),
+    pin_lock: {
+      failures: typeof lock.failures === "number" ? lock.failures : 0,
+      locked_until: typeof lock.locked_until === "string" ? lock.locked_until : null,
+    },
+  };
+}
+
+/** First run: a program with four example rewards (the owner edits them). */
+export function seedLoyaltyState(): LoyaltyState {
+  const state = emptyLoyaltyState();
+  const examples: [string, string, "free_item" | "percent_off"][] = [
+    ["Free coffee", "Any regular hot coffee", "free_item"],
+    ["Free dessert", "Any dessert from the counter", "free_item"],
+    ["20% off your bill", "One visit only", "percent_off"],
+    ["Free sandwich", "Any sandwich from the menu", "free_item"],
+  ];
+  return {
+    ...state,
+    offers: examples.map(([title, description, kind], index) => ({
+      id: `offer_demo${index + 1}`,
+      title,
+      description,
+      kind,
+      monthly_limit: null,
+      active: true,
+      sort_order: index + 1,
+    })),
+  };
+}
+
+export function getLoyaltyState(): LoyaltyState {
+  if (memory) return memory;
+  if (typeof window !== "undefined") {
+    try {
+      const raw = window.localStorage.getItem(LOYALTY_STORAGE_KEY);
+      if (raw) {
+        const parsed = sanitize(JSON.parse(raw));
+        if (parsed) {
+          memory = parsed;
+          return parsed;
+        }
+      }
+    } catch {
+      // Fall through to a fresh state.
+    }
+  }
+  memory = seedLoyaltyState();
+  return memory;
+}
+
+/** Reads fresh from storage so two open tabs never overwrite each other. */
+function readFresh(): LoyaltyState {
+  memory = null;
+  return getLoyaltyState();
+}
+
+function persist(state: LoyaltyState) {
+  memory = state;
+  if (typeof window === "undefined") return;
+  try {
+    window.localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(state));
+  } catch {
+    // Storage full or blocked: the in-memory copy keeps this tab working.
+  }
+  window.dispatchEvent(new Event(CHANGE_EVENT));
+}
+
+/**
+ * Read-modify-write in one step. `fn` gets the latest state and returns the
+ * new state plus whatever the caller needs (a result, an error).
+ */
+export function updateLoyalty<T>(
+  fn: (state: LoyaltyState) => { state: LoyaltyState } & T,
+): T {
+  const result = fn(readFresh());
+  persist(result.state);
+  return result;
+}
+
+/** Like `updateLoyalty` but for actions that may fail (state unchanged on fail). */
+export function tryLoyalty<R extends { ok: boolean }>(
+  fn: (state: LoyaltyState) => R & { state?: LoyaltyState },
+): R {
+  const result = fn(readFresh());
+  if (result.state) persist(result.state);
+  return result;
+}
+
+export function setLoyaltyState(state: LoyaltyState) {
+  persist(state);
+}
+
+export function resetLoyaltyDemo() {
+  memory = null;
+  persist(seedLoyaltyState());
+  setSessionMemberId(null);
+  void ensureDemoStaff();
+}
+
+export function subscribeLoyalty(callback: () => void): () => void {
+  if (typeof window === "undefined") return () => {};
+  const onStorage = (event: StorageEvent) => {
+    if (event.key === LOYALTY_STORAGE_KEY || event.key === LOYALTY_SESSION_KEY) {
+      memory = null;
+      callback();
+    }
+  };
+  window.addEventListener(CHANGE_EVENT, callback);
+  window.addEventListener("storage", onStorage);
+  return () => {
+    window.removeEventListener(CHANGE_EVENT, callback);
+    window.removeEventListener("storage", onStorage);
+  };
+}
+
+/** Adds the demo staff member (PIN 1234) the first time, so Stamp mode works. */
+export async function ensureDemoStaff(): Promise<void> {
+  const state = readFresh();
+  if (state.staff.length > 0) return;
+  const result = await addStaff(state, { name: "Counter", pin: DEMO_STAFF_PIN }, new Date());
+  if (result.ok) persist(result.state);
+}
+
+// ---------------------------------------------------------------------------
+// Customer device session (stands in for the signed-in cookie of Stage 3)
+// ---------------------------------------------------------------------------
+
+export function getSessionMemberId(): string | null {
+  if (typeof window === "undefined") return memorySession;
+  try {
+    return window.localStorage.getItem(LOYALTY_SESSION_KEY) ?? memorySession;
+  } catch {
+    return memorySession;
+  }
+}
+
+export function setSessionMemberId(memberId: string | null) {
+  memorySession = memberId;
+  if (typeof window === "undefined") return;
+  try {
+    if (memberId) window.localStorage.setItem(LOYALTY_SESSION_KEY, memberId);
+    else window.localStorage.removeItem(LOYALTY_SESSION_KEY);
+  } catch {
+    // Keep the in-memory value.
+  }
+  window.dispatchEvent(new Event(CHANGE_EVENT));
+}
+
+// ---------------------------------------------------------------------------
+// Mock email code (stands in for the Resend email of Stage 3)
+// ---------------------------------------------------------------------------
+
+type PendingOtp = { email: string; code: string; expiresAt: number; tries: number };
+let pendingOtp: PendingOtp | null = null;
+
+const OTP_TTL_MS = 10 * 60_000;
+const OTP_MAX_TRIES = 5;
+
+/**
+ * MOCK: "sends" a 6 digit code. The real server emails it with Resend, stores
+ * only a hash, rate-limits by IP and email, and checks a Turnstile token first.
+ * The mock returns the code so the screen can show it.
+ */
+export function mockSendEmailCode(email: string, now = Date.now()): string {
+  const code = String(Math.floor(100000 + Math.random() * 900000));
+  pendingOtp = { email: email.trim().toLowerCase(), code, expiresAt: now + OTP_TTL_MS, tries: 0 };
+  return code;
+}
+
+export function mockCheckEmailCode(
+  email: string,
+  code: string,
+  now = Date.now(),
+): { ok: true } | { ok: false; message: string } {
+  const pending = pendingOtp;
+  if (!pending || pending.email !== email.trim().toLowerCase()) {
+    return { ok: false, message: "Ask for a new code and try again." };
+  }
+  if (pending.expiresAt <= now) {
+    pendingOtp = null;
+    return { ok: false, message: "That code has expired. Ask for a new one." };
+  }
+  if (pending.tries >= OTP_MAX_TRIES) {
+    pendingOtp = null;
+    return { ok: false, message: "Too many wrong tries. Ask for a new code." };
+  }
+  if (pending.code !== code.trim()) {
+    pending.tries += 1;
+    return { ok: false, message: "That code is not right." };
+  }
+  pendingOtp = null;
+  return { ok: true };
+}
diff --git a/lib/use-loyalty.ts b/lib/use-loyalty.ts
new file mode 100644
index 0000000..708e90e
--- /dev/null
+++ b/lib/use-loyalty.ts
@@ -0,0 +1,68 @@
+"use client";
+
+/**
+ * MOCK ONLY, removed in Stage 4 when the database is connected.
+ *
+ * The ONE way client components read the loyalty state. Returns `null` until
+ * the browser has mounted, so the server render and the first client render
+ * match (no hydration warning); the stored state arrives right after mount and
+ * updates whenever it changes in this tab or another tab.
+ */
+
+import { useCallback, useEffect, useState } from "react";
+import type { LoyaltyState } from "@/lib/loyalty/rules";
+import {
+  ensureDemoStaff,
+  getLoyaltyState,
+  getSessionMemberId,
+  subscribeLoyalty,
+} from "@/lib/mock/loyalty-store";
+
+export function useLoyaltyState(
+  options: { seedDemoStaff?: boolean } = {},
+): LoyaltyState | null {
+  const { seedDemoStaff = false } = options;
+  const [state, setState] = useState<LoyaltyState | null>(null);
+
+  useEffect(() => {
+    const sync = () => setState(getLoyaltyState());
+    sync();
+    // MOCK ONLY: the dashboard adds one demo staff member (PIN 1234).
+    if (seedDemoStaff) void ensureDemoStaff();
+    return subscribeLoyalty(sync);
+  }, [seedDemoStaff]);
+
+  return state;
+}
+
+/** The customer's signed-in card on this device (null = not signed in). */
+export function useLoyaltySession(): [string | null, boolean] {
+  const [memberId, setMemberId] = useState<string | null>(null);
+  const [ready, setReady] = useState(false);
+
+  useEffect(() => {
+    const sync = () => {
+      setMemberId(getSessionMemberId());
+      setReady(true);
+    };
+    sync();
+    return subscribeLoyalty(sync);
+  }, []);
+
+  return [memberId, ready];
+}
+
+/** A clock that ticks, for countdowns and expiry. Starts null (SSR-safe). */
+export function useNow(intervalMs = 1000): Date | null {
+  const [now, setNow] = useState<Date | null>(null);
+
+  const tick = useCallback(() => setNow(new Date()), []);
+
+  useEffect(() => {
+    tick();
+    const id = window.setInterval(tick, intervalMs);
+    return () => window.clearInterval(id);
+  }, [tick, intervalMs]);
+
+  return now;
+}
diff --git a/privacy-policy.md b/privacy-policy.md
index dc82930..2461e58 100644
--- a/privacy-policy.md
+++ b/privacy-policy.md
@@ -26,6 +26,7 @@ For customer data, the business owner decides why it is collected; we process it
 **From customers of a business**
 - Private feedback you choose to submit: the message and any contact details you type in.
 - Anonymous usage data: a scan or button-tap counter. We create a **one-way hashed visitor identifier** from technical details (such as IP address and browser type) plus a daily changing salt. We do **not** store your raw IP address.
+- Loyalty card (only if you join a business's loyalty program): your email address (to confirm it is you and to keep your card), your stamps and rewards with the date and which staff member confirmed them. The business that runs the program can see this. We use the email only for the loyalty card, not for marketing. You can ask the business, or us, to delete your card; your email is then removed.
 - Strictly necessary technical data such as security logs.
 
 We do not sell personal data. We do not use it for advertising.
diff --git a/schema.sql b/schema.sql
index ec52554..6f362eb 100644
--- a/schema.sql
+++ b/schema.sql
@@ -325,11 +325,151 @@ CREATE TABLE processed_webhook_events (
   received_at TEXT NOT NULL DEFAULT (datetime('now'))
 );
 
+-- ============================================================
+-- LOYALTY PROGRAM (stamp card + rewards) — business-rules.md section 12
+-- ============================================================
+-- One program per business. Stamps and rewards are an APPEND-ONLY LEDGER: the
+-- customer's balance is calculated from `loyalty_stamps` and
+-- `loyalty_reward_claims`, never stored as an editable number, so it cannot be
+-- bumped by a bug or a hand-edit. Every query MUST filter by business_id
+-- (see TENANT ISOLATION below). The rules live in lib/loyalty/rules.ts and run
+-- inside ONE transaction (libSQL batch) per action.
+
+CREATE TABLE loyalty_programs (
+  business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
+  enabled INTEGER NOT NULL DEFAULT 1,
+  stamps_required INTEGER NOT NULL DEFAULT 10,    -- 3..20
+  min_gap_hours INTEGER NOT NULL DEFAULT 4,       -- 0..72, between two stamps for one member
+  daily_cap INTEGER NOT NULL DEFAULT 1,           -- 1..5 stamps per member per rolling 24 hours
+  reward_valid_days INTEGER NOT NULL DEFAULT 30,  -- 7..365
+  stamp_mode TEXT NOT NULL DEFAULT 'both',        -- member_code, counter_code, both
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
+);
+
+-- The 4-5 rewards the owner offers. At most 5 active at once (enforced in app code).
+CREATE TABLE loyalty_reward_offers (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  title TEXT NOT NULL,                  -- 2..40 characters
+  description TEXT,                     -- up to 120 characters
+  kind TEXT NOT NULL,                   -- free_item, percent_off, amount_off, custom
+  monthly_limit INTEGER,                -- null = unlimited; counted per calendar month (UTC)
+  active INTEGER NOT NULL DEFAULT 1,
+  sort_order INTEGER NOT NULL DEFAULT 0,
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
+);
+
+CREATE INDEX idx_loyalty_reward_offers_business ON loyalty_reward_offers(business_id);
+
+-- People who staff the counter. PIN identifies who gave each stamp / confirmed
+-- each reward. Store a slow salted hash (scrypt/argon2), never the PIN.
+CREATE TABLE loyalty_staff (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  name TEXT NOT NULL,
+  pin_hash TEXT NOT NULL,
+  pin_salt TEXT NOT NULL,
+  active INTEGER NOT NULL DEFAULT 1,
+  failed_attempts INTEGER NOT NULL DEFAULT 0,     -- 5 wrong PINs lock Stamp mode for 5 minutes
+  locked_until TEXT,
+  created_at TEXT NOT NULL DEFAULT (datetime('now'))
+);
+
+CREATE INDEX idx_loyalty_staff_business ON loyalty_staff(business_id);
+
+-- A customer's card. Identified by a CONFIRMED email (code emailed through
+-- Resend). Deleting a member removes the email; ledger rows stay, anonymous.
+CREATE TABLE loyalty_members (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  email TEXT,                           -- lower-cased; null after deletion
+  email_verified_at TEXT,
+  deleted_at TEXT,
+  created_at TEXT NOT NULL DEFAULT (datetime('now'))
+);
+
+CREATE UNIQUE INDEX idx_loyalty_members_email ON loyalty_members(business_id, email) WHERE email IS NOT NULL;
+
+-- STAMP LEDGER (append-only). Never UPDATE or DELETE a row except to set
+-- voided_at / void_reason when the owner voids a stamp.
+CREATE TABLE loyalty_stamps (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  member_id TEXT NOT NULL REFERENCES loyalty_members(id),
+  staff_id TEXT REFERENCES loyalty_staff(id), -- null when the customer used the counter code
+  method TEXT NOT NULL,                 -- member_code, counter_code
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  voided_at TEXT,
+  void_reason TEXT
+);
+
+CREATE INDEX idx_loyalty_stamps_member ON loyalty_stamps(business_id, member_id, created_at);
+
+-- REWARD CLAIMS: a reward a customer chose after completing a card. Title and
+-- description are COPIED from the offer at that moment, so later edits or
+-- deletes of the offer never change a reward already chosen. Expiry is derived
+-- from expires_at, not stored as a status.
+CREATE TABLE loyalty_reward_claims (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  member_id TEXT NOT NULL REFERENCES loyalty_members(id),
+  offer_id TEXT,                        -- no foreign key on purpose: the offer may be deleted
+  title TEXT NOT NULL,
+  description TEXT,
+  code TEXT NOT NULL,                   -- e.g. K4MP-92QX, unique per business
+  status TEXT NOT NULL DEFAULT 'earned',-- earned, redeemed, cancelled
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  expires_at TEXT NOT NULL,
+  redeemed_at TEXT,
+  redeemed_by TEXT REFERENCES loyalty_staff(id),
+  cancelled_at TEXT,
+  cancel_reason TEXT
+);
+
+CREATE UNIQUE INDEX idx_loyalty_claims_code ON loyalty_reward_claims(business_id, code);
+CREATE INDEX idx_loyalty_claims_member ON loyalty_reward_claims(business_id, member_id);
+-- Redeem with ONE conditional update so two staff can never redeem the same
+-- reward: UPDATE ... SET status='redeemed' WHERE id=? AND business_id=? AND
+-- status='earned' AND expires_at > ?  -> exactly 1 row changed means success.
+
+-- ONE-TIME STAMP CODES (60 second life). Store only a hash of the code.
+-- kind 'member' = shown on the customer's card; 'counter' = shown on the staff
+-- screen. A code works once (used_at). Delete rows older than 10 minutes.
+CREATE TABLE loyalty_tokens (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  kind TEXT NOT NULL,                   -- member, counter
+  member_id TEXT REFERENCES loyalty_members(id),
+  code_hash TEXT NOT NULL,
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  expires_at TEXT NOT NULL,
+  used_at TEXT
+);
+
+CREATE INDEX idx_loyalty_tokens_lookup ON loyalty_tokens(business_id, kind, code_hash);
+
+-- EMAIL CONFIRMATION CODES for joining a card (6 digits, 10 minutes, 5 tries).
+-- Rate limit by IP and by email and check a Turnstile token before sending.
+CREATE TABLE loyalty_email_codes (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  email TEXT NOT NULL,
+  code_hash TEXT NOT NULL,
+  tries INTEGER NOT NULL DEFAULT 0,
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  expires_at TEXT NOT NULL,
+  used_at TEXT
+);
+
+CREATE INDEX idx_loyalty_email_codes_lookup ON loyalty_email_codes(business_id, email, created_at);
+
 -- ============================================================
 -- TENANT ISOLATION — READ THIS
 -- ============================================================
 -- Turso/SQLite has no Row-Level Security. Every single query touching
--- review_pages, feedback, scan_events, or subscriptions MUST include
+-- review_pages, feedback, scan_events, subscriptions, or any loyalty_* table MUST include
 -- `WHERE business_id = ?` bound to the authenticated user's own business_id,
 -- resolved server-side from their verified Firebase session — NEVER from a
 -- client-supplied parameter. Missing this check anywhere is a full data leak
diff --git a/scripts/loyalty-rules-check.ts b/scripts/loyalty-rules-check.ts
new file mode 100644
index 0000000..5ba8055
--- /dev/null
+++ b/scripts/loyalty-rules-check.ts
@@ -0,0 +1,312 @@
+/**
+ * Runtime check for lib/loyalty (no test runner in this repo yet).
+ * Run:  npx tsx scripts/loyalty-rules-check.ts
+ * Exits with code 1 if any check fails.
+ */
+import {
+  availableOffers, cancelClaim, cardProgress, claimReward, claimView,
+  deleteMember, emptyLoyaltyState, ensureMember, issueCounterCode,
+  issueMemberCode, loyaltyStats, markEmailVerified, normalizeProgram,
+  redeemReward, saveOffer, setOfferActive, setProgram, stampWithCounterCode,
+  stampWithMemberCode, voidStamp, activityLog, type LoyaltyState, type Rng,
+} from "../lib/loyalty/rules";
+import { addStaff, identifyStaff } from "../lib/loyalty/pin";
+
+let passed = 0;
+let finished = false;
+let failed = 0;
+function check(name: string, condition: boolean, extra?: unknown) {
+  if (condition) passed++;
+  else { failed++; console.error("FAIL:", name, extra ?? ""); }
+}
+
+// Deterministic rng so runs are repeatable.
+let seed = 12345;
+const rng: Rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
+
+const T0 = new Date("2026-10-10T08:00:00Z");
+const at = (mins: number) => new Date(T0.getTime() + mins * 60_000);
+
+async function main() {
+  let s: LoyaltyState = emptyLoyaltyState();
+  s = setProgram(s, { stamps_required: 3, min_gap_hours: 4, daily_cap: 1, reward_valid_days: 30, stamp_mode: "both" });
+  s = setProgram(s, { daily_cap: 3 });
+
+  // --- program clamping
+  const wild = normalizeProgram({ stamps_required: 9999, min_gap_hours: -5, daily_cap: 0, reward_valid_days: 1, stamp_mode: "x" as never });
+  check("clamp stamps max", wild.stamps_required === 20);
+  check("clamp gap min", wild.min_gap_hours === 0);
+  check("clamp cap min", wild.daily_cap === 1);
+  check("clamp days min", wild.reward_valid_days === 7);
+  check("bad mode falls back", wild.stamp_mode === "both");
+
+  // --- offers: max 5 active
+  for (let i = 1; i <= 5; i++) {
+    const r = saveOffer(s, { title: `Reward ${i}`, description: "d", kind: "free_item", monthly_limit: null, active: true }, rng);
+    check(`offer ${i} saved`, r.ok);
+    if (r.ok) s = r.state;
+  }
+  const sixth = saveOffer(s, { title: "Reward 6", description: "", kind: "free_item", monthly_limit: null, active: true }, rng);
+  check("6th active offer refused", !sixth.ok && sixth.code === "limit_reached");
+  const sixthPaused = saveOffer(s, { title: "Reward 6", description: "", kind: "custom", monthly_limit: null, active: false }, rng);
+  check("6th paused offer allowed", sixthPaused.ok);
+  if (sixthPaused.ok) s = sixthPaused.state;
+  check("bad title refused", !saveOffer(s, { title: "x", description: "", kind: "free_item", monthly_limit: null, active: false }, rng).ok);
+  check("bad monthly limit refused", !saveOffer(s, { title: "Okay", description: "", kind: "free_item", monthly_limit: 0, active: false }, rng).ok);
+  check("bad kind refused", !saveOffer(s, { title: "Okay", description: "", kind: "nope" as never, monthly_limit: null, active: false }, rng).ok);
+  const paused6 = s.offers[5];
+  check("activate 6th refused", !setOfferActive(s, paused6.id, true).ok);
+
+  // --- staff + PIN
+  const st1 = await addStaff(s, { name: "Riya", pin: "1234" }, T0, rng);
+  check("staff added", st1.ok);
+  if (!st1.ok) return;
+  s = st1.state;
+  const dup = await addStaff(s, { name: "Amit", pin: "1234" }, T0, rng);
+  check("duplicate PIN refused", !dup.ok);
+  check("short PIN refused", !(await addStaff(s, { name: "Amit", pin: "12" }, T0, rng)).ok);
+  check("non-digit PIN refused", !(await addStaff(s, { name: "Amit", pin: "12ab" }, T0, rng)).ok);
+  const st2 = await addStaff(s, { name: "Amit", pin: "5678" }, T0, rng);
+  check("second staff added", st2.ok);
+  if (!st2.ok) return;
+  s = st2.state;
+  check("PIN not stored in clear", !JSON.stringify(s.staff).includes("1234") && !JSON.stringify(s.staff).includes("5678"));
+  const riya = st1.staff.id;
+
+  // --- PIN lockout
+  let lockState = s;
+  for (let i = 0; i < 4; i++) {
+    const r = await identifyStaff(lockState, "0000", at(0));
+    check(`wrong pin ${i + 1} not locked`, !r.ok && !r.locked);
+    lockState = r.state;
+  }
+  const fifth = await identifyStaff(lockState, "0000", at(0));
+  check("5th wrong PIN locks", !fifth.ok && fifth.locked);
+  const duringLock = await identifyStaff(fifth.state, "1234", at(2));
+  check("correct PIN refused while locked", !duringLock.ok && duringLock.locked);
+  const afterLock = await identifyStaff(fifth.state, "1234", at(6));
+  check("correct PIN works after lock", afterLock.ok);
+  check("success resets failures", afterLock.ok && afterLock.state.pin_lock.failures === 0);
+
+  // --- member must verify email
+  const ens = ensureMember(s, "  Aarav@Example.COM ", T0, rng);
+  s = ens.state;
+  const mem = ens.member;
+  check("email normalised", mem.email === "aarav@example.com");
+  check("same email reuses member", ensureMember(s, "aarav@example.com", T0, rng).member.id === mem.id);
+  const unverifiedCode = issueMemberCode(s, mem.id, at(0), rng);
+  check("unverified member gets no code", !unverifiedCode.ok && unverifiedCode.code === "email_not_verified");
+  const ver = markEmailVerified(s, mem.id, T0);
+  check("verify ok", ver.ok);
+  if (!ver.ok) return;
+  s = ver.state;
+
+  // --- Mode A: member code
+  const c1 = issueMemberCode(s, mem.id, at(0), rng);
+  check("member code issued", c1.ok);
+  if (!c1.ok) return;
+  s = c1.state;
+  check("code is 6 digits", /^\d{6}$/.test(c1.token.code));
+  check("wrong code rejected", !stampWithMemberCode(s, { code: "000000", staffId: riya }, at(1)).ok || c1.token.code === "000000");
+  check("no staff rejected", !stampWithMemberCode(s, { code: c1.token.code, staffId: "nobody" }, at(1)).ok);
+  const expired = stampWithMemberCode(s, { code: c1.token.code, staffId: riya }, at(2));
+  check("code expired after 60s", !expired.ok && expired.code === "invalid_code");
+  // new code
+  const c1b = issueMemberCode(s, mem.id, at(10), rng);
+  if (!c1b.ok) return;
+  s = c1b.state;
+  check("old code replaced", !stampWithMemberCode(s, { code: c1.token.code, staffId: riya }, at(10)).ok || c1.token.code === c1b.token.code);
+  const st = stampWithMemberCode(s, { code: ` ${c1b.token.code.slice(0, 3)} ${c1b.token.code.slice(3)} `, staffId: riya }, at(10));
+  check("stamp 1 given (spaces ignored)", st.ok);
+  if (!st.ok) return;
+  s = st.state;
+  check("stamp records staff", st.stamp.staff_id === riya && st.stamp.method === "member_code");
+  check("progress 1/3", cardProgress(s, mem.id).current === 1);
+  const replay = stampWithMemberCode(s, { code: c1b.token.code, staffId: riya }, at(10));
+  check("code cannot be reused", !replay.ok && replay.code === "invalid_code");
+
+  // --- cooldown (4h) + not burned
+  const c2 = issueMemberCode(s, mem.id, at(30), rng);
+  if (!c2.ok) return;
+  s = c2.state;
+  const tooSoon = stampWithMemberCode(s, { code: c2.token.code, staffId: riya }, at(30));
+  check("cooldown blocks stamp", !tooSoon.ok && tooSoon.code === "too_soon");
+  // code was not burned: valid again after 4h only if still live; issue fresh after 4h
+  const c3 = issueMemberCode(s, mem.id, at(10 + 241), rng);
+  if (!c3.ok) return;
+  s = c3.state;
+  const st2a = stampWithMemberCode(s, { code: c3.token.code, staffId: riya }, at(10 + 241));
+  check("stamp 2 after cooldown", st2a.ok);
+  if (!st2a.ok) return;
+  s = st2a.state;
+
+  // --- daily cap: set gap 0, cap 1 -> second same-day refused
+  let capState = setProgram(s, { min_gap_hours: 0, daily_cap: 2 });
+  const cc = issueMemberCode(capState, mem.id, at(10 + 245), rng);
+  if (!cc.ok) return;
+  capState = cc.state;
+  const cap = stampWithMemberCode(capState, { code: cc.token.code, staffId: riya }, at(10 + 245));
+  check("daily cap blocks", !cap.ok && cap.code === "daily_cap");
+
+  // --- Mode B: counter code
+  s = setProgram(s, { min_gap_hours: 4, daily_cap: 3 });
+  const other = ensureMember(s, "other@example.com", T0, rng);
+  s = other.state;
+  const ver2 = markEmailVerified(s, other.member.id, T0);
+  if (!ver2.ok) return;
+  s = ver2.state;
+  const counter = issueCounterCode(s, at(600), rng);
+  if (!counter.ok) return;
+  s = counter.state;
+  const b1 = stampWithCounterCode(s, { code: counter.token.code, memberId: mem.id }, at(600));
+  check("counter code stamps (member 1)", b1.ok);
+  if (!b1.ok) return;
+  s = b1.state;
+  check("counter stamp has no staff", b1.stamp.staff_id === null && b1.stamp.method === "counter_code");
+  const b2 = stampWithCounterCode(s, { code: counter.token.code, memberId: other.member.id }, at(600));
+  check("counter code single use (member 2 refused)", !b2.ok && b2.code === "invalid_code");
+  const counter2 = issueCounterCode(s, at(601), rng);
+  if (!counter2.ok) return;
+  s = counter2.state;
+  const oldCounter = stampWithCounterCode(s, { code: counter.token.code, memberId: other.member.id }, at(601));
+  check("old counter code dead after rotation", !oldCounter.ok || counter.token.code === counter2.token.code);
+  const late = stampWithCounterCode(s, { code: counter2.token.code, memberId: other.member.id }, at(603));
+  check("counter code expires", !late.ok && late.code === "invalid_code");
+  const member_code_as_counter = stampWithCounterCode(s, { code: "123456", memberId: mem.id }, at(601));
+  check("random counter code rejected", !member_code_as_counter.ok);
+
+  // --- completion, pending reward
+  const prog = cardProgress(s, mem.id);
+  check("card complete after 3 stamps", prog.total === 3 && prog.pending === 1 && prog.current === 3, prog);
+
+  // --- mode restrictions
+  const modeA = setProgram(s, { stamp_mode: "member_code" });
+  check("counter code off in member-only mode", !issueCounterCode(modeA, at(700), rng).ok);
+  const modeB = setProgram(s, { stamp_mode: "counter_code" });
+  check("member code off in counter-only mode", !issueMemberCode(modeB, mem.id, at(700), rng).ok);
+
+  // --- program paused
+  const off = setProgram(s, { enabled: false });
+  check("paused program blocks codes", !issueMemberCode(off, mem.id, at(700), rng).ok);
+  check("paused program blocks claim", !claimReward(off, { memberId: mem.id, offerId: s.offers[0].id }, at(700), rng).ok);
+
+  // --- claim
+  check("other member cannot claim (no full card)", !claimReward(s, { memberId: other.member.id, offerId: s.offers[0].id }, at(700), rng).ok);
+  check("paused offer not choosable", !claimReward(s, { memberId: mem.id, offerId: paused6.id }, at(700), rng).ok);
+  check("unknown offer not choosable", !claimReward(s, { memberId: mem.id, offerId: "nope" }, at(700), rng).ok);
+  const offer1 = s.offers[0];
+  const cl = claimReward(s, { memberId: mem.id, offerId: offer1.id }, at(700), rng);
+  check("reward claimed", cl.ok);
+  if (!cl.ok) return;
+  s = cl.state;
+  check("claim copies title", cl.claim.title === offer1.title);
+  check("claim code format", /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cl.claim.code));
+  check("card resets after claim", cardProgress(s, mem.id).pending === 0 && cardProgress(s, mem.id).current === 0);
+  check("cannot claim twice", !claimReward(s, { memberId: mem.id, offerId: offer1.id }, at(701), rng).ok);
+
+  // offer edit/delete does not change an earned reward
+  const edited = saveOffer(s, { id: offer1.id, title: "Totally different", description: "x", kind: "custom", monthly_limit: null, active: true }, rng);
+  if (edited.ok) s = edited.state;
+  check("claim keeps original title after edit", s.claims[0].title === offer1.title);
+
+  // --- redeem
+  check("redeem needs staff", !redeemReward(s, { code: cl.claim.code, staffId: "nobody" }, at(702)).ok);
+  check("wrong reward code", !redeemReward(s, { code: "AAAA-AAAA", staffId: riya }, at(702)).ok || cl.claim.code === "AAAA-AAAA");
+  const rd = redeemReward(s, { code: cl.claim.code.toLowerCase().replace("-", " "), staffId: riya }, at(702));
+  check("reward redeemed (lowercase/space ok)", rd.ok);
+  if (!rd.ok) return;
+  const afterRedeem = rd.state;
+  check("redeem records staff", rd.claim.redeemed_by === riya);
+  const twice = redeemReward(afterRedeem, { code: cl.claim.code, staffId: riya }, at(703));
+  check("redeem twice refused", !twice.ok && twice.code === "reward_used");
+
+  // --- expiry
+  const farFuture = new Date(T0.getTime() + 40 * 86_400_000);
+  const exp = redeemReward(s, { code: cl.claim.code, staffId: riya }, farFuture);
+  check("expired reward refused", !exp.ok && exp.code === "reward_expired");
+  check("claimView expired", claimView(s.claims[0], farFuture) === "expired");
+
+  // --- cancel
+  const cn = cancelClaim(s, cl.claim.id, "Mistake", at(710));
+  check("cancel unused reward", cn.ok);
+  if (cn.ok) {
+    check("cancelled reward cannot be redeemed", !redeemReward(cn.state, { code: cl.claim.code, staffId: riya }, at(711)).ok);
+    check("cancel does not restore stamps", cardProgress(cn.state, mem.id).total === 3);
+  }
+  check("cannot cancel a used reward", !cancelClaim(afterRedeem, cl.claim.id, "x", at(711)).ok);
+
+  // --- monthly limit
+  let lim = emptyLoyaltyState();
+  lim = setProgram(lim, { stamps_required: 3, min_gap_hours: 0, daily_cap: 5 });
+  const lo = saveOffer(lim, { title: "Limited", description: "", kind: "free_item", monthly_limit: 1, active: true }, rng);
+  if (!lo.ok) return;
+  lim = lo.state;
+  const ls = await addStaff(lim, { name: "Sam", pin: "4321" }, T0, rng);
+  if (!ls.ok) return;
+  lim = ls.state;
+  for (const email of ["a@x.com", "b@x.com"]) {
+    const e = ensureMember(lim, email, T0, rng); lim = e.state;
+    const v = markEmailVerified(lim, e.member.id, T0); if (!v.ok) return; lim = v.state;
+    for (let i = 0; i < 3; i++) {
+      const cdn = issueMemberCode(lim, e.member.id, at(i), rng); if (!cdn.ok) return; lim = cdn.state;
+      const g = stampWithMemberCode(lim, { code: cdn.token.code, staffId: ls.staff.id }, at(i), rng);
+      if (!g.ok) { check("limit setup stamp", false, g); return; }
+      lim = g.state;
+    }
+  }
+  const [ma, mb] = lim.members;
+  const claimA = claimReward(lim, { memberId: ma.id, offerId: lim.offers[0].id }, at(10), rng);
+  check("first claim within monthly limit", claimA.ok);
+  if (!claimA.ok) return;
+  lim = claimA.state;
+  check("offer hidden after monthly limit", availableOffers(lim, at(11)).length === 0);
+  check("second claim refused at monthly limit", !claimReward(lim, { memberId: mb.id, offerId: lim.offers[0].id }, at(11), rng).ok);
+  const nextMonth = new Date("2026-11-02T08:00:00Z");
+  check("offer returns next month", availableOffers(lim, nextMonth).length === 1);
+
+  // --- carry-over + void
+  let co = emptyLoyaltyState();
+  co = setProgram(co, { stamps_required: 3, min_gap_hours: 0, daily_cap: 5 });
+  const cs = await addStaff(co, { name: "Zed", pin: "9999" }, T0, rng); if (!cs.ok) return; co = cs.state;
+  const co1 = saveOffer(co, { title: "Cookie", description: "", kind: "free_item", monthly_limit: null, active: true }, rng); if (!co1.ok) return; co = co1.state;
+  const em = ensureMember(co, "c@x.com", T0, rng); co = em.state;
+  const vm = markEmailVerified(co, em.member.id, T0); if (!vm.ok) return; co = vm.state;
+  for (let i = 0; i < 4; i++) {
+    const cdn = issueMemberCode(co, em.member.id, at(i), rng); if (!cdn.ok) return; co = cdn.state;
+    const g = stampWithMemberCode(co, { code: cdn.token.code, staffId: cs.staff.id }, at(i), rng); if (!g.ok) { check("carry setup", false, g); return; } co = g.state;
+  }
+  check("4 stamps = 1 full card pending", cardProgress(co, em.member.id).pending === 1);
+  const cc2 = claimReward(co, { memberId: em.member.id, offerId: co.offers[0].id }, at(5), rng); if (!cc2.ok) return; co = cc2.state;
+  check("extra stamp carries over", cardProgress(co, em.member.id).current === 1, cardProgress(co, em.member.id));
+  const vs = voidStamp(co, co.stamps[3].id, "Test", at(6));
+  check("void works", vs.ok);
+  if (vs.ok) {
+    check("void lowers balance", cardProgress(vs.state, em.member.id).current === 0);
+    check("voided stamp stays in ledger", vs.state.stamps.length === 4 && vs.state.stamps[3].voided_at !== null);
+    check("void twice refused", !voidStamp(vs.state, co.stamps[3].id, "again", at(7)).ok);
+    check("activity shows voided", activityLog(vs.state, at(8)).some((a) => a.kind === "stamp_voided"));
+  }
+  check("void unknown stamp refused", !voidStamp(co, "nope", "x", at(6)).ok);
+
+  // --- delete member keeps ledger, drops email and codes
+  const del = deleteMember(co, em.member.id, at(9));
+  check("delete removes email", del.members[0].email === null && del.members[0].deleted_at !== null);
+  check("delete keeps ledger", del.stamps.length === co.stamps.length);
+  check("deleted member cannot get a code", !issueMemberCode(del, em.member.id, at(10), rng).ok);
+
+  // --- stats
+  const stats = loyaltyStats(s, at(720));
+  check("stats members counted", stats.members === 2);
+  check("stats stamps counted", stats.stampsTotal === 3);
+  check("stats rewards chosen", stats.rewardsChosen === 1);
+  check("stats per staff", stats.perStaff.some((p) => p.name === "Riya" && p.stamps >= 1));
+  finished = true;
+
+}
+
+function report() {
+  if (!finished) { failed++; console.error("FAIL: script stopped early (a setup step failed)"); }
+  console.log(`${passed} passed, ${failed} failed`);
+  process.exit(failed ? 1 : 0);
+}
+main().then(report, (error) => { console.error(error); process.exit(1); });
<<<<PATCH_END>>>>

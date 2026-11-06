# Build Progress Tracker

Last updated: 2026-11-06
Build environment: Freebuff (DeepSeek V4.1 Flash). Sessions: owner 48h, admin 24h + 30 min idle.

## Rules for the AI coding agent
- Read this file fully before starting any work, every session.
- Work on ONE task at a time, in the order listed.
- After completing a task: mark it `[x]`, add a one-line note of what was
  actually built (and any deviation from the plan), and update "Last updated"
  above with the date.
- Never mark a task `[x]` until it actually runs/builds without errors.
- If a task is blocked (e.g. missing API key), mark it `[BLOCKED: reason]` and
  move to the next unblocked task — do not skip silently.
- Do not start a new Phase until all tasks in the current Phase are `[x]` or
  explicitly `[BLOCKED]`.
- Reference cashfree-approval.md (Cashfree activation), google-approval.md (Google OAuth and API access), PRD.md, schema.sql, provider-reference.md, business-rules.md,
  brand-guide.md, email-templates.md, and security-and-reliability.md for
  details — do not re-invent behavior described there. security-and-reliability.md
  is binding: follow its MUST / MUST NOT rules literally.
- **Resume protocol (work may span many days because of daily usage limits):**
  at the start of every session read this file and the last Session Log entry,
  then continue from the first unchecked task. Each phase is self-contained, so
  stop cleanly at any task boundary and log where you stopped.
- **Each phase has a "Done when" line.** Do not tick the phase until that
  is true, and run the listed acceptance tests from security-and-reliability.md.
- **Never ask the owner to paste real secrets into this chat.** Secrets live only
  in the local `.env.local` and the Vercel dashboard. The model provider may
  collect prompts for training.
- Do not add new third-party services or packages beyond those in PRD.md,
  provider-reference.md and security-and-reliability.md without noting it in the
  Session Log.
- **Git workflow (from Stage 2 onward):** never commit directly to `main`.
  Create `feat/stage-<id>-<short-name>` from the latest `main` (for example
  `feat/stage-2-database`), commit after every task and push that branch, then
  open a pull request into `main`. CI (`.github/workflows/ci.yml` — `npm ci`,
  `npm run typecheck`, `npm run build`) must be green before the PR is merged.
  Stage 1 was built by pushing task commits straight to `main`; that stops with
  Stage 2. GitHub branch protection and rulesets are not available on this
  private repo's Free plan, so CI status + this rule are the gate (there is no
  server-side enforcement).

---

## Run Checkpoint
- Task: Obsolete screens, data and documentation removed — done
- Branch: main
- Last verified: typecheck clean; category 112, menu-import 283, loyalty 97; schema 24 tables / 1 trigger; production build clean
- Next step: Stage 2 (Database) for the remaining review and loyalty surfaces.

---

## Layered Build Tracker
Build order is layered, NOT the Phase order below. Frontier order:
1) frontend with mock data, 2) database, 3) backend core, 4) connect,
5) integrations, 6) billing, 7) automation, 8) admin/legal/security.

- **Stage 1: Frontend with mock data** (current)
  - **1A** setup / brand tokens / landing page
  - 1B public + legal + system pages
  - 1C auth + onboarding UI
  - 1D customer review page
  - 1E dashboard shell + Dashboard + Feedback + Analytics
  - 1F Locations + Customer page editor + Billing + Settings
  - 1G Loyalty program (stamp card + rewards), owner-requested addition
  - 1I Menu PDF import (owner-requested addition to the Customer page editor)
- Stage 2: Database
- Stage 3: Backend core
- Stage 4: Connect (wire frontend to backend)
- Stage 5: Integrations
- Stage 6: Billing
- Stage 7: Automation
- Stage 8: Admin / legal / security

### 1A checklist (Stage 1, step 1A) — FRONTEND ONLY, mock data, no backend
- [x] T1. Next.js + TypeScript + Tailwind project with folders `app/`,
      `components/`, `lib/mock/`, `lib/brand/`; logo SVGs copied into
      `public/brand/`.
      Note: built manually with npm per the loop prompt (Next 15.5.27, React
      19.3.0, TS 5.9.3, Tailwind 3.4.19). `tsc -b --noEmit` and `next build`
      both pass; dev server verified with `freebuff-preview start` instead of
      running `npm run dev` by hand. No ESLint added (not required by 1A).
- [x] T2. Brand tokens (colors, fonts, spacing from brand-guide.md) in the
      Tailwind config and `lib/brand/`; temporary page shows every token.
      Note: tokens in `lib/brand/tokens.ts` (product palette, 6 business-type
      presets, text colours, font stacks, PRD 5.2 spacing scale, radii, soft
      shadow) mirrored as Tailwind theme extension in `tailwind.config.ts`.
      Temporary token page is `/kit` (not `/_kit`: the App Router treats
      `_`-prefixed folders as private and never routes them).
- [x] T3. Reusable components: Logo, Button (primary/secondary/disabled), Card,
      Input, Section, Navbar, Footer; all shown on a temporary `/_kit` page
      (deleted when done).
      Note: added `components/{logo,button,card,input,section,navbar,footer}.tsx`.
      Verified on the temporary page (built at `/kit`, since `_kit` cannot route)
      and the page was deleted afterwards; `tsc -b --noEmit` and `next build`
      pass with it gone. Navbar/Footer take content via props so T5 can feed them
      from `lib/mock/site.ts`.
      Deviation: running `next build` while the managed dev server is live
      corrupts the shared `.next` folder; after each build the preview needs
      `freebuff-preview restart`.
- [x] T4. Mock data `lib/mock/plans.ts` (Free, Starter, Pro, Enterprise — matches
      the schema.sql `plans` seed and PRD.md section 4) and `lib/mock/site.ts`
      (product name, support email placeholder, contact placeholders).
      Note: `plans.ts` keeps the schema field names (`price_inr_paise`,
      `locations`, `monthly_scans`, `self_serve`, `google_auto_reply`, `page`)
      and adds only a display `name` + formatting helpers (`planPriceLabel`,
      `limitLabel`). `site.ts` holds placeholder product/contact values flagged
      against the open decisions. Grepped: no plan value appears outside
      `lib/mock/`.
- [x] T5. Landing page at `/` per PRD.md 5.6 (see the task text in the session
      prompt): logo/name, description, how it works, pricing from
      `lib/mock/plans.ts`, "How we use your Google data" block, support email,
      footer links to /privacy and /terms.
      Note: built with the shared Navbar/Footer/Section/Card components; pricing
      cards read every price/limit from `lib/mock/plans.ts` (INR only — the
      schema stores no USD price). Google-data wording mirrors google-approval.md
      section 8. Verified `next build` + `tsc -b --noEmit`, the page renders at
      `/` (all PRD 5.6 content present), and the compiled CSS is mobile-first
      with 640/768/1024 breakpoints and no fixed-width overflow (checked 375px
      layout math: single column below `sm`, 2-up at `sm`, 4-up at `lg`).
      Decisions: sign-in/sign-up CTAs point at `/sign-in` and `/sign-up`
      (placeholder routes, built in 1C); pricing shows INR only.

### 1B checklist (Stage 1, step 1B) — FRONTEND ONLY, mock data, no backend
- [x] T1. Shared legal page layout (readable width, title, "last updated",
      table of contents for long pages) and `/privacy` from privacy-policy.md,
      with the "How we use your Google data" wording from google-approval.md
      section 8.
      Note: added `components/legal-page.tsx` (LegalPage + LegalSection: shared
      Navbar/Footer shell, a max-w-3xl readable article, title, "Last updated",
      the required "Draft for development. Not yet reviewed by a lawyer."
      notice, and a table of contents shown for 4+ sections).
      `app/privacy/page.tsx` copies all 13 sections of privacy-policy.md,
      keeping every [BRACKET] placeholder, and pastes the google-approval.md
      section 8 "Google user data" paragraph plus the doc's "In short:"
      paragraph into section 4. Also extended `lib/mock/site.ts` with the legal
      and contact [BRACKET] placeholders, the public nav/footer link sets and
      the draft-notice string, and widened `components/footer.tsx` to show the
      registered business name, support email and phone plus all 8 required
      policy links (defaults come from site.ts, so `<Footer />` is enough); the
      landing page now uses that shared footer. `Navbar`'s `links` prop now
      accepts a readonly array. Verified `next build` + `tsc -b --noEmit` pass,
      `/privacy` and `/` return 200, every required string is present, and the
      compiled CSS is mobile-first (640/768/1024/1280 breakpoints) with no
      fixed-width overflow at 375px (the provider table sits in an
      overflow-x-auto wrapper).
      Decisions: legal pages show "Last updated: [DATE]" because the docs never
      supply a real date; the privacy doc's top-of-file publishing instruction is
      not rendered (the mandated draft-notice line replaces it); headings keep
      the doc's own numbering.
- [x] T2. `/terms` and `/payment-policy` from legal-pages.md.
      Note: `app/terms/page.tsx` carries all 8 items of the legal-pages.md Terms
      draft and `app/payment-policy/page.tsx` all 6 items of the Payment Policy
      draft, both verbatim (every [BRACKET] placeholder kept, e.g. the Governing
      Law item) on the shared LegalPage shell with a table of contents and the
      draft notice. Verified `next build` + `tsc -b --noEmit` pass, both routes
      return 200, and every heading and sentence from the two drafts is present
      (grep-checked) — nothing skipped.
- [x] T3. `/cancellation-policy` and `/refund-policy` from legal-pages.md; the
      refund page includes "Syehere is a digital service; no physical
      delivery."
      Note: `app/cancellation-policy/page.tsx` carries all 6 items of the
      Cancellation Policy draft (the `{RETENTION_DAYS_AFTER_CANCEL}` template
      value is kept visible). `app/refund-policy/page.tsx` combines the refund
      rules verbatim from the Payment Policy (non-refundable once a cycle has
      begun; downgrades get no partial refund) and the Cancellation Policy (no
      partial-month or pro-rated mid-cycle refunds; refunds are not automatic)
      and includes the required line "Syehere is a digital service; no physical
      delivery." Verified `next build` + `tsc -b --noEmit` pass, both routes
      return 200, all six cancellation headings plus the TOC anchors render, and
      every combined refund sentence is present (grep-checked).
      Deviation/decision: legal-pages.md words the delivery line as "there is no
      physical delivery"; the 1B task text specifies "no physical delivery", so
      the task wording is used. No new legal claims were written (an early draft
      sentence explaining digital delivery was removed for that reason).
- [x] T4. `/about`, `/contact` and `/pricing` per cashfree-approval.md
      section 1 and PRD.md 5.6.
      Note: `/about` describes the product and shows the registered business
      name/address; `/contact` shows exactly one support email and one phone
      number (both [BRACKET] placeholders) plus the registered address; `/pricing`
      renders every plan from `lib/mock/plans.ts` with INR price, locations,
      monthly scans, auto-reply availability and billing cycle. Verified
      `next build` + `tsc -b --noEmit` pass, all three routes return 200, the
      rendered values match PRD.md section 4 (Free 1 location / 10 scans / ₹0,
      Starter 1 / 1,000 / ₹499, Pro 1 / 10,000 / ₹699, Enterprise Unlimited / —),
      the Starter card shows auto-reply "No" plus an explicit "not included on
      Starter" line, and the page carries the monthly-in-advance billing cycle
      and the GST/VAT/sales-tax note from legal-pages.md. Each page has exactly
      one h1.
      Decision: plans.ts marks Free and Enterprise `self_serve: false`, so their
      CTA label is "Contact us" (Enterprise's price label is also "Contact us",
      with no number) while Free keeps its PRD.md §4 price of ₹0 and still links
      to free sign-up from the card's small print. That satisfies both
      cashfree-approval.md §1 ("Free and Enterprise 'Contact us'") and PRD.md §4/5.6
      (Free listed with a ₹0 INR price).
- [x] T5. System pages `app/not-found.tsx`, `app/error.tsx`,
      `app/global-error.tsx` per security-and-reliability.md 5A item 7, and
      every footer link resolves to a real page.
      Note: all three are branded and friendly, reuse the shared Navbar/Footer
      (global-error renders its own html/body with inline styles because it
      replaces the root layout), show only Next's short `error.digest` as a
      reference id, and never touch `error.message`/`error.stack` or log to the
      browser console. Verified on a fresh production build with the managed
      preview switched to `npm run start` (dev mode would show Next's dev
      overlay instead): a nonexistent route returns 404 with the branded page and
      no internals; a temporary throwing page returned 500 whose body contains no
      error text, no stack, no file paths and no provider names while the loaded
      `global-error` chunk carries only the friendly copy (the temp page was
      deleted afterwards and the build re-run clean). All 8 required footer links
      return 200 on every public page, and each page's footer shows the
      registered business name, support email and phone. `poweredByHeader: false`
      added to next.config.ts because 5A item 8 requires it and `curl -I` was
      still returning `X-Powered-By: Next.js`; the rest of the Phase 1
      security-header/CSP work is untouched.
      Deviation: `next build` collides with a live managed dev server (corrupt
      `.next`, or a hung build), so builds were run with `freebuff-preview stop`
      first, then the preview was restored to `npm run dev`.

### 1C checklist (Stage 1, step 1C) — FRONTEND ONLY, mock data, no backend
- [x] T1. Auth layout + `/login`. Focused layout (logo, card, link back to home).
      Login form: email, password, show/hide password, "Sign in", "Continue with
      Google" (mock), "Forgot password?" link, link to `/signup`. States: idle,
      submitting (disabled + spinner), wrong credentials ("Incorrect email or
      password."), too many attempts, generic failure.
      Note: added the `(auth)` route group shell `app/(auth)/layout.tsx` (brand
      hairline, logo linking home, centered max-w-[420px] column, "Back to
      home") plus `/login`. New shared pieces: `lib/mock/auth.ts` (MOCK ONLY,
      marked "remove in Stage 3"), `lib/validation.ts` (limits straight from
      security-and-reliability.md 4A and section 1),
      `components/{spinner,form-message,password-input,google-button}.tsx`. The
      navbar/landing "Sign in" link now points at `/login`. Verified `next build`
      passes and `/login` returns 200 with the idle form, the password show/hide
      toggle, the mock Google button, the forgot-password link and the signup
      link present. Decision: a non-credential network/server failure shows the
      short generic message while every credential failure uses the single
      "Incorrect email or password." string (5A item 5); too-many-attempts uses
      the friendly retry message.
- [x] T2. `/signup` and `/forgot-password`. Signup: email, password (8+ chars with
      a hint), "Create account", "Continue with Google" (mock), terms/privacy
      line, link to `/login`; on success go to `/verify-email`. Forgot password:
      email + button, always the same generic message.
      Note: added `components/auth-card.tsx` (shared card; `/login` refactored
      onto it) plus `/signup` (email + password with the "At least 8
      characters." hint, "Create account", mock Google button, the Terms/Privacy
      line linking `/terms` and `/privacy`, link to `/login`) and
      `/forgot-password` (email + button, always the one sentence "If that email
      is registered, a reset link has been sent." for any well-formed email).
      Signup success routes to `/verify-email?email=…`; the Google mock routes
      to `/onboarding`. Landing and navbar sign-up CTAs now point at `/signup`.
      Verified `next build` passes, both routes return 200, the signup page
      carries the 8-character hint and both policy links, and the generic reset
      sentence is present in the built bundle. Decision: no confirm-password
      field (not in the docs); email capped at the documented 254 characters.
- [x] T3. `/verify-email` screen. "Check your inbox", the email address, Resend
      button with a visible cooldown timer and a generic confirmation, an "I've
      verified my email" button (mock) continuing to `/onboarding`, and a link to
      change email.
      Note: `app/(auth)/verify-email/page.tsx` reads `?email=` on the server and
      hands it to `verify-email-form.tsx`, so the address is in the first paint
      (the route is dynamic on purpose — no `useSearchParams`, no loading
      fallback). Resend locks for 30s with a visible "Resend in Ns" label and
      shows the generic sentence for any address; "I've verified my email"
      continues to `/onboarding` on the mock success and shows the "not seen
      yet" message for `unverified@example.com`; "Use a different email" links
      to `/signup`. Verified `next build` passes and
      `/verify-email?email=owner@example.com` returns 200 with the heading, the
      address, both buttons and the change-email link present in the SSR HTML.
- [x] T4. `/onboarding` wizard shell + Step 1 and Step 2. 3 steps with a progress
      indicator, Back/Next, unsaved progress in React state only. Step 1: business
      name, business type (dropdown), tagline with documented limits + inline
      validation. Step 2: logo choice — "Upload logo" (PNG/JPEG/WebP only, no SVG,
      1 MB max, client-side check, mock only, nothing uploaded) or "Use a default
      logo" with the brand-guide.md preset theme for the chosen type, plus a live
      preview card. Mock saves into the `lib/mock/business.ts` shape.
      Note: `app/onboarding/page.tsx` holds the whole wizard (client state only,
      nothing persisted) with a numbered progress `<ol>` (`aria-current="step"`),
      Back/Next and a "Step X of 3" counter. Step 1 uses limits from
      security-and-reliability.md 4A (name 100, tagline 120) and requires an
      explicit business type. Step 2 offers the default logo (brand-guide.md
      preset, drawn by the new `components/business-logo.tsx` inline icons) or an
      upload with client-side PNG/JPEG/WebP + 1 MB checks (SVG rejected by type
      and extension), a local object-URL preview and a "nothing is uploaded"
      note, plus a live preview card that uses the preset colors. New shared
      pieces: `lib/mock/business.ts` (MOCK ONLY, `BusinessDraft` field names
      match `schema.sql` `businesses`, `draftFromInput` fills preset colors,
      `mockSaveBusiness` returns slug `demo123`), `components/select.tsx`, and
      `businessTypeLabels` in `lib/brand/tokens.ts`. Verified `next build` passes,
      `/onboarding` returns 200 with step 1 and all six type options, and the
      compiled chunk carries the step-2 options, the SVG/1 MB messages and the
      preset hex values. Step 3 is a clearly marked placeholder until T5.
      Decision: the type dropdown starts empty ("Select a business type") so the
      choice is explicit; the preview falls back to the "other" preset until one
      is picked. The `mockSaveBusiness` call lands in T5 with the completion
      screen; T4 keeps the draft in the same shape in React state.
- [x] T5. Onboarding Step 3 + completion. Step 3: Google review URL with
      client-side validation (https only + the security-and-reliability.md section 4
      Google host allowlist) and a clear invalid-URL message. Completion screen:
      QR placeholder box ("QR code: built in a later stage"), a sample short review
      link from a mock slug (e.g. `/r/demo123`), and "Go to dashboard" → `/dashboard`.
      Note: Step 3 uses `validateGoogleReviewUrl` from `lib/validation.ts` — https
      only and only the allowlisted hosts, with separate messages for "The link
      must start with https://" and "That is not a Google review link.". Finishing
      validates, builds the draft with `draftFromInput` (preset colors), calls
      `mockSaveBusiness` (with a Saving… state) and shows the completion screen: a
      dashed QR placeholder labelled "QR code: built in a later stage", the sample
      short link `/r/demo123` from the mock slug, and a "Go to dashboard" button
      linking to `/dashboard` (that page arrives in 1E; the link is enough now).
      The UI comment above `CompletionScreen` records that the real QR must encode
      only the short link/slug, never the raw Google URL (PRD.md 3.1,
      business-rules.md section 9). Verified `next build` passes with `/onboarding`
      in the route list and the completion/validation strings present in the built
      chunk; `/`, `/login`, `/signup`, `/forgot-password`, `/verify-email?email=…`
      and `/onboarding` all return 200. Deviation: the managed dev server
      auto-restarts and holds `.next`, so this build used a temporary env-driven
      `distDir` (`.next-build`) that was reverted immediately afterwards, leaving
      `next.config.ts` and `tsconfig.json` unchanged. Decision: the completion
      screen shows the path `/r/<slug>` (not a full URL) because the production
      domain is still an open item.

### 1D checklist (Stage 1, step 1D) — FRONTEND ONLY, mock data, no backend
- [x] T1. Theme helper + mock data for the customer page.
      Note: added `lib/brand/theme.ts` (`getBrandTheme(business)` returns
      primary, secondary, pageBackground, starColor, onPrimary; preset
      backgrounds from `businessPresets`, custom = secondary at 15% over white,
      starColor falls back to primary under 1.5:1 contrast, onPrimary = white or
      #1F2937 whichever contrasts better) and exported it from
      `lib/brand/index.ts`. `lib/mock/customer-page.ts` (MOCK ONLY) holds the
      four slug scenarios (`cafe01`, `full01`, `salon1`, `pause1` — renamed to
      satisfy the confirmed `^[a-z0-9]{6}$` slug format; `lib/mock/business.ts`
      `MOCK_REVIEW_SLUG` is now `cafe01`)
      with the schema.sql / PRD 5.5.13 field names, and `lib/mock/review.ts`
      (MOCK ONLY) holds `generateReviewText` (normal / slow / ai_fail), the
      section 8 fallback templates and `submitFeedback` (success / rate_limited
      / generic + honeypot). Verified `tsc -b --noEmit` and `next build` pass,
      and printed a theme table with a throwaway script (not committed): all six
      preset page backgrounds match brand-guide.md, Café stars resolve to the
      deep green primary, and custom = secondary over white. Deviation: the mock
      businesses carry a `time_zone` field; schema.sql now has the matching
      `businesses.time_zone` column (PRD.md 5.4.1 / 5.5.7).
- [x] T2. `/r/[slug]` default page + neutral "temporarily unavailable" page +
      branded not-found. Validate the slug against the exact format before
      lookup (security-and-reliability.md 4B item 8).
      Note: added `lib/customer-page.ts` (slug pattern `^[a-z0-9]{6}$`, link /
      phone / maps / social validation, button-visibility predicates, time-zone
      helpers), `components/customer-page/{icons,social-row,customer-page}.tsx`,
      `app/r/[slug]/page.tsx` (validates the slug, then `notFound()` for unknown
      slugs; `is_active = 0` -> neutral unavailable page with no error or
      reason) and `app/r/[slug]/not-found.tsx` (friendly, no internals). Default
      page = logo, name, tagline, the review block, and the on-and-valid social
      row, themed by `getBrandTheme`. Decision: `robots: noindex, nofollow` on
      the route (owner content on our domain, no SEO value) — the open question
      from the loop prompt is now resolved. Verified `tsc -b --noEmit` +
      `next build` pass; on the running preview `/r/cafe01` returns 200 with the
      default page (café primary `#213D36`, background `#EDF4EE`, tagline and
      both social links), `/r/pause1` returns 200 with only the neutral message,
      and `/r/unknown1` and malformed `/r/BAD` both return 404 with the branded
      not-found page. Switched mock slugs to `cafe01`/`full01`/`salon1`/`pause1`
      to satisfy the format.
- [x] T3. Happy path: review screen (skeleton, generated text), Copy with
      "Copied" announcement + clipboard fallback, "Post to Google" via the
      validated URL, fallback template on AI failure, CSS-only confetti.
      Note: added `components/customer-page/review-screen.tsx` (mounts, shows a
      ~1 s skeleton, then the generated text in a card with a brief CSS-only
      green confetti burst; "Copy review" -> "Copied" with a `role="status"`
      announcement and a select-the-text + `execCommand` fallback when the
      Clipboard API is unavailable; "Post to Google" opens the validated URL in
      a new tab with `rel="noopener noreferrer nofollow"`; when the URL is
      invalid the button is replaced by a friendly fallback; AI failure uses the
      section-8 template with no error; a marked Turnstile placeholder sits
      above generation). Added the confetti CSS to `app/globals.css`
      (`prefers-reduced-motion` disables it). Added a documented MOCK-ONLY
      `?screen=` deep-link (remove in Stage 4) so each screen can be previewed.
      Verified `tsc -b --noEmit` + `next build` pass; `?screen=review` SSRs the
      skeleton, heading and Turnstile placeholder; the loaded-state strings ship
      in the client bundle; and a throwaway script confirmed
      `generateReviewText` returns generated text for `normal` (~0.8 s) and
      `slow` (~2.5 s) and the fallback template for `ai_fail`.
      Limitation: the click-driven Copy/Post interaction itself was not driven
      headlessly (no browser automation available).
- [x] T4. Unhappy path: Contact owner (prominent) vs Continue to Google anyway
      (quiet), private feedback form (message 1..1000 + live counter, optional
      email, honeypot, Turnstile placeholder, idle/submitting/success/
      rate-limited/generic states) and the thank-you page.
      Note: added `components/customer-page/{back-button,confetti,feedback-screen,
      thanks-screen}.tsx` (extracted the shared back arrow + confetti) and wired
      them into the shell. Unhappy options = prominent neutral "Contact owner"
      (no red/alarm) + quiet "Continue to Google anyway" that only appears when
      the URL is valid; feedback form = message (1..1000 with a live counter),
      optional email (max 254, format check), hidden non-focusable honeypot,
      marked Turnstile placeholder and idle/submitting/success/rate-limited/
      generic states with friendly, number-free messages; thank-you shows the
      owner's message (max 160, else a default), the on-and-valid social row and
      a happy-path confetti. Moved the feedback validation into
      `validateFeedback()` in `lib/customer-page.ts` so it is testable and used
      once. Verified `tsc -b --noEmit` + `next build` pass; `?screen=unhappy`,
      `?screen=feedback` and `?screen=thanks` return 200 with the expected
      elements; `?screen=unhappy&mock=invalid_url` hides the Google link; and a
      throwaway script passed 37 checks (slug format, feedback empty/1000/1001/
      bad email, `<script>` accepted as text, URL/phone/maps/social validation,
      announcement expiry and open-now in the business time zone).
      Deviation: feedback over 1000 chars is rejected with the documented
      message instead of being silently truncated by a `maxlength` attribute, so
      the 1001-char case is reachable and testable.
- [x] T5. Customized page: announcement (hidden after end date), review block
      first, render-time button grid re-flow (0/1/2/3/4/5), per-button + per-type
      auto icons, custom links (https only, hard cap 20), Menu screen, Hours and
      contact screen, direct Call / WhatsApp / Directions links.
      Note: added `shownButtons`/`shownCustomLinks`/`menuTitle`/`isStretchedTile`
      to `lib/customer-page.ts` and `components/customer-page/{button-grid,
      menu-screen,hours-screen}.tsx`; wired the grid onto the home screen, the
      Menu and Hours screens, and the custom links onto the thank-you page. An
      item is shown only when on AND valid (full01 proves an off item "Gift
      cards" and an on-but-invalid http item "Legacy menu" are hidden); the grid
      is 2 columns with the odd last tile stretched (re-flow confirmed at 0, 1,
      2, 3, 4, 5 by temporarily editing the mock then reverting, plus 7 on
      full01); the announcement is hidden after its end date in the business
      time zone (confirmed by temporarily expiring it then reverting); the Menu
      button appears only with at least one named item; Call/WhatsApp/Directions
      use server-built `tel:`, `wa.me` and Maps links; custom links are https
      only, hard cap 20 (security 4C). Wi-Fi is NOT built (Phase 4B-D) and stays
      out of the mock. Verified `tsc -b --noEmit` + `next build` pass; cafe01,
      full01, salon1, pause1 return 200 and unknown/malformed slugs 404; all six
      screens return 200; and a throwaway script passed 17 checks (full01 = 7
      shown in order, salon1 = 3, invalid/unnamed items hidden, built link
      schemes, stretch logic).

### 1E checklist (Stage 1, step 1E) — FRONTEND ONLY, mock data, no backend
- [x] T1. Mock data, metric functions and the dashboard shell: `lib/mock/dashboard.ts`
      (60–90 days of `scan_events` + about 40 `feedback` rows for the mock café,
      six `?demo=` scenarios — normal / empty / loading / error / limit / long-name —
      MOCK ONLY, one dev-only switch), pure metric functions in
      `lib/dashboard/metrics.ts`, and the shell `app/(dashboard)/layout.tsx`
      (240px sidebar / 64px icon rail / off-canvas drawer, 64px sticky top bar,
      Menu + General nav groups, skip link, Escape-to-close, 1F stubs).
      Note: built `lib/mock/dashboard.ts` (deterministic 84-day `scan_events` +
      40 `feedback` rows, including a `<script>alert(1)</script>` row and a
      1000-char row; schema field names; a fixed `MOCK_NOW` so every derived
      number is stable), `lib/mock/demo.ts` (the ONE `?demo=` switch:
      normal/empty/loading/error/limit/long-name), `lib/dashboard/metrics.ts`
      (pure totals, week windows/deltas, 7-day buckets + busiest day, positive
      rate, streak, review-of-the-week, date/percent/time-ago formatting), and
      the shell (`app/(dashboard)/layout.tsx` + `components/dashboard/
      {shell,nav,icons,coming-in-1f}.tsx`): 240px sidebar / 64px icon rail /
      off-canvas drawer with Escape + focus return, 64px sticky top bar with
      search box + bell (40x40) + truncating business name, skip-to-content
      link, scan-limit banner, one upgrade card, and 1F stubs for Locations,
      Customer page, Billing and Settings. DECISION (owner): "avg rating" is
      dropped for v1 (no defined source, no rating column). Deviation: the mock
      café uses the Starter plan (scans used ~900/1,000; `?demo=limit` sets it to
      the limit) and "Add location" is always disabled because every mock plan
      allows 1 location. Verified `tsc -b --noEmit` + `next build` pass and the
      shell SSR for normal/limit/long-name plus a 1F stub.
- [x] T2. `/dashboard` main content (normal scenario): header block (title,
      subtitle, Add location, Export), 4 stat cards with week-over-week deltas,
      7-day scan bar chart + positive-rate gauge (about 60/40, stacked on mobile),
      recent feedback list (max 5) and plan status widget; accessible chart/gauge.
      Note: added `components/dashboard/{dashboard-content,stat-card,bar-chart,
      gauge,plan-widget,feedback-list,status-pill,avatar}.tsx` and wired the
      `/dashboard` page to `DashboardContent`. Header = title/subtitle + disabled
      Export (`title="Coming later"`) + disabled Add location (`title` plus a
      visible line "Extra locations are available on the Enterprise plan" with a
      Contact us link). 3 stat cards (Total scans / Reviews collected / Pending
      feedback) each with a week-over-week delta; 7-day bar chart (busiest day
      full business colour, others 30%, 160px, 24px max bars, 4px top corners)
      with an sr-only summary + data table; 80–96px positive-rate ring gauge
      (9px stroke); recent feedback (max 5, avatar + one-line truncation +
      fixed-width pill + View all → /feedback); plan widget (plan name, scans
      bar, locations, reset date). Every number comes from
      `lib/dashboard/metrics.ts`. Spot-checked on the live preview: gauge 51% =
      round(19/37×100), plan bar 96% = round(955/1,000×100), busiest day =
      Saturday 47 (max of the 7-day table). Deviation: 3 stat cards instead of 4
      because the owner dropped avg rating; Add location is always disabled
      (every mock plan allows 1 location).
- [x] T3. Dashboard states and engagement extras: empty / loading / error /
      overflow states, the scan-limit banner on EVERY dashboard screen, the streak
      banner and the "review of the week" callout.
      Note: added `components/dashboard/{skeletons,section-error,empty-state,
      streak-banner,review-of-the-week}.tsx` and the loading/empty/error branches
      in `dashboard-content.tsx`. Loading = skeletons matching each card's
      dimensions (same min-height/padding) with the real header kept, zero
      layout shift. Empty = stat deltas read "No data yet", chart+gauge replaced
      by a share-QR placeholder and no 0% ring drawn. Error = one inline Retry
      per card/section (5 total) with friendly wording + no technical detail;
      Retry sets local state and re-renders the normal mock (verified: 5 Retry
      buttons, no leak strings in the rendered UI). Overflow = top-bar name and
      feedback rows truncate with ellipsis. The scan-limit banner lives in the
      shell, so it shows on /dashboard, /feedback, /analytics and the 1F stubs
      in `?demo=limit` (verified). Extras (normal only): the streak banner
      ("N-day streak with no negative reviews", pure function) and the
      review-of-the-week callout with `navigator.share` / clipboard fallback +
      a "Copied" `role=status`; both hidden when there is no data. Deviation:
      mock negatives are kept ≥5 days old so the streak reads as a real stretch.
      Verified all six scenarios + the banner over HTTP.
- [x] T4. `/feedback` page: filter chips (All / Positive / Needs reply), top-bar
      search, newest first, pagination, avatar rows, plain-text detail with a
      mailto, "Mark as replied" (mock state only), empty / no-results / loading /
      error states; `<script>` and 1000-char messages render as text.
      Note: added `components/dashboard/feedback-content.tsx` and wired
      `/feedback`; extended `status-pill.tsx` with a neutral "Negative" pill for
      replied negatives (the docs define no "Replied" status, so a replied
      negative shows plain Negative — logged as an open question). Filter chips
      (aria-pressed), top-bar search filters by message text, newest first, page
      size 10 (constant `FEEDBACK_PAGE_SIZE`, docs silent — logged),
      Previous/Next with "Page X of Y". Rows = avatar initial, `customer_email`
      or "Anonymous customer" (schema has no name column), one-line preview,
      time ago, status pill; expanding a row shows the full message as plain
      text, the email as a `mailto:` link, and Mark as replied (flips
      `owner_replied` in local mock state only). Empty, no-results (Clear
      filters), loading skeleton and inline Retry error included. Verified over
      HTTP: "Page 1 of 4", 10 rows; NO raw `<script>alert(1)</script>` in the
      HTML (only the escaped `&lt;script&gt;` form) and the 1000-char message
      renders intact; empty/loading/error states present.
- [x] T5. `/analytics` page + end-to-end pass: rating average, % positive, scan
      count and feedback intercepted as cards with deltas, the 7-day chart with the
      qr/nfc/link source split and the positive-rate gauge (reuse T2), empty /
      loading / error states; then the full click-through and the Phase 4 tracker
      annotations "(UI done with mock data, backend pending)".
      Note: added `components/dashboard/analytics-content.tsx` and wired
      `/analytics`, plus metrics `scanSourceCounts`, `positiveRateWeekOverWeek`,
      `interceptedWeekOverWeek`, `formatPointsDelta` and an optional precomputed
      `delta` prop on StatCard. Cards = Scan count (total + WoW delta), Feedback
      intercepted (sentiment = negative + WoW delta; "intercepted" meaning
      derived from sentiment since the docs do not define it — logged), %
      positive (rate + points delta). Reused the T2 BarChart (7-day) with a
      qr/nfc/link source split (segmented bar + labelled legend) and the Gauge;
      empty/loading/error states mirror T3. Verified: dashboard AND analytics
      both show 54% (20 of 37), scan count 2,565, busiest day Saturday 47;
      /analytics empty shows 3× "No data yet" + the share-QR placeholder;
      loading/error present. End-to-end: every dashboard route returns 200 in
      normal and limit, the limit banner persists on every screen, and "View
      all" links to /feedback. Phase 4 items built here annotated "(UI done with
      mock data, backend pending)" (not ticked).

### 1F checklist (Stage 1, step 1F) — FRONTEND ONLY, mock data, no backend
Reconcile note (2026-10-02): cold start found the repo clean at the end of 1E,
with no 1F code, no 1F commit and no 1F branch on origin; the previous run's
reported T1/T2 work was never pushed and is not recoverable. T1 REDO, T2 REDO,
T3–T7 not started. This checklist was added by the 1F run on 2026-10-02.
- [x] T1. /locations: locations list (name, short link, scans used where it makes
      sense, status); "Add location" enabled only while locations used < the plan
      limit, otherwise disabled with "Extra locations are available on the
      Enterprise plan" + Contact us (/contact); Add location form (name + Google
      review link validated with validateGoogleReviewUrl) creating a NEW mock slug
      and its own review link; Review links panel: Google review link + Regenerate
      (updates google_review_url in place; slug and printed QR stay the same, with
      a one-line note), non-scannable QR placeholder in the brand color, Short link
      and NFC tap link rows (distinct) each with Copy + "Copied" status; PNG/PDF/SVG
      download buttons disabled with "Coming in a later stage"; invalid URL shows a
      plain-language error and changes nothing. Free/Starter/Pro show 1 location;
      `enterprise` shows 2. Stub text removed from this route.
      Note: built `lib/mock/locations.ts` (review_pages-shaped store keyed by demo
      scenario; Add location issues a new `^[a-z0-9]{6}$` slug; Regenerate updates
      `google_review_url` in place), `components/dashboard/{modal,copy-button,
      locations-content}.tsx`, and extended `lib/mock/demo.ts` (all 1F scenarios)
      plus `lib/mock/dashboard.ts` (per-scenario plans; `scan_limit`/
      `location_limit` are now nullable for Enterprise). Verified `tsc` + build and
      over HTTP: starter/free/pro show the disabled Add location with the exact
      message + Contact us and 1 location; enterprise shows 2 locations, the
      button enabled and no limit message; the 1F stub text is gone. Open questions
      logged: no NFC-specific URL format exists in the docs (both rows show the
      same permanent link, kept as distinct rows); the location-name limit is
      undefined (used 4A's 100).
- [x] T2. Customer page editor shell, Activate control, preview, location selector.
      components/dashboard/activate-button.tsx (PRD 5.5.3: off white fill + 1.5px
      border "Activate"; on #1D4ED8 white text + tick "Active"; min-h 36px, 8px
      radius, 13px label weight 500, aria-pressed, never color alone) reused
      everywhere. /customer-page: two columns on desktop with a sticky 375px phone
      preview; under 1024px a Preview button opens a focus-trapped drawer (Escape
      closes). Top bar per 5.5.2 / ui-spec 2.6: location selector (only with >1
      location), Save changes, Discard, Reset to default (confirm; keeps social
      icons), View live page (/r/{slug} in a new tab), usage meters. Editor state in
      React state; Save writes the mock store; Discard reverts; unsaved guard
      ("Discard changes?") on route change, location change and beforeunload.
      Skeleton, error + Retry, optional mock page_custom_hidden banner. Locked
      "Review buttons: Always shown" row; empty groups; left column renders sections.
      Note: built `components/dashboard/activate-button.tsx` (PRD 5.5.3 exactly),
      `customer-page-preview.tsx` (renders the SAME 1D `CustomerPage` components
      from the editor draft in a 375 px phone frame, MOCK_NOW for stable
      "Open now") and `customer-page-editor.tsx` (top bar with Save/Discard/Reset
      + confirm, View live page, usage meters, enterprise-only location selector,
      unsaved guard on beforeunload + in-app link clicks via window.confirm,
      loading skeleton, error + inline Retry, page_custom_hidden banner, locked
      review row). MOCK store added to lib/mock/customer-page.ts
      (get/saveMockPageConfig + social links keyed by scenario+location; the
      `over-limit` default config holds 65 items); added the `page_custom_hidden`
      demo scenario. Verified `tsc` + build; HTTP: top bar/rows present, meters
      read "Menu items 0 / 60" (default) and "Menu items 65 / 60" (over-limit),
      enterprise shows the location selector, hidden/loading/error scenarios all
      render their states, and the preview follows the config ("Our menu" button
      appears only with the over-limit config). 1D regression re-verified
      (cafe01/full01/salon1/pause1 200, BAD 404). Limitation: the guard, Reset
      and Save clicks were not driven headlessly (no browser); the preview
      updates on state change by construction (config-driven proof above).
- [x] T3. Editor items: suggestions, announcement, thank-you, buttons, social icons.
      lib/validation/page-config.ts (pure functions, shared by editor + 1D renderer).
      Rows per ui-spec 2.3 (auto icon, name, amber badge "Needs a link"/"Check link",
      Activate control, expanding fields with helper text; off hides fields and keeps
      values). Items: "Suggested for your business" chips (never auto-enable),
      announcement 160 + optional end date, thank-you 160, Call, WhatsApp, Directions
      (address 200 or allowlisted Maps link), custom links (label 30, https, cap 20,
      "Add link button" disabled at 20), the Pay button (upi_id 50 + name 30 owner
      decision; upi://pay?pa=...&pn=...&cu=INR only, URL-encoded, no amount; Pay
      screen with back arrow, payee, Copy UPI ID + "Copied", one-time activation
      warning; doc updates in PRD/security/business-rules), 5 social icons
      {on,url}. Inline error texts from ui-spec 2.4. Save blocked while an On item is
      invalid with "Fix N items to save". tel:/wa.me/Maps built in one helper.
      Note: built `lib/validation/page-config.ts` (link/social/phone/maps
      primitives moved here and re-exported from lib/customer-page.ts; the exact
      ui-spec 2.4 error texts; Pay rules with the owner-decision limits 50/30;
      `payLink()` building the ONLY allowed upi://pay URL, encoded, no amount;
      `pageConfigIssues()` for save blocking), the editor sections
      (`editor-item-row.tsx` with the amber Needs-a-link/Check-link badges and
      `customer-page-items.tsx`: chips that only scroll+highlight, announcement
      160 + end date, thank-you 160, Call, WhatsApp, Directions, Pay now with the
      one-time "Customers will pay the UPI ID you enter. Double-check it."
      warning, custom links label 30 cap 20, the 5 social icons), the Pay screen
      (`components/customer-page/pay-screen.tsx`) and the renderer changes (Pay
      now after Directions in `shownButtons`, rupee icon, grid/screen wiring),
      plus the `pay` field in the mock shape and a valid Pay example on `full01`.
      DOC UPDATES made in this task (logged): PRD.md 5.5.4 (table row + Pay
      button rules with the owner-decision limits), 5.5.5 (fixed order), 5.5.13
      (shape); security-and-reliability.md 4C (MUST bullet for the upi: rule +
      hard-cap rows UPI 50 / name 30, both owner decisions); business-rules.md 11
      (new rule 22). VERIFIED: `tsc` + build; a 33-check script proves every
      validation pair (link https/http/javascript/data/credentials/localhost/
      raw-IP, social wrong-host/valid/any-https, phone ok/short/16-digits, maps
      address/non-Google/Google/maps.app.goo.gl, UPI name@bank/"abc"/"a@b@c"/
      51 chars, name 30/31, payLink exact and no `am=`, isPayShown/
      isCustomLinkShown on-off-valid pairs, 5 issues on a broken config); over
      HTTP `/r/full01` renders exactly 8 tiles with Pay now after Directions and
      hides the on-but-invalid "Legacy menu" and the off "Gift cards";
      `/r/full01?screen=pay` shows the payee, UPI ID, exact encoded link, Copy
      UPI ID, "Check the name before you pay." and no app list/no amount;
      `/r/cafe01` has no Pay now. Limitations: click-driven toggles/Copy/Save
      were not driven headlessly (no browser). Decisions/open questions: the
      Wi-Fi suggestion chip is omitted (Phase 4B-D, no row in 1F); the
      blocked-host message "That host is not allowed." and the link-cap message
      "You can add up to 20 link buttons per location." are not written in the
      docs (simple literal wording, logged).
- [x] T4. Editor items: Hours and contact, Menu builder, plan-limit meter. Hours
      (phone, address, weekly hours each weekday HH:MM up to two ranges or Closed,
      note 100; open-before-close undefined → log open question). Menu per 5.5.6 /
      ui-spec 2.5: editable title by type (40), categories up to 12 (name 40), items
      name 60 + price 20, "Add details (optional)" (160 + tag + Mark sold out),
      remove; "Items 4 / N" meter from the mock plan; "Item limit reached. Upgrade
      for more items."; "The Menu button stays hidden until you add at least one
      item."; over-limit scenario: nothing deleted, preview shows first N, editor
      shows "Over your plan limit: upgrade or remove items", Save blocked, delete
      works; "Copy from another location" only when >1 location (log Pro
      contradiction); type changes never alter content.
      Note: built `components/dashboard/menu-and-hours.tsx` (MenuRow: title 40,
      lists up to 12 with name 40, items name 60/price 20, Add details → What's in
      it 160 + Tag + Mark sold out with the shared Activate control, remove
      list/item, row meter "Items N / limit" from lib/mock/plans.ts, "Item limit
      reached. Upgrade for more items." once at the limit, "The Menu button stays
      hidden until you add at least one item."; HoursRow: phone 7–15 digits,
      address 200, weekly hours with up to two HH:MM ranges per day or a Closed
      checkbox, note 100). Added `namedMenuItemCount`, `isHoursShown`,
      `menuLimitIssue` and the address/note checks to lib/validation/page-config.ts
      (shared with the 1D renderer) and `limitedMenuCategories` to
      lib/customer-page.ts; the public Menu screen now shows only the first N
      named items in the owner's order (business-rules 11 rule 5) via
      `plans[business.plan].page.menu_items` (new `plan` field on the mock
      business, mirroring schema.sql businesses.plan). The editor blocks Save with
      "Over your plan limit: upgrade or remove items (65 of 60)" through the same
      issue list and keeps delete working; "Copy from another location" appears
      only with 2 locations (enterprise, whose second location is seeded with a
      small config) after a confirm. VERIFIED: `tsc` + `next build`; a 15-check
      runtime script (counts, clamp at 0/10/60/150/null, owner order, unnamed
      items ignored, phone/address/note caps, isOpenNow in Asia/Kolkata, issue
      list); HTTP via the managed preview: over-limit editor shows Items 65 / 60 +
      the over-limit line once + no duplicate limit line, free 0 / 10, pro 0 / 150,
      enterprise shows the copy section + location selector, normal shows none;
      /r/full01?screen=menu renders all 4 items in order, /r/salon1?screen=menu
      unchanged, /r/full01?screen=hours shows "Open now" from the business time
      zone; the first-N public clamp proven over HTTP with a temporary limit=2
      edit (only Cold brew + Cappuccino rendered) and reverted straight after.
      Open questions/deviations: open-before-close is undefined in the docs (no
      check built; a day can be marked Closed); an On menu with no named item
      blocks Save (PRD 5.5.4 Check + rule 11.17) while the doc's notice text is
      shown; the "Copy from another location (Pro)" contradiction is unresolved —
      the section is gated on the business actually having more than 1 location.
      Limitation: 375/1280 px checked from the responsive classes only (no
      headless browser).
      Post-1F addition (2026-10-23): the Menu row now also has the Upload PDF /
      Type manually switch and the import dialog; that work is tracked as 1I
      below, not retro-ticked into this task.
- [x] T5. /billing: current plan card (name, price, scans used/limit + progress,
      locations, renewal/reset date, status); plan comparison from lib/mock/plans.ts
      (Free/Starter/Pro; Enterprise "Contact us", not purchasable); Upgrade (mock
      checkout confirmation, changes mock plan, limits unlock instantly, scans_used
      kept); Downgrade (end of cycle, warning when current usage exceeds the lower
      plan); invoice history (mock table + empty state, no PDF unless documented);
      Cancel plan (re-auth dialog → reason dropdown per business-rules 5 + free text
      → exact confirmation text; >1 location adds "Extra locations will be switched
      off when your plan ends."); banners for cancel-pending / cancel-finalized
      (with Keep my plan) / past-due; 1E scan-limit banner still shows; no refund
      buttons.
      Note: built `lib/mock/billing.ts` (schema-shaped subscriptions /
      cancellation_requests / payment_attempts + the plan override that
      lib/mock/dashboard.ts reads, so a mock upgrade moves the plan everywhere),
      `components/dashboard/reauth-dialog.tsx` (mock "Confirm it's you", security
      1: any password except the mock helper password fails with the generic
      message) and `components/dashboard/billing-content.tsx` (current plan card =
      the 1E PlanWidget + a price/status/renewal card; plan comparison with
      planPriceLabel from lib/mock/plans.ts, Enterprise "Contact us" and not
      purchasable; demo-checkout modal; scheduled-downgrade modal with the usage
      warnings; invoice table + "No payments yet." empty state, no PDF download;
      cancel flow re-auth → reason dropdown (business-rules 5 list) + optional free
      text → the exact confirmation text; banners for past-due (the business-rules
      4 email wording), pending/contacted and finalized with Keep my plan; the 1E
      scan-limit banner still shows via the shell). No refund buttons anywhere.
      VERIFIED: `tsc` + `next build`; an 8-check runtime script (pro/free invoices,
      cancel-pending/finalized seeds, past-due grace + failed attempt, upgrade
      changes planForScenario + getDashboardMock while scans_used is kept,
      downgrade only scheduled, submit→pending, Keep my plan→withdrawn); HTTP on
      the managed preview: normal (Starter) shows the plan card + 2 paid rows +
      Upgrade to Pro + Downgrade to Free, free shows the empty state and no cancel
      section, pro shows two downgrade buttons, cancel-pending shows the exact
      banner + "A cancellation request is already open." (no second Cancel),
      cancel-finalized shows the exact banner + Keep my plan, past-due shows the
      payment-failed line + grace date, limit still shows the 1E scan-limit
      banner, loading shows the skeleton and error shows inline Retry; the
      downgrade warnings were proven with a temporary open-by-default modal
      (limit: "You are using 1,000 scans this cycle, and Free allows 10.";
      enterprise: 955 scans + "You have 2 locations, and Free allows 1.") then
      reverted. Open questions/decisions logged: no dashboard past-due banner text
      exists in the docs (the business-rules 4 email wording is used); the
      downgrade-scheduled and Keep-my-plan confirmation wordings are simple
      literals not in the docs; cancellation free text has no documented max (left
      uncapped); Free has no Cancel plan action (nothing to cancel) and Enterprise
      is contact-only; no PDF invoice download because no doc defines one.
      Limitation: click-driven modal/re-auth flows verified through the store
      script + SSR (no headless browser); 375/1280 px checked from the responsive
      classes.
- [x] T6. /settings tabs 1, 2 and 5 + shared tab plumbing. One page with tabs
      (Business profile, Appearance, Auto-reply, Account & security; Google
      connection hidden). Each tab: Save changes, inline validation, success toast
      (role="status"), skeleton, inline Retry, "Discard changes?" guard. Tab 1
      5.4.1: name 100, type dropdown + color_source note, tagline 120, time zone
      (Intl.supportedValuesOf fallback), logo upload/replace/remove (mock PNG/JPEG/
      WebP 1MB, no SVG), Google review link read-only + "Manage in Locations"; no
      slug created. Tab 2 Appearance (8.1, rules 10, brand-guide): preset chips +
      native color inputs, live dashboard preview via getBrandTheme(), plain-words
      contrast result, states it drives QR + weekly email. Tab 5 Account & security
      (5.4.5): change email/password behind re-auth (8+ chars), log out all devices,
      Delete account with security 7 wording, exact business name to enable,
      re-auth first, mock "account deleted" screen linking to /.
      Note: built `lib/mock/settings.ts` (schema-shaped business profile seeded
      from the dashboard / customer-page / location mocks; `timeZoneOptions()`
      uses Intl.supportedValuesOf with the documented fallback list),
      `components/dashboard/settings-tabs.tsx` (BusinessProfileTab: name 100
      required, type dropdown with the preset-vs-custom colour note, tagline 120,
      time zone select that always includes the stored value, logo
      upload/replace/remove with the 1C client checks — PNG/JPEG/WebP, 1 MB, no
      SVG, object-URL preview, nothing uploaded — and the read-only Google review
      link + "Manage in Locations"; AppearanceTab: the six preset chips from
      brand-guide.md, two native colour inputs that switch `color_source` to
      custom, the live dashboard preview (header, three stat cards, buttons, star
      row) entirely driven by `getBrandTheme()`, the derived-theme value list and
      the plain-words contrast result with the 4.5:1 warning, plus the QR/email
      statement; AccountSecurityTab: change email and change password each behind
      the mock re-auth dialog, "Log out of all devices", and Delete account with
      the security section 7 wording, the exact-business-name gate and the mock
      deleted screen linking to /) and `components/dashboard/settings-content.tsx`
      (URL-driven tab bar `?tab=`, per-tab skeleton for `loading`, inline Retry
      for `error`, the "Discard changes?" guard on tab/app links + beforeunload,
      and the deleted screen). The Auto-reply tab is deliberately NOT built here
      (T7). VERIFIED: `tsc` + `next build`; a 6-check runtime script (seed values,
      save round-trip that never leaks between scenarios, time zone options,
      brand-guide preset table, custom theme derivation, email/password rules);
      HTTP on the managed preview: the default profile tab renders the fields +
      the preset note + Manage in Locations, `?tab=appearance` renders all six
      preset chips, both colour inputs and the theme values
      (#213D36/#C5DBC8/#EDF4EE/#FFFFFF with the café star falling back to the
      primary colour), `?tab=security` renders the email, both change buttons,
      log-out, the deletion bullets and the disabled Delete button,
      `?demo=loading` renders the skeleton and `?demo=error` renders "Couldn't
      load your business profile." + Retry. The custom-colour path was proven
      with a temporary `color_source = custom` edit: the note switched to "Your
      custom colours are kept…" and the derived theme changed to page background
      #F6FAF7 (secondary at 15% over white) with the star colour falling back to
      #213D36, then reverted. Edge found: Node's Intl.supportedValuesOf returns
      "Asia/Calcutta", so the tab always prepends the stored zone (verified in
      SSR). Limitations: click-driven Save/Discard/re-auth/delete-gate flows were
      verified through the store script + SSR (no headless browser); 375/1280 px
      checked from the responsive classes; the settings store is separate from
      the dashboard/customer-page mocks until Stage 4 connects one business
      record, so saved colours update the preview + the settings store only.
- [x] T7. /settings Auto-reply tab, request form, dashboard card (PRD 5.4.3 v1).
      Dashboard card + Settings → Auto-reply; Starter sees exactly the upgrade
      message + Upgrade plan → /billing, no form; Free/Pro/Enterprise see Contact
      support → /settings/auto-reply/request. Request form (5.4.3: name 2-80,
      business name 2-100 prefilled, type prefilled, registered Google email max 254,
      phone 7-15 digits) with Send/Cancel, inline validation, discard guard, then
      "Request received. Our team will contact you within 48 hours."; status card
      Pending/Contacted/On/Closed; one open request; Connect Google disabled button
      only in Contacted; Starter hitting the URL directly sees the upgrade message;
      "Auto-reply paused" note at the scan limit; then the final 1F pass (sidebar
      links, no stubs, all scenarios) and Phase 4/4B/5 annotations.
      Note: built `lib/mock/auto-reply.ts` (schema-shaped `auto_reply_requests`
      rows, one per `auto-reply-*` scenario; submit creates a single open
      `pending` row; a `closed` request can be replaced), `lib/validation/auto-reply.ts`
      (pure PRD 5.4.3 validator — own name 2/80, business name 2/100, email valid
      and max 254, phone = the Call/WhatsApp rule; Stage 3 mirrors it as zod),
      `components/dashboard/auto-reply.tsx` (AutoReplyCard on /dashboard,
      AutoReplyTab, AutoReplyRequestScreen = plan gate / status card / form +
      confirmation), the shared `components/dashboard/discard-guard.ts` hook
      (extracted from the T6 settings plumbing and reused by the request form),
      and the `/settings/auto-reply/request` route. Starter sees the exact
      upgrade message with no Contact support button and no form; Free, Pro and
      Enterprise get the explanation + Contact support; statuses Pending /
      Contacted / On / Closed render with the request date; the disabled
      "Connect Google" placeholder appears only in Contacted; the "Auto-reply
      paused" note shows on the On status card when the scan limit is reached
      (business-rules.md 1); 5 new demo scenarios (auto-reply-pending/contacted/
      on/paused/closed; they run on Pro because Starter excludes auto-reply).
      VERIFIED: `tsc` + `npm run build` PASS; a 41-check runtime script (every
      validation pair, store transitions incl. one-open-request and closed→new,
      plan flags, scenario wiring incl. the paused scan-limit state); HTTP via
      the managed preview: Starter gate (exact message, no Contact support/form),
      free/pro/enterprise explanation + request link, every status card + date,
      paused note, closed → new request, request page (form / Starter gate /
      open-request block), dashboard card (normal + auto-reply-on), loading
      skeleton + error Retry; final 1F pass: 119/119 route × scenario sweep, all
      sidebar links 200, no "built in step 1F" text left on any 1F route, and
      the 1D routes unchanged (cafe01/full01/salon1/pause1 200, malformed 404,
      /r/full01 Pay screen 200). Open questions/decisions: the paused-note and
      request-page sub-line wordings are simple literals not in the docs
      (logged); "Your name" starts empty because PRD 5.4.3 prefills only the
      business name and type; the request form stores into the mock only.

- PROFILE SYNC FIX (owner-reported, done on top of 1F; no 1C/1F ticks changed):
  - profile sync fix, T1: added the ONE shared business profile
    (`lib/mock/store.ts`, versioned localStorage key `syehere.mock.business.v1`;
    `getBusiness`/`saveBusiness`/`resetBusiness` + storage-event subscribe,
    field-level validation with static-mock fallback, in-memory fallback when
    storage fails, canvas downscale to 256px data URL for logos;
    `lib/use-business.ts` with `useBusiness`/`useMockBusiness`/`useMockSettings`),
    and onboarding now writes name/type/tagline/logo/colors/review link into it.
  - profile sync fix, T2: `/settings` Business profile + Appearance use the
    shared profile (`lib/mock/settings.ts` rewritten on top of the store); a
    type change with `color_source = preset` re-applies the new type's preset
    colours AND its default logo, custom colours/logo are kept; a "Reset demo
    data" mock action was added to the profile tab (calls `resetBusiness()`).
  - profile sync fix, T3: dashboard shell/top bar, Dashboard, Locations,
    Analytics, Billing, the Customer page editor and its live preview, the
    public /r/[slug] page (post-mount read, only for the current mock business
    slug cafe01), the onboarding completion screen and the mock review wording
    all read the one shared profile; colors only via `getBrandTheme(business)`.
  - profile sync fix, T4: verify recorded in the Session Log; Settings wiring is
    live (1F T6 was already built), so no "Settings wiring pending" note needed.
  - profile sync fix follow-up (owner-reported): Save on /customer-page wrote
    `page_config`/`social_links` to an in-memory map, so "View live page" (a new
    tab) and reloads showed only the static mock. Saved content now persists in
    ONE localStorage record keyed by slug (`syehere.mock.pages.v1`), sanitized on
    write and read with the same validators (100 KB / 300-item 4C caps, memory
    fallback when storage fails); the editor loads it per location and Save /
    Reset to default write it; the public page applies it after mount for the
    current business's slugs only (cafe01/cafe02), keeps admin-hidden pages
    hidden, and recomputes the announcement + "Open now" values. The editor
    preview also follows the social-icon draft. Other demo slugs
    (full01/salon1/pause1) are untouched.

- DYNAMIC BUSINESS FIX (owner-reported, done on top of 1F; no 1C/1F ticks
  changed): onboarding showed `/r/cafe01` for every type, Locations always showed
  "Brew and Bean / syehere.co/cafe01 / 955 scans", both review-link rows always
  showed cafe01, and the top-right avatar always showed the name initial.
  - `lib/mock/business.ts` now holds ONE reserved slug per business type
    (`cafe01`, `resto1`, `glam01`, `gym001`, `store1`, `other1`), all
    `^[a-z0-9]{6}$`; onboarding issues `slugForType(type)` and saves it in the
    profile (the slug is issued once and never re-issued — business-rules.md 9 —
    so a later type change in Settings keeps it). The unused onboarding draft
    helpers (`mockSaveBusiness`/`draftFromInput`) were removed with it.
  - `lib/mock/locations.ts` is now fully derived from the shared profile
    (`locationsForBusiness(owner, scenario, demoNumbers)`): primary location name
    = business name, slug = profile slug, link = the business link; the
    enterprise second location gets the sibling slug (`nextMockSlug` keeps the
    prefix/digit width: cafe01→cafe02, gym001→gym002). Add location / Regenerate
    link are session-only maps (unchanged rules: new slug on add, link updated in
    place). A profile saved by onboarding/Settings is a new business, so its
    counters start at 0; the fresh-visitor café demo keeps 955/312.
  - `lib/mock/store.ts`: the profile carries `slug` (validated with
    `SLUG_PATTERN`, and full01/salon1/pause1 can never be claimed),
    `hasStoredBusiness()` distinguishes the demo from a saved business, and
    `isCurrentBusinessSlug`/`businessOwnsSlug` (pure, profile-based) decide which
    slugs may apply saved profile/page content.
  - `lib/mock/customer-page.ts`: the five reserved slugs have their own static
    pages (resto1 "The Green Table", glam01 "Glow Studio", gym001 "Iron Yard
    Gym", store1 "Northside Supply", other1 "Studio Nine") so `/r/<their slug>`
    resolves on the server; the owner's browser overlays the saved profile after
    mount (the first render uses the default profile, so hydration still
    matches). `components/customer-page/customer-page.tsx` decides that with the
    pure predicate, and `displayableLogo()` keeps legacy `mock://` logos from
    being rendered as broken images.
  - `lib/use-business.ts`: `useMockLocations(scenario, revision, live)` and the
    `live = false` `useMockBusiness` path now returns a full default profile
    (long-name scenario unchanged). Locations + the editor use the hook; the
    Review links panel now prefills the profile's Google review link instead of
    the hardcoded café URL.
  - `components/dashboard/shell.tsx`: the top-right avatar renders the uploaded
    logo (`data:`/https) when one exists, else the name initial as before.

### 1G checklist (Stage 1, step 1G) — FRONTEND ONLY, mock data, no backend
Added 2026-10-11 at the owner's request: a loyalty program where every stamp is real. Spec: PRD.md 5.7,
business-rules.md section 12, schema.sql "LOYALTY PROGRAM". Defaults used (owner decisions still open, see
"Open decisions"): email confirmation (not phone), stamp mode "both", choose-one-reward on a full card,
all plans, loyalty does not count toward scans, multiple staff PINs, mock data first.
- [x] L1. Rules engine `lib/loyalty/rules.ts` (pure, no browser/DB/clock) + `lib/loyalty/pin.ts` (PIN hash, uniqueness,
      lockout). One-time 60 second codes (single use, not consumed by a "too soon" refusal), cooldown, rolling 24 hour
      cap, derived balance with carry-over, append-only ledger with void/cancel, reward claim copies the offer, monthly
      offer limit, max 5 active offers, redeem once, expiry derived, member delete keeps the ledger.
      Verified: `npx tsx scripts/loyalty-rules-check.ts` -> 97 passed, 0 failed.
- [x] L2. Mock store `lib/mock/loyalty-store.ts` (localStorage `syehere.mock.loyalty.v1`, sanitised on read, memory
      fallback, cross-tab updates) + `lib/use-loyalty.ts` hooks (state is null until mount, so no hydration mismatch).
      Demo staff "Counter" with PIN 1234 is created on first dashboard visit. The emailed code is shown on screen
      (demo mode). MOCK ONLY: localStorage can be edited, so this proves the flow, not the fraud protection.
- [x] L3. Customer page: `components/customer-page/loyalty-screen.tsx` (join with email + code, stamp card, Get a stamp,
      Choose reward, My rewards, paused state). A "Loyalty card" tile is added first in the button grid for the current
      mock business's slugs while the program is on (`CustomerButton` kind/screen `loyalty`, `?screen=loyalty` deep
      link allowed). Uses the page's brand CSS variables, 44 px+ targets, font weights 400/500 only.
- [x] L4. Dashboard: `/loyalty` with tabs Overview, Stamp mode, Rewards, Staff, Members, Activity, Settings
      (`components/dashboard/loyalty/*`), new sidebar item with `LoyaltyIcon`.
- [x] L5. Docs: schema.sql loyalty tables, business-rules.md 12, PRD.md 5.7, email-templates.md 15, privacy-policy.md 3.
- [x] Verified: `tsc` and `next build` pass; every route 200. No headless browser here, so two simulated-DOM walks (jsdom +
      Testing Library, test-only packages installed with `--no-save`, scripts not kept) drove the real components:
      customer flow 20/20 (join, wrong code, stamp by staff in another tab, stamp by counter code, complete card, choose
      reward, staff redeem updates the customer screen, deleted member signed out, paused program) and owner flow 20/20
      (PIN refused/accepted, wrong code refused, 3 stamps, reward redeemed once and a second try blocked, lock, 5 rewards
      with the 6th kept paused, duplicate PIN refused, resize blocked while a full card waits, days clamped, void stamp).
- [ ] Stage 3 TODO (real protection): run `rules.ts` on the server in one libSQL transaction per action; Turnstile +
      Upstash rate limits on join/send-code/verify and on Stamp mode PIN; Resend email (template 15); signed httpOnly
      session cookie for the customer; staff session cookie and a separate `/stamp` route; CSPRNG codes stored as hashes;
      slow PIN hash (scrypt/argon2); QR display/scan via the `qrcode` package; redeem as ONE conditional UPDATE; prune old
      tokens; extend the scenario tests with real HTTP (replay, cross-tenant, concurrency).
- [ ] Known limitation to settle before Stage 3: `stamps_required` is one number per program and the balance is derived from
      it, so a change affects every card (refused while a full card is waiting). If owners must change it freely, store
      the size per card cycle instead.

### 1I checklist (Stage 1, step 1I) — FRONTEND ONLY, mock data, no backend
Added 2026-10-23 at the owner's request: upload a menu PDF and let AI prepare the lists, items, prices,
details and dish photos for review. Spec: PRD.md 5.5.6, business-rules.md rule 20, customer-page-ui-spec.md
2.5. Stage 1 extraction is a labelled demo; upload, validation, review, limits, photo reservation and save
are real UI behaviour.
- [x] I1. Pure rules `lib/menu-import.ts`: PDF type/size checks, 8 MB limit, extraction result shape,
      clamping to item/category limits, merge that never exceeds the plan, unnamed rows dropped, and a
      demo extractor per business type. 265-line check script `scripts/menu-import-check.ts`.
- [x] I2. Entry switch in the Menu row: "Upload PDF" / "Type manually" (empty menu opens Upload, existing
      menu opens Type manually), upload panel with plan items and AI photos left.
- [x] I3. Dialog: pick/drop PDF -> labelled reading stages -> review with per-item checkboxes, list/item
      caps, photos summary -> creating photos -> save. Errors and "Choose another PDF"; imported rows are
      editable afterwards.
- [x] I4. AI photo batch: reserve `min(selected, plan credits, daily room)` credits once, generate for the
      selected dishes, refund the whole reservation if the batch fails. Uses the existing mock ledger and
      `ai_image_jobs`-shaped rules.
- [x] I5. Docs: PRD 5.5.6, business-rules 20, UI spec 2.5, AI_MENU_PHOTOS.md (batch + storage),
      security-and-reliability.md (upload, tenant, rate limit, retention), privacy-policy.md,
      legal-pages.md, admin-spec.md, schema.sql `batch_id`, README.
- [x] Verified: `tsc`, `npm run build`, `scripts/menu-import-check.ts`, and HTTP 200 on `/customer-page`.
- [ ] Stage 2/4 TODO (production, NOT built): direct-to-R2 signed upload (8 MB, max 40 pages, private,
      deleted within 24 hours), real extraction via a PDF-capable AI provider with zod validation,
      `POST /api/menu-import`, and batch photo jobs keyed by `ai_image_jobs.batch_id`. See
      security-and-reliability.md 4/4A and AI_MENU_PHOTOS.md.


## Phase 0: Google approvals (owner tasks, START FIRST, they take weeks; see google-approval.md)
The agent cannot do these. Mark each `[BLOCKED: waiting on owner/Google]` and continue with Phase 1.
- [ ] `[BLOCKED]` Confirm a verified Google Business Profile, active 60+ days, with a website listed (owner)
- [ ] `[BLOCKED]` Buy production domain, connect to Vercel, verify in Google Search Console (owner)
- [ ] `[BLOCKED]` Create Google Cloud project, record the Project Number (owner)
- [ ] `[BLOCKED]` Submit "Application for Basic API Access"; confirm quota is above 0 (owner)
- [ ] `[BLOCKED]` Enable the 3 APIs, create Web OAuth client, set redirect URI (owner; after approval)
- [ ] `[BLOCKED]` Configure the consent screen per google-approval.md section 5 and publish to Production (owner)
- [ ] `[BLOCKED]` Run the google-approval.md section 11 checklist (submitter role, logo, domain proof, test access) before submitting
- [ ] `[BLOCKED]` Record demo video (section 7) and submit OAuth verification with the scope justification (owner)
- [ ] Confirm Groq and Gemini plan terms allow the "no training on review text" statement (owner) before publishing the Privacy Policy wording

**Done when:** API quota is above 0, and Google shows the OAuth app as verified and in Production. Until then, build and test with the owner's own Google account as a test user.

## Phase 0B: Cashfree activation (owner tasks; see cashfree-approval.md)
- [ ] `[BLOCKED]` Decide entity type; business must be registered in India (or start as Individual) (owner)
- [ ] `[BLOCKED]` Gather documents: PANs, registration proof, bank details, owner KYC, beneficial-ownership declaration (owner)
- [ ] `[BLOCKED]` Create Cashfree account with a unique email; ask the payment expert to enable Subscription Payments (autopay) and whether the PCI-DSS AOC is needed for SaaS (owner)
- [ ] `[BLOCKED]` Supply legal business name, support email, valid phone number and address for the public pages (owner)
- [ ] `[BLOCKED]` After website audit and activation: production keys, webhook URL, test payment and refund (owner)

## Phase 1: Foundation
- [ ] Read provider-reference.md; fetch each linked doc (llms.txt where
      available) before writing integration code for that provider
- [ ] Create Turso database and run schema.sql against it (this also seeds the
      `plans` row in `system_settings` — verify it exists)
- [ ] Build a small `getPlans()` server helper that reads and validates the `plans`
      setting (including each plan's `page` limits); all limits and prices in the app come from it (security-and-reliability.md
      section 6A)
- [ ] Set up Next.js project + Tailwind
- [ ] Build a single data-access module that enforces business_id scoping on
      every query (see "Tenant Isolation" note at bottom of schema.sql)
- [ ] Set up Firebase auth (signup / login / logout)
- [ ] Build password reset / forgot password flow (generic message, no email
      enumeration; see security-and-reliability.md section 1)
- [ ] Session cookies: `/api/auth/session` with Firebase session cookie, owner
      48h, HttpOnly/Secure/SameSite=Lax, revocation check on every request
      (security-and-reliability.md section 1)
- [ ] Startup env validation with zod (app fails fast if a critical var is missing;
      include `RETENTION_DAYS_AFTER_CANCEL` as a positive integer, default 90)
- [ ] Security headers + CSP in next.config.js, same-origin-only CORS, Origin
      check on state-changing routes (section 5)
- [ ] Rate limiter helper on Upstash Redis (section 3)
- [ ] Central error handling per section 5A: fixed error envelope + code list,
      `withErrorHandling` wrapper used by EVERY route, request ids, provider errors
      never returned, unified sign-in/session error messages, branded `error.tsx` /
      `global-error.tsx` / `not-found.tsx`, `poweredByHeader: false`, `/admin`
      returns the normal 404 to non-admins
- [ ] Data-access module rules per section 4B: all SQL only in `lib/db/`, allowlists
      for sort/filter/update columns, LIKE escaping, validated limit/offset, IN
      placeholders; add `npm run check:sql`
- [ ] Add `npm run test:leaks` (section 5A tests) and the SQL injection payload
      tests (section 4B); both must pass before Phase 1 is ticked
- [ ] Shared zod schemas enforcing every text/size limit in section 4A (one
      place, reused by all routes)
- [ ] Write the tenant-isolation test (Business A cannot read/change Business B;
      section 2)

**Done when:** signup, login, logout and password reset work; cookie flags are
correct; the tenant-isolation test passes; missing env var stops the app;
`npm run check:sql` and `npm run test:leaks` both pass.

## Phase 2: Onboarding
- [ ] Business signup form
- [ ] 3-step onboarding wizard (business info → logo/theme → Google review link)
- [ ] Auto-generate QR code (logo overlay via sharp, see provider-reference.md)
      + permanent slug + short review link + NFC link — QR must encode ONLY
      the slug, never the raw Google URL (see business-rules.md section 9)
- [ ] Default logo/color assignment by business type (see brand-guide.md);
      set `businesses.color_source = 'preset'` on assignment
- [ ] `getBrandTheme(business)` helper: page background, star color, text-on-primary
      (business-rules.md section 10); use it on the customer page, dashboard
      content area, QR, and weekly email
- [ ] Require verified email before onboarding completes or a QR is generated
- [ ] Logo upload hardening: PNG/JPEG/WebP only (no SVG), 1 MB max, pixel
      limit, magic-byte check, re-encode to max 512px with sharp, random
      filename, one logo per business (old file deleted), 5 MB storage quota,
      stream cap on the request body, rate limit (sections 4 and 4A)
- [ ] Validate `google_review_url` (https + Google host allowlist, section 4)

**Done when:** a new owner can sign up, verify email, finish the wizard and
download a QR; a `.svg`, a fake image and a 5 MB file are all rejected.

## Phase 3: Customer-Facing Review Flow
- [ ] Public review page (green/red thumb, branded per business) (UI done with mock data, backend pending — see 1D T2)
- [ ] Happy path: AI-generated review text + copy button + Google redirect (UI done with mock data, backend pending — see 1D T3)
- [ ] Unhappy path: private feedback form (UI done with mock data, backend pending — see 1D T4)
- [ ] Thank-you page with social links (UI done with mock data, backend pending — see 1D T4)
- [ ] Turnstile on the feedback form and AI-generation trigger (verified
      server-side) + honeypot field (section 3) (placeholder + honeypot UI done, Turnstile backend pending — see 1D T3/T4)
- [ ] Per-IP rate limits on the public routes; feedback capped at 1000 chars;
      per-business daily caps for feedback rows and AI generations (section 4A)
- [ ] Scan counting with `visitor_hash` dedupe (30 min), bot user-agent and
      HEAD/prefetch exclusion (section 3)
- [ ] Fallback pre-written review templates if both AI providers fail (section 8) (UI done with mock data, backend pending — see 1D T3)
- [ ] Feedback text HTML-escaped everywhere it is rendered or emailed (section 4)

**Done when:** the full customer flow works; 6th feedback from one IP in an hour
gets 429; 20 refreshes count as at most 1 scan; `<script>` in feedback shows as text.

## Phase 4: Owner Dashboard
- [ ] Dashboard shell: sidebar nav + top bar, per PRD.md 5.1/5.2 layout spec
      (breakpoints, spacing scale, typography scale — build to that spec,
      don't eyeball it) (UI done with mock data, backend pending — see 1E T1)
- [ ] Stats overview: 4 stat cards (scans, reviews collected, avg rating,
      pending feedback) each with a week-over-week delta (UI done with mock data,
      backend pending — see 1E T2; avg rating dropped for v1 by owner decision)
- [ ] Weekly scan activity chart (7-day bar chart) + positive-rate gauge
      (ring, not a bar) — see PRD.md 5.1 (UI done with mock data, backend
      pending — see 1E T2)
- [ ] Feedback list (real-time), avatar-initial rows + colored status pill
      (Positive / Needs reply) (UI done with mock data, backend pending — see
      1E T2/T4; not real-time yet)
- [ ] Plan status widget (scans used / limit, locations used / limit), with the
      limits read from the `plans` setting via `getPlans()` (UI done with mock
      data, backend pending — see 1E T2; getPlans() pending)
- [ ] Engagement extras: streak banner + "review of the week" callout with
      one-tap social-share button (see PRD.md 5.1) — nice-to-have, can slip
      to a later pass if time-constrained, but don't drop silently (UI done with
      mock data, backend pending — see 1E T3)
- [ ] Review link / QR management page (generate, regenerate-in-place,
      download PNG/PDF/SVG) — see PRD.md 5.3 and provider-reference.md QR
      section (UI done with mock data, backend pending — see 1F T1; real QR and
      the PNG/PDF/SVG downloads are disabled)
- [ ] Brand appearance settings screen: business-type preset chips + custom
      color picker + live preview (see PRD.md 8.1, brand-guide.md, and
      business-rules.md section 10) (UI done with mock data, backend pending —
      see 1F T6)
- [ ] `/settings` page with the 5 tabs in PRD.md 5.4 (business profile incl. time zone, appearance,
      auto-reply, Google connection, account & security), each with its own Save, validation
      and unsaved-changes guard. Social links are NOT here; they are on the Customer page (Phase 4B) (UI done with mock data, backend pending — see 1F T6/T7; the Google connection tab is hidden in v1)
- [ ] (Social links moved to Phase 4B-A; see PRD.md 5.5.4)
- [ ] (LATER, not v1) Auto-reply template editor: per rating group mode toggle (AI / My template),
      placeholder buttons, preview, reset (PRD.md 5.4.3); shared zod schema rejects
      unknown placeholders and text over 1000 chars
- [ ] Auto-reply support request (PRD.md 5.4.3): dashboard "Google review auto-reply" card + Settings → Auto-reply tab; Starter sees
      "Please upgrade your plan" (no form); Free/Pro/Enterprise see Contact support → form page with the five fields; status card
      (Pending, Contacted, On, Closed); one open request per business; emails 13 and 14; `SUPPORT_EMAIL` notification; security doc 4D tests (UI done with mock data, backend pending — see 1F T7)
- [ ] Connect Google button on the Auto-reply status card, shown only while the request is `contacted` (uses the OAuth flow in the Phase 6 Google connect tasks); admin Mark contacted records `contact_method` (email or phone) (disabled placeholder UI done with mock data — see 1F T7; OAuth + admin flow pending)
- [ ] Admin `/admin/auto-reply-requests` page with Mark contacted / Activate / Close; Activate sets `auto_reply_enabled = 1` and is audit-logged
- [ ] Empty/loading/error states for the dashboard (see PRD.md 5.2 — new
      signup with zero data, skeleton loading, inline retry on failure) (UI done
      with mock data, backend pending — see 1E T3)
- [ ] Response filtering: no endpoint returns OAuth tokens or other tenants'
      data; feedback shown as plain text (section 4) (feedback plain-text UI
      done with mock data, backend pending — see 1E T4)
- [ ] Re-run the tenant-isolation test against every new endpoint added here
- [ ] Every list/search/sort endpoint added here uses the section 4B allowlists and
      validated pagination; re-run `npm run check:sql` and `npm run test:leaks`

**Done when:** dashboard matches PRD.md 5.1/5.2; tenant-isolation test still passes.

## Phase 4B: Customer Page Builder (owner-customizable landing page)
Spec: PRD.md section 5.5, `customer-page-ui-spec.md` (screens and wireframes), business-rules.md
section 11, security-and-reliability.md section 4C.
Sub-steps A to D are the rollout order; finish each sub-step's tasks before starting the next.

**4B-A: Foundations, buttons, links, contact**
- [ ] One shared zod schema for `page_config` (strict, unknown keys rejected, every limit from
      security-and-reliability.md 4C, shape from PRD.md 5.5.13), reused by the save route and the
      public page renderer. No menu URL field, no image fields
- [ ] Save route `PUT /api/customer-page` (session business only, rate-limited, body cap 128 KB,
      plan limits read from `getPlans().<plan>.page`, review-block rules from business-rules.md 11)
- [ ] Public landing page renders the config (default page when null or `page_custom_hidden = 1`),
      server-rendered/cached, revalidated on save, review block always first (UI done with mock data, backend pending — see 1D T2/T5)
- [ ] **Activate / Active control** component (PRD.md 5.5.3): off = white with black border, on = blue
      `#1D4ED8` with tick; reused for every on/off choice in the editor; keyboard and screen-reader
      accessible (`aria-pressed`), works in dark mode (UI done with mock data — see 1F T2)
- [ ] `/customer-page` editor: Buttons list, Social icons list, locked Review row, expanding field(s)
      per item, live phone preview updating on every keystroke, inline validation messages, status
      badges (Needs a link / Check link), Save / Discard / Reset to default / View live page,
      unsaved-changes guard, skeleton/error states (PRD.md 5.5.2) (UI done with mock data,
      backend pending — see 1F T2, T3 and T4)
- [ ] Adaptive button grid on the public page (PRD.md 5.5.5): 2 columns, odd last button stretches,
      no grid when empty; social icon row centered and hidden when empty; shown only when Active AND valid (UI done with mock data, backend pending — see 1D T5)
- [ ] Auto icons per button and per business type (no icon picker) (UI done with mock data, backend pending — see 1D T5)
- [ ] Items: announcement banner (with end date), thank-you message, **social icons** (Instagram,
      Facebook, YouTube, X, Website; allowlists from PRD.md 5.5.4, stored as `{on, url}` in
      `businesses.social_links`), Hours and contact (time zone from Business profile), Call, WhatsApp
      and Directions acting directly (server-built `tel:`, `wa.me`, Maps links), custom link buttons
      for every plan and business type (no plan limit, hard cap 20) (UI done with mock data, backend pending — see 1D T5)
- [ ] Automatic readable text color on business colors; 44 px tap targets; 16 px body text (UI done with mock data, backend pending — see 1D T1/T5)
- [ ] Sidebar item **Customer page** (UI done with mock data — see 1E T1 / 1F T2)
- [ ] Tests: 4C acceptance tests for XSS, URL validation, review-block rules, plan limits, tenant
      isolation, Active-but-invalid rejection, custom links accepted on every plan and business type (21st rejected)

**4B-B: Menu and screens**
- [ ] Manual menu / price list builder (PRD.md 5.5.6): lists (categories), items with name and price,
      optional details ("What's in it", tag, Sold out), remove, block title by business type, item limit
      meter. No menu link, no images (UI done with mock data, backend pending — see 1F T4)
- [ ] Customer screens with back arrow: Menu, Hours and contact (Wi-Fi in 4B-D) (Menu + Hours UI done with mock data, backend pending — see 1D T5)
- [ ] "Suggested for your business" chips (no auto-enable) (UI done with mock data — see 1F T3)
- [ ] Downgrade behavior: show first N items, "Over your plan limit" notice in the editor, block save
      until content fits (business-rules.md 11, rule 5) (UI done with mock data — see 1F T4)

**4B-C: Locations**
- [ ] Location selector in the editor and **Copy from another location** (Pro) (UI done with mock
      data — see 1F T2/T4; the section only appears with more than 1 location, the
      "Pro" label contradiction is logged)
- [ ] Reset to default keeps social icons (UI done with mock data — see 1F T2)
- [ ] Admin: **Hide / Restore custom page** on `/admin/clients/[id]` with audit log and owner banner

**4B-D: Wi-Fi and analytics**
- [ ] Wi-Fi button and screen with the public-password warning and Copy button
- [ ] `page_events` beacon endpoint (allowlisted events and ids, rate-limited, visitor_hash dedupe) and
      dashboard "Customer page" stats (menu views, link clicks, call taps); prune at 90 days

**Done when:** an owner with no customization gets the default page unchanged; an owner can activate buttons and icons, build a menu by hand,
add links and contact info and see them live within seconds; removing any button or icon re-flows the page; the printed QR still works after every
edit; every 4C acceptance test passes; the public page still loads fast on a mid-range phone.

## Phase 5: Billing
- [ ] Cashfree integration (India-only for now, see PRD.md section 2)
- [ ] Cashfree webhook handler (payment success/failure events)
- [ ] Plan upgrade → instant unlock + confirmation email (UI done with mock data — see 1F T5;
      Cashfree payment + email pending)
- [ ] Payment failure → grace period → suspend (per business-rules.md)
- [ ] Cancellation flow (reason form, 48hr message, per business-rules.md) (UI done with mock
      data, backend pending — see 1F T5)
- [ ] Cancellation lifecycle per business-rules.md 5.1 to 5.3: statuses
      (pending/contacted/retained/finalized/withdrawn), Billing banners, **Keep my plan**
      (through checkout again if Cashfree renewal was already cancelled) (banners UI done with
      mock data — see 1F T5; admin + cron pending)
- [ ] Daily cron jobs per business-rules.md 5.2/5.4/5B: renewal guard (auto-finalize
      2 days before renewal), plan end (move to Free, keep oldest location active,
      deactivate the rest), retention purge + 7-day warning email + reactivation on upgrade
- [ ] Safety net: a payment webhook after finalization never upgrades or extends;
      log it and flag "charge after cancellation" for the admin
- [ ] Pricing integrity per section 6A: `POST /api/billing/checkout` takes only
      `{ plan }` (strict schema, extra fields = 400); only `self_serve` plans;
      price from the `plans` setting; business from the session; record a
      `payment_attempts` row
- [ ] Confirm-before-unlock: on payment webhook, match `payment_attempts`, fetch from
      Cashfree, check paid + amount + currency + ownership + not already paid;
      mismatch -> `amount_mismatch`, no upgrade
- [ ] No client-callable route can change `plan`; admin plan/price edits go to
      `audit_logs` (price edits apply to new checkouts only)
- [ ] Webhook hardening: signature on raw body, 5-minute timestamp window,
      `processed_webhook_events` idempotency (section 6)
- [ ] Re-authentication required before cancel / delete (section 1) (mock dialog UI done — see
      1F T5/T6)

**Done when:** every acceptance test in security-and-reliability.md sections 6 and 6A
passes: extra fields in checkout are rejected, enterprise/free/unknown plans are
refused, a webhook with the wrong amount does not upgrade, replays change state once,
and the success URL without payment unlocks nothing.

## Phase 6: Automation
- [ ] AI review-text generation: Groq primary, Gemini fallback on error/timeout
- [ ] Weekly email report (Vercel cron, daily trigger is fine — batch by day-of-week)
- [ ] Google Review auto-reply job (Vercel cron, daily; see business-rules.md
      cron cadence note re: Hobby tier limits)
- [ ] Scan-limit pause (business-rules.md section 1): atomic conditional increment; at the limit the QR/NFC/short link, AI text
      and feedback form show the neutral unavailable page; counted visitors can finish; lazy reset at `scan_reset_at`
      (cron backstop); dashboard banner; one email per cycle (template 12); upgrade restores instantly and keeps `scans_used`;
      auto-reply and weekly report also skipped while at the limit and resume after reset/upgrade; per-IP quota-burn cap; admin Reset scan count. Tests: 10th scan works, 11th sees unavailable, two simultaneous
      scans at 9/10 never exceed 10, counted visitor finishes, upgrade restores, reset time passes restores
- [ ] Add-location gate: button disabled and route returns 403 when locations used >= plan limit (Free, Starter, Pro = 1); test it
- [ ] Plan gate for auto-reply (business-rules.md 6): cron skips plans with `google_auto_reply = false` (Starter);
      toggle/template routes return 403 for those plans; Starter sees the read-only screen with an Upgrade button;
      downgrade to Starter pauses it (keep templates and Google connection, one email); tests for all four plans
- [ ] Encrypt Google OAuth tokens with AES-256-GCM (`TOKEN_ENCRYPTION_KEY`,
      section 4)
- [ ] Google connect flow per google-approval.md section 10: `access_type=offline` + `prompt=consent`, single-use `state`, scope check,
      account and location picker (`gbp_location_name`), Needs-reconnect handling with one email, Disconnect that revokes at Google
- [ ] In-product disclosure text above the Connect button; disabled state with "being enabled" message while API access is unapproved
- [ ] Admin health flag "Google API access not approved" when Google returns 429 on every call
- [ ] Send only rating, reviewer first name and review text to AI; do not keep review text after replying
- [ ] All cron routes check `CRON_SECRET` (return 401 otherwise)
- [ ] Daily cleanup: delete `scan_events` older than 90 days, inside the
      existing daily cron (section 7)
- [ ] Do not send customer feedback text to AI providers (section 9)
- [ ] Auto-reply job honors per-group templates: `My template` mode posts the filled
      template with no AI call; empty/invalid template falls back to AI, never skips

**Done when:** crons return 401 without the secret; tokens are stored as
ciphertext; old scan events are pruned.

## Phase 7: Admin Panel
- [ ] Admin auth (email whitelist, separate from customer login)
- [ ] Client list + search/filter + detail view
- [ ] Revenue dashboard
- [ ] Broadcast email tool
- [ ] Cancellation request management: Mark contacted / **Finalize cancellation** /
      **Owner is staying**, overdue badge (pending > 48h), "auto-finalized" marker
- [ ] Refunds per business-rules.md 5A: **Issue refund** on `/admin/clients/[id]`
      Billing section, `/admin/refunds` list, `refunds` table, Cashfree refund webhook
      (verify current Cashfree refund docs first), admin re-auth within 10 minutes, email
      template 8, audit log `refund.issued`
- [ ] Admin dashboard additions: overdue cancellations count, "charge after cancellation" flags
- [ ] Audit logs
- [ ] Admin session: separate cookie, 24h absolute, 30-minute idle timeout,
      `ADMIN_EMAILS` check on every request (section 1)
- [ ] Admin routes rate-limited and never reachable with an owner cookie

**Done when:** an owner cookie is rejected on `/admin`; idle 31 minutes forces
re-login; every state-changing admin action writes an audit log; the refund and
cancellation acceptance tests in security-and-reliability.md section 7 pass.

## Phase 8: Legal, Polish & Security Gate
- [ ] Terms & Conditions page (UI done with mock data, backend pending — see 1B T2)
- [ ] Payment Policy page (UI done with mock data, backend pending — see 1B T2)
- [ ] Cancellation Policy page (UI done with mock data, backend pending — see 1B T3)
- [ ] Reviewer demo account for Google's verification team: pre-created owner login with all features unlocked, no payment needed, sample
      business and reviews; credentials go in the verification form only (google-approval.md section 11)
- [ ] `/pricing` lists Free, Starter, Pro (INR) and Enterprise ("Contact us"), read from `getPlans()`, and matches Cashfree exactly (UI done with mock data from `lib/mock/plans.ts`, `getPlans()` pending — see 1B T4)
- [ ] Public pages `/about`, `/contact`, `/pricing`, `/refund-policy` and footer (registered business name, email, phone) per PRD.md 5.6 and cashfree-approval.md (UI done with [BRACKET] placeholders, real business details pending — see 1B T4)
- [ ] Terms/Payment/Cancellation agreement tick box before the Cashfree checkout
- [ ] Public homepage `/` per PRD.md 5.6 (describes the product, has the "How we use your Google data" block, logo, links to Privacy and Terms, support email); no login wall (UI done with mock data, backend pending — see 1A T5 and 1B T5)
- [ ] Privacy Policy page built from `privacy-policy.md` (fill the [BRACKETS] first) incl. the Google-data / Limited Use section (google-approval.md section 8), processor list, deletion requests and breach
      notification section (security-and-reliability.md section 9), and the retention
      wording from legal-pages.md Cancellation Policy item 5 (UI done with [BRACKET] placeholders, lawyer review and backend pending — see 1B T1)
- [ ] Owner account deletion flow (section 7)
- [ ] Sentry wired (optional), `/api/health` endpoint, friendly DB-down page
      (section 8)
- [ ] Mobile responsiveness pass (customer flow + owner dashboard)
- [ ] Final QA pass against business-rules.md edge cases
- [ ] Dependency check: lockfile committed, `npm audit` reviewed
- [ ] **Security gate** (section 10): run the five reviews one at a time, and
      log a short summary of findings and fixes for each in the Session Log:
      1 secret leaks, 2 personal data flow, 3 production audit,
      4 auth and payments deep audit, 5 attacker's-perspective review
- [ ] Deploy to Vercel, set all env vars in Vercel dashboard (not committed .env)
- [ ] Verify Vercel cron jobs are registered and firing (vercel.json)
- [ ] `curl -I` production URL and confirm all security headers are present and
      there is no `X-Powered-By` header
- [ ] Run `npm run check:sql` and `npm run test:leaks` against the final build
- [ ] Confirm Vercel Deployment Protection is on for preview deployments (owner
      does this in the Vercel dashboard)

**Done when:** all five security reviews are logged with no open high-severity
findings, and a real payment + password reset have been tested end to end.

## Merged feature: Tables & Rooms QR Ordering (2026-11-02)
Merged from the finished standalone build. Only cafe, restaurant and hotel businesses see it; salon,
gym, retail and other types are unchanged.

- [x] Gate + sidebar: **Orders** (`/orders`) and **Tables/Rooms** (`/rooms`), 404 for other types.
- [x] Real SaaS data via `lib/rooms/adapter.ts`: business, locations, saved Customer page menu
      (prices parsed; unparseable = "Ask staff"), hours, contact and page config. The seed is only a
      corrupt-storage/test fallback and is never adopted for real location ids.
- [x] Live layer (request bell, sound toggle, live title), owner orders/rooms/QR/waiters/punch/bill,
      and the Tables/Rooms tab in the Customer page editor.
- [x] Public `/r/<slug>/<code>`: menu, cart, checkout, join gate, reorder, service calls, bill, PDF and
      review flow. Reception `/r/<slug>` has no ordering.
- [x] Dashboard/analytics ordering sections below existing content; existing cards and numbers unchanged.
- [x] Demo-only code removed (simulate tool, demo menu, demo invoice details, demo copy, `resetDemo`).
- [x] Safety: print-only CSS, validated tel/maps/https links, no hex in rooms code, no
      `dangerouslySetInnerHTML`/`innerHTML`, namespaced non-clashing storage keys.
- [x] Docs: PRD 5.8, business-rules 14, security 4E, Stage 2 schema proposal. CI runs `rooms-check`.
- [x] Checks: typecheck, build, category 112, loyalty 97, menu-import 283, rooms 154.

**Not built (Stage 2):** server-side bills/rounds/join codes, realtime, owner authentication on the
ordering endpoints, email delivery of bills, retention and audit. `_sayhere-ref/` was removed after
the merge.

## Open decisions (owner must answer; agent must not guess)
- DECIDED (2026-10-23): menu PDFs upload directly to a private R2 object with a short-lived signed
  URL, stay at most 24 hours and are deleted after extraction. The 8 MB limit stays; see
  security-and-reliability.md sections 4 and 4A. Real extraction and direct upload are Stage 2/4 work.
- DECIDED (2026-10-23): all dish photos created by one menu PDF import share `ai_image_jobs.batch_id`,
  so a failed batch refunds every reserved credit in one action.
- Loyalty (1G, defaults applied until answered): (1) stamp mode both vs one; (2) email vs phone/WhatsApp verification
  (phone adds a paid provider); (3) which plans get loyalty and whether it counts toward scans; (4) stamp card only vs
  points per spend; (5) one owner PIN vs several staff PINs; (6) Stage 3 timing for real fraud protection.
- Confirm `RETENTION_DAYS_AFTER_CANCEL` (spec default: 90 days; only extra locations are
  purged, see business-rules.md 5B), and the 2-day renewal guard (business-rules.md 5.2)
- Confirm that a finalized cancellation means "move to Free", not "close the account"
- Whether long-inactive Free accounts are ever purged (nothing does this today)
- Payment records vs account deletion: schema.sql cascades them, security doc says keep
  them (see the open item at the bottom of schema.sql)
- Verify the Cashfree refund API and refund webhook against current Cashfree docs
- Confirm the customer page plan limits (business-rules.md section 1: menu items 10/60/150; custom links have no plan limit) and whether Free keeps a small "Powered by Syehere" footer
- Confirm the hard caps in security-and-reliability.md 4C (for example 300 menu items)
- Customer page decisions to confirm: (1) DECIDED: custom link buttons on every plan and business type; (2) Call, WhatsApp and Directions act directly with no extra screen; (3) button
  order is fixed in v1 (no owner reordering); (4) Wi-Fi opens its own screen
- Governing-law jurisdiction for legal pages
- Production domain name (replace yourapp.com / syehere.co placeholders); Google verification needs it final
- Which verified Google Business Profile (your own or a client's) is used for the Basic API Access application
- Support email address on the production domain (shown on the consent screen and homepage)
- Data retention wording for Google data on disconnect (number of days in the Privacy Policy)
- Turso backup / point-in-time restore plan and a restore test
- DECIDED (2026-09-30): support contacts the owner by email or phone call within 48 hours and guides them through Connect Google; it still needs the Google approvals in google-approval.md first
- DECIDED (2026-09-30): 48-hour promise on the auto-reply request is confirmed, and Enterprise can use auto-reply like Free and Pro
- Confirm the USD prices in PRD.md section 4 (Pro changed to ₹699 in INR only; USD $13.99, about the same ratio as the other plans)
- Price-change policy: default is that admin price edits apply to new checkouts
  only and existing subscribers keep their price (section 6A)
- Billing alerts / spending limits on Groq, Gemini, Resend, R2, Turso, Upstash
  and Vercel (section 4A)
- Category name (logged 2026-10-24): the third category name "Other business" is a working name. Confirm or rename.
- Real phone OTP and admin approval need a provider and an admin screen (K9). Owner must choose the SMS provider.


---

## Session Log
(AI agent: append a short entry here after each session — what was done, what's next)

- 2026-09-29 — Spec update (no code): added the owner-customizable Customer page: PRD.md 5.5,
  business-rules.md section 11 and plan limits, security-and-reliability.md 4C, schema.sql
  (`review_pages.page_config` etc., `page_events`, `plans` seed `page` limits), admin hide/restore
  page action, Terms item 8, new Phase 4B. Social links moved from Settings to the Customer page.

- 2026-09-29 — Spec update (no code): added PRD.md 5.4 (Settings tabs), business-rules.md
  5.1-5.4 / 5A / 5B (cancellation lifecycle, refunds, retention), admin-spec.md (refund +
  finalize actions, /admin/refunds), schema.sql (new columns + `refunds` table), email
  templates 8-11, security limits/tests, legal Cancellation Policy wording,
  `RETENTION_DAYS_AFTER_CANCEL=90`. New tasks added to Phases 1, 4, 5, 6, 7, 8.

- [Date] — Example: "Completed Phase 1 tasks 1-2. Blocked on Firebase auth
  pending API keys. Next: password reset flow once auth is unblocked."

- 2026-09-29 — Spec update (no code): customer page redesigned as tap-to-open buttons with automatic
  icons and an adaptive grid; every button and social icon is individually removable via the
  Activate / Active control (blue when on, white with black border when off); owners enter links,
  numbers and addresses in fields with live validation; menu is now a manual builder (lists, items,
  price, optional "What's in it", tag, sold out) with no menu link and no images; removed the photo
  gallery everywhere, and removed Order online and Book now for café, salon and restaurant.
  Files changed: PRD.md 5.5, business-rules.md (limits, section 11 rules 10, 11, 17 to 21),
  security-and-reliability.md (4C limits and tests, uploads), schema.sql (plans seed, social_links
  shape, page_config note), admin-spec.md, legal-pages.md, brand-guide.md; new customer-page-ui-spec.md.

- 2026-09-30 — Spec update (no code): Pro plan is now ₹699 (was ₹999) and 1 location (was 3); only Enterprise has more
  than 1 location. Google review auto-reply is now plan-gated: Free, Pro and Enterprise have it, Starter does not.
  Added a `google_auto_reply` flag to each plan in the `plans` setting. Files changed: PRD.md (section 4, 5.4.3, 5.5.12),
  business-rules.md (sections 1, 6, 9), schema.sql (plans seed), admin-spec.md, PROGRESS.md.

- 2026-09-30 — Spec update (no code): Add location is now limited by the plan (disabled on Free, Starter, Pro; Enterprise only,
  enforced in the UI and on the server). `/pricing` now lists all tiers from `getPlans()` instead of a single plan.
  Files changed: PRD.md (section 5, 5.6), business-rules.md (section 1), cashfree-approval.md, PROGRESS.md.

- 2026-09-30 — Spec update (no code): custom link buttons are now available on every plan and for every business type
  with no plan limit (only the hard cap of 20 per location from security-and-reliability.md 4C). Order online and
  Book now can be added by owners as custom links. `plans.<plan>.page.custom_links` is now `null` everywhere.
  Files changed: PRD.md (5.5.3, 5.5.8, 5.5.10, 5.5.11, 5.5.12, config example), business-rules.md (section 1, 4, 5, rule 19),
  security-and-reliability.md (4C limits and tests), schema.sql (plans seed), PROGRESS.md.

- 2026-09-30 — Spec update (no code): Pro USD price set to $13.99 (was $19.99), keeping the same roughly 50 INR per USD ratio as Starter ($9.99 / ₹499). USD is display only until international billing is built. Files changed: PRD.md (section 4), PROGRESS.md.

- 2026-09-30 — Spec update (no code): when a business uses all its monthly scans, the customer side (QR, NFC, short link,
  AI text, feedback) now pauses with the neutral unavailable page until the count resets or the owner upgrades; previously the
  page kept working. Added lazy reset (`scan_reset_at`), one email per cycle (template 12), admin Reset scan count, and a
  per-IP quota-burn cap (proposal). Files changed: business-rules.md (section 1, rule 8), security-and-reliability.md
  (section 3), PRD.md (4, 5), email-templates.md, schema.sql, admin-spec.md, PROGRESS.md.

- 2026-09-30 — Spec update (no code): the scan-limit pause now stops everything, including Google auto-reply and the weekly email
  report (previously they kept running). Only the owner dashboard, billing and account emails stay available. Files changed:
  business-rules.md (sections 1 and 6), PRD.md (4, 5, 5.4.3), email-templates.md (template 12), PROGRESS.md.

- 2026-09-30 — Spec update (no code): Google review auto-reply is now set up through support in v1. Clicking it shows Contact support and a
  request form (name, business name, type of business, email linked to the Google Business Profile, phone) for Free, Pro and Enterprise;
  Starter sees "Please upgrade your plan". An admin activates it (`auto_reply_enabled` now defaults to 0). Self-serve on/off, templates
  and the Google connection tab are kept in the spec as later work (PRD.md 5.4.3A and 5.4.4). Files changed: PRD.md (4, 5.4, 5.4.3), business-rules.md
  (section 6), schema.sql (new `auto_reply_requests`), admin-spec.md, email-templates.md (13, 14), security-and-reliability.md (4D),
  privacy-policy.md, env.example.txt, PROGRESS.md.

- 2026-09-30 — Decisions recorded (no code): support contacts the owner by email or phone call within 48 hours (confirmed) and connects Google with
  them; Enterprise can use auto-reply (confirmed). Added the Connect Google button on the status card (shown only while the request is Contacted), the
  `contact_method` column and the matching security rules. Files changed: PRD.md (5.4, 5.4.3, 5.4.4), business-rules.md (6), schema.sql, admin-spec.md,
  security-and-reliability.md (4D), google-approval.md, PROGRESS.md.

- 2026-09-30 — Stage 1A T5 done: public landing page at `/` (hero, how it works,
  features, plan cards from lib/mock/plans.ts, Google-data block, support email,
  footer links to /privacy and /terms). All of T1-T5 are ticked, so 1A is
  complete and the loop stops at S1. Next step: 1B (public + legal + system
  pages) — not started.

- 2026-09-30 — Stage 1A T4 done: lib/mock/plans.ts (schema-shaped Free/Starter/
  Pro/Enterprise + display helpers) and lib/mock/site.ts (placeholder product
  and contact details). Next: T5 (landing page).

- 2026-09-30 — Stage 1A T3 done: Logo/Button/Card/Input/Section/Navbar/Footer
  added under components/, shown on the temporary kit page and verified; kit page
  deleted. Note: `next build` during a live managed dev server corrupts `.next`,
  so `freebuff-preview restart` is required after a build. Next: T4 (mock data).

- 2026-09-30 — Stage 1A T2 done: brand tokens in tailwind.config.ts and
  lib/brand/tokens.ts; temporary `/kit` page renders every token
  (`/_kit` is not routable in the App Router because `_` folders are private).
  Next: T3 (components).

- 2026-09-30 — Stage 1A layered build: added the "Layered Build Tracker"
  (Stages 1-8, substeps 1A-1F) plus the 1A checklist at the top of PROGRESS.md,
  after the agent rules. Completed T1: scaffolded a Next.js 15 (App Router) +
  TypeScript + Tailwind 3 project with `app/`, `components/`, `lib/mock/`,
  `lib/brand/` and the two Syehere SVGs copied into `public/brand/`. Verified
  `tsc -b --noEmit` and `next build`, and that the managed preview starts.
  Next: T2 (brand tokens). Docs live at the repo root (no `docs/` folder); the
  loop prompt's `docs/...` paths are treated as repo-root paths.

- 2026-09-30 — Stage 1B T1 done: shared legal page layout
  (`components/legal-page.tsx` + `LegalSection`) and the `/privacy` page built
  from privacy-policy.md with the google-approval.md section 8 Google-data
  wording. Mock legal/contact values live in `lib/mock/site.ts` as [BRACKET]
  placeholders and the shared Footer now shows the registered business name,
  support email and phone plus all 8 required policy links on every public page.
  Next: T2 (/terms and /payment-policy).

- 2026-09-30 — Stage 1B T2 done: `/terms` (all 8 items) and `/payment-policy`
  (all 6 items) built verbatim from legal-pages.md on the shared legal layout,
  keeping every [BRACKET] placeholder and the draft notice. Next: T3
  (/cancellation-policy and /refund-policy).

- 2026-09-30 — Stage 1B T3 done: `/cancellation-policy` (all 6 items) and
  `/refund-policy` (refund rules combined verbatim from the Payment and
  Cancellation drafts, plus the digital-service line) on the shared legal
  layout. Note: `next build` against a live managed dev server can leave a
  corrupt `.next` (`Invariant: no direct app page entry found for /_not-found`);
  `rm -rf .next` then rebuild fixes it. Next: T4 (/about, /contact, /pricing).

- 2026-09-30 — Stage 1B T4 done: `/about`, `/contact` and `/pricing` built per
  cashfree-approval.md section 1 and PRD.md 5.6. `/pricing` reads every price and
  limit from `lib/mock/plans.ts` and matches PRD.md section 4; Starter shows
  auto-reply as not included. Next: T5 (system pages + footer link check).

- 2026-09-30 — Stage 1B T5 done: branded `app/not-found.tsx`, `app/error.tsx`
  and `app/global-error.tsx` (friendly wording, short `error.digest` reference
  only, no `error.message`/stack, no console logging), verified against a
  production build with the managed preview temporarily on `npm run start`.
  Every required footer link resolves 200 on all public pages. Also set
  `poweredByHeader: false` in next.config.ts  (security doc 5A item 8). All of T1-T5 are ticked, so 1B is complete and the
  loop stops at S1. Next step: 1C (auth + onboarding UI) — not started.

- 2026-09-30 — Stage 1C T1 done: focused auth layout (`(auth)` route group) and
  `/login` with email, password show/hide, mock "Continue with Google",
  "Forgot password?" and signup links, plus the idle/submitting/wrong-credentials/
  too-many-attempts/generic-failure states driven by `lib/mock/auth.ts` (MOCK ONLY).
  Added `lib/validation.ts` and `components/{spinner,form-message,password-input,
  google-button}.tsx`. Navbar/landing "Sign in" now points at `/login`.
  Next: T2 (/signup and /forgot-password).

- 2026-09-30 — Stage 1C T2 done: `/signup` (email + password with an 8-character
  hint, "Create account", mock Google, Terms/Privacy line, link to `/login`;
  success goes to `/verify-email?email=…`) and `/forgot-password` (always the same
  generic reset message for any email). Added the shared `components/auth-card.tsx`
  and pointed the landing/navbar sign-up CTAs at `/signup`. Next: T3 (/verify-email).

- 2026-09-30 — Stage 1C T3 done: `/verify-email` ("Check your inbox", the
  address from `?email=` rendered server-side, Resend with a 30s visible cooldown
  and a generic confirmation, "I've verified my email" continuing to `/onboarding`
  on the mock success, "not seen yet" for `unverified@example.com`, and a
  change-email link). Next: T4 (/onboarding wizard shell + steps 1-2).

- 2026-09-30 — Stage 1C T4 done: `/onboarding` wizard shell (3-step progress,
  Back/Next, React-state-only draft), Step 1 (business name 100 / type / tagline
  120 with inline validation) and Step 2 (default logo from brand-guide.md presets
  via the new `components/business-logo.tsx`, or upload with client-side
  PNG/JPEG/WebP + 1 MB checks and no SVG, plus a live preview card in the preset
  colors). Added `lib/mock/business.ts` (schema-shaped `BusinessDraft`),
  `components/select.tsx` and `businessTypeLabels`. Next: T5 (Step 3 + completion).

- 2026-09-30 — Stage 1C T5 done: onboarding Step 3 (Google review URL, https-only
  + the section 4 host allowlist, clear messages) and the completion screen (QR
  placeholder "QR code: built in a later stage", the sample short link `/r/demo123`
  from the mock slug, "Go to dashboard" → `/dashboard`), with the mock save wired
  through `mockSaveBusiness`. All of T1-T5 are ticked, so 1C is complete and the
  loop stops at S1. Next step: 1D (customer review page) — not started.

- 2026-10-01 — Stage 1D T1 done: added `lib/brand/theme.ts` (`getBrandTheme`,
  exported from `lib/brand/index.ts`), `lib/mock/customer-page.ts` (four slug
  scenarios: demo123, demo-full, demo-salon, demo-paused) and `lib/mock/review.ts`
  (fake `generateReviewText` + `submitFeedback` with slow/ai_fail/rate-limit/
  failure triggers). `tsc -b --noEmit` and `next build` pass; theme table checked
  with a throwaway script. Next: T2 (/r/[slug] default + unavailable + not-found).
- 2026-10-01 — Stage 1D STOPPED at T2 (S6, docs unclear): security-and-reliability.md
  4B item 8 requires slugs to be validated against their "exact format (for example
  the nanoid alphabet and length)" before any lookup, but no exact alphabet/length
  is written in any doc, and the docs contradict themselves (examples are 6-char
  lowercase — `demo123`, `abc123` — while nanoid's default alphabet is
  `A-Za-z0-9_-` at length 21). The loop prompt says to STOP (S6) rather than invent
  a format. Also logged as open items: schema.sql has no `time_zone` column though
  PRD.md 5.4.1 / 5.5.7 need one (mock carries `time_zone`); no doc mentions
  `robots`/`noindex` for `/r/[slug]` (not set, pending a decision).

- 2026-10-01 — Owner decisions unblocked 1D: confirmed the exact slug format
  `^[a-z0-9]{6}$` (security-and-reliability.md 4B item 8), asked for
  `businesses.time_zone` in schema.sql, and asked to resolve noindex. Applied:
  `businesses.time_zone TEXT NOT NULL DEFAULT 'Asia/Kolkata'` added to
  schema.sql (PRD.md 5.4.1 / 5.5.7) and the `review_pages.slug` comment now
  records the format; mock slugs renamed `demo123/demo-full/demo-salon/
  demo-paused` -> `cafe01/full01/salon1/pause1` (and `MOCK_REVIEW_SLUG` ->
  `cafe01`) so they satisfy the format; `/r/[slug]` now sets
  `robots: noindex, nofollow` (owner content on our domain, no SEO value).
- 2026-10-01 — Stage 1D T2 done: `/r/[slug]` server route + neutral
  "temporarily unavailable" page + branded not-found, plus `lib/customer-page.ts`
  helpers and `components/customer-page/{icons,social-row,customer-page}.tsx`.
  `tsc -b --noEmit` + `next build` pass; verified on the preview that cafe01 /
  pause1 / unknown1 / BAD behave as expected. Next: T3 (happy path).
- 2026-10-01 — Stage 1D T3 done: happy path review screen
  (`components/customer-page/review-screen.tsx`) with skeleton, generated text,
  Copy + "Copied" status + clipboard fallback, Post to Google (validated URL),
  fallback template on AI failure, failed-URL friendly fallback, Turnstile
  placeholder and CSS-only confetti (reduced-motion aware). Added confetti CSS
  and a mock-only `?screen=` deep-link. Verified build/typecheck, SSR of the
  skeleton state, shipped bundle strings, and the generation/feedback logic via
  a throwaway script. Next: T4 (unhappy path + feedback + thank-you).
- 2026-10-01 — Stage 1D T4 done: unhappy path (Contact owner vs Continue to
  Google anyway), private feedback form (validation, live counter, honeypot,
  Turnstile placeholder, all four states) and the thank-you screen. Extracted
  BackButton + Confetti, added `validateFeedback()` to `lib/customer-page.ts`.
  Verified build/typecheck, the SSR screens, the invalid-URL branch and 37
  helper checks. Next: T5 (customized page).
- 2026-10-01 — Stage 1D T5 done: customized customer page — render-time adaptive
  button grid (re-flow proven at 0-5, then 7), announcement hidden after its end
  date, on-and-valid item filtering, per-button/per-type auto icons, Menu and
  Hours and contact screens, direct Call/WhatsApp/Directions links, custom link
  buttons (https only, cap 20) including on the thank-you page. Wi-Fi left out
  (Phase 4B-D). Verified build/typecheck, the routes and screens, and 17 checks
  in a throwaway script. All of 1D T1-T5 are ticked, but the Phase 3 and Phase
  4B tasks stay unchecked and annotated "UI done with mock data, backend
  pending". Loop stops at S1.

- 2026-10-01 — Stage 1E cold start complete, then STOPPED at T1 (S6, docs
  unclear). `npm install` (node_modules was missing), `npm run typecheck` and
  `npm run build` all pass; every 1A–1D route and required file confirmed present
  (/, /about, /contact, /pricing, /privacy, /terms, /payment-policy,
  /cancellation-policy, /refund-policy, /login, /signup, /forgot-password,
  /verify-email, /onboarding, /r/[slug]; app/not-found.tsx, app/error.tsx,
  app/global-error.tsx; lib/brand/tokens.ts, lib/brand/theme.ts (getBrandTheme),
  lib/mock/plans.ts, lib/mock/business.ts, lib/mock/customer-page.ts,
  components/logo.tsx, components/business-logo.tsx). Added the 1E T1–T5
  checklist below the 1D section. No 1E code written.
  Blocker: the dashboard "avg rating" / "rating average" (PRD 5.1, PRD 5) has no
  defined source — `feedback` has no rating column, no other table stores a star
  rating, and no doc says where the value comes from. T1(b) says to STOP (S6)
  rather than invent a schema column. Awaiting the owner's rating-source decision
  before building T1.

- 2026-10-01 — Stage 1E T1 done: `lib/mock/dashboard.ts` (deterministic 84-day
  scan_events + 40 feedback rows + the six `?demo=` scenarios), `lib/mock/demo.ts`
  (the one demo switch), `lib/dashboard/metrics.ts` (pure metrics; avg rating
  dropped per the owner's decision), and the dashboard shell
  (`app/(dashboard)/layout.tsx` + `components/dashboard/*`): responsive
  sidebar/rail/drawer, sticky top bar, skip link, scan-limit banner, upgrade card
  and 1F stubs. `tsc -b --noEmit` + `next build` pass; shell SSR verified for
  normal/limit/long-name and a 1F stub over HTTP. Next: T2 (/dashboard content).

- 2026-10-01 — Stage 1E T2 done: `/dashboard` content (header + actions, 3 stat
  cards with week-over-week deltas, 7-day scan bar chart with an accessible
  summary/table, positive-rate ring gauge, recent feedback max 5 + View all, plan
  status widget), every number derived from `lib/dashboard/metrics.ts`.
  `tsc -b --noEmit` + `next build` pass; gauge/plan/busiest-day spot-checked on
  the live preview. Next: T3 (states + banner + engagement extras).

- 2026-10-01 — Stage 1E T3 done: dashboard states (skeleton loading with matching
  dimensions, empty with "No data yet" + share-QR placeholder, per-section inline
  Retry error that re-renders the normal mock) and engagement extras (streak
  banner, review-of-the-week share with a clipboard fallback and "Copied"
  status). The scan-limit banner is confirmed on /dashboard, /feedback,
  /analytics and the 1F stubs in `?demo=limit`. `tsc` + build pass; all six
  scenarios checked over HTTP. Next: T4 (/feedback page).

- 2026-10-01 — Stage 1E T4 done: `/feedback` page (filter chips, top-bar search
  by message text, newest-first list with page size 10 + pagination, expandable
  plain-text detail with mailto and a Mark-as-replied mock state, plus
  empty/no-results/loading/error states). XSS and 1000-char messages verified as
  escaped plain text; `tsc` + build pass. Next: T5 (/analytics + end-to-end).

- 2026-10-01 — Stage 1E T5 done: `/analytics` (Scan count, Feedback intercepted,
  % positive cards with deltas; 7-day chart with the qr/nfc/link source split;
  positive-rate gauge) reusing the T2 components, plus empty/loading/error
  states. End-to-end pass: every dashboard route returns 200 in normal and limit,
  the limit banner persists, and View all → /feedback. Phase 4 UI-only items
  annotated "(UI done with mock data, backend pending)". `tsc` + build pass. All
  of 1E T1–T5 ticked — loop stops at S1. Next: 1F (Locations + Customer page
  editor + Billing + Settings) — not started.

- 2026-10-02 — Stage 1F cold start + reconcile: rebuilt the record from the repo.
  No 1F code, commit or branch exists on origin (a previous run's reported T1/T2
  was never pushed and is not recoverable), so the tracker had no 1F checklist
  and no Run Checkpoint — both were added from this run's evidence. 1F T1 done:
  `/locations` with the locations list (name, short link, scans, status),
  plan-gated Add location (exact disabled text + Contact us; enabled with two
  locations in `enterprise`), the Add location form (name + validateGoogleReviewUrl)
  issuing a new mock slug, and the Review links panel (Google link + Regenerate
  in place with the slug/QR note, non-scannable QR placeholder in the brand
  colour, distinct Short link / NFC tap link rows with Copy + "Copied", disabled
  PNG/PDF/SVG downloads). `tsc` + build pass; verified over HTTP for
  starter/free/pro/enterprise. Next: T2 (editor shell + preview).

- 2026-10-02 — Stage 1F T2 done: customer page editor shell. Added the shared
  Activate/Active control (PRD 5.5.3), the live phone preview that renders the
  real 1D public components from the editor draft (`customer-page-preview.tsx`),
  and `customer-page-editor.tsx` (top bar: enterprise-only location selector,
  Save / Discard / Reset to default with confirm, View live page, usage meters;
  unsaved guard on beforeunload + in-app link clicks; loading skeleton; error +
  inline Retry; page_custom_hidden banner; locked "Review buttons — Always
  shown" row; empty groups for T3/T4). Mock store for `page_config` + business
  social links added to `lib/mock/customer-page.ts` and the `page_custom_hidden`
  demo scenario added. Verified `tsc` + build, the editor states and meters over
  HTTP, the config-driven preview, and the 1D routes (cafe01/full01/salon1/
  pause1 200, malformed 404). Next: T3 (editor items + Pay button + docs).

- 2026-10-02 — Stage 1F T3 done: editor items + validation + Pay button. Added
  `lib/validation/page-config.ts` as the ONE hand-written validation module
  (link/social/phone/maps primitives moved from lib/customer-page.ts and
  re-exported; ui-spec 2.4 error texts; Pay rules with the owner-decision limits
  UPI 50 / name 30; `payLink()` = the only allowed upi://pay URL; save-blocking
  issue list), the editor rows (chips, announcement, thank-you, Call, WhatsApp,
  Directions, Pay now with the one-time warning, custom links, 5 social icons;
  amber badges; Save blocked with "Fix N items to save"), the Pay screen, and the
  renderer order (Pay now after Directions). Doc updates made in the same commit:
  PRD 5.5.4/5.5.5/5.5.13, security 4C (upi: MUST + caps 50/30), business-rules
  11 rule 22. Verified: 33-check validation script (all valid/invalid pairs
  pass), build + `tsc`, /r/full01 exactly 8 tiles in order (invalid/off items
  hidden), /r/full01?screen=pay link + Copy UPI ID + no app list, /r/cafe01 no
  Pay now. Next: T4 (Hours and contact + Menu builder + meters).

- 2026-10-02 — Stage 1F T4 done: Hours and contact + Menu builder + plan-limit
  meter (recorded after a cold-start reconcile of T1–T3, which were already
  committed). Added the MenuRow/HoursRow editor sections
  (`components/dashboard/menu-and-hours.tsx`), the shared
  namedMenuItemCount/isHoursShown/menuLimitIssue validation, the first-N clamp
  for the public menu (business-rules 11 rule 5), the `plan` field on the mock
  business, and the enterprise-only "Copy from another location". Verified
  `tsc` + build, a 15-check runtime script and HTTP (over-limit 65/60 blocks
  Save, free/pro meters, public full01/salon1 unchanged, first-N proven with a
  temporary limit=2 edit then reverted). Next: T5 (/billing).

- 2026-10-02 — Stage 1F T5 done: /billing. Added `lib/mock/billing.ts`
  (schema-shaped subscription / cancellation_requests / payment_attempts mock +
  the plan override that lib/mock/dashboard.ts reads), the shared mock re-auth
  dialog, and the billing screen (current plan card + details, plan comparison
  with the demo checkout, scheduled downgrade with usage warnings, invoice
  table/empty state, cancel flow with the exact confirmation text, scenario
  banners incl. Keep my plan). Verified `tsc` + build, an 8-check store script
  and HTTP on every billing scenario. Next: T6 (/settings) — needs the next
  prompt run (run stopped at S5; T6 and T7 remain).

- 2026-10-02 — Stage 1F T6 done: /settings tabs 1, 2 and 5. Added the settings
  mock store (`lib/mock/settings.ts`), the three tabs (Business profile;
  Appearance with the preset chips, custom colour inputs, live getBrandTheme
  preview and the plain-words contrast warning; Account & security with the mock
  re-auth flows, log out of all devices and the exact-business-name delete gate)
  and the shared plumbing (URL-driven tabs, skeleton + inline Retry, "Discard
  changes?" guard, mock account-deleted screen). The Auto-reply tab is next
  (T7). Verified `tsc` + build, a 6-check store script and HTTP for every tab
  plus loading/error. Next: T7 (auto-reply tab, request form, dashboard card)
  and the final 1F pass.

- 2026-10-02 — Stage 1F T7 done: Auto-reply (PRD 5.4.3 v1) + the final 1F pass.
  Added the schema-shaped mock request store (`lib/mock/auto-reply.ts`), the pure
  PRD 5.4.3 request-form validator (`lib/validation/auto-reply.ts`), the UI
  (`components/dashboard/auto-reply.tsx`: dashboard card, Settings tab, request
  screen), the shared discard-guard hook and the /settings/auto-reply/request
  route; 5 new `auto-reply-*` demo scenarios. Verified `tsc` + build, a 41-check
  runtime script and HTTP (plan gate per plan, all four statuses with the request
  date, the paused note at the scan limit, the disabled Connect Google
  placeholder, the request page form/gate/confirmation, the dashboard card, and
  the loading/error states). Final pass: 119/119 route × scenario sweep, every
  sidebar link 200, no 1F stub text left, 1D routes unchanged, and the Phase 4,
  4B and 5 items that are UI-only annotated "(UI done with mock data, backend
  pending)". All of 1F T1–T7 are ticked, so the loop stops at S1. Next step:
  Stage 2 (Database) — not started.

- 2026-10-02 — Git/CI workflow added (no app code): Stage 1F was reviewed and
  merged via PR #5 (its base is the Stage 1E baseline because `main` already
  carried the task commits), then GitHub Actions CI (`.github/workflows/ci.yml`:
  `npm ci`, `npm run typecheck`, `npm run build` on PRs into `main` and on
  `main` pushes), a PR template and the stage-branch rule landed via PR #6 with
  the first CI run green. Branch protection/rulesets are unavailable on this
  private repo's Free plan, so CI + the documented rule are the gate. Next:
  Stage 2 (Database) on a `feat/stage-2-*` branch opened as a PR into `main`.

- 2026-10-02 — Profile sync fix T1–T4 done (owner-reported: name/type/logo/
  colours changed in Settings or onboarding did not update the customer page,
  dashboard top bar or editor preview). Root cause: onboarding and /settings kept
  their own React/in-memory copies while every other screen read the static
  mock. Fix: ONE shared business profile in localStorage (`lib/mock/store.ts`:
  versioned key, getBusiness/saveBusiness/resetBusiness, storage-event
  subscribe, field validation with static-mock fallback, memory fallback when
  storage is full, canvas downscale for logos), a `lib/use-business.ts` hook
  layer (useBusiness/useMockBusiness/useMockSettings, post-mount reads so SSR and
  hydration use the static mock), onboarding writes the profile, /settings
  Business profile + Appearance read/write it (preset type change re-applies
  preset colours + default logo; custom colours/logo kept; "Reset demo data"
  button added), and every screen now reads the one place (dashboard shell,
  Dashboard, Locations, Analytics, Billing, editor + preview, /r/[slug] only for
  slug cafe01, completion screen, review wording), colours only via
  getBrandTheme. Verified: `tsc` + `npm run build` pass; 22-check store script
  pass; HTTP pass on the managed preview. Limitation: no headless browser, so
  the click-driven walk was traced by code path + store script, not driven.
  Next: unchanged — Stage 2 (Database) on a `feat/stage-2-*` branch.

- 2026-10-02 — Page-content sync fix (owner-reported: added buttons/announcement
  on /customer-page, saved, but "View live page" still showed the default
  Instagram + website only). Cause: Save wrote `page_config`/`social_links` to
  an in-memory map, and the new tab read the static mock. Fix: saved page
  content lives in localStorage (`syehere.mock.pages.v1`, one record per slug,
  sanitized on write and read with the same validators, 100 KB / 300-item caps,
  memory fallback on storage failure); the editor loads it per location and
  Save/Reset write it; the public page applies it after mount for the current
  business's slugs only (cafe01/cafe02), keeps admin-hidden pages hidden and
  recomputes announcement + "Open now"; the editor preview follows the social
  draft too. Verified: `tsc` + `npm run build` pass; 34-check store script and a
  composed render-path check pass (saved content -> Menu, Hours and contact,
  Call, announcement text, Facebook-only socials); HTTP routes all 200/404 as
  expected. No headless browser, so the click walk was traced by code path.

- 2026-10-03 — Dynamic business fix (owner-reported: onboarding showed
  `/r/cafe01` even for gym/restaurant, the live page always looked like the café,
  Locations always showed "Brew and Bean / syehere.co/cafe01 / 955 scans", both
  review-link rows showed cafe01, and the top-right avatar showed the name
  initial even after a logo upload). Fix (mock only, Stage 1 rules kept): the
  onboarding issues the permanent slug that belongs to the chosen business type
  (`lib/mock/business.ts`) instead of the café's, and the reserved slugs each got
  a static `/r/[slug]` page so the link resolves anywhere (the owner's browser
  overlays the saved profile after mount, hydration-safe). `lib/mock/locations.ts`
  now derives every location from the shared profile (name, slug, review link;
  sibling slugs keep the prefix, e.g. gym001→gym002; a saved business starts at
  0 scans while the café demo keeps 955/312; admin-hidden pages and the other
  demo businesses are never affected). The store carries the slug (validated,
  full01/salon1/pause1 can never be claimed) plus `hasStoredBusiness()` and a
  pure `businessOwnsSlug`; `/locations`, the editor list and the review-links
  panel use a new `useMockLocations` hook; the Review links panel prefills the
  profile's Google review link; the top bar avatar renders the uploaded logo
  (data:/https only) and falls back to the initial. A Settings note now says the
  slug never changes on a type change. Verified: `tsc` + `npm run build` pass;
  34-check runtime script pass; HTTP pass (six type slugs + the old demo slugs
  200 with the right business, pause1 unavailable, unknown 404, all dashboard
  routes 200, type pages use their own preset colours). No headless browser:
  the post-mount overlay was verified through the script, hydration safety is by
  construction (first render uses the default profile). Next: unchanged —
  Stage 2 (Database) on a `feat/stage-2-*` branch.

- 2026-10-11 — Loyalty program (owner request, step 1G, mock data only): added the rules engine, mock store, customer
  Loyalty card screens and the `/loyalty` owner dashboard, plus schema, business rules, PRD 5.7, email template 15 and a
  privacy-policy line. Defaults used where the owner had not answered yet (listed under Open decisions). Verified `tsc`,
  `next build`, 97 rule checks and two 20-check simulated-DOM walks. Real anti-fake protection needs Stage 3 (server);
  the Stage 3 TODO list is in the 1G checklist. Next: unchanged — Stage 2 (Database), including the loyalty tables.

- 2026-10-14 — AI dish photos, Phase 1 (mock) DONE (owner-approved feature, spec in
  AI_MENU_PHOTOS.md). Menu items can carry an approved AI photo: owner dialog (Add photo > Make photo >
  preview > Use this photo / Make another / Discard) in `components/dashboard/menu-photo-dialog.tsx`,
  thumbnail + full-screen viewer (Fit default, Fill screen, close, Escape, focus return, scroll lock)
  in `components/customer-page/menu-screen.tsx` and `photo-viewer.tsx`. Cost controls are mocked the
  way the real ones will work (`lib/ai-images.ts` shared rules + prompt builder; `lib/mock/ai-images.ts`
  browser ledger): plan allowance (Free 3 one-time, Starter 15, Pro 40, Enterprise 100; never
  unlimited), 10/day cap, 3 s cooldown, reserve-before-generate with refund on failure, dialog cannot be
  closed mid-generation. Photos are drawn placeholders (`components/menu-photo.tsx`); a dish named
  with "(fail)" simulates a provider failure. Also: `MenuImage` type + `isValidMenuImage` (our key only,
  never a URL; tampered localStorage is rejected), `plans.page.ai_images`, "AI dish photos" row on the
  pricing and billing cards, PhoneFrame now contains the full-screen viewer, schema.sql (businesses
  `ai_images_*` columns, `ai_image_jobs`, `ai_images` setting that ships OFF, plans seed), env.example
  (AI_IMAGE_*, R2_PUBLIC_DOMAIN), and PRD / business-rules / security / ui-spec updated (the old "no
  images" rules were reversed on purpose). Verified: `tsc` + `npm run build` pass; browser run
  (headless Chromium) passed: generate/approve, refund on failure, cooldown, mid-generation close
  blocked, out-of-credits state, save, public page thumbnail + viewer at 390 px and 1280 px, viewer
  contained in the dashboard phone preview, tampered image key rejected, no console errors; schema.sql
  runs in SQLite. NOT done (Phase 2, needs Stage 2/4): real provider, server credits, R2, rate limits,
  admin spend view, privacy/terms update; launch gates are in AI_MENU_PHOTOS.md section 11.

- 2026-10-14 — Loyalty card switch in the customer-page editor (owner request): the Buttons list now starts
  with a "Loyalty card" row (`LoyaltyRow` in `components/dashboard/customer-page-items.tsx`) whose Activate
  control flips the SAME program switch as Loyalty > Settings (`tryLoyalty` + `setProgram`), applied
  immediately — the tile is not a page_config button, so it stays out of the editor draft/Save/Discard.
  `components/dashboard/editor-item-row.tsx` gained an optional `disabled` (true until the post-mount store
  read, so SSR and first render match; SSR shows "Activate" disabled, then the real value). Docs: PRD 5.7
  bullet + customer-page-ui-spec 2.3 row. Verified: `tsc` passes; 6-check jsdom walk (row Active by default
  -> click turns the program off, row reads "Activate" -> /r/cafe01 hides the tile -> click back on -> tile
  returns); HTTP /customer-page 200 with the row, /loyalty and /r/cafe01 still 200. Next: unchanged —
  Stage 2 (Database).

- 2026-10-14 — Fair review funnel (owner request): the home review block is now thumbs up **Great** / thumbs
  down **Not great** (`ThumbsUpIcon` / `ThumbsDownIcon` in `components/customer-page/icons.tsx`), and BOTH
  thumbs open the SAME new chooser — `ChoiceScreen` (`components/customer-page/choice-screen.tsx`) with two
  equally weighted options, "Continue on Google" and "Contact the owner" (no dark patterns: nothing hidden or
  greyed out). "Continue on Google" opens `GoogleScreen`, where the plain **Post a review on Google** link is
  ALWAYS visible (replaced by the neutral message only when the URL is invalid, same rule as the review screen)
  next to the optional "Write it for me". That opens `DetailsScreen`: short questions per business type
  (`REVIEW_QUESTIONS` in `lib/mock/review.ts`; café = what did you have / how much did you spend / who were you
  with / what did you like most), every answer optional, "Write my review" enabled once at least one answer
  exists. The generated review is built ONLY from those answers (type openers/closers + answer lines; the
  generic template when nothing was answered) — nothing is invented — and Copy review + Post to Google are
  unchanged. "Contact the owner" opens the existing private form, now with a neutral heading ("What's on your
  mind?", was "What went wrong?"), an appreciation line ("We appreciate you taking the time to help us
  improve") and a matching thanks-screen message; the old `UnhappyOptions` screen is deleted as dead code.
  The `?screen=` deep-link list gained choice / google / details. Public copy that still sold the old
  dark-pattern flow was rewritten too: hero, steps and features on `/`, the About meta description and
  pillars, the onboarding phone mock, and the site description in `lib/mock/site.ts` ("unhappy ones never
  do" / "intercepted feedback" are gone). Docs: PRD 3.2 diagram + "fair by design" note, PRD 5.5.1 #1,
  PRD 3.1 wording, customer-page-ui-spec 1.1 / 1.2 + new 1.5 wireframing all four screens. Verified: `tsc` passes; 12-check jsdom walk passes (both thumbs reach the same chooser; direct
  Google button carries the exact href; café questions render; generated text contains the typed item and the
  chosen company/highlight; invalid URL hides the link but keeps the questions; feedback form opens with the
  appreciation line, thanks screen too); HTTP 200 on `/r/cafe01` home and every  `?screen=` deep link, plus
  `/loyalty`, `/pricing`, `/customer-page`, `/r/gym001`; `/`, `/about`, `/onboarding` and `/pricing` all 200
  with zero occurrences of the old copy. Next: unchanged — Stage 2 (Database).

- 2026-10-23 — Menu PDF import (owner request, 1I, Stage 1 mock): the Menu row now has an
  **Upload PDF / Type manually** switch (empty menus open on Upload), an upload panel with the 8 MB
  limit, plan item count and AI photos left, and a four-step dialog (pick/drop PDF -> labelled reading
  stages -> review with per-item checkboxes and list/item caps -> creating photos). Extraction is a
  clearly labelled demo per business type; upload validation, review, merge, limits, AI-photo
  reservation and save are real. Imported photos reserve one batch of
  `min(selected, plan credits, daily room)` credits and a failed batch refunds all of them. Rules live
  in `lib/menu-import.ts`; the dialog is `components/dashboard/menu-import-dialog.tsx`. Docs updated:
  PRD 5.5.6, business-rules 20, customer-page-ui-spec 2.5, AI_MENU_PHOTOS.md (batch + storage),
  security-and-reliability.md (upload/tenant/rate limit/retention), privacy-policy.md, legal-pages.md,
  admin-spec.md, schema.sql (`ai_image_jobs.batch_id`) and the new README. Production upload is
  direct-to-R2 with a signed URL, deleted within 24 hours; extraction and photo jobs are Stage 2/4 TODO.
  Verified: `tsc`, `npm run build`, `scripts/menu-import-check.ts` and `/customer-page` HTTP 200. No
  browser automation here, so the drag/drop-and-save click-through is not machine-tested.

- 2026-10-23 — Documentation reconciliation (no application code): refreshed the Run Checkpoint to
  Stage 1 complete (1A–1I) and logged the previously untracked menu-import work. Added the missing security rules for the menu PDF
  (direct-to-R2 signed upload, 8 MB, 40 pages, PDF magic bytes, 24-hour deletion, prompt-injection
  handling, import rate limit), account deletion/retention notes, the import flow in
  customer-page-ui-spec 2.5, batch tracking in
  AI_MENU_PHOTOS.md and schema.sql, and a project README. Verified:
  `schema.sql` executes in SQLite; no TypeScript or runtime code changed.

- 2026-10-27 — Repository cleanup: removed the obsolete dashboard screens, routes, components,
  data layer, rules, mock stores, scripts, schema objects and their dedicated specification documents.
  Kept the category lock, customer page, loyalty, feedback, analytics, billing and settings.
  Verified: `tsc`, `npm run build`, category-check (112), menu-import-check (283),
  loyalty-rules-check (97) and `schema.sql` in SQLite (24 tables, 1 trigger).

- 2026-11-06 — Pricing restructure (owner request): Starter is now ₹199 (was ₹499), Pro ₹299
  (was ₹699), and a new self-serve **Growth** plan sits between Pro and Enterprise at ₹499
  (1 location, 25,000 scans, 200 menu items, 60 AI photos/month, auto-reply on). Enterprise stays
  "Contact us" and remains the only plan with more than one location; Free is unchanged at ₹0.
  Updated `lib/mock/plans.ts` (the single source), the `plans` seed in `schema.sql`, the `?demo=`
  list (`growth`), billing plan ranking + paid-plan check, the pricing grids (5 cards, 3-up on
  desktop), and the PRD/business-rules/README tables and auto-reply plan lists. The PRD's USD
  figures are display-only approximations at the same ~₹50/$ ratio (international billing is
  deferred). Verified: `tsc`, `npm run build`, and `/pricing`, `/`, `/billing?demo=growth` and
  `/dashboard?demo=growth` all 200 with the new prices and the Growth plan present.

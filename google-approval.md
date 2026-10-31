# Google Approval Guide (Business Profile API + OAuth verification)

Single source of truth for everything Google requires before owners can connect their Google
Business Profile for auto-reply. Two SEPARATE approvals are needed, and both must pass:

1. **Business Profile API access** (gives the Cloud project quota; without it every call returns 429).
2. **OAuth app verification** (`business.manage` is a Google-classified *sensitive* scope; until the
   app is verified and published to Production, ordinary owners cannot grant access).

**v1 note:** owners do not connect Google themselves yet. They send a request through support (PRD.md 5.4.3); our team contacts them by email or phone call within 48 hours and guides them through the Connect Google step, so both approvals below are still required before anyone can be activated. The self-serve Connect button (PRD.md 5.4.4) is later work.

Google changes these processes. **Before applying, re-read the official pages** listed in section 9.
Anything an AI agent cannot do (forms, videos, domain/DNS, waiting on Google) is a manual owner task
and MUST be logged as `[BLOCKED: reason]` in PROGRESS.md Phase 0, never silently skipped.

---

## 1. Order of work (start the slow items first)

| # | Task | Who | Lead time |
|---|---|---|---|
| 1 | Confirm a Google Business Profile exists that is **verified, active for 60+ days**, with a **website listed on it** (can be your own office or a client you manage) | Owner | Up to 60+ days if none exists. This is the slowest gate |
| 2 | Buy the production domain, host it on Vercel, verify it in Google Search Console | Owner | 1 day |
| 3 | Publish the public marketing homepage + Privacy Policy + Terms on that domain (section 3) | Agent builds, owner reviews | Days |
| 4 | Create the Google Cloud project, note the **Project Number** | Owner | 10 min |
| 5 | Submit **"Application for Basic API Access"** (section 2) | Owner | Google review: commonly 5-14 days, sometimes longer |
| 6 | After approval: enable the APIs, create the OAuth client, configure the consent screen (sections 4, 5) | Owner | 1 hour |
| 7 | Record the demo video (section 7) | Owner | 1 hour |
| 8 | Publish the consent screen to Production, then submit for **OAuth verification** with the scope justification (section 6) | Owner | Google review: about 3-5 business days for sensitive scopes, longer if they ask questions |
| 9 | Build and test the connection flow with your own Google account as a **test user** (works while waiting) | Agent | n/a |

Tasks 1-8 are manual. The agent can do 3 and 9 only.

## 2. Basic API Access application (owner fills in)

- Form: Google Business Profile API contact form, dropdown **"Application for Basic API Access"**.
- Submit from an email that is an **owner or manager** of the Business Profile.
- You will need: Cloud **Project Number** (Cloud Console > Dashboard > Project info), the company
  website URL, the Business Profile details, and a short description of the use case:
  "Syehere is a SaaS that helps small businesses collect Google reviews and reply to them.
  Owners connect their own Business Profile with OAuth; we read reviews and post replies on their behalf."
- How to check status: Cloud Console > APIs & Services > the Business Profile APIs > Quotas.
  **0 requests/minute = not approved yet.** After approval it shows a normal quota (commonly 300 QPM).
- If nothing arrives after about 10 business days, resubmit and keep the case ID.
- Rejected: fix what Google names (usually the 60-day / website / complete-profile requirements) and re-apply.

## 3. What must exist publicly BEFORE OAuth verification

Google rejects verification if any of these is missing. `PRD.md` section 5.6 has the build spec.

1. **Homepage on a domain you own**, HTTPS, publicly reachable, no login wall. It must describe what
   Syehere does (not just a login page), show the app name and logo matching the consent screen,
   and link to the Privacy Policy (and Terms).
2. **Privacy Policy on the same domain**, linked from the homepage AND from the consent screen
   (same URL in both). It must contain the Google-data section in section 8.
3. **Authorized domain**: the domain (and the OAuth redirect URI host) is added on the consent
   screen and verified in Search Console. `localhost` and non-HTTPS URLs are rejected.
4. **In-product disclosure**: on the "Connect Google" screen, show a plain-language notice (copy in
   section 8) BEFORE the button, saying what is accessed and why.

## 4. Cloud project configuration (owner, after API access is approved)

Enable these APIs in APIs & Services > Library. The reviews API is private and only appears after
your Basic API Access is approved:
- **Google My Business API** (`mybusiness.googleapis.com`) : reviews and replies
- **My Business Account Management API** : list the owner's accounts
- **My Business Business Information API** : list locations

Credentials > Create credentials > **OAuth client ID** > type **Web application**.
- Authorized redirect URI: exactly `GOOGLE_REDIRECT_URI` (production HTTPS URL). Add a separate
  localhost URI only on a separate dev client, never on the production client.
- Put client ID and secret in env vars only.

## 5. OAuth consent screen (owner)

| Field | Value |
|---|---|
| User type | External |
| App name | Syehere (must match homepage and demo video) |
| Logo | Syehere icon (from the zip) |
| Support email | A monitored address on the production domain |
| Homepage | `https://<domain>/` |
| Privacy Policy | `https://<domain>/privacy` (same as linked on the homepage) |
| Terms | `https://<domain>/terms` (optional but recommended) |
| Authorized domains | `<domain>` |
| Developer contact | A monitored email; Google writes here during review |
| Scopes | `https://www.googleapis.com/auth/business.manage` (only). Add `openid email profile` only if you display the connected account email |
| Publishing status | **In production** (not "Testing") |

Notes: in Testing mode only listed test users can connect, and Google documents that refresh tokens
issued to Testing apps can expire after about 7 days, so never launch in Testing. Request the
narrowest scopes only; do not add any scope you do not use.

## 6. Scope justification text (paste into the verification form; edit to match reality)

> Syehere is a SaaS that helps small businesses collect and answer Google reviews. A business owner
> signs in to Syehere and clicks "Connect Google". We request `business.manage` so that, on the
> owner's behalf, we can (1) list the owner's Business Profile accounts and locations so they can
> choose which location to connect, (2) read that location's reviews, and (3) post a reply to a
> review, which is the core paid feature ("auto-reply"). The Business Profile API offers no narrower
> scope that allows reading reviews and posting replies. We use the data only to provide these
> user-facing features. We do not sell it, use it for advertising, or use it to train AI models.
> Review text is sent to an AI provider only to draft the reply, under terms that prohibit training on
> it. Owners can disconnect at any time inside Syehere or from their Google Account permissions, and
> we then delete the stored tokens.

## 7. Demo video script (owner records, screen capture, public or unlisted YouTube link)

Must show, in one continuous take, the SAME app and branding submitted for verification:
1. The public homepage, with the Privacy Policy link visible.
2. Sign in to Syehere and open Settings > Google connection.
3. The in-product disclosure text, then click **Connect**.
4. The **complete Google consent screen** in the browser, with the address bar showing the client ID
   in the URL, the app name, and the scope being requested; then click Allow.
5. Back in Syehere: connected state, the location picker, and choosing a location.
6. A review being detected and the reply being generated, then the reply posted (show it on the real
   Google listing or in the Syehere log).
7. Turning auto-reply off, and **Disconnect**.
Narrate in English or add English captions. Do not show secrets.

## 8. Privacy Policy: required Google-data section (draft; have a lawyer review)
The full Privacy Policy draft is in `privacy-policy.md`; this section is the Google-specific paragraph it includes.

Add to the Privacy Policy:

> **Google user data.** If you connect your Google Business Profile, Syehere accesses your Business
> Profile account and location names, and the reviews for the location you select, using the
> `business.manage` permission. We use this data only to show you your reviews and to post replies
> you have enabled. We store an encrypted access token and refresh token on our servers until you
> disconnect or delete your account. We do not sell Google user data, use it for advertising, or
> allow humans to read it except with your consent, to investigate abuse or security issues, or
> where required by law. Syehere's use and transfer of information received from Google APIs will
> adhere to the Google API Services User Data Policy, including the Limited Use requirements.
> To draft replies, the text and star rating of a review are sent to our AI providers (Groq and
> Google Gemini). They process it only to generate the reply and are not permitted to use it to
> train their models. You can disconnect in Settings, or revoke access at any time in your Google
> Account permissions. On disconnect or account deletion we delete stored tokens (and stored review
> data, if any) within [X] days. Contact: [support email].

In-product notice above the Connect button (short version):
> "Syehere will read your Google reviews and post replies for the location you choose. We only use
> this to power auto-reply. You can disconnect any time. See our Privacy Policy."

**Open point the owner must confirm before publishing this text:** the "not permitted to train"
sentence is only true if it matches the current terms of the exact Groq and Gemini plans used
(the Gemini free tier and paid tier differ in data use). Check them and adjust the wording; do not
publish a claim that is not true.

## 9. Official sources to re-check before each submission
- developers.google.com/my-business/content/prereqs (API access prerequisites and form)
- developers.google.com/my-business/content/basic-setup (APIs to enable)
- developers.google.com/my-business/content/implement-oauth (OAuth setup)
- support.google.com/cloud/answer/13464321 (verification requirements)
- developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- Google API Services User Data Policy

## 10. Connection flow rules (agent MUST implement)

1. **Authorize URL** parameters: `response_type=code`, `scope=business.manage` (plus `openid email` only if used),
   `access_type=offline`, `prompt=consent` (so Google always returns a refresh token),
   `include_granted_scopes` not needed, and a random **`state`** value bound to the owner's session
   (verify on callback, single use, 10-minute expiry) to block CSRF.
2. **Callback** `/api/auth/google/callback`: require a logged-in owner, verify `state`, exchange the code
   server-side, encrypt and store both tokens (AES-256-GCM, security doc section 4), and confirm the
   granted scope actually includes `business.manage`. Never log codes or tokens. Never return them to the browser.
3. **Do not confuse with Firebase "Sign in with Google"**. That login gives NO Business Profile access.
   Connecting is a separate explicit action from Settings.
4. **Account and location picker** after connecting: list accounts, then locations; the owner picks which
   location maps to which `review_pages` row (`gbp_location_name`). Free plan = 1 location, higher plans
   follow the plan's location limit. Never let a business map a location already mapped to another business.
5. **Reconnect handling**: if Google returns `invalid_grant` (owner revoked access, password change, token
   expired) or a 401/403 that a refresh cannot fix, set `google_connection_status = 'needs_reconnect'`,
   pause auto-reply, show a banner in the dashboard, and send the owner one email (not one per cron run).
6. **Disconnect**: re-auth within 10 minutes (existing rule), call Google's token revocation endpoint for the
   refresh token, delete stored tokens, clear the mapped locations, turn auto-reply off.
7. **Account deletion or cancellation**: revoke and delete tokens too.
8. **Rate limits and errors**: back off on 429; a 429 on every call usually means Basic API Access is not
   approved yet, so show the internal admin a clear "Google API access not approved" health flag, not a
   generic error.
9. **AI transfer limits**: send only star rating, reviewer first name and review text to the AI provider.
   Never send the reviewer's profile photo, email or any other Google field. Do not store review text
   longer than needed to post the reply (keep only review id, rating, replied-at).
10. **Scope minimalism**: request only `business.manage`. Adding scopes later triggers re-verification.

---

## 11. Verification submission checklist (have all of this ready before you click Submit)

1. **Submitter role:** submit from a Google account with **Owner or Editor** on the Cloud project. The project's
   "Developer contact" emails must be monitored; Google's reviewers write there and a missed reply can lead to rejection.
2. **Branding:** upload a square logo (Google's consent-screen limit is about 1 MB; use the recommended 120x120 px or larger square).
   The app name and logo must match the homepage and the demo video exactly. Do not use another company's name or Google branding.
3. **Domain proof:** the homepage domain and every redirect URI host are listed under Authorized domains, and the domain is
   verified in Search Console by the same Google account that owns the project.
4. **OAuth client:** type Web application; the redirect URI is the production HTTPS callback; if the front end starts the flow from a
   different origin, add it under Authorized JavaScript origins. No localhost or IP addresses on the production client.
5. **Reviewer test access (important because Syehere is behind a paywall and login):** create a demo login that Google's reviewer
   can use without paying, with all features unlocked (see PROGRESS.md Phase 8). Put the login instructions in the "additional
   information" box of the form. Do not use a real customer's account. Keep it working until verification finishes.
6. **Homepage check:** open it in a private window while logged out; it must load, describe the product, and link to the Privacy
   Policy without any sign-in.
7. **Scope justification and video link** (sections 6 and 7) pasted into the form; the video is public or unlisted, not private.
8. **Scope class:** as far as I know `business.manage` is a *sensitive* scope (standard verification, no third-party security
   assessment). If Google's current scope list shows it as *restricted*, an annual security assessment would be required. Check the
   scope table on the consent screen page before submitting.
9. **After submitting:** reply to every Google email quickly, fix exactly what they name, and resubmit. Do not change the scopes,
   app name or domain while a review is open.
10. **After approval:** adding a scope, changing the app name/logo/domain, or a major change in data use can trigger re-verification.
    Keep the consent screen, homepage and Privacy Policy consistent with what the app really does.

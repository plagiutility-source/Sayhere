# Provider Reference — For the Coding Agent

This file is written for the AI model doing the build, not for a human
clicking through dashboards.

**How to use this file:** It's unknown whether the build platform can browse
live URLs during the build. So each section below gives:
1. A working code pattern you can build from directly, even with no browsing.
2. Links to the provider's official docs (prioritizing `llms.txt` where
   available) to verify against or go deeper, if your platform can fetch them.

The code patterns below are correct as of this writing (September 2026), but
package versions and method signatures can drift — if you *can* browse, check
the linked docs before finalizing; if you can't, proceed with these patterns
and flag anything that fails at build/runtime rather than silently guessing
a fix.

---

## Firebase (Auth)

**Code pattern — verifying a client's session server-side (Next.js API route):**
```ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// In a route handler, given an ID token from the client's Authorization header:
const decodedToken = await getAuth().verifyIdToken(idToken);
const firebaseUid = decodedToken.uid; // trust THIS, never a client-supplied uid
```

**Client-side login (React):**
```ts
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);

await signInWithEmailAndPassword(auth, email, password);
await sendPasswordResetEmail(auth, email); // forgot-password flow
```

Docs: https://firebase.google.com/docs/auth · https://firebase.google.com/docs/admin/setup

---

## Turso (Database)

**Code pattern:**
```ts
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Always scope by business_id — never trust a client-supplied one
const result = await db.execute({
  sql: "SELECT * FROM feedback WHERE business_id = ? ORDER BY created_at DESC",
  args: [businessId],
});
```

Running `schema.sql` against the database (one-time setup, via CLI):
```bash
turso db shell <database-name> < schema.sql
```

Docs: **https://docs.turso.tech/llms.txt** (full docs, agent-formatted) ·
https://docs.turso.tech/sdk/ts/quickstart

Note: Turso natively supports one-database-per-tenant as an alternative to
the shared-table model used in `schema.sql` — worth surfacing to whoever's
running this build before scaling, per the note at the bottom of `schema.sql`.

---

## Resend (Email)

**Code pattern:**
```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Syehere <noreply@yourdomain.com>", // must be on a verified domain
  to: ownerEmail,
  subject: "Your Weekly Report",
  html: weeklyReportHtml, // build from email-templates.md content
});
```

Docs: **https://resend.com/docs/llms.txt** (full docs) ·
**https://resend.com/docs/llms-full.txt** (everything in one file) ·
https://resend.com/docs/send-with-nextjs

Note: a sending domain must be verified with DNS records before production
use — that's a manual step a human has to complete, the agent can't do it.
Flag it rather than assume it's done.

---

## Cloudflare R2 (Storage)

**Code pattern (S3-compatible SDK):**
```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

await r2.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: `logos/${businessId}.png`,
  Body: fileBuffer,
  ContentType: "image/png",
}));
```

**Menu PDFs:** do not proxy them through the app route (Vercel's body limit is 4.5 MB). Create a
short-lived signed PUT with `getSignedUrl(new PutObjectCommand(...), { expiresIn: 300 })` for a random
`menu-imports/<businessId>/<key>.pdf`, return only the URL and key to the authenticated owner, then
HEAD-check the object before extraction and delete it after. Keep the bucket private and add a
24-hour lifecycle rule as a backstop. See security-and-reliability.md section 4.

Docs: **https://developers.cloudflare.com/r2/llms.txt** ·
https://developers.cloudflare.com/r2/api/s3/api/

---

## QR Code Generation (with logo overlay)

Not a hosted provider — generate server-side with the `qrcode` npm package,
then composite the business's logo/icon on top with `sharp`. Encode ONLY the
permanent slug URL (e.g. `https://syehere.co/r/{slug}`), never the raw Google
review URL — see schema.sql `review_pages` comment and business-rules.md
section 9 for why this must stay dynamic.

**Code pattern:**
```ts
import QRCode from "qrcode";
import sharp from "sharp";

// 1. Generate the base QR as a PNG buffer, high error-correction so the
//    center logo overlay doesn't break scannability.
const qrBuffer = await QRCode.toBuffer(`https://syehere.co/r/${slug}`, {
  errorCorrectionLevel: "H",
  width: 800,
  margin: 2,
  color: {
    dark: primaryColor,   // business's primary_color, falls back to brand-guide.md default
    light: "#FFFFFF",
  },
});

// 2. Composite the business's logo (or default vector icon) in the center.
//    Keep the overlay under ~20% of the QR's area — beyond that, even
//    level-H error correction can't reliably decode.
const logoSize = 160; // ~20% of 800px
const finalQr = await sharp(qrBuffer)
  .composite([{ input: logoBuffer, top: (800 - logoSize) / 2, left: (800 - logoSize) / 2 }])
  .png()
  .toBuffer();

// 3. Upload finalQr to Cloudflare R2 (see R2 section above), store the
//    resulting URL in review_pages.qr_code_url.
```

**Download formats** (per PRD.md 5.3): the PNG above covers digital use
directly. For PDF, wrap the same PNG in a simple print-ready layout (e.g. via
`pdf-lib`, sized for a table tent or receipt sticker). For SVG, use
`QRCode.toString(url, { type: "svg" })` instead of `toBuffer` — note the logo
overlay is harder to composite cleanly in SVG; simplest path is layering an
`<image>` element with the logo as a base64 data URI inside the SVG output.

Docs: https://www.npmjs.com/package/qrcode ·
https://sharp.pixelplumbing.com/

---

## Groq (AI — primary) + Gemini (fallback)

**Code pattern (Vercel AI SDK — same interface for both, makes fallback simple):**
```ts
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";

async function generateReviewText(prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
      prompt,
    });
    return text;
  } catch (err) {
    // Fallback per business-rules.md section 6
    const { text } = await generateText({
      model: google(process.env.GEMINI_MODEL ?? "gemini-1.5-flash"),
      prompt,
    });
    return text;
  }
}
```

Packages: `ai`, `@ai-sdk/groq`, `@ai-sdk/google`

**Menu PDF extraction:** the Groq models used here are text-only. Do not send the PDF to Groq; use
Gemini's PDF input for the one extraction call, validate the returned JSON with zod, then delete the
object (security-and-reliability.md section 4). This is separate from AI dish-photo generation, which
uses the configured image provider (AI_MENU_PHOTOS.md).

Docs: https://console.groq.com/docs/quickstart ·
https://ai.google.dev/gemini-api/docs/quickstart ·
https://vercel.com/docs/ai/groq (native Vercel↔Groq marketplace integration,
auto-syncs `GROQ_API_KEY` if used)

---

## Cashfree (Payments — India)

**Verified webhook signature method (confirmed against current docs — this
replaces the earlier "conceptual" version):**

Cashfree sends two headers on every webhook: `x-webhook-signature` (HMAC-SHA256,
Base64-encoded) and `x-webhook-timestamp`. Verification: concatenate
`timestamp + rawBody` (the **raw, unparsed** request body — parsing first
breaks the signature match), HMAC-SHA256 it with your secret key, Base64-encode
the result, and compare to the header.

**Preferred: use the official SDK's built-in verifier rather than hand-rolling it:**
```ts
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION, // or CFEnvironment.SANDBOX
  process.env.CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!
);

// In the webhook route, with access to the RAW body string (not parsed JSON):
try {
  cashfree.PGVerifyWebhookSignature(
    req.headers["x-webhook-signature"],
    rawBody,
    req.headers["x-webhook-timestamp"]
  );
  // valid — safe to process
} catch (err) {
  // invalid signature — reject with 400, do not process
}
```

**Manual fallback, only if the SDK method isn't usable in your setup:**
```ts
import crypto from "crypto";

function verifyCashfreeWebhook(rawBody: string, signature: string, timestamp: string): boolean {
  const signatureData = timestamp + rawBody; // must be the exact raw body
  const expected = crypto
    .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET!)
    .update(signatureData)
    .digest("base64");
  return expected === signature;
}
```

Critical implementation note: capturing the **raw request body** requires
configuring your framework not to auto-parse it before this check runs (e.g.
in Express, use a `verify` callback on the JSON body-parser to stash the raw
buffer). If you parse-then-restringify, the signature will not match even
with correct logic.

**IP allowlisting (optional but recommended for defense-in-depth):**
| Environment | IPs |
|---|---|
| Sandbox | 52.66.25.127, 15.206.45.168 |
| Production | 52.66.101.190, 3.109.102.144, 18.60.134.245, 18.60.183.142 |
| Port | 443 |

Then branch on event type:
- `SUBSCRIPTION_PAYMENT_SUCCESS` → mark subscription active, reset grace period
- `SUBSCRIPTION_PAYMENT_FAILED` → start 3-day grace period, send warning email
- `SUBSCRIPTION_STATUS_CHANGED` → sync local `subscriptions.status`

Docs: **https://www.cashfree.com/docs/llms.txt** ·
https://www.cashfree.com/docs/payments/subscription/webhook-signature ·
https://www.cashfree.com/docs/payments/subscription ·
https://www.cashfree.com/docs/payments/online/webhooks/configure

Note: multiple API versions are live simultaneously in Cashfree's docs
(e.g. `2023-08-01`, `2025-01-01`) — confirm which version's payload shape is
being implemented against and set `CASHFREE_API_VERSION` to match.

---

## Google Business Profile API (Auto-Reply to Reviews)

**Read `google-approval.md` first.** It is the single source of truth for approvals, consent screen,
verification, demo video, privacy wording and the connection-flow rules. Summary:

- Two separate Google approvals are needed: (1) **Basic API Access** for the Cloud project (needs a verified
  Business Profile active 60+ days with a website), and (2) **OAuth verification** of the app (the scope is
  *sensitive*). Enabling the API in Cloud Console does NOT grant access; quota stays 0 (calls return 429)
  until approved.
- Required OAuth scope (only this one): `https://www.googleapis.com/auth/business.manage`
- APIs to enable: Google My Business API (reviews; appears only after approval), My Business Account
  Management API, My Business Business Information API.
- OAuth client type: **Web application**; authorize URL uses `access_type=offline`, `prompt=consent`, and a
  single-use `state` value.
- The app must be published to Production (not Testing) with a public homepage, Privacy Policy on the same
  domain, and a demo video, or ordinary owners cannot connect.

**Code pattern (conceptual flow):**
```ts
// 1. OAuth redirect per business owner (one-time), storing the encrypted refresh token
// 2. Owner picks the Business Profile account + location (mapped to review_pages.gbp_location_name)
// 3. In the daily cron job:
const reviews = await getNewReviewsOlderThan24Hours(businessId);
for (const review of reviews) {
  if (!review.hasReply) {
    const replyText = await generateReviewReply(review); // Groq -> Gemini fallback
    await postReplyToGoogle(businessId, review.id, replyText);
  }
}
// On invalid_grant / unrecoverable 401-403: mark needs_reconnect, pause auto-reply, email once.
```
Confirm the current review-list and reply endpoint paths and API version in Google's docs at build time.

Docs: https://developers.google.com/my-business/content/overview ·
https://developers.google.com/my-business/content/prereqs ·
https://developers.google.com/my-business/content/basic-setup ·
https://developers.google.com/my-business/content/implement-oauth ·
https://developers.google.com/identity/protocols/oauth2

**Manual human steps (mark `[BLOCKED: reason]` in PROGRESS.md Phase 0; the agent cannot do these):**
API access application, consent screen setup, domain verification, demo video, verification submission.

---

## Vercel (Hosting + Cron)

**vercel.json:**
```json
{
  "crons": [
    { "path": "/api/cron/weekly-report", "schedule": "0 9 * * 1" },
    { "path": "/api/cron/auto-reply", "schedule": "0 10 * * *" }
  ]
}
```

**Cron route pattern (Next.js App Router), protecting against public calls:**
```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... do the work
  return NextResponse.json({ ok: true });
}
```

Docs: https://vercel.com/docs/cron-jobs · https://vercel.com/docs/cron-jobs/quickstart

Note: Free/Hobby tier limits cron jobs to once-per-day frequency — the
patterns above assume daily triggers, consistent with `business-rules.md`
section 6.

---

## Cross-cutting notes for the agent

- All provider API keys come from `.env.example` — never hardcode a key or
  invent a placeholder value that looks real.
- The code patterns above were verified against current provider
  documentation as of this writing (September 2026) and are safe to build
  from directly, including the Cashfree webhook verification. Package
  versions can still drift over time — if the build platform can fetch the
  linked docs, a final check before shipping is good practice, especially for
  anything payment-related.
- If a provider requires a manual human step that can't be completed by the
  agent (business KYC, DNS verification, API access approval), state that
  clearly in `PROGRESS.md` as `[BLOCKED: reason]` rather than silently
  stubbing it out.

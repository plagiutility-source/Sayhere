# Privacy Policy (Draft) — Syehere

**DRAFT. Must be reviewed by a lawyer before publishing (India DPDP Act 2023 and any other markets you sell in).
Fill every [BRACKET]. Publish at `https://<domain>/privacy`, linked from the homepage, footer and the Google consent screen.**

Last updated: [DATE]

## 1. Who we are
Syehere ("we", "us") is operated by [LEGAL NAME / BUSINESS NAME], [REGISTERED ADDRESS], [COUNTRY].
Contact for privacy questions and requests: [SUPPORT EMAIL].

## 2. Who this covers
- **Business owners** who sign up to Syehere ("you").
- **Customers** of those businesses who scan a QR code or tap an NFC tag and use a business's review page or leave private feedback.
For customer data, the business owner decides why it is collected; we process it for them to provide the service.

## 3. What we collect
**From business owners**
- Account details: name, email address, login credentials (handled by Firebase Authentication; we do not store your password).
- Business details: business name, type, tagline, logo, brand colours, location names, Google review link, social links, and the content you add to your customer page (menu, prices, offers, hours, contact details, Wi-Fi details).
- Category and onboarding proof: your locked business category (`food`, `hotel` or `general`), the category name you typed to confirm it, business address, city, PIN code, business phone, and a proof number by category (FSSAI licence for food; number of rooms plus GSTIN or a local trade/tourism licence for hotel; optional GSTIN for other businesses). These are format-checked; we do not claim a number is government-verified.
- Billing: plan, subscription status and payment references. Card and UPI details are handled by Cashfree; we never see or store full card numbers.
- Auto-reply setup request (only if you ask us to set it up): your name, business name, business type, the email linked to your Google Business Profile, and your phone number. We use it only to contact you and set up auto-reply.
- Settings and usage: auto-reply settings and templates, feedback you view, scan counts, and audit logs of important actions.
- Google connection (only if you connect it): see section 4.

**From customers of a business**
- Private feedback you choose to submit: the message and any contact details you type in.
- Anonymous usage data: a scan or button-tap counter. We create a **one-way hashed visitor identifier** from technical details (such as IP address and browser type) plus a daily changing salt. We do **not** store your raw IP address.
- Loyalty card (only if you join a business's loyalty program): your email address (to confirm it is you and to keep your card), your stamps and rewards with the date and which staff member confirmed them. The business that runs the program can see this. We use the email only for the loyalty card, not for marketing. You can ask the business, or us, to delete your card; your email is then removed.
- Strictly necessary technical data such as security logs.

We do not sell personal data. We do not use it for advertising.

## 4. Google user data (Business Profile connection)
[Paste the "Google user data" paragraph from google-approval.md section 8, final wording after the AI-provider check.]
In short: if you connect Google, we read the names of your Business Profile accounts and locations, and the reviews of the location you choose, and post replies you have enabled, using the `business.manage` permission. Syehere's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. Access tokens are stored encrypted and deleted when you disconnect or delete your account. You can also revoke access any time at https://myaccount.google.com/permissions.

## 5. How we use data
- To provide the service: review pages, QR/NFC links, dashboard, feedback notifications, weekly reports, auto-replies.
- To generate text with AI: AI-written review suggestions use only the business type/name and star context. AI-written replies to Google reviews use the review's star rating, reviewer first name and review text.
- To read a menu PDF and create dish photos: the uploaded PDF (which may contain business information) is sent to our PDF-capable AI provider only to extract the menu. Dish photos are generated from the item name and description. We do not use this data to train models. The PDF is deleted immediately after extraction and in any case within 24 hours. We do **not** send customers' private feedback or owner account/personal data to AI providers for these tasks.
- To bill you, prevent abuse and fraud, secure the service, and meet legal duties.
- To contact you about your account, service changes and support.
We do not use Google user data to train AI models or for advertising.

## 6. Who we share data with (processors)
We use these providers to run the service, only as needed for the purposes above:
| Provider | Purpose |
|---|---|
| Google Firebase | Login and sessions |
| Turso | Database |
| Cloudflare (R2) | Logo and QR storage, plus temporary menu PDFs (deleted within 24 hours) |
| Vercel | Hosting and scheduled jobs |
| Upstash | Rate limiting |
| Resend | Sending emails |
| Cashfree | Payments and subscriptions |
| Groq and Google Gemini | AI text generation, menu PDF extraction and AI dish photos (see section 5) |
| Google (Business Profile API) | Only if you connect your Google Business Profile |
[Adjust to the final stack.] We may also disclose data if required by law or to protect rights and safety. If we are sold or merge, data may transfer to the new owner under the same protections.
**International transfers:** some providers store data outside your country. [Lawyer to confirm the transfer basis wording for India and your other markets.]

## 7. How long we keep data
- Account and business data: while your account is active.
- Menu PDFs: deleted immediately after extraction and in any case within 24 hours; never stored with the customer page.
- Onboarding proof (business address, phone, licence or registration numbers): kept while the account exists and deleted with it.
- Anonymous scan and page events: deleted after 90 days.
- If a paid plan ends: your account moves to the Free plan and data is kept; extra locations beyond the Free limit are switched off and deleted after [RETENTION_DAYS_AFTER_CANCEL, default 90] days.
- Google tokens: deleted when you disconnect, cancel or delete your account. [Deleted within X days.]
- When you delete your account: your data and files are permanently deleted, except records we must keep by law (for example payment and tax records) [lawyer to confirm periods].
- Backups: [state the backup retention and that deleted data leaves backups within X days].

## 8. Security
HTTPS everywhere, encrypted Google tokens (AES-256-GCM), access controls that keep every business's data separate, rate limiting, and hashed visitor identifiers. No system is perfectly secure.
**Data breach:** if a personal data breach affects you we will notify affected users and the authorities as required by applicable law [lawyer to confirm exact timelines and wording under the DPDP Act].

## 9. Your rights and choices
You can access, correct or delete your data, withdraw consent, and disconnect Google at any time in Settings. Customers can ask the business, or us at [SUPPORT EMAIL], to delete feedback they submitted. We respond within [X] days. [Lawyer to add the rights and grievance-officer details the DPDP Act and other applicable laws require, including a named grievance contact.]

## 10. Cookies
We use only strictly necessary cookies: a secure login session cookie (and a separate one for admin staff). We do not use advertising cookies. [If you later add analytics, update this section and add a consent notice.]

## 11. Children
Syehere is for businesses and is not directed at children under [18 / local age]. We do not knowingly collect their data. [Lawyer to review DPDP rules on children's data for customer-facing pages.]

## 12. Changes
We will post updates here with a new date, and notify owners by email for material changes, especially anything affecting how Google user data is used.

## 13. Contact
[LEGAL NAME], [ADDRESS], [SUPPORT EMAIL], [GRIEVANCE OFFICER NAME AND EMAIL].

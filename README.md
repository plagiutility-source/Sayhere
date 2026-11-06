# Syehere

A review funnel, customer page and loyalty card for local businesses. This is the **Stage 1
frontend**: every screen works against browser mock data. There is no database, auth backend, AI
provider or payment gateway yet.

Every business has one locked category — Restaurant & Café (`food`), Hotel (`hotel`) or Other
business (`general`) — chosen once at sign-up.

## Requirements

- Node.js 20 LTS (or newer)
- npm (the repo uses `package-lock.json`; do not switch package managers)
- No environment variables or accounts are needed to run the demo.

## Run it

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. The dashboard is at `/dashboard`; the sidebar links to Feedback,
Analytics, Locations, the customer page, Loyalty, Billing and Settings.

Production build:

```bash
npm run build
npm start
```

## Demo data

Data is stored in this browser only (`localStorage`), one copy per `?demo=` scenario, so a
refresh keeps your changes and another browser starts from the seed. Add `?demo=` to a
dashboard URL:

| Scenario | What it shows |
|---|---|
| `normal` (default) | Café on Starter with 12 weeks of activity |
| `empty` | Brand-new business, zero scans and feedback |
| `loading` / `error` | Skeleton and failure states |
| `limit` | Scan limit reached; customer side paused |
| `free` / `starter` / `pro` / `growth` / `enterprise` | The same café on each plan |
| `long-name` | Long business name and email overflow |
| `over-limit` | 65 menu items after a downgrade to Starter |
| `cancel-pending` / `cancel-finalized` / `past-due` | Billing lifecycle states |
| `page_custom_hidden` / `auto-reply-*` | Admin-hide and auto-reply request states |

Loyalty and AI-photo credits have their own `syehere.mock.*` keys. To reset, clear site data for
`localhost:3000` (or just that key) and reload.

The menu PDF import is a labelled demo: it validates the PDF and runs the real review,
limit, photo-reservation and save flow, but returns a sample menu instead of calling AI.
No PDF or customer data leaves the browser.

## Routes

- `/customer-page` — public-page editor, including menu PDF import and AI photo mock
- `/loyalty` — stamp card, rewards, staff and members
- `/billing` — Syehere subscription (mock checkout and cancellation)
- `/r/[slug]` — public review/customer page (try `/r/cafe01`)
- `/dashboard`, `/feedback`, `/analytics`, `/locations`, `/settings`

## Checks

```bash
npm run typecheck
npm run build
npx tsx scripts/menu-import-check.ts
npx tsx scripts/category-check.ts   # text match, proofs and the category lock
npx tsx scripts/loyalty-rules-check.ts
```

The scripts print `N passed` / `N checks passed` and exit non-zero on failure.
`schema.sql` is the **target** Turso schema for Stage 2; the preview does not read it. If you
have the SQLite CLI installed, you can check that it still parses with
`sqlite3 :memory: < schema.sql`.

## Documentation

- [PRD.md](PRD.md) — product requirements
- [business-rules.md](business-rules.md) — binding behaviour rules
- [schema.sql](schema.sql) — target database schema
- [security-and-reliability.md](security-and-reliability.md) — security, uploads, retention
- [customer-page-ui-spec.md](customer-page-ui-spec.md) — editor and public-page wireframes
- [AI_MENU_PHOTOS.md](AI_MENU_PHOTOS.md) — AI photo costs, batch import and launch gates
- [PROGRESS.md](PROGRESS.md) — build tracker and session log
- [env.example.txt](env.example.txt) — variables needed only for later stages

Nothing here is production-ready: payments, email, auth, storage and AI calls are all mock
or not built. See `PROGRESS.md` for the Stage 2 next step.

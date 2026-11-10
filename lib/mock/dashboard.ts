/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * Fake dashboard data for the mock café ("Brew and Bean"). Field names match
 * schema.sql exactly so Stage 4 can swap these arrays for real queries with no
 * renaming:
 * - `feedback`: sentiment (positive|negative), message, customer_email,
 *   google_review_left, owner_replied, created_at (plus id / business_id /
 *   review_page_id, which are not displayed).
 * - `scan_events`: source (qr|nfc|link), created_at.
 *
 * The 4th dashboard metric from PRD.md 5.1 ("avg rating") is intentionally NOT
 * built for v1: no doc defines where a star rating comes from and schema.sql has
 * no rating column (owner decision 2026-10-01, logged in PROGRESS.md).
 *
 * Everything is generated deterministically from a fixed `MOCK_NOW` so the
 * values a screen shows always equal what `lib/dashboard/metrics.ts` computes
 * (no drift between builds or between server and client).
 */

import { businessPresets } from "@/lib/brand/tokens";
import { MOCK_REVIEW_SLUG } from "@/lib/mock/business";
import { getMockPlanOverride } from "@/lib/mock/billing";
import { plans, type PlanId } from "@/lib/mock/plans";
import type { DemoScenario } from "@/lib/mock/demo";

export type FeedbackSentiment = "positive" | "negative";
export type ScanSource = "qr" | "nfc" | "link";

export type MockFeedback = {
  id: string;
  business_id: string;
  review_page_id: string;
  sentiment: FeedbackSentiment;
  message: string | null;
  customer_email: string | null;
  google_review_left: 0 | 1;
  owner_replied: 0 | 1;
  created_at: string;
};

export type MockScanEvent = {
  id: string;
  business_id: string;
  review_page_id: string;
  source: ScanSource;
  created_at: string;
};

export type MockPlanStatus = {
  plan: PlanId;
  scans_used: number;
  /** `null` = unlimited (Enterprise). */
  scan_limit: number | null;
  locations_used: number;
  /** `null` = unlimited (Enterprise). */
  location_limit: number | null;
  /** ISO date; the next moment `scans_used` resets to 0. */
  scan_reset_at: string;
};

export type MockDashboardBusiness = {
  id: string;
  name: string;
  business_type: "cafe";
  tagline: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  color_source: "preset";
  slug: string;
  /** Display-only; schema.sql keeps the email on the Firebase user, not here. */
  owner_email: string;
};

export type DashboardMock = {
  scenario: DemoScenario;
  business: MockDashboardBusiness;
  status: MockPlanStatus;
  /** The plan row (limits/prices) — the only place plan numbers come from. */
  plan: (typeof plans)[PlanId];
  scans: MockScanEvent[];
  feedback: MockFeedback[];
  /** Simulated states (see PRD.md 5.2). */
  loading: boolean;
  error: boolean;
};

/** Fixed clock for the mock so every derived number is stable. */
export const MOCK_NOW = new Date("2026-10-01T12:00:00.000Z");

const DAY_MS = 86_400_000;
const BUSINESS_ID = "biz_brew_and_bean";
const REVIEW_PAGE_ID = `page_${MOCK_REVIEW_SLUG}`;

const cafe = businessPresets.cafe;

const mockCafe: MockDashboardBusiness = {
  id: BUSINESS_ID,
  name: "Brew and Bean",
  business_type: "cafe",
  tagline: cafe.tagline,
  logo_url: null,
  primary_color: cafe.primary,
  secondary_color: cafe.secondary,
  color_source: "preset",
  slug: MOCK_REVIEW_SLUG,
  owner_email: "owner@brewandbean.example",
};

/** The `long-name` scenario's overflowing business + email. */
const mockLongNameCafe: MockDashboardBusiness = {
  ...mockCafe,
  id: "biz_long_name",
  name: "The Extraordinarily Long Named Artisan Coffee Roastery and Bakery Collective of Bandra West",
  owner_email:
    "owner-of-the-extraordinarily-long-named-artisan-coffee-roastery@brewandbean.example",
};

// ---------------------------------------------------------------------------
// Deterministic generation
// ---------------------------------------------------------------------------

/** Small seeded PRNG (mulberry32) so the dataset never changes between runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WINDOW_DAYS = 84; // 12 weeks of history (PRD asks for 60–90 days).

function dayStart(offsetDays: number): number {
  return MOCK_NOW.getTime() - offsetDays * DAY_MS;
}

function pickSource(rng: () => number): ScanSource {
  const roll = rng();
  if (roll < 0.68) return "qr";
  if (roll < 0.88) return "nfc";
  return "link";
}

function generateScans(rng: () => number): MockScanEvent[] {
  const scans: MockScanEvent[] = [];
  for (let d = 0; d < WINDOW_DAYS; d++) {
    const base = dayStart(d);
    const dow = new Date(base).getUTCDay();
    const weekendBoost = dow === 0 || dow === 6 ? 12 : 0;
    // Last week slightly busier than the week before, so deltas are positive.
    const recentBoost = d < 7 ? 7 : d < 14 ? 3 : 0;
    const noise = Math.round(rng() * 8) - 4;
    const count = Math.max(4, 26 + weekendBoost + recentBoost + noise);
    for (let s = 0; s < count; s++) {
      const minutes = Math.floor(rng() * 1440);
      scans.push({
        id: `scan_${d}_${s}`,
        business_id: BUSINESS_ID,
        review_page_id: REVIEW_PAGE_ID,
        source: pickSource(rng),
        created_at: new Date(base - minutes * 60_000).toISOString(),
      });
    }
  }
  return scans;
}

const NEGATIVE_MESSAGES = [
  "Waited twenty minutes for a cold brew and the order came out wrong.",
  "Great coffee but the seating area was not clean during our visit.",
  "The staff was polite but my cappuccino was lukewarm.",
  "Lovely place, but the music was far too loud for a morning visit.",
  "My sandwich arrived after my friends had already finished eating.",
  "Decent food, but the table wobbled and nobody offered to fix it.",
];

/**
 * One long (1000-char) message and one `<script>` payload are included on
 * purpose: T4's verification renders both as literal text without breaking the
 * layout, and PRD's acceptance test uses the script string (security 4).
 */
const SCRIPT_MESSAGE = "<script>alert(1)</script>";
const LONG_MESSAGE =
  "A very detailed note for the owner. " +
  "The espresso was well pulled and the pastries were fresh, but the queue moved slowly and there was nowhere to sit while waiting. ".repeat(
    6,
  ).slice(0, 1000);

const POSITIVE_EMAILS = [
  "priya.sharma@example.com",
  "arjun.mehta@example.com",
  "neha.iyer@example.com",
  null,
];

function generateFeedback(rng: () => number): MockFeedback[] {
  const rows: MockFeedback[] = [];

  const push = (row: Omit<MockFeedback, "business_id" | "review_page_id">) => {
    rows.push({ ...row, business_id: BUSINESS_ID, review_page_id: REVIEW_PAGE_ID });
  };

  // 34 generated rows across the window. Negatives are kept at least 5 days
  // old so the "no negative reviews" streak reads as a real stretch, while
  // still leaving plenty pending for the Pending-feedback card and /feedback.
  for (let i = 0; i < 34; i++) {
    const positive = rng() < 0.68;
    const d = positive
      ? Math.floor(rng() * WINDOW_DAYS)
      : 5 + Math.floor(rng() * (WINDOW_DAYS - 5));
    const minutes = Math.floor(rng() * 1440);
    const created = new Date(dayStart(d) - minutes * 60_000).toISOString();
    const recent = d < 7;
    if (positive) {
      push({
        id: `fb_pos_${i}`,
        sentiment: "positive",
        message: null,
        customer_email: POSITIVE_EMAILS[i % POSITIVE_EMAILS.length],
        google_review_left: rng() < 0.85 ? 1 : 0,
        owner_replied: recent ? 0 : 1,
        created_at: created,
      });
    } else {
      push({
        id: `fb_neg_${i}`,
        sentiment: "negative",
        message: NEGATIVE_MESSAGES[i % NEGATIVE_MESSAGES.length],
        customer_email: rng() < 0.5 ? `customer${i}@example.com` : null,
        google_review_left: 0,
        // Most older negatives were handled; the newest few still need a reply.
        owner_replied: recent && i % 2 === 0 ? 0 : d < 14 && i % 3 === 0 ? 0 : 1,
        created_at: created,
      });
    }
  }

  // Special rows: anonymous, script payload, 1000-char message, long email.
  push({
    id: "fb_special_anonymous",
    sentiment: "negative",
    message: "Nobody followed up on the missing item from my last order.",
    customer_email: null,
    google_review_left: 0,
    owner_replied: 0,
    created_at: new Date(dayStart(5) - 3600_000).toISOString(),
  });
  push({
    id: "fb_special_script",
    sentiment: "negative",
    message: SCRIPT_MESSAGE,
    customer_email: "reviewer@example.com",
    google_review_left: 0,
    owner_replied: 0,
    created_at: new Date(dayStart(6) - 7200_000).toISOString(),
  });
  push({
    id: "fb_special_long",
    sentiment: "negative",
    message: LONG_MESSAGE,
    customer_email: "long.message.writer.with.a.very.long.address@example.com",
    google_review_left: 0,
    owner_replied: 0,
    created_at: new Date(dayStart(7) - 1800_000).toISOString(),
  });

  // Newest first.
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

const ALL_SCANS = generateScans(mulberry32(20261001));
const ALL_FEEDBACK = generateFeedback(mulberry32(42139));

function scansInLastDays(days: number): number {
  const cutoff = MOCK_NOW.getTime() - days * DAY_MS;
  return ALL_SCANS.filter((s) => new Date(s.created_at).getTime() >= cutoff).length;
}

/**
 * Plan per scenario: the plan scenarios pick their own plan; every other
 * scenario keeps the mock café on Starter. `over-limit` is Starter *after a
 * downgrade* — a page with more menu items than the Starter limit (T4). The
 * `auto-reply-*` scenarios run on Growth so the plan includes auto-reply (T7);
 * Pro deliberately does not (2026-11-09 pricing restructure).
 */
export function planForScenario(scenario: DemoScenario): PlanId {
  // A mock upgrade on /billing (lib/mock/billing.ts) wins over the scenario's
  // starting plan, so limits unlock everywhere the mock is read.
  const override = getMockPlanOverride(scenario);
  if (override) return override;
  switch (scenario) {
    case "free":
      return "free";
    case "pro":
      return "pro";
    case "growth":
      return "growth";
    case "enterprise":
      return "enterprise";
    case "auto-reply-pending":
    case "auto-reply-contacted":
    case "auto-reply-on":
    case "auto-reply-paused":
    case "auto-reply-closed":
      return "growth";
    default:
      return "starter";
  }
}

/**
 * The mock business's plan + cycle counts. Scans used is the (deterministic)
 * count over the last 30 days, kept just under the plan limit; the `limit` and
 * `auto-reply-paused` scenarios push it to the limit so the banner and paused
 * state can be seen.
 */
function buildStatus(
  scenario: DemoScenario,
  scans: MockScanEvent[],
  plan: (typeof plans)[PlanId],
): MockPlanStatus {
  const scanLimit = plan.monthly_scans;
  const cutoff = MOCK_NOW.getTime() - 30 * DAY_MS;
  const usedLast30 = scans.filter(
    (s) => new Date(s.created_at).getTime() >= cutoff,
  ).length;
  const atLimit = scenario === "limit" || scenario === "auto-reply-paused";
  const scansUsed =
    scanLimit === null ? usedLast30 : atLimit ? scanLimit : Math.min(scanLimit - 1, usedLast30);

  return {
    plan: plan.id,
    scans_used: scansUsed,
    scan_limit: scanLimit,
    // The Enterprise scenario has a second location (lib/mock/locations.ts).
    locations_used: scenario === "enterprise" ? 2 : 1,
    location_limit: plan.locations,
    scan_reset_at: "2026-11-01",
  };
}

/**
 * The one place demo scenarios are turned into dashboard data. `loading` and
 * `error` keep the same underlying rows so Retry/re-render can show the normal
 * state without refetching.
 */
export function getDashboardMock(scenario: DemoScenario = "normal"): DashboardMock {
  const empty = scenario === "empty";
  const planId = planForScenario(scenario);
  const plan = plans[planId];
  const scans = empty ? [] : ALL_SCANS;
  const feedback = empty ? [] : ALL_FEEDBACK;

  return {
    scenario,
    business: scenario === "long-name" ? mockLongNameCafe : mockCafe,
    status: empty
      ? {
          plan: plan.id,
          scans_used: 0,
          scan_limit: plan.monthly_scans,
          locations_used: 1,
          location_limit: plan.locations,
          scan_reset_at: "2026-11-01",
        }
      : buildStatus(scenario, scans, plan),
    plan,
    scans,
    feedback,
    loading: scenario === "loading",
    error: scenario === "error",
  };
}

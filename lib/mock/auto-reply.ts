/**
 * MOCK ONLY, replaced in Stage 4.
 *
 * `auto_reply_requests` rows (schema.sql) behind the v1 support-setup flow
 * (PRD.md 5.4.3). Field names match the table (`owner_name`, `business_name`,
 * `business_type`, `google_account_email`, `phone`, `status`, `created_at`) and
 * the stored status values mirror it too: pending | contacted | active | closed
 * (owners see "On" for `active`, the PRD's wording).
 *
 * Keyed by demo scenario like the other mocks, so the `auto-reply-*` scenarios
 * show each state and a submitted request survives remounts. Stage 4 replaces
 * this module with real rows, the admin flow (admin-spec.md) and emails 13/14.
 */

import type { BusinessType } from "@/lib/brand/tokens";
import { MOCK_NOW } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";

export type AutoReplyRequestStatus =
  | "pending"
  | "contacted"
  | "active"
  | "closed";

export type MockAutoReplyRequest = {
  id: string;
  business_id: string;
  owner_name: string;
  business_name: string;
  business_type: BusinessType;
  google_account_email: string;
  phone: string;
  status: AutoReplyRequestStatus;
  /** How support reached the owner; set when marked contacted (admin-spec.md). */
  contact_method: "email" | "phone" | null;
  created_at: string;
  updated_at: string;
};

/** The request-form fields (PRD.md 5.4.3); all stored on the schema row. */
export type MockAutoReplyRequestDraft = {
  owner_name: string;
  business_name: string;
  business_type: BusinessType;
  google_account_email: string;
  phone: string;
};

const BUSINESS_ID = "biz_brew_and_bean";

/** One seed row per `auto-reply-*` demo scenario (fixed dates, like MOCK_NOW). */
function seedRequest(
  status: AutoReplyRequestStatus,
  createdAt: string,
): MockAutoReplyRequest {
  return {
    id: `arr_mock_${status}`,
    business_id: BUSINESS_ID,
    owner_name: "Ananya Rao",
    business_name: "Brew and Bean",
    business_type: "cafe",
    google_account_email: "brewandbean.reviews@gmail.com",
    phone: "+919820012345",
    status,
    contact_method: status === "pending" ? null : "email",
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const SEEDS: Partial<Record<DemoScenario, MockAutoReplyRequest>> = {
  "auto-reply-pending": seedRequest("pending", "2026-09-30T09:30:00.000Z"),
  "auto-reply-contacted": seedRequest("contacted", "2026-09-28T09:30:00.000Z"),
  "auto-reply-on": seedRequest("active", "2026-09-20T09:30:00.000Z"),
  "auto-reply-paused": seedRequest("active", "2026-09-20T09:30:00.000Z"),
  "auto-reply-closed": seedRequest("closed", "2026-09-10T09:30:00.000Z"),
};

const store = new Map<DemoScenario, MockAutoReplyRequest>();

/** The scenario's request row, or `null` when the owner has not asked yet. */
export function getMockAutoReplyRequest(
  scenario: DemoScenario,
): MockAutoReplyRequest | null {
  const existing = store.get(scenario);
  if (existing) return existing;
  const seed = SEEDS[scenario] ?? null;
  if (seed) store.set(scenario, seed);
  return seed;
}

/** Pending or Contacted: PRD 5.4.3 — no second request while one is open. */
export function isOpenAutoReplyRequest(
  status: AutoReplyRequestStatus,
): boolean {
  return status === "pending" || status === "contacted";
}

/** Owner-facing status label (PRD.md 5.4.3; `active` shows as "On"). */
export function autoReplyStatusLabel(
  status: AutoReplyRequestStatus,
): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "contacted":
      return "Contacted";
    case "active":
      return "On";
    case "closed":
      return "Closed";
  }
}

/**
 * Submit the request form (PRD.md 5.4.3): creates one `pending` row. While an
 * open request exists it is returned unchanged; a `closed` request is replaced,
 * because after Closed the owner can send a new one.
 */
export function submitMockAutoReplyRequest(
  scenario: DemoScenario,
  draft: MockAutoReplyRequestDraft,
): MockAutoReplyRequest {
  const existing = getMockAutoReplyRequest(scenario);
  if (existing && isOpenAutoReplyRequest(existing.status)) return existing;

  const now = MOCK_NOW.toISOString();
  const row: MockAutoReplyRequest = {
    id: `arr_mock_${scenario}`,
    business_id: BUSINESS_ID,
    ...draft,
    status: "pending",
    contact_method: null,
    created_at: now,
    updated_at: now,
  };
  store.set(scenario, row);
  return row;
}

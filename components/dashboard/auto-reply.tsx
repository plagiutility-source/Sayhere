"use client";

/**
 * Auto-reply — PRD.md 5.4.3 (v1: request setup through support) with the plan
 * gate from business-rules.md 6 and the paused note from business-rules.md 1.
 *
 * Three entry points share these pieces:
 * - `AutoReplyCard` — the "Google review auto-reply" card on /dashboard.
 * - `AutoReplyTab` — Settings → Auto-reply.
 * - `AutoReplyRequestScreen` — the request form page
 *   (/settings/auto-reply/request), opened from Contact support.
 *
 * Request rows live in lib/mock/auto-reply.ts; the plan gate comes from
 * `plans[<plan>].google_auto_reply` (lib/mock/plans.ts). No OAuth: the Connect
 * Google button is the disabled v1 placeholder (PRD.md 5.4.4) and the form
 * stores nothing (Stage 4 wires the real submit, admin flow and emails 13/14).
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { businessTypeLabels } from "@/lib/brand/tokens";
import { normalizeCategory } from "@/lib/category/features";
import { TYPES_BY_CATEGORY } from "@/lib/category/types";
import { formatLongDate } from "@/lib/dashboard/metrics";
import {
  autoReplyStatusLabel,
  getMockAutoReplyRequest,
  isOpenAutoReplyRequest,
  submitMockAutoReplyRequest,
  type MockAutoReplyRequest,
  type MockAutoReplyRequestDraft,
} from "@/lib/mock/auto-reply";
import { planForScenario } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { plans, type Plan } from "@/lib/mock/plans";
import { staticMockSettings } from "@/lib/mock/settings";
import { useMockSettings } from "@/lib/use-business";
import { MAX_BUSINESS_NAME_LENGTH, MAX_EMAIL_LENGTH } from "@/lib/validation";
import {
  MAX_AUTO_REPLY_OWNER_NAME_LENGTH,
  MIN_AUTO_REPLY_NAME_LENGTH,
  validateAutoReplyRequest,
  type AutoReplyRequestErrors,
} from "@/lib/validation/auto-reply";
import { useDiscardGuard } from "./discard-guard";

const primaryButtonClass =
  "inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

// ---------------------------------------------------------------------------
// Shared content blocks (no outer card: the tab and the request page wrap them)
// ---------------------------------------------------------------------------

/** PRD.md 5.4.3: the exact Starter message, with no form and no Contact support. */
function UpgradePrompt({ scenario }: { scenario: DemoScenario }) {
  return (
    <div>
      <p className="text-[13px] text-ink">
        {"Google review auto-reply is available on the Pro plan. Please upgrade your plan."}
      </p>
      <Link
        href={`/billing?demo=${scenario}`}
        className={`mt-4 ${primaryButtonClass}`}
      >
        Upgrade plan
      </Link>
    </div>
  );
}

/** PRD.md 5.4.3: Free, Pro, Growth and Enterprise see this instead of a form. */
function ContactSupportPrompt({ scenario }: { scenario: DemoScenario }) {
  return (
    <div>
      <p className="text-[13px] text-ink">
        {"We set up Google review auto-reply with you. Contact support and our team will get it running."}
      </p>
      <Link
        href={`/settings/auto-reply/request?demo=${scenario}`}
        className={`mt-4 ${primaryButtonClass}`}
      >
        Contact support
      </Link>
    </div>
  );
}

/** The status card shown while a request exists (PRD.md 5.4.3). */
function StatusCard({
  scenario,
  request,
  atScanLimit,
}: {
  scenario: DemoScenario;
  request: MockAutoReplyRequest;
  atScanLimit: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 items-center rounded-full border border-black/10 bg-surface-muted px-2 text-[12px] font-medium text-ink">
          {autoReplyStatusLabel(request.status)}
        </span>
        <p className="text-[12px] text-ink-muted">
          Requested on {formatLongDate(request.created_at)}
        </p>
      </div>

      {request.status === "pending" ? (
        <p className="mt-3 text-[13px] text-ink-muted">
          Our team will contact you within 48 hours and set it up with you.
        </p>
      ) : null}

      {request.status === "contacted" ? (
        <>
          <p className="mt-3 text-[13px] text-ink-muted">
            Our team has reached out. When you are ready, we connect your Google
            account with you.
          </p>
          {/* PRD.md 5.4.4: until platform API access is approved this button is
              the disabled placeholder — no OAuth flow is started here. */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled className={primaryButtonClass}>
              Connect Google
            </button>
            <p className="text-[12px] text-ink-muted">
              Google auto-reply is being enabled
            </p>
          </div>
        </>
      ) : null}

      {request.status === "active" ? (
        <p className="mt-3 text-[13px] text-ink-muted">
          {"Google review auto-reply is on. Replies are posted 24 to 48 hours after a review, never instantly."}
        </p>
      ) : null}

      {request.status === "closed" ? (
        <div className="mt-3">
          <p className="text-[13px] text-ink-muted">
            This request is closed. You can send a new request any time.
          </p>
          <Link
            href={`/settings/auto-reply/request?demo=${scenario}`}
            className={`mt-4 ${primaryButtonClass}`}
          >
            Send a new request
          </Link>
        </div>
      ) : null}

      {/* business-rules.md 1: everything pauses while the scan limit is reached. */}
      {atScanLimit && request.status === "active" ? (
        <p className="mt-3 text-[12px] text-ink-muted">
          Auto-reply is paused while your scan limit is reached. It resumes
          automatically when your scans reset.
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry point 1 — the /dashboard card (PRD.md 5.4.3).
// ---------------------------------------------------------------------------

function cardStatusText(
  plan: Plan,
  request: MockAutoReplyRequest | null,
): string {
  if (!plan.google_auto_reply) {
    return `Not included on the ${plan.name} plan.`;
  }
  if (!request) return "Not set up yet. Ask our team to turn it on.";
  switch (request.status) {
    case "pending":
      return "Request sent. Our team will contact you within 48 hours.";
    case "contacted":
      return "Support has contacted you. Setup is in progress.";
    case "active":
      return "On — replies are posted 24 to 48 hours after a review.";
    case "closed":
      return "This request is closed. You can request it again.";
  }
}

export function AutoReplyCard({
  scenario,
  plan,
}: {
  scenario: DemoScenario;
  plan: Plan;
}) {
  const request = useMemo(() => getMockAutoReplyRequest(scenario), [scenario]);
  return (
    <Card title="Google review auto-reply">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          {cardStatusText(plan, request)}
        </p>
        <Link
          href={`/settings?demo=${scenario}&tab=auto-reply`}
          className={secondaryButtonClass}
        >
          Manage auto-reply
        </Link>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Entry point 2 — Settings → Auto-reply (the tab).
// ---------------------------------------------------------------------------

export function AutoReplyTab({
  scenario,
  plan,
  atScanLimit,
}: {
  scenario: DemoScenario;
  plan: Plan;
  atScanLimit: boolean;
}) {
  const request = useMemo(() => getMockAutoReplyRequest(scenario), [scenario]);
  return (
    <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <h2 className="text-[15px] font-medium">Google review auto-reply</h2>
      <div className="mt-3">
        {!plan.google_auto_reply ? (
          <UpgradePrompt scenario={scenario} />
        ) : request ? (
          <StatusCard
            scenario={scenario}
            request={request}
            atScanLimit={atScanLimit}
          />
        ) : (
          <ContactSupportPrompt scenario={scenario} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry point 3 — the request form page (PRD.md 5.4.3).
// ---------------------------------------------------------------------------

function RequestForm({
  scenario,
  onSubmitted,
}: {
  scenario: DemoScenario;
  onSubmitted: (request: MockAutoReplyRequest) => void;
}) {
  // MOCK ONLY, removed in Stage 4: the static mock while the page hydrates,
  // then the shared profile after mount (same pattern as `/settings`).
  const profile = useMockSettings(scenario);
  // Category gate: the request form may only offer types inside the locked
  // category. Unknown values fail closed to `general`.
  const typeOptions = TYPES_BY_CATEGORY[
    normalizeCategory(profile.business_category)
  ];
  const initial = useMemo<MockAutoReplyRequestDraft>(() => {
    return {
      owner_name: "",
      business_name: profile.name,
      business_type: profile.business_type,
      google_account_email: "",
      phone: "",
    };
  }, [profile.name, profile.business_type]);
  const [draft, setDraft] = useState<MockAutoReplyRequestDraft>(() => {
    const fallback = staticMockSettings(scenario);
    return {
      owner_name: "",
      business_name: fallback.name,
      business_type: fallback.business_type,
      google_account_email: "",
      phone: "",
    };
  });
  const [errors, setErrors] = useState<AutoReplyRequestErrors>({});

  // After the post-mount profile read, prefill the two business fields once.
  useEffect(() => {
    setDraft((current) => ({
      ...current,
      business_name: profile.name,
      business_type: profile.business_type,
    }));
  }, [profile.name, profile.business_type]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useDiscardGuard(dirty);

  function update<K extends keyof MockAutoReplyRequestDraft>(
    key: K,
    value: MockAutoReplyRequestDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateAutoReplyRequest(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmitted(submitMockAutoReplyRequest(scenario, draft));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          label="Your name"
          value={draft.owner_name}
          maxLength={MAX_AUTO_REPLY_OWNER_NAME_LENGTH}
          onChange={(event) => update("owner_name", event.target.value)}
          error={errors.owner_name}
          hint={`${MIN_AUTO_REPLY_NAME_LENGTH} to ${MAX_AUTO_REPLY_OWNER_NAME_LENGTH} characters.`}
        />
        <Input
          label="Business name"
          value={draft.business_name}
          maxLength={MAX_BUSINESS_NAME_LENGTH}
          onChange={(event) => update("business_name", event.target.value)}
          error={errors.business_name}
          hint={`${MIN_AUTO_REPLY_NAME_LENGTH} to ${MAX_BUSINESS_NAME_LENGTH} characters.`}
        />
        <Select
          label="Type of business"
          value={draft.business_type}
          onChange={(event) =>
            update(
              "business_type",
              event.target.value as MockAutoReplyRequestDraft["business_type"],
            )
          }
        >
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {businessTypeLabels[type]}
            </option>
          ))}
        </Select>
        <Input
          label="Registered email ID linked with your Google Business Profile"
          type="email"
          value={draft.google_account_email}
          maxLength={MAX_EMAIL_LENGTH}
          onChange={(event) => update("google_account_email", event.target.value)}
          error={errors.google_account_email}
          hint="The Google account email you used to create your Google Business Profile."
        />
        <Input
          label="Phone number"
          value={draft.phone}
          maxLength={16} // 15 digits + the optional leading +
          onChange={(event) => update("phone", event.target.value)}
          error={errors.phone}
          hint="7 to 15 digits, with an optional + at the start."
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
        <button type="submit" className={primaryButtonClass}>
          Send request
        </button>
        <Link
          href={`/settings?demo=${scenario}&tab=auto-reply`}
          className={secondaryButtonClass}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function RequestConfirmation({ scenario }: { scenario: DemoScenario }) {
  return (
    <div>
      <p className="text-[13px] text-ink">
        {"Request received. Our team will contact you within 48 hours."}
      </p>
      <Link
        href={`/settings?demo=${scenario}&tab=auto-reply`}
        className={`mt-4 ${primaryButtonClass}`}
      >
        Back to Auto-reply
      </Link>
    </div>
  );
}

export function AutoReplyRequestScreen({
  scenario,
}: {
  scenario: DemoScenario;
}) {
  const plan = useMemo(() => plans[planForScenario(scenario)], [scenario]);
  const [request, setRequest] = useState<MockAutoReplyRequest | null>(() =>
    getMockAutoReplyRequest(scenario),
  );
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="max-w-3xl">
      <header>
        <Link
          href={`/settings?demo=${scenario}&tab=auto-reply`}
          className="text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          ← Back to Auto-reply
        </Link>
        <h1 className="mt-2 text-[20px] font-medium leading-[1.3] text-ink">
          Google review auto-reply
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Our team sets this up with you. This demo stores nothing.
        </p>
      </header>

      <div className="mt-5 rounded-card border border-black/10 bg-white p-5 shadow-soft">
        {!plan.google_auto_reply ? (
          // PRD.md 5.4.3: Starter users opening this URL directly see the
          // upgrade message, never the form (the server returns 403 in Stage 3).
          <UpgradePrompt scenario={scenario} />
        ) : confirmed ? (
          <RequestConfirmation scenario={scenario} />
        ) : request && isOpenAutoReplyRequest(request.status) ? (
          // PRD.md 5.4.3: while Pending or Contacted a second request is not possible.
          <StatusCard scenario={scenario} request={request} atScanLimit={false} />
        ) : (
          <RequestForm
            scenario={scenario}
            onSubmitted={(row) => {
              setRequest(row);
              setConfirmed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

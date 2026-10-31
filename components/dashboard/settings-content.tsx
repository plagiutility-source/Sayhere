"use client";

/**
 * `/settings` (PRD.md 5.4). One page with tabs: 1 Business profile, 2
 * Appearance, 3 Auto-reply (T7) and 5 Account & security; the Google-connection
 * tab (4) stays hidden in v1. T6 built the tabs and the shared plumbing, T7
 * added Auto-reply.
 *
 * The plumbing owns: the URL-driven tab bar (`?tab=`), the per-tab
 * "Discard changes?" guard (tab changes, in-app links and tab close),
 * skeleton loading and inline Retry for the active tab, and the mock
 * "account deleted" screen. Each tab owns its own draft, validation and toast.
 */

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDashboardMock } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { useMockSettings } from "@/lib/use-business";
import { AutoReplyTab } from "./auto-reply";
import { useDiscardGuard } from "./discard-guard";
import { SectionError } from "./section-error";
import {
  AccountSecurityTab,
  AppearanceTab,
  BusinessProfileTab,
} from "./settings-tabs";

/** PRD 5.4 tab list built in Stage 1 (the Google connection tab is hidden). */
const TABS = [
  { id: "profile", label: "Business profile", errorLabel: "your business profile" },
  { id: "appearance", label: "Appearance", errorLabel: "your brand colours" },
  { id: "auto-reply", label: "Auto-reply", errorLabel: "your auto-reply settings" },
  { id: "security", label: "Account & security", errorLabel: "your account settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function resolveTab(value: string | null): TabId {
  return TABS.find((tab) => tab.id === value)?.id ?? "profile";
}

export function SettingsContent({ demo }: { demo: DemoScenario }) {
  const searchParams = useSearchParams();
  const active = resolveTab(searchParams.get("tab"));

  const [revision, setRevision] = useState(0);
  const [recovered, setRecovered] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const mock = useMemo(() => getDashboardMock(demo), [demo, revision]);
  // MOCK ONLY, removed in Stage 4: the shared business profile, read after
  // mount so the server render and hydration use the static mock.
  const settings = useMockSettings(demo, revision);

  const handleDirtyChange = useCallback((next: boolean) => setDirty(next), []);
  const handleSaved = useCallback(() => {
    setDirty(false);
    setRevision((value) => value + 1);
  }, []);

  // "Discard changes?" guard (PRD 5.4): tab switches, any in-app link and tab
  // close, shared with the Auto-reply request form (1F T7).
  useDiscardGuard(dirty);

  if (deleted) return <AccountDeletedScreen businessName={settings.name} />;

  const activeTab = TABS.find((tab) => tab.id === active) ?? TABS[0];
  // business-rules.md 1: everything pauses while the scan limit is reached.
  const atScanLimit =
    mock.status.scan_limit !== null &&
    mock.status.scans_used >= mock.status.scan_limit;

  return (
    <div>
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">Settings</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Your business details, your brand colours and your account security.
        </p>
      </header>

      <nav
        aria-label="Settings tabs"
        className="mt-5 flex flex-wrap gap-1 border-b border-black/10"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={`/settings?demo=${demo}&tab=${tab.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`-mb-px inline-flex h-10 items-center border-b-2 px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                isActive
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5">
        {mock.loading ? (
          <SettingsSkeleton tab={active} />
        ) : mock.error && !recovered ? (
          <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
            <SectionError
              label={activeTab.errorLabel}
              onRetry={() => setRecovered(true)}
            />
          </div>
        ) : active === "profile" ? (
          <BusinessProfileTab
            scenario={demo}
            settings={settings}
            onDirtyChange={handleDirtyChange}
            onSaved={handleSaved}
          />
        ) : active === "appearance" ? (
          <AppearanceTab
            scenario={demo}
            settings={settings}
            onDirtyChange={handleDirtyChange}
            onSaved={handleSaved}
          />
        ) : active === "auto-reply" ? (
          <AutoReplyTab
            scenario={demo}
            plan={mock.plan}
            atScanLimit={atScanLimit}
          />
        ) : (
          <AccountSecurityTab
            scenario={demo}
            settings={settings}
            onDirtyChange={handleDirtyChange}
            onSaved={handleSaved}
            onDeleted={() => setDeleted(true)}
          />
        )}
      </div>
    </div>
  );
}

/** The mock "account deleted" screen: nothing is stored (PRD 5.4.5). */
function AccountDeletedScreen({ businessName }: { businessName: string }) {
  return (
    <div>
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
          Account deleted
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          “{businessName}” has been deleted. This demo stored nothing.
        </p>
      </header>
      <div className="mt-5 rounded-card border border-black/10 bg-white p-5 shadow-soft">
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-muted">
          <li>Your subscription was cancelled.</li>
          <li>
            Your business was deleted, along with its review pages, feedback and
            scan history.
          </li>
          <li>Your logo and QR files were deleted from storage.</li>
          <li>Your Syehere login was deleted.</li>
          <li>
            Payment records and audit logs are kept only as long as the law
            requires, with your personal details removed where possible.
          </li>
          <li>A confirmation email was sent.</li>
        </ul>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          Go to the home page
        </Link>
      </div>
    </div>
  );
}

/** Skeleton loading for the active tab (`?demo=loading`, PRD 5.4). */
function SettingsSkeleton({ tab }: { tab: TabId }) {
  const rows = tab === "security" || tab === "auto-reply" ? 3 : 4;
  return (
    <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index}>
            <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="mt-2 h-10 w-full animate-pulse rounded-control bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-10 w-32 animate-pulse rounded-control bg-surface-muted" />
    </div>
  );
}

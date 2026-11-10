"use client";

/**
 * `/loyalty` (PRD.md 5.7). One page with tabs, same pattern as `/settings`:
 * Overview, Stamp mode, Rewards, Staff, Members, Activity, Settings.
 *
 * MOCK ONLY (Stage 1): state comes from `lib/mock/loyalty-store` (localStorage)
 * through the pure rules in `lib/loyalty/rules.ts`. Stage 4 swaps the store for
 * server calls; the screens stay. In Stage 3 Stamp mode also gets its own
 * `/stamp` route with a staff session, so counter staff never need the owner's
 * login.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDashboardMock } from "@/lib/mock/dashboard";
import type { DemoScenario } from "@/lib/mock/demo";
import { supportsLoyalty } from "@/lib/plan-features";
import { useLoyaltyState } from "@/lib/use-loyalty";
import { PlanFeatureGate } from "../plan-feature-gate";
import { ActivityTab } from "./activity-tab";
import { MembersTab } from "./members-tab";
import { OverviewTab } from "./overview-tab";
import { RewardsTab } from "./rewards-tab";
import { SettingsTab } from "./settings-tab";
import { StaffTab } from "./staff-tab";
import { StampModeTab } from "./stamp-mode-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stamp", label: "Stamp mode" },
  { id: "rewards", label: "Rewards" },
  { id: "staff", label: "Staff" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
] as const;

export type LoyaltyTabId = (typeof TABS)[number]["id"];

function resolveTab(value: string | null): LoyaltyTabId {
  return TABS.find((tab) => tab.id === value)?.id ?? "overview";
}

export function LoyaltyContent({ demo }: { demo: DemoScenario }) {
  const searchParams = useSearchParams();
  const active = resolveTab(searchParams.get("tab"));
  const state = useLoyaltyState({ seedDemoStaff: true });
  const plan = getDashboardMock(demo).plan;

  if (!supportsLoyalty(plan.id)) {
    return (
      <PlanFeatureGate
        title="Loyalty is not included on your plan"
        message={`Loyalty is included on Pro, Growth and Enterprise. You are on ${plan.name}. Upgrade to start a stamp card and reward regulars.`}
        demo={demo}
      />
    );
  }

  return (
    <div>
      <header>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">Loyalty</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Reward regulars with a stamp card. Stamps only come from one-time
          codes, so they can not be faked.
        </p>
      </header>

      <nav
        aria-label="Loyalty tabs"
        className="mt-5 flex flex-wrap gap-1 border-b border-black/10"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={`/loyalty?demo=${demo}&tab=${tab.id}`}
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
        {!state ? (
          <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
            <div className="mt-5 h-24 w-full animate-pulse rounded-control bg-surface-muted" />
          </div>
        ) : active === "overview" ? (
          <OverviewTab state={state} demo={demo} />
        ) : active === "stamp" ? (
          <StampModeTab state={state} demo={demo} />
        ) : active === "rewards" ? (
          <RewardsTab state={state} />
        ) : active === "staff" ? (
          <StaffTab state={state} />
        ) : active === "members" ? (
          <MembersTab state={state} />
        ) : active === "activity" ? (
          <ActivityTab state={state} />
        ) : (
          <SettingsTab state={state} />
        )}
      </div>
    </div>
  );
}

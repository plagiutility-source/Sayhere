"use client";

/**
 * The dashboard shell (PRD.md 5.1 / 5.2).
 *
 * - Sidebar 240px at >=1280px, icon rail 64px at 1024–1279px, off-canvas
 *   drawer (<1024px) with a hamburger, Escape-to-close and focus handling.
 * - Top bar 64px, sticky, with a search box, notification bell and the
 *   business avatar/name (ellipsis-truncated).
 * - Sidebar/top-bar chrome uses the Syehere PRODUCT palette; only the page
 *   content picks up the business color through `getBrandTheme` (business-rules
 *   section 10).
 * - No real session yet: the session/redirect check goes here in Stage 3.
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Logo } from "@/components/logo";
import { LiveTopbarActions } from "@/components/rooms/owner/LiveTopbar";
import type { BusinessType } from "@/lib/brand/tokens";
import { getDashboardMock } from "@/lib/mock/dashboard";
import { supportsOrdering } from "@/lib/plan-features";
import type { PlanId } from "@/lib/mock/plans";
import { displayableLogo } from "@/lib/mock/store";
import { resolveDemoScenario, withDemo } from "@/lib/mock/demo";
import { useMockBusiness } from "@/lib/use-business";
import { formatLongDate } from "@/lib/dashboard/metrics";
import { dashboardNav } from "./nav";
import {
  BellIcon,
  CloseIcon,
  HamburgerIcon,
  SearchIcon,
} from "./icons";

type SearchState = { query: string; setQuery: (value: string) => void };

const DashboardSearchContext = createContext<SearchState>({
  query: "",
  setQuery: () => {},
});

/** The top-bar search value, consumed by `/feedback` to filter by message. */
export function useDashboardSearch(): SearchState {
  return useContext(DashboardSearchContext);
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  onNavigate,
  businessType,
  mockPlanId,
  demo,
}: {
  onNavigate?: () => void;
  businessType: BusinessType;
  mockPlanId: PlanId;
  demo: string | null;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-4">
      {dashboardNav.map((group) => (
        <div key={group.label}>
          <p className="hidden px-3 text-[10px] uppercase tracking-[0.05em] text-white/60 xl:block">
            {group.label}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {group.items
              .filter(
                (item) =>
                  !item.requires || item.requires(businessType, mockPlanId),
              )
              .map((item) => {
              const active = isActivePath(pathname, item.href);
              const label = item.labelByType?.[businessType] ?? item.label;
              const IconCmp = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={withDemo(item.href, demo)}
                    onClick={onNavigate}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-10 items-center justify-center gap-2.5 rounded-control px-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white xl:justify-start xl:px-3 ${
                      active
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-brand-yellow"
                      />
                    ) : null}
                    <IconCmp size={18} />
                    <span className="hidden xl:inline">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The single promo/upgrade card allowed at the bottom of the sidebar. */
function UpgradeCard({ demo }: { demo: string | null }) {
  return (
    <div className="hidden rounded-card bg-white/10 p-3 xl:block">
      <p className="text-[12px] text-white/80">Need more scans?</p>
      <p className="mt-1 text-[13px] font-medium text-white">
        Upgrade your plan
      </p>
      <Link
        href={withDemo("/billing", demo)}
        className="mt-2 inline-flex h-8 items-center rounded-control bg-white px-3 text-[12px] font-medium text-brand-blue hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        View plans
      </Link>
    </div>
  );
}

function SidebarChrome({
  onNavigate,
  businessType,
  mockPlanId,
  demo,
}: {
  onNavigate?: () => void;
  businessType: BusinessType;
  mockPlanId: PlanId;
  demo: string | null;
}) {
  return (
    <>
      <Link
        href={withDemo("/dashboard", demo)}
        onClick={onNavigate}
        aria-label="Syehere dashboard home"
        className="flex items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white xl:justify-start"
      >
        <span className="rounded-control bg-white px-2 py-1.5">
          <span className="hidden xl:block">
            <Logo variant="horizontal" height={22} />
          </span>
          <span className="xl:hidden">
            <Logo variant="icon" height={24} />
          </span>
        </span>
      </Link>
      <NavList
        onNavigate={onNavigate}
        businessType={businessType}
        mockPlanId={mockPlanId}
        demo={demo}
      />
      <div className="mt-auto">
        <UpgradeCard demo={demo} />
      </div>
    </>
  );
}

function ScanLimitBanner({
  resetAt,
  demo,
}: {
  resetAt: string;
  demo: string | null;
}) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-2 rounded-card border border-red-200 bg-red-50 p-xl sm:flex-row sm:items-center sm:justify-between print:hidden"
    >
      <p className="text-[13px] text-ink">
        Scan limit reached. Your QR page, auto-replies and weekly reports are
        paused until {formatLongDate(resetAt)}. Upgrade to turn everything back
        on now.
      </p>
      <Link
        href={withDemo("/billing", demo)}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-control bg-brand-blue px-4 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        Upgrade
      </Link>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const scenario = resolveDemoScenario(demoParam);
  const mock = useMemo(() => getDashboardMock(scenario), [scenario]);
  // MOCK ONLY, removed in Stage 4: the shared business profile (localStorage)
  // drives the top bar. `long-name` keeps its own base so the overflow demo
  // still works.
  const business = useMockBusiness(mock.business, scenario !== "long-name");
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const initial = business.name.trim().charAt(0).toUpperCase();
  // MOCK ONLY, removed in Stage 4: the owner's uploaded logo (onboarding or
  // Settings) replaces the name initial; no logo = the initial, as before.
  const logoUrl = displayableLogo(business.logo_url);
  const limitReached =
    mock.status.scan_limit !== null &&
    mock.status.scans_used >= mock.status.scan_limit;

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Escape closes the drawer and returns focus to the hamburger.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    drawerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <DashboardSearchContext.Provider value={{ query, setQuery }}>
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white print:hidden"
      >
        Skip to content
      </a>

      {/* Desktop sidebar: full at xl (>=1280px), icon rail at lg (1024–1279px). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col gap-4 bg-brand-blue p-2 lg:flex xl:w-60 xl:p-3 print:hidden">
        <SidebarChrome
          businessType={business.business_type}
          mockPlanId={mock.plan.id}
          demo={demoParam}
        />
      </aside>

      {/* Off-canvas drawer for <1024px. */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard menu"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-60 flex-col gap-4 bg-brand-blue p-3 shadow-soft focus:outline-none"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center self-end rounded-control text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CloseIcon size={20} />
            </button>
            <SidebarChrome
              onNavigate={() => setDrawerOpen(false)}
              businessType={business.business_type}
              mockPlanId={mock.plan.id}
              demo={demoParam}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-16 xl:pl-60 print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/10 bg-white px-4 sm:px-6 print:hidden">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue lg:hidden"
          >
            <HamburgerIcon size={20} />
          </button>

          <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <SearchIcon size={16} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search feedback"
              aria-label="Search feedback"
              className="h-10 w-full rounded-control border border-black/15 bg-surface-muted pl-9 pr-3 text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {supportsOrdering(business.business_type, mock.plan.id) ? (
              // Table/room ordering types get the live requests bell and the
              // order-bell sound toggle (mounted inside DashboardLive).
              <LiveTopbarActions />
            ) : (
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications (coming later)"
                className="relative flex h-10 w-10 items-center justify-center rounded-control text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <BellIcon size={18} />
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-yellow"
                />
              </button>
            )}

            <div className="flex min-w-0 items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-black/10 object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[13px] font-medium text-white"
                >
                  {initial || "S"}
                </span>
              )}
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-[13px] font-medium text-ink">
                  {business.name}
                </span>
                <span className="truncate text-[11px] text-ink-muted">
                  {business.owner_email}
                </span>
              </span>
            </div>
          </div>
        </header>

        <main
          id="dashboard-content"
          className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 print:max-w-none print:p-0"
        >
          {limitReached ? (
            <ScanLimitBanner
              resetAt={mock.status.scan_reset_at}
              demo={demoParam}
            />
          ) : null}
          {children}
        </main>
      </div>
    </DashboardSearchContext.Provider>
  );
}

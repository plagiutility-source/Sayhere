"use client";

/**
 * `/customer-page` editor (PRD.md 5.5.2/5.5.3, ui-spec 2.1-2.6, business-rules
 * section 11). FRONTEND ONLY (Stage 1): the live preview renders the real 1D
 * public components from React state, Save writes to the in-memory mock store
 * (`lib/mock/customer-page.ts`), and Reset/Discard/guards are UI-only.
 *
 * The button rows, social icon rows and menu builder are added in T3/T4; in
 * this task the left column already renders the sections, the locked "Review
 * buttons" row and the empty groups so the layout and the Save/Discard/Reset
 * plumbing are real.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MAX_CUSTOM_LINKS } from "@/lib/customer-page";
import { getDashboardMock, type DashboardMock } from "@/lib/mock/dashboard";
import { resolveDemoScenario, type DemoScenario } from "@/lib/mock/demo";
import {
  emptyPageConfig,
  getMockPageConfig,
  getMockSocialLinks,
  isPageCustomHidden,
  mockReviewPages,
  saveMockPageConfig,
  saveMockSocialLinks,
  type MenuConfig,
  type PageConfig,
  type PageConfigContent,
  type SocialLinks,
} from "@/lib/mock/customer-page";
import { reviewUrlFor, type MockLocation } from "@/lib/mock/locations";
import { limitLabel } from "@/lib/mock/plans";
// MOCK ONLY, removed in Stage 4: the editor's Save persists the page content to
// localStorage so the live page (new tab) and reloads show it.
import {
  getStoredPageData,
  saveStoredPageData,
  subscribePageStorage,
} from "@/lib/mock/store";
import { useFirstRoomCode } from "@/lib/rooms/store";
import { useMockBusiness, useMockLocations } from "@/lib/use-business";
import {
  menuLimitIssue,
  namedMenuItemCount,
  pageConfigIssues,
} from "@/lib/validation/page-config";
import { supportsLoyalty, supportsOrdering } from "@/lib/plan-features";
import {
  ButtonsSection,
  PageContentSection,
  SocialSection,
  SuggestionsSection,
} from "./customer-page-items";
import { CustomerPagePreview, PhoneFrame } from "./customer-page-preview";
import { CloseIcon, LockIcon } from "./icons";
import { Modal } from "./modal";
import { SectionError } from "./section-error";

const DISCARD_MESSAGE = "Discard changes?";

export function CustomerPageEditor() {
  const searchParams = useSearchParams();
  const scenario = resolveDemoScenario(searchParams.get("demo"));
  const mock = useMemo(() => getDashboardMock(scenario), [scenario]);
  // MOCK ONLY, removed in Stage 4: the location list follows the shared
  // business profile, so the editor edits the slugs the owner actually has.
  const locations = useMockLocations(scenario);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);
  const selected = locations.find((row) => row.id === selectedId) ?? locations[0];

  if (mock.loading) return <EditorShellSkeleton />;

  if (mock.error && !retried) {
    return (
      <div>
        <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
          Customer page
        </h1>
        <SectionError label="the editor" onRetry={() => setRetried(true)} />
      </div>
    );
  }

  if (!selected) return null; // The mock always has at least one location.

  return (
    <EditorForLocation
      // Remount per scenario/location so the draft re-initialises cleanly.
      key={`${scenario}:${selected.id}`}
      scenario={scenario}
      mock={mock}
      location={selected}
      locations={locations}
      hiddenByAdmin={isPageCustomHidden(scenario)}
      onSelectLocation={setSelectedId}
    />
  );
}

function EditorForLocation({
  scenario,
  mock,
  location,
  locations,
  hiddenByAdmin,
  onSelectLocation,
}: {
  scenario: DemoScenario;
  mock: DashboardMock;
  location: MockLocation;
  locations: MockLocation[];
  hiddenByAdmin: boolean;
  onSelectLocation: (id: string) => void;
}) {
  // MOCK ONLY, removed in Stage 4: the editor follows the shared business
  // profile (localStorage) on top of the café base; the location supplies the
  // slug and the effective Google review link. Social icons are business-level.
  const business = useMockBusiness(mockReviewPages.cafe01.business);
  const plan = mock.plan;

  // Merge M7: the second tab exists only for table/room ordering types on a
  // plan that includes ordering. The Reception tab below is the existing
  // editor, unchanged.
  const orderingIncluded = supportsOrdering(business.business_type, plan.id);
  const [tab, setTab] = useState<"reception" | "rooms">("reception");
  // The first real table code for this location, so "View live page" opens the
  // same kind of page the active tab is editing. Falls back to qr1 for a
  // location with no tables yet (that route opens the code as its first table).
  const tableCode = useFirstRoomCode(location.slug);

  /*
   * The two tabs are fully independent pages. Both start from the same saved
   * content (or the reception page for pages saved before this split), but
   * every edit below only touches the active tab's copy.
   */
  const initialConfig =
    getMockPageConfig(scenario, location.id) ?? emptyPageConfig();
  const initialDrafts: PageDrafts = {
    reception: pageContent(initialConfig),
    rooms: roomsSeedFrom(initialConfig),
  };
  const initialSocials = cloneSocials(getMockSocialLinks(scenario));
  const initialSocialDrafts: SocialDrafts = {
    reception: cloneSocials(initialSocials),
    rooms: cloneSocials(initialSocials),
  };
  const [drafts, setDrafts] = useState<PageDrafts>(() =>
    cloneDrafts(initialDrafts),
  );
  const [savedDrafts, setSavedDrafts] = useState<PageDrafts>(() =>
    cloneDrafts(initialDrafts),
  );
  const [socialDrafts, setSocialDrafts] = useState<SocialDrafts>(() =>
    cloneSocialDrafts(initialSocialDrafts),
  );
  const [savedSocialDrafts, setSavedSocialDrafts] = useState<SocialDrafts>(() =>
    cloneSocialDrafts(initialSocialDrafts),
  );
  const draftConfig = drafts[tab];
  const draftSocials = socialDrafts[tab];
  // MOCK ONLY, removed in Stage 4: content saved earlier for this slug wins
  // over the scenario default. Read after mount (localStorage is client-only)
  // so the server render and hydration use the scenario default.
  useEffect(() => {
    const stored = getStoredPageData(location.slug);
    if (!stored) return;
    const config = stored.page_config ?? emptyPageConfig();
    const nextDrafts: PageDrafts = {
      reception: pageContent(config),
      rooms: roomsSeedFrom(config),
    };
    const fallbackSocials = getMockSocialLinks(scenario);
    const nextSocialDrafts: SocialDrafts = {
      reception: cloneSocials(stored.social_links ?? fallbackSocials),
      rooms: cloneSocials(
        stored.rooms_social_links ?? stored.social_links ?? fallbackSocials,
      ),
    };
    setDrafts(nextDrafts);
    setSavedDrafts(cloneDrafts(nextDrafts));
    setSocialDrafts(nextSocialDrafts);
    setSavedSocialDrafts(cloneSocialDrafts(nextSocialDrafts));
  }, [location.slug, scenario]);
  const [status, setStatus] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  const activeDirty =
    JSON.stringify(drafts[tab]) !== JSON.stringify(savedDrafts[tab]) ||
    JSON.stringify(socialDrafts[tab]) !== JSON.stringify(savedSocialDrafts[tab]);
  const anyDirty =
    !draftsEqual(drafts, savedDrafts) ||
    !socialDraftsEqual(socialDrafts, savedSocialDrafts);

  // Latest dirty value for the storage listener, which can fire between
  // renders. A second dashboard tab must never overwrite edits in this one,
  // including edits on the page that is not currently visible.
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = anyDirty;
  }, [anyDirty]);

  // A Save in another dashboard tab updates localStorage. Reflect it here:
  // never clobber unsaved edits, but move the saved baseline so Discard loads
  // the latest version.
  useEffect(() => {
    return subscribePageStorage(() => {
      const stored = getStoredPageData(location.slug);
      const fallbackConfig =
        getMockPageConfig(scenario, location.id) ?? emptyPageConfig();
      const nextConfig = stored?.page_config ?? fallbackConfig;
      const nextDrafts: PageDrafts = {
        reception: pageContent(nextConfig),
        rooms: roomsSeedFrom(nextConfig),
      };
      const fallbackSocials = getMockSocialLinks(scenario);
      const nextSocialDrafts: SocialDrafts = {
        reception: cloneSocials(stored?.social_links ?? fallbackSocials),
        rooms: cloneSocials(
          stored?.rooms_social_links ?? stored?.social_links ?? fallbackSocials,
        ),
      };

      setSavedDrafts(cloneDrafts(nextDrafts));
      setSavedSocialDrafts(cloneSocialDrafts(nextSocialDrafts));
      if (dirtyRef.current) {
        setStatus(
          "Another tab saved changes. Your unsaved edits are still here — Discard to load the latest.",
        );
        return;
      }
      setDrafts(nextDrafts);
      setSocialDrafts(nextSocialDrafts);
      setStatus("Updated with changes saved in another tab.");
    });
  }, [location.slug, location.id, scenario]);

  // Rules 11.17: Save is blocked while an On item is empty or invalid, and
  // 11.5: after a downgrade Save is blocked until the menu fits the plan limit
  // (deleting items is always allowed).
  const limitIssue = menuLimitIssue(draftConfig, plan.page.menu_items);
  const issues = [
    ...pageConfigIssues(draftConfig, draftSocials),
    ...(limitIssue ? [limitIssue] : []),
  ];
  const otherTab = tab === "reception" ? "rooms" : "reception";
  const otherConfig = drafts[otherTab];
  const otherSocials = socialDrafts[otherTab];
  const otherLimitIssue = menuLimitIssue(otherConfig, plan.page.menu_items);
  const otherIssues = [
    ...pageConfigIssues(otherConfig, otherSocials),
    ...(otherLimitIssue ? [otherLimitIssue] : []),
  ];
  // Each page saves independently. An invalid field on the other page must not
  // freeze this one: that was leaving phone/menu edits unsaved while the
  // page-specific data stayed frozen on every live tab.
  const saveBlocked = issues.length > 0;

  const reviewUrl = reviewUrlFor(location, business.google_review_url);
  // Keep the live link in step with the active tab. Tables/Rooms opens a real
  // table page (the first table code), not the reception page.
  const liveHref =
    tab === "rooms"
      ? `/r/${location.slug}/${tableCode ?? "qr1"}`
      : `/r/${location.slug}`;
  const menuItems = namedMenuItemCount(draftConfig.menu);
  const otherLocation =
    locations.find((row) => row.id !== location.id) ?? null;

  /** Scrolls to a row and flashes it (chips and the Fix-N summary use this). */
  function handleJump(target: string) {
    setHighlight(target);
    window.setTimeout(() => {
      document
        .getElementById(target)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    window.setTimeout(() => setHighlight(null), 1600);
  }

  function patchActive(
    update: (current: PageConfigContent) => PageConfigContent,
  ) {
    setDrafts((current) => ({ ...current, [tab]: update(current[tab]) }));
  }

  function patchButtons(patch: Partial<PageConfig["buttons"]>) {
    patchActive((current) => ({
      ...current,
      buttons: { ...current.buttons, ...patch },
    }));
  }

  function patchMenu(menu: MenuConfig) {
    patchActive((current) => ({ ...current, menu }));
  }

  function patchAnnouncement(patch: Partial<PageConfig["announcement"]>) {
    patchActive((current) => ({
      ...current,
      announcement: { ...current.announcement, ...patch },
    }));
  }

  function setThankYou(value: string) {
    patchActive((current) => ({ ...current, thank_you: value }));
  }

  function patchLoyalty(on: boolean) {
    patchActive((current) => ({ ...current, loyalty: { on } }));
  }

  function setActiveSocials(next: SocialLinks) {
    setSocialDrafts((current) => ({ ...current, [tab]: next }));
  }

  // Unsaved-changes guard: tab close (beforeunload) and in-app link clicks
  // (sidebar etc.). Stage 4 can replace the click catcher with router events.
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/")) return;
      if (!window.confirm(DISCARD_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [anyDirty]);

  /**
   * The saved version of both pages, used as the base when only one page is
   * saved. Never use the other tab's draft here: it may contain unsaved edits
   * that this Save must not publish.
   */
  function savedPageForMerge(): PageConfig {
    const stored = getStoredPageData(location.slug);
    if (stored?.page_config) return cloneConfig(stored.page_config);
    return {
      ...cloneContent(savedDrafts.reception),
      rooms_config: cloneContent(savedDrafts.rooms),
    };
  }

  /**
   * Write the active page. When the other page has no validation errors, its
   * draft is saved too (the long-standing Save-all behaviour); when it does,
   * its last saved version is preserved instead of blocking this page.
   */
  function pageForSave(
    content: PageConfigContent,
    includeOther: boolean,
  ): PageConfig {
    const base = savedPageForMerge();
    const receptionContent =
      tab === "reception"
        ? content
        : includeOther
          ? drafts.reception
          : null;
    const roomsContent =
      tab === "rooms" ? content : includeOther ? drafts.rooms : null;

    const next: PageConfig = {
      ...(receptionContent
        ? cloneContent(receptionContent)
        : pageContent(base)),
      ...(base.rooms_page ? { rooms_page: base.rooms_page } : {}),
    };
    if (roomsContent) {
      next.rooms_config = cloneContent(roomsContent);
    } else if (base.rooms_config) {
      next.rooms_config = cloneContent(base.rooms_config);
    }
    return next;
  }

  function saveSocialsPatch(includeOther: boolean) {
    return {
      ...(tab === "reception" || includeOther
        ? { social_links: cloneSocials(socialDrafts.reception) }
        : {}),
      ...(tab === "rooms" || includeOther
        ? { rooms_social_links: cloneSocials(socialDrafts.rooms) }
        : {}),
    };
  }

  function handleSave(): boolean {
    const includeOther = otherIssues.length === 0;
    const combined = pageForSave(drafts[tab], includeOther);
    saveMockPageConfig(scenario, location.id, combined);
    if (tab === "reception" || includeOther) {
      saveMockSocialLinks(scenario, cloneSocials(socialDrafts.reception));
    }
    // MOCK ONLY: the live pages read this store after mount.
    const result = saveStoredPageData(location.slug, {
      page_config: combined,
      ...saveSocialsPatch(includeOther),
    });
    if (includeOther) {
      setSavedDrafts(cloneDrafts(drafts));
      setSavedSocialDrafts(cloneSocialDrafts(socialDrafts));
    } else {
      setSavedDrafts((current) => ({
        ...current,
        [tab]: cloneContent(drafts[tab]),
      }));
      setSavedSocialDrafts((current) => ({
        ...current,
        [tab]: cloneSocials(socialDrafts[tab]),
      }));
    }
    setStatus(
      result.ok
        ? includeOther
          ? "Saved. Both pages and every open live tab are up to date."
          : "Saved this page. The other page keeps its last saved version until its errors are fixed."
        : "Saved for this session only — it will not survive a reload.",
    );
    return result.ok;
  }

  function handleViewLive(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (activeDirty) {
      if (saveBlocked) {
        setStatus(
          "Fix the highlighted items before opening the live page. Nothing was saved.",
        );
        return;
      }
      if (!handleSave()) return;
    }
    window.open(liveHref, "_blank", "noopener,noreferrer");
  }

  function handleDiscard() {
    setDrafts((current) => ({
      ...current,
      [tab]: cloneContent(savedDrafts[tab]),
    }));
    setSocialDrafts((current) => ({
      ...current,
      [tab]: cloneSocials(savedSocialDrafts[tab]),
    }));
    setStatus("Changes discarded for this page.");
  }

  function handleReset() {
    const empty = pageContent(emptyPageConfig());
    const combined = pageForSave(empty, false);
    saveMockPageConfig(scenario, location.id, combined);
    const result = saveStoredPageData(location.slug, {
      page_config: combined,
      ...(tab === "reception"
        ? { social_links: {} }
        : { rooms_social_links: {} }),
    });
    setDrafts((current) => ({ ...current, [tab]: empty }));
    setSavedDrafts((current) => ({ ...current, [tab]: cloneContent(empty) }));
    setSocialDrafts((current) => ({ ...current, [tab]: {} }));
    setSavedSocialDrafts((current) => ({ ...current, [tab]: {} }));
    setResetOpen(false);
    setStatus(
      result.ok
        ? "Reset this page to default. The other page is unchanged."
        : "Reset for this session only — it will not survive a reload.",
    );
  }

  function handleCopyFromOther() {
    if (!otherLocation) return;
    const storedOther = getStoredPageData(otherLocation.slug);
    const source =
      storedOther?.page_config ??
      getMockPageConfig(scenario, otherLocation.id) ??
      emptyPageConfig();
    const sourceSocials =
      tab === "rooms"
        ? storedOther?.rooms_social_links ??
          storedOther?.social_links ??
          getMockSocialLinks(scenario)
        : storedOther?.social_links ?? getMockSocialLinks(scenario);
    setDrafts((current) => ({
      ...current,
      [tab]: tab === "rooms" ? roomsSeedFrom(source) : pageContent(source),
    }));
    setSocialDrafts((current) => ({
      ...current,
      [tab]: cloneSocials(sourceSocials),
    }));
    setCopyOpen(false);
    setStatus(
      `Copied the ${tab === "rooms" ? "tables/rooms" : "reception"} page from ${otherLocation.location_name}.`,
    );
  }

  function handleLocationChange(nextId: string) {
    if (nextId === location.id) return;
    if (anyDirty && !window.confirm(DISCARD_MESSAGE)) return;
    setStatus(null);
    onSelectLocation(nextId);
  }

  // The preview always renders the active tab's own draft, so every change is
  // reflected immediately without leaking into the other page.
  const preview = (
    <CustomerPagePreview
      slug={location.slug}
      business={business}
      config={draftConfig}
      socials={draftSocials}
      reviewUrl={reviewUrl}
      menuItemLimit={plan.page.menu_items}
    />
  );

  return (
    <div>
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
              Customer page
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Customize what customers see at {location.location_name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {locations.length > 1 ? (
              <>
                <label htmlFor="editor-location" className="sr-only">
                  Location
                </label>
                <select
                  id="editor-location"
                  value={location.id}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  className="h-10 rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  {locations.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.location_name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={!activeDirty || saveBlocked}
              title={`Save the ${tab === "rooms" ? "Tables/Rooms" : "Reception"} page settings.`}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!activeDirty}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Reset to default
            </button>
            <a
              href={liveHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleViewLive}
              title={
                tab === "rooms"
                  ? "Open the live table page"
                  : "Open the live reception page"
              }
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              View live page
            </a>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 lg:hidden"
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-[12px] text-ink-muted">
            Menu items {menuItems} / {limitLabel(plan.page.menu_items)} · Link
            buttons {draftConfig.buttons.custom_links.length} / {MAX_CUSTOM_LINKS}
          </p>
          {saveBlocked ? (
            <button
              type="button"
              onClick={() => handleJump(issues[0].key)}
              className="text-[12px] text-red-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {`Fix ${issues.length} ${issues.length === 1 ? "item" : "items"} to save this page`}
            </button>
          ) : otherIssues.length > 0 ? (
            <p className="text-[12px] text-amber-800">
              {`The ${otherTab === "rooms" ? "Tables/Rooms" : "Reception"} page has ${otherIssues.length} ${otherIssues.length === 1 ? "fix" : "fixes"}. Saving this page will keep that page's last saved version.`}
            </p>
          ) : null}
        </div>
      </header>

      {orderingIncluded ? (
        <div
          className="mt-6 flex w-full max-w-[380px] gap-0.5 rounded-control bg-surface-muted p-[3px]"
          role="tablist"
          aria-label="Page"
        >
          {(["reception", "rooms"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`inline-flex h-9 flex-1 items-center justify-center rounded-control px-3 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                tab === key
                  ? "bg-white text-ink shadow-soft"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {key === "reception" ? "Reception page" : "Tables/Rooms page"}
            </button>
          ))}
        </div>
      ) : null}

      {status ? (
        <p
          role="status"
          className="mt-4 rounded-card border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-[13px] text-brand-green-deep"
        >
          {status}
        </p>
      ) : null}

      {hiddenByAdmin ? (
        <p className="mt-4 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Your custom page is hidden by Syehere. Contact support.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_375px]">
        <div>
          {orderingIncluded && tab === "rooms" ? (
            <div className="mb-6 rounded-card border border-brand-blue/20 bg-brand-blue/[0.04] p-4 text-[12px] leading-[1.6] text-ink">
              <p className="font-medium">A separate page for tables and rooms.</p>
              <p className="mt-1 text-ink-muted">
                Guests who scan a table QR see this page, plus table tiles for
                ordering, Call waiter, Bill and Wi-Fi. Its menu, buttons and
                social icons are independent, so turning something on here does
                not turn it on for the reception page.
              </p>
            </div>
          ) : null}

          <SuggestionsSection
            businessType={business.business_type}
            onJump={handleJump}
          />

          <section aria-labelledby="content-heading" className="mt-6">
            <h2 id="content-heading" className="text-[13px] font-medium text-ink">
              Page content
            </h2>
            <PageContentSection
              config={draftConfig}
              onPatchAnnouncement={patchAnnouncement}
              onSetThankYou={setThankYou}
              highlight={highlight}
            />
          </section>

          <section aria-labelledby="buttons-heading" className="mt-6">
            <h2 id="buttons-heading" className="text-[13px] font-medium text-ink">
              Buttons
            </h2>
            <ButtonsSection
              businessType={business.business_type}
              config={draftConfig}
              onPatchButtons={patchButtons}
              onPatchMenu={patchMenu}
              menuItemLimit={plan.page.menu_items}
              aiAllowance={plan.page.ai_images}
              planName={plan.name}
              loyaltyIncluded={supportsLoyalty(plan.id)}
              loyaltyOn={draftConfig.loyalty?.on ?? true}
              onToggleLoyalty={patchLoyalty}
              highlight={highlight}
            />
          </section>

          <section aria-labelledby="social-heading" className="mt-6">
            <h2 id="social-heading" className="text-[13px] font-medium text-ink">
              Social icons
            </h2>
            <SocialSection
              socials={draftSocials}
              onChange={setActiveSocials}
              highlight={highlight}
            />
          </section>

          <section aria-labelledby="review-heading" className="mt-6">
            <h2 id="review-heading" className="sr-only">
              Review buttons
            </h2>
            <div className="flex items-center justify-between rounded-card border border-black/10 bg-white p-4 shadow-soft">
              <span className="flex items-center gap-2 text-[13px] text-ink">
                <LockIcon size={16} />
                Review buttons
              </span>
              <span className="text-[12px] text-ink-muted">Always shown</span>
            </div>
          </section>

          {/*
           * "Copy from another location" (rules 11.10). Contradiction logged,
           * not resolved: PRD 5.5.12 / PROGRESS 4B-C and rules 11.10 say
           * "Copy from another location (Pro)", but only Enterprise can have
           * more than one location (business-rules.md 1) — so this is shown
           * only when the business actually has more than one location.
           */}
          {otherLocation ? (
            <section aria-labelledby="copy-heading" className="mt-6">
              <h2
                id="copy-heading"
                className="text-[13px] font-medium text-ink"
              >
                Copy from another location
              </h2>
              <div className="mt-3 rounded-card border border-black/10 bg-white p-4 shadow-soft">
                <p className="text-[12px] text-ink-muted">
                  Copies the page content from {otherLocation.location_name} into{" "}
                  {location.location_name}. Social icons are kept.
                </p>
                <button
                  type="button"
                  onClick={() => setCopyOpen(true)}
                  className="mt-3 inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                >
                  Copy from another location
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <p className="text-[12px] text-ink-muted">Live preview</p>
          <div className="mt-2">
            <PhoneFrame>{preview}</PhoneFrame>
          </div>
        </aside>
      </div>

      {/* Under 1024 px the preview opens in a drawer (ui-spec 2.1). */}
      <PreviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {preview}
      </PreviewDrawer>

      <Modal
        open={copyOpen}
        title="Copy from another location?"
        onClose={() => setCopyOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCopyOpen(false)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyFromOther}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Copy content
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          This replaces this page&apos;s content and social icons for{" "}
          {location.location_name} with the saved page from{" "}
          {otherLocation?.location_name ?? "your other location"}. Your other
          page is unchanged.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset to default?"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Reset to default
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          This clears this page&apos;s content and social icons for{" "}
          {location.location_name}. The other page is unchanged.
        </p>
      </Modal>
    </div>
  );
}

/** Preview drawer for <1024 px: focus trapped, Escape closes. */
function PreviewDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Preview"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-surface-muted shadow-soft focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
          <p className="text-[13px] font-medium text-ink">Preview</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function EditorShellSkeleton() {
  return (
    <div>
      <div className="h-5 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-64 animate-pulse rounded bg-surface-muted" />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-28 animate-pulse rounded-control bg-surface-muted"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_375px]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-card border border-black/10 bg-white shadow-soft"
            />
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="mx-auto h-[640px] w-[375px] animate-pulse rounded-[28px] bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

type PageDrafts = {
  reception: PageConfigContent;
  rooms: PageConfigContent;
};

type SocialDrafts = {
  reception: SocialLinks;
  rooms: SocialLinks;
};

function cloneConfig(config: PageConfig): PageConfig {
  return JSON.parse(JSON.stringify(config)) as PageConfig;
}

/** One complete page, without the nested Tables/Rooms copy. */
function pageContent(config: PageConfig): PageConfigContent {
  const copy = cloneConfig(config);
  delete copy.rooms_config;
  delete copy.rooms_page;
  return copy;
}

function cloneContent(config: PageConfigContent): PageConfigContent {
  return JSON.parse(JSON.stringify(config)) as PageConfigContent;
}

function cloneDrafts(drafts: PageDrafts): PageDrafts {
  return {
    reception: cloneContent(drafts.reception),
    rooms: cloneContent(drafts.rooms),
  };
}

function cloneSocials(socials: SocialLinks): SocialLinks {
  return JSON.parse(JSON.stringify(socials)) as SocialLinks;
}

function cloneSocialDrafts(socials: SocialDrafts): SocialDrafts {
  return {
    reception: cloneSocials(socials.reception),
    rooms: cloneSocials(socials.rooms),
  };
}

function draftsEqual(a: PageDrafts, b: PageDrafts): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function socialDraftsEqual(a: SocialDrafts, b: SocialDrafts): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * What the Tables/Rooms tab starts from: its own saved copy when present, or
 * the reception page. Legacy `rooms_page` values (the old trimmed tab) are
 * folded in once so owners who already configured that tab keep their work.
 */
function roomsSeedFrom(config: PageConfig): PageConfigContent {
  if (config.rooms_config) return cloneContent(config.rooms_config);
  const base = pageContent(config);
  const legacy = config.rooms_page;
  if (!legacy || !legacyHasContent(legacy)) return cloneContent(base);
  const custom = legacy.custom;
  return {
    ...cloneContent(base),
    announcement: {
      ...base.announcement,
      on: legacy.announcement.on,
      text: legacy.announcement.text,
    },
    thank_you: legacy.thank_you || base.thank_you,
    buttons: {
      ...base.buttons,
      wifi: { ...legacy.wifi },
      menu: {
        ...base.buttons.menu,
        title: legacy.menu_title || base.buttons.menu.title,
      },
      hours: {
        ...base.buttons.hours,
        on: legacy.hours.on,
        phone: legacy.hours.phone,
        address: legacy.hours.address,
      },
      call: { ...legacy.call },
      directions: { ...legacy.directions },
      custom_links: custom.on ? [{ ...custom }] : base.buttons.custom_links,
    },
    loyalty: base.loyalty,
  };
}

function legacyHasContent(
  legacy: NonNullable<PageConfig["rooms_page"]>,
): boolean {
  return [
    legacy.announcement.on,
    legacy.announcement.text.trim(),
    legacy.thank_you.trim(),
    legacy.wifi.on,
    legacy.wifi.ssid.trim(),
    legacy.menu_title.trim(),
    legacy.hours.on,
    legacy.hours.phone.trim(),
    legacy.hours.address.trim(),
    legacy.call.on,
    legacy.call.phone.trim(),
    legacy.directions.on,
    legacy.directions.value.trim(),
    legacy.custom.on,
    legacy.custom.label.trim(),
    legacy.custom.url.trim(),
  ].some(Boolean);
}


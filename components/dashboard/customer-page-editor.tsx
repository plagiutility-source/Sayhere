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
  type SocialLinks,
} from "@/lib/mock/customer-page";
import { reviewUrlFor, type MockLocation } from "@/lib/mock/locations";
import { limitLabel } from "@/lib/mock/plans";
// MOCK ONLY, removed in Stage 4: the editor's Save persists the page content to
// localStorage so the live page (new tab) and reloads show it.
import {
  getStoredPageData,
  saveStoredPageData,
} from "@/lib/mock/store";
import { useMockBusiness, useMockLocations } from "@/lib/use-business";
import {
  menuLimitIssue,
  namedMenuItemCount,
  pageConfigIssues,
} from "@/lib/validation/page-config";
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

  const [draftConfig, setDraftConfig] = useState<PageConfig>(() =>
    cloneConfig(getMockPageConfig(scenario, location.id) ?? emptyPageConfig()),
  );
  const [savedConfig, setSavedConfig] = useState<PageConfig>(() =>
    cloneConfig(getMockPageConfig(scenario, location.id) ?? emptyPageConfig()),
  );
  const [draftSocials, setDraftSocials] = useState<SocialLinks>(() =>
    cloneSocials(getMockSocialLinks(scenario)),
  );
  const [savedSocials, setSavedSocials] = useState<SocialLinks>(() =>
    cloneSocials(getMockSocialLinks(scenario)),
  );

  // MOCK ONLY, removed in Stage 4: content saved earlier for this slug wins
  // over the scenario default. Read after mount (localStorage is client-only)
  // so the server render and hydration use the scenario default.
  useEffect(() => {
    const stored = getStoredPageData(location.slug);
    if (!stored) return;
    const config = cloneConfig(stored.page_config ?? emptyPageConfig());
    setDraftConfig(config);
    setSavedConfig(cloneConfig(config));
    if (stored.social_links) {
      const socials = cloneSocials(stored.social_links);
      setDraftSocials(socials);
      setSavedSocials(cloneSocials(socials));
    }
  }, [location.slug]);
  const [status, setStatus] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  const dirty =
    !configsEqual(draftConfig, savedConfig) ||
    !socialsEqual(draftSocials, savedSocials);

  // Rules 11.17: Save is blocked while an On item is empty or invalid, and
  // 11.5: after a downgrade Save is blocked until the menu fits the plan limit
  // (deleting items is always allowed).
  const limitIssue = menuLimitIssue(draftConfig, plan.page.menu_items);
  const issues = [
    ...pageConfigIssues(draftConfig, draftSocials),
    ...(limitIssue ? [limitIssue] : []),
  ];
  const saveBlocked = issues.length > 0;

  const reviewUrl = reviewUrlFor(location, business.google_review_url);
  const menuItems = namedMenuItemCount(draftConfig.menu);
  const otherLocation =
    locations.find((row) => row.id !== location.id) ?? null;

  /** Scrolls to a row and flashes it (chips and the Fix-N summary use this). */
  function handleJump(target: string) {
    setHighlight(target);
    document
      .getElementById(target)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlight(null), 1600);
  }

  function patchButtons(patch: Partial<PageConfig["buttons"]>) {
    setDraftConfig((current) => ({
      ...current,
      buttons: { ...current.buttons, ...patch },
    }));
  }

  function patchMenu(menu: MenuConfig) {
    setDraftConfig((current) => ({ ...current, menu }));
  }

  function patchAnnouncement(patch: Partial<PageConfig["announcement"]>) {
    setDraftConfig((current) => ({
      ...current,
      announcement: { ...current.announcement, ...patch },
    }));
  }

  function setThankYou(value: string) {
    setDraftConfig((current) => ({ ...current, thank_you: value }));
  }

  // Unsaved-changes guard: tab close (beforeunload) and in-app link clicks
  // (sidebar etc.). Stage 4 can replace the click catcher with router events.
  useEffect(() => {
    if (!dirty) return;
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
  }, [dirty]);

  function handleSave() {
    saveMockPageConfig(scenario, location.id, cloneConfig(draftConfig));
    saveMockSocialLinks(scenario, cloneSocials(draftSocials));
    // MOCK ONLY: the live page reads this store after mount.
    const result = saveStoredPageData(location.slug, {
      page_config: cloneConfig(draftConfig),
      social_links: cloneSocials(draftSocials),
    });
    setSavedConfig(cloneConfig(draftConfig));
    setSavedSocials(cloneSocials(draftSocials));
    setStatus(
      result.ok
        ? "Saved. Your live page now shows this."
        : "Saved for this session only — it will not survive a reload.",
    );
  }

  function handleDiscard() {
    setDraftConfig(cloneConfig(savedConfig));
    setDraftSocials(cloneSocials(savedSocials));
    setStatus("Changes discarded.");
  }

  function handleReset() {
    saveMockPageConfig(scenario, location.id, null);
    // MOCK ONLY: the live page goes back to the default page too. Social icons
    // are business-level and are kept.
    saveStoredPageData(location.slug, {
      page_config: null,
      social_links: cloneSocials(draftSocials),
    });
    const empty = emptyPageConfig();
    setDraftConfig(cloneConfig(empty));
    setSavedConfig(cloneConfig(empty));
    // Social icons are business-level and are intentionally kept.
    setResetOpen(false);
    setStatus("Reset to default. Social icons are kept.");
  }

  function handleCopyFromOther() {
    if (!otherLocation) return;
    const storedOther = getStoredPageData(otherLocation.slug);
    const source = storedOther
      ? storedOther.page_config
      : getMockPageConfig(scenario, otherLocation.id);
    setDraftConfig(cloneConfig(source ?? emptyPageConfig()));
    setCopyOpen(false);
    setStatus(`Copied the page content from ${otherLocation.location_name}.`);
  }

  function handleLocationChange(nextId: string) {
    if (nextId === location.id) return;
    if (dirty && !window.confirm(DISCARD_MESSAGE)) return;
    setStatus(null);
    onSelectLocation(nextId);
  }

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
              disabled={!dirty || saveBlocked}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty}
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
              href={`/r/${location.slug}`}
              target="_blank"
              rel="noopener noreferrer"
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
              Fix {issues.length} {issues.length === 1 ? "item" : "items"} to
              save
            </button>
          ) : null}
        </div>
      </header>

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
              highlight={highlight}
            />
          </section>

          <section aria-labelledby="social-heading" className="mt-6">
            <h2 id="social-heading" className="text-[13px] font-medium text-ink">
              Social icons
            </h2>
            <SocialSection
              socials={draftSocials}
              onChange={setDraftSocials}
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
          This replaces the page content for {location.location_name} with the
          saved content from {otherLocation?.location_name ?? "your other location"}.
          Social icons are kept.
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
          This clears the page customization for {location.location_name}.
          Social icons are kept.
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

function cloneConfig(config: PageConfig): PageConfig {
  return JSON.parse(JSON.stringify(config)) as PageConfig;
}

function cloneSocials(socials: SocialLinks): SocialLinks {
  return JSON.parse(JSON.stringify(socials)) as SocialLinks;
}

function configsEqual(a: PageConfig, b: PageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function socialsEqual(a: SocialLinks, b: SocialLinks): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}


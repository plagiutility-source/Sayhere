"use client";

/**
 * `/locations` (PRD.md 5 and 5.3, business-rules.md 1 and 9).
 *
 * FRONTEND ONLY (Stage 1): the locations list and the Review links panel run on
 * `lib/mock/locations.ts`. Real QR/PNG/PDF/SVG generation, real saves and real
 * uploads arrive in later stages — the QR here is a clearly labelled,
 * non-scannable placeholder and the download buttons are disabled.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getBrandTheme, type BrandTheme } from "@/lib/brand/theme";
import { Input } from "@/components/input";
import { getDashboardMock } from "@/lib/mock/dashboard";
import { resolveDemoScenario, type DemoScenario } from "@/lib/mock/demo";
import {
  mockAddLocation,
  mockRegenerateReviewLink,
  reviewUrlFor,
  shortLink,
  type LocationOwner,
  type MockLocation,
} from "@/lib/mock/locations";
import { limitLabel } from "@/lib/mock/plans";
import { useMockBusiness, useMockLocations } from "@/lib/use-business";
import { CategoryLockBadge } from "@/components/category/category-lock-badge";
import { RoomsQrSection } from "@/components/rooms/owner/RoomsQrSection";
import { normalizeCategory } from "@/lib/category/features";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { validateGoogleReviewUrl } from "@/lib/validation";
import { CopyButton } from "./copy-button";
import { DownloadIcon, PlusIcon } from "./icons";
import { Modal } from "./modal";

/**
 * The location-name limit is not specified in the docs; the closest defined
 * limit is the 4A business name (100). Using it literally and logged as an
 * open question in PROGRESS.md.
 */
const MAX_LOCATION_NAME_LENGTH = 100;

export function LocationsContent() {
  const searchParams = useSearchParams();
  const scenario = resolveDemoScenario(searchParams.get("demo"));
  const mock = useMemo(() => getDashboardMock(scenario), [scenario]);
  const live = scenario !== "long-name";
  // MOCK ONLY, removed in Stage 4: the QR placeholder colour follows the
  // shared business profile.
  const business = useMockBusiness(mock.business, live);
  const theme = getBrandTheme(business);
  const plan = mock.plan;

  // Bumped after every mock mutation so the derived locations re-render.
  const [version, setVersion] = useState(0);
  // MOCK ONLY, removed in Stage 4: the locations follow the shared business
  // profile, so the name, slug, link and counters belong to the owner's business
  // (a gym never shows "Brew and Bean / cafe01").
  const locations = useMockLocations(scenario, version, live);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = locations.find((row) => row.id === selectedId) ?? locations[0];

  const locationLimit = plan.locations;
  const atLimit = locationLimit !== null && locations.length >= locationLimit;

  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleAdded(location: MockLocation) {
    setVersion((value) => value + 1);
    setSelectedId(location.id);
    setAddOpen(false);
    setNotice(
      `Location added. It has its own review link and the new slug ${location.slug}.`,
    );
  }

  return (
    <div>
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-medium leading-[1.3] text-ink">
            Locations
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Every location has its own permanent short link and QR code.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <button
            type="button"
            disabled={atLimit}
            onClick={() => setAddOpen(true)}
            title={
              atLimit
                ? "Extra locations are available on the Enterprise plan"
                : undefined
            }
            className="inline-flex h-10 items-center gap-2 rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon size={16} />
            Add location
          </button>
          {atLimit ? (
            <p className="text-[12px] text-ink-muted">
              Extra locations are available on the Enterprise plan.{" "}
              <Link
                href="/contact"
                className="font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Contact us
              </Link>
            </p>
          ) : (
            <p className="text-[12px] text-ink-muted">
              {locationLimit === null
                ? `Using ${locations.length} locations`
                : `${locations.length} of ${limitLabel(locationLimit)} locations used`}
            </p>
          )}
        </div>
      </header>

      {notice ? (
        <p
          role="status"
          className="mt-4 rounded-card border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-[13px] text-brand-green-deep"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="locations-heading">
          <h2
            id="locations-heading"
            className="text-[13px] font-medium text-ink"
          >
            Your locations
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {locations.map((location) => {
              const isSelected = selected?.id === location.id;
              return (
                <li
                  key={location.id}
                  className={`rounded-card border bg-white p-4 shadow-soft ${
                    isSelected ? "border-brand-blue" : "border-black/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {location.location_name}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-ink-muted">
                        {shortLink(location.slug)}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        Scans this cycle: {location.scans_used}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-pill px-2 py-1 text-[11px] font-medium ${
                          location.is_active
                            ? "bg-brand-green/10 text-brand-green-deep"
                            : "bg-surface-muted text-ink-muted"
                        }`}
                      >
                        {location.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedId(location.id)}
                        aria-pressed={isSelected}
                        className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                      >
                        {isSelected ? "Showing review links" : "Review links"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {selected ? (
          <aside
            aria-labelledby="review-links-heading"
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <h2
              id="review-links-heading"
              className="text-[13px] font-medium text-ink"
            >
              Review links
            </h2>
            <p className="mt-1 text-[12px] text-ink-muted">
              {selected.location_name}
            </p>
            {/* Keyed by location so the field re-initialises when the owner
                switches locations. */}
            <ReviewLinksPanel
              key={selected.id}
              scenario={scenario}
              location={selected}
              theme={theme}
              googleReviewUrl={business.google_review_url}
              onRegenerated={() => setVersion((value) => value + 1)}
            />
          </aside>
        ) : null}
      </div>

      {/* Table/room ordering types only: QR panel for the selected location.
          The locations list, addition, editing and plan limits above are
          untouched. */}
      {selected && supportsTableOrdering(business.business_type) ? (
        <RoomsQrSection location={selected} />
      ) : null}

      <AddLocationDialog
        open={addOpen}
        scenario={scenario}
        owner={business}
        category={business.business_category}
        onClose={() => setAddOpen(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}

function ReviewLinksPanel({
  scenario,
  location,
  theme,
  googleReviewUrl,
  onRegenerated,
}: {
  scenario: DemoScenario;
  location: MockLocation;
  theme: BrandTheme;
  /** Business-level fallback link (the shared profile's Google review link). */
  googleReviewUrl: string;
  onRegenerated: () => void;
}) {
  const [linkValue, setLinkValue] = useState(() =>
    reviewUrlFor(location, googleReviewUrl),
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);

  const link = shortLink(location.slug);

  function handleRegenerate() {
    const trimmed = linkValue.trim();
    if (!trimmed) {
      setLinkError("Paste your Google review link.");
      setLinkStatus(null);
      return;
    }
    const message = validateGoogleReviewUrl(trimmed);
    if (message) {
      setLinkError(message);
      setLinkStatus(null);
      return;
    }
    mockRegenerateReviewLink(scenario, location.id, trimmed);
    setLinkError(null);
    setLinkStatus(
      "Review link updated in place — the slug and your printed QR code stay the same.",
    );
    onRegenerated();
  }

  return (
    <div className="mt-3 flex flex-col gap-4 rounded-card border border-black/10 bg-white p-4 shadow-soft">
      <div>
        <Input
          label="Google review link"
          value={linkValue}
          maxLength={2048}
          onChange={(event) => {
            setLinkValue(event.target.value);
            setLinkError(null);
            setLinkStatus(null);
          }}
          hint="Regenerate updates this link in place — your slug and printed QR code never change."
          error={linkError ?? undefined}
        />
        <button
          type="button"
          onClick={handleRegenerate}
          className="mt-3 inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          Regenerate
        </button>
        <p role="status" aria-live="polite" className="mt-2 text-[12px] text-ink-muted">
          {linkStatus ?? ""}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-black/10 pt-4">
        <div
          aria-label="QR placeholder — not scannable"
          className="flex h-40 w-40 items-center justify-center rounded-card border-2 border-dashed p-4 text-center"
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          <span className="text-[12px] font-medium">
            QR code: built in a later stage
          </span>
        </div>
        <p className="text-[12px] text-ink-muted">
          The QR stays the same after any edit — it points at the slug.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] text-ink-muted">
              Short link — for printed material
            </p>
            <p className="truncate text-[13px] text-ink">{link}</p>
          </div>
          <CopyButton value={link} label="Copy short link" />
        </div>
        {/* No doc defines a separate NFC URL format; both rows show the same
            permanent link and are kept as distinct rows per PRD.md 5.3. Logged
            as an open question. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] text-ink-muted">
              NFC tap link — written to your NFC tag
            </p>
            <p className="truncate text-[13px] text-ink">{link}</p>
          </div>
          <CopyButton value={link} label="Copy NFC tap link" />
        </div>
      </div>

      <div className="border-t border-black/10 pt-4">
        <p className="text-[12px] text-ink-muted">Download</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["PNG", "PDF", "SVG"].map((format) => (
            <button
              key={format}
              type="button"
              disabled
              title="Coming in a later stage"
              className="inline-flex h-9 items-center gap-2 rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DownloadIcon size={16} />
              {format}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddLocationDialog({
  open,
  scenario,
  owner,
  category,
  onClose,
  onAdded,
}: {
  open: boolean;
  scenario: DemoScenario;
  /** The current business: a new location gets a sibling of its slug. */
  owner: LocationOwner;
  /** Inherited from the business; there is deliberately no choice here. */
  category: unknown;
  onClose: () => void;
  onAdded: (location: MockLocation) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  function handleSubmit() {
    const nextErrors: { name?: string; url?: string } = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      nextErrors.name = "Enter a location name.";
    } else if (trimmedName.length > MAX_LOCATION_NAME_LENGTH) {
      nextErrors.name = `Keep the name under ${MAX_LOCATION_NAME_LENGTH} characters.`;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      nextErrors.url = "Paste your Google review link.";
    } else {
      const message = validateGoogleReviewUrl(trimmedUrl);
      if (message) nextErrors.url = message;
    }
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.url) return;

    const location = mockAddLocation(scenario, owner, {
      location_name: trimmedName,
      google_review_url: trimmedUrl,
    });
    setName("");
    setUrl("");
    setErrors({});
    onAdded(location);
  }

  return (
    <Modal
      open={open}
      title="Add location"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            Add location
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Category gate: a new location inherits the business category. */}
        <div className="flex flex-wrap items-center gap-2 rounded-control bg-surface-muted px-3 py-2">
          <span className="text-[12px] font-medium text-ink">
            Business category
          </span>
          <CategoryLockBadge category={normalizeCategory(category)} />
          <span className="text-[12px] text-ink-muted">
            Inherited. A location cannot choose its own category.
          </span>
        </div>
        <Input
          label="Location name"
          value={name}
          maxLength={MAX_LOCATION_NAME_LENGTH}
          placeholder="Brew and Bean — Lower Parel"
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
        />
        <Input
          label="Google review link"
          value={url}
          maxLength={2048}
          placeholder="https://g.page/r/…/review"
          onChange={(event) => {
            setUrl(event.target.value);
            setErrors((current) => ({ ...current, url: undefined }));
          }}
          error={errors.url}
          hint="A new location gets its own slug and QR code."
        />
      </div>
    </Modal>
  );
}

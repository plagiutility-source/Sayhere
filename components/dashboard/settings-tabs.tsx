"use client";

/**
 * The three `/settings` tabs built in 1F T6 (PRD.md 5.4.1, 5.4.2, 5.4.5, 8.1;
 * business-rules.md section 10; security-and-reliability.md sections 1 and 7).
 *
 * FRONTEND ONLY (Stage 1): every save writes to the in-memory mock
 * (`lib/mock/settings.ts`), nothing is uploaded and no credential is changed.
 * Each tab owns its draft, its Save/Discard pair, its inline validation and its
 * success toast (`role="status"`); the parent owns the tab bar and the
 * "Discard changes?" guard.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BusinessLogo } from "@/components/business-logo";
import { CategoryLockBadge } from "@/components/category/category-lock-badge";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import {
  businessPresets,
  businessTypeLabels,
  businessTypes,
  type BusinessType,
} from "@/lib/brand/tokens";
import { contrastRatio, getBrandTheme, type ColorSource } from "@/lib/brand/theme";
import { settingsLockText } from "@/lib/category/copy";
import { normalizeCategory } from "@/lib/category/features";
import { guardBusinessPatch } from "@/lib/category/lock";
import { TYPES_BY_CATEGORY } from "@/lib/category/types";
import type { DemoScenario } from "@/lib/mock/demo";
import {
  getMockSettings,
  saveMockSettings,
  settingsTypeLabel,
  timeZoneOptions,
  type MockSettings,
} from "@/lib/mock/settings";
import {
  logoDataUrlFromFile,
  LOGO_ACCEPTED_TYPES,
  LOGO_MAX_SOURCE_BYTES,
  resetBusiness,
} from "@/lib/mock/store";
import {
  EMAIL_FORMAT_MESSAGE,
  isValidEmail,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_TAGLINE_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_LENGTH_MESSAGE,
} from "@/lib/validation";
import { ReauthDialog } from "./reauth-dialog";

const SAVED_MESSAGE = "Changes saved.";
const DISCARDED_MESSAGE = "Changes discarded.";
/** Storage full/unavailable: the change lasts for this session only. */
const SESSION_ONLY_MESSAGE =
  "Saved for this session only — it will not survive a reload.";

/** business-rules.md 10: warn (never block) under this contrast ratio. */
const MIN_READABLE_CONTRAST = 4.5;

export type SettingsTabProps = {
  scenario: DemoScenario;
  settings: MockSettings;
  /** Bubble unsaved-edits state up to the tab plumbing guard. */
  onDirtyChange: (dirty: boolean) => void;
  /** Re-read the store in the parent after a successful save. */
  onSaved: () => void;
};

const labelClass = "block text-[13px] font-medium";
const primaryButtonClass =
  "inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

// ---------------------------------------------------------------------------
// Tab 1 — Business profile (PRD.md 5.4.1).
// ---------------------------------------------------------------------------

type ProfileDraft = {
  name: string;
  business_type: BusinessType;
  tagline: string;
  time_zone: string;
  logo_url: string | null;
};

function profileDraft(settings: MockSettings): ProfileDraft {
  return {
    name: settings.name,
    business_type: settings.business_type,
    tagline: settings.tagline,
    time_zone: settings.time_zone,
    logo_url: settings.logo_url,
  };
}

export function BusinessProfileTab({
  scenario,
  settings,
  onDirtyChange,
  onSaved,
}: SettingsTabProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraft(settings));
  const [baseline, setBaseline] = useState<ProfileDraft>(() => profileDraft(settings));
  const [toast, setToast] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>();
  const [taglineError, setTaglineError] = useState<string>();
  const [logoError, setLogoError] = useState<string>();
  // Category gate: a refused category/type change never reaches the store.
  const [guardError, setGuardError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const zones = useMemo(() => timeZoneOptions(), []);

  // The category is locked at sign-up; the type may only move INSIDE it.
  const category = normalizeCategory(settings.business_category);
  const categoryTypes = TYPES_BY_CATEGORY[category];
  // A hotel has exactly one type, so it is shown read-only (no choice at all).
  const typeEditable = categoryTypes.length > 1;

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // MOCK ONLY, removed in Stage 4: the shared profile is read after mount, so
  // load it into the draft when it arrives (never over unsaved edits).
  const settingsSignature = JSON.stringify(profileDraft(settings));
  useEffect(() => {
    if (dirty) return;
    const fresh = profileDraft(settings);
    setDraft(fresh);
    setBaseline(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsSignature]);

  // PRD 5.4.1: the time zone defaults from the browser. The schema default
  // (Asia/Kolkata) is always seeded by the mock, so this only fills an empty
  // stored value, after mount, to stay hydration-safe.
  useEffect(() => {
    if (settings.time_zone) return;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    setDraft((current) =>
      current.time_zone ? current : { ...current, time_zone: zone },
    );
    setBaseline((current) =>
      current.time_zone ? current : { ...current, time_zone: zone },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneOptions = useMemo(() => {
    const list = [...zones];
    if (draft.time_zone && !list.includes(draft.time_zone)) {
      list.unshift(draft.time_zone);
    }
    return list;
  }, [zones, draft.time_zone]);

  // PRD 5.4.1 + business-rules.md 10: which colour behaviour a save will have.
  // `color_source` is owned by the Appearance tab, never edited here.
  const typeNote =
    settings.color_source === "preset"
      ? `Saving re-applies the ${settingsTypeLabel(draft.business_type)} preset colours (your colours are set to a preset). Your short link and slug never change.`
      : "Your custom colours are kept when you change the business type. Your short link and slug never change.";

  async function handleLogoFile(file: File | undefined) {
    if (!file) return;
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > LOGO_MAX_SOURCE_BYTES) {
      setLogoError("Keep the logo under 1 MB.");
      return;
    }
    setLogoError(undefined);
    // Mock only: nothing is uploaded. Downscale to <= 256 px so the data URL
    // fits in localStorage (lib/mock/store.ts).
    const dataUrl = await logoDataUrlFromFile(file);
    if (!dataUrl) {
      setLogoError("Could not read that image. Choose another file.");
      return;
    }
    setDraft((current) => ({ ...current, logo_url: dataUrl }));
  }

  function handleRemoveLogo() {
    setLogoError(undefined);
    setDraft((current) => ({ ...current, logo_url: null }));
  }

  function handleSave() {
    const name = draft.name.trim();
    let valid = true;
    if (!name) {
      setNameError("Enter your business name.");
      valid = false;
    } else if (name.length > MAX_BUSINESS_NAME_LENGTH) {
      setNameError(`Keep the name under ${MAX_BUSINESS_NAME_LENGTH} characters.`);
      valid = false;
    } else {
      setNameError(undefined);
    }
    if (draft.tagline.trim().length > MAX_TAGLINE_LENGTH) {
      setTaglineError(`Keep the tagline under ${MAX_TAGLINE_LENGTH} characters.`);
      valid = false;
    } else {
      setTaglineError(undefined);
    }
    if (!valid) return;

    // Category gate: the store has the same guard, but it cannot explain
    // itself, so check here first and show plain English instead of a silent
    // no-op save.
    const guard = guardBusinessPatch(settings, {
      business_type: draft.business_type,
    });
    if (!guard.ok) {
      setGuardError(
        guard.code === "category_locked"
          ? "Your business category is locked and cannot be changed here. Contact Syehere support if it is wrong."
          : "That business type is not part of your locked category. Choose one of the types listed.",
      );
      return;
    }
    setGuardError(undefined);

    // business-rules.md 10: a preset color_source re-applies the new type's
    // preset colours AND its default logo; custom colours (and an uploaded
    // logo) are never overwritten by a type change.
    const typeChanged = draft.business_type !== settings.business_type;
    const presetSource = settings.color_source === "preset";
    const preset = businessPresets[draft.business_type];
    const colors = presetSource
      ? { primary_color: preset.primary, secondary_color: preset.secondary }
      : { primary_color: settings.primary_color, secondary_color: settings.secondary_color };
    const logo_url = typeChanged && presetSource ? null : draft.logo_url;

    const result = saveMockSettings(scenario, {
      ...draft,
      name,
      tagline: draft.tagline.trim(),
      logo_url,
      ...colors,
    });
    const fresh = profileDraft(result.settings);
    setDraft(fresh);
    setBaseline(fresh);
    setToast(result.persisted ? SAVED_MESSAGE : SESSION_ONLY_MESSAGE);
    onSaved();
  }

  // MOCK ONLY (removed in Stage 4): clears the one shared localStorage profile
  // and returns every screen to the static demo business.
  function handleResetDemo() {
    if (!window.confirm("Reset the demo business back to the default mock?")) {
      return;
    }
    resetBusiness();
    const fresh = profileDraft(getMockSettings(scenario));
    setDraft(fresh);
    setBaseline(fresh);
    setLogoError(undefined);
    setToast("Demo data reset to the default mock.");
    onSaved();
  }

  function handleDiscard() {
    setDraft(baseline);
    setNameError(undefined);
    setTaglineError(undefined);
    setLogoError(undefined);
    setGuardError(undefined);
    setToast(DISCARDED_MESSAGE);
  }

  const activePreset = businessPresets[draft.business_type];

  return (
    <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
      {/* The category is read-only, with the lock badge and
          the exact Settings lock text. There is no control to change it. */}
      <div className="mb-5 rounded-card border border-black/10 bg-surface-muted p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className={labelClass}>Business category</p>
          <CategoryLockBadge category={category} size="md" />
        </div>
        <p className="mt-1 text-[12px] text-ink-muted">
          {settingsLockText(category)}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          label="Business name"
          value={draft.name}
          maxLength={MAX_BUSINESS_NAME_LENGTH /* PRD 5.4.1: 100 */}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          error={nameError}
          hint="Required."
        />
        <div>
          {typeEditable ? (
            <Select
              label="Business type"
              value={draft.business_type}
              onChange={(event) => {
                setGuardError(undefined);
                setDraft((current) => ({
                  ...current,
                  business_type: event.target.value as BusinessType,
                }));
              }}
            >
              {categoryTypes.map((type) => (
                <option key={type} value={type}>
                  {businessTypeLabels[type]}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <p className={labelClass}>Business type</p>
              <p className="mt-1 flex h-10 items-center rounded-control border border-black/15 bg-surface-muted px-3 text-[14px] text-ink">
                {businessTypeLabels[draft.business_type]}
              </p>
            </>
          )}
          <p className="mt-2 text-[12px] text-ink-muted">
            {typeEditable
              ? typeNote
              : `Your category has one business type. ${typeNote}`}
          </p>
        </div>
        <Input
          label="Tagline"
          value={draft.tagline}
          maxLength={MAX_TAGLINE_LENGTH /* PRD 5.4.1: 120, optional */}
          onChange={(event) =>
            setDraft((current) => ({ ...current, tagline: event.target.value }))
          }
          error={taglineError}
          hint="Optional. Shown on the customer page and in emails."
        />
        <div>
          <Select
            label="Time zone"
            value={draft.time_zone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                time_zone: event.target.value,
              }))
            }
          >
            {zoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-[12px] text-ink-muted">
            Used for “Open now” on the customer page and for weekly report
            timing.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className={labelClass}>Logo</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-card border border-black/10 bg-white">
            {draft.logo_url?.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.logo_url}
                alt="Uploaded logo preview"
                className="h-11 w-11 object-contain"
              />
            ) : (
              <BusinessLogo
                type={draft.business_type}
                size={32}
                color={activePreset.primary}
              />
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={LOGO_ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                void handleLogoFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={secondaryButtonClass}
            >
              {draft.logo_url ? "Replace logo" : "Upload logo"}
            </button>
            {draft.logo_url ? (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className={secondaryButtonClass}
              >
                Remove logo
              </button>
            ) : null}
          </div>
        </div>
        {logoError ? (
          <p className="mt-2 text-[12px] text-red-700">{logoError}</p>
        ) : null}
        <p className="mt-2 text-[12px] text-ink-muted">
          PNG, JPEG or WebP up to 1 MB. Removing the logo returns to the default
          logo for your business type. Nothing is uploaded in this demo.
        </p>
      </div>

      <div className="mt-5">
        <p className={labelClass}>Google review link</p>
        <p className="mt-1 break-all text-[13px] text-ink-muted">
          {settings.google_review_url}
        </p>
        <Link
          href="/locations"
          className="mt-2 inline-block text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          Manage in Locations
        </Link>
        <p className="mt-1 text-[12px] text-ink-muted">
          Read-only here, so there is one place to change it. Saving takes effect
          on the review page immediately — no new link is ever created.
        </p>
      </div>

      {guardError ? (
        <p role="alert" className="mt-4 text-[12px] text-red-700">
          {guardError}
        </p>
      ) : null}

      <TabActions
        dirty={dirty}
        toast={toast}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* MOCK ONLY (removed in Stage 4): clears the shared localStorage profile
          so the demo returns to the static mock. */}
      <div className="mt-4 border-t border-black/5 pt-4">
        <button
          type="button"
          onClick={handleResetDemo}
          className={secondaryButtonClass}
        >
          Reset demo data
        </button>
        <p className="mt-2 text-[12px] text-ink-muted">
          Demo only: restores the default demo business on this browser.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Appearance (PRD.md 8.1, business-rules.md 10, brand-guide.md).
// ---------------------------------------------------------------------------

type ColorDraft = {
  primary_color: string;
  secondary_color: string;
  color_source: ColorSource;
};

function colorDraft(settings: MockSettings): ColorDraft {
  return {
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    color_source: settings.color_source,
  };
}

export function AppearanceTab({
  scenario,
  settings,
  onDirtyChange,
  onSaved,
}: SettingsTabProps) {
  const [draft, setDraft] = useState<ColorDraft>(() => colorDraft(settings));
  const [baseline, setBaseline] = useState<ColorDraft>(() => colorDraft(settings));
  const [toast, setToast] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // MOCK ONLY, removed in Stage 4: load the post-mount shared profile into the
  // colour draft (never over unsaved edits).
  const settingsSignature = JSON.stringify(colorDraft(settings));
  useEffect(() => {
    if (dirty) return;
    const fresh = colorDraft(settings);
    setDraft(fresh);
    setBaseline(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsSignature]);

  // The derived theme for the draft (business-rules.md 10: ONE helper).
  const theme = useMemo(
    () =>
      getBrandTheme({
        business_type: settings.business_type,
        primary_color: draft.primary_color,
        secondary_color: draft.secondary_color,
        color_source: draft.color_source,
      }),
    [settings.business_type, draft],
  );
  const onPrimaryContrast = contrastRatio(theme.onPrimary, theme.primary);
  const lowContrast = onPrimaryContrast < MIN_READABLE_CONTRAST;

  function pickPreset(type: BusinessType) {
    // PRD 8.1 / business-rules.md 10: a preset chip applies BOTH colours and
    // marks the source as `preset`. It does not change the business type.
    const preset = businessPresets[type];
    setDraft({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      color_source: "preset",
    });
  }

  function setColor(key: "primary_color" | "secondary_color", value: string) {
    // business-rules.md 10: editing either colour input marks it custom.
    setDraft((current) => ({
      ...current,
      [key]: value.toUpperCase(),
      color_source: "custom",
    }));
  }

  function handleSave() {
    const result = saveMockSettings(scenario, {
      primary_color: draft.primary_color,
      secondary_color: draft.secondary_color,
      color_source: draft.color_source,
    });
    setBaseline(draft);
    setToast(result.persisted ? SAVED_MESSAGE : SESSION_ONLY_MESSAGE);
    onSaved();
  }

  function handleDiscard() {
    setDraft(baseline);
    setToast(DISCARDED_MESSAGE);
  }

  return (
    <div className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
      <p className={labelClass}>Preset colours</p>
      <div
        role="group"
        aria-label="Preset colours"
        className="mt-2 flex flex-wrap gap-2"
      >
        {businessTypes.map((type) => {
          const preset = businessPresets[type];
          const isActive =
            draft.color_source === "preset" &&
            draft.primary_color === preset.primary &&
            draft.secondary_color === preset.secondary;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={isActive}
              onClick={() => pickPreset(type)}
              className={`inline-flex h-10 items-center gap-2 rounded-control border px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                isActive
                  ? "border-brand-blue bg-brand-blue/10 text-ink"
                  : "border-black/15 bg-white text-ink hover:bg-surface-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: preset.primary }}
              />
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: preset.secondary }}
              />
              {businessTypeLabels[type]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">
        A preset sets both colours at once and marks them as a preset (a later
        business-type change re-applies them).
      </p>

      <p className={`${labelClass} mt-5`}>Custom colours</p>
      <div className="mt-2 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
          Primary
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={draft.primary_color}
              onChange={(event) => setColor("primary_color", event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-control border border-black/15 bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
            <span className="tabular-nums text-ink">
              {draft.primary_color}
            </span>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
          Secondary
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={draft.secondary_color}
              onChange={(event) => setColor("secondary_color", event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-control border border-black/15 bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            />
            <span className="tabular-nums text-ink">
              {draft.secondary_color}
            </span>
          </span>
        </label>
        <p className="text-[12px] text-ink-muted">
          {draft.color_source === "custom"
            ? "Custom colours are kept when you change the business type."
            : "Editing a colour switches you to custom colours."}
        </p>
      </div>

      {/* Live preview — getBrandTheme drives every value below (PRD 8.1). */}
      <p className={`${labelClass} mt-5`}>Live preview</p>
      <div
        className="mt-2 rounded-card border border-black/10 p-5"
        style={{ backgroundColor: theme.pageBackground }}
      >
        <div
          className="flex items-center gap-3 rounded-control px-4 py-3"
          style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
        >
          <BusinessLogo
            type={settings.business_type}
            size={28}
            color={theme.onPrimary}
          />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium">
              {settings.name}
            </span>
            {settings.tagline ? (
              <span className="block truncate text-[12px] opacity-90">
                {settings.tagline}
              </span>
            ) : null}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total scans", value: "1,024" },
            { label: "Reviews collected", value: "86" },
            { label: "Pending feedback", value: "4" },
          ].map((card) => (
            <div
              key={card.label}
              className="min-h-[72px] rounded-card border border-black/10 bg-white p-3"
            >
              <p className="text-[11px] text-ink-muted">{card.label}</p>
              <p
                className="mt-1 text-[20px] font-medium tabular-nums"
                style={{ color: theme.primary }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex h-9 items-center rounded-control px-3 text-[13px] font-medium"
            style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
          >
            Share QR code
          </span>
          <span
            className="inline-flex h-9 items-center rounded-control border bg-white px-3 text-[13px] font-medium"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            View live page
          </span>
          <span
            className="ml-auto text-[16px] tracking-[0.15em]"
            style={{ color: theme.starColor }}
            aria-label="Star colour preview"
          >
            ★★★★★
          </span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-5">
        {[
          { label: "Primary", value: theme.primary },
          { label: "Secondary", value: theme.secondary },
          { label: "Page background", value: theme.pageBackground },
          { label: "Star colour", value: theme.starColor },
          { label: "Text on primary", value: theme.onPrimary },
        ].map((row) => (
          <div key={row.label}>
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="tabular-nums text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p
        className={`mt-3 text-[12px] ${
          lowContrast ? "text-amber-800" : "text-ink-muted"
        }`}
      >
        {lowContrast
          ? `These colours are hard to read: the text on your primary colour has only ${onPrimaryContrast.toFixed(
              1,
            )}:1 contrast (4.5:1 is the readable minimum). You can still save them.`
          : `Text on your primary colour has ${onPrimaryContrast.toFixed(
              1,
            )}:1 contrast — easy to read.`}
      </p>

      <p className="mt-3 text-[12px] text-ink-muted">
        Saved colours are the single source of truth: they also drive the QR code
        colour and the weekly email report header. Page background and star
        colour are derived automatically.
      </p>

      <TabActions
        dirty={dirty}
        toast={toast}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Account & security (PRD.md 5.4.5, security sections 1 and 7).
// ---------------------------------------------------------------------------

export function AccountSecurityTab({
  scenario,
  settings,
  onDirtyChange,
  onSaved,
  onDeleted,
}: SettingsTabProps & { onDeleted: () => void }) {
  const [reauthFor, setReauthFor] = useState<"email" | "password" | "delete" | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmName, setConfirmName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const dirty =
    (emailOpen && newEmail.trim().length > 0) ||
    (passwordOpen && newPassword.length > 0);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const nameMatches = confirmName.trim() === settings.name && settings.name.length > 0;

  function handleSaveEmail(event: React.FormEvent) {
    event.preventDefault();
    const value = newEmail.trim();
    if (!value) {
      setEmailError("Enter the new email address.");
      return;
    }
    if (value.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Keep the email under ${MAX_EMAIL_LENGTH} characters.`);
      return;
    }
    if (!isValidEmail(value)) {
      setEmailError(EMAIL_FORMAT_MESSAGE);
      return;
    }
    saveMockSettings(scenario, { owner_email: value });
    setEmailOpen(false);
    setNewEmail("");
    setEmailError(undefined);
    setToast("Email updated. You will need to verify the new address.");
    onSaved();
  }

  function handleSavePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(PASSWORD_LENGTH_MESSAGE);
      return;
    }
    // Mock only: nothing is stored/changed. security section 1: a credential
    // change revokes other sessions.
    setPasswordOpen(false);
    setNewPassword("");
    setPasswordError(undefined);
    setToast("Password updated. All other devices are signed out.");
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-[15px] font-medium text-ink">Email address</h2>
        <p className="mt-1 break-all text-[13px] text-ink-muted">
          {settings.owner_email}
        </p>
        {emailOpen ? (
          <form onSubmit={handleSaveEmail} className="mt-3 max-w-md">
            <Input
              label="New email address"
              type="email"
              autoComplete="email"
              value={newEmail}
              maxLength={MAX_EMAIL_LENGTH /* security 4C: 254 */}
              onChange={(event) => setNewEmail(event.target.value)}
              error={emailError}
              hint="We send a verification link to the new address."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" className={primaryButtonClass}>
                Save email
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailOpen(false);
                  setNewEmail("");
                  setEmailError(undefined);
                }}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReauthFor("email")}
            className={`${secondaryButtonClass} mt-3`}
          >
            Change email
          </button>
        )}
      </section>

      <section className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-[15px] font-medium text-ink">Password</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Changing your password signs out every other device.
        </p>
        {passwordOpen ? (
          <form onSubmit={handleSavePassword} className="mt-3 max-w-md">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              maxLength={128}
              onChange={(event) => setNewPassword(event.target.value)}
              error={passwordError}
              hint={PASSWORD_LENGTH_MESSAGE}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" className={primaryButtonClass}>
                Update password
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordOpen(false);
                  setNewPassword("");
                  setPasswordError(undefined);
                }}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReauthFor("password")}
            className={`${secondaryButtonClass} mt-3`}
          >
            Change password
          </button>
        )}
      </section>

      <section className="rounded-card border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-[15px] font-medium text-ink">Devices</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Sign out of every device you are signed in on, except this one.
        </p>
        <button
          type="button"
          onClick={() => setToast("All other devices have been signed out.")}
          className={`${secondaryButtonClass} mt-3`}
        >
          Log out of all devices
        </button>
      </section>

      {/* Delete account (PRD 5.4.5 + security-and-reliability.md section 7).
          The bullets below restate the section 7 deletion list for the owner. */}
      <section className="rounded-card border border-red-200 p-5">
        <h2 className="text-[15px] font-medium text-red-700">Delete account</h2>
        <p className="mt-1 text-[13px] text-ink">
          This permanently deletes your Syehere account:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-ink-muted">
          <li>Your subscription is cancelled.</li>
          <li>
            Your business is deleted, along with its review pages, feedback and
            scan history.
          </li>
          <li>Your logo and QR files are deleted from storage.</li>
          <li>
            Your Syehere login is deleted and can no longer sign in.
          </li>
          <li>
            Payment records and audit logs are kept only as long as the law
            requires, with your personal details removed where possible.
          </li>
          <li>A confirmation email is sent when it is done.</li>
        </ul>
        <div className="mt-4 max-w-md">
          <Input
            label="Business name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            hint={`Type “${settings.name}” exactly to enable the button.`}
          />
          {confirmName.length > 0 && !nameMatches ? (
            <p className="mt-1 text-[12px] text-red-700">
              The name does not match.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!nameMatches}
          onClick={() => setReauthFor("delete")}
          className="mt-3 inline-flex h-10 items-center rounded-control bg-red-700 px-3 text-[13px] font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete account
        </button>
      </section>

      {toast ? (
        <p role="status" className="text-[12px] text-brand-green-deep">
          {toast}
        </p>
      ) : null}

      <ReauthDialog
        open={reauthFor !== null}
        description={
          reauthFor === "delete"
            ? "Deleting your account is permanent. Confirm it's you to continue."
            : reauthFor === "email"
              ? "Changing your email is a sensitive action. Confirm it's you to continue."
              : "Changing your password is a sensitive action. Confirm it's you to continue."
        }
        confirmLabel="Continue"
        onClose={() => setReauthFor(null)}
        onConfirm={() => {
          const action = reauthFor;
          setReauthFor(null);
          if (action === "email") setEmailOpen(true);
          if (action === "password") setPasswordOpen(true);
          if (action === "delete") onDeleted();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared tab footer: Save / Discard + inline validation happens in the tab.
// ---------------------------------------------------------------------------

function TabActions({
  dirty,
  toast,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  toast: string | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
      <button type="button" onClick={onSave} disabled={!dirty} className={primaryButtonClass}>
        Save changes
      </button>
      <button
        type="button"
        onClick={onDiscard}
        disabled={!dirty}
        className={secondaryButtonClass}
      >
        Discard
      </button>
      {toast ? (
        <p role="status" className="text-[12px] text-brand-green-deep">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

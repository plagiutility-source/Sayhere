"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BusinessLogo } from "@/components/business-logo";
import { Button, ButtonLink } from "@/components/button";
import { CategoryLockBadge } from "@/components/category/category-lock-badge";
import { CategoryPicker } from "@/components/category/category-picker";
import { CategoryWarningPopup } from "@/components/category/category-warning-popup";
import { Input } from "@/components/input";
import { Logo } from "@/components/logo";
import {
  BusinessDetailsForm,
  type BusinessDetailsValues,
} from "@/components/onboarding/business-details-form";
import { Spinner } from "@/components/spinner";
import { getBrandTheme } from "@/lib/brand/theme";
import {
  businessPresets,
  businessTypeLabels,
  type BusinessType,
} from "@/lib/brand/tokens";
import {
  TYPES_BY_CATEGORY,
  type BusinessCategory,
  type CategoryBusinessType,
} from "@/lib/category/types";
import {
  validateAddressLine,
  validateBusinessName,
  validateCity,
  validateDeclaredUnits,
  validateFssai,
  validateGstin,
  validateLicence,
  validateOnboarding,
  validatePhone,
  validatePincode,
  type FieldCheck,
} from "@/lib/category/proof";
// MOCK ONLY, removed in Stage 4: the lock, the profile and the slug live in
// localStorage instead of an API.
import {
  clearCategoryLockForDev,
  readCategoryLock,
  type CategoryLock,
} from "@/lib/mock/category-store";
import { slugForType } from "@/lib/mock/business";
import {
  logoDataUrlFromFile,
  LOGO_ACCEPTED_TYPES,
  LOGO_MAX_SOURCE_BYTES,
  presetColorsFor,
  saveBusiness,
} from "@/lib/mock/store";
import {
  MAX_REVIEW_URL_LENGTH,
  validateGoogleReviewUrl,
} from "@/lib/validation";

const STEPS = [
  { id: 1, label: "Category" },
  { id: 2, label: "Business details" },
  { id: 3, label: "Logo & theme" },
  { id: 4, label: "Google review link" },
] as const;

type LogoMode = "default" | "upload";

const EMPTY_DETAILS: BusinessDetailsValues = {
  name: "",
  businessType: "",
  tagline: "",
  addressLine: "",
  city: "",
  pincode: "",
  phone: "",
  fssai: "",
  declaredTables: "",
  declaredRooms: "",
  registrationType: "",
  registrationNumber: "",
  gstin: "",
  companyWebsite: "",
};

function defaultTypeFor(category: BusinessCategory): CategoryBusinessType | "" {
  return category === "hotel" ? "hotel" : "";
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [categoryLock, setCategoryLock] = useState<CategoryLock | null>(null);
  const [lockedChecked, setLockedChecked] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BusinessCategory | null>(null);
  const [categoryError, setCategoryError] = useState<string>();

  // Step 2 — business details and the category proof.
  const [details, setDetails] = useState<BusinessDetailsValues>(EMPTY_DETAILS);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});

  // Step 3 — logo and theme. Mock only: the file is never uploaded.
  const [logoMode, setLogoMode] = useState<LogoMode>("default");
  const [logoFileName, setLogoFileName] = useState<string>();
  const [logoDataUrl, setLogoDataUrl] = useState<string>();
  const [logoError, setLogoError] = useState<string>();

  // Step 4 — Google review link, then the completion screen.
  const [reviewUrl, setReviewUrl] = useState("");
  const [reviewUrlError, setReviewUrlError] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string>();
  const [finished, setFinished] = useState(false);

  // Restore a lock that was confirmed before a refresh. `?demoReset=1` is a
  // developer-only reset (MOCK ONLY, never works in production).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demoReset") === "1") clearCategoryLockForDev();
    }
    const lock = readCategoryLock();
    setCategoryLock(lock);
    if (lock) {
      setDetails((current) => ({
        ...current,
        businessType: defaultTypeFor(lock.category),
      }));
    }
    setLockedChecked(true);
  }, []);

  const category = categoryLock?.category ?? null;
  const activeType: BusinessType =
    (details.businessType as BusinessType) ||
    (category ? (defaultTypeFor(category) as BusinessType) : "") ||
    "other";
  const preset = businessPresets[activeType];

  function onLocked(lock: CategoryLock) {
    setCategoryLock(lock);
    setSelectedCategory(null);
    setCategoryError(undefined);
    setDetails((current) => ({
      ...current,
      businessType: defaultTypeFor(lock.category),
    }));
  }

  function collect(
    errors: Record<string, string>,
    key: string,
    result: FieldCheck,
  ) {
    if (!result.ok) errors[key] = result.message;
  }

  function validateDetails(): boolean {
    if (!category) return false;
    const errors: Record<string, string> = {};
    // G8: never explain the honeypot, only fail generically.
    if (details.companyWebsite.trim()) {
      errors.form = "Something went wrong. Try again.";
    }
    collect(errors, "business_name", validateBusinessName(details.name));
    if (
      !details.businessType ||
      !(TYPES_BY_CATEGORY[category] as readonly string[]).includes(
        details.businessType,
      )
    ) {
      errors.business_type = "Choose a business type from your category.";
    }
    collect(errors, "address_line", validateAddressLine(details.addressLine));
    collect(errors, "city", validateCity(details.city));
    collect(errors, "pincode", validatePincode(details.pincode));
    collect(errors, "phone", validatePhone(details.phone));

    if (category === "food") {
      collect(errors, "fssai", validateFssai(details.fssai));
      collect(
        errors,
        "declared_tables",
        validateDeclaredUnits("tables", details.declaredTables),
      );
    } else if (category === "hotel") {
      collect(
        errors,
        "declared_rooms",
        validateDeclaredUnits("rooms", details.declaredRooms),
      );
      if (!details.registrationType) {
        errors.registration = "Add your GSTIN or a local trade or tourism licence number.";
      } else if (details.registrationType === "gstin") {
        collect(errors, "registration", validateGstin(details.registrationNumber));
      } else {
        collect(errors, "registration", validateLicence(details.registrationNumber));
      }
    } else if (details.gstin.trim()) {
      collect(errors, "gstin", validateGstin(details.gstin));
    }

    setDetailsErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateLogo(): boolean {
    if (logoMode === "upload" && !logoFileName) {
      setLogoError("Choose an image, or switch to the default logo.");
      return false;
    }
    setLogoError(undefined);
    return true;
  }

  function validateReviewLink(): boolean {
    const trimmed = reviewUrl.trim();
    if (!trimmed) {
      setReviewUrlError("Paste your Google review link.");
      return false;
    }
    const error = validateGoogleReviewUrl(trimmed);
    if (error) {
      setReviewUrlError(error);
      return false;
    }
    setReviewUrlError(undefined);
    return true;
  }

  async function handleLogoFile(file: File) {
    setLogoError(undefined);
    const lowerName = file.name.toLowerCase();
    if (file.type === "image/svg+xml" || lowerName.endsWith(".svg")) {
      setLogoError("SVG files are not allowed. Use a PNG, JPEG or WebP image.");
      return;
    }
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > LOGO_MAX_SOURCE_BYTES) {
      setLogoError("That file is larger than 1 MB. Choose a smaller image.");
      return;
    }
    setLogoFileName(file.name);
    const dataUrl = await logoDataUrlFromFile(file);
    if (!dataUrl) {
      setLogoFileName(undefined);
      setLogoError("Could not read that image. Choose another file.");
      return;
    }
    setLogoDataUrl(dataUrl);
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  /** The proof JSON saved with the profile (format-checked, never "verified"). */
  function proofJson(): string {
    return JSON.stringify({
      address: details.addressLine.trim(),
      city: details.city.trim(),
      pincode: details.pincode.trim(),
      phone: details.phone.trim(),
      registration_type:
        category === "food"
          ? "fssai"
          : category === "hotel"
            ? details.registrationType || null
            : details.gstin.trim()
              ? "gstin"
              : null,
      registration_number:
        category === "food"
          ? details.fssai.trim()
          : category === "hotel"
            ? details.registrationNumber.trim()
            : details.gstin.trim(),
      declared_units:
        category === "food"
          ? Number(details.declaredTables)
          : category === "hotel"
            ? Number(details.declaredRooms)
            : null,
    });
  }

  async function handleFinish() {
    if (!categoryLock) {
      setCategoryError("Choose and lock your category first.");
      setStep(1);
      return;
    }
    // Run every gate again at finish, never only on the step buttons.
    const finalCheck = validateOnboarding({
      category: categoryLock.category,
      business_name: details.name,
      business_type: details.businessType,
      address_line: details.addressLine,
      city: details.city,
      pincode: details.pincode,
      phone: details.phone,
      google_review_url: reviewUrl,
      fssai: details.fssai,
      declared_tables: details.declaredTables,
      declared_rooms: details.declaredRooms,
      registration_type: details.registrationType,
      registration_number: details.registrationNumber,
      gstin: details.gstin,
      company_website: details.companyWebsite,
    });
    if (!finalCheck.ok) {
      const { google_review_url, ...detailErrors } = finalCheck.errors;
      setDetailsErrors(detailErrors);
      if (google_review_url) setReviewUrlError(google_review_url);
      if (Object.keys(detailErrors).length > 0) setStep(2);
      else setReviewUrlError(google_review_url);
      return;
    }

    setSaving(true);
    setSaveError(undefined);
    const type = details.businessType as BusinessType;
    // Mock only: a short fake round trip, then the shared profile is written
    // into localStorage. Nothing is uploaded and no API is called in Stage 1.
    await new Promise((resolve) => setTimeout(resolve, 900));
    const slug = slugForType(type);
    const result = saveBusiness(
      {
        slug,
        name: details.name.trim(),
        business_type: type,
        tagline: details.tagline.trim(),
        logo_url: logoMode === "upload" ? logoDataUrl ?? null : null,
        ...presetColorsFor(type),
        color_source: "preset",
        google_review_url: reviewUrl.trim(),
        business_category: categoryLock.category,
        category_confirm_text: categoryLock.typedText,
        category_confirmed_at: categoryLock.confirmedAt,
        onboarding_proof: proofJson(),
        verification_status: "pending",
      },
      { allowCategorySetup: true },
    );
    setSaving(false);
    if (
      result.business.business_category !== categoryLock.category ||
      result.business.slug !== slug
    ) {
      setSaveError("Could not save your business. Try again.");
      return;
    }
    setSavedSlug(slug);
    setFinished(true);
  }

  async function goNext() {
    if (step === 1) {
      if (!categoryLock) {
        setCategoryError("Choose a category and type its name to lock it.");
        return;
      }
      setCategoryError(undefined);
    }
    if (step === 2 && !validateDetails()) return;
    if (step === 3 && !validateLogo()) return;
    if (step === 4) {
      if (!validateReviewLink()) return;
      await handleFinish();
      return;
    }
    setStep((current) => Math.min(STEPS.length, current + 1));
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-brand-blue to-brand-green"
      />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-lg py-xl sm:px-xl">
        <Link
          href="/"
          aria-label="Syehere home"
          className="inline-flex items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <Logo variant="horizontal" height={26} />
        </Link>
        {finished ? null : (
          <span className="text-[13px] text-ink-muted">
            Step {step} of {STEPS.length}
          </span>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-lg pb-3xl sm:px-xl">
        {finished && savedSlug && categoryLock ? (
          <CompletionScreen
            slug={savedSlug}
            name={details.name.trim()}
            type={activeType}
            category={categoryLock.category}
            logoDataUrl={logoDataUrl}
          />
        ) : (
          <>
            <h1 className="font-display text-[24px] font-medium sm:text-[28px]">
              Set up your business
            </h1>
            <p className="mt-sm text-[14px] text-ink-muted">
              Four quick steps. Your category is locked in step 1.
            </p>

            <StepIndicator current={step} />

            <div className="mt-2xl rounded-card border border-black/10 bg-white p-2xl shadow-soft">
              {step === 1 ? (
                <div className="grid gap-lg">
                  {!lockedChecked ? (
                    <p className="text-[13px] text-ink-muted">Loading your category…</p>
                  ) : (
                    <CategoryPicker
                      locked={category}
                      selected={selectedCategory}
                      onSelect={(next) => {
                        setSelectedCategory(next);
                        setCategoryError(undefined);
                      }}
                    />
                  )}
                  {categoryError ? (
                    <p className="text-[12px] text-red-700">{categoryError}</p>
                  ) : null}
                  {category ? (
                    <p className="text-[12px] text-ink-muted">
                      You can change the business type inside this category later,
                      but never the category itself.
                    </p>
                  ) : null}
                </div>
              ) : step === 2 && category ? (
                <div className="grid gap-lg">
                  <BusinessDetailsForm
                    category={category}
                    values={details}
                    errors={detailsErrors}
                    onChange={(patch) =>
                      setDetails((current) => ({ ...current, ...patch }))
                    }
                  />
                  {detailsErrors.form ? (
                    <p className="text-[12px] text-red-700">
                      {detailsErrors.form}
                    </p>
                  ) : null}
                </div>
              ) : step === 3 ? (
                <div className="grid gap-2xl lg:grid-cols-[1fr_300px]">
                  <div>
                    <fieldset>
                      <legend className="text-[13px] font-medium">Logo</legend>
                      <div className="mt-md grid gap-md">
                        <label
                          className={`flex min-h-12 cursor-pointer items-start gap-md rounded-control border p-lg transition-colors focus-within:ring-2 focus-within:ring-brand-blue ${
                            logoMode === "default"
                              ? "border-brand-blue bg-brand-blue/5"
                              : "border-black/15 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="logo-mode"
                            value="default"
                            checked={logoMode === "default"}
                            onChange={() => setLogoMode("default")}
                            className="mt-xs h-4 w-4 accent-brand-blue"
                          />
                          <span className="flex-1">
                            <span className="block text-[14px] font-medium">
                              Use a default logo
                            </span>
                            <span className="mt-xs block text-[12px] text-ink-muted">
                              We use the {businessTypeLabels[activeType]} logo and
                              color theme.
                            </span>
                          </span>
                          <BusinessLogo
                            type={activeType}
                            size={36}
                            color={preset.primary}
                          />
                        </label>

                        <label
                          className={`flex min-h-12 cursor-pointer items-start gap-md rounded-control border p-lg transition-colors focus-within:ring-2 focus-within:ring-brand-blue ${
                            logoMode === "upload"
                              ? "border-brand-blue bg-brand-blue/5"
                              : "border-black/15 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="logo-mode"
                            value="upload"
                            checked={logoMode === "upload"}
                            onChange={() => setLogoMode("upload")}
                            className="mt-xs h-4 w-4 accent-brand-blue"
                          />
                          <span className="flex-1">
                            <span className="block text-[14px] font-medium">
                              Upload your logo
                            </span>
                            <span className="mt-xs block text-[12px] text-ink-muted">
                              PNG, JPEG or WebP. Up to 1 MB.
                            </span>
                          </span>
                        </label>
                      </div>
                    </fieldset>

                    {logoMode === "upload" ? (
                      <div className="mt-xl">
                        <label htmlFor="logo-file" className="block text-[13px] font-medium">
                          Logo file
                        </label>
                        <input
                          id="logo-file"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-invalid={logoError ? true : undefined}
                          aria-describedby={logoError ? "logo-file-error" : undefined}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleLogoFile(file);
                          }}
                          className="mt-sm block min-h-12 w-full rounded-control text-[13px] text-ink-muted file:mr-md file:cursor-pointer file:rounded-control file:border file:border-black/20 file:bg-white file:px-md file:py-sm file:text-[13px] file:font-medium file:text-ink hover:file:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        />
                        {logoError ? (
                          <p id="logo-file-error" className="mt-xs text-[12px] text-red-700">
                            {logoError}
                          </p>
                        ) : null}
                        {logoFileName ? (
                          <p className="mt-xs text-[12px] text-ink-muted">
                            Selected: {logoFileName}
                          </p>
                        ) : null}
                        <p className="mt-xs text-[12px] text-ink-muted">
                          Mock screen: the file stays on your device and is not
                          uploaded yet.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <h2 className="text-[13px] font-medium">Live preview</h2>
                    <p className="mt-xs text-[12px] text-ink-muted">
                      How your review page will look.
                    </p>
                    <div className="mt-md">
                      <BrandPreviewCard
                        name={details.name}
                        tagline={details.tagline}
                        type={activeType}
                        logoDataUrl={logoDataUrl}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-lg">
                  <Input
                    label="Google review link"
                    name="google_review_url"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    value={reviewUrl}
                    maxLength={MAX_REVIEW_URL_LENGTH}
                    onChange={(event) => setReviewUrl(event.target.value)}
                    error={reviewUrlError}
                    hint="Paste the https:// link to your Google review page."
                    placeholder="https://g.page/r/your-business"
                    className="h-12"
                  />
                  <p className="text-[12px] leading-relaxed text-ink-muted">
                    The link must start with https:// and be on a Google host:
                    google.com, g.page, goo.gl, maps.app.goo.gl or
                    search.google.com.
                  </p>
                  {saveError ? (
                    <p className="text-[12px] text-red-700">{saveError}</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-2xl flex items-center justify-between gap-md">
              <Button
                variant="secondary"
                onClick={goBack}
                disabled={step === 1 || saving}
                className="min-h-12"
              >
                Back
              </Button>
              <Button
                onClick={goNext}
                disabled={saving}
                aria-busy={saving}
                className="min-h-12"
              >
                {saving ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : step === STEPS.length ? (
                  "Finish setup"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </>
        )}
      </main>

      {selectedCategory ? (
        <CategoryWarningPopup
          category={selectedCategory}
          onClosed={() => setSelectedCategory(null)}
          onLocked={onLocked}
        />
      ) : null}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mt-2xl flex flex-wrap items-center gap-sm" aria-label="Onboarding progress">
      {STEPS.map((item) => {
        const state =
          item.id === current ? "current" : item.id < current ? "done" : "todo";
        return (
          <li
            key={item.id}
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-center gap-sm"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-pill text-[12px] font-medium ${
                state === "current"
                  ? "bg-brand-blue text-white"
                  : state === "done"
                    ? "bg-brand-green text-white"
                    : "border border-black/20 text-ink-muted"
              }`}
            >
              {state === "done" ? "✓" : item.id}
            </span>
            <span
              className={`hidden text-[12px] sm:inline ${
                state === "current" ? "font-medium text-ink" : "text-ink-muted"
              }`}
            >
              {item.label}
            </span>
            {item.id < STEPS.length ? (
              <span className="h-px w-4 bg-black/15 sm:w-6" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Mock preview of the customer page using the preset brand-theme colors. */
function BrandPreviewCard({
  name,
  tagline,
  type,
  logoDataUrl,
}: {
  name: string;
  tagline: string;
  type: BusinessType;
  logoDataUrl?: string;
}) {
  const preset = businessPresets[type];
  // Colours and page background only through getBrandTheme (business-rules 10).
  const theme = getBrandTheme({
    business_type: type,
    primary_color: preset.primary,
    secondary_color: preset.secondary,
    color_source: "preset",
  });

  return (
    <div
      className="rounded-card border border-black/10 p-lg"
      style={{ backgroundColor: theme.pageBackground }}
    >
      <div className="mx-auto max-w-[260px] rounded-card border border-black/10 bg-white p-lg shadow-soft">
        <div className="flex flex-col items-center text-center">
          {logoDataUrl ? (
            <span
              role="img"
              aria-label="Your uploaded logo preview"
              className="h-11 w-11 rounded-pill bg-cover bg-center"
              style={{ backgroundImage: `url(${logoDataUrl})` }}
            />
          ) : (
            <BusinessLogo type={type} size={44} color={theme.primary} />
          )}
          <p className="mt-md text-[15px] font-medium">
            {name.trim() || "Your business name"}
          </p>
          <p className="mt-xs text-[12px] text-ink-muted">
            {tagline.trim() || preset.tagline}
          </p>
          <div className="mt-lg grid w-full gap-sm">
            <span
              className="rounded-control px-lg py-md text-center text-[13px] font-medium"
              style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
            >
              Great
            </span>
            <span
              className="rounded-control border px-lg py-md text-center text-[13px] font-medium"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              Not great
            </span>
          </div>
          <span
            aria-hidden="true"
            className="mt-md h-1.5 w-10 rounded-pill"
            style={{ backgroundColor: theme.secondary }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Completion screen after the mock save.
 *
 * QR note: the real QR code (a later stage) must encode ONLY the short review
 * link / slug — for example `<origin>/r/<slug>` — and never the raw Google
 * review URL, so reprinting is never needed when the Google link changes
 * (PRD.md section 3.1 and business-rules.md section 9).
 */
function CompletionScreen({
  slug,
  name,
  type,
  category,
  logoDataUrl,
}: {
  slug: string;
  name: string;
  type: BusinessType;
  category: BusinessCategory;
  logoDataUrl?: string;
}) {
  const preset = businessPresets[type];
  const theme = getBrandTheme({
    business_type: type,
    primary_color: preset.primary,
    secondary_color: preset.secondary,
    color_source: "preset",
  });
  const shortLink = `/r/${slug}`;

  return (
    <div className="rounded-card border border-black/10 bg-white p-2xl shadow-soft">
      <div className="flex flex-col items-center text-center">
        {logoDataUrl ? (
          <span
            role="img"
            aria-label="Your uploaded logo preview"
            className="h-14 w-14 rounded-pill bg-cover bg-center"
            style={{ backgroundImage: `url(${logoDataUrl})` }}
          />
        ) : (
          <BusinessLogo type={type} size={56} color={theme.primary} />
        )}
        <h1 className="mt-lg font-display text-[24px] font-medium">
          You are all set
        </h1>
        <p className="mt-sm max-w-md text-[14px] text-ink-muted">
          {name || "Your business"} is ready. Your review page, short link and
          QR code all point at the same permanent address.
        </p>
        <div className="mt-lg flex flex-col items-center gap-sm">
          <CategoryLockBadge category={category} size="md" />
          <p className="text-[13px] text-ink-muted">
            Your category is locked: {categoryLabel(category)}.
          </p>
        </div>
      </div>

      {/* QR placeholder — the real QR is generated in a later stage. */}
      <div className="mt-2xl rounded-control border-2 border-dashed border-black/15 bg-surface-muted p-2xl text-center">
        <p className="text-[13px] font-medium text-ink-muted">
          QR code: built in a later stage
        </p>
      </div>

      <div className="mt-2xl rounded-control border border-black/10 bg-surface-muted p-lg text-center">
        <p className="text-[12px] uppercase tracking-[0.05em] text-ink-muted">
          Your short review link
        </p>
        <p className="mt-sm break-all text-[15px] font-medium">{shortLink}</p>
      </div>

      <div className="mt-2xl flex justify-center">
        <ButtonLink href="/dashboard" size="lg">
          Go to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}

function categoryLabel(category: BusinessCategory): string {
  return category === "food"
    ? "Restaurant & Café"
    : category === "hotel"
      ? "Hotel"
      : "Other business";
}

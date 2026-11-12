import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CustomerPage,
  type CustomerScreen,
} from "@/components/customer-page/customer-page";
import {
  isOpenNow,
  isValidSlug,
  visibleAnnouncementText,
} from "@/lib/customer-page";
import { BusinessProvider } from "@/lib/business-provider";
import {
  getMockReviewPage,
  type MockBusiness,
  type MockReviewPage,
} from "@/lib/mock/customer-page";
import { businessOwnsSlug } from "@/lib/mock/locations";
import { plans } from "@/lib/mock/plans";
import { getServerBusiness } from "@/lib/mock/server-business";
import type { BusinessProfile } from "@/lib/mock/store";
import type { ReviewGenMode } from "@/lib/mock/review";
import { validateGoogleReviewUrl } from "@/lib/validation";

/**
 * Owner-supplied text is never used in the title/meta (security 4C).
 *
 * Decision (2026-10-01): `robots: noindex` for `/r/[slug]`. These are transient
 * funnel pages with owner-supplied content on our domain and no SEO value, so
 * they should not be indexed. Was an open question in the loop prompt; now
 * applied and logged in PROGRESS.md.
 */
export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

type ReviewRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parseMockMode(value: string | string[] | undefined): ReviewGenMode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "slow" || raw === "ai_fail" || raw === "invalid_url") return raw;
  return "normal";
}

/** MOCK ONLY (remove in Stage 4): `?screen=` opens a screen directly for testing. */
const SCREENS: CustomerScreen[] = [
  "home",
  "review",
  "choice",
  "google",
  "details",
  "feedback",
  "thanks",
  "menu",
  "hours",
  "pay",
  "loyalty",
];

function parseInitialScreen(
  value: string | string[] | undefined,
): CustomerScreen | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return SCREENS.find((screen) => screen === raw);
}

export default async function ReviewRoute({
  params,
  searchParams,
}: ReviewRouteProps) {
  const { slug } = await params;
  const query = await searchParams;

  // security-and-reliability.md 4B item 8: validate the exact slug format
  // (^[a-z0-9]{6}$) before looking anything up.
  if (!isValidSlug(slug)) notFound();

  // The saved profile lives in the browser, so the server reads its cookie
  // mirror (lib/mock/server-business.ts).
  const savedBusiness = await getServerBusiness();
  const ownsSlug = savedBusiness
    ? businessOwnsSlug(savedBusiness, slug)
    : false;
  // A static demo page exists for the demo slugs and for the slug every type is
  // issued, but not for a SECOND location (Enterprise adds one). Those slugs
  // still belong to the saved business, so their QR gets a page built from it
  // instead of a 404.
  const page =
    getMockReviewPage(slug) ??
    (savedBusiness && ownsSlug ? pageFromProfile(savedBusiness, slug) : null);
  if (!page) notFound();

  // Suspended business or scan limit reached -> neutral "temporarily
  // unavailable" page (business-rules.md sections 1 and 4). Never an error and
  // never a reason (security 5A).
  if (!page.is_active) return <UnavailablePage />;

  // When this slug belongs to the saved business, the owner's own identity
  // replaces the static demo one — otherwise the first paint would show the
  // café (or the type's demo name, e.g. "Glow Studio") and swap afterwards.
  const business: MockBusiness =
    savedBusiness && ownsSlug
      ? {
          ...page.business,
          name: savedBusiness.name,
          tagline: savedBusiness.tagline,
          logo_url: savedBusiness.logo_url,
          business_type: savedBusiness.business_type,
          primary_color: savedBusiness.primary_color,
          secondary_color: savedBusiness.secondary_color,
          color_source: savedBusiness.color_source,
          google_review_url: savedBusiness.google_review_url,
          time_zone: savedBusiness.time_zone,
        }
      : page.business;
  // NOTE: `theme` is derived inside the client page component so the
  // post-mount read of the shared business profile can re-theme it (T3).
  // page_custom_hidden = admin hid the content -> fall back to the default page.
  const config = page.page_custom_hidden ? null : page.page_config;

  const mockMode = parseMockMode(query.mock);
  const now = new Date();

  const announcementText = visibleAnnouncementText(
    config,
    now,
    business.time_zone,
  );

  const openNow = config
    ? isOpenNow(config.buttons.hours.week, now, business.time_zone)
    : false;

  // `?mock=invalid_url` drives the invalid-Google-link branch for T3 testing.
  const reviewUrl =
    mockMode === "invalid_url"
      ? "http://not-a-google-link.example/review"
      : (page.google_review_url ?? business.google_review_url);
  const reviewUrlValid = validateGoogleReviewUrl(reviewUrl) === undefined;

  return (
    <BusinessProvider initial={savedBusiness}>
      <CustomerPage
        slug={slug}
        initialScreen={parseInitialScreen(query.screen)}
        business={business}
        config={config}
        customHidden={page.page_custom_hidden}
        reviewUrl={reviewUrl}
        reviewUrlValid={reviewUrlValid}
        mockMode={mockMode}
        announcementText={announcementText}
        openNow={openNow}
        // business-rules.md 11 rule 5: after a downgrade the public page shows
        // only the first N named menu items. Plan limits come from the mock
        // `plans` row only (never typed into a component).
        menuItemLimit={plans[business.plan].page.menu_items}
      />
    </BusinessProvider>
  );
}

/**
 * A public page for a slug that belongs to the saved business but has no static
 * demo page (a second location added after sign-up). Content is the default
 * page; the owner's saved page config is applied on mount, as everywhere else.
 */
function pageFromProfile(
  business: BusinessProfile,
  slug: string,
): MockReviewPage {
  return {
    id: `page_${slug}`,
    business_id: `biz_${slug}`,
    slug,
    location_name: null,
    google_review_url: null,
    is_active: true,
    page_custom_hidden: false,
    page_config: null,
    business: {
      id: `biz_${slug}`,
      name: business.name,
      business_type: business.business_type,
      tagline: business.tagline,
      logo_url: business.logo_url,
      primary_color: business.primary_color,
      secondary_color: business.secondary_color,
      color_source: business.color_source,
      google_review_url: business.google_review_url,
      social_links: {},
      // The mock keeps no plan on the profile, so this page uses the same
      // default as every type demo page.
      plan: "starter",
      time_zone: business.time_zone,
    },
  };
}

/**
 * Neutral page for suspended / scan-limit-reached businesses. It shows no error
 * and no reason, and does not use business colours.
 */
function UnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-lg">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-[22px] font-medium leading-tight">
          This page isn&apos;t available right now.
        </h1>
        <p className="mt-md text-[15px] text-ink-muted">
          Please try again a little later.
        </p>
      </div>
    </main>
  );
}

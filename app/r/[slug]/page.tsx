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
import { getMockReviewPage } from "@/lib/mock/customer-page";
import { plans } from "@/lib/mock/plans";
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

  const page = getMockReviewPage(slug);
  if (!page) notFound();

  // Suspended business or scan limit reached -> neutral "temporarily
  // unavailable" page (business-rules.md sections 1 and 4). Never an error and
  // never a reason (security 5A).
  if (!page.is_active) return <UnavailablePage />;

  const { business } = page;
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
  );
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

"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { BusinessLogo } from "@/components/business-logo";
import { getBrandTheme, type BrandTheme } from "@/lib/brand/theme";
import type { MockBusiness, PageConfig } from "@/lib/mock/customer-page";
import type { ReviewAnswers, ReviewGenMode } from "@/lib/mock/review";
import { businessOwnsSlug } from "@/lib/mock/locations";
import { displayableLogo, resolveStoredPage } from "@/lib/mock/store";
import { useBusiness, useStoredPageData } from "@/lib/use-business";
import { useLoyaltyState } from "@/lib/use-loyalty";
import {
  clampText,
  isOpenNow,
  MAX_THANK_YOU_LENGTH,
  shownButtons,
  shownCustomLinks,
  shownSocialIcons,
  visibleAnnouncementText,
  type CustomerButton,
} from "@/lib/customer-page";
import { BackButton } from "./back-button";
import { ButtonGrid } from "./button-grid";
import { ChoiceScreen } from "./choice-screen";
import { DetailsScreen } from "./details-screen";
import { FeedbackScreen } from "./feedback-screen";
import { GoogleScreen } from "./google-screen";
import { HoursScreen } from "./hours-screen";
import { LoyaltyScreen } from "./loyalty-screen";
import { ThumbsDownIcon, ThumbsUpIcon } from "./icons";
import { MenuScreen } from "./menu-screen";
import { PayScreen } from "./pay-screen";
import { ReviewScreen } from "./review-screen";
import { SocialRow } from "./social-row";
import { ThanksScreen } from "./thanks-screen";

export type CustomerScreen =
  | "home"
  | "review"
  | "choice"
  | "google"
  | "details"
  | "feedback"
  | "thanks"
  | "menu"
  | "hours"
  | "pay"
  | "loyalty";

export type CustomerPageProps = {
  slug: string;
  /**
   * MOCK ONLY (Stage 1 dev affordance, remove in Stage 4): lets `?screen=` open a
   * screen directly so each one can be previewed/tested without walking the flow.
   */
  initialScreen?: CustomerScreen;
  business: MockBusiness;
  /** `null` = default page (no customization, or admin-hidden). */
  config: PageConfig | null;
  /** Effective review URL (per-location override else business). */
  reviewUrl: string;
  /** `google_review_url` passed validation; decides "Post to Google". */
  reviewUrlValid: boolean;
  mockMode: ReviewGenMode;
  /** Already stripped and null when hidden/expired (business time zone). */
  announcementText: string | null;
  openNow: boolean;
  /**
   * Plan menu-item limit for this location (`null` = unlimited / Enterprise).
   * The Menu screen shows only the first N named items after a downgrade
   * (business-rules.md 11 rule 5).
   */
  menuItemLimit: number | null;
  /** Admin hid the custom page: saved content must never un-hide it. */
  customHidden?: boolean;
  /** `false` = editor preview: render the draft, ignore saved slug content. */
  liveData?: boolean;
};

/** Tone-by-moment warm neutral for the unhappy path (brand-guide.md). */
const WARM_NEUTRAL = "#F5F1EC";

export function CustomerPage(props: CustomerPageProps) {
  const {
    slug,
    business,
    config,
    reviewUrl,
    reviewUrlValid,
    mockMode,
    announcementText,
    openNow,
    menuItemLimit,
    customHidden = false,
    liveData = true,
  } = props;
  // MOCK ONLY, removed in Stage 4: the post-mount read of the shared business
  // profile (localStorage). It applies ONLY to the slug the current mock
  // business owns (the default café owns cafe01, a new gym owns gym001, ...);
  // every other demo slug (full01, salon1, pause1) keeps its own static data,
  // and the server-rendered HTML still uses the static mock.
  const stored = useBusiness();
  // Pure + profile-based: on the server and during hydration `stored` is the
  // static default profile, and the saved one arrives after mount, so the HTML
  // never disagrees with the first client render.
  const ownsSlug = businessOwnsSlug(stored, slug);
  const baseBusiness = ownsSlug ? { ...business, ...stored } : business;
  // MOCK ONLY, removed in Stage 4: the customer-page content the editor saved
  // for this slug (page_config + social icons) lives in localStorage, so "View
  // live page" (a new tab) and reloads show it. Read after mount so the server
  // render and hydration still use the static mock.
  // Only slugs of the current mock business ever apply saved content.
  const storedPage = useStoredPageData(liveData && ownsSlug ? slug : null);
  const { config: effectiveConfig, social_links: effectiveSocials } =
    resolveStoredPage(
      storedPage,
      config,
      baseBusiness.social_links,
      customHidden,
    );
  const effectiveBusiness: MockBusiness = {
    ...baseBusiness,
    social_links: effectiveSocials ?? baseBusiness.social_links,
  };
  // Colours and page background come only from getBrandTheme (business-rules 10).
  const theme = getBrandTheme(effectiveBusiness);
  const [screen, setScreen] = useState<CustomerScreen>(
    props.initialScreen ?? "home",
  );
  // The path drives the thank-you and feedback tones (Google vs private).
  const [path, setPath] = useState<"happy" | "unhappy" | null>(
    initialPath(props.initialScreen),
  );
  // "Write it for me" answers, shared by the questions and review screens.
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswers>({});

  const socials = shownSocialIcons(effectiveBusiness.social_links);
  const thankYou = clampText(
    effectiveConfig?.thank_you ?? "",
    MAX_THANK_YOU_LENGTH,
  );
  const configButtons = effectiveConfig
    ? shownButtons(effectiveConfig, effectiveBusiness.business_type)
    : [];
  // Loyalty card tile: shown first when the owner's program is on. It is not a
  // page_config button; it is controlled by the Loyalty dashboard (PRD 5.7).
  // MOCK ONLY: the program is read from localStorage after mount and applies to
  // the current mock business's slugs only (same rule as the saved page content).
  const loyaltyState = useLoyaltyState();
  const loyaltyOn = ownsSlug && loyaltyState?.program.enabled === true;
  const buttons: CustomerButton[] = loyaltyOn
    ? [
        {
          key: "loyalty",
          kind: "loyalty",
          label: "Loyalty card",
          screen: "loyalty",
        },
        ...configButtons,
      ]
    : configButtons;
  const customLinks = effectiveConfig
    ? shownCustomLinks(effectiveConfig, effectiveBusiness.business_type)
    : [];
  // When saved content arrived after mount, the announcement and "Open now"
  // values computed on the server for the static config are stale, so derive
  // them again with the SAME pure helpers (client only, never during SSR).
  const effectiveAnnouncement = storedPage
    ? visibleAnnouncementText(
        effectiveConfig,
        new Date(),
        effectiveBusiness.time_zone,
      )
    : announcementText;
  const effectiveOpenNow = storedPage
    ? effectiveConfig
      ? isOpenNow(
          effectiveConfig.buttons.hours.week,
          new Date(),
          effectiveBusiness.time_zone,
        )
      : false
    : openNow;
  const themeVars = {
    "--cp-primary": theme.primary,
    "--cp-secondary": theme.secondary,
    "--cp-bg": theme.pageBackground,
    "--cp-on-primary": theme.onPrimary,
  } as CSSProperties;

  // The private-feedback tone uses the warm neutral background, not the
  // business background (brand-guide.md "Tone by Moment").
  const useWarmNeutral =
    screen === "feedback" || (screen === "thanks" && path === "unhappy");
  const background = useWarmNeutral ? WARM_NEUTRAL : theme.pageBackground;

  function goHome() {
    setPath(null);
    setScreen("home");
  }

  return (
    <div
      style={{ ...themeVars, backgroundColor: background }}
      className="min-h-screen w-full"
    >
      <div className="mx-auto w-full max-w-[480px] px-lg py-2xl">
        {screen === "home" ? (
          <CustomerHomeScreen
            business={effectiveBusiness}
            theme={theme}
            announcementText={effectiveAnnouncement}
            socials={socials}
            buttons={buttons}
            onOpenMenu={() => setScreen("menu")}
            onOpenHours={() => setScreen("hours")}
            onOpenPay={() => setScreen("pay")}
            onOpenLoyalty={() => setScreen("loyalty")}
            onThumbsUp={() => setScreen("choice")}
            onThumbsDown={() => setScreen("choice")}
          />
        ) : screen === "choice" ? (
          <ChoiceScreen
            businessName={effectiveBusiness.name}
            theme={theme}
            onGoogle={() => {
              setPath("happy");
              setScreen("google");
            }}
            onContact={() => {
              setPath("unhappy");
              setScreen("feedback");
            }}
            onBack={goHome}
          />
        ) : screen === "google" ? (
          <GoogleScreen
            theme={theme}
            reviewUrl={reviewUrl}
            reviewUrlValid={reviewUrlValid}
            onWriteForMe={() => setScreen("details")}
            onBack={() => setScreen("choice")}
          />
        ) : screen === "details" ? (
          <DetailsScreen
            businessType={effectiveBusiness.business_type}
            theme={theme}
            answers={reviewAnswers}
            onChange={setReviewAnswers}
            onGenerate={() => setScreen("review")}
            onBack={() => setScreen("google")}
          />
        ) : screen === "review" ? (
          <ReviewScreen
            slug={slug}
            businessType={effectiveBusiness.business_type}
            theme={theme}
            reviewUrl={reviewUrl}
            reviewUrlValid={reviewUrlValid}
            mode={mockMode}
            answers={reviewAnswers}
            onContinue={() => setScreen("thanks")}
            onBack={() => setScreen("details")}
          />
        ) : screen === "feedback" ? (
          <FeedbackScreen
            theme={theme}
            onSuccess={() => setScreen("thanks")}
            onBack={() => setScreen("choice")}
          />
        ) : screen === "thanks" ? (
          <ThanksScreen
            business={effectiveBusiness}
            theme={theme}
            thankYou={thankYou}
            socials={socials}
            links={customLinks}
            path={path}
            onHome={goHome}
          />
        ) : screen === "menu" && effectiveConfig ? (
          <MenuScreen
            config={effectiveConfig}
            businessType={effectiveBusiness.business_type}
            menuItemLimit={menuItemLimit}
            theme={theme}
            onBack={goHome}
          />
        ) : screen === "hours" && effectiveConfig ? (
          <HoursScreen
            hours={effectiveConfig.buttons.hours}
            whatsappPhone={effectiveConfig.buttons.whatsapp.phone}
            openNow={effectiveOpenNow}
            theme={theme}
            onBack={goHome}
          />
        ) : screen === "pay" && effectiveConfig ? (
          <PayScreen
            pay={effectiveConfig.buttons.pay}
            theme={theme}
            onBack={goHome}
          />
        ) : screen === "loyalty" && ownsSlug ? (
          <LoyaltyScreen
            businessName={effectiveBusiness.name}
            theme={theme}
            onBack={goHome}
          />
        ) : (
          <StubScreen
            title={stubTitle(screen)}
            onBack={goHome}
            color={theme.primary}
            onPrimary={theme.onPrimary}
          />
        )}
      </div>
    </div>
  );
}

/** Which tone the deep-linked screen belongs to (mock-only helper). */
function initialPath(screen?: CustomerScreen): "happy" | "unhappy" | null {
  if (screen === "review" || screen === "google" || screen === "details")
    return "happy";
  if (screen === "feedback") return "unhappy";
  return null;
}

const STUB_TITLES: Record<Exclude<CustomerScreen, "home">, string> = {
  review: "Your review",
  choice: "How would you like to continue?",
  google: "Leave a review on Google",
  details: "A few quick questions",
  feedback: "Tell us more",
  thanks: "Thank you",
  menu: "Menu",
  hours: "Hours and contact",
  pay: "Pay",
  loyalty: "Loyalty card",
};

function stubTitle(screen: CustomerScreen): string {
  return screen === "home" ? "" : STUB_TITLES[screen];
}

const noop = () => {};

/**
 * The home screen of the customer page, shared by BOTH QR targets: the
 * reception page (`/r/[slug]`) and the table/room page (`/r/[slug]/[code]`).
 * One design, one set of controls (merge fix, step 1).
 *
 * The table page adds only what a table needs: `context` (the "ordering for
 * Table 1" strip and the open-bill cards) and `afterButtons` (Call waiter /
 * Bill / Wi-Fi tiles in the same tile style).
 */
export function CustomerHomeScreen({
  business,
  theme,
  announcementText,
  socials,
  buttons,
  context,
  afterButtons,
  onOpenMenu = noop,
  onOpenHours = noop,
  onOpenPay = noop,
  onOpenLoyalty = noop,
  onThumbsUp = noop,
  onThumbsDown = noop,
}: {
  /** Only the fields shown here, so the rooms business view fits too. */
  business: Pick<MockBusiness, "name" | "tagline" | "business_type" | "logo_url">;
  theme: BrandTheme;
  announcementText: string | null;
  socials: { key: ReturnType<typeof shownSocialIcons>[number]["key"]; url: string }[];
  buttons: CustomerButton[];
  /** Table page only: content between the header and the review buttons. */
  context?: ReactNode;
  /** Table page only: extra tiles right under the page buttons. */
  afterButtons?: ReactNode;
  onOpenMenu?: () => void;
  onOpenHours?: () => void;
  onOpenPay?: () => void;
  onOpenLoyalty?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}) {
  const logoUrl = displayableLogo(business.logo_url);
  return (
    <>
      {announcementText ? (
        <div
          className="mb-lg rounded-control px-md py-sm text-center text-[14px] font-medium"
          style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
        >
          {announcementText}
        </div>
      ) : null}

      <header className="text-center">
        <div className="flex justify-center">
          {logoUrl ? (
            // Stage 4 serves the owner's re-encoded logo from our storage domain
            // (security 4C: never hotlink owner-supplied URLs).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={business.name}
              className="h-16 w-16 rounded-card object-cover"
            />
          ) : (
            <BusinessLogo
              type={business.business_type}
              size={64}
              color={theme.primary}
            />
          )}
        </div>
        <h1 className="mt-md font-display text-[26px] font-medium leading-tight">
          {business.name}
        </h1>
        {business.tagline ? (
          <p className="mt-xs text-[15px] text-ink-muted">{business.tagline}</p>
        ) : null}
      </header>

      {context}

      <section className="mt-2xl text-center">
        <h2 className="font-display text-[21px] font-medium leading-tight">
          How was your experience?
        </h2>
        <div className="mt-lg grid gap-md">
          <button
            type="button"
            onClick={onThumbsUp}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control bg-[var(--cp-primary)] px-lg text-[17px] font-medium text-[var(--cp-on-primary)] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <ThumbsUpIcon size={24} />
            Great
          </button>
          <button
            type="button"
            onClick={onThumbsDown}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-sm rounded-control border border-black/15 bg-white px-lg text-[17px] font-medium text-ink transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <ThumbsDownIcon size={24} />
            Not great
          </button>
        </div>
      </section>

      <ButtonGrid
        buttons={buttons}
        businessType={business.business_type}
        theme={theme}
        onOpenMenu={onOpenMenu}
        onOpenHours={onOpenHours}
        onOpenPay={onOpenPay}
        onOpenLoyalty={onOpenLoyalty}
      />

      {afterButtons}

      <SocialRow icons={socials} color={theme.primary} className="mt-2xl" />
    </>
  );
}

/** Temporary screen body used before each real screen lands (T3–T5). */
function StubScreen({
  title,
  onBack,
  color,
  onPrimary,
}: {
  title: string;
  onBack: () => void;
  color: string;
  onPrimary: string;
}) {
  return (
    <div>
      <BackButton label={title} onBack={onBack} color={color} onPrimary={onPrimary} />
      <p className="mt-2xl text-center text-[15px] text-ink-muted">
        This screen is built in the next step.
      </p>
    </div>
  );
}

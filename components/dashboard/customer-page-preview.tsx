"use client";

/**
 * The editor's live phone preview (PRD.md 5.5.2, ui-spec 2.1).
 *
 * It renders the SAME public page components built in 1D
 * (`components/customer-page/customer-page.tsx`), fed from the editor's
 * in-memory draft — there is no second renderer. The 375 px frame and the
 * preview drawer are just chrome around it.
 *
 * `MOCK_NOW` (from the dashboard mock) is used instead of `new Date()` so the
 * server and client renders agree and "Open now" is deterministic.
 */

import type { ReactNode } from "react";
import { CustomerPage } from "@/components/customer-page/customer-page";
import {
  isAnnouncementActive,
  isOpenNow,
  MAX_ANNOUNCEMENT_LENGTH,
  stripUnsafeText,
} from "@/lib/customer-page";
import type {
  MockBusiness,
  PageConfig,
  SocialLinks,
} from "@/lib/mock/customer-page";
import { MOCK_NOW } from "@/lib/mock/dashboard";
import { validateGoogleReviewUrl } from "@/lib/validation";

type PreviewProps = {
  slug: string;
  business: MockBusiness;
  config: PageConfig | null;
  /** The editor's social-icon draft; falls back to the business's socials. */
  socials?: SocialLinks;
  reviewUrl: string;
  /** Plan menu-item limit for the scenario (`null` = unlimited). */
  menuItemLimit: number | null;
};

export function CustomerPagePreview({
  slug,
  business,
  config,
  socials,
  reviewUrl,
  menuItemLimit,
}: PreviewProps) {
  const announcementText = (() => {
    if (!config?.announcement.on) return null;
    if (
      !isAnnouncementActive(config.announcement.end_date, MOCK_NOW, business.time_zone)
    ) {
      return null;
    }
    const text = stripUnsafeText(config.announcement.text)
      .trim()
      .slice(0, MAX_ANNOUNCEMENT_LENGTH);
    return text || null;
  })();

  const openNow = config
    ? isOpenNow(config.buttons.hours.week, MOCK_NOW, business.time_zone)
    : false;

  return (
    <CustomerPage
      slug={slug}
      business={
        socials ? { ...business, social_links: socials } : business
      }
      config={config}
      liveData={false}
      reviewUrl={reviewUrl}
      reviewUrlValid={validateGoogleReviewUrl(reviewUrl) === undefined}
      mockMode="normal"
      announcementText={announcementText}
      openNow={openNow}
      menuItemLimit={menuItemLimit}
    />
  );
}

/** The 375 px phone frame (PRD.md 5.5.2). */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[375px]">
      {/* The transform makes this the containing block for the page's
          full-screen photo viewer (position: fixed), so the viewer covers the
          phone preview instead of the whole dashboard, and does not scroll
          with the page content. */}
      <div className="h-[640px] overflow-hidden rounded-[28px] border-[8px] border-ink bg-white shadow-soft [transform:translateZ(0)]">
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

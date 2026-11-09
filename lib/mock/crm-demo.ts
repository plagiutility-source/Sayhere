/**
 * MOCK ONLY, removed in Stage 4.
 *
 * Seeds the salon profile used by the public CRM demo. A fresh browser has no
 * saved business profile, so the CRM gate correctly fails closed. The demo
 * entry route and the gated CRM (when a supported demo plan is requested) use
 * this helper before rendering the CRM.
 */

import { businessPresets } from "@/lib/brand/tokens";
import { CATEGORY_LABELS } from "@/lib/category/types";
import { supportsCrmType } from "@/lib/crm/access";
import { slugForType } from "@/lib/mock/business";
import {
  defaultBusiness,
  getBusiness,
  saveBusiness,
} from "@/lib/mock/store";

/**
 * Make sure the browser has a CRM-capable demo business. An existing salon,
 * gym, retail or other profile is kept. Returns true when the resulting profile
 * can use the CRM.
 */
export function seedCrmDemoBusiness(): boolean {
  const existing = getBusiness();
  if (supportsCrmType(existing.business_type)) return true;

  const base = defaultBusiness();
  const salon = businessPresets.salon;
  const result = saveBusiness(
    {
      name: "Glow Studio",
      business_type: "salon",
      business_category: "general",
      category_confirm_text: CATEGORY_LABELS.general,
      category_confirmed_at: new Date().toISOString(),
      slug: slugForType("salon"),
      tagline: salon.tagline,
      logo_url: null,
      primary_color: salon.primary,
      secondary_color: salon.secondary,
      color_source: "preset",
      google_review_url: base.google_review_url,
      time_zone: base.time_zone,
      verification_status: "approved",
    },
    { allowCategorySetup: true },
  );

  return supportsCrmType(result.business.business_type);
}

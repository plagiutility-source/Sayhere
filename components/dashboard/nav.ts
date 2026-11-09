import type { ComponentType } from "react";
import type { BusinessType } from "@/lib/brand/tokens";
import { supportsTableOrdering } from "@/lib/category/ordering";
import { supportsCrm } from "@/lib/crm/access";
import type { PlanId } from "@/lib/mock/plans";
import {
  AnalyticsIcon,
  BillingIcon,
  CrmIcon,
  DashboardIcon,
  FeedbackIcon,
  LocationIcon,
  LoyaltyIcon,
  OrdersIcon,
  PageIcon,
  SettingsIcon,
  TablesIcon,
} from "./icons";

export type DashboardIconComponent = ComponentType<{
  className?: string;
  size?: number;
}>;

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardIconComponent;
  /** Optional gate; an item without one is always shown. */
  requires?: (businessType: BusinessType, planId: PlanId) => boolean;
  /** Optional label override per business type (hotel says "Rooms"). */
  labelByType?: Partial<Record<BusinessType, string>>;
};

export type DashboardNavGroup = {
  label: string;
  items: readonly DashboardNavItem[];
};

/** PRD.md 5.1 shell: Menu group then General group. */
export const dashboardNav: readonly DashboardNavGroup[] = [
  {
    label: "Menu",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
      { label: "Feedback", href: "/feedback", icon: FeedbackIcon },
      { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
      { label: "Locations", href: "/locations", icon: LocationIcon },
      {
        label: "Orders",
        href: "/orders",
        icon: OrdersIcon,
        requires: supportsTableOrdering,
      },
      {
        label: "Tables",
        href: "/rooms",
        icon: TablesIcon,
        requires: supportsTableOrdering,
        labelByType: { hotel: "Rooms" },
      },
      { label: "Customer page", href: "/customer-page", icon: PageIcon },
      { label: "Loyalty", href: "/loyalty", icon: LoyaltyIcon },
      {
        label: "CRM",
        href: "/crm",
        icon: CrmIcon,
        requires: supportsCrm,
      },
    ],
  },
  {
    label: "General",
    items: [
      { label: "Billing", href: "/billing", icon: BillingIcon },
      { label: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
] as const;

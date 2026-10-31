import type { ComponentType } from "react";
import {
  AnalyticsIcon,
  BillingIcon,
  DashboardIcon,
  FeedbackIcon,
  LocationIcon,
  LoyaltyIcon,
  PageIcon,
  SettingsIcon,
} from "./icons";

export type DashboardIconComponent = ComponentType<{
  className?: string;
  size?: number;
}>;

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardIconComponent;
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
      { label: "Customer page", href: "/customer-page", icon: PageIcon },
      { label: "Loyalty", href: "/loyalty", icon: LoyaltyIcon },
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

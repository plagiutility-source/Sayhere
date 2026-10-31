/**
 * The final English wording for the category surface.
 *
 * Onboarding, Settings and the dashboard shell stay English (like the rest of
 * the owner product), so these are plain strings, not i18n keys.
 */

import { CATEGORY_LABELS, type BusinessCategory } from "./types";

export type CategoryCard = {
  category: BusinessCategory;
  label: string;
  /** One line on the card itself. */
  line: string;
  /** "You will get" list in the popup. */
  gets: readonly string[];
  /** "You will NOT get" list in the popup. */
  doesNotGet: readonly string[];
};

export const CATEGORY_CARDS: Record<BusinessCategory, CategoryCard> = {
  food: {
    category: "food",
    label: CATEGORY_LABELS.food,
    line:
      "Collect reviews and reward regulars. Google review QR, customer page and a loyalty card.",
    gets: [
      "Google review QR and customer page",
      "Feedback inbox",
      "Loyalty",
    ],
    doesNotGet: ["Hotel rooms"],
  },
  hotel: {
    category: "hotel",
    label: CATEGORY_LABELS.hotel,
    line:
      "Collect reviews and reward returning guests. Google review QR, customer page and a loyalty card.",
    gets: [
      "Google review QR and customer page",
      "Feedback inbox",
      "Loyalty",
    ],
    doesNotGet: ["Restaurant tables"],
  },
  general: {
    category: "general",
    label: CATEGORY_LABELS.general,
    line:
      "Salon, gym, shop or any other business. Collect reviews and reward loyal customers.",
    gets: [
      "Google review QR and customer page",
      "Feedback inbox",
      "Analytics",
      "Loyalty",
    ],
    doesNotGet: ["Hotel rooms", "Staff screens"],
  },
};

/** The full-screen warning popup. */
export const CATEGORY_POPUP_COPY = {
  headline: "Choose your category wisely",
  subline:
    "This cannot be changed later. Not in Settings, not by you, not by editing the link.",
  confirm: "Confirm and lock my category",
  back: "Go back and choose again",
  cannotChange: "Cannot be changed later",
  lockedLine: "Locked. Contact Syehere support if this is wrong.",
  readyAnnouncement: "Confirm is ready",
  genericError: "Something went wrong. Try again.",
} as const;

/** The real chosen name is shown, so the owner knows exactly what to type. */
export function typeToConfirmLabel(category: BusinessCategory): string {
  return `To confirm, type: ${CATEGORY_LABELS[category]}`;
}

/** The button text while the 3 second guard is running. */
export function countdownLabel(seconds: number): string {
  return `Confirm in ${seconds}`;
}

/** Settings shows the category read-only with this line. */
export function settingsLockText(category: BusinessCategory): string {
  return `Business category: ${CATEGORY_LABELS[category]}. Fixed when you signed up and cannot be changed. If this is wrong, contact Syehere support.`;
}

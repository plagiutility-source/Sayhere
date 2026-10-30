/**
 * Brand tokens — single source of truth.
 *
 * Values come from brand-guide.md (product palette, per-business-type presets,
 * typography rules) and the spacing scale in PRD.md section 5.2.
 * Tailwind reads the same values in tailwind.config.ts; do not hardcode colours
 * in components, import them from here (directly or through a Tailwind class).
 */

/** Syehere's own product palette (dashboard chrome, admin, marketing). */
export const syehereColors = {
  /** Gradient start / primary action blue. */
  blue: "#1D4ED8",
  /** Gradient end / success green. */
  green: "#0E9F6E",
  /** Yellow accent, light stop. */
  yellowLight: "#FFF08A",
  /** Yellow accent, solid stop. Use sparingly (status dot / small highlight). */
  yellow: "#FFC61A",
  /** Wordmark gradient start (navy). */
  navy: "#12307A",
  /** Wordmark gradient end (deep green). */
  greenDeep: "#0B7A55",
  /** Page surface. */
  surface: "#FFFFFF",
  /** Very light neutral background. */
  surfaceMuted: "#F7F8FA",
} as const;

/** Body text colours. Never pure black. */
export const textColors = {
  primary: "#1F2937",
  secondary: "#6B7280",
} as const;

/** The seven business types, matching the `business_type` allowlist in schema.sql. */
export type BusinessType =
  | "cafe"
  | "restaurant"
  | "hotel"
  | "salon"
  | "gym"
  | "retail"
  | "other";

export type BusinessPreset = {
  primary: string;
  secondary: string;
  background: string;
  tagline: string;
};

/** Default logo colour + page background per business type (brand-guide.md). */
export const businessPresets: Record<BusinessType, BusinessPreset> = {
  cafe: {
    primary: "#213D36",
    secondary: "#C5DBC8",
    background: "#EDF4EE",
    tagline: "Enjoying your coffee?",
  },
  restaurant: {
    primary: "#A31D1D",
    secondary: "#D4A373",
    background: "#FAF3EA",
    tagline: "How was your meal?",
  },
  // Reuses the retail blue/gold pair: no new colours outside the brand tokens.
  hotel: {
    primary: "#2F5DA8",
    secondary: "#F2B544",
    background: "#EAF1FB",
    tagline: "Welcome. Tell us about your stay.",
  },
  salon: {
    primary: "#3E4752",
    secondary: "#C48A62",
    background: "#FBF6F1",
    tagline: "Love your new look?",
  },
  gym: {
    primary: "#1F2A37",
    secondary: "#F26B2B",
    background: "#EEF1F4",
    tagline: "How was your workout?",
  },
  retail: {
    primary: "#2F5DA8",
    secondary: "#F2B544",
    background: "#EAF1FB",
    tagline: "How was your shopping?",
  },
  other: {
    primary: "#0F766E",
    secondary: "#F2B544",
    background: "#E6F4F2",
    tagline: "How was your experience?",
  },
};

/** Font stacks. Poppins is the wordmark font; the UI uses a system stack. */
export const fontStacks = {
  ui: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  display:
    'Poppins, "Helvetica Neue", Arial, system-ui, sans-serif',
} as const;

/** Only two weights are allowed anywhere in the UI (PRD.md 5.2). */
export const fontWeights = {
  regular: "400",
  medium: "500",
} as const;

/** Spacing scale (PRD.md 5.2) — component gaps and padding must snap to these. */
export const spacingScale = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
} as const;

/** Corner radii. Controls use 8px (brand-guide.md / PRD.md 5.5.3). */
export const radii = {
  control: "8px",
  card: "12px",
  pill: "9999px",
} as const;

/** Soft, minimal shadows — no gloss or shine (brand-guide.md). */
export const shadows = {
  soft: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)",
} as const;

/** The allowed business type keys, in display order. */
export const businessTypes: BusinessType[] = [
  "cafe",
  "restaurant",
  "hotel",
  "salon",
  "gym",
  "retail",
  "other",
];

/** Display labels for the business type dropdown (PRD.md 5.4.1 wording). */
export const businessTypeLabels: Record<BusinessType, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  hotel: "Hotel",
  salon: "Salon",
  gym: "Gym",
  retail: "Retail",
  other: "Other",
};

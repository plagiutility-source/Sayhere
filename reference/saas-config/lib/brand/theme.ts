/**
 * The ONE helper that derives a business's customer-facing theme
 * (business-rules.md section 10 and brand-guide.md "Page Background and Star
 * Color"). Nothing else in the app may compute these values.
 *
 * Rules implemented here:
 * - `color_source = preset`: `pageBackground` is the per-type value in
 *   brand-guide.md (reused from `businessPresets`, never copied a second time).
 * - `color_source = custom`: `pageBackground` = secondary at 15% over white.
 * - `starColor` = secondary, or primary when secondary has under 1.5:1
 *   contrast against `pageBackground`.
 * - `onPrimary` = white or #1F2937, whichever has better contrast on primary.
 *
 * The mock values are absolute here (frontend-only, Stage 1). The real helper in
 * Stage 3 keeps the same signature so no caller has to change.
 */

import { businessPresets, textColors, type BusinessType } from "./tokens";

export type ColorSource = "preset" | "custom";

/** Only the fields the theme needs; the full business row is a superset. */
export type ThemeBusiness = {
  business_type: BusinessType;
  primary_color: string;
  secondary_color: string;
  color_source: ColorSource;
};

export type BrandTheme = {
  primary: string;
  secondary: string;
  pageBackground: string;
  starColor: string;
  onPrimary: string;
};

/** For `custom` colors the page background is the secondary at 15% over white. */
const CUSTOM_BACKGROUND_STRENGTH = 0.15;

/** Under this contrast, the secondary is unusable as a star colour. */
const STAR_MIN_CONTRAST = 1.5;

const WHITE = "#FFFFFF";

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "").trim();
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const int = Number.parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

/** WCAG relative luminance. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

/** WCAG contrast ratio (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Composites `hex` at `alpha` strength over white. */
function blendOverWhite(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (value: number) => value * alpha + 255 * (1 - alpha);
  return rgbToHex(mix(r), mix(g), mix(b));
}

/** The derived theme for one business. Pure and cheap; safe to call per render. */
export function getBrandTheme(business: ThemeBusiness): BrandTheme {
  const primary = business.primary_color;
  const secondary = business.secondary_color;

  const pageBackground =
    business.color_source === "custom"
      ? blendOverWhite(secondary, CUSTOM_BACKGROUND_STRENGTH)
      : businessPresets[business.business_type].background;

  const starColor =
    contrastRatio(secondary, pageBackground) < STAR_MIN_CONTRAST
      ? primary
      : secondary;

  const onPrimary =
    contrastRatio(WHITE, primary) >= contrastRatio(textColors.primary, primary)
      ? WHITE
      : textColors.primary;

  return { primary, secondary, pageBackground, starColor, onPrimary };
}

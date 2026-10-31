import { businessTypeLabels, type BusinessType } from "@/lib/brand/tokens";

/**
 * The built-in default vector logo for each business type (brand-guide.md
 * "Default Logo & Color by Business Type"). Outline icons drawn with
 * `currentColor`, so the caller colours them with the preset primary colour.
 * These are our own SVGs and are exempt from the no-SVG-upload rule.
 */
const shapes: Record<BusinessType, React.ReactNode> = {
  // Coffee cup.
  cafe: (
    <>
      <path d="M4 9h12v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7 3v2M11 3v2" />
    </>
  ),
  // Plate and fork.
  restaurant: (
    <>
      <circle cx="13.5" cy="13.5" r="6.5" />
      <path d="M6 3v4a2 2 0 0 0 4 0V3" />
      <path d="M8 9v12" />
    </>
  ),
  // Bed and pillow.
  hotel: (
    <>
      <path d="M3 19V8M3 15h18v4M21 19v-4a3 3 0 0 0-3-3h-7v3" />
      <circle cx="7" cy="11" r="2" />
    </>
  ),
  // Scissors.
  salon: (
    <>
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <path d="M8.6 8.4 20 17M8.6 15.6 20 7" />
    </>
  ),
  // Dumbbell.
  gym: (
    <>
      <path d="M6 7v10M9.5 5v14M14.5 5v14M18 7v10" />
      <path d="M9.5 12h5" />
    </>
  ),
  // Shopping bag.
  retail: (
    <>
      <path d="M5.5 8h13l1 12.5h-15L5.5 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  // Star.
  other: (
    <path d="M12 3.5l2.6 5.3 5.8.9-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.9L12 3.5Z" />
  ),
};

type BusinessLogoProps = {
  type: BusinessType;
  /** Rendered square size in px. */
  size?: number;
  /** Any CSS colour; defaults to `currentColor`. */
  color?: string;
  className?: string;
};

/** Default vector logo for a business type (used when no logo is uploaded). */
export function BusinessLogo({
  type,
  size = 40,
  color,
  className = "",
}: BusinessLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={`${businessTypeLabels[type]} default logo`}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {shapes[type]}
    </svg>
  );
}

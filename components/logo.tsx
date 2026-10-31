const sources = {
  horizontal: {
    src: "/brand/syehere-logo-horizontal-v5.svg",
    width: 620,
    height: 130,
  },
  icon: {
    src: "/brand/syehere-icon-logo-v5.svg",
    width: 256,
    height: 256,
  },
} as const;

export type LogoVariant = keyof typeof sources;

type LogoProps = {
  /** `horizontal` for nav bars and emails, `icon` for compact/favicon use. */
  variant?: LogoVariant;
  /** Rendered height in px; width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
};

/** Syehere's own logo. Passes `alt` text; never decorative. */
export function Logo({ variant = "horizontal", height, className }: LogoProps) {
  const asset = sources[variant];
  const renderedHeight = height ?? (variant === "icon" ? 32 : 28);
  const renderedWidth = Math.round(
    (asset.width / asset.height) * renderedHeight,
  );

  return (
    // The logo is a static, local SVG; a plain <img> avoids the image
    // optimizer's SVG restrictions and keeps the markup simple.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.src}
      alt="Syehere"
      width={renderedWidth}
      height={renderedHeight}
      className={className}
    />
  );
}

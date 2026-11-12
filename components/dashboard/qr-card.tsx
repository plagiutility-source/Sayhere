"use client";

/**
 * The printable QR canvas (mock, Stage 1) — what an owner actually pins to the
 * counter.
 *
 * Layout: logo and business name sit in the MIDDLE of the card, with the QR
 * under them. The business-type motif (coffee cup for café, scissors for salon,
 * dumbbell for gym, …) is a large, clearly visible watermark behind the card
 * and is repeated as a badge on the QR frame, so each trade gets its own
 * looking code instead of a plain white block.
 *
 * The QR data itself is always black on white with a quiet zone and untouched
 * modules: colours or artwork over the modules are what breaks scanning at the
 * counter, so the design lives in the frame around the code.
 *
 * Every length below is in millimetres so a printout is the real physical size.
 */

import { BusinessLogo } from "@/components/business-logo";
import { QrArt } from "@/components/rooms/shared/QrArt";
import type { BusinessType } from "@/lib/brand/tokens";

export type QrCardDesign = "classic" | "bold" | "minimal";
export type QrCardSize = "a6" | "a5" | "a4";

export type QrCardDimensions = {
  /** Display label for the size picker. */
  label: string;
  /** The paper/card size in millimetres. */
  width: number;
  height: number;
  /** Rendered QR edge in millimetres (never below 40, the usual scan minimum). */
  qr: number;
};

/** Standard card sizes. The QR is 52–96 mm, well above the 4 cm scan minimum. */
export const QR_CARD_SIZES: Record<QrCardSize, QrCardDimensions> = {
  a6: { label: "Table card · A6", width: 105, height: 148, qr: 52 },
  a5: { label: "Poster · A5", width: 148, height: 210, qr: 68 },
  a4: { label: "Poster · A4", width: 210, height: 297, qr: 96 },
};

export const QR_CARD_DESIGNS: {
  id: QrCardDesign;
  label: string;
  hint: string;
}[] = [
  { id: "classic", label: "Classic", hint: "Colour card, framed code" },
  { id: "bold", label: "Bold", hint: "Deep colour with a big motif" },
  { id: "minimal", label: "Minimal", hint: "White card, colour frame" },
];

/** White or near-black, whichever reads better on `background`. */
export function readableOn(background: string): string {
  return contrastRatio("#FFFFFF", background) >=
    contrastRatio("#1F2937", background)
    ? "#FFFFFF"
    : "#1F2937";
}

/** WCAG contrast (1–21), used only to choose the text colour. */
function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const value = hex.replace("#", "");
    const full =
      value.length === 3
        ? value
            .split("")
            .map((char) => char + char)
            .join("")
        : value;
    const int = Number.parseInt(full, 16);
    const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map(
      (channel) => {
        const s = channel / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      },
    );
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const TYPE_SCALE: Record<
  QrCardSize,
  {
    name: number;
    tagline: number;
    cta: number;
    logo: number;
    pad: number;
    frame: number;
    badge: number;
  }
> = {
  a6: { name: 5.4, tagline: 3, cta: 3.8, logo: 15, pad: 8, frame: 5, badge: 9 },
  a5: { name: 6.6, tagline: 3.6, cta: 4.4, logo: 19, pad: 11, frame: 6, badge: 11 },
  a4: { name: 8.6, tagline: 4.6, cta: 5.6, logo: 26, pad: 15, frame: 8, badge: 15 },
};

export function QrCard({
  design,
  size,
  background,
  businessName,
  tagline,
  businessType,
  qrUrl,
}: {
  design: QrCardDesign;
  size: QrCardSize;
  /** The owner's chosen card colour. */
  background: string;
  businessName: string;
  tagline: string;
  businessType: BusinessType;
  /** Absolute URL the QR encodes (`<origin>/r/<slug>`). */
  qrUrl: string;
}) {
  const dim = QR_CARD_SIZES[size];
  const scale = TYPE_SCALE[size];
  const onBackground = readableOn(background);
  const minimal = design === "minimal";
  const bold = design === "bold";

  const textColor = minimal ? background : onBackground;
  /** Artwork colour: the card colour on white cards, light ink on colour. */
  const motifColor = minimal ? background : onBackground;
  const panelBorder = minimal ? background : "rgba(255, 255, 255, 0.9)";
  const framePad = scale.frame;

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        width: `${dim.width}mm`,
        height: `${dim.height}mm`,
        padding: `${scale.pad}mm`,
        boxSizing: "border-box",
        textAlign: "center",
        backgroundColor: minimal ? "#FFFFFF" : background,
        color: textColor,
        border: minimal ? `1.4mm solid ${background}` : undefined,
      }}
    >
      {/* The trade's motif as corner watermarks: clearly visible in the card's
          margins, never under the QR modules (the code sits on its own opaque
          white panel, so a centred watermark only peeked out as a stray blob). */}
      {[
        { top: `-${dim.width * 0.06}mm`, left: `-${dim.width * 0.06}mm`, rotate: -12 },
        {
          bottom: `-${dim.width * 0.06}mm`,
          right: `-${dim.width * 0.06}mm`,
          rotate: 12,
        },
      ].map((corner, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: corner.top,
            left: corner.left,
            bottom: corner.bottom,
            right: corner.right,
            transform: `rotate(${corner.rotate}deg)`,
            width: `${dim.width * (bold ? 0.46 : 0.36)}mm`,
            height: `${dim.width * (bold ? 0.46 : 0.36)}mm`,
            opacity: bold ? 0.32 : 0.28,
          }}
        >
          <BusinessLogo
            type={businessType}
            size={120}
            color={motifColor}
            className="h-full w-full"
          />
        </span>
      ))}

      {/* Identity, centred in the card. */}
      <div className="relative z-10 flex flex-col items-center">
        <span
          className="grid place-items-center rounded-full"
          style={{
            width: `${scale.logo}mm`,
            height: `${scale.logo}mm`,
            backgroundColor: minimal ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.2)",
            border: minimal ? `0.5mm solid ${background}` : undefined,
          }}
        >
          <BusinessLogo
            type={businessType}
            size={48}
            color={textColor}
            className="h-[62%] w-[62%]"
          />
        </span>
        <span
          className="mt-[3mm] block max-w-full font-display font-medium leading-[1.1]"
          style={{ fontSize: `${scale.name}mm` }}
        >
          {businessName}
        </span>
        {tagline ? (
          <span
            className="mt-[1.4mm] block max-w-full leading-snug"
            style={{ fontSize: `${scale.tagline}mm`, opacity: minimal ? 0.7 : 0.85 }}
          >
            {tagline}
          </span>
        ) : null}
      </div>

      {/* Framed QR: one clean white panel with a single motif badge on its top
          edge. No artwork around the sides of the code. */}
      <div
        className="relative z-10 mt-[6mm] rounded-[3mm] bg-white"
        style={{
          padding: `${framePad}mm`,
          border: `0.8mm solid ${panelBorder}`,
          boxShadow: `0 0 0 1.2mm ${minimal ? "#FFFFFF" : background}`,
        }}
      >
        {/* Badge sits on the frame edge, outside the code's quiet zone. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-full"
          style={{
            top: `-${scale.badge / 2 + 0.4}mm`,
            width: `${scale.badge}mm`,
            height: `${scale.badge}mm`,
            backgroundColor: minimal ? "#FFFFFF" : background,
            border: `0.6mm solid ${panelBorder}`,
          }}
        >
          <BusinessLogo
            type={businessType}
            size={32}
            color={minimal ? background : onBackground}
            className="h-[62%] w-[62%]"
          />
        </span>

        <span
          className="block"
          style={{ width: `${dim.qr}mm`, height: `${dim.qr}mm` }}
        >
          <QrArt url={qrUrl} />
        </span>
      </div>

      <span
        className="relative z-10 mt-[5mm] block font-medium"
        style={{ fontSize: `${scale.cta}mm` }}
      >
        Scan to leave us a review
      </span>
    </div>
  );
}

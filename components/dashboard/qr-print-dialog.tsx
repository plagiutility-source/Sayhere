"use client";

/**
 * "Print QR" designer: pick a design, a card colour and a standard size, see a
 * live preview, then print.
 *
 * Print path: the chosen card is rendered once more in a `.qr-print-area`
 * portal on `document.body` at real millimetre size, with its own `@page` size.
 * `app/globals.css` keeps that area off-screen on the screen and makes it the
 * only visible thing when printing (the same pattern the invoice paper uses).
 */

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { BrandTheme } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import { Modal } from "./modal";
import {
  QrCard,
  QR_CARD_DESIGNS,
  QR_CARD_MAX_MM,
  QR_CARD_MIN_MM,
  QR_CARD_SIZES,
  readableOn,
  resolveCardDimensions,
  type QrCardCustomSize,
  type QrCardDesign,
  type QrCardSize,
} from "./qr-card";

/** One CSS millimetre in CSS pixels, for the on-screen preview scale. */
const MM_IN_PX = 3.7795275591;
const PREVIEW_WIDTH = 260;

/** Extra colours an owner can pick, on top of their own brand colours. */
const EXTRA_SWATCHES = [
  "#0F172A",
  "#0E7490",
  "#B91C1C",
  "#7C3AED",
  "#C2410C",
  "#BE185D",
];

const OPTION_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-control border px-3 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2";
const ACTIVE_OPTION = "border-brand-blue bg-brand-blue/10 text-brand-navy";
const IDLE_OPTION = "border-black/15 bg-white text-ink hover:bg-surface-muted";

export function QrPrintDialog({
  open,
  onClose,
  businessName,
  tagline,
  businessType,
  logoUrl = null,
  theme,
  url,
}: {
  open: boolean;
  onClose: () => void;
  businessName: string;
  tagline: string;
  businessType: BusinessType;
  /** The owner's uploaded logo; the type's default mark when absent. */
  logoUrl?: string | null;
  theme: BrandTheme;
  /** Absolute URL of the customer page (`<origin>/r/<slug>`). */
  url: string;
}) {
  const [design, setDesign] = useState<QrCardDesign>("classic");
  const [size, setSize] = useState<QrCardSize | "custom">("a6");
  const [customWidth, setCustomWidth] = useState(105);
  const [customHeight, setCustomHeight] = useState(148);
  const [background, setBackground] = useState(theme.primary);
  /** Identity logo size as a percentage of the preset size (60–160%). */
  const [logoScale, setLogoScale] = useState(100);

  const swatches = useMemo(() => {
    const all = [theme.primary, theme.secondary, ...EXTRA_SWATCHES];
    return all
      .map((color) => color.toUpperCase())
      .filter((color, index, list) => list.indexOf(color) === index);
  }, [theme.primary, theme.secondary]);

  const customSize: QrCardCustomSize | null =
    size === "custom" ? { width: customWidth, height: customHeight } : null;
  const dim = resolveCardDimensions(
    size === "custom" ? "a6" : size,
    customSize,
  );
  const card = (
    <QrCard
      design={design}
      size={size === "custom" ? "a6" : size}
      customSize={customSize}
      background={background}
      businessName={businessName}
      tagline={tagline}
      businessType={businessType}
      logoUrl={logoUrl}
      logoScale={logoScale / 100}
      qrUrl={url}
    />
  );

  const previewScale = PREVIEW_WIDTH / (dim.width * MM_IN_PX);
  const canPrint = url.length > 0 && typeof document !== "undefined";

  /**
   * `body.qr-printing` removes the app from the layout for the print job (see
   * app/globals.css), so the owner gets one card instead of the hidden dashboard
   * paginated across blank sheets. The class is removed as soon as the browser
   * is done, and if `afterprint` never fires a later click clears it anyway.
   */
  function handlePrint() {
    const body = document.body;
    body.classList.add("qr-printing");
    const cleanup = () => {
      body.classList.remove("qr-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1000);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Print your QR"
        panelClassName="max-w-[760px]"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!canPrint}
              onClick={handlePrint}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-4 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Print
            </button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-[260px_minmax(0,1fr)]">
          <div>
            <p className="text-[12px] font-medium text-ink-muted">Preview</p>
            <div
              className="mt-2 overflow-hidden rounded-card border border-black/10 bg-surface-muted p-2"
              style={{
                width: PREVIEW_WIDTH + 16,
                height: (dim.height / dim.width) * PREVIEW_WIDTH + 16,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              >
                {card}
              </div>
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-ink-muted">
              {dim.width} × {dim.height} mm · QR {dim.qr} mm wide
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="text-[12px] font-medium text-ink">Design</legend>
              <div className="mt-2 grid gap-2">
                {QR_CARD_DESIGNS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={design === option.id}
                    onClick={() => setDesign(option.id)}
                    className={`${OPTION_BUTTON} h-auto flex-col items-start gap-0.5 py-2 text-left ${
                      design === option.id ? ACTIVE_OPTION : IDLE_OPTION
                    }`}
                  >
                    <span className="text-[12.5px] font-medium">
                      {option.label}
                    </span>
                    <span className="text-[11.5px] font-normal text-ink-muted">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[12px] font-medium text-ink">
                Card colour
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {swatches.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Card colour ${color}`}
                    aria-pressed={background.toUpperCase() === color}
                    onClick={() => setBackground(color)}
                    className={`h-9 w-9 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                      background.toUpperCase() === color
                        ? "border-ink"
                        : "border-black/15"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <span className="sr-only">{color}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-ink-muted">
                Text switches to {readableOn(background).toLowerCase()} so the
                name stays readable. The QR itself stays black on white so it
                always scans.
              </p>
            </fieldset>

            <fieldset>
              <legend className="text-[12px] font-medium text-ink">
                Logo size
              </legend>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={60}
                  max={160}
                  step={5}
                  value={logoScale}
                  onChange={(event) => setLogoScale(Number(event.target.value))}
                  aria-label="Logo size on the QR card"
                  className="h-1.5 w-full cursor-pointer accent-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
                <span className="w-11 shrink-0 text-right text-[11.5px] tabular-nums text-ink-muted">
                  {logoScale}%
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">
                Slide right to make the logo bigger on the card, left to make it
                smaller.
              </p>
            </fieldset>

            <fieldset>
              <legend className="text-[12px] font-medium text-ink">Size</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(QR_CARD_SIZES) as QrCardSize[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={size === key}
                    onClick={() => setSize(key)}
                    className={`${OPTION_BUTTON} ${
                      size === key ? ACTIVE_OPTION : IDLE_OPTION
                    }`}
                  >
                    {QR_CARD_SIZES[key].label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={size === "custom"}
                  onClick={() => setSize("custom")}
                  className={`${OPTION_BUTTON} ${
                    size === "custom" ? ACTIVE_OPTION : IDLE_OPTION
                  }`}
                >
                  Custom size
                </button>
              </div>

              {size === "custom" ? (
                <div className="mt-3 rounded-control border border-black/10 bg-surface-muted/60 p-3">
                  <p className="text-[11.5px] font-medium text-ink">
                    Custom size (mm)
                  </p>
                  <div className="mt-2 grid max-w-[280px] grid-cols-2 gap-2">
                    <label className="text-[11px] text-ink-muted">
                      Width
                      <input
                        type="number"
                        inputMode="numeric"
                        min={QR_CARD_MIN_MM}
                        max={QR_CARD_MAX_MM}
                        value={customWidth}
                        onChange={(event) =>
                          setCustomWidth(Number(event.target.value))
                        }
                        className="mt-1 h-9 w-full rounded-control border border-black/15 bg-white px-2 text-[13px] tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      />
                    </label>
                    <label className="text-[11px] text-ink-muted">
                      Height
                      <input
                        type="number"
                        inputMode="numeric"
                        min={QR_CARD_MIN_MM}
                        max={QR_CARD_MAX_MM}
                        value={customHeight}
                        onChange={(event) =>
                          setCustomHeight(Number(event.target.value))
                        }
                        className="mt-1 h-9 w-full rounded-control border border-black/15 bg-white px-2 text-[13px] tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-muted">
                    {QR_CARD_MIN_MM}–{QR_CARD_MAX_MM} mm. The QR stays at least
                    40 mm wide so it scans reliably.
                  </p>
                </div>
              ) : null}

              <p className="mt-2 text-[11.5px] text-ink-muted">
                Print at 100% scale (no “fit to page”) for the exact size.
              </p>
            </fieldset>
          </div>
        </div>
      </Modal>

      {/* Print sheet: off-screen on the screen, the only visible thing when printing. */}
      {open && canPrint
        ? createPortal(
            <div className="qr-print-area" aria-hidden="true">
              <style>{`@page { size: ${dim.width}mm ${dim.height}mm; margin: 0; }`}</style>
              {card}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

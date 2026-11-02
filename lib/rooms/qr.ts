"use client";

/**
 * QR rendering, ported from the demo's `qrSvg` (`app.js` around line 2006).
 *
 * `lib/rooms/vendor/qrcode.js` is the demo's `assets/qrcode.js`, vendored with
 * its licence header intact. Two edits so it can be imported as a module: the
 * final `export default qrcode` line, and the removal of the UMD wrapper (Next
 * treats the file as ESM and its `module.exports` branch throws at runtime).
 * Both are logged in the session log.
 *
 * The SVG is returned as a string exactly as the demo builds it. Components
 * show it through an `<img src="data:image/svg+xml,...">` or download it, so no
 * `dangerouslySetInnerHTML` is needed.
 */

import qrcode from "./vendor/qrcode";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * QR modules are pure black on white for scannability, so these are not brand
 * colours and do not come from the Tailwind tokens. Named SVG colours keep the
 * rooms code free of hardcoded hex values.
 */
const QR_DARK = "black";
const QR_LIGHT = "white";

/** Demo `qrSvg`: one `<path>` for the modules, white background, quiet zone 2. */
export function qrSvg(url: string): string {
  try {
    if (typeof qrcode !== "function") throw new Error("qr library missing");
    const code = qrcode(0, "M");
    code.addData(url);
    code.make();
    const count = code.getModuleCount();
    let path = "";
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (code.isDark(row, column)) path += `M${column} ${row}h1v1h-1z`;
      }
    }
    const size = count + 4;
    return `<svg xmlns="${SVG_NS}" viewBox="-2 -2 ${size} ${size}" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${size}" height="${size}" fill="${QR_LIGHT}"/><path d="${path}" fill="${QR_DARK}"/></svg>`;
  } catch {
    return `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" role="img" aria-label="QR preview"><rect width="100" height="100" fill="${QR_LIGHT}"/><text x="50" y="52" text-anchor="middle" font-family="sans-serif" font-size="9" fill="${QR_DARK}">QR preview</text></svg>`;
  }
}

/** `syehere-<slug>-<code>.svg` (spec section 11). */
export function qrFilename(slug: string, code: string): string {
  return `syehere-${slug}-${code}.svg`;
}

/** A data URL for an `<img>` tag; keeps the demo's SVG markup without innerHTML. */
export function qrDataUrl(url: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(url))}`;
}

/** Type surface for the vendored QR library (`qrcode.js`, kazuhikoarase). */
export type QrCodeInstance = {
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, column: number): boolean;
};

export default function qrcode(
  typeNumber: number,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" | string,
): QrCodeInstance;

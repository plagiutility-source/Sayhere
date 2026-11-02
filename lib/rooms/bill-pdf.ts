/**
 * `billPdfBlob`: a one-page, hand-built PDF (no dependency) with the business
 * header, rounds, total and paid strip. The business name and address come
 * from the app's own profile and page config, never from demo fixtures.
 */

import { formatTime } from "./format";
import { orderRounds } from "./rules";
import type { Order } from "./types";

function pdfSafe(value: string | number | null | undefined): string {
  return String(value == null ? "" : value)
    .replace(/\u20b9/g, "Rs. ")
    .replace(/[·•]/g, "-")
    .replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfEscape(value: string | number | null | undefined): string {
  return pdfSafe(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfMoney(value: number | string | null | undefined): string {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export type BillPdfContext = {
  spotName: string;
  waiterName: string;
  /** The app's business name (never a demo brand). */
  businessName: string;
  /** The configured address; the line is omitted when it is empty. */
  address?: string;
};

export function billPdfBlob(order: Order, context: BillPdfContext): Blob {
  const rounds = orderRounds(order);
  const payment = order.payment || null;
  const commands: string[] = [];
  const text = (value: string | number, size: number, bold: boolean, x: number, y: number) => {
    const font = bold ? "F2" : "F1";
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`);
  };
  const rule = (y: number) => commands.push(`0.8 w 40 ${y} m 555 ${y} l S`);
  let y = 800;

  text(context.businessName, 20, true, 40, y);
  if (context.address) text(context.address, 9, false, 40, y - 16);
  text("BILL", 16, true, 430, y);
  text(`#${order.number}`, 10, false, 430, y - 16);
  text(formatTime(order.createdAt), 9, false, 430, y - 28);
  rule(y - 38);

  y -= 58;
  text(context.spotName, 11, true, 40, y);
  text(
    `${order.customerName}${order.phone ? ` | ${order.phone}` : ""}`,
    9,
    false,
    40,
    y - 14,
  );
  text(
    `${context.waiterName} | ${order.guests} guest${order.guests === 1 ? "" : "s"}`,
    9,
    false,
    40,
    y - 26,
  );
  text("PAID", 11, true, 480, y);

  y -= 46;
  rounds.forEach((round, index) => {
    text(`Round ${index + 1} | ${formatTime(round.at)}${round.by ? ` | ${round.by}` : ""}`, 9, true, 40, y);
    y -= 14;
    round.items.forEach((item) => {
      text(item.name, 9, false, 40, y);
      text(String(item.qty), 9, false, 470, y);
      text(pdfMoney(item.price * item.qty), 9, false, 505, y);
      y -= 12;
    });
    y -= 6;
  });

  rule(y);
  y -= 20;
  text("Total (taxes included)", 11, true, 40, y);
  text(pdfMoney(order.total), 14, true, 470, y - 1);

  y -= 30;
  commands.push("0.043 0.478 0.333 rg");
  commands.push(`40 ${y - 4} 515 22 re f`);
  commands.push("1 1 1 rg");
  text(
    `PAID ${pdfMoney(payment ? payment.amount : order.total)}${payment && payment.mode ? ` via ${payment.mode}` : ""}`,
    10,
    true,
    46,
    y + 3,
  );
  commands.push("0 0 0 rg");

  y -= 34;
  text("Thank you for dining with us.", 9, false, 40, y);
  text("This is a computer-generated bill.", 8, false, 40, y - 12);

  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

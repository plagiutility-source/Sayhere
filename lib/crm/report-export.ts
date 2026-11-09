/**
 * Builds the patient copy outside React. The file is self-contained: inline
 * CSS, inline compressed photos, no server upload and no external assets. That
 * makes it safe to send as a document to a patient's phone in the Stage 1 mock.
 */

import type {
  BusinessProfile,
} from "@/lib/mock/store";
import type { CrmContact, CrmServiceEntry } from "./rules";
import { CRM_PATIENT_GENDER_LABELS, type CrmReportSettings } from "./config";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function text(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function safeDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fileSafe(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function section(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<section class="section">
    <h2>${escapeHtml(label)}</h2>
    <p>${text(value)}</p>
  </section>`;
}

function photoFigure(label: string, source: string | null): string {
  if (!source) return "";
  return `<figure>
    <img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" />
    <figcaption>${escapeHtml(label)}</figcaption>
  </figure>`;
}

export function patientReportFilename(
  reportNumber: string,
  contactName: string,
  reportTitle = "service report",
): string {
  const number = fileSafe(reportNumber) || "report";
  const name = fileSafe(contactName) || "client";
  return `${fileSafe(reportTitle) || "service-report"}-${number}-${name}.html`;
}

export function buildPatientReportHtml({
  business,
  contact,
  entry,
  billing,
  reportSettings,
}: {
  business: BusinessProfile;
  contact: CrmContact;
  entry: CrmServiceEntry;
  billing: {
    address: string;
    phone: string;
    email: string;
  };
  reportSettings: CrmReportSettings;
}): string | null {
  const report = entry.report;
  if (!report) return null;

  const gender = report.patient_gender
    ? CRM_PATIENT_GENDER_LABELS[report.patient_gender]
    : "";
  const patientMeta = [report.patient_age, gender, contact.phone, contact.email]
    .filter(Boolean)
    .join(" · ");
  const signature = reportSettings.provider_signature || report.doctor_name;
  const photos =
    report.include_photos && report.share_consent && entry.photo_consent
      ? [photoFigure("Before", entry.before_photo), photoFigure("After", entry.after_photo)]
          .filter(Boolean)
          .join("")
      : "";
  const medicines = report.medicines.length
    ? `<table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dose</th>
            <th>When</th>
            <th>Duration</th>
            <th>Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${report.medicines
            .map(
              (medicine) => `<tr>
                <td><strong>${text(medicine.name)}</strong></td>
                <td>${text(medicine.dose) || "—"}</td>
                <td>${text(medicine.frequency) || "—"}</td>
                <td>${text(medicine.duration) || "—"}</td>
                <td>${text(medicine.instructions) || "—"}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>`
    : `<p class="muted">No items were added to this plan.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${escapeHtml(report.number)} · ${escapeHtml(contact.name)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3f8; color: #1f2937; font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { max-width: 780px; margin: 28px auto; background: #fff; padding: 38px 42px; border-radius: 14px; box-shadow: 0 8px 30px rgba(15, 23, 42, .08); }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #1d4ed8; padding-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: -.02em; }
    .brand p { margin: 4px 0 0; font-size: 11px; line-height: 1.5; color: #64748b; white-space: pre-line; }
    .doc-type { text-align: right; flex-shrink: 0; }
    .doc-type strong { display: block; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #1d4ed8; }
    .doc-type span { display: block; margin-top: 6px; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .doc-type small { display: block; margin-top: 4px; color: #64748b; }
    .people { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 22px; }
    .card { border: 1px solid #e2e8f0; border-radius: 9px; padding: 12px 14px; }
    .label { margin: 0 0 4px; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #64748b; }
    .name { margin: 0; font-size: 16px; font-weight: 650; color: #0f172a; }
    .meta { margin: 5px 0 0; font-size: 11px; color: #64748b; }
    .section { margin-top: 22px; }
    .section h2 { margin: 0 0 6px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; }
    .section p { margin: 0; font-size: 13px; }
    .prescription { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .prescription h2 { margin: 0 0 9px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; color: #64748b; font-size: 9px; letter-spacing: .06em; text-transform: uppercase; text-align: left; }
    th, td { border-bottom: 1px solid #edf2f7; padding: 8px 7px; vertical-align: top; }
    td { font-size: 11px; }
    td:first-child { min-width: 120px; }
    .muted { color: #64748b; font-size: 12px; }
    .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    figure { margin: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; }
    figure img { display: block; width: 100%; max-height: 250px; object-fit: contain; }
    figcaption { padding: 6px 8px; font-size: 10px; font-weight: 650; color: #475569; }
    .advice { margin-top: 24px; padding: 13px 15px; border-left: 3px solid #1d4ed8; background: #f8fafc; border-radius: 0 8px 8px 0; }
    .advice h2 { margin-top: 0; }
    .follow { margin-top: 10px; font-size: 13px; font-weight: 650; }
    .sign { display: flex; justify-content: space-between; gap: 20px; margin-top: 42px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
    .signature { min-width: 170px; border-top: 1px solid #94a3b8; padding-top: 5px; text-align: right; }
    footer { margin-top: 22px; border-top: 1px solid #edf2f7; padding-top: 10px; font-size: 9px; line-height: 1.5; color: #94a3b8; }
    @media (max-width: 600px) {
      body { background: #fff; }
      .page { margin: 0; padding: 22px 18px; border-radius: 0; box-shadow: none; }
      .top, .people { display: block; }
      .doc-type { margin-top: 16px; text-align: left; }
      .card + .card { margin-top: 10px; }
      .photos { grid-template-columns: 1fr; }
      .sign { display: block; }
      .signature { margin-top: 26px; text-align: left; }
    }
    @media print {
      body { background: #fff; }
      .page { max-width: none; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
      .photos { break-inside: avoid; }
      .prescription { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="top">
      <div class="brand">
        ${escapeHtml(business.name)}
        ${billing.address ? `<p>${text(billing.address)}</p>` : ""}
        ${billing.phone || billing.email ? `<p>${escapeHtml([billing.phone, billing.email].filter(Boolean).join(" · "))}</p>` : ""}
      </div>
      <div class="doc-type">
        <strong>${escapeHtml(reportSettings.report_title)}</strong>
        <span>${escapeHtml(report.number)}</span>
        <small>Visit ${escapeHtml(safeDate(entry.entry_date))}</small>
      </div>
    </header>

    <div class="people">
      <div class="card">
        <p class="label">${escapeHtml(reportSettings.recipient_label)}</p>
        <p class="name">${escapeHtml(contact.name)}</p>
        <p class="meta">${escapeHtml(patientMeta || `${reportSettings.recipient_label} details not specified`)}</p>
      </div>
      <div class="card">
        <p class="label">${escapeHtml(reportSettings.provider_label)}</p>
        <p class="name">${escapeHtml(report.doctor_name)}</p>
        <p class="meta">${escapeHtml([report.doctor_qualification, report.doctor_registration ? `Reg. ${report.doctor_registration}` : ""].filter(Boolean).join(" · ") || reportSettings.provider_label)}</p>
      </div>
    </div>

    ${section("Visit / service", entry.service)}
    ${section("Concern / reason for visit", report.chief_complaint)}
    ${section("Assessment / result", report.diagnosis)}
    ${section("Observations / findings", report.examination)}
    ${section("Checks / tests", report.tests)}
    ${section("Service / treatment", report.treatment)}

    <section class="prescription">
      <h2>${escapeHtml(reportSettings.plan_title)}</h2>
      ${medicines}
    </section>

    ${
      photos
        ? `<section class="section">
            <h2>Before / after photos</h2>
            <div class="photos">${photos}</div>
          </section>`
        : ""
    }

    ${
      report.advice
        ? `<section class="advice section">
            <h2>Advice / aftercare</h2>
            <p>${text(report.advice)}</p>
            ${report.follow_up_date ? `<p class="follow">Follow-up: ${escapeHtml(safeDate(report.follow_up_date))}</p>` : ""}
          </section>`
        : report.follow_up_date
          ? `<p class="follow">Follow-up: ${escapeHtml(safeDate(report.follow_up_date))}</p>`
          : ""
    }

    <div class="sign">
      <span>${escapeHtml(business.name)} · ${escapeHtml(reportSettings.recipient_label)} copy</span>
      <span class="signature">
        <strong>${escapeHtml(reportSettings.approval_text)}</strong><br />
        ${escapeHtml(signature)}
      </span>
    </div>
    <footer>
      ${escapeHtml(reportSettings.footer_note)}
    </footer>
  </main>
</body>
</html>`;
}

export type ShareReportResult = "shared" | "downloaded" | "cancelled";

type ReportShareNavigator = Navigator & {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: {
    files: File[];
    title?: string;
    text?: string;
  }) => Promise<void>;
};

/**
 * Prefer the native share sheet so a phone can send the document straight to
 * WhatsApp or Files. Desktop browsers download the same self-contained file.
 */
export async function sharePatientReportFile(
  html: string,
  filename: string,
  reportTitle = "Service report",
): Promise<ShareReportResult> {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const nav = navigator as ReportShareNavigator;
  if (typeof File !== "undefined" && nav.share) {
    const file = new File([blob], filename, { type: "text/html" });
    try {
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: reportTitle,
          text: "Your private service report.",
        });
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to the download path when the platform cannot share.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return "downloaded";
}

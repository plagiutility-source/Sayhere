"use client";

/**
 * The patient-facing copy of a report. It is intentionally outside the CRM
 * chrome: large type, no owner controls, and print styles that produce a clean
 * A4 page. The same content is exported as a self-contained file for sharing.
 */

import { useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/dashboard/modal";
import {
  CRM_PATIENT_GENDER_LABELS,
  type CrmConfig,
} from "@/lib/crm/config";
import {
  buildPatientReportHtml,
  patientReportFilename,
  sharePatientReportFile,
} from "@/lib/crm/report-export";
import type {
  CrmClinicalReport,
  CrmContact,
  CrmServiceEntry,
} from "@/lib/crm/rules";
import { useBusiness } from "@/lib/use-business";
import { formatCrmDate } from "./crm-utils";

function ReportSection({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <section className="mt-4">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">
        {value}
      </p>
    </section>
  );
}

function PatientPhoto({
  label,
  src,
}: {
  label: string;
  src: string | null;
}) {
  if (!src) return null;
  return (
    <figure className="overflow-hidden rounded-control border border-black/10 bg-[#F8FAFC]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${label} treatment`}
        className="max-h-[260px] w-full object-contain"
      />
      <figcaption className="px-2 py-1.5 text-[10px] font-medium text-ink-muted">
        {label}
      </figcaption>
    </figure>
  );
}

function PatientReport({
  report,
  entry,
  contact,
  config,
}: {
  report: CrmClinicalReport;
  entry: CrmServiceEntry;
  contact: CrmContact;
  config: CrmConfig;
}) {
  const business = useBusiness();
  const billing = config.billing;
  const settings = config.report;
  const signature = settings.provider_signature || report.doctor_name;
  const gender = report.patient_gender
    ? CRM_PATIENT_GENDER_LABELS[report.patient_gender]
    : "";
  const patientMeta = [report.patient_age, gender, contact.phone, contact.email]
    .filter(Boolean)
    .join(" · ");
  const showPhotos =
    report.include_photos &&
    report.share_consent &&
    entry.photo_consent &&
    Boolean(entry.before_photo || entry.after_photo);

  return (
    <div className="report-print-area rounded-card border border-black/10 bg-white p-5 text-ink sm:p-7">
      <header className="flex flex-col justify-between gap-4 border-b-2 border-brand-blue pb-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-[18px] font-medium leading-tight">{business.name}</p>
          {billing.address ? (
            <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-ink-muted">
              {billing.address}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-ink-muted">
            {[billing.phone, billing.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-brand-blue">
            {settings.report_title}
          </p>
          <p className="mt-1 text-[16px] font-medium tabular-nums">
            {report.number}
          </p>
          <p className="mt-1 text-[10px] text-ink-muted">
            Visit {formatCrmDate(`${entry.entry_date}T00:00:00`)}
          </p>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-control border border-black/10 p-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            {settings.recipient_label}
          </p>
          <p className="mt-1 text-[14px] font-medium">{contact.name}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
            {patientMeta || `${settings.recipient_label} details not specified`}
          </p>
        </div>
        <div className="rounded-control border border-black/10 p-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            {settings.provider_label}
          </p>
          <p className="mt-1 text-[14px] font-medium">{report.doctor_name}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
            {[
              report.doctor_qualification,
              report.doctor_registration
                ? `Reg. ${report.doctor_registration}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ") || settings.provider_label}
          </p>
        </div>
      </div>

      <ReportSection label="Visit / service" value={entry.service} />
      <ReportSection label="Concern / reason for visit" value={report.chief_complaint} />
      <ReportSection label="Assessment / result" value={report.diagnosis} />
      <ReportSection label="Observations / findings" value={report.examination} />
      <ReportSection label="Checks / tests" value={report.tests} />
      <ReportSection label="Service / treatment" value={report.treatment} />

      <section className="mt-5 border-t border-black/10 pt-4">
        <h3 className="text-[13px] font-medium">{settings.plan_title}</h3>
        {report.medicines.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Item / medicine
                  </th>
                  <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Dose
                  </th>
                  <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    When
                  </th>
                  <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Duration
                  </th>
                  <th className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Instructions
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.medicines.map((medicine) => (
                  <tr key={medicine.id} className="border-b border-black/5">
                    <td className="px-2 py-2.5 text-[11px] font-medium">
                      {medicine.name}
                    </td>
                    <td className="px-2 py-2.5 text-[10px] text-ink-muted">
                      {medicine.dose || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-[10px] text-ink-muted">
                      {medicine.frequency || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-[10px] text-ink-muted">
                      {medicine.duration || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-[10px] text-ink-muted">
                      {medicine.instructions || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-ink-muted">
            No items were added to this plan.
          </p>
        )}
      </section>

      {showPhotos ? (
        <section className="mt-5 border-t border-black/10 pt-4">
          <h3 className="text-[13px] font-medium">Before / after photos</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <PatientPhoto label="Before" src={entry.before_photo} />
            <PatientPhoto label="After" src={entry.after_photo} />
          </div>
        </section>
      ) : null}

      {report.advice ? (
        <section className="mt-5 rounded-control border-l-4 border-brand-blue bg-[#F8FAFC] px-3 py-2.5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            Advice / aftercare
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">
            {report.advice}
          </p>
          {report.follow_up_date ? (
            <p className="mt-2 text-[11px] font-medium text-ink">
              Follow-up: {formatCrmDate(`${report.follow_up_date}T00:00:00`)}
            </p>
          ) : null}
        </section>
      ) : report.follow_up_date ? (
        <p className="mt-5 text-[11px] font-medium text-ink">
          Follow-up: {formatCrmDate(`${report.follow_up_date}T00:00:00`)}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col justify-between gap-4 border-t border-black/10 pt-3 text-[10px] text-ink-muted sm:flex-row">
        <span>
          {business.name} · {settings.recipient_label} copy
        </span>
        <div className="min-w-[190px] sm:text-right">
          <p className="text-[10px] leading-relaxed text-ink-muted">
            {settings.approval_text}
          </p>
          <p className="mt-2 border-t border-black/30 pt-1 text-right text-[11px] font-medium text-ink">
            {signature}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[9px] leading-relaxed text-ink-muted">
        {settings.footer_note}
      </p>
    </div>
  );
}

export function PatientReportDialog({
  open,
  entry,
  contact,
  config,
  onClose,
  onEdit,
}: {
  open: boolean;
  entry: CrmServiceEntry | null;
  contact: CrmContact;
  config: CrmConfig;
  onClose: () => void;
  onEdit: (entry: CrmServiceEntry) => void;
}) {
  const [notice, setNotice] = useState("");
  const [sharing, setSharing] = useState(false);
  const business = useBusiness();
  const report = entry?.report ?? null;

  if (!entry || !report) return null;

  async function share() {
    if (!entry || !report || !report.share_consent) return;
    const html = buildPatientReportHtml({
      business,
      contact,
      entry,
      billing: config.billing,
      reportSettings: config.report,
    });
    if (!html) return;
    setSharing(true);
    setNotice("");
    try {
      const result = await sharePatientReportFile(
        html,
        patientReportFilename(
          report.number,
          contact.name,
          config.report.report_title,
        ),
        config.report.report_title,
      );
      setNotice(
        result === "shared"
          ? "Share sheet opened. Send it to the client."
          : "Report downloaded. Send the file to the client.",
      );
    } catch {
      setNotice("Could not share the report. Try Print / Save PDF instead.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal
      open={open}
      title={config.report.report_title}
      onClose={onClose}
      panelClassName="max-w-[820px]"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onEdit(entry)}
          >
            Edit report
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          <Button
            onClick={() => void share()}
            disabled={!report.share_consent || sharing}
            title={
              report.share_consent
                ? "Share the private report file"
                : "Record client consent in the report editor first"
            }
          >
            {sharing ? "Preparing…" : "Share report"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-brand-blue/15 bg-brand-blue/[0.04] px-3 py-2">
          <p className="text-[11px] leading-relaxed text-ink">
            This is the {config.report.recipient_label.toLowerCase()} copy. It
            includes only the sections and photos you selected.
          </p>
          {!report.share_consent ? (
            <p className="text-[10px] font-medium text-amber-700">
              Sharing is off until client consent is recorded.
            </p>
          ) : null}
          {!report.diagnosis ? (
            <p className="text-[10px] font-medium text-amber-700">
              Draft generated from settings. Add an assessment and plan in Edit
              report before sharing.
            </p>
          ) : null}
        </div>
        {notice ? (
          <p role="status" className="text-[11px] text-brand-green-deep">
            {notice}
          </p>
        ) : null}
        <PatientReport
          report={report}
          entry={entry}
          contact={contact}
          config={config}
        />
        <p className="text-[10px] leading-relaxed text-ink-muted">
          Share downloads a private HTML report file on this device, or opens
          your phone&apos;s share sheet. It is not uploaded to a public page.
        </p>
      </div>
    </Modal>
  );
}

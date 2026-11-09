"use client";

/**
 * CSV import. The file is parsed and validated in the browser first, so the
 * owner sees exactly which rows will be added and why the others will not.
 * `parseContactCsv` is pure and shared with the rules check.
 */

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/button";
import {
  CRM_CSV_MAX_BYTES,
  CRM_HARD_LIMITS,
} from "@/lib/crm/config";
import {
  importContacts,
  parseContactCsv,
  type CrmCsvParse,
  type CrmState,
} from "@/lib/crm/rules";
import type { CrmPlanLimits } from "@/lib/mock/plans";

export function ImportDialog({
  state,
  limits,
  onDone,
  onCancel,
}: {
  state: CrmState;
  limits: CrmPlanLimits;
  onDone: (next: CrmState, added: number, failed: number) => void;
  onCancel: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [parse, setParse] = useState<CrmCsvParse | null>(null);
  const [error, setError] = useState("");

  const maxRows = Math.min(limits.import_rows, CRM_HARD_LIMITS.import_rows);
  const customKeys = state.config.fields
    .filter((field) => !field.archived)
    .map((field) => field.key);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setParse(null);
    if (!file) {
      setFileName("");
      return;
    }
    setFileName(file.name);
    if (file.size > CRM_CSV_MAX_BYTES) {
      setError("That file is over 2 MB. Split it into smaller imports.");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseContactCsv(text, state, limits);
      if (parsed.total > maxRows) {
        setError(
          `That file has ${parsed.total} contacts. Your plan allows ${maxRows} rows per import.`,
        );
        return;
      }
      setParse(parsed);
    } catch {
      setError("That file could not be read. Save it as CSV and try again.");
    }
  }

  function doImport() {
    if (!parse || !parse.drafts.length) return;
    const result = importContacts(state, parse.drafts, limits);
    onDone(result.state, result.added, result.failed);
  }

  const duplicates =
    parse?.issues.filter((issue) => issue.kind === "duplicate").length ?? 0;
  const invalid =
    parse?.issues.filter((issue) => issue.kind === "invalid").length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-control border border-dashed border-black/15 bg-surface-muted p-4">
        <label
          htmlFor="crm-csv-file"
          className="block text-[13px] font-medium text-ink"
        >
          Choose a CSV file
        </label>
        <input
          id="crm-csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="mt-2 block w-full text-[12px] text-ink-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-[12px] file:font-medium file:text-white hover:file:bg-brand-navy"
        />
        <p className="mt-2 text-[11px] text-ink-muted">
          Max 2 MB · name, email, phone, company, stage, tags, consent
          {customKeys.length ? ` plus ${customKeys.join(", ")}` : ""}. Separate
          tags and multi-choice values with semicolons.
        </p>
        {fileName ? (
          <p className="mt-2 truncate text-[12px] text-ink">Selected: {fileName}</p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      {parse ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-control border border-black/10 bg-white p-2">
              <p className="text-[18px] font-medium tabular-nums text-ink">
                {parse.total}
              </p>
              <p className="text-[11px] text-ink-muted">Rows found</p>
            </div>
            <div className="rounded-control border border-black/10 bg-white p-2">
              <p className="text-[18px] font-medium tabular-nums text-brand-green-deep">
                {parse.drafts.length}
              </p>
              <p className="text-[11px] text-ink-muted">Ready to add</p>
            </div>
            <div className="rounded-control border border-black/10 bg-white p-2">
              <p className="text-[18px] font-medium tabular-nums text-red-700">
                {duplicates + invalid}
              </p>
              <p className="text-[11px] text-ink-muted">
                Skipped ({duplicates} duplicate{duplicates === 1 ? "" : "s"})
              </p>
            </div>
          </div>

          {parse.issues.length ? (
            <div className="max-h-40 overflow-y-auto rounded-control border border-black/10">
              <p className="border-b border-black/5 bg-surface-muted px-3 py-2 text-[11px] font-medium text-ink">
                Rows that will be skipped
              </p>
              <ul className="divide-y divide-black/5">
                {parse.issues.slice(0, 12).map((issue) => (
                  <li
                    key={`${issue.row}-${issue.reason}`}
                    className="flex gap-2 px-3 py-2 text-[11px]"
                  >
                    <span className="shrink-0 tabular-nums text-ink-muted">
                      Row {issue.row}
                    </span>
                    <span className="text-ink">{issue.reason}</span>
                  </li>
                ))}
              </ul>
              {parse.issues.length > 12 ? (
                <p className="border-t border-black/5 px-3 py-2 text-[11px] text-ink-muted">
                  And {parse.issues.length - 12} more.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[12px] text-brand-green-deep">
              Every row looks good.
            </p>
          )}

          <p className="text-[11px] text-ink-muted">
            Nothing is saved until you press Add contacts. Duplicate emails are
            skipped, not merged.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={doImport}
          disabled={!parse || parse.drafts.length === 0}
        >
          Add {parse?.drafts.length ?? 0} contact
          {parse?.drafts.length === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}

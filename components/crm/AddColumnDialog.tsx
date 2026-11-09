"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import {
  CRM_FIELD_TYPE_LABELS,
  CRM_HARD_LIMITS,
  type CrmFieldType,
} from "@/lib/crm/config";
import { addCrmField, type CrmState } from "@/lib/crm/rules";
import type { CrmPlanLimits } from "@/lib/mock/plans";

const FIELD_TYPES = Object.entries(CRM_FIELD_TYPE_LABELS) as [
  CrmFieldType,
  string,
][];

const CHOICE_TYPES: CrmFieldType[] = ["select", "multi_select"];

export function AddColumnDialog({
  state,
  limits,
  onCancel,
  onAdded,
}: {
  state: CrmState;
  limits: CrmPlanLimits;
  onCancel: () => void;
  onAdded: (next: CrmState, label: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CrmFieldType>("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  const [showInList, setShowInList] = useState(true);
  const [error, setError] = useState("");

  const fieldLimit = Math.min(limits.fields, CRM_HARD_LIMITS.fields);
  const atLimit = state.config.fields.length >= fieldLimit;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const result = addCrmField(
      state,
      {
        label,
        type,
        options: CHOICE_TYPES.includes(type)
          ? options
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean)
          : [],
        required,
        show_in_list: showInList,
      },
      limits,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdded(result.state, result.field.label);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 rounded-control border border-black/10 bg-[#FBFCFE] px-3 py-2.5">
        <div>
          <p className="text-[12px] font-medium text-ink">Custom columns</p>
          <p className="mt-0.5 text-[11px] leading-4 text-ink-muted">
            Capture what matters to your business. The column is available on
            every contact and in CSV import/export.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-medium tabular-nums text-ink-muted ring-1 ring-black/10">
          {state.config.fields.length} / {fieldLimit}
        </span>
      </div>

      {atLimit ? (
        <p className="rounded-control border border-black/10 bg-surface-muted px-3 py-2 text-[11px] leading-4 text-ink-muted">
          You have reached the {fieldLimit}-column limit on this plan. Upgrade
          your plan to add another.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <Input
          label="Column name"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Membership expiry"
          hint="Keep it short and specific."
          maxLength={40}
          disabled={atLimit}
          autoFocus
        />
        <Select
          label="Type"
          value={type}
          onChange={(event) => setType(event.target.value as CrmFieldType)}
          disabled={atLimit}
        >
          {FIELD_TYPES.map(([value, fieldLabel]) => (
            <option key={value} value={value}>
              {fieldLabel}
            </option>
          ))}
        </Select>
      </div>

      {CHOICE_TYPES.includes(type) ? (
        <Input
          label="Choices"
          value={options}
          onChange={(event) => setOptions(event.target.value)}
          placeholder="Gold, Silver, Standard"
          hint="Separate each choice with a comma."
          disabled={atLimit}
        />
      ) : null}

      <fieldset disabled={atLimit} className="flex flex-col gap-2.5">
        <legend className="text-[12px] font-medium text-ink">
          Where it appears
        </legend>
        <label className="flex items-start gap-2 text-[12px] text-ink">
          <input
            type="checkbox"
            checked={showInList}
            onChange={(event) => setShowInList(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
          />
          <span>
            <span className="block font-medium">Show in the contacts table</span>
            <span className="block text-[11px] text-ink-muted">
              Appears as a column on the Contacts view.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-[12px] text-ink">
          <input
            type="checkbox"
            checked={required}
            onChange={(event) => setRequired(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
          />
          <span>
            <span className="block font-medium">Required</span>
            <span className="block text-[11px] text-ink-muted">
              A value is needed when adding or editing a contact.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="rounded-control border border-black/10 px-3 py-2">
        <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-ink-muted">
          Column preview
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="truncate text-[12px] font-medium text-ink">
            {label.trim() || "New column"}
          </span>
          <span className="shrink-0 text-[10px] text-ink-muted">
            {showInList ? "Shown in table" : "Contact form only"}
          </span>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-control border border-red-700/20 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-black/5 pt-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={atLimit}>
          Add column
        </Button>
      </div>
    </form>
  );
}

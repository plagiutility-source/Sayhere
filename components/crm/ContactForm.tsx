"use client";

/**
 * Add/edit contact form. The same form is used by the list and the detail page;
 * validation comes from lib/crm/rules.ts so the UI and the CSV import agree.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import {
  CRM_CONSENT_LABELS,
  CRM_MAX_TAGS_PER_CONTACT,
  firstOpenStage,
  type CrmConfig,
  type CrmFieldDef,
} from "@/lib/crm/config";
import {
  contactTags,
  validateContactInput,
  type CrmContact,
  type CrmContactDraft,
  type CrmConsentStatus,
  type CrmState,
} from "@/lib/crm/rules";

const TEXTAREA =
  "mt-sm w-full rounded-control border border-black/20 px-md py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";

function blankValue(field: CrmFieldDef): string | string[] | boolean {
  if (field.type === "multi_select") return [];
  if (field.type === "checkbox") return false;
  return "";
}

function draftValue(
  field: CrmFieldDef,
  value: unknown,
): string | string[] | boolean {
  if (field.type === "multi_select") {
    return Array.isArray(value) ? value.map(String) : [];
  }
  if (field.type === "checkbox") return value === true;
  if (value === null || value === undefined) return "";
  return String(value);
}

function emptyDraft(config: CrmConfig): CrmContactDraft {
  return {
    name: "",
    email: "",
    phone: "",
    company: "",
    stage_id: firstOpenStage(config)?.id ?? config.stages[0]?.id ?? "",
    custom_fields: Object.fromEntries(
      config.fields
        .filter((field) => !field.archived)
        .map((field) => [field.key, blankValue(field)]),
    ),
    consent_status: "unknown",
    tags: [],
  };
}

function fromContact(contact: CrmContact, config: CrmConfig): CrmContactDraft {
  return {
    name: contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    stage_id: contact.stage_id,
    custom_fields: Object.fromEntries(
      config.fields
        .filter((field) => !field.archived)
        .map((field) => [
          field.key,
          draftValue(field, contact.custom_fields[field.key]),
        ]),
    ),
    consent_status: contact.consent_status,
    tags: [],
  };
}

export function ContactForm({
  state,
  initial,
  onSubmit,
  onCancel,
}: {
  state: CrmState;
  initial?: CrmContact;
  /** Return errors to keep the form open, or null after a successful save. */
  onSubmit: (draft: CrmContactDraft) => Record<string, string> | null;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CrmContactDraft>(() =>
    initial ? fromContact(initial, state.config) : emptyDraft(state.config),
  );
  const [tagText, setTagText] = useState(() =>
    initial
      ? contactTags(state, initial.id)
          .map((tag) => tag.name)
          .join(", ")
      : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = state.config.fields.filter((field) => !field.archived);
  const tagsEnabled = state.config.modules.tags;
  const pipelineEnabled = state.config.modules.pipeline;
  const firstError = Object.values(errors)[0];

  function setCustom(key: string, value: string | string[] | boolean) {
    setDraft((current) => ({
      ...current,
      custom_fields: { ...current.custom_fields, [key]: value },
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: CrmContactDraft = {
      ...draft,
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    const found = validateContactInput(next, state, initial?.id);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const returned = onSubmit(next);
    if (returned) setErrors(returned);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {firstError ? (
        <p
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {firstError}
        </p>
      ) : null}

      <Input
        label="Name"
        value={draft.name}
        onChange={(event) =>
          setDraft((current) => ({ ...current, name: event.target.value }))
        }
        error={errors.name}
        autoComplete="name"
        maxLength={120}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(event) =>
            setDraft((current) => ({ ...current, email: event.target.value }))
          }
          error={errors.email}
          autoComplete="email"
          maxLength={254}
        />
        <Input
          label="Phone"
          type="tel"
          value={draft.phone}
          onChange={(event) =>
            setDraft((current) => ({ ...current, phone: event.target.value }))
          }
          error={errors.phone}
          autoComplete="tel"
          hint="7–15 digits. Email or phone is required."
        />
      </div>
      <Input
        label="Company (optional)"
        value={draft.company}
        onChange={(event) =>
          setDraft((current) => ({ ...current, company: event.target.value }))
        }
        error={errors.company}
        maxLength={120}
      />
      <div className={`grid gap-4 ${pipelineEnabled ? "sm:grid-cols-2" : ""}`}>
        {pipelineEnabled ? (
          <Select
            label="Stage"
            value={draft.stage_id}
            onChange={(event) =>
              setDraft((current) => ({ ...current, stage_id: event.target.value }))
            }
            error={errors.stage_id}
          >
            {state.config.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          label="Consent"
          value={draft.consent_status}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              consent_status: event.target.value as CrmConsentStatus,
            }))
          }
        >
          {(
            Object.entries(CRM_CONSENT_LABELS) as [
              CrmConsentStatus,
              string,
            ][]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {tagsEnabled ? (
        <Input
          label="Tags"
          value={tagText}
          onChange={(event) => setTagText(event.target.value)}
          error={errors.tags}
          hint={`Separate with commas. Up to ${CRM_MAX_TAGS_PER_CONTACT} tags.`}
          placeholder="Regular, Referral"
        />
      ) : null}

      {fields.length ? (
        <div className="border-t border-black/10 pt-4">
          <p className="text-[12px] font-medium text-ink">Details</p>
          <div className="mt-3 flex flex-col gap-4">
            {fields.map((field) => {
              const value = draft.custom_fields[field.key];
              const error = errors[`custom:${field.key}`];
              const label = `${field.label}${field.required ? " *" : ""}`;
              if (field.type === "long_text") {
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={`crm-field-${field.key}`}
                      className="block text-[13px] font-medium"
                    >
                      {label}
                    </label>
                    <textarea
                      id={`crm-field-${field.key}`}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => setCustom(field.key, event.target.value)}
                      rows={3}
                      className={TEXTAREA}
                      aria-invalid={error ? true : undefined}
                    />
                    {error ? (
                      <p className="mt-xs text-[12px] text-red-700">{error}</p>
                    ) : null}
                  </div>
                );
              }
              if (field.type === "select") {
                return (
                  <Select
                    key={field.key}
                    label={label}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => setCustom(field.key, event.target.value)}
                    error={error}
                  >
                    <option value="">Choose…</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                );
              }
              if (field.type === "multi_select") {
                return (
                  <fieldset key={field.key}>
                    <legend className="text-[13px] font-medium">{label}</legend>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                      {field.options.map((option) => {
                        const selected = Array.isArray(value) && value.includes(option);
                        return (
                          <label
                            key={option}
                            className="flex items-center gap-2 text-[13px] text-ink"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const current = Array.isArray(value) ? value : [];
                                setCustom(
                                  field.key,
                                  event.target.checked
                                    ? [...current, option]
                                    : current.filter((item) => item !== option),
                                );
                              }}
                              className="h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                    {error ? (
                      <p className="mt-xs text-[12px] text-red-700">{error}</p>
                    ) : null}
                  </fieldset>
                );
              }
              if (field.type === "checkbox") {
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-[13px] font-medium">
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) =>
                          setCustom(field.key, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-brand-blue"
                      />
                      {label}
                    </label>
                    {error ? (
                      <p className="mt-xs text-[12px] text-red-700">{error}</p>
                    ) : null}
                  </div>
                );
              }
              return (
                <Input
                  key={field.key}
                  label={label}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : "text"
                  }
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => setCustom(field.key, event.target.value)}
                  error={error}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save changes" : "Add contact"}</Button>
      </div>
    </form>
  );
}

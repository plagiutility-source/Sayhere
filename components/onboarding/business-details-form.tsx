"use client";

import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { businessTypeLabels } from "@/lib/brand/tokens";
import {
  TYPES_BY_CATEGORY,
  type BusinessCategory,
  type CategoryBusinessType,
} from "@/lib/category/types";
import {
  MAX_BUSINESS_NAME_LENGTH,
  MAX_TAGLINE_LENGTH,
} from "@/lib/validation";

export type BusinessDetailsValues = {
  name: string;
  businessType: CategoryBusinessType | "";
  tagline: string;
  addressLine: string;
  city: string;
  pincode: string;
  phone: string;
  fssai: string;
  declaredTables: string;
  declaredRooms: string;
  registrationType: "gstin" | "licence" | "";
  registrationNumber: string;
  gstin: string;
  /** Honeypot. Must stay empty; a value fails the whole submit generically. */
  companyWebsite: string;
};

type BusinessDetailsFormProps = {
  category: BusinessCategory;
  values: BusinessDetailsValues;
  errors: Record<string, string>;
  onChange: (patch: Partial<BusinessDetailsValues>) => void;
};

/**
 * Step 2: real business details and the proof number by category (G4/G5/G8).
 * Everything is validated again at finish, never only here.
 */
export function BusinessDetailsForm({
  category,
  values,
  errors,
  onChange,
}: BusinessDetailsFormProps) {
  const types = TYPES_BY_CATEGORY[category];
  const registrationLabel =
    values.registrationType === "licence"
      ? "Local trade or tourism licence number"
      : "GSTIN";

  return (
    <div className="grid gap-lg">
      <Input
        label="Business name"
        name="business_name"
        autoComplete="organization"
        value={values.name}
        maxLength={MAX_BUSINESS_NAME_LENGTH}
        onChange={(event) => onChange({ name: event.target.value })}
        error={errors.business_name}
        hint="Your real business name. Up to 100 characters."
        placeholder="Brew and Bean"
        className="h-12"
      />

      {category === "hotel" ? (
        <div>
          <p className="text-[13px] font-medium">Business type</p>
          <p className="mt-sm flex h-12 items-center rounded-control border border-black/10 bg-surface-muted px-md text-[14px]">
            Hotel
          </p>
          <p className="mt-xs text-[12px] text-ink-muted">
            Fixed by your category.
          </p>
        </div>
      ) : (
        <Select
          label="Business type"
          name="business_type"
          value={values.businessType}
          onChange={(event) =>
            onChange({
              businessType: event.target.value as BusinessDetailsValues["businessType"],
            })
          }
          error={errors.business_type}
          hint="Only the types inside your locked category are offered."
          className="h-12"
        >
          <option value="">Select a business type</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {businessTypeLabels[type]}
            </option>
          ))}
        </Select>
      )}

      <Input
        label="Tagline"
        name="tagline"
        value={values.tagline}
        maxLength={MAX_TAGLINE_LENGTH}
        onChange={(event) => onChange({ tagline: event.target.value })}
        error={errors.tagline}
        hint="Optional. Up to 120 characters."
        placeholder="Welcome. Tell us about your stay."
        className="h-12"
      />

      <Input
        label="Street address"
        name="address_line"
        autoComplete="street-address"
        value={values.addressLine}
        onChange={(event) => onChange({ addressLine: event.target.value })}
        error={errors.address_line}
        hint="Building, street and area. 5 to 120 characters."
        placeholder="12 MG Road"
        className="h-12"
      />

      <div className="grid gap-lg sm:grid-cols-2">
        <Input
          label="City"
          name="city"
          autoComplete="address-level2"
          value={values.city}
          onChange={(event) => onChange({ city: event.target.value })}
          error={errors.city}
          placeholder="Pune"
          className="h-12"
        />
        <Input
          label="PIN code"
          name="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          value={values.pincode}
          onChange={(event) => onChange({ pincode: event.target.value })}
          error={errors.pincode}
          placeholder="400001"
          className="h-12"
        />
      </div>

      <Input
        label="Business phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={(event) => onChange({ phone: event.target.value })}
        error={errors.phone}
        hint="10 digit Indian mobile starting with 6, 7, 8 or 9."
        placeholder="9876543210"
        className="h-12"
      />

      <div className="rounded-control border border-black/10 bg-surface-muted p-lg">
        <h2 className="text-[14px] font-medium">Business proof</h2>
        <p className="mt-xs text-[12px] text-ink-muted">
          Format checks only. We show &quot;Submitted for review&quot;, never
          &quot;verified&quot;.
        </p>

        <div className="mt-md grid gap-lg">
          {category === "food" ? (
            <>
              <Input
                label="FSSAI licence number"
                name="fssai"
                inputMode="numeric"
                value={values.fssai}
                onChange={(event) => onChange({ fssai: event.target.value })}
                error={errors.fssai}
                hint="Exactly 14 digits."
                className="h-12"
              />
              <Input
                label="Number of tables"
                name="declared_tables"
                inputMode="numeric"
                value={values.declaredTables}
                onChange={(event) =>
                  onChange({ declaredTables: event.target.value })
                }
                error={errors.declared_tables}
                hint="Whole number, 1 to 200."
                className="h-12"
              />
            </>
          ) : category === "hotel" ? (
            <>
              <Input
                label="Number of rooms"
                name="declared_rooms"
                inputMode="numeric"
                value={values.declaredRooms}
                onChange={(event) =>
                  onChange({ declaredRooms: event.target.value })
                }
                error={errors.declared_rooms}
                hint="Whole number, 1 to 500."
                className="h-12"
              />
              <Select
                label="Registration type"
                name="registration_type"
                value={values.registrationType}
                onChange={(event) =>
                  onChange({
                    registrationType: event.target
                      .value as BusinessDetailsValues["registrationType"],
                  })
                }
                error={errors.registration}
                hint="Add ONE of the two. A local licence is your trade or tourism licence."
                className="h-12"
              >
                <option value="">Select a registration</option>
                <option value="gstin">GSTIN</option>
                <option value="licence">Local trade or tourism licence</option>
              </Select>
              <Input
                label={registrationLabel}
                name="registration_number"
                value={values.registrationNumber}
                onChange={(event) =>
                  onChange({ registrationNumber: event.target.value })
                }
                error={errors.registration}
                hint={
                  values.registrationType === "licence"
                    ? "5 to 30 letters, digits, - or /."
                    : "15 characters, capital letters. Example 27AAPFU0939F1ZV."
                }
                className="h-12"
              />
            </>
          ) : (
            <Input
              label="GSTIN (optional)"
              name="gstin"
              value={values.gstin}
              onChange={(event) => onChange({ gstin: event.target.value })}
              error={errors.gstin}
              hint="Not required for your category. If you add one it must be valid."
              className="h-12"
            />
          )}
        </div>
      </div>

      {/* Honeypot (G8). Visually hidden, never focusable, never announced. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.companyWebsite}
          onChange={(event) => onChange({ companyWebsite: event.target.value })}
        />
      </div>
    </div>
  );
}

/**
 * The onboarding gates G4 to G8.
 *
 * These are FORMAT checks only. The mock (and the later server) cannot verify a
 * number with a government service, so nothing here ever says "verified"; the
 * UI says "Submitted for review" (`verification_status = pending`).
 */

import { validateGoogleReviewUrl } from "@/lib/validation";
import { normalizeCategory } from "./features";
import {
  TYPES_BY_CATEGORY,
  type BusinessCategory,
  type CategoryBusinessType,
} from "./types";

export type FieldCheck =
  | { ok: true }
  | { ok: false; code: string; message: string };

const ok: FieldCheck = { ok: true };

function fail(code: string, message: string): FieldCheck {
  return { ok: false, code, message };
}

/** Whole names that are never accepted, however they are capitalised. */
const BLOCKED_NAMES = new Set([
  "test",
  "demo",
  "asdf",
  "qwerty",
  "fake",
  "sample",
  "abc",
  "xyz",
]);

/**
 * True when the whole name is a known placeholder or a single repeated
 * character (`aaaa`). A name that merely contains "Test" (`Test Kitchen`) is
 * fine.
 */
export function looksFakeName(value: string): boolean {
  const trimmed = value.trim();
  if (BLOCKED_NAMES.has(trimmed.toLowerCase())) return true;
  const compact = trimmed.replace(/\s+/g, "");
  return compact.length > 0 && /^(.)\1*$/u.test(compact);
}

/** Name: 2 to 100 characters, at least 2 letters, not a placeholder. */
export function validateBusinessName(value: unknown): FieldCheck {
  if (typeof value !== "string") return fail("name_required", "Enter your business name.");
  const name = value.trim();
  if (name.length < 2) return fail("name_short", "Use at least 2 characters.");
  if (name.length > 100) return fail("name_long", "Keep the name under 100 characters.");
  const letters = name.match(/\p{L}/gu) ?? [];
  if (letters.length < 2) {
    return fail("name_needs_letters", "Use at least 2 letters, not only digits or symbols.");
  }
  if (looksFakeName(name)) {
    return fail("name_fake", "Enter your real business name, not a test word.");
  }
  return ok;
}

export function validateAddressLine(value: unknown): FieldCheck {
  if (typeof value !== "string") return fail("address_required", "Enter your street address.");
  const address = value.trim();
  if (address.length < 5) return fail("address_short", "Use at least 5 characters.");
  if (address.length > 120) return fail("address_long", "Keep the address under 120 characters.");
  return ok;
}

export function validateCity(value: unknown): FieldCheck {
  if (typeof value !== "string") return fail("city_required", "Enter your city.");
  const city = value.trim();
  if (city.length < 2) return fail("city_short", "Use at least 2 characters.");
  if (city.length > 60) return fail("city_long", "Keep the city under 60 characters.");
  return ok;
}

/** PIN code: 6 digits, never starting with 0. */
export function validatePincode(value: unknown): FieldCheck {
  if (typeof value !== "string" || !/^[1-9][0-9]{5}$/.test(value.trim())) {
    return fail("pincode_invalid", "Enter a 6 digit PIN code.");
  }
  return ok;
}

/** Business phone: a 10 digit Indian mobile starting 6 to 9. */
export function validatePhone(value: unknown): FieldCheck {
  if (typeof value !== "string" || !/^[6-9][0-9]{9}$/.test(value.trim())) {
    return fail("phone_invalid", "Enter a 10 digit mobile number starting with 6, 7, 8 or 9.");
  }
  return ok;
}

/** FSSAI licence: exactly 14 digits. */
export function validateFssai(value: unknown): FieldCheck {
  if (typeof value !== "string" || !/^[0-9]{14}$/.test(value.trim())) {
    return fail("fssai_invalid", "The FSSAI number is exactly 14 digits.");
  }
  return ok;
}

/** GSTIN: 15 characters, uppercase, ending in Z plus one digit or letter. */
export function validateGstin(value: unknown): FieldCheck {
  if (
    typeof value !== "string" ||
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim())
  ) {
    return fail("gstin_invalid", "Enter a valid 15 character GSTIN in capital letters.");
  }
  return ok;
}

/** A local trade or tourism licence: 5 to 30 letters, digits, `-` or `/`. */
export function validateLicence(value: unknown): FieldCheck {
  if (typeof value !== "string" || !/^[A-Za-z0-9\-/]{5,30}$/.test(value.trim())) {
    return fail("licence_invalid", "Use 5 to 30 letters, digits, - or /.");
  }
  return ok;
}

/** Declared tables (food) or rooms (hotel): a whole number inside the range. */
export function validateDeclaredUnits(
  kind: "tables" | "rooms",
  value: unknown,
): FieldCheck {
  const max = kind === "tables" ? 200 : 500;
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !/^[0-9]+$/.test(raw.trim())) {
    return fail(
      kind === "tables" ? "tables_invalid" : "rooms_invalid",
      `Enter a whole number from 1 to ${max}.`,
    );
  }
  const number = Number.parseInt(raw.trim(), 10);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    return fail(
      kind === "tables" ? "tables_invalid" : "rooms_invalid",
      `Enter a whole number from 1 to ${max}.`,
    );
  }
  return ok;
}

export type OnboardingInput = {
  category: unknown;
  business_name: string;
  business_type: string;
  address_line: string;
  city: string;
  pincode: string;
  phone: string;
  google_review_url: string;
  fssai?: string;
  declared_tables?: string | number;
  declared_rooms?: string | number;
  registration_type?: string;
  registration_number?: string;
  gstin?: string;
  company_website?: string;
};

export type OnboardingErrors = Record<string, string>;

const GENERIC_ERROR = "Something went wrong. Try again.";

function categoryTypes(category: BusinessCategory): readonly CategoryBusinessType[] {
  return TYPES_BY_CATEGORY[category];
}

/**
 * Run every onboarding gate that can be checked locally (G2 is the popup and
 * runs before this; G1 is the verified email). Returns the field errors, or an
 * empty object when the submission passes.
 */
export function validateOnboarding(input: OnboardingInput): {
  ok: boolean;
  errors: OnboardingErrors;
} {
  // G8: a filled hidden field is never explained, it only fails generically.
  if (
    typeof input.company_website === "string" &&
    input.company_website.trim().length > 0
  ) {
    return { ok: false, errors: { form: GENERIC_ERROR } };
  }

  const errors: OnboardingErrors = {};
  const category = normalizeCategory(input.category);

  const name = validateBusinessName(input.business_name);
  if (!name.ok) errors.business_name = name.message;

  if (
    typeof input.business_type !== "string" ||
    !(categoryTypes(category) as readonly string[]).includes(input.business_type)
  ) {
    errors.business_type = "Choose a business type from your category.";
  }

  const address = validateAddressLine(input.address_line);
  if (!address.ok) errors.address_line = address.message;

  const city = validateCity(input.city);
  if (!city.ok) errors.city = city.message;

  const pincode = validatePincode(input.pincode);
  if (!pincode.ok) errors.pincode = pincode.message;

  const phone = validatePhone(input.phone);
  if (!phone.ok) errors.phone = phone.message;

  // G6: the same Google-host allowlist as the rest of the app.
  if (!input.google_review_url.trim()) {
    errors.google_review_url = "Add your Google review link.";
  } else {
    const urlError = validateGoogleReviewUrl(input.google_review_url);
    if (urlError) errors.google_review_url = urlError;
  }

  // G5: a proof number by category.
  if (category === "food") {
    const fssai = validateFssai(input.fssai);
    if (!fssai.ok) errors.fssai = fssai.message;
    const tables = validateDeclaredUnits("tables", input.declared_tables);
    if (!tables.ok) errors.declared_tables = tables.message;
  } else if (category === "hotel") {
    const rooms = validateDeclaredUnits("rooms", input.declared_rooms);
    if (!rooms.ok) errors.declared_rooms = rooms.message;

    const registrationType =
      input.registration_type === "gstin" || input.registration_type === "licence"
        ? input.registration_type
        : input.gstin?.trim()
          ? "gstin"
          : "";
    if (!registrationType) {
      errors.registration =
        "Add your GSTIN or a local trade or tourism licence number.";
    } else if (registrationType === "gstin") {
      const gstin = validateGstin(input.registration_number || input.gstin);
      if (!gstin.ok) errors.registration = gstin.message;
    } else {
      const licence = validateLicence(input.registration_number);
      if (!licence.ok) errors.registration = licence.message;
    }
  } else if (input.gstin?.trim()) {
    // General businesses may add a GSTIN, but it is not required.
    const gstin = validateGstin(input.gstin);
    if (!gstin.ok) errors.gstin = gstin.message;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

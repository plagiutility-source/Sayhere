/**
 * Auto-reply support request form rules — PRD.md 5.4.3 (v1). Pure functions,
 * one place, hand-written so Stage 3 can mirror them as the shared zod schema
 * on the submit route (same pattern as lib/validation/page-config.ts). No zod
 * here (loop rule: no new packages).
 *
 * All five fields are required; the two text limits are the PRD's own
 * ("Your name 2 to 80", "Business name 2 to 100"). Email/phone reuse the
 * shared rules — phone is the exact Call/WhatsApp rule (7 to 15 digits,
 * optional leading +).
 */

import {
  EMAIL_FORMAT_MESSAGE,
  isValidEmail,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
} from "@/lib/validation";
import { phoneError } from "@/lib/validation/page-config";

/** PRD.md 5.4.3: your name 2 to 80 characters. */
export const MIN_AUTO_REPLY_NAME_LENGTH = 2;
export const MAX_AUTO_REPLY_OWNER_NAME_LENGTH = 80;

export type AutoReplyRequestFields = {
  owner_name: string;
  business_name: string;
  google_account_email: string;
  phone: string;
};

export type AutoReplyRequestErrors = Partial<
  Record<keyof AutoReplyRequestFields, string>
>;

/** Inline errors for the request form; empty object = ready to send. */
export function validateAutoReplyRequest(
  fields: AutoReplyRequestFields,
): AutoReplyRequestErrors {
  const errors: AutoReplyRequestErrors = {};

  const ownerName = fields.owner_name.trim();
  if (ownerName.length < MIN_AUTO_REPLY_NAME_LENGTH) {
    errors.owner_name = `Enter your name (${MIN_AUTO_REPLY_NAME_LENGTH} to ${MAX_AUTO_REPLY_OWNER_NAME_LENGTH} characters).`;
  } else if (ownerName.length > MAX_AUTO_REPLY_OWNER_NAME_LENGTH) {
    errors.owner_name = `Keep your name under ${MAX_AUTO_REPLY_OWNER_NAME_LENGTH} characters.`;
  }

  const businessName = fields.business_name.trim();
  if (businessName.length < MIN_AUTO_REPLY_NAME_LENGTH) {
    errors.business_name = `Enter your business name (${MIN_AUTO_REPLY_NAME_LENGTH} to ${MAX_BUSINESS_NAME_LENGTH} characters).`;
  } else if (businessName.length > MAX_BUSINESS_NAME_LENGTH) {
    errors.business_name = `Keep the business name under ${MAX_BUSINESS_NAME_LENGTH} characters.`;
  }

  const email = fields.google_account_email.trim();
  if (!email) {
    errors.google_account_email = "Enter the Google account email.";
  } else if (email.length > MAX_EMAIL_LENGTH) {
    errors.google_account_email = `Keep the email under ${MAX_EMAIL_LENGTH} characters.`;
  } else if (!isValidEmail(email)) {
    errors.google_account_email = EMAIL_FORMAT_MESSAGE;
  }

  const phone = fields.phone.trim();
  if (!phone) {
    errors.phone = "Enter your phone number.";
  } else {
    // Same rule as Call and WhatsApp (PRD.md 5.4.3).
    const phoneIssue = phoneError(phone);
    if (phoneIssue) errors.phone = phoneIssue;
  }

  return errors;
}

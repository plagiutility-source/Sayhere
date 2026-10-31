/**
 * AI dish photo rules that do NOT depend on mock or real storage (pure
 * functions, no React, no browser APIs) — see AI_MENU_PHOTOS.md.
 *
 * Stage 1 uses these with the mock credit store (`lib/mock/ai-images.ts`).
 * Stage 4 reuses the same constants and prompt builder on the server route,
 * so the rules cannot drift between the mock and the real thing.
 */

import { stripUnsafeText } from "@/lib/customer-page";

/**
 * Hard ceilings that apply to EVERY plan, on top of the plan allowance. They
 * exist so a bug, a script or one unhappy owner can never burn the budget even
 * on a plan with credits left (AI_MENU_PHOTOS.md section 4).
 */
export const AI_IMAGE_DAILY_CAP = 10; // per business, per day
export const AI_IMAGE_COOLDOWN_MS = 3_000; // between two generations

/** Why a generation was refused BEFORE any provider call (no credit is used). */
export type AiImageBlockReason =
  | "no_credits"
  | "daily_cap"
  | "cooldown"
  | "needs_name";

export function aiImageBlockMessage(reason: AiImageBlockReason): string {
  switch (reason) {
    case "no_credits":
      return "You have used all your AI photos on this plan.";
    case "daily_cap":
      return `You can make up to ${AI_IMAGE_DAILY_CAP} AI photos a day. Try again tomorrow.`;
    case "cooldown":
      return "One moment, then try again.";
    case "needs_name":
      return "Enter an item name first, so the photo matches the dish.";
  }
}

/** Why a generation that DID start failed. The credit is refunded. */
export const AI_IMAGE_FAILURE_MESSAGE =
  "The photo could not be made this time. Your credit was refunded. Try again in a moment.";

/** Longest dish text sent to the image model (matches the menu field limits). */
const PROMPT_NAME_MAX = 60;
const PROMPT_DETAILS_MAX = 160;

/** Letters, digits, spaces and a few harmless marks only. */
function promptSafe(input: string, max: number): string {
  return stripUnsafeText(input)
    .replace(/[^\p{L}\p{N} .,'&()%/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * The ONLY prompt that ever reaches the image model. The owner never writes a
 * prompt: only the dish name and "what's in it" are used, cleaned of anything
 * that could act as an instruction, inside a fixed professional food-photo
 * style. Returns `null` when the item has no usable name.
 */
export function buildMenuImagePrompt(
  name: string,
  details: string,
): string | null {
  const safeName = promptSafe(name, PROMPT_NAME_MAX);
  if (!safeName) return null;
  const safeDetails = promptSafe(details, PROMPT_DETAILS_MAX);
  const dish = safeDetails ? `${safeName} (${safeDetails})` : safeName;
  return (
    `Professional food photograph of ${dish}. ` +
    "Plated neatly on a clean plate or in suitable serveware, shot from a slightly " +
    "raised angle, soft natural window light, shallow depth of field, appetizing " +
    "and realistic, portrait orientation 2:3. " +
    "No text, no logos, no watermarks, no people, no hands."
  );
}

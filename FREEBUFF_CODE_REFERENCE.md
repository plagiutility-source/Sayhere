# AI Dish Photos for Menu Items: complete code reference

> **Historical snapshot (2026-10-14).** This file preserves the original AI-photo build
> instructions and code. The live, maintained specs are `AI_MENU_PHOTOS.md`,
> `security-and-reliability.md` and `schema.sql`; where they differ, the live documents win.
> In particular, menu PDF imports now reserve photos as one batch (`ai_image_jobs.batch_id`)
> and upload the PDF directly to private R2 storage; the “No batch” and “Other file uploads:
> None” lines below are superseded.

Everything needed to add this feature to the repo, from start to end. This is **Phase 1**: the full
UI, plan limits, credit rules, schema and docs, with a **mock** image provider (drawn placeholder
pictures, credits kept in the browser). No AI service is called and no keys are needed.

Built and verified against the original `Review-SaaS-main` (Next.js 15, React 19, TypeScript,
Tailwind). On a fresh copy of that project both patches apply cleanly, `npx tsc --noEmit` passes and
`npm run build` passes. A headless-browser run also passed (generate and approve, refund on
failure, cooldown, out-of-credits, save, customer thumbnail and full-screen viewer at phone and
desktop size, tampered data rejected, no console errors).

## What the feature does

- **Owner:** each menu item gets **Add photo / Change photo / Remove photo**. A dialog makes a photo
  from the item name and "What's in it". The owner previews it and chooses **Use this photo**,
  **Make another** or **Discard**. Nothing is attached until approved.
- **Customer:** items with a photo show a 72 px thumbnail. Tapping it opens the photo full screen:
  **Fit** (whole photo, default) or **Fill screen** (covers the whole phone). The page labels the photos
  "AI-generated, for illustration".
- **Cost protection:** per-plan credits (Free 3 one-time, Starter 15/month, Pro 40/month, Enterprise
  100/month, never unlimited), 10 per day cap on every plan, 3 s cooldown, a credit is reserved
  before generating and refunded if generation fails, the dialog cannot be closed mid-generation, and
  the owner never writes the prompt.

## Files

New code files (5):

- `components/customer-page/photo-viewer.tsx`
- `components/dashboard/menu-photo-dialog.tsx`
- `components/menu-photo.tsx`
- `lib/ai-images.ts`
- `lib/mock/ai-images.ts`

Modified code files (15):

- `app/pricing/page.tsx`
- `components/customer-page/icons.tsx`
- `components/customer-page/menu-screen.tsx`
- `components/dashboard/billing-content.tsx`
- `components/dashboard/customer-page-editor.tsx`
- `components/dashboard/customer-page-items.tsx`
- `components/dashboard/customer-page-preview.tsx`
- `components/dashboard/icons.tsx`
- `components/dashboard/menu-and-hours.tsx`
- `env.example.txt`
- `lib/mock/customer-page.ts`
- `lib/mock/plans.ts`
- `lib/mock/store.ts`
- `lib/validation/page-config.ts`
- `schema.sql`

Docs (new: `AI_MENU_PHOTOS.md`; edited: `PRD.md`, `PROGRESS.md`, `business-rules.md`, `customer-page-ui-spec.md`, `security-and-reliability.md`):


## How to add it

**Option A (recommended): apply the two patches.** Put `ai-menu-photos-code.patch` and
`ai-menu-photos-docs.patch` in the repo root, then:

~~~~~bash
git checkout -b feat/ai-menu-photos
git apply --check ai-menu-photos-code.patch && git apply ai-menu-photos-code.patch
git apply --check ai-menu-photos-docs.patch && git apply ai-menu-photos-docs.patch
npm ci
npx tsc --noEmit        # must print nothing
npm run build           # must succeed
~~~~~

If `git apply --check` fails because your repo changed after the zip was made, try
`git apply --3way <patch>`, or use Option B for the files that fail.

**Option B: by hand.** For every "New file" below, create the file with exactly that content. For every
"Modified file", apply the diff (lines starting with `+` are added, `-` removed). Then run the same
`tsc` and `build` commands. Section "Order to apply" gives a safe order.

## Order to apply (Option B)

1. `lib/mock/plans.ts`, `components/dashboard/billing-content.tsx`, `app/pricing/page.tsx`
2. `lib/mock/customer-page.ts`, `lib/validation/page-config.ts`, `lib/mock/store.ts`
3. NEW `lib/ai-images.ts`, NEW `lib/mock/ai-images.ts`
4. NEW `components/menu-photo.tsx`
5. `components/dashboard/icons.tsx`, NEW `components/dashboard/menu-photo-dialog.tsx`,
   `components/dashboard/menu-and-hours.tsx`, `components/dashboard/customer-page-items.tsx`,
   `components/dashboard/customer-page-editor.tsx`
6. `components/customer-page/icons.tsx`, NEW `components/customer-page/photo-viewer.tsx`,
   `components/customer-page/menu-screen.tsx`, `components/dashboard/customer-page-preview.tsx`
7. `schema.sql`, `env.example.txt`
8. Docs (all `.md` files)

Run `npx tsc --noEmit` after each numbered group. It should print nothing.

## Manual test (5 minutes)

1. `npm run dev`, open `/customer-page?demo=free`.
2. Menu > Activate > Add category > Add item, name it "Butter chicken".
3. Add photo > Make photo. Wait ~2 s. Use this photo. The counter shows "AI photos 2 / 3 left (trial)".
4. Rename another item "Cold brew (fail)" > Add photo > Make photo: you see the failure message and the
   counter is unchanged (refund).
5. Press Make another twice quickly: the second press shows "One moment, then try again." and spends nothing.
6. Use all 3 credits: the Make photo button disappears and a "See plans" link appears.
7. Save. Open `/r/cafe01` > Menu: the thumbnail shows with the AI note. Tap it: full screen. Try
   **Fill screen**, **Fit**, the X button and Escape.
8. `?demo=pro` shows 40 credits. The pricing page and Billing show an "AI dish photos" row.

## Not in this phase (do not build yet)

Real image provider, server-side credits, R2 storage, rate limits (Upstash), admin spend view,
privacy and terms update. The plan and launch gates are in `AI_MENU_PHOTOS.md` sections 4 to 11.

---

# NEW FILES (full content)


## New file: `components/customer-page/photo-viewer.tsx`

~~~~~tsx
"use client";

/**
 * Full-screen dish photo (AI_MENU_PHOTOS.md section 3). Opens when a customer
 * taps a menu thumbnail and covers the whole phone screen.
 *
 *  - "Fit" (default) shows the whole photo, nothing cropped, on black.
 *  - "Fill screen" covers the entire screen, cropping the edges a little.
 *  - Close button, Escape key, and focus handling are built in; the page
 *    behind does not scroll while the photo is open.
 *  - The photo is always labelled as AI-generated, so customers are not
 *    misled about the real dish.
 *
 * `fixed inset-0` covers the real page; inside the dashboard preview the
 * phone frame has a transform, which keeps this overlay inside the frame.
 */

import { useEffect, useRef, useState } from "react";
import { MenuPhoto } from "@/components/menu-photo";
import type { MenuImage } from "@/lib/mock/customer-page";
import { CloseIcon } from "./icons";

export function PhotoViewer({
  name,
  price,
  details,
  image,
  onClose,
}: {
  name: string;
  price: string;
  details: string;
  image: MenuImage;
  onClose: () => void;
}) {
  const [fill, setFill] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables =
        panelRef.current?.querySelectorAll<HTMLElement>("button") ?? [];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo of ${name}`}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      <div
        className={
          fill ? "absolute inset-0" : "relative min-h-0 flex-1"
        }
      >
        <MenuPhoto
          image={image}
          name={name}
          fit={fill ? "cover" : "contain"}
        />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-md">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon size={22} />
        </button>
        <button
          type="button"
          onClick={() => setFill((current) => !current)}
          aria-pressed={fill}
          className="inline-flex h-11 items-center rounded-pill bg-black/60 px-lg text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {fill ? "Fit" : "Fill screen"}
        </button>
      </div>

      <div
        className={`px-lg pb-lg pt-md ${
          fill ? "absolute inset-x-0 bottom-0 bg-black/65" : "flex-none bg-black"
        }`}
      >
        <div className="flex items-baseline justify-between gap-md">
          <p className="text-[17px] font-medium">{name}</p>
          {price ? (
            <p className="shrink-0 text-[15px] tabular-nums">{price}</p>
          ) : null}
        </div>
        {details ? (
          <p className="mt-xs text-[13px] text-white/80">{details}</p>
        ) : null}
        <p className="mt-sm text-[11px] text-white/80">
          AI-generated image, for illustration
        </p>
      </div>
    </div>
  );
}
~~~~~


## New file: `components/dashboard/menu-photo-dialog.tsx`

~~~~~tsx
"use client";

/**
 * The owner's "Photo for <dish>" dialog (AI_MENU_PHOTOS.md section 3).
 *
 * Flow: idle -> loading -> preview -> (Use this photo | Make another | Discard).
 * A photo is only attached to the menu item after the owner approves it.
 *
 * Money rules shown here (the real enforcement is server-side in Stage 4):
 *  - one credit is RESERVED before generation and REFUNDED if it fails;
 *  - "Make another" and "Discard" keep the credit used (the work was done);
 *  - the dialog cannot be closed while a photo is being made, so a credit is
 *    never spent on a result nobody sees;
 *  - the owner never types a prompt, the dish name and details are the input.
 *
 * Stage 1 uses the mock provider (`lib/mock/ai-images.ts`); Stage 4 swaps it
 * for POST /api/menu-photos/generate without changing this component's props.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { MenuPhoto } from "@/components/menu-photo";
import { Spinner } from "@/components/spinner";
import {
  AI_IMAGE_FAILURE_MESSAGE,
  aiImageBlockMessage,
  buildMenuImagePrompt,
} from "@/lib/ai-images";
import {
  AiImageError,
  mockGenerateMenuImage,
  refundAiImage,
  reserveAiImage,
  type AiImageUsage,
} from "@/lib/mock/ai-images";
import type { MenuImage } from "@/lib/mock/customer-page";
import type { AiImageAllowance } from "@/lib/mock/plans";
import { Modal } from "./modal";

type Phase = "idle" | "loading" | "preview" | "error";

export function MenuPhotoDialog({
  open,
  itemName,
  itemDetails,
  currentImage,
  allowance,
  usage,
  planName,
  onUsageChange,
  onApply,
  onClose,
}: {
  open: boolean;
  itemName: string;
  itemDetails: string;
  /** The photo the item has now (shown while idle), if any. */
  currentImage: MenuImage | null;
  allowance: AiImageAllowance;
  /** `null` until the browser has read the mock ledger. */
  usage: AiImageUsage | null;
  planName: string;
  /** Called after the ledger changed so the editor re-reads its counter. */
  onUsageChange: () => void;
  onApply: (image: MenuImage) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState<MenuImage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Identifies the running job, so a result that arrives after the dialog was
  // reset can never be shown or applied.
  const job = useRef(0);

  useEffect(() => {
    if (!open) return;
    job.current += 1;
    setPhase("idle");
    setDraft(null);
    setMessage(null);
  }, [open]);

  const remaining = usage?.remaining ?? 0;
  const usageKnown = usage !== null;
  const outOfCredits = usageKnown && remaining === 0;

  const generate = useCallback(async () => {
    if (!buildMenuImagePrompt(itemName, itemDetails)) {
      setMessage(aiImageBlockMessage("needs_name"));
      return;
    }
    const reserved = reserveAiImage(allowance);
    onUsageChange();
    if (!reserved.ok) {
      // Refused before any provider call: nothing was spent.
      setMessage(aiImageBlockMessage(reserved.reason));
      setPhase(draft ? "preview" : "idle");
      return;
    }
    const mine = ++job.current;
    setMessage(null);
    setPhase("loading");
    try {
      const image = await mockGenerateMenuImage({
        name: itemName,
        details: itemDetails,
        avoidVariant: (draft ?? currentImage)?.variant,
      });
      if (mine !== job.current) return;
      setDraft(image);
      setPhase("preview");
    } catch (error) {
      // The provider failed: give the credit back.
      refundAiImage(reserved.ticket);
      onUsageChange();
      if (mine !== job.current) return;
      setMessage(
        error instanceof AiImageError ? error.message : AI_IMAGE_FAILURE_MESSAGE,
      );
      setPhase("error");
    }
  }, [allowance, currentImage, draft, itemDetails, itemName, onUsageChange]);

  const handleClose = useCallback(() => {
    if (phase === "loading") return; // never abandon a paid generation
    job.current += 1;
    // Reset now, so the next time the dialog opens it starts clean.
    setPhase("idle");
    setDraft(null);
    setMessage(null);
    onClose();
  }, [onClose, phase]);

  const counter = usageKnown ? (
    <p className="text-[12px] text-ink-muted">
      {remaining} of {usage.limit} AI photos left
      {usage.period === "lifetime" ? " (one-time trial)" : " this month"}.
    </p>
  ) : null;

  let footer = null;
  if (phase === "idle") {
    footer = (
      <>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        {outOfCredits ? null : (
          <Button onClick={generate}>Make photo</Button>
        )}
      </>
    );
  } else if (phase === "preview" && draft) {
    footer = (
      <>
        <Button variant="secondary" onClick={handleClose}>
          Discard
        </Button>
        <Button variant="secondary" onClick={generate}>
          Make another
        </Button>
        <Button
          onClick={() => {
            job.current += 1;
            onApply(draft);
            setPhase("idle");
            setDraft(null);
            setMessage(null);
          }}
        >
          Use this photo
        </Button>
      </>
    );
  } else if (phase === "error") {
    footer = (
      <>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={generate}>Try again</Button>
      </>
    );
  }

  const preview = phase === "preview" ? draft : phase === "idle" ? currentImage : null;

  return (
    <Modal
      open={open}
      title={`Photo for ${itemName.trim() || "this item"}`}
      onClose={handleClose}
      footer={footer}
    >
      <div className="flex flex-col gap-3">
        {phase === "loading" ? (
          <div
            role="status"
            className="flex h-[270px] flex-col items-center justify-center gap-3 rounded-card bg-surface-muted text-[13px] text-ink-muted"
          >
            <Spinner className="h-6 w-6 text-brand-blue" />
            <span>Making your photo. This takes a few seconds.</span>
          </div>
        ) : preview ? (
          <>
            <div className="mx-auto h-[270px] w-[180px] overflow-hidden rounded-card border border-black/10">
              <MenuPhoto image={preview} name={itemName} />
            </div>
            <p className="text-center text-[12px] text-ink-muted">
              {phase === "preview"
                ? "Customers see this photo with a small “AI-generated” label."
                : "Current photo"}
            </p>
          </>
        ) : null}

        {phase === "idle" && !outOfCredits ? (
          <p className="text-[13px] text-ink">
            We make a professional photo from the item name and “What’s in it”.
            You see it first and choose whether to use it.
          </p>
        ) : null}

        {outOfCredits && phase !== "loading" ? (
          <div className="rounded-control border border-black/10 bg-surface-muted p-3 text-[13px] text-ink">
            <p>You have used all AI photos on the {planName} plan.</p>
            <p className="mt-1 text-ink-muted">
              {allowance.period === "lifetime"
                ? "Upgrade to get new AI photos every month."
                : "They refill when your next billing month starts."}{" "}
              <Link
                href="/billing"
                className="font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                See plans
              </Link>
            </p>
          </div>
        ) : null}

        {message ? (
          <p role="alert" className="text-[13px] font-medium text-red-700">
            {message}
          </p>
        ) : null}

        {phase !== "loading" ? counter : null}
      </div>
    </Modal>
  );
}
~~~~~


## New file: `components/menu-photo.tsx`

~~~~~tsx
/**
 * A dish photo, drawn.  MOCK ONLY, replaced in Stage 4.
 *
 * Stage 1 has no image provider or storage, so the "AI photo" is a flat
 * illustration picked by the item name (drink / flat bread / bowl) and the
 * image `variant` (three plating palettes). It is portrait 2:3 on purpose:
 * the real generated photos are 2:3 too, so the thumbnail crop and the
 * full-screen viewer behave exactly as they will with real images.
 *
 * Stage 4: this component keeps its props but renders
 * `<img src={R2_PUBLIC_DOMAIN + image.key} width={1080} height={1620} alt=...>`
 * (thumbnail and full-size files), served from the fixed R2 domain only.
 */

import type { MenuImage } from "@/lib/mock/customer-page";

type Kind = "drink" | "flat" | "bowl";

const DRINK = /coffee|brew|latte|tea|chai|juice|shake|smoothie|lassi|soda|mocktail|mojito|cola|water/i;
const FLAT = /pizza|burger|dosa|roti|naan|paratha|sandwich|wrap|toast|cake|pastry|waffle|pancake|bread|uttapam/i;

function kindFor(name: string): Kind {
  if (DRINK.test(name)) return "drink";
  if (FLAT.test(name)) return "flat";
  return "bowl";
}

const SCENES = [
  { bg: "#2B2420", table: "#3A2F29", plate: "#E7DFD2", inner: "#F6F1E8" },
  { bg: "#1F2A2E", table: "#2B3A3F", plate: "#E1E5E4", inner: "#F2F5F4" },
  { bg: "#3A2326", table: "#4A2E32", plate: "#EDE0D2", inner: "#FAF1E6" },
] as const;

const FOOD: Record<Kind, readonly [string, string, string]> = {
  bowl: ["#C8501E", "#B03A2E", "#D68910"],
  flat: ["#E0A04B", "#D4883A", "#C9A06C"],
  drink: ["#5B3A29", "#8B5A3C", "#3D5A4A"],
};

export function MenuPhoto({
  image,
  name,
  fit = "cover",
  className = "h-full w-full",
}: {
  image: MenuImage;
  name: string;
  /** `cover` fills the box (thumbnails, Fill screen); `contain` shows it all. */
  fit?: "cover" | "contain";
  className?: string;
}) {
  const scene = SCENES[image.variant % SCENES.length];
  const kind = kindFor(name);
  const food = FOOD[kind][image.variant % 3];
  const accent = FOOD[kind][(image.variant + 1) % 3];

  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label={`Photo of ${name}`}
      className={`block ${className}`}
    >
      <rect width="100" height="150" fill={scene.bg} />
      <rect y="36" width="100" height="114" fill={scene.table} />

      {kind !== "drink" ? (
        <>
          <circle cx="50" cy="80" r="41" fill={scene.plate} />
          <circle cx="50" cy="80" r="35" fill={scene.inner} />
        </>
      ) : (
        <>
          <ellipse cx="50" cy="118" rx="26" ry="5" fill="#000" opacity="0.3" />
          <circle cx="50" cy="114" r="20" fill={scene.plate} />
        </>
      )}

      {kind === "bowl" ? (
        <>
          <circle cx="50" cy="80" r="25" fill={food} stroke={accent} strokeWidth="2" />
          <circle cx="42" cy="73" r="5" fill={accent} />
          <circle cx="58" cy="77" r="5" fill={accent} />
          <circle cx="49" cy="89" r="5" fill={accent} />
          <circle cx="40" cy="84" r="4" fill={accent} />
          <path d="M36 76 Q50 63 64 76" stroke="#FAEEDA" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="47" cy="68" r="1.8" fill="#5E9A2E" />
          <circle cx="56" cy="83" r="1.8" fill="#5E9A2E" />
          <circle cx="44" cy="81" r="1.8" fill="#5E9A2E" />
        </>
      ) : null}

      {kind === "flat" ? (
        <>
          <g transform="rotate(-20 50 80)">
            <ellipse cx="50" cy="80" rx="31" ry="13" fill={food} stroke={accent} strokeWidth="1.5" />
            <path d="M24 80 H76 M29 74 H71 M29 86 H71" stroke={accent} strokeWidth="1" opacity="0.6" />
            <ellipse cx="48" cy="80" rx="10" ry="4.5" fill="#FAC775" />
          </g>
          <circle cx="29" cy="102" r="6" fill="#F5C4B3" />
          <circle cx="72" cy="58" r="6" fill="#97C459" />
        </>
      ) : null}

      {kind === "drink" ? (
        <>
          <path d="M34 44 H66 L63 112 Q50 116 37 112 Z" fill={food} stroke="#E6F1FB" strokeWidth="1" />
          <path d="M34 44 H66 L65.5 58 H34.5 Z" fill="#E6F1FB" opacity="0.18" />
          <rect x="38" y="60" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <rect x="50" y="72" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <rect x="38" y="86" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <path d="M58 26 L54 104" stroke="#FAC775" strokeWidth="3" strokeLinecap="round" />
          <circle cx="70" cy="46" r="3" fill={accent} />
        </>
      ) : null}
    </svg>
  );
}
~~~~~


## New file: `lib/ai-images.ts`

~~~~~ts
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
~~~~~


## New file: `lib/mock/ai-images.ts`

~~~~~ts
/**
 * MOCK ONLY, replaced in Stage 4 by the server routes in AI_MENU_PHOTOS.md.
 *
 * Stage 1 has no backend, so the AI photo "provider" and the credit ledger are
 * simulated in the browser. The behaviour mirrors the real design on purpose:
 *
 *  - a credit is RESERVED before generation starts and REFUNDED if it fails;
 *  - a plan allowance, a daily hard cap and a cooldown all apply;
 *  - the result is a draft the owner must approve before it is saved.
 *
 * Nothing here calls any AI service and nothing leaves the browser. A dish
 * whose name contains "(fail)" simulates a provider failure so the refund path
 * can be tried by hand. Stored values are never trusted: they are parsed in a
 * try/catch and every field is range-checked.
 *
 * In Stage 4 the counters become columns on `businesses` (+ `ai_image_jobs`),
 * and `reserve` becomes ONE conditional UPDATE so two parallel requests can
 * never spend the same credit (schema.sql, AI_MENU_PHOTOS.md section 5).
 */

import {
  AI_IMAGE_COOLDOWN_MS,
  AI_IMAGE_DAILY_CAP,
  AI_IMAGE_FAILURE_MESSAGE,
  buildMenuImagePrompt,
  type AiImageBlockReason,
} from "@/lib/ai-images";
import type { MenuImage } from "@/lib/mock/customer-page";
import type { AiImageAllowance } from "@/lib/mock/plans";
import { MENU_IMAGE_VARIANTS } from "@/lib/validation/page-config";

/** One versioned key for the mock ledger; bump on shape changes. */
export const AI_IMAGE_STORAGE_KEY = "syehere.mock.ai-images.v1";

/** How long the simulated provider takes. */
const MOCK_GENERATION_MS = 1_600;

type Ledger = {
  lifetime_used: number;
  month: string; // YYYY-MM the month counter belongs to
  month_used: number;
  day: string; // YYYY-MM-DD the day counter belongs to
  day_used: number;
  last_at: number; // ms timestamp of the last accepted generation
};

export type AiImageUsage = {
  limit: number;
  period: AiImageAllowance["period"];
  used: number;
  remaining: number;
  dailyUsed: number;
  dailyRemaining: number;
};

/** What a reserved credit needs to be refunded correctly. */
export type AiImageTicket = { month: string; day: string; prevLastAt: number };

export type ReserveResult =
  | { ok: true; ticket: AiImageTicket }
  | { ok: false; reason: AiImageBlockReason };

export class AiImageError extends Error {
  constructor(message = AI_IMAGE_FAILURE_MESSAGE) {
    super(message);
    this.name = "AiImageError";
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function monthKey(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function dayKey(now: Date): string {
  return `${monthKey(now)}-${pad(now.getDate())}`;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, 1_000_000)
    : 0;
}

/** A ms timestamp: finite, never negative, never in the future. */
function timestamp(value: unknown, now: Date): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= now.getTime()
    ? value
    : 0;
}

function emptyLedger(now: Date): Ledger {
  return {
    lifetime_used: 0,
    month: monthKey(now),
    month_used: 0,
    day: dayKey(now),
    day_used: 0,
    last_at: 0,
  };
}

/** Reads the ledger and rolls the month/day counters forward when due. */
function readLedger(now: Date): Ledger {
  const fresh = emptyLedger(now);
  if (typeof window === "undefined") return fresh;
  try {
    const raw = window.localStorage.getItem(AI_IMAGE_STORAGE_KEY);
    if (!raw) return fresh;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fresh;
    }
    const row = parsed as Record<string, unknown>;
    const ledger: Ledger = {
      lifetime_used: count(row.lifetime_used),
      month: typeof row.month === "string" ? row.month : fresh.month,
      month_used: count(row.month_used),
      day: typeof row.day === "string" ? row.day : fresh.day,
      day_used: count(row.day_used),
      last_at: timestamp(row.last_at, now),
    };
    if (ledger.month !== fresh.month) {
      ledger.month = fresh.month;
      ledger.month_used = 0;
    }
    if (ledger.day !== fresh.day) {
      ledger.day = fresh.day;
      ledger.day_used = 0;
    }
    return ledger;
  } catch {
    return fresh;
  }
}

function writeLedger(ledger: Ledger): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AI_IMAGE_STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    // Storage full or blocked: the mock simply forgets; nothing breaks.
  }
}

/** The usage the editor shows for the current plan allowance. */
export function readAiImageUsage(allowance: AiImageAllowance): AiImageUsage {
  const ledger = readLedger(new Date());
  const used =
    allowance.period === "lifetime" ? ledger.lifetime_used : ledger.month_used;
  return {
    limit: allowance.limit,
    period: allowance.period,
    used,
    remaining: Math.max(0, allowance.limit - used),
    dailyUsed: ledger.day_used,
    dailyRemaining: Math.max(0, AI_IMAGE_DAILY_CAP - ledger.day_used),
  };
}

/** Takes one credit BEFORE generation, or says why not (nothing is spent). */
export function reserveAiImage(allowance: AiImageAllowance): ReserveResult {
  const now = new Date();
  const ledger = readLedger(now);
  const used =
    allowance.period === "lifetime" ? ledger.lifetime_used : ledger.month_used;
  if (used >= allowance.limit) return { ok: false, reason: "no_credits" };
  if (ledger.day_used >= AI_IMAGE_DAILY_CAP) {
    return { ok: false, reason: "daily_cap" };
  }
  if (now.getTime() - ledger.last_at < AI_IMAGE_COOLDOWN_MS) {
    return { ok: false, reason: "cooldown" };
  }
  const ticket: AiImageTicket = {
    month: ledger.month,
    day: ledger.day,
    prevLastAt: ledger.last_at,
  };
  ledger.lifetime_used += 1;
  ledger.month_used += 1;
  ledger.day_used += 1;
  ledger.last_at = now.getTime();
  writeLedger(ledger);
  return { ok: true, ticket };
}

/** Gives a reserved credit back (provider failure). Idempotent per ticket use. */
export function refundAiImage(ticket: AiImageTicket): void {
  const ledger = readLedger(new Date());
  ledger.lifetime_used = Math.max(0, ledger.lifetime_used - 1);
  if (ledger.month === ticket.month) {
    ledger.month_used = Math.max(0, ledger.month_used - 1);
  }
  if (ledger.day === ticket.day) {
    ledger.day_used = Math.max(0, ledger.day_used - 1);
  }
  ledger.last_at = ticket.prevLastAt;
  writeLedger(ledger);
}

function randomKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().toLowerCase();
  }
  return `mock-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

/**
 * Simulated provider call. Resolves with a DRAFT image reference (the owner
 * still has to approve it) or throws `AiImageError`. `avoidVariant` makes
 * "Regenerate" look different from the picture just shown.
 */
export function mockGenerateMenuImage(input: {
  name: string;
  details: string;
  avoidVariant?: number;
}): Promise<MenuImage> {
  return new Promise((resolve, reject) => {
    // Same gate the real server uses: no usable name, no provider call.
    if (!buildMenuImagePrompt(input.name, input.details)) {
      reject(new AiImageError("Enter an item name first."));
      return;
    }
    window.setTimeout(() => {
      if (/\(fail\)/i.test(input.name)) {
        reject(new AiImageError());
        return;
      }
      const choices = Array.from(
        { length: MENU_IMAGE_VARIANTS },
        (_, index) => index,
      ).filter((index) => index !== input.avoidVariant);
      const variant = choices[Math.floor(Math.random() * choices.length)];
      resolve({ key: randomKey(), variant, ai: true });
    }, MOCK_GENERATION_MS);
  });
}
~~~~~


## New file: `AI_MENU_PHOTOS.md`

~~~~~markdown
# AI Dish Photos for the Menu

Owner-approved feature (2026-10-14). Owners can generate a professional dish photo for a menu item
with AI. Customers see a small thumbnail in the menu and can open the photo full screen.

**Status:** Phase 1 (UI + mock generation + mock credits) is built. Phase 2 (real image provider,
real credits, R2 storage) is NOT built and must not start before Stage 2/4 (database, API routes,
R2, Upstash) exist. Real AI keys must never be placed in browser code.

This feature reverses the old "menus are text only" rule. PRD 5.5.6, business-rules 11.20 and
security 4A/4C were updated to match; this file is the detailed spec they point to.

---

## 1. Decisions (owner-approved)

| Topic | Decision |
|---|---|
| What AI makes | One dish photo per item from the item name and "What's in it". Text to image only. No "upload my photo and enhance it" in v1 |
| Prompt | Built by the server (`buildMenuImagePrompt` in `lib/ai-images.ts`). Owners never type a prompt |
| Approval | A generated photo is a draft. It is attached to the item only after the owner taps "Use this photo" |
| Customer view | Thumbnail in the list. Tap opens the photo full screen. Default **Fit** (whole photo); a "Fill screen" button covers the whole phone |
| Label | Customers always see "AI-generated image, for illustration" in the viewer and a one-line note under the menu |
| Orientation | Portrait 2:3 so it fills a phone screen well |

### Plan allowances (placeholders, finalize before launch, see section 11)

| Plan | AI photos | Resets |
|---|---|---|
| Free | 3 | Never (one-time trial) |
| Starter | 15 | Every billing month |
| Pro | 40 | Every billing month |
| Enterprise | 100 (an admin can raise it per business) | Every billing month |

There is **no unlimited tier**. Numbers live in `plans.page.ai_images` (`schema.sql` seed and
`lib/mock/plans.ts`). Rule of thumb for the final numbers: allowance x cost per image should stay
around 10 to 15 percent of the plan price. Check the provider's current price per image first; do not
guess it.

---

## 2. Owner flow

1. Customer page editor > Menu > an item. Each item has a photo square with **Add photo**
   (**Change photo** and **Remove photo** once it has one).
2. Add photo needs an item name first ("Enter an item name first, so the photo matches the dish.").
3. The dialog shows the remaining count, for example "3 of 3 AI photos left (one-time trial)".
4. **Make photo** reserves one credit and generates. The dialog cannot be closed while it works.
5. The owner sees the photo and picks **Use this photo**, **Make another** (uses another credit) or
   **Discard** (the credit stays used, the work was done).
6. If generation fails, the credit is refunded and the owner sees a plain message.
7. Out of credits: no Make photo button; a clear message and a link to Billing (Free), or "they
   refill when your next billing month starts" (paid).
8. The photo is saved with the rest of the page when the owner saves (same Save as every other edit).

Downgrade: existing photos stay. Only new generation stops (same idea as business-rules 11.5).

## 3. Customer flow

- Menu screen: items with a photo show a 72 px thumbnail on the right. Items without a photo look
  exactly as before.
- Tap the thumbnail: full-screen viewer (`components/customer-page/photo-viewer.tsx`) with the photo,
  the dish name, price, "What's in it", and the AI label.
- **Fit** shows the entire photo. **Fill screen** covers the entire phone and crops the edges a little.
- Close with the X button or Escape. The page behind does not scroll while it is open, and focus
  returns to the thumbnail.

---

## 4. Cost protection (the most important part)

Every image costs real money. These layers all apply, in this order, on every generate call:

1. **Feature switch.** `system_settings.ai_images.enabled` must be true. Ships `false`.
2. **Eligibility.** Signed-in owner, verified email, business `status = active` (not past_due,
   suspended or cancelled), `ai_images_disabled = 0`, and the page belongs to this business.
3. **Plan allowance.** Credits left on the plan (see 1). Free is a lifetime trial.
4. **Daily hard cap per business**, on every plan: `business_daily_cap` (10 per day).
5. **Cooldown and concurrency.** At most one running job per business; a short cooldown between
   starts (`cooldown_seconds`); plus an Upstash rate limit per business per minute.
6. **Global daily budget.** `daily_budget_paise` in `system_settings.ai_images`. When today's
   provider spend reaches it, generation pauses for everyone until the next day, and an admin is
   alerted at 70 and 90 percent.
7. **Admin kill switches:** global (`enabled`) and per business (`ai_images_disabled`).
8. **Provider-side spending limit.** Set a hard monthly cap in the provider's console. This is the
   real safety net if every rule above had a bug.
9. **One image per request, fixed size.** No batch (n = 1), no custom sizes, no free-text prompts.
10. **Idempotency.** The client sends a key per click; the same key never creates a second job or a
    second charge (`ai_image_jobs UNIQUE (business_id, idempotency_key)`).

### Reserve, generate, settle

```
1  Validate input (item name, ownership, plan, status)              -> 4xx, nothing spent
2  Atomic reserve (ONE statement, so parallel requests cannot overspend):
     UPDATE businesses SET ai_images_used = ai_images_used + 1, ai_images_lifetime_used = ai_images_lifetime_used + 1
      WHERE id = ? AND ai_images_disabled = 0 AND <plan allowance not reached> AND <daily cap not reached>
   0 rows changed -> "no credits" / "daily limit", nothing spent
3  Insert ai_image_jobs (status reserved) with the idempotency key
4  Call the provider (timeout, no automatic retries that could double-charge)
5a Success: re-encode, store draft in R2, status ready, return the draft reference
5b Failure or safety block: refund (ai_images_used - 1), status failed, credit_charged = 0
6  Owner approves -> status approved, the item's `image` is saved with page_config
   Owner discards or never approves -> status discarded / expired; the credit stays used
```

Draft images that are never approved are deleted from R2 after 24 hours (cron).

---

## 5. Data model (Phase 2)

Already added to `schema.sql`:

- `businesses.ai_images_used`, `ai_images_lifetime_used`, `ai_images_reset_at`, `ai_images_disabled`
- table `ai_image_jobs` (audit trail, idempotency, spend)
- `system_settings` row `ai_images` (ships `enabled: false`, no budget set)
- `plans.page.ai_images` = `{ limit, period }` in the plans seed

Menu item shape (`lib/mock/customer-page.ts`): `image?: { key, variant, ai: true } | null`.
`key` is OUR random id (Stage 4: the R2 object key), never an owner-supplied URL. The save route's zod
schema must accept only `^[a-z0-9-]{8,40}$` keys that exist in `ai_image_jobs` for this business with
status approved, and reject any unknown key in the object.

## 6. API routes (Phase 2)

| Route | Purpose |
|---|---|
| `POST /api/menu-photos/generate` | Runs steps 1 to 5 above. Body: location id, item name, details, idempotency key. Returns the draft reference + remaining credits |
| `POST /api/menu-photos/approve` | Marks a ready draft approved (owner confirmed). Idempotent |
| `DELETE /api/menu-photos/[key]` | Removes a photo and its R2 files when an owner removes the photo or the item |
| `GET /api/menu-photos/usage` | Credits left, daily left, period reset date |
| Admin: `/admin` spend view | Today's spend, per business usage, switches (global and per business), audit log |

All routes: authenticated, CSRF/origin checked like other owner routes, zod-validated, rate limited.

## 7. Image and storage

- Generate portrait 2:3. Re-encode with `sharp` to WebP: full size about 1080 x 1620 (a few hundred
  KB at most) and a thumbnail about 160 x 240. Strip metadata. Random file names.
- Served only from the one fixed R2 public domain (`R2_PUBLIC_DOMAIN`). CSP `img-src` adds only that
  domain. No hotlinking, ever.
- Per-business R2 storage cap rises from 5 MB to 20 MB (security 4A) to hold the photos.
- Deleting a menu item, removing a photo, deleting a location or the account deletes the R2 files.
- `<img>` gets `width` and `height`, `loading="lazy"` for thumbnails, and a meaningful `alt`.

## 8. Safety and privacy

- The prompt is the only thing sent to the provider: a fixed food-photo style plus the cleaned dish
  name and details. Nothing about the owner, the business, or customers is sent.
- Cleaned text only (letters, digits and a few marks), so text cannot act as an instruction.
- Block outputs the provider flags; refund the credit.
- The AI label is mandatory on the customer page (avoid misleading customers about the real dish).
- Privacy Policy and Terms must name the image provider and say photos are AI-generated before launch.
- Owners can always remove a photo. Admins can remove any photo and disable AI photos for a business.

## 9. Mock (Phase 1) vs real (Phase 2)

| Phase 1 file | Becomes in Phase 2 |
|---|---|
| `lib/mock/ai-images.ts` (browser credit ledger, fake provider, "(fail)" test name) | Deleted. Replaced by the routes in section 6 |
| `components/menu-photo.tsx` (drawn placeholder) | Renders the real R2 `<img>` (same props) |
| `lib/mock/plans.ts` `ai_images` | Read from the `plans` seed row |
| `lib/ai-images.ts` (constants, prompt builder, messages) | Kept, shared by the server routes |
| `components/dashboard/menu-photo-dialog.tsx`, `photo-viewer.tsx`, `menu-screen.tsx` | Kept; only the generate call changes |

To try the refund path in the mock, give a dish a name that contains "(fail)".

## 10. Tests Phase 2 must pass

- Two parallel generate calls with 1 credit left: exactly one succeeds.
- The same idempotency key twice: one job, one credit.
- Provider failure and safety block: credit refunded, nothing attached.
- Free owner after 3 photos: refused, no provider call. Paid owner at the monthly limit: refused;
  after the reset date: allowed.
- 11th generation in a day: refused on any plan. Past-due or suspended business: refused.
- Global budget reached: refused for everyone; admin kill switch: refused.
- Saving a menu with a made-up `image.key`, another business's key, or a URL: rejected.
- Removing an item or photo deletes the R2 files; an unapproved draft is deleted after 24 hours.
- A downgrade keeps existing photos and stops new generation.

## 11. Launch gates (all required before `enabled: true`)

1. Image provider and model chosen; current price per image verified from the provider's pricing page.
2. Allowances in section 1 recalculated from that price; plan table, pricing page and `schema.sql` updated.
3. Provider-side hard spending limit set; `daily_budget_paise` set; alerts wired.
4. R2 bucket, public domain and CSP updated; cleanup cron running.
5. Privacy Policy and Terms updated (provider named, AI-generated photos).
6. Section 10 tests pass.
~~~~~


---

# MODIFIED FILES (diffs)


## Modified file: `app/pricing/page.tsx`

~~~~~diff
diff --git a/app/pricing/page.tsx b/app/pricing/page.tsx
index 46874f5..3e8f609 100644
--- a/app/pricing/page.tsx
+++ b/app/pricing/page.tsx
@@ -5,6 +5,7 @@ import { Footer } from "@/components/footer";
 import { Navbar } from "@/components/navbar";
 import { Section } from "@/components/section";
 import {
+  aiImageAllowanceLabel,
   limitLabel,
   planOrder,
   planPriceLabel,
@@ -82,6 +83,10 @@ export default function PricingPage() {
                       <dt className="text-ink-muted">Google auto-reply</dt>
                       <dd>{plan.google_auto_reply ? "Yes" : "No"}</dd>
                     </div>
+                    <div className="flex justify-between gap-md">
+                      <dt className="text-ink-muted">AI dish photos</dt>
+                      <dd>{aiImageAllowanceLabel(plan.page.ai_images)}</dd>
+                    </div>
                     <div className="flex justify-between gap-md">
                       <dt className="text-ink-muted">Billing cycle</dt>
                       <dd>{plan.price_inr_paise === null ? "—" : "Monthly"}</dd>
~~~~~


## Modified file: `components/customer-page/icons.tsx`

~~~~~diff
diff --git a/components/customer-page/icons.tsx b/components/customer-page/icons.tsx
index 6f67928..72b2711 100644
--- a/components/customer-page/icons.tsx
+++ b/components/customer-page/icons.tsx
@@ -198,3 +198,11 @@ export function WorldIcon(props: IconProps) {
     </Svg>
   );
 }
+
+export function CloseIcon(props: IconProps) {
+  return (
+    <Svg {...props}>
+      <path d="M6 6l12 12M18 6L6 18" />
+    </Svg>
+  );
+}
~~~~~


## Modified file: `components/customer-page/menu-screen.tsx`

~~~~~diff
diff --git a/components/customer-page/menu-screen.tsx b/components/customer-page/menu-screen.tsx
index 77041bf..a4e6879 100644
--- a/components/customer-page/menu-screen.tsx
+++ b/components/customer-page/menu-screen.tsx
@@ -1,3 +1,7 @@
+"use client";
+
+import { useRef, useState } from "react";
+import { MenuPhoto } from "@/components/menu-photo";
 import type { BrandTheme } from "@/lib/brand/theme";
 import type { BusinessType } from "@/lib/brand/tokens";
 import {
@@ -10,45 +14,72 @@ import {
   MENU_TAGS,
   menuTitle,
 } from "@/lib/customer-page";
-import type { MenuItem, PageConfig } from "@/lib/mock/customer-page";
+import type { MenuImage, MenuItem, PageConfig } from "@/lib/mock/customer-page";
+import { isValidMenuImage } from "@/lib/validation/page-config";
 import { BackButton } from "./back-button";
+import { PhotoViewer } from "./photo-viewer";
 
-function MenuItemRow({ item }: { item: MenuItem }) {
+function MenuItemRow({
+  item,
+  onViewPhoto,
+}: {
+  item: MenuItem;
+  onViewPhoto: (item: MenuItem, trigger: HTMLElement) => void;
+}) {
   const name = clampText(item.name, MAX_MENU_ITEM_NAME_LENGTH);
   const price = clampText(item.price, MAX_MENU_ITEM_PRICE_LENGTH);
   const details = clampText(item.details, MAX_MENU_ITEM_DETAILS_LENGTH);
   const tag = item.tag && MENU_TAGS.includes(item.tag) ? item.tag : null;
+  const image = isValidMenuImage(item.image) ? item.image : null;
 
   return (
-    <li className={item.sold_out ? "opacity-60" : ""}>
-      <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
-        <div className="flex flex-wrap items-center gap-sm">
-          <span className="text-[15px] font-medium">{name}</span>
-          {tag ? (
-            <span className="rounded-pill border border-black/10 bg-black/[0.04] px-xs py-[1px] text-[11px] text-ink-muted">
-              {tag}
-            </span>
-          ) : null}
-          {item.sold_out ? (
-            <span className="rounded-pill border border-black/10 bg-black/[0.06] px-xs py-[1px] text-[11px] text-ink-muted">
-              Sold out
+    <li
+      className={`flex items-start gap-md ${item.sold_out ? "opacity-60" : ""}`}
+    >
+      <div className="min-w-0 flex-1">
+        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
+          <div className="flex flex-wrap items-center gap-sm">
+            <span className="text-[15px] font-medium">{name}</span>
+            {tag ? (
+              <span className="rounded-pill border border-black/10 bg-black/[0.04] px-xs py-[1px] text-[11px] text-ink-muted">
+                {tag}
+              </span>
+            ) : null}
+            {item.sold_out ? (
+              <span className="rounded-pill border border-black/10 bg-black/[0.06] px-xs py-[1px] text-[11px] text-ink-muted">
+                Sold out
+              </span>
+            ) : null}
+          </div>
+          {price ? (
+            <span className="shrink-0 text-[14px] tabular-nums text-ink-muted">
+              {price}
             </span>
           ) : null}
         </div>
-        {price ? (
-          <span className="shrink-0 text-[14px] tabular-nums text-ink-muted">
-            {price}
-          </span>
+        {details ? (
+          <p className="mt-xs text-[13px] text-ink-muted">{details}</p>
         ) : null}
       </div>
-      {details ? (
-        <p className="mt-xs text-[13px] text-ink-muted">{details}</p>
+      {image ? (
+        <button
+          type="button"
+          onClick={(event) => onViewPhoto(item, event.currentTarget)}
+          aria-label={`View photo of ${name}`}
+          className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-control border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
+        >
+          <MenuPhoto image={image} name={name} />
+        </button>
       ) : null}
     </li>
   );
 }
 
-/** Menu screen (PRD 5.5.6, customer-page-ui-spec.md 1.4). No images. */
+/**
+ * Menu screen (PRD 5.5.6, customer-page-ui-spec.md 1.4). Items with an
+ * approved AI photo show a thumbnail; tapping it opens the photo full screen
+ * (AI_MENU_PHOTOS.md).
+ */
 export function MenuScreen({
   config,
   businessType,
@@ -64,6 +95,10 @@ export function MenuScreen({
   onBack: () => void;
 }) {
   const title = menuTitle(config, businessType);
+  const [viewing, setViewing] = useState<MenuItem | null>(null);
+  const trigger = useRef<HTMLElement | null>(null);
+  const viewingImage: MenuImage | null =
+    viewing && isValidMenuImage(viewing.image) ? viewing.image : null;
   // Items without a name are ignored; after a downgrade only the first N named
   // items are shown (business-rules.md 11 rule 5) — nothing is deleted.
   const categories = limitedMenuCategories(config.menu, menuItemLimit).map(
@@ -73,6 +108,16 @@ export function MenuScreen({
     }),
   );
 
+  const hasPhotos = categories.some((category) =>
+    category.items.some((item) => isValidMenuImage(item.image)),
+  );
+
+  function closeViewer() {
+    setViewing(null);
+    // Give focus back to the thumbnail that opened the photo.
+    window.requestAnimationFrame(() => trigger.current?.focus());
+  }
+
   return (
     <div>
       <BackButton
@@ -91,12 +136,33 @@ export function MenuScreen({
             ) : null}
             <ul className="mt-sm grid gap-md">
               {category.items.map((item, itemIndex) => (
-                <MenuItemRow key={itemIndex} item={item} />
+                <MenuItemRow
+                  key={itemIndex}
+                  item={item}
+                  onViewPhoto={(picked, element) => {
+                    trigger.current = element;
+                    setViewing(picked);
+                  }}
+                />
               ))}
             </ul>
           </section>
         ))}
       </div>
+      {hasPhotos ? (
+        <p className="mt-xl text-[11px] text-ink-muted">
+          Photos are AI-generated for illustration.
+        </p>
+      ) : null}
+      {viewing && viewingImage ? (
+        <PhotoViewer
+          name={clampText(viewing.name, MAX_MENU_ITEM_NAME_LENGTH)}
+          price={clampText(viewing.price, MAX_MENU_ITEM_PRICE_LENGTH)}
+          details={clampText(viewing.details, MAX_MENU_ITEM_DETAILS_LENGTH)}
+          image={viewingImage}
+          onClose={closeViewer}
+        />
+      ) : null}
     </div>
   );
 }
~~~~~


## Modified file: `components/dashboard/billing-content.tsx`

~~~~~diff
diff --git a/components/dashboard/billing-content.tsx b/components/dashboard/billing-content.tsx
index ce7912b..5db8d90 100644
--- a/components/dashboard/billing-content.tsx
+++ b/components/dashboard/billing-content.tsx
@@ -28,6 +28,7 @@ import { getDashboardMock } from "@/lib/mock/dashboard";
 import type { DemoScenario } from "@/lib/mock/demo";
 import { useMockBusiness } from "@/lib/use-business";
 import {
+  aiImageAllowanceLabel,
   formatInrPaise,
   limitLabel,
   planOrder,
@@ -373,6 +374,10 @@ export function BillingContent({ demo }: { demo: DemoScenario }) {
                     <dt className="text-ink-muted">Menu items</dt>
                     <dd>{limitLabel(row.page.menu_items)}</dd>
                   </div>
+                  <div className="flex justify-between gap-3">
+                    <dt className="text-ink-muted">AI dish photos</dt>
+                    <dd>{aiImageAllowanceLabel(row.page.ai_images)}</dd>
+                  </div>
                 </dl>
 
                 <div className="mt-5">
~~~~~


## Modified file: `components/dashboard/customer-page-editor.tsx`

~~~~~diff
diff --git a/components/dashboard/customer-page-editor.tsx b/components/dashboard/customer-page-editor.tsx
index a70a4ae..d293098 100644
--- a/components/dashboard/customer-page-editor.tsx
+++ b/components/dashboard/customer-page-editor.tsx
@@ -435,6 +435,8 @@ function EditorForLocation({
               onPatchButtons={patchButtons}
               onPatchMenu={patchMenu}
               menuItemLimit={plan.page.menu_items}
+              aiAllowance={plan.page.ai_images}
+              planName={plan.name}
               highlight={highlight}
             />
           </section>
~~~~~


## Modified file: `components/dashboard/customer-page-items.tsx`

~~~~~diff
diff --git a/components/dashboard/customer-page-items.tsx b/components/dashboard/customer-page-items.tsx
index b36dd9e..5c63bf4 100644
--- a/components/dashboard/customer-page-items.tsx
+++ b/components/dashboard/customer-page-items.tsx
@@ -42,6 +42,7 @@ import {
   upiIdError,
 } from "@/lib/validation/page-config";
 import { MAX_CUSTOM_LINK_LABEL_LENGTH } from "@/lib/customer-page";
+import type { AiImageAllowance } from "@/lib/mock/plans";
 import { EditorItemRow, type ItemBadge } from "./editor-item-row";
 import { HoursRow, MenuRow } from "./menu-and-hours";
 import { Modal } from "./modal";
@@ -221,6 +222,8 @@ export function ButtonsSection({
   onPatchButtons,
   onPatchMenu,
   menuItemLimit,
+  aiAllowance,
+  planName,
   highlight,
 }: {
   businessType: BusinessType;
@@ -229,6 +232,9 @@ export function ButtonsSection({
   onPatchMenu: (menu: MenuConfig) => void;
   /** Plan menu-item limit (`null` = unlimited); from lib/mock/plans.ts. */
   menuItemLimit: number | null;
+  /** Plan AI dish photo allowance; from lib/mock/plans.ts. */
+  aiAllowance: AiImageAllowance;
+  planName: string;
   highlight: string | null;
 }) {
   const b = config.buttons;
@@ -259,6 +265,8 @@ export function ButtonsSection({
           onPatchButtons={onPatchButtons}
           onPatchMenu={onPatchMenu}
           menuItemLimit={menuItemLimit}
+          aiAllowance={aiAllowance}
+          planName={planName}
           highlight={highlight}
         />
~~~~~


## Modified file: `components/dashboard/customer-page-preview.tsx`

~~~~~diff
diff --git a/components/dashboard/customer-page-preview.tsx b/components/dashboard/customer-page-preview.tsx
index 1918ff8..3be707a 100644
--- a/components/dashboard/customer-page-preview.tsx
+++ b/components/dashboard/customer-page-preview.tsx
@@ -86,8 +86,12 @@ export function CustomerPagePreview({
 export function PhoneFrame({ children }: { children: ReactNode }) {
   return (
     <div className="mx-auto w-full max-w-[375px]">
-      <div className="h-[640px] overflow-y-auto rounded-[28px] border-[8px] border-ink bg-white shadow-soft">
-        {children}
+      {/* The transform makes this the containing block for the page's
+          full-screen photo viewer (position: fixed), so the viewer covers the
+          phone preview instead of the whole dashboard, and does not scroll
+          with the page content. */}
+      <div className="h-[640px] overflow-hidden rounded-[28px] border-[8px] border-ink bg-white shadow-soft [transform:translateZ(0)]">
+        <div className="h-full overflow-y-auto">{children}</div>
       </div>
     </div>
   );
~~~~~


## Modified file: `components/dashboard/icons.tsx`

~~~~~diff
diff --git a/components/dashboard/icons.tsx b/components/dashboard/icons.tsx
index 056a3e8..0f666ff 100644
--- a/components/dashboard/icons.tsx
+++ b/components/dashboard/icons.tsx
@@ -214,3 +214,13 @@ export function LockIcon(props: IconProps) {
     </Icon>
   );
 }
+
+export function PhotoIcon(props: IconProps) {
+  return (
+    <Icon {...props}>
+      <rect x="4" y="5" width="16" height="14" rx="2" />
+      <circle cx="9" cy="10" r="1.5" />
+      <path d="M4 16l4.5-4.5L13 16l2.5-2.5L20 18" />
+    </Icon>
+  );
+}
~~~~~


## Modified file: `components/dashboard/menu-and-hours.tsx`

~~~~~diff
diff --git a/components/dashboard/menu-and-hours.tsx b/components/dashboard/menu-and-hours.tsx
index 94578e6..96f9801 100644
--- a/components/dashboard/menu-and-hours.tsx
+++ b/components/dashboard/menu-and-hours.tsx
@@ -12,10 +12,11 @@
  * show only the first N named items.
  */
 
-import { useState } from "react";
+import { useCallback, useEffect, useState } from "react";
 import { Input } from "@/components/input";
 import { Select } from "@/components/select";
 import { ClockIcon, ListIcon } from "@/components/customer-page/icons";
+import { MenuPhoto } from "@/components/menu-photo";
 import type { BusinessType } from "@/lib/brand/tokens";
 import {
   MAX_MENU_CATEGORY_NAME_LENGTH,
@@ -27,28 +28,32 @@ import {
   WEEKDAY_LABELS,
   WEEKDAY_ORDER,
 } from "@/lib/customer-page";
+import { readAiImageUsage, type AiImageUsage } from "@/lib/mock/ai-images";
 import type {
   DayHours,
   MenuCategory,
   MenuConfig,
+  MenuImage,
   MenuItem,
   MenuTag,
   PageConfig,
   Weekday,
 } from "@/lib/mock/customer-page";
-import { limitLabel } from "@/lib/mock/plans";
+import { limitLabel, type AiImageAllowance } from "@/lib/mock/plans";
 import {
   addressError,
   hoursNoteError,
   MAX_HOURS_NOTE_LENGTH,
   MAX_MAPS_ADDRESS_LENGTH,
+  isValidMenuImage,
   MAX_MENU_CATEGORIES,
   namedMenuItemCount,
   phoneError,
 } from "@/lib/validation/page-config";
 import { ActivateButton } from "./activate-button";
 import { EditorItemRow } from "./editor-item-row";
-import { CloseIcon } from "./icons";
+import { CloseIcon, PhotoIcon } from "./icons";
+import { MenuPhotoDialog } from "./menu-photo-dialog";
 
 const TAG_OPTIONS: { value: "" | MenuTag; label: string }[] = [
   { value: "", label: "None" },
@@ -65,6 +70,8 @@ export function MenuRow({
   onPatchButtons,
   onPatchMenu,
   menuItemLimit,
+  aiAllowance,
+  planName,
   highlight,
 }: {
   businessType: BusinessType;
@@ -73,9 +80,29 @@ export function MenuRow({
   onPatchMenu: (menu: MenuConfig) => void;
   /** Plan menu-item limit (`null` = unlimited); from lib/mock/plans.ts. */
   menuItemLimit: number | null;
+  /** Plan AI dish photo allowance; from lib/mock/plans.ts. */
+  aiAllowance: AiImageAllowance;
+  planName: string;
   highlight: string | null;
 }) {
   const menu = config.menu;
+
+  // MOCK ONLY, replaced in Stage 4: the AI photo ledger lives in localStorage,
+  // so it is read after mount (the server render and hydration show no count).
+  const [usage, setUsage] = useState<AiImageUsage | null>(null);
+  const refreshUsage = useCallback(() => {
+    setUsage(readAiImageUsage(aiAllowance));
+  }, [aiAllowance]);
+  useEffect(() => {
+    refreshUsage();
+  }, [refreshUsage]);
+  const [photoTarget, setPhotoTarget] = useState<{
+    category: number;
+    item: number;
+  } | null>(null);
+  const photoItem = photoTarget
+    ? (menu.categories[photoTarget.category]?.items[photoTarget.item] ?? null)
+    : null;
   const namedCount = namedMenuItemCount(menu);
   const atItemLimit = menuItemLimit !== null && namedCount >= menuItemLimit;
   const overLimit = menuItemLimit !== null && namedCount > menuItemLimit;
@@ -101,6 +128,20 @@ export function MenuRow({
     });
   }
 
+  function setItemImage(
+    categoryIndex: number,
+    itemIndex: number,
+    image: MenuImage | null,
+  ) {
+    const category = menu.categories[categoryIndex];
+    if (!category?.items[itemIndex]) return;
+    updateCategory(categoryIndex, {
+      items: category.items.map((row, i) =>
+        i === itemIndex ? { ...row, image } : row,
+      ),
+    });
+  }
+
   function addItem(categoryIndex: number) {
     const category = menu.categories[categoryIndex];
     updateCategory(categoryIndex, {
@@ -127,6 +168,11 @@ export function MenuRow({
         <div className="flex flex-wrap items-center justify-between gap-2">
           <p className="text-[12px] text-ink-muted">
             Items {namedCount} / {limitLabel(menuItemLimit)}
+            {usage
+              ? ` · AI photos ${usage.remaining} / ${usage.limit} left${
+                  usage.period === "lifetime" ? " (trial)" : ""
+                }`
+              : ""}
           </p>
           {overLimit ? (
             <p className="text-[12px] font-medium text-red-700">
@@ -191,6 +237,12 @@ export function MenuRow({
                 <MenuItemEditor
                   key={itemIndex}
                   item={item}
+                  onAddPhoto={() =>
+                    setPhotoTarget({ category: categoryIndex, item: itemIndex })
+                  }
+                  onRemovePhoto={() =>
+                    setItemImage(categoryIndex, itemIndex, null)
+                  }
                   onChange={(patch) =>
                     updateCategory(categoryIndex, {
                       items: category.items.map((row, i) =>
@@ -236,6 +288,24 @@ export function MenuRow({
           ) : null}
         </div>
       </div>
+
+      <MenuPhotoDialog
+        open={photoTarget !== null && photoItem !== null}
+        itemName={photoItem?.name ?? ""}
+        itemDetails={photoItem?.details ?? ""}
+        currentImage={photoItem?.image ?? null}
+        allowance={aiAllowance}
+        usage={usage}
+        planName={planName}
+        onUsageChange={refreshUsage}
+        onApply={(image) => {
+          if (photoTarget) {
+            setItemImage(photoTarget.category, photoTarget.item, image);
+          }
+          setPhotoTarget(null);
+        }}
+        onClose={() => setPhotoTarget(null)}
+      />
     </EditorItemRow>
   );
 }
@@ -245,11 +315,19 @@ function MenuItemEditor({
   item,
   onChange,
   onRemove,
+  onAddPhoto,
+  onRemovePhoto,
 }: {
   item: MenuItem;
   onChange: (patch: Partial<MenuItem>) => void;
   onRemove: () => void;
+  onAddPhoto: () => void;
+  onRemovePhoto: () => void;
 }) {
+  // Shown after "Add photo" is pressed on an unnamed item; hides once named.
+  const [nameHint, setNameHint] = useState(false);
+  const hasName = item.name.trim().length > 0;
+  const image = isValidMenuImage(item.image) ? item.image : null;
   // A saved item with any detail opens expanded; a fresh one stays collapsed.
   const [detailsOpen, setDetailsOpen] = useState(
     () => Boolean(item.details || item.tag || item.sold_out),
@@ -284,6 +362,46 @@ function MenuItemEditor({
         </button>
       </div>
 
+      <div className="mt-3 flex items-center gap-3">
+        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control border border-black/10 bg-surface-muted text-ink-muted">
+          {image ? (
+            <MenuPhoto image={image} name={item.name} />
+          ) : (
+            <PhotoIcon size={20} />
+          )}
+        </div>
+        <div className="flex flex-wrap items-center gap-2">
+          <button
+            type="button"
+            onClick={() => {
+              if (!hasName) {
+                setNameHint(true);
+                return;
+              }
+              setNameHint(false);
+              onAddPhoto();
+            }}
+            className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
+          >
+            {image ? "Change photo" : "Add photo"}
+          </button>
+          {image ? (
+            <button
+              type="button"
+              onClick={onRemovePhoto}
+              className="inline-flex h-9 items-center rounded-control px-2 text-[13px] font-medium text-red-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
+            >
+              Remove photo
+            </button>
+          ) : null}
+        </div>
+      </div>
+      {nameHint && !hasName ? (
+        <p role="alert" className="mt-2 text-[12px] text-red-700">
+          Enter an item name first, so the photo matches the dish.
+        </p>
+      ) : null}
+
       {detailsOpen ? (
         <div className="mt-3 flex flex-col gap-3">
           <Input
~~~~~


## Modified file: `env.example.txt`

~~~~~diff
diff --git a/env.example.txt b/env.example.txt
index 68b6ec6..5e4fbc9 100644
--- a/env.example.txt
+++ b/env.example.txt
@@ -60,6 +60,16 @@ RETENTION_DAYS_AFTER_CANCEL=90
 # ---------- Vercel Cron Secret (protects cron endpoints from public calls) ----------
 CRON_SECRET=
 
+# ---------- AI dish photos (AI_MENU_PHOTOS.md, Stage 4; not used by the Stage 1 mock) ----------
+# Leave AI_IMAGE_ENABLED=false until every launch gate in AI_MENU_PHOTOS.md section 11 is done.
+# Also set a hard monthly spending limit in the provider's own console (the real safety net).
+AI_IMAGE_ENABLED=false
+AI_IMAGE_PROVIDER=
+AI_IMAGE_MODEL=
+AI_IMAGE_API_KEY=
+# The one public domain generated dish photos are served from (also the only extra CSP img-src)
+R2_PUBLIC_DOMAIN=
+
 # ---------- Security: token encryption (Google OAuth tokens, AES-256-GCM) ----------
 # Generate with: openssl rand -base64 32
 TOKEN_ENCRYPTION_KEY=
~~~~~


## Modified file: `lib/mock/customer-page.ts`

~~~~~diff
diff --git a/lib/mock/customer-page.ts b/lib/mock/customer-page.ts
index 6635899..c481682 100644
--- a/lib/mock/customer-page.ts
+++ b/lib/mock/customer-page.ts
@@ -30,12 +30,28 @@ export type SocialLink = { on: boolean; url: string };
 export type SocialLinks = Partial<Record<SocialKey, SocialLink>>;
 
 export type MenuTag = "New" | "Popular" | "Veg" | "Spicy";
+
+/**
+ * An approved AI-generated dish photo (AI_MENU_PHOTOS.md). Only OUR reference
+ * is stored, never an owner-supplied URL: `key` names a file we generated and
+ * stored ourselves (Stage 4: a random Cloudflare R2 object key; Stage 1 mock:
+ * a random id with a drawn placeholder picked by `variant`). `ai` is always
+ * true and drives the "AI-generated" label shown to customers.
+ */
+export type MenuImage = {
+  key: string;
+  variant: number;
+  ai: true;
+};
+
 export type MenuItem = {
   name: string;
   price: string;
   details: string;
   tag: MenuTag | null;
   sold_out: boolean;
+  /** Optional so existing items and saved data without a photo stay valid. */
+  image?: MenuImage | null;
 };
 export type MenuCategory = { name: string; items: MenuItem[] };
 export type MenuConfig = { categories: MenuCategory[] };
~~~~~


## Modified file: `lib/mock/plans.ts`

~~~~~diff
diff --git a/lib/mock/plans.ts b/lib/mock/plans.ts
index 1457747..dcf208f 100644
--- a/lib/mock/plans.ts
+++ b/lib/mock/plans.ts
@@ -11,11 +11,25 @@
 
 export type PlanId = "free" | "starter" | "pro" | "enterprise";
 
+/**
+ * AI dish photo allowance (AI_MENU_PHOTOS.md). ALWAYS a number, never null:
+ * every image costs real money, so there is no "unlimited" tier (Enterprise
+ * gets a larger number, raised by an admin). `period` says when it resets:
+ * `lifetime` = a one-time trial that never refills (Free), `month` = refills
+ * every billing cycle (paid plans).
+ */
+export type AiImageAllowance = {
+  limit: number;
+  period: "lifetime" | "month";
+};
+
 export type PlanPageLimits = {
   /** Menu item limit, or null for unlimited within the security hard cap. */
   menu_items: number | null;
   /** Custom link limit; null = no plan limit on every plan. */
   custom_links: number | null;
+  /** AI-generated dish photos (see AiImageAllowance). */
+  ai_images: AiImageAllowance;
 };
 
 export type Plan = {
@@ -39,7 +53,11 @@ export const plans: Record<PlanId, Plan> = {
     monthly_scans: 10,
     self_serve: false,
     google_auto_reply: true,
-    page: { menu_items: 10, custom_links: null },
+    page: {
+      menu_items: 10,
+      custom_links: null,
+      ai_images: { limit: 3, period: "lifetime" },
+    },
   },
   starter: {
     id: "starter",
@@ -49,7 +67,11 @@ export const plans: Record<PlanId, Plan> = {
     monthly_scans: 1000,
     self_serve: true,
     google_auto_reply: false,
-    page: { menu_items: 60, custom_links: null },
+    page: {
+      menu_items: 60,
+      custom_links: null,
+      ai_images: { limit: 15, period: "month" },
+    },
   },
   pro: {
     id: "pro",
@@ -59,7 +81,11 @@ export const plans: Record<PlanId, Plan> = {
     monthly_scans: 10000,
     self_serve: true,
     google_auto_reply: true,
-    page: { menu_items: 150, custom_links: null },
+    page: {
+      menu_items: 150,
+      custom_links: null,
+      ai_images: { limit: 40, period: "month" },
+    },
   },
   enterprise: {
     id: "enterprise",
@@ -69,7 +95,11 @@ export const plans: Record<PlanId, Plan> = {
     monthly_scans: null,
     self_serve: false,
     google_auto_reply: true,
-    page: { menu_items: null, custom_links: null },
+    page: {
+      menu_items: null,
+      custom_links: null,
+      ai_images: { limit: 100, period: "month" },
+    },
   },
 };
 
@@ -101,3 +131,10 @@ export function planPriceLabel(plan: Plan): string {
 export function limitLabel(value: number | null): string {
   return value === null ? "Unlimited" : groupIndian(value);
 }
+
+/** "3 one-time" / "15 per month" for plan cards and the editor. */
+export function aiImageAllowanceLabel(allowance: AiImageAllowance): string {
+  return allowance.period === "lifetime"
+    ? `${allowance.limit} (one-time trial)`
+    : `${allowance.limit} per month`;
+}
~~~~~


## Modified file: `lib/mock/store.ts`

~~~~~diff
diff --git a/lib/mock/store.ts b/lib/mock/store.ts
index ba95ad2..5abe078 100644
--- a/lib/mock/store.ts
+++ b/lib/mock/store.ts
@@ -54,6 +54,7 @@ import {
 } from "@/lib/mock/locations";
 import {
   isValidHttpsUrl,
+  isValidMenuImage,
   isValidPhone,
   isValidSocialUrl,
   MAX_CUSTOM_LINKS,
@@ -530,6 +531,16 @@ function sanitizeMenu(raw: unknown): MenuConfig {
           details: safeText(item.details, MAX_MENU_ITEM_DETAILS_LENGTH),
           tag,
           sold_out: item.sold_out === true,
+          // Rebuilt field by field: no extra keys survive (AI_MENU_PHOTOS.md).
+          ...(isValidMenuImage(item.image)
+            ? {
+                image: {
+                  key: item.image.key,
+                  variant: item.image.variant,
+                  ai: true as const,
+                },
+              }
+            : {}),
         },
       ];
     });
~~~~~


## Modified file: `lib/validation/page-config.ts`

~~~~~diff
diff --git a/lib/validation/page-config.ts b/lib/validation/page-config.ts
index 41a7d2d..356fc4f 100644
--- a/lib/validation/page-config.ts
+++ b/lib/validation/page-config.ts
@@ -15,6 +15,7 @@
 
 import type {
   MenuConfig,
+  MenuImage,
   PageConfig,
   SocialKey,
   SocialLinks,
@@ -34,6 +35,29 @@ export const MAX_LINK_LENGTH = 2048;
 /** Menu lists max 12 per location (PRD 5.5.6). */
 export const MAX_MENU_CATEGORIES = 12;
 
+/**
+ * Menu photo reference (AI_MENU_PHOTOS.md). The key is a server-generated
+ * random id, never a URL, so an owner can never point the page at an outside
+ * image (security 4C: no hotlinking). `variant` picks the Stage 1 placeholder
+ * drawing and is ignored once real images are stored in R2.
+ */
+export const MENU_IMAGE_VARIANTS = 3;
+export const MENU_IMAGE_KEY_PATTERN = /^[a-z0-9-]{8,40}$/;
+
+export function isValidMenuImage(value: unknown): value is MenuImage {
+  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
+  const image = value as Record<string, unknown>;
+  return (
+    typeof image.key === "string" &&
+    MENU_IMAGE_KEY_PATTERN.test(image.key) &&
+    typeof image.variant === "number" &&
+    Number.isInteger(image.variant) &&
+    image.variant >= 0 &&
+    image.variant < MENU_IMAGE_VARIANTS &&
+    image.ai === true
+  );
+}
+
 /** Weekly hours note max 100 (PRD 5.5.7). */
 export const MAX_HOURS_NOTE_LENGTH = 100;
~~~~~


## Modified file: `schema.sql`

~~~~~diff
diff --git a/schema.sql b/schema.sql
index ec52554..14da73b 100644
--- a/schema.sql
+++ b/schema.sql
@@ -44,6 +44,10 @@ CREATE TABLE businesses (
   billing_cycle_end TEXT,               -- ISO 8601
   scan_reset_at TEXT,                   -- ISO 8601. Next moment scans_used resets to 0 (Free: rolling month from signup; paid: renewal date). Reset happens lazily on the first request after this time, cron is a backstop (business-rules.md section 1)
   scan_limit_notified_at TEXT,          -- set when the "Scan limit reached" email is sent; cleared on reset, so the owner gets ONE email per cycle
+  ai_images_used INTEGER NOT NULL DEFAULT 0,          -- AI dish photo credits used in the current period (AI_MENU_PHOTOS.md). Reserved by ONE conditional UPDATE before generation, refunded if the provider fails
+  ai_images_lifetime_used INTEGER NOT NULL DEFAULT 0, -- total ever; the Free one-time trial is checked against this
+  ai_images_reset_at TEXT,              -- ISO 8601. Next moment ai_images_used resets to 0 (paid plans: the billing cycle date). NULL on Free: the trial never refills
+  ai_images_disabled INTEGER NOT NULL DEFAULT 0,   -- 1 = an admin switched AI photos off for this business (abuse); checked on every generate
   created_at TEXT NOT NULL DEFAULT (datetime('now')),
   updated_at TEXT NOT NULL DEFAULT (datetime('now'))
 );
@@ -135,6 +139,37 @@ CREATE TABLE page_events (
 CREATE INDEX idx_page_events_business_id ON page_events(business_id);
 CREATE INDEX idx_page_events_dedupe ON page_events(review_page_id, event_type, target_key, visitor_hash, created_at);
 
+-- ============================================================
+-- AI DISH PHOTO JOBS (AI_MENU_PHOTOS.md)
+-- ============================================================
+-- One row per generation attempt. The credit lives on `businesses.ai_images_used`;
+-- this table is the audit trail, the idempotency guard (a double-click or a
+-- retried request with the same key can never create a second job or charge a
+-- second credit) and the source for the admin spend view. The prompt text is
+-- NOT stored, only its hash (it is rebuilt server-side from the item name and
+-- details, never typed by the owner).
+CREATE TABLE ai_image_jobs (
+  id TEXT PRIMARY KEY,
+  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
+  review_page_id TEXT NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
+  idempotency_key TEXT NOT NULL,        -- client-generated per click
+  status TEXT NOT NULL DEFAULT 'reserved', -- reserved, generating, ready, failed, approved, discarded, expired
+  credit_charged INTEGER NOT NULL DEFAULT 1, -- 1 while the credit is spent; set to 0 when it is refunded (failed)
+  prompt_hash TEXT NOT NULL,            -- SHA-256 of the server-built prompt
+  provider TEXT NOT NULL,
+  model TEXT NOT NULL,
+  image_key TEXT,                       -- R2 key of the full-size draft/approved image (random, server-generated, never owner-supplied)
+  thumb_key TEXT,                       -- R2 key of the small menu thumbnail
+  provider_cost_paise INTEGER,          -- what the provider charged, for the admin spend view
+  failure_code TEXT,                    -- provider_error, safety_blocked, timeout
+  created_at TEXT NOT NULL DEFAULT (datetime('now')),
+  completed_at TEXT,
+  UNIQUE (business_id, idempotency_key)
+);
+
+CREATE INDEX idx_ai_image_jobs_business_day ON ai_image_jobs(business_id, created_at);
+CREATE INDEX idx_ai_image_jobs_status ON ai_image_jobs(status, created_at);
+
 -- ============================================================
 -- SUBSCRIPTIONS / BILLING (Cashfree only)
 -- ============================================================
@@ -278,7 +313,7 @@ CREATE TABLE system_settings (
 -- Checkout, plan limits and the dashboard plan widget MUST read this row. Prices are
 -- NEVER accepted from the client (see security-and-reliability.md section 6A).
 -- Money is stored as an integer in paise (INR minor units) to avoid float errors.
--- `null` for locations/monthly_scans (and for any `page` limit) means unlimited within the hard security caps in security-and-reliability.md 4C. `self_serve: false` means the
+-- `page.ai_images` is {limit, period} and is NEVER null: every AI image costs real money, so there is no unlimited AI photo tier (period `lifetime` = one-time trial that never refills, `month` = refills each billing cycle; AI_MENU_PHOTOS.md). `null` for locations/monthly_scans (and for the other `page` limits) means unlimited within the hard security caps in security-and-reliability.md 4C. `self_serve: false` means the
 -- plan can never be bought through checkout (Free is assigned at signup; Enterprise
 -- is arranged manually by an admin).
 -- `google_auto_reply` (boolean) gates the Google review auto-reply feature: true on free, pro and enterprise,
@@ -287,7 +322,17 @@ CREATE TABLE system_settings (
 INSERT INTO system_settings (id, key, value) VALUES (
   'setting_plans',
   'plans',
-  '{"free":{"price_inr_paise":0,"locations":1,"monthly_scans":10,"self_serve":false,"google_auto_reply":true,"page":{"menu_items":10,"custom_links":null}},"starter":{"price_inr_paise":49900,"locations":1,"monthly_scans":1000,"self_serve":true,"google_auto_reply":false,"page":{"menu_items":60,"custom_links":null}},"pro":{"price_inr_paise":69900,"locations":1,"monthly_scans":10000,"self_serve":true,"google_auto_reply":true,"page":{"menu_items":150,"custom_links":null}},"enterprise":{"price_inr_paise":null,"locations":null,"monthly_scans":null,"self_serve":false,"google_auto_reply":true,"page":{"menu_items":null,"custom_links":null}}}'
+  '{"free":{"price_inr_paise":0,"locations":1,"monthly_scans":10,"self_serve":false,"google_auto_reply":true,"page":{"menu_items":10,"custom_links":null,"ai_images":{"limit":3,"period":"lifetime"}}},"starter":{"price_inr_paise":49900,"locations":1,"monthly_scans":1000,"self_serve":true,"google_auto_reply":false,"page":{"menu_items":60,"custom_links":null,"ai_images":{"limit":15,"period":"month"}}},"pro":{"price_inr_paise":69900,"locations":1,"monthly_scans":10000,"self_serve":true,"google_auto_reply":true,"page":{"menu_items":150,"custom_links":null,"ai_images":{"limit":40,"period":"month"}}},"enterprise":{"price_inr_paise":null,"locations":null,"monthly_scans":null,"self_serve":false,"google_auto_reply":true,"page":{"menu_items":null,"custom_links":null,"ai_images":{"limit":100,"period":"month"}}}}'
+);
+
+-- SEED: global AI dish photo switches (AI_MENU_PHOTOS.md section 5). Read on EVERY
+-- generate call. Ships OFF and with no budget on purpose: an admin turns it on only
+-- after the launch gates in AI_MENU_PHOTOS.md section 11 are done. When
+-- `daily_budget_paise` is reached the feature pauses itself until the next day.
+INSERT INTO system_settings (id, key, value) VALUES (
+  'setting_ai_images',
+  'ai_images',
+  '{"enabled":false,"daily_budget_paise":null,"business_daily_cap":10,"cooldown_seconds":3}'
 );
 
 -- ============================================================
~~~~~


## Modified file: `PRD.md`

~~~~~diff
diff --git a/PRD.md b/PRD.md
index 3f4e6dc..470ad89 100644
--- a/PRD.md
+++ b/PRD.md
@@ -394,8 +394,9 @@ required. Exact screens and wireframes: `customer-page-ui-spec.md`.
    automatically (5.5.5). Its saved value is kept, so turning it back on needs no retyping.
 5. **Structured fields only.** Owners fill fields in fixed templates. No HTML, CSS, JavaScript,
    Markdown or embeds, ever (security-and-reliability.md section 4C).
-6. **No images and no uploads on the customer page.** Only the business logo (Settings) is an
-   image. There is no photo gallery and no menu images.
+6. **No owner uploads and no galleries on the customer page.** The images are the business logo
+   (Settings) and the AI-generated dish photos on menu items that WE generate and store
+   (5.5.6, AI_MENU_PHOTOS.md). Owners never upload photos or paste image links.
 7. **Same QR and NFC, always.** Editing the page never changes the slug (business-rules.md 9).
 8. **Quantity limits by plan, not feature locks.** Every plan can use every block type; plans differ
    only in how much they can add (business-rules.md section 1 and 11). The one plan-gated feature in the
@@ -495,8 +496,8 @@ button grid, social icon row.
 - Minimum tap target 44 x 44 px; body text at least 16 px; one-tap Call, WhatsApp and Copy actions.
 
 **5.5.6 Menu / Services and prices (manual builder, optional)**
-There is no menu link option and no image upload. The owner builds the list by hand; everything
-except the item name is optional.
+There is no menu link option and no photo upload. The owner builds the list by hand; everything
+except the item name is optional. An item can also have one **AI-generated dish photo** (below).
 - Label adapts to the business type: **Menu** (café, restaurant), **Services and prices** (salon,
   gym), **Products** (retail, other). The owner can rename the title (max 40 chars).
 - **Lists (categories):** up to 12, each with a name (max 40), added with **Add category**.
@@ -515,6 +516,19 @@ except the item name is optional.
 - The **Menu button is shown to customers only when at least one item has a name.**
 - Prices are display text only. There is no ordering, cart or payment in v1.
 - Drag-and-drop reorder of lists and items is nice-to-have and may follow after v1 launch.
+- **AI dish photo (per item, optional).** Full spec: AI_MENU_PHOTOS.md.
+  - **Add photo** on an item (needs an item name first) opens a dialog. The server makes a
+    professional food photo from the item name and "What's in it"; the owner never writes a prompt.
+  - The owner sees the photo first and chooses **Use this photo**, **Make another** or **Discard**.
+    Nothing is attached until they approve. **Change photo** and **Remove photo** follow.
+  - Every photo uses one plan credit: Free 3 (one-time trial), Starter 15 / month, Pro 40 / month,
+    Enterprise 100 / month. There is no unlimited tier. A failed generation refunds the credit.
+    Extra caps (daily per business, cooldown, global budget, admin switches) are in
+    AI_MENU_PHOTOS.md section 4. Counter shown in the editor: "AI photos 3 / 3 left".
+  - **Customer view:** the item shows a small thumbnail; tapping it opens the photo full screen
+    (**Fit** by default, **Fill screen** to cover the whole phone), with the name, price and details.
+    The page says photos are AI-generated for illustration. Items without a photo are unchanged.
+  - Existing photos stay after a downgrade; only new generation stops.
 
 **5.5.7 Contact and hours, Wi-Fi**
 - Phone and WhatsApp number: digits with optional leading `+`, 7 to 15 digits (E.164 style).
@@ -527,7 +541,8 @@ except the item name is optional.
   before it can be activated (business-rules.md 11, rule 15).
 
 **5.5.8 Removed and restricted options**
-- **Photo gallery: removed** for every business type (no image uploads on the customer page).
+- **Photo gallery: removed** for every business type (no owner image uploads on the customer page).
+  The only photos are AI-generated menu item photos (5.5.6).
 - **Menu link / external menu: removed.** Menus are built manually (5.5.6).
 - **Order online and Book now are not built-in buttons** for any business type. An owner who wants
   them adds them as custom link buttons.
@@ -668,4 +683,5 @@ and Limited Use statement (google-approval.md section 8).
 - Owner-supplied HTML, CSS, JavaScript or embeds on the customer page (structured blocks only)
 - Online ordering, carts, payments or a table/appointment booking engine on the customer page
   (café, salon and restaurant pages have no "Order online" or "Book now" buttons)
-- Photo gallery or any image upload on the customer page (menus are text only)
+- Photo gallery or any owner image upload on the customer page (menu photos are AI-generated by us,
+  never uploaded; see AI_MENU_PHOTOS.md)
~~~~~


## Modified file: `PROGRESS.md`

~~~~~diff
diff --git a/PROGRESS.md b/PROGRESS.md
index ac01a7a..122d385 100644
--- a/PROGRESS.md
+++ b/PROGRESS.md
@@ -1755,3 +1755,24 @@ findings, and a real payment + password reset have been tested end to end.
   the post-mount overlay was verified through the script, hydration safety is by
   construction (first render uses the default profile). Next: unchanged —
   Stage 2 (Database) on a `feat/stage-2-*` branch.
+
+- 2026-10-14 — AI dish photos, Phase 1 (mock) DONE (owner-approved feature, spec in
+  AI_MENU_PHOTOS.md). Menu items can carry an approved AI photo: owner dialog (Add photo > Make photo >
+  preview > Use this photo / Make another / Discard) in `components/dashboard/menu-photo-dialog.tsx`,
+  thumbnail + full-screen viewer (Fit default, Fill screen, close, Escape, focus return, scroll lock)
+  in `components/customer-page/menu-screen.tsx` and `photo-viewer.tsx`. Cost controls are mocked the
+  way the real ones will work (`lib/ai-images.ts` shared rules + prompt builder; `lib/mock/ai-images.ts`
+  browser ledger): plan allowance (Free 3 one-time, Starter 15, Pro 40, Enterprise 100; never
+  unlimited), 10/day cap, 3 s cooldown, reserve-before-generate with refund on failure, dialog cannot be
+  closed mid-generation. Photos are drawn placeholders (`components/menu-photo.tsx`); a dish named
+  with "(fail)" simulates a provider failure. Also: `MenuImage` type + `isValidMenuImage` (our key only,
+  never a URL; tampered localStorage is rejected), `plans.page.ai_images`, "AI dish photos" row on the
+  pricing and billing cards, PhoneFrame now contains the full-screen viewer, schema.sql (businesses
+  `ai_images_*` columns, `ai_image_jobs`, `ai_images` setting that ships OFF, plans seed), env.example
+  (AI_IMAGE_*, R2_PUBLIC_DOMAIN), and PRD / business-rules / security / ui-spec updated (the old "no
+  images" rules were reversed on purpose). Verified: `tsc` + `npm run build` pass; browser run
+  (headless Chromium) passed: generate/approve, refund on failure, cooldown, mid-generation close
+  blocked, out-of-credits state, save, public page thumbnail + viewer at 390 px and 1280 px, viewer
+  contained in the dashboard phone preview, tampered image key rejected, no console errors; schema.sql
+  runs in SQLite. NOT done (Phase 2, needs Stage 2/4): real provider, server credits, R2, rate limits,
+  admin spend view, privacy/terms update; launch gates are in AI_MENU_PHOTOS.md section 11.
~~~~~


## Modified file: `business-rules.md`

~~~~~diff
diff --git a/business-rules.md b/business-rules.md
index bc829ae..418ffdb 100644
--- a/business-rules.md
+++ b/business-rules.md
@@ -33,7 +33,9 @@ to this spec — do not infer different behavior.
 Custom link buttons are the same on every plan: the owner adds as many as needed. Only the hard security
 cap in security-and-reliability.md 4C applies (20 per location).
 
-There is no photo gallery and no image upload on the customer page.
+There is no photo gallery and no owner image upload on the customer page. The only photos are the
+AI-generated menu item photos we create and store (rule 20 and AI_MENU_PHOTOS.md); AI photo
+allowances per plan are in the plan table below.
 
 Social links, contact and hours, announcement, Wi-Fi and the thank-you message have no plan limit
 (only the field-size caps in 4C). These values are proposals; confirm or edit them in the `plans`
@@ -371,8 +373,12 @@ Spec: PRD.md section 5.5. Rules that must be built exactly:
     and no business-type restriction, so a café, salon or restaurant can add "Order online" or "Book now"
     as custom links. Only the hard cap (security-and-reliability.md 4C) and the https rules apply. Changing
     business type never hides or removes custom links.
-20. **The menu is built manually.** There is no menu URL field and no images. A menu config with an
-    unknown key is rejected. The Menu button is shown only when at least one item has a name.
+20. **The menu is built manually.** There is no menu URL field and no owner-uploaded or owner-linked
+    images. The only image on a menu item is an AI-generated photo that the owner approved (AI_MENU_PHOTOS.md):
+    the item stores OUR image key, never a URL, and a key that does not belong to this business is
+    rejected. AI photos use plan credits (Free 3 one-time, Starter 15/month, Pro 40/month, Enterprise
+    100/month; never unlimited); a failed generation refunds the credit; a downgrade keeps existing
+    photos and stops new generation. A menu config with an unknown key is rejected. The Menu button is shown only when at least one item has a name.
     Everything except the item name is optional (price, "What's in it", tag, sold out).
 21. **Call, WhatsApp and Directions act directly** (tel:, wa.me, Google Maps link built by the server
     from validated values). Menu, Wi-Fi and Hours and contact open their own screen with a back arrow.
~~~~~


## Modified file: `customer-page-ui-spec.md`

~~~~~diff
diff --git a/customer-page-ui-spec.md b/customer-page-ui-spec.md
index 344fe4d..a812c7e 100644
--- a/customer-page-ui-spec.md
+++ b/customer-page-ui-spec.md
@@ -63,7 +63,10 @@ wraps; hidden when none are shown.
 
 ### 1.4 Screens opened by buttons (each has a 44 px back arrow and a title)
 - **Menu** (or Services and prices, Products): list headings with items. Each item shows name, tag chip
-  and price; "What's in it" in small text under the name; Sold out items greyed with a chip. No images.
+  and price; "What's in it" in small text under the name; Sold out items greyed with a chip. An item with an AI photo shows a 72 px square thumbnail on the right;
+  tapping it opens the photo full screen (Fit by default, a "Fill screen" button, a 44 px close button,
+  name, price, details and "AI-generated image, for illustration"). A one-line note under the list says
+  photos are AI-generated for illustration.
 ```
   <-  Menu
   Coffee
@@ -150,7 +153,8 @@ The Menu button is shown to customers.
 Add category
 ```
 Only the item name is needed. Price, "What's in it", tag and sold out are optional. No link field, no
-image upload. At the plan limit: "Item limit reached. Upgrade for more items." With no named items the
+owner image upload. Each item has a photo square with Add photo / Change photo / Remove photo, which
+opens the AI photo dialog (AI_MENU_PHOTOS.md); the row header shows "AI photos 3 / 3 left (trial)". At the plan limit: "Item limit reached. Upgrade for more items." With no named items the
 editor shows "The Menu button stays hidden until you add at least one item."
 
 ### 2.6 Top bar
~~~~~


## Modified file: `security-and-reliability.md`

~~~~~diff
diff --git a/security-and-reliability.md b/security-and-reliability.md
index b99ed6e..4fb5366 100644
--- a/security-and-reliability.md
+++ b/security-and-reliability.md
@@ -98,6 +98,7 @@ the `x-forwarded-for` header. On limit exceeded, return **429** with a `Retry-Af
 | Public review page load (`/r/[slug]`) | 60 / minute / IP |
 | Signup | 5 / hour / IP |
 | Logo upload | 10 / hour / business |
+| AI dish photo generation | 3 / minute / business, one running job at a time, 10 / day / business on every plan, plus the plan credits and the global daily budget (AI_MENU_PHOTOS.md section 4) |
 | All other authenticated API routes | 120 / minute / business |
 
 **Bot protection on public forms:** use **Cloudflare Turnstile** (free, no CAPTCHA
@@ -199,9 +200,10 @@ must stay well under that.
 | Logo stored version | re-encoded to WebP/PNG, max 512 x 512 px (should end up well under 150 KB) |
 | Logos per business | 1. A new upload replaces the old one, and the old R2 file is deleted |
 | QR codes | Generated on demand for PNG/PDF/SVG downloads and not stored per download. At most one stored QR image per review page, overwritten on regenerate |
-| Total R2 storage per business | 5 MB. Reject uploads beyond it |
+| AI dish photos | Generated by us, never uploaded by owners. Stored as re-encoded WebP: full size about 1080 x 1620 plus a small thumbnail, random names. At most one photo per menu item. Unapproved drafts are deleted after 24 hours. Full rules and cost caps: AI_MENU_PHOTOS.md |
+| Total R2 storage per business | 20 MB (logo + AI dish photos). Reject beyond it |
 | Upload route body | Stop reading the request stream once it passes 1.5 MB and return 413. Do not trust the `Content-Length` header alone |
-| Other file uploads | None. The customer page has no image uploads (no gallery). Any new upload feature needs its own limits added here first |
+| Other file uploads | None. Owners cannot upload photos to the customer page (no gallery). The AI dish photos above are the only other images. Any new upload feature needs its own limits added here first |
 
 **Text and request sizes**
 
@@ -323,8 +325,9 @@ the public on OUR domain. That makes it a phishing, XSS and abuse surface. These
   (`upi://pay?pa=...&pn=...&cu=INR`, every value URL-encoded, no amount). `upi:` is allowed for this
   one link only; `javascript:`, `data:` and every other scheme stay rejected. The owner never types a link.
 - MUST NOT load images from owner-supplied URLs (no hotlinking). The customer page has no owner-uploaded
-  images; the only image is the business logo we re-encoded and stored ourselves, served from one fixed
-  storage domain; CSP `img-src` allows only `'self'`, `data:` and that domain.
+  images; the only images are the business logo and the AI dish photos, both re-encoded and stored by
+  us, served from one fixed storage domain; CSP `img-src` allows only `'self'`, `data:` and that domain.
+  A menu item stores our image key (`^[a-z0-9-]{8,40}$`), never a URL.
 - MUST NOT use owner-supplied text in page `<title>`, meta tags or redirects without escaping.
 - Analytics events (Phase D) accept only allowlisted `event_type` values and only `target_key`s that exist
   in the saved config; the URL to open is never taken from the request.
~~~~~

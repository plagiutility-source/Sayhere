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

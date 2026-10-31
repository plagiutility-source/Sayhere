"use client";

/**
 * Owner flow for building the menu from a PDF (PRD 5.5.6, AI menu import):
 * choose a PDF -> progress stages -> review what AI found -> add to the menu.
 *
 * MOCK ONLY (Stage 1): the extraction itself is simulated in
 * `lib/menu-import.ts`; the upload, validation, review, item/plan limits,
 * automatic AI photos and save are all real UI behaviour. Stage 4 swaps that
 * one extractor for the server route and nothing in this dialog changes.
 *
 * Photos are created only AFTER the owner confirms, and only for as many
 * dishes as the plan allowance and the daily cap allow. A failed batch refunds
 * every reserved credit.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BusinessType } from "@/lib/brand/tokens";
import { Button } from "@/components/button";
import { Spinner } from "@/components/spinner";
import {
  MAX_MENU_PDF_BYTES,
  MENU_IMPORT_STAGES,
  menuPdfError,
  mergeImportedMenu,
  mockExtractMenuFromPdf,
  type MenuImportResult,
} from "@/lib/menu-import";
import type { AiImageAllowance } from "@/lib/mock/plans";
import { limitLabel } from "@/lib/mock/plans";
import {
  readAiImageUsage,
  refundAiImage,
  reserveAiImageBatch,
  mockGenerateImportPhotos,
  type AiImageUsage,
} from "@/lib/mock/ai-images";
import type { MenuConfig, MenuImage } from "@/lib/mock/customer-page";
import {
  MAX_MENU_CATEGORIES,
  namedMenuItemCount,
} from "@/lib/validation/page-config";
import { Modal } from "./modal";
import { SparklesIcon, UploadIcon } from "./icons";

type Step = "pick" | "reading" | "review" | "photos";

export type MenuImportApplyResult = {
  addedItems: number;
  addedCategories: number;
  photoCount: number;
  fileName: string;
  skippedItems: number;
};

export function MenuImportDialog({
  open,
  businessType,
  existingMenu,
  menuItemLimit,
  aiAllowance,
  planName,
  onApply,
  onClose,
  onUsageChange,
}: {
  open: boolean;
  businessType: BusinessType;
  existingMenu: MenuConfig;
  menuItemLimit: number | null;
  aiAllowance: AiImageAllowance;
  planName: string;
  onApply: (menu: MenuConfig, result: MenuImportApplyResult) => void;
  onClose: () => void;
  onUsageChange: () => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MenuImportResult | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoTarget, setPhotoTarget] = useState(0);
  const [usage, setUsage] = useState<AiImageUsage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Bumped to ignore callbacks from a closed dialog or a replaced file. */
  const runRef = useRef(0);

  const itemSlots =
    menuItemLimit === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, menuItemLimit - namedMenuItemCount(existingMenu));
  const existingNames = new Set(
    existingMenu.categories.map((category) => category.name.trim().toLowerCase()),
  );
  const categorySlots = Math.max(
    0,
    MAX_MENU_CATEGORIES - existingMenu.categories.length,
  );

  // Fresh state every time the dialog opens; a closed dialog cancels any
  // in-flight extraction so it cannot touch state after close.
  useEffect(() => {
    runRef.current++;
    if (!open) return;
    setStep("pick");
    setStage(0);
    setError(null);
    setResult(null);
    setSelection(new Set());
    setFileName("");
    setDragOver(false);
    setBusy(false);
    setPhotoTarget(0);
    setUsage(readAiImageUsage(aiAllowance));
  }, [open, aiAllowance]);

  /** Lists that can be added: existing names plus free list slots. */
  function allowedCategories(source: MenuImportResult): Set<number> {
    const allowed = new Set<number>();
    let freeLists = categorySlots;
    const names = new Set(existingNames);
    source.categories.forEach((category, index) => {
      const name = category.name.trim().toLowerCase();
      if (names.has(name)) {
        allowed.add(index);
        return;
      }
      if (freeLists > 0) {
        allowed.add(index);
        freeLists--;
        names.add(name);
      }
    });
    return allowed;
  }

  function initialSelection(source: MenuImportResult): Set<string> {
    const allowed = allowedCategories(source);
    const chosen = new Set<string>();
    let count = 0;
    source.categories.forEach((category, categoryIndex) => {
      if (!allowed.has(categoryIndex)) return;
      category.items.forEach((_row, itemIndex) => {
        if (count >= itemSlots) return;
        chosen.add(`${categoryIndex}:${itemIndex}`);
        count++;
      });
    });
    return chosen;
  }

  function resetToPick() {
    runRef.current++;
    setStep("pick");
    setStage(0);
    setError(null);
    setResult(null);
    setSelection(new Set());
    setFileName("");
    setPhotoTarget(0);
    setBusy(false);
    window.setTimeout(() => fileInputRef.current?.focus(), 0);
  }

  function handleClose() {
    if (busy) return;
    runRef.current++;
    onClose();
  }

  async function handleFile(file: File) {
    const problem = menuPdfError(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFileName(file.name);
    setStage(0);
    setStep("reading");
    const run = ++runRef.current;
    try {
      const found = await mockExtractMenuFromPdf({
        file,
        businessType,
        onStage: (next) => {
          if (runRef.current === run) setStage(next);
        },
      });
      if (runRef.current !== run) return;
      setResult(found);
      setSelection(initialSelection(found));
      setStep("review");
    } catch (caught) {
      if (runRef.current !== run) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "That PDF could not be read. Try another file.",
      );
      setStep("pick");
    }
  }

  function toggleItem(key: string, checked: boolean) {
    setSelection((current) => {
      const next = new Set(current);
      if (!checked) {
        next.delete(key);
        return next;
      }
      if (next.size >= itemSlots) return current;
      next.add(key);
      return next;
    });
  }

  const selectedCount = selection.size;
  const photoRoom = usage
    ? Math.max(0, Math.min(usage.remaining, usage.dailyRemaining))
    : 0;
  const plannedPhotos = Math.min(selectedCount, photoRoom);
  const tableLimit =
    menuItemLimit === null ? "Unlimited" : limitLabel(menuItemLimit);

  async function applyImport() {
    if (!result || busy || selectedCount === 0) return;
    setBusy(true);
    setError(null);
    const run = ++runRef.current;
    setPhotoTarget(plannedPhotos);
    setStep("photos");

    let images: MenuImage[] = [];
    if (plannedPhotos > 0) {
      const batch = reserveAiImageBatch(aiAllowance, plannedPhotos);
      if (batch.ok && batch.count > 0) {
        try {
          images = await mockGenerateImportPhotos(batch.count);
        } catch {
          refundAiImage(batch.ticket);
          images = [];
        }
      }
    }
    if (runRef.current !== run) return;

    let photoIndex = 0;
    const imported = result.categories
      .map((category, categoryIndex) => ({
        name: category.name,
        items: category.items
          .filter((_row, itemIndex) =>
            selection.has(`${categoryIndex}:${itemIndex}`),
          )
          .map((row) => {
            const image = photoIndex < images.length ? images[photoIndex] : null;
            if (image) photoIndex++;
            return { ...row, image };
          }),
      }))
      .filter((category) => category.items.length > 0);

    const merged = mergeImportedMenu(existingMenu, imported, menuItemLimit);
    if (runRef.current !== run) return;
    onUsageChange();
    setBusy(false);
    onApply(merged.menu, {
      addedItems: merged.addedItems,
      addedCategories: merged.addedCategories,
      photoCount: images.length,
      fileName: result.fileName,
      skippedItems: merged.skippedItems,
    });
    onClose();
  }

  // ---------------------------------------------------------------- footer
  let footer: ReactNode = null;
  if (step === "pick" || step === "reading") {
    footer = (
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
    );
  } else if (step === "review") {
    footer = (
      <>
        <Button variant="secondary" onClick={resetToPick}>
          Choose another PDF
        </Button>
        <Button
          onClick={() => void applyImport()}
          disabled={busy || selectedCount === 0}
        >
          {busy ? <Spinner className="mr-2" /> : null}
          Add {selectedCount} {selectedCount === 1 ? "item" : "items"}
        </Button>
      </>
    );
  }

  const allowed = result ? allowedCategories(result) : new Set<number>();
  const photosUsedUp = usage !== null && photoRoom === 0;
  const planSlotsLeft =
    menuItemLimit === null
      ? null
      : Math.max(0, itemSlots - selectedCount);

  return (
    <Modal
      open={open}
      title={
        step === "review"
          ? "Check your menu"
          : step === "photos"
            ? "Creating dish photos"
            : "Upload your menu PDF"
      }
      onClose={handleClose}
      panelClassName="sm:max-w-[640px]"
      footer={footer}
    >
      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      {step === "pick" ? (
        <div className="flex flex-col gap-3">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            className={`rounded-card border border-dashed px-4 py-6 text-center ${
              dragOver
                ? "border-brand-blue bg-brand-blue/5"
                : "border-black/15 bg-surface-muted/40"
            }`}
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-blue shadow-soft">
              <UploadIcon size={20} />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ink">
              Drop your menu PDF here
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              or choose the file from your device
            </p>
            <input
              ref={fileInputRef}
              id="menu-pdf-input"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleFile(file);
              }}
            />
            <label
              htmlFor="menu-pdf-input"
              className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-control bg-brand-blue px-lg text-[14px] font-medium text-white hover:bg-brand-navy focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-2"
            >
              Choose PDF
            </label>
            <p className="mt-2 text-[11px] text-ink-muted">
              One PDF, up to {Math.round(MAX_MENU_PDF_BYTES / (1024 * 1024))} MB.
            </p>
          </div>

          <div className="rounded-card border border-black/10 bg-white p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
              <SparklesIcon size={14} className="text-brand-blue" />
              What AI does for you
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] text-ink-muted">
              <li>Finds every list, dish, price and detail in the PDF.</li>
              <li>Writes short descriptions and tags where they help.</li>
              <li>Creates a photo for each dish, within your plan.</li>
              <li>Shows everything for review before anything is added.</li>
            </ul>
          </div>

          <p className="rounded-control bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Demo build: the AI reading step is simulated here, so you will see a
            sample menu for your business type. Upload, review, plan limits,
            photos and Save work exactly as they will in production.
          </p>
        </div>
      ) : null}

      {step === "reading" ? (
        <div>
          <ul className="space-y-2">
            {MENU_IMPORT_STAGES.map((label, index) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[13px]"
                aria-current={index === stage ? "step" : undefined}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {index < stage ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <svg
                        viewBox="0 0 16 16"
                        width={12}
                        height={12}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 8.5 6.5 12 13 4" />
                      </svg>
                    </span>
                  ) : index === stage ? (
                    <Spinner className="text-brand-blue" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-black/15" />
                  )}
                </span>
                <span
                  className={
                    index <= stage ? "text-ink" : "text-ink-muted"
                  }
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 truncate text-[12px] text-ink-muted">
            Reading {fileName}…
          </p>
        </div>
      ) : null}

      {step === "review" && result ? (
        <div>
          <p className="rounded-control bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Demo extraction: these sample dishes match your business type. In
            production our AI reads the uploaded PDF instead.
          </p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="truncate text-[13px] text-ink">
              <span className="font-medium">{result.fileName}</span>
              <span className="text-ink-muted">
                {" "}
                · {result.itemCount} items in {result.categories.length} lists
              </span>
            </p>
            <p className="text-[12px] text-ink-muted">
              {selectedCount} selected
            </p>
          </div>
          <p className="mt-1 text-[12px] text-ink-muted">
            Uncheck anything you do not want. Every item stays editable after it
            is added.
          </p>

          <div className="mt-3 max-h-[45vh] overflow-y-auto rounded-card border border-black/10">
            {result.categories.map((category, categoryIndex) => {
              const listAllowed = allowed.has(categoryIndex);
              return (
                <div
                  key={`${category.name}-${categoryIndex}`}
                  className="border-b border-black/10 p-3 last:border-b-0"
                >
                  <p className="text-[12px] font-medium text-ink-muted">
                    {category.name}
                    {!listAllowed ? (
                      <span className="font-normal text-red-700">
                        {" "}
                        · cannot be added ({MAX_MENU_CATEGORIES}-list limit)
                      </span>
                    ) : null}
                  </p>
                  <ul className="mt-1 space-y-1.5">
                    {category.items.map((row, itemIndex) => {
                      const key = `${categoryIndex}:${itemIndex}`;
                      const checked = selection.has(key);
                      const atLimit =
                        !checked &&
                        Number.isFinite(itemSlots) &&
                        selectedCount >= itemSlots;
                      const disabled = !listAllowed || atLimit;
                      return (
                        <li key={key}>
                          <label
                            className={`flex items-start gap-2 ${
                              disabled
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={(event) =>
                                toggleItem(key, event.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue"
                            />
                            <span className="min-w-0 text-[13px] text-ink">
                              <span className="font-medium">{row.name}</span>
                              {row.price ? (
                                <span className="text-ink-muted">
                                  {" "}
                                  · {row.price}
                                </span>
                              ) : null}
                              {row.tag ? (
                                <span className="ml-1.5 inline-flex items-center rounded-pill bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                  {row.tag}
                                </span>
                              ) : null}
                              {row.details ? (
                                <span className="mt-0.5 block text-[12px] text-ink-muted">
                                  {row.details}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-2 space-y-1 text-[12px] text-ink-muted">
            <p>
              Plan: {planName} · {tableLimit} menu items on this page
              {planSlotsLeft !== null && planSlotsLeft > 0
                ? ` (${planSlotsLeft} more allowed)`
                : null}
              .
            </p>
            <p>
              {photosUsedUp
                ? `Your ${planName} AI photo allowance is used up, so these will be added without photos.`
                : `${plannedPhotos} of ${selectedCount} selected ${
                    selectedCount === 1 ? "item gets" : "items get"
                  } an AI photo${plannedPhotos === 1 ? "" : "s"} (${photoRoom} left on ${planName}).`}
            </p>
            {Number.isFinite(itemSlots) && selectedCount >= itemSlots ? (
              <p className="text-amber-800">
                Plan item limit reached. Uncheck a dish or upgrade for more.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "photos" ? (
        <div className="py-6 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center text-brand-blue">
            <Spinner className="h-7 w-7" />
          </span>
          <p className="mt-3 text-[13px] font-medium text-ink">
            Creating {photoTarget} AI{" "}
            {photoTarget === 1 ? "photo" : "photos"}…
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            Your menu is added right after. Keep this window open.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

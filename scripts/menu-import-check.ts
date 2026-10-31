/**
 * Runtime check for the menu PDF import (no test runner in this repo yet).
 * Run:  npx tsx scripts/menu-import-check.ts
 * Exits with code 1 if any check fails.
 */
import {
  demoMenuForType,
  MAX_MENU_PDF_BYTES,
  menuPdfError,
  mergeImportedMenu,
  mockExtractMenuFromPdf,
} from "../lib/menu-import";
import {
  mockGenerateImportPhotos,
  readAiImageUsage,
  refundAiImage,
  reserveAiImageBatch,
} from "../lib/mock/ai-images";
import {
  isValidMenuImage,
  MAX_MENU_CATEGORIES,
} from "../lib/validation/page-config";
import {
  MAX_MENU_CATEGORY_NAME_LENGTH,
  MAX_MENU_ITEM_DETAILS_LENGTH,
  MAX_MENU_ITEM_NAME_LENGTH,
  MAX_MENU_ITEM_PRICE_LENGTH,
  MENU_TAGS,
} from "../lib/customer-page";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MenuRow } from "../components/dashboard/menu-and-hours";
import { MenuImportDialog } from "../components/dashboard/menu-import-dialog";
import { emptyPageConfig } from "../lib/mock/customer-page";
import type { MenuConfig } from "../lib/mock/customer-page";
import type { BusinessType } from "../lib/brand/tokens";

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) passed++;
  else {
    failed++;
    console.error("FAIL:", name, extra ?? "");
  }
}

const TYPES: BusinessType[] = ["cafe", "restaurant", "salon", "gym", "retail", "other"];

// --- PDF validation
const pdf = (size: number, type = "application/pdf", name = "menu.pdf") => ({
  name,
  size,
  type,
});
check("valid PDF", menuPdfError(pdf(1024)) === null);
check("wrong extension", menuPdfError(pdf(1024, "image/png", "menu.png")) !== null);
check("wrong mime", menuPdfError(pdf(1024, "image/png")) !== null);
check("empty file", menuPdfError(pdf(0)) !== null);
check("oversized", menuPdfError(pdf(MAX_MENU_PDF_BYTES + 1)) !== null);

// --- Demo data is inside every menu rule, for every business type
for (const type of TYPES) {
  const categories = demoMenuForType(type);
  check(`${type}: has lists`, categories.length > 0);
  check(`${type}: list cap`, categories.length <= MAX_MENU_CATEGORIES);
  for (const category of categories) {
    check(
      `${type}: list name ${category.name}`,
      category.name.length > 0 && category.name.length <= MAX_MENU_CATEGORY_NAME_LENGTH,
    );
    check(`${type}: list has items ${category.name}`, category.items.length > 0);
    for (const item of category.items) {
      check(
        `${type}: item name ${item.name}`,
        item.name.trim().length > 0 && item.name.length <= MAX_MENU_ITEM_NAME_LENGTH,
      );
      check(
        `${type}: price ${item.name}`,
        item.price.length <= MAX_MENU_ITEM_PRICE_LENGTH,
      );
      check(
        `${type}: details ${item.name}`,
        item.details.length <= MAX_MENU_ITEM_DETAILS_LENGTH,
      );
      check(
        `${type}: tag ${item.name}`,
        item.tag === null || (MENU_TAGS as readonly string[]).includes(item.tag),
      );
    }
  }
}

// --- Merge: all fit, plan limit, list cap, same-name lists, no mutation
const empty: MenuConfig = { categories: [] };
const imported = demoMenuForType("cafe");
const original = JSON.stringify(imported);
const all = mergeImportedMenu(empty, imported, 60);
check("merge adds every item", all.addedItems === 8, all.addedItems);
check("merge adds every list", all.addedCategories === 3, all.addedCategories);
check("merge keeps source untouched", JSON.stringify(imported) === original);

const capped = mergeImportedMenu(empty, imported, 5);
check("plan limit respected", capped.addedItems === 5, capped.addedItems);
check("plan limit skips the rest", capped.skippedItems === 3, capped.skippedItems);

const sameName: MenuConfig = {
  categories: [{ name: "  COFFEE AND TEA ", items: [
    { name: "Existing", price: "", details: "", tag: null, sold_out: false },
  ] }],
};
const mergedSame = mergeImportedMenu(sameName, imported, 60);
check(
  "same-name list is appended to",
  mergedSame.menu.categories.length === 3 &&
    mergedSame.menu.categories[0].items.length === 4,
  mergedSame.menu.categories.map((c) => [c.name, c.items.length]),
);
check("same-name list keeps its name", mergedSame.menu.categories[0].name === "  COFFEE AND TEA ");

const full: MenuConfig = {
  categories: Array.from({ length: 12 }, (_, i) => ({
    name: `List ${i + 1}`,
    items: [],
  })),
};
const overCap = mergeImportedMenu(full, imported, null);
check("list cap respected", overCap.menu.categories.length === 12);
check("extra lists reported", overCap.addedCategories === 0 && overCap.skippedCategories === 3);

const weak = mergeImportedMenu(
  empty,
  [
    {
      name: "Injected",
      items: [
        {
          name: "Dish",
          price: "",
          details: "",
          tag: "NotATag" as never,
          sold_out: false,
          image: { key: "not a valid key", variant: 9, ai: true },
        },
      ],
    },
  ],
  null,
);
check("bad tag removed", weak.menu.categories[0].items[0].tag === null);
check("bad image removed", weak.menu.categories[0].items[0].image === null);

// --- Mock extraction returns the same shape after the stages
async function extractionCheck() {
  const stages: number[] = [];
  const result = await mockExtractMenuFromPdf({
    file: new File(["%PDF-1.4 fake"], "dinner-menu.pdf", {
      type: "application/pdf",
    }),
    businessType: "restaurant",
    onStage: (stage) => stages.push(stage),
  });
  check("extract reports stages", stages.length === 5, stages);
  check("extract keeps file name", result.fileName === "dinner-menu.pdf");
  check("extract is labelled demo", result.demo === true);
  check("extract item count matches", result.itemCount === 8, result.itemCount);
}

// --- Batch credits: plan, day cap, refund
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
  setTimeout,
};

function creditsCheck() {
  const allowance = { limit: 15, period: "month" as const };
  const first = reserveAiImageBatch(allowance, 8);
  check("batch takes requested credits", first.ok && first.count === 8, first);
  const after = readAiImageUsage(allowance);
  check("usage shows the batch", after.remaining === 7, after.remaining);
  if (first.ok) refundAiImage(first.ticket);
  const refunded = readAiImageUsage(allowance);
  check("batch refund restores every credit", refunded.remaining === 15, refunded.remaining);

  const cappedBatch = reserveAiImageBatch(allowance, 20);
  check(
    "batch respects the daily cap",
    cappedBatch.ok && cappedBatch.count === 10 && cappedBatch.limitedBy === "daily_cap",
    cappedBatch,
  );

  const usedUp = reserveAiImageBatch({ limit: 0, period: "lifetime" }, 3);
  check("no credits means no batch", !usedUp.ok && usedUp.reason === "no_credits");
}

// --- The Menu row renders BOTH entry paths on an empty menu
function renderCheck() {
  // The repo keeps Next's `jsx: preserve`; tsx therefore runs the classic
  // runtime, which needs React in scope. Next itself does this for us.
  (globalThis as unknown as { React: unknown }).React = React;
  const config = emptyPageConfig();
  config.buttons.menu.on = true;
  const html = renderToStaticMarkup(
    React.createElement(MenuRow, {
      businessType: "cafe",
      config,
      onPatchButtons: () => {},
      onPatchMenu: () => {},
      menuItemLimit: 10,
      aiAllowance: { limit: 3, period: "lifetime" },
      planName: "Free",
      highlight: null,
    }),
  );
  check("menu row shows the Upload PDF tab", html.includes("Upload PDF"));
  check("menu row shows the Type manually tab", html.includes("Type manually"));
  check("empty menu opens on the upload panel", html.includes("Upload menu PDF"));
  check("upload panel explains the AI flow", html.includes("Let AI build"));

  const dialog = renderToStaticMarkup(
    React.createElement(MenuImportDialog, {
      open: true,
      businessType: "cafe",
      existingMenu: { categories: [] },
      menuItemLimit: 10,
      aiAllowance: { limit: 3, period: "lifetime" },
      planName: "Free",
      onApply: () => {},
      onClose: () => {},
      onUsageChange: () => {},
    }),
  );
  check("dialog shows the file picker", dialog.includes("Choose PDF"));
  check("dialog labels the demo extraction", dialog.includes("Demo build"));
  check("dialog explains the next steps", dialog.includes("What AI does for you"));
}

async function photosCheck() {
  const images = await mockGenerateImportPhotos(3);
  check("batch returns three photos", images.length === 3);
  check("batch photos are valid references", images.every(isValidMenuImage));
  check(
    "batch photos vary their plating",
    images.map((image) => image.variant).join(",") === "0,1,2",
  );
}

async function main() {
  await extractionCheck();
  creditsCheck();
  renderCheck();
  await photosCheck();
  if (failed > 0) {
    console.error(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`${passed} checks passed`);
}

void main();

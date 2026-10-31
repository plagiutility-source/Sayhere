/**
 * Menu PDF import — rules, the Stage 1 demo extractor and the merge helper.
 *
 * MOCK ONLY: Stage 1 has no backend and no AI key, so
 * `mockExtractMenuFromPdf` waits through the real progress stages and returns a
 * sample menu for the business type. It is labelled as a demo in the dialog.
 *
 * Stage 4 replaces ONE function (`mockExtractMenuFromPdf`) with a `fetch` to
 * `POST /api/menu-import`, which will send the PDF to the provider and return
 * the same `MenuImportResult` shape after zod validation. Everything else
 * (review, plan limits, merging) stays exactly as it is. See
 * AI_MENU_PHOTOS.md for the provider cost rules.
 *
 * No React, no browser APIs: safe to call from a route handler and testable
 * on its own.
 */

import type { BusinessType } from "@/lib/brand/tokens";
import {
  MENU_TAGS,
  MAX_MENU_CATEGORY_NAME_LENGTH,
  MAX_MENU_ITEM_DETAILS_LENGTH,
  MAX_MENU_ITEM_NAME_LENGTH,
  MAX_MENU_ITEM_PRICE_LENGTH,
  stripUnsafeText,
} from "@/lib/customer-page";
import type {
  MenuConfig,
  MenuImage,
  MenuItem,
  MenuTag,
} from "@/lib/mock/customer-page";
import {
  isValidMenuImage,
  MAX_MENU_CATEGORIES,
  namedMenuItemCount,
} from "@/lib/validation/page-config";

/** Hard limits for an uploaded menu PDF. */
export const MAX_MENU_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

export type MenuPdfLike = { name: string; size: number; type: string };

/** Why this file cannot be read, or null when it can. */
export function menuPdfError(file: MenuPdfLike): string | null {
  if (!/\.pdf$/i.test(file.name.trim())) {
    return "Choose a PDF file.";
  }
  if (
    file.type &&
    file.type !== "application/pdf" &&
    file.type !== "application/x-pdf" &&
    file.type !== "application/octet-stream"
  ) {
    return "Choose a PDF file.";
  }
  if (file.size <= 0) return "That PDF is empty.";
  if (file.size > MAX_MENU_PDF_BYTES) return "PDFs up to 8 MB, please.";
  return null;
}

/** The progress stages the owner sees while the PDF is read. */
export const MENU_IMPORT_STAGES = [
  "Reading your PDF",
  "Finding dishes and prices",
  "Grouping them into lists",
  "Writing short descriptions",
  "Matching photos to dishes",
] as const;

export type ImportedMenuItem = Omit<MenuItem, "image"> & {
  image?: MenuImage | null;
};
export type ImportedMenuCategory = {
  name: string;
  items: ImportedMenuItem[];
};

export type MenuImportResult = {
  fileName: string;
  fileSize: number;
  categories: ImportedMenuCategory[];
  itemCount: number;
  /** This build returns sample data instead of calling a provider. */
  demo: true;
};

/** One space-normalised, control-stripped string no longer than its limit. */
function clamp(input: string, max: number): string {
  return stripUnsafeText(input).replace(/\s+/g, " ").trim().slice(0, max);
}

function item(
  name: string,
  price: string,
  details: string,
  tag: MenuTag | null = null,
): ImportedMenuItem {
  return { name, price, details, tag, sold_out: false };
}

/**
 * Sample menus per business type, shaped like what the real extractor
 * returns. Names, limits and tags match PRD 5.5.6 and `MENU_TAGS`.
 */
const DEMO_MENUS: Record<BusinessType, ImportedMenuCategory[]> = {
  cafe: [
    {
      name: "Coffee and tea",
      items: [
        item("Filter coffee", "₹120", "South Indian style, frothed milk", "Popular"),
        item("Masala chai", "₹60", "Black tea, milk, ginger and cardamom"),
        item("Cold brew", "₹180", "Slow-steeped 18 hours, served over ice", "New"),
      ],
    },
    {
      name: "Breakfast",
      items: [
        item("Masala dosa", "₹140", "Crisp rice crepe, potato masala, sambar and chutney", "Veg"),
        item("Avocado toast", "₹220", "Sourdough, smashed avocado, chilli and lime", "Veg"),
      ],
    },
    {
      name: "Bakes",
      items: [
        item("Butter croissant", "₹110", "Laminated 24 hours, baked every morning", "Popular"),
        item("Chocolate brownie", "₹150", "Dark chocolate, fudgy centre, walnut"),
        item("Banana bread", "₹130", "Toasted, served with salted butter"),
      ],
    },
  ],
  restaurant: [
    {
      name: "Starters",
      items: [
        item("Paneer tikka", "₹280", "Charred paneer, capsicum and onion, mint chutney", "Veg"),
        item("Chicken 65", "₹320", "Crisp fried chicken, curry leaf and red chilli", "Spicy"),
      ],
    },
    {
      name: "Mains",
      items: [
        item("Dal makhani", "₹260", "Black lentils simmered overnight with butter", "Veg"),
        item("Butter chicken", "₹380", "Tandoori chicken in a tomato and cream gravy", "Popular"),
        item("Veg biryani", "₹300", "Basmati rice, vegetables, saffron and fried onion", "Veg"),
      ],
    },
    {
      name: "Breads and rice",
      items: [
        item("Garlic naan", "₹70", "Tandoor-baked, garlic and coriander butter"),
        item("Jeera rice", "₹180", "Basmati rice tossed with cumin"),
      ],
    },
    {
      name: "Desserts",
      items: [item("Gulab jamun", "₹120", "Two warm dumplings in cardamom syrup", "Veg")],
    },
  ],
  hotel: [
    {
      name: "Breakfast",
      items: [
        item("Aloo paratha", "₹180", "Two parathas, curd, pickle and butter", "Veg"),
        item("Masala omelette", "₹160", "Three eggs, onion, tomato and toast"),
        item("Filter coffee", "₹90", "South Indian style, frothed milk", "Popular"),
      ],
    },
    {
      name: "Mains",
      items: [
        item("Club sandwich", "₹260", "Triple-decker, fries and salad", "Popular"),
        item("Dal khichdi", "₹220", "Rice, lentils, ghee and pickle", "Veg"),
        item("Chicken biryani", "₹340", "Basmati rice, chicken, saffron and fried onion"),
      ],
    },
    {
      name: "Laundry",
      items: [
        item("Shirt wash and press", "₹80", "Returned the same day before 6 pm"),
        item("Trouser dry clean", "₹150", "Dry cleaned and pressed"),
      ],
    },
    {
      name: "Spa",
      items: [
        item("Head massage", "₹600", "30 minutes, warm oil"),
        item("Foot reflexology", "₹800", "45 minutes"),
      ],
    },
  ],
  salon: [
    {
      name: "Hair",
      items: [
        item("Haircut", "₹500", "Wash, cut and blow-dry", "Popular"),
        item("Hair spa", "₹1200", "Deep-conditioning mask and scalp massage"),
        item("Keratin treatment", "₹4500", "Frizz control for up to four months"),
      ],
    },
    {
      name: "Colour",
      items: [
        item("Global colour", "₹3500", "Full-head ammonia-free colour", "New"),
        item("Root touch-up", "₹1800", "Colour refresh on regrowth"),
      ],
    },
    {
      name: "Grooming",
      items: [
        item("Beard trim", "₹250", "Shape, line-up and hot towel"),
        item("Clean-up", "₹700", "Exfoliation, steam and face massage"),
      ],
    },
    {
      name: "Packages",
      items: [item("Bridal package", "₹8000", "Trial, hair styling and makeup", "Popular")],
    },
  ],
  gym: [
    {
      name: "Memberships",
      items: [
        item("Monthly membership", "₹2000", "Full gym access, one month", "Popular"),
        item("Quarterly membership", "₹5000", "Full gym access for three months"),
      ],
    },
    {
      name: "Personal training",
      items: [
        item("Single session", "₹800", "One hour with a certified trainer"),
        item("10-session pack", "₹7000", "Ten one-hour sessions, valid 60 days"),
      ],
    },
    {
      name: "Classes",
      items: [
        item("Yoga (monthly)", "₹1500", "Six sessions a week, beginner friendly", "New"),
        item("Zumba (monthly)", "₹1800", "High-energy group classes"),
      ],
    },
    {
      name: "Passes",
      items: [
        item("Day pass", "₹300", "One day of gym access"),
        item("Week pass", "₹1200", "Seven days of gym access"),
      ],
    },
  ],
  retail: [
    {
      name: "Bags",
      items: [
        item("Cotton tote", "₹499", "Heavy canvas, screen printed", "Popular"),
        item("Leather wallet", "₹1299", "Full-grain leather, six card slots"),
      ],
    },
    {
      name: "Apparel",
      items: [
        item("Oversized tee", "₹899", "240 GSM cotton, unisex fit"),
        item("Denim jacket", "₹2499", "Washed indigo, relaxed fit", "New"),
      ],
    },
    {
      name: "Accessories",
      items: [
        item("Cap", "₹599", "Adjustable strap, embroidered logo"),
        item("Socks", "₹299", "Pack of three, combed cotton"),
      ],
    },
    {
      name: "Gifts",
      items: [
        item("Gift card", "₹1000", "Valid for six months in store"),
        item("Gift wrapping", "₹99", "Kraft paper, ribbon and a note"),
      ],
    },
  ],
  other: [
    {
      name: "Services",
      items: [
        item("Consultation", "₹500", "45-minute session, in studio", "Popular"),
        item("Home visit", "₹800", "Within 10 km, by appointment"),
      ],
    },
    {
      name: "Packages",
      items: [
        item("Monthly plan", "₹2500", "Four sessions a month"),
        item("Quarterly plan", "₹6500", "Twelve sessions, valid 90 days", "New"),
      ],
    },
    {
      name: "Extras",
      items: [
        item("Priority slot", "₹300", "Same-day appointment"),
        item("Follow-up call", "₹200", "15-minute review call"),
        item("Report copy", "₹150", "Printed summary"),
        item("Annual plan", "₹22000", "Unlimited sessions, fair use"),
      ],
    },
  ],
};

/** A fresh, clamped copy of the demo menu for this business type. */
export function demoMenuForType(type: BusinessType): ImportedMenuCategory[] {
  return DEMO_MENUS[type]
    .map((category) => ({
      name: clamp(category.name, MAX_MENU_CATEGORY_NAME_LENGTH),
      items: category.items
        .map((row) => ({
          ...row,
          name: clamp(row.name, MAX_MENU_ITEM_NAME_LENGTH),
          price: clamp(row.price, MAX_MENU_ITEM_PRICE_LENGTH),
          details: clamp(row.details, MAX_MENU_ITEM_DETAILS_LENGTH),
        }))
        .filter((row) => row.name.length > 0),
    }))
    .filter((category) => category.name.length > 0 && category.items.length > 0);
}

/**
 * MOCK ONLY — Stage 4 swaps the body for a server call with no other change:
 *
 *   const form = new FormData();
 *   form.append("file", file);
 *   const response = await fetch("/api/menu-import", { method: "POST", body: form });
 *
 * The returned values must be treated as untrusted and re-validated even then;
 * `mergeImportedMenu` already clamps every field and checks every tag.
 */
export async function mockExtractMenuFromPdf(input: {
  file: File;
  businessType: BusinessType;
  /** Called with the index of the stage now running. */
  onStage?: (stage: number) => void;
}): Promise<MenuImportResult> {
  const problem = menuPdfError(input.file);
  if (problem) throw new Error(problem);

  const stageMs = [650, 600, 550, 550, 500];
  for (let stage = 0; stage < MENU_IMPORT_STAGES.length; stage++) {
    input.onStage?.(stage);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, stageMs[stage] ?? 500);
    });
  }

  const categories = demoMenuForType(input.businessType);
  return {
    fileName: input.file.name,
    fileSize: input.file.size,
    categories,
    itemCount: categories.reduce((sum, category) => sum + category.items.length, 0),
    demo: true,
  };
}

export type MenuMergeResult = {
  menu: MenuConfig;
  addedItems: number;
  addedCategories: number;
  /** Items the plan limit or the 12-list cap did not allow. */
  skippedItems: number;
  /** Whole lists the 12-list cap did not allow. */
  skippedCategories: number;
};

/**
 * Merges an imported menu into the current one WITHOUT mutating either.
 *
 * - Lists with the same name (case-insensitive) are appended to, not duplicated.
 * - Never more than `MAX_MENU_CATEGORIES` lists.
 * - `limit` is the plan's menu-item limit (null = unlimited); items past it are
 *   skipped, never silently counted.
 * - Every string is re-clamped, every tag re-checked and every photo reference
 *   re-validated, because imported data is untrusted.
 */
export function mergeImportedMenu(
  current: MenuConfig,
  imported: ImportedMenuCategory[],
  limit: number | null,
): MenuMergeResult {
  const menu: MenuConfig = {
    categories: current.categories.map((category) => ({
      name: category.name,
      items: category.items.map((row) => ({ ...row })),
    })),
  };
  let named = namedMenuItemCount(menu);
  let addedItems = 0;
  let addedCategories = 0;
  let skippedItems = 0;
  let skippedCategories = 0;

  for (const incoming of imported) {
    const name = clamp(incoming.name, MAX_MENU_CATEGORY_NAME_LENGTH);
    if (!name) continue;
    const rows = incoming.items.filter(
      (row) => clamp(row.name, MAX_MENU_ITEM_NAME_LENGTH).length > 0,
    );
    if (rows.length === 0) continue;

    let target = menu.categories.find(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
    );
    const isNew = !target;
    if (!target) {
      if (menu.categories.length >= MAX_MENU_CATEGORIES) {
        skippedCategories++;
        skippedItems += rows.length;
        continue;
      }
      target = { name, items: [] };
    }

    let addedHere = 0;
    for (const row of rows) {
      const itemName = clamp(row.name, MAX_MENU_ITEM_NAME_LENGTH);
      if (limit !== null && named >= limit) {
        skippedItems++;
        continue;
      }
      const tag =
        row.tag && (MENU_TAGS as readonly string[]).includes(row.tag)
          ? row.tag
          : null;
      target.items.push({
        name: itemName,
        price: clamp(row.price, MAX_MENU_ITEM_PRICE_LENGTH),
        details: clamp(row.details, MAX_MENU_ITEM_DETAILS_LENGTH),
        tag,
        sold_out: Boolean(row.sold_out),
        image: isValidMenuImage(row.image) ? row.image : null,
      });
      named++;
      addedItems++;
      addedHere++;
    }

    if (isNew && addedHere > 0) {
      menu.categories.push(target);
      addedCategories++;
    }
  }

  return { menu, addedItems, addedCategories, skippedItems, skippedCategories };
}


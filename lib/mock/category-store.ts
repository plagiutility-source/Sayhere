/**
 * MOCK ONLY, removed in Stage 4.
 *
 * The category lock written when the owner confirms the full-screen popup,
 * *before* onboarding finishes. The real product calls an API (K9) that writes
 * the category onto the business row; the database trigger then locks it.
 *
 * Key: `syehere.mock.category.v1`. A lock is only accepted when it names one of
 * the 3 categories AND the stored typed text matches that category's display
 * name, so editing localStorage by hand cannot unlock or fake a category
 * (it falls back to `null`, and every rule then behaves as `general`).
 */

import { categoryTextMatches } from "@/lib/category/confirm";
import {
  CATEGORY_LABELS,
  type BusinessCategory,
} from "@/lib/category/types";

export const CATEGORY_LOCK_STORAGE_KEY = "syehere.mock.category.v1";

export type CategoryLock = {
  category: BusinessCategory;
  /** What the owner typed in the popup (audit only; never log it). */
  typedText: string;
  /** ISO timestamp of the confirm click. */
  confirmedAt: string;
};

/** Memory fallback when localStorage is unavailable or full. */
let memoryLock: CategoryLock | null = null;

function isCategory(value: unknown): value is BusinessCategory {
  return value === "food" || value === "hotel" || value === "general";
}

function parseLock(raw: unknown): CategoryLock | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (!isCategory(row.category)) return null;
  if (typeof row.typedText !== "string") return null;
  if (typeof row.confirmedAt !== "string") return null;
  if (!categoryTextMatches(row.category, row.typedText)) return null;
  return {
    category: row.category,
    typedText: row.typedText,
    confirmedAt: row.confirmedAt,
  };
}

/**
 * Lock a category. Returns `null` (and writes nothing) when the category is
 * unknown or the typed text does not match the display name.
 */
export function lockCategory({
  category,
  typedText,
  confirmedAt,
}: {
  category: unknown;
  typedText: string;
  confirmedAt: Date | string;
}): CategoryLock | null {
  if (!isCategory(category)) return null;
  if (!categoryTextMatches(category, typedText)) return null;
  const lock: CategoryLock = {
    category,
    typedText,
    confirmedAt:
      typeof confirmedAt === "string" ? confirmedAt : confirmedAt.toISOString(),
  };
  memoryLock = lock;
  if (typeof window === "undefined") return lock;
  try {
    window.localStorage.setItem(CATEGORY_LOCK_STORAGE_KEY, JSON.stringify(lock));
  } catch {
    // Keep it for this session; the owner still cannot change it in the UI.
  }
  return lock;
}

/** The saved lock, or `null` when there is none / it is unreadable. */
export function readCategoryLock(): CategoryLock | null {
  if (memoryLock) return memoryLock;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATEGORY_LOCK_STORAGE_KEY);
    if (!raw) return null;
    return parseLock(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Developer reset for testing another category: `/onboarding?demoReset=1`.
 * MOCK ONLY, removed in Stage 4. Never works in production. The real product
 * has no reset (only Syehere support can fix a wrong category).
 */
export function clearCategoryLockForDev(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  memoryLock = null;
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.removeItem(CATEGORY_LOCK_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Display name for a lock (used by the completion screen and Settings). */
export function lockLabel(lock: CategoryLock): string {
  return CATEGORY_LABELS[lock.category];
}

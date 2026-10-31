"use client";

/**
 * The Menu builder and the Hours and contact row for the customer-page editor
 * (PRD.md 5.5.6/5.5.7, customer-page-ui-spec.md 2.3/2.5, business-rules.md
 * section 11). All limits come from the docs and live in one place
 * (`lib/validation/page-config.ts` + `lib/mock/plans.ts`); nothing is typed
 * into this file.
 *
 * Over-limit after a downgrade (rules 11.5): nothing is deleted, the count is
 * shown, Save is blocked by the editor, and the public page (and this preview)
 * show only the first N named items.
 */

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { ClockIcon, ListIcon } from "@/components/customer-page/icons";
import { MenuPhoto } from "@/components/menu-photo";
import type { BusinessType } from "@/lib/brand/tokens";
import {
  MAX_MENU_CATEGORY_NAME_LENGTH,
  MAX_MENU_ITEM_DETAILS_LENGTH,
  MAX_MENU_ITEM_NAME_LENGTH,
  MAX_MENU_ITEM_PRICE_LENGTH,
  MENU_TAGS,
  menuLabel,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "@/lib/customer-page";
import { readAiImageUsage, type AiImageUsage } from "@/lib/mock/ai-images";
import type {
  DayHours,
  MenuCategory,
  MenuConfig,
  MenuImage,
  MenuItem,
  MenuTag,
  PageConfig,
  Weekday,
} from "@/lib/mock/customer-page";
import { limitLabel, type AiImageAllowance } from "@/lib/mock/plans";
import {
  addressError,
  hoursNoteError,
  MAX_HOURS_NOTE_LENGTH,
  MAX_MAPS_ADDRESS_LENGTH,
  isValidMenuImage,
  MAX_MENU_CATEGORIES,
  namedMenuItemCount,
  phoneError,
} from "@/lib/validation/page-config";
import { MAX_MENU_PDF_BYTES } from "@/lib/menu-import";
import { ActivateButton } from "./activate-button";
import { EditorItemRow } from "./editor-item-row";
import { CloseIcon, PhotoIcon, SparklesIcon, UploadIcon } from "./icons";
import { MenuImportDialog } from "./menu-import-dialog";
import { MenuPhotoDialog } from "./menu-photo-dialog";

const TAG_OPTIONS: { value: "" | MenuTag; label: string }[] = [
  { value: "", label: "None" },
  ...MENU_TAGS.map((tag) => ({ value: tag, label: tag })),
];

// ---------------------------------------------------------------------------
// Menu / Services and prices / Products builder (PRD 5.5.6, ui-spec 2.5).
// ---------------------------------------------------------------------------

export function MenuRow({
  businessType,
  config,
  onPatchButtons,
  onPatchMenu,
  menuItemLimit,
  aiAllowance,
  planName,
  highlight,
}: {
  businessType: BusinessType;
  config: PageConfig;
  onPatchButtons: (patch: Partial<PageConfig["buttons"]>) => void;
  onPatchMenu: (menu: MenuConfig) => void;
  /** Plan menu-item limit (`null` = unlimited); from lib/mock/plans.ts. */
  menuItemLimit: number | null;
  /** Plan AI dish photo allowance; from lib/mock/plans.ts. */
  aiAllowance: AiImageAllowance;
  planName: string;
  highlight: string | null;
}) {
  const menu = config.menu;

  // MOCK ONLY, replaced in Stage 4: the AI photo ledger lives in localStorage,
  // so it is read after mount (the server render and hydration show no count).
  const [usage, setUsage] = useState<AiImageUsage | null>(null);
  const refreshUsage = useCallback(() => {
    setUsage(readAiImageUsage(aiAllowance));
  }, [aiAllowance]);
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);
  const [photoTarget, setPhotoTarget] = useState<{
    category: number;
    item: number;
  } | null>(null);
  const photoItem = photoTarget
    ? (menu.categories[photoTarget.category]?.items[photoTarget.item] ?? null)
    : null;
  const namedCount = namedMenuItemCount(menu);
  const atItemLimit = menuItemLimit !== null && namedCount >= menuItemLimit;
  const overLimit = menuItemLimit !== null && namedCount > menuItemLimit;
  const atCategoryLimit = menu.categories.length >= MAX_MENU_CATEGORIES;

  // Both entry paths (PRD 5.5.6): an AI PDF import or the manual builder.
  // An empty menu opens on the upload path; an existing one on the builder.
  const [entryMode, setEntryMode] = useState<"upload" | "manual">(() =>
    menu.categories.length > 0 ? "manual" : "upload",
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  function updateCategory(index: number, patch: Partial<MenuCategory>) {
    onPatchMenu({
      categories: menu.categories.map((category, i) =>
        i === index ? { ...category, ...patch } : category,
      ),
    });
  }

  function removeCategory(index: number) {
    onPatchMenu({
      categories: menu.categories.filter((_, i) => i !== index),
    });
  }

  function addCategory() {
    onPatchMenu({
      categories: [...menu.categories, { name: "", items: [] }],
    });
  }

  function setItemImage(
    categoryIndex: number,
    itemIndex: number,
    image: MenuImage | null,
  ) {
    const category = menu.categories[categoryIndex];
    if (!category?.items[itemIndex]) return;
    updateCategory(categoryIndex, {
      items: category.items.map((row, i) =>
        i === itemIndex ? { ...row, image } : row,
      ),
    });
  }

  function addItem(categoryIndex: number) {
    const category = menu.categories[categoryIndex];
    updateCategory(categoryIndex, {
      items: [
        ...category.items,
        { name: "", price: "", details: "", tag: null, sold_out: false },
      ],
    });
  }

  return (
    <EditorItemRow
      id="row-menu"
      icon={<ListIcon size={18} />}
      name={menuLabel(businessType)}
      badge={null}
      on={config.buttons.menu.on}
      onToggle={(next) =>
        onPatchButtons({ menu: { ...config.buttons.menu, on: next } })
      }
      highlight={highlight === "row-menu"}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-ink-muted">
            Items {namedCount} / {limitLabel(menuItemLimit)}
            {usage
              ? ` · AI photos ${usage.remaining} / ${usage.limit} left${
                  usage.period === "lifetime" ? " (trial)" : ""
                }`
              : ""}
          </p>
          {overLimit ? (
            <p className="text-[12px] font-medium text-red-700">
              Over your plan limit: upgrade or remove items ({namedCount} of{" "}
              {menuItemLimit}).
            </p>
          ) : null}
        </div>

        {atItemLimit && !overLimit ? (
          <p className="text-[12px] text-ink-muted">
            Item limit reached. Upgrade for more items.
          </p>
        ) : null}

        <div
          role="group"
          aria-label="How to add your menu"
          className="grid grid-cols-2 gap-1 rounded-control bg-surface-muted p-1"
        >
          <button
            type="button"
            aria-pressed={entryMode === "upload"}
            onClick={() => setEntryMode("upload")}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-control text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              entryMode === "upload"
                ? "bg-white text-ink shadow-soft"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <SparklesIcon size={15} />
            Upload PDF
          </button>
          <button
            type="button"
            aria-pressed={entryMode === "manual"}
            onClick={() => setEntryMode("manual")}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-control text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              entryMode === "manual"
                ? "bg-white text-ink shadow-soft"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Type manually
          </button>
        </div>

        {importStatus ? (
          <p
            role="status"
            className="rounded-control bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800"
          >
            {importStatus}
          </p>
        ) : null}

        {entryMode === "upload" ? (
          <div className="rounded-card border border-black/10 bg-surface-muted/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-blue shadow-soft">
                <SparklesIcon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">
                  Let AI build your {menuLabel(businessType).toLowerCase()}
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Upload a PDF. AI finds the lists, items and prices, writes
                  short descriptions and creates a photo for each dish. You
                  review everything before it is added.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setImportStatus(null);
                setImportOpen(true);
              }}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-control bg-brand-blue px-4 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              <UploadIcon size={16} />
              Upload menu PDF
            </button>
            <p className="mt-2 text-[12px] text-ink-muted">
              PDF up to {Math.round(MAX_MENU_PDF_BYTES / (1024 * 1024))} MB ·{" "}
              {limitLabel(menuItemLimit)} items on your plan
              {usage
                ? ` · ${usage.remaining} AI ${
                    usage.remaining === 1 ? "photo" : "photos"
                  } left`
                : ""}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              Prefer to type it yourself? Switch to “Type manually”.
            </p>
          </div>
        ) : (
          <>
        <Input
          label="Title"
          value={config.buttons.menu.title}
          maxLength={40 /* PRD 5.5.6: title max 40 */}
          onChange={(event) =>
            onPatchButtons({
              menu: { ...config.buttons.menu, title: event.target.value },
            })
          }
          hint={`Shown as “${menuLabel(businessType)}” when empty.`}
        />

        {namedCount === 0 ? (
          <p className="text-[12px] text-ink-muted">
            The Menu button stays hidden until you add at least one item.
          </p>
        ) : null}

        {menu.categories.map((category, categoryIndex) => (
          <div
            key={categoryIndex}
            className="rounded-card border border-black/10 bg-surface-muted/50 p-3"
          >
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  label={`List ${categoryIndex + 1} name`}
                  value={category.name}
                  maxLength={MAX_MENU_CATEGORY_NAME_LENGTH /* PRD 5.5.6: 40 */}
                  onChange={(event) =>
                    updateCategory(categoryIndex, { name: event.target.value })
                  }
                />
              </div>
              <button
                type="button"
                aria-label={`Remove list ${categoryIndex + 1}`}
                onClick={() => removeCategory(categoryIndex)}
                className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Remove list
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {category.items.map((item, itemIndex) => (
                <MenuItemEditor
                  key={itemIndex}
                  item={item}
                  onAddPhoto={() =>
                    setPhotoTarget({ category: categoryIndex, item: itemIndex })
                  }
                  onRemovePhoto={() =>
                    setItemImage(categoryIndex, itemIndex, null)
                  }
                  onChange={(patch) =>
                    updateCategory(categoryIndex, {
                      items: category.items.map((row, i) =>
                        i === itemIndex ? { ...row, ...patch } : row,
                      ),
                    })
                  }
                  onRemove={() =>
                    updateCategory(categoryIndex, {
                      items: category.items.filter((_, i) => i !== itemIndex),
                    })
                  }
                />
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                disabled={atItemLimit}
                onClick={() => addItem(categoryIndex)}
                className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add item
              </button>
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            disabled={atCategoryLimit}
            onClick={addCategory}
            className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add category
          </button>
          {atCategoryLimit ? (
            <p className="mt-2 text-[12px] text-ink-muted">
              You can add up to {MAX_MENU_CATEGORIES} lists.
            </p>
          ) : null}
        </div>
          </>
        )}
      </div>

      <MenuImportDialog
        open={importOpen}
        businessType={businessType}
        existingMenu={menu}
        menuItemLimit={menuItemLimit}
        aiAllowance={aiAllowance}
        planName={planName}
        onApply={(nextMenu, summary) => {
          onPatchMenu(nextMenu);
          setEntryMode("manual");
          setImportStatus(
            `Added ${summary.addedItems} ${
              summary.addedItems === 1 ? "item" : "items"
            } from ${summary.fileName}${
              summary.photoCount > 0
                ? ` with ${summary.photoCount} AI ${
                    summary.photoCount === 1 ? "photo" : "photos"
                  }`
                : " without photos"
            }${
              summary.skippedItems > 0
                ? `; ${summary.skippedItems} did not fit your plan`
                : ""
            }.`,
          );
          refreshUsage();
        }}
        onClose={() => setImportOpen(false)}
        onUsageChange={refreshUsage}
      />

      <MenuPhotoDialog
        open={photoTarget !== null && photoItem !== null}
        itemName={photoItem?.name ?? ""}
        itemDetails={photoItem?.details ?? ""}
        currentImage={photoItem?.image ?? null}
        allowance={aiAllowance}
        usage={usage}
        planName={planName}
        onUsageChange={refreshUsage}
        onApply={(image) => {
          if (photoTarget) {
            setItemImage(photoTarget.category, photoTarget.item, image);
          }
          setPhotoTarget(null);
        }}
        onClose={() => setPhotoTarget(null)}
      />
    </EditorItemRow>
  );
}

/** One menu item: name + price always, the rest behind "Add details (optional)". */
function MenuItemEditor({
  item,
  onChange,
  onRemove,
  onAddPhoto,
  onRemovePhoto,
}: {
  item: MenuItem;
  onChange: (patch: Partial<MenuItem>) => void;
  onRemove: () => void;
  onAddPhoto: () => void;
  onRemovePhoto: () => void;
}) {
  // Shown after "Add photo" is pressed on an unnamed item; hides once named.
  const [nameHint, setNameHint] = useState(false);
  const hasName = item.name.trim().length > 0;
  const image = isValidMenuImage(item.image) ? item.image : null;
  // A saved item with any detail opens expanded; a fresh one stays collapsed.
  const [detailsOpen, setDetailsOpen] = useState(
    () => Boolean(item.details || item.tag || item.sold_out),
  );

  return (
    <div className="rounded-control border border-black/10 bg-white p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-[150px] flex-1">
          <Input
            label="Item name"
            value={item.name}
            maxLength={MAX_MENU_ITEM_NAME_LENGTH /* PRD 5.5.6: 60 */}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="w-28 shrink-0">
          <Input
            label="Price (optional)"
            value={item.price}
            maxLength={MAX_MENU_ITEM_PRICE_LENGTH /* PRD 5.5.6: 20, free text */}
            onChange={(event) => onChange({ price: event.target.value })}
          />
        </div>
        <button
          type="button"
          aria-label={`Remove ${item.name.trim() || "item"}`}
          onClick={onRemove}
          className="mt-[26px] flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-black/15 bg-white text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control border border-black/10 bg-surface-muted text-ink-muted">
          {image ? (
            <MenuPhoto image={image} name={item.name} />
          ) : (
            <PhotoIcon size={20} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!hasName) {
                setNameHint(true);
                return;
              }
              setNameHint(false);
              onAddPhoto();
            }}
            className="inline-flex h-9 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            {image ? "Change photo" : "Add photo"}
          </button>
          {image ? (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="inline-flex h-9 items-center rounded-control px-2 text-[13px] font-medium text-red-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      {nameHint && !hasName ? (
        <p role="alert" className="mt-2 text-[12px] text-red-700">
          Enter an item name first, so the photo matches the dish.
        </p>
      ) : null}

      {detailsOpen ? (
        <div className="mt-3 flex flex-col gap-3">
          <Input
            label="What's in it (optional)"
            value={item.details}
            maxLength={MAX_MENU_ITEM_DETAILS_LENGTH /* PRD 5.5.6: 160 */}
            onChange={(event) => onChange({ details: event.target.value })}
          />
          <Select
            label="Tag (optional)"
            value={item.tag ?? ""}
            onChange={(event) =>
              onChange({
                tag: (event.target.value || null) as MenuTag | null,
              })
            }
          >
            {TAG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {/* "Mark sold out" reuses the ONE Activate control (ui-spec 2.5). */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-ink">Mark sold out</span>
            <ActivateButton
              on={item.sold_out}
              name="Mark sold out"
              onToggle={(next) => onChange({ sold_out: next })}
            />
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="w-fit text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Hide details
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="mt-2 text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          Add details (optional)
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hours and contact (PRD 5.5.7): phone, address, weekly hours, note.
// ---------------------------------------------------------------------------

export function HoursRow({
  hours,
  onPatchHours,
  highlight,
}: {
  hours: PageConfig["buttons"]["hours"];
  onPatchHours: (patch: Partial<PageConfig["buttons"]["hours"]>) => void;
  highlight: string | null;
}) {
  const needsContact = !hours.phone.trim() && !hours.address.trim();

  function setDay(day: Weekday, next: DayHours) {
    onPatchHours({ week: { ...hours.week, [day]: next } });
  }

  return (
    <EditorItemRow
      id="row-hours"
      icon={<ClockIcon size={18} />}
      name="Hours and contact"
      badge={null}
      on={hours.on}
      onToggle={(next) => onPatchHours({ on: next })}
      helper="Customers see “Open now” or “Closed” using your time zone."
      highlight={highlight === "row-hours"}
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Phone number"
            value={hours.phone}
            maxLength={16 /* 15 digits + optional leading + */}
            inputMode="tel"
            onChange={(event) => onPatchHours({ phone: event.target.value })}
            error={phoneError(hours.phone)}
          />
          <Input
            label="Address"
            value={hours.address}
            maxLength={MAX_MAPS_ADDRESS_LENGTH /* security 4C: 200 */}
            onChange={(event) => onPatchHours({ address: event.target.value })}
            error={addressError(hours.address)}
          />
        </div>
        {needsContact ? (
          <p className="text-[12px] text-ink-muted">
            Add a phone number or an address so customers can reach you.
          </p>
        ) : null}

        <fieldset>
          <legend className="text-[13px] font-medium">Weekly hours</legend>
          <div className="mt-2 flex flex-col gap-2">
            {WEEKDAY_ORDER.map((day) => (
              <DayHoursRow
                key={day}
                day={day}
                value={hours.week[day]}
                onChange={(next) => setDay(day, next)}
              />
            ))}
          </div>
        </fieldset>

        <Input
          label="Note (optional)"
          value={hours.note}
          maxLength={MAX_HOURS_NOTE_LENGTH /* PRD 5.5.7: 100 */}
          onChange={(event) => onPatchHours({ note: event.target.value })}
          error={hoursNoteError(hours.note)}
          hint="For example: Closed on public holidays."
        />
      </div>
    </EditorItemRow>
  );
}

/** One weekday: two time inputs per range (up to two ranges) or Closed. */
function DayHoursRow({
  day,
  value,
  onChange,
}: {
  day: Weekday;
  value: DayHours;
  onChange: (next: DayHours) => void;
}) {
  const ranges = value.ranges;

  function patchRange(index: number, patch: Partial<DayHours["ranges"][number]>) {
    onChange({
      ...value,
      ranges: ranges.map((range, i) =>
        i === index ? { ...range, ...patch } : range,
      ),
    });
  }

  function removeRange(index: number) {
    onChange({ ...value, ranges: ranges.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-black/10 bg-white px-3 py-2 sm:flex-row sm:items-center">
      <span className="w-20 shrink-0 text-[13px] text-ink">
        {WEEKDAY_LABELS[day]}
      </span>

      {value.closed ? (
        <span className="text-[13px] text-ink-muted">Closed</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((range, index) => (
            <span key={index} className="flex items-center gap-1">
              <input
                type="time"
                aria-label={`${WEEKDAY_LABELS[day]} open time ${index + 1}`}
                value={range.open}
                onChange={(event) =>
                  patchRange(index, { open: event.target.value })
                }
                className="h-9 rounded-control border border-black/20 bg-white px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              />
              <span aria-hidden="true" className="text-ink-muted">
                –
              </span>
              <input
                type="time"
                aria-label={`${WEEKDAY_LABELS[day]} close time ${index + 1}`}
                value={range.close}
                onChange={(event) =>
                  patchRange(index, { close: event.target.value })
                }
                className="h-9 rounded-control border border-black/20 bg-white px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              />
              {ranges.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove hours ${index + 1} for ${WEEKDAY_LABELS[day]}`}
                  onClick={() => removeRange(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  <CloseIcon size={14} />
                </button>
              ) : null}
            </span>
          ))}
          {ranges.length < 2 ? (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  ranges: [...ranges, { open: "09:00", close: "21:00" }],
                })
              }
              className="text-[12px] font-medium text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Add hours
            </button>
          ) : null}
        </div>
      )}

      <label className="flex items-center gap-2 text-[12px] text-ink-muted sm:ml-auto">
        <input
          type="checkbox"
          checked={value.closed}
          onChange={(event) =>
            onChange({ ...value, closed: event.target.checked })
          }
          className="h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        />
        Closed
      </label>
    </div>
  );
}

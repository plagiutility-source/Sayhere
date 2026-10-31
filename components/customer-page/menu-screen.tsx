"use client";

import { useRef, useState } from "react";
import { MenuPhoto } from "@/components/menu-photo";
import type { BrandTheme } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import {
  clampText,
  limitedMenuCategories,
  MAX_MENU_CATEGORY_NAME_LENGTH,
  MAX_MENU_ITEM_DETAILS_LENGTH,
  MAX_MENU_ITEM_NAME_LENGTH,
  MAX_MENU_ITEM_PRICE_LENGTH,
  MENU_TAGS,
  menuTitle,
} from "@/lib/customer-page";
import type { MenuImage, MenuItem, PageConfig } from "@/lib/mock/customer-page";
import { isValidMenuImage } from "@/lib/validation/page-config";
import { BackButton } from "./back-button";
import { PhotoViewer } from "./photo-viewer";

function MenuItemRow({
  item,
  onViewPhoto,
}: {
  item: MenuItem;
  onViewPhoto: (item: MenuItem, trigger: HTMLElement) => void;
}) {
  const name = clampText(item.name, MAX_MENU_ITEM_NAME_LENGTH);
  const price = clampText(item.price, MAX_MENU_ITEM_PRICE_LENGTH);
  const details = clampText(item.details, MAX_MENU_ITEM_DETAILS_LENGTH);
  const tag = item.tag && MENU_TAGS.includes(item.tag) ? item.tag : null;
  const image = isValidMenuImage(item.image) ? item.image : null;

  return (
    <li
      className={`flex items-start gap-md ${item.sold_out ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <div className="flex flex-wrap items-center gap-sm">
            <span className="text-[15px] font-medium">{name}</span>
            {tag ? (
              <span className="rounded-pill border border-black/10 bg-black/[0.04] px-xs py-[1px] text-[11px] text-ink-muted">
                {tag}
              </span>
            ) : null}
            {item.sold_out ? (
              <span className="rounded-pill border border-black/10 bg-black/[0.06] px-xs py-[1px] text-[11px] text-ink-muted">
                Sold out
              </span>
            ) : null}
          </div>
          {price ? (
            <span className="shrink-0 text-[14px] tabular-nums text-ink-muted">
              {price}
            </span>
          ) : null}
        </div>
        {details ? (
          <p className="mt-xs text-[13px] text-ink-muted">{details}</p>
        ) : null}
      </div>
      {image ? (
        <button
          type="button"
          onClick={(event) => onViewPhoto(item, event.currentTarget)}
          aria-label={`View photo of ${name}`}
          className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-control border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <MenuPhoto image={image} name={name} />
        </button>
      ) : null}
    </li>
  );
}

/**
 * Menu screen (PRD 5.5.6, customer-page-ui-spec.md 1.4). Items with an
 * approved AI photo show a thumbnail; tapping it opens the photo full screen
 * (AI_MENU_PHOTOS.md).
 */
export function MenuScreen({
  config,
  businessType,
  menuItemLimit,
  theme,
  onBack,
}: {
  config: PageConfig;
  businessType: BusinessType;
  /** Plan menu-item limit; `null` = unlimited (business-rules.md 11 rule 5). */
  menuItemLimit: number | null;
  theme: BrandTheme;
  onBack: () => void;
}) {
  const title = menuTitle(config, businessType);
  const [viewing, setViewing] = useState<MenuItem | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const viewingImage: MenuImage | null =
    viewing && isValidMenuImage(viewing.image) ? viewing.image : null;
  // Items without a name are ignored; after a downgrade only the first N named
  // items are shown (business-rules.md 11 rule 5) — nothing is deleted.
  const categories = limitedMenuCategories(config.menu, menuItemLimit).map(
    (category) => ({
      name: clampText(category.name, MAX_MENU_CATEGORY_NAME_LENGTH),
      items: category.items,
    }),
  );

  const hasPhotos = categories.some((category) =>
    category.items.some((item) => isValidMenuImage(item.image)),
  );

  function closeViewer() {
    setViewing(null);
    // Give focus back to the thumbnail that opened the photo.
    window.requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <div>
      <BackButton
        label={title}
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />
      <div className="mt-xl grid gap-xl">
        {categories.map((category, categoryIndex) => (
          <section key={categoryIndex}>
            {category.name ? (
              <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-ink-muted">
                {category.name}
              </h2>
            ) : null}
            <ul className="mt-sm grid gap-md">
              {category.items.map((item, itemIndex) => (
                <MenuItemRow
                  key={itemIndex}
                  item={item}
                  onViewPhoto={(picked, element) => {
                    trigger.current = element;
                    setViewing(picked);
                  }}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {hasPhotos ? (
        <p className="mt-xl text-[11px] text-ink-muted">
          Photos are AI-generated for illustration.
        </p>
      ) : null}
      {viewing && viewingImage ? (
        <PhotoViewer
          name={clampText(viewing.name, MAX_MENU_ITEM_NAME_LENGTH)}
          price={clampText(viewing.price, MAX_MENU_ITEM_PRICE_LENGTH)}
          details={clampText(viewing.details, MAX_MENU_ITEM_DETAILS_LENGTH)}
          image={viewingImage}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  );
}

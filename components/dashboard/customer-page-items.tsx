"use client";

/**
 * The customer-page editor sections (PRD.md 5.5.4-5.5.9, ui-spec 2.3-2.5,
 * business-rules.md section 11). Menu and Hours and contact arrive in T4.
 *
 * Every owner string is a plain React text node (never HTML), and every field
 * is validated by the ONE shared module `lib/validation/page-config.ts`.
 */

import { useState } from "react";
import { Input } from "@/components/input";
import {
  CurrencyRupeeIcon,
  FacebookIcon,
  InstagramIcon,
  LinkIcon,
  MapIcon,
  PhoneIcon,
  StarIcon,
  WhatsAppIcon,
  WorldIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/customer-page/icons";
import type { BusinessType } from "@/lib/brand/tokens";
import type {
  MenuConfig,
  PageConfig,
  SocialKey,
  SocialLinks,
} from "@/lib/mock/customer-page";
import {
  linkError,
  mapsValueError,
  MAX_CUSTOM_LINKS,
  MAX_PAYEE_NAME_LENGTH,
  MAX_UPI_ID_LENGTH,
  payeeNameError,
  phoneError,
  socialLinkError,
  upiIdError,
} from "@/lib/validation/page-config";
import { MAX_CUSTOM_LINK_LABEL_LENGTH } from "@/lib/customer-page";
import type { AiImageAllowance } from "@/lib/mock/plans";
import { useLoyaltyState } from "@/lib/use-loyalty";
import { EditorItemRow, type ItemBadge } from "./editor-item-row";
import { LoyaltyIcon } from "./icons";
import { HoursRow, MenuRow } from "./menu-and-hours";
import { Modal } from "./modal";

/** Badge per ui-spec 2.3: On + empty = "Needs a link"; On + invalid = "Check link". */
function badgeFor(on: boolean, valueEmpty: boolean, error?: string): ItemBadge {
  if (!on) return null;
  if (valueEmpty) return "needs";
  if (error) return "check";
  return null;
}

// ---------------------------------------------------------------------------
// Suggested chips (PRD 5.5.9): chips only — clicking scrolls to and highlights
// the row; it NEVER auto-enables anything. Wi-Fi is omitted because it is
// Phase 4B-D and has no row in 1F.
// ---------------------------------------------------------------------------

const SUGGESTIONS: Record<BusinessType, { label: string; target: string }[]> = {
  cafe: [
    { label: "Menu", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Directions", target: "row-directions" },
    { label: "Instagram", target: "row-instagram" },
  ],
  restaurant: [
    { label: "Menu", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Call", target: "row-call" },
    { label: "Directions", target: "row-directions" },
    { label: "Instagram", target: "row-instagram" },
  ],
  hotel: [
    { label: "Menu", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Call", target: "row-call" },
    { label: "Directions", target: "row-directions" },
    { label: "Instagram", target: "row-instagram" },
  ],
  salon: [
    { label: "Services and prices", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Call", target: "row-call" },
    { label: "WhatsApp", target: "row-whatsapp" },
    { label: "Directions", target: "row-directions" },
    { label: "Instagram", target: "row-instagram" },
  ],
  gym: [
    { label: "Services and prices", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Call", target: "row-call" },
    { label: "Join / Membership", target: "row-custom-links" },
    { label: "Instagram", target: "row-instagram" },
  ],
  retail: [
    { label: "Products", target: "row-menu" },
    { label: "Hours and contact", target: "row-hours" },
    { label: "Directions", target: "row-directions" },
    { label: "Instagram", target: "row-instagram" },
  ],
  other: [
    { label: "Hours and contact", target: "row-hours" },
    { label: "Instagram", target: "row-instagram" },
    { label: "Website", target: "row-website" },
  ],
};

export function SuggestionsSection({
  businessType,
  onJump,
}: {
  businessType: BusinessType;
  onJump: (target: string) => void;
}) {
  return (
    <section aria-labelledby="suggested-heading">
      <h2 id="suggested-heading" className="text-[13px] font-medium text-ink">
        Suggested for your business
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS[businessType].map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onJump(chip.target)}
            className="inline-flex h-8 items-center rounded-pill border border-black/15 bg-white px-3 text-[12px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            {chip.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">
        Suggestions only — nothing is turned on for you.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page content: announcement + thank-you message.
// ---------------------------------------------------------------------------

export function PageContentSection({
  config,
  onPatchAnnouncement,
  onSetThankYou,
  highlight,
}: {
  config: PageConfig;
  onPatchAnnouncement: (
    patch: Partial<PageConfig["announcement"]>,
  ) => void;
  onSetThankYou: (value: string) => void;
  highlight: string | null;
}) {
  const announcement = config.announcement;
  return (
    <ul className="mt-3 flex flex-col gap-3">
      <EditorItemRow
        id="row-announcement"
        icon={<StarIcon size={18} />}
        name="Announcement"
        badge={badgeFor(announcement.on, !announcement.text.trim())}
        on={announcement.on}
        onToggle={(next) => onPatchAnnouncement({ on: next })}
        highlight={highlight === "row-announcement"}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Announcement text"
            value={announcement.text}
            maxLength={160} /* security 4C: 160 chars */
            onChange={(event) =>
              onPatchAnnouncement({ text: event.target.value })
            }
          />
          <Input
            label="End date (optional)"
            type="date"
            value={announcement.end_date ?? ""}
            onChange={(event) =>
              onPatchAnnouncement({
                end_date: event.target.value || null,
              })
            }
          />
        </div>
      </EditorItemRow>

      {/* The thank-you message has no on/off flag (PRD 5.5.13): optional text. */}
      <EditorItemRow
        id="row-thank-you"
        icon={<StarIcon size={18} />}
        name="Thank-you message"
        badge={null}
        on
        onToggle={() => {}}
        alwaysShowFields
        control={
          <span className="shrink-0 text-[12px] text-ink-muted">Optional</span>
        }
        helper="Shown after a happy review or private feedback."
        highlight={highlight === "row-thank-you"}
      >
        <Input
          label="Thank-you message"
          value={config.thank_you}
          maxLength={160} /* security 4C: 160 chars */
          onChange={(event) => onSetThankYou(event.target.value)}
        />
      </EditorItemRow>
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Buttons, in the page's fixed order (PRD 5.5.5): Menu, Hours and contact,
// Call, WhatsApp, Directions, Pay now, then custom link buttons.
// ---------------------------------------------------------------------------

/**
 * The Loyalty card switch (owner request, 2026-10-14). The tile is NOT a
 * page_config button — it follows the loyalty program (PRD.md 5.7) — so this
 * row flips the SAME switch as Loyalty → Settings and applies immediately
 * (no Save needed; the program lives in the mock loyalty store).
 */
function LoyaltyRow({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  const state = useLoyaltyState();
  const programOn = state?.program.enabled === true;
  return (
    <EditorItemRow
      id="row-loyalty"
      icon={<LoyaltyIcon size={18} />}
      name="Loyalty card"
      badge={null}
      on={on}
      onToggle={onToggle}
      disabled={state === null}
    >
      <p className="text-[12px] text-ink-muted">
        Shown first on this page. This switch controls this page only — the
        other page keeps its own setting.
      </p>
      {!programOn ? (
        <p className="mt-2 text-[12px] text-amber-700">
          Loyalty is off in Loyalty → Settings, so the card stays hidden to
          guests until it is turned on there.
        </p>
      ) : null}
    </EditorItemRow>
  );
}

export function ButtonsSection({
  businessType,
  config,
  onPatchButtons,
  onPatchMenu,
  menuItemLimit,
  aiAllowance,
  planName,
  loyaltyIncluded,
  loyaltyOn,
  onToggleLoyalty,
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
  /** The plan includes loyalty (Pro+); Starter hides the row entirely. */
  loyaltyIncluded: boolean;
  loyaltyOn: boolean;
  onToggleLoyalty: (next: boolean) => void;
  highlight: string | null;
}) {
  const b = config.buttons;
  const [payWarningOpen, setPayWarningOpen] = useState(false);
  const [payWarned, setPayWarned] = useState(false);
  const links = b.custom_links;
  const atLinkCap = links.length >= MAX_CUSTOM_LINKS;

  function handlePayToggle(next: boolean) {
    if (!next) {
      onPatchButtons({ pay: { ...b.pay, on: false } });
      return;
    }
    if (payWarned) {
      onPatchButtons({ pay: { ...b.pay, on: true } });
      return;
    }
    // One-time warning before the FIRST activation (Pay button spec).
    setPayWarningOpen(true);
  }

  return (
    <>
      <ul className="mt-3 flex flex-col gap-3">
        {loyaltyIncluded ? (
          <LoyaltyRow on={loyaltyOn} onToggle={onToggleLoyalty} />
        ) : null}

        <MenuRow
          businessType={businessType}
          config={config}
          onPatchButtons={onPatchButtons}
          onPatchMenu={onPatchMenu}
          menuItemLimit={menuItemLimit}
          aiAllowance={aiAllowance}
          planName={planName}
          highlight={highlight}
        />

        <HoursRow
          hours={b.hours}
          onPatchHours={(patch) =>
            onPatchButtons({ hours: { ...b.hours, ...patch } })
          }
          highlight={highlight}
        />

        <EditorItemRow
          id="row-call"
          icon={<PhoneIcon size={18} />}
          name="Call"
          badge={badgeFor(b.call.on, !b.call.phone.trim(), phoneError(b.call.phone))}
          on={b.call.on}
          onToggle={(next) => onPatchButtons({ call: { ...b.call, on: next } })}
          helper="Customers tap to call you. The link is built for you."
          highlight={highlight === "row-call"}
        >
          <Input
            label="Phone number"
            value={b.call.phone}
            maxLength={16} /* 15 digits + optional leading + */
            inputMode="tel"
            onChange={(event) =>
              onPatchButtons({ call: { ...b.call, phone: event.target.value } })
            }
            error={phoneError(b.call.phone)}
          />
        </EditorItemRow>

        <EditorItemRow
          id="row-whatsapp"
          icon={<WhatsAppIcon size={18} />}
          name="WhatsApp"
          badge={badgeFor(
            b.whatsapp.on,
            !b.whatsapp.phone.trim(),
            phoneError(b.whatsapp.phone),
          )}
          on={b.whatsapp.on}
          onToggle={(next) =>
            onPatchButtons({ whatsapp: { ...b.whatsapp, on: next } })
          }
          helper="Opens a WhatsApp chat with you."
          highlight={highlight === "row-whatsapp"}
        >
          <Input
            label="WhatsApp number"
            value={b.whatsapp.phone}
            maxLength={16}
            inputMode="tel"
            onChange={(event) =>
              onPatchButtons({
                whatsapp: { ...b.whatsapp, phone: event.target.value },
              })
            }
            error={phoneError(b.whatsapp.phone)}
          />
        </EditorItemRow>

        <EditorItemRow
          id="row-directions"
          icon={<MapIcon size={18} />}
          name="Directions"
          badge={badgeFor(
            b.directions.on,
            !b.directions.value.trim(),
            mapsValueError(b.directions.value),
          )}
          on={b.directions.on}
          onToggle={(next) =>
            onPatchButtons({ directions: { ...b.directions, on: next } })
          }
          helper="Customers tap to open Google Maps."
          highlight={highlight === "row-directions"}
        >
          <Input
            label="Address or Google Maps link"
            value={b.directions.value}
            maxLength={2048}
            onChange={(event) =>
              onPatchButtons({
                directions: { ...b.directions, value: event.target.value },
              })
            }
            error={mapsValueError(b.directions.value)}
          />
        </EditorItemRow>

        <EditorItemRow
          id="row-pay"
          icon={<CurrencyRupeeIcon size={18} />}
          name="Pay now"
          badge={badgeFor(
            b.pay.on,
            !b.pay.upi_id.trim() || !b.pay.name.trim(),
            upiIdError(b.pay.upi_id) ?? payeeNameError(b.pay.name),
          )}
          on={b.pay.on}
          onToggle={handlePayToggle}
          helper="Customers pay you directly. Use your business UPI ID. We never see the money."
          highlight={highlight === "row-pay"}
        >
          <div className="flex flex-col gap-3">
            <Input
              label="UPI ID"
              value={b.pay.upi_id}
              maxLength={MAX_UPI_ID_LENGTH} /* owner decision */
              autoComplete="off"
              onChange={(event) =>
                onPatchButtons({ pay: { ...b.pay, upi_id: event.target.value } })
              }
              error={upiIdError(b.pay.upi_id)}
              hint="Looks like name@bank. Customers pay this ID directly."
            />
            <Input
              label="Name shown to customers"
              value={b.pay.name}
              maxLength={MAX_PAYEE_NAME_LENGTH} /* owner decision */
              onChange={(event) =>
                onPatchButtons({ pay: { ...b.pay, name: event.target.value } })
              }
              error={payeeNameError(b.pay.name)}
            />
          </div>
        </EditorItemRow>

        {links.map((link, index) => (
          <EditorItemRow
            key={`custom-${index}`}
            id={`row-custom-${index}`}
            icon={<LinkIcon size={18} />}
            name={link.label.trim() || `Link button ${index + 1}`}
            badge={badgeFor(link.on, !link.label.trim() || !link.url.trim(), linkError(link.url))}
            on={link.on}
            onToggle={(next) => {
              const nextLinks = links.map((row, i) =>
                i === index ? { ...row, on: next } : row,
              );
              onPatchButtons({ custom_links: nextLinks });
            }}
            highlight={highlight === `row-custom-${index}`}
          >
            <div className="flex flex-col gap-3">
              <Input
                label="Label"
                value={link.label}
                maxLength={MAX_CUSTOM_LINK_LABEL_LENGTH}
                onChange={(event) => {
                  const nextLinks = links.map((row, i) =>
                    i === index ? { ...row, label: event.target.value } : row,
                  );
                  onPatchButtons({ custom_links: nextLinks });
                }}
                error={undefined}
              />
              <Input
                label="Link (https://)"
                value={link.url}
                maxLength={2048}
                onChange={(event) => {
                  const nextLinks = links.map((row, i) =>
                    i === index ? { ...row, url: event.target.value } : row,
                  );
                  onPatchButtons({ custom_links: nextLinks });
                }}
                error={link.url.trim() ? linkError(link.url) : undefined}
              />
              <button
                type="button"
                onClick={() =>
                  onPatchButtons({
                    custom_links: links.filter((_, i) => i !== index),
                  })
                }
                className="inline-flex h-9 w-fit items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Remove
              </button>
            </div>
          </EditorItemRow>
        ))}
      </ul>

      <div id="row-custom-links" className="mt-3 scroll-mt-24">
        <button
          type="button"
          disabled={atLinkCap}
          onClick={() =>
            onPatchButtons({
              custom_links: [
                ...links,
                { on: true, label: "", url: "" },
              ],
            })
          }
          className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add link button
        </button>
        {atLinkCap ? (
          <p className="mt-2 text-[12px] text-ink-muted">
            You can add up to {MAX_CUSTOM_LINKS} link buttons per location.
          </p>
        ) : null}
      </div>

      {/* One-time warning before the first activation (Pay button spec). */}
      <Modal
        open={payWarningOpen}
        title="Turn on Pay now?"
        onClose={() => setPayWarningOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPayWarningOpen(false)}
              className="inline-flex h-10 items-center rounded-control border border-black/15 bg-white px-3 text-[13px] font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPayWarned(true);
                setPayWarningOpen(false);
                onPatchButtons({ pay: { ...b.pay, on: true } });
              }}
              className="inline-flex h-10 items-center rounded-control bg-brand-blue px-3 text-[13px] font-medium text-white hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Continue
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          Customers will pay the UPI ID you enter. Double-check it.
        </p>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Social icons (business-level; stored as {on, url} per PRD 5.5.4/5.5.13).
// ---------------------------------------------------------------------------

const SOCIAL_ROWS: { key: SocialKey; name: string; icon: React.ReactNode }[] = [
  { key: "instagram", name: "Instagram", icon: <InstagramIcon size={18} /> },
  { key: "facebook", name: "Facebook", icon: <FacebookIcon size={18} /> },
  { key: "youtube", name: "YouTube", icon: <YouTubeIcon size={18} /> },
  { key: "x", name: "X", icon: <XIcon size={18} /> },
  { key: "website", name: "Website", icon: <WorldIcon size={18} /> },
];

export function SocialSection({
  socials,
  onChange,
  highlight,
}: {
  socials: SocialLinks;
  onChange: (next: SocialLinks) => void;
  highlight: string | null;
}) {
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {SOCIAL_ROWS.map((row) => {
        const entry = socials[row.key] ?? { on: false, url: "" };
        return (
          <EditorItemRow
            key={row.key}
            id={`row-${row.key}`}
            icon={row.icon}
            name={row.name}
            badge={badgeFor(
              entry.on,
              !entry.url.trim(),
              socialLinkError(row.key, entry.url),
            )}
            on={entry.on}
            onToggle={(next) =>
              onChange({
                ...socials,
                [row.key]: { ...entry, on: next },
              })
            }
            helper="Shown as an icon under your buttons."
            highlight={highlight === `row-${row.key}`}
          >
            <Input
              label={`${row.name} link`}
              value={entry.url}
              maxLength={2048}
              onChange={(event) =>
                onChange({
                  ...socials,
                  [row.key]: { ...entry, url: event.target.value },
                })
              }
              error={entry.url.trim() ? socialLinkError(row.key, entry.url) : undefined}
            />
          </EditorItemRow>
        );
      })}
    </ul>
  );
}

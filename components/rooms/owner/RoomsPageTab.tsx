"use client";

/**
 * The "Tables/Rooms page" tab of the existing customer-page editor (merge M7).
 *
 * There is deliberately no second menu editor: this page shares the one menu
 * from the reception page and only sets its title, announcement, thank-you,
 * Wi-Fi, hours/contact, call, directions and one custom link. Values are
 * validated by `roomsPageDraftIssues` in `lib/validation/page-config.ts`, which
 * the editor feeds into the same Save gate as the reception tab.
 */

import type { RoomsPageDraft } from "@/lib/validation/page-config";
import {
  MAX_LINK_LENGTH,
  MAX_MAPS_ADDRESS_LENGTH,
  MAX_ROOMS_ANNOUNCEMENT_LENGTH,
  MAX_ROOMS_CUSTOM_LABEL_LENGTH,
  MAX_ROOMS_MENU_TITLE_LENGTH,
  MAX_ROOMS_THANK_YOU_LENGTH,
  roomsPageDraftIssues,
} from "@/lib/validation/page-config";

const INPUT =
  "h-10 w-full rounded-control border border-black/15 bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";
const TEXTAREA =
  "w-full resize-y rounded-control border border-black/15 bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-blue";
const CHECKBOX = "h-4 w-4 rounded border-black/30 text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue";

export function RoomsPageTab({
  draft,
  onChange,
  onOpenReception,
}: {
  draft: RoomsPageDraft;
  onChange: (next: RoomsPageDraft) => void;
  /** Switches back to the Reception tab, where Menu and hours lives. */
  onOpenReception: () => void;
}) {
  const errors = new Map(
    roomsPageDraftIssues(draft).map((issue) => [issue.key, issue.message]),
  );

  function patch<K extends keyof RoomsPageDraft>(
    key: K,
    value: RoomsPageDraft[K],
  ) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-brand-blue/20 bg-brand-blue/[0.04] p-4 text-[12px] leading-[1.6] text-ink">
        <p className="font-medium">One menu, two pages.</p>
        <p className="mt-1 text-ink-muted">
          This page uses the same menu as your reception page, so dishes and
          prices are edited once.{" "}
          <button
            type="button"
            onClick={onOpenReception}
            className="font-medium text-brand-blue underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Open Menu and hours
          </button>
          . This tab only changes the title and buttons guests see when they
          scan a table QR.
        </p>
      </div>

      <section aria-labelledby="rooms-announcement-heading">
        <h2
          id="rooms-announcement-heading"
          className="text-[13px] font-medium text-ink"
        >
          Announcement
        </h2>
        <div
          id="rooms-announcement"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.announcement.on}
              onChange={(event) =>
                patch("announcement", {
                  ...draft.announcement,
                  on: event.target.checked,
                })
              }
              className={CHECKBOX}
            />
            Show an announcement on the tables page
          </label>
          <textarea
            value={draft.announcement.text}
            maxLength={MAX_ROOMS_ANNOUNCEMENT_LENGTH}
            rows={2}
            placeholder="Table guests: free filter coffee refill before 11 am."
            onChange={(event) =>
              patch("announcement", {
                ...draft.announcement,
                text: event.target.value,
              })
            }
            className={`${TEXTAREA} mt-2`}
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            {draft.announcement.text.length} /{" "}
            {MAX_ROOMS_ANNOUNCEMENT_LENGTH}
          </p>
          {errors.get("rooms-announcement") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-announcement")}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rooms-thanks-heading">
        <h2 id="rooms-thanks-heading" className="text-[13px] font-medium text-ink">
          Thank-you message
        </h2>
        <div className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft">
          <textarea
            value={draft.thank_you}
            maxLength={MAX_ROOMS_THANK_YOU_LENGTH}
            rows={2}
            placeholder="Enjoy your meal — tell us how we can make it better."
            onChange={(event) => patch("thank_you", event.target.value)}
            className={TEXTAREA}
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            {draft.thank_you.length} / {MAX_ROOMS_THANK_YOU_LENGTH}
          </p>
        </div>
      </section>

      <section aria-labelledby="rooms-wifi-heading">
        <h2 id="rooms-wifi-heading" className="text-[13px] font-medium text-ink">
          Wi-Fi
        </h2>
        <div
          id="rooms-wifi"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.wifi.on}
              onChange={(event) =>
                patch("wifi", { ...draft.wifi, on: event.target.checked })
              }
              className={CHECKBOX}
            />
            Show Wi-Fi once the order is accepted
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Network name
              <input
                type="text"
                value={draft.wifi.ssid}
                maxLength={100}
                onChange={(event) =>
                  patch("wifi", { ...draft.wifi, ssid: event.target.value })
                }
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Password
              <input
                type="text"
                value={draft.wifi.password}
                maxLength={100}
                onChange={(event) =>
                  patch("wifi", { ...draft.wifi, password: event.target.value })
                }
                className={INPUT}
              />
            </label>
          </div>
          {errors.get("rooms-wifi") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-wifi")}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rooms-menu-heading">
        <h2 id="rooms-menu-heading" className="text-[13px] font-medium text-ink">
          Menu
        </h2>
        <div className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft">
          <label className="flex flex-col gap-1 text-[12px] text-ink">
            Menu title on the tables page
            <input
              type="text"
              value={draft.menu_title}
              maxLength={MAX_ROOMS_MENU_TITLE_LENGTH}
              placeholder="Our menu"
              onChange={(event) => patch("menu_title", event.target.value)}
              className={INPUT}
            />
          </label>
          <p className="mt-2 text-[12px] text-ink-muted">
            The dishes themselves come from your one menu on the Reception page.
          </p>
        </div>
      </section>

      <section aria-labelledby="rooms-hours-heading">
        <h2 id="rooms-hours-heading" className="text-[13px] font-medium text-ink">
          Hours and contact
        </h2>
        <div
          id="rooms-hours"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.hours.on}
              onChange={(event) =>
                patch("hours", { ...draft.hours, on: event.target.checked })
              }
              className={CHECKBOX}
            />
            Show hours and contact
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Phone
              <input
                type="tel"
                value={draft.hours.phone}
                maxLength={20}
                placeholder="+919876543210"
                onChange={(event) =>
                  patch("hours", { ...draft.hours, phone: event.target.value })
                }
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Address
              <input
                type="text"
                value={draft.hours.address}
                maxLength={MAX_MAPS_ADDRESS_LENGTH}
                onChange={(event) =>
                  patch("hours", { ...draft.hours, address: event.target.value })
                }
                className={INPUT}
              />
            </label>
          </div>
          {errors.get("rooms-hours") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-hours")}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rooms-call-heading">
        <h2 id="rooms-call-heading" className="text-[13px] font-medium text-ink">
          Call
        </h2>
        <div
          id="rooms-call"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.call.on}
              onChange={(event) =>
                patch("call", { ...draft.call, on: event.target.checked })
              }
              className={CHECKBOX}
            />
            Show a call button
          </label>
          <label className="mt-3 flex flex-col gap-1 text-[12px] text-ink">
            Phone
            <input
              type="tel"
              value={draft.call.phone}
              maxLength={20}
              onChange={(event) =>
                patch("call", { ...draft.call, phone: event.target.value })
              }
              className={INPUT}
            />
          </label>
          {errors.get("rooms-call") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-call")}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rooms-directions-heading">
        <h2
          id="rooms-directions-heading"
          className="text-[13px] font-medium text-ink"
        >
          Directions
        </h2>
        <div
          id="rooms-directions"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.directions.on}
              onChange={(event) =>
                patch("directions", {
                  ...draft.directions,
                  on: event.target.checked,
                })
              }
              className={CHECKBOX}
            />
            Show a directions button
          </label>
          <label className="mt-3 flex flex-col gap-1 text-[12px] text-ink">
            Address or Google Maps link
            <input
              type="text"
              value={draft.directions.value}
              maxLength={MAX_LINK_LENGTH}
              onChange={(event) =>
                patch("directions", {
                  ...draft.directions,
                  value: event.target.value,
                })
              }
              className={INPUT}
            />
          </label>
          {errors.get("rooms-directions") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-directions")}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rooms-custom-heading">
        <h2 id="rooms-custom-heading" className="text-[13px] font-medium text-ink">
          Custom link
        </h2>
        <div
          id="rooms-custom"
          className="mt-2 rounded-card border border-black/10 bg-white p-4 shadow-soft"
        >
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={draft.custom.on}
              onChange={(event) =>
                patch("custom", { ...draft.custom, on: event.target.checked })
              }
              className={CHECKBOX}
            />
            Show one custom link
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Label
              <input
                type="text"
                value={draft.custom.label}
                maxLength={MAX_ROOMS_CUSTOM_LABEL_LENGTH}
                placeholder="Order online"
                onChange={(event) =>
                  patch("custom", { ...draft.custom, label: event.target.value })
                }
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-ink">
              Link (https://)
              <input
                type="url"
                value={draft.custom.url}
                maxLength={MAX_LINK_LENGTH}
                placeholder="https://"
                onChange={(event) =>
                  patch("custom", { ...draft.custom, url: event.target.value })
                }
                className={INPUT}
              />
            </label>
          </div>
          {errors.get("rooms-custom") ? (
            <p className="mt-1 text-[12px] text-red-700">
              {errors.get("rooms-custom")}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

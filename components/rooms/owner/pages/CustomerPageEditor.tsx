"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/rooms/shared/icons";
import { PagePreview } from "@/components/rooms/customer/PagePreview";
import { Badge, Switch, btnOutline, btnPrimary, cx } from "@/components/rooms/shared/ui";
import { displaySpotName, spotWord } from "@/lib/rooms/format";
import { configTemplate, DEMO_BUSINESS } from "@/lib/rooms/seed";
import type { RoomsPageConfig, SpotLocation } from "@/lib/rooms/types";
import { useOwner } from "../OwnerProvider";

type EditorKind = "reception" | "rooms";

const inputClass =
  "h-9 w-full rounded-control border border-ink/15 bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/[0.12]";
const fieldLabel = "text-[11.5px] font-medium text-slate-600";
const hintClass = "text-[10.5px] leading-[1.5] text-ink-muted";
const sectionClass = "rounded-card border border-black/10 bg-white shadow-soft";
const sectionHeadClass =
  "flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3";
const saveStateClass = (dirty: boolean) =>
  cx("text-[11px]", dirty ? "font-medium text-amber-700" : "text-ink-muted");

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withField(base: RoomsPageConfig, path: string, value: string | boolean): RoomsPageConfig {
  const next = clone(base);
  const parts = path.split(".");
  let node = next as unknown as Record<string, unknown>;
  for (let index = 0; index < parts.length - 1; index += 1) {
    node = node[parts[index]] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
  return next;
}

function Field({
  label,
  value,
  onChange,
  hint,
  maxLength = 200,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxLength?: number;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className={fieldLabel}>{label}</label>
      {textarea ? (
        <textarea
          className="min-h-[68px] w-full resize-none rounded-control border border-ink/15 bg-white px-2.5 py-2 text-[12.5px] text-ink outline-none focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/[0.12]"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </div>
  );
}

function EditorRow({
  icon,
  label,
  sub,
  on,
  onToggle,
  children,
}: {
  icon: IconName;
  label: string;
  sub: string;
  on: boolean;
  onToggle: (value: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-black/5 px-4 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-brand-blue/10 text-brand-blue">
            <Icon name={icon} size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium">{label}</p>
            <p className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">{sub}</p>
          </div>
        </div>
        <Switch checked={on} onChange={onToggle} label={`Toggle ${label}`} />
      </div>
      {on && children ? (
        <div className="mt-3 grid gap-x-2.5 gap-y-2 min-[640px]:grid-cols-2">{children}</div>
      ) : null}
    </div>
  );
}

export function CustomerPageEditor() {
  const { state } = useOwner();
  const params = useSearchParams();
  const locId = params.get("loc");
  const location = state.locations.find((item) => item.id === locId) ?? state.locations[0];
  const kind: EditorKind = params.get("kind") === "reception" ? "reception" : "rooms";

  if (!location) {
    return (
      <div className="rounded-card border border-black/10 bg-white p-7 text-center text-xs text-ink-muted">
        <strong className="block text-[13px] font-medium text-ink">No locations yet</strong>
        Add a location before editing its page.
      </div>
    );
  }

  return <EditorContent key={`${location.id}:${kind}`} location={location} kind={kind} />;
}

function EditorContent({ location, kind }: { location: SpotLocation; kind: EditorKind }) {
  const router = useRouter();
  const { state, save, toast, businessType, hydrated } = useOwner();
  const key = `${location.id}:${kind}`;
  const firstRoom = location.rooms[0] || null;
  const [saved, setSaved] = useState<RoomsPageConfig>(() =>
    clone(state.configs[key] ?? configTemplate(kind)),
  );
  const [draft, setDraft] = useState<RoomsPageConfig>(() =>
    clone(state.configs[key] ?? configTemplate(kind)),
  );
  const [previewCode, setPreviewCode] = useState(firstRoom ? firstRoom.code : "");
  const loaded = useRef(false);

  useEffect(() => {
    if (!hydrated || loaded.current) return;
    loaded.current = true;
    const next = clone(state.configs[key] ?? configTemplate(kind));
    setSaved(next);
    setDraft(clone(next));
  }, [hydrated, state.configs, key, kind]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const words = spotWord(businessType, true);
  const spot = spotWord(businessType, false);
  const previewRoom = location.rooms.find((room) => room.code === previewCode) ?? firstRoom;
  const livePath =
    kind === "rooms" && previewRoom
      ? `/r/${location.slug}/${previewRoom.code}`
      : kind === "rooms"
        ? `/rooms?loc=${location.id}`
        : `/r/${location.slug}/reception`;
  const buttonCount = [
    draft.menu.on,
    draft.wifi.on,
    draft.hours.on,
    draft.call.on,
    draft.directions.on && draft.directions.value.trim(),
    draft.custom.on && draft.custom.label.trim(),
  ].filter(Boolean).length;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = (path: string, value: string | boolean) =>
    setDraft((current) => withField(current, path, value));

  const persist = () => {
    save({ ...state, configs: { ...state.configs, [key]: clone(draft) } });
    setSaved(clone(draft));
    if (kind === "rooms") {
      toast(
        location.rooms.length
          ? `Saved — all ${location.rooms.length} ${spot.toLowerCase()} QR page${location.rooms.length === 1 ? "" : "s"} now show this content.`
          : `Saved — add a ${spot.toLowerCase()} QR and this page will appear on it.`,
      );
    } else {
      toast(`Saved — the reception page is updated. ${spot} QR pages are unchanged.`);
    }
  };

  const navigate = (href: string) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    router.push(href);
  };

  const reset = () => {
    if (!window.confirm("Reset this page to the default content?")) return;
    setDraft(clone(configTemplate(kind)));
    toast("Default page loaded — save to publish it.");
  };

  const viewLive = () => {
    if (dirty) persist();
    router.push(livePath);
  };

  const previewMessage = (previewKind: "link" | "action") => {
    toast(
      previewKind === "link"
        ? "This is the live preview. Open the live page to follow links."
        : "Live preview — open “View live page” to click through.",
    );
  };

  const theme = {
    "--cp-primary": DEMO_BUSINESS.theme.primary,
    "--cp-secondary": DEMO_BUSINESS.theme.secondary,
    "--cp-bg": DEMO_BUSINESS.theme.bg,
  } as CSSProperties;

  return (
    <>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium leading-[1.3] tracking-[-0.01em]">Customer page</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-ink-muted">
            {kind === "rooms"
              ? `Customize what customers see on every ${spot.toLowerCase()} QR at ${location.name}.`
              : `Customize what customers see at ${location.name}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-control border border-ink/15 bg-white px-2 text-[12.5px]"
            aria-label="Location"
            value={location.id}
            onChange={(event) =>
              navigate(`/customer-page?loc=${event.target.value}&kind=${kind}`)
            }
          >
            {state.locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="button" className={btnOutline} onClick={reset}>
            Reset to default
          </button>
          <button type="button" className={btnPrimary} onClick={persist} disabled={!dirty}>
            Save changes
          </button>
          <button type="button" className={btnOutline} onClick={viewLive}>
            <Icon name="external" size={15} /> View live page
          </button>
        </div>
      </div>

      <div
        className="mb-3.5 inline-flex flex-wrap gap-0.5 rounded-[10px] bg-slate-100 p-[3px]"
        role="tablist"
        aria-label="Page type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={kind === "reception"}
          className={cx(
            "inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-[12.5px] font-medium",
            kind === "reception" ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]" : "text-slate-600",
          )}
          onClick={() => navigate(`/customer-page?loc=${location.id}&kind=reception`)}
        >
          Reception page
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === "rooms"}
          className={cx(
            "inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-[12.5px] font-medium",
            kind === "rooms" ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,23,42,0.12)]" : "text-slate-600",
          )}
          onClick={() => navigate(`/customer-page?loc=${location.id}&kind=rooms`)}
        >
          {words} page <Badge tone="blue">{location.rooms.length}</Badge>
        </button>
      </div>

      {kind === "rooms" ? (
        <div className="mb-3.5 flex items-start gap-[9px] rounded-[9px] border border-brand-blue/[0.16] bg-brand-blue/[0.05] px-[11px] py-2.5 text-xs leading-[1.5] text-blue-900">
          <Icon name="sparkles" size={15} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">
              All {location.rooms.length} {spot.toLowerCase()} QR page
              {location.rooms.length === 1 ? "" : "s"} at {location.name} share this content.
            </span>{" "}
            Save once and every {spot.toLowerCase()} QR shows the change.
            {location.rooms.length ? (
              <>
                {" "}
                <button type="button" className="font-medium underline" onClick={viewLive}>
                  Preview {previewRoom ? displaySpotName(businessType, previewRoom) : spot.toLowerCase()} →
                </button>
              </>
            ) : (
              ` Add a ${spot.toLowerCase()} QR from Locations when you are ready.`
            )}
          </div>
        </div>
      ) : (
        <div className="mb-3.5 flex items-start gap-[9px] rounded-[9px] border border-brand-yellow/50 bg-amber-50 px-[11px] py-2.5 text-xs leading-[1.5] text-amber-900">
          <Icon name="lock" size={15} className="mt-px shrink-0" />
          <div>
            <span className="font-medium">Reception page.</span> This is the existing page and
            remains separate. Saving here never changes any room QR page.
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <section className={sectionClass}>
            <div className={sectionHeadClass}>
              <span className="text-[12.5px] font-medium">Page content</span>
              <span className={saveStateClass(dirty)}>
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
            <div>
              <EditorRow
                icon="sparkles"
                label="Announcement"
                sub="Shown above the business name, only while it is active."
                on={draft.announcement.on}
                onToggle={(value) => set("announcement.on", value)}
              >
                <div className="min-[640px]:col-span-2">
                  <Field
                    label="Announcement text"
                    value={draft.announcement.text}
                    maxLength={160}
                    hint={`${draft.announcement.text.length}/160 characters`}
                    onChange={(value) => set("announcement.text", value)}
                  />
                </div>
              </EditorRow>
              <div className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-brand-blue/10 text-brand-blue">
                    <Icon name="feedback" size={16} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium">Thank-you message</p>
                    <p className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">
                      Shown after a customer finishes the feedback flow.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Field
                    label="Message"
                    value={draft.thankYou}
                    maxLength={160}
                    textarea
                    hint={`${draft.thankYou.length}/160 characters`}
                    onChange={(value) => set("thankYou", value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div className={sectionHeadClass}>
              <span className="text-[12.5px] font-medium">Buttons</span>
              <Badge>{buttonCount} shown to customers</Badge>
            </div>
            <div>
              <EditorRow
                icon="menu"
                label="Menu"
                sub="Opens the menu, where customers add items to a cart and send an order to your live dashboard."
                on={draft.menu.on}
                onToggle={(value) => set("menu.on", value)}
              >
                <Field
                  label="Menu title"
                  value={draft.menu.title}
                  hint="Leave blank to use the business-type label."
                  onChange={(value) => set("menu.title", value)}
                />
              </EditorRow>
              <EditorRow
                icon="wifi"
                label="Wi-Fi"
                sub="Unlocks only after you accept the customer's order. Café, restaurant and hotel QR pages only."
                on={draft.wifi.on}
                onToggle={(value) => set("wifi.on", value)}
              >
                <Field
                  label="Network name"
                  value={draft.wifi.ssid}
                  onChange={(value) => set("wifi.ssid", value)}
                />
                <Field
                  label="Password"
                  value={draft.wifi.password}
                  onChange={(value) => set("wifi.password", value)}
                />
              </EditorRow>
              <EditorRow
                icon="clock"
                label="Hours and contact"
                sub="Weekly hours, address, Call and WhatsApp."
                on={draft.hours.on}
                onToggle={(value) => set("hours.on", value)}
              >
                <Field
                  label="Phone"
                  value={draft.hours.phone}
                  onChange={(value) => set("hours.phone", value)}
                />
                <Field
                  label="Address"
                  value={draft.hours.address}
                  onChange={(value) => set("hours.address", value)}
                />
              </EditorRow>
              <EditorRow
                icon="phone"
                label="Call"
                sub="Opens the dialer with this number."
                on={draft.call.on}
                onToggle={(value) => set("call.on", value)}
              >
                <Field
                  label="Phone number"
                  value={draft.call.phone}
                  onChange={(value) => set("call.phone", value)}
                />
              </EditorRow>
              <EditorRow
                icon="map"
                label="Directions"
                sub="Opens Google Maps from an address or a Maps link."
                on={draft.directions.on}
                onToggle={(value) => set("directions.on", value)}
              >
                <div className="min-[640px]:col-span-2">
                  <Field
                    label="Address or Google Maps link"
                    value={draft.directions.value}
                    onChange={(value) => set("directions.value", value)}
                  />
                </div>
              </EditorRow>
              <EditorRow
                icon="link"
                label="Custom link"
                sub={`One extra button, for example “Order online” or “${
                  kind === "rooms" ? "Request housekeeping" : "Book a table"
                }”.`}
                on={draft.custom.on}
                onToggle={(value) => set("custom.on", value)}
              >
                <Field
                  label="Button label"
                  value={draft.custom.label}
                  onChange={(value) => set("custom.label", value)}
                />
                <Field
                  label="Link"
                  value={draft.custom.url}
                  hint="Must start with https://"
                  onChange={(value) => set("custom.url", value)}
                />
              </EditorRow>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600">
                  <Icon name="lock" size={15} /> Review buttons
                </span>
                <Badge>Always shown</Badge>
              </div>
            </div>
          </section>

          <section className={cx(sectionClass, "px-4 py-3")}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnPrimary} onClick={persist} disabled={!dirty}>
                Save changes
              </button>
              <button
                type="button"
                className={btnOutline}
                disabled={!dirty}
                onClick={() => {
                  setDraft(clone(saved));
                  toast("Changes discarded.");
                }}
              >
                Discard
              </button>
              <span className={saveStateClass(dirty)}>
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
          </section>
        </div>

        <aside className="min-[1100px]:sticky min-[1100px]:top-20">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10.5px] text-ink-muted">
              {kind === "rooms" ? `${spot} QR preview` : "Reception QR preview"}{" "}
              <span className="text-slate-400">· {livePath}</span>
            </p>
            {kind === "rooms" && location.rooms.length ? (
              <select
                className="h-7 rounded-[7px] border border-ink/15 bg-white px-1.5 text-[10.5px]"
                aria-label="Preview room QR"
                value={previewRoom ? previewRoom.code : ""}
                onChange={(event) => setPreviewCode(event.target.value)}
              >
                {location.rooms.map((room) => (
                  <option key={room.code} value={room.code}>
                    {room.name} ({room.code.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div className="mx-auto max-w-[340px] rounded-[30px] border-[6px] border-ink/80 bg-white p-2 shadow-soft">
            <div
              className="max-h-[560px] overflow-y-auto rounded-[22px] bg-[var(--cp-bg)]"
              style={theme}
            >
              <PagePreview config={draft} onPreview={previewMessage} />
            </div>
          </div>
          <p className="mt-2 text-[10.5px] leading-[1.5] text-ink-muted">
            {kind === "rooms"
              ? `Every ${spot.toLowerCase()} QR at ${location.name} shows this exact page.${
                  location.rooms.length
                    ? ""
                    : ` Add a ${spot.toLowerCase()} QR to make it live.`
                }`
              : `This preview is the reception page only. ${words} pages have their own content.`}
          </p>
        </aside>
      </div>
    </>
  );
}

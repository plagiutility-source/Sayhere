"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { copyText } from "@/components/rooms/shared/clipboard";
import { Icon } from "@/components/rooms/shared/icons";
import { Badge, btnOutline, cx } from "@/components/rooms/shared/ui";
import { displaySpotName, spotWord } from "@/lib/rooms/format";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import { DEMO_BUSINESS } from "@/lib/rooms/seed";
import { useRoomsState } from "@/lib/rooms/store";

type ScanPageProps = { slug: string; code: string };

/**
 * The public scan page frame (`renderScan` in the demo): the sticky scan bar,
 * the themed card and both unavailable states. The customer screens inside the
 * card arrive in the following Phase 3 tasks.
 */
export function ScanPage({ slug, code }: ScanPageProps) {
  const { state } = useRoomsState();
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const businessType = state.businessType;
  const spot = spotWord(businessType, false);
  const spots = spotWord(businessType, true);

  const location =
    state.locations.find((item) => item.slug === slug || item.id === slug) ?? null;
  const isReception = code === "reception";
  const room =
    location && !isReception
      ? location.rooms.find((item) => item.code === code) ?? null
      : null;
  const known = isReception || Boolean(room);
  const active = isReception || Boolean(room?.active);
  const kind = isReception ? "reception" : "rooms";

  const theme = {
    "--cp-primary": DEMO_BUSINESS.theme.primary,
    "--cp-secondary": DEMO_BUSINESS.theme.secondary,
    "--cp-bg": DEMO_BUSINESS.theme.bg,
  } as CSSProperties;

  if (!location) {
    return (
      <div className="min-h-screen bg-[var(--cp-bg)]" style={theme}>
        <div className="mx-auto max-w-[480px] px-[18px] pb-14 pt-6">
          <div className="overflow-hidden rounded-[18px] shadow-soft">
            <Unavailable
              title={`This link isn't linked to a ${spot.toLowerCase()}`}
              text={`The QR may belong to a ${spot.toLowerCase()} that was removed, or the link was typed incorrectly.`}
              backHref="/rooms"
              backLabel={`Back to ${spots}`}
            />
          </div>
        </div>
      </div>
    );
  }

  const url = absoluteUrl(origin, spotPath(slug, code));
  const config = state.configs[`${location.id}:${kind}`];
  const otherRoom = location.rooms.find((item) => item.active) ?? null;
  const otherHref = room ? spotPath(slug, "reception") : otherRoom ? spotPath(slug, otherRoom.code) : `/rooms?loc=${location.id}`;
  const otherLabel = room ? "View reception page" : `View a ${spot.toLowerCase()} QR`;
  const activeRooms = location.rooms.filter((item) => item.active).length;

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]" style={theme}>
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2.5 border-b border-black/10 bg-white px-[18px] py-2.5 text-xs">
        <Link
          href={`/rooms?loc=${location.id}`}
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink"
        >
          <Icon name="arrowLeft" size={15} /> Back to demo
        </Link>
        <Badge tone={room ? "blue" : "green"}>
          {room ? `${spot} QR · ${room.code.toUpperCase()}` : "Reception QR"}
        </Badge>
        <span className="font-medium">
          {room ? `${displaySpotName(businessType, room)} · ${location.name}` : location.name}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}
          onClick={() => copyText(url, () => setToast("Link copied."))}
        >
          Copy link
        </button>
        <Link
          href={`/customer-page?loc=${location.id}&kind=${kind}`}
          className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}
        >
          Edit {room ? spots : "reception"} page
        </Link>
        <Link href={otherHref} className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}>
          {otherLabel}
        </Link>
      </div>

      <div className="mx-auto max-w-[480px] px-[18px] pb-14 pt-6">
        <div className="overflow-hidden rounded-[18px] shadow-soft">
          {!known ? (
            <Unavailable
              title={`This link isn't linked to a ${spot.toLowerCase()}`}
              text={`The QR may belong to a ${spot.toLowerCase()} that was removed, or the link was typed incorrectly.`}
              backHref={`/rooms?loc=${location.id}`}
              backLabel={`Back to ${spots}`}
            />
          ) : !active ? (
            <Unavailable
              title={`This ${spot.toLowerCase()} QR isn't available right now`}
              text={`The link is still reserved for this ${spot.toLowerCase()}. Re-activate it from ${spots} to turn the page back on.`}
              backHref={`/rooms?loc=${location.id}`}
              backLabel={`Back to ${spots}`}
            />
          ) : (
            <HomeHead
              announcement={config?.announcement.on ? config.announcement.text : ""}
              spotName={room ? displaySpotName(businessType, room) : "Reception"}
              ordering={Boolean(room)}
            />
          )}
        </div>

        {known && active ? (
          <p className="mt-3.5 rounded-[9px] bg-white/60 px-3 py-2.5 text-center text-[11px] leading-[1.55] text-slate-600">
            {room ? (
              <>
                <strong className="font-medium text-ink">
                  {room.code.toUpperCase()} · {displaySpotName(businessType, room)}
                </strong>{" "}
                — this is the shared {spots} page for {location.name}. The other{" "}
                {Math.max(activeRooms - 1, 0)} {spot.toLowerCase()} QR
                {activeRooms - 1 === 1 ? "" : "s"} here show exactly the same page, but orders are
                tagged to {displaySpotName(businessType, room)}.
              </>
            ) : (
              <>
                <strong className="font-medium text-ink">Reception QR</strong> — this page is
                separate from the {spots} pages. Editing it never changes a {spot.toLowerCase()} QR.
              </>
            )}
          </p>
        ) : null}
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-xs text-white shadow-soft"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/** The customer home header (`renderCustomerHome`), shared by reception and spot pages. */
function HomeHead({
  announcement,
  spotName,
  ordering,
}: {
  announcement: string;
  spotName: string;
  ordering: boolean;
}) {
  return (
    <div className="bg-[var(--cp-bg)] px-5 pb-[30px] pt-[26px]">
      {announcement ? (
        <div className="mb-[18px] rounded-control bg-[var(--cp-primary)] px-3 py-2.5 text-center text-[11.5px] leading-[1.45] text-white">
          {announcement.slice(0, 160)}
        </div>
      ) : null}
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--cp-secondary)] font-display text-xl font-medium tracking-[0.02em] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.initials}
      </div>
      <h1 className="mt-2.5 text-center font-display text-[22px] font-medium leading-[1.2] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.name}
      </h1>
      <p className="mt-[3px] text-center text-[12.5px] text-slate-600">{DEMO_BUSINESS.tagline}</p>
      {ordering ? (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-[9px] bg-white/70 px-3 py-2 text-[11.5px] text-ink-muted">
          <Icon name="qr" size={13} />
          <span>
            Ordering for <strong className="font-medium text-ink">{spotName}</strong>
          </span>
        </div>
      ) : null}
      <p className="mt-5 text-center text-[9.5px] leading-[1.5] text-ink-muted">
        Powered by Syehere
      </p>
    </div>
  );
}

function Unavailable({
  title,
  text,
  backHref,
  backLabel,
}: {
  title: string;
  text: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--cp-bg)] p-[30px] text-center">
      <h1 className="text-xl font-medium text-ink">{title}</h1>
      <p className="mt-[7px] text-[12.5px] leading-[1.6] text-ink-muted">{text}</p>
      <Link
        href={backHref}
        className="mt-4 block w-full max-w-[220px] rounded-[10px] border border-black/10 bg-white/70 px-3 py-[11px] text-xs font-medium text-[var(--cp-primary)]"
      >
        {backLabel}
      </Link>
    </div>
  );
}

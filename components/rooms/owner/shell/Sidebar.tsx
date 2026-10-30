"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/rooms/shared/icons";
import { cx } from "@/components/rooms/shared/ui";
import { spotWord } from "@/lib/rooms/format";
import { useOwner } from "../OwnerProvider";

type NavItem = {
  label: string;
  icon: IconName;
  key: string;
  href?: string;
  badge?: string;
  alert?: boolean;
  muted?: boolean;
};

/** Three-state label: visible on desktop, hidden in the 72 px rail, visible in the drawer. */
const NAV_TEXT = "min-[1024px]:max-[1279px]:hidden";

export function Sidebar() {
  const pathname = usePathname();
  const { navOpen, setNavOpen, toast, resetDemo, businessType } = useOwner();
  const words = spotWord(businessType, true);

  const groups: { group: string; items: NavItem[] }[] = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", icon: "dashboard", key: "dashboard" },
        { label: "Feedback", icon: "feedback", key: "feedback" },
        { label: "Analytics", icon: "analytics", key: "analytics" },
      ],
    },
    {
      group: words,
      items: [
        { label: "Locations", icon: "location", key: "locations", href: "/locations" },
        { label: "Orders", icon: "receipt", key: "orders" },
        { label: words, icon: "rooms", key: "rooms", href: "/rooms", badge: "New" },
        { label: "Customer page", icon: "page", key: "editor" },
        { label: "Loyalty", icon: "loyalty", key: "loyalty", muted: true },
      ],
    },
    {
      group: "General",
      items: [
        { label: "Billing", icon: "billing", key: "billing", muted: true },
        { label: "Settings", icon: "settings", key: "settings", muted: true },
      ],
    },
  ];

  const itemClass = (active: boolean, muted?: boolean) =>
    cx(
      "relative flex h-10 w-full items-center gap-2.5 rounded-control px-3 text-left text-[13px] transition-colors",
      active
        ? "bg-white/15 font-medium text-white"
        : "text-white/[0.76] hover:bg-white/10 hover:text-white",
      muted && "opacity-55",
      "min-[1024px]:max-[1279px]:justify-center min-[1024px]:max-[1279px]:px-0",
    );

  const handlePlaceholder = (label: string) => toast(`${label} isn't part of this concept demo.`);

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col gap-3.5 bg-brand-blue p-3 text-white transition-transform duration-200",
        "min-[1024px]:max-[1279px]:w-[72px] min-[1024px]:max-[1279px]:px-2 min-[1024px]:max-[1279px]:py-2.5",
        navOpen ? "max-[1023px]:translate-x-0" : "max-[1023px]:-translate-x-full",
      )}
      aria-label="Dashboard"
    >
      <Link
        href="/locations"
        className="flex min-h-[46px] items-center justify-center rounded-control bg-white px-2.5 py-2"
        aria-label="Syehere dashboard home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rooms/logo-horizontal.svg"
          alt="Syehere"
          className="h-[22px] w-auto min-[1024px]:max-[1279px]:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rooms/logo-icon.svg"
          alt="Syehere"
          className="hidden h-6 w-auto min-[1024px]:max-[1279px]:block"
        />
      </Link>

      <nav className="flex flex-col gap-0.5 overflow-y-auto" aria-label="Dashboard navigation">
        {groups.map((group) => (
          <div key={group.group}>
            <div
              className={cx(
                "mx-0 mb-[5px] mt-3 px-3 text-[10px] uppercase tracking-[0.06em] text-white/60",
                NAV_TEXT,
              )}
            >
              {group.group}
            </div>
            {group.items.map((item) => {
              const active = item.href ? pathname.startsWith(item.href) : false;
              const inner = (
                <>
                  {active && (
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-pill bg-brand-yellow" />
                  )}
                  <Icon name={item.icon} />
                  <span className={cx(NAV_TEXT, "max-[1023px]:inline")}>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cx(
                        "ml-auto rounded-pill bg-brand-yellow px-1.5 py-0.5 text-[9px] font-medium tracking-[0.04em] text-yellow-900",
                        NAV_TEXT,
                        "max-[1023px]:inline-block",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              );
              if (item.href) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={itemClass(active, item.muted)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  className={itemClass(false, item.muted)}
                  onClick={() => handlePlaceholder(item.label)}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto min-[1024px]:max-[1279px]:hidden">
        <div className="rounded-card bg-white/10 p-3 text-xs text-white/80">
          <span>{words} QR + ordering live</span>
          <strong className="mt-[3px] block text-[13px] font-medium text-white">
            One page, every {spotWord(businessType, false).toLowerCase()}
          </strong>
          <Link
            href="/rooms"
            className="mt-2 inline-flex h-[30px] items-center rounded-control bg-white px-2.5 text-xs font-medium text-brand-blue"
          >
            Open live orders
          </Link>
        </div>
        {/* DEV-ONLY: reset the standalone demo; deleted at merge. */}
        <button
          type="button"
          className="mt-2 w-full rounded-control bg-white/10 px-3 py-2 text-left text-[11px] text-white/70 hover:bg-white/15"
          onClick={resetDemo}
        >
          Reset demo data
        </button>
      </div>
    </aside>
  );
}

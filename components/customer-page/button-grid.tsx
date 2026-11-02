import { BusinessLogo } from "@/components/business-logo";
import type { BrandTheme } from "@/lib/brand/theme";
import type { BusinessType } from "@/lib/brand/tokens";
import { isStretchedTile, type CustomerButton } from "@/lib/customer-page";
import {
  ClockIcon,
  CurrencyRupeeIcon,
  GiftIcon,
  LinkIcon,
  ListIcon,
  MapIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "./icons";

/** Automatic icon per button (and per business type for Menu). No picker. */
function ButtonIcon({
  kind,
  businessType,
}: {
  kind: CustomerButton["kind"];
  businessType: BusinessType;
}) {
  switch (kind) {
    case "menu":
      // brand-guide.md: the Menu icon is the business-type icon; "other" is a list.
      return businessType === "other" ? (
        <ListIcon size={26} />
      ) : (
        <BusinessLogo type={businessType} size={26} />
      );
    case "hours":
      return <ClockIcon size={26} />;
    case "call":
      return <PhoneIcon size={26} />;
    case "whatsapp":
      return <WhatsAppIcon size={26} />;
    case "directions":
      return <MapIcon size={26} />;
    case "pay":
      return <CurrencyRupeeIcon size={26} />;
    case "loyalty":
      return <GiftIcon size={26} />;
    case "custom":
      return <LinkIcon size={26} />;
  }
}

export function tileClasses(stretched: boolean): string {
  return [
    "inline-flex w-full flex-col items-center justify-center gap-xs rounded-control",
    "border border-black/10 bg-white px-sm text-center text-[13px] font-medium leading-snug",
    "transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    stretched ? "col-span-2 min-h-[50px]" : "min-h-[70px]",
  ].join(" ");
}

type ButtonGridProps = {
  buttons: CustomerButton[];
  businessType: BusinessType;
  theme: BrandTheme;
  onOpenMenu: () => void;
  onOpenHours: () => void;
  onOpenPay: () => void;
  onOpenLoyalty: () => void;
};

/**
 * Adaptive grid computed at render time (PRD 5.5.5, business-rules.md 11 rule
 * 18): 2 columns, an odd last button stretches, 0 buttons draws nothing.
 */
export function ButtonGrid({
  buttons,
  businessType,
  theme,
  onOpenMenu,
  onOpenHours,
  onOpenPay,
  onOpenLoyalty,
}: ButtonGridProps) {
  if (buttons.length === 0) return null;

  return (
    <div className="mt-2xl grid grid-cols-2 gap-md">
      {buttons.map((button, index) => {
        const stretched = isStretchedTile(index, buttons.length);
        const classes = tileClasses(stretched);
        const inner = (
          <>
            <span style={{ color: theme.primary }}>
              <ButtonIcon kind={button.kind} businessType={businessType} />
            </span>
            <span className="text-ink">{button.label}</span>
          </>
        );

        if (button.href) {
          const isCall = button.kind === "call";
          return (
            <a
              key={button.key}
              href={button.href}
              {...(isCall
                ? {}
                : { target: "_blank", rel: "noopener noreferrer nofollow" })}
              className={classes}
            >
              {inner}
            </a>
          );
        }

        return (
          <button
            key={button.key}
            type="button"
            onClick={
              button.screen === "menu"
                ? onOpenMenu
                : button.screen === "hours"
                  ? onOpenHours
                  : button.screen === "loyalty"
                    ? onOpenLoyalty
                    : onOpenPay
            }
            className={classes}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

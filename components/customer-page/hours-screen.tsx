import type { BrandTheme } from "@/lib/brand/theme";
import {
  buildTelLink,
  buildWhatsAppLink,
  isValidPhone,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "@/lib/customer-page";
import type { PageConfig } from "@/lib/mock/customer-page";
import { BackButton } from "./back-button";
import { PhoneIcon, WhatsAppIcon } from "./icons";

/**
 * Hours and contact screen (PRD 5.5.7, customer-page-ui-spec.md 1.4).
 * "Open now" / "Closed" is computed on the server in the business time zone.
 */
export function HoursScreen({
  hours,
  whatsappPhone,
  openNow,
  theme,
  onBack,
}: {
  hours: PageConfig["buttons"]["hours"];
  whatsappPhone: string;
  openNow: boolean;
  theme: BrandTheme;
  onBack: () => void;
}) {
  const phone = hours.phone.trim();
  const whatsapp = whatsappPhone.trim();
  const address = hours.address.trim().slice(0, 200);
  const note = hours.note.trim().slice(0, 100);

  return (
    <div>
      <BackButton
        label="Hours and contact"
        onBack={onBack}
        color={theme.primary}
        onPrimary={theme.onPrimary}
      />

      <p className="mt-xl">
        <span
          className={`inline-flex items-center rounded-pill border px-md py-xs text-[13px] font-medium ${
            openNow
              ? "border-brand-green/30 bg-brand-green/10 text-brand-green-deep"
              : "border-black/10 bg-black/[0.04] text-ink-muted"
          }`}
        >
          {openNow ? "Open now" : "Closed"}
        </span>
      </p>

      <ul className="mt-lg grid gap-sm">
        {WEEKDAY_ORDER.map((day) => {
          const entry = hours.week[day];
          const ranges =
            entry && !entry.closed && entry.ranges.length > 0
              ? entry.ranges.map((range) => `${range.open}–${range.close}`).join(", ")
              : "Closed";
          return (
            <li
              key={day}
              className="flex items-baseline justify-between gap-md text-[14px]"
            >
              <span className="text-ink-muted">{WEEKDAY_LABELS[day]}</span>
              <span className="tabular-nums">{ranges}</span>
            </li>
          );
        })}
      </ul>

      {address ? (
        <p className="mt-lg text-[14px] leading-relaxed text-ink">{address}</p>
      ) : null}
      {note ? (
        <p className="mt-sm text-[13px] text-ink-muted">{note}</p>
      ) : null}

      <div className="mt-lg grid grid-cols-2 gap-md">
        {isValidPhone(phone) ? (
          <a
            href={buildTelLink(phone)}
            className="inline-flex min-h-[52px] items-center justify-center gap-xs rounded-control border border-black/10 bg-white text-[15px] font-medium text-ink hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span style={{ color: theme.primary }}>
              <PhoneIcon size={20} />
            </span>
            Call
          </a>
        ) : null}
        {isValidPhone(whatsapp) ? (
          <a
            href={buildWhatsAppLink(whatsapp)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-[52px] items-center justify-center gap-xs rounded-control border border-black/10 bg-white text-[15px] font-medium text-ink hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span style={{ color: theme.primary }}>
              <WhatsAppIcon size={20} />
            </span>
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

import { BusinessLogo } from "@/components/business-logo";
import type { BrandTheme } from "@/lib/brand/theme";
import type { CustomerButton } from "@/lib/customer-page";
import type { MockBusiness, SocialKey } from "@/lib/mock/customer-page";
import { displayableLogo } from "@/lib/mock/store";
import { Confetti } from "./confetti";
import { SocialRow } from "./social-row";

const DEFAULT_HAPPY = "Thanks so much — we're glad you had a good time!";
const DEFAULT_UNHAPPY =
  "Thank you for telling us. Your message goes straight to the owner and our team — we read every one. We truly appreciate you taking the time to help us improve.";

type ThanksScreenProps = {
  business: MockBusiness;
  theme: BrandTheme;
  /** Owner's optional thank-you message (already clamped to 160). */
  thankYou: string;
  socials: { key: SocialKey; url: string }[];
  /** Shown custom link buttons (PRD 5.5.10). */
  links: CustomerButton[];
  path: "happy" | "unhappy" | null;
  onHome: () => void;
};

/** Thank-you page (PRD.md 5.5.10). Custom link buttons are added in T5. */
export function ThanksScreen({
  business,
  theme,
  thankYou,
  socials,
  links,
  path,
  onHome,
}: ThanksScreenProps) {
  const isHappy = path === "happy";
  const message = thankYou || (isHappy ? DEFAULT_HAPPY : DEFAULT_UNHAPPY);
  const logoUrl = displayableLogo(business.logo_url);

  return (
    <div className="relative text-center">
      {isHappy ? <Confetti /> : null}

      <div className="flex justify-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={business.name}
            className="h-14 w-14 rounded-card object-cover"
          />
        ) : (
          <BusinessLogo
            type={business.business_type}
            size={56}
            color={theme.primary}
          />
        )}
      </div>

      <h1 className="mt-lg font-display text-[24px] font-medium leading-tight">
        {isHappy ? "Thank you!" : "Thank you for telling us."}
      </h1>
      <p className="mt-md text-[16px] leading-relaxed text-ink">{message}</p>

      <SocialRow icons={socials} color={theme.primary} className="mt-2xl" />

      {links.length > 0 ? (
        <div className="mt-2xl grid gap-md">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-[50px] items-center justify-center rounded-control border border-black/10 bg-white text-[15px] font-medium text-ink hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onHome}
        className="mt-2xl text-[14px] font-medium text-ink-muted underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Done
      </button>
    </div>
  );
}

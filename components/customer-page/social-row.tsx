import type { SocialKey } from "@/lib/mock/customer-page";
import {
  FacebookIcon,
  InstagramIcon,
  WorldIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  website: "Website",
};

function SocialIcon({ socialKey }: { socialKey: SocialKey }) {
  switch (socialKey) {
    case "instagram":
      return <InstagramIcon size={22} />;
    case "facebook":
      return <FacebookIcon size={22} />;
    case "youtube":
      return <YouTubeIcon size={22} />;
    case "x":
      return <XIcon size={22} />;
    case "website":
      return <WorldIcon size={22} />;
  }
}

type SocialRowProps = {
  /** Only on-and-valid icons (business-level social_links). */
  icons: { key: SocialKey; url: string }[];
  /** Business primary colour, used for the icon glyph. */
  color: string;
  className?: string;
};

/** Centered row of social icons; wraps on narrow phones (PRD 5.5.5). */
export function SocialRow({ icons, color, className = "" }: SocialRowProps) {
  if (icons.length === 0) return null;
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-lg ${className}`}
    >
      {icons.map((icon) => (
        <a
          key={icon.key}
          href={icon.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={SOCIAL_LABELS[icon.key]}
          style={{ color }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <SocialIcon socialKey={icon.key} />
        </a>
      ))}
    </div>
  );
}

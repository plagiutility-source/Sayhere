/**
 * A dish photo, drawn.  MOCK ONLY, replaced in Stage 4.
 *
 * Stage 1 has no image provider or storage, so the "AI photo" is a flat
 * illustration picked by the item name (drink / flat bread / bowl) and the
 * image `variant` (three plating palettes). It is portrait 2:3 on purpose:
 * the real generated photos are 2:3 too, so the thumbnail crop and the
 * full-screen viewer behave exactly as they will with real images.
 *
 * Stage 4: this component keeps its props but renders
 * `<img src={R2_PUBLIC_DOMAIN + image.key} width={1080} height={1620} alt=...>`
 * (thumbnail and full-size files), served from the fixed R2 domain only.
 */

import type { MenuImage } from "@/lib/mock/customer-page";

type Kind = "drink" | "flat" | "bowl";

const DRINK = /coffee|brew|latte|tea|chai|juice|shake|smoothie|lassi|soda|mocktail|mojito|cola|water/i;
const FLAT = /pizza|burger|dosa|roti|naan|paratha|sandwich|wrap|toast|cake|pastry|waffle|pancake|bread|uttapam/i;

function kindFor(name: string): Kind {
  if (DRINK.test(name)) return "drink";
  if (FLAT.test(name)) return "flat";
  return "bowl";
}

const SCENES = [
  { bg: "#2B2420", table: "#3A2F29", plate: "#E7DFD2", inner: "#F6F1E8" },
  { bg: "#1F2A2E", table: "#2B3A3F", plate: "#E1E5E4", inner: "#F2F5F4" },
  { bg: "#3A2326", table: "#4A2E32", plate: "#EDE0D2", inner: "#FAF1E6" },
] as const;

const FOOD: Record<Kind, readonly [string, string, string]> = {
  bowl: ["#C8501E", "#B03A2E", "#D68910"],
  flat: ["#E0A04B", "#D4883A", "#C9A06C"],
  drink: ["#5B3A29", "#8B5A3C", "#3D5A4A"],
};

export function MenuPhoto({
  image,
  name,
  fit = "cover",
  className = "h-full w-full",
}: {
  image: MenuImage;
  name: string;
  /** `cover` fills the box (thumbnails, Fill screen); `contain` shows it all. */
  fit?: "cover" | "contain";
  className?: string;
}) {
  const scene = SCENES[image.variant % SCENES.length];
  const kind = kindFor(name);
  const food = FOOD[kind][image.variant % 3];
  const accent = FOOD[kind][(image.variant + 1) % 3];

  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label={`Photo of ${name}`}
      className={`block ${className}`}
    >
      <rect width="100" height="150" fill={scene.bg} />
      <rect y="36" width="100" height="114" fill={scene.table} />

      {kind !== "drink" ? (
        <>
          <circle cx="50" cy="80" r="41" fill={scene.plate} />
          <circle cx="50" cy="80" r="35" fill={scene.inner} />
        </>
      ) : (
        <>
          <ellipse cx="50" cy="118" rx="26" ry="5" fill="#000" opacity="0.3" />
          <circle cx="50" cy="114" r="20" fill={scene.plate} />
        </>
      )}

      {kind === "bowl" ? (
        <>
          <circle cx="50" cy="80" r="25" fill={food} stroke={accent} strokeWidth="2" />
          <circle cx="42" cy="73" r="5" fill={accent} />
          <circle cx="58" cy="77" r="5" fill={accent} />
          <circle cx="49" cy="89" r="5" fill={accent} />
          <circle cx="40" cy="84" r="4" fill={accent} />
          <path d="M36 76 Q50 63 64 76" stroke="#FAEEDA" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="47" cy="68" r="1.8" fill="#5E9A2E" />
          <circle cx="56" cy="83" r="1.8" fill="#5E9A2E" />
          <circle cx="44" cy="81" r="1.8" fill="#5E9A2E" />
        </>
      ) : null}

      {kind === "flat" ? (
        <>
          <g transform="rotate(-20 50 80)">
            <ellipse cx="50" cy="80" rx="31" ry="13" fill={food} stroke={accent} strokeWidth="1.5" />
            <path d="M24 80 H76 M29 74 H71 M29 86 H71" stroke={accent} strokeWidth="1" opacity="0.6" />
            <ellipse cx="48" cy="80" rx="10" ry="4.5" fill="#FAC775" />
          </g>
          <circle cx="29" cy="102" r="6" fill="#F5C4B3" />
          <circle cx="72" cy="58" r="6" fill="#97C459" />
        </>
      ) : null}

      {kind === "drink" ? (
        <>
          <path d="M34 44 H66 L63 112 Q50 116 37 112 Z" fill={food} stroke="#E6F1FB" strokeWidth="1" />
          <path d="M34 44 H66 L65.5 58 H34.5 Z" fill="#E6F1FB" opacity="0.18" />
          <rect x="38" y="60" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <rect x="50" y="72" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <rect x="38" y="86" width="12" height="12" rx="2" fill="#B5D4F4" opacity="0.55" />
          <path d="M58 26 L54 104" stroke="#FAC775" strokeWidth="3" strokeLinecap="round" />
          <circle cx="70" cy="46" r="3" fill={accent} />
        </>
      ) : null}
    </svg>
  );
}

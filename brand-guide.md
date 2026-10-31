# Brand & Design Guide

## Product Brand Identity (Syehere itself)
This is Syehere's own identity — the logo, dashboard chrome, and admin panel.
It is separate from the per-business customer-facing colors in the table
below, which belong to each client (café, gym, etc.), not to Syehere.

- **Logo files:** `syehere-logo-horizontal-v5.svg` (nav bars, emails, marketing)
  and `syehere-icon-logo-v5.svg` (favicon, app icon, compact spaces).
- **Palette:** blue-to-green gradient mark, `#1D4ED8` → `#0E9F6E`, with a
  yellow ring/link accent, `#FFF08A` → `#FFC61A`, and the wordmark set in a
  matching navy-to-green gradient, `#12307A` → `#0B7A55`, on white or a very
  light neutral background. No gloss/shine — keep fills flat, shadows soft
  and minimal.
- **Typeface:** Poppins, weight 700, for the wordmark; falls back to
  Helvetica Neue/Arial/system sans-serif. This is Syehere's own wordmark
  font — the general UI typography guidance below (Inter or similar) still
  applies to dashboard body text.
- **Where this applies:** the dashboard sidebar/nav chrome and the admin
  panel (per PRD.md 5.1 and admin-spec.md "Design Consistency") use this
  palette. Update any existing mockups or code that used the earlier purple
  chrome (`#241A3D`/`#3B2158`/`#B08D3E`) to the blue-green palette above —
  a solid `#1D4ED8` (or the icon's own gradient) for the sidebar, white/light
  text, and the yellow accent used sparingly (a status dot or small highlight,
  not buttons or large fills).
- **What does NOT use this palette:** the customer-facing review page, QR
  code overlay, and weekly email header — those use the individual
  business's own color (see the table and "Custom Color Override" below).

## Purpose
When a business owner does not upload their own logo, the system must auto-assign
a sensible default vector logo and color theme based on their selected business type,
so the review page never looks broken or generic.

## Default Logo & Color by Business Type

| Business Type | Default Vector Logo | Primary Color | Secondary Color | Tagline Example |
|---|---|---|---|---|
| Café | Coffee cup icon | #213D36 (Deep Forest Green) | #C5DBC8 (Sage / Sea Mist Green) | "Enjoying your coffee?" |
| Restaurant | Plate & fork icon | #A31D1D (Deep Red) | #D4A373 (Warm Tan) | "How was your meal?" |
| Salon | Scissors icon | #3E4752 (Deep Slate) | #C48A62 (Rich Rose-Gold) | "Love your new look?" |
| Gym | Dumbbell icon | #1F2A37 (Charcoal) | #F26B2B (Energy Orange) | "How was your workout?" |
| Retail | Shopping bag icon | #2F5DA8 (Trust Blue) | #F2B544 (Warm Amber) | "How was your shopping?" |
| Other / Unspecified | Star icon | #0F766E (Calm Teal) | #F2B544 (Warm Amber) | "How was your experience?" |

### Page Background and Star Color (all presets)
Every preset also has a light page background so the page stays soft, clean, and
readable. White text is used on every primary color above.

| Business Type | Page Background |
|---|---|
| Café | #EDF4EE (soft sage mist) |
| Restaurant | #FAF3EA (warm cream) |
| Salon | #FBF6F1 (soft blush cream) |
| Gym | #EEF1F4 (cool grey) |
| Retail | #EAF1FB (sky mist) |
| Other / Unspecified | #E6F4F2 (soft mint) |

Rules that apply to presets and custom colors alike:
- **Page background:** presets use the value in the table above. For `custom`
  colors it is derived: the secondary color at 15% strength over white.
- **Star color:** the secondary color, unless it has less than 1.5:1 contrast against
  the page background, in which case the primary color is used (this is why the
  Café stars are deep green, not sage).
- **Text on primary:** white or #1F2937, whichever has better contrast.
- **Body text:** #1F2937, secondary text #6B7280. Never pure black.
- Nothing is stored for these: they are computed in one helper
  (business-rules.md section 10), so the columns stay `primary_color` and
  `secondary_color` only.

Notes for implementation:
- Store default logos as SVG (scalable, tiny file size, easy to recolor via CSS variables).
- The primary color drives buttons, icons, QR code accents, and the emailed weekly
  report header. The secondary color is the accent (highlights, chart emphasis).
  The page background and star color follow the rules listed above.
- Once a business uploads a real logo, it should override the default entirely
  (logo + optionally a custom color picker), but the business-type theme remains
  the fallback default in the color picker.

## Custom Color Override
Presets above are defaults, not limits — every business can override them:
- **Presets** (this page's table) are chips in the appearance settings screen;
  selecting one sets both colors at once and marks `color_source = 'preset'`.
- **Custom picker**: two standalone color inputs (primary, secondary) let an
  owner set an exact brand color instead; this marks `color_source = 'custom'`
  and is NOT overwritten if they later change their listed business type.
- For custom colors, the page background and star color are derived automatically
  (see "Page Background and Star Color"); the owner does not pick them.
- Whichever is active is the single source of truth for the dashboard content
  area, the QR code logo-overlay color, and the weekly email report header —
  one setting, three surfaces, always in sync.
- The dashboard's own sidebar/navigation chrome does not take this color — it
  stays neutral so the product feels consistent regardless of which business
  is logged in. Only the content area, QR, and emails are business-themed.
- See PRD.md section 8.1 for the settings screen spec and business-rules.md
  section 10 for the exact override rules.

## Typography
- Clean, modern sans-serif for UI (e.g. Inter or similar system font stack) — avoid
  anything that reads as a "template" default. See frontend-design skill for more
  detail on avoiding generic AI-app aesthetics.
- Keep customer-facing review pages large-text, thumb-friendly, minimal copy.

## Tone by Moment

| Moment | Emotion | Design Treatment |
|---|---|---|
| Happy review submitted | Celebration | Small confetti animation, green accents, warm thank-you copy |
| Unhappy feedback submitted | Empathy | Warm neutral tones (#F5F1EC background), "we hear you" language, no red/alarm colors. Use the business primary only for the logo and small accents, so a red primary (Restaurant) never reads as an alarm |
| Owner dashboard | Pride / control | Progress bars, clear metrics, calm color palette |

## Mobile-First Rules
- Customer experience: 100% mobile, no app install, no login required
- Owner dashboard: responsive, must work well on a phone screen, not just desktop
- No loading spinners longer than ~1s perceived on the customer review page —
  it should feel instant

## Owner Editor Controls (Customer page editor, dashboard side)
Applies to the on/off control for every button, social icon and "Mark sold out" in the Customer page
editor (PRD.md 5.5.3). It is a dashboard control, so it uses the product palette, not the business color.
- **Off:** white fill, 1.5 px black border (the primary text token; it flips to a light border in dark
  mode), label **Activate**.
- **On:** solid blue `#1D4ED8` fill, white text, tick icon, label **Active**.
- 36 px minimum height, 8 px radius, 13 px medium label. Never a white-on-white or grey ghost toggle.
- Status is never shown by color alone (label and tick also change).
- Status badges (Needs a link, Check link) use the warning tint, small pill, 12 px text.

## Customer Page Buttons (public side)
- Icon-above-label tiles in a 2-column grid, white tile with a hairline border, icon in the business
  primary color, at least 70 px tall, at least 44 px tap target.
- Icons are automatic (Tabler outline set) and never chosen by the owner: Menu by business type (café
  cup, restaurant fork and knife, salon scissors, gym dumbbell, retail bag, other list), Wi-Fi, clock for
  Hours and contact, phone for Call, WhatsApp logo, map for Directions, link for custom links, and the
  brand logo for each social icon.
- Layout rules (odd last button stretches, empty grid hidden): PRD.md 5.5.5. Wireframes:
  `customer-page-ui-spec.md`.


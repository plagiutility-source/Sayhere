# Customer Page: UI Spec (screens and wireframes)

Companion to PRD.md section 5.5. Behavior and rules live in the PRD and business-rules.md section 11;
this file describes what each screen looks like. Sample content is a café ("Brew and Bean") with the
café theme (primary `#213D36`, secondary `#C5DBC8`, page background `#EDF4EE`, from brand-guide.md).

---

## 1. Public side (what the customer sees)

### 1.1 Home, default (owner changed nothing)
```
+--------------------------------+
|            (logo)              |
|         Brew and Bean          |
|     Enjoying your coffee?      |
|                                |
|   How was your experience?     |
|   [  (thumbs up)  Great  ]    |
|   [  (thumbs down) Not great ] |
|                                |
|   (social icons, only if any)  |
+--------------------------------+
```
Thumbs up and thumbs down both open the SAME chooser page (1.5) — the customer picks
**Continue on Google** or **Contact the owner**, two equally clear options. No login, no app.

### 1.2 Home, customized (buttons and icons switched on)
```
+--------------------------------+
| Buy 1 get 1 free on cold brew  |  <- announcement (optional, above review)
|            (logo)              |
|         Brew and Bean          |
|     Enjoying your coffee?      |
|   How was your experience?     |
|   [  (thumbs up)  Great  ]    |  <- review block: always first, cannot be removed
|   [  (thumbs down) Not great ] |
|  +----------+ +----------+     |
|  |  (cup)   | |  (wifi)  |     |  <- button grid, 2 columns, icon above label
|  |  Menu    | |  Wi-Fi   |     |
|  +----------+ +----------+     |
|  +----------+ +----------+     |
|  | (clock)  | |  (map)   |     |
|  | Hours and| |Directions|     |
|  | contact  | |          |     |
|  +----------+ +----------+     |
|   (insta)  (facebook)  (yt)    |  <- social icon row, centered
+--------------------------------+
```

### 1.3 Grid re-flow (computed at render time from shown items)
| Shown buttons | Layout |
|---|---|
| 0 | No grid drawn |
| 1 | `[ Menu ............ ]` full width |
| 2 | `[ Menu ][ Wi-Fi ]` |
| 3 | `[ Menu ][ Wi-Fi ]` then `[ Hours and contact ]` stretched |
| 4 | 2 x 2 |
| 5 | two rows of two, then the last stretched |

An item is "shown" only when it is Active AND its value is valid. Social icons: one centered row that
wraps; hidden when none are shown.

### 1.4 Screens opened by buttons (each has a 44 px back arrow and a title)
- **Menu** (or Services and prices, Products): list headings with items. Each item shows name, tag chip
  and price; "What's in it" in small text under the name; Sold out items greyed with a chip. An item with an AI photo shows a 72 px square thumbnail on the right;
  tapping it opens the photo full screen (Fit by default, a "Fill screen" button, a 44 px close button,
  name, price, details and "AI-generated image, for illustration"). A one-line note under the list says
  photos are AI-generated for illustration.
```
  <-  Menu
  Coffee
  Cold brew  [Popular]             Rs 180
  Cold-steeped 12 hours, served over ice
  Cappuccino                       Rs 160
  Bites
  Veg sandwich  [Veg]              Rs 140
  Grilled bread, cucumber, tomato, cheese, chutney
  Brownie  [Sold out]              Rs 120   (greyed)
```
- **Wi-Fi** (Phase D): wifi icon, network name, password, **Copy password** (shows "Password copied").
- **Hours and contact:** "Open now" or "Closed", weekly hours, address, **Call** and (if set) WhatsApp.
- **Call, WhatsApp, Directions:** no screen. They open the phone dialer, a WhatsApp chat, or Google Maps.

### 1.5 Review flow screens (thumbs → chooser → Google or private message)
Owner request, 2026-10-14. Both thumbs land on the **same** chooser page.
```
  <-  Thank you!
        How would you like to continue?
   Both options help Brew and Bean - pick whichever feels right.
   +--------------------------------+
   | (star) Continue on Google      |   <- both options same size, same weight
   |        Share your experience   |
   |        publicly in a Google    |
   |        review.                 |
   +--------------------------------+
   | (chat) Contact the owner       |
   |        Send a private message  |
   |        - the owner and our     |
   |        team read every one.    |
   +--------------------------------+
   No wrong choice - you can always do both.
```
**Continue on Google** opens the Google screen. The plain **Post a review on Google** button is
ALWAYS visible there (it is never hidden behind the questions):
```
  <-  Google review
   Two ways to do it - pick whichever feels easier.
   [ (star) Post a review on Google ]   <- direct link, shown whenever the URL is valid
   Opens Google - write whatever feels right.
   Want us to write it for you?
   Answer a few quick questions and we'll write a review you can copy and paste on Google.
   [ Write it for me ]
   The Google button above always works - the questions are optional.
```
If the Google link is invalid the button is replaced by "The Google link isn't available right now.
You can still tell the owner below" and the questions stay.

**Write it for me** opens the questions screen — short, tailored to the business type, every answer
optional, "Write my review" enabled once at least one answer exists. Café example:
```
  <-  A few quick questions
   Answer as much or as little as you like - we only use what you tell us.
   What did you have?            [ Cold brew and a brownie        ]
   How much did you spend?       [Under Rs 200][Rs 200-Rs 500][...]
   Who were you with?            [Solo][Couple][Friends][Family][Colleagues]
   What did you like the most?   [Coffee][Food][Service][Ambience][Prices]
   [ Write my review ]
```
The review screen is unchanged (1.1 in PRD 3.2): the generated text uses ONLY the answers given
(`lib/mock/review.ts`), with **Copy review** and **Post to Google**.

**Contact the owner** opens the private feedback form (message + optional email). Its heading is
neutral ("What's on your mind?") because happy and unhappy customers both reach it, and it carries
the appreciation line "We appreciate you taking the time to help us improve". After submitting, the
thank-you screen thanks them again for helping us improve.

---

## 2. Owner side (Customer page editor)

### 2.1 Layout
Desktop: editor on the left, sticky live phone preview (375 px) on the right. Under 1024 px the preview
opens in a drawer from a **Preview** button.

### 2.2 Activate / Active control
```
Off:  [ Activate ]   white fill, 1.5 px black border, black text
On:   [ v Active ]   blue #1D4ED8 fill, white text and tick
```
Used for every button, every social icon and "Mark sold out". Toggle button with `aria-pressed`.

### 2.3 Item rows
```
BUTTONS
(card)  Loyalty card       [ v Active ]   <- same switch as Loyalty > Settings; always first on the page
(cup)   Menu               [ v Active ]
(wifi)  Wi-Fi              [ v Active ]
        Network name  [ BrewGuest        ]
        Password      [ bean2026         ]
        Customers see the network and a Copy password button.
(clock) Hours and contact  [ v Active ]
(phone) Call    Needs a link   [ v Active ]   <- amber badge, hidden from customers until fixed
        Phone number  [                  ]
(wa)    WhatsApp           [ Activate ]
(map)   Directions         [ v Active ]
        Address or Google Maps link [ 12 Linking Road, Bandra ]

SOCIAL ICONS
(insta) Instagram          [ v Active ]
        Instagram link  [ https://instagram.com/brewandbean ]
(fb)    Facebook           [ Activate ]
...
(lock)  Review buttons     Always shown
```
Fields appear only while the item is Active. Turning an item off hides its fields and keeps the values.

### 2.4 Field checks (inline, as the owner types)
| Field | Error text |
|---|---|
| Any link | "Link must start with https://" |
| Social link on the wrong site | "Link must be on instagram.com" (host of that platform) |
| Link with username or password | "Links cannot contain a username or password" |
| Phone or WhatsApp | "Enter 7 to 15 digits, with an optional + at the start" |
| Directions link not on Google Maps | "Link must be on google.com" (or paste an address instead) |

Error text is 12 px, danger color, directly under the field. Save is blocked while an Active item is
invalid; the owner fixes it or turns it off.

### 2.5 Menu builder

The Menu row has two ways in, as a segmented switch (`aria-pressed`):
```
[ ✨ Upload PDF ] [ Type manually ]
```
An empty menu opens on **Upload PDF**; a menu that already has content opens on **Type manually**.
Switching never deletes anything. Both paths are PRD 5.5.6.

**Upload PDF panel (empty menu)**
```
[sparkle]  Let AI build your menu
           Upload a PDF. AI finds the lists, items and prices, writes short
           descriptions and creates a photo for each dish. You review
           everything before it is added.
           [ Upload menu PDF ]
           PDF up to 8 MB · 60 items on your plan · 3 AI photos left
           Prefer to type it yourself? Switch to "Type manually".
```
The plan name/number and remaining AI photos come from the same live meters as the rest of the editor.
On Starter/Pro/Enterprise the item count is the plan limit; Free shows its 10-item limit.

**Manual builder**
```
Menu                                   Items 4 / 60
The Menu button is shown to customers.

The menu title is editable (max 40).
[ Coffee ..................... ] [trash]
  [ Cold brew ............ ][ Rs 180 ] [x]
  Hide details
    What's in it (optional)
    [ Cold-steeped 12 hours, served over ice        ]
    Tag (optional)   [ Popular v ]
    [ Mark sold out ]           <- same Activate style (blue when on)
  [ Cappuccino ........... ][ Rs 160 ] [x]
  Add details (optional)
  Add item
[ Bites ...................... ] [trash]
  ...
Add category
```
Only the item name is needed. Price, "What's in it", tag and sold out are optional. No link field, no
owner image upload. Each item has a photo square with Add photo / Change photo / Remove photo, which
opens the AI photo dialog (AI_MENU_PHOTOS.md); the row header shows "AI photos 3 / 3 left (trial)". At the plan limit: "Item limit reached. Upgrade for more items." With no named items the
editor shows "The Menu button stays hidden until you add at least one item."

### 2.5.1 Menu PDF import dialog
One centered modal, max width 640 px, four steps. The footer changes with the step; Escape/close is
blocked while reading or creating photos.

**1. Pick.** Title **Upload your menu PDF**. A dashed drop zone (“Drop your menu PDF here” / “or choose
the file from your device”) with **Choose PDF**; the same file picker is used by click, keyboard and drop.
Helper: “One PDF, up to 8 MB.” A short “What AI does for you” list (finds lists/items/prices/details,
writes short descriptions and tags, creates a photo per dish within the plan, shows everything for
review). Amber demo note: the reading step is simulated in this build; upload, review, limits, photos
and Save work as they will in production. Footer: **Cancel**.

**2. Reading.** Title stays **Upload your menu PDF**. The staged progress list runs (“Reading your
PDF”, “Finding dishes and prices”, “Grouping them into lists”, “Writing short descriptions”, “Matching
photos to dishes”) with a spinner on the current stage and ticks on completed stages. Shows “Reading
<file>…”. Footer: **Cancel**.

**3. Review.** Title **Check your menu**. Amber demo-extraction note; file name and “N items in N
lists”; “N selected”; “Uncheck anything you do not want. Every item stays editable after it is added.”
Each list is a section; each item is a checkbox with name, price, tag and details. A list over the
12-list cap is disabled with “cannot be added (12-list limit)”. Once the plan item limit is reached,
unchecked rows disable and show “Plan item limit reached. Uncheck a dish or upgrade for more.” The
summary shows plan/menu slots left and how many selected dishes will get an AI photo (or that the
allowance is used up, so they are added without photos). Footer: **Choose another PDF** and
**Add N items** (disabled at zero).

**4. Creating photos.** Title **Creating dish photos**. Shows “Creating N AI photos…” and “Your menu is
added right after. Keep this window open.” No footer. When it finishes the dialog closes, the editor
switches to Type manually and a green status line reports: “Added N items from <file> with N AI
photos” (or “without photos”), plus “; N did not fit your plan” when rows were skipped.

**Errors:** wrong type, over 8 MB, unreadable/encrypted PDF or extraction failure shows a plain message
in the dialog and returns to Pick; nothing is added. A missing file, cancelled reading or closed dialog
never changes the menu.

**Limits:** 8 MB per PDF; 12 lists and the plan's item limit are enforced at review, not only at save;
photos are reserved once for the selected dishes, capped by plan credits and the daily photo cap; a
failed photo batch refunds every reserved credit. The PDF is never published, served or linked from the
customer page; production storage and deletion are in security-and-reliability.md section 4.

### 2.6 Top bar
Location selector (only with more than one location), **Save changes**, **Discard**,
**Reset to default** (asks to confirm, keeps social icons), **View live page**, usage meters.
Save publishes immediately. Leaving with unsaved edits asks "Discard changes?".

---

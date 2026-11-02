/**
 * Tables & Rooms constants — spec section 6, values taken from the demo
 * (`reference/_demo-rooms-feature/app.js`). Never invent a new value here.
 */

/** How long a paid bill stays downloadable. */
export const PAID_BILL_WINDOW_MS = 5 * 60 * 1000;

/** A join request nobody answers expires. */
export const JOIN_REQUEST_TTL_MS = 2 * 60 * 1000;

/** The 6-digit join code the host reads out. */
export const JOIN_CODE_TTL_MS = 5 * 60 * 1000;
export const JOIN_CODE_MIN = 100000;
export const JOIN_CODE_MAX = 999999;
export const JOIN_MAX_ATTEMPTS = 5;

/** Open item O8: 12 spots per location. */
export const MAX_ROOMS_PER_LOCATION = 12;

/** Waiters. */
export const WAITER_MAX_MIN = 1;
export const WAITER_MAX_MAX = 8;
export const WAITER_MAX_DEFAULT = 3;
/** The Add waiter dialog offers 2–6; the row dropdown offers 1–8. */
export const WAITER_MAX_ADD_OPTIONS = [2, 3, 4, 5, 6] as const;
export const WAITER_MAX_ROW_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Guests. */
export const GUESTS_MIN = 1;
export const GUESTS_MAX = 12;
export const GUESTS_DEFAULT = 2;
export const GUESTS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Cart quantity per item, punch included. */
export const CART_MAX_QTY = 20;

/** Input limits (slice values from the demo). */
export const NAME_MAX = 40;
export const PHONE_MAX = 20;
export const WAITER_NAME_MAX = 30;
export const ROOM_NAME_MAX = 40;
export const EMAIL_MAX = 120;
export const ANNOUNCEMENT_MAX = 160;
export const THANK_YOU_MAX = 160;
export const FEEDBACK_MAX = 1000;

/** Order numbers start here: max(existing, 1040) + 1. */
export const BASE_ORDER_NUMBER = 1040;

/** Live sync. */
export const POLL_INTERVAL_MS = 2500;
export const COUNTDOWN_TICK_MS = 1000;

/** Alert ring: rings at 0, 2, 4, 6, 8 s then stops (10 s window). */
export const ALERT_RING_WINDOW_MS = 10000;
export const ALERT_RING_INTERVAL_MS = 2000;

/** Bell: 880 Hz triangle, then 1174.66 Hz and 1567.98 Hz sine. */
export const BELL_STEP_SECONDS = 0.16;
export const BELL_DECAY_SECONDS = 0.65;
export const BELL_TONES = [
  { frequency: 880, type: "triangle", gain: 0.22 },
  { frequency: 1174.66, type: "sine", gain: 0.12 },
  { frequency: 1567.98, type: "sine", gain: 0.12 },
] as const;

/** Currency (open item O7): INR, en-IN formatting. */
export const CURRENCY_SYMBOL = "\u20b9";
export const CURRENCY_LOCALE = "en-IN";

/** Only these three storage keys are allowed (spec section 4). */
export const STORAGE_KEYS = {
  state: "syehere.mock.rooms.v1",
  sound: "syehere.mock.rooms.sound",
  device: "syehere.mock.rooms.device",
} as const;

/** Period bar. */
export const PERIODS = {
  today: { label: "Today", stat: "today", range: "today", days: 1, previousLabel: "yesterday" },
  week: { label: "Week", stat: "this week", range: "last 7 days", days: 7, previousLabel: "previous 7 days" },
  fortnight: {
    label: "15 days",
    stat: "last 15 days",
    range: "last 15 days",
    days: 15,
    previousLabel: "previous 15 days",
  },
  month: {
    label: "Month",
    stat: "last 30 days",
    range: "last 30 days",
    days: 30,
    previousLabel: "previous 30 days",
  },
} as const;

export type PeriodKey = keyof typeof PERIODS;

export type PeriodDef = (typeof PERIODS)[PeriodKey];

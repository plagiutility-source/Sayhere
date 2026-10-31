/**
 * Loyalty program rules as PURE functions — ONE place (business-rules.md
 * section 12, PRD.md 5.7).
 *
 * Why this file exists: a loyalty card is only worth something if stamps can
 * not be faked. Every rule that decides "does this person get a stamp / a
 * reward" lives here, takes the whole state plus `now`, and returns a NEW
 * state or a typed error. Nothing here touches a browser, a database or the
 * clock.
 *
 * - Stage 1 (now): `lib/mock/loyalty-store.ts` keeps the state in
 *   localStorage and calls these functions, so the owner and customer screens
 *   behave exactly like the real thing. localStorage can be edited by anyone,
 *   so the mock is NOT secure — it only proves the flow.
 * - Stage 3: the same functions run on the server inside one database
 *   transaction per action (libSQL batch), with `business_id` on every row.
 *   The customer's browser then only ever sends a code and receives a result;
 *   it can never send "give me a stamp".
 *
 * Anti-fake rules enforced here:
 *  1. A stamp needs a one-time code that expires in 60 seconds. The code comes
 *     either from the customer's card (staff types/scans it) or from the
 *     counter screen (customer types/scans it). The printed review QR is never
 *     a stamp source.
 *  2. A code works once. A used or expired code is rejected.
 *  3. Cooldown between stamps and a rolling 24 hour cap per customer.
 *  4. The stamp balance is DERIVED from an append-only ledger. It is never a
 *     number anyone can edit. Voiding keeps the row, marked voided.
 *  5. A reward exists only after a full card, is chosen from the owner's
 *     active offers, copies the offer terms, and can be redeemed once.
 *  6. Staff identity is recorded on every stamp and redemption.
 *
 * Stage 3 notes: generate codes with a CSPRNG and store only a hash; hash
 * staff PINs with a slow hash (scrypt/argon2); keep the same limits.
 */

// ---------------------------------------------------------------------------
// Limits (owner-tunable values are clamped to these ranges)
// ---------------------------------------------------------------------------

export const LOYALTY_LIMITS = {
  /** Stamps needed to complete a card. */
  stampsMin: 3,
  stampsMax: 20,
  /** Minimum hours between two stamps for one customer. */
  gapHoursMin: 0,
  gapHoursMax: 72,
  /** Stamps per customer per rolling 24 hours. */
  dailyCapMin: 1,
  dailyCapMax: 5,
  /** Days a chosen reward stays valid. */
  rewardDaysMin: 7,
  rewardDaysMax: 365,
  /** Offers: at most 5 active at once, 20 stored in total. */
  maxActiveOffers: 5,
  maxOffers: 20,
  titleMax: 40,
  descriptionMax: 120,
  monthlyLimitMax: 100000,
  /** Staff. */
  maxStaff: 10,
  staffNameMin: 2,
  staffNameMax: 40,
  pinMin: 4,
  pinMax: 6,
  /** Codes. */
  codeTtlMs: 60_000,
  rewardCodeAlphabet: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
  /** PIN lockout. */
  pinMaxFailures: 5,
  pinLockMs: 5 * 60_000,
  /** Housekeeping: used/expired codes older than this are dropped. */
  tokenKeepMs: 10 * 60_000,
} as const;

// ---------------------------------------------------------------------------
// Types (field names match the loyalty tables in schema.sql)
// ---------------------------------------------------------------------------

export type StampMode = "member_code" | "counter_code" | "both";
export type StampMethod = "member_code" | "counter_code";
export type OfferKind = "free_item" | "percent_off" | "amount_off" | "custom";

export type LoyaltyProgram = {
  enabled: boolean;
  stamps_required: number;
  min_gap_hours: number;
  daily_cap: number;
  reward_valid_days: number;
  stamp_mode: StampMode;
};

export type RewardOffer = {
  id: string;
  title: string;
  description: string;
  kind: OfferKind;
  /** Max claims per calendar month (UTC); null = unlimited. */
  monthly_limit: number | null;
  active: boolean;
  sort_order: number;
};

export type StaffMember = {
  id: string;
  name: string;
  pin_hash: string;
  pin_salt: string;
  active: boolean;
  created_at: string;
};

export type LoyaltyMember = {
  id: string;
  email: string | null;
  email_verified_at: string | null;
  created_at: string;
  /** Set when the member is deleted; the email is removed, the ledger stays. */
  deleted_at: string | null;
};

export type StampEntry = {
  id: string;
  member_id: string;
  staff_id: string | null;
  method: StampMethod;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
};

export type ClaimStatus = "earned" | "redeemed" | "cancelled";

export type RewardClaim = {
  id: string;
  member_id: string;
  offer_id: string;
  /** Copied from the offer when chosen; later offer edits never change it. */
  title: string;
  description: string;
  code: string;
  status: ClaimStatus;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

export type StampToken = {
  id: string;
  kind: "member" | "counter";
  member_id: string | null;
  code: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

export type PinLock = { failures: number; locked_until: string | null };

export type LoyaltyState = {
  version: 1;
  program: LoyaltyProgram;
  offers: RewardOffer[];
  staff: StaffMember[];
  members: LoyaltyMember[];
  stamps: StampEntry[];
  claims: RewardClaim[];
  tokens: StampToken[];
  pin_lock: PinLock;
};

/** Every error the rules can return. Messages are plain, customer-safe text. */
export type LoyaltyErrorCode =
  | "program_off"
  | "member_not_found"
  | "email_not_verified"
  | "mode_disabled"
  | "invalid_code"
  | "too_soon"
  | "daily_cap"
  | "no_reward_pending"
  | "offer_unavailable"
  | "reward_not_found"
  | "reward_expired"
  | "reward_used"
  | "reward_cancelled"
  | "staff_not_found"
  | "stamp_not_found"
  | "already_voided"
  | "claim_not_cancellable"
  | "invalid_input"
  | "limit_reached";

export type Fail = { ok: false; code: LoyaltyErrorCode; message: string };
export type Done<T> = { ok: true; state: LoyaltyState } & T;
export type Result<T = object> = Done<T> | Fail;

export type Rng = () => number;

function fail(code: LoyaltyErrorCode, message: string): Fail {
  return { ok: false, code, message };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Removes control, zero-width and bidi characters (security 4C). */
function clean(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,
      "",
    )
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function newId(prefix: string, rng: Rng = Math.random): string {
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += Math.floor(rng() * 36).toString(36);
  }
  return `${prefix}_${out}`;
}

function randomDigits(length: number, rng: Rng): string {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(rng() * 10).toString();
  return out;
}

function randomRewardCode(rng: Rng): string {
  const alphabet = LOYALTY_LIMITS.rewardCodeAlphabet;
  const pick = () => alphabet[Math.floor(rng() * alphabet.length)];
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) {
    a += pick();
    b += pick();
  }
  return `${a}-${b}`;
}

/** Customers and staff may type codes with spaces or dashes; ignore both. */
export function normalizeCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

const iso = (date: Date) => date.toISOString();
const ms = (value: string) => new Date(value).getTime();

// ---------------------------------------------------------------------------
// Defaults and validation
// ---------------------------------------------------------------------------

export function defaultProgram(): LoyaltyProgram {
  return {
    enabled: true,
    stamps_required: 10,
    min_gap_hours: 4,
    daily_cap: 1,
    reward_valid_days: 30,
    stamp_mode: "both",
  };
}

export function emptyLoyaltyState(): LoyaltyState {
  return {
    version: 1,
    program: defaultProgram(),
    offers: [],
    staff: [],
    members: [],
    stamps: [],
    claims: [],
    tokens: [],
    pin_lock: { failures: 0, locked_until: null },
  };
}

const MODES: StampMode[] = ["member_code", "counter_code", "both"];
const KINDS: OfferKind[] = ["free_item", "percent_off", "amount_off", "custom"];

/** Clamps every owner-tunable field into its allowed range. */
export function normalizeProgram(input: Partial<LoyaltyProgram>): LoyaltyProgram {
  const base = defaultProgram();
  const L = LOYALTY_LIMITS;
  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : base.enabled,
    stamps_required: clamp(
      input.stamps_required ?? base.stamps_required,
      L.stampsMin,
      L.stampsMax,
    ),
    min_gap_hours: clamp(
      input.min_gap_hours ?? base.min_gap_hours,
      L.gapHoursMin,
      L.gapHoursMax,
    ),
    daily_cap: clamp(
      input.daily_cap ?? base.daily_cap,
      L.dailyCapMin,
      L.dailyCapMax,
    ),
    reward_valid_days: clamp(
      input.reward_valid_days ?? base.reward_valid_days,
      L.rewardDaysMin,
      L.rewardDaysMax,
    ),
    stamp_mode: MODES.includes(input.stamp_mode as StampMode)
      ? (input.stamp_mode as StampMode)
      : base.stamp_mode,
  };
}

export function setProgram(
  state: LoyaltyState,
  input: Partial<LoyaltyProgram>,
): LoyaltyState {
  return {
    ...state,
    program: normalizeProgram({ ...state.program, ...input }),
  };
}

export type OfferInput = {
  id?: string;
  title: string;
  description: string;
  kind: OfferKind;
  monthly_limit: number | null;
  active: boolean;
};

/** Creates or edits an offer. Max 5 active, 20 stored. */
export function saveOffer(
  state: LoyaltyState,
  input: OfferInput,
  rng: Rng = Math.random,
): Result<{ offer: RewardOffer }> {
  const L = LOYALTY_LIMITS;
  const title = clean(input.title);
  const description = clean(input.description);
  if (title.length < 2 || title.length > L.titleMax) {
    return fail(
      "invalid_input",
      `Give the reward a title of 2 to ${L.titleMax} characters.`,
    );
  }
  if (description.length > L.descriptionMax) {
    return fail(
      "invalid_input",
      `Keep the description under ${L.descriptionMax} characters.`,
    );
  }
  if (!KINDS.includes(input.kind)) {
    return fail("invalid_input", "Choose a reward type.");
  }
  let monthly: number | null = null;
  if (input.monthly_limit !== null) {
    if (
      !Number.isInteger(input.monthly_limit) ||
      input.monthly_limit < 1 ||
      input.monthly_limit > L.monthlyLimitMax
    ) {
      return fail(
        "invalid_input",
        "The monthly limit must be a whole number from 1 up, or left empty.",
      );
    }
    monthly = input.monthly_limit;
  }

  const existing = input.id
    ? state.offers.find((offer) => offer.id === input.id)
    : undefined;
  if (input.id && !existing) {
    return fail("invalid_input", "That reward no longer exists.");
  }
  if (!existing && state.offers.length >= L.maxOffers) {
    return fail("limit_reached", `You can store up to ${L.maxOffers} rewards.`);
  }
  const activeOthers = state.offers.filter(
    (offer) => offer.active && offer.id !== existing?.id,
  ).length;
  if (input.active && activeOthers >= L.maxActiveOffers) {
    return fail(
      "limit_reached",
      `Only ${L.maxActiveOffers} rewards can be active at once. Pause one first.`,
    );
  }

  const offer: RewardOffer = {
    id: existing?.id ?? newId("offer", rng),
    title,
    description,
    kind: input.kind,
    monthly_limit: monthly,
    active: input.active,
    sort_order:
      existing?.sort_order ??
      state.offers.reduce((max, o) => Math.max(max, o.sort_order), 0) + 1,
  };
  const offers = existing
    ? state.offers.map((o) => (o.id === existing.id ? offer : o))
    : [...state.offers, offer];
  return { ok: true, state: { ...state, offers }, offer };
}

/** Deleting an offer never touches rewards already chosen (they hold a copy). */
export function deleteOffer(state: LoyaltyState, offerId: string): LoyaltyState {
  return { ...state, offers: state.offers.filter((o) => o.id !== offerId) };
}

export function setOfferActive(
  state: LoyaltyState,
  offerId: string,
  active: boolean,
): Result {
  const offer = state.offers.find((o) => o.id === offerId);
  if (!offer) return fail("invalid_input", "That reward no longer exists.");
  if (
    active &&
    !offer.active &&
    state.offers.filter((o) => o.active).length >=
      LOYALTY_LIMITS.maxActiveOffers
  ) {
    return fail(
      "limit_reached",
      `Only ${LOYALTY_LIMITS.maxActiveOffers} rewards can be active at once. Pause one first.`,
    );
  }
  return {
    ok: true,
    state: {
      ...state,
      offers: state.offers.map((o) => (o.id === offerId ? { ...o, active } : o)),
    },
  };
}

// ---------------------------------------------------------------------------
// Members and derived card progress
// ---------------------------------------------------------------------------

export function findMember(
  state: LoyaltyState,
  memberId: string,
): LoyaltyMember | undefined {
  return state.members.find((m) => m.id === memberId && !m.deleted_at);
}

export function normalizeEmail(email: string): string {
  return clean(email).toLowerCase();
}

/** Finds the member for this email, or creates an unverified one. */
export function ensureMember(
  state: LoyaltyState,
  email: string,
  now: Date,
  rng: Rng = Math.random,
): { state: LoyaltyState; member: LoyaltyMember } {
  const key = normalizeEmail(email);
  const existing = state.members.find((m) => m.email === key && !m.deleted_at);
  if (existing) return { state, member: existing };
  const member: LoyaltyMember = {
    id: newId("mem", rng),
    email: key,
    email_verified_at: null,
    created_at: iso(now),
    deleted_at: null,
  };
  return { state: { ...state, members: [...state.members, member] }, member };
}

/** Called after the emailed code is confirmed. */
export function markEmailVerified(
  state: LoyaltyState,
  memberId: string,
  now: Date,
): Result<{ member: LoyaltyMember }> {
  const member = findMember(state, memberId);
  if (!member) return fail("member_not_found", "We couldn't find that card.");
  const updated = { ...member, email_verified_at: member.email_verified_at ?? iso(now) };
  return {
    ok: true,
    state: {
      ...state,
      members: state.members.map((m) => (m.id === memberId ? updated : m)),
    },
    member: updated,
  };
}

/** Removes the personal data; the stamp/reward ledger rows stay (anonymous). */
export function deleteMember(
  state: LoyaltyState,
  memberId: string,
  now: Date,
): LoyaltyState {
  return {
    ...state,
    members: state.members.map((m) =>
      m.id === memberId ? { ...m, email: null, deleted_at: iso(now) } : m,
    ),
    tokens: state.tokens.filter((t) => t.member_id !== memberId),
  };
}

export type CardProgress = {
  /** All valid (not voided) stamps ever. */
  total: number;
  required: number;
  /** Stamps on the current card, 0..required (a full card shows `required`). */
  current: number;
  /** Full cards whose reward has not been chosen yet. */
  pending: number;
  /** Rewards chosen so far (any status). */
  claimed: number;
};

/**
 * The balance is derived, never stored:
 *   cards completed = floor(valid stamps / required)
 *   pending         = cards completed − rewards already chosen
 * Extra stamps carry over to the next card automatically.
 */
export function cardProgress(
  state: LoyaltyState,
  memberId: string,
): CardProgress {
  const required = state.program.stamps_required;
  const total = state.stamps.filter(
    (s) => s.member_id === memberId && !s.voided_at,
  ).length;
  const claimed = state.claims.filter((c) => c.member_id === memberId).length;
  const pending = Math.max(0, Math.floor(total / required) - claimed);
  const raw = total - claimed * required;
  const current = pending > 0 ? required : Math.max(0, Math.min(required - 1, raw));
  return { total, required, current, pending, claimed };
}

// ---------------------------------------------------------------------------
// One-time codes
// ---------------------------------------------------------------------------

function pruneTokens(tokens: StampToken[], now: Date): StampToken[] {
  const cutoff = now.getTime() - LOYALTY_LIMITS.tokenKeepMs;
  return tokens.filter((t) => ms(t.expires_at) > cutoff);
}

function isLive(token: StampToken, now: Date): boolean {
  return !token.used_at && ms(token.expires_at) > now.getTime();
}

function uniqueDigits(tokens: StampToken[], now: Date, rng: Rng): string {
  const live = new Set(tokens.filter((t) => isLive(t, now)).map((t) => t.code));
  for (let i = 0; i < 50; i++) {
    const code = randomDigits(6, rng);
    if (!live.has(code)) return code;
  }
  return randomDigits(6, rng);
}

function modeAllows(program: LoyaltyProgram, method: StampMethod): boolean {
  return program.stamp_mode === "both" || program.stamp_mode === method;
}

/** The customer's own code (Mode A): staff enter or scan it. */
export function issueMemberCode(
  state: LoyaltyState,
  memberId: string,
  now: Date,
  rng: Rng = Math.random,
): Result<{ token: StampToken }> {
  if (!state.program.enabled) {
    return fail("program_off", "The loyalty program is paused right now.");
  }
  const member = findMember(state, memberId);
  if (!member) return fail("member_not_found", "We couldn't find that card.");
  if (!member.email_verified_at) {
    return fail("email_not_verified", "Confirm your email to use your card.");
  }
  if (!modeAllows(state.program, "member_code")) {
    return fail("mode_disabled", "Ask the staff to give you a counter code.");
  }
  // One live code per customer: a new one replaces the old one.
  const kept = pruneTokens(state.tokens, now).filter(
    (t) => !(t.kind === "member" && t.member_id === memberId && isLive(t, now)),
  );
  const token: StampToken = {
    id: newId("tok", rng),
    kind: "member",
    member_id: memberId,
    code: uniqueDigits(kept, now, rng),
    created_at: iso(now),
    expires_at: iso(new Date(now.getTime() + LOYALTY_LIMITS.codeTtlMs)),
    used_at: null,
  };
  return { ok: true, state: { ...state, tokens: [...kept, token] }, token };
}

/** The counter code (Mode B): shown on the staff screen, typed by the customer. */
export function issueCounterCode(
  state: LoyaltyState,
  now: Date,
  rng: Rng = Math.random,
): Result<{ token: StampToken }> {
  if (!state.program.enabled) {
    return fail("program_off", "The loyalty program is paused right now.");
  }
  if (!modeAllows(state.program, "counter_code")) {
    return fail("mode_disabled", "Counter codes are turned off.");
  }
  // Only one live counter code at a time.
  const kept = pruneTokens(state.tokens, now).filter(
    (t) => !(t.kind === "counter" && isLive(t, now)),
  );
  const token: StampToken = {
    id: newId("tok", rng),
    kind: "counter",
    member_id: null,
    code: uniqueDigits(kept, now, rng),
    created_at: iso(now),
    expires_at: iso(new Date(now.getTime() + LOYALTY_LIMITS.codeTtlMs)),
    used_at: null,
  };
  return { ok: true, state: { ...state, tokens: [...kept, token] }, token };
}

// ---------------------------------------------------------------------------
// Stamps
// ---------------------------------------------------------------------------

function addStamp(
  state: LoyaltyState,
  memberId: string,
  method: StampMethod,
  staffId: string | null,
  now: Date,
  rng: Rng,
): Result<{ stamp: StampEntry; progress: CardProgress; completed: boolean }> {
  const program = state.program;
  if (!program.enabled) {
    return fail("program_off", "The loyalty program is paused right now.");
  }
  const member = findMember(state, memberId);
  if (!member) return fail("member_not_found", "We couldn't find that card.");
  if (!member.email_verified_at) {
    return fail("email_not_verified", "This card's email is not confirmed yet.");
  }
  if (!modeAllows(program, method)) {
    return fail("mode_disabled", "This way of getting a stamp is turned off.");
  }

  const mine = state.stamps.filter(
    (s) => s.member_id === memberId && !s.voided_at,
  );
  const nowMs = now.getTime();

  // Cooldown since the last valid stamp.
  const last = mine.reduce((max, s) => Math.max(max, ms(s.created_at)), 0);
  const gapMs = program.min_gap_hours * 3_600_000;
  if (last && nowMs - last < gapMs) {
    const minutes = Math.ceil((gapMs - (nowMs - last)) / 60_000);
    const wait =
      minutes >= 90
        ? `${Math.ceil(minutes / 60)} hours`
        : `${minutes} minute${minutes === 1 ? "" : "s"}`;
    return fail("too_soon", `Next stamp available in about ${wait}.`);
  }

  // Rolling 24 hour cap.
  const inDay = mine.filter((s) => nowMs - ms(s.created_at) < 86_400_000).length;
  if (inDay >= program.daily_cap) {
    return fail("daily_cap", "Today's stamp limit is reached. Come back tomorrow.");
  }

  const before = cardProgress(state, memberId);
  const stamp: StampEntry = {
    id: newId("stamp", rng),
    member_id: memberId,
    staff_id: staffId,
    method,
    created_at: iso(now),
    voided_at: null,
    void_reason: null,
  };
  const next: LoyaltyState = { ...state, stamps: [...state.stamps, stamp] };
  const progress = cardProgress(next, memberId);
  return {
    ok: true,
    state: next,
    stamp,
    progress,
    completed: progress.pending > before.pending,
  };
}

function activeStaff(state: LoyaltyState, staffId: string): StaffMember | undefined {
  return state.staff.find((s) => s.id === staffId && s.active);
}

/**
 * Mode A: staff enter the customer's code. The code is consumed only when the
 * stamp is actually given (a "too soon" answer does not burn it).
 */
export function stampWithMemberCode(
  state: LoyaltyState,
  input: { code: string; staffId: string },
  now: Date,
  rng: Rng = Math.random,
): Result<{
  stamp: StampEntry;
  member: LoyaltyMember;
  progress: CardProgress;
  completed: boolean;
}> {
  if (!activeStaff(state, input.staffId)) {
    return fail("staff_not_found", "Enter a staff PIN first.");
  }
  const code = normalizeCode(input.code);
  const token = state.tokens.find(
    (t) => t.kind === "member" && t.code === code && isLive(t, now),
  );
  if (!code || !token || !token.member_id) {
    return fail("invalid_code", "That code is wrong or has expired.");
  }
  const added = addStamp(state, token.member_id, "member_code", input.staffId, now, rng);
  if (!added.ok) return added;
  const member = findMember(added.state, token.member_id)!;
  return {
    ...added,
    state: {
      ...added.state,
      tokens: added.state.tokens.map((t) =>
        t.id === token.id ? { ...t, used_at: iso(now) } : t,
      ),
    },
    member,
  };
}

/** Mode B: the signed-in customer types the code shown on the counter screen. */
export function stampWithCounterCode(
  state: LoyaltyState,
  input: { code: string; memberId: string },
  now: Date,
  rng: Rng = Math.random,
): Result<{ stamp: StampEntry; progress: CardProgress; completed: boolean }> {
  const code = normalizeCode(input.code);
  const token = state.tokens.find(
    (t) => t.kind === "counter" && t.code === code && isLive(t, now),
  );
  if (!code || !token) {
    return fail("invalid_code", "That code is wrong or has expired.");
  }
  const added = addStamp(state, input.memberId, "counter_code", null, now, rng);
  if (!added.ok) return added;
  return {
    ...added,
    state: {
      ...added.state,
      // The counter code is single use: the next customer needs a fresh one.
      tokens: added.state.tokens.map((t) =>
        t.id === token.id ? { ...t, used_at: iso(now) } : t,
      ),
    },
  };
}

/** Owner voids a stamp. The row stays in the ledger, marked voided. */
export function voidStamp(
  state: LoyaltyState,
  stampId: string,
  reason: string,
  now: Date,
): Result {
  const stamp = state.stamps.find((s) => s.id === stampId);
  if (!stamp) return fail("stamp_not_found", "That stamp no longer exists.");
  if (stamp.voided_at) return fail("already_voided", "That stamp is already voided.");
  return {
    ok: true,
    state: {
      ...state,
      stamps: state.stamps.map((s) =>
        s.id === stampId
          ? { ...s, voided_at: iso(now), void_reason: clean(reason).slice(0, 200) || null }
          : s,
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

/** Offers a customer may choose right now: active and under the monthly limit. */
export function availableOffers(state: LoyaltyState, now: Date): RewardOffer[] {
  const key = monthKey(now);
  return state.offers
    .filter((offer) => {
      if (!offer.active) return false;
      if (offer.monthly_limit === null) return true;
      const used = state.claims.filter(
        (c) => c.offer_id === offer.id && monthKey(new Date(c.created_at)) === key,
      ).length;
      return used < offer.monthly_limit;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** A full card lets the customer choose ONE reward from the active offers. */
export function claimReward(
  state: LoyaltyState,
  input: { memberId: string; offerId: string },
  now: Date,
  rng: Rng = Math.random,
): Result<{ claim: RewardClaim }> {
  if (!state.program.enabled) {
    return fail("program_off", "The loyalty program is paused right now.");
  }
  const member = findMember(state, input.memberId);
  if (!member) return fail("member_not_found", "We couldn't find that card.");
  if (cardProgress(state, input.memberId).pending < 1) {
    return fail("no_reward_pending", "Complete your card to choose a reward.");
  }
  const offer = availableOffers(state, now).find((o) => o.id === input.offerId);
  if (!offer) {
    return fail(
      "offer_unavailable",
      "That reward isn't available right now. Please choose another.",
    );
  }
  const taken = new Set(state.claims.map((c) => c.code));
  let code = randomRewardCode(rng);
  for (let i = 0; i < 50 && taken.has(code); i++) code = randomRewardCode(rng);

  const claim: RewardClaim = {
    id: newId("claim", rng),
    member_id: input.memberId,
    offer_id: offer.id,
    title: offer.title,
    description: offer.description,
    code,
    status: "earned",
    created_at: iso(now),
    expires_at: iso(
      new Date(now.getTime() + state.program.reward_valid_days * 86_400_000),
    ),
    redeemed_at: null,
    redeemed_by: null,
    cancelled_at: null,
    cancel_reason: null,
  };
  return { ok: true, state: { ...state, claims: [...state.claims, claim] }, claim };
}

export type ClaimView = "earned" | "redeemed" | "expired" | "cancelled";

/** Expiry is derived from the clock, never stored. */
export function claimView(claim: RewardClaim, now: Date): ClaimView {
  if (claim.status === "redeemed") return "redeemed";
  if (claim.status === "cancelled") return "cancelled";
  return ms(claim.expires_at) <= now.getTime() ? "expired" : "earned";
}

/** Staff redeem a reward code at the counter. Works once. */
export function redeemReward(
  state: LoyaltyState,
  input: { code: string; staffId: string },
  now: Date,
): Result<{ claim: RewardClaim }> {
  if (!activeStaff(state, input.staffId)) {
    return fail("staff_not_found", "Enter a staff PIN first.");
  }
  const code = normalizeCode(input.code);
  const claim = state.claims.find((c) => normalizeCode(c.code) === code);
  if (!code || !claim) {
    return fail("reward_not_found", "No reward matches that code.");
  }
  const view = claimView(claim, now);
  if (view === "redeemed") return fail("reward_used", "This reward was already used.");
  if (view === "cancelled") return fail("reward_cancelled", "This reward was cancelled.");
  if (view === "expired") return fail("reward_expired", "This reward has expired.");
  const updated: RewardClaim = {
    ...claim,
    status: "redeemed",
    redeemed_at: iso(now),
    redeemed_by: input.staffId,
  };
  return {
    ok: true,
    state: {
      ...state,
      claims: state.claims.map((c) => (c.id === claim.id ? updated : c)),
    },
    claim: updated,
  };
}

/** Owner cancels a reward that has not been used. Logged, never deleted. */
export function cancelClaim(
  state: LoyaltyState,
  claimId: string,
  reason: string,
  now: Date,
): Result {
  const claim = state.claims.find((c) => c.id === claimId);
  if (!claim || claim.status !== "earned") {
    return fail("claim_not_cancellable", "Only unused rewards can be cancelled.");
  }
  return {
    ok: true,
    state: {
      ...state,
      claims: state.claims.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: "cancelled",
              cancelled_at: iso(now),
              cancel_reason: clean(reason).slice(0, 200) || null,
            }
          : c,
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Staff (PIN hashing lives in pin.ts because it is async)
// ---------------------------------------------------------------------------

export function isValidPin(pin: string): boolean {
  return /^\d+$/.test(pin) &&
    pin.length >= LOYALTY_LIMITS.pinMin &&
    pin.length <= LOYALTY_LIMITS.pinMax;
}

export function validateStaffName(name: string): string | undefined {
  const value = clean(name);
  const L = LOYALTY_LIMITS;
  if (value.length < L.staffNameMin || value.length > L.staffNameMax) {
    return `Enter a name of ${L.staffNameMin} to ${L.staffNameMax} characters.`;
  }
  return undefined;
}

export function cleanStaffName(name: string): string {
  return clean(name);
}

export function setStaffActive(
  state: LoyaltyState,
  staffId: string,
  active: boolean,
): LoyaltyState {
  return {
    ...state,
    staff: state.staff.map((s) => (s.id === staffId ? { ...s, active } : s)),
  };
}

// ---------------------------------------------------------------------------
// Owner stats (derived)
// ---------------------------------------------------------------------------

export type LoyaltyStats = {
  members: number;
  newThisWeek: number;
  stampsTotal: number;
  stampsThisWeek: number;
  rewardsChosen: number;
  rewardsRedeemed: number;
  rewardsExpired: number;
  rewardsOpen: number;
  perOffer: { offerId: string; title: string; chosen: number; redeemed: number }[];
  perStaff: { staffId: string; name: string; stamps: number; redemptions: number }[];
};

export function loyaltyStats(state: LoyaltyState, now: Date): LoyaltyStats {
  const week = 7 * 86_400_000;
  const members = state.members.filter((m) => !m.deleted_at && m.email_verified_at);
  const valid = state.stamps.filter((s) => !s.voided_at);
  const views = state.claims.map((c) => claimView(c, now));
  const offerIds = new Set([
    ...state.offers.map((o) => o.id),
    ...state.claims.map((c) => c.offer_id),
  ]);
  return {
    members: members.length,
    newThisWeek: members.filter((m) => now.getTime() - ms(m.created_at) < week).length,
    stampsTotal: valid.length,
    stampsThisWeek: valid.filter((s) => now.getTime() - ms(s.created_at) < week).length,
    rewardsChosen: state.claims.length,
    rewardsRedeemed: views.filter((v) => v === "redeemed").length,
    rewardsExpired: views.filter((v) => v === "expired").length,
    rewardsOpen: views.filter((v) => v === "earned").length,
    perOffer: [...offerIds].map((offerId) => {
      const claims = state.claims.filter((c) => c.offer_id === offerId);
      return {
        offerId,
        title:
          state.offers.find((o) => o.id === offerId)?.title ??
          claims[0]?.title ??
          "Removed reward",
        chosen: claims.length,
        redeemed: claims.filter((c) => c.status === "redeemed").length,
      };
    }),
    perStaff: state.staff.map((s) => ({
      staffId: s.id,
      name: s.name,
      stamps: valid.filter((x) => x.staff_id === s.id).length,
      redemptions: state.claims.filter((c) => c.redeemed_by === s.id).length,
    })),
  };
}

export type ActivityItem = {
  id: string;
  at: string;
  kind: "stamp" | "stamp_voided" | "reward_chosen" | "reward_redeemed" | "reward_cancelled";
  text: string;
  /** Present on stamps so the owner can void them. */
  stampId?: string;
  voided?: boolean;
  claimId?: string;
  cancellable?: boolean;
};

/** Newest first. Built from the ledger, so nothing can be hidden from it. */
export function activityLog(state: LoyaltyState, now: Date): ActivityItem[] {
  const who = (memberId: string) => {
    const m = state.members.find((x) => x.id === memberId);
    return m?.email ?? "Deleted member";
  };
  const staff = (id: string | null) =>
    id ? (state.staff.find((s) => s.id === id)?.name ?? "Staff") : null;
  const items: ActivityItem[] = [];
  for (const s of state.stamps) {
    const by = staff(s.staff_id);
    const how = s.method === "member_code" ? `by ${by ?? "staff"}` : "with the counter code";
    items.push({
      id: s.id,
      at: s.created_at,
      kind: s.voided_at ? "stamp_voided" : "stamp",
      text: `${s.voided_at ? "Voided stamp for" : "Stamp for"} ${who(s.member_id)}, given ${how}${
        s.void_reason ? ` (${s.void_reason})` : ""
      }`,
      stampId: s.id,
      voided: Boolean(s.voided_at),
    });
  }
  for (const c of state.claims) {
    items.push({
      id: `${c.id}-chosen`,
      at: c.created_at,
      kind: "reward_chosen",
      text: `${who(c.member_id)} chose “${c.title}”`,
      claimId: c.id,
      cancellable: claimView(c, now) === "earned",
    });
    if (c.redeemed_at) {
      items.push({
        id: `${c.id}-redeemed`,
        at: c.redeemed_at,
        kind: "reward_redeemed",
        text: `“${c.title}” used by ${who(c.member_id)}, confirmed by ${staff(c.redeemed_by) ?? "staff"}`,
      });
    }
    if (c.cancelled_at) {
      items.push({
        id: `${c.id}-cancelled`,
        at: c.cancelled_at,
        kind: "reward_cancelled",
        text: `“${c.title}” for ${who(c.member_id)} was cancelled${
          c.cancel_reason ? ` (${c.cancel_reason})` : ""
        }`,
      });
    }
  }
  return items.sort((a, b) => ms(b.at) - ms(a.at));
}

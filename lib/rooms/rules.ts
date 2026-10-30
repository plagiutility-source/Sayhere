/**
 * Tables & Rooms rules R1–R16 (spec section 7).
 *
 * Every function is pure: it takes the state (and `now` where time matters) and
 * returns the next state plus the result. The demo mutated module-level
 * globals; the port clones instead, so two tabs and React re-renders cannot
 * corrupt each other and the rules script can test each rule in isolation.
 */

import {
  BASE_ORDER_NUMBER,
  CART_MAX_QTY,
  GUESTS_MAX,
  GUESTS_MIN,
  JOIN_CODE_MAX,
  JOIN_CODE_MIN,
  JOIN_CODE_TTL_MS,
  JOIN_MAX_ATTEMPTS,
  JOIN_REQUEST_TTL_MS,
  MAX_ROOMS_PER_LOCATION,
  NAME_MAX,
  PAID_BILL_WINDOW_MS,
  PERIODS,
  PHONE_MAX,
  ROOM_NAME_MAX,
  WAITER_MAX_DEFAULT,
  WAITER_MAX_MAX,
  WAITER_MAX_MIN,
  WAITER_NAME_MAX,
  type PeriodKey,
} from "./constants";
import {
  dateKey,
  displaySpotName,
  isTodayOrder,
  money,
  orderItemsTotal,
  spotWord,
  startOfDay,
} from "./format";
import type {
  EffectiveJoinStatus,
  JoinRequest,
  Order,
  OrderItem,
  OrderStatus,
  Participant,
  PaymentMode,
  Room,
  RoomsPageConfig,
  RoomsState,
  Round,
  ServiceCall,
  ServiceKind,
  SpotLocation,
  Waiter,
} from "./types";

type DateLike = Date | string | number;
type Range = { start: Date; end: Date };

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

function suffix(): number {
  return Math.floor(Math.random() * 999);
}

/** Deep copy so no rule ever mutates its input. */
export function cloneState(state: RoomsState): RoomsState {
  return JSON.parse(JSON.stringify(state)) as RoomsState;
}

/* ------------------------------------------------------------------ */
/* R1–R2  Bills                                                       */
/* ------------------------------------------------------------------ */

/** R1 — a bill is live while it is new, preparing or served. */
export function activeStatus(status: OrderStatus): boolean {
  return status === "new" || status === "preparing" || status === "served";
}

/** The bill's rounds; seeds and old bills fall back to their first round. */
export function orderRounds(order: Order): Round[] {
  if (Array.isArray(order.rounds) && order.rounds.length) return order.rounds;
  return [
    {
      id: `${order.id}_r1`,
      at: order.createdAt,
      items: Array.isArray(order.items) ? order.items : [],
      total: Number(order.total) || 0,
      via: order.source || "customer",
    },
  ];
}

export function getLocation(state: RoomsState, locId: string): SpotLocation | null {
  return state.locations.find((location) => location.id === locId) || null;
}

export function getSpot(state: RoomsState, locId: string, code: string | null): Room | null {
  const location = state.locations.find((item) => item.id === locId);
  if (!location || !code) return null;
  return location.rooms.find((room) => room.code === code) || null;
}

/** R2 — newest live bill at this location and code; null without a code. */
export function findOpenBill(state: RoomsState, locId: string, code: string | null): Order | null {
  if (!code) return null;
  const matches = state.orders.filter(
    (order) => order.locId === locId && order.code === code && activeStatus(order.status),
  );
  matches.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
  );
  return matches[0] || null;
}

/** Order numbering: max(existing, 1040) + 1. */
export function nextOrderNumber(state: RoomsState): number {
  return state.orders.reduce((max, order) => Math.max(max, Number(order.number) || 0), BASE_ORDER_NUMBER) + 1;
}

/* ------------------------------------------------------------------ */
/* R3–R7  Waiters, participation and placing an order                 */
/* ------------------------------------------------------------------ */

export function waiterById(state: RoomsState, locId: string, waiterId: string | null): Waiter | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  return (location.waiters || []).find((waiter) => waiter.id === waiterId) || null;
}

/** R3 — distinct live codes assigned to a waiter today. */
export function waiterLoad(
  state: RoomsState,
  locId: string,
  waiterId: string | null,
  now: DateLike = new Date(),
): number {
  const codes = new Set<string>();
  state.orders.forEach((order) => {
    if (
      order.locId === locId &&
      order.waiterId === waiterId &&
      order.code &&
      activeStatus(order.status) &&
      isTodayOrder(order, now)
    ) {
      codes.add(order.code);
    }
  });
  return codes.size;
}

/** R4 — active waiters with a free slot. */
export function availableWaiters(
  state: RoomsState,
  locId: string,
  now: DateLike = new Date(),
): Waiter[] {
  const location = getLocation(state, locId);
  if (!location) return [];
  return (location.waiters || []).filter(
    (waiter) => waiter.active && waiterLoad(state, locId, waiter.id, now) < waiter.maxTables,
  );
}

export function waiterName(state: RoomsState, locId: string, waiterId: string | null): string {
  const waiter = waiterById(state, locId, waiterId);
  return waiter ? waiter.name : "Auto-assign pending";
}

export function participantsOf(order: Order): Participant[] {
  if (!Array.isArray(order.participants)) return [];
  return order.participants;
}

export function participantFor(order: Order, deviceId: string): Participant | null {
  return participantsOf(order).find((participant) => participant.deviceId === deviceId) || null;
}

/**
 * R7 — the participant for this device. Seeded / staff-punched bills have no
 * device attached; the first phone that opens one becomes the host (E1).
 */
export function resolveScanParticipation(
  order: Order,
  deviceId: string,
  now: DateLike = new Date(),
): { order: Order; participant: Participant | null } {
  const existing = participantFor(order, deviceId);
  if (existing) return { order, participant: existing };

  const roster = participantsOf(order);
  if (roster.length) {
    const host = roster.find((participant) => participant.role === "host") || roster[0];
    const nextOrder: Order = { ...order, participants: [...roster] };
    if (!order.hostDeviceId) nextOrder.hostDeviceId = host.deviceId;
    return { order: nextOrder, participant: host.deviceId === deviceId ? host : null };
  }
  if (order.hostDeviceId && order.hostDeviceId !== deviceId) return { order, participant: null };

  const stamp = toDate(now);
  const participant: Participant = {
    id: `p_${stamp.getTime()}_${suffix()}`,
    name: String(order.customerName || "Host").slice(0, NAME_MAX),
    deviceId,
    role: "host",
    joinedAt: stamp.toISOString(),
  };
  return {
    order: { ...order, hostDeviceId: deviceId, participants: [...roster, participant] },
    participant,
  };
}

/** R6 — merge cart lines into a bill's lines by item id. */
export function mergeItemLines(target: OrderItem[], lines: OrderItem[]): OrderItem[] {
  const merged = (target || []).map((item) => ({ ...item }));
  lines.forEach((line) => {
    const existing = merged.find((item) => item.id === line.id);
    if (existing) existing.qty = Number(existing.qty || 0) + Number(line.qty || 0);
    else merged.push({ ...line });
  });
  return merged;
}

export type PlaceOrderInput = {
  locId: string;
  code: string;
  deviceId: string;
  lines: OrderItem[];
  name: string;
  phone: string;
  guests: number;
  /** "auto" (Any available) or a waiter id. */
  waiterId: string;
};

export type PlaceOrderResult =
  | { ok: true; state: RoomsState; order: Order; round: Round; added: boolean }
  | { ok: false; error: string };

/** R5 — place or append an order, with the demo's exact validation order. */
export function placeOrder(
  state: RoomsState,
  input: PlaceOrderInput,
  now: DateLike = new Date(),
): PlaceOrderResult {
  const lines = (input.lines || []).filter((line) => Number(line.qty) > 0);
  if (!lines.length) return { ok: false, error: "Your cart is empty. Add something from the menu." };

  const location = getLocation(state, input.locId);
  const room = location ? location.rooms.find((item) => item.code === input.code) || null : null;
  if (!location || !room) {
    return { ok: false, error: "This QR is no longer available. Ask a member of staff for help." };
  }

  const next = cloneState(state);
  const openBill = findOpenBill(next, location.id, room.code);
  let bill = openBill;
  let participant: Participant | null = null;

  if (openBill) {
    participant = participantFor(openBill, input.deviceId);
    if (!participant && !openBill.hostDeviceId) {
      const resolved = resolveScanParticipation(openBill, input.deviceId, now);
      bill = resolved.order;
      participant = resolved.participant;
      next.orders = next.orders.map((order) => (order.id === resolved.order.id ? resolved.order : order));
    }
    if (!participant) {
      return { ok: false, error: "Ask the table host to approve your phone before adding to this bill." };
    }
  }

  let waiter: Waiter | null = null;
  if (!bill) {
    if (!input.name.trim()) {
      return { ok: false, error: "Please add your name so the waiter knows who ordered." };
    }
    const free = availableWaiters(next, location.id, now);
    if (input.waiterId && input.waiterId !== "auto") {
      waiter = free.find((item) => item.id === input.waiterId) || null;
      if (!waiter) {
        return {
          ok: false,
          error: "That waiter just took another table. Pick someone else or choose Any available.",
        };
      }
    } else {
      waiter = free[0] || null;
    }
  }

  const stamp = toDate(now);
  const iso = stamp.toISOString();
  const roundItems: OrderItem[] = lines.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
  }));
  const roundTotal = orderItemsTotal(roundItems);

  if (bill) {
    const round: Round = {
      id: `round_${stamp.getTime()}_${suffix()}`,
      at: iso,
      items: roundItems,
      total: roundTotal,
      via: "reorder",
      by: participant ? participant.name : null,
      participantId: participant ? participant.id : null,
    };
    const merged = mergeItemLines(bill.items, roundItems);
    const updated: Order = {
      ...bill,
      items: merged,
      total: orderItemsTotal(merged),
      status: "new",
      updatedAt: iso,
      rounds: orderRounds(bill).concat([round]),
    };
    next.orders = next.orders.map((order) => (order.id === updated.id ? updated : order));
    return { ok: true, state: next, order: updated, round, added: true };
  }

  const hostName = input.name.trim().slice(0, NAME_MAX);
  const round: Round = {
    id: `round_${stamp.getTime()}_${suffix()}`,
    at: iso,
    items: roundItems,
    total: roundTotal,
    via: "customer",
    by: hostName,
  };
  const orderId = `ord_${stamp.getTime()}_${suffix()}`;
  const order: Order = {
    id: orderId,
    number: nextOrderNumber(next),
    locId: location.id,
    code: room.code,
    billId: orderId,
    customerName: hostName,
    phone: input.phone.trim().slice(0, PHONE_MAX),
    guests: clampGuests(input.guests),
    waiterId: waiter ? waiter.id : null,
    hostDeviceId: input.deviceId,
    participants: [
      {
        id: `p_${stamp.getTime()}_${suffix()}`,
        name: hostName,
        deviceId: input.deviceId,
        role: "host",
        joinedAt: iso,
      },
    ],
    items: roundItems,
    total: roundTotal,
    status: "new",
    createdAt: iso,
    updatedAt: iso,
    source: "customer",
    rounds: [round],
  };
  next.orders.push(order);
  return { ok: true, state: next, order, round, added: false };
}

export function clampGuests(value: number | string): number {
  return Math.max(GUESTS_MIN, Math.min(GUESTS_MAX, Number(value) || GUESTS_MIN));
}

export function clampCartQty(value: number): number {
  return Math.max(0, Math.min(CART_MAX_QTY, value));
}

/* ------------------------------------------------------------------ */
/* R8  Join lifecycle                                                 */
/* ------------------------------------------------------------------ */

export function joinRequestsForOrder(state: RoomsState, order: Order): JoinRequest[] {
  return (state.joinRequests || []).filter((request) => request.orderId === order.id);
}

export function effectiveJoinStatus(
  request: JoinRequest | null,
  now: DateLike = new Date(),
): EffectiveJoinStatus | null {
  if (!request) return null;
  const time = toDate(now).getTime();
  if (request.status === "pending" && time > new Date(request.expiresAt).getTime()) return "expired";
  if (
    request.status === "approved" &&
    request.codeExpiresAt &&
    time > new Date(request.codeExpiresAt).getTime()
  ) {
    return "expired";
  }
  return request.status;
}

export function latestJoinRequestForDevice(
  state: RoomsState,
  order: Order | null,
  deviceId: string,
): JoinRequest | null {
  if (!order) return null;
  const requests = joinRequestsForOrder(state, order)
    .filter((request) => request.deviceId === deviceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return requests[0] || null;
}

export function makeJoinCode(): string {
  return String(Math.floor(JOIN_CODE_MIN + Math.random() * (JOIN_CODE_MAX - JOIN_CODE_MIN + 1)));
}

export type JoinResult = {
  ok: boolean;
  state: RoomsState;
  request: JoinRequest | null;
  error: string | null;
  joined: Participant | null;
};

function joinResult(
  ok: boolean,
  state: RoomsState,
  request: JoinRequest | null,
  error: string | null = null,
  joined: Participant | null = null,
): JoinResult {
  return { ok, state, request, error, joined };
}

/** R8 — ask the host to join their bill. One request per device is reused. */
export function requestJoin(
  state: RoomsState,
  order: Order | null,
  name: string,
  deviceId: string,
  now: DateLike = new Date(),
): JoinResult {
  if (!order || !activeStatus(order.status)) {
    return joinResult(false, state, null, "This bill is closed.");
  }
  if (participantFor(order, deviceId)) {
    return joinResult(false, state, null, "You are already on this bill.");
  }
  const existing = latestJoinRequestForDevice(state, order, deviceId);
  const existingStatus = effectiveJoinStatus(existing, now);
  if (existing && (existingStatus === "pending" || existingStatus === "approved")) {
    return joinResult(true, state, existing);
  }
  const stamp = toDate(now);
  const request: JoinRequest = {
    id: `jr_${stamp.getTime()}_${suffix()}`,
    orderId: order.id,
    locId: order.locId,
    code: order.code || "",
    deviceId,
    name: String(name || "").trim().slice(0, NAME_MAX) || "Guest",
    status: "pending",
    createdAt: stamp.toISOString(),
    expiresAt: new Date(stamp.getTime() + JOIN_REQUEST_TTL_MS).toISOString(),
    attempts: 0,
    maxAttempts: JOIN_MAX_ATTEMPTS,
    joinCode: null,
    codeExpiresAt: null,
  };
  const next = cloneState(state);
  next.joinRequests.push(request);
  return joinResult(true, next, request);
}

export function approveJoinRequest(
  state: RoomsState,
  requestId: string,
  now: DateLike = new Date(),
): JoinResult {
  const request = (state.joinRequests || []).find((item) => item.id === requestId);
  if (!request || effectiveJoinStatus(request, now) !== "pending") {
    return joinResult(false, state, null);
  }
  const stamp = toDate(now);
  const next = cloneState(state);
  const target = next.joinRequests.find((item) => item.id === requestId);
  if (!target) return joinResult(false, state, null);
  target.status = "approved";
  target.approvedAt = stamp.toISOString();
  target.joinCode = makeJoinCode();
  target.codeExpiresAt = new Date(stamp.getTime() + JOIN_CODE_TTL_MS).toISOString();
  target.attempts = 0;
  return joinResult(true, next, target);
}

export function denyJoinRequest(state: RoomsState, requestId: string): JoinResult {
  const request = (state.joinRequests || []).find((item) => item.id === requestId);
  if (!request) return joinResult(false, state, null);
  const next = cloneState(state);
  const target = next.joinRequests.find((item) => item.id === requestId);
  if (!target) return joinResult(false, state, null);
  target.status = "denied";
  target.deniedAt = new Date().toISOString();
  target.joinCode = null;
  target.codeExpiresAt = null;
  return joinResult(true, next, target);
}

export function cancelJoinRequest(
  state: RoomsState,
  order: Order | null,
  deviceId: string,
): JoinResult {
  const request = latestJoinRequestForDevice(state, order, deviceId);
  if (!request) return joinResult(false, state, null);
  if (request.status === "joined" || request.status === "denied" || request.status === "cancelled") {
    return joinResult(false, state, request);
  }
  const next = cloneState(state);
  const target = next.joinRequests.find((item) => item.id === request.id);
  if (!target) return joinResult(false, state, null);
  target.status = "cancelled";
  target.joinCode = null;
  target.codeExpiresAt = null;
  return joinResult(true, next, target);
}

export function regenerateJoinCode(
  state: RoomsState,
  requestId: string,
  now: DateLike = new Date(),
): JoinResult {
  const request = (state.joinRequests || []).find((item) => item.id === requestId);
  if (!request) return joinResult(false, state, null);
  if (request.status === "joined" || request.status === "denied" || request.status === "cancelled") {
    return joinResult(false, state, request);
  }
  const stamp = toDate(now);
  const next = cloneState(state);
  const target = next.joinRequests.find((item) => item.id === requestId);
  if (!target) return joinResult(false, state, null);
  target.status = "approved";
  target.joinCode = makeJoinCode();
  target.codeExpiresAt = new Date(stamp.getTime() + JOIN_CODE_TTL_MS).toISOString();
  target.attempts = 0;
  return joinResult(true, next, target);
}

/** R8 — check the 6-digit code; 5 wrong attempts lock the request. */
export function verifyJoinCode(
  state: RoomsState,
  order: Order | null,
  deviceId: string,
  entered: string,
  now: DateLike = new Date(),
): JoinResult {
  if (!order) return joinResult(false, state, null);
  const request = latestJoinRequestForDevice(state, order, deviceId);
  const status = effectiveJoinStatus(request, now);
  if (!request || status !== "approved") {
    const error =
      request && request.status === "locked"
        ? "Too many wrong attempts. Ask the host for a new code."
        : "This join request is no longer active.";
    return joinResult(false, state, request, error);
  }
  const digits = String(entered || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) {
    return joinResult(false, state, request, "Enter the 6-digit code shown on the host's phone.");
  }
  const next = cloneState(state);
  const target = next.joinRequests.find((item) => item.id === request.id);
  if (!target) return joinResult(false, state, null);

  if (digits !== String(target.joinCode || "")) {
    target.attempts = Number(target.attempts || 0) + 1;
    if (target.attempts >= Number(target.maxAttempts || JOIN_MAX_ATTEMPTS)) target.status = "locked";
    const left = Math.max(0, Number(target.maxAttempts || JOIN_MAX_ATTEMPTS) - target.attempts);
    const error =
      target.status === "locked"
        ? "Too many wrong attempts. Ask the host to send a new code."
        : `That code doesn't match. ${left} attempt${left === 1 ? "" : "s"} left.`;
    return joinResult(false, next, target, error);
  }

  const stamp = toDate(now);
  target.status = "joined";
  target.joinedAt = stamp.toISOString();
  const joinedOrder = next.orders.find((item) => item.id === order.id);
  let participant = joinedOrder ? participantFor(joinedOrder, target.deviceId) : null;
  if (joinedOrder && !participant) {
    participant = {
      id: `p_${stamp.getTime()}_${suffix()}`,
      name: target.name,
      deviceId: target.deviceId,
      role: "guest",
      joinedAt: target.joinedAt,
      requestId: target.id,
    };
    joinedOrder.participants = [...participantsOf(joinedOrder), participant];
  }
  return joinResult(true, next, target, null, participant);
}

/* ------------------------------------------------------------------ */
/* R9–R10  Service calls, bill sending, payment, status               */
/* ------------------------------------------------------------------ */

export function activeServiceCalls(state: RoomsState, locId?: string): ServiceCall[] {
  return (state.serviceCalls || [])
    .filter((call) => call && call.status === "open" && (!locId || call.locId === locId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function serviceCallsForSpot(state: RoomsState, locId: string, code: string): ServiceCall[] {
  return activeServiceCalls(state, locId).filter((call) => call.code === code);
}

export function serviceCallFor(
  state: RoomsState,
  locId: string,
  code: string,
  kind: ServiceKind,
): ServiceCall | null {
  return serviceCallsForSpot(state, locId, code).find((call) => call.kind === kind) || null;
}

export function serviceCallSpotName(state: RoomsState, call: ServiceCall | null): string {
  const spot = call ? getSpot(state, call.locId, call.code) : null;
  if (spot) return displaySpotName(state.businessType, spot);
  return String((call && call.code) || "").toUpperCase();
}

/** R9 — one live request per spot: asking for the bill replaces a waiter call. */
export function requestService(
  state: RoomsState,
  spot: { locId: string; code: string },
  kind: ServiceKind,
  now: DateLike = new Date(),
): { state: RoomsState; call: ServiceCall | null } {
  const bill = findOpenBill(state, spot.locId, spot.code);
  if (!bill) return { state, call: null };
  const existing = serviceCallFor(state, spot.locId, spot.code, kind);
  if (existing) return { state, call: existing };

  const next = cloneState(state);
  next.serviceCalls = activeServiceCalls(next, spot.locId).filter((call) => call.code !== spot.code);
  const stamp = toDate(now);
  const call: ServiceCall = {
    id: `call_${stamp.getTime()}_${suffix()}`,
    locId: spot.locId,
    code: spot.code,
    kind,
    status: "open",
    createdAt: stamp.toISOString(),
    orderId: bill.id,
    customerName: bill.customerName,
  };
  next.serviceCalls.push(call);
  return { state: next, call };
}

export function resolveServiceCall(
  state: RoomsState,
  id: string,
  now: DateLike = new Date(),
): { state: RoomsState; call: ServiceCall | null } {
  const call = (state.serviceCalls || []).find((item) => item.id === id);
  if (!call || call.status !== "open") return { state, call: call || null };
  const next = cloneState(state);
  const target = next.serviceCalls.find((item) => item.id === id);
  if (!target) return { state, call: null };
  target.status = "done";
  target.resolvedAt = toDate(now).toISOString();
  return { state: next, call: target };
}

export type BillSendResult =
  | { ok: true; state: RoomsState; order: Order; sentBefore: boolean }
  | { ok: false; error: string };

/** R10 — send the bill to the customer's phone and resolve bill calls. */
export function sendBillToPhone(
  state: RoomsState,
  orderId: string,
  now: DateLike = new Date(),
): BillSendResult {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "This bill is already closed — start a new order instead." };
  if (!order.code) {
    return { ok: false, error: "Direct punch bills have no customer session to send to." };
  }
  if (!activeStatus(order.status)) {
    return { ok: false, error: "This bill is already closed — start a new order instead." };
  }
  const stamp = toDate(now).toISOString();
  const next = cloneState(state);
  const target = next.orders.find((item) => item.id === orderId);
  if (!target) return { ok: false, error: "This bill is already closed — start a new order instead." };
  const sentBefore = Boolean(target.billSentAt);
  target.billSentAt = stamp;
  target.updatedAt = stamp;
  (next.serviceCalls || []).forEach((call) => {
    if (
      call &&
      call.status === "open" &&
      call.locId === target.locId &&
      call.code === target.code &&
      call.kind === "bill"
    ) {
      call.status = "done";
      call.resolvedAt = stamp;
    }
  });
  return { ok: true, state: next, order: target, sentBefore };
}

export type PaymentResult =
  | { ok: true; state: RoomsState; order: Order; amount: number }
  | { ok: false; error: string | null };

/** R10 — completion happens only when the amount matches to the paisa. */
export function verifyPayment(
  state: RoomsState,
  orderId: string,
  amount: number,
  mode: PaymentMode,
  now: DateLike = new Date(),
): PaymentResult {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || !activeStatus(order.status)) return { ok: false, error: null };
  const rounded = Math.round(Number(amount) * 100);
  if (!Number.isFinite(amount) || rounded !== Math.round(Number(order.total) * 100)) {
    return {
      ok: false,
      error: `That doesn't match the bill total of ${money(order.total)}. Enter the exact amount to close.`,
    };
  }
  const stamp = toDate(now).toISOString();
  const next = cloneState(state);
  const target = next.orders.find((item) => item.id === orderId);
  if (!target) return { ok: false, error: null };
  target.status = "completed";
  target.paidAt = stamp;
  target.payment = { amount, mode, at: stamp };
  target.updatedAt = stamp;
  return { ok: true, state: next, order: target, amount };
}

export type StatusResult = { state: RoomsState; order: Order | null };

/** R10 — owner status buttons; anything except the four targets is ignored. */
export function setOrderStatus(
  state: RoomsState,
  orderId: string,
  status: "preparing" | "served" | "completed" | "cancelled" | string,
  now: DateLike = new Date(),
): StatusResult {
  const allowed = ["preparing", "served", "completed", "cancelled"];
  if (allowed.indexOf(status) === -1) return { state, order: null };
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { state, order: null };
  const stamp = toDate(now).toISOString();
  const next = cloneState(state);
  const target = next.orders.find((item) => item.id === orderId);
  if (!target) return { state, order: null };
  if (status === "preparing" && !target.acceptedAt) target.acceptedAt = stamp;
  if (status === "completed" && !target.paidAt) target.paidAt = stamp;
  target.status = status as OrderStatus;
  target.updatedAt = stamp;
  return { state: next, order: target };
}

/* ------------------------------------------------------------------ */
/* R11–R13  Wi-Fi, paid bills, analytics                              */
/* ------------------------------------------------------------------ */

/** Wi-Fi is allowed only for the three table-ordering business types. */
export function supportsOrderWifi(businessType: string): boolean {
  return ["cafe", "restaurant", "hotel"].indexOf(businessType) !== -1;
}

export function orderAcceptedForWifi(order: Order | null): boolean {
  if (!order) return false;
  return Boolean(order.acceptedAt) || order.status === "preparing" || order.status === "served";
}

/** R11 — Wi-Fi unlocks only after staff accept the order. */
export function wifiUnlockedForOrder(
  order: Order | null,
  config: RoomsPageConfig | null | undefined,
  businessType: string,
): boolean {
  if (!order || !config || !config.wifi || !config.wifi.on) return false;
  if (!supportsOrderWifi(businessType) || !order.code) return false;
  return activeStatus(order.status) && orderAcceptedForWifi(order);
}

export function canSeeBill(order: Order | null, deviceId: string | null): boolean {
  if (!order || !deviceId) return false;
  return order.hostDeviceId === deviceId || Boolean(participantFor(order, deviceId));
}

/** R12 — the paid bill stays visible for five minutes, to participants only. */
export function recentPaidBill(
  state: RoomsState,
  locId: string,
  code: string | null,
  deviceId: string | null,
  now: DateLike = new Date(),
): Order | null {
  if (!code) return null;
  const time = toDate(now).getTime();
  const matches = state.orders.filter(
    (order) =>
      order &&
      order.locId === locId &&
      order.code === code &&
      order.status === "completed" &&
      Boolean(order.paidAt) &&
      canSeeBill(order, deviceId) &&
      time - new Date(order.paidAt as string).getTime() < PAID_BILL_WINDOW_MS,
  );
  matches.sort((a, b) => new Date(b.paidAt as string).getTime() - new Date(a.paidAt as string).getTime());
  return matches[0] || null;
}

export function paidBillRemaining(order: Order | null, now: DateLike = new Date()): number {
  if (!order || !order.paidAt) return 0;
  return Math.max(0, PAID_BILL_WINDOW_MS - (toDate(now).getTime() - new Date(order.paidAt).getTime()));
}

/** R13 — period window: start of day minus (days - 1), to now. */
export function periodWindow(key: PeriodKey, now: DateLike = new Date()): Range {
  const def = PERIODS[key] || PERIODS.today;
  const end = toDate(now);
  const start = startOfDay(end);
  start.setDate(start.getDate() - (def.days - 1));
  return { start, end };
}

/** R13 — the same number of days, ending the millisecond before. */
export function previousPeriodWindow(key: PeriodKey, now: DateLike = new Date()): Range {
  const def = PERIODS[key] || PERIODS.today;
  const current = periodWindow(key, now);
  const end = new Date(current.start.getTime() - 1);
  const start = startOfDay(end);
  start.setDate(start.getDate() - (def.days - 1));
  return { start, end };
}

export function orderInWindow(order: Order, range: Range): boolean {
  const time = new Date(order.createdAt).getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}

export function ordersBetween(state: RoomsState, locId: string, range: Range): Order[] {
  return state.orders
    .filter((order) => order.locId === locId && orderInWindow(order, range))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export type RangeStats = {
  rows: Order[];
  orders: number;
  earnings: number;
  collected: number;
  guests: number;
  paidOrders: number;
  open: number;
  average: number;
  averageGuests: number;
};

/** R13 — cancelled bills are excluded everywhere. */
export function statsForRange(state: RoomsState, locId: string, range: Range): RangeStats {
  const rows = ordersBetween(state, locId, range).filter((order) => order.status !== "cancelled");
  const paid = rows.filter((order) => order.status === "completed");
  const earnings = rows.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const collected = paid.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const guests = rows.reduce((sum, order) => sum + Number(order.guests || 0), 0);
  return {
    rows,
    orders: rows.length,
    earnings,
    collected,
    guests,
    paidOrders: paid.length,
    open: rows.filter((order) => activeStatus(order.status)).length,
    average: rows.length ? Math.round(earnings / rows.length) : 0,
    averageGuests: rows.length ? Math.round((guests / rows.length) * 10) / 10 : 0,
  };
}

export type DailyPoint = {
  date: Date;
  orders: number;
  guests: number;
  earnings: number;
  full: string;
  label: string;
};

/** R13 — one point per day; labels every 1 / 2 / 5 days. */
export function dailySeries(
  state: RoomsState,
  locId: string,
  key: PeriodKey,
  now: DateLike = new Date(),
): DailyPoint[] {
  const def = PERIODS[key] || PERIODS.today;
  const range = periodWindow(key, now);
  const rows = ordersBetween(state, locId, range).filter((order) => order.status !== "cancelled");
  const days: DailyPoint[] = [];
  const step = def.days <= 7 ? 1 : def.days <= 15 ? 2 : 5;
  for (let index = 0; index < def.days; index += 1) {
    const date = new Date(range.start);
    date.setDate(range.start.getDate() + index);
    const key2 = dateKey(date);
    const dayRows = rows.filter((order) => dateKey(order.createdAt) === key2);
    days.push({
      date,
      orders: dayRows.length,
      guests: dayRows.reduce((sum, order) => sum + Number(order.guests || 0), 0),
      earnings: dayRows.reduce((sum, order) => sum + Number(order.total || 0), 0),
      full: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      label:
        def.days === 1
          ? "Today"
          : index % step === 0 || index === def.days - 1
            ? date.toLocaleDateString("en-IN", { day: "numeric" })
            : "",
    });
  }
  return days;
}

export function spotMatches(order: Order, spot: string | null): boolean {
  if (!spot || spot === "all") return true;
  if (spot === "direct") return !order.code;
  return order.code === spot;
}

/* ------------------------------------------------------------------ */
/* R14  Punch                                                         */
/* ------------------------------------------------------------------ */

export type PunchInput = {
  locId: string;
  code: string | null;
  lines: OrderItem[];
  name: string;
  phone: string;
  guests: number;
  waiterId: string | null;
};

export type PunchResult =
  | { ok: true; state: RoomsState; order: Order; round: Round; added: boolean }
  | { ok: false; error: string };

/** R14 — staff punch: joins an open bill, otherwise starts one. */
export function createPunchOrder(
  state: RoomsState,
  input: PunchInput,
  now: DateLike = new Date(),
): PunchResult {
  const lines = (input.lines || []).filter((line) => Number(line.qty) > 0);
  if (!lines.length) return { ok: false, error: "Add at least one item before punching the order." };
  const location = getLocation(state, input.locId);
  if (!location) return { ok: false, error: "Add at least one item before punching the order." };

  const next = cloneState(state);
  const code = input.code || null;
  const openBill = code ? findOpenBill(next, location.id, code) : null;
  const stamp = toDate(now);
  const iso = stamp.toISOString();
  const roundItems: OrderItem[] = lines.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
  }));
  const roundTotal = orderItemsTotal(roundItems);

  if (openBill) {
    const round: Round = {
      id: `round_${stamp.getTime()}_${suffix()}`,
      at: iso,
      items: roundItems,
      total: roundTotal,
      via: "punch",
    };
    const merged = mergeItemLines(openBill.items, roundItems);
    const updated: Order = {
      ...openBill,
      items: merged,
      total: orderItemsTotal(merged),
      status: "new",
      updatedAt: iso,
      rounds: orderRounds(openBill).concat([round]),
    };
    next.orders = next.orders.map((order) => (order.id === updated.id ? updated : order));
    return { ok: true, state: next, order: updated, round, added: true };
  }

  let waiterId: string | null = null;
  if (input.waiterId) {
    const waiter = waiterById(next, location.id, input.waiterId);
    if (
      waiter &&
      waiter.active &&
      (!code || waiterLoad(next, location.id, waiter.id, now) < waiter.maxTables)
    ) {
      waiterId = waiter.id;
    }
  }

  const orderId = `ord_${stamp.getTime()}_${suffix()}`;
  const round: Round = {
    id: `round_${stamp.getTime()}_${suffix()}`,
    at: iso,
    items: roundItems,
    total: roundTotal,
    via: "punch",
  };
  const order: Order = {
    id: orderId,
    number: nextOrderNumber(next),
    locId: location.id,
    code,
    billId: orderId,
    customerName: input.name.trim().slice(0, NAME_MAX) || "Walk-in",
    phone: input.phone.trim().slice(0, PHONE_MAX),
    guests: clampGuests(input.guests),
    waiterId,
    participants: [],
    items: roundItems,
    total: roundTotal,
    status: "new",
    createdAt: iso,
    updatedAt: iso,
    source: "punch",
    rounds: [round],
  };
  next.orders.push(order);
  return { ok: true, state: next, order, round, added: false };
}

/* ------------------------------------------------------------------ */
/* R15  Rooms                                                         */
/* ------------------------------------------------------------------ */

/** Starts at rooms.length + 1 and skips codes already in use. */
export function nextRoomCode(location: SpotLocation): string {
  let index = location.rooms.length + 1;
  let code = `qr${index}`;
  while (location.rooms.some((room) => room.code === code)) {
    index += 1;
    code = `qr${index}`;
  }
  return code;
}

export type RoomResult =
  | { ok: true; state: RoomsState; room: Room; message: string }
  | { ok: false; error: string };

/** R15 — permanent code, 12 per location. */
export function addRoom(state: RoomsState, locId: string, name: string): RoomResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  if (location.rooms.length >= MAX_ROOMS_PER_LOCATION) {
    return { ok: false, error: "Limit: 12 room QRs per location." };
  }
  const code = nextRoomCode(location);
  const room: Room = {
    id: `rm_${location.id}_${code}`,
    code,
    name: name.slice(0, ROOM_NAME_MAX),
    active: true,
    scans: 0,
  };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id ? { ...item, rooms: [...item.rooms, room] } : item,
  );
  return {
    ok: true,
    state: next,
    room,
    message: `${room.name} added \u2014 it has its own permanent QR (${code.toUpperCase()}) and a live order feed.`,
  };
}

/** R15 — rename changes the name only; the code and link stay. */
export function renameRoom(
  state: RoomsState,
  locId: string,
  code: string,
  name: string,
): RoomResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const room = location.rooms.find((item) => item.code === code);
  if (!room) return null;
  if (!name.trim()) return { ok: false, error: "Enter a room name." };
  const updated: Room = { ...room, name: name.trim().slice(0, ROOM_NAME_MAX) };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id
      ? { ...item, rooms: item.rooms.map((entry) => (entry.code === code ? updated : entry)) }
      : item,
  );
  return {
    ok: true,
    state: next,
    room: updated,
    message: "Room renamed \u2014 the QR and link did not change.",
  };
}

/** R15 — pausing keeps the code; customers see "not available". */
export function toggleRoomActive(state: RoomsState, locId: string, code: string): RoomResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const room = location.rooms.find((item) => item.code === code);
  if (!room) return null;
  const updated: Room = { ...room, active: !room.active };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id
      ? { ...item, rooms: item.rooms.map((entry) => (entry.code === code ? updated : entry)) }
      : item,
  );
  const label = displaySpotName(state.businessType, updated);
  return {
    ok: true,
    state: next,
    room: updated,
    message: updated.active
      ? `${label} QR is active again.`
      : `${label} QR paused \u2014 the link is reserved and shows \u201cnot available\u201d.`,
  };
}

/* ------------------------------------------------------------------ */
/* R16  Waiters                                                       */
/* ------------------------------------------------------------------ */

export type WaiterResult =
  | { ok: true; state: RoomsState; waiter: Waiter; message: string }
  | { ok: false; error: string };

export function clampWaiterMax(value: number | string): number {
  return Math.max(WAITER_MAX_MIN, Math.min(WAITER_MAX_MAX, Number(value) || WAITER_MAX_DEFAULT));
}

/** R16 — name required, unique per location, 1–8 tables. */
export function addWaiter(
  state: RoomsState,
  locId: string,
  name: string,
  maxTables: number | string,
  now: DateLike = new Date(),
): WaiterResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a waiter name." };
  if ((location.waiters || []).some((waiter) => waiter.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "That waiter is already on the team." };
  }
  const max = clampWaiterMax(maxTables);
  const waiter: Waiter = {
    id: `w_${toDate(now).getTime()}`,
    name: trimmed.slice(0, WAITER_NAME_MAX),
    maxTables: max,
    active: true,
  };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id ? { ...item, waiters: [...item.waiters, waiter] } : item,
  );
  return {
    ok: true,
    state: next,
    waiter,
    message: `${trimmed} added \u2014 can handle ${max} ${spotWord(state.businessType, true).toLowerCase()} at a time.`,
  };
}

export function toggleWaiterActive(state: RoomsState, locId: string, waiterId: string): WaiterResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const waiter = (location.waiters || []).find((item) => item.id === waiterId);
  if (!waiter) return null;
  const updated: Waiter = { ...waiter, active: !waiter.active };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id
      ? { ...item, waiters: item.waiters.map((entry) => (entry.id === waiterId ? updated : entry)) }
      : item,
  );
  return {
    ok: true,
    state: next,
    waiter: updated,
    message: updated.active
      ? `${updated.name} is accepting new orders again.`
      : `${updated.name} paused \u2014 customers will not see them at checkout.`,
  };
}

export function setWaiterMax(
  state: RoomsState,
  locId: string,
  waiterId: string,
  maxTables: number | string,
): WaiterResult | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const waiter = (location.waiters || []).find((item) => item.id === waiterId);
  if (!waiter) return null;
  const max = clampWaiterMax(maxTables);
  const updated: Waiter = { ...waiter, maxTables: max };
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id
      ? { ...item, waiters: item.waiters.map((entry) => (entry.id === waiterId ? updated : entry)) }
      : item,
  );
  return {
    ok: true,
    state: next,
    waiter: updated,
    message: `${updated.name} can now handle ${max} ${spotWord(state.businessType, true).toLowerCase()} at a time.`,
  };
}

/** R16 — a waiter with open bills cannot be removed. */
export function removeWaiter(
  state: RoomsState,
  locId: string,
  waiterId: string,
  now: DateLike = new Date(),
): { ok: true; state: RoomsState; name: string } | { ok: false; error: string } | null {
  const location = getLocation(state, locId);
  if (!location) return null;
  const waiter = (location.waiters || []).find((item) => item.id === waiterId);
  if (!waiter) return null;
  const load = waiterLoad(state, locId, waiter.id, now);
  if (load > 0) {
    return {
      ok: false,
      error: `${waiter.name} still has ${load} open ${spotWord(state.businessType, true).toLowerCase()}. Complete those orders first.`,
    };
  }
  const next = cloneState(state);
  next.locations = next.locations.map((item) =>
    item.id === location.id
      ? { ...item, waiters: item.waiters.filter((entry) => entry.id !== waiterId) }
      : item,
  );
  return { ok: true, state: next, name: waiter.name };
}

/* ------------------------------------------------------------------ */
/* Lookups used by the owner pages and the counters                   */
/* ------------------------------------------------------------------ */

export function sourceLabel(order: Order): string {
  if (!order.code) return "Direct punch";
  if (order.source === "punch") return "Punched by staff";
  if (orderRounds(order).length > 1) return "Repeat order";
  return "QR order";
}

export function countNewOrders(state: RoomsState, locId?: string): number {
  return state.orders.filter((order) => order.status === "new" && (!locId || order.locId === locId))
    .length;
}

export function newOrders(state: RoomsState): Order[] {
  return state.orders
    .filter((order) => order.status === "new")
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
}

export function openSpotCount(state: RoomsState, locId: string, now: DateLike = new Date()): number {
  const codes = new Set(
    state.orders
      .filter((order) => order.locId === locId && isTodayOrder(order, now) && order.code && activeStatus(order.status))
      .map((order) => order.code as string),
  );
  return codes.size;
}

export function todaysEarnings(state: RoomsState, locId: string, now: DateLike = new Date()): number {
  return state.orders
    .filter((order) => order.locId === locId && isTodayOrder(order, now) && order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
}

export function todaysGuests(state: RoomsState, locId: string, now: DateLike = new Date()): number {
  return state.orders
    .filter((order) => order.locId === locId && isTodayOrder(order, now) && order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.guests || 0), 0);
}

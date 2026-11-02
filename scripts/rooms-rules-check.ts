/**
 * Rules check for `lib/rooms/rules.ts` — checklist section F, all 28 groups.
 *
 * Run with `npx tsx scripts/rooms-rules-check.ts`. Prints `N checks passed`
 * and exits non-zero with the failed check names when anything breaks.
 */

import {
  activeStatus,
  addRoom,
  addWaiter,
  approveJoinRequest,
  availableWaiters,
  createPunchOrder,
  dailySeries,
  effectiveJoinStatus,
  findOpenBill,
  markBillEmailed,
  nextOrderNumber,
  nextRoomCode,
  placeOrder,
  recentPaidBill,
  regenerateJoinCode,
  removeWaiter,
  renameRoom,
  requestJoin,
  requestService,
  resolveScanParticipation,
  sendBillToPhone,
  setOrderStatus,
  statsForRange,
  verifyJoinCode,
  verifyPayment,
  waiterLoad,
  wifiUnlockedForOrder,
  periodWindow,
  previousPeriodWindow,
} from "../lib/rooms/rules";
import { displaySpotName, parseMenuPrice, spotWord } from "../lib/rooms/format";
import { freshRounds, freshServiceCalls } from "../lib/rooms/detect";
import { simulateOrder } from "../lib/rooms/simulate";
import { configTemplate } from "../lib/rooms/seed";
import { seedOrStored, stateFromRaw } from "../lib/rooms/store";
import type {
  JoinRequest,
  Order,
  OrderItem,
  Room,
  RoomsState,
  Waiter,
} from "../lib/rooms/types";

let passed = 0;
const failures: string[] = [];
const groups = new Set<number>();

function group(n: number): void {
  groups.add(n);
}

function check(name: string, condition: boolean): void {
  if (condition) passed += 1;
  else failures.push(name);
}

function eq<T>(name: string, actual: T, expected: T): void {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  check(`${name} — expected ${expectedText}, got ${actualText}`, actualText === expectedText);
}

const NOW = new Date("2026-10-30T12:00:00");
const today = NOW.toISOString();
const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
const iso = (date: Date) => date.toISOString();

function item(id: string, price: number, qty = 1): OrderItem {
  return { id, name: id, price, qty };
}

function waiter(id: string, name: string, maxTables = 3, active = true): Waiter {
  return { id, name, maxTables, active };
}

function room(code: string, name: string, active = true): Room {
  return { id: `rm_${code}`, code, name, active, scans: 0 };
}

function baseState(overrides: Partial<RoomsState> = {}): RoomsState {
  return {
    locations: [
      {
        id: "loc1",
        name: "Test Cafe",
        slug: "test",
        scans: 0,
        active: true,
        waiters: [waiter("w1", "Aarav", 3), waiter("w2", "Meera", 4)],
        rooms: [room("qr1", "Table 1"), room("qr2", "Table 2")],
      },
    ],
    configs: {},
    orders: [],
    joinRequests: [],
    serviceCalls: [],
    businessType: "cafe",
    savedAt: 1,
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const id = overrides.id ?? "ord1";
  const base: Order = {
    id,
    number: 1041,
    locId: "loc1",
    code: "qr1",
    billId: id,
    customerName: "Ananya",
    phone: "",
    guests: 2,
    waiterId: null,
    participants: [],
    items: [item("cold-brew", 180)],
    total: 180,
    status: "new",
    createdAt: today,
    updatedAt: today,
    source: "customer",
    rounds: [
      { id: `${id}_r1`, at: today, items: [item("cold-brew", 180)], total: 180, via: "customer" },
    ],
  };
  return { ...base, ...overrides };
}

function hostParticipant(deviceId = "dev1") {
  return { id: "p1", name: "Ananya", deviceId, role: "host" as const, joinedAt: today };
}

function joinRequest(overrides: Partial<JoinRequest> = {}): JoinRequest {
  return {
    id: "jr1",
    orderId: "bill1",
    locId: "loc1",
    code: "qr1",
    deviceId: "guestdev",
    name: "Kabir",
    status: "pending",
    createdAt: today,
    expiresAt: iso(new Date(NOW.getTime() + 2 * 60 * 1000)),
    attempts: 0,
    maxAttempts: 5,
    joinCode: null,
    codeExpiresAt: null,
    ...overrides,
  };
}

/* 1 ---------------------------------------------------------------- */
group(1);
check("1 activeStatus new", activeStatus("new"));
check("1 activeStatus preparing", activeStatus("preparing"));
check("1 activeStatus served", activeStatus("served"));
check("1 activeStatus completed is inactive", !activeStatus("completed"));
check("1 activeStatus cancelled is inactive", !activeStatus("cancelled"));

/* 2 ---------------------------------------------------------------- */
group(2);
const orderOld = makeOrder({ id: "old", updatedAt: iso(new Date(NOW.getTime() - 60000)) });
const orderNew = makeOrder({ id: "newer", updatedAt: today });
const orderDone = makeOrder({ id: "done", status: "completed" });
const state2 = baseState({ orders: [orderOld, orderNew, orderDone] });
eq("2 findOpenBill newest active", findOpenBill(state2, "loc1", "qr1")?.id, "newer");
eq("2 findOpenBill null without a code", findOpenBill(state2, "loc1", null), null);
eq("2 findOpenBill ignores completed", findOpenBill(baseState({ orders: [orderDone] }), "loc1", "qr1"), null);

/* 3 ---------------------------------------------------------------- */
group(3);
eq("3 nextOrderNumber from empty", nextOrderNumber(baseState()), 1041);
eq("3 nextOrderNumber above 1050", nextOrderNumber(baseState({ orders: [makeOrder({ number: 1050 })] })), 1051);

/* 4 ---------------------------------------------------------------- */
group(4);
const state4 = baseState({
  orders: [
    makeOrder({ id: "a", code: "qr1", waiterId: "w1" }),
    makeOrder({ id: "b", code: "qr1", waiterId: "w1", status: "preparing" }),
    makeOrder({ id: "c", code: "qr2", waiterId: "w1" }),
    makeOrder({ id: "d", code: "qr1", waiterId: "w1", createdAt: yesterday, updatedAt: yesterday }),
    makeOrder({ id: "e", code: "qr2", waiterId: "w1", status: "completed" }),
    makeOrder({ id: "f", code: null, waiterId: "w1" }),
  ],
});
eq("4 waiterLoad counts distinct live codes today", waiterLoad(state4, "loc1", "w1", NOW), 2);

/* 5 ---------------------------------------------------------------- */
group(5);
const state5 = baseState();
state5.locations[0].waiters = [
  waiter("busy", "Busy", 1),
  waiter("off", "Off", 3, false),
  waiter("free", "Free", 3),
];
state5.orders = [makeOrder({ code: "qr1", waiterId: "busy" })];
eq("5 availableWaiters skips inactive and full", availableWaiters(state5, "loc1", NOW).map((w) => w.id), ["free"]);

/* 6 ---------------------------------------------------------------- */
group(6);
const result6 = placeOrder(
  baseState(),
  { locId: "loc1", code: "qr1", deviceId: "dev1", lines: [item("cold-brew", 180, 2)], name: "Ananya", phone: "", guests: 3, waiterId: "auto" },
  NOW,
);
check("6 placeOrder succeeds", result6.ok);
if (result6.ok) {
  eq("6 host participant", result6.order.participants.map((p) => p.role), ["host"]);
  eq("6 host device id", result6.order.participants[0].deviceId, "dev1");
  eq("6 round via customer", result6.round.via, "customer");
  eq("6 waiter auto is first available", result6.order.waiterId, "w1");
  eq("6 total", result6.order.total, 360);
  eq("6 not an addition", result6.added, false);
}

/* 7 ---------------------------------------------------------------- */
group(7);
const state7 = baseState({
  orders: [
    makeOrder({
      id: "bill1",
      hostDeviceId: "dev1",
      participants: [hostParticipant("dev1")],
      items: [item("cold-brew", 180)],
      total: 180,
    }),
  ],
});
const result7 = placeOrder(
  state7,
  { locId: "loc1", code: "qr1", deviceId: "dev1", lines: [item("cold-brew", 180, 1), item("brownie", 120, 1)], name: "", phone: "", guests: 2, waiterId: "auto" },
  NOW,
);
check("7 reorder succeeds", result7.ok);
if (result7.ok) {
  eq("7 round via reorder", result7.round.via, "reorder");
  eq("7 lines merged", result7.order.items.find((line) => line.id === "cold-brew")?.qty, 2);
  eq("7 total recomputed", result7.order.total, 480);
  eq("7 status reset to new", result7.order.status, "new");
  eq("7 still one bill", result7.state.orders.length, 1);
  eq("7 two rounds", result7.order.rounds.length, 2);
  eq("7 round by the participant", result7.round.by, "Ananya");
}

/* 8 ---------------------------------------------------------------- */
group(8);
const result8 = placeOrder(
  state7,
  { locId: "loc1", code: "qr1", deviceId: "dev2", lines: [item("cold-brew", 180, 1)], name: "", phone: "", guests: 2, waiterId: "auto" },
  NOW,
);
eq(
  "8 unknown device error",
  result8.ok ? "no error" : result8.error,
  "Ask the table host to approve your phone before adding to this bill.",
);

/* 9 ---------------------------------------------------------------- */
group(9);
const emptyCart = placeOrder(
  baseState(),
  { locId: "loc1", code: "qr1", deviceId: "dev1", lines: [], name: "Ananya", phone: "", guests: 2, waiterId: "auto" },
  NOW,
);
eq(
  "9 empty cart error",
  emptyCart.ok ? "no error" : emptyCart.error,
  "Your cart is empty. Add something from the menu.",
);
const noName = placeOrder(
  baseState(),
  { locId: "loc1", code: "qr1", deviceId: "dev1", lines: [item("cold-brew", 180)], name: "   ", phone: "", guests: 2, waiterId: "auto" },
  NOW,
);
eq(
  "9 missing name error",
  noName.ok ? "no error" : noName.error,
  "Please add your name so the waiter knows who ordered.",
);
const busyState = baseState();
busyState.locations[0].waiters = [waiter("w1", "Aarav", 1)];
busyState.orders = [makeOrder({ code: "qr2", waiterId: "w1" })];
const busyWaiter = placeOrder(
  busyState,
  { locId: "loc1", code: "qr1", deviceId: "dev1", lines: [item("cold-brew", 180)], name: "Ananya", phone: "", guests: 2, waiterId: "w1" },
  NOW,
);
eq(
  "9 unavailable waiter error",
  busyWaiter.ok ? "no error" : busyWaiter.error,
  "That waiter just took another table. Pick someone else or choose Any available.",
);

/* 10 --------------------------------------------------------------- */
group(10);
const staffBill = makeOrder({ id: "staffbill", source: "punch", hostDeviceId: null, participants: [] });
const first10 = resolveScanParticipation(staffBill, "devA", NOW);
eq("10 first device becomes host", first10.participant?.role, "host");
eq("10 host device recorded", first10.order.hostDeviceId, "devA");
const second10 = resolveScanParticipation(first10.order, "devB", NOW);
eq("10 second device gets null", second10.participant, null);

/* 11 --------------------------------------------------------------- */
group(11);
const state11 = baseState({
  orders: [makeOrder({ id: "bill11", hostDeviceId: "hostdev", participants: [hostParticipant("hostdev")] })],
});
const order11 = state11.orders[0];
const request11 = requestJoin(state11, order11, "Kabir", "guestdev", NOW);
check("11 request created", request11.ok);
eq("11 request pending", request11.request?.status, "pending");
eq("11 expires in 2 minutes", new Date(request11.request?.expiresAt || 0).getTime() - NOW.getTime(), 120000);
const repeat11 = request11.state
  ? requestJoin(request11.state, request11.state.orders[0], "Kabir", "guestdev", new Date(NOW.getTime() + 1000))
  : null;
eq("11 repeat returns the same request", repeat11?.request?.id, request11.request?.id);
const already11 = requestJoin(state11, order11, "Ananya", "hostdev", NOW);
eq("11 participant error", already11.error, "You are already on this bill.");

/* 12 --------------------------------------------------------------- */
group(12);
const pending12 = joinRequest({ status: "pending" });
eq("12 pending is pending", effectiveJoinStatus(pending12, NOW), "pending");
eq(
  "12 pending expires after 2 minutes",
  effectiveJoinStatus(pending12, new Date(NOW.getTime() + 2 * 60 * 1000 + 1)),
  "expired",
);
const approved12 = joinRequest({
  status: "approved",
  codeExpiresAt: iso(new Date(NOW.getTime() + 5 * 60 * 1000)),
  joinCode: "123456",
});
eq("12 approved is approved", effectiveJoinStatus(approved12, NOW), "approved");
eq(
  "12 approved expires with the code",
  effectiveJoinStatus(approved12, new Date(NOW.getTime() + 5 * 60 * 1000 + 1)),
  "expired",
);

/* 13 --------------------------------------------------------------- */
group(13);
const state13 = baseState({ orders: [makeOrder({ id: "bill1" })], joinRequests: [joinRequest()] });
const approved13 = approveJoinRequest(state13, "jr1", NOW);
eq("13 status approved", approved13.request?.status, "approved");
check("13 code is 6 digits", /^\d{6}$/.test(approved13.request?.joinCode || ""));
eq(
  "13 code expires in 5 minutes",
  new Date(approved13.request?.codeExpiresAt || 0).getTime() - NOW.getTime(),
  300000,
);
eq("13 attempts reset", approved13.request?.attempts, 0);

/* 14 --------------------------------------------------------------- */
group(14);
const state14 = baseState({
  orders: [makeOrder({ id: "bill1", hostDeviceId: "hostdev", participants: [hostParticipant("hostdev")] })],
  joinRequests: [joinRequest({ status: "approved", joinCode: "123456", codeExpiresAt: iso(new Date(NOW.getTime() + 300000)) })],
});
const order14 = state14.orders[0];
const wrong14 = verifyJoinCode(state14, order14, "guestdev", "000000", NOW);
eq("14 wrong code increments", wrong14.request?.attempts, 1);
eq("14 attempts-left message", wrong14.error, "That code doesn't match. 4 attempts left.");
let chain14 = state14;
let last14 = wrong14;
for (let i = 0; i < 5; i += 1) {
  last14 = verifyJoinCode(chain14, chain14.orders[0], "guestdev", "000000", NOW);
  chain14 = last14.state;
}
eq("14 fifth wrong attempt locks", last14.request?.status, "locked");
eq("14 locked message", last14.error, "Too many wrong attempts. Ask the host to send a new code.");
const short14 = verifyJoinCode(state14, order14, "guestdev", "123", NOW);
eq("14 short code message", short14.error, "Enter the 6-digit code shown on the host's phone.");
const right14 = verifyJoinCode(state14, order14, "guestdev", "123456", NOW);
eq("14 correct code joins", right14.request?.status, "joined");
eq("14 guest added", right14.joined?.role, "guest");
eq("14 roster grew", right14.state.orders[0].participants.length, 2);

/* 15 --------------------------------------------------------------- */
group(15);
const locked15 = baseState({
  orders: [makeOrder({ id: "bill1" })],
  joinRequests: [joinRequest({ status: "locked", attempts: 5 })],
});
const regenerated15 = regenerateJoinCode(locked15, "jr1", NOW);
eq("15 status back to approved", regenerated15.request?.status, "approved");
eq("15 attempts reset", regenerated15.request?.attempts, 0);
check("15 a new code was made", /^\d{6}$/.test(regenerated15.request?.joinCode || ""));

/* 16 --------------------------------------------------------------- */
group(16);
const noBill16 = requestService(baseState(), { locId: "loc1", code: "qr1" }, "waiter", NOW);
eq("16 no bill returns null", noBill16.call, null);
const state16 = baseState({ orders: [makeOrder({ id: "bill16", code: "qr1" })] });
const waiterCall16 = requestService(state16, { locId: "loc1", code: "qr1" }, "waiter", NOW);
const sameKind16 = requestService(waiterCall16.state, { locId: "loc1", code: "qr1" }, "waiter", NOW);
eq("16 same kind returns the existing call", sameKind16.call?.id, waiterCall16.call?.id);
const billCall16 = requestService(waiterCall16.state, { locId: "loc1", code: "qr1" }, "bill", NOW);
eq("16 other kind replaces the call", billCall16.state.serviceCalls.length, 1);
eq("16 replacement kind", billCall16.call?.kind, "bill");

/* 17 --------------------------------------------------------------- */
group(17);
const state17 = baseState({
  orders: [makeOrder({ id: "bill17", code: "qr1", status: "served" })],
  serviceCalls: [
    {
      id: "call17",
      locId: "loc1",
      code: "qr1",
      kind: "bill",
      status: "open",
      createdAt: today,
      orderId: "bill17",
      customerName: "Ananya",
    },
  ],
});
const sent17 = sendBillToPhone(state17, "bill17", NOW);
check("17 sets billSentAt", sent17.ok && Boolean(sent17.order.billSentAt));
check("17 resolves the bill call", sent17.ok && sent17.state.serviceCalls[0].status === "done");
const direct17 = baseState({ orders: [makeOrder({ id: "direct17", code: null })] });
const directSent17 = sendBillToPhone(direct17, "direct17", NOW);
eq(
  "17 refuses a direct punch",
  directSent17.ok ? "sent" : directSent17.error,
  "Direct punch bills have no customer session to send to.",
);
const closed17 = baseState({ orders: [makeOrder({ id: "closed17", status: "completed" })] });
const closedSent17 = sendBillToPhone(closed17, "closed17", NOW);
eq(
  "17 refuses a closed bill",
  closedSent17.ok ? "sent" : closedSent17.error,
  "This bill is already closed — start a new order instead.",
);
const emailed17 = markBillEmailed(state17, "bill17", "customer@example.com", NOW);
eq("17 email stored", emailed17?.order.emailedTo, "customer@example.com");
eq("17 email timestamp", emailed17?.order.emailedAt, today);

/* 18 --------------------------------------------------------------- */
group(18);
const state18 = baseState({
  orders: [makeOrder({ id: "bill18", code: "qr1", status: "served", waiterId: "w1", total: 180 })],
});
const mismatch18 = verifyPayment(state18, "bill18", 179, "Cash", NOW);
eq(
  "18 mismatch rejected",
  mismatch18.ok ? "paid" : mismatch18.error,
  "That doesn't match the bill total of ₹180. Enter the exact amount to close.",
);
const exact18 = verifyPayment(state18, "bill18", 180, "Cash", NOW);
check("18 exact amount closes", exact18.ok && exact18.order.status === "completed");
eq("18 waiterLoad before", waiterLoad(state18, "loc1", "w1", NOW), 1);
eq("18 waiterLoad after", exact18.ok ? waiterLoad(exact18.state, "loc1", "w1", NOW) : -1, 0);

/* 19 --------------------------------------------------------------- */
group(19);
const state19 = baseState({ orders: [makeOrder({ id: "bill19", status: "new" })] });
const accepted19 = setOrderStatus(state19, "bill19", "preparing", NOW);
eq("19 acceptedAt set", accepted19.order?.acceptedAt, today);
const again19 = setOrderStatus(accepted19.state, "bill19", "preparing", new Date(NOW.getTime() + 60000));
eq("19 acceptedAt set once", again19.order?.acceptedAt, today);
const invalid19 = setOrderStatus(state19, "bill19", "new", NOW);
eq("19 invalid status ignored", invalid19.order, null);
const cancelled19 = setOrderStatus(state19, "bill19", "cancelled", NOW);
eq("19 cancelled status", cancelled19.order?.status, "cancelled");

/* 20 --------------------------------------------------------------- */
group(20);
const wifiConfig = configTemplate("rooms");
const order20 = makeOrder({ code: "qr1", status: "new" });
check("20 locked before accept", !wifiUnlockedForOrder(order20, wifiConfig, "cafe"));
check("20 unlocked when preparing", wifiUnlockedForOrder({ ...order20, status: "preparing" }, wifiConfig, "cafe"));
check("20 unlocked when served", wifiUnlockedForOrder({ ...order20, status: "served", acceptedAt: today }, wifiConfig, "cafe"));
check("20 locked when completed", !wifiUnlockedForOrder({ ...order20, status: "completed", acceptedAt: today }, wifiConfig, "cafe"));
check(
  "20 locked when Wi-Fi is off",
  !wifiUnlockedForOrder(
    { ...order20, status: "preparing" },
    { ...wifiConfig, wifi: { ...wifiConfig.wifi, on: false } },
    "cafe",
  ),
);
check("20 locked for another business type", !wifiUnlockedForOrder({ ...order20, status: "preparing" }, wifiConfig, "salon"));

/* 21 --------------------------------------------------------------- */
group(21);
const paidAt21 = iso(new Date(NOW.getTime() - 60000));
const state21 = baseState({
  orders: [
    makeOrder({
      id: "paid21",
      status: "completed",
      paidAt: paidAt21,
      hostDeviceId: "dev1",
      participants: [hostParticipant("dev1")],
    }),
  ],
});
eq("21 visible within five minutes", recentPaidBill(state21, "loc1", "qr1", "dev1", NOW)?.id, "paid21");
eq(
  "21 hidden after the window",
  recentPaidBill(state21, "loc1", "qr1", "dev1", new Date(NOW.getTime() + 5 * 60 * 1000 + 1)),
  null,
);
eq("21 hidden from other devices", recentPaidBill(state21, "loc1", "qr1", "dev2", NOW), null);

/* 22 --------------------------------------------------------------- */
group(22);
const state22 = baseState({
  orders: [
    makeOrder({ id: "a22", total: 100, status: "completed", createdAt: today, updatedAt: today }),
    makeOrder({ id: "b22", total: 51, status: "new", createdAt: today, updatedAt: today }),
    makeOrder({ id: "c22", total: 999, status: "cancelled", createdAt: today, updatedAt: today }),
  ],
});
const range22 = periodWindow("today", NOW);
const stats22 = statsForRange(state22, "loc1", range22);
eq("22 cancelled excluded", stats22.orders, 2);
eq("22 earnings", stats22.earnings, 151);
eq("22 collected is completed only", stats22.collected, 100);
eq("22 average rounded", stats22.average, 76);
const previous22 = previousPeriodWindow("today", NOW);
eq("22 previous ends a millisecond before", previous22.end.getTime(), range22.start.getTime() - 1);

/* 23 --------------------------------------------------------------- */
group(23);
const week23 = dailySeries(baseState(), "loc1", "week", NOW);
eq("23 week length", week23.length, 7);
check("23 week labels every day", week23.every((point) => point.label !== ""));
const fortnight23 = dailySeries(baseState(), "loc1", "fortnight", NOW);
eq("23 fortnight length", fortnight23.length, 15);
eq(
  "23 fortnight labels every 2 days",
  fortnight23.map((point, index) => (point.label ? index : -1)).filter((index) => index >= 0),
  [0, 2, 4, 6, 8, 10, 12, 14],
);
const month23 = dailySeries(baseState(), "loc1", "month", NOW);
eq("23 month length", month23.length, 30);
eq(
  "23 month labels every 5 days",
  month23.map((point, index) => (point.label ? index : -1)).filter((index) => index >= 0),
  [0, 5, 10, 15, 20, 25, 29],
);

/* 24 --------------------------------------------------------------- */
group(24);
const state24 = baseState({ orders: [makeOrder({ id: "bill24", code: "qr1", items: [item("cold-brew", 180)], total: 180 })] });
const joined24 = createPunchOrder(
  state24,
  { locId: "loc1", code: "qr1", lines: [item("brownie", 120)], name: "", phone: "", guests: 1, waiterId: null },
  NOW,
);
check("24 punch joins the open bill", joined24.ok && joined24.added);
eq("24 punch round", joined24.ok ? joined24.round.via : "", "punch");
eq("24 merged total", joined24.ok ? joined24.state.orders[0].total : -1, 300);
const direct24 = createPunchOrder(
  baseState(),
  { locId: "loc1", code: null, lines: [item("brownie", 120)], name: "Walk-in", phone: "", guests: 1, waiterId: null },
  NOW,
);
check("24 direct punch has no code", direct24.ok && direct24.order.code === null);
const capacityState24 = baseState();
capacityState24.locations[0].waiters = [waiter("w1", "Aarav", 1)];
capacityState24.orders = [makeOrder({ id: "busy24", code: "qr2", waiterId: "w1" })];
const tablePunch24 = createPunchOrder(
  capacityState24,
  { locId: "loc1", code: "qr1", lines: [item("brownie", 120)], name: "", phone: "", guests: 1, waiterId: "w1" },
  NOW,
);
eq("24 table punch respects capacity", tablePunch24.ok ? tablePunch24.order.waiterId : "punch failed", null);

/* 25 --------------------------------------------------------------- */
group(25);
const location25 = baseState().locations[0];
location25.rooms = [room("qr1", "Table 1"), room("qr2", "Table 2"), room("qr3", "Table 3"), room("qr5", "Table 5"), room("qr6", "Table 6")];
eq("25 nextRoomCode skips used codes", nextRoomCode(location25), "qr7");
const full25 = baseState();
full25.locations[0].rooms = Array.from({ length: 12 }, (_, index) => room(`qr${index + 1}`, `Table ${index + 1}`));
const blocked25 = addRoom(full25, "loc1", "Table 13");
eq("25 add blocked at 12", blocked25 && !blocked25.ok ? blocked25.error : "added", "Limit: 12 room QRs per location.");
const added25 = addRoom(baseState(), "loc1", "Table 9");
check("25 add gives the next code", Boolean(added25 && added25.ok && added25.room.code === "qr3"));
const renamed25 = added25 && added25.ok ? renameRoom(added25.state, "loc1", "qr3", "Patio") : null;
check(
  "25 rename keeps the code",
  Boolean(renamed25 && renamed25.ok && renamed25.room.code === "qr3" && renamed25.room.name === "Patio"),
);

/* 26 --------------------------------------------------------------- */
group(26);
const duplicate26 = addWaiter(baseState(), "loc1", "aarav", 3, NOW);
eq("26 duplicate name rejected", duplicate26 && !duplicate26.ok ? duplicate26.error : "added", "That waiter is already on the team.");
const clamped26 = addWaiter(baseState(), "loc1", "Zoya", 99, NOW);
eq("26 max clamped to 8", clamped26 && clamped26.ok ? clamped26.waiter.maxTables : -1, 8);
const emptyName26 = addWaiter(baseState(), "loc1", "   ", 3, NOW);
eq("26 name required", emptyName26 && !emptyName26.ok ? emptyName26.error : "added", "Enter a waiter name.");
const loaded26 = removeWaiter(baseState({ orders: [makeOrder({ code: "qr1", waiterId: "w1" })] }), "loc1", "w1", NOW);
eq(
  "26 remove blocked under load",
  loaded26 && !loaded26.ok ? loaded26.error : "removed",
  "Aarav still has 1 open tables. Complete those orders first.",
);
const removed26 = removeWaiter(baseState(), "loc1", "w1");
check("26 remove works with no load", Boolean(removed26 && removed26.ok));

/* 27 --------------------------------------------------------------- */
group(27);
eq("27 hotel singular", spotWord("hotel", false), "Room");
eq("27 hotel plural", spotWord("hotel", true), "Rooms");
eq("27 cafe singular", spotWord("cafe", false), "Table");
eq("27 cafe plural", spotWord("cafe", true), "Tables");
eq("27 hotel display name", displaySpotName("hotel", { name: "Table 5" }), "Room 5");
eq("27 cafe display name", displaySpotName("cafe", { name: "Room 5" }), "Table 5");

/* 28 --------------------------------------------------------------- */
group(28);
eq("28 corrupt JSON is rejected", stateFromRaw("{not json"), null);
eq("28 invalid shape is rejected", stateFromRaw(JSON.stringify({ hello: 1 })), null);
const fallback28 = seedOrStored("nope");
check("28 falls back to the seed", Array.isArray(fallback28.locations) && fallback28.locations.length === 2);
check("28 seed has orders", seedOrStored(null).orders.length > 0);

/* O1 (spec section 17) ---------------------------------------------- */
eq("O1 parse Rs 180", parseMenuPrice("Rs 180"), 180);
eq("O1 parse free text", parseMenuPrice("from Rs 1500"), 1500);
eq("O1 parse thousands separator", parseMenuPrice("Rs 1,200"), 1200);
eq("O1 unparseable price", parseMenuPrice("Ask staff"), null);
eq("O1 empty price", parseMenuPrice(""), null);

/* D (checklist) — live detection ------------------------------------ */
const dRounds = new Set<string>();
const dState = baseState({ orders: [makeOrder({ id: "detect1", code: "qr1" })] });
eq("D fresh round count", freshRounds(dState, dRounds).length, 1);
eq("D known round count", dRounds.size, 1);
eq("D repeated detection", freshRounds(dState, dRounds).length, 0);
const dCalls = new Set<string>();
const dCallState = baseState();
dCallState.serviceCalls = [
  {
    id: "call1",
    locId: "loc1",
    code: "qr1",
    kind: "waiter",
    status: "open",
    customerName: "Ananya",
    createdAt: iso(NOW),
  } as (typeof dCallState.serviceCalls)[number],
];
eq("D fresh call count", freshServiceCalls(dCallState, dCalls).length, 1);
eq("D known call count", dCalls.size, 1);
const doneCallState = baseState();
doneCallState.serviceCalls = [
  { ...dCallState.serviceCalls[0], status: "done" } as (typeof doneCallState.serviceCalls)[number],
];
eq("D done call ignored", freshServiceCalls(doneCallState, new Set()).length, 0);

/* DEV-ONLY simulate-order -------------------------------------------- */
let simSeed = 7;
const simRandom = () => {
  simSeed = (simSeed * 1103515245 + 12345) % 2147483648;
  return simSeed / 2147483648;
};
const simD = simulateOrder(baseState(), "loc1", NOW, simRandom);
check("simulate returns an order", simD.ok);
if (simD.ok) {
  eq("simulate source", simD.order.source, "simulated");
  eq("simulate status", simD.order.status, "new");
  eq("simulate round via", simD.order.rounds && simD.order.rounds[0] ? simD.order.rounds[0].via : "", "simulated");
  check(
    "simulate picks an active spot",
    baseState().locations[0].rooms.some((room) => room.code === simD.order.code && room.active),
  );
  eq("simulate appends one order", simD.state.orders.length, baseState().orders.length + 1);
}
const noRoomD = baseState();
noRoomD.locations[0].rooms = [];
eq(
  "simulate needs an active spot",
  simulateOrder(noRoomD, "loc1", NOW, simRandom).ok ? "ok" : "error",
  "error",
);

/* ------------------------------------------------------------------ */
check("all 28 checklist groups are covered", groups.size === 28);

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`${passed} checks passed`);
}

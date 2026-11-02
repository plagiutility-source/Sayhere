// DEV-ONLY: the demo's "Simulate customer order" tool. Deleted at merge.
import { isTodayOrder, orderItemsTotal, spotWord } from "./format";
import { activeStatus, availableWaiters, nextOrderNumber } from "./rules";
import { MENU_ITEMS } from "./seed";
import type { Order, OrderItem, RoomsState, Round } from "./types";

const NAMES = ["Ishaan", "Nisha", "Vikram", "Tara", "Arjun", "Priya"];

export type SimulateResult =
  | { ok: true; state: RoomsState; order: Order }
  | { ok: false; error: string };

/**
 * The demo's `simulateOrder`: pick a quiet active spot, 1–2 random items,
 * a free waiter and a walk-in name, then push a `new` simulated bill.
 * `random` is injectable so the rules check can stay deterministic.
 */
export function simulateOrder(
  state: RoomsState,
  locId: string,
  now: Date | string | number = new Date(),
  random: () => number = Math.random,
): SimulateResult {
  const location = state.locations.find((item) => item.id === locId);
  const rooms = location ? location.rooms.filter((room) => room.active) : [];
  if (!location || !rooms.length) {
    return { ok: false, error: `Add an active ${spotWord(state.businessType, false).toLowerCase()} QR first.` };
  }

  const busyCodes = new Set(
    state.orders
      .filter(
        (order) =>
          order.locId === location.id && isTodayOrder(order, now) && activeStatus(order.status),
      )
      .map((order) => order.code),
  );
  const quietRooms = rooms.filter((room) => !busyCodes.has(room.code));
  const pool = quietRooms.length ? quietRooms : rooms;
  const room = pool[Math.floor(random() * pool.length)] || pool[0];

  const name = NAMES[Math.floor(random() * NAMES.length)] || NAMES[0];
  const ids = Object.keys(MENU_ITEMS);
  const chosen: OrderItem[] = [];
  const count = 1 + Math.floor(random() * 2);
  while (chosen.length < count && ids.length) {
    const id = ids[Math.floor(random() * ids.length)];
    if (!chosen.some((item) => item.id === id)) {
      const item = MENU_ITEMS[id];
      chosen.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1 + Math.floor(random() * 2),
      });
    }
  }

  const free = availableWaiters(state, location.id, now);
  const waiter = free.length ? free[Math.floor(random() * free.length)] : null;
  const stamp = new Date(now).toISOString();
  const id = `ord_${new Date(now).getTime()}_${Math.floor(random() * 999)}`;
  const total = orderItemsTotal(chosen);
  const round: Round = {
    id: `${id}_r1`,
    at: stamp,
    items: chosen.map((item) => ({ ...item })),
    total,
    via: "simulated",
  };
  const order: Order = {
    id,
    number: nextOrderNumber(state),
    locId: location.id,
    code: room.code,
    billId: id,
    customerName: name,
    phone:
      random() > 0.6 ? `+9198${Math.floor(10000000 + random() * 89999999)}` : "",
    guests: 1 + Math.floor(random() * 4),
    waiterId: waiter ? waiter.id : null,
    participants: [],
    items: chosen,
    total,
    status: "new",
    createdAt: stamp,
    updatedAt: stamp,
    source: "simulated",
    rounds: [round],
  };

  return { ok: true, state: { ...state, orders: state.orders.concat([order]) }, order };
}

/**
 * Seed data and demo fixtures, ported from the demo's `app.js`
 * (`configTemplate`, `seedWaiters`, `seedOrders`, `seedHistoryOrders`,
 * `seedState`, `ensureShape`).
 *
 * The demo's MENU / BUSINESS / WEEK constants live here too: they are seed
 * fixtures, not styling, and at merge they are replaced by the business
 * profile and the real menu (spec section 13).
 */

import { businessPresets } from "../brand/tokens";
import { orderItemsTotal } from "./format";
import { NAME_MAX } from "./constants";
import type {
  Order,
  OrderItem,
  RoomsPageConfig,
  RoomsState,
  SpotLocation,
  Waiter,
} from "./types";

export type DemoMenuItem = {
  id: string;
  name: string;
  price: number;
  details: string;
  tag: string | null;
};

export type DemoMenuCategory = { name: string; items: DemoMenuItem[] };

export type DemoMenu = { categories: DemoMenuCategory[] };

/** The demo's business constant (replaced by `useBusiness()` at merge). */
export const DEMO_BUSINESS = {
  name: "Brew and Bean",
  initials: "BB",
  tagline: "Enjoying your coffee?",
  googleReviewUrl: "https://g.page/r/brew-and-bean/review",
  theme: {
    primary: businessPresets.cafe.primary,
    secondary: businessPresets.cafe.secondary,
    bg: businessPresets.cafe.background,
  },
} as const;

/** The demo's menu (the real menu replaces it at merge). */
export const DEMO_MENU: DemoMenu = {
  categories: [
    {
      name: "Coffee",
      items: [
        {
          id: "cold-brew",
          name: "Cold brew",
          price: 180,
          details: "Cold-steeped 12 hours, served over ice",
          tag: "Popular",
        },
        {
          id: "cappuccino",
          name: "Cappuccino",
          price: 160,
          details: "Double shot, silky milk",
          tag: null,
        },
        {
          id: "filter-coffee",
          name: "Filter coffee",
          price: 120,
          details: "House blend, bottomless before 11 am",
          tag: "Table guests",
        },
      ],
    },
    {
      name: "Bites",
      items: [
        {
          id: "veg-sandwich",
          name: "Veg sandwich",
          price: 140,
          details: "Grilled bread, cucumber, tomato, cheese, chutney",
          tag: "Veg",
        },
        {
          id: "brownie",
          name: "Brownie",
          price: 120,
          details: "Warm, with a scoop of vanilla",
          tag: null,
        },
      ],
    },
  ],
};

export const MENU_ITEMS: Record<string, DemoMenuItem> = (() => {
  const items: Record<string, DemoMenuItem> = {};
  DEMO_MENU.categories.forEach((category) => {
    category.items.forEach((item) => {
      items[item.id] = item;
    });
  });
  return items;
})();

/** Weekly hours shown on the demo's Hours screen. */
export const DEMO_WEEK: [string, string][] = [
  ["Monday", "9:00 \u2013 21:00"],
  ["Tuesday", "9:00 \u2013 21:00"],
  ["Wednesday", "9:00 \u2013 21:00"],
  ["Thursday", "9:00 \u2013 21:00"],
  ["Friday", "9:00 \u2013 21:00"],
  ["Saturday", "9:00 \u2013 21:00"],
  ["Sunday", "Closed"],
];

export type ConfigKind = "reception" | "rooms";

export function configTemplate(kind: ConfigKind): RoomsPageConfig {
  if (kind === "reception") {
    return {
      announcement: { on: true, text: "Buy 1 get 1 free on cold brew, this week only." },
      thankYou: "Thank you for the feedback \u2014 we would love to see you again soon!",
      wifi: { on: false, ssid: "BrewGuest", password: "bean2026" },
      menu: { on: true, title: "Our menu" },
      hours: {
        on: true,
        phone: "+919876543210",
        address: "12 Linking Road, Bandra West, Mumbai",
      },
      call: { on: true, phone: "+919876543210" },
      directions: { on: true, value: "12 Linking Road, Bandra West, Mumbai" },
      custom: { on: true, label: "Order online", url: "https://brewandbean.example/order" },
      socials: {
        instagram: "https://instagram.com/brewandbean",
        website: "https://brewandbean.example",
      },
    };
  }
  return {
    announcement: { on: true, text: "Room guests: free filter coffee refill before 11 am." },
    thankYou: "Enjoy your stay \u2014 tell us how we can make it better.",
    wifi: { on: true, ssid: "BrewGuest-Rooms", password: "room2026" },
    menu: { on: true, title: "Room service menu" },
    hours: {
      on: true,
      phone: "+919876543210",
      address: "12 Linking Road, Bandra West, Mumbai",
    },
    call: { on: true, phone: "+919876543210" },
    directions: { on: false, value: "" },
    custom: {
      on: true,
      label: "Request housekeeping",
      url: "https://brewandbean.example/housekeeping",
    },
    socials: { instagram: "https://instagram.com/brewandbean" },
  };
}

export function seedWaiters(): Waiter[] {
  return [
    { id: "w_aarav", name: "Aarav", maxTables: 3, active: true },
    { id: "w_meera", name: "Meera", maxTables: 4, active: true },
    { id: "w_rohit", name: "Rohit", maxTables: 2, active: false },
  ];
}

function minutesAgo(now: Date, minutes: number): string {
  const time = now.getTime();
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);
  return new Date(Math.max(time - minutes * 60000, startOfDay + 60000)).toISOString();
}

function daysAgoAt(now: Date, days: number, hour: number, minute: number): string {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function seedOrderItem(id: string, qty: number): OrderItem {
  const item = MENU_ITEMS[id];
  return { id, name: item.name, price: item.price, qty };
}

export function seedOrders(now: Date = new Date()): Order[] {
  return [
    {
      id: "ord_seed_1038",
      number: 1038,
      locId: "cafe01",
      code: "qr1",
      billId: "ord_seed_1038",
      customerName: "Ananya",
      phone: "",
      guests: 2,
      waiterId: "w_aarav",
      participants: [],
      items: [seedOrderItem("cold-brew", 1), seedOrderItem("brownie", 1)],
      total: 300,
      status: "completed",
      createdAt: minutesAgo(now, 190),
      updatedAt: minutesAgo(now, 160),
      source: "seed",
      rounds: [],
    },
    {
      id: "ord_seed_1039",
      number: 1039,
      locId: "cafe01",
      code: "qr2",
      billId: "ord_seed_1039",
      customerName: "Kabir",
      phone: "",
      guests: 1,
      waiterId: "w_aarav",
      participants: [],
      items: [seedOrderItem("cappuccino", 1)],
      total: 160,
      status: "completed",
      createdAt: minutesAgo(now, 125),
      updatedAt: minutesAgo(now, 110),
      source: "seed",
      rounds: [],
    },
    {
      id: "ord_seed_1040",
      number: 1040,
      locId: "cafe01",
      code: "qr1",
      billId: "ord_seed_1040",
      customerName: "Riya",
      phone: "+919820011223",
      guests: 2,
      waiterId: "w_aarav",
      participants: [],
      items: [seedOrderItem("veg-sandwich", 2), seedOrderItem("cold-brew", 1)],
      total: 460,
      status: "preparing",
      acceptedAt: minutesAgo(now, 48),
      createdAt: minutesAgo(now, 55),
      updatedAt: minutesAgo(now, 48),
      source: "seed",
      rounds: [],
    },
    {
      id: "ord_seed_1041",
      number: 1041,
      locId: "cafe01",
      code: "qr2",
      billId: "ord_seed_1041",
      customerName: "Dev",
      phone: "",
      guests: 2,
      waiterId: "w_aarav",
      participants: [],
      items: [seedOrderItem("filter-coffee", 2)],
      total: 240,
      status: "new",
      createdAt: minutesAgo(now, 22),
      updatedAt: minutesAgo(now, 22),
      source: "seed",
      rounds: [],
    },
    {
      id: "ord_seed_1042",
      number: 1042,
      locId: "cafe01",
      code: "qr3",
      billId: "ord_seed_1042",
      customerName: "Sara",
      phone: "+919930044556",
      guests: 3,
      waiterId: "w_aarav",
      participants: [],
      items: [seedOrderItem("cappuccino", 1), seedOrderItem("brownie", 1)],
      total: 280,
      status: "served",
      acceptedAt: minutesAgo(now, 3),
      createdAt: minutesAgo(now, 6),
      updatedAt: minutesAgo(now, 3),
      source: "seed",
      rounds: [],
    },
  ];
}

const HISTORY_NAMES = [
  "Ananya",
  "Kabir",
  "Riya",
  "Dev",
  "Sara",
  "Ishaan",
  "Nisha",
  "Arjun",
  "Tara",
  "Vikram",
  "Maya",
  "Rohan",
];

const HISTORY_MENU = [
  ["cold-brew", "brownie"],
  ["cappuccino", "veg-sandwich"],
  ["filter-coffee", "brownie"],
  ["veg-sandwich", "cold-brew"],
  ["cappuccino", "brownie"],
  ["filter-coffee", "veg-sandwich"],
];

/**
 * Enough completed bills for the Week / 15 days / Month views to be useful,
 * including the previous 30 days so Month has a real comparison.
 */
export function seedHistoryOrders(now: Date = new Date()): Order[] {
  const orders: Order[] = [];
  let number = 500;
  for (let day = 59; day >= 1; day -= 1) {
    const count = day % 3 === 0 ? 3 : 2;
    for (let index = 0; index < count; index += 1) {
      const code = `qr${((day + index) % 3) + 1}`;
      const menu = HISTORY_MENU[(day + index) % HISTORY_MENU.length];
      const items = menu.map((id, itemIndex) =>
        seedOrderItem(id, itemIndex === 0 && (day + index) % 2 === 0 ? 2 : 1),
      );
      const total = orderItemsTotal(items);
      const createdAt = daysAgoAt(now, day, 11 + index * 4 + (day % 3), (day * 7) % 60);
      const paidAt = new Date(new Date(createdAt).getTime() + 55 * 60000).toISOString();
      number += 1;
      orders.push({
        id: `ord_hist_${day}_${index}`,
        billId: `ord_hist_${day}_${index}`,
        number,
        locId: "cafe01",
        code,
        customerName: HISTORY_NAMES[(day + index) % HISTORY_NAMES.length],
        phone: index === 0 && day % 2 ? `+9198${String(20000000 + day * 137).slice(0, 8)}` : "",
        guests: 1 + ((day + index) % 4),
        waiterId: (day + index) % 3 === 0 ? "w_meera" : "w_aarav",
        participants: [],
        items,
        total,
        status: "completed",
        createdAt,
        updatedAt: paidAt,
        paidAt,
        payment: { amount: total, mode: day % 2 ? "UPI" : "Cash", at: paidAt },
        source: "seed",
        rounds: [
          {
            id: `ord_hist_${day}_${index}_r1`,
            at: createdAt,
            items: items.map((item) => ({ ...item })),
            total,
            via: "seed",
          },
        ],
      });
    }
  }
  return orders;
}

export function seedState(now: Date = new Date()): RoomsState {
  const locations: SpotLocation[] = [
    {
      id: "cafe01",
      name: "Brew and Bean \u2014 Bandra",
      slug: "cafe01",
      scans: 955,
      active: true,
      waiters: seedWaiters(),
      rooms: [
        { id: "rm_cafe01_qr1", code: "qr1", name: "Table 1", active: true, scans: 42 },
        { id: "rm_cafe01_qr2", code: "qr2", name: "Table 2", active: true, scans: 31 },
        { id: "rm_cafe01_qr3", code: "qr3", name: "Table 3", active: true, scans: 18 },
        { id: "rm_cafe01_qr4", code: "qr4", name: "Table 4", active: true, scans: 0 },
      ],
    },
    {
      id: "cafe02",
      name: "Brew and Bean \u2014 Lower Parel",
      slug: "cafe02",
      scans: 312,
      active: true,
      waiters: seedWaiters(),
      rooms: [
        { id: "rm_cafe02_qr1", code: "qr1", name: "Table 1", active: true, scans: 12 },
        { id: "rm_cafe02_qr2", code: "qr2", name: "Table 2", active: true, scans: 9 },
      ],
    },
  ];

  const configs: Record<string, RoomsPageConfig> = {};
  for (const location of locations) {
    const reception = configTemplate("reception");
    if (location.id === "cafe02") {
      reception.announcement.text = "Free dessert with every table of four, this month.";
      reception.wifi.on = true;
      reception.wifi.ssid = "BrewGuest-LP";
    }
    configs[`${location.id}:reception`] = reception;

    const rooms = configTemplate("rooms");
    rooms.menu.title = "Table service menu";
    if (location.id === "cafe02") {
      rooms.menu.title = "Order at your table";
      rooms.announcement.text = "Table guests: breakfast is served until 10:30 am.";
    }
    configs[`${location.id}:rooms`] = rooms;
  }

  return {
    locations,
    configs,
    orders: [...seedHistoryOrders(now), ...seedOrders(now)],
    joinRequests: [],
    serviceCalls: [],
    businessType: "cafe",
    savedAt: now.getTime(),
  };
}

function generatedId(prefix: string, now: number): string {
  return `${prefix}_${now}_${Math.floor(Math.random() * 999)}`;
}

/**
 * Migrations from the demo's `ensureShape`: default the top-level collections,
 * give every bill a stable id, a bill id, a first round and participants, and
 * recover the host device.
 */
export function ensureShape(state: RoomsState): RoomsState {
  const next: RoomsState = JSON.parse(JSON.stringify(state)) as RoomsState;
  if (!next.businessType) next.businessType = "cafe";
  if (!Array.isArray(next.orders)) next.orders = [];
  if (!Array.isArray(next.joinRequests)) next.joinRequests = [];
  if (!Array.isArray(next.serviceCalls)) next.serviceCalls = [];
  if (!Array.isArray(next.locations)) next.locations = [];

  next.locations.forEach((location) => {
    if (!Array.isArray(location.waiters)) location.waiters = seedWaiters();
    if (!Array.isArray(location.rooms)) location.rooms = [];
  });

  const stamp = Date.now();
  next.orders.forEach((order) => {
    if (!order || typeof order !== "object") return;
    if (!Array.isArray(order.items)) order.items = [];
    if (!order.id) order.id = generatedId("ord", stamp);
    if (!order.billId) order.billId = order.id;
    if (!order.createdAt) order.createdAt = new Date().toISOString();
    if (!order.updatedAt) order.updatedAt = order.createdAt;
    if (!order.acceptedAt && (order.status === "preparing" || order.status === "served")) {
      order.acceptedAt = order.updatedAt || order.createdAt;
    }
    if (!order.customerName) order.customerName = "Walk-in";
    if (!Array.isArray(order.participants)) order.participants = [];
    order.participants.forEach((participant) => {
      if (!participant.id) participant.id = generatedId("p", stamp);
      if (!participant.role) participant.role = "guest";
      if (!participant.joinedAt) participant.joinedAt = order.createdAt;
    });
    if (!order.hostDeviceId) {
      const host = order.participants.find((participant) => participant.role === "host");
      order.hostDeviceId = host ? host.deviceId : null;
    }
    if (!Array.isArray(order.rounds) || !order.rounds.length) {
      const firstItems = order.items.map((item) => ({ ...item }));
      order.rounds = [
        {
          id: `${order.id}_r1`,
          at: order.createdAt,
          items: firstItems,
          total: orderItemsTotal(firstItems) || Number(order.total) || 0,
          via: order.source || "customer",
        },
      ];
    }
    order.total = orderItemsTotal(order.items) || Number(order.total) || 0;
    if (!order.customerName) order.customerName = "Walk-in";
    if (String(order.customerName).length > NAME_MAX) {
      order.customerName = String(order.customerName).slice(0, NAME_MAX);
    }
  });

  return next;
}

/* Syehere — Rooms QR feature concept demo.
 * Standalone, mock data only. Nothing in this folder is part of the Next.js app.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Icons                                                              */
  /* ------------------------------------------------------------------ */

  const ICONS = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    feedback:
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-3.2-.6L3 21l1.7-4.7A8.3 8.3 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4Z"/>',
    analytics:
      '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    location:
      '<path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
    rooms:
      '<path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17"/><path d="M2 21h20"/><path d="M14 12h.01"/>',
    page:
      '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>',
    loyalty:
      '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9L6.6 19.7l1-6-4.4-4.3 6.1-.9Z"/>',
    billing:
      '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M7 15h3"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M17 20h4v.01"/>',
    wifi: '<path d="M5 12.6a10 10 0 0 1 14 0"/><path d="M8.5 16a5.4 5.4 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
    utensils: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3"/><path d="M7 11v10"/><path d="M17 3c-1.7 1.5-2.5 4-2.5 7H17v11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
    arrowLeft: '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    sparkles:
      '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Z"/>',
    thumbUp:
      '<path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/><path d="M7 10l4.2-7a1.8 1.8 0 0 1 3.2 1.5L13 9h5.7a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.3 21H7"/>',
    thumbDown:
      '<path d="M7 14V3H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1Z"/><path d="m7 14 4.2 7a1.8 1.8 0 0 0 3.2-1.5L13 15h5.7a2 2 0 0 0 2-2.3l-1.4-8A2 2 0 0 0 17.3 3H7"/>',
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    facebook:
      '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5v4h3v7h4v-7h3l1-4h-4V7.5A.5.5 0 0 1 12.5 7H15Z"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>',
    minus: '<path d="M5 12h14"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    receipt:
      '<path d="M5 3v18l2.4-1.6L10 21l2-1.6L14 21l2.4-1.6L19 21V3l-2.4 1.6L14 3l-2 1.6L10 3 7.4 4.6Z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    soundOn:
      '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    soundOff:
      '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
    trash:
      '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    printer:
      '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
    mail:
      '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 7 9 6 9-6"/>',
  };

  function icon(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* Static demo data                                                   */
  /* ------------------------------------------------------------------ */

  const LS_KEY = "syehere.rooms.demo.v2";
  const SOUND_KEY = "syehere.rooms.demo.sound";
  const DEVICE_KEY = "syehere.rooms.demo.device";
  const PAID_BILL_WINDOW_MS = 5 * 60 * 1000;

  const PERIODS = {
    today: { label: "Today", stat: "today", range: "today", days: 1, previousLabel: "yesterday" },
    week: { label: "Week", stat: "this week", range: "last 7 days", days: 7, previousLabel: "previous 7 days" },
    fortnight: { label: "15 days", stat: "last 15 days", range: "last 15 days", days: 15, previousLabel: "previous 15 days" },
    month: { label: "Month", stat: "last 30 days", range: "last 30 days", days: 30, previousLabel: "previous 30 days" },
  };

  const BUSINESS = {
    name: "Brew and Bean",
    initials: "BB",
    tagline: "Enjoying your coffee?",
    googleReviewUrl: "https://g.page/r/brew-and-bean/review",
    theme: { primary: "#213D36", secondary: "#C5DBC8", bg: "#EDF4EE" },
  };

  const MENU = {
    categories: [
      {
        name: "Coffee",
        items: [
          { id: "cold-brew", name: "Cold brew", price: 180, details: "Cold-steeped 12 hours, served over ice", tag: "Popular" },
          { id: "cappuccino", name: "Cappuccino", price: 160, details: "Double shot, silky milk", tag: null },
          { id: "filter-coffee", name: "Filter coffee", price: 120, details: "House blend, bottomless before 11 am", tag: "Table guests" },
        ],
      },
      {
        name: "Bites",
        items: [
          { id: "veg-sandwich", name: "Veg sandwich", price: 140, details: "Grilled bread, cucumber, tomato, cheese, chutney", tag: "Veg" },
          { id: "brownie", name: "Brownie", price: 120, details: "Warm, with a scoop of vanilla", tag: null },
        ],
      },
    ],
  };

  const MENU_ITEMS = {};
  MENU.categories.forEach((category) => {
    category.items.forEach((item) => {
      MENU_ITEMS[item.id] = item;
    });
  });

  const WEEK = [
    ["Monday", "9:00 – 21:00"],
    ["Tuesday", "9:00 – 21:00"],
    ["Wednesday", "9:00 – 21:00"],
    ["Thursday", "9:00 – 21:00"],
    ["Friday", "9:00 – 21:00"],
    ["Saturday", "9:00 – 21:00"],
    ["Sunday", "Closed"],
  ];

  function configTemplate(kind) {
    if (kind === "reception") {
      return {
        announcement: { on: true, text: "Buy 1 get 1 free on cold brew, this week only." },
        thankYou: "Thank you for the feedback — we would love to see you again soon!",
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
      thankYou: "Enjoy your stay — tell us how we can make it better.",
      wifi: { on: true, ssid: "BrewGuest-Rooms", password: "room2026" },
      menu: { on: true, title: "Room service menu" },
      hours: {
        on: true,
        phone: "+919876543210",
        address: "12 Linking Road, Bandra West, Mumbai",
      },
      call: { on: true, phone: "+919876543210" },
      directions: { on: false, value: "" },
      custom: { on: true, label: "Request housekeeping", url: "https://brewandbean.example/housekeeping" },
      socials: { instagram: "https://instagram.com/brewandbean" },
    };
  }

  function seedWaiters() {
    return [
      { id: "w_aarav", name: "Aarav", maxTables: 3, active: true },
      { id: "w_meera", name: "Meera", maxTables: 4, active: true },
      { id: "w_rohit", name: "Rohit", maxTables: 2, active: false },
    ];
  }

  function minutesAgo(minutes) {
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    return new Date(Math.max(now - minutes * 60000, startOfDay + 60000)).toISOString();
  }

  function daysAgoAt(days, hour, minute) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  function seedOrderItem(id, qty) {
    const item = MENU_ITEMS[id];
    return { id, name: item.name, price: item.price, qty };
  }

  function seedOrders() {
    return [
      {
        id: "ord_seed_1038",
        number: 1038,
        locId: "cafe01",
        code: "qr1",
        customerName: "Ananya",
        phone: "",
        guests: 2,
        waiterId: "w_aarav",
        items: [seedOrderItem("cold-brew", 1), seedOrderItem("brownie", 1)],
        total: 300,
        status: "completed",
        createdAt: minutesAgo(190),
        updatedAt: minutesAgo(160),
        source: "seed",
      },
      {
        id: "ord_seed_1039",
        number: 1039,
        locId: "cafe01",
        code: "qr2",
        customerName: "Kabir",
        phone: "",
        guests: 1,
        waiterId: "w_aarav",
        items: [seedOrderItem("cappuccino", 1)],
        total: 160,
        status: "completed",
        createdAt: minutesAgo(125),
        updatedAt: minutesAgo(110),
        source: "seed",
      },
      {
        id: "ord_seed_1040",
        number: 1040,
        locId: "cafe01",
        code: "qr1",
        customerName: "Riya",
        phone: "+919820011223",
        guests: 2,
        waiterId: "w_aarav",
        items: [seedOrderItem("veg-sandwich", 2), seedOrderItem("cold-brew", 1)],
        total: 460,
        status: "preparing",
        acceptedAt: minutesAgo(48),
        createdAt: minutesAgo(55),
        updatedAt: minutesAgo(48),
        source: "seed",
      },
      {
        id: "ord_seed_1041",
        number: 1041,
        locId: "cafe01",
        code: "qr2",
        customerName: "Dev",
        phone: "",
        guests: 2,
        waiterId: "w_aarav",
        items: [seedOrderItem("filter-coffee", 2)],
        total: 240,
        status: "new",
        createdAt: minutesAgo(22),
        updatedAt: minutesAgo(22),
        source: "seed",
      },
      {
        id: "ord_seed_1042",
        number: 1042,
        locId: "cafe01",
        code: "qr3",
        customerName: "Sara",
        phone: "+919930044556",
        guests: 3,
        waiterId: "w_aarav",
        items: [seedOrderItem("cappuccino", 1), seedOrderItem("brownie", 1)],
        total: 280,
        status: "served",
        acceptedAt: minutesAgo(3),
        createdAt: minutesAgo(6),
        updatedAt: minutesAgo(3),
        source: "seed",
      },
    ];
  }

  const HISTORY_NAMES = [
    "Ananya", "Kabir", "Riya", "Dev", "Sara", "Ishaan", "Nisha", "Arjun", "Tara", "Vikram", "Maya", "Rohan",
  ];
  const HISTORY_MENU = [
    ["cold-brew", "brownie"],
    ["cappuccino", "veg-sandwich"],
    ["filter-coffee", "brownie"],
    ["veg-sandwich", "cold-brew"],
    ["cappuccino", "brownie"],
    ["filter-coffee", "veg-sandwich"],
  ];

  // Enough completed bills for the Week / 15 days / Month views to be useful,
  // including the previous 30 days so Month has a real comparison.
  // They are only added once, so an existing demo state keeps its own orders.
  function seedHistoryOrders() {
    const orders = [];
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
        const createdAt = daysAgoAt(day, 11 + index * 4 + (day % 3), (day * 7) % 60);
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

  function seedState() {
    const locations = [
      {
        id: "cafe01",
        name: "Brew and Bean — Bandra",
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
        name: "Brew and Bean — Lower Parel",
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

    const configs = {};
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
      orders: [...seedHistoryOrders(), ...seedOrders()],
      serviceCalls: [],
      businessType: "cafe",
      historySeed: 2,
      savedAt: Date.now(),
    };
  }

  function ensureShape() {
    if (!state || typeof state !== "object") state = seedState();
    if (!state.businessType) state.businessType = "cafe";
    if (!Array.isArray(state.orders)) state.orders = [];
    if (!Array.isArray(state.joinRequests)) state.joinRequests = [];
    if (!Array.isArray(state.serviceCalls)) state.serviceCalls = [];
    // A clean table for the host-approval demo. Existing demo saves get it once.
    const demoLocation = state.locations.find((location) => location.id === "cafe01");
    if (demoLocation && !demoLocation.rooms.some((room) => room.code === "qr4")) {
      demoLocation.rooms.push({ id: "rm_cafe01_qr4", code: "qr4", name: "Table 4", active: true, scans: 0 });
    }
    if (state.historySeed !== 2) {
      const known = new Set(state.orders.map((order) => order.id));
      state.orders.push(...seedHistoryOrders().filter((order) => !known.has(order.id)));
      state.historySeed = true;
      persist();
    }
    state.locations.forEach((location) => {
      if (!Array.isArray(location.waiters)) location.waiters = seedWaiters();
    });
    // Older demo saves only had flat orders. Give every bill a stable id and a
    // first round so repeat orders can be appended without losing history.
    state.orders.forEach((order) => {
      if (!order || typeof order !== "object") return;
      if (!Array.isArray(order.items)) order.items = [];
      if (!order.id) order.id = `ord_${Date.now()}_${Math.floor(Math.random() * 999)}`;
      if (!order.billId) order.billId = order.id;
      if (!order.createdAt) order.createdAt = new Date().toISOString();
      if (!order.updatedAt) order.updatedAt = order.createdAt;
      if (!order.acceptedAt && (order.status === "preparing" || order.status === "served")) {
        order.acceptedAt = order.updatedAt || order.createdAt;
      }
      if (!order.customerName) order.customerName = "Walk-in";
      if (!Array.isArray(order.participants)) order.participants = [];
      order.participants.forEach((participant) => {
        if (!participant.id) participant.id = `p_${Date.now()}_${Math.floor(Math.random() * 999)}`;
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
    });
  }

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */

  let state = loadState() || seedState();
  ensureShape();
  persist();
  let route = parseRoute();
  let draft = null;
  let savedConfig = null;
  let draftKey = null;
  let dirty = false;
  let previewRoomCode = null;
  let publicScreen = "home";
  let modalQr = null;
  let cart = { key: null, items: {} };
  let checkoutDraft = { name: "", phone: "", guests: 2, waiterId: "auto" };
  let lastOrder = null;
  let notifOpen = false;
  let checkoutError = "";
  let orderFilter = "all";
  let analyticsSpot = "all";
  let period = "today";
  let soundOn = readSoundOn();
  let knownOrderIds = new Set(state.orders.map((order) => order.id));
  let knownRoundIds = new Set();
  let lastRound = null;
  let lastOrderAdded = false;
  let punchDraft = null;
  let pollTimer = null;
  let memoryDeviceId = "";
  let joinCodeError = "";
  let joinNameDraft = "";
  let lastScanSignature = "";
  let knownJoinRequestIds = new Set();
  let knownJoinStatuses = {};
  let knownServiceCallIds = new Set((state.serviceCalls || []).map((call) => call.id));
  let knownPaidBillIds = new Set();
  let knownBillSentKeys = new Set();
  let expandedOrderGroups = new Set();
  let alertRingTimer = null;
  let alertRingActive = false;
  let dashboardAlert = null;
  let lastServiceCall = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.locations) || !parsed.configs) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function persist() {
    try {
      state.savedAt = Date.now();
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (error) {
      /* The demo still works in memory if storage is unavailable. */
    }
  }

  function readSoundOn() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch (error) {
      return true;
    }
  }

  function saveSoundOn(value) {
    soundOn = value;
    try {
      localStorage.setItem(SOUND_KEY, value ? "on" : "off");
    } catch (error) {
      /* Sound preference is optional. */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, max) {
    const text = String(value || "").trim();
    return text.length > max ? text.slice(0, max) : text;
  }

  function getPath(object, path) {
    return path.split(".").reduce((current, key) => (current ? current[key] : undefined), object);
  }

  function setPath(object, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    let current = object;
    for (const part of parts) {
      if (!current[part] || typeof current[part] !== "object") current[part] = {};
      current = current[part];
    }
    current[last] = value;
  }

  function getLocation(id) {
    return state.locations.find((location) => location.id === id) || state.locations[0];
  }

  function configKey(locationId, kind) {
    return `${locationId}:${kind}`;
  }

  function getConfig(locationId, kind) {
    return state.configs[configKey(locationId, kind)] || configTemplate(kind);
  }

  function themeStyle() {
    return `--cp-primary:${BUSINESS.theme.primary};--cp-secondary:${BUSINESS.theme.secondary};--cp-bg:${BUSINESS.theme.bg};`;
  }

  function baseUrl() {
    return window.location.origin + window.location.pathname.replace(/index\.html$/, "");
  }

  function pageUrl(location, code) {
    return `${baseUrl()}#/scan/${location.id}/${code}`;
  }

  function totalRooms() {
    return state.locations.reduce((sum, location) => sum + location.rooms.length, 0);
  }

  function totalRoomScans() {
    return state.locations.reduce(
      (sum, location) => sum + location.rooms.reduce((inner, room) => inner + room.scans, 0),
      0,
    );
  }

  function nextRoomCode(location) {
    let index = location.rooms.length + 1;
    let code = `qr${index}`;
    while (location.rooms.some((room) => room.code === code)) {
      index += 1;
      code = `qr${index}`;
    }
    return code;
  }

  function spotWord(plural) {
    const hotel = state.businessType === "hotel";
    return hotel ? (plural ? "Rooms" : "Room") : (plural ? "Tables" : "Table");
  }

  function displaySpotName(room) {
    if (!room) return spotWord(false);
    if (state.businessType === "hotel") return room.name.replace(/^Table\b/, "Room");
    return room.name.replace(/^Room\b/, "Table");
  }

  function money(value) {
    return `\u20b9${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function orderItemsTotal(items) {
    return (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  }

  function todayKey(value) {
    const date = value ? new Date(value) : new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function isTodayOrder(order) {
    return todayKey(order.createdAt) === todayKey();
  }

  function ordersForLocation(locId) {
    return state.orders.filter((order) => order.locId === locId);
  }

  function todayOrders(locId) {
    return ordersForLocation(locId)
      .filter(isTodayOrder)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function periodDef(key) {
    return PERIODS[key] || PERIODS.today;
  }

  function startOfDay(value) {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function periodWindow(key) {
    const def = periodDef(key);
    const end = new Date();
    const start = startOfDay(end);
    start.setDate(start.getDate() - (def.days - 1));
    return { start, end };
  }

  function previousPeriodWindow(key) {
    const def = periodDef(key);
    const current = periodWindow(key);
    const end = new Date(current.start.getTime() - 1);
    const start = startOfDay(end);
    start.setDate(start.getDate() - (def.days - 1));
    return { start, end };
  }

  function orderInWindow(order, range) {
    const time = new Date(order.createdAt).getTime();
    return time >= range.start.getTime() && time <= range.end.getTime();
  }

  function ordersBetween(locId, range) {
    return ordersForLocation(locId)
      .filter((order) => orderInWindow(order, range))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function ordersForPeriod(locId, key) {
    return ordersBetween(locId, periodWindow(key || period));
  }

  function statsForRange(locId, range) {
    const rows = ordersBetween(locId, range).filter((order) => order.status !== "cancelled");
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

  function periodStats(locId, key) {
    return statsForRange(locId, periodWindow(key || period));
  }

  function previousPeriodStats(locId, key) {
    return statsForRange(locId, previousPeriodWindow(key || period));
  }

  function spotMatches(order, spot) {
    if (!spot || spot === "all") return true;
    if (spot === "direct") return !order.code;
    return order.code === spot;
  }

  function deltaLabel(current, previous, previousLabel) {
    if (!previous) return current ? '<span class="delta up">New</span> in this period' : "No activity in this period";
    const change = Math.round(((current - previous) / previous) * 100);
    if (!change) return `Flat vs ${previousLabel}`;
    return `<span class="delta ${change > 0 ? "up" : "down"}">${change > 0 ? "\u2191" : "\u2193"} ${Math.abs(change)}%</span> vs ${previousLabel}`;
  }

  function formatDay(value) {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function periodRangeLabel(key) {
    const def = periodDef(key || period);
    const range = periodWindow(key || period);
    if (def.days === 1) {
      return range.end.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    const sameYear = range.start.getFullYear() === range.end.getFullYear();
    const startText = sameYear
      ? formatDay(range.start)
      : `${formatDay(range.start)} ${range.start.getFullYear()}`;
    return `${startText} \u2013 ${formatDay(range.end)}, ${range.end.getFullYear()}`;
  }

  function formatWhen(value) {
    const date = new Date(value);
    if (todayKey(date) === todayKey()) return formatTime(value);
    return `${formatDay(value)} \u00b7 ${formatTime(value)}`;
  }

  function dailySeries(locId, key) {
    const def = periodDef(key);
    const range = periodWindow(key);
    const rows = ordersForPeriod(locId, key).filter((order) => order.status !== "cancelled");
    const days = [];
    const step = def.days <= 7 ? 1 : def.days <= 15 ? 2 : 5;
    for (let index = 0; index < def.days; index += 1) {
      const date = new Date(range.start);
      date.setDate(range.start.getDate() + index);
      const dayKey = todayKey(date);
      const dayRows = rows.filter((order) => todayKey(order.createdAt) === dayKey);
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

  // A bill is one customer's running tab at one table / room. Extra items are
  // stored as rounds on that same order — never as a second order.
  function orderRounds(order) {
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

  function findOpenBill(locId, code) {
    if (!code) return null;
    return (
      state.orders
        .filter((order) => order.locId === locId && order.code === code && activeStatus(order.status))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0] || null
    );
  }

  function canSeeBill(order, deviceId) {
    if (!order || !deviceId) return false;
    return order.hostDeviceId === deviceId || Boolean(participantFor(order, deviceId));
  }

  function recentPaidBill(locId, code, deviceId) {
    if (!code) return null;
    const now = Date.now();
    return (
      state.orders
        .filter(
          (order) =>
            order &&
            order.locId === locId &&
            order.code === code &&
            order.status === "completed" &&
            order.paidAt &&
            canSeeBill(order, deviceId) &&
            now - new Date(order.paidAt).getTime() < PAID_BILL_WINDOW_MS,
        )
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0] || null
    );
  }

  function paidBillRemaining(order) {
    if (!order || !order.paidAt) return 0;
    return Math.max(0, PAID_BILL_WINDOW_MS - (Date.now() - new Date(order.paidAt).getTime()));
  }

  function billWindowText(ms) {
    const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  /* ------------------------------------------------------------------ */
  /* Table service bells: call a waiter or ask for the bill             */
  /* ------------------------------------------------------------------ */

  function refreshFreshState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const fresh = raw ? JSON.parse(raw) : null;
      if (fresh && Array.isArray(fresh.orders) && (fresh.savedAt || 0) > (state.savedAt || 0)) {
        state = fresh;
        ensureShape();
      }
    } catch (error) {
      /* Keep the in-memory state if storage cannot be read. */
    }
  }

  function activeServiceCalls(locId) {
    return (state.serviceCalls || [])
      .filter((call) => call && call.status === "open" && (!locId || call.locId === locId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function serviceCallsForSpot(locId, code) {
    return activeServiceCalls(locId).filter((call) => call.code === code);
  }

  function serviceCallFor(locId, code, kind) {
    return serviceCallsForSpot(locId, code).find((call) => call.kind === kind) || null;
  }

  function serviceCallSpotName(call) {
    const spot = call ? getSpot(call.locId, call.code) : null;
    return spot ? displaySpotName(spot) : String((call && call.code) || "").toUpperCase();
  }

  function serviceKindLabel(kind) {
    return kind === "bill" ? "asked for the bill" : "called a waiter";
  }

  function serviceKindTitle(kind) {
    return kind === "bill" ? "Bill requested" : "Call waiter";
  }

  function requestService(kind) {
    const context = currentScanContext();
    if (!context.room) return null;
    refreshFreshState();
    const bill = findOpenBill(context.location.id, context.room.code);
    if (!bill) {
      toast(`Place an order first — then you can call a waiter or ask for the bill.`);
      return null;
    }
    const existing = serviceCallFor(context.location.id, context.room.code, kind);
    if (existing) {
      knownServiceCallIds.add(existing.id);
      return existing;
    }
    // One live request per table: asking for the bill replaces a waiter call.
    state.serviceCalls = activeServiceCalls(context.location.id).filter(
      (call) => call.code !== context.room.code,
    );
    const call = {
      id: `call_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      locId: context.location.id,
      code: context.room.code,
      kind,
      status: "open",
      createdAt: new Date().toISOString(),
      orderId: bill.id,
      customerName: bill.customerName,
    };
    state.serviceCalls.push(call);
    persist();
    knownServiceCallIds.add(call.id);
    return call;
  }

  function resolveServiceCall(id) {
    refreshFreshState();
    const call = (state.serviceCalls || []).find((item) => item.id === id);
    if (!call || call.status !== "open") return;
    call.status = "done";
    call.resolvedAt = new Date().toISOString();
    persist();
    render();
    toast(`${serviceCallSpotName(call)} — ${serviceKindTitle(call.kind).toLowerCase()} handled.`);
  }

  function detectServiceCalls() {
    const current = activeServiceCalls();
    const fresh = current.filter((call) => !knownServiceCallIds.has(call.id));
    current.forEach((call) => knownServiceCallIds.add(call.id));
    if (!fresh.length || route.name === "scan") return;
    playBell();
    const latest = fresh[fresh.length - 1];
    toast(`${serviceCallSpotName(latest)} · ${serviceKindTitle(latest.kind)}`);
  }

  function currentDeviceId() {
    if (memoryDeviceId) return memoryDeviceId;
    try {
      let deviceId = sessionStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(DEVICE_KEY, deviceId);
      }
      memoryDeviceId = deviceId;
      return deviceId;
    } catch (error) {
      memoryDeviceId = `dev_mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return memoryDeviceId;
    }
  }

  function participantsOf(order) {
    if (!order) return [];
    if (!Array.isArray(order.participants)) order.participants = [];
    return order.participants;
  }

  function participantFor(order, deviceId) {
    return participantsOf(order).find((participant) => participant.deviceId === deviceId) || null;
  }

  // Seeded bills have no device attached. The first phone that opens one
  // becomes the host; newly created bills set their host explicitly.
  function resolveScanParticipation(order) {
    if (!order) return null;
    const deviceId = currentDeviceId();
    const existing = participantFor(order, deviceId);
    if (existing) return existing;
    const roster = participantsOf(order);
    if (roster.length) {
      const host = roster.find((participant) => participant.role === "host") || roster[0];
      if (!order.hostDeviceId) order.hostDeviceId = host.deviceId;
      return host.deviceId === deviceId ? host : null;
    }
    if (order.hostDeviceId && order.hostDeviceId !== deviceId) return null;
    const participant = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      name: String(order.customerName || "Host").slice(0, 40),
      deviceId,
      role: "host",
      joinedAt: new Date().toISOString(),
    };
    order.hostDeviceId = deviceId;
    order.participants = [participant];
    persist();
    return participant;
  }

  function joinRequestsForOrder(order) {
    if (!order) return [];
    return (state.joinRequests || []).filter((request) => request.orderId === order.id);
  }

  function effectiveJoinStatus(request) {
    if (!request) return null;
    const now = Date.now();
    if (request.status === "pending" && now > new Date(request.expiresAt).getTime()) return "expired";
    if (request.status === "approved" && request.codeExpiresAt && now > new Date(request.codeExpiresAt).getTime()) {
      return "expired";
    }
    return request.status;
  }

  function latestJoinRequestForDevice(order, deviceId) {
    return (
      joinRequestsForOrder(order)
        .filter((request) => request.deviceId === deviceId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
    );
  }

  function makeJoinCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function joinInitials(name) {
    return String(name || "Guest").trim().slice(0, 2).toUpperCase();
  }

  function joinCountdownText(value) {
    const seconds = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function requestJoin(order, name) {
    if (!order || !activeStatus(order.status)) return { error: "This bill is closed." };
    const deviceId = currentDeviceId();
    if (participantFor(order, deviceId)) return { error: "You are already on this bill." };
    const existing = latestJoinRequestForDevice(order, deviceId);
    if (existing && ["pending", "approved"].includes(effectiveJoinStatus(existing))) {
      return { ok: true, request: existing };
    }
    const now = Date.now();
    const request = {
      id: `jr_${now}_${Math.floor(Math.random() * 999)}`,
      orderId: order.id,
      locId: order.locId,
      code: order.code,
      deviceId,
      name: String(name || "").trim().slice(0, 40) || "Guest",
      status: "pending",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 2 * 60 * 1000).toISOString(),
      attempts: 0,
      maxAttempts: 5,
      joinCode: null,
      codeExpiresAt: null,
    };
    state.joinRequests.push(request);
    joinNameDraft = "";
    joinCodeError = "";
    persist();
    render();
    toast(`Request sent to ${order.customerName}. Waiting for approval.`);
    return { ok: true, request };
  }

  function approveJoinRequest(requestId) {
    const request = (state.joinRequests || []).find((item) => item.id === requestId);
    if (!request || effectiveJoinStatus(request) !== "pending") return;
    const now = Date.now();
    request.status = "approved";
    request.approvedAt = new Date(now).toISOString();
    request.joinCode = makeJoinCode();
    request.codeExpiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    request.attempts = 0;
    joinCodeError = "";
    persist();
    render();
    toast(`Approved — read the code to ${request.name}.`);
  }

  function denyJoinRequest(requestId) {
    const request = (state.joinRequests || []).find((item) => item.id === requestId);
    if (!request) return;
    request.status = "denied";
    request.deniedAt = new Date().toISOString();
    request.joinCode = null;
    request.codeExpiresAt = null;
    persist();
    render();
    toast(`Request from ${request.name} declined.`);
  }

  function cancelJoinRequest(order) {
    const request = order ? latestJoinRequestForDevice(order, currentDeviceId()) : null;
    if (!request) return;
    if (["joined", "denied", "cancelled"].includes(request.status)) return;
    request.status = "cancelled";
    request.joinCode = null;
    request.codeExpiresAt = null;
    joinCodeError = "";
    persist();
    render();
    toast("Join request cancelled.");
  }

  function regenerateJoinCode(requestId) {
    const request = (state.joinRequests || []).find((item) => item.id === requestId);
    if (!request || ["joined", "denied", "cancelled"].includes(request.status)) return;
    const now = Date.now();
    request.status = "approved";
    request.joinCode = makeJoinCode();
    request.codeExpiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    request.attempts = 0;
    joinCodeError = "";
    persist();
    render();
    toast(`New code for ${request.name}.`);
  }

  function verifyJoinCode(order) {
    if (!order) return;
    const request = latestJoinRequestForDevice(order, currentDeviceId());
    const input = document.getElementById("join-code");
    const entered = input ? input.value.replace(/\D/g, "").slice(0, 6) : "";
    const status = effectiveJoinStatus(request);
    if (!request || status !== "approved") {
      joinCodeError = request && request.status === "locked"
        ? "Too many wrong attempts. Ask the host for a new code."
        : "This join request is no longer active.";
      render();
      return;
    }
    if (entered.length !== 6) {
      joinCodeError = "Enter the 6-digit code shown on the host's phone.";
      render();
      return;
    }
    if (entered !== String(request.joinCode || "")) {
      request.attempts = Number(request.attempts || 0) + 1;
      if (request.attempts >= Number(request.maxAttempts || 5)) request.status = "locked";
      joinCodeError = request.status === "locked"
        ? "Too many wrong attempts. Ask the host to send a new code."
        : `That code doesn't match. ${Math.max(0, Number(request.maxAttempts || 5) - request.attempts)} attempt${Number(request.maxAttempts || 5) - request.attempts === 1 ? "" : "s"} left.`;
      persist();
      render();
      return;
    }
    request.status = "joined";
    request.joinedAt = new Date().toISOString();
    if (!participantFor(order, request.deviceId)) {
      participantsOf(order).push({
        id: `p_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        name: request.name,
        deviceId: request.deviceId,
        role: "guest",
        joinedAt: request.joinedAt,
        requestId: request.id,
      });
    }
    joinCodeError = "";
    publicScreen = "home";
    persist();
    render();
    toast(`You joined ${order.customerName}'s bill #${order.number}.`);
  }

  function scanSignature() {
    const context = currentScanContext();
    if (route.name !== "scan" || !context.room) return "scan-none";
    const openBill = findOpenBill(context.location.id, context.room.code);
    const deviceId = currentDeviceId();
    if (!openBill) {
      const paidBill = recentPaidBill(context.location.id, context.room.code, deviceId);
      return paidBill ? `paid:${paidBill.id}:${paidBill.paidAt}:${paidBill.total}` : `no-bill:${context.room.code}`;
    }
    const mine = latestJoinRequestForDevice(openBill, deviceId);
    const requests = joinRequestsForOrder(openBill)
      .map((request) => `${request.id}:${effectiveJoinStatus(request)}:${request.attempts}:${request.codeExpiresAt || ""}`)
      .join(",");
    return [
      openBill.id,
      openBill.status,
      openBill.acceptedAt || "",
      openBill.updatedAt,
      openBill.billSentAt || "",
      orderRounds(openBill).length,
      participantsOf(openBill).length,
      openBill.hostDeviceId === deviceId ? "host" : participantFor(openBill, deviceId)?.role || "guest",
      mine ? `${mine.id}:${effectiveJoinStatus(mine)}:${mine.attempts}:${mine.codeExpiresAt || ""}` : "no-request",
      requests,
      serviceCallsForSpot(context.location.id, context.room.code)
        .map((call) => `${call.id}:${call.kind}`)
        .join(","),
    ].join("|");
  }

  function detectJoinEvents() {
    if (route.name !== "scan") return;
    const context = currentScanContext();
    const openBill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
    if (!openBill) return;
    const deviceId = currentDeviceId();
    if (openBill.hostDeviceId === deviceId) {
      joinRequestsForOrder(openBill).forEach((request) => {
        if (effectiveJoinStatus(request) === "pending" && !knownJoinRequestIds.has(request.id)) {
          knownJoinRequestIds.add(request.id);
          playBell();
          toast(`${request.name} wants to join ${displaySpotName(context.room)}.`);
        }
      });
    }
    const mine = latestJoinRequestForDevice(openBill, deviceId);
    if (!mine) return;
    const status = effectiveJoinStatus(mine);
    const previous = knownJoinStatuses[mine.id];
    if (previous && previous !== status) {
      if (status === "approved") toast("Approved — enter the 6-digit code shown on the host's phone.");
      else if (status === "denied") toast("The host declined this join request.");
      else if (status === "expired") toast("That join code expired — ask the host for a new one.");
      else if (status === "locked") toast("Too many wrong codes — ask the host for a new one.");
    }
    knownJoinStatuses[mine.id] = status;
  }

  function detectBillSent() {
    if (route.name !== "scan") return;
    const context = currentScanContext();
    if (!context.room) return;
    const bill = findOpenBill(context.location.id, context.room.code);
    if (!bill || !bill.billSentAt) return;
    const key = `${bill.id}:${bill.billSentAt}`;
    if (knownBillSentKeys.has(key)) return;
    knownBillSentKeys.add(key);
    playBell();
    toast("Your bill is ready — pay at the counter. Download unlocks after payment.");
    if (["home", "service-sent", "order-done"].indexOf(publicScreen) !== -1) {
      publicScreen = "bill";
      lastScanSignature = "";
    }
  }

  function detectPaidBill() {
    if (route.name !== "scan") return;
    const context = currentScanContext();
    if (!context.room) return;
    const paid = recentPaidBill(context.location.id, context.room.code, currentDeviceId());
    if (!paid || knownPaidBillIds.has(paid.id)) return;
    knownPaidBillIds.add(paid.id);
    playBell();
    toast("Payment received — thanks! Your bill is ready to download.");
    if (["home", "order-done", "service-sent"].indexOf(publicScreen) !== -1) {
      publicScreen = "bill";
    }
  }

  function updateJoinCountdowns() {
    document.querySelectorAll("[data-join-expires]").forEach((element) => {
      const expires = new Date(element.dataset.joinExpires).getTime();
      const seconds = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
      const prefix = element.dataset.joinPrefix || "Expires in ";
      const expired = element.dataset.joinExpired || "Expired";
      element.textContent = seconds > 0
        ? `${prefix}${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
        : expired;
    });
  }

  function updateBillCountdowns() {
    document.querySelectorAll("[data-bill-expires]").forEach((element) => {
      const expires = new Date(element.dataset.billExpires).getTime();
      const seconds = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
      element.textContent = seconds > 0
        ? `Available for ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
        : "Bill window closed";
      if (seconds <= 0 && route.name === "scan" && publicScreen === "bill") {
        publicScreen = "chooser";
        render();
      }
    });
  }

  function rememberRoundIds() {
    knownRoundIds = new Set();
    state.orders.forEach((order) => {
      orderRounds(order).forEach((round) => knownRoundIds.add(round.id));
    });
  }

  function sourceLabel(order) {
    if (!order.code) return "Direct punch";
    if (order.source === "punch") return "Punched by staff";
    if (orderRounds(order).length > 1) return "Repeat order";
    return "QR order";
  }

  function countNewOrders(locId) {
    return state.orders.filter((order) => order.status === "new" && (!locId || order.locId === locId)).length;
  }

  function newOrders() {
    return state.orders
      .filter((order) => order.status === "new")
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  function getSpot(locId, code) {
    const location = state.locations.find((item) => item.id === locId);
    return location ? location.rooms.find((room) => room.code === code) || null : null;
  }

  function orderSpotName(order) {
    if (!order.code) return "Direct punch";
    const spot = getSpot(order.locId, order.code);
    return spot ? displaySpotName(spot) : String(order.code || "").toUpperCase();
  }

  function orderLocation(order) {
    return state.locations.find((item) => item.id === order.locId) || null;
  }

  function activeStatus(status) {
    return status === "new" || status === "preparing" || status === "served";
  }

  // Wi-Fi is a guest perk, not a public link. It is limited to café,
  // restaurant and hotel pages and unlocks only after staff accept the order.
  function supportsOrderWifi() {
    return ["cafe", "restaurant", "hotel"].indexOf(state.businessType) !== -1;
  }

  function orderAcceptedForWifi(order) {
    if (!order) return false;
    return Boolean(order.acceptedAt) || order.status === "preparing" || order.status === "served";
  }

  function wifiUnlockedForOrder(order, config) {
    if (!order || !config || !config.wifi || !config.wifi.on) return false;
    if (!supportsOrderWifi() || !order.code) return false;
    return activeStatus(order.status) && orderAcceptedForWifi(order);
  }

  function waiterById(locId, waiterId) {
    const location = state.locations.find((item) => item.id === locId);
    return location ? (location.waiters || []).find((waiter) => waiter.id === waiterId) || null : null;
  }

  function waiterLoad(locId, waiterId) {
    const codes = new Set();
    state.orders.forEach((order) => {
      if (
        order.locId === locId &&
        order.waiterId === waiterId &&
        order.code &&
        activeStatus(order.status) &&
        isTodayOrder(order)
      ) {
        codes.add(order.code);
      }
    });
    return codes.size;
  }

  function availableWaiters(locId) {
    const location = state.locations.find((item) => item.id === locId);
    if (!location) return [];
    return (location.waiters || []).filter(
      (waiter) => waiter.active && waiterLoad(locId, waiter.id) < waiter.maxTables,
    );
  }

  function waiterName(locId, waiterId) {
    const waiter = waiterById(locId, waiterId);
    return waiter ? waiter.name : "Auto-assign pending";
  }

  function nextOrderNumber() {
    return state.orders.reduce((max, order) => Math.max(max, Number(order.number) || 0), 1040) + 1;
  }

  function openSpotCount(locId) {
    const codes = new Set(
      todayOrders(locId)
        .filter((order) => order.code && activeStatus(order.status))
        .map((order) => order.code),
    );
    return codes.size;
  }

  function todaysEarnings(locId) {
    return todayOrders(locId)
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  function todaysGuests(locId) {
    return todayOrders(locId)
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.guests || 0), 0);
  }

  function statusLabel(status) {
    return (
      { new: "New", preparing: "Preparing", served: "Served", completed: "Completed", cancelled: "Cancelled" }[
        status
      ] || status
    );
  }

  function scanCartKey() {
    if (route.name !== "scan") return null;
    return `${route.locId}/${route.code}`;
  }

  function ensureCart() {
    const key = scanCartKey();
    if (cart.key !== key) cart = { key, items: {} };
  }

  function cartCount() {
    return Object.values(cart.items).reduce((sum, qty) => sum + Number(qty || 0), 0);
  }

  function cartLines() {
    return Object.keys(cart.items)
      .filter((id) => cart.items[id] > 0 && MENU_ITEMS[id])
      .map((id) => ({ ...MENU_ITEMS[id], qty: cart.items[id] }));
  }

  function cartTotal() {
    return cartLines().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function changeCartItem(id, delta) {
    ensureCart();
    if (!MENU_ITEMS[id]) return;
    const next = Math.max(0, Math.min(20, (cart.items[id] || 0) + delta));
    if (next === 0) delete cart.items[id];
    else cart.items[id] = next;
  }

  function customerSpotName() {
    const context = currentScanContext();
    if (context.room) return displaySpotName(context.room);
    return "Reception";
  }

  function mergeItemLines(target, lines) {
    lines.forEach((line) => {
      const existing = target.find((item) => item.id === line.id);
      if (existing) existing.qty = Number(existing.qty || 0) + Number(line.qty || 0);
      else target.push({ ...line });
    });
  }

  function placeOrder() {
    ensureCart();
    const lines = cartLines();
    if (!lines.length) {
      checkoutError = "Your cart is empty. Add something from the menu.";
      return;
    }
    let fresh = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      fresh = raw ? JSON.parse(raw) : null;
    } catch (error) {
      fresh = null;
    }
    if (fresh && (fresh.savedAt || 0) > (state.savedAt || 0)) {
      state = fresh;
      ensureShape();
    }
    const location = state.locations.find((item) => item.id === route.locId);
    const room = location ? location.rooms.find((item) => item.code === route.code) : null;
    if (!location || !room) {
      checkoutError = "This QR is no longer available. Ask a member of staff for help.";
      return;
    }

    // If somebody at this table still has an open bill, this order is another
    // round on that bill. Name, phone and waiter are already on it.
    const openBill = findOpenBill(location.id, room.code);
    const deviceId = currentDeviceId();
    let participant = openBill ? participantFor(openBill, deviceId) : null;
    if (openBill && !participant && !openBill.hostDeviceId) {
      participant = resolveScanParticipation(openBill);
    }
    if (openBill && !participant) {
      checkoutError = "Ask the table host to approve your phone before adding to this bill.";
      return;
    }
    let waiter = null;
    if (!openBill) {
      if (!checkoutDraft.name.trim()) {
        checkoutError = "Please add your name so the waiter knows who ordered.";
        return;
      }
      const free = availableWaiters(location.id);
      if (checkoutDraft.waiterId && checkoutDraft.waiterId !== "auto") {
        waiter = free.find((item) => item.id === checkoutDraft.waiterId) || null;
        if (!waiter) {
          checkoutError = "That waiter just took another table. Pick someone else or choose Any available.";
          return;
        }
      } else {
        waiter = free[0] || null;
      }
    }

    checkoutError = "";
    const now = new Date().toISOString();
    const roundItems = lines.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));
    const roundTotal = orderItemsTotal(roundItems);

    if (openBill) {
      mergeItemLines(openBill.items, roundItems);
      openBill.total = orderItemsTotal(openBill.items);
      openBill.status = "new";
      openBill.updatedAt = now;
      const round = {
        id: `round_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        at: now,
        items: roundItems,
        total: roundTotal,
        via: "reorder",
        by: participant ? participant.name : null,
        participantId: participant ? participant.id : null,
      };
      openBill.rounds = orderRounds(openBill).concat([round]);
      persist();
      knownRoundIds.add(round.id);
      knownOrderIds.add(openBill.id);
      lastOrder = openBill;
      lastRound = round;
      lastOrderAdded = true;
    } else {
      const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 999)}`;
      const hostName = checkoutDraft.name.trim().slice(0, 40);
      const round = {
        id: `round_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        at: now,
        items: roundItems,
        total: roundTotal,
        via: "customer",
        by: hostName,
      };
      const order = {
        id: orderId,
        number: nextOrderNumber(),
        locId: location.id,
        code: room.code,
        billId: orderId,
        customerName: hostName,
        phone: checkoutDraft.phone.trim().slice(0, 20),
        guests: Math.max(1, Math.min(12, Number(checkoutDraft.guests) || 1)),
        waiterId: waiter ? waiter.id : null,
        hostDeviceId: deviceId,
        participants: [
          {
            id: `p_${Date.now()}_${Math.floor(Math.random() * 999)}`,
            name: hostName,
            deviceId,
            role: "host",
            joinedAt: now,
          },
        ],
        items: roundItems,
        total: roundTotal,
        status: "new",
        createdAt: now,
        updatedAt: now,
        source: "customer",
        rounds: [round],
      };
      state.orders.push(order);
      persist();
      knownRoundIds.add(round.id);
      knownOrderIds.add(order.id);
      lastOrder = order;
      lastRound = round;
      lastOrderAdded = false;
    }

    publicScreen = "order-done";
    cart = { key: `${location.id}/${room.code}`, items: {} };
    checkoutDraft = { name: "", phone: "", guests: 2, waiterId: "auto" };
  }

  let audioContext = null;

  function playBell() {
    if (!soundOn) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioContext = audioContext || new AudioCtor();
      if (audioContext.state === "suspended") audioContext.resume();
      const start = audioContext.currentTime + 0.02;
      [880, 1174.66, 1567.98].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = index === 0 ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        const at = start + index * 0.16;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.22 : 0.12, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.65);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.7);
      });
    } catch (error) {
      /* Browsers can block audio until the owner interacts with the page. */
    }
  }

  function stopAlertRing() {
    alertRingActive = false;
    if (alertRingTimer) {
      window.clearTimeout(alertRingTimer);
      alertRingTimer = null;
    }
  }

  // New orders ring immediately, then every two seconds for ten seconds.
  // Five rings are scheduled (0, 2, 4, 6, 8 seconds), then the timer stops.
  function startAlertRing() {
    stopAlertRing();
    if (!soundOn) return;
    alertRingActive = true;
    const startedAt = Date.now();
    const ring = () => {
      if (!alertRingActive) return;
      if (Date.now() - startedAt >= 10000) {
        stopAlertRing();
        return;
      }
      playBell();
      alertRingTimer = window.setTimeout(ring, 2000);
    };
    ring();
  }

  function showOrderAlert(order, extra, round) {
    if (!order || route.name === "scan") return;
    dashboardAlert = {
      orderId: order.id,
      kind: extra ? "round" : "order",
      roundId: round ? round.id : null,
      at: (round && round.at) || order.createdAt,
    };
    renderLiveAlert();
  }

  function renderLiveAlert() {
    const root = document.getElementById("live-alert-host");
    if (!root) return;
    if (!dashboardAlert || route.name === "scan") {
      stopAlertRing();
      root.innerHTML = "";
      return;
    }
    const order = state.orders.find((item) => item.id === dashboardAlert.orderId);
    if (!order) {
      dashboardAlert = null;
      stopAlertRing();
      root.innerHTML = "";
      return;
    }
    const isRound = dashboardAlert.kind === "round";
    if (!activeStatus(order.status) || (!isRound && order.status !== "new")) {
      dashboardAlert = null;
      stopAlertRing();
      root.innerHTML = "";
      return;
    }
    const round = dashboardAlert.roundId
      ? orderRounds(order).find((item) => item.id === dashboardAlert.roundId)
      : null;
    const lines = (round ? round.items : order.items) || [];
    const waiting = state.orders.filter(
      (item) => item.status === "new" && item.locId === order.locId,
    ).length;
    root.innerHTML = `<aside class="live-alert" role="alert" aria-live="assertive" aria-label="New order alert">
        <div class="live-alert-head">
          <span class="live-alert-icon">${icon("bell", 18)}</span>
          <div class="live-alert-title">
            <strong>${isRound ? "New round" : "New order"} · ${esc(orderSpotName(order))}</strong>
            <span>${esc(order.customerName)} · #${order.number} · ${formatTime(dashboardAlert.at)}</span>
          </div>
          <button type="button" class="live-alert-close" data-action="dismiss-live-alert" aria-label="Dismiss alert">${icon("x", 15)}</button>
        </div>
        <div class="live-alert-items">${lines.map((item) => `<span><strong>${item.qty}×</strong> ${esc(item.name)}</span>`).join("")}</div>
        <div class="live-alert-foot"><strong>${money(round ? round.total : order.total)}</strong><span>${isRound ? `Added to ${esc(order.customerName)}'s bill` : waiting > 1 ? `${waiting} new orders waiting` : "Waiting to be accepted"}</span></div>
        <div class="live-alert-actions">
          <button type="button" class="live-alert-open" data-action="open-live-alert" data-id="${order.id}">View ${spotWord(false).toLowerCase()}</button>
          <button type="button" class="live-alert-dismiss" data-action="dismiss-live-alert">Dismiss</button>
        </div>
      </aside>`;
  }

  function updateDocumentTitle() {
    const waiting = countNewOrders() + activeServiceCalls().length;
    document.title = waiting
      ? `(${waiting}) Live table request · Syehere`
      : "Syehere — Tables, orders & QR pages";
  }

  function detectIncomingOrders() {
    const fresh = [];
    state.orders.forEach((order) => {
      orderRounds(order).forEach((round) => {
        if (!knownRoundIds.has(round.id)) {
          knownRoundIds.add(round.id);
          fresh.push({ order, round });
        }
      });
      knownOrderIds.add(order.id);
    });
    if (!fresh.length) return;
    fresh.sort((a, b) => new Date(a.round.at) - new Date(b.round.at));
    const latest = fresh[fresh.length - 1];
    if (route.name === "scan") return;
    startAlertRing();
    const extra = orderRounds(latest.order).length > 1;
    showOrderAlert(latest.order, extra, latest.round);
    toast(
      extra
        ? `Extra order · ${orderSpotName(latest.order)} · ${money(latest.round.total)} added to ${latest.order.customerName}'s bill`
        : `New order · ${orderSpotName(latest.order)} · ${money(latest.round.total)} from ${latest.order.customerName}`,
    );
  }

  function refreshFromStorage() {
    let fresh = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      fresh = raw ? JSON.parse(raw) : null;
    } catch (error) {
      return false;
    }
    if (!fresh || !Array.isArray(fresh.orders)) return false;
    if ((fresh.savedAt || 0) <= (state.savedAt || 0)) return false;
    state = fresh;
    ensureShape();
    return true;
  }

  function handleExternalState() {
    if (!refreshFromStorage()) return;
    detectIncomingOrders();
    detectServiceCalls();
    detectJoinEvents();
    detectBillSent();
    detectPaidBill();
    updateDocumentTitle();
    if (route.name === "scan") {
      const signature = scanSignature();
      if (signature !== lastScanSignature) {
        lastScanSignature = signature;
        render();
      }
      return;
    }
    if (route.name === "editor" && dirty) return;
    if (document.querySelector("#modal-root .modal")) return;
    render();
  }

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadText(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1500);
  }

  function downloadBlob(filename, blob) {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1500);
  }

  function pdfSafe(value) {
    return String(value == null ? "" : value)
      .replace(/\u20b9/g, "Rs. ")
      .replace(/[·•]/g, "-")
      .replace(/[—–]/g, "-")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E]/g, "?");
  }

  function pdfEscape(value) {
    return pdfSafe(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function pdfMoney(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function billPdfBlob(order) {
    const rounds = orderRounds(order);
    const payment = order.payment || null;
    const commands = [];
    const text = (value, size, bold, x, y) => {
      const font = bold ? "F2" : "F1";
      commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`);
    };
    const rule = (y) => commands.push(`0.8 w 40 ${y} m 555 ${y} l S`);
    let y = 800;

    text(BUSINESS.name, 20, true, 40, y);
    text("12 Linking Road, Bandra West, Mumbai", 9, false, 40, y - 16);
    text("GSTIN 27ABCDE1234F1Z5", 9, false, 40, y - 28);
    text("BILL", 16, true, 430, y);
    text(`#${order.number}`, 10, false, 430, y - 16);
    text(formatTime(order.createdAt), 9, false, 430, y - 28);
    rule(y - 38);

    y -= 58;
    text(orderSpotName(order), 11, true, 40, y);
    text(`${order.customerName}${order.phone ? ` | ${order.phone}` : ""}`, 9, false, 40, y - 14);
    text(`${waiterName(order.locId, order.waiterId)} | ${order.guests} guest${order.guests === 1 ? "" : "s"}`, 9, false, 40, y - 26);
    text("PAID", 11, true, 480, y);

    y -= 46;
    rounds.forEach((round, index) => {
      text(`Round ${index + 1} | ${formatTime(round.at)}${round.by ? ` | ${round.by}` : ""}`, 9, true, 40, y);
      y -= 14;
      round.items.forEach((item) => {
        text(item.name, 9, false, 40, y);
        text(String(item.qty), 9, false, 470, y);
        text(pdfMoney(item.price * item.qty), 9, false, 505, y);
        y -= 12;
      });
      y -= 6;
    });

    rule(y);
    y -= 20;
    text("Total (taxes included)", 11, true, 40, y);
    text(pdfMoney(order.total), 14, true, 470, y - 1);

    y -= 30;
    commands.push("0.043 0.478 0.333 rg");
    commands.push(`40 ${y - 4} 515 22 re f`);
    commands.push("1 1 1 rg");
    text(`PAID ${pdfMoney(payment ? payment.amount : order.total)}${payment && payment.mode ? ` via ${payment.mode}` : ""}`, 10, true, 46, y + 3);
    commands.push("0 0 0 rg");

    y -= 34;
    text("Thank you for dining with us.", 9, false, 40, y);
    text("This is a computer-generated bill.", 8, false, 40, y - 12);

    const content = commands.join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= objects.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }

  function downloadBill(order) {
    if (!order || order.status !== "completed") {
      toast("The bill is not paid yet.");
      return;
    }
    downloadBlob(`syehere-bill-${order.number}.pdf`, billPdfBlob(order));
    toast("PDF bill downloaded — taking you to the review.");
    window.setTimeout(function () {
      if (route.name === "scan" && publicScreen === "bill") {
        publicScreen = "chooser";
        render();
      }
    }, 1200);
  }

  function downloadReport(locId, code) {
    const location = getLocation(locId);
    const direct = code === "direct";
    const rows = ordersForPeriod(location.id, period).filter(
      (order) => order.status !== "cancelled" && spotMatches(order, code),
    );
    const spot = code && !direct ? getSpot(location.id, code) : null;
    const label = direct ? "Direct punch" : spot ? displaySpotName(spot) : `All ${spotWord(true).toLowerCase()}`;
    const header = [
      "Bill",
      "Placed at",
      "Type",
      "Table / room",
      "QR code",
      "Customer",
      "Phone",
      "Guests",
      "Waiter",
      "Rounds",
      "Items",
      "Total",
      "Status",
      "Payment",
    ];
    const lines = [header, ...rows.map((order) => [
      order.number,
      new Date(order.createdAt).toLocaleString("en-IN"),
      sourceLabel(order),
      orderSpotName(order),
      order.code ? order.code.toUpperCase() : "\u2014",
      order.customerName,
      order.phone || "",
      order.guests,
      waiterName(order.locId, order.waiterId),
      orderRounds(order).length,
      order.items.map((item) => `${item.qty} x ${item.name}`).join(" | "),
      order.total,
      statusLabel(order.status),
      order.payment ? `${order.payment.mode} ${order.payment.amount}` : order.status === "completed" ? "Paid" : "Unpaid",
    ])].map((row) => row.map(csvCell).join(","));
    const filename = `syehere-${location.slug}-${direct ? "direct" : spot ? spot.code : "all"}-${period}-${todayKey()}.csv`;
    downloadText(filename, `\ufeff${lines.join("\r\n")}`, "text/csv;charset=utf-8");
    toast(`Report downloaded — ${rows.length} bill${rows.length === 1 ? "" : "s"} for ${label} · ${periodRangeLabel(period)}.`);
  }

  function currentScanContext() {
    const location = getLocation(route.locId);
    const isReception = route.code === "reception";
    const room = isReception ? null : location.rooms.find((item) => item.code === route.code) || null;
    const kind = isReception ? "reception" : "rooms";
    return {
      location,
      isReception,
      room,
      kind,
      config: getConfig(location.id, kind),
    };
  }

  /* ------------------------------------------------------------------ */
  /* QR codes                                                           */
  /* ------------------------------------------------------------------ */

  function qrSvg(url) {
    try {
      if (typeof qrcode !== "function") throw new Error("qr library missing");
      const code = qrcode(0, "M");
      code.addData(url);
      code.make();
      const count = code.getModuleCount();
      let path = "";
      for (let row = 0; row < count; row += 1) {
        for (let column = 0; column < count; column += 1) {
          if (code.isDark(row, column)) path += `M${column} ${row}h1v1h-1z`;
        }
      }
      const size = count + 4;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${size} ${size}" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${size}" height="${size}" fill="#ffffff"/><path d="${path}" fill="#111827"/></svg>`;
    } catch (error) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="QR preview"><rect width="100" height="100" fill="#ffffff"/><text x="50" y="52" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#6b7280">QR preview</text></svg>`;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Routing                                                            */
  /* ------------------------------------------------------------------ */

  function parseRoute() {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts[0] === "rooms") {
      return { name: "rooms", locId: parts[1] || "cafe01" };
    }
    if (parts[0] === "customer-page") {
      return {
        name: "editor",
        locId: parts[1] || "cafe01",
        kind: parts[2] === "reception" ? "reception" : "rooms",
      };
    }
    if (parts[0] === "scan") {
      return {
        name: "scan",
        locId: parts[1] || "cafe01",
        code: parts[2] || "reception",
      };
    }
    if (parts[0] === "dashboard") {
      return { name: "dashboard", locId: parts[1] || "cafe01" };
    }
    if (parts[0] === "orders") {
      return { name: "orders", locId: parts[1] || "cafe01" };
    }
    if (parts[0] === "analytics") {
      return { name: "analytics", locId: parts[1] || "cafe01" };
    }
    if (parts[0] === "locations") {
      return {
        name: "locations",
        locId: parts[1] || "cafe01",
        kind: parts[2] === "reception" ? "reception" : "rooms",
      };
    }
    return { name: "locations", locId: "cafe01", kind: "rooms" };
  }

  function navigate(hash) {
    if (route.name === "editor" && dirty && !window.confirm("Discard unsaved changes?")) return;
    if (window.location.hash === hash) {
      route = parseRoute();
      render();
      return;
    }
    window.location.hash = hash;
  }

  /* ------------------------------------------------------------------ */
  /* Shell                                                              */
  /* ------------------------------------------------------------------ */

  function navLinks() {
    const locationId = route.locId || "cafe01";
    const waiting = countNewOrders();
    return [
      {
        group: "Menu",
        items: [
          { label: "Dashboard", icon: "dashboard", href: `#/dashboard/${locationId}`, key: "dashboard" },
          { label: "Feedback", icon: "feedback", muted: true },
          {
            label: "Analytics",
            icon: "analytics",
            href: `#/analytics/${locationId}`,
            key: "analytics",
          },
          {
            label: "Locations",
            icon: "location",
            href: `#/locations/${locationId}/rooms`,
            key: "locations",
          },
          {
            label: "Orders",
            icon: "receipt",
            href: `#/orders/${locationId}`,
            key: "orders",
            badge: waiting ? String(waiting) : "",
            alert: waiting > 0,
          },
          {
            label: spotWord(true),
            icon: "rooms",
            href: `#/rooms/${locationId}`,
            key: "rooms",
            badge: "New",
          },
          {
            label: "Customer page",
            icon: "page",
            href: `#/customer-page/${locationId}/rooms`,
            key: "editor",
          },
          { label: "Loyalty", icon: "loyalty", muted: true },
        ],
      },
      {
        group: "General",
        items: [
          { label: "Billing", icon: "billing", muted: true },
          { label: "Settings", icon: "settings", muted: true },
        ],
      },
    ];
  }

  function renderSidebar(active) {
    const groups = navLinks()
      .map((group) => {
        const items = group.items
          .map((item) => {
            if (item.muted) {
              return `<button type="button" class="nav-item muted" data-action="not-in-demo" data-label="${esc(item.label)}">${icon(item.icon)}<span>${esc(item.label)}</span></button>`;
            }
            const isActive = active === item.key;
            return `<a class="nav-item ${isActive ? "active" : ""}" href="${item.href}" data-nav="${item.href}" ${isActive ? 'aria-current="page"' : ""}>${icon(item.icon)}<span>${esc(item.label)}</span>${item.badge ? `<span class="nav-badge ${item.alert ? "alert" : ""}">${esc(item.badge)}</span>` : ""}</a>`;
          })
          .join("");
        return `<div class="nav-group-label">${esc(group.group)}</div>${items}`;
      })
      .join("");

    return `<aside class="sidebar" aria-label="Dashboard">
      <a class="logo-box" href="#/dashboard" data-nav="#/dashboard" aria-label="Syehere dashboard home">
        <img class="logo-horizontal" src="assets/logo-horizontal.svg" alt="Syehere" />
        <img class="logo-icon" src="assets/logo-icon.svg" alt="Syehere" />
      </a>
      <nav class="nav-scroll" aria-label="Dashboard navigation">${groups}</nav>
      <div class="sidebar-foot">
        <div class="upgrade-card">
          <span>${spotWord(true)} QR + ordering live</span>
          <strong>One page, every ${spotWord(false).toLowerCase()}</strong>
          <a href="#/orders/cafe01" data-nav="#/orders/cafe01">Open live orders</a>
        </div>
      </div>
    </aside>`;
  }

  function renderServiceNotifRow(call) {
    const order = call.orderId ? state.orders.find((item) => item.id === call.orderId) : null;
    const canSendBill =
      call.kind === "bill" && order && activeStatus(order.status) && !order.billSentAt;
    return `<div class="notif-row notif-call">
        <span class="notif-call-icon ${call.kind}">${icon(call.kind === "bill" ? "receipt" : "bell", 15)}</span>
        <a class="notif-body" href="#/rooms/${call.locId}" data-nav="#/rooms/${call.locId}">
          <strong>${esc(serviceCallSpotName(call))} · ${serviceKindTitle(call.kind)}</strong>
          <span>${esc(call.customerName)} · ${formatTime(call.createdAt)} · open ${spotWord(true).toLowerCase()}</span>
        </a>
        ${
          canSendBill
            ? `<button type="button" class="notif-done notif-send" data-action="send-bill-phone" data-id="${order.id}">Send bill</button>`
            : `<button type="button" class="notif-done" data-action="resolve-service" data-id="${call.id}">Done</button>`
        }
      </div>`;
  }

  function renderTopbar() {
    const calls = activeServiceCalls();
    const waiting = countNewOrders();
    const requests = waiting + calls.length;
    const orders = newOrders();
    const ordersHref = `#/orders/${route.locId || "cafe01"}`;
    return `<header class="topbar">
      <button type="button" class="menu-btn" data-action="open-sidebar" aria-label="Open menu">${icon("menu", 18)}</button>
      <div class="search">
        ${icon("search", 16)}
        <input type="search" placeholder="Search orders, ${spotWord(true).toLowerCase()}…" aria-label="Search" />
      </div>
      <div class="topbar-right">
        <div class="notif-wrap">
          <button type="button" class="icon-btn ${requests ? "has-alert" : ""}" data-action="toggle-notifications" aria-label="Live table requests" aria-expanded="${notifOpen}">
            ${icon("bell", 18)}
            ${requests ? `<span class="notif-badge">${requests}</span>` : ""}
          </button>
          ${
            notifOpen
              ? `<div class="notif-panel" role="dialog" aria-label="Live table requests">
                  <div class="notif-head"><strong>Live requests</strong><span class="badge blue">${requests}</span></div>
                  ${calls.length ? `<p class="notif-section">Table calls</p>${calls.slice(0, 3).map(renderServiceNotifRow).join("")}` : ""}
                  <p class="notif-section">New orders</p>
                  ${
                    orders.length
                      ? orders
                          .slice(0, 4)
                          .map(
                            (order) => `<a class="notif-row" href="#/orders/${order.locId}" data-nav="#/orders/${order.locId}">
                              <span class="notif-dot" aria-hidden="true"></span>
                              <span class="notif-body"><strong>${esc(orderSpotName(order))} · ${money(order.total)}</strong><span>${esc(order.customerName)} · order #${order.number} · ${esc((orderLocation(order) || {}).name || "")}</span></span>
                              ${icon("arrowRight", 14)}
                            </a>`,
                          )
                          .join("")
                      : `<p class="notif-empty">${calls.length ? "No new orders right now — the table calls above are still waiting." : `No table calls. Each new order or bell rings here and is highlighted on its ${spotWord(false).toLowerCase()}.`}</p>`
                  }
                  <a class="notif-foot" href="${ordersHref}" data-nav="${ordersHref}">Open live orders ${icon("arrowRight", 13)}</a>
                </div>`
              : ""
          }
        </div>
        <button type="button" class="icon-btn ${soundOn ? "" : "muted"}" data-action="toggle-sound" aria-pressed="${soundOn}" aria-label="${soundOn ? "Mute order bell" : "Unmute order bell"}" title="${soundOn ? "Order bell is on" : "Order bell is muted"}">${icon(soundOn ? "soundOn" : "soundOff", 18)}</button>
        <div class="business-chip">
          <span class="avatar">${BUSINESS.initials}</span>
          <div>
            <div class="business-name">${BUSINESS.name}</div>
            <div class="business-plan">Pro plan · ${state.businessType === "hotel" ? "Hotel" : "Café"}</div>
          </div>
          ${icon("chevronDown", 14)}
        </div>
      </div>
    </header>`;
  }

  function renderDemoBar() {
    return `<div class="demo-bar">
      <span class="demo-chip">Concept demo</span>
      <label class="demo-outlet"><span>Outlet</span>
        <select data-business-type aria-label="Outlet category">
          <option value="cafe" ${state.businessType === "cafe" ? "selected" : ""}>Café / restaurant · Tables</option>
          <option value="hotel" ${state.businessType === "hotel" ? "selected" : ""}>Hotel · Rooms</option>
        </select>
      </label>
      <span class="demo-note">QR ordering + live orders · mock data only · nothing here touches your repo</span>
      <a class="demo-join-link" href="#/scan/cafe01/qr4" data-nav="#/scan/cafe01/qr4">Try join approval</a>
      <button type="button" class="reset-btn" data-action="reset-demo">Reset demo</button>
    </div>`;
  }

  function renderShell(content, active) {
    return `<div class="app-shell">
      <div class="sidebar-backdrop" data-action="close-sidebar"></div>
      ${renderSidebar(active)}
      <div class="main">
        ${renderTopbar()}
        <main class="content" id="dashboard-content">
          ${renderDemoBar()}
          ${content}
        </main>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Dashboard                                                          */
  /* ------------------------------------------------------------------ */

  function renderPeriodBar() {
    const def = periodDef(period);
    return `<div class="period-bar">
        <div class="segmented period-filters" role="tablist" aria-label="Date range">
          ${Object.keys(PERIODS)
            .map(
              (key) => `<button type="button" class="${period === key ? "active" : ""}" data-action="period-filter" data-period="${key}" role="tab" aria-selected="${period === key}" title="${PERIODS[key].range}">${PERIODS[key].label}</button>`,
            )
            .join("")}
        </div>
        <div class="period-range">
          <span>Showing ${def.range}</span>
          <strong>${periodRangeLabel(period)}</strong>
        </div>
      </div>`;
  }

  function renderTrendCard(location) {
    const days = dailySeries(location.id, period);
    const stats = periodStats(location.id);
    const max = Math.max(1, ...days.map((day) => day.earnings));
    const best = days.reduce((top, day) => (day.earnings > top.earnings ? day : top), days[0]);
    const average = Math.round(stats.earnings / days.length);
    return `<section class="card trend-card">
        <div class="card-head">
          <div>
            <p class="card-title">Earnings trend</p>
            <p class="card-sub">${periodDef(period).range} · all ${spotWord(true).toLowerCase()} · day by day</p>
          </div>
          <span class="badge blue">${money(stats.earnings)}</span>
        </div>
        <div class="trend-chart" role="img" aria-label="Daily earnings for ${esc(periodRangeLabel(period))}">
          ${days
            .map(
              (day) => `<div class="trend-col" title="${esc(day.full)} · ${money(day.earnings)} · ${day.orders} bill${day.orders === 1 ? "" : "s"}">
                <span class="trend-track"><span class="trend-fill" style="height:${day.earnings ? Math.max(6, Math.round((day.earnings / max) * 100)) : 0}%"></span></span>
                <span class="trend-label">${esc(day.label)}</span>
              </div>`,
            )
            .join("")}
        </div>
        <div class="trend-foot">
          <span>Best day <strong>${best && best.earnings ? `${esc(best.full)} · ${money(best.earnings)}` : "No sales yet"}</strong></span>
          <span>Daily average <strong>${money(average)}</strong></span>
        </div>
      </section>`;
  }

  function renderSpotSnapshot(location) {
    const source = ordersForPeriod(location.id).filter((order) => order.status !== "cancelled");
    const rows = location.rooms.map((room) => {
      const spotOrders = source.filter((order) => order.code === room.code);
      return {
        key: room.code,
        label: displaySpotName(room),
        code: room.code,
        orders: spotOrders.length,
        guests: spotOrders.reduce((sum, order) => sum + Number(order.guests || 0), 0),
        earnings: spotOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        open: spotOrders.some((order) => activeStatus(order.status)),
      };
    });
    const direct = source.filter((order) => !order.code);
    if (direct.length) {
      rows.push({
        key: "direct",
        label: "Direct punch",
        code: "",
        orders: direct.length,
        guests: direct.reduce((sum, order) => sum + Number(order.guests || 0), 0),
        earnings: direct.reduce((sum, order) => sum + Number(order.total || 0), 0),
        open: direct.some((order) => activeStatus(order.status)),
      });
    }
    const total = rows.reduce((sum, row) => sum + row.earnings, 0);
    const max = Math.max(1, ...rows.map((row) => row.earnings));
    return `<section class="card spot-snapshot">
        <div class="card-head">
          <div>
            <p class="card-title">${spotWord(true)}-wise earnings</p>
            <p class="card-sub">${periodDef(period).range} · click for the full report</p>
          </div>
          <a class="btn btn-outline btn-xs" href="#/analytics/${location.id}" data-nav="#/analytics/${location.id}">Analytics</a>
        </div>
        <div class="snapshot-list">
          ${rows
            .map(
              (row) => `<a class="snapshot-row" href="#/analytics/${location.id}" data-nav="#/analytics/${location.id}">
                <span class="snapshot-name">${esc(row.label)} ${row.code ? `<span class="code-pill">${esc(row.code.toUpperCase())}</span>` : `<span class="badge">No table</span>`}${row.open ? '<span class="live-dot" title="Open bill"></span>' : ""}</span>
                <span class="snapshot-total">${money(row.earnings)}</span>
                <span class="snapshot-meta">${row.orders} bill${row.orders === 1 ? "" : "s"} · ${row.guests} guest${row.guests === 1 ? "" : "s"}</span>
                <span class="snapshot-bar"><span style="width:${Math.round((row.earnings / max) * 100)}%"></span></span>
              </a>`,
            )
            .join("")}
        </div>
        <div class="snapshot-foot">${money(total)} across ${rows.length} ${rows.length === 1 ? "row" : "rows"}</div>
      </section>`;
  }

  function renderServiceCallBanner(location) {
    const calls = activeServiceCalls(location.id);
    if (!calls.length) return "";
    return `<div class="banner banner-amber order-alert service-alert">
        ${icon("bell", 16)}
        <div><span style="font-weight:500">${calls.length} live ${spotWord(false).toLowerCase()} request${calls.length === 1 ? "" : "s"}.</span> ${calls.map((call) => `${esc(serviceCallSpotName(call))} — ${call.kind === "bill" ? "bill" : "waiter"}`).join(" · ")}. <a href="#/rooms/${location.id}" data-nav="#/rooms/${location.id}">Open ${spotWord(true).toLowerCase()} →</a></div>
      </div>`;
  }

  function renderDashboard() {
    const location = getLocation(route.locId || "cafe01");
    const room = location.rooms[0];
    const demoUrl = pageUrl(location, room ? room.code : "reception");
    const waiting = countNewOrders(location.id);
    const stats = periodStats(location.id);
    const previous = previousPeriodStats(location.id);
    const orders = ordersForPeriod(location.id);
    const recent = orders
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4);
    const compare = periodDef(period).previousLabel;
    return `<div class="page-head">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">${esc(location.name)} · ${periodDef(period).range} · live.</p>
        </div>
        <div class="page-actions">
          <a class="btn btn-outline" href="#/analytics/${location.id}" data-nav="#/analytics/${location.id}">${icon("analytics", 15)} Full analytics</a>
          <button type="button" class="btn btn-outline" data-action="download-report" data-loc="${location.id}">${icon("download", 15)} Download report</button>
        </div>
      </div>
      ${renderPeriodBar()}
      ${renderServiceCallBanner(location)}
      ${
        waiting
          ? `<div class="banner banner-amber order-alert">${icon("alert", 16)}<div><span style="font-weight:500">${waiting} new order${waiting === 1 ? "" : "s"} waiting to be accepted.</span> <a href="#/orders/${location.id}" data-nav="#/orders/${location.id}">Open live orders →</a></div></div>`
          : ""
      }
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">Earnings <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${money(stats.earnings)}</div>
          <div class="stat-foot">${deltaLabel(stats.earnings, previous.earnings, compare)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bills <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${stats.orders}</div>
          <div class="stat-foot">${money(stats.average)} average bill · ${stats.open} open</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Guests <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${stats.guests}</div>
          <div class="stat-foot">${stats.averageGuests} per bill · ${stats.paidOrders} paid</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Collected <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${money(stats.collected)}</div>
          <div class="stat-foot">${deltaLabel(stats.collected, previous.collected, compare)}</div>
        </div>
      </div>

      <div class="insight-grid">
        ${renderTrendCard(location)}
        ${renderSpotSnapshot(location)}
      </div>

      <section class="card live-orders-card">
        <div class="card-head">
          <div>
            <p class="card-title">Recent bills <span class="live-dot" aria-hidden="true"></span></p>
            <p class="card-sub">Newest first · ${periodRangeLabel(period)}. Live orders stay grouped in Orders.</p>
          </div>
          <a class="btn btn-outline btn-sm" href="#/orders/${location.id}" data-nav="#/orders/${location.id}">View all${waiting ? ` · ${waiting} new` : ""}</a>
        </div>
        ${recent.length ? `<div class="mini-orders">${recent.map((order) => renderMiniOrder(order)).join("")}</div>` : `<p class="empty-inline">No bills in ${periodDef(period).range}. Scan a ${spotWord(false).toLowerCase()} QR or switch the range.</p>`}
      </section>

      <section class="feature-card">
        <div>
          <div class="feature-kicker">${icon("sparkles", 14)} New feature concept</div>
          <h2>One QR per ${spotWord(false).toLowerCase()}. One page to edit.</h2>
          <p>Every ${spotWord(false).toLowerCase()} gets its own permanent QR and link. All of them open the location's shared ${spotWord(true)} page, so a single change updates every QR while orders still arrive tagged with the exact ${spotWord(false).toLowerCase()}.</p>
          <div class="feature-actions">
            <a class="btn btn-primary" href="#/locations/cafe01/rooms" data-nav="#/locations/cafe01/rooms">${icon("qr", 15)} Open ${spotWord(true).toLowerCase()} QRs</a>
            <a class="btn btn-outline" href="#/customer-page/cafe01/rooms" data-nav="#/customer-page/cafe01/rooms">${icon("edit", 15)} Edit ${spotWord(true)} page</a>
            <a class="btn btn-outline" href="${demoUrl}" data-nav="${demoUrl}">${icon("external", 15)} Preview a ${spotWord(false).toLowerCase()} QR</a>
          </div>
        </div>
        <div class="feature-qr">${qrSvg(demoUrl)}</div>
      </section>

      <section class="card feedback-list" aria-label="Recent feedback">
        <div class="feedback-row"><span class="feedback-dot"></span><div><p class="feedback-message">“Cold brew was excellent and the order arrived in minutes.”</p><div class="feedback-meta">${spotWord(false)} 2 · 18 min ago · positive</div></div></div>
        <div class="feedback-row"><span class="feedback-dot"></span><div><p class="feedback-message">“Loved the free refill — did not expect that.”</p><div class="feedback-meta">${spotWord(false)} 1 · 1 hr ago · positive</div></div></div>
        <div class="feedback-row"><span class="feedback-dot negative"></span><div><p class="feedback-message">“Waiter was busy, but the QR ordering still worked perfectly.”</p><div class="feedback-meta">${spotWord(false)} 3 · 3 hrs ago · private message</div></div></div>
      </section>`;
  }


  /* ------------------------------------------------------------------ */
  /* Locations + QR panel                                               */
  /* ------------------------------------------------------------------ */

  function renderLocationsPage() {
    const selected = getLocation(route.locId);
    return `<div class="page-head">
        <div>
          <h1 class="page-title">Locations</h1>
          <p class="page-sub">Every location keeps its reception QR and now has its own set of ${spotWord(false).toLowerCase()} QRs with live ordering.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" data-action="not-in-demo" data-label="Add location">${icon("plus", 15)} Add location</button>
        </div>
      </div>

      <div class="locations-grid">
        <section aria-labelledby="locations-heading">
          <p class="section-title" id="locations-heading" style="margin-bottom:10px">Your locations</p>
          <div class="loc-list">
            ${state.locations
              .map((location) => {
                const isSelected = location.id === selected.id;
                const activeRooms = location.rooms.filter((room) => room.active).length;
                return `<article class="loc-card ${isSelected ? "selected" : ""}">
                  <div class="loc-top">
                    <div>
                      <p class="loc-name">${esc(location.name)}</p>
                      <p class="loc-link">syehere.co/${esc(location.slug)}</p>
                      <div class="loc-meta">
                        <span class="badge green">Active</span>
                        <span>${location.scans} scans this cycle</span>
                        <span>·</span>
                        <span>${location.rooms.length} ${spotWord(false).toLowerCase()} QR${location.rooms.length === 1 ? "" : "s"} · ${activeRooms} active</span>
                      </div>
                    </div>
                    <div class="loc-actions">
                      <a class="btn btn-outline btn-sm" href="#/locations/${location.id}/reception" data-nav="#/locations/${location.id}/reception">Reception QR</a>
                      <a class="btn btn-primary btn-sm" href="#/locations/${location.id}/rooms" data-nav="#/locations/${location.id}/rooms">${spotWord(true)} QR · ${location.rooms.length}</a>
                    </div>
                  </div>
                </article>`;
              })
              .join("")}
          </div>

          <div class="banner banner-blue" style="margin-top:16px">
            ${icon("sparkles", 15)}
            <div><span style="font-weight:500">How it fits together:</span> a ${spotWord(false).toLowerCase()} QR never gets its own content. It points at the location's shared ${spotWord(true)} page, so editing that page once updates every QR. Orders still arrive tagged with the exact ${spotWord(false).toLowerCase()}. The reception page is separate and untouched.</div>
          </div>
        </section>

        <aside>${renderQrPanel(selected)}</aside>
      </div>`;
  }

  function renderQrPanel(location) {
    const kind = route.kind === "reception" ? "reception" : "rooms";
    return `<div class="panel">
      <div class="panel-head">
        <div class="panel-title-row">
          <div>
            <p class="panel-title">QR codes</p>
            <p class="panel-sub">${esc(location.name)}</p>
          </div>
          <span class="badge">syehere.co/${esc(location.slug)}</span>
        </div>
        <div class="segmented panel-tabs" role="tablist" aria-label="QR type">
          <button type="button" role="tab" aria-selected="${kind === "reception"}" class="${kind === "reception" ? "active" : ""}" data-action="panel-kind" data-kind="reception" data-loc="${location.id}" style="flex:1">Reception QR</button>
          <button type="button" role="tab" aria-selected="${kind === "rooms"}" class="${kind === "rooms" ? "active" : ""}" data-action="panel-kind" data-kind="rooms" data-loc="${location.id}" style="flex:1">${spotWord(true)} QR</button>
        </div>
      </div>
      <div class="panel-body">
        ${kind === "reception" ? renderReceptionPanel(location) : renderRoomsPanel(location)}
      </div>
    </div>`;
  }

  function renderReceptionPanel(location) {
    const url = pageUrl(location, "reception");
    const liveHref = `#/scan/${location.id}/reception`;
    const editHref = `#/customer-page/${location.id}/reception`;
    return `<div class="reception-card">
        <div class="reception-qr qr-art">${qrSvg(url)}</div>
        <div class="reception-body">
          <div style="display:flex;gap:5px;flex-wrap:wrap"><span class="badge blue">Existing page</span><span class="badge green">Active</span></div>
          <p style="font-size:12.5px;font-weight:500">Reception QR</p>
          <p class="qr-url">/r/${esc(location.slug)}</p>            <p class="panel-sub">Kept exactly as it is today. The ${spotWord(true)} pages are separate and cannot change this content.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">
            <a class="btn btn-outline btn-xs" href="${liveHref}" data-nav="${liveHref}">Preview</a>
            <a class="btn btn-primary btn-xs" href="${editHref}" data-nav="${editHref}">Edit page</a>
          </div>
        </div>
      </div>
      <p class="panel-note">This QR is printed once and points at the permanent slug. ${spotWord(true)} QRs do not replace it or compete with it — they are an extra set for ${spotWord(true).toLowerCase()}.</p>`;
  }

  function renderRoomsPanel(location) {
    const rooms = location.rooms;
    const active = rooms.filter((room) => room.active).length;
    const editHref = `#/customer-page/${location.id}/rooms`;
    return `<div class="banner banner-blue">
        ${icon("sparkles", 15)}
        <div><span style="font-weight:500">One page, every ${spotWord(false).toLowerCase()}.</span> Editing the ${spotWord(true)} page updates all ${rooms.length} ${spotWord(false).toLowerCase()} QR page${rooms.length === 1 ? "" : "s"} at this location.${rooms.length ? "" : ` Add your first ${spotWord(false).toLowerCase()} QR to get started.`}<br /><a href="${editHref}" data-nav="${editHref}">Edit ${spotWord(true)} page →</a></div>
      </div>
      <div class="qr-grid">
        ${rooms.map((room) => renderQrCard(location, room)).join("")}
        <button type="button" class="add-qr" data-action="add-room" data-loc="${location.id}">
          <span class="plus">${icon("plus", 18)}</span>
          <span><strong style="font-weight:500;color:#374151">Add QR</strong><br />New ${spotWord(false).toLowerCase()}</span>
        </button>
      </div>
      <p class="panel-note">${active} of ${rooms.length} ${spotWord(false).toLowerCase()} QR${rooms.length === 1 ? "" : "s"} active · Codes are permanent. Renaming a ${spotWord(false).toLowerCase()} keeps its QR working; pausing one shows “not available” without freeing the code.</p>`;
  }

  function renderQrCard(location, room) {
    const url = pageUrl(location, room.code);
    const liveHref = `#/scan/${location.id}/${room.code}`;
    const newCount = todayOrders(location.id).filter(
      (order) => order.code === room.code && order.status === "new",
    ).length;
    return `<article class="qr-card ${room.active ? "" : "paused"} ${newCount ? "has-new-order" : ""}">
        <div class="qr-card-head">
          <div>
            <p class="qr-card-name">${esc(displaySpotName(room))}${newCount ? `<span class="new-count">${newCount} new</span>` : ""}</p>
            <p class="qr-card-sub"><span class="code-pill">${esc(room.code.toUpperCase())}</span> ${room.active ? "" : "· Paused"}</p>
          </div>
          <label class="switch" title="${room.active ? "Pause this QR" : "Activate this QR"}">
            <input type="checkbox" data-room-toggle data-loc="${location.id}" data-code="${room.code}" ${room.active ? "checked" : ""} aria-label="Toggle ${esc(displaySpotName(room))} QR" />
            <span></span>
          </label>
        </div>
        <div class="qr-art">${qrSvg(url)}</div>
        <p class="qr-url">/r/${esc(location.slug)}/${esc(room.code)}</p>
        <div class="qr-card-actions">
          <button type="button" class="btn btn-outline" data-action="view-qr" data-loc="${location.id}" data-code="${room.code}">QR</button>
          <button type="button" class="btn btn-outline" data-action="copy-link" data-copy="${esc(url)}">Copy</button>
          <a class="btn btn-outline" href="${liveHref}" data-nav="${liveHref}">Preview</a>
        </div>
      </article>`;
  }

  /* ------------------------------------------------------------------ */
  /* Rooms management                                                   */
  /* ------------------------------------------------------------------ */

  function renderRoomsPage() {
    const location = getLocation(route.locId);
    const rooms = location.rooms;
    const active = rooms.filter((room) => room.active).length;
    const openOrders = todayOrders(location.id).filter((order) => activeStatus(order.status));
    const waiting = countNewOrders(location.id);
    return `<div class="page-head">
      <div>
        <h1 class="page-title">${spotWord(true)}</h1>
        <p class="page-sub">Every ${spotWord(false).toLowerCase()} has its own permanent QR and shares the location's ${spotWord(true)} page. Live orders show up here too.</p>
      </div>
      <div class="page-actions">
        <a class="btn btn-outline" href="#/orders/${location.id}" data-nav="#/orders/${location.id}">${icon("receipt", 15)} Live orders${waiting ? ` · ${waiting} new` : ""}</a>
        <button type="button" class="btn btn-primary" data-action="add-room" data-loc="${location.id}">${icon("plus", 15)} Add ${spotWord(false).toLowerCase()} QR</button>
      </div>
    </div>

    <div class="room-toolbar">
      <div class="segmented" aria-label="Location">
        ${state.locations
          .map(
            (item) =>
              `<button type="button" class="${item.id === location.id ? "active" : ""}" data-nav="#/rooms/${item.id}">${esc(item.name.split("—")[1]?.trim() || item.name)}</button>`,
          )
          .join("")}
      </div>
      <span class="badge">${rooms.length} ${spotWord(false).toLowerCase()} QR${rooms.length === 1 ? "" : "s"} · ${active} active · ${openOrders.length} with open orders</span>
    </div>

    <div class="shared-strip">
      <div class="strip-text"><strong style="font-weight:500">All ${rooms.length} ${spotWord(false).toLowerCase()} QR${rooms.length === 1 ? "" : "s"} at ${esc(location.name)} open one shared page.</strong> A single edit updates every ${spotWord(false).toLowerCase()}. Viewers still land on their own link, so scans and orders stay attributable.</div>
      <a class="btn btn-outline btn-sm" href="#/customer-page/${location.id}/rooms" data-nav="#/customer-page/${location.id}/rooms">${icon("edit", 14)} Edit ${spotWord(true)} page</a>
      <button type="button" class="btn btn-primary btn-sm" data-action="add-room" data-loc="${location.id}">${icon("plus", 14)} Add ${spotWord(false).toLowerCase()}</button>
    </div>

    <section class="card">
      ${
        rooms.length === 0
          ? `<div class="empty"><strong>No ${spotWord(false).toLowerCase()} QRs yet</strong>Add the first ${spotWord(false).toLowerCase()} QR. It will use the shared ${spotWord(true)} page for this location.<div style="margin-top:12px"><button type="button" class="btn btn-primary btn-sm" data-action="add-room" data-loc="${location.id}">${icon("plus", 14)} Add ${spotWord(false).toLowerCase()} QR</button></div></div>`
          : `<div class="room-list">${rooms.map((room) => renderRoomRow(location, room)).join("")}</div>`
      }
    </section>

    <div class="banner banner-green" style="margin-top:14px">
      ${icon("lock", 15)}
      <div>${spotWord(false)} links use a permanent code such as <span class="code-pill">QR1</span>. Renaming the ${spotWord(false).toLowerCase()} or the location does not change the QR. Pausing a QR keeps its code reserved so it can never accidentally point at another ${spotWord(false).toLowerCase()}.</div>
    </div>`;
  }

  function renderRoomRow(location, room) {
    const url = pageUrl(location, room.code);
    const liveHref = `#/scan/${location.id}/${room.code}`;
    const orders = todayOrders(location.id).filter(
      (order) => order.code === room.code && activeStatus(order.status),
    );
    const newCount = orders.filter((order) => order.status === "new").length;
    const calls = serviceCallsForSpot(location.id, room.code);
    const billCall = calls.find((call) => call.kind === "bill");
    const billOrder = billCall ? state.orders.find((order) => order.id === billCall.orderId) : null;
    const canSendBill = Boolean(billOrder && activeStatus(billOrder.status) && !billOrder.billSentAt);
    const waiters = [...new Set(orders.map((order) => order.waiterId).filter(Boolean))]
      .map((id) => waiterName(location.id, id))
      .join(", ");
    return `<div class="room-row ${room.active ? "" : "paused"} ${newCount ? "has-new-order" : ""} ${calls.length ? "has-call" : ""}">
        <div class="room-thumb">${qrSvg(url)}</div>
        <div>
          <div class="room-name">${esc(displaySpotName(room))} <span class="code-pill">${esc(room.code.toUpperCase())}</span>${newCount ? `<span class="new-count">${newCount} new</span>` : ""}</div>
          <p class="room-path">syehere.co/${esc(location.slug)}/${esc(room.code)}</p>
        </div>
        <div class="room-stat"><strong>${room.scans}</strong><span>scans</span></div>
        <div class="room-orders">
          ${calls.map((call) => `<span class="call-chip ${call.kind}">${icon(call.kind === "bill" ? "receipt" : "bell", 10)} ${call.kind === "bill" ? "Bill requested" : "Call waiter"}</span>`).join("")}
          ${orders.length ? `<span class="order-chip open">${orders.length} open</span>` : `<span class="order-chip">No open orders</span>`}
          ${waiters ? `<span class="room-waiter">${icon("users", 11)} ${esc(waiters)}</span>` : ""}
        </div>
        <div class="room-status"><span class="badge ${room.active ? "green" : "amber"}">${room.active ? "Active" : "Paused"}</span></div>
        <div class="room-actions" style="flex-wrap:wrap">
          ${canSendBill ? `<button type="button" class="btn btn-primary btn-xs" data-action="send-bill-phone" data-id="${billOrder.id}">${icon("receipt", 11)} Send bill</button>` : ""}
          ${calls.length ? `<button type="button" class="btn ${canSendBill ? "btn-outline" : "btn-primary"} btn-xs" data-action="resolve-service" data-id="${calls[0].id}">${icon("check", 11)} Mark handled</button>` : ""}
          <label class="switch" title="${room.active ? "Pause this QR" : "Activate this QR"}" style="margin-right:3px">
            <input type="checkbox" data-room-toggle data-loc="${location.id}" data-code="${room.code}" ${room.active ? "checked" : ""} aria-label="Toggle ${esc(displaySpotName(room))} QR" />
            <span></span>
          </label>
          <a class="btn btn-outline btn-xs" href="#/orders/${location.id}" data-nav="#/orders/${location.id}">Orders${newCount ? ` · ${newCount}` : ""}</a>
          <button type="button" class="btn btn-outline btn-xs" data-action="rename-room" data-loc="${location.id}" data-code="${room.code}">Rename</button>
          <button type="button" class="btn btn-outline btn-xs" data-action="view-qr" data-loc="${location.id}" data-code="${room.code}">QR</button>
          <a class="btn btn-outline btn-xs" href="${liveHref}" data-nav="${liveHref}">Preview</a>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Orders                                                             */
  /* ------------------------------------------------------------------ */

  function formatTime(value) {
    return new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }

  function statusPill(status) {
    return `<span class="status-pill ${status}">${statusLabel(status)}</span>`;
  }

  function renderMiniOrder(order) {
    return `<a class="mini-order" href="#/orders/${order.locId}" data-nav="#/orders/${order.locId}">
        <span class="mini-order-spot"><strong>${esc(orderSpotName(order))}</strong><span>#${order.number} · ${formatWhen(order.createdAt)}</span></span>
        <span class="mini-order-customer">${esc(order.customerName)} <span>· ${order.guests} guest${order.guests === 1 ? "" : "s"}</span></span>
        <span class="mini-order-total">${money(order.total)}</span>
        ${statusPill(order.status)}
      </a>`;
  }

  function renderOrdersPage() {
    const location = getLocation(route.locId);
    const waiting = countNewOrders(location.id);
    const orders = ordersForPeriod(location.id);
    const stats = periodStats(location.id);
    const previous = previousPeriodStats(location.id);
    const groups = location.rooms
      .map((room) => ({ room, orders: orders.filter((order) => order.code === room.code) }))
      .filter((group) => group.orders.length > 0);
    // Orders punched by staff with no table live in their own group.
    const directOrders = orders.filter((order) => !order.code);
    if (directOrders.length) groups.unshift({ room: null, orders: directOrders });
    const filteredGroups = groups
      .map((group) => ({
        room: group.room,
        orders: group.orders.filter((order) => {
          if (orderFilter === "all") return true;
          if (orderFilter === "done") return order.status === "completed" || order.status === "cancelled";
          return order.status === orderFilter;
        }),
      }))
      .filter((group) => group.orders.length > 0);
    const filteredCount = filteredGroups.reduce((sum, group) => sum + group.orders.length, 0);
    const filterCounts = {
      all: orders.length,
      new: orders.filter((order) => order.status === "new").length,
      preparing: orders.filter((order) => order.status === "preparing").length,
      served: orders.filter((order) => order.status === "served").length,
      done: orders.filter((order) => order.status === "completed" || order.status === "cancelled").length,
    };

    return `<div class="page-head">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="page-sub">${esc(location.name)} · ${stats.orders} bill${stats.orders === 1 ? "" : "s"} · ${periodRangeLabel(period)}. Grouped by ${spotWord(false).toLowerCase()}, oldest first.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" data-action="punch-order" data-loc="${location.id}">${icon("plus", 15)} Punch order</button>
          <button type="button" class="btn btn-outline" data-action="simulate-order" data-loc="${location.id}">${icon("sparkles", 15)} Simulate customer order</button>
          <a class="btn btn-outline" href="#/analytics/${location.id}" data-nav="#/analytics/${location.id}">${icon("analytics", 15)} Analytics</a>
        </div>
      </div>
      ${renderPeriodBar()}
      ${
        waiting
          ? `<div class="banner banner-amber order-alert">${icon("alert", 16)}<div><span style="font-weight:500">${waiting} new order${waiting === 1 ? "" : "s"}.</span> The bell rang and the ${spotWord(false).toLowerCase()} is highlighted below. Open the table arrow to see the orders and accept.</div></div>`
          : `<div class="banner banner-green order-alert">${icon("check", 16)}<div><span style="font-weight:500">You're caught up.</span> New QR orders ring the bell here and show a badge on their own ${spotWord(false).toLowerCase()}.</div></div>`
      }
      ${renderServiceCallBanner(location)}
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">Earnings <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${money(stats.earnings)}</div>
          <div class="stat-foot">${deltaLabel(stats.earnings, previous.earnings, periodDef(period).previousLabel)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bills <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${stats.orders}</div>
          <div class="stat-foot">${money(stats.average)} average · ${money(stats.collected)} collected</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Guests <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${stats.guests}</div>
          <div class="stat-foot">${stats.averageGuests} per bill · names + optional phones</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Open now</div>
          <div class="stat-value">${openSpotCount(location.id)}</div>
          <div class="stat-foot">of ${location.rooms.length} ${spotWord(true).toLowerCase()} · ${stats.open} open in range</div>
        </div>
      </div>

      <div class="orders-layout">
        <div class="orders-main">
          <div class="orders-toolbar">
            <div class="segmented order-filters" role="tablist" aria-label="Filter orders">
              ${[
                ["all", "All"],
                ["new", "New"],
                ["preparing", "Preparing"],
                ["served", "Served"],
                ["done", "Done"],
              ]
                .map(
                  ([key, label]) => `<button type="button" class="${orderFilter === key ? "active" : ""}" data-action="order-filter" data-filter="${key}" role="tab" aria-selected="${orderFilter === key}">${label}${filterCounts[key] ? ` <span class="filter-count">${filterCounts[key]}</span>` : ""}</button>`,
                )
                .join("")}
            </div>
            <span class="badge">${filteredCount} shown</span>
          </div>

          ${
            filteredGroups.length
              ? filteredGroups.map((group) => renderOrderGroup(group.room, group.orders, location)).join("")
              : `<section class="card empty"><strong>No ${orderFilter === "all" ? "bills" : orderFilter + " bills"} in ${periodDef(period).range}</strong><p style="margin-top:6px;color:var(--muted)">Orders placed from a ${spotWord(false).toLowerCase()} QR appear here with the customer's name and a bell at the top of the dashboard.</p><button type="button" class="btn btn-primary btn-sm" style="margin-top:12px" data-action="simulate-order" data-loc="${location.id}">${icon("sparkles", 14)} Simulate an order</button></section>`
          }
        </div>
        ${renderWaitersCard(location)}
      </div>`;
  }

  function renderOrderGroup(room, orders, location) {
    const direct = !room;
    const spotLabel = direct ? "Direct punch" : displaySpotName(room);
    const calls = direct ? [] : serviceCallsForSpot(location.id, room.code);
    const billCall = calls.find((call) => call.kind === "bill");
    const billOrder = billCall ? state.orders.find((order) => order.id === billCall.orderId) : null;
    const canSendBill = Boolean(billOrder && activeStatus(billOrder.status) && !billOrder.billSentAt);
    const newCount = orders.filter((order) => order.status === "new").length;
    const earnings = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
    const waiters = [...new Set(orders.map((order) => order.waiterId).filter(Boolean))]
      .map((id) => waiterName(location.id, id))
      .join(", ");
    const scanHref = direct ? "" : `#/scan/${location.id}/${room.code}`;
    const groupKey = `${location.id}:${direct ? "direct" : room.code}`;
    const isOpen = expandedOrderGroups.has(groupKey);
    return `<section class="order-table-group ${newCount ? "has-new" : ""} ${direct ? "direct-punch" : ""} ${isOpen ? "is-open" : "is-collapsed"}">
        <header class="order-group-head">
          <div class="order-group-title-wrap">
            <button type="button" class="order-group-toggle" data-action="toggle-order-group" data-group="${groupKey}" aria-expanded="${isOpen}" aria-label="${isOpen ? "Hide" : "Show"} orders for ${esc(spotLabel)}" title="${isOpen ? "Hide orders" : "Show orders"}">${icon("chevronDown", 16)}</button>
            <span class="order-group-icon">${icon(direct ? "receipt" : "rooms", 17)}</span>
            <div>
              <p class="order-group-title">${esc(spotLabel)} ${direct ? `<span class="code-pill">NO TABLE</span>` : `<span class="code-pill">${esc(room.code.toUpperCase())}</span>`}${newCount ? `<span class="new-count">${newCount} new</span>` : ""}${calls.length ? `<span class="call-chip ${calls[0].kind}">${icon(calls[0].kind === "bill" ? "receipt" : "bell", 10)} ${calls[0].kind === "bill" ? "Bill requested" : "Call waiter"}</span>` : ""}</p>
              <p class="order-group-sub">${direct ? "Punched by staff — not tied to a table" : waiters ? `Served by ${esc(waiters)}` : `No waiter assigned yet`} · ${money(earnings)} in this period · ${orders.length} bill${orders.length === 1 ? "" : "s"} · ${isOpen ? "all orders shown" : "open the arrow to see orders"}</p>
            </div>
          </div>
          <div class="order-group-actions">
            ${canSendBill ? `<button type="button" class="btn btn-primary btn-xs" data-action="send-bill-phone" data-id="${billOrder.id}">${icon("receipt", 12)} Send bill</button>` : ""}
            ${calls.length ? `<button type="button" class="btn ${canSendBill ? "btn-outline" : "btn-primary"} btn-xs" data-action="resolve-service" data-id="${calls[0].id}">${icon("check", 12)} Mark handled</button>` : ""}
            <button type="button" class="btn btn-outline btn-xs" data-action="punch-order" data-loc="${location.id}" ${direct ? "" : `data-code="${room.code}"`}>${icon("plus", 12)} Punch</button>
            ${direct ? "" : `<a class="btn btn-outline btn-xs" href="${scanHref}" data-nav="${scanHref}">Open QR</a>`}
            <a class="btn btn-outline btn-xs" href="#/analytics/${location.id}" data-nav="#/analytics/${location.id}">Report</a>
          </div>
        </header>
        <div class="order-rows" ${isOpen ? "" : "hidden"}>${orders.map((order, index) => renderOrderRow(order, index)).join("")}</div>
      </section>`;
  }

  function renderOrderRow(order, index) {
    const rounds = orderRounds(order);
    const actions = [];
    if (order.status === "new") {
      actions.push(`<button type="button" class="btn btn-primary btn-xs" data-action="order-status" data-id="${order.id}" data-status="preparing">Accept order</button>`);
      actions.push(`<button type="button" class="btn btn-danger-ghost btn-xs" data-action="order-status" data-id="${order.id}" data-status="cancelled">Cancel</button>`);
    } else if (order.status === "preparing") {
      actions.push(`<button type="button" class="btn btn-primary btn-xs" data-action="order-status" data-id="${order.id}" data-status="served">Mark served</button>`);
    } else if (order.status === "served") {
      actions.push(`<button type="button" class="btn btn-primary btn-xs" data-action="open-bill" data-id="${order.id}">${icon("receipt", 12)} Bill & payment</button>`);
    } else if (order.status === "completed") {
      actions.push(`<button type="button" class="btn btn-outline btn-xs" data-action="open-bill" data-id="${order.id}">${icon("receipt", 12)} View bill</button>`);
    } else {
      actions.push(`<span class="order-closed">No charge</span>`);
    }
    if (order.status !== "served" && order.status !== "completed" && order.status !== "cancelled") {
      actions.push(`<button type="button" class="btn btn-outline btn-xs" data-action="open-bill" data-id="${order.id}">Bill</button>`);
    }
    const tags = [];
    if (rounds.length > 1) tags.push(`<span class="round-chip" title="Items were added to this same bill">${rounds.length} rounds</span>`);
    const latestRound = rounds[rounds.length - 1];
    if (latestRound && latestRound.by && latestRound.by !== order.customerName) {
      tags.push(`<span class="round-chip">${esc(latestRound.by)}'s round</span>`);
    }
    if (!order.code) tags.push(`<span class="round-chip punch">Direct punch</span>`);
    else if (order.source === "punch") tags.push(`<span class="round-chip punch">Punched</span>`);
    if (order.payment) tags.push(`<span class="paid-chip">Paid</span>`);
    if (order.billSentAt && activeStatus(order.status)) tags.push(`<span class="round-chip">Bill sent</span>`);
    return `<div class="order-row ${order.status}">
        <span class="order-seq" title="Bill sequence for this ${spotWord(false).toLowerCase()}">${index + 1}</span>
        <div class="order-who">
          <strong>#${order.number} <span class="order-time">${formatWhen(order.createdAt)}</span></strong>
          <span class="order-customer">${esc(order.customerName)}</span>
          <span class="order-contact">${esc(order.phone || "No phone")} · ${order.guests} guest${order.guests === 1 ? "" : "s"}</span>
          ${tags.length ? `<span class="order-tags">${tags.join("")}</span>` : ""}
        </div>
        <div class="order-items">${order.items.map((item) => `<span><strong>${item.qty}×</strong> ${esc(item.name)}</span>`).join("")}</div>
        <div class="order-waiter"><span class="waiter-chip">${icon("users", 12)} ${esc(waiterName(order.locId, order.waiterId))}</span></div>
        <div class="order-total">${money(order.total)}</div>
        <div class="order-status">${statusPill(order.status)}</div>
        <div class="order-actions">${actions.join("")}</div>
      </div>`;
  }

  function renderWaitersCard(location) {
    const waiters = location.waiters || [];
    return `<aside class="orders-side">
        <section class="card waiters-card" aria-labelledby="waiters-heading">
          <div class="card-head">
            <div>
              <p class="card-title" id="waiters-heading">Waiters</p>
              <p class="card-sub">How many ${spotWord(true).toLowerCase()} each can handle.</p>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="add-waiter" data-loc="${location.id}">${icon("plus", 13)} Add</button>
          </div>
          <div class="waiters-list">
            ${waiters
              .map((waiter) => {
                const load = waiterLoad(location.id, waiter.id);
                const full = load >= waiter.maxTables;
                const status = !waiter.active ? "Paused" : full ? "At capacity" : "Available";
                const badgeClass = !waiter.active ? "" : full ? "amber" : "green";
                const percent = Math.min(100, Math.round((load / Math.max(1, waiter.maxTables)) * 100));
                return `<div class="waiter-row ${waiter.active ? "" : "paused"}">
                    <span class="waiter-avatar">${esc(waiter.name.slice(0, 2).toUpperCase())}</span>
                    <div class="waiter-info">
                      <div class="waiter-title">${esc(waiter.name)} <span class="badge ${badgeClass}">${status}</span></div>
                      <div class="waiter-sub">${load} of ${waiter.maxTables} ${spotWord(true).toLowerCase()} today${full ? " · hidden at checkout" : ` · ${waiter.maxTables - load} slot${waiter.maxTables - load === 1 ? "" : "s"} free`}</div>
                      <div class="load-bar"><span class="fill ${full ? "full" : ""}" style="width:${percent}%"></span></div>
                    </div>
                    <div class="waiter-controls">
                      <label class="waiter-capacity">Max
                        <select data-waiter-max data-waiter="${waiter.id}" data-loc="${location.id}" aria-label="Maximum ${spotWord(true).toLowerCase()} for ${esc(waiter.name)}">
                          ${[1, 2, 3, 4, 5, 6, 7, 8].map((value) => `<option value="${value}" ${value === waiter.maxTables ? "selected" : ""}>${value}</option>`).join("")}
                        </select>
                      </label>
                      <label class="switch" title="${waiter.active ? "Pause this waiter" : "Make available again"}">
                        <input type="checkbox" data-waiter-active data-waiter="${waiter.id}" data-loc="${location.id}" ${waiter.active ? "checked" : ""} aria-label="Toggle ${esc(waiter.name)}" />
                        <span></span>
                      </label>
                      <button type="button" class="waiter-remove" data-action="remove-waiter" data-loc="${location.id}" data-waiter="${waiter.id}" aria-label="Remove ${esc(waiter.name)}" title="Remove waiter">${icon("trash", 13)}</button>
                    </div>
                  </div>`;
              })
              .join("")}
          </div>
        </section>
        <div class="banner banner-blue waiter-note">${icon("users", 15)}<div>A waiter with <strong>3 open ${spotWord(true).toLowerCase()} and a limit of 3</strong> disappears from the customer's waiter list — customers see them as “At capacity”. Closing a bill frees a slot immediately.</div></div>
      </aside>`;
  }

  /* ------------------------------------------------------------------ */
  /* Analytics                                                          */
  /* ------------------------------------------------------------------ */

  function renderAnalyticsPage() {
    const location = getLocation(route.locId);
    const allPeriod = ordersForPeriod(location.id);
    const previousPeriod = ordersBetween(location.id, previousPeriodWindow(period));
    const directOrders = allPeriod.filter((order) => !order.code);
    if (analyticsSpot !== "all" && analyticsSpot !== "direct" && !getSpot(location.id, analyticsSpot)) analyticsSpot = "all";
    if (analyticsSpot === "direct" && !directOrders.length) analyticsSpot = "all";
    const scoped = allPeriod.filter((order) => spotMatches(order, analyticsSpot));
    const valid = scoped.filter((order) => order.status !== "cancelled");
    const allValid = allPeriod.filter((order) => order.status !== "cancelled");
    const allGuests = allValid.reduce((sum, order) => sum + Number(order.guests || 0), 0);
    const previousScoped = previousPeriod.filter(
      (order) => spotMatches(order, analyticsSpot) && order.status !== "cancelled",
    );
    const earnings = valid.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousEarnings = previousScoped.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const guests = valid.reduce((sum, order) => sum + Number(order.guests || 0), 0);
    const average = valid.length ? Math.round(earnings / valid.length) : 0;
    const collected = valid
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousCollected = previousScoped
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const openBills = valid.filter((order) => activeStatus(order.status));
    const newCount = allPeriod.filter((order) => order.status === "new").length;
    const cancelled = scoped.length - valid.length;
    const selectedRoom = analyticsSpot === "all" || analyticsSpot === "direct" ? null : getSpot(location.id, analyticsSpot);
    const selectedLabel = analyticsSpot === "direct" ? "Direct punch" : selectedRoom ? displaySpotName(selectedRoom) : `All ${spotWord(true).toLowerCase()}`;
    const breakdown = location.rooms.map((room) => {
      const spotOrders = allPeriod.filter((order) => order.code === room.code && order.status !== "cancelled");
      return {
        room,
        key: room.code,
        label: displaySpotName(room),
        orders: spotOrders.length,
        guests: spotOrders.reduce((sum, order) => sum + Number(order.guests || 0), 0),
        earnings: spotOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        open: spotOrders.some((order) => activeStatus(order.status)),
      };
    });
    const directValid = directOrders.filter((order) => order.status !== "cancelled");
    if (directValid.length) {
      breakdown.push({
        room: null,
        key: "direct",
        label: "Direct punch",
        orders: directValid.length,
        guests: directValid.reduce((sum, order) => sum + Number(order.guests || 0), 0),
        earnings: directValid.reduce((sum, order) => sum + Number(order.total || 0), 0),
        open: directValid.some((order) => activeStatus(order.status)),
      });
    }
    const totalEarnings = breakdown.reduce((sum, row) => sum + row.earnings, 0);
    const maxEarnings = Math.max(1, ...breakdown.map((row) => row.earnings));
    const days = dailySeries(location.id, period);
    const best = days.reduce((top, day) => (day.earnings > top.earnings ? day : top), days[0]);
    const dayAverage = Math.round(totalEarnings / days.length);
    const activeDays = days.filter((day) => day.orders > 0).length;
    const range = periodRangeLabel(period);
    const compare = periodDef(period).previousLabel;

    return `<div class="page-head">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-sub">${esc(location.name)} · ${periodDef(period).range}, ${range}. Earnings and orders by ${spotWord(false).toLowerCase()}.</p>
        </div>
        <div class="page-actions">
          <select class="select" data-analytics-spot aria-label="Filter by ${spotWord(false).toLowerCase()}">
            <option value="all" ${analyticsSpot === "all" ? "selected" : ""}>All ${spotWord(true).toLowerCase()}</option>
            ${location.rooms.map((room) => `<option value="${room.code}" ${analyticsSpot === room.code ? "selected" : ""}>${esc(displaySpotName(room))} (${esc(room.code.toUpperCase())})</option>`).join("")}
            ${directOrders.length ? `<option value="direct" ${analyticsSpot === "direct" ? "selected" : ""}>Direct punch · no table</option>` : ""}
          </select>
          <button type="button" class="btn btn-primary" data-action="download-report" data-loc="${location.id}" ${analyticsSpot === "all" ? "" : `data-code="${analyticsSpot}"`}>${icon("download", 15)} Download report</button>
        </div>
      </div>
      ${renderPeriodBar()}

      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">Earnings · ${esc(selectedLabel)}</div>
          <div class="stat-value">${money(earnings)}</div>
          <div class="stat-foot">${deltaLabel(earnings, previousEarnings, compare)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bills <span class="stat-range">${periodDef(period).stat}</span></div>
          <div class="stat-value">${valid.length}</div>
          <div class="stat-foot">${money(average)} average · ${newCount} new awaiting</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Guests</div>
          <div class="stat-value">${guests}</div>
          <div class="stat-foot">${valid.length ? Math.round((guests / valid.length) * 10) / 10 : 0} per bill · ${cancelled} cancelled excluded</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Collected</div>
          <div class="stat-value">${money(collected)}</div>
          <div class="stat-foot">${deltaLabel(collected, previousCollected, compare)} · ${openBills.length} open</div>
        </div>
      </div>

      ${renderTrendCard(location)}

      <section class="card report-card">
        <div class="card-head">
          <div><p class="card-title">${spotWord(false)}-wise earnings</p><p class="card-sub">${periodDef(period).range} · all ${spotWord(true).toLowerCase()}. Click a row to filter the whole page.</p></div>
          <span class="badge blue">${money(totalEarnings)} total</span>
        </div>
        <div class="report-table" role="table" aria-label="Earnings by ${spotWord(false).toLowerCase()}">
          <div class="report-row report-header" role="row"><span>${spotWord(false)}</span><span>Bills</span><span>Guests</span><span>Earnings</span><span>Share</span></div>
          <button type="button" class="report-row ${analyticsSpot === "all" ? "selected" : ""}" data-action="analytics-spot" data-code="all">
            <span class="report-name">All ${spotWord(true).toLowerCase()} <span class="badge">${location.rooms.length}</span></span>
            <span>${allValid.length}</span>
            <span>${allGuests}</span>
            <span class="report-money">${money(totalEarnings)}</span>
            <span class="report-bar"><span class="fill" style="width:100%"></span></span>
          </button>
          ${breakdown
            .map(
              (row) => `<button type="button" class="report-row ${analyticsSpot === row.key ? "selected" : ""}" data-action="analytics-spot" data-code="${row.key}">
                <span class="report-name">${esc(row.label)} ${row.room ? `<span class="code-pill">${esc(row.room.code.toUpperCase())}</span>` : `<span class="badge">No table</span>`}${row.open ? '<span class="live-dot" title="Open order"></span>' : ""}</span>
                <span>${row.orders}</span>
                <span>${row.guests}</span>
                <span class="report-money">${money(row.earnings)}</span>
                <span class="report-bar"><span class="fill" style="width:${Math.round((row.earnings / maxEarnings) * 100)}%"></span></span>
              </button>`,
            )
            .join("")}
        </div>
      </section>

      <section class="card report-card daywise-card">
        <div class="card-head">
          <div><p class="card-title">Day-wise earnings</p><p class="card-sub">${range} · all ${spotWord(true).toLowerCase()} · ${activeDays} active day${activeDays === 1 ? "" : "s"} · best ${best && best.earnings ? `${esc(best.full)} (${money(best.earnings)})` : "no sales yet"}</p></div>
          <span class="badge">${money(dayAverage)} / day</span>
        </div>
        <div class="daywise-list">
          <div class="day-row header"><span>Day</span><span>Bills</span><span>Guests</span><span>Earnings</span></div>
          ${days
            .slice()
            .reverse()
            .map(
              (day) => `<div class="day-row ${day.orders ? "" : "muted"}"><span>${esc(day.full)}</span><span>${day.orders}</span><span>${day.guests}</span><span class="money">${money(day.earnings)}</span></div>`,
            )
            .join("")}
        </div>
      </section>

      <section class="card report-orders-card">
        <div class="card-head">
          <div><p class="card-title">Bill details · ${esc(selectedLabel)}</p><p class="card-sub">Every bill in ${periodDef(period).range}, newest first. The CSV download includes the same rows.</p></div>
          <button type="button" class="btn btn-outline btn-sm" data-action="download-report" data-loc="${location.id}" ${analyticsSpot === "all" ? "" : `data-code="${analyticsSpot}"`}>${icon("download", 14)} CSV</button>
        </div>
        ${
          scoped.length
            ? `<div class="report-orders">${scoped
                .slice()
                .reverse()
                .map(
                  (order) => `<div class="report-order">
                    <span class="report-order-main"><strong>#${order.number}</strong><span>${formatWhen(order.createdAt)} · ${esc(orderSpotName(order))} · ${esc(order.customerName)} · ${orderRounds(order).length} round${orderRounds(order).length === 1 ? "" : "s"}</span></span>
                    <span class="report-order-items">${order.items.map((item) => `${item.qty}× ${esc(item.name)}`).join(", ")}</span>
                    <span class="report-order-waiter">${esc(waiterName(order.locId, order.waiterId))}</span>
                    <span class="report-order-total">${money(order.total)}</span>
                    ${statusPill(order.status)}
                  </div>`,
                )
                .join("")}</div>`
            : `<p class="empty-inline">No bills for ${esc(selectedLabel)} in ${periodDef(period).range}. Place one from a ${spotWord(false).toLowerCase()} QR, use Simulate order, or switch the range.</p>`
        }
      </section>`;
  }


  /* ------------------------------------------------------------------ */
  /* Customer page editor                                               */
  /* ------------------------------------------------------------------ */

  function ensureDraft() {
    const key = configKey(route.locId, route.kind);
    if (draftKey === key) return;
    draft = clone(getConfig(route.locId, route.kind));
    savedConfig = clone(draft);
    draftKey = key;
    dirty = false;
    previewRoomCode = route.kind === "rooms" ? getLocation(route.locId).rooms[0]?.code || null : null;
  }

  function switchControl(field, checked, label) {
    return `<label class="switch" title="${esc(label)}"><input type="checkbox" data-field="${field}" ${checked ? "checked" : ""} aria-label="${esc(label)}" /><span></span></label>`;
  }

  function field(labelText, field, value, hint, placeholder) {
    return `<div class="field"><label>${esc(labelText)}</label><input class="input" data-field="${field}" value="${esc(value)}" maxlength="200" placeholder="${esc(placeholder || "")}" />${hint ? `<span class="field-hint">${esc(hint)}</span>` : ""}</div>`;
  }

  function editorRow(options) {
    const { iconName, label, sub, fieldName, checked, fields, single } = options;
    return `<div class="editor-row">
        <div class="editor-row-head">
          <div class="row-title">
            <span class="row-icon">${icon(iconName, 16)}</span>
            <div><p class="row-label">${esc(label)}</p>${sub ? `<p class="row-sub">${sub}</p>` : ""}</div>
          </div>
          ${switchControl(fieldName, checked, `Toggle ${label}`)}
        </div>
        ${checked && fields ? `<div class="row-fields ${single ? "single" : ""}">${fields}</div>` : ""}
      </div>`;
  }

  function renderEditor() {
    ensureDraft();
    const location = getLocation(route.locId);
    const kind = route.kind;
    const rooms = location.rooms;
    const room = rooms.find((item) => item.code === previewRoomCode) || rooms[0] || null;
    const liveCode = kind === "rooms" ? room?.code : "reception";
    const liveHref = liveCode ? `#/scan/${location.id}/${liveCode}` : `#/locations/${location.id}/rooms`;
    const buttonCount = [
      draft.menu.on,
      draft.wifi.on,
      draft.hours.on,
      draft.call.on,
      draft.directions.on && draft.directions.value.trim(),
      draft.custom.on && draft.custom.label.trim(),
    ].filter(Boolean).length;

    const roomBanner =
      kind === "rooms"
        ? `<div class="banner banner-blue" style="margin-bottom:14px">
            ${icon("sparkles", 15)}
            <div><span style="font-weight:500">All ${rooms.length} ${spotWord(false).toLowerCase()} QR page${rooms.length === 1 ? "" : "s"} at ${esc(location.name)} share this content.</span> Save once and every ${spotWord(false).toLowerCase()} QR shows the change.${rooms.length ? ` <a href="${liveHref}" data-action="view-live" data-href="${liveHref}">Preview ${esc(room ? displaySpotName(room) : spotWord(false).toLowerCase())} →</a>` : ` Add a ${spotWord(false).toLowerCase()} QR from Locations when you are ready.`}</div>
          </div>`
        : `<div class="banner banner-amber" style="margin-bottom:14px">
            ${icon("lock", 15)}
            <div><span style="font-weight:500">Reception page.</span> This is the existing page and remains separate. Saving here never changes any room QR page.</div>
          </div>`;

    return `<div class="page-head">
        <div>
          <h1 class="page-title">Customer page</h1>
          <p class="page-sub">${kind === "rooms" ? `Customize what customers see on every ${spotWord(false).toLowerCase()} QR at ${esc(location.name)}.` : `Customize what customers see at ${esc(location.name)}.`}</p>
        </div>
        <div class="editor-controls">
          <select class="select" data-editor-location aria-label="Location" style="width:auto">
            ${state.locations.map((item) => `<option value="${item.id}" ${item.id === location.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}
          </select>
          <button type="button" class="btn btn-outline" data-action="reset-config">Reset to default</button>
          <button type="button" class="btn btn-primary" data-save data-action="save-config" ${dirty ? "" : "disabled"}>Save changes</button>
          <a class="btn btn-outline" href="${liveHref}" data-action="view-live" data-href="${liveHref}">${icon("external", 15)} View live page</a>
        </div>
      </div>

      <div class="segmented" role="tablist" aria-label="Page type" style="margin-bottom:14px">
        <button type="button" role="tab" aria-selected="${kind === "reception"}" class="${kind === "reception" ? "active" : ""}" data-action="editor-kind" data-kind="reception">Reception page</button>
        <button type="button" role="tab" aria-selected="${kind === "rooms"}" class="${kind === "rooms" ? "active" : ""}" data-action="editor-kind" data-kind="rooms">${spotWord(true)} page <span class="badge blue">${rooms.length}</span></button>
      </div>

      ${roomBanner}

      <div class="editor-layout">
        <div class="editor-col">
          <section class="section-card">
            <div class="section-head">
              <span class="section-title">Page content</span>
              <span class="save-state ${dirty ? "dirty" : ""}" data-save-state>${dirty ? "Unsaved changes" : "All changes saved"}</span>
            </div>
            <div class="section-body">
              <div class="editor-row">
                <div class="editor-row-head">
                  <div class="row-title">
                    <span class="row-icon">${icon("sparkles", 16)}</span>
                    <div><p class="row-label">Announcement</p><p class="row-sub">Shown above the business name, only while it is active.</p></div>
                  </div>
                  ${switchControl("announcement.on", draft.announcement.on, "Toggle announcement")}
                </div>
                ${
                  draft.announcement.on
                    ? `<div class="row-fields single"><div class="field full"><label>Announcement text</label><input class="input" data-field="announcement.text" value="${esc(draft.announcement.text)}" maxlength="160" /><span class="field-hint">${draft.announcement.text.length}/160 characters</span></div></div>`
                    : ""
                }
              </div>

              <div class="editor-row">
                <div class="editor-row-head">
                  <div class="row-title">
                    <span class="row-icon">${icon("feedback", 16)}</span>
                    <div><p class="row-label">Thank-you message</p><p class="row-sub">Shown after a customer finishes the feedback flow.</p></div>
                  </div>
                </div>
                <div class="row-fields single">
                  <div class="field full">
                    <textarea class="textarea" data-field="thankYou" maxlength="160">${esc(draft.thankYou)}</textarea>
                    <span class="field-hint">${draft.thankYou.length}/160 characters</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-head">
              <span class="section-title">Buttons</span>
              <span class="badge">${buttonCount} shown to customers</span>
            </div>
            <div class="section-body">
              ${editorRow({
                iconName: "menu",
                label: "Menu",
                sub: "Opens the menu, where customers add items to a cart and send an order to your live dashboard.",
                fieldName: "menu.on",
                checked: draft.menu.on,
                fields: field("Menu title", "menu.title", draft.menu.title, "Leave blank to use the business-type label."),
              })}
              ${editorRow({
                iconName: "wifi",
                label: "Wi-Fi",
                sub: "Unlocks only after you accept the customer's order. Café, restaurant and hotel QR pages only.",
                fieldName: "wifi.on",
                checked: draft.wifi.on,
                fields:
                  field("Network name", "wifi.ssid", draft.wifi.ssid) +
                  field("Password", "wifi.password", draft.wifi.password),
              })}
              ${editorRow({
                iconName: "clock",
                label: "Hours and contact",
                sub: "Weekly hours, address, Call and WhatsApp.",
                fieldName: "hours.on",
                checked: draft.hours.on,
                fields:
                  field("Phone", "hours.phone", draft.hours.phone) +
                  field("Address", "hours.address", draft.hours.address),
              })}
              ${editorRow({
                iconName: "phone",
                label: "Call",
                sub: "Opens the dialer with this number.",
                fieldName: "call.on",
                checked: draft.call.on,
                fields: field("Phone number", "call.phone", draft.call.phone),
              })}
              ${editorRow({
                iconName: "map",
                label: "Directions",
                sub: "Opens Google Maps from an address or a Maps link.",
                fieldName: "directions.on",
                checked: draft.directions.on,
                fields: field("Address or Google Maps link", "directions.value", draft.directions.value),
              })}
              ${editorRow({
                iconName: "link",
                label: "Custom link",
                sub: `One extra button, for example “Order online” or “${kind === "rooms" ? "Request housekeeping" : "Book a table"}”.`,
                fieldName: "custom.on",
                checked: draft.custom.on,
                fields:
                  field("Button label", "custom.label", draft.custom.label) +
                  field("Link", "custom.url", draft.custom.url, "Must start with https://"),
              })}
              <div class="locked-row">
                <div class="lock-label">${icon("lock", 15)} Review buttons</div>
                <span class="badge">Always shown</span>
              </div>
            </div>
          </section>

          <div class="section-card">
            <div class="editor-footer">
              <button type="button" class="btn btn-primary" data-save data-action="save-config" ${dirty ? "" : "disabled"}>Save changes</button>
              <button type="button" class="btn btn-outline" data-action="discard-config" ${dirty ? "" : "disabled"}>Discard</button>
              <span class="save-state ${dirty ? "dirty" : ""}" data-save-state>${dirty ? "Unsaved changes" : "All changes saved"}</span>
            </div>
          </div>
        </div>

        <aside class="preview-col" id="phone-preview-host">
          ${renderPhonePreview()}
        </aside>
      </div>`;
  }

  function renderPhonePreview() {
    ensureDraft();
    const location = getLocation(route.locId);
    const rooms = location.rooms;
    const room = rooms.find((item) => item.code === previewRoomCode) || rooms[0] || null;
    const label = route.kind === "rooms" ? `${spotWord(false)} QR preview` : "Reception QR preview";
    const path =
      route.kind === "rooms"
        ? `/r/${location.slug}/${room ? room.code : "…"}`
        : `/r/${location.slug}`;
    return `<div class="preview-head">
        <p class="preview-label">${label} <span>· ${esc(path)}</span></p>
        ${
          route.kind === "rooms" && rooms.length
            ? `<select class="preview-room-select" data-preview-room aria-label="Preview room QR">
                ${rooms.map((item) => `<option value="${item.code}" ${room && item.code === room.code ? "selected" : ""}>${esc(item.name)} (${esc(item.code.toUpperCase())})</option>`).join("")}
              </select>`
            : ""
        }
      </div>
      <div class="phone">
        <div class="phone-screen" style="${themeStyle()}">
          ${renderCustomerHome(draft, { preview: true })}
        </div>
      </div>
      <p class="preview-note">${
        route.kind === "rooms"
          ? `Every ${spotWord(false).toLowerCase()} QR at ${esc(location.name)} shows this exact page.${rooms.length ? "" : ` Add a ${spotWord(false).toLowerCase()} QR to make it live.`}`
          : `This preview is the reception page only. ${spotWord(true)} pages have their own content.`
      }</p>`;
  }

  function refreshPreview() {
    const screen = document.querySelector("#phone-preview-host .phone-screen");
    if (screen) screen.innerHTML = renderCustomerHome(draft, { preview: true });
  }

  function refreshDirtyUI() {
    document.querySelectorAll("[data-save]").forEach((button) => {
      button.disabled = !dirty;
    });
    document.querySelectorAll("[data-save-state]").forEach((label) => {
      label.textContent = dirty ? "Unsaved changes" : "All changes saved";
      label.classList.toggle("dirty", dirty);
    });
  }

  function saveDraft() {
    if (!draft || route.name !== "editor") return;
    state.configs[configKey(route.locId, route.kind)] = clone(draft);
    savedConfig = clone(draft);
    dirty = false;
    persist();
    render();
    const location = getLocation(route.locId);
    if (route.kind === "rooms") {
      toast(
        location.rooms.length
          ? `Saved — all ${location.rooms.length} ${spotWord(false).toLowerCase()} QR page${location.rooms.length === 1 ? "" : "s"} now show this content.`
          : `Saved — add a ${spotWord(false).toLowerCase()} QR and this page will appear on it.`,
      );
    } else {
      toast(`Saved — the reception page is updated. ${spotWord(false)} QR pages are unchanged.`);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Customer page markup                                               */
  /* ------------------------------------------------------------------ */

  function renderCartBar() {
    const count = cartCount();
    if (!count) return "";
    return `<div class="cp-cart-bar">
        <span class="cp-cart-info">${icon("cart", 16)} <strong>${count}</strong> item${count === 1 ? "" : "s"} · ${money(cartTotal())}</span>
        <button type="button" class="cp-cart-btn" data-cp-action="cart">View cart ${icon("arrowRight", 14)}</button>
      </div>`;
  }

  function renderServicePanel(bill, participant) {
    const calls = serviceCallsForSpot(bill.locId, bill.code);
    const waiterCall = calls.find((call) => call.kind === "waiter");
    const billCall = calls.find((call) => call.kind === "bill");
    const name = participant && participant.role === "guest" ? participant.name : bill.customerName;
    return `<section class="cp-service-panel" aria-label="Table service">
        <div class="cp-service-head">
          <span class="cp-service-icon">${icon("bell", 17)}</span>
          <div><strong>Your ${spotWord(false).toLowerCase()} is open</strong><span>${esc(name)} · bill #${bill.number} · ${money(bill.total)} so far</span></div>
        </div>
        ${waiterCall ? `<p class="cp-service-live">${icon("check", 12)} Waiter called at ${formatTime(waiterCall.createdAt)} — someone is on the way.</p>` : ""}
        ${billCall ? `<p class="cp-service-live is-bill">${icon("receipt", 12)} Bill requested at ${formatTime(billCall.createdAt)} — waiting for the counter to send it.</p>` : ""}
        ${bill.billSentAt ? `<p class="cp-service-live is-bill">${icon("receipt", 12)} Bill sent at ${formatTime(bill.billSentAt)} — open it from the Bill option below.</p>` : ""}
        <div class="cp-service-actions">
          <button type="button" class="cp-service-btn" data-cp-action="service">
            <span class="cp-service-btn-icon">${icon("bell", 20)}</span>
            <span><strong>Call waiter</strong><span>${waiterCall || billCall ? "A request is already with the counter" : "Waiter or bill — pick next"}</span></span>
          </button>
          <button type="button" class="cp-service-btn" data-cp-action="menu">
            <span class="cp-service-btn-icon">${icon("utensils", 20)}</span>
            <span><strong>Order food</strong><span>Adds to this same bill</span></span>
          </button>
        </div>
      </section>`;
  }

  function renderServiceStrip(bill) {
    const calls = serviceCallsForSpot(bill.locId, bill.code);
    const active = calls[0];
    return `<div class="cp-service-strip ${active ? "is-active" : ""}">
        <span class="cp-service-strip-icon">${icon(active ? "check" : "bell", 15)}</span>
        <div><strong>${active ? serviceKindTitle(active.kind) : "Need something?"}</strong><span>${active ? `Sent at ${formatTime(active.createdAt)} · bill #${bill.number}` : `Bill #${bill.number} · call a waiter or ask for the bill`}</span></div>
        ${active ? "" : `<button type="button" data-cp-action="service">Call waiter</button>`}
      </div>`;
  }

  function renderPaidBillCard(order) {
    const expiresAt = new Date(new Date(order.paidAt).getTime() + PAID_BILL_WINDOW_MS).toISOString();
    return `<section class="cp-paid-bill-card" aria-label="Paid bill">
        <div class="cp-paid-bill-head">
          <span class="cp-paid-bill-icon">${icon("check", 16)}</span>
          <div><strong>Payment received — thank you!</strong><span>Bill #${order.number} is paid. Download it before the window closes.</span></div>
        </div>
        <div class="cp-paid-bill-total"><span>${esc(orderSpotName(order))}</span><strong>${money(order.total)}</strong></div>
        <div class="cp-paid-bill-actions">
          <button type="button" data-cp-action="bill">${icon("receipt", 14)} View & download</button>
          <span data-bill-expires="${expiresAt}">Available for ${billWindowText(paidBillRemaining(order))}</span>
        </div>
      </section>`;
  }

  function renderCustomerBill(order, config, options) {
    const paid = order.status === "completed";
    const rounds = orderRounds(order);
    const payment = order.payment || null;
    const expiresAt = paid && order.paidAt ? new Date(new Date(order.paidAt).getTime() + PAID_BILL_WINDOW_MS).toISOString() : "";
    return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead(paid ? "Your paid bill" : "Your bill", `${esc(orderSpotName(order))} · #${order.number}`, "home")}
        <div class="cp-bill-banner ${paid ? "paid" : "unpaid"}">
          ${icon(paid ? "check" : "receipt", 17)}
          <div><strong>${paid ? "Payment received" : "Bill not paid yet"}</strong><span>${paid ? `Paid ${money(payment ? payment.amount : order.total)}${payment && payment.mode ? ` via ${esc(payment.mode)}` : ""}${order.paidAt ? ` at ${formatTime(order.paidAt)}` : ""}` : "Pay at the counter. This bill updates automatically when the owner closes it."}</span></div>
        </div>
        <div class="cp-bill-paper">
          <div class="cp-bill-brand"><strong>${BUSINESS.name}</strong><span>12 Linking Road, Bandra West, Mumbai</span></div>
          <div class="cp-bill-meta"><span>#${order.number}</span><span>${esc(orderSpotName(order))}</span><span>${formatTime(order.createdAt)}</span></div>
          ${rounds.map((round, index) => `<div class="cp-bill-round"><div class="cp-bill-round-head"><strong>Round ${index + 1}</strong><span>${formatTime(round.at)}${round.by ? ` · ${esc(round.by)}` : ""}</span></div>${round.items.map((item) => `<div class="cp-bill-line"><span>${item.qty}× ${esc(item.name)}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}</div>`).join("")}
          <div class="cp-bill-total"><span>Total <small>taxes included</small></span><strong>${money(order.total)}</strong></div>
          ${paid ? `<div class="cp-bill-paid-line">${icon("check", 12)} Paid${payment && payment.mode ? ` via ${esc(payment.mode)}` : ""}</div>` : ""}
        </div>
        ${paid ? `<div class="cp-bill-window" data-bill-expires="${expiresAt}">Available for ${billWindowText(paidBillRemaining(order))}</div>
          <button type="button" class="cp-bill-download" data-cp-action="download-bill">${icon("download", 15)} Download bill</button>
          <p class="cp-bill-note">Downloads a PDF and takes you to the review. This paid bill closes automatically in 5 minutes.</p>`
          : `<p class="cp-bill-note">This unpaid bill was sent by the counter. Download unlocks after payment. Every round stays on this one bill.</p>
             <button type="button" class="cp-link-btn" data-cp-action="home">Back to session</button>`}
      </div>`;
  }

  function renderCustomerHome(config, options) {
    const preview = Boolean(options && options.preview);
    const ordering = Boolean(options && options.ordering);
    const spotName = options && options.spotName;
    const participant = options && options.participant;
    const buttons = [];
    if (config.menu.on) {
      buttons.push({ action: "menu", iconName: "utensils", label: config.menu.title.trim() || "Menu" });
    }
    if (options && options.openBill && options.openBill.billSentAt) {
      buttons.push({ action: "bill", iconName: "receipt", label: "Bill" });
    }
    if (options && options.paidBill) {
      buttons.push({ action: "bill", iconName: "receipt", label: "Paid bill" });
    }
    if (wifiUnlockedForOrder(options && options.openBill, config)) {
      buttons.push({ action: "wifi", iconName: "wifi", label: "Wi-Fi" });
    }
    if (config.hours.on) buttons.push({ action: "hours", iconName: "clock", label: "Hours and contact" });
    if (config.call.on) buttons.push({ action: "call", iconName: "phone", label: "Call" });
    if (config.directions.on && config.directions.value.trim()) {
      buttons.push({ action: "directions", iconName: "map", label: "Directions" });
    }
    if (config.custom.on && config.custom.label.trim()) {
      buttons.push({ action: "custom", iconName: "link", label: config.custom.label });
    }

    const socials = [];
    if (config.socials.instagram) {
      socials.push({ href: config.socials.instagram, iconName: "instagram", label: "Instagram" });
    }
    if (config.socials.website) {
      socials.push({ href: config.socials.website, iconName: "globe", label: "Website" });
    }

    return `<div class="cp" style="${themeStyle()}">
      ${config.announcement.on && config.announcement.text.trim() ? `<div class="cp-announcement">${esc(clamp(config.announcement.text, 160))}</div>` : ""}
      <div class="cp-logo">${BUSINESS.initials}</div>
      <h1 class="cp-business">${BUSINESS.name}</h1>
      <p class="cp-tagline">${BUSINESS.tagline}</p>
      ${ordering && spotName ? `<div class="cp-spot-chip">${icon("qr", 13)} <span>Ordering for <strong>${esc(spotName)}</strong></span></div>` : ""}
      ${ordering && options && options.openBill ? `<div class="cp-open-bill">${icon("receipt", 15)}<div><strong>${esc(options.openBill.customerName)}'s bill is open</strong><span>${money(options.openBill.total)} so far · anything you add joins this same bill. No name or waiter needed.</span></div></div>` : ""}
      ${ordering && participant && participant.role === "guest" ? `<div class="cp-joined-chip">${icon("users", 13)} <span>You're ordering as <strong>${esc(participant.name)}</strong> · joined with ${esc(options.openBill.customerName)}</span></div>` : ""}

      ${options && options.paidBill ? renderPaidBillCard(options.paidBill) : ""}
      ${ordering && options && options.openBill && options.participant ? renderServicePanel(options.openBill, options.participant) : ""}

      <p class="cp-review-q">How was your experience?</p>
      <div class="cp-review">
        <button type="button" class="cp-thumb" data-cp-action="thumb">
          <span class="cp-ico">${icon("thumbUp", 17)}</span>
          <span><strong>Great</strong><span>Continue on Google or message the owner.</span></span>
        </button>
        <button type="button" class="cp-thumb" data-cp-action="thumb">
          <span class="cp-ico">${icon("thumbDown", 17)}</span>
          <span><strong>Not great</strong><span>Tell the owner privately — we read every message.</span></span>
        </button>
      </div>

      ${buttons.length ? `<div class="cp-grid">${buttons.map((button) => `<button type="button" class="cp-tile" data-cp-action="${button.action}">${icon(button.iconName, 20)}<span>${esc(button.label)}</span></button>`).join("")}</div>` : ""}

      ${socials.length ? `<div class="cp-socials">${socials.map((social) => `<a class="cp-social" href="${esc(social.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(social.label)}">${icon(social.iconName, 16)}</a>`).join("")}</div>` : ""}

      ${ordering && cartCount() ? `<button type="button" class="cp-cart-pill" data-cp-action="cart">${icon("cart", 16)} <span>${cartCount()} item${cartCount() === 1 ? "" : "s"}</span><strong>${money(cartTotal())}</strong>${icon("arrowRight", 14)}</button>` : ""}
      <p class="cp-foot">Powered by Syehere${preview ? " · live preview" : ""}</p>
    </div>`;
  }

  function customerScreenHead(title, sub, backAction) {
    return `<div class="cp-screen-head">
        <button type="button" class="cp-back" data-cp-action="${backAction}" aria-label="Back">${icon("arrowLeft", 16)}</button>
        <div><p class="cp-screen-title">${esc(title)}</p>${sub ? `<p class="cp-screen-sub">${esc(sub)}</p>` : ""}</div>
      </div>`;
  }

  function renderCustomerScreen(screen, config, options) {
    if (screen === "bill") {
      const bill = (options && options.openBill) || (options && options.paidBill);
      if (!bill) return renderCustomerHome(config, options || {});
      if (bill.status !== "completed" && !bill.billSentAt) {
        return renderCustomerHome(config, options || {});
      }
      if (bill.status === "completed" && paidBillRemaining(bill) <= 0) {
        return renderCustomerScreen("chooser", config, options || {});
      }
      return renderCustomerBill(bill, config, options || {});
    }

    if (screen === "chooser") {
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Thank you!", "How would you like to continue?", "home")}
        <div class="cp-choice-intro">
          <h3>Both options help ${BUSINESS.name}</h3>
          <p>Pick whichever feels right. There is no wrong choice — you can always do both.</p>
        </div>
        <div class="cp-choice">
          <button type="button" class="cp-choice-btn" data-cp-action="google">
            <span class="cp-ico">${icon("loyalty", 17)}</span>
            <span><strong>Continue on Google</strong><p>Share your experience publicly in a Google review.</p></span>
          </button>
          <button type="button" class="cp-choice-btn" data-cp-action="contact">
            <span class="cp-ico">${icon("feedback", 17)}</span>
            <span><strong>Contact the owner</strong><p>Send a private message — the owner and our team read every one.</p></span>
          </button>
        </div>
        <p class="cp-note">No wrong choice — you can always do both.</p>
      </div>`;
    }

    if (screen === "google") {
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Google review", "Two ways to do it — pick whichever is easier.", "chooser")}
        <p class="cp-review-q" style="text-align:left">Post a review on Google</p>
        <p class="cp-note" style="text-align:left;margin-top:6px">Opens Google — write whatever feels right.</p>
        <a class="cp-direct-btn" href="${esc(BUSINESS.googleReviewUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:12px">${icon("external", 14)} Post a review on Google</a>
        <p class="cp-review-q" style="text-align:left;margin-top:22px">Want us to write it for you?</p>
        <p class="cp-note" style="text-align:left;margin-top:6px">Answer a few quick questions and we will write a review you can copy and paste on Google.</p>
        <button type="button" class="cp-link-btn" data-cp-action="write">Write it for me</button>
      </div>`;
    }

    if (screen === "feedback") {
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("What's on your mind?", "The owner and our team read every message.", "chooser")}
        <p class="cp-note" style="text-align:left">We appreciate you taking the time to help us improve.</p>
        <textarea class="cp-textarea" id="feedback-message" maxlength="1000" placeholder="Tell the owner what happened…"></textarea>
        <p class="cp-error" id="feedback-error"></p>
        <input class="cp-textarea" style="min-height:0;height:40px;margin-top:8px" id="feedback-email" type="email" placeholder="Email (optional)" />
        <button type="button" class="cp-direct-btn" data-cp-action="submit-feedback" style="margin-top:12px">Send to the owner</button>
      </div>`;
    }

    if (screen === "thanks") {
      return `<div class="cp" style="${themeStyle()}">
        <div class="cp-thanks">
          <div class="cp-thanks-badge">${icon("check", 24)}</div>
          <h3>Thank you!</h3>
          <p>${esc(clamp(config.thankYou, 160) || "We appreciate you taking the time to help us improve.")}</p>
          <button type="button" class="cp-link-btn" data-cp-action="home" style="margin-top:18px">Back to the page</button>
        </div>
      </div>`;
    }

    if (screen === "menu") {
      const ordering = Boolean(options && options.ordering);
      const spotName = options && options.spotName;
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead(config.menu.title.trim() || "Menu", `${spotName ? `${esc(spotName)} · ` : ""}prices include taxes`, "home")}
        ${options && options.openBill && options.participant ? renderServiceStrip(options.openBill) : ""}
        ${MENU.categories
          .map(
            (category) => `<p class="cp-menu-cat">${esc(category.name)}</p>${category.items
              .map((item) => {
                const qty = ordering ? cart.items[item.id] || 0 : 0;
                return `<div class="cp-menu-item cp-menu-order-item">
                  <div class="cp-menu-copy">
                    <div class="cp-menu-item-name">${esc(item.name)}${item.tag ? `<span class="cp-tag">${esc(item.tag)}</span>` : ""}</div>
                    <p class="cp-menu-item-details">${esc(item.details)}</p>
                    <span class="cp-menu-item-price">${money(item.price)}</span>
                  </div>
                  ${
                    ordering
                      ? `<div class="cp-order-control">${
                          qty
                            ? `<div class="cp-qty"><button type="button" data-cp-action="dec-item" data-item="${esc(item.id)}" aria-label="Remove one ${esc(item.name)}">${icon("minus", 12)}</button><span>${qty}</span><button type="button" data-cp-action="add-item" data-item="${esc(item.id)}" aria-label="Add one ${esc(item.name)}">${icon("plus", 12)}</button></div>`
                            : `<button type="button" class="cp-add" data-cp-action="add-item" data-item="${esc(item.id)}">Add</button>`
                        }</div>`
                      : ""
                  }
                </div>`;
              })
              .join("")}`,
          )
          .join("")}
        ${ordering ? renderCartBar() : ""}
        ${ordering ? `<p class="cp-order-note">${icon("bell", 12)} ${options && options.openBill ? `These items are added to ${esc(options.openBill.customerName)}'s open bill — the owner sees them on ${esc(spotName || spotWord(false))}.` : `Your order goes straight to the owner's dashboard, tagged to ${esc(spotName || spotWord(false))}.`}</p>` : ""}
      </div>`;
    }

    if (screen === "cart") {
      const lines = cartLines();
      const spotName = (options && options.spotName) || spotWord(false);
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Your order", `${esc(spotName)} · ${cartCount()} item${cartCount() === 1 ? "" : "s"}`, "menu")}
        ${
          lines.length
            ? `<div class="cp-cart-lines">${lines
                .map(
                  (item) => `<div class="cp-cart-line">
                    <div class="cp-cart-line-main"><strong>${esc(item.name)}</strong><span>${money(item.price)} each</span></div>
                    <div class="cp-qty"><button type="button" data-cp-action="dec-item" data-item="${esc(item.id)}" aria-label="Remove one ${esc(item.name)}">${icon("minus", 12)}</button><span>${item.qty}</span><button type="button" data-cp-action="add-item" data-item="${esc(item.id)}" aria-label="Add one ${esc(item.name)}">${icon("plus", 12)}</button></div>
                    <span class="cp-cart-line-total">${money(item.price * item.qty)}</span>
                  </div>`,
                )
                .join("")}</div>
              <div class="cp-subtotal"><span>Subtotal</span><strong>${money(cartTotal())}</strong></div>
              <p class="cp-note" style="text-align:left">Pay at the ${spotWord(false).toLowerCase()} after your meal. Prices include taxes.</p>
              <button type="button" class="cp-direct-btn" data-cp-action="checkout">Continue to order ${icon("arrowRight", 14)}</button>
              <button type="button" class="cp-link-btn" data-cp-action="menu">Add more items</button>`
            : `<div class="cp-empty-cart">${icon("cart", 26)}<h3>Your cart is empty</h3><p>Add something from the menu to start an order.</p><button type="button" class="cp-direct-btn" data-cp-action="menu">Open the menu</button></div>`
        }
      </div>`;
    }

    if (screen === "checkout") {
      const location = getLocation(route.locId);
      const waiters = location.waiters || [];
      const free = availableWaiters(location.id);
      const spotName = (options && options.spotName) || spotWord(false);
      const openBill = (options && options.openBill) || null;
      const continuing = Boolean(openBill);
      const newTotal = (openBill ? openBill.total : 0) + cartTotal();
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead(continuing ? "Add to the bill" : "Confirm your order", `${esc(spotName)} · ${cartCount()} item${cartCount() === 1 ? "" : "s"} · ${money(cartTotal())}`, "cart")}
        ${checkoutError ? `<p class="cp-error cp-order-error">${esc(checkoutError)}</p>` : ""}
        ${
          continuing
            ? `<div class="cp-bill-continue">
                <div class="cp-bill-continue-head">
                  <span class="cp-bill-icon">${icon("receipt", 16)}</span>
                  <div><strong>${esc(openBill.customerName)}'s open bill</strong><span>#${openBill.number} · ${orderRounds(openBill).length} round${orderRounds(openBill).length === 1 ? "" : "s"} · ${money(openBill.total)} so far</span></div>
                </div>
                <p class="cp-field-note">No need to add your name or pick a waiter again. These items join the same bill, so the kitchen keeps one running tab.</p>
              </div>
              <p class="cp-menu-cat">Adding now</p>
              <div class="cp-order-summary">
                ${cartLines().map((item) => `<div class="cp-summary-item"><span>${item.qty}× ${esc(item.name)}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}
                <div class="cp-subtotal"><span>New bill total</span><strong>${money(newTotal)}</strong></div>
              </div>`
            : `<div class="cp-order-form">
                <label for="order-name">Your name <span>*</span></label>
                <input id="order-name" class="cp-input" data-checkout="name" value="${esc(checkoutDraft.name)}" maxlength="40" placeholder="So the waiter knows who ordered" autocomplete="name" />
                <div class="cp-form-row">
                  <div><label for="order-phone">Phone <span>(optional)</span></label><input id="order-phone" class="cp-input" data-checkout="phone" value="${esc(checkoutDraft.phone)}" maxlength="20" inputmode="tel" placeholder="+91…" autocomplete="tel" /></div>
                  <div><label for="order-guests">Guests</label><select id="order-guests" class="cp-input" data-checkout="guests">${[1, 2, 3, 4, 5, 6, 7, 8].map((count) => `<option value="${count}" ${Number(checkoutDraft.guests) === count ? "selected" : ""}>${count}</option>`).join("")}</select></div>
                </div>
              </div>
              <p class="cp-menu-cat">Who is serving you?</p>
              <p class="cp-field-note">Busy waiters are shown as not available — each waiter can only take the number of ${spotWord(true).toLowerCase()} the owner allows.</p>
              <div class="cp-waiters">
                <button type="button" class="cp-waiter ${checkoutDraft.waiterId === "auto" ? "selected" : ""}" data-cp-action="pick-waiter" data-waiter="auto">
                  <span class="cp-waiter-avatar">${icon("users", 14)}</span>
                  <span class="cp-waiter-main"><strong>Any available waiter</strong><span>${free.length ? `${esc(free[0].name)} is free right now` : "All waiters are at capacity — the counter will assign the next one"}</span></span>
                  <span class="cp-waiter-badge">${free.length ? "Available" : "Waitlist"}</span>
                </button>
                ${waiters
                  .map((waiter) => {
                    const load = waiterLoad(location.id, waiter.id);
                    const full = !waiter.active || load >= waiter.maxTables;
                    return `<button type="button" class="cp-waiter ${checkoutDraft.waiterId === waiter.id ? "selected" : ""} ${full ? "busy" : ""}" data-cp-action="pick-waiter" data-waiter="${waiter.id}" ${full ? "disabled" : ""}>
                      <span class="cp-waiter-avatar">${esc(waiter.name.slice(0, 2).toUpperCase())}</span>
                      <span class="cp-waiter-main"><strong>${esc(waiter.name)}</strong><span>${waiter.active ? `${load} of ${waiter.maxTables} ${spotWord(true).toLowerCase()} · ${full ? "not accepting more" : `${waiter.maxTables - load} free`}` : "Not accepting orders right now"}</span></span>
                      <span class="cp-waiter-badge ${full ? "busy" : ""}">${!waiter.active ? "Paused" : full ? "At capacity" : "Available"}</span>
                    </button>`;
                  })
                  .join("")}
              </div>
              <div class="cp-order-summary">
                ${cartLines().map((item) => `<div class="cp-summary-item"><span>${item.qty}× ${esc(item.name)}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}
                <div class="cp-subtotal"><span>Total</span><strong>${money(cartTotal())}</strong></div>
              </div>`
        }
        <button type="button" class="cp-direct-btn" data-cp-action="place-order">${continuing ? `Add to bill · ${money(newTotal)}` : `Place order · ${money(cartTotal())}`}</button>
        <p class="cp-order-note">${icon("bell", 12)} ${continuing ? `The kitchen gets these extra items and ${esc(openBill.customerName)}'s bill grows to ${money(newTotal)}.` : `The kitchen gets it instantly with your name and ${esc(spotName)}.`}</p>
      </div>`;
    }

    if (screen === "order-done") {
      const order = lastOrder;
      if (!order) return renderCustomerHome(config, options || {});
      const rounds = orderRounds(order);
      const round = lastRound || rounds[rounds.length - 1] || null;
      const added = lastOrderAdded && rounds.length > 1;
      const roundItems = round ? round.items : order.items;
      const roundTotal = round ? round.total : order.total;
      const liveBill = order.code ? findOpenBill(order.locId, order.code) : null;
      const wifiReady = wifiUnlockedForOrder(liveBill, config);
      return `<div class="cp" style="${themeStyle()}">
        <div class="cp-order-success">
          <div class="cp-thanks-badge">${icon("check", 24)}</div>
          <h3>${added ? "Added to the bill" : "Order placed"}</h3>
          <p>${esc(orderSpotName(order))} · ${added ? `${esc(order.customerName)}'s bill #${order.number} · round ${rounds.length}` : `#${order.number} · ${formatTime(order.createdAt)}`}</p>
        </div>
        <div class="cp-done-card">
          <div class="cp-done-row"><span>${spotWord(false)}</span><strong>${esc(orderSpotName(order))}</strong></div>
          <div class="cp-done-row"><span>Name</span><strong>${esc(order.customerName)}</strong></div>
          <div class="cp-done-row"><span>Waiter</span><strong>${esc(waiterName(order.locId, order.waiterId))}</strong></div>
          <div class="cp-done-row"><span>Guests</span><strong>${order.guests}</strong></div>
          ${round ? `<div class="cp-done-row"><span>This round</span><strong>${money(roundTotal)}</strong></div>` : ""}
          <div class="cp-done-row"><span>Status</span><strong class="cp-live-status">With the kitchen</strong></div>
          ${roundItems.map((item) => `<div class="cp-done-row subtle"><span>${item.qty}× ${esc(item.name)}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}
          <div class="cp-done-row total"><span>${added ? "Bill total" : "Total"}</span><strong>${money(order.total)}</strong></div>
        </div>
        <p class="cp-order-note" style="margin-top:12px">${icon("bell", 12)} ${added ? `No new bill was created — these items joined ${esc(order.customerName)}'s open bill and the owner's dashboard rang on ${esc(orderSpotName(order))}.` : `The owner's dashboard just rang with this order and highlighted ${esc(orderSpotName(order))}.`}</p>
        <a class="cp-direct-btn" href="#/orders/${order.locId}" data-nav="#/orders/${order.locId}">See it on the owner dashboard (demo)</a>
        <div class="cp-done-actions">
          <button type="button" class="cp-done-service" data-cp-action="service-waiter">${icon("bell", 19)}<span><strong>Call waiter</strong><span>Ring the counter for ${esc(orderSpotName(order))}</span></span></button>
          <button type="button" class="cp-done-home" data-cp-action="home">${icon("arrowLeft", 16)} Back to home page</button>
        </div>
        ${wifiReady ? `<button type="button" class="cp-link-btn" data-cp-action="wifi">${icon("wifi", 14)} Wi-Fi password</button>` : ""}
        ${liveBill && liveBill.billSentAt ? `<button type="button" class="cp-link-btn" data-cp-action="bill">${icon("receipt", 14)} View bill</button>` : ""}
        <button type="button" class="cp-link-btn" data-cp-action="menu">Order something else</button>
      </div>`;
    }

    if (screen === "service") {
      const location = getLocation(route.locId);
      const room = location.rooms.find((item) => item.code === route.code);
      const bill = room ? findOpenBill(location.id, room.code) : null;
      if (!bill) return renderCustomerHome(config, options || {});
      const calls = serviceCallsForSpot(location.id, room.code);
      const waiterCall = calls.find((call) => call.kind === "waiter");
      const billCall = calls.find((call) => call.kind === "bill");
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Call a waiter", `${esc(room ? displaySpotName(room) : spotWord(false))} · bill #${bill.number} · ${money(bill.total)}`, "home")}
        <p class="cp-note" style="text-align:left">The counter hears a bell and sees your ${spotWord(false).toLowerCase()} on the dashboard. Pick what you need.</p>
        <div class="cp-service-choice">
          <button type="button" class="cp-service-choice-btn" data-cp-action="service-waiter">
            <span class="cp-service-choice-icon">${icon("bell", 21)}</span>
            <span class="cp-service-choice-copy"><strong>Waiter</strong><p>Someone comes to your ${spotWord(false).toLowerCase()}.</p>${waiterCall ? `<em>Already asked at ${formatTime(waiterCall.createdAt)}</em>` : ""}</span>
          </button>
          <button type="button" class="cp-service-choice-btn" data-cp-action="service-bill">
            <span class="cp-service-choice-icon">${icon("receipt", 21)}</span>
            <span class="cp-service-choice-copy"><strong>Bill</strong><p>Bring the bill for ${money(bill.total)}.</p>${billCall ? `<em>Already asked at ${formatTime(billCall.createdAt)}</em>` : ""}</span>
          </button>
        </div>
        <button type="button" class="cp-link-btn" data-cp-action="menu">Order food instead</button>
      </div>`;
    }

    if (screen === "service-sent") {
      const call = lastServiceCall;
      const bill = call ? findOpenBill(call.locId, call.code) : null;
      const isBill = Boolean(call && call.kind === "bill");
      return `<div class="cp" style="${themeStyle()}">
        <div class="cp-service-sent">
          <div class="cp-service-sent-icon ${isBill ? "is-bill" : ""}">${icon(isBill ? "receipt" : "bell", 26)}</div>
          <h3>${isBill ? "Bill requested" : "Waiter called"}</h3>
          <p>${esc(call ? serviceCallSpotName(call) : spotWord(false))}${call ? ` · ${formatTime(call.createdAt)}` : ""}</p>
          <div class="cp-service-sent-note">${icon("bell", 13)} <span>The owner's dashboard just rang${bill ? ` on bill #${bill.number}` : ""} and highlighted ${esc(call ? serviceCallSpotName(call) : spotWord(false))}. ${isBill ? "The waiter is bringing your bill." : "Someone will be with you shortly."}</span></div>
          ${bill && bill.billSentAt ? `<button type="button" class="cp-link-btn" data-cp-action="bill">${icon("receipt", 13)} View bill</button>` : ""}
          <button type="button" class="cp-direct-btn" data-cp-action="menu">Order food</button>
          <button type="button" class="cp-link-btn" data-cp-action="home">Back to the page</button>
        </div>
      </div>`;
    }

    if (screen === "hours") {
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Hours and contact", config.hours.address, "home")}
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="cp-open-pill">Open now</span><span class="cp-screen-sub">Closes 21:00</span></div>
        ${WEEK.map(([day, time]) => `<div class="cp-hours-row"><span>${esc(day)}</span><span>${esc(time)}</span></div>`).join("")}
        <p class="cp-address">${esc(config.hours.address)}<br />${esc(config.hours.phone)}</p>
        <button type="button" class="cp-link-btn" data-cp-action="call" style="margin-top:10px">${icon("phone", 14)} Call</button>
      </div>`;
    }

    if (screen === "wifi") {
      const bill = options && options.openBill;
      if (!wifiUnlockedForOrder(bill, config)) {
        return renderCustomerHome(config, options || {});
      }
      return `<div class="cp" style="${themeStyle()}">
        ${customerScreenHead("Wi-Fi", "Unlocked with your accepted order.", "home")}
        <div class="cp-menu-item" style="border:0;display:block;text-align:center;padding:18px 0">
          <div class="cp-logo" style="width:52px;height:52px;font-size:0">${icon("wifi", 24)}</div>
          <p class="cp-menu-cat" style="margin-top:10px">${esc(config.wifi.ssid)}</p>
          <p class="cp-menu-item-details">Password</p>
          <p class="cp-menu-item-price" style="font-size:18px;margin-top:4px">${esc(config.wifi.password)}</p>
          <button type="button" class="cp-link-btn" data-cp-action="copy-wifi" style="margin-top:12px">Copy password</button>
          <p class="cp-note" style="margin-top:12px">${icon("lock", 11)} Shared only with guests whose order was accepted.</p>
        </div>
      </div>`;
    }

    return renderCustomerHome(config, options || {});
  }

  /* ------------------------------------------------------------------ */
  /* Host-approved table joining                                        */
  /* ------------------------------------------------------------------ */

  function renderJoinBillSummary(order) {
    const rounds = orderRounds(order).length;
    return `<div class="cp-join-bill">
        <span class="cp-join-bill-icon">${icon("receipt", 16)}</span>
        <div><strong>${esc(order.customerName)}'s open bill</strong><span>#${order.number} · ${rounds} round${rounds === 1 ? "" : "s"} · ${money(order.total)} so far</span></div>
      </div>`;
  }

  function renderJoinForm(order, room, note, prefill) {
    const hostName = order.customerName || "the host";
    return `<div class="cp cp-join-gate" style="${themeStyle()}">
        <div class="cp-join-icon">${icon("users", 22)}</div>
        <p class="cp-join-kicker">${esc(displaySpotName(room))} · open bill</p>
        <h2 class="cp-join-title">Join ${esc(hostName)}'s table</h2>
        <p class="cp-join-sub">${note || `${esc(hostName)} needs to approve your phone before you can order. Nothing is added to the bill until you are in.`}</p>
        ${renderJoinBillSummary(order)}
        <label class="cp-join-label" for="join-name">Your name</label>
        <input id="join-name" class="cp-input" data-join-name maxlength="40" value="${esc(joinNameDraft || prefill || "")}" placeholder="e.g. Rahul" autocomplete="name" />
        <button type="button" class="cp-direct-btn" data-cp-action="join-request">Ask ${esc(hostName)} to join</button>
        <p class="cp-join-note">${icon("lock", 12)} ${esc(hostName)} will see your name, then approve or deny. If approved, a 6-digit code appears on their phone and you enter it here.</p>
      </div>`;
  }

  function renderJoinGate(room, order, request) {
    const status = effectiveJoinStatus(request);
    const hostName = order.customerName || "the host";

    if (status === "pending") {
      return `<div class="cp cp-join-gate" style="${themeStyle()}">
        <div class="cp-join-icon pending">${icon("clock", 22)}</div>
        <p class="cp-join-kicker">Waiting for approval</p>
        <h2 class="cp-join-title">Request sent to ${esc(hostName)}</h2>
        <p class="cp-join-sub">Keep this page open. ${esc(hostName)} has two minutes to approve your phone.</p>
        ${renderJoinBillSummary(order)}
        <div class="cp-join-status"><span class="live-dot"></span> Waiting for ${esc(hostName)}...</div>
        <p class="cp-join-timer" data-join-expires="${request.expiresAt}" data-join-prefix="Request expires in " data-join-expired="Request expired">Request expires in ${joinCountdownText(request.expiresAt)}</p>
        <button type="button" class="cp-link-btn" data-cp-action="join-cancel">Cancel request</button>
      </div>`;
    }

    if (status === "approved") {
      return `<div class="cp cp-join-gate" style="${themeStyle()}">
        <div class="cp-join-icon success">${icon("check", 22)}</div>
        <p class="cp-join-kicker">Approved by ${esc(hostName)}</p>
        <h2 class="cp-join-title">Ask ${esc(hostName)} for the code</h2>
        <p class="cp-join-sub">${esc(hostName)} approved your phone. Enter the 6-digit code shown on their phone.</p>
        ${renderJoinBillSummary(order)}
        <label class="cp-join-label" for="join-code">6-digit code</label>
        <input id="join-code" class="cp-input cp-join-code-input" data-join-code inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" />
        <p class="cp-join-error" id="join-code-error">${esc(joinCodeError)}</p>
        <button type="button" class="cp-direct-btn" data-cp-action="join-verify">Join table</button>
        <p class="cp-join-timer" data-join-expires="${request.codeExpiresAt}" data-join-prefix="Code expires in " data-join-expired="Code expired">Code expires in ${joinCountdownText(request.codeExpiresAt)}</p>
        <p class="cp-join-note">${icon("lock", 12)} The code is single-use. You have ${request.maxAttempts} attempts.</p>
        <button type="button" class="cp-link-btn" data-cp-action="join-cancel">Cancel request</button>
      </div>`;
    }

    if (status === "locked") {
      return `<div class="cp cp-join-gate" style="${themeStyle()}">
        <div class="cp-join-icon danger">${icon("lock", 22)}</div>
        <p class="cp-join-kicker">Code locked</p>
        <h2 class="cp-join-title">Too many wrong codes</h2>
        <p class="cp-join-sub">Ask ${esc(hostName)} to issue a new code, or ask a waiter to verify you at the table.</p>
        ${renderJoinBillSummary(order)}
        <button type="button" class="cp-link-btn" data-cp-action="join-cancel">Cancel request</button>
      </div>`;
    }

    if (status === "expired") {
      const codeExpired = request && request.status === "approved";
      return `<div class="cp cp-join-gate" style="${themeStyle()}">
        <div class="cp-join-icon danger">${icon("clock", 22)}</div>
        <p class="cp-join-kicker">${codeExpired ? "Code expired" : "Request expired"}</p>
        <h2 class="cp-join-title">${codeExpired ? "Ask for a new code" : "Ask again to join"}</h2>
        <p class="cp-join-sub">${codeExpired ? `The 6-digit code expired. ${esc(hostName)} can issue a new one from their phone.` : `The request timed out. Ask ${esc(hostName)} again, or ask a waiter for help.`}</p>
        ${renderJoinBillSummary(order)}
        ${codeExpired ? "" : `<button type="button" class="cp-direct-btn" data-cp-action="join-request">Ask ${esc(hostName)} again</button>`}
        <button type="button" class="cp-link-btn" data-cp-action="join-cancel">Cancel request</button>
      </div>`;
    }

    if (status === "denied") {
      return renderJoinForm(order, room, `${hostName} declined this request. You can ask again, or ask a waiter to help.`, request.name);
    }

    return renderJoinForm(order, room, status === "cancelled" ? "That request was cancelled. Ask again when you are ready." : "", request && request.name);
  }

  function renderHostJoinRequest(request) {
    return `<div class="cp-host-request">
        <span class="cp-host-avatar">${esc(joinInitials(request.name))}</span>
        <div class="cp-host-request-main">
          <strong>${esc(request.name)} wants to join</strong>
          <span>New device · ${formatTime(request.createdAt)}</span>
          <span class="cp-join-timer" data-join-expires="${request.expiresAt}" data-join-prefix="Request expires in " data-join-expired="Request expired">Request expires in ${joinCountdownText(request.expiresAt)}</span>
        </div>
        <div class="cp-host-request-actions">
          <button type="button" class="cp-approve-btn" data-cp-action="join-approve" data-request="${request.id}">Approve</button>
          <button type="button" class="cp-deny-btn" data-cp-action="join-deny" data-request="${request.id}">Deny</button>
        </div>
      </div>`;
  }

  function renderHostJoinCode(request) {
    const status = effectiveJoinStatus(request);
    const expired = status === "expired";
    const locked = request.status === "locked";
    const digits = String(request.joinCode || "------")
      .split("")
      .map((digit) => `<span>${esc(digit)}</span>`)
      .join("");
    return `<div class="cp-host-code ${expired || locked ? "is-expired" : ""}">
        <div class="cp-host-code-head">
          <div><strong>${esc(request.name)}'s join code</strong><span>${locked ? "Too many wrong attempts" : expired ? "Code expired" : "Read this code to them"}</span></div>
          ${icon("lock", 14)}
        </div>
        <div class="cp-code-digits">${digits}</div>
        ${expired || locked ? `<p class="cp-code-meta">Issue a fresh code to continue.</p>` : `<p class="cp-code-meta" data-join-expires="${request.codeExpiresAt}" data-join-prefix="Expires in " data-join-expired="Code expired">Expires in ${joinCountdownText(request.codeExpiresAt)}</p>`}
        ${request.attempts ? `<p class="cp-code-meta">${request.attempts} of ${request.maxAttempts} wrong attempts used.</p>` : ""}
        <div class="cp-host-code-actions">
          <button type="button" class="cp-host-mini" data-cp-action="join-regenerate" data-request="${request.id}">New code</button>
          <button type="button" class="cp-host-mini ghost" data-cp-action="join-deny" data-request="${request.id}">Cancel</button>
        </div>
      </div>`;
  }

  function renderHostJoinPanel(order, participant) {
    const guestUrl = pageUrl(getLocation(order.locId), order.code);
    const requests = joinRequestsForOrder(order).filter((request) => {
      const status = effectiveJoinStatus(request);
      return status === "pending" || status === "approved" || status === "locked" || (request.status === "approved" && status === "expired");
    });
    const pending = requests.filter((request) => effectiveJoinStatus(request) === "pending");
    const codes = requests.filter((request) => request.status === "approved" || request.status === "locked");
    const roster = participantsOf(order);
    return `<section class="cp-host-panel" style="${themeStyle()}" aria-label="Host join approvals">
        <div class="cp-host-panel-head">
          <div>
            <span class="cp-host-badge">${icon("lock", 11)} Host phone · ${esc(participant.name)}</span>
            <p>Approve new phones, then read them the 6-digit code.</p>
          </div>
          <a class="cp-host-guest-btn" href="${esc(guestUrl)}" target="_blank" rel="noopener">Open guest view</a>
        </div>
        <div class="cp-host-roster">${roster.map((person) => `<span class="cp-roster-chip ${person.role === "host" ? "host" : ""}">${person.role === "host" ? icon("lock", 10) : icon("users", 10)} ${esc(person.name)}</span>`).join("")}</div>
        ${pending.length ? pending.map(renderHostJoinRequest).join("") : ""}
        ${codes.length ? codes.map(renderHostJoinCode).join("") : ""}
        ${!pending.length && !codes.length ? `<p class="cp-host-empty">No one is waiting. Tap “Open guest view” to simulate Rahul’s phone in a new tab.</p>` : ""}
        <p class="cp-host-foot">Demo only: both tabs share this browser's demo data. On real phones this arrives over the server.</p>
      </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Public scan page                                                   */
  /* ------------------------------------------------------------------ */

  function renderScan() {
    const context = currentScanContext();
    const { location, room, isReception, kind, config } = context;
    const known = isReception || room;
    const active = isReception || (room && room.active);
    const code = isReception ? "reception" : room ? room.code : route.code;
    const url = pageUrl(location, code);

    const otherRooms = location.rooms.filter((item) => item.active).length;
    if (room) ensureCart();
    const deviceId = currentDeviceId();
    const openBill = room ? findOpenBill(location.id, room.code) : null;
    const paidBill = room && !openBill ? recentPaidBill(location.id, room.code, deviceId) : null;
    const participant = openBill ? resolveScanParticipation(openBill) : null;
    const joinRequest = openBill ? latestJoinRequestForDevice(openBill, deviceId) : null;
    const customerOptions = {
      spotName: room ? displaySpotName(room) : "Reception",
      ordering: Boolean(room),
      openBill,
      participant,
      paidBill,
    };

    let body = "";
    if (!known) {
      body = renderScanUnavailable(`This link isn't linked to a ${spotWord(false).toLowerCase()}`, `The QR may belong to a ${spotWord(false).toLowerCase()} that was removed, or the link was typed incorrectly.`, location);
    } else if (!active) {
      body = renderScanUnavailable(`This ${spotWord(false).toLowerCase()} QR isn't available right now`, `The link is still reserved for this ${spotWord(false).toLowerCase()}. Re-activate it from ${spotWord(true)} to turn the page back on.`, location);
    } else {
      let screen = "";
      if (openBill && !participant) {
        screen = renderJoinGate(room, openBill, joinRequest);
      } else {
        const base =
          publicScreen === "home"
            ? renderCustomerHome(config, customerOptions)
            : renderCustomerScreen(publicScreen, config, customerOptions);
        screen = participant && participant.role === "host" ? renderHostJoinPanel(openBill, participant) + base : base;
      }
      body = `<div class="scan-page-card">${screen}</div>`;
    }

    const footnote = known && active
      ? room
        ? `<p class="scan-footnote"><strong>${esc(room.code.toUpperCase())} · ${esc(displaySpotName(room))}</strong> — this is the shared ${spotWord(true)} page for ${esc(location.name)}. The other ${Math.max(otherRooms - 1, 0)} ${spotWord(false).toLowerCase()} QR${otherRooms - 1 === 1 ? "" : "s"} here show exactly the same page, but orders are tagged to ${esc(displaySpotName(room))}.</p>`
        : `<p class="scan-footnote"><strong>Reception QR</strong> — this page is separate from the ${spotWord(true)} pages. Editing it never changes a ${spotWord(false).toLowerCase()} QR.</p>`
      : "";

    lastScanSignature = scanSignature();
    return `<div class="scan-view" style="${themeStyle()}">
      ${renderScanBar(location, room, kind, url)}
      <div class="scan-stage">
        ${body}
        ${footnote}
      </div>
    </div>`;
  }

  function renderScanBar(location, room, kind, url) {
    const otherCode = room ? "reception" : location.rooms.find((item) => item.active)?.code || null;
    const otherLabel = room ? "View reception page" : `View a ${spotWord(false).toLowerCase()} QR`;
    const otherHref = otherCode
      ? `#/scan/${location.id}/${otherCode}`
      : `#/locations/${location.id}/rooms`;
    const editHref = `#/customer-page/${location.id}/${kind}`;
    const backHref = `#/locations/${location.id}/rooms`;
    return `<div class="scan-bar">
        <a class="scan-back" href="${backHref}" data-nav="${backHref}">${icon("arrowLeft", 15)} Back to demo</a>
        <span class="badge ${room ? "blue" : "green"}">${room ? `${spotWord(false)} QR · ${esc(room.code.toUpperCase())}` : "Reception QR"}</span>
        <span class="scan-bar-title">${esc(room ? `${displaySpotName(room)} · ${location.name}` : location.name)}</span>
        <span class="spacer"></span>
        <button type="button" class="btn btn-outline" data-action="copy-link" data-copy="${esc(url)}">Copy link</button>
        <a class="btn btn-outline" href="${editHref}" data-nav="${editHref}">Edit ${room ? spotWord(true) : "reception"} page</a>
        <a class="btn btn-outline" href="${otherHref}" data-nav="${otherHref}">${otherLabel}</a>
      </div>`;
  }

  function renderScanUnavailable(title, text, location) {
    const backHref = `#/rooms/${location.id}`;
    return `<div class="scan-page-card"><div class="cp" style="${themeStyle()}"><div class="scan-unavailable">
        <h1>${esc(title)}</h1>
        <p>${esc(text)}</p>
        <a class="cp-link-btn" href="${backHref}" data-nav="${backHref}" style="max-width:220px;margin-top:16px">Back to ${spotWord(true)}</a>
      </div></div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Modals                                                             */
  /* ------------------------------------------------------------------ */

  function openModal(html, wide, variant) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-overlay"><div class="modal ${wide ? "wide" : ""} ${variant || ""}" role="dialog" aria-modal="true">${html}</div></div>`;
    const input = root.querySelector("input, textarea");
    if (input && variant !== "bill-modal" && variant !== "punch-modal") {
      setTimeout(() => {
        input.focus();
        if (input.select) input.select();
      }, 30);
    }
  }

  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
    modalQr = null;
    punchDraft = null;
  }

  function openAddRoomModal(locationId) {
    const location = getLocation(locationId);
    if (location.rooms.length >= 12) {
      toast("Demo limit: 12 room QRs per location.");
      return;
    }
    const nextCode = nextRoomCode(location);
    const nextName = `${spotWord(false)} ${location.rooms.length + 1}`;
    openModal(`<div class="modal-head">
        <div><p class="modal-title">Add ${spotWord(false).toLowerCase()} QR</p><p class="modal-sub">A new ${spotWord(false).toLowerCase()} gets its own permanent QR, link and live order feed.</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="banner banner-blue" style="margin-bottom:14px">
          ${icon("sparkles", 15)}
          <div>It shares the ${spotWord(true)} page with every other ${spotWord(false).toLowerCase()} at ${esc(location.name)}. Editing that page updates this QR too — orders stay separate per ${spotWord(false).toLowerCase()}.</div>
        </div>
        <div class="field">
          <label for="new-room-name">${spotWord(false)} name</label>
          <input id="new-room-name" class="input" maxlength="40" value="${esc(nextName)}" />
          <span class="field-hint">Customers see this name at checkout, and every order is tagged with it.</span>
        </div>
        <div class="field" style="margin-top:12px">
          <label>Permanent link code</label>
          <div><span class="code-pill">${esc(nextCode.toUpperCase())}</span></div>
          <span class="field-hint">Assigned when you create the QR. It never changes.</span>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="create-room" data-loc="${location.id}">Create QR</button>
      </div>`);
  }

  function openRenameModal(locationId, code) {
    const location = getLocation(locationId);
    const room = location.rooms.find((item) => item.code === code);
    if (!room) return;
    openModal(`<div class="modal-head">
        <div><p class="modal-title">Rename ${spotWord(false).toLowerCase()}</p><p class="modal-sub">The QR, link and past orders stay exactly the same.</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="rename-room-name">${spotWord(false)} name</label>
          <input id="rename-room-name" class="input" maxlength="40" value="${esc(room.name)}" />
          <span class="field-hint">Code ${esc(room.code.toUpperCase())} · /r/${esc(location.slug)}/${esc(room.code)}</span>
          <span class="cp-error" id="rename-error" style="font-size:11px"></span>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="rename-save" data-loc="${location.id}" data-code="${room.code}">Save name</button>
      </div>`);
  }

  function openQrModal(locationId, code) {
    const location = getLocation(locationId);
    const room = location.rooms.find((item) => item.code === code);
    const url = pageUrl(location, code);
    const svg = qrSvg(url);
    modalQr = { url, svg, filename: `syehere-${location.slug}-${code}.svg` };
    openModal(
      `<div class="modal-head">
        <div><p class="modal-title">${esc(room ? room.name : "Reception QR")}</p><p class="modal-sub">${esc(location.name)} · permanent code ${esc(code.toUpperCase())}</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="qr-modal-art">${svg}</div>
        <p class="qr-modal-url">${esc(url)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-action="copy-link" data-copy="${esc(url)}">${icon("copy", 15)} Copy link</button>
          <button type="button" class="btn btn-primary" data-action="download-qr">${icon("download", 15)} Download SVG</button>
        </div>
        <p class="modal-note">Print this once. Renaming the ${spotWord(false).toLowerCase()} keeps the QR working; pausing it keeps the code reserved.</p>
      </div>`,
      true,
    );
  }

  function roundViaLabel(via) {
    return (
      {
        customer: "Customer QR",
        reorder: "Added to the same bill",
        punch: "Punched by staff",
        simulated: "Simulated",
        seed: "Demo order",
      }[via] || "Customer QR"
    );
  }

  function openBillModal(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;
    const rounds = orderRounds(order);
    const payment = order.payment || null;
    const paid = order.status === "completed";
    const canPay = activeStatus(order.status);
    const canSendToPhone = canPay && Boolean(order.code);
    const billSent = Boolean(order.billSentAt);
    const billDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    openModal(
      `<div class="modal-head">
        <div><p class="modal-title">Invoice · ${esc(orderSpotName(order))}</p><p class="modal-sub">#${order.number} · ${esc(order.customerName)}${order.phone ? ` · ${esc(order.phone)}` : ""} · ${formatTime(order.createdAt)}</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="invoice-paper" id="invoice-paper">
          <div class="invoice-brand">
            <div><strong>${BUSINESS.name}</strong><span>12 Linking Road, Bandra West, Mumbai</span><span>GSTIN 27ABCDE1234F1Z5 · FSSAI 1234567890123</span></div>
            <span class="invoice-title">INVOICE</span>
          </div>
          <div class="invoice-meta">
            <div><span>Bill</span><strong>#${order.number}</strong></div>
            <div><span>Date</span><strong>${billDate} · ${formatTime(order.createdAt)}</strong></div>
            <div><span>${order.code ? spotWord(false) : "Type"}</span><strong>${esc(orderSpotName(order))}</strong></div>
            <div><span>Guests</span><strong>${order.guests}</strong></div>
            <div><span>Customer</span><strong>${esc(order.customerName)}</strong></div>
            <div><span>Phone</span><strong>${esc(order.phone || "—")}</strong></div>
            <div><span>Served by</span><strong>${esc(waiterName(order.locId, order.waiterId))}</strong></div>
            ${order.participants && order.participants.length > 1 ? `<div><span>Joined phones</span><strong>${order.participants.map((person) => esc(person.name)).join(" · ")}</strong></div>` : ""}
            <div><span>Payment</span><strong>${paid ? "Paid" : order.status === "cancelled" ? "No charge" : "Unpaid"}</strong></div>
          </div>
          <div class="invoice-lines">
            <div class="invoice-line invoice-line-head"><span>Item</span><span>Qty</span><span>Rate</span><span>Amount</span></div>
            ${order.items.map((item) => `<div class="invoice-line"><span>${esc(item.name)}</span><span>${item.qty}</span><span>${money(item.price)}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}
          </div>
          <div class="invoice-rounds">
            <p class="invoice-rounds-title">Order rounds <span>${rounds.length}</span></p>
            ${rounds.map((round, index) => `<div class="invoice-round">
              <div class="invoice-round-head"><strong>Round ${index + 1}</strong><span>${formatTime(round.at)} · ${round.by && round.by !== order.customerName ? `Added by ${esc(round.by)}` : roundViaLabel(round.via)}</span><b>${money(round.total)}</b></div>
              <p>${round.items.map((item) => `${item.qty}× ${esc(item.name)}`).join(" · ")}</p>
            </div>`).join("")}
          </div>
          <div class="invoice-total"><span>Total <small>taxes included</small></span><strong>${money(order.total)}</strong></div>
          ${paid ? `<p class="invoice-paid">${icon("check", 13)} Paid ${money(payment ? payment.amount : order.total)}${payment && payment.mode ? ` via ${esc(payment.mode)}` : ""}${order.paidAt ? ` · ${formatTime(order.paidAt)}` : ""}</p>` : ""}
          <p class="invoice-thanks">Thank you for dining with us.</p>
        </div>

        <div class="invoice-actions">
          <button type="button" class="btn btn-outline" data-action="print-bill">${icon("printer", 15)} Print invoice</button>
          <button type="button" class="btn btn-outline" data-action="close-modal">Done</button>
        </div>

        ${
          canSendToPhone
            ? `<div class="bill-send">
                <div class="bill-section-head"><strong>${billSent ? "Bill sent to the customer" : "Send the bill to the customer"}</strong><span>${billSent ? `Sent at ${formatTime(order.billSentAt)}. The customer sees the unpaid bill on their phone; download unlocks after payment.` : "The customer cannot see the bill until you send it. Send it here, then take payment and close the bill."}</span></div>
                <button type="button" class="btn btn-primary" data-action="send-bill-phone" data-id="${order.id}">${icon("receipt", 14)} ${billSent ? "Send bill again" : "Send bill to phone"}</button>
              </div>`
            : ""
        }

        <div class="bill-email">
          <div class="bill-section-head"><strong>Email the bill</strong><span>${order.emailedTo ? `Last sent to ${esc(order.emailedTo)} · ${formatTime(order.emailedAt)}` : "Send a copy to the customer."}</span></div>
          <div class="bill-email-row">
            <input id="bill-email" class="input" type="email" value="${esc(order.emailedTo || "")}" placeholder="customer@example.com" autocomplete="email" />
            <button type="button" class="btn btn-primary" data-action="send-bill" data-id="${order.id}">${icon("mail", 14)} Send</button>
          </div>
          <p class="bill-error" id="bill-email-error"></p>
          <p class="modal-note" style="text-align:left">Concept demo: email delivery is simulated in the browser; nothing leaves this page.</p>
        </div>

        ${
          canPay
            ? `<div class="bill-payment">
                <div class="bill-section-head"><strong>Payment received?</strong><span>Enter the exact bill total to verify. This closes the bill and frees the ${spotWord(false).toLowerCase()} and waiter.</span></div>
                <div class="bill-payment-row">
                  <select id="bill-payment-mode" class="select" aria-label="Payment method"><option>Cash</option><option>UPI</option><option>Card</option></select>
                  <input id="bill-payment-amount" class="input" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Enter amount received" />
                  <button type="button" class="btn btn-primary" data-action="verify-payment" data-id="${order.id}">Verify & close</button>
                </div>
                <p class="bill-error" id="bill-payment-error"></p>
                <p class="modal-note" style="text-align:left">The bill can only be closed with the exact total of ${money(order.total)}.</p>
              </div>`
            : order.status === "cancelled"
              ? `<div class="bill-closed">Cancelled — no charge. This bill is closed.</div>`
              : `<div class="bill-closed success">${icon("check", 14)} This bill is paid and closed. The table and waiter are free.</div>`
        }
      </div>`,
      true,
      "bill-modal",
    );
  }

  function sendBillToPhone(orderId) {
    refreshFreshState();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;
    if (!order.code) {
      toast("Direct punch bills have no customer session to send to.");
      return;
    }
    if (!activeStatus(order.status)) {
      toast("This bill is already closed — start a new order instead.");
      return;
    }
    const now = new Date().toISOString();
    const sentBefore = Boolean(order.billSentAt);
    order.billSentAt = now;
    order.updatedAt = now;
    (state.serviceCalls || []).forEach((call) => {
      if (
        call &&
        call.status === "open" &&
        call.locId === order.locId &&
        call.code === order.code &&
        call.kind === "bill"
      ) {
        call.status = "done";
        call.resolvedAt = now;
      }
    });
    persist();
    const modalOpen = Boolean(document.querySelector("#modal-root .modal.bill-modal"));
    if (modalOpen) openBillModal(order.id);
    else render();
    toast(
      `${sentBefore ? "Bill sent again" : "Bill sent"} to ${order.customerName}'s phone — ${money(order.total)}.`,
    );
  }

  function sendBill(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;
    const input = document.getElementById("bill-email");
    const error = document.getElementById("bill-email-error");
    const email = input ? input.value.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (error) error.textContent = "Enter a valid email address, like customer@example.com.";
      if (input) input.focus();
      return;
    }
    order.emailedTo = email.slice(0, 120);
    order.emailedAt = new Date().toISOString();
    persist();
    openBillModal(order.id);
    toast(`Bill #${order.number} sent to ${order.emailedTo} (demo).`);
  }

  function verifyPayment(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || !activeStatus(order.status)) return;
    const input = document.getElementById("bill-payment-amount");
    const mode = document.getElementById("bill-payment-mode");
    const error = document.getElementById("bill-payment-error");
    const amount = Number(String(input ? input.value : "").replace(/,/g, ""));
    if (!Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(Number(order.total) * 100)) {
      if (error) {
        error.textContent = `That doesn't match the bill total of ${money(order.total)}. Enter the exact amount to close.`;
      }
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }
    const now = new Date().toISOString();
    order.status = "completed";
    order.paidAt = now;
    order.payment = { amount, mode: mode ? mode.value : "Cash", at: now };
    order.updatedAt = now;
    persist();
    closeModal();
    render();
    toast(`Payment verified — ${money(amount)} received. #${order.number} closed and ${orderSpotName(order)} is free.`);
  }

  function setOrderStatus(orderId, status) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || ["preparing", "served", "completed", "cancelled"].indexOf(status) === -1) return;
    const now = new Date().toISOString();
    const acceptedNow = status === "preparing" && !order.acceptedAt;
    if (acceptedNow) order.acceptedAt = now;
    if (status === "completed" && !order.paidAt) order.paidAt = now;
    order.status = status;
    order.updatedAt = now;
    persist();
    render();
    if (status === "cancelled") {
      toast(`Order #${order.number} cancelled — no charge.`);
    } else if (status === "completed") {
      toast(
        `#${order.number} completed — ${orderSpotName(order)} is free and ${waiterName(order.locId, order.waiterId)} has a slot again.`,
      );
    } else if (acceptedNow && order.code && supportsOrderWifi()) {
      const wifi = getConfig(order.locId, "rooms").wifi;
      toast(
        wifi && wifi.on
          ? `Order accepted — Wi-Fi is now visible on ${orderSpotName(order)}.`
          : `Order #${order.number} accepted — the kitchen is preparing it.`,
      );
    } else {
      toast(`Order #${order.number} · ${statusLabel(status)}.`);
    }
  }

  function simulateOrder(locId) {
    const location = getLocation(locId);
    const rooms = location.rooms.filter((room) => room.active);
    if (!rooms.length) {
      toast(`Add an active ${spotWord(false).toLowerCase()} QR first.`);
      return;
    }
    const busyCodes = new Set(
      todayOrders(location.id)
        .filter((order) => activeStatus(order.status))
        .map((order) => order.code),
    );
    const quietRooms = rooms.filter((room) => !busyCodes.has(room.code));
    const pool = quietRooms.length ? quietRooms : rooms;
    const room = pool[Math.floor(Math.random() * pool.length)];
    const names = ["Ishaan", "Nisha", "Vikram", "Tara", "Arjun", "Priya"];
    const name = names[Math.floor(Math.random() * names.length)];
    const ids = Object.keys(MENU_ITEMS);
    const chosen = [];
    const count = 1 + Math.floor(Math.random() * 2);
    while (chosen.length < count) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!chosen.some((item) => item.id === id)) {
        chosen.push({ ...MENU_ITEMS[id], qty: 1 + Math.floor(Math.random() * 2) });
      }
    }
    const free = availableWaiters(location.id);
    const waiter = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    const order = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      number: nextOrderNumber(),
      locId: location.id,
      code: room.code,
      customerName: name,
      phone:
        Math.random() > 0.6
          ? `+9198${Math.floor(10000000 + Math.random() * 89999999)}`
          : "",
      guests: 1 + Math.floor(Math.random() * 4),
      waiterId: waiter ? waiter.id : null,
      items: chosen.map((item) => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      total: orderItemsTotal(chosen),
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "simulated",
    };
    order.billId = order.id;
    order.rounds = [
      {
        id: `${order.id}_r1`,
        at: order.createdAt,
        items: order.items.map((item) => ({ ...item })),
        total: order.total,
        via: "simulated",
      },
    ];
    state.orders.push(order);
    persist();
    knownOrderIds.add(order.id);
    knownRoundIds.add(order.rounds[0].id);
    startAlertRing();
    showOrderAlert(order, false, order.rounds[0]);
    toast(`New order · ${displaySpotName(room)} · ${money(order.total)} from ${order.customerName}`);
    render();
  }

  function punchLines() {
    if (!punchDraft) return [];
    return Object.keys(punchDraft.items)
      .filter((id) => punchDraft.items[id] > 0 && MENU_ITEMS[id])
      .map((id) => ({ ...MENU_ITEMS[id], qty: punchDraft.items[id] }));
  }

  function punchTotal() {
    return punchLines().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function punchCount() {
    return punchLines().reduce((sum, item) => sum + item.qty, 0);
  }

  function openPunchModal(locId, code) {
    const location = getLocation(locId);
    punchDraft = {
      locId: location.id,
      code: code || "",
      items: {},
      name: "",
      phone: "",
      guests: 2,
      waiterId: "",
    };
    openModal(renderPunchModal(location), true, "punch-modal");
  }

  function renderPunchModal(location) {
    const selectedCode = punchDraft.code || "";
    const openBill = selectedCode ? findOpenBill(location.id, selectedCode) : null;
    const selectedRoom = selectedCode ? location.rooms.find((room) => room.code === selectedCode) : null;
    const waiters = location.waiters || [];
    return `<div class="modal-head">
        <div><p class="modal-title">Punch order</p><p class="modal-sub">${esc(location.name)} · staff-entered, no customer scan needed.</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="banner banner-blue" style="margin-bottom:12px">
          ${icon("sparkles", 15)}
          <div>A table punch joins that table's open bill. A <strong>direct punch</strong> has no table and appears under “Direct punch” in Orders and Analytics.</div>
        </div>
        <div class="field">
          <label for="punch-spot">Add to</label>
          <select id="punch-spot" class="select" data-punch-spot>
            <option value="">Direct punch — no table</option>
            ${location.rooms
              .map((room) => `<option value="${room.code}" ${room.code === selectedCode ? "selected" : ""}>${esc(displaySpotName(room))} · ${esc(room.code.toUpperCase())}</option>`)
              .join("")}
          </select>
          <span class="field-hint">${openBill ? `Adds to ${esc(openBill.customerName)}'s open bill #${openBill.number} — no new bill.` : selectedRoom ? `Starts a new bill at ${esc(displaySpotName(selectedRoom))}.` : "No table is attached to this bill."}</span>
        </div>

        <p class="punch-heading">Choose items</p>
        <div class="punch-menu">
          ${MENU.categories
            .map(
              (category) => `<p class="punch-cat">${esc(category.name)}</p>${category.items
                .map((item) => {
                  const qty = punchDraft.items[item.id] || 0;
                  return `<div class="punch-item">
                    <div class="punch-item-copy"><strong>${esc(item.name)}</strong><span>${money(item.price)}</span></div>
                    <div class="punch-item-control">
                      ${qty ? `<button type="button" class="punch-step" data-action="punch-dec" data-item="${esc(item.id)}" aria-label="Remove one ${esc(item.name)}">${icon("minus", 12)}</button><span class="punch-qty">${qty}</span>` : ""}
                      <button type="button" class="${qty ? "punch-step" : "punch-add"}" data-action="punch-add" data-item="${esc(item.id)}" aria-label="Add one ${esc(item.name)}">${qty ? icon("plus", 12) : "Add"}</button>
                    </div>
                  </div>`;
                })
                .join("")}`,
            )
            .join("")}
        </div>
        <div class="punch-total"><span>${punchCount()} item${punchCount() === 1 ? "" : "s"}</span><strong>${money(punchTotal())}</strong></div>

        ${
          openBill
            ? `<div class="punch-bill-note">${icon("receipt", 15)}<div><strong>${esc(openBill.customerName)}'s bill</strong><span>#${openBill.number} · ${money(openBill.total)} before this round · ${esc(waiterName(openBill.locId, openBill.waiterId))}</span></div></div>`
            : `<div class="punch-fields">
                <div class="field"><label for="punch-name">Customer name <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="punch-name" class="input" data-punch-field="name" value="${esc(punchDraft.name)}" maxlength="40" placeholder="Walk-in" /></div>
                <div class="field"><label for="punch-phone">Phone <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="punch-phone" class="input" data-punch-field="phone" value="${esc(punchDraft.phone)}" maxlength="20" inputmode="tel" placeholder="+91…" /></div>
                <div class="field"><label for="punch-guests">Guests</label><select id="punch-guests" class="select" data-punch-field="guests">${[1, 2, 3, 4, 5, 6, 7, 8].map((count) => `<option value="${count}" ${Number(punchDraft.guests) === count ? "selected" : ""}>${count}</option>`).join("")}</select></div>
                <div class="field"><label for="punch-waiter">Waiter <span style="color:var(--muted);font-weight:400">(optional)</span></label><select id="punch-waiter" class="select" data-punch-field="waiterId"><option value="">No waiter</option>${waiters.map((waiter) => `<option value="${waiter.id}" ${punchDraft.waiterId === waiter.id ? "selected" : ""} ${waiter.active ? "" : "disabled"}>${esc(waiter.name)}${waiter.active ? "" : " · paused"}</option>`).join("")}</select></div>
              </div>`
        }
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="create-punch" data-loc="${location.id}">${icon("receipt", 14)} Punch order · ${money(punchTotal())}</button>
      </div>`;
  }

  function refreshPunchModal() {
    if (!punchDraft) return;
    openModal(renderPunchModal(getLocation(punchDraft.locId)), true, "punch-modal");
  }

  function createPunchOrder() {
    if (!punchDraft) return;
    const location = getLocation(punchDraft.locId);
    const lines = punchLines();
    if (!lines.length) {
      toast("Add at least one item before punching the order.");
      return;
    }
    const code = punchDraft.code || null;
    const openBill = code ? findOpenBill(location.id, code) : null;
    const now = new Date().toISOString();
    const roundItems = lines.map((item) => ({ id: item.id, name: item.name, price: item.price, qty: item.qty }));
    const roundTotal = orderItemsTotal(roundItems);

    if (openBill) {
      mergeItemLines(openBill.items, roundItems);
      openBill.total = orderItemsTotal(openBill.items);
      openBill.status = "new";
      openBill.updatedAt = now;
      const round = {
        id: `round_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        at: now,
        items: roundItems,
        total: roundTotal,
        via: "punch",
      };
      openBill.rounds = orderRounds(openBill).concat([round]);
      persist();
      knownRoundIds.add(round.id);
      knownOrderIds.add(openBill.id);
      closeModal();
      playBell();
      render();
      toast(`Added ${money(roundTotal)} to ${openBill.customerName}'s bill #${openBill.number} — no new bill.`);
      return;
    }

    let waiterId = null;
    if (punchDraft.waiterId) {
      const waiter = waiterById(location.id, punchDraft.waiterId);
      if (waiter && waiter.active && (!code || waiterLoad(location.id, waiter.id) < waiter.maxTables)) {
        waiterId = waiter.id;
      }
    }
    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 999)}`;
    const round = {
      id: `round_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      at: now,
      items: roundItems,
      total: roundTotal,
      via: "punch",
    };
    const order = {
      id: orderId,
      number: nextOrderNumber(),
      locId: location.id,
      code,
      billId: orderId,
      customerName: punchDraft.name.trim().slice(0, 40) || "Walk-in",
      phone: punchDraft.phone.trim().slice(0, 20),
      guests: Math.max(1, Math.min(12, Number(punchDraft.guests) || 1)),
      waiterId,
      items: roundItems,
      total: roundTotal,
      status: "new",
      createdAt: now,
      updatedAt: now,
      source: "punch",
      rounds: [round],
    };
    state.orders.push(order);
    persist();
    knownRoundIds.add(round.id);
    knownOrderIds.add(order.id);
    closeModal();
    playBell();
    render();
    toast(`Punched #${order.number} · ${orderSpotName(order)} · ${money(order.total)}.`);
  }

  function openAddWaiterModal(locId) {
    const location = getLocation(locId);
    openModal(`<div class="modal-head">
        <div><p class="modal-title">Add waiter</p><p class="modal-sub">${esc(location.name)} · set how many ${spotWord(true).toLowerCase()} they can handle at once.</p></div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">${icon("x", 18)}</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="new-waiter-name">Name</label>
          <input id="new-waiter-name" class="input" maxlength="30" placeholder="Waiter name" />
        </div>
        <div class="field" style="margin-top:12px">
          <label for="new-waiter-max">Maximum ${spotWord(true).toLowerCase()} at a time</label>
          <select id="new-waiter-max" class="select">${[2, 3, 4, 5, 6]
            .map((value) => `<option value="${value}" ${value === 3 ? "selected" : ""}>${value} ${spotWord(true).toLowerCase()}</option>`)
            .join("")}</select>
          <span class="field-hint">When they reach the limit, customers see “At capacity” and cannot pick them until a ${spotWord(false).toLowerCase()} is freed.</span>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="create-waiter" data-loc="${location.id}">Add waiter</button>
      </div>`);
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */

  function addRoom(locationId, name) {
    const location = getLocation(locationId);
    if (location.rooms.length >= 12) {
      toast("Demo limit: 12 room QRs per location.");
      return;
    }
    const code = nextRoomCode(location);
    location.rooms.push({
      id: `rm_${location.id}_${code}`,
      code,
      name,
      active: true,
      scans: 0,
    });
    persist();
    closeModal();
    render();
    toast(`${name} added — it has its own permanent QR (${code.toUpperCase()}) and a live order feed.`);
  }

  function handleAction(action, element) {
    switch (action) {
      case "not-in-demo": {
        toast(`${element.dataset.label || "This screen"} isn't part of this concept demo.`);
        break;
      }
      case "open-sidebar":
        document.body.classList.add("nav-open");
        break;
      case "close-sidebar":
        document.body.classList.remove("nav-open");
        break;
      case "reset-demo":
        if (!window.confirm("Reset the demo to its starting state?")) break;
        state = seedState();
        persist();
        knownOrderIds = new Set(state.orders.map((order) => order.id));
        rememberRoundIds();
        draft = null;
        savedConfig = null;
        draftKey = null;
        dirty = false;
        previewRoomCode = null;
        publicScreen = "home";
        cart = { key: null, items: {} };
        checkoutDraft = { name: "", phone: "", guests: 2, waiterId: "auto" };
        checkoutError = "";
        lastOrder = null;
        lastRound = null;
        lastOrderAdded = false;
        punchDraft = null;
        notifOpen = false;
        orderFilter = "all";
        analyticsSpot = "all";
        period = "today";
        joinCodeError = "";
        joinNameDraft = "";
        lastScanSignature = "";
        knownJoinRequestIds = new Set();
        knownJoinStatuses = {};
        knownServiceCallIds = new Set();
        lastServiceCall = null;
        closeModal();
        render();
        toast("Demo reset to its starting state.");
        break;
      case "panel-kind": {
        const hash = `#/locations/${element.dataset.loc}/${element.dataset.kind}`;
        navigate(hash);
        break;
      }
      case "editor-kind": {
        if (element.dataset.kind === route.kind) break;
        if (dirty && !window.confirm("Discard unsaved changes?")) break;
        window.location.hash = `#/customer-page/${route.locId}/${element.dataset.kind}`;
        break;
      }
      case "add-room":
        openAddRoomModal(element.dataset.loc || route.locId);
        break;
      case "create-room": {
        const input = document.getElementById("new-room-name");
        const name = input ? input.value.trim() : "";
        if (!name) {
          input?.focus();
          toast("Enter a room name.");
          break;
        }
        addRoom(element.dataset.loc, name.slice(0, 40));
        break;
      }
      case "rename-room":
        openRenameModal(element.dataset.loc, element.dataset.code);
        break;
      case "rename-save": {
        const input = document.getElementById("rename-room-name");
        const error = document.getElementById("rename-error");
        const name = input ? input.value.trim() : "";
        if (!name) {
          if (error) error.textContent = "Enter a room name.";
          input?.focus();
          break;
        }
        const location = getLocation(element.dataset.loc);
        const room = location.rooms.find((item) => item.code === element.dataset.code);
        if (room) {
          room.name = name.slice(0, 40);
          persist();
          closeModal();
          render();
          toast("Room renamed — the QR and link did not change.");
        }
        break;
      }
      case "view-qr":
        openQrModal(element.dataset.loc, element.dataset.code);
        break;
      case "download-qr":
        if (!modalQr) break;
        {
          const blob = new Blob([modalQr.svg], { type: "image/svg+xml" });
          const anchor = document.createElement("a");
          anchor.href = URL.createObjectURL(blob);
          anchor.download = modalQr.filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(anchor.href), 1500);
          toast("QR downloaded as SVG.");
        }
        break;
      case "copy-link":
        copyText(element.dataset.copy);
        break;
      case "close-modal":
        closeModal();
        break;
      case "save-config":
        saveDraft();
        break;
      case "view-live": {
        const href = element.dataset.href;
        if (!href) break;
        if (route.name === "editor" && draft && dirty) {
          state.configs[configKey(route.locId, route.kind)] = clone(draft);
          savedConfig = clone(draft);
          dirty = false;
          persist();
          toast(
            route.kind === "rooms"
              ? `Saved — this content now shows on every ${spotWord(false).toLowerCase()} QR at this location.`
              : "Saved — the reception page is updated.",
          );
        }
        window.location.hash = href;
        break;
      }
      case "discard-config":
        if (!dirty) break;
        draft = clone(savedConfig);
        dirty = false;
        render();
        toast("Changes discarded.");
        break;
      case "reset-config":
        if (!window.confirm("Reset this page to the default content?")) break;
        draft = clone(configTemplate(route.kind));
        dirty = JSON.stringify(draft) !== JSON.stringify(savedConfig);
        render();
        toast("Default page loaded — save to publish it.");
        break;
      case "toggle-notifications":
        notifOpen = !notifOpen;
        render();
        break;
      case "resolve-service":
        if (element.dataset.id) resolveServiceCall(element.dataset.id);
        break;
      case "toggle-sound":
        saveSoundOn(!soundOn);
        if (soundOn) playBell();
        else stopAlertRing();
        render();
        toast(
          soundOn
            ? "Order bell is on — new orders ring for 10 seconds."
            : "Order bell muted — on-screen notifications still appear.",
        );
        break;
      case "toggle-order-group": {
        const groupKey = element.dataset.group;
        if (!groupKey) break;
        if (expandedOrderGroups.has(groupKey)) expandedOrderGroups.delete(groupKey);
        else expandedOrderGroups.add(groupKey);
        render();
        break;
      }
      case "dismiss-live-alert":
        dashboardAlert = null;
        stopAlertRing();
        renderLiveAlert();
        break;
      case "open-live-alert": {
        const order = state.orders.find((item) => item.id === element.dataset.id);
        if (!order) break;
        expandedOrderGroups.add(`${order.locId}:${order.code || "direct"}`);
        dashboardAlert = null;
        stopAlertRing();
        renderLiveAlert();
        navigate(`#/orders/${order.locId}`);
        break;
      }
      case "order-filter":
        orderFilter = element.dataset.filter || "all";
        render();
        break;
      case "period-filter":
        period = PERIODS[element.dataset.period] ? element.dataset.period : "today";
        render();
        toast(`Showing ${periodDef(period).range} — ${periodRangeLabel(period)}.`);
        break;
      case "order-status":
        if (element.dataset.id && element.dataset.status) {
          setOrderStatus(element.dataset.id, element.dataset.status);
        }
        break;
      case "simulate-order":
        simulateOrder(element.dataset.loc || route.locId);
        break;
      case "open-bill":
        openBillModal(element.dataset.id);
        break;
      case "print-bill":
        window.print();
        break;
      case "send-bill":
        sendBill(element.dataset.id);
        break;
      case "send-bill-phone":
        sendBillToPhone(element.dataset.id);
        break;
      case "verify-payment":
        verifyPayment(element.dataset.id);
        break;
      case "punch-order":
        openPunchModal(element.dataset.loc || route.locId, element.dataset.code || "");
        break;
      case "punch-add": {
        if (!punchDraft) break;
        const id = element.dataset.item;
        if (!MENU_ITEMS[id]) break;
        punchDraft.items[id] = Math.min(20, (punchDraft.items[id] || 0) + 1);
        refreshPunchModal();
        break;
      }
      case "punch-dec": {
        if (!punchDraft) break;
        const id = element.dataset.item;
        const next = Math.max(0, (punchDraft.items[id] || 0) - 1);
        if (next) punchDraft.items[id] = next;
        else delete punchDraft.items[id];
        refreshPunchModal();
        break;
      }
      case "create-punch":
        createPunchOrder();
        break;
      case "analytics-spot":
        analyticsSpot = element.dataset.code || "all";
        render();
        break;
      case "download-report":
        downloadReport(element.dataset.loc || route.locId, element.dataset.code || null);
        break;
      case "add-waiter":
        openAddWaiterModal(element.dataset.loc || route.locId);
        break;
      case "create-waiter": {
        const location = getLocation(element.dataset.loc || route.locId);
        const nameInput = document.getElementById("new-waiter-name");
        const maxInput = document.getElementById("new-waiter-max");
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) {
          nameInput?.focus();
          toast("Enter a waiter name.");
          break;
        }
        if ((location.waiters || []).some((waiter) => waiter.name.toLowerCase() === name.toLowerCase())) {
          nameInput?.focus();
          toast("That waiter is already on the team.");
          break;
        }
        const maxTables = Math.max(1, Math.min(8, Number(maxInput ? maxInput.value : 3) || 3));
        location.waiters.push({
          id: `w_${Date.now()}`,
          name: name.slice(0, 30),
          maxTables,
          active: true,
        });
        persist();
        closeModal();
        render();
        toast(`${name} added — can handle ${maxTables} ${spotWord(true).toLowerCase()} at a time.`);
        break;
      }
      case "remove-waiter": {
        const location = getLocation(element.dataset.loc || route.locId);
        const waiter = (location.waiters || []).find((item) => item.id === element.dataset.waiter);
        if (!waiter) break;
        const load = waiterLoad(location.id, waiter.id);
        if (load > 0) {
          toast(`${waiter.name} still has ${load} open ${spotWord(true).toLowerCase()}. Complete those orders first.`);
          break;
        }
        if (!window.confirm(`Remove ${waiter.name} from this location?`)) break;
        location.waiters = location.waiters.filter((item) => item.id !== waiter.id);
        persist();
        closeModal();
        render();
        toast(`${waiter.name} removed.`);
        break;
      }
      default:
        break;
    }
  }

  function handleCustomerAction(action, element) {
    if (route.name !== "scan") return;
    const context = currentScanContext();
    if (!context.config) return;

    switch (action) {
      case "add-item":
        ensureCart();
        changeCartItem(element ? element.dataset.item : "", 1);
        break;
      case "dec-item":
        ensureCart();
        changeCartItem(element ? element.dataset.item : "", -1);
        break;
      case "cart":
        ensureCart();
        if (!cartCount()) {
          toast("Your cart is empty — add something from the menu.");
          return;
        }
        publicScreen = "cart";
        break;
      case "checkout":
        if (!cartCount()) {
          toast("Add something from the menu first.");
          return;
        }
        checkoutError = "";
        publicScreen = "checkout";
        break;
      case "pick-waiter":
        checkoutDraft.waiterId = element ? element.dataset.waiter : "auto";
        checkoutError = "";
        break;
      case "place-order":
        placeOrder();
        break;
      case "join-request": {
        const bill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
        if (!bill) {
          toast("This bill is no longer open. Ask a member of staff for help.");
          return;
        }
        const input = document.getElementById("join-name");
        const existing = latestJoinRequestForDevice(bill, currentDeviceId());
        const name = (input ? input.value : "") || joinNameDraft || (existing ? existing.name : "");
        if (!name.trim()) {
          if (input) input.focus();
          toast("Enter your name so the host knows who is joining.");
          return;
        }
        joinNameDraft = name.trim();
        const result = requestJoin(bill, name);
        if (result && result.error) toast(result.error);
        return;
      }
      case "join-cancel": {
        const bill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
        if (bill) cancelJoinRequest(bill);
        return;
      }
      case "join-approve":
        if (element && element.dataset.request) approveJoinRequest(element.dataset.request);
        return;
      case "join-deny":
        if (element && element.dataset.request) denyJoinRequest(element.dataset.request);
        return;
      case "join-regenerate":
        if (element && element.dataset.request) regenerateJoinCode(element.dataset.request);
        return;
      case "join-verify": {
        const bill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
        verifyJoinCode(bill);
        return;
      }
      case "thumb":
        publicScreen = "chooser";
        break;
      case "google":
        publicScreen = "google";
        break;
      case "contact":
        publicScreen = "feedback";
        break;
      case "submit-feedback": {
        const message = document.getElementById("feedback-message");
        const error = document.getElementById("feedback-error");
        if (!message || message.value.trim().length === 0) {
          if (error) error.textContent = "Please write a short message.";
          message?.focus();
          return;
        }
        publicScreen = "thanks";
        break;
      }
      case "bill": {
        const bill = context.room
          ? findOpenBill(context.location.id, context.room.code) ||
            recentPaidBill(context.location.id, context.room.code, currentDeviceId())
          : null;
        if (!bill) {
          toast("No bill is open yet.");
          return;
        }
        if (bill.status !== "completed" && !bill.billSentAt) {
          toast("Ask the waiter for the bill first — the counter will send it to your phone.");
          return;
        }
        publicScreen = "bill";
        break;
      }
      case "download-bill": {
        const bill = context.room
          ? findOpenBill(context.location.id, context.room.code) ||
            recentPaidBill(context.location.id, context.room.code, currentDeviceId())
          : null;
        if (!bill || bill.status !== "completed") {
          toast("The bill is not paid yet.");
          return;
        }
        downloadBill(bill);
        return;
      }
      case "home":
        publicScreen = "home";
        break;
      case "menu":
        publicScreen = "menu";
        break;
      case "service":
        publicScreen = "service";
        break;
      case "service-waiter":
      case "service-bill": {
        const call = requestService(action === "service-bill" ? "bill" : "waiter");
        if (!call) return;
        lastServiceCall = call;
        publicScreen = "service-sent";
        break;
      }
      case "hours":
        publicScreen = "hours";
        break;
      case "wifi": {
        const bill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
        if (!wifiUnlockedForOrder(bill, context.config)) {
          toast("Wi-Fi is available only after your order is accepted.");
          return;
        }
        publicScreen = "wifi";
        break;
      }
      case "copy-wifi": {
        const bill = context.room ? findOpenBill(context.location.id, context.room.code) : null;
        if (!wifiUnlockedForOrder(bill, context.config)) {
          toast("Wi-Fi is available only after your order is accepted.");
          return;
        }
        copyText(context.config.wifi.password, "Wi-Fi password copied.");
        return;
      }
      case "call":
        toast(`Would open the phone dialer: ${context.config.call.phone}`);
        return;
      case "directions":
        toast(context.config.directions.value || "No address set.");
        return;
      case "custom":
        toast(`Would open “${context.config.custom.label}”.`);
        return;
      case "write":
        toast("The review writer is not part of this concept demo.");
        return;
      default:
        return;
    }
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Clipboard and toast                                                */
  /* ------------------------------------------------------------------ */

  let toastTimer = null;

  function toast(message) {
    const element = document.getElementById("toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("show"), 3000);
  }

  async function copyText(text, successMessage) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage || "Link copied.");
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        toast(successMessage || "Link copied.");
      } catch (innerError) {
        toast("Copy failed — select the link manually.");
      }
      area.remove();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  document.addEventListener("click", function (event) {
    if (notifOpen && !event.target.closest(".notif-wrap")) {
      notifOpen = false;
      const panel = document.querySelector(".notif-panel");
      if (panel) panel.remove();
    }
    const preview = event.target.closest(".phone-screen");
    if (preview) {
      const link = event.target.closest("a");
      if (link) {
        event.preventDefault();
        toast("This is the live preview. Open the live page to follow links.");
        return;
      }
      const previewAction = event.target.closest("[data-cp-action]");
      if (previewAction) {
        event.preventDefault();
        toast("Live preview — open “View live page” to click through.");
        return;
      }
    }

    const nav = event.target.closest("[data-nav]");
    if (nav) {
      event.preventDefault();
      notifOpen = false;
      navigate(nav.dataset.nav);
      return;
    }

    const customerAction = event.target.closest("[data-cp-action]");
    if (customerAction) {
      event.preventDefault();
      handleCustomerAction(customerAction.dataset.cpAction, customerAction);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      event.preventDefault();
      handleAction(action.dataset.action, action);
    }
  });

  document.addEventListener("change", function (event) {
    const editorLocation = event.target.closest("[data-editor-location]");
    if (editorLocation) {
      const nextId = editorLocation.value;
      if (nextId === route.locId) return;
      if (route.name === "editor" && dirty && !window.confirm("Discard unsaved changes?")) {
        editorLocation.value = route.locId;
        return;
      }
      window.location.hash = `#/customer-page/${nextId}/${route.kind}`;
      return;
    }

    const roomToggle = event.target.closest("[data-room-toggle]");
    if (roomToggle) {
      const location = getLocation(roomToggle.dataset.loc);
      const room = location.rooms.find((item) => item.code === roomToggle.dataset.code);
      if (!room) return;
      room.active = roomToggle.checked;
      persist();
      render();
      toast(
        room.active
          ? `${room.name} QR is active again.`
          : `${room.name} QR paused — the link is reserved and shows “not available”.`,
      );
      return;
    }

    const previewRoom = event.target.closest("[data-preview-room]");
    if (previewRoom) {
      previewRoomCode = previewRoom.value;
      render();
      return;
    }

    const businessType = event.target.closest("[data-business-type]");
    if (businessType) {
      state.businessType = businessType.value === "hotel" ? "hotel" : "cafe";
      analyticsSpot = "all";
      persist();
      render();
      toast(
        state.businessType === "hotel"
          ? "Hotel mode — every screen now says Rooms."
          : "Café / restaurant mode — every screen now says Tables.",
      );
      return;
    }

    const analyticsSelect = event.target.closest("[data-analytics-spot]");
    if (analyticsSelect) {
      analyticsSpot = analyticsSelect.value;
      render();
      return;
    }

    const waiterMaxField = event.target.closest("[data-waiter-max]");
    if (waiterMaxField) {
      const waiter = waiterById(waiterMaxField.dataset.loc, waiterMaxField.dataset.waiter);
      if (!waiter) return;
      waiter.maxTables = Math.max(1, Math.min(8, Number(waiterMaxField.value) || 1));
      persist();
      render();
      toast(`${waiter.name} can now handle ${waiter.maxTables} ${spotWord(true).toLowerCase()} at a time.`);
      return;
    }

    const waiterActiveField = event.target.closest("[data-waiter-active]");
    if (waiterActiveField) {
      const waiter = waiterById(waiterActiveField.dataset.loc, waiterActiveField.dataset.waiter);
      if (!waiter) return;
      waiter.active = waiterActiveField.checked;
      persist();
      render();
      toast(
        waiter.active
          ? `${waiter.name} is accepting new orders again.`
          : `${waiter.name} paused — customers will not see them at checkout.`,
      );
      return;
    }

    const punchSpot = event.target.closest("[data-punch-spot]");
    if (punchSpot && punchDraft) {
      punchDraft.code = punchSpot.value;
      refreshPunchModal();
      return;
    }

    const punchSelect = event.target.closest("[data-punch-field]");
    if (punchSelect && punchDraft && punchSelect.tagName === "SELECT") {
      punchDraft[punchSelect.dataset.punchField] =
        punchSelect.dataset.punchField === "guests" ? Number(punchSelect.value) : punchSelect.value;
      return;
    }

    const checkoutField = event.target.closest("[data-checkout]");
    if (checkoutField) {
      checkoutDraft[checkoutField.dataset.checkout] =
        checkoutField.dataset.checkout === "guests"
          ? Number(checkoutField.value)
          : checkoutField.value;
      return;
    }

    const field = event.target.closest("[data-field]");
    if (field) {
      if (route.name !== "editor" || !draft) return;
      const path = field.dataset.field;
      setPath(draft, path, field.type === "checkbox" ? field.checked : field.value);
      dirty = JSON.stringify(draft) !== JSON.stringify(savedConfig);
      if (path.endsWith(".on")) {
        render();
      } else {
        refreshPreview();
        refreshDirtyUI();
      }
    }
  });

  document.addEventListener("input", function (event) {
    const punchField = event.target.closest("[data-punch-field]");
    if (punchField && punchDraft) {
      punchDraft[punchField.dataset.punchField] =
        punchField.dataset.punchField === "guests" ? Number(punchField.value) : punchField.value;
      return;
    }
    const joinName = event.target.closest("[data-join-name]");
    if (joinName) {
      joinNameDraft = joinName.value;
      return;
    }
    const joinCode = event.target.closest("[data-join-code]");
    if (joinCode) {
      joinCode.value = joinCode.value.replace(/\D/g, "").slice(0, 6);
      return;
    }
    const checkoutField = event.target.closest("[data-checkout]");
    if (checkoutField && checkoutField.tagName !== "SELECT") {
      checkoutDraft[checkoutField.dataset.checkout] = checkoutField.value;
      return;
    }
    const field = event.target.closest("[data-field]");
    if (!field) return;
    if (field.type === "checkbox") return;
    if (route.name !== "editor" || !draft) return;
    setPath(draft, field.dataset.field, field.value);
    dirty = JSON.stringify(draft) !== JSON.stringify(savedConfig);
    refreshPreview();
    refreshDirtyUI();
  });

  document.getElementById("modal-root").addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-overlay")) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
    if (event.key === "Enter" && event.target.id === "join-name") {
      event.preventDefault();
      const button = document.querySelector('[data-cp-action="join-request"]');
      if (button) button.click();
      return;
    }
    if (event.key === "Enter" && event.target.id === "join-code") {
      event.preventDefault();
      const button = document.querySelector('[data-cp-action="join-verify"]');
      if (button) button.click();
    }
  });

  window.addEventListener("hashchange", function () {
    route = parseRoute();
    draft = null;
    savedConfig = null;
    draftKey = null;
    dirty = false;
    previewRoomCode = null;
    publicScreen = "home";
    cart = { key: null, items: {} };
    checkoutDraft = { name: "", phone: "", guests: 2, waiterId: "auto" };
    checkoutError = "";
    lastOrder = null;
    lastRound = null;
    lastOrderAdded = false;
    punchDraft = null;
    notifOpen = false;
    analyticsSpot = "all";
    orderFilter = "all";
    joinCodeError = "";
    joinNameDraft = "";
    lastScanSignature = "";
    lastServiceCall = null;
    dashboardAlert = null;
    stopAlertRing();
    document.body.classList.remove("nav-open");
    closeModal();
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  window.addEventListener("storage", function (event) {
    if (event.key === LS_KEY) handleExternalState();
  });

  function startLiveSync() {
    window.clearInterval(pollTimer);
    pollTimer = window.setInterval(function () {
      handleExternalState();
    }, 2500);
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  function render() {
    const app = document.getElementById("app");

    if (route.name === "scan") {
      app.innerHTML = renderScan();
      updateJoinCountdowns();
      updateBillCountdowns();
      document.title = `${BUSINESS.name} · ${customerSpotName()}`;
      renderLiveAlert();
      return;
    }

    let content = "";
    if (route.name === "dashboard") content = renderDashboard();
    else if (route.name === "orders") content = renderOrdersPage();
    else if (route.name === "analytics") content = renderAnalyticsPage();
    else if (route.name === "rooms") content = renderRoomsPage();
    else if (route.name === "editor") content = renderEditor();
    else content = renderLocationsPage();

    app.innerHTML = renderShell(content, route.name);
    renderLiveAlert();
    updateDocumentTitle();
  }

  function init() {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/dashboard/cafe01");
    }
    route = parseRoute();
    knownOrderIds = new Set(state.orders.map((order) => order.id));
    rememberRoundIds();
    updateDocumentTitle();
    render();
    startLiveSync();
    window.setInterval(function () {
      updateJoinCountdowns();
      updateBillCountdowns();
    }, 1000);
  }

  init();
})();

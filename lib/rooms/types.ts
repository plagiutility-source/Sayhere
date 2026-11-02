/**
 * Tables & Rooms data model.
 *
 * Mirrors the concept demo (`reference/_demo-rooms-feature/app.js`) exactly and
 * matches spec section 5. A `code` of `null` on an order means a direct punch
 * (no table / room).
 */

export type SpotBusinessType = "cafe" | "restaurant" | "hotel";

export type OrderStatus = "new" | "preparing" | "served" | "completed" | "cancelled";

export type OrderSource = "customer" | "punch" | "simulated" | "seed";

export type RoundVia = "customer" | "reorder" | "punch" | "simulated" | "seed";

export type PaymentMode = "Cash" | "UPI" | "Card";

export type ServiceKind = "waiter" | "bill";

export type JoinStatus = "pending" | "approved" | "joined" | "denied" | "cancelled" | "locked";

/** Derived from the timestamps, never stored. */
export type EffectiveJoinStatus = JoinStatus | "expired";

export type Room = { id: string; code: string; name: string; active: boolean; scans: number };

export type Waiter = { id: string; name: string; maxTables: number; active: boolean };

export type SpotLocation = {
  id: string;
  name: string;
  slug: string;
  scans: number;
  active: boolean;
  waiters: Waiter[];
  rooms: Room[];
};

export type OrderItem = { id: string; name: string; price: number; qty: number };

export type Round = {
  id: string;
  at: string;
  items: OrderItem[];
  total: number;
  via: RoundVia;
  by?: string | null;
  participantId?: string | null;
};

export type Participant = {
  id: string;
  name: string;
  deviceId: string;
  role: "host" | "guest";
  joinedAt: string;
  requestId?: string;
};

export type Payment = { amount: number; mode: PaymentMode; at: string };

export type Order = {
  id: string;
  number: number;
  locId: string;
  code: string | null;
  billId: string;
  customerName: string;
  phone: string;
  guests: number;
  waiterId: string | null;
  hostDeviceId?: string | null;
  participants: Participant[];
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  paidAt?: string;
  payment?: Payment;
  billSentAt?: string;
  emailedTo?: string;
  emailedAt?: string;
  source: OrderSource;
  rounds: Round[];
};

export type JoinRequest = {
  id: string;
  orderId: string;
  locId: string;
  code: string;
  deviceId: string;
  name: string;
  status: JoinStatus;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  joinCode: string | null;
  codeExpiresAt: string | null;
  approvedAt?: string;
  deniedAt?: string;
  joinedAt?: string;
};

export type ServiceCall = {
  id: string;
  locId: string;
  code: string;
  kind: ServiceKind;
  status: "open" | "done";
  createdAt: string;
  resolvedAt?: string;
  orderId: string;
  customerName: string;
};

export type RoomsPageConfig = {
  announcement: { on: boolean; text: string };
  thankYou: string;
  wifi: { on: boolean; ssid: string; password: string };
  menu: { on: boolean; title: string };
  hours: { on: boolean; phone: string; address: string };
  call: { on: boolean; phone: string };
  directions: { on: boolean; value: string };
  custom: { on: boolean; label: string; url: string };
  socials: { instagram?: string; website?: string };
};

export type RoomsState = {
  locations: SpotLocation[];
  /** Key: `${locId}:reception` | `${locId}:rooms`. */
  configs: Record<string, RoomsPageConfig>;
  orders: Order[];
  joinRequests: JoinRequest[];
  serviceCalls: ServiceCall[];
  businessType: SpotBusinessType;
  savedAt: number;
};

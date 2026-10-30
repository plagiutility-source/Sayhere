"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { copyText } from "@/components/rooms/shared/clipboard";
import { Icon } from "@/components/rooms/shared/icons";
import { HostPanel } from "./HostPanel";
import { JoinGate } from "./JoinGate";
import { Badge, btnOutline, cx } from "@/components/rooms/shared/ui";
import { CART_MAX_QTY, GUESTS_OPTIONS, PAID_BILL_WINDOW_MS } from "@/lib/rooms/constants";
import {
  billWindowText,
  displaySpotName,
  formatTime,
  money,
  orderSpotName,
  serviceKindTitle,
  spotWord,
} from "@/lib/rooms/format";
import { absoluteUrl, spotPath } from "@/lib/rooms/links";
import {
  approveJoinRequest,
  availableWaiters,
  cancelJoinRequest,
  denyJoinRequest,
  effectiveJoinStatus,
  findOpenBill,
  latestJoinRequestForDevice,
  orderRounds,
  paidBillRemaining,
  participantFor,
  placeOrder,
  regenerateJoinCode,
  requestJoin,
  recentPaidBill,
  requestService,
  resolveScanParticipation,
  serviceCallsForSpot,
  verifyJoinCode,
  waiterLoad,
  waiterName,
  wifiUnlockedForOrder,
} from "@/lib/rooms/rules";
import {
  configTemplate,
  DEMO_BUSINESS,
  DEMO_MENU,
  DEMO_WEEK,
  MENU_ITEMS,
} from "@/lib/rooms/seed";
import { billPdfBlob } from "@/lib/rooms/bill-pdf";
import { claimSpotScan } from "@/lib/rooms/scans";
import { currentDeviceId, readSoundOn, useRoomsState } from "@/lib/rooms/store";
import { playBell } from "@/lib/rooms/sound";
import type { Order, Round, ServiceCall, ServiceKind } from "@/lib/rooms/types";

type ScanPageProps = { slug: string; code: string };
type Screen =
  | "home"
  | "menu"
  | "cart"
  | "checkout"
  | "order-done"
  | "bill"
  | "service"
  | "service-sent"
  | "wifi"
  | "chooser"
  | "google"
  | "feedback"
  | "thanks"
  | "hours";

const btnDirect =
  "mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--cp-primary)] px-3 py-3 text-center text-xs font-medium text-white";
const btnLink =
  "mt-2 block w-full rounded-[10px] border border-black/10 bg-white/70 px-3 py-3 text-center text-xs font-medium text-[var(--cp-primary)]";
const inputClass =
  "h-10 w-full rounded-[9px] border border-black/15 bg-white px-3 text-xs text-ink outline-none focus:border-[var(--cp-primary)]";
const noteClass = "mt-3 flex items-start gap-1.5 text-[11px] leading-[1.55] text-ink-muted";

/**
 * The public scan page (`renderScan` / `renderCustomerScreen` in the demo):
 * the established scan frame plus the full ordering flow — home, menu, cart,
 * checkout with the waiter picker, order done, table service, Wi-Fi and the
 * review screens. Bill, join gate and paid bill remain Phase 5 work.
 */
export function ScanPage({ slug, code }: ScanPageProps) {
  const { state, save } = useRoomsState();
  const [origin, setOrigin] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState({ name: "", phone: "", guests: 2, waiterId: "auto" });
  const [checkoutError, setCheckoutError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [lastRound, setLastRound] = useState<Round | null>(null);
  const [lastAdded, setLastAdded] = useState(false);
  const [lastCall, setLastCall] = useState<ServiceCall | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinCodeError, setJoinCodeError] = useState("");
  const knownJoinRequestIds = useRef<Set<string>>(new Set());
  const knownJoinStatuses = useRef<Record<string, string>>({});
  const knownBillSentKeys = useRef<Set<string>>(new Set());
  const knownPaidBillIds = useRef<Set<string>>(new Set());
  const detectorsReady = useRef(false);
  const routeKey = `${slug}:${code}`;
  const lastRouteKey = useRef(routeKey);
  const [feedback, setFeedback] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    setDeviceId(currentDeviceId());
  }, []);

  /* The demo resets every transient customer screen state on a route change. */
  useEffect(() => {
    if (lastRouteKey.current === routeKey) return;
    lastRouteKey.current = routeKey;
    setScreen("home");
    setCart({});
    setDraft({ name: "", phone: "", guests: 2, waiterId: "auto" });
    setCheckoutError("");
    setLastOrder(null);
    setLastRound(null);
    setLastAdded(false);
    setLastCall(null);
    setJoinName("");
    setJoinCode("");
    setJoinCodeError("");
    setFeedback("");
    setFeedbackEmail("");
    setFeedbackError("");
    setToast(null);
  }, [routeKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* The demo's 1 s timer: join countdowns and bill countdowns, and it keeps
     `effectiveJoinStatus` honest when a request or code expires. */
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const businessType = state.businessType;
  const spot = spotWord(businessType, false);
  const spots = spotWord(businessType, true);

  const location =
    state.locations.find((item) => item.slug === slug || item.id === slug) ?? null;
  const isReception = code === "reception";
  const room =
    location && !isReception
      ? location.rooms.find((item) => item.code === code) ?? null
      : null;
  const known = isReception || Boolean(room);
  const active = isReception || Boolean(room?.active);
  const kind = isReception ? "reception" : "rooms";
  const displaySpot = room ? displaySpotName(businessType, room) : "Reception";

  const config =
    (location && state.configs[`${location.id}:${kind}`]) || configTemplate(kind);

  const openBill = location && room ? findOpenBill(state, location.id, room.code) : null;
  const participant = openBill && deviceId ? participantFor(openBill, deviceId) : null;
  const joinRequest =
    openBill && deviceId ? latestJoinRequestForDevice(state, openBill, deviceId) : null;
  const joinStatus = effectiveJoinStatus(joinRequest);
  const paidBill =
    location && room && !openBill && deviceId
      ? recentPaidBill(state, location.id, room.code, deviceId)
      : null;
  const bill = openBill || paidBill;

  useEffect(() => {
    if (screen !== "bill" || !bill || bill.status !== "completed") return;
    if (paidBillRemaining(bill) <= 0) setScreen("chooser");
  }, [screen, bill, tick]);

  useEffect(() => {
    if (!location) return;
    document.title = `${DEMO_BUSINESS.name} · ${displaySpot}`;
  }, [location, displaySpot]);

  /* Products of the demo's detectJoinEvents / detectBillSent / detectPaidBill.
     The page re-renders on every newer saved state, so unlike the demo there is
     no separate scan-signature guard; these refs only stop repeated toasts. */
  useEffect(() => {
    if (!deviceId || !location) return;
    const requests = openBill
      ? state.joinRequests.filter((request) => request.orderId === openBill.id)
      : [];
    const mine = openBill ? latestJoinRequestForDevice(state, openBill, deviceId) : null;
    const mineStatus = effectiveJoinStatus(mine);
    const billKey =
      openBill && openBill.billSentAt ? `${openBill.id}:${openBill.billSentAt}` : null;

    if (!detectorsReady.current) {
      requests.forEach((request) => knownJoinRequestIds.current.add(request.id));
      if (mine) knownJoinStatuses.current[mine.id] = mineStatus || "";
      if (billKey) knownBillSentKeys.current.add(billKey);
      if (paidBill) knownPaidBillIds.current.add(paidBill.id);
      detectorsReady.current = true;
      return;
    }

    if (openBill && participant?.role === "host") {
      requests.forEach((request) => {
        if (
          effectiveJoinStatus(request) === "pending" &&
          !knownJoinRequestIds.current.has(request.id)
        ) {
          knownJoinRequestIds.current.add(request.id);
          playBell(readSoundOn());
          setToast(`${request.name} wants to join ${displaySpot}.`);
        }
      });
    }

    if (mine && mineStatus) {
      const previous = knownJoinStatuses.current[mine.id];
      if (previous && previous !== mineStatus) {
        if (mineStatus === "approved") {
          setToast("Approved — enter the 6-digit code shown on the host's phone.");
        } else if (mineStatus === "denied") {
          setToast("The host declined this join request.");
        } else if (mineStatus === "expired") {
          setToast("That join code expired — ask the host for a new one.");
        } else if (mineStatus === "locked") {
          setToast("Too many wrong codes — ask the host for a new one.");
        }
      }
      knownJoinStatuses.current[mine.id] = mineStatus;
    }

    if (billKey && !knownBillSentKeys.current.has(billKey)) {
      knownBillSentKeys.current.add(billKey);
      playBell(readSoundOn());
      setToast("Your bill is ready — pay at the counter. Download unlocks after payment.");
      if (["home", "service-sent", "order-done"].indexOf(screen) !== -1) setScreen("bill");
    }

    if (paidBill && !knownPaidBillIds.current.has(paidBill.id)) {
      knownPaidBillIds.current.add(paidBill.id);
      playBell(readSoundOn());
      setToast("Payment received — thanks! Your bill is ready to download.");
      if (["home", "order-done", "service-sent"].indexOf(screen) !== -1) setScreen("bill");
    }
  }, [state, deviceId, location, openBill, participant, paidBill, screen, displaySpot]);

  const cartLines = useMemo(
    () =>
      Object.keys(cart)
        .filter((id) => cart[id] > 0 && MENU_ITEMS[id])
        .map((id) => ({ ...MENU_ITEMS[id], qty: cart[id] })),
    [cart],
  );
  const cartCount = cartLines.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartLines.reduce((sum, item) => sum + item.price * item.qty, 0);
  const wifiReady = wifiUnlockedForOrder(openBill, config, businessType);

  // E1 + O4 — claim a staff-created bill, and count this active spot scan once
  // per device per 30 minutes. One save keeps the two updates from clobbering
  // each other.
  useEffect(() => {
    if (!deviceId || !location || !room) return;
    let next = state;
    let changed = false;

    if (openBill && !openBill.hostDeviceId && !openBill.participants.length) {
      const resolved = resolveScanParticipation(openBill, deviceId);
      if (resolved.participant) {
        next = {
          ...next,
          orders: next.orders.map((order) =>
            order.id === resolved.order.id ? resolved.order : order,
          ),
        };
        changed = true;
      }
    }

    if (room.active && claimSpotScan(deviceId, location.id, room.code)) {
      next = {
        ...next,
        locations: next.locations.map((item) =>
          item.id === location.id
            ? {
                ...item,
                rooms: item.rooms.map((spot) =>
                  spot.code === room.code ? { ...spot, scans: spot.scans + 1 } : spot,
                ),
              }
            : item,
        ),
      };
      changed = true;
    }

    if (changed) save(next);
  }, [deviceId, location, room, openBill, state, save]);

  const scanKey = location ? `${location.id}/${code}` : "";
  useEffect(() => {
    setCart({});
    setCheckoutError("");
    setJoinName("");
    setJoinCode("");
    setJoinCodeError("");
    setScreen("home");
  }, [scanKey]);

  const theme = {
    "--cp-primary": DEMO_BUSINESS.theme.primary,
    "--cp-secondary": DEMO_BUSINESS.theme.secondary,
    "--cp-bg": DEMO_BUSINESS.theme.bg,
  } as CSSProperties;

  if (!location) {
    return (
      <div className="min-h-screen bg-[var(--cp-bg)]" style={theme}>
        <div className="mx-auto max-w-[480px] px-[18px] pb-14 pt-6">
          <div className="overflow-hidden rounded-[18px] shadow-soft">
            <Unavailable
              title={`This link isn't linked to a ${spot.toLowerCase()}`}
              text={`The QR may belong to a ${spot.toLowerCase()} that was removed, or the link was typed incorrectly.`}
              backHref="/rooms"
              backLabel={`Back to ${spots}`}
            />
          </div>
        </div>
      </div>
    );
  }

  const url = absoluteUrl(origin, spotPath(slug, code));
  const otherRoom = location.rooms.find((item) => item.active) ?? null;
  const otherHref = room
    ? spotPath(slug, "reception")
    : otherRoom
      ? spotPath(slug, otherRoom.code)
      : `/rooms?loc=${location.id}`;
  const otherLabel = room ? "View reception page" : `View a ${spot.toLowerCase()} QR`;
  const activeRooms = location.rooms.filter((item) => item.active).length;

  const changeItem = (id: string, delta: number) => {
    if (!MENU_ITEMS[id]) return;
    setCart((previous) => {
      const qty = Math.max(0, Math.min(CART_MAX_QTY, (previous[id] || 0) + delta));
      const next = { ...previous };
      if (!qty) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const openCart = () => {
    if (!cartCount) {
      setToast("Your cart is empty — add something from the menu.");
      return;
    }
    setScreen("cart");
  };

  const openCheckout = () => {
    if (!cartCount) {
      setToast("Add something from the menu first.");
      return;
    }
    setCheckoutError("");
    setScreen("checkout");
  };

  const submitOrder = () => {
    if (!room) return;
    if (!cartLines.length) {
      setCheckoutError("Your cart is empty. Add something from the menu.");
      return;
    }
    const result = placeOrder(state, {
      locId: location.id,
      code: room.code,
      deviceId,
      lines: cartLines.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      name: draft.name,
      phone: draft.phone,
      guests: draft.guests,
      waiterId: draft.waiterId,
    });
    if (!result.ok) {
      setCheckoutError(result.error);
      return;
    }
    save(result.state);
    setLastOrder(result.order);
    setLastRound(result.round);
    setLastAdded(result.added);
    setCart({});
    setCheckoutError("");
    setScreen("order-done");
  };

  const sendService = (serviceKind: ServiceKind) => {
    if (!room) return;
    const result = requestService(state, { locId: location.id, code: room.code }, serviceKind);
    if (!result.call) {
      setToast("Place an order first — then you can call a waiter or ask for the bill.");
      return;
    }
    if (result.state !== state) save(result.state);
    setLastCall(result.call);
    setScreen("service-sent");
  };

  const openBillScreen = () => {
    const target = openBill || paidBill;
    if (!target) {
      setToast("No bill is open yet.");
      return;
    }
    if (target.status !== "completed" && !target.billSentAt) {
      setToast("Ask the waiter for the bill first — the counter will send it to your phone.");
      return;
    }
    setScreen("bill");
  };

  const openWifi = () => {
    if (!wifiUnlockedForOrder(openBill, config, businessType)) {
      setToast("Wi-Fi is available only after your order is accepted.");
      return;
    }
    setScreen("wifi");
  };

  const askToJoin = () => {
    if (!openBill) {
      setToast("This bill is no longer open. Ask a member of staff for help.");
      return;
    }
    const name = (joinName || joinRequest?.name || "").trim();
    if (!name) {
      document.getElementById("join-name")?.focus();
      setToast("Enter your name so the host knows who is joining.");
      return;
    }
    const result = requestJoin(state, openBill, name, deviceId);
    if (result.error) {
      setToast(result.error);
      return;
    }
    if (result.state !== state) save(result.state);
    setJoinCodeError("");
    setToast(`Request sent to ${openBill.customerName}. Waiting for approval.`);
  };

  const cancelJoin = () => {
    const result = cancelJoinRequest(state, openBill, deviceId);
    if (!result.ok) return;
    save(result.state);
    setJoinCode("");
    setJoinCodeError("");
    setToast("Join request cancelled.");
  };

  const approveRequest = (id: string) => {
    const result = approveJoinRequest(state, id);
    if (!result.ok || !result.request) return;
    save(result.state);
    setToast(`Approved — read the code to ${result.request.name}.`);
  };

  const denyRequest = (id: string) => {
    const result = denyJoinRequest(state, id);
    if (!result.ok || !result.request) return;
    save(result.state);
    setToast(`Request from ${result.request.name} declined.`);
  };

  const regenerateCode = (id: string) => {
    const result = regenerateJoinCode(state, id);
    if (!result.ok || !result.request) return;
    save(result.state);
    setToast(`New code for ${result.request.name}.`);
  };

  const downloadBill = () => {
    if (!bill || bill.status !== "completed") {
      setToast("The bill is not paid yet.");
      return;
    }
    const anchor = document.createElement("a");
    const href = URL.createObjectURL(billPdfBlob(bill, {
      spotName: orderSpotName(state, bill),
      waiterName: waiterName(state, bill.locId, bill.waiterId),
    }));
    anchor.href = href;
    anchor.download = `syehere-bill-${bill.number}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1500);
    setToast("PDF bill downloaded — taking you to the review.");
    window.setTimeout(
      () => setScreen((current) => (current === "bill" ? "chooser" : current)),
      1200,
    );
  };

  const submitJoinCode = () => {
    const result = verifyJoinCode(state, openBill, deviceId, joinCode);
    if (!result.ok) {
      if (result.state !== state) save(result.state);
      setJoinCodeError(result.error || "This join request is no longer active.");
      return;
    }
    save(result.state);
    setJoinCode("");
    setJoinCodeError("");
    setScreen("home");
    setToast(`You joined ${openBill?.customerName}'s bill #${openBill?.number}.`);
  };

  let body: ReactNode;
  if (!known) {
    body = (
      <Unavailable
        title={`This link isn't linked to a ${spot.toLowerCase()}`}
        text={`The QR may belong to a ${spot.toLowerCase()} that was removed, or the link was typed incorrectly.`}
        backHref={`/rooms?loc=${location.id}`}
        backLabel={`Back to ${spots}`}
      />
    );
  } else if (!active) {
    body = (
      <Unavailable
        title={`This ${spot.toLowerCase()} QR isn't available right now`}
        text={`The link is still reserved for this ${spot.toLowerCase()}. Re-activate it from ${spots} to turn the page back on.`}
        backHref={`/rooms?loc=${location.id}`}
        backLabel={`Back to ${spots}`}
      />
    );
  } else if (openBill && !participant) {
    body = (
      <JoinGate
        order={openBill}
        spotName={displaySpot}
        status={joinStatus}
        request={joinRequest}
        name={joinName}
        code={joinCode}
        codeError={joinCodeError}
        onName={setJoinName}
        onCode={setJoinCode}
        onAsk={askToJoin}
        onCancel={cancelJoin}
        onVerify={submitJoinCode}
      />
    );
  } else if (screen === "bill" && bill) {
    if (bill.status !== "completed" && !bill.billSentAt) {
      body = null;
    } else {
      const paid = bill.status === "completed";
      const payment = bill.payment || null;
      const rounds = orderRounds(bill);
      const expiresAt = bill.paidAt
        ? new Date(new Date(bill.paidAt).getTime() + PAID_BILL_WINDOW_MS).toISOString()
        : "";
      body = (
        <Panel>
          <ScreenHead
            title={paid ? "Your paid bill" : "Your bill"}
            sub={`${orderSpotName(state, bill)} · #${bill.number}`}
            onBack={() => setScreen("home")}
          />
          <div
            className={
              paid
                ? "flex items-start gap-2.5 rounded-[9px] border border-brand-green/25 bg-brand-green/[0.07] px-2.5 py-2.5"
                : "flex items-start gap-2.5 rounded-[9px] border border-brand-yellow/60 bg-amber-50 px-2.5 py-2.5"
            }
          >
            <Icon
              name={paid ? "check" : "receipt"}
              size={17}
              className={paid ? "mt-0.5 shrink-0 text-brand-green-deep" : "mt-0.5 shrink-0 text-amber-700"}
            />
            <div>
              <strong className="block text-[11.5px] font-medium">
                {paid ? "Payment received" : "Bill not paid yet"}
              </strong>
              <span className="text-[10.5px] leading-[1.5] text-ink-muted">
                {paid
                  ? `Paid ${money(payment ? payment.amount : bill.total)}${payment && payment.mode ? ` via ${payment.mode}` : ""}${bill.paidAt ? ` at ${formatTime(bill.paidAt)}` : ""}`
                  : "Pay at the counter. This bill updates automatically when the owner closes it."}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-[10px] border border-black/10 bg-white px-3 py-3">
            <div className="border-b border-black/10 pb-2">
              <strong className="block text-[13px] font-medium">{DEMO_BUSINESS.name}</strong>
              <span className="block text-[10px] text-ink-muted">
                12 Linking Road, Bandra West, Mumbai
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-muted">
              <span>#{bill.number}</span>
              <span>{orderSpotName(state, bill)}</span>
              <span>{formatTime(bill.createdAt)}</span>
            </div>
            {rounds.map((round, index) => (
              <div key={round.id} className="mt-2.5 border-t border-black/5 pt-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-[10.5px] font-medium">Round {index + 1}</strong>
                  <span className="text-[9.5px] text-ink-muted">
                    {formatTime(round.at)}
                    {round.by ? ` · ${round.by}` : ""}
                  </span>
                </div>
                {round.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-2 py-0.5 text-[10.5px]"
                  >
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span>{money(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-2">
              <span className="text-[11px] font-medium">
                Total <small className="text-[9px] font-normal text-ink-muted">taxes included</small>
              </span>
              <strong className="text-[13px] font-medium">{money(bill.total)}</strong>
            </div>
            {paid ? (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-brand-green-deep">
                <Icon name="check" size={12} /> Paid
                {payment && payment.mode ? ` via ${payment.mode}` : ""}
              </p>
            ) : null}
          </div>

          {paid ? (
            <>
              <div
                className="mt-3 text-center text-[9.5px] tabular-nums text-ink-muted"
                data-bill-expires={expiresAt}
              >
                Available for {billWindowText(paidBillRemaining(bill))}
              </div>
              <button type="button" className={btnDirect} onClick={downloadBill}>
                <Icon name="download" size={15} /> Download bill
              </button>
              <p className={noteClass}>
                <Icon name="download" size={12} />
                <span>
                  Downloads a PDF and takes you to the review. This paid bill closes automatically
                  in 5 minutes.
                </span>
              </p>
            </>
          ) : (
            <>
              <p className={noteClass}>
                <Icon name="lock" size={12} />
                <span>
                  This unpaid bill was sent by the counter. Download unlocks after payment. Every
                  round stays on this one bill.
                </span>
              </p>
              <button type="button" className={btnLink} onClick={() => setScreen("home")}>
                Back to session
              </button>
            </>
          )}
        </Panel>
      );
    }
  } else if (screen === "menu") {
    body = (
      <Panel>
        <ScreenHead
          title={config.menu.title.trim() || "Menu"}
          sub={`${displaySpot} · prices include taxes`}
          onBack={() => setScreen("home")}
        />
        {openBill && participant ? (
          <ServiceStrip
            bill={openBill}
            call={room ? serviceCallsForSpot(state, location.id, room.code)[0] ?? null : null}
            onService={() => setScreen("service")}
          />
        ) : null}
        {DEMO_MENU.categories.map((category) => (
          <div key={category.name}>
            <p className="mt-[18px] font-display text-[13px] font-medium text-[var(--cp-primary)]">
              {category.name}
            </p>
            {category.items.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-black/10 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-medium">
                      {item.name}
                      {item.tag ? <Tag>{item.tag}</Tag> : null}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-[1.5] text-ink-muted">{item.details}</p>
                    <span className="mt-1 block text-[11.5px] text-[var(--cp-primary)]">
                      {money(item.price)}
                    </span>
                  </div>
                  {room ? (
                    <div className="shrink-0">
                      {qty ? (
                        <Qty
                          qty={qty}
                          name={item.name}
                          onDec={() => changeItem(item.id, -1)}
                          onAdd={() => changeItem(item.id, 1)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="h-7 rounded-full border border-[var(--cp-primary)]/25 bg-white px-3 text-[11px] font-medium text-[var(--cp-primary)]"
                          onClick={() => changeItem(item.id, 1)}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
        {room ? <CartBar count={cartCount} total={cartTotal} onCart={openCart} /> : null}
        {room ? (
          <p className={noteClass}>
            <Icon name="bell" size={12} />
            <span>
              {openBill
                ? `These items are added to ${openBill.customerName}'s open bill — the owner sees them on ${displaySpot}.`
                : `Your order goes straight to the owner's dashboard, tagged to ${displaySpot}.`}
            </span>
          </p>
        ) : null}
      </Panel>
    );
  } else if (screen === "cart") {
    body = (
      <Panel>
        <ScreenHead
          title="Your order"
          sub={`${displaySpot} · ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          onBack={() => setScreen("menu")}
        />
        {cartLines.length ? (
          <>
            <div>
              {cartLines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 border-b border-black/10 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-medium">{item.name}</strong>
                    <span className="text-[10.5px] text-ink-muted">{money(item.price)} each</span>
                  </div>
                  <Qty
                    qty={item.qty}
                    name={item.name}
                    onDec={() => changeItem(item.id, -1)}
                    onAdd={() => changeItem(item.id, 1)}
                  />
                  <span className="w-12 text-right text-[11.5px] font-medium">
                    {money(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2.5 text-xs">
              <span>Subtotal</span>
              <strong className="text-sm font-medium">{money(cartTotal)}</strong>
            </div>
            <p className={cx(noteClass, "text-left")}>
              Pay at the {spot.toLowerCase()} after your meal. Prices include taxes.
            </p>
            <button type="button" className={btnDirect} onClick={openCheckout}>
              Continue to order <Icon name="arrowRight" size={14} />
            </button>
            <button type="button" className={btnLink} onClick={() => setScreen("menu")}>
              Add more items
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <Icon name="cart" size={26} className="text-ink-muted" />
            <h3 className="mt-2 font-display text-base font-medium text-[var(--cp-primary)]">
              Your cart is empty
            </h3>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Add something from the menu to start an order.
            </p>
            <button type="button" className={btnDirect} onClick={() => setScreen("menu")}>
              Open the menu
            </button>
          </div>
        )}
      </Panel>
    );
  } else if (screen === "checkout") {
    const continuing = Boolean(openBill && participant);
    const waiters = location.waiters || [];
    const free = availableWaiters(state, location.id);
    const newTotal = (openBill ? openBill.total : 0) + cartTotal;
    body = (
      <Panel>
        <ScreenHead
          title={continuing ? "Add to the bill" : "Confirm your order"}
          sub={`${displaySpot} · ${cartCount} item${cartCount === 1 ? "" : "s"} · ${money(cartTotal)}`}
          onBack={() => setScreen("cart")}
        />
        {checkoutError ? (
          <p className="mb-2 rounded-[8px] bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {checkoutError}
          </p>
        ) : null}
        {continuing && openBill ? (
          <>
            <div className="rounded-[10px] border border-black/10 bg-white/70 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
                  <Icon name="receipt" size={16} />
                </span>
                <div>
                  <strong className="block text-xs font-medium">
                    {openBill.customerName}&apos;s open bill
                  </strong>
                  <span className="text-[10.5px] text-ink-muted">
                    #{openBill.number} · {orderRounds(openBill).length} round
                    {orderRounds(openBill).length === 1 ? "" : "s"} · {money(openBill.total)} so far
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-[1.5] text-ink-muted">
                No need to add your name or pick a waiter again. These items join the same bill, so
                the kitchen keeps one running tab.
              </p>
            </div>
            <p className="mt-[18px] font-display text-[13px] font-medium text-[var(--cp-primary)]">
              Adding now
            </p>
            <OrderSummary lines={cartLines} totalLabel="New bill total" total={newTotal} />
          </>
        ) : (
          <>
            <div className="mt-1">
              <label className="block text-[11px] font-medium" htmlFor="order-name">
                Your name <span className="text-red-600">*</span>
              </label>
              <input
                id="order-name"
                className={cx(inputClass, "mt-1")}
                value={draft.name}
                maxLength={40}
                placeholder="So the waiter knows who ordered"
                autoComplete="name"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium" htmlFor="order-phone">
                    Phone <span className="text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="order-phone"
                    className={cx(inputClass, "mt-1")}
                    value={draft.phone}
                    maxLength={20}
                    inputMode="tel"
                    placeholder="+91…"
                    autoComplete="tel"
                    onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium" htmlFor="order-guests">
                    Guests
                  </label>
                  <select
                    id="order-guests"
                    className={cx(inputClass, "mt-1")}
                    value={draft.guests}
                    onChange={(event) =>
                      setDraft({ ...draft, guests: Number(event.target.value) })
                    }
                  >
                    {GUESTS_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="mt-[18px] font-display text-[13px] font-medium text-[var(--cp-primary)]">
              Who is serving you?
            </p>
            <p className="mt-1 text-[11px] leading-[1.5] text-ink-muted">
              Busy waiters are shown as not available — each waiter can only take the number of{" "}
              {spots.toLowerCase()} the owner allows.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                className={cx(waiterClass(draft.waiterId === "auto"), "text-left")}
                onClick={() => {
                  setDraft({ ...draft, waiterId: "auto" });
                  setCheckoutError("");
                }}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
                  <Icon name="users" size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[11.5px] font-medium">Any available waiter</strong>
                  <span className="block text-[10.5px] text-ink-muted">
                    {free.length
                      ? `${free[0].name} is free right now`
                      : "All waiters are at capacity — the counter will assign the next one"}
                  </span>
                </span>
                <span className={cx("text-[9.5px] font-medium", free.length ? "text-brand-green-deep" : "text-ink-muted")}>
                  {free.length ? "Available" : "Waitlist"}
                </span>
              </button>
              {waiters.map((waiter) => {
                const load = waiterLoad(state, location.id, waiter.id);
                const full = !waiter.active || load >= waiter.maxTables;
                return (
                  <button
                    key={waiter.id}
                    type="button"
                    disabled={full}
                    className={cx(
                      waiterClass(draft.waiterId === waiter.id),
                      full && "opacity-55",
                      "text-left",
                    )}
                    onClick={() => {
                      setDraft({ ...draft, waiterId: waiter.id });
                      setCheckoutError("");
                    }}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--cp-secondary)] text-[10px] font-medium text-[var(--cp-primary)]">
                      {waiter.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[11.5px] font-medium">{waiter.name}</strong>
                      <span className="block text-[10.5px] text-ink-muted">
                        {waiter.active
                          ? `${load} of ${waiter.maxTables} ${spots.toLowerCase()} · ${full ? "not accepting more" : `${waiter.maxTables - load} free`}`
                          : "Not accepting orders right now"}
                      </span>
                    </span>
                    <span className="text-[9.5px] font-medium">
                      {!waiter.active ? "Paused" : full ? "At capacity" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>
            <OrderSummary lines={cartLines} totalLabel="Total" total={cartTotal} />
          </>
        )}
        <button type="button" className={btnDirect} onClick={submitOrder}>
          {continuing && openBill
            ? `Add to bill · ${money(newTotal)}`
            : `Place order · ${money(cartTotal)}`}
        </button>
        <p className={noteClass}>
          <Icon name="bell" size={12} />
          <span>
            {continuing && openBill
              ? `The kitchen gets these extra items and ${openBill.customerName}'s bill grows to ${money(newTotal)}.`
              : `The kitchen gets it instantly with your name and ${displaySpot}.`}
          </span>
        </p>
      </Panel>
    );
  } else if (screen === "order-done") {
    const order = lastOrder;
    if (!order) {
      body = (
        <Panel>
          <HomeHead
            spotName={displaySpot}
            ordering={Boolean(room)}
            announcement={config.announcement.on ? config.announcement.text : ""}
          />
        </Panel>
      );
    } else {
      const rounds = orderRounds(order);
      const round = lastRound || rounds[rounds.length - 1] || null;
      const added = lastAdded && rounds.length > 1;
      const roundItems = round ? round.items : order.items;
      const roundTotal = round ? round.total : order.total;
      const liveBill = order.code ? findOpenBill(state, order.locId, order.code) : null;
      body = (
        <Panel>
          <div className="py-2 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/15 text-brand-green-deep">
              <Icon name="check" size={24} />
            </div>
            <h3 className="mt-2 font-display text-lg font-medium text-[var(--cp-primary)]">
              {added ? "Added to the bill" : "Order placed"}
            </h3>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              {orderSpotName(state, order)} ·{" "}
              {added
                ? `${order.customerName}'s bill #${order.number} · round ${rounds.length}`
                : `#${order.number} · ${formatTime(order.createdAt)}`}
            </p>
          </div>
          <div className="mt-3 rounded-[10px] border border-black/10 bg-white/70 p-3">
            <DoneRow label={spot} value={orderSpotName(state, order)} />
            <DoneRow label="Name" value={order.customerName} />
            <DoneRow label="Waiter" value={waiterName(state, order.locId, order.waiterId)} />
            <DoneRow label="Guests" value={String(order.guests)} />
            {round ? <DoneRow label="This round" value={money(roundTotal)} /> : null}
            <DoneRow label="Status" value="With the kitchen" />
            {roundItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-2 border-t border-black/5 py-1 text-[10.5px] text-ink-muted"
              >
                <span>
                  {item.qty}× {item.name}
                </span>
                <span>{money(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-black/10 pt-2 text-xs font-medium">
              <span>{added ? "Bill total" : "Total"}</span>
              <strong>{money(order.total)}</strong>
            </div>
          </div>
          <p className={noteClass}>
            <Icon name="bell" size={12} />
            <span>
              {added
                ? `No new bill was created — these items joined ${order.customerName}'s open bill and the owner's dashboard rang on ${orderSpotName(state, order)}.`
                : `The owner's dashboard just rang with this order and highlighted ${orderSpotName(state, order)}.`}
            </span>
          </p>
          <Link href={`/orders?loc=${order.locId}`} className={btnDirect}>
            See it on the owner dashboard (demo)
          </Link>
          <div className="mt-2.5 flex flex-col gap-2">
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-[10px] border border-black/10 bg-white/70 p-2.5 text-left"
              onClick={() => sendService("waiter")}
            >
              <Icon name="bell" size={19} className="text-[var(--cp-primary)]" />
              <span>
                <strong className="block text-[11.5px] font-medium">Call waiter</strong>
                <span className="block text-[10.5px] text-ink-muted">
                  Ring the counter for {orderSpotName(state, order)}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11.5px] text-ink-muted"
              onClick={() => setScreen("home")}
            >
              <Icon name="arrowLeft" size={16} /> Back to home page
            </button>
          </div>
          {wifiUnlockedForOrder(liveBill, config, businessType) ? (
            <button type="button" className={btnLink} onClick={openWifi}>
              <Icon name="wifi" size={14} /> Wi-Fi password
            </button>
          ) : null}
          {liveBill && liveBill.billSentAt ? (
            <button type="button" className={btnLink} onClick={openBillScreen}>
              <Icon name="receipt" size={14} /> View bill
            </button>
          ) : null}
          <button type="button" className={btnLink} onClick={() => setScreen("menu")}>
            Order something else
          </button>
        </Panel>
      );
    }
  } else if (screen === "service") {
    const calls = room ? serviceCallsForSpot(state, location.id, room.code) : [];
    const waiterCall = calls.find((item) => item.kind === "waiter");
    const billCall = calls.find((item) => item.kind === "bill");
    body = openBill ? (
      <Panel>
        <ScreenHead
          title="Call a waiter"
          sub={`${displaySpot} · bill #${openBill.number} · ${money(openBill.total)}`}
          onBack={() => setScreen("home")}
        />
        <p className="text-[11px] leading-[1.55] text-ink-muted">
          The counter hears a bell and sees your {spot.toLowerCase()} on the dashboard. Pick what
          you need.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="flex items-center gap-3 rounded-[10px] border border-black/10 bg-white/70 p-3 text-left"
            onClick={() => sendService("waiter")}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="bell" size={21} />
            </span>
            <span>
              <strong className="block text-xs font-medium">Waiter</strong>
              <span className="block text-[10.5px] text-ink-muted">
                Someone comes to your {spot.toLowerCase()}.
              </span>
              {waiterCall ? (
                <em className="mt-0.5 block text-[10px] not-italic text-ink-muted">
                  Already asked at {formatTime(waiterCall.createdAt)}
                </em>
              ) : null}
            </span>
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-[10px] border border-black/10 bg-white/70 p-3 text-left"
            onClick={() => sendService("bill")}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="receipt" size={21} />
            </span>
            <span>
              <strong className="block text-xs font-medium">Bill</strong>
              <span className="block text-[10.5px] text-ink-muted">
                Bring the bill for {money(openBill.total)}.
              </span>
              {billCall ? (
                <em className="mt-0.5 block text-[10px] not-italic text-ink-muted">
                  Already asked at {formatTime(billCall.createdAt)}
                </em>
              ) : null}
            </span>
          </button>
        </div>
        <button type="button" className={btnLink} onClick={() => setScreen("menu")}>
          Order food instead
        </button>
      </Panel>
    ) : (
      <Panel>
        <HomeHead
          spotName={displaySpot}
          ordering={Boolean(room)}
          announcement={config.announcement.on ? config.announcement.text : ""}
        />
      </Panel>
    );
  } else if (screen === "service-sent") {
    const bill = lastCall ? findOpenBill(state, lastCall.locId, lastCall.code) : null;
    const isBill = lastCall?.kind === "bill";
    body = (
      <Panel>
        <div className="py-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
            <Icon name={isBill ? "receipt" : "bell"} size={26} />
          </div>
          <h3 className="mt-2 font-display text-lg font-medium text-[var(--cp-primary)]">
            {isBill ? "Bill requested" : "Waiter called"}
          </h3>
          <p className="mt-1 text-[11.5px] text-ink-muted">
            {lastCall ? `${displaySpot} · ${formatTime(lastCall.createdAt)}` : displaySpot}
          </p>
          <div className="mt-4 flex items-start gap-1.5 rounded-[9px] bg-white/70 p-3 text-left text-[10.5px] leading-[1.55] text-ink-muted">
            <Icon name="bell" size={13} className="mt-0.5 shrink-0" />
            <span>
              The owner&apos;s dashboard just rang{bill ? ` on bill #${bill.number}` : ""} and
              highlighted {displaySpot}.{" "}
              {isBill ? "The waiter is bringing your bill." : "Someone will be with you shortly."}
            </span>
          </div>
          {bill && bill.billSentAt ? (
            <button type="button" className={btnLink} onClick={openBillScreen}>
              <Icon name="receipt" size={13} /> View bill
            </button>
          ) : null}
          <button type="button" className={btnDirect} onClick={() => setScreen("menu")}>
            Order food
          </button>
          <button type="button" className={btnLink} onClick={() => setScreen("home")}>
            Back to the page
          </button>
        </div>
      </Panel>
    );
  } else if (screen === "wifi" && wifiReady) {
    body = (
      <Panel>
        <ScreenHead
          title="Wi-Fi"
          sub="Unlocked with your accepted order."
          onBack={() => setScreen("home")}
        />
        <div className="py-4 text-center">
          <div className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
            <Icon name="wifi" size={24} />
          </div>
          <p className="mt-2.5 font-display text-[13px] font-medium text-[var(--cp-primary)]">
            {config.wifi.ssid}
          </p>
          <p className="mt-1 text-[10.5px] text-ink-muted">Password</p>
          <p className="mt-1 text-lg text-[var(--cp-primary)]">{config.wifi.password}</p>
          <button
            type="button"
            className={btnLink}
            onClick={() => copyText(config.wifi.password, () => setToast("Wi-Fi password copied."))}
          >
            Copy password
          </button>
          <p className={noteClass}>
            <Icon name="lock" size={11} />
            <span>Shared only with guests whose order was accepted.</span>
          </p>
        </div>
      </Panel>
    );
  } else if (screen === "chooser") {
    body = (
      <Panel>
        <ScreenHead
          title="Thank you!"
          sub="How would you like to continue?"
          onBack={() => setScreen("home")}
        />
        <div className="px-0 py-4 text-center">
          <h3 className="font-display text-[19px] font-medium text-[var(--cp-primary)]">
            Both options help {DEMO_BUSINESS.name}
          </h3>
          <p className="mt-1.5 text-[11.5px] leading-[1.5] text-slate-600">
            Pick whichever feels right. There is no wrong choice — you can always do both.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-[10px] border border-black/10 bg-white/70 p-3 text-left"
            onClick={() => setScreen("google")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="loyalty" size={17} />
            </span>
            <span>
              <strong className="block text-[11.5px] font-medium">Continue on Google</strong>
              <p className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">
                Share your experience publicly in a Google review.
              </p>
            </span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-[10px] border border-black/10 bg-white/70 p-3 text-left"
            onClick={() => setScreen("feedback")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="feedback" size={17} />
            </span>
            <span>
              <strong className="block text-[11.5px] font-medium">Contact the owner</strong>
              <p className="mt-0.5 text-[10.5px] leading-[1.5] text-ink-muted">
                Send a private message — the owner and our team read every one.
              </p>
            </span>
          </button>
        </div>
        <p className="mt-3 text-center text-[10.5px] text-ink-muted">
          No wrong choice — you can always do both.
        </p>
      </Panel>
    );
  } else if (screen === "google") {
    body = (
      <Panel>
        <ScreenHead
          title="Google review"
          sub="Two ways to do it — pick whichever is easier."
          onBack={() => setScreen("chooser")}
        />
        <p className="text-left text-[13.5px] font-medium text-slate-700">Post a review on Google</p>
        <p className="mt-1.5 text-left text-[10.5px] leading-[1.5] text-ink-muted">
          Opens Google — write whatever feels right.
        </p>
        <a
          href={DEMO_BUSINESS.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnDirect}
        >
          <Icon name="external" size={14} /> Post a review on Google
        </a>
        <p className="mt-[22px] text-left text-[13.5px] font-medium text-slate-700">
          Want us to write it for you?
        </p>
        <p className="mt-1.5 text-left text-[10.5px] leading-[1.5] text-ink-muted">
          Answer a few quick questions and we will write a review you can copy and paste on Google.
        </p>
        <button
          type="button"
          className={btnLink}
          onClick={() => setToast("The review writer isn't part of this concept demo.")}
        >
          Write it for me
        </button>
      </Panel>
    );
  } else if (screen === "feedback") {
    body = (
      <Panel>
        <ScreenHead
          title="What's on your mind?"
          sub="The owner and our team read every message."
          onBack={() => setScreen("chooser")}
        />
        <p className="text-left text-[10.5px] leading-[1.5] text-ink-muted">
          We appreciate you taking the time to help us improve.
        </p>
        <textarea
          className={cx(inputClass, "mt-2 h-24 resize-none py-2")}
          maxLength={1000}
          placeholder="Tell the owner what happened…"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
        {feedbackError ? <p className="mt-1 text-[11px] text-red-600">{feedbackError}</p> : null}
        <input
          className={cx(inputClass, "mt-2")}
          type="email"
          placeholder="Email (optional)"
          value={feedbackEmail}
          onChange={(event) => setFeedbackEmail(event.target.value)}
        />
        <button
          type="button"
          className={btnDirect}
          onClick={() => {
            if (!feedback.trim()) {
              setFeedbackError("Please write a short message.");
              return;
            }
            setFeedbackError("");
            setScreen("thanks");
          }}
        >
          Send to the owner
        </button>
      </Panel>
    );
  } else if (screen === "thanks") {
    body = (
      <Panel>
        <div className="py-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-green/15 text-brand-green-deep">
            <Icon name="check" size={24} />
          </div>
          <h3 className="mt-2 font-display text-lg font-medium text-[var(--cp-primary)]">
            Thank you!
          </h3>
          <p className="mx-auto mt-1 max-w-[280px] text-[11.5px] leading-[1.6] text-ink-muted">
            {config.thankYou.slice(0, 160) || "We appreciate you taking the time to help us improve."}
          </p>
          <button type="button" className={cx(btnLink, "mt-4")} onClick={() => setScreen("home")}>
            Back to the page
          </button>
        </div>
      </Panel>
    );
  } else if (screen === "hours") {
    body = (
      <Panel>
        <ScreenHead
          title="Hours and contact"
          sub={config.hours.address}
          onBack={() => setScreen("home")}
        />
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-medium text-brand-green-deep">
            Open now
          </span>
          <span className="text-[11px] text-ink-muted">Closes 21:00</span>
        </div>
        {DEMO_WEEK.map(([day, time]) => (
          <div
            key={day}
            className="flex justify-between border-b border-black/5 py-1.5 text-[11.5px]"
          >
            <span>{day}</span>
            <span>{time}</span>
          </div>
        ))}
        <p className="mt-3 text-[11.5px] leading-[1.6] text-ink-muted">
          {config.hours.address}
          <br />
          {config.hours.phone}
        </p>
        <a href={`tel:${config.hours.phone}`} className={cx(btnLink, "mt-2.5")}>
          <Icon name="phone" size={14} /> Call
        </a>
      </Panel>
    );
  } else {
    const calls = room ? serviceCallsForSpot(state, location.id, room.code) : [];
    const waiterCall = calls.find((item) => item.kind === "waiter") || null;
    const billCall = calls.find((item) => item.kind === "bill") || null;
    body = (
      <Panel>
        {config.announcement.on && config.announcement.text.trim() ? (
          <div className="mb-[18px] rounded-control bg-[var(--cp-primary)] px-3 py-2.5 text-center text-[11.5px] leading-[1.45] text-white">
            {config.announcement.text.slice(0, 160)}
          </div>
        ) : null}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--cp-secondary)] font-display text-xl font-medium tracking-[0.02em] text-[var(--cp-primary)]">
          {DEMO_BUSINESS.initials}
        </div>
        <h1 className="mt-2.5 text-center font-display text-[22px] font-medium leading-[1.2] text-[var(--cp-primary)]">
          {DEMO_BUSINESS.name}
        </h1>
        <p className="mt-[3px] text-center text-[12.5px] text-slate-600">{DEMO_BUSINESS.tagline}</p>
        {room ? (
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-[9px] bg-white/70 px-3 py-2 text-[11.5px] text-ink-muted">
            <Icon name="qr" size={13} />
            <span>
              Ordering for <strong className="font-medium text-ink">{displaySpot}</strong>
            </span>
          </div>
        ) : null}
        {openBill && participant ? (
          <div className="mt-3 flex items-start gap-2 rounded-[9px] bg-white/70 p-3 text-[11px]">
            <Icon name="receipt" size={15} className="mt-0.5 shrink-0 text-[var(--cp-primary)]" />
            <div>
              <strong className="block text-[11.5px] font-medium">
                {openBill.customerName}&apos;s bill is open
              </strong>
              <span className="text-[10.5px] leading-[1.5] text-ink-muted">
                {money(openBill.total)} so far · anything you add joins this same bill. No name or
                waiter needed.
              </span>
            </div>
          </div>
        ) : null}
        {participant && participant.role === "guest" && openBill ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-[9px] bg-white/70 px-3 py-2 text-[10.5px] text-ink-muted">
            <Icon name="users" size={13} />
            <span>
              You&apos;re ordering as <strong className="font-medium text-ink">{participant.name}</strong>{" "}
              · joined with {openBill.customerName}
            </span>
          </div>
        ) : null}
        {paidBill ? (
          <section
            aria-label="Paid bill"
            className="mt-3 rounded-[10px] border border-brand-green/25 bg-white/75 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-green/15 text-brand-green-deep">
                <Icon name="check" size={16} />
              </span>
              <div>
                <strong className="block text-[11.5px] font-medium">Payment received — thank you!</strong>
                <span className="text-[10.5px] leading-[1.5] text-ink-muted">
                  Bill #{paidBill.number} is paid. Download it before the window closes.
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-2">
              <span className="text-[11px] text-ink-muted">
                {orderSpotName(state, paidBill)}
              </span>
              <strong className="text-sm font-medium">{money(paidBill.total)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--cp-primary)] px-2.5 py-1.5 text-[10.5px] font-medium text-white"
                onClick={openBillScreen}
              >
                <Icon name="receipt" size={14} /> View &amp; download
              </button>
              <span
                className="text-[9.5px] tabular-nums text-ink-muted"
                data-bill-expires={new Date(
                  new Date(paidBill.paidAt as string).getTime() + PAID_BILL_WINDOW_MS,
                ).toISOString()}
              >
                Available for {billWindowText(paidBillRemaining(paidBill))}
              </span>
            </div>
          </section>
        ) : null}
        {openBill && participant ? (
          <div className="mt-3 rounded-[10px] border border-black/10 bg-white/70 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
                <Icon name="bell" size={17} />
              </span>
              <div>
                <strong className="block text-[11.5px] font-medium">
                  Your {spot.toLowerCase()} is open
                </strong>
                <span className="text-[10.5px] text-ink-muted">
                  {participant.role === "guest" ? participant.name : openBill.customerName} · bill #
                  {openBill.number} · {money(openBill.total)} so far
                </span>
              </div>
            </div>
            {waiterCall ? (
              <p className="mt-1.5 text-[10.5px] text-brand-green-deep">
                Waiter called at {formatTime(waiterCall.createdAt)} — someone is on the way.
              </p>
            ) : null}
            {billCall ? (
              <p className="mt-1.5 text-[10.5px] text-brand-blue">
                Bill requested at {formatTime(billCall.createdAt)} — waiting for the counter to send
                it.
              </p>
            ) : null}
            {openBill.billSentAt ? (
              <p className="mt-1.5 text-[10.5px] text-brand-blue">
                <Icon name="receipt" size={12} /> Bill sent at {formatTime(openBill.billSentAt)} —
                open it from the Bill option below.
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-[9px] border border-black/10 bg-white px-2 py-2 text-left text-[10.5px] font-medium text-[var(--cp-primary)]"
                onClick={() => setScreen("service")}
              >
                <Icon name="bell" size={16} />
                <span>
                  <strong className="block font-medium">Call waiter</strong>
                  <span className="block text-[9.5px] font-normal text-ink-muted">
                    {waiterCall || billCall
                      ? "A request is already with the counter"
                      : "Waiter or bill — pick next"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[9px] border border-black/10 bg-white px-2 py-2 text-left text-[10.5px] font-medium text-[var(--cp-primary)]"
                onClick={() => setScreen("menu")}
              >
                <Icon name="utensils" size={16} />
                <span>
                  <strong className="block font-medium">Order food</strong>
                  <span className="block text-[9.5px] font-normal text-ink-muted">
                    Adds to this same bill
                  </span>
                </span>
              </button>
            </div>
          </div>
        ) : null}
        <p className="mt-[22px] text-center text-[13.5px] font-medium text-slate-700">
          How was your experience?
        </p>
        <div className="mt-2.5 flex flex-col gap-2">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[12px] border border-black/10 bg-white/70 p-2.5 text-left"
            onClick={() => setScreen("chooser")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="thumbUp" size={17} />
            </span>
            <span>
              <strong className="block text-[11.5px] font-medium">Great</strong>
              <span className="block text-[10.5px] leading-[1.4] text-ink-muted">
                Continue on Google or message the owner.
              </span>
            </span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[12px] border border-black/10 bg-white/70 p-2.5 text-left"
            onClick={() => setScreen("chooser")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
              <Icon name="thumbDown" size={17} />
            </span>
            <span>
              <strong className="block text-[11.5px] font-medium">Not great</strong>
              <span className="block text-[10.5px] leading-[1.4] text-ink-muted">
                Tell the owner privately — we read every message.
              </span>
            </span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {config.menu.on ? (
            <Tile icon="utensils" label={config.menu.title.trim() || "Menu"} onClick={() => setScreen("menu")} />
          ) : null}
          {openBill && openBill.billSentAt ? (
            <Tile icon="receipt" label="Bill" onClick={openBillScreen} />
          ) : null}
          {!openBill && paidBill ? (
            <Tile icon="receipt" label="Paid bill" onClick={openBillScreen} />
          ) : null}
          {wifiReady ? <Tile icon="wifi" label="Wi-Fi" onClick={openWifi} /> : null}
          {config.hours.on ? (
            <Tile icon="clock" label="Hours and contact" onClick={() => setScreen("hours")} />
          ) : null}
          {config.call.on ? (
            <Tile icon="phone" label="Call" href={`tel:${config.call.phone}`} />
          ) : null}
          {config.directions.on && config.directions.value.trim() ? (
            <Tile
              icon="map"
              label="Directions"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.directions.value)}`}
            />
          ) : null}
          {config.custom.on && config.custom.label.trim() ? (
            <Tile icon="link" label={config.custom.label} href={config.custom.url} />
          ) : null}
        </div>
        {config.socials.instagram || config.socials.website ? (
          <div className="mt-4 flex justify-center gap-2">
            {config.socials.instagram ? (
              <a
                href={config.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 text-[var(--cp-primary)]"
              >
                <Icon name="instagram" size={16} />
              </a>
            ) : null}
            {config.socials.website ? (
              <a
                href={config.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 text-[var(--cp-primary)]"
              >
                <Icon name="globe" size={16} />
              </a>
            ) : null}
          </div>
        ) : null}
        {cartCount ? (
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between rounded-full bg-white px-3 py-2 text-[11.5px] shadow-soft"
            onClick={openCart}
          >
            <span className="flex items-center gap-1.5">
              <Icon name="cart" size={16} /> {cartCount} item{cartCount === 1 ? "" : "s"}
            </span>
            <strong className="font-medium">{money(cartTotal)}</strong>
            <Icon name="arrowRight" size={14} />
          </button>
        ) : null}
        <p className="mt-5 text-center text-[9.5px] leading-[1.5] text-ink-muted">
          Powered by Syehere
        </p>
      </Panel>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]" style={theme}>
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2.5 border-b border-black/10 bg-white px-[18px] py-2.5 text-xs">
        <Link
          href={`/rooms?loc=${location.id}`}
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink"
        >
          <Icon name="arrowLeft" size={15} /> Back to demo
        </Link>
        <Badge tone={room ? "blue" : "green"}>
          {room ? `${spot} QR · ${room.code.toUpperCase()}` : "Reception QR"}
        </Badge>
        <span className="font-medium">
          {room ? `${displaySpot} · ${location.name}` : location.name}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}
          onClick={() => copyText(url, () => setToast("Link copied."))}
        >
          Copy link
        </button>
        <Link
          href={`/customer-page?loc=${location.id}&kind=${kind}`}
          className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}
        >
          Edit {room ? spots : "reception"} page
        </Link>
        <Link href={otherHref} className={cx(btnOutline, "h-8 px-2.5 text-[11.5px]")}>
          {otherLabel}
        </Link>
      </div>

      <div className="mx-auto max-w-[480px] px-[18px] pb-14 pt-6">
        <div className="overflow-hidden rounded-[18px] shadow-soft">
          {openBill && participant?.role === "host" ? (
            <HostPanel
              order={openBill}
              participant={participant}
              guestUrl={url}
              requests={state.joinRequests.filter((request) => request.orderId === openBill.id)}
              onApprove={approveRequest}
              onDeny={denyRequest}
              onRegenerate={regenerateCode}
            />
          ) : null}
          {body}
        </div>
        {known && active ? (
          <p className="mt-3.5 rounded-[9px] bg-white/60 px-3 py-2.5 text-center text-[11px] leading-[1.55] text-slate-600">
            {room ? (
              <>
                <strong className="font-medium text-ink">
                  {room.code.toUpperCase()} · {displaySpot}
                </strong>{" "}
                — this is the shared {spots} page for {location.name}. The other{" "}
                {Math.max(activeRooms - 1, 0)} {spot.toLowerCase()} QR
                {activeRooms - 1 === 1 ? "" : "s"} here show exactly the same page, but orders are
                tagged to {displaySpot}.
              </>
            ) : (
              <>
                <strong className="font-medium text-ink">Reception QR</strong> — this page is
                separate from the {spots} pages. Editing it never changes a {spot.toLowerCase()} QR.
              </>
            )}
          </p>
        ) : null}
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-xs text-white shadow-soft"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function HomeHead({
  announcement,
  spotName,
  ordering,
}: {
  announcement: string;
  spotName: string;
  ordering: boolean;
}) {
  return (
    <>
      {announcement ? (
        <div className="mb-[18px] rounded-control bg-[var(--cp-primary)] px-3 py-2.5 text-center text-[11.5px] leading-[1.45] text-white">
          {announcement.slice(0, 160)}
        </div>
      ) : null}
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--cp-secondary)] font-display text-xl font-medium tracking-[0.02em] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.initials}
      </div>
      <h1 className="mt-2.5 text-center font-display text-[22px] font-medium leading-[1.2] text-[var(--cp-primary)]">
        {DEMO_BUSINESS.name}
      </h1>
      <p className="mt-[3px] text-center text-[12.5px] text-slate-600">{DEMO_BUSINESS.tagline}</p>
      {ordering ? (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-[9px] bg-white/70 px-3 py-2 text-[11.5px] text-ink-muted">
          <Icon name="qr" size={13} />
          <span>
            Ordering for <strong className="font-medium text-ink">{spotName}</strong>
          </span>
        </div>
      ) : null}
      <p className="mt-5 text-center text-[9.5px] leading-[1.5] text-ink-muted">Powered by Syehere</p>
    </>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="bg-[var(--cp-bg)] px-5 pb-[30px] pt-[26px]">{children}</div>;
}

function ScreenHead({
  title,
  sub,
  onBack,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-[18px] flex items-center gap-2.5">
      <button
        type="button"
        aria-label="Back"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--cp-primary)]/15 bg-white/65 text-[var(--cp-primary)]"
        onClick={onBack}
      >
        <Icon name="arrowLeft" size={16} />
      </button>
      <div>
        <p className="font-display text-base font-medium text-[var(--cp-primary)]">{title}</p>
        {sub ? <p className="mt-0.5 text-[11px] text-ink-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

function Qty({
  qty,
  name,
  onDec,
  onAdd,
}: {
  qty: number;
  name: string;
  onDec: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-1.5 py-1">
      <button type="button" aria-label={`Remove one ${name}`} onClick={onDec}>
        <Icon name="minus" size={12} />
      </button>
      <span className="min-w-[14px] text-center text-[11.5px]">{qty}</span>
      <button type="button" aria-label={`Add one ${name}`} onClick={onAdd}>
        <Icon name="plus" size={12} />
      </button>
    </div>
  );
}

function CartBar({ count, total, onCart }: { count: number; total: number; onCart: () => void }) {
  if (!count) return null;
  return (
    <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-2 rounded-[10px] bg-[var(--cp-primary)] px-3 py-2.5 text-white">
      <span className="flex items-center gap-1.5 text-[11.5px]">
        <Icon name="cart" size={16} /> <strong className="font-medium">{count}</strong> item
        {count === 1 ? "" : "s"} · {money(total)}
      </span>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium"
        onClick={onCart}
      >
        View cart <Icon name="arrowRight" size={14} />
      </button>
    </div>
  );
}

function ServiceStrip({
  bill,
  call,
  onService,
}: {
  bill: Order;
  call: ServiceCall | null;
  onService: () => void;
}) {
  return (
    <div className="mb-1 flex items-center gap-2.5 rounded-[10px] bg-white/70 p-2.5 text-[10.5px]">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--cp-secondary)] text-[var(--cp-primary)]">
        <Icon name={call ? "check" : "bell"} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block text-[11px] font-medium">
          {call ? serviceKindTitle(call.kind) : "Need something?"}
        </strong>
        <span className="text-ink-muted">
          {call
            ? `Sent at ${formatTime(call.createdAt)} · bill #${bill.number}`
            : `Bill #${bill.number} · call a waiter or ask for the bill`}
        </span>
      </div>
      {call ? null : (
        <button
          type="button"
          className="shrink-0 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10.5px] font-medium text-[var(--cp-primary)]"
          onClick={onService}
        >
          Call waiter
        </button>
      )}
    </div>
  );
}

function OrderSummary({
  lines,
  totalLabel,
  total,
}: {
  lines: Array<{ id: string; name: string; price: number; qty: number }>;
  totalLabel: string;
  total: number;
}) {
  return (
    <div className="mt-3 rounded-[10px] border border-black/10 bg-white/70 p-3">
      {lines.map((item) => (
        <div key={item.id} className="flex justify-between gap-2 py-0.5 text-[11px]">
          <span>
            {item.qty}× {item.name}
          </span>
          <span>{money(item.price * item.qty)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-black/10 pt-2 text-xs font-medium">
        <span>{totalLabel}</span>
        <strong>{money(total)}</strong>
      </div>
    </div>
  );
}

function DoneRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-black/5 py-1.5 text-[11px] last:border-0">
      <span className="text-ink-muted">{label}</span>
      <strong className="font-medium">{value}</strong>
    </div>
  );
}

function Tile({
  icon,
  label,
  onClick,
  href,
}: {
  icon: "utensils" | "wifi" | "clock" | "phone" | "map" | "link" | "receipt";
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex flex-col items-center gap-1.5 rounded-[10px] border border-black/10 bg-white/70 px-2 py-3 text-center text-[11.5px] text-[var(--cp-primary)]";
  const content = (
    <>
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-yellow/25 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.03em] text-yellow-900">
      {children}
    </span>
  );
}

function waiterClass(selected: boolean): string {
  return cx(
    "flex w-full items-center gap-2.5 rounded-[10px] border bg-white/70 p-2.5",
    selected ? "border-[var(--cp-primary)]" : "border-black/10",
  );
}

function Unavailable({
  title,
  text,
  backHref,
  backLabel,
}: {
  title: string;
  text: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--cp-bg)] p-[30px] text-center">
      <h1 className="text-xl font-medium text-ink">{title}</h1>
      <p className="mt-[7px] text-[12.5px] leading-[1.6] text-ink-muted">{text}</p>
      <Link
        href={backHref}
        className="mt-4 block w-full max-w-[220px] rounded-[10px] border border-black/10 bg-white/70 px-3 py-[11px] text-xs font-medium text-[var(--cp-primary)]"
      >
        {backLabel}
      </Link>
    </div>
  );
}

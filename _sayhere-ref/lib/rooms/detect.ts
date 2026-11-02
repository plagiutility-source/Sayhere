/**
 * Live-event detection, ported from the demo's `detectIncomingOrders` and
 * `detectServiceCalls`.
 *
 * The demo keeps `knownRoundIds` / `knownServiceCallIds` sets and only reacts
 * to state that arrived from another tab. These helpers do the same bookkeeping
 * while staying pure enough to test: the caller passes its `known` set and the
 * function adds every id it has seen.
 */

import { activeServiceCalls, orderRounds } from "./rules";
import type { Order, Round, RoomsState, ServiceCall } from "./types";

export type FreshRound = { order: Order; round: Round };

/** DOM event used by the DEV-ONLY simulate tool to raise the alert locally. */
export const LIVE_ALERT_EVENT = "rooms:live-alert";
export type LiveAlertDetail = {
  orderId: string;
  kind: "order" | "round";
  roundId: string | null;
  at: string;
};

/** Every unseen round, oldest first; the demo rings for the latest one. */
export function freshRounds(state: RoomsState, known: Set<string>): FreshRound[] {
  const fresh: FreshRound[] = [];
  (state.orders || []).forEach((order) => {
    orderRounds(order).forEach((round) => {
      if (!known.has(round.id)) {
        known.add(round.id);
        fresh.push({ order, round });
      }
    });
  });
  fresh.sort((a, b) => new Date(a.round.at).getTime() - new Date(b.round.at).getTime());
  return fresh;
}

/** Every unseen open call; resolved calls are never fresh. */
export function freshServiceCalls(state: RoomsState, known: Set<string>): ServiceCall[] {
  const current = activeServiceCalls(state);
  const fresh = current.filter((call) => !known.has(call.id));
  current.forEach((call) => known.add(call.id));
  return fresh;
}

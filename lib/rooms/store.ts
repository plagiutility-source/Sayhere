"use client";

/**
 * The local store for the standalone build (spec section 4).
 *
 * - State is one blob under `syehere.mock.rooms.v1`; invalid data falls back to
 *   the seed (the same approach as the SaaS `lib/mock/store.ts`).
 * - The newest `savedAt` wins across tabs, via the `storage` event plus a
 *   2500 ms poll.
 * - The device id lives in `sessionStorage`, so two tabs act as two phones (E3).
 */

import { useCallback, useEffect, useState } from "react";
import { POLL_INTERVAL_MS, STORAGE_KEYS } from "./constants";
import { ensureShape, seedState } from "./seed";
import type { RoomsState } from "./types";

/** Top-level validation: the demo's `loadState` check. */
export function hasRoomsShape(value: unknown): value is RoomsState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoomsState>;
  return (
    Array.isArray(candidate.locations) &&
    Boolean(candidate.configs) &&
    typeof candidate.configs === "object"
  );
}

/** Parse and normalise saved JSON; null when it is corrupt or the wrong shape. */
export function stateFromRaw(raw: string | null): RoomsState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!hasRoomsShape(parsed)) return null;
    return ensureShape(parsed);
  } catch {
    return null;
  }
}

/** Corrupt or invalid stored JSON falls back to the seed (checklist F.28). */
export function seedOrStored(raw: string | null): RoomsState {
  return stateFromRaw(raw) ?? seedState();
}

function readStorage(): RoomsState | null {
  try {
    if (typeof window === "undefined") return null;
    return stateFromRaw(window.localStorage.getItem(STORAGE_KEYS.state));
  } catch {
    return null;
  }
}

/** The newest state this tab has seen. */
let latest: RoomsState | null = null;

function adopt(candidate: RoomsState): RoomsState {
  if (!latest || candidate.savedAt > latest.savedAt) latest = candidate;
  return latest;
}

export function loadRoomsState(): RoomsState {
  const stored = readStorage();
  if (stored) return adopt(stored);
  return latest || adopt(seedState());
}

/** Persist with a fresh `savedAt` so other tabs accept it. */
export function saveRoomsState(state: RoomsState): RoomsState {
  const next: RoomsState = { ...ensureShape(state), savedAt: Date.now() };
  latest = next;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(next));
    }
  } catch {
    /* The demo still works in memory if storage is unavailable. */
  }
  return next;
}

/** `storage` event + 2500 ms poll; only a newer `savedAt` is adopted. */
export function subscribe(listener: (state: RoomsState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const start = readStorage();
  if (start) adopt(start);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.state) return;
    const candidate = stateFromRaw(event.newValue);
    if (!candidate) return;
    if (latest && candidate.savedAt <= latest.savedAt) return;
    listener(adopt(candidate));
  };

  window.addEventListener("storage", onStorage);
  const timer = window.setInterval(() => {
    const candidate = readStorage();
    if (!candidate) return;
    if (latest && candidate.savedAt <= latest.savedAt) return;
    listener(adopt(candidate));
  }, POLL_INTERVAL_MS);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.clearInterval(timer);
  };
}

let memoryDeviceId = "";

/** E3 — a per-tab device id; falls back to memory when sessionStorage is blocked. */
export function currentDeviceId(): string {
  if (memoryDeviceId) return memoryDeviceId;
  try {
    let deviceId = window.sessionStorage.getItem(STORAGE_KEYS.device);
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(STORAGE_KEYS.device, deviceId);
    }
    memoryDeviceId = deviceId;
    return deviceId;
  } catch {
    memoryDeviceId = `dev_mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return memoryDeviceId;
  }
}

/** Sound is on unless the owner turned it off. */
export function readSoundOn(): boolean {
  try {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEYS.sound) !== "off";
  } catch {
    return true;
  }
}

export function saveSoundOn(value: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.sound, value ? "on" : "off");
  } catch {
    /* Sound preference is optional. */
  }
}

export type RoomsStore = {
  state: RoomsState;
  save: (state: RoomsState) => RoomsState;
};

/**
 * React binding: starts from the seed so SSR and the first client render
 * match, then loads the stored state in an effect.
 */
export function useRoomsState(): RoomsStore {
  const [state, setState] = useState<RoomsState>(() => seedState());

  useEffect(() => {
    setState(loadRoomsState());
    return subscribe(setState);
  }, []);

  const save = useCallback((next: RoomsState) => {
    const saved = saveRoomsState(next);
    setState(saved);
    return saved;
  }, []);

  return { state, save };
}

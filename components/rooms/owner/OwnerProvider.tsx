"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MAX_ROOMS_PER_LOCATION } from "@/lib/rooms/constants";
import { seedState } from "@/lib/rooms/seed";
import { playBell } from "@/lib/rooms/sound";
import { readSoundOn, saveSoundOn, useRoomsState } from "@/lib/rooms/store";
import type { RoomsState, SpotBusinessType } from "@/lib/rooms/types";
import { cx } from "@/components/rooms/shared/ui";

export type OwnerDialog =
  | { kind: "add"; locId: string }
  | { kind: "rename"; locId: string; code: string }
  | { kind: "qr"; locId: string; code: string }
  | null;

type OwnerContextValue = {
  state: RoomsState;
  save: (next: RoomsState) => RoomsState;
  toast: (message: string) => void;
  soundOn: boolean;
  toggleSound: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  dialog: OwnerDialog;
  openAdd: (locId: string) => void;
  openRename: (locId: string, code: string) => void;
  openQr: (locId: string, code: string) => void;
  closeDialog: () => void;
  resetDemo: () => void;
  setBusinessType: (type: SpotBusinessType) => void;
  origin: string;
  resetToken: number;
  businessType: SpotBusinessType;
  /** True once the stored state has been adopted after mount. */
  hydrated: boolean;
};

const OwnerContext = createContext<OwnerContextValue | null>(null);

export function useOwner(): OwnerContextValue {
  const value = useContext(OwnerContext);
  if (!value) throw new Error("useOwner must be used inside OwnerProvider");
  return value;
}

export function OwnerProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  /** Merge-time addition: the SaaS's real locations as empty spots. */
  initialState?: RoomsState;
}) {
  const { state, save } = useRoomsState(initialState);

  /* Toast — the demo shows one message for 3 s. */
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const toast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 3000);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  /* Sound preference (localStorage key `syehere.mock.rooms.sound`). */
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => setSoundOn(readSoundOn()), []);
  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    saveSoundOn(next);
    if (next) playBell(true);
    toast(
      next
        ? "Order bell is on — new orders ring for 10 seconds."
        : "Order bell muted — on-screen notifications still appear.",
    );
  }, [soundOn, toast]);

  /* Chrome state. */
  const [navOpen, setNavOpen] = useState(false);
  const [dialog, setDialog] = useState<OwnerDialog>(null);
  const [origin, setOrigin] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  /* The demo closes dialogs and the mobile drawer on every route change. */
  useEffect(() => {
    setDialog(null);
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const openAdd = useCallback(
    (locId: string) => {
      const location = state.locations.find((item) => item.id === locId);
      if (location && location.rooms.length >= MAX_ROOMS_PER_LOCATION) {
        toast("Limit: 12 room QRs per location.");
        return;
      }
      setDialog({ kind: "add", locId });
    },
    [state.locations, toast],
  );

  const openRename = useCallback((locId: string, code: string) => {
    setDialog({ kind: "rename", locId, code });
  }, []);

  const openQr = useCallback((locId: string, code: string) => {
    setDialog({ kind: "qr", locId, code });
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const resetDemo = useCallback(() => {
    if (!window.confirm("Reset the demo to its starting state?")) return;
    save(seedState());
    setDialog(null);
    setNavOpen(false);
    setResetToken((value) => value + 1);
    toast("Demo reset to its starting state.");
  }, [save, toast]);

  const setBusinessType = useCallback(
    (type: SpotBusinessType) => {
      save({ ...state, businessType: type });
    },
    [state, save],
  );

  const value = useMemo<OwnerContextValue>(
    () => ({
      state,
      save,
      toast,
      soundOn,
      toggleSound,
      navOpen,
      setNavOpen,
      dialog,
      openAdd,
      openRename,
      openQr,
      closeDialog,
      resetDemo,
      setBusinessType,
      origin,
      resetToken,
      businessType: state.businessType,
      hydrated,
    }),
    [
      state,
      save,
      toast,
      soundOn,
      toggleSound,
      navOpen,
      dialog,
      openAdd,
      openRename,
      openQr,
      closeDialog,
      resetDemo,
      setBusinessType,
      origin,
      resetToken,
      hydrated,
    ],
  );

  return (
    <OwnerContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed bottom-6 left-1/2 z-[200] max-w-[min(90vw,420px)] -translate-x-1/2 rounded-[9px] bg-gray-900 px-3.5 py-2.5 text-xs leading-[1.45] text-white transition-all duration-200",
          toastVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {toastMessage}
      </div>
    </OwnerContext.Provider>
  );
}

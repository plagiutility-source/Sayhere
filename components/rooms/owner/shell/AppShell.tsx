"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { activeServiceCalls, countNewOrders } from "@/lib/rooms/rules";
import { OwnerProvider, useOwner } from "../OwnerProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { DemoBar } from "./DemoBar";
import { SpotDialogs } from "../modals/SpotDialogs";

/** The demo's `updateDocumentTitle`: the count covers new orders and live calls. */
function DocumentTitle() {
  const { state } = useOwner();
  const requests = countNewOrders(state) + activeServiceCalls(state).length;
  useEffect(() => {
    document.title = requests
      ? `(${requests}) Live table request · Syehere`
      : "Syehere — Tables, orders & QR pages";
  }, [requests]);
  return null;
}

function ShellFrame({ children }: { children: ReactNode }) {
  const { navOpen, setNavOpen } = useOwner();
  return (
    <div className="min-h-screen">
      <DocumentTitle />
      {navOpen && (
        <div
          className="fixed inset-0 z-[35] bg-ink/40 min-[1024px]:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
      <Sidebar />
      <div className="min-h-screen min-[1280px]:ml-60 min-[1024px]:max-[1279px]:ml-[72px]">
        <Topbar />
        <main className="mx-auto max-w-[1280px] px-4 pb-14 pt-4 min-[640px]:px-6 min-[640px]:pt-[22px] min-[640px]:pb-16 min-[1280px]:px-8 min-[1280px]:pt-6 min-[1280px]:pb-[72px]">
          <DemoBar />
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
      <SpotDialogs />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <OwnerProvider>
      <ShellFrame>{children}</ShellFrame>
    </OwnerProvider>
  );
}

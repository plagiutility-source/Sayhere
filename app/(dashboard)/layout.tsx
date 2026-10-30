import type { ReactNode } from "react";
import { AppShell } from "@/components/rooms/owner/shell/AppShell";

// The owner pages read `?loc=` / `?kind=` from the URL, so render per request
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

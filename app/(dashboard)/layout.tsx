import { DashboardShell } from "@/components/dashboard/shell";

/**
 * Authed dashboard segment. The product is a signed-in workspace, so these
 * routes are rendered per request rather than statically prerendered.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stage 3 adds the real session check + redirect here, before rendering the
  // shell. Stage 1 is frontend-only mock data (no middleware, no protection).
  return <DashboardShell>{children}</DashboardShell>;
}

import { BusinessProvider } from "@/lib/business-provider";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardLive } from "@/components/rooms/owner/DashboardLive";
import { getServerBusiness } from "@/lib/mock/server-business";

/**
 * Authed dashboard segment. The product is a signed-in workspace, so these
 * routes are rendered per request rather than statically prerendered.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stage 3 adds the real session check + redirect here, before rendering the
  // shell. Stage 1 is frontend-only mock data (no middleware, no protection).
  // The saved profile is read from its cookie mirror so the server HTML already
  // carries the owner's business name/type instead of the static café demo.
  const initialBusiness = await getServerBusiness();
  // Table/room ordering types get the live layer (alerts, polling, title,
  // sound); every other type renders exactly as before.
  return (
    <BusinessProvider initial={initialBusiness}>
      <DashboardLive>
        <DashboardShell>{children}</DashboardShell>
      </DashboardLive>
    </BusinessProvider>
  );
}

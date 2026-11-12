import type { Metadata } from "next";
import { BusinessProvider } from "@/lib/business-provider";
import { RoomsScanPage } from "@/components/rooms/customer/RoomsScanPage";
import { getServerBusiness } from "@/lib/mock/server-business";

/** Same indexing rule as `/r/[slug]`: transient, owner-content pages are never
 *  indexed (security 4C). */
export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

/** Public table/room page. The data is resolved on the client from the app's
 *  own business profile, locations and page config (see the adapter). */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  // The saved profile is read on the server (its cookie mirror) so this page's
  // first paint already shows the owner's business, not the static café demo.
  const initialBusiness = await getServerBusiness();
  return (
    <BusinessProvider initial={initialBusiness}>
      <RoomsScanPage slug={slug} code={code} />
    </BusinessProvider>
  );
}

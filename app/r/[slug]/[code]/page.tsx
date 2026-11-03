import type { Metadata } from "next";
import { RoomsScanPage } from "@/components/rooms/customer/RoomsScanPage";

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
  return <RoomsScanPage slug={slug} code={code} />;
}

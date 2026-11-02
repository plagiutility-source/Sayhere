"use client";

/**
 * Public table/room page gate (merge M8). Resolves the QR's slug to the real
 * location + page config + menu through the adapter; an unknown slug, or a
 * business type that does not get ordering, is a normal 404.
 */

import { notFound } from "next/navigation";
import { useRoomsPublicData } from "@/lib/rooms/adapter";
import { ScanPage } from "./ScanPage";

export function RoomsScanPage({ slug, code }: { slug: string; code: string }) {
  const data = useRoomsPublicData(slug);
  if (!data) notFound();
  return <ScanPage slug={slug} code={code} data={data} />;
}

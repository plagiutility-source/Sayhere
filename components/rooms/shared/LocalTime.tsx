"use client";

import { useEffect, useState } from "react";
import { formatDay, formatTime, formatWhen } from "@/lib/rooms/format";

/**
 * The demo formats times in the browser's local timezone. Rendering that text
 * on the server uses the server timezone instead, which makes React hydrate a
 * different string. Keep the server output empty and fill it after mount.
 */
export function LocalTime({
  value,
  mode = "when",
}: {
  value: string | number | Date;
  mode?: "time" | "when" | "day";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (mode === "time") return <>{formatTime(value)}</>;
  if (mode === "day") return <>{formatDay(value)}</>;
  return <>{formatWhen(value)}</>;
}

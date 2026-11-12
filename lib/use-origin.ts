"use client";

/** The first-paint-safe browser origin (`""` on the server and during hydration). */

import { useEffect, useState } from "react";

export function useOrigin(): string {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return origin;
}

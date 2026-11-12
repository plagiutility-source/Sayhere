import type { NextConfig } from "next";

// Dev-only: Next blocks cross-origin /_next dev resources unless the host is
// listed. Set NEXT_DEV_ORIGINS (comma separated) to allow a tunnel/preview host
// without hard-coding one here. No effect on a normal production build.
const devOrigins = (process.env.NEXT_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // security-and-reliability.md 5A item 8: never advertise the framework.
  poweredByHeader: false,
  ...(devOrigins.length > 0 ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;

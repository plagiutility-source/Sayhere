import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // security-and-reliability.md 5A item 8: never advertise the framework.
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: { remotePatterns: [] },
  turbopack: { root: process.cwd() },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};
export default nextConfig;

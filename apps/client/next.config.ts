/** @type {import('next').NextConfig} */
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@api/core", "@buddy/ui", "@clerk/nextjs"],
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Disable Fast Refresh (Hot Reloading)
    fastRefresh: false,
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080",
  },
  distDir: ".next",
};

export default config;

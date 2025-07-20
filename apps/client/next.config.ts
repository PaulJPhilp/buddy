import path from "path";
/** @type {import('next').NextConfig} */
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@buddy/ui", "@clerk/nextjs"],
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : [],
    },
    disableOptimizedLoading: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  distDir: ".next",
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@domain": path.resolve(__dirname, "src/domain"),
      "@managers": path.resolve(__dirname, "src/managers"),
      "@services": path.resolve(__dirname, "src/services"),
      "@schemas": path.resolve(__dirname, "src/schemas"),
      "@types": path.resolve(__dirname, "src/types"),
      "@ui-state": path.resolve(__dirname, "src/ui-state"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@buddy/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@buddy/agentkit": path.resolve(__dirname, "../../packages/agentkit"),
      ui: path.resolve(__dirname, "../../packages/ui/src"),
    };

    return config;
  },
};

export default config;

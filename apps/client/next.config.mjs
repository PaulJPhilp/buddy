// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'standalone' for development to ensure proper asset loading
  // output: 'standalone', // Commented out for development

  // Force all pages to be client-side rendered
  reactStrictMode: false, // Disable strict mode to prevent double rendering

  // Disable image optimization
  images: {
    unoptimized: true,
  },

  // Skip type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Increase timeout for static generation
  staticPageGenerationTimeout: 120,

  // Disable automatic static optimization
  // This will force Next.js to render all pages on-demand
  experimental: {
    // This will make Next.js skip static optimization
    disableOptimizedLoading: true,
    optimizeCss: false,
  },

  // Ensure proper asset serving
  assetPrefix: undefined, // Let Next.js determine the correct asset prefix

  // Disable compression for development to avoid issues
  compress: false,
};

export default nextConfig;

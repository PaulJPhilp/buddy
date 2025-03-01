/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@api/core", "@buddy/ui"], // Add workspace packages here
  images: {
    domains: [
      // Add domains for Image component here
      // 'example.com',
      // 'images.unsplash.com',
    ],
    formats: ["image/avif", "image/webp"],
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  experimental: {
    // Enable modern features as needed
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // For handling environment variables
  env: {
    // Custom environment variables
    // API_URL: process.env.API_URL,
  },
  // For redirects and rewrites
  async redirects() {
    return [
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  async rewrites() {
    return [
      // {
      //   source: '/api/:path*',
      //   destination: 'https://api.example.com/:path*',
      // },
    ];
  },
};

export default nextConfig;

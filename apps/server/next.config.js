/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@api/core"],
  env: {
    PORT: "3001",
    API_URL: "http://localhost:3001",
    SERVER_URL: "http://localhost:3001",
  },
  staticPageGenerationTimeout: 300,
  distDir: ".next",
};

export default nextConfig;

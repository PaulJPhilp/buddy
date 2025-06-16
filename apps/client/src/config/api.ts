/**
 * API Configuration for different environments
 */

interface ApiConfig {
  readonly baseUrl: string;
}

// Environment-specific configurations
const configs: Record<string, ApiConfig> = {
  development: {
    baseUrl: "http://localhost:3000",
  },
  production: {
    baseUrl: "https://api.buddy.com",
  },
  test: {
    baseUrl: "http://localhost:3001", // Mock server for tests
  },
};

// Get current environment
const getEnvironment = (): string => {
  if (typeof window !== "undefined") {
    // Client-side environment detection
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }
    if (hostname.includes("staging")) {
      return "staging";
    }
    return "production";
  }

  // Server-side environment detection (including tests)
  return process.env.NODE_ENV || "development";
};

// Get configuration for current environment
export const getApiConfig = (): ApiConfig => {
  const env = getEnvironment();
  const config = configs[env] || configs.development;

  // Allow environment variable overrides
  return {
    ...config,
    baseUrl: process.env.NEXT_PUBLIC_API_URL || config.baseUrl,
  };
};

// Helper function to build API URLs
export const buildApiUrl = (path: string): string => {
  const config = getApiConfig();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.baseUrl}${cleanPath}`;
};

// Export for testing
export const __testing__ = {
  configs,
  getEnvironment,
};

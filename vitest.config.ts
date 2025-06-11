import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    globals: true,
    alias: {
      "@": "/apps/client/src",
      "@buddy/protocol": "/packages/protocol/src"
    }
  }
}); 
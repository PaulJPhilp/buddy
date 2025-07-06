import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import type { VitestEnvironment } from "vitest";
import { defineConfig } from "vitest/config";

export default defineConfig(() => ({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.shared.ts"],
    include: ["src/**/*.test.{ts,tsx}", "__tests__/**/*.test.{ts,tsx}"],
    exclude: [
      "tests/**/*.spec.ts",
      "tests/**/*.spec.tsx",
      "apps/client/tests/**/*.spec.ts",
      "apps/client/tests/**/*.spec.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "src/hooks/__tests__/*Chat*.test.tsx",
      "src/hooks/__tests__/*AppManagerState*.test.tsx",
    ],
    environmentMatchGlobs: [
      [
        "src/services/chat-runtime/__tests__/ChatRuntimeService.simple.test.ts",
        "playwright",
      ] as [string, VitestEnvironment],
      ["src/services/app/**/*.test.ts", "playwright"] as [
        string,
        VitestEnvironment
      ],
      ["src/services/**/*.test.ts", "node"] as [string, VitestEnvironment],
      ["**/*.test.tsx", "playwright"] as [string, VitestEnvironment],
      ["**/useDynamicToolbar.test.ts", "playwright"] as [
        string,
        VitestEnvironment
      ],
    ],
    environmentOptions: {
      playwright: {
        setupFiles: ["./vitest.setup.dom.ts"],
      },
    },
  },
}));

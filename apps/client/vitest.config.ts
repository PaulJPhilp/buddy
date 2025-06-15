import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: [
      "./vitest.setup.simple.ts",
      "./vitest.setup.react.ts",
      "./vitest.setup.websocket.ts",
    ],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

// vitest.config.ts
import react from "file:///Users/paul/Projects/buddy/apps/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tsconfigPaths from "file:///Users/paul/Projects/buddy/apps/client/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { defineConfig } from "file:///Users/paul/Projects/buddy/apps/client/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "coverage/**",
        "dist/**",
        "**/[.]**",
        "packages/*/test{,s}/**",
        "**/*.d.ts",
        "test{,s}/**",
        "test{,-*}.{js,cjs,mjs,ts,tsx,jsx}",
        "**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}",
        "**/__tests__/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.*"
      ]
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wYXVsL1Byb2plY3RzL2J1ZGR5L2FwcHMvY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGF1bC9Qcm9qZWN0cy9idWRkeS9hcHBzL2NsaWVudC92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wYXVsL1Byb2plY3RzL2J1ZGR5L2FwcHMvY2xpZW50L3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlc3QvY29uZmlnXCJcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRzY29uZmlnUGF0aHMoKV0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgIHNldHVwRmlsZXM6IFtcIi4vdml0ZXN0LnNldHVwLnRzXCJdLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgaW5jbHVkZTogW1wiKiovX190ZXN0c19fLyoqLyoudGVzdC50c1wiLCBcIioqL19fdGVzdHNfXy8qKi8qLnRlc3QudHN4XCJdLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICByZXBvcnRlcjogW1widGV4dFwiLCBcImpzb25cIiwgXCJodG1sXCJdLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICBcImNvdmVyYWdlLyoqXCIsXG4gICAgICAgIFwiZGlzdC8qKlwiLFxuICAgICAgICBcIioqL1suXSoqXCIsXG4gICAgICAgIFwicGFja2FnZXMvKi90ZXN0eyxzfS8qKlwiLFxuICAgICAgICBcIioqLyouZC50c1wiLFxuICAgICAgICBcInRlc3R7LHN9LyoqXCIsXG4gICAgICAgIFwidGVzdHssLSp9LntqcyxjanMsbWpzLHRzLHRzeCxqc3h9XCIsXG4gICAgICAgIFwiKiovKnsuLC19dGVzdC57anMsY2pzLG1qcyx0cyx0c3gsanN4fVwiLFxuICAgICAgICBcIioqL19fdGVzdHNfXy8qKlwiLFxuICAgICAgICBcIioqL3trYXJtYSxyb2xsdXAsd2VicGFjayx2aXRlLHZpdGVzdCxqZXN0LGF2YSxiYWJlbCxueWMsY3lwcmVzc30uKlwiLFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1MsT0FBTyxXQUFXO0FBQzFULE9BQU8sbUJBQW1CO0FBQzFCLFNBQVMsb0JBQW9CO0FBRTdCLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBQUEsRUFDbEMsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLG1CQUFtQjtBQUFBLElBQ2hDLFNBQVM7QUFBQSxJQUNULFNBQVMsQ0FBQyw2QkFBNkIsNEJBQTRCO0FBQUEsSUFDbkUsVUFBVTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

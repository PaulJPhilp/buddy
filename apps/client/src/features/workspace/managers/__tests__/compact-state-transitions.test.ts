import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

describe("Compact State Transitions", () => {
  it("should transition between all three states: stashed → compact → expanded", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register a chat app (starts as stashed)
      const instance = yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "test-app",
        { name: "Test App", description: "A test app for state transitions" }
      );

      // Verify initial state is stashed
      expect(instance.status).toBe("stashed");

      // Transition: stashed → compact
      yield* chatAppsManager.compactChatApp("test-app");
      const compactInstance = yield* chatAppsManager.getChatAppInstance(
        "test-app"
      );
      expect(compactInstance.status).toBe("compact");

      // Transition: compact → expanded
      yield* chatAppsManager.expandChatApp("test-app");
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "test-app"
      );
      expect(expandedInstance.status).toBe("expanded");

      // Transition: expanded → compact
      yield* chatAppsManager.compactChatApp("test-app");
      const backToCompactInstance = yield* chatAppsManager.getChatAppInstance(
        "test-app"
      );
      expect(backToCompactInstance.status).toBe("compact");

      // Transition: compact → stashed
      yield* chatAppsManager.stashChatApp("test-app");
      const backToStashedInstance = yield* chatAppsManager.getChatAppInstance(
        "test-app"
      );
      expect(backToStashedInstance.status).toBe("stashed");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should filter chat apps by all three active states correctly", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple chat apps
      yield* chatAppsManager.registerChatApp("test-workspace", "stashed-app", {
        name: "Stashed App",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "compact-app", {
        name: "Compact App",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "expanded-app", {
        name: "Expanded App",
      });

      // Set different states
      yield* chatAppsManager.compactChatApp("compact-app");
      yield* chatAppsManager.expandChatApp("expanded-app");
      // stashed-app remains stashed by default

      // Get all apps in workspace
      const allApps = yield* chatAppsManager.getChatAppsInWorkspace(
        "test-workspace"
      );

      // Filter by status
      const stashedApps = allApps.filter((app) => app.status === "stashed");
      const compactApps = allApps.filter((app) => app.status === "compact");
      const expandedApps = allApps.filter((app) => app.status === "expanded");

      expect(stashedApps).toHaveLength(1);
      expect(stashedApps[0].id).toBe("stashed-app");

      expect(compactApps).toHaveLength(1);
      expect(compactApps[0].id).toBe("compact-app");

      expect(expandedApps).toHaveLength(1);
      expect(expandedApps[0].id).toBe("expanded-app");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should handle direct transitions between non-adjacent states", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register a chat app
      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "jump-test-app",
        { name: "Jump Test App" }
      );

      // Direct transition: stashed → expanded (skipping compact)
      yield* chatAppsManager.expandChatApp("jump-test-app");
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "jump-test-app"
      );
      expect(expandedInstance.status).toBe("expanded");

      // Direct transition: expanded → stashed (skipping compact)
      yield* chatAppsManager.stashChatApp("jump-test-app");
      const stashedInstance = yield* chatAppsManager.getChatAppInstance(
        "jump-test-app"
      );
      expect(stashedInstance.status).toBe("stashed");

      // Direct transition: stashed → compact
      yield* chatAppsManager.compactChatApp("jump-test-app");
      const compactInstance = yield* chatAppsManager.getChatAppInstance(
        "jump-test-app"
      );
      expect(compactInstance.status).toBe("compact");
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

import { ChatAppsManager } from "@/managers/chatapps";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

describe("Chat App State Transitions", () => {
  it("should transition chat app from stashed to expanded", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register a chat app
      const instance = yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "test-chat-app",
        { name: "Test Chat App", description: "A test chat app" }
      );

      // Verify initial state is stashed
      expect(instance.status).toBe("stashed");

      // Expand the chat app
      yield* chatAppsManager.expandChatApp("test-chat-app");

      // Verify state changed to expanded
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "test-chat-app"
      );
      expect(expandedInstance.status).toBe("expanded");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should transition chat app from expanded to stashed", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register and expand a chat app
      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "test-chat-app-2",
        { name: "Test Chat App 2", description: "Another test chat app" }
      );

      yield* chatAppsManager.expandChatApp("test-chat-app-2");

      // Verify it's expanded
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "test-chat-app-2"
      );
      expect(expandedInstance.status).toBe("expanded");

      // Stash the chat app
      yield* chatAppsManager.stashChatApp("test-chat-app-2");

      // Verify state changed to stashed
      const stashedInstance = yield* chatAppsManager.getChatAppInstance(
        "test-chat-app-2"
      );
      expect(stashedInstance.status).toBe("stashed");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should filter chat apps by status correctly", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple chat apps
      yield* chatAppsManager.registerChatApp("test-workspace", "stashed-app", {
        name: "Stashed App",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "expanded-app", {
        name: "Expanded App",
      });

      // Set different states
      yield* chatAppsManager.expandChatApp("expanded-app");
      // stashed-app remains stashed by default

      // Get all apps in workspace
      const allApps = yield* chatAppsManager.getChatAppsInWorkspace(
        "test-workspace"
      );

      // Filter by status
      const stashedApps = allApps.filter((app) => app.status === "stashed");
      const expandedApps = allApps.filter((app) => app.status === "expanded");

      expect(stashedApps).toHaveLength(1);
      expect(stashedApps[0].id).toBe("stashed-app");

      expect(expandedApps).toHaveLength(1);
      expect(expandedApps[0].id).toBe("expanded-app");
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

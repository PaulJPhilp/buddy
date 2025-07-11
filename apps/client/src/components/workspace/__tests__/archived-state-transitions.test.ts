import { ChatAppsManager } from "@/managers/chatapps";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

describe("Archived State Transitions", () => {
  it("should archive chat apps from any active state", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple chat apps in different states
      yield* chatAppsManager.registerChatApp("test-workspace", "stashed-app", {
        name: "Stashed App",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "compact-app", {
        name: "Compact App",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "expanded-app", {
        name: "Expanded App",
      });

      // Set different active states
      yield* chatAppsManager.compactChatApp("compact-app");
      yield* chatAppsManager.expandChatApp("expanded-app");
      // stashed-app remains stashed

      // Archive from different states
      yield* chatAppsManager.archiveChatApp("stashed-app");
      yield* chatAppsManager.archiveChatApp("compact-app");
      yield* chatAppsManager.archiveChatApp("expanded-app");

      // Verify all are archived
      const stashedInstance = yield* chatAppsManager.getChatAppInstance(
        "stashed-app"
      );
      const compactInstance = yield* chatAppsManager.getChatAppInstance(
        "compact-app"
      );
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "expanded-app"
      );

      expect(stashedInstance.status).toBe("archived");
      expect(compactInstance.status).toBe("archived");
      expect(expandedInstance.status).toBe("archived");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should restore archived apps back to stashed state", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register and archive a chat app
      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "archive-restore-app",
        {
          name: "Archive Restore App",
          description: "Test app for archive/restore",
        }
      );

      // Archive the app
      yield* chatAppsManager.archiveChatApp("archive-restore-app");
      const archivedInstance = yield* chatAppsManager.getChatAppInstance(
        "archive-restore-app"
      );
      expect(archivedInstance.status).toBe("archived");

      // Restore the app (should go back to stashed)
      yield* chatAppsManager.restoreChatApp("archive-restore-app");
      const restoredInstance = yield* chatAppsManager.getChatAppInstance(
        "archive-restore-app"
      );
      expect(restoredInstance.status).toBe("stashed");
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should filter archived apps correctly in workspace view", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple apps
      yield* chatAppsManager.registerChatApp("test-workspace", "active-app-1", {
        name: "Active App 1",
      });

      yield* chatAppsManager.registerChatApp("test-workspace", "active-app-2", {
        name: "Active App 2",
      });

      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "archive-app-1",
        { name: "Archive App 1" }
      );

      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "archive-app-2",
        { name: "Archive App 2" }
      );

      // Set some to different active states
      yield* chatAppsManager.expandChatApp("active-app-1");
      yield* chatAppsManager.compactChatApp("active-app-2");

      // Archive some apps
      yield* chatAppsManager.archiveChatApp("archive-app-1");
      yield* chatAppsManager.archiveChatApp("archive-app-2");

      // Get all apps and filter by status
      const allApps = yield* chatAppsManager.getChatAppsInWorkspace(
        "test-workspace"
      );

      const activeApps = allApps.filter(
        (app) =>
          app.status === "stashed" ||
          app.status === "compact" ||
          app.status === "expanded"
      );
      const archivedApps = allApps.filter((app) => app.status === "archived");

      expect(activeApps).toHaveLength(2);
      expect(archivedApps).toHaveLength(2);

      // Verify specific apps
      expect(activeApps.some((app) => app.id === "active-app-1")).toBe(true);
      expect(activeApps.some((app) => app.id === "active-app-2")).toBe(true);
      expect(archivedApps.some((app) => app.id === "archive-app-1")).toBe(true);
      expect(archivedApps.some((app) => app.id === "archive-app-2")).toBe(true);
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should handle archive/restore cycle correctly", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register a chat app
      yield* chatAppsManager.registerChatApp(
        "test-workspace",
        "cycle-test-app",
        { name: "Cycle Test App" }
      );

      // Go through multiple states
      const initialInstance = yield* chatAppsManager.getChatAppInstance(
        "cycle-test-app"
      );
      expect(initialInstance.status).toBe("stashed");

      // Expand → Archive → Restore cycle
      yield* chatAppsManager.expandChatApp("cycle-test-app");
      const expandedInstance = yield* chatAppsManager.getChatAppInstance(
        "cycle-test-app"
      );
      expect(expandedInstance.status).toBe("expanded");

      yield* chatAppsManager.archiveChatApp("cycle-test-app");
      const archivedInstance = yield* chatAppsManager.getChatAppInstance(
        "cycle-test-app"
      );
      expect(archivedInstance.status).toBe("archived");

      yield* chatAppsManager.restoreChatApp("cycle-test-app");
      const restoredInstance = yield* chatAppsManager.getChatAppInstance(
        "cycle-test-app"
      );
      expect(restoredInstance.status).toBe("stashed");

      // Can continue with normal state transitions after restore
      yield* chatAppsManager.compactChatApp("cycle-test-app");
      const compactInstance = yield* chatAppsManager.getChatAppInstance(
        "cycle-test-app"
      );
      expect(compactInstance.status).toBe("compact");
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

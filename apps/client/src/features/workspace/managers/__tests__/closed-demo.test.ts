import { ChatAppsManager } from "@/features/chatapps/manager/service";
import { Effect } from "effect";
import { describe, it } from "vitest";

describe("Closed State Demo", () => {
  it("should set up demo apps including closed state for manual testing", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register demo chat apps for all states
      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "active-chat-app",
        {
          name: "Active Chat Assistant",
          description: "Currently active and expanded for chatting",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "compact-notes-app",
        {
          name: "Quick Notes",
          description: "Compact note-taking assistant",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "stashed-research-app",
        {
          name: "Research Helper",
          description: "Stashed research and analysis tool",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "archived-old-project",
        {
          name: "Old Project Assistant",
          description: "Archived assistant from completed project",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "closed-deprecated-app",
        {
          name: "Deprecated Feature Bot",
          description: "Permanently closed due to feature deprecation",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "closed-security-app",
        {
          name: "Security Scanner",
          description: "Closed due to security concerns",
        }
      );

      // Set up the states
      yield* chatAppsManager.expandChatApp("active-chat-app");
      yield* chatAppsManager.compactChatApp("compact-notes-app");
      yield* chatAppsManager.stashChatApp("stashed-research-app");
      yield* chatAppsManager.archiveChatApp("archived-old-project");
      yield* chatAppsManager.closeChatApp("closed-deprecated-app");
      yield* chatAppsManager.closeChatApp("closed-security-app");

      // Get workspace apps to verify setup
      const workspaceApps = yield* chatAppsManager.getChatAppsInWorkspace(
        "demo-workspace"
      );

      console.log("=== CLOSED STATE DEMO SETUP ===");
      console.log(`Total apps in demo workspace: ${workspaceApps.length}`);

      const statusCounts = workspaceApps.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("Apps by status:", statusCounts);

      // Show closed apps specifically
      const closedApps = workspaceApps.filter((app) => app.status === "closed");
      console.log("\n=== CLOSED APPS ===");
      closedApps.forEach((app) => {
        console.log(
          `- ${app.config?.name || app.id}: ${
            app.config?.description || "No description"
          }`
        );
        console.log(`  Closed at: ${app.lastStatusChangeAt}`);
      });

      console.log(
        "\n✅ Demo setup complete! Switch to 'demo-workspace' to see all states including closed apps."
      );
      console.log(
        "💡 Closed apps appear in a collapsible section with warning styling."
      );
      console.log(
        "🔒 Closed apps cannot be restored and show closure timestamp."
      );
    }).pipe(Effect.provide(ChatAppsManager.Default)));

  it("should demonstrate the complete chat app lifecycle", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register a single app and walk through all states
      yield* chatAppsManager.registerChatApp(
        "lifecycle-demo",
        "lifecycle-app",
        {
          name: "Lifecycle Demo App",
          description: "Demonstrates complete chat app state lifecycle",
        }
      );

      console.log("\n=== CHAT APP LIFECYCLE DEMO ===");

      // Start as stashed (default)
      let app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`1. Initial state: ${app.status} (default when registered)`);

      // Expand
      yield* chatAppsManager.expandChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`2. Expanded: ${app.status} (full card view, actively used)`);

      // Compact
      yield* chatAppsManager.compactChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`3. Compact: ${app.status} (small card view, quick access)`);

      // Stash
      yield* chatAppsManager.stashChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`4. Stashed: ${app.status} (badge view, minimal space)`);

      // Archive
      yield* chatAppsManager.archiveChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`5. Archived: ${app.status} (hidden, can be restored)`);

      // Restore from archive
      yield* chatAppsManager.restoreChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`6. Restored: ${app.status} (back to stashed from archive)`);

      // Close (final state)
      yield* chatAppsManager.closeChatApp("lifecycle-app");
      app = yield* chatAppsManager.getChatAppInstance("lifecycle-app");
      console.log(`7. Closed: ${app.status} (permanent, cannot be restored)`);

      console.log(
        "\n📋 Complete lifecycle: stashed → expanded → compact → stashed → archived → stashed → closed"
      );
      console.log(
        "🔄 Most states are reversible, except closed which is permanent"
      );
      console.log(
        "💡 Use this flow to understand how users can manage their chat apps"
      );
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

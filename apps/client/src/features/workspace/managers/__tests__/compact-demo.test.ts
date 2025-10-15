import { ChatAppsManager } from "@/features/chatapps/manager/service";
import { Effect } from "effect";
import { describe, it } from "vitest";

describe("Compact State Demo", () => {
  it("should set up demo apps in different states for manual testing", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple demo apps
      yield* chatAppsManager.registerChatApp("ai", "demo-stashed-app", {
        name: "Stashed Demo",
        description: "This app is in stashed state (badge view)",
      });

      yield* chatAppsManager.registerChatApp("ai", "demo-compact-app", {
        name: "Compact Demo",
        description: "This app is in compact state (small card view)",
      });

      yield* chatAppsManager.registerChatApp("ai", "demo-expanded-app", {
        name: "Expanded Demo",
        description: "This app is in expanded state (full card view)",
      });

      // Set different states
      yield* chatAppsManager.compactChatApp("demo-compact-app");
      yield* chatAppsManager.expandChatApp("demo-expanded-app");
      // demo-stashed-app remains stashed by default

      console.log("✅ Demo apps set up:");
      console.log("  - Stashed Demo (badge)");
      console.log("  - Compact Demo (small card)");
      console.log("  - Expanded Demo (full card)");
      console.log("🚀 Switch to 'AI' workspace to see all three states!");

      const allApps = yield* chatAppsManager.getChatAppsInWorkspace("ai");
      const stashedCount = allApps.filter(
        (app) => app.status === "stashed"
      ).length;
      const compactCount = allApps.filter(
        (app) => app.status === "compact"
      ).length;
      const expandedCount = allApps.filter(
        (app) => app.status === "expanded"
      ).length;

      console.log(
        `📊 State distribution: ${stashedCount} stashed, ${compactCount} compact, ${expandedCount} expanded`
      );
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

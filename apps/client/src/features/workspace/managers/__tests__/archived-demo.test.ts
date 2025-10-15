import { ChatAppsManager } from "@/features/chatapps/manager/service";
import { Effect } from "effect";
import { describe, it } from "vitest";

describe("Archived State Demo", () => {
  it("should set up demo apps in different states including archived for manual testing", () =>
    Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Register multiple demo chat apps
      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "active-productivity-app",
        {
          name: "Productivity Assistant",
          description: "Helps with task management and scheduling",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "active-research-app",
        {
          name: "Research Helper",
          description: "Assists with information gathering and analysis",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "compact-writing-app",
        {
          name: "Writing Assistant",
          description: "Helps with content creation and editing",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "compact-coding-app",
        {
          name: "Code Reviewer",
          description: "Reviews code and suggests improvements",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "archived-old-app",
        {
          name: "Legacy Chat Bot",
          description: "An older chat assistant that's no longer actively used",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "archived-experimental-app",
        {
          name: "Experimental AI",
          description: "A prototype assistant that was archived after testing",
        }
      );

      yield* chatAppsManager.registerChatApp(
        "demo-workspace",
        "archived-seasonal-app",
        {
          name: "Holiday Planner",
          description:
            "Seasonal app for holiday planning (archived until next season)",
        }
      );

      // Set different states to demonstrate the full spectrum
      // Stashed apps remain as default (stashed)

      // Set some to expanded (active use)
      yield* chatAppsManager.expandChatApp("active-productivity-app");
      yield* chatAppsManager.expandChatApp("active-research-app");

      // Set some to compact (quick access)
      yield* chatAppsManager.compactChatApp("compact-writing-app");
      yield* chatAppsManager.compactChatApp("compact-coding-app");

      // Archive some apps (long-term storage)
      yield* chatAppsManager.archiveChatApp("archived-old-app");
      yield* chatAppsManager.archiveChatApp("archived-experimental-app");
      yield* chatAppsManager.archiveChatApp("archived-seasonal-app");

      // Get final state for verification
      const allApps = yield* chatAppsManager.getChatAppsInWorkspace(
        "demo-workspace"
      );

      const stashedApps = allApps.filter((app) => app.status === "stashed");
      const compactApps = allApps.filter((app) => app.status === "compact");
      const expandedApps = allApps.filter((app) => app.status === "expanded");
      const archivedApps = allApps.filter((app) => app.status === "archived");

      console.log("\n🎯 Demo State Summary:");
      console.log(`📋 Stashed (badges): ${stashedApps.length} apps`);
      console.log(`📦 Compact (small cards): ${compactApps.length} apps`);
      console.log(`📄 Expanded (full cards): ${expandedApps.length} apps`);
      console.log(
        `🗃️  Archived (collapsed section): ${archivedApps.length} apps`
      );

      console.log("\n📄 Expanded Apps (Full Cards):");
      for (const app of expandedApps) {
        console.log(`  • ${app.config?.name} - ${app.config?.description}`);
      }

      console.log("\n📦 Compact Apps (Small Cards):");
      for (const app of compactApps) {
        console.log(`  • ${app.config?.name} - ${app.config?.description}`);
      }

      console.log("\n🗃️  Archived Apps (Hidden/Collapsible):");
      for (const app of archivedApps) {
        console.log(`  • ${app.config?.name} - ${app.config?.description}`);
      }

      console.log("\n💡 UI Features to Test:");
      console.log("  - Click 'Show' button to expand archived section");
      console.log("  - Click 'Restore' on archived apps to bring them back");
      console.log("  - Click 'Archive' on expanded apps to store them");
      console.log("  - Verify state transitions work smoothly");
      console.log(
        "  - Check that archived apps are visually distinct (muted colors)"
      );
    }).pipe(Effect.provide(ChatAppsManager.Default)));
});

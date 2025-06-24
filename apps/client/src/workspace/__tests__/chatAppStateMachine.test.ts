import { ChatAppConfig } from "@/types/global";
import { createWorkspaceStore } from "../workspaceStore";

describe("Chat App State Machine", () => {
  describe("Max Expanded Apps Enforcement", () => {
    test("respects default max of 2 expanded apps", () => {
      const store = createWorkspaceStore();

      // Add workspace
      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add 4 chat apps
      for (let i = 1; i <= 4; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });
      }

      // Expand apps one by one
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app2",
      });

      let state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("expanded");
      expect(state.chatApps.app2.status).toBe("expanded");

      // Expand third app - should compact app1 (oldest)
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app3",
      });

      state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("expanded");
      expect(state.chatApps.app3.status).toBe("expanded");

      // Expand fourth app - should compact app2 (now oldest expanded)
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app4",
      });

      state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("compact");
      expect(state.chatApps.app3.status).toBe("expanded");
      expect(state.chatApps.app4.status).toBe("expanded");

      // Verify only 2 expanded apps at any time
      const expandedApps = Object.values(state.chatApps).filter(
        (app) => app.status === "expanded",
      );
      expect(expandedApps).toHaveLength(2);
    });

    test("respects custom max expanded apps setting", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Set max to 3
      store.send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId: "ws1",
        maxExpandedApps: 3,
      });

      // Add 5 apps
      for (let i = 1; i <= 5; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });
      }

      // Expand first 3 - should all be expanded
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app2",
      });
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app3",
      });

      let state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("expanded");
      expect(state.chatApps.app2.status).toBe("expanded");
      expect(state.chatApps.app3.status).toBe("expanded");

      // Expand fourth - should compact app1
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app4",
      });

      state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("expanded");
      expect(state.chatApps.app3.status).toBe("expanded");
      expect(state.chatApps.app4.status).toBe("expanded");

      // Verify exactly 3 expanded apps
      const expandedApps = Object.values(state.chatApps).filter(
        (app) => app.status === "expanded",
      );
      expect(expandedApps).toHaveLength(3);
    });

    test("reducing max expanded apps compacts excess apps", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add and expand 3 apps
      for (let i = 1; i <= 3; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });

        // Wait a bit between expansions to ensure different timestamps
        if (i > 1) {
          // Simulate time passing
          store.send({
            type: "CHAT_APP_ACTIVATED",
            workspaceId: "ws1",
            appId: `app${i}`,
          });
        }

        store.send({
          type: "CHAT_APP_EXPANDED",
          workspaceId: "ws1",
          appId: `app${i}`,
        });
      }

      let state = store.getSnapshot().context;
      // Should have 2 expanded (default max), app1 should be compacted
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("expanded");
      expect(state.chatApps.app3.status).toBe("expanded");

      // Reduce max to 1
      store.send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId: "ws1",
        maxExpandedApps: 1,
      });

      state = store.getSnapshot().context;

      // Should compact the oldest expanded app (app2), keeping app3
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("compact");
      expect(state.chatApps.app3.status).toBe("expanded");

      const expandedApps = Object.values(state.chatApps).filter(
        (app) => app.status === "expanded",
      );
      expect(expandedApps).toHaveLength(1);
    });
  });

  describe("Active App Tracking", () => {
    test("expanding app sets it as active", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      const config: ChatAppConfig = {
        id: "app1",
        name: "App 1",
        agentId: "agent1",
        theme: {},
      };

      store.send({
        type: "CHAT_APP_ADDED",
        workspaceId: "ws1",
        appId: "app1",
        config,
      });

      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBe("app1");
    });

    test("activating app updates activeAppId", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add two apps
      for (let i = 1; i <= 2; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });
      }

      // Activate app1
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app1",
      });

      let state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBe("app1");

      // Activate app2
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app2",
      });

      state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBe("app2");
    });

    test("stashing active app clears activeAppId", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      const config: ChatAppConfig = {
        id: "app1",
        name: "App 1",
        agentId: "agent1",
        theme: {},
      };

      store.send({
        type: "CHAT_APP_ADDED",
        workspaceId: "ws1",
        appId: "app1",
        config,
      });

      // Activate then stash
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_STASHED",
        workspaceId: "ws1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBeNull();
      expect(state.chatApps.app1.status).toBe("stashed");
    });

    test("compacting active app finds new active app", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add and expand two apps
      for (let i = 1; i <= 2; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });

        store.send({
          type: "CHAT_APP_EXPANDED",
          workspaceId: "ws1",
          appId: `app${i}`,
        });
      }

      // app2 should be active (last expanded)
      let state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBe("app2");

      // Compact app2 (the active one)
      store.send({
        type: "CHAT_APP_COMPACTED",
        workspaceId: "ws1",
        appId: "app2",
      });

      state = store.getSnapshot().context;
      // app1 should now be active (most recent expanded app remaining)
      expect(state.workspaces.ws1.activeAppId).toBe("app1");
    });

    test("compacting non-active app keeps activeAppId unchanged", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add and expand two apps
      for (let i = 1; i <= 2; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });

        store.send({
          type: "CHAT_APP_EXPANDED",
          workspaceId: "ws1",
          appId: `app${i}`,
        });
      }

      // Explicitly activate app1
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app1",
      });

      let state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBe("app1");

      // Compact app2 (not the active one)
      store.send({
        type: "CHAT_APP_COMPACTED",
        workspaceId: "ws1",
        appId: "app2",
      });

      state = store.getSnapshot().context;
      // app1 should still be active
      expect(state.workspaces.ws1.activeAppId).toBe("app1");
    });
  });

  describe("Focus Mode", () => {
    test("entering focus mode expands target and hides others", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add and expand 3 apps (2 will be expanded, 1 compact due to limit)
      for (let i = 1; i <= 3; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });

        store.send({
          type: "CHAT_APP_EXPANDED",
          workspaceId: "ws1",
          appId: `app${i}`,
        });
      }

      let state = store.getSnapshot().context;
      // Should have app1 compact, app2&3 expanded
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("expanded");
      expect(state.chatApps.app3.status).toBe("expanded");

      // Enter focus mode on app1
      store.send({
        type: "CHAT_APP_FOCUS_ENTERED",
        workspaceId: "ws1",
        appId: "app1",
      });

      state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("expanded");
      expect(state.chatApps.app2.status).toBe("stashed"); // Hidden in focus mode
      expect(state.chatApps.app3.status).toBe("stashed"); // Hidden in focus mode
      expect(state.workspaces.ws1.activeAppId).toBe("app1");
    });

    test("exiting focus mode restores previous layout", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add and set up apps in different states
      for (let i = 1; i <= 3; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });
      }

      // Set specific states: app1 expanded, app2 compact, app3 stashed
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_COMPACTED",
        workspaceId: "ws1",
        appId: "app2",
      });
      // app3 remains stashed

      // Enter focus mode on app2
      store.send({
        type: "CHAT_APP_FOCUS_ENTERED",
        workspaceId: "ws1",
        appId: "app2",
      });

      let state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("stashed"); // Hidden
      expect(state.chatApps.app2.status).toBe("expanded"); // Focused
      expect(state.chatApps.app3.status).toBe("stashed"); // Was already stashed

      // Exit focus mode
      store.send({ type: "CHAT_APP_FOCUS_EXITED", workspaceId: "ws1" });

      state = store.getSnapshot().context;
      // Should restore apps to their previous status
      expect(state.chatApps.app1.status).toBe("expanded"); // Restored to previous status
      expect(state.chatApps.app2.status).toBe("expanded"); // Remains expanded
      expect(state.chatApps.app3.status).toBe("stashed"); // Stays stashed (was never changed)
    });
  });

  describe("Timestamp Management", () => {
    test("lastActiveAt updates correctly on actions", async () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      const config: ChatAppConfig = {
        id: "app1",
        name: "App 1",
        agentId: "agent1",
        theme: {},
      };

      store.send({
        type: "CHAT_APP_ADDED",
        workspaceId: "ws1",
        appId: "app1",
        config,
      });

      const initialTime =
        store.getSnapshot().context.chatApps.app1.lastActiveAt;

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Activate the app
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app1",
      });

      const afterActivation =
        store.getSnapshot().context.chatApps.app1.lastActiveAt;
      expect(afterActivation.getTime()).toBeGreaterThan(initialTime.getTime());

      // Wait again for different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Expand the app
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });

      const afterExpansion =
        store.getSnapshot().context.chatApps.app1.lastActiveAt;
      expect(afterExpansion.getTime()).toBeGreaterThan(
        afterActivation.getTime(),
      );
    });

    test("chronological sorting works for capacity management", async () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Add 3 apps
      for (let i = 1; i <= 3; i++) {
        const config: ChatAppConfig = {
          id: `app${i}`,
          name: `App ${i}`,
          agentId: "agent1",
          theme: {},
        };

        store.send({
          type: "CHAT_APP_ADDED",
          workspaceId: "ws1",
          appId: `app${i}`,
          config,
        });
      }

      // Expand app3 first
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app3",
      });

      // Wait to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Expand app1 second - both should be expanded since max is 2
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });

      let state = store.getSnapshot().context;
      // Both should be expanded since we're under the limit
      expect(state.chatApps.app3.status).toBe("expanded");
      expect(state.chatApps.app1.status).toBe("expanded");
      expect(state.chatApps.app2.status).toBe("stashed");

      // Wait again for different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Now expand app2 - should compact app3 (oldest expanded)
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app2",
      });

      state = store.getSnapshot().context;
      expect(state.chatApps.app3.status).toBe("compact"); // Oldest, should be compacted
      expect(state.chatApps.app1.status).toBe("expanded"); // Middle timestamp
      expect(state.chatApps.app2.status).toBe("expanded"); // Newest
    });
  });

  describe("Edge Cases", () => {
    test("handles invalid workspace ID gracefully", () => {
      const store = createWorkspaceStore();

      // Try to expand app in non-existent workspace
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "nonexistent",
        appId: "app1",
      });

      // Should not crash or change state
      const state = store.getSnapshot().context;
      expect(Object.keys(state.chatApps)).toHaveLength(0);
    });

    test("handles invalid app ID gracefully", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Try to expand non-existent app
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "nonexistent",
      });

      // Should not crash or change workspace
      const state = store.getSnapshot().context;
      expect(state.workspaces.ws1.activeAppId).toBeNull();
    });

    test("handles zero max expanded apps gracefully", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      // Try to set max to 0 (should be rejected)
      store.send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId: "ws1",
        maxExpandedApps: 0,
      });

      const state = store.getSnapshot().context;
      // Should remain at default value
      expect(state.workspaces.ws1.maxExpandedApps).toBe(2);
    });

    test("handles multiple rapid state changes", () => {
      const store = createWorkspaceStore();

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Test Workspace",
        availableAgents: ["agent1"],
      });

      const config: ChatAppConfig = {
        id: "app1",
        name: "App 1",
        agentId: "agent1",
        theme: {},
      };

      store.send({
        type: "CHAT_APP_ADDED",
        workspaceId: "ws1",
        appId: "app1",
        config,
      });

      // Rapid state changes
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_COMPACTED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_STASHED",
        workspaceId: "ws1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ACTIVATED",
        workspaceId: "ws1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      // Should end up stashed but with updated timestamp
      expect(state.chatApps.app1.status).toBe("stashed");
      expect(state.workspaces.ws1.activeAppId).toBe("app1");
    });
  });

  describe("Multi-Workspace Scenarios", () => {
    test("state changes in one workspace don't affect others", () => {
      const store = createWorkspaceStore();

      // Add two workspaces
      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Workspace 1",
        availableAgents: ["agent1"],
      });

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws2",
        name: "Workspace 2",
        availableAgents: ["agent1"],
      });

      // Add apps to both workspaces
      for (let ws = 1; ws <= 2; ws++) {
        for (let app = 1; app <= 2; app++) {
          const config: ChatAppConfig = {
            id: `ws${ws}_app${app}`,
            name: `WS${ws} App ${app}`,
            agentId: "agent1",
            theme: {},
          };

          store.send({
            type: "CHAT_APP_ADDED",
            workspaceId: `ws${ws}`,
            appId: `ws${ws}_app${app}`,
            config,
          });
        }
      }

      // Expand apps in ws1
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "ws1_app1",
      });
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws1",
        appId: "ws1_app2",
      });

      // Expand apps in ws2
      store.send({
        type: "CHAT_APP_EXPANDED",
        workspaceId: "ws2",
        appId: "ws2_app1",
      });

      const state = store.getSnapshot().context;

      // Verify ws1 apps are expanded
      expect(state.chatApps.ws1_app1.status).toBe("expanded");
      expect(state.chatApps.ws1_app2.status).toBe("expanded");
      expect(state.workspaces.ws1.activeAppId).toBe("ws1_app2");

      // Verify ws2 app is expanded and ws2 is independent
      expect(state.chatApps.ws2_app1.status).toBe("expanded");
      expect(state.chatApps.ws2_app2.status).toBe("stashed");
      expect(state.workspaces.ws2.activeAppId).toBe("ws2_app1");
    });

    test("different max expanded apps per workspace", () => {
      const store = createWorkspaceStore();

      // Add two workspaces with different max settings
      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws1",
        name: "Workspace 1",
        availableAgents: ["agent1"],
      });

      store.send({
        type: "WORKSPACE_ADDED",
        workspaceId: "ws2",
        name: "Workspace 2",
        availableAgents: ["agent1"],
      });

      // Set different max values
      store.send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId: "ws1",
        maxExpandedApps: 1,
      });

      store.send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId: "ws2",
        maxExpandedApps: 3,
      });

      // Add 3 apps to each workspace
      for (let ws = 1; ws <= 2; ws++) {
        for (let app = 1; app <= 3; app++) {
          const config: ChatAppConfig = {
            id: `ws${ws}_app${app}`,
            name: `WS${ws} App ${app}`,
            agentId: "agent1",
            theme: {},
          };

          store.send({
            type: "CHAT_APP_ADDED",
            workspaceId: `ws${ws}`,
            appId: `ws${ws}_app${app}`,
            config,
          });

          store.send({
            type: "CHAT_APP_EXPANDED",
            workspaceId: `ws${ws}`,
            appId: `ws${ws}_app${app}`,
          });
        }
      }

      const state = store.getSnapshot().context;

      // ws1 should have only 1 expanded (max=1)
      const ws1Expanded = Object.values(state.chatApps).filter(
        (app) => app.workspaceId === "ws1" && app.status === "expanded",
      );
      expect(ws1Expanded).toHaveLength(1);
      expect(state.chatApps.ws1_app3.status).toBe("expanded"); // Last one

      // ws2 should have all 3 expanded (max=3)
      const ws2Expanded = Object.values(state.chatApps).filter(
        (app) => app.workspaceId === "ws2" && app.status === "expanded",
      );
      expect(ws2Expanded).toHaveLength(3);
    });
  });
});

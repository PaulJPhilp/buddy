import { ChatAppConfig } from "@/types/global";
import { createWorkspaceStore } from "../workspaceStore";

describe("Active Workspaces", () => {
  test("workspace is not active when it has no chat apps", () => {
    const store = createWorkspaceStore();

    // Add a workspace
    store.send({
      type: "WORKSPACE_ADDED",
      workspaceId: "workspace1",
      name: "Test Workspace",
      availableAgents: ["default-agent"],
    });

    const state = store.getSnapshot().context;

    // Check that workspace exists but is not active (no chat apps)
    expect(state.workspaces.workspace1).toBeDefined();

    // No chat apps means no active workspaces
    const chatApps = Object.values(state.chatApps);
    expect(chatApps).toHaveLength(0);
  });

  test("workspace becomes active when chat app is expanded", () => {
    const store = createWorkspaceStore();

    // Add a workspace
    store.send({
      type: "WORKSPACE_ADDED",
      workspaceId: "workspace1",
      name: "Test Workspace",
      availableAgents: ["default-agent"],
    });

    // Add a chat app in stashed state
    const config: ChatAppConfig = {
      id: "app1",
      name: "Test App",
      agentId: "default-agent",
      theme: {},
    };

    store.send({
      type: "CHAT_APP_ADDED",
      workspaceId: "workspace1",
      appId: "app1",
      config,
    });

    // Expand the chat app
    store.send({
      type: "CHAT_APP_EXPANDED",
      workspaceId: "workspace1",
      appId: "app1",
    });

    const state = store.getSnapshot().context;

    // Check that workspace is now active
    const chatApps = Object.values(state.chatApps);
    const activeWorkspaceIds = new Set<string>();

    for (const app of chatApps) {
      if (app.status === "expanded" || app.status === "compact") {
        activeWorkspaceIds.add(app.workspaceId);
      }
    }

    expect(activeWorkspaceIds.has("workspace1")).toBe(true);
    expect(state.workspaces.workspace1.activeAppId).toBe("app1");
  });

  test("workspace max expanded apps limit is enforced", () => {
    const store = createWorkspaceStore();

    // Add a workspace with max 2 expanded apps
    store.send({
      type: "WORKSPACE_ADDED",
      workspaceId: "workspace1",
      name: "Test Workspace",
      availableAgents: ["default-agent"],
    });

    // Add three chat apps
    for (let i = 1; i <= 3; i++) {
      const config: ChatAppConfig = {
        id: `app${i}`,
        name: `Test App ${i}`,
        agentId: "default-agent",
        theme: {},
      };

      store.send({
        type: "CHAT_APP_ADDED",
        workspaceId: "workspace1",
        appId: `app${i}`,
        config,
      });
    }

    // Expand first two apps
    store.send({
      type: "CHAT_APP_EXPANDED",
      workspaceId: "workspace1",
      appId: "app1",
    });

    store.send({
      type: "CHAT_APP_EXPANDED",
      workspaceId: "workspace1",
      appId: "app2",
    });

    // Try to expand third app - should compact the oldest (app1)
    store.send({
      type: "CHAT_APP_EXPANDED",
      workspaceId: "workspace1",
      appId: "app3",
    });

    const state = store.getSnapshot().context;

    // Check that only 2 apps are expanded and app1 was compacted
    const expandedApps = Object.values(state.chatApps).filter(
      (app) => app.status === "expanded" && app.workspaceId === "workspace1",
    );
    expect(expandedApps).toHaveLength(2);
    expect(state.chatApps.app1.status).toBe("compact");
    expect(state.chatApps.app2.status).toBe("expanded");
    expect(state.chatApps.app3.status).toBe("expanded");
    expect(state.workspaces.workspace1.activeAppId).toBe("app3");
  });

  test("chat app activation updates workspace activeAppId", () => {
    const store = createWorkspaceStore();

    // Add a workspace
    store.send({
      type: "WORKSPACE_ADDED",
      workspaceId: "workspace1",
      name: "Test Workspace",
      availableAgents: ["default-agent"],
    });

    // Add and expand a chat app
    const config: ChatAppConfig = {
      id: "app1",
      name: "Test App",
      agentId: "default-agent",
      theme: {},
    };

    store.send({
      type: "CHAT_APP_ADDED",
      workspaceId: "workspace1",
      appId: "app1",
      config,
    });

    store.send({
      type: "CHAT_APP_ACTIVATED",
      workspaceId: "workspace1",
      appId: "app1",
    });

    const state = store.getSnapshot().context;
    expect(state.workspaces.workspace1.activeAppId).toBe("app1");
    expect(state.chatApps.app1.lastActiveAt).toBeDefined();
  });

  test("stashing active app clears workspace activeAppId", () => {
    const store = createWorkspaceStore();

    // Add workspace and app
    store.send({
      type: "WORKSPACE_ADDED",
      workspaceId: "workspace1",
      name: "Test Workspace",
      availableAgents: ["default-agent"],
    });

    const config: ChatAppConfig = {
      id: "app1",
      name: "Test App",
      agentId: "default-agent",
      theme: {},
    };

    store.send({
      type: "CHAT_APP_ADDED",
      workspaceId: "workspace1",
      appId: "app1",
      config,
    });

    // Activate then stash the app
    store.send({
      type: "CHAT_APP_ACTIVATED",
      workspaceId: "workspace1",
      appId: "app1",
    });

    store.send({
      type: "CHAT_APP_STASHED",
      workspaceId: "workspace1",
      appId: "app1",
    });

    const state = store.getSnapshot().context;

    expect(state.workspaces.workspace1.activeAppId).toBeNull();
    expect(state.chatApps.app1.status).toBe("stashed");
  });
});

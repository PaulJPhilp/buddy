import { beforeEach, describe, expect, it } from "vitest";
import { UIState } from "../types";
import { MAX_SPACES, createWorkspaceStore } from "../workspaceStore";

// Helper to build a fresh store for each test
const initial: UIState = {
  currentSpaceId: null,
  spaces: {},
  chatApps: {},
};

describe("workspaceStore - Spaces", () => {
  let store: ReturnType<typeof createWorkspaceStore>;

  beforeEach(() => {
    store = createWorkspaceStore(initial);
  });

  describe("Space Management", () => {
    it("adds a space and sets it as current", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "My Space",
        color: "#ff0000",
        icon: "🚀",
        availableAgents: ["agent1", "agent2"],
      });

      const state = store.getSnapshot().context;
      expect(state.currentSpaceId).toBe("space1");
      expect(state.spaces).toHaveProperty("space1");
      expect(state.spaces.space1.name).toBe("My Space");
      expect(state.spaces.space1.color).toBe("#ff0000");
      expect(state.spaces.space1.icon).toBe("🚀");
      expect(state.spaces.space1.availableAgents).toEqual(["agent1", "agent2"]);
      expect(state.spaces.space1.isArchived).toBe(false);
    });

    it("adds space with default values when optional fields not provided", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Basic Space",
        availableAgents: ["default"],
      });

      const state = store.getSnapshot().context;
      const space = state.spaces.space1;
      expect(space.color).toBe("#3b82f6");
      expect(space.description).toBe("");
      expect(space.icon).toBe("📁");
      expect(space.availableAgents).toEqual(["default"]);
    });

    it("updates space properties", async () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Original Name",
        availableAgents: ["agent1"],
      });

      const initialState = store.getSnapshot().context;
      const initialTime = initialState.spaces.space1.createdAt.getTime();

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      store.send({
        type: "SPACE_UPDATED",
        spaceId: "space1",
        name: "Updated Name",
        color: "#00ff00",
        description: "New description",
        icon: "💼",
      });

      const state = store.getSnapshot().context;
      const space = state.spaces.space1;
      expect(space.name).toBe("Updated Name");
      expect(space.color).toBe("#00ff00");
      expect(space.description).toBe("New description");
      expect(space.icon).toBe("💼");
      expect(space.lastActiveAt.getTime()).toBeGreaterThanOrEqual(initialTime);
    });

    it("activates a different space", async () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Space 1",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });

      const initialState = store.getSnapshot().context;
      const space2InitialTime =
        initialState.spaces.space2.lastActiveAt.getTime();

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      store.send({ type: "SPACE_ACTIVATED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.currentSpaceId).toBe("space1");
      expect(state.spaces.space1.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        space2InitialTime,
      );
    });

    it("archives a space and switches to another active space", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Space 1",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({ type: "SPACE_ACTIVATED", spaceId: "space1" });
      store.send({ type: "SPACE_ARCHIVED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.isArchived).toBe(true);
      expect(state.currentSpaceId).toBe("space2"); // Should switch to another active space
    });

    it("does not archive the last active space", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Only Space",
        availableAgents: ["agent1"],
      });
      store.send({ type: "SPACE_ARCHIVED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.isArchived).toBe(false);
      expect(state.currentSpaceId).toBe("space1");
    });

    it("restores an archived space", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Space 1",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({ type: "SPACE_ARCHIVED", spaceId: "space1" });
      store.send({ type: "SPACE_RESTORED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.isArchived).toBe(false);
      expect(state.spaces.space1.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        state.spaces.space1.createdAt.getTime(),
      );
    });

    it("enforces maximum space limit", () => {
      // Add maximum number of spaces
      for (let i = 1; i <= MAX_SPACES; i++) {
        store.send({
          type: "SPACE_ADDED",
          spaceId: `space${i}`,
          name: `Space ${i}`,
          availableAgents: ["agent1"],
        });
      }

      // Try to add one more
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space11",
        name: "Excess Space",
        availableAgents: ["agent1"],
      });

      const state = store.getSnapshot().context;
      expect(Object.keys(state.spaces)).toHaveLength(MAX_SPACES);
      expect(state.spaces).not.toHaveProperty("space11");
    });

    it("allows adding space when archived spaces exist", () => {
      // Add maximum spaces and archive one
      for (let i = 1; i <= MAX_SPACES; i++) {
        store.send({
          type: "SPACE_ADDED",
          spaceId: `space${i}`,
          name: `Space ${i}`,
          availableAgents: ["agent1"],
        });
      }
      store.send({ type: "SPACE_ARCHIVED", spaceId: "space1" });

      // Should be able to add another space
      store.send({
        type: "SPACE_ADDED",
        spaceId: "new_space",
        name: "New Space",
        availableAgents: ["agent1"],
      });

      const state = store.getSnapshot().context;
      expect(state.spaces).toHaveProperty("new_space");
    });
  });

  describe("Space-Aware Chat App Management", () => {
    beforeEach(() => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Test Space",
        availableAgents: ["agent1"],
      });
    });

    it("adds chat app to current space", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps).toHaveProperty("app1");
      expect(state.chatApps.app1.spaceId).toBe("space1");
      expect(state.chatApps.app1.status).toBe("compact");
    });

    it("expands chat app and stashes siblings in same space", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app2",
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space2",
        appId: "app3",
      });

      store.send({
        type: "CHAT_APP_EXPANDED",
        spaceId: "space1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("expanded");
      expect(state.chatApps.app2.status).toBe("stashed"); // Sibling in same space
      expect(state.chatApps.app3.status).toBe("compact"); // Different space, unchanged
    });

    it("compacts chat app and un-expands expanded app in same space", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app2",
      });

      store.send({
        type: "CHAT_APP_EXPANDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_COMPACTED",
        spaceId: "space1",
        appId: "app2",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app2.status).toBe("compact");
    });

    it("removes chat app from space", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_REMOVED",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps).not.toHaveProperty("app1");
    });

    it("archives chat app instead of removing when specified", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ARCHIVED",
        spaceId: "space1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("archived");
      expect(state.chatApps.app1.isArchived).toBe(true);
    });

    it("restores archived chat app", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ARCHIVED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_RESTORED",
        spaceId: "space1",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("compact");
      expect(state.chatApps.app1.isArchived).toBe(false);
    });

    it("archives all chat apps when space is archived", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app2",
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space2",
        appId: "app3",
      });

      store.send({ type: "SPACE_ARCHIVED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.isArchived).toBe(true);
      expect(state.chatApps.app2.isArchived).toBe(true);
      expect(state.chatApps.app3.isArchived).toBe(false); // Different space
    });
  });

  describe("Agent Management", () => {
    beforeEach(() => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Test Space",
        availableAgents: ["agent1", "agent2"],
      });
    });

    it("adds agent to space", () => {
      store.send({
        type: "SPACE_AGENT_ADDED",
        spaceId: "space1",
        agentId: "agent3",
      });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.availableAgents).toContain("agent3");
    });

    it("does not add duplicate agents", () => {
      store.send({
        type: "SPACE_AGENT_ADDED",
        spaceId: "space1",
        agentId: "agent1", // Already exists
      });

      const state = store.getSnapshot().context;
      const agents = state.spaces.space1.availableAgents;
      expect(agents.filter((agent) => agent === "agent1")).toHaveLength(1);
    });

    it("removes agent from space when multiple agents available", () => {
      store.send({
        type: "SPACE_AGENT_REMOVED",
        spaceId: "space1",
        agentId: "agent1",
      });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.availableAgents).not.toContain("agent1");
      expect(state.spaces.space1.availableAgents).toContain("agent2");
    });

    it("does not remove the last agent from space", () => {
      // Remove all but one agent first
      store.send({
        type: "SPACE_AGENT_REMOVED",
        spaceId: "space1",
        agentId: "agent1",
      });

      // Try to remove the last agent
      store.send({
        type: "SPACE_AGENT_REMOVED",
        spaceId: "space1",
        agentId: "agent2",
      });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.availableAgents).toContain("agent2");
      expect(state.spaces.space1.availableAgents).toHaveLength(1);
    });
  });

  describe("Layout Preferences", () => {
    beforeEach(() => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Test Space",
        availableAgents: ["agent1"],
      });
    });

    it("updates layout preferences for space", () => {
      const layoutPrefs = {
        sidebarWidth: 300,
        chatAreaHeight: 600,
      };

      store.send({
        type: "SPACE_LAYOUT_PREFERENCES_UPDATED",
        spaceId: "space1",
        layoutPreferences: layoutPrefs,
      });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.layoutPreferences).toEqual(layoutPrefs);
    });

    it("merges layout preferences with existing ones", () => {
      const initialPrefs = {
        sidebarWidth: 250,
        chatAreaHeight: 500,
      };
      const updatePrefs = {
        sidebarWidth: 350, // Update existing
        headerHeight: 60, // Add new
      };

      store.send({
        type: "SPACE_LAYOUT_PREFERENCES_UPDATED",
        spaceId: "space1",
        layoutPreferences: initialPrefs,
      });

      store.send({
        type: "SPACE_LAYOUT_PREFERENCES_UPDATED",
        spaceId: "space1",
        layoutPreferences: updatePrefs,
      });

      const state = store.getSnapshot().context;
      expect(state.spaces.space1.layoutPreferences).toEqual({
        sidebarWidth: 350, // Updated
        chatAreaHeight: 500, // Preserved
        headerHeight: 60, // Added
      });
    });
  });

  describe("Error Handling", () => {
    it("handles operations on non-existent spaces gracefully", () => {
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "nonexistent",
        appId: "app1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps).not.toHaveProperty("app1");
    });

    it("handles activation of non-existent space gracefully", () => {
      store.send({
        type: "SPACE_ACTIVATED",
        spaceId: "nonexistent",
      });

      const state = store.getSnapshot().context;
      expect(state.currentSpaceId).toBeNull();
    });

    it("handles agent operations on non-existent space gracefully", () => {
      store.send({
        type: "SPACE_AGENT_ADDED",
        spaceId: "nonexistent",
        agentId: "agent1",
      });

      // Should not throw or crash
      expect(true).toBe(true);
    });

    it("handles chat app operations with invalid space gracefully", () => {
      store.send({
        type: "CHAT_APP_EXPANDED",
        spaceId: "nonexistent",
        appId: "app1",
      });

      // Should not throw or crash
      expect(true).toBe(true);
    });
  });

  describe("State Consistency", () => {
    it("maintains current space consistency when spaces are modified", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Space 1",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({ type: "SPACE_ACTIVATED", spaceId: "space2" });

      // Archive current space - should switch to another active space
      store.send({ type: "SPACE_ARCHIVED", spaceId: "space2" });

      const state = store.getSnapshot().context;
      expect(state.currentSpaceId).toBe("space1");
    });

    it("creates default space when no spaces exist", () => {
      // The store should create a default space if none exist
      store.send({ type: "ENSURE_DEFAULT_SPACE" });

      const state = store.getSnapshot().context;
      expect(Object.keys(state.spaces)).toHaveLength(1);
      expect(state.currentSpaceId).not.toBeNull();
    });

    it("preserves chat app states when switching spaces", () => {
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space1",
        name: "Space 1",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "SPACE_ADDED",
        spaceId: "space2",
        name: "Space 2",
        availableAgents: ["agent1"],
      });
      store.send({
        type: "CHAT_APP_ADDED",
        spaceId: "space1",
        appId: "app1",
      });
      store.send({
        type: "CHAT_APP_EXPANDED",
        spaceId: "space1",
        appId: "app1",
      });

      // Switch spaces
      store.send({ type: "SPACE_ACTIVATED", spaceId: "space2" });
      store.send({ type: "SPACE_ACTIVATED", spaceId: "space1" });

      const state = store.getSnapshot().context;
      expect(state.chatApps.app1.status).toBe("expanded"); // State preserved
    });
  });
});

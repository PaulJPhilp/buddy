import { beforeEach, describe, expect, it } from "vitest";
import { SpaceEntry, UIState } from "../types";
import {
  addAgentToSpace,
  canAddMoreSpaces,
  canRemoveAgent,
  createSpaceEntry,
  generateSpaceId,
  getActiveSpaces,
  getChatAppsInSpace,
  getCurrentSpace,
  getExpandedChatAppInSpace,
  migrateTabsToSpaces,
  removeAgentFromSpace,
  validateAvailableAgents,
  validateWorkspaceIcon,
  validateWorkspaceName,
} from "../workspaceUtils";

describe("workspaceUtils", () => {
  describe("validateWorkspaceName", () => {
    it("should return true for valid names", () => {
      expect(validateWorkspaceName("My Space")).toBe(true);
      expect(validateWorkspaceName("Project-Alpha")).toBe(true);
      expect(validateWorkspaceName("Work 123")).toBe(true);
    });

    it("should return false for invalid names", () => {
      expect(validateWorkspaceName("")).toBe(false);
      expect(validateWorkspaceName("   ")).toBe(false);
      expect(validateWorkspaceName("A".repeat(51))).toBe(false);
    });
  });

  describe("validateAvailableAgents", () => {
    it("should return true for valid agent arrays", () => {
      expect(validateAvailableAgents(["agent1"])).toBe(true);
      expect(validateAvailableAgents(["agent1", "agent2"])).toBe(true);
    });

    it("should return false for invalid agent arrays", () => {
      expect(validateAvailableAgents([])).toBe(false);
      expect(validateAvailableAgents([""])).toBe(false);
      expect(validateAvailableAgents(["agent1", "  "])).toBe(false);
    });
  });

  describe("validateWorkspaceIcon", () => {
    // Example test data for icons
    const validIcons = ["🚀", "📁", "🌟"];
    const invalidIcons = ["", "  ", "invalid", "🚀🌟"];

    validIcons.forEach((icon) => {
      it(`should return true for valid icon: ${icon}`, () => {
        expect(validateWorkspaceIcon(icon)).toBe(true);
      });
    });

    invalidIcons.forEach((icon) => {
      it(`should return false for invalid icon: ${icon}`, () => {
        expect(validateWorkspaceIcon(icon)).toBe(false);
      });
    });

    it("should return false for empty string", () => {
      expect(validateWorkspaceIcon("")).toBe(false);
    });
  });

  describe("Creation Functions", () => {
    it("generates unique space IDs", () => {
      const id1 = generateSpaceId();
      const id2 = generateSpaceId();

      expect(id1).toMatch(/^space-\d+-\d+$/);
      expect(id2).toMatch(/^space-\d+-\d+$/);
      expect(id1).not.toBe(id2);
    });

    it("creates space entry with defaults", () => {
      const space = createSpaceEntry("Test Space", {
        availableAgents: ["default"],
      });

      expect(space.name).toBe("Test Space");
      expect(space.color).toBe("#3b82f6");
      expect(space.icon).toBe("📁");
      expect(space.availableAgents).toEqual(["default"]);
      expect(space.isArchived).toBe(false);
    });
  });

  describe("Query Functions", () => {
    let mockState: UIState;

    beforeEach(() => {
      mockState = {
        currentSpaceId: "space1",
        spaces: {
          space1: {
            id: "space1",
            name: "Active Space",
            color: "#3b82f6",
            description: "",
            icon: "📁",
            availableAgents: ["agent1"],
            isArchived: false,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            layoutPreferences: {},
          },
          space2: {
            id: "space2",
            name: "Archived Space",
            color: "#ef4444",
            description: "",
            icon: "📦",
            availableAgents: ["agent2"],
            isArchived: true,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            layoutPreferences: {},
          },
        },
        chatApps: {
          app1: {
            id: "app1",
            spaceId: "space1",
            status: "compact",
            createdAt: new Date(),
            isArchived: false,
          },
          app2: {
            id: "app2",
            spaceId: "space1",
            status: "expanded",
            createdAt: new Date(),
            isArchived: false,
          },
        },
      };
    });

    it("returns only active spaces", () => {
      const activeSpaces = getActiveSpaces(mockState.spaces);
      expect(activeSpaces).toHaveLength(1);
      expect(activeSpaces[0].id).toBe("space1");
    });

    it("returns current space", () => {
      const currentSpace = getCurrentSpace(mockState);
      expect(currentSpace?.id).toBe("space1");
    });

    it("returns chat apps in space", () => {
      const chatApps = getChatAppsInSpace(mockState, "space1");
      expect(chatApps).toHaveLength(2);
    });

    it("returns expanded chat app", () => {
      const expandedApp = getExpandedChatAppInSpace(mockState, "space1");
      expect(expandedApp?.id).toBe("app2");
    });
  });

  describe("Agent Management", () => {
    let mockSpace: SpaceEntry;

    beforeEach(() => {
      mockSpace = {
        id: "space1",
        name: "Test Space",
        color: "#3b82f6",
        description: "",
        icon: "📁",
        availableAgents: ["agent1", "agent2"],
        isArchived: false,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        layoutPreferences: {},
      };
    });

    it("adds agent to space", () => {
      const updatedSpace = addAgentToSpace(mockSpace, "agent3");
      expect(updatedSpace.availableAgents).toContain("agent3");
    });

    it("removes agent from space", () => {
      const updatedSpace = removeAgentFromSpace(mockSpace, "agent1");
      expect(updatedSpace.availableAgents).not.toContain("agent1");
    });

    it("prevents removing last agent", () => {
      const spaceWithOneAgent = { ...mockSpace, availableAgents: ["agent1"] };
      const updatedSpace = removeAgentFromSpace(spaceWithOneAgent, "agent1");
      expect(updatedSpace.availableAgents).toContain("agent1");
    });

    it("checks if agent can be removed", () => {
      expect(canRemoveAgent(mockSpace, "agent1")).toBe(true);

      const spaceWithOneAgent = { ...mockSpace, availableAgents: ["agent1"] };
      expect(canRemoveAgent(spaceWithOneAgent, "agent1")).toBe(false);
    });
  });
});

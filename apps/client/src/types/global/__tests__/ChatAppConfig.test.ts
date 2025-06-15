import { describe, expect, it } from "vitest";
import { ChatAppConfig } from "../index";

describe("ChatAppConfig Schema", () => {
  const validConfigData = {
    id: "test-chat",
    name: "Test Chat",
    agentId: "test-agent",
    toolbarId: "test-toolbar",
    themeId: "test-theme",
    description: "A test chat application",
    version: "1.0.0",
  };

  const validConfigWithEmbedded = {
    ...validConfigData,
    agent: {
      id: "test-agent",
      initialAgentName: "Test Agent",
      prompt: "You are a helpful assistant",
    },
    toolbar: {
      id: "test-toolbar",
      name: "Test Toolbar",
      tools: ["search", "calculator"],
    },
    theme: {
      colors: {
        primary: "#db2777",
        secondary: "#fce7f3",
      },
    },
  };

  describe("Schema Validation", () => {
    it("should parse valid minimal config", () => {
      const result = ChatAppConfig.parse(validConfigData);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.id).toBe("test-chat");
      expect(result.name).toBe("Test Chat");
    });

    it("should parse config with embedded objects", () => {
      const result = ChatAppConfig.parse(validConfigWithEmbedded);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.agent?.id).toBe("test-agent");
      expect(result.toolbar?.name).toBe("Test Toolbar");
      expect(result.theme).toBeDefined();
    });

    it("should reject invalid config missing required fields", () => {
      const invalidData = { name: "Test Chat" }; // missing required id, agentId, etc.

      expect(() => ChatAppConfig.parse(invalidData)).toThrow();
    });

    it("should handle optional fields correctly", () => {
      const configWithOptionals = {
        ...validConfigData,
        description: undefined,
        version: undefined,
        agent: undefined,
        toolbar: undefined,
        theme: undefined,
      };

      const result = ChatAppConfig.parse(configWithOptionals);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.description).toBeUndefined();
      expect(result.agent).toBeUndefined();
    });
  });

  describe("Utility Functions", () => {
    it("should encode config to plain object", () => {
      const config = ChatAppConfig.parse(validConfigWithEmbedded);
      const encoded = ChatAppConfig.encode(config);

      expect(encoded).toEqual(validConfigWithEmbedded);
      expect(encoded).not.toBeInstanceOf(ChatAppConfig);
    });

    it("should check if object is valid ChatAppConfig", () => {
      const config = ChatAppConfig.parse(validConfigData);

      expect(ChatAppConfig.is(config)).toBe(true);
      expect(ChatAppConfig.is(validConfigData)).toBe(false); // plain object
      expect(ChatAppConfig.is({})).toBe(false);
    });
  });

  describe("Real Config File Structure", () => {
    it("should parse actual pink-buddy.json structure", () => {
      const pinkBuddyConfig = {
        id: "pink-chat",
        name: "Pink Chat",
        agentId: "pink-agent",
        toolbarId: "default-toolbar",
        themeId: "pink-theme",
        description: "A pink-themed chat application",
        version: "1.0.0",
        agent: {
          id: "pink-agent",
          initialAgentName: "Pink Agent",
        },
        toolbar: {
          id: "default-toolbar",
          name: "Default Toolbar",
          tools: [],
        },
        theme: {
          colors: {
            primary: "#db2777",
            secondary: "#fce7f3",
            accent: "#ec4899",
            background: "white",
            text: "gray-900",
          },
          borders: {
            color: "#fbcfe8",
            thickness: "2px",
            radius: "0.75rem",
          },
        },
      };

      const result = ChatAppConfig.parse(pinkBuddyConfig);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.id).toBe("pink-chat");
      expect(result.agent?.initialAgentName).toBe("Pink Agent");
      expect(result.toolbar?.tools).toEqual([]);
    });
  });
});

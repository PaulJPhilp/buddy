import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ChatAppConfig, ChatAppStyle } from "../ChatAppConfig";

// Create parse utility for ChatAppStyle
const parseChatAppStyle = Schema.decodeUnknownSync(ChatAppStyle);

describe("ChatAppConfig Schema", () => {
  const validStyleData = {
    primaryColor: "#db2777",
    primaryContrastColor: "#ffffff",
    backgroundColor: "#ffffff",
    backgroundSecondaryColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: "8px",
    borderWidth: "1px",
    typographyClass: "font-sans",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: "400",
    messageBackgroundColor: "#f1f5f9",
    userMessageColor: "#3b82f6",
    assistantMessageColor: "#64748b",
    inputBackgroundColor: "#ffffff",
    inputBorderColor: "#d1d5db",
    shadowColor: "#000000",
    shadowIntensity: "md" as const,
    opacity: 1,
    iconColor: "#6b7280",
    iconSize: "16px",
    compactMode: false,
    showTimestamps: true,
    showAvatars: true,
  };

  const validConfigData = {
    id: "test-chat-app",
    name: "Test Chat App",
    agentId: "test-agent",
    toolbarId: "test-toolbar",
    themeId: "test-theme",
    description: "A test chat app",
    version: "1.0.0",
    agent: {
      id: "test-agent",
      name: "Test Agent",
      initialAgentName: "Assistant",
      prompt: "You are a helpful assistant",
      description: "A test agent",
      provider: "openai",
      model: "gpt-3.5-turbo",
    },
    toolbar: {
      id: "test-toolbar",
      name: "Test Toolbar",
      tools: ["tool1", "tool2"],
    },
    style: validStyleData,
    updatedAt: "2023-01-01T00:00:00Z",
    ownerId: "user-1",
  };

  describe("ChatAppStyle Schema", () => {
    it("should parse valid style configuration", () => {
      const result = parseChatAppStyle(validStyleData);
      expect(result.primaryColor).toBe("#db2777");
      expect(result.primaryContrastColor).toBe("#ffffff");
      expect(result.shadowIntensity).toBe("md");
    });

    it("should handle optional style fields", () => {
      const minimalStyle = {
        primaryColor: "#db2777",
      };
      const result = parseChatAppStyle(minimalStyle);
      expect(result.primaryColor).toBe("#db2777");
      expect(result.primaryContrastColor).toBeUndefined();
    });

    it("should validate shadowIntensity enum", () => {
      const invalidStyle = {
        primaryColor: "#db2777",
        shadowIntensity: "invalid",
      };
      expect(() => parseChatAppStyle(invalidStyle)).toThrow();
    });

    it("should compute contrast color when not provided", () => {
      const styleWithoutContrast = {
        primaryColor: "#db2777", // dark pink
      };
      const result = parseChatAppStyle(styleWithoutContrast);
      expect(result.computedPrimaryContrastColor).toBe("#ffffff");
    });

    it("should use explicit contrast color when provided", () => {
      const styleWithContrast = {
        primaryColor: "#db2777",
        primaryContrastColor: "#000000", // explicitly set to black
      };
      const result = parseChatAppStyle(styleWithContrast);
      expect(result.computedPrimaryContrastColor).toBe("#000000");
    });

    it("should handle light colors for contrast calculation", () => {
      const lightStyle = {
        primaryColor: "#fce7f3", // light pink
      };
      const result = parseChatAppStyle(lightStyle);
      expect(result.computedPrimaryContrastColor).toBe("#000000");
    });

    it("should create style with computed contrast using static method", () => {
      const styleData = {
        primaryColor: "#db2777",
      };
      const result = ChatAppStyle.createWithComputedContrast(styleData);
      expect(result.primaryColor).toBe("#db2777");
      expect(result.primaryContrastColor).toBe("#ffffff");
    });

    it("should not override explicit contrast color in static method", () => {
      const styleData = {
        primaryColor: "#db2777",
        primaryContrastColor: "#000000",
      };
      const result = ChatAppStyle.createWithComputedContrast(styleData);
      expect(result.primaryContrastColor).toBe("#000000"); // should keep explicit value
    });

    it("should handle missing primary color gracefully", () => {
      const styleWithoutPrimary = {};
      const result = parseChatAppStyle(styleWithoutPrimary);
      expect(result.computedPrimaryContrastColor).toBe("#ffffff"); // default fallback
    });
  });

  describe("Schema Validation", () => {
    it("should parse valid minimal config", () => {
      const result = ChatAppConfig.parse(validConfigData);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.id).toBe("test-chat-app");
      expect(result.name).toBe("Test Chat App");
    });

    it("should parse config with embedded objects and style", () => {
      const result = ChatAppConfig.parse(validConfigData);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.agent?.id).toBe("test-agent");
      expect(result.toolbar?.name).toBe("Test Toolbar");
      expect(result.style).toBeInstanceOf(ChatAppStyle);
      expect(result.style?.primaryColor).toBe("#db2777");
      // Theme is optional, so we don't expect it to be defined
      expect(result.theme).toBeUndefined();
    });

    it("should reject invalid config missing required fields", () => {
      const invalidData = { name: "Test Chat App" }; // missing required id, agentId, etc.

      expect(() => ChatAppConfig.parse(invalidData)).toThrow();
    });

    it("should handle optional fields correctly", () => {
      const configWithOptionals = {
        ...validConfigData,
        description: undefined,
        version: undefined,
        agent: undefined,
        toolbar: undefined,
        style: undefined,
        theme: undefined,
      };

      const result = ChatAppConfig.parse(configWithOptionals);
      expect(result).toBeInstanceOf(ChatAppConfig);
      expect(result.description).toBeUndefined();
      expect(result.agent).toBeUndefined();
      expect(result.style).toBeUndefined();
    });
  });

  describe("Utility Functions", () => {
    it("should encode config to plain object", () => {
      const config = ChatAppConfig.parse(validConfigData);
      const encoded = ChatAppConfig.encode(config);

      expect(encoded).toEqual(validConfigData);
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
        updatedAt: "2024-01-01T00:00:00Z",
        ownerId: "user-1",
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

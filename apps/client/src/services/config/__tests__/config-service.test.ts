import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../service";
import type { AppConfig } from "../types";
import {
  createDefaultAgentConfig,
  createDefaultAppConfig,
  createDefaultChatAppConfig,
  createDefaultWorkspaceConfig,
  getCurrentTimestamp,
} from "../types";

// Test layer
const TestLayer = ConfigService.Default;

// Mock fetch globally
global.fetch = vi.fn();

describe("ConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration Loading", () => {
    it("should load valid configuration", async () => {
      const mockConfig: AppConfig = {
        app: {
          name: "Test App",
          version: "1.0.0",
          debugMode: false,
          environment: "test",
        },
        workspaces: [
          {
            id: "test-workspace",
            name: "Test Workspace",
            chatappIds: [],
            agentIds: [],
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          },
        ],
        chatapps: [
          {
            id: "test-chatapp",
            name: "Test Chat App",
            version: "1.0.0",
            agentId: "test-agent",
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          },
        ],
        agents: [
          {
            id: "test-agent",
            name: "Test Agent",
            version: "1.0.0",
            provider: "openai",
            model: "gpt-4",
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          },
        ],
        version: "1.0.0",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const config = yield* configService.loadConfig("./test-config.json");

        expect(config.app.name).toBe("Test App");
        expect(config.workspaces).toHaveLength(1);
        expect(config.chatapps).toHaveLength(1);
        expect(config.agents).toHaveLength(1);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration loading errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .loadConfig("./invalid-config.json")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigLoadError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle invalid JSON parsing", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("invalid json"),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .loadConfig("./invalid-config.json")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigParseError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .loadConfig("./missing-config.json")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigLoadError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate valid configuration", async () => {
      const validConfig = createDefaultAppConfig();
      validConfig.workspaces.push(
        createDefaultWorkspaceConfig("Test Workspace")
      );
      validConfig.agents.push(
        createDefaultAgentConfig("Test Agent", "openai", "gpt-4")
      );
      validConfig.chatapps.push(
        createDefaultChatAppConfig("Test Chat", validConfig.agents[0].id)
      );

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(validConfig);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect missing required fields", async () => {
      const invalidConfig = {
        app: {
          // missing name and version
        },
        workspaces: [],
        chatapps: [],
        agents: [],
        version: "1.0.0",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(invalidConfig);

        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.errors.some((e) => e.field === "app.name")).toBe(
          true
        );
        expect(validation.errors.some((e) => e.field === "app.version")).toBe(
          true
        );
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect invalid workspace IDs", async () => {
      const invalidConfig = createDefaultAppConfig();
      invalidConfig.workspaces.push({
        id: "invalid id with spaces",
        name: "Test Workspace",
        chatappIds: [],
        agentIds: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(invalidConfig);

        expect(validation.isValid).toBe(false);
        expect(
          validation.errors.some((e) => e.field === "workspaces[0].id")
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect duplicate IDs when checking duplicates", async () => {
      const invalidConfig = createDefaultAppConfig();
      invalidConfig.workspaces.push(
        createDefaultWorkspaceConfig("Workspace 1", "duplicate-id"),
        createDefaultWorkspaceConfig("Workspace 2", "duplicate-id")
      );

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(invalidConfig, {
          checkDuplicates: true,
        });

        expect(validation.isValid).toBe(false);
        expect(
          validation.errors.some((e) =>
            e.message.includes("Duplicate workspace ID")
          )
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect invalid references when validating references", async () => {
      const invalidConfig = createDefaultAppConfig();
      invalidConfig.chatapps.push({
        id: "test-chatapp",
        name: "Test Chat App",
        version: "1.0.0",
        agentId: "non-existent-agent",
        spaceId: "non-existent-workspace",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(invalidConfig, {
          validateReferences: true,
        });

        expect(validation.isValid).toBe(false);
        expect(
          validation.errors.some((e) =>
            e.message.includes("Referenced agent does not exist")
          )
        ).toBe(true);
        expect(
          validation.errors.some((e) =>
            e.message.includes("Referenced workspace does not exist")
          )
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should provide suggestions for empty arrays", async () => {
      const emptyConfig = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(emptyConfig);

        expect(validation.suggestions.length).toBeGreaterThan(0);
        expect(
          validation.suggestions.some((s) =>
            s.message.includes("Consider adding at least one workspace")
          )
        ).toBe(true);
        expect(
          validation.suggestions.some((s) =>
            s.message.includes("Consider adding at least one chat app")
          )
        ).toBe(true);
        expect(
          validation.suggestions.some((s) =>
            s.message.includes("Consider adding at least one agent")
          )
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should provide warnings for missing optional fields", async () => {
      const configWithoutOptionals = createDefaultAppConfig();
      configWithoutOptionals.app.description = undefined;
      configWithoutOptionals.app.author = undefined;

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(
          configWithoutOptionals
        );

        expect(validation.warnings.length).toBeGreaterThan(0);
        expect(
          validation.warnings.some((w) => w.field === "app.description")
        ).toBe(true);
        expect(validation.warnings.some((w) => w.field === "app.author")).toBe(
          true
        );
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Merging", () => {
    it("should merge configurations with replace strategy", async () => {
      const baseConfig = createDefaultAppConfig();
      baseConfig.app.name = "Base App";
      baseConfig.workspaces.push(
        createDefaultWorkspaceConfig("Base Workspace")
      );

      const overrideConfig = {
        app: {
          name: "Override App",
          version: "2.0.0",
        },
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig,
          { strategy: "replace" }
        );

        expect(merged.app.name).toBe("Override App");
        expect(merged.app.version).toBe("2.0.0");
        expect(merged.workspaces).toHaveLength(1);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should merge configurations with merge strategy", async () => {
      const baseConfig = createDefaultAppConfig();
      baseConfig.app.name = "Base App";
      baseConfig.workspaces.push(
        createDefaultWorkspaceConfig("Base Workspace")
      );

      const overrideConfig = {
        app: {
          description: "Override Description",
        },
        workspaces: [createDefaultWorkspaceConfig("Override Workspace")],
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig,
          { strategy: "merge" }
        );

        expect(merged.app.name).toBe("Base App");
        expect(merged.app.description).toBe("Override Description");
        expect(merged.workspaces).toHaveLength(2);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should merge configurations with append strategy", async () => {
      const baseConfig = createDefaultAppConfig();
      baseConfig.workspaces.push(
        createDefaultWorkspaceConfig("Base Workspace")
      );

      const overrideConfig = {
        app: {
          description: "Override Description", // Should be ignored in append mode
        },
        workspaces: [createDefaultWorkspaceConfig("Override Workspace")],
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig,
          { strategy: "append" }
        );

        // In append mode, non-array fields from base config should be preserved
        expect(merged.app.description).toBe("AI-powered chat application");
        expect(merged.workspaces).toHaveLength(2);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Templates", () => {
    it("should create default configuration", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const defaultConfig = yield* configService.createDefaultConfig();

        expect(defaultConfig.app.name).toBe("Buddy");
        expect(defaultConfig.app.version).toBe("1.0.0");
        expect(defaultConfig.workspaces).toHaveLength(0);
        expect(defaultConfig.chatapps).toHaveLength(0);
        expect(defaultConfig.agents).toHaveLength(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should create default configuration with overrides", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const defaultConfig = yield* configService.createDefaultConfig({
          app: {
            name: "Custom App",
            version: "2.0.0",
            debugMode: true,
            environment: "development",
          },
        });

        expect(defaultConfig.app.name).toBe("Custom App");
        expect(defaultConfig.app.version).toBe("2.0.0");
        expect(defaultConfig.app.debugMode).toBe(true);
        expect(defaultConfig.app.environment).toBe("development");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Utilities", () => {
    it("should get and set config path", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Initially should be null
        const initialPath = yield* configService.getConfigPath();
        expect(initialPath).toBeNull();

        // Set a new path
        yield* configService.setConfigPath("./custom-config.json");

        // Should return the set path
        const newPath = yield* configService.getConfigPath();
        expect(newPath).toBe("./custom-config.json");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should get config metadata", async () => {
      const mockConfig = createDefaultAppConfig();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const metadata = yield* configService.getConfigMetadata(
          "./test-config.json"
        );

        expect(metadata.path).toBe("./test-config.json");
        expect(metadata.isValid).toBe(true);
        expect(metadata.lastModified).toBeInstanceOf(Date);
        expect(metadata.size).toBe(0); // Placeholder value
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Health", () => {
    it("should check healthy configuration", async () => {
      const healthyConfig = createDefaultAppConfig();
      healthyConfig.workspaces.push(
        createDefaultWorkspaceConfig("Test Workspace")
      );

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(healthyConfig),
        text: () => Promise.resolve(JSON.stringify(healthyConfig)),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const health = yield* configService.checkConfigHealth(
          "./healthy-config.json"
        );

        expect(health.isHealthy).toBe(true);
        expect(health.issues).toHaveLength(0);
        expect(health.recommendations.length).toBeGreaterThan(0); // Should suggest adding agents/chatapps
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect unhealthy configuration", async () => {
      const unhealthyConfig = {
        app: {
          // missing required fields
        },
        workspaces: [],
        chatapps: [],
        agents: [],
        version: "1.0.0",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(unhealthyConfig),
        text: () => Promise.resolve(JSON.stringify(unhealthyConfig)),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const health = yield* configService.checkConfigHealth(
          "./unhealthy-config.json"
        );

        expect(health.isHealthy).toBe(false);
        expect(health.issues.length).toBeGreaterThan(0);
        expect(health.recommendations.length).toBeGreaterThan(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should repair configuration", async () => {
      const brokenConfig = {
        app: {
          // missing required fields
        },
        // missing required arrays
        version: "1.0.0",
        // missing timestamps
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(brokenConfig),
        text: () => Promise.resolve(JSON.stringify(brokenConfig)),
      });

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const repaired = yield* configService.repairConfig(
          "./broken-config.json"
        );

        expect(repaired.app.name).toBe("Buddy");
        expect(repaired.app.version).toBe("1.0.0");
        expect(repaired.version).toBe("1.0.0");
        expect(repaired.workspaces).toEqual([]);
        expect(repaired.chatapps).toEqual([]);
        expect(repaired.agents).toEqual([]);
        expect(repaired.createdAt).toBeDefined();
        expect(repaired.updatedAt).toBeDefined();
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Export/Import", () => {
    it("should export configuration to JSON", async () => {
      const config = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const exported = yield* configService.exportConfig(config, "json");

        const parsed = JSON.parse(exported);
        expect(parsed.app.name).toBe(config.app.name);
        expect(parsed.version).toBe(config.version);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should fail to export unsupported formats", async () => {
      const config = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .exportConfig(config, "yaml")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigExportError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should import configuration from JSON", async () => {
      const config = createDefaultAppConfig();
      const jsonContent = JSON.stringify(config);

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const imported = yield* configService.importConfig(jsonContent, "json");

        expect(imported.app.name).toBe(config.app.name);
        expect(imported.version).toBe(config.version);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should fail to import invalid JSON", async () => {
      const invalidJson = "{ invalid json }";

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .importConfig(invalidJson, "json")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigImportError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should fail to import unsupported formats", async () => {
      const yamlContent = "app:\n  name: Test";

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const result = yield* configService
          .importConfig(yamlContent, "yaml")
          .pipe(Effect.either);

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ConfigImportError");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Reset", () => {
    it("should reset to defaults", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const defaultConfig = yield* configService.resetToDefaults();

        expect(defaultConfig.app.name).toBe("Buddy");
        expect(defaultConfig.app.version).toBe("1.0.0");
        expect(defaultConfig.workspaces).toHaveLength(0);
        expect(defaultConfig.chatapps).toHaveLength(0);
        expect(defaultConfig.agents).toHaveLength(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Migration", () => {
    it("should detect configuration version", async () => {
      const configWithVersion = {
        version: "2.1.0",
        app: { name: "Test" },
      };

      const configWithoutVersion = {
        app: { name: "Test" },
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        const version1 = yield* configService.detectConfigVersion(
          configWithVersion
        );
        expect(version1).toBe("2.1.0");

        const version2 = yield* configService.detectConfigVersion(
          configWithoutVersion
        );
        expect(version2).toBe("unknown");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should migrate configuration", async () => {
      const oldConfig = {
        app: { name: "Old App" },
        version: "0.9.0",
      };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const migrated = yield* configService.migrateConfig(
          oldConfig,
          "0.9.0",
          "1.0.0"
        );

        // Placeholder implementation just returns the config as-is
        expect(migrated.app.name).toBe("Old App");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });
});

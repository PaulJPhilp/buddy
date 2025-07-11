import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { ConfigService } from "../service";
import {
  createDefaultAgentConfig,
  createDefaultAppConfig,
  createDefaultChatAppConfig,
  createDefaultWorkspaceConfig,
  getCurrentTimestamp,
} from "../types";

const TestLayer = ConfigService.Default;

describe("ConfigService", () => {
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
        expect(validation.errors.some((e) => e.field === "schema")).toBe(true);
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
          validation.errors.some((e) => e.message.includes("Referenced agent"))
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should provide suggestions for empty arrays", async () => {
      const emptyConfig = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const validation = yield* configService.validateConfig(emptyConfig);

        expect(validation.isValid).toBe(true);
        expect(validation.suggestions).toBeDefined();
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Merging", () => {
    it("should merge configurations with default strategy", async () => {
      const config1 = createDefaultAppConfig();
      config1.app.name = "App 1";
      config1.workspaces.push(createDefaultWorkspaceConfig("Workspace 1"));

      const config2 = createDefaultAppConfig();
      config2.app.name = "App 2";
      config2.workspaces.push(createDefaultWorkspaceConfig("Workspace 2"));

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(config1, config2);

        expect(merged.app.name).toBe("App 2");
        expect(merged.workspaces).toHaveLength(2);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should merge configurations with replace strategy", async () => {
      const config1 = createDefaultAppConfig();
      config1.app.name = "App 1";
      config1.workspaces.push(createDefaultWorkspaceConfig("Workspace 1"));

      const config2 = createDefaultAppConfig();
      config2.app.name = "App 2";

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(config1, config2, {
          strategy: "replace",
        });

        expect(merged.app.name).toBe("App 2");
        expect(merged.workspaces).toHaveLength(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should merge configurations with append strategy", async () => {
      const config1 = createDefaultAppConfig();
      config1.workspaces.push(createDefaultWorkspaceConfig("Workspace 1"));

      const config2 = createDefaultAppConfig();
      config2.workspaces.push(createDefaultWorkspaceConfig("Workspace 2"));

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const merged = yield* configService.mergeConfigs(config1, config2, {
          strategy: "append",
        });

        expect(merged.workspaces).toHaveLength(2);
        expect(merged.workspaces[0].name).toBe("Workspace 1");
        expect(merged.workspaces[1].name).toBe("Workspace 2");
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
          app: { name: "Custom App", version: "2.0.0" },
        });

        expect(defaultConfig.app.name).toBe("Custom App");
        expect(defaultConfig.app.version).toBe("2.0.0");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Path Management", () => {
    it("should set and get configuration path", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const initialPath = yield* configService.getConfigPath();

        expect(initialPath).toBe("/configs/index.json");

        yield* configService.setConfigPath("./custom-config.json");

        const newPath = yield* configService.getConfigPath();
        expect(newPath).toBe("./custom-config.json");
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

        expect(exported).toContain('"name": "Buddy"');
        expect(exported).toContain('"version": "1.0.0"');
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should import configuration from JSON", async () => {
      const jsonContent = JSON.stringify(createDefaultAppConfig());

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const imported = yield* configService.importConfig(jsonContent, "json");

        expect(imported.app.name).toBe("Buddy");
        expect(imported.app.version).toBe("1.0.0");
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
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Configuration Metadata", () => {
    it("should get configuration metadata", async () => {
      const config = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const metadata = yield* configService.getConfigMetadata(config);

        expect(metadata.version).toBe("1.0.0");
        expect(metadata.size).toBeGreaterThan(0);
        expect(metadata.lastModified).toBeInstanceOf(Date);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should detect configuration version", async () => {
      const config = { version: "2.0.0" };

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const version1 = yield* configService.detectConfigVersion(config);
        expect(version1).toBe("2.0.0");

        const version2 = yield* configService.detectConfigVersion({});
        expect(version2).toBe("1.0.0");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should migrate configuration", async () => {
      const oldConfig = createDefaultAppConfig();

      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;
        const migrated = yield* configService.migrateConfig(oldConfig, "2.0.0");

        expect(migrated.app.name).toBe("Buddy");
        expect(migrated.version).toBe("1.0.0");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });
});

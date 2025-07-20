import {
  createDefaultAgentConfig,
  createDefaultAppConfig,
  createDefaultChatAppConfig,
  createDefaultWorkspaceConfig,
} from "@/features/application/config/defaults";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigService } from "../service";

const TestLayer = ConfigService.Default;

describe("ConfigService E2E Tests", () => {
  describe("Performance and State Management", () => {
    it("should handle reset operations correctly", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Reset to defaults
        const resetConfig = yield* configService.resetToDefaults();

        expect(resetConfig.app.name).toBe("Buddy");
        expect(resetConfig.workspaces).toHaveLength(0);
        expect(resetConfig.chatapps).toHaveLength(0);
        expect(resetConfig.agents).toHaveLength(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration path management", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Set custom config path
        yield* configService.setConfigPath("./custom-config.json");
        const path1 = yield* configService.getConfigPath();
        expect(path1).toBe("./custom-config.json");

        // Change path again
        yield* configService.setConfigPath("./config2.json");
        const path2 = yield* configService.getConfigPath();
        expect(path2).toBe("./config2.json");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration templates and validation", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create config with specific settings
        const config = yield* configService.createDefaultConfig({
          app: {
            name: "E2E Test App",
            version: "1.0.0",
            environment: "test" as const,
          },
        });

        // Validate the config
        const validation = yield* configService.validateConfig(config);
        expect(validation.isValid).toBe(true);

        // Test metadata
        const metadata = yield* configService.getConfigMetadata(config);
        expect(metadata.version).toBe("1.0.0");
        expect(metadata.size).toBeGreaterThan(0);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration export/import workflow", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create a config with some data
        const originalConfig = yield* configService.createDefaultConfig();

        // Export to JSON
        const exportedJson = yield* configService.exportConfig(
          originalConfig,
          "json"
        );

        // Import it back
        const importedConfig = yield* configService.importConfig(
          exportedJson,
          "json"
        );

        // Validate imported config
        const validation = yield* configService.validateConfig(importedConfig);
        expect(validation.isValid).toBe(true);

        // Should match original
        expect(importedConfig.app.name).toBe(originalConfig.app.name);
        expect(importedConfig.version).toBe(originalConfig.version);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration health checks and repair", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create a config that needs repair
        const configNeedingRepair = yield* configService.createDefaultConfig({
          app: { name: "", version: "" }, // Missing required fields
        });

        // Check health
        const health = yield* configService.checkConfigHealth(
          configNeedingRepair
        );
        expect(health.isHealthy).toBe(false);
        expect(health.issues.length).toBeGreaterThan(0);

        // Repair the config
        const repairedConfig = yield* configService.repairConfig(
          configNeedingRepair
        );
        expect(repairedConfig.app.name).toBe("Buddy");
        expect(repairedConfig.app.version).toBe("1.0.0");

        // Verify repair worked
        const repairedHealth = yield* configService.checkConfigHealth(
          repairedConfig
        );
        expect(repairedHealth.isHealthy).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration merging scenarios", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create base config
        const baseConfig = yield* configService.createDefaultConfig();
        baseConfig.workspaces.push(
          createDefaultWorkspaceConfig("Base Workspace")
        );

        // Create override config
        const overrideConfig = yield* configService.createDefaultConfig({
          app: { name: "Merged App" },
        });
        overrideConfig.workspaces.push(
          createDefaultWorkspaceConfig("Override Workspace")
        );

        // Test different merge strategies
        const mergedDefault = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig
        );
        expect(mergedDefault.app.name).toBe("Merged App");
        expect(mergedDefault.workspaces).toHaveLength(2);

        const mergedReplace = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig,
          {
            strategy: "replace",
          }
        );
        expect(mergedReplace.workspaces).toHaveLength(1);
        expect(mergedReplace.workspaces[0].name).toBe("Override Workspace");

        const mergedAppend = yield* configService.mergeConfigs(
          baseConfig,
          overrideConfig,
          {
            strategy: "append",
          }
        );
        expect(mergedAppend.workspaces).toHaveLength(2);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration validation with options", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create config with duplicate workspace IDs
        const configWithDuplicates = yield* configService.createDefaultConfig();
        configWithDuplicates.workspaces.push(
          createDefaultWorkspaceConfig("Workspace 1", "duplicate-id"),
          createDefaultWorkspaceConfig("Workspace 2", "duplicate-id")
        );

        // Validate with duplicate checking
        const validation = yield* configService.validateConfig(
          configWithDuplicates,
          {
            checkDuplicates: true,
          }
        );

        expect(validation.isValid).toBe(false);
        expect(
          validation.errors.some((e) => e.message.includes("Duplicate"))
        ).toBe(true);
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration version detection and migration", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Test version detection
        const version1 = yield* configService.detectConfigVersion({
          version: "2.0.0",
        });
        expect(version1).toBe("2.0.0");

        const version2 = yield* configService.detectConfigVersion({});
        expect(version2).toBe("1.0.0");

        // Test migration
        const oldConfig = yield* configService.createDefaultConfig();
        const migratedConfig = yield* configService.migrateConfig(
          oldConfig,
          "2.0.0"
        );
        expect(migratedConfig.app.name).toBe("Buddy");
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });
});

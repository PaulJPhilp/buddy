import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../service";
import {
  type AppConfig,
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

describe("ConfigService E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Configuration Lifecycle", () => {
    it("should handle complete config creation, validation, save, and reload cycle", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Step 1: Create a complete configuration
        const baseConfig = yield* configService.createDefaultConfig();
        expect(baseConfig.app.name).toBe("Buddy");
        expect(baseConfig.workspaces).toHaveLength(0);

        // Add workspace
        const workspace = createDefaultWorkspaceConfig("Production Workspace");
        baseConfig.workspaces.push(workspace);

        // Add agent
        const agent = createDefaultAgentConfig(
          "GPT-4 Agent",
          "openai",
          "gpt-4"
        );
        baseConfig.agents.push(agent);

        // Add chat app
        const chatapp = createDefaultChatAppConfig("Main Chat", agent.id);
        baseConfig.chatapps.push(chatapp);

        // Step 2: Validate the complete configuration
        const validation = yield* configService.validateConfig(baseConfig, {
          strict: true,
          checkDuplicates: true,
          validateReferences: true,
        });

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // Step 3: Save configuration
        yield* configService.saveConfig(
          baseConfig,
          "./test-complete-config.json",
          {
            validateOnSave: true,
            prettyPrint: true,
          }
        );

        // Step 4: Mock fetch for reload
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(baseConfig),
          text: () => Promise.resolve(JSON.stringify(baseConfig)),
        });

        yield* configService.setConfigPath("./test-complete-config.json");
        const reloadedConfig = yield* configService.reloadConfig();

        // Step 5: Verify reloaded config matches original
        expect(reloadedConfig.app.name).toBe(baseConfig.app.name);
        expect(reloadedConfig.workspaces).toHaveLength(1);
        expect(reloadedConfig.agents).toHaveLength(1);
        expect(reloadedConfig.chatapps).toHaveLength(1);

        // Step 6: Verify references are intact
        expect(reloadedConfig.chatapps[0].agentId).toBe(
          reloadedConfig.agents[0].id
        );

        return reloadedConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration merging workflow", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create base production config
        const prodConfig = yield* configService.createDefaultConfig({
          app: {
            name: "Buddy Production",
            version: "1.0.0",
            environment: "production",
            debugMode: false,
          },
        });

        prodConfig.agents.push(
          createDefaultAgentConfig("Production GPT-4", "openai", "gpt-4")
        );

        // Create development overrides
        const devOverrides = {
          app: {
            name: "Buddy Development",
            environment: "development" as const,
            debugMode: true,
          },
          agents: [
            createDefaultAgentConfig("Dev GPT-3.5", "openai", "gpt-3.5-turbo"),
          ],
        };

        // Test merge strategy
        const mergedConfig = yield* configService.mergeConfigs(
          prodConfig,
          devOverrides,
          { strategy: "merge" }
        );

        expect(mergedConfig.app.name).toBe("Buddy Development");
        expect(mergedConfig.app.environment).toBe("development");
        expect(mergedConfig.app.debugMode).toBe(true);
        expect(mergedConfig.agents).toHaveLength(2); // Original + new

        // Validate final merged config
        const validation = yield* configService.validateConfig(mergedConfig);
        expect(validation.isValid).toBe(true);

        return mergedConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration health monitoring workflow", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create a broken configuration
        const brokenConfig = {
          app: {
            description: "Broken app",
          },
          version: "invalid-version",
        };

        // Mock fetch for broken config - checkConfigHealth calls validateConfigFile which calls loadConfigFromPath
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(brokenConfig)),
        });

        // Check health of broken config
        const health = yield* configService.checkConfigHealth(
          "./broken-config.json"
        );

        expect(health.isHealthy).toBe(false);
        expect(health.issues.length).toBeGreaterThan(0);

        // Mock fetch for repair config - repairConfig also calls loadConfigFromPath
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(brokenConfig)),
        });

        // Repair the configuration
        const repairedConfig = yield* configService.repairConfig(
          "./broken-config.json"
        );

        expect(repairedConfig.app.name).toBe("Buddy");
        expect(repairedConfig.app.version).toBe("1.0.0");
        expect(repairedConfig.workspaces).toEqual([]);
        expect(repairedConfig.chatapps).toEqual([]);
        expect(repairedConfig.agents).toEqual([]);

        // Validate repaired config
        const validation = yield* configService.validateConfig(repairedConfig);
        expect(validation.isValid).toBe(true);

        return repairedConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Real-world Configuration Scenarios", () => {
    it("should handle multi-workspace enterprise setup", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create enterprise configuration
        const enterpriseConfig = yield* configService.createDefaultConfig({
          app: {
            name: "Buddy Enterprise",
            version: "2.0.0",
            environment: "production",
            features: ["multi-tenant", "sso", "audit-logs"],
          },
        });

        // Add multiple agents for different purposes
        const agents = [
          createDefaultAgentConfig("Customer Support Agent", "openai", "gpt-4"),
          createDefaultAgentConfig("Sales Agent", "anthropic", "claude-3"),
          createDefaultAgentConfig("Technical Agent", "openai", "gpt-4-turbo"),
        ];

        agents.forEach((agent) => enterpriseConfig.agents.push(agent));

        // Add multiple workspaces for different teams
        const workspaces = [
          createDefaultWorkspaceConfig("Customer Support", "support-workspace"),
          createDefaultWorkspaceConfig("Sales Team", "sales-workspace"),
          createDefaultWorkspaceConfig("Engineering", "eng-workspace"),
        ];

        workspaces.forEach((workspace) =>
          enterpriseConfig.workspaces.push(workspace)
        );

        // Add chat apps for each team
        const chatapps = [
          createDefaultChatAppConfig(
            "Support Chat",
            agents[0].id,
            "support-chat"
          ),
          createDefaultChatAppConfig("Sales Chat", agents[1].id, "sales-chat"),
          createDefaultChatAppConfig("Tech Chat", agents[2].id, "tech-chat"),
        ];

        chatapps.forEach((chatapp) => enterpriseConfig.chatapps.push(chatapp));

        // Validate the complex configuration
        const validation = yield* configService.validateConfig(
          enterpriseConfig,
          {
            strict: true,
            checkDuplicates: true,
            validateReferences: true,
          }
        );

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // Verify all references are valid
        enterpriseConfig.chatapps.forEach((chatapp) => {
          const agentExists = enterpriseConfig.agents.some(
            (agent) => agent.id === chatapp.agentId
          );
          expect(agentExists).toBe(true);
        });

        return enterpriseConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle configuration import/export workflow", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create a configuration to export
        const originalConfig = yield* configService.createDefaultConfig();
        originalConfig.workspaces.push(
          createDefaultWorkspaceConfig("Export Test")
        );
        originalConfig.agents.push(
          createDefaultAgentConfig("Export Agent", "openai", "gpt-4")
        );

        // Export to JSON
        const exportedJson = yield* configService.exportConfig(
          originalConfig,
          "json"
        );

        expect(exportedJson).toContain('"name": "Buddy"');
        expect(exportedJson).toContain('"Export Test"');
        expect(exportedJson).toContain('"Export Agent"');

        // Import back from JSON
        const importedConfig = yield* configService.importConfig(
          exportedJson,
          "json"
        );

        expect(importedConfig.app.name).toBe(originalConfig.app.name);
        expect(importedConfig.workspaces).toHaveLength(1);
        expect(importedConfig.agents).toHaveLength(1);

        // Validate imported config
        const validation = yield* configService.validateConfig(importedConfig);
        expect(validation.isValid).toBe(true);

        return importedConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle network failures gracefully", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Mock network failure
        (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

        const loadResult = yield* configService
          .loadConfig("./network-fail-config.json")
          .pipe(Effect.either);

        expect(loadResult._tag).toBe("Left");
        if (loadResult._tag === "Left") {
          expect(loadResult.left._tag).toBe("ConfigLoadError");
          expect(loadResult.left.message).toContain("Failed to fetch config");
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle malformed JSON gracefully", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Mock malformed JSON response
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve("{ invalid json }"),
        });

        const loadResult = yield* configService
          .loadConfig("./malformed-config.json")
          .pipe(Effect.either);

        expect(loadResult._tag).toBe("Left");
        if (loadResult._tag === "Left") {
          expect(loadResult.left._tag).toBe("ConfigParseError");
          expect(loadResult.left.message).toContain(
            "Failed to parse config JSON"
          );
        }
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle complex validation scenarios", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Create config with multiple validation issues
        const problematicConfig = {
          app: {
            name: "",
            version: "invalid",
          },
          workspaces: [
            {
              id: "invalid id with spaces",
              name: "Workspace 1",
              chatappIds: [],
              agentIds: [],
              createdAt: "invalid-date",
              updatedAt: getCurrentTimestamp(),
            },
          ],
          chatapps: [
            {
              id: "chatapp-1",
              name: "Chat App",
              version: "1.0.0",
              agentId: "non-existent-agent",
              spaceId: "non-existent-workspace",
              createdAt: getCurrentTimestamp(),
              updatedAt: getCurrentTimestamp(),
            },
          ],
          agents: [],
          version: "1.0.0",
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };

        // Comprehensive validation
        const validation = yield* configService.validateConfig(
          problematicConfig,
          {
            strict: true,
            checkDuplicates: true,
            validateReferences: true,
          }
        );

        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(3);

        // Check specific error types
        const errorFields = validation.errors.map((e) => e.field);
        expect(errorFields).toContain("app.name");
        expect(errorFields).toContain("app.version");

        return validation;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });

  describe("Performance and State Management", () => {
    it("should handle rapid config operations without state corruption", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Rapid state changes
        yield* configService.setConfigPath("./config1.json");
        const path1 = yield* configService.getConfigPath();
        expect(path1).toBe("./config1.json");

        yield* configService.setConfigPath("./config2.json");
        const path2 = yield* configService.getConfigPath();
        expect(path2).toBe("./config2.json");

        // Create multiple configs and validate them
        const configs = [];
        for (let i = 0; i < 3; i++) {
          const config = yield* configService.createDefaultConfig({
            app: {
              name: `Buddy ${i}`,
              version: `1.${i}.0`,
            },
          });
          configs.push(config);
        }

        // Validate all configs
        for (const config of configs) {
          const validation = yield* configService.validateConfig(config);
          expect(validation.isValid).toBe(true);
        }

        return configs;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });

    it("should handle reset operations correctly", async () => {
      const program = Effect.gen(function* () {
        const configService = yield* ConfigService;

        // Set up some state
        yield* configService.setConfigPath("./custom-config.json");

        // Reset to defaults
        const resetConfig = yield* configService.resetToDefaults();

        expect(resetConfig.app.name).toBe("Buddy");
        expect(resetConfig.app.version).toBe("1.0.0");
        expect(resetConfig.workspaces).toHaveLength(0);
        expect(resetConfig.chatapps).toHaveLength(0);
        expect(resetConfig.agents).toHaveLength(0);

        return resetConfig;
      });

      await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
    });
  });
});

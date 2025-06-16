import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../../agent";
import { AppService } from "../../app";
import { ToolbarService } from "../../toolbar";
import { ConfigLifecycleService } from "../ConfigLifecycleService";
import "./setup";

describe("ConfigLifecycleService Integration", () => {
  // Create a test service layer with all dependencies
  const testServiceLayer = Layer.mergeAll(
    AgentService.Default,
    ToolbarService.Default,
    ConfigLifecycleService.Default,
    AppService.Default,
  );

  it("should integrate AppService with ConfigLifecycleService", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Get the AppService (which now uses ConfigLifecycleService internally)
        const appService = yield* AppService;

        // Test basic operations
        const initialApps = yield* appService.getAll();
        expect(Array.isArray(initialApps)).toBe(true);

        return { success: true, appCount: initialApps.length };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
    expect(typeof result.appCount).toBe("number");
  });

  it("should handle config operations through AppService facade", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const appService = yield* AppService;
        const agentService = yield* AgentService;
        const toolbarService = yield* ToolbarService;

        // Create required dependencies first
        yield* agentService
          .create({
            id: "test-agent",
            name: "Test Agent",
            initialAgentName: "Test Agent",
            model: "gemini-1.5-flash",
            systemPrompt: "You are a test assistant.",
          })
          .pipe(Effect.catchAll(() => Effect.void));

        yield* toolbarService
          .create({
            id: "test-toolbar",
            name: "Test Toolbar",
            tools: [],
          })
          .pipe(Effect.catchAll(() => Effect.void));

        // Skip theme creation for now
        // yield* appService.setTheme("test-theme", { /* theme config */ })
        //   .pipe(Effect.catchAll(() => Effect.void))

        // Test creating a config through AppService
        const testConfig = {
          id: "integration-test-config",
          name: "Integration Test Config",
          agentId: "test-agent",
          toolbarId: "test-toolbar",
          themeId: "test-theme",
        };

        yield* appService.create(testConfig);

        // Verify it was created
        const createdConfig = yield* appService.getById(
          "integration-test-config",
        );
        expect(createdConfig).toBeDefined();
        expect(createdConfig?.name).toBe("Integration Test Config");

        // Test updating
        yield* appService.update("integration-test-config", {
          name: "Updated Integration Test Config",
        });

        const updatedConfig = yield* appService.getById(
          "integration-test-config",
        );
        expect(updatedConfig?.name).toBe("Updated Integration Test Config");

        // Test deleting
        yield* appService.delete("integration-test-config");
        const deletedConfig = yield* appService.getById(
          "integration-test-config",
        );
        expect(deletedConfig).toBeUndefined();

        return { success: true };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
  });

  it("should maintain service layer compatibility", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Verify all services are available
        const appService = yield* AppService;
        const configService = yield* ConfigLifecycleService;
        const agentService = yield* AgentService;
        const toolbarService = yield* ToolbarService;

        // Verify they have the expected methods
        expect(typeof appService.getAll).toBe("function");
        expect(typeof configService.loadConfigs).toBe("function");
        expect(typeof agentService.getAll).toBe("function");
        expect(typeof toolbarService.getAll).toBe("function");

        return { success: true };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
  });
});

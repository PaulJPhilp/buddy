import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../../agent";
import { AppService } from "../../app";
import { ThemesService } from "../../themes";
import { ToolbarService } from "../../toolbar";
import { EnhancedConfigLifecycleService } from "../EnhancedConfigLifecycleService";

describe("ConfigLifecycleService Integration - Simple", () => {
  // Create a test service layer with all dependencies
  const testServiceLayer = Layer.mergeAll(
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
    EnhancedConfigLifecycleService.Default,
    AppService.Default,
  );

  it("should create service layer with all dependencies", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Verify all services are available in the layer
        const appService = yield* AppService;
        const configService = yield* EnhancedConfigLifecycleService;
        const agentService = yield* AgentService;
        const toolbarService = yield* ToolbarService;
        const themesService = yield* ThemesService;

        // Verify they have the expected methods
        expect(typeof appService.getAll).toBe("function");
        expect(typeof appService.getById).toBe("function");
        expect(typeof appService.create).toBe("function");
        expect(typeof appService.update).toBe("function");
        expect(typeof appService.delete).toBe("function");

        expect(typeof configService.loadConfigs).toBe("function");
        expect(typeof configService.addConfig).toBe("function");
        expect(typeof configService.updateConfigImmediate).toBe("function");
        expect(typeof configService.deleteConfig).toBe("function");

        expect(typeof agentService.getAll).toBe("function");
        expect(typeof toolbarService.getAll).toBe("function");
        expect(typeof themesService.getTheme).toBe("function");

        return { success: true };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
  });

  it("should have AppService with ConfigLifecycleService dependency", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Get the AppService (which now uses ConfigLifecycleService internally)
        const appService = yield* AppService;

        // The AppService should be available and functional
        expect(appService).toBeDefined();
        expect(typeof appService.getAll).toBe("function");

        // Note: We don't call getAll() here because it would try to make HTTP requests
        // The important thing is that the service is properly constructed with its dependencies

        return { success: true };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
  });

  it("should maintain backward compatibility with existing AppService API", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const appService = yield* AppService;

        // Verify the AppService still has the same API as before
        const expectedMethods = [
          "getAll",
          "getById",
          "create",
          "update",
          "delete",
        ];

        for (const method of expectedMethods) {
          expect(typeof (appService as any)[method]).toBe("function");
        }

        return { success: true, methodCount: expectedMethods.length };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
    expect(result.methodCount).toBe(5);
  });

  it("should have EnhancedConfigLifecycleService available", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* EnhancedConfigLifecycleService;

        // Verify the ConfigLifecycleService has the expected enhanced methods
        const expectedMethods = [
          "loadConfigs",
          "addConfig",
          "deleteConfig",
          "updateConfigImmediate",
          "updateConfigWithSave",
          "saveConfig",
          "revertConfig",
          "toggleAutoSave",
          "getSaveStatus",
          "getState",
          "subscribe",
        ];

        for (const method of expectedMethods) {
          expect(typeof (configService as any)[method]).toBe("function");
        }

        return { success: true, methodCount: expectedMethods.length };
      }).pipe(Effect.provide(testServiceLayer)),
    );

    expect(result.success).toBe(true);
    expect(result.methodCount).toBe(11);
  });
});

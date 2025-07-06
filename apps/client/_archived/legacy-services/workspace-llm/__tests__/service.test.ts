import { WorkspaceManager } from "@/managers/workspace-component";
import { AppService } from "@/services/app";
import { Effect, Layer } from "effect";
import { describe, expect, test } from "vitest";
import { WorkspaceLLMService } from "../service";

// Test layer with required dependencies
const TestLayer = Layer.mergeAll(
  WorkspaceManager.Default,
  AppService.Default,
  WorkspaceLLMService.Default
);

describe("WorkspaceLLMService", () => {
  test("should initialize successfully", async () => {
    const program = Effect.gen(function* () {
      const llmService = yield* WorkspaceLLMService;
      const isInitialized = yield* llmService.isInitialized();
      expect(typeof isInitialized).toBe("boolean");
    });

    await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
  });

  test("should create buddy workspace API", async () => {
    const program = Effect.gen(function* () {
      const llmService = yield* WorkspaceLLMService;
      const api = yield* llmService.createBuddyWorkspaceAPI();

      expect(api).toBeDefined();
      expect(typeof api.createWorkspace).toBe("function");
      expect(typeof api.listWorkspaces).toBe("function");
      expect(typeof api.activateWorkspace).toBe("function");
    });

    await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
  });

  test("should validate workspace operations", async () => {
    const program = Effect.gen(function* () {
      const llmService = yield* WorkspaceLLMService;

      // Test validation error for empty workspace name
      const result = yield* llmService
        .createWorkspace({ name: "" })
        .pipe(Effect.either);

      expect(result._tag).toBe("Left");
    });

    await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
  });

  test("should get tool functions", async () => {
    const program = Effect.gen(function* () {
      const llmService = yield* WorkspaceLLMService;
      const toolFunctions = yield* llmService.getToolFunctions();

      expect(toolFunctions).toBeDefined();
      expect(typeof toolFunctions.create_workspace).toBe("function");
      expect(typeof toolFunctions.list_workspaces).toBe("function");
    });

    await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
  });
});

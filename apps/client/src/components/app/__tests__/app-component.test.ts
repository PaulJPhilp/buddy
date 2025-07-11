import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../../../services/config";
import { CoreComponent } from "../../core";
import { AppComponent } from "../index";
import type { AppComponentConfig, AppConfig } from "../types";

// Mock fetch for testing
const mockFetch = vi.fn() as any;
mockFetch.preconnect = vi.fn();
global.fetch = mockFetch;

describe("AppComponent", () => {
  const testConfig: AppComponentConfig = {
    id: "test-app",
    name: "Test App",
    configPath: "./test-app.json",
    autoLoadConfig: false,
    autoRenderShell: false,
    debugMode: true,
  };

  const TestLayer = Layer.provide(
    AppComponent.Default,
    Layer.merge(CoreComponent.Default, ConfigService.Default)
  );

  const mockAppConfig: AppConfig = {
    app: {
      name: "Test Buddy",
      version: "1.0.0",
      theme: "dark",
      debugMode: true,
    },
    workspaces: [
      {
        id: "workspace-1",
        name: "Test Workspace",
        description: "A test workspace",
        chatappIds: ["chat-1"],
        agentIds: ["agent-1"],
        isDefault: true,
      },
    ],
    chatapps: [
      {
        id: "chat-1",
        name: "Test Chat",
        description: "A test chat app",
        type: "chat",
        config: {},
        agentIds: ["agent-1"],
      },
    ],
    agents: [
      {
        id: "agent-1",
        name: "Test Agent",
        description: "A test agent",
        type: "llm",
        config: {
          provider: "openai",
          model: "gpt-4",
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default successful fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockAppConfig)),
      json: () => Promise.resolve(mockAppConfig),
    });
  });

  it("should initialize successfully", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);
      const state = yield* appComponent.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should load configuration successfully", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);

      const config = yield* appComponent.loadConfig("./test-app.json");

      // Check that it returns an AppDomainModel with the expected structure
      expect(config.app.name).toBe("Test Buddy");
      expect(config.app.version).toBe("1.0.0");
      expect(config.workspaces).toHaveLength(1);
      expect(config.workspaces[0].id).toBe("workspace-1");
      expect(config.workspaces[0].name).toBe("Test Workspace");
      expect(config.chatapps).toHaveLength(1);
      expect(config.chatapps[0].id).toBe("chat-1");
      expect(config.agents).toHaveLength(1);
      expect(config.agents[0].id).toBe("agent-1");

      // Check that domain model fields are properly set
      expect(config.version).toBe("1.0.0");
      expect(config.createdAt).toBeDefined();
      expect(config.updatedAt).toBeDefined();
      expect(config.metadata).toBeDefined();
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should handle workspace management", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);
      yield* appComponent.loadConfig("./test-app.json");

      // Set current workspace
      yield* appComponent.setCurrentWorkspace("workspace-1");

      // Get current workspace
      const currentWorkspace = yield* appComponent.getCurrentWorkspace();
      expect(currentWorkspace?.id).toBe("workspace-1");
      expect(currentWorkspace?.name).toBe("Test Workspace");

      // Get all workspaces
      const workspaces = yield* appComponent.getWorkspaces();
      expect(workspaces).toHaveLength(1);
      expect(workspaces[0].id).toBe("workspace-1");
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should handle app shell rendering", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);
      yield* appComponent.loadConfig("./test-app.json");

      // Render app shell
      yield* appComponent.renderAppShell();

      // Check if rendered
      const isRendered = yield* appComponent.isAppShellRendered();
      expect(isRendered).toBe(true);

      // Check state
      const state = yield* appComponent.getState();
      expect(state.isAppShellRendered).toBe(true);
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should handle configuration loading errors", async () => {
    // Mock failed fetch for this specific test
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);

      // This should fail
      const result = yield* appComponent
        .loadConfig("./invalid-config.json")
        .pipe(Effect.either);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("AppConfigLoadError");
      }
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should handle invalid workspace errors", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);
      yield* appComponent.loadConfig("./test-app.json");

      // Try to set invalid workspace
      const result = yield* appComponent
        .setCurrentWorkspace("invalid-workspace")
        .pipe(Effect.either);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("AppWorkspaceError");
      }
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });

  it("should cleanup properly", async () => {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;
      yield* appComponent.initialize(testConfig);

      // Verify initialized
      const initialState = yield* appComponent.getState();
      expect(initialState.isInitialized).toBe(true);

      // Cleanup
      yield* appComponent.cleanup();

      // Verify reset
      const finalState = yield* appComponent.getState();
      expect(finalState.isInitialized).toBe(false);
      expect(finalState.appConfig).toBeNull();
      expect(finalState.currentWorkspaceId).toBeNull();
    });

    await Effect.provide(program, TestLayer).pipe(Effect.runPromise);
  });
});

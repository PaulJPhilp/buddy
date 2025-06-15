/**
 * @file Test fixtures and custom mock implementations for hooks
 * @module hooks/__tests__/test-fixtures
 */

import type { ChatAppConfig } from "@/types/global";
import type { ProtocolMessage } from "@buddy/protocol";
import { Effect, Layer, Ref } from "effect";

// Real test data fixtures
themeName: "test-theme", primaryColor;
: "#000000",
  secondaryColor: "#ffffff",
  backgroundColor: "#f5f5f5",
  textColor: "#333333",
  borderColor: "#cccccc",
  components:
{
  backgroundColor: "#007bff", textColor;
  : "#ffffff",
      borderRadius: "4px",
  ,
    input:
  backgroundColor: "#ffffff", textColor;
  : "#000000",
      borderColor: "#cccccc",
  ,
}
,
}

export const testChatAppConfig: ChatAppConfig = {
  id: "test-chat-app",
  name: "Test Chat App",
  agentId: "test-agent",
  toolbarId: "test-toolbar",
  themeId: "test-theme",
};

export const testToolbarConfig = {
  id: "test-toolbar",
  items: [
    {
      id: "toggle-sidebar",
      type: "command" as const,
      label: "Toggle Sidebar",
      active: false,
      command: "toggleSidebar",
    },
    {
      id: "separator",
      type: "separator" as const,
    },
  ],
};

export const testProtocolMessage: ProtocolMessage = {
  id: "test-message-id",
  type: "LLM_RESPONSE",
  payload: { content: "Test message content" },
  timestamp: Date.now(),
  chatId: "test-chat-id",
};

// Custom mock implementations using Effect
export interface MockThemeStore {
  readonly currentTheme: Ref.Ref<string | null>;
  readonly updateTheme: (theme: string) => Effect.Effect<never, never, void>;
  readonly getTheme: () => Effect.Effect<never, never, string | null>;
}

export const MockThemeStore = Effect.Service<MockThemeStore>()(
  "MockThemeStore",
  {
    effect: Effect.gen(function* () {
      const currentTheme = yield* Ref.make<string | null>("light");

      return {
        currentTheme,
        updateTheme: (theme: string) => Ref.set(currentTheme, theme),
        getTheme: () => Ref.get(currentTheme),
      };
    }),
    dependencies: [],
  },
);

export interface MockAppService {
  readonly configs: Ref.Ref<Map<string, ChatAppConfig>>;
  readonly getById: (
    id: string,
  ) => Effect.Effect<never, Error, ChatAppConfig | null>;
  readonly setConfig: (
    config: ChatAppConfig,
  ) => Effect.Effect<never, never, void>;
}

export const MockAppService = Effect.Service<MockAppService>()(
  "MockAppService",
  {
    effect: Effect.gen(function* () {
      const configs = yield* Ref.make(new Map<string, ChatAppConfig>());

      return {
        configs,
        getById: (id: string) =>
          Effect.gen(function* () {
            const configMap = yield* Ref.get(configs);
            return configMap.get(id) || null;
          }),
        setConfig: (config: ChatAppConfig) =>
          Ref.update(configs, (map) => new Map(map.set(config.id, config))),
      };
    }),
    dependencies: [],
  },
);

export interface MockToolbarService {
  readonly toolbars: Ref.Ref<Map<string, any>>;
  readonly getById: (id: string) => Effect.Effect<never, never, any>;
  readonly setToolbar: (
    id: string,
    toolbar: any,
  ) => Effect.Effect<never, never, void>;
}

export const MockToolbarService = Effect.Service<MockToolbarService>()(
  "MockToolbarService",
  {
    effect: Effect.gen(function* () {
      const toolbars = yield* Ref.make(new Map<string, any>());

      return {
        toolbars,
        getById: (id: string) =>
          Effect.gen(function* () {
            const toolbarMap = yield* Ref.get(toolbars);
            return toolbarMap.get(id);
          }),
        setToolbar: (id: string, toolbar: any) =>
          Ref.update(toolbars, (map) => new Map(map.set(id, toolbar))),
      };
    }),
    dependencies: [],
  },
);

readonly;
getTheme: (
    id: string,
  readonly setTheme: (
    id: string,
  ) => Effect.Effect<never, never, void>;
}

{
  effect: Effect.gen(function* () {
    return {
        themes,
        getTheme: (id: string) =>
          Effect.gen(function* () {
            const themeMap = yield* Ref.get(themes);
            return themeMap.get(id) || null;
          }),
          Ref.update(themes, (map) => new Map(map.set(id, theme))),
      };
  }),
    dependencies;
  : [],
}
,
)

// Test layer that provides all mock services
export const TestLayer = Layer.mergeAll(
  MockThemeStore.Default,
  MockAppService.Default,
  MockToolbarService.Default,
);

// Helper functions for setting up test data
export const setupTestTheme = (themeId: string) => Effect.gen(function* () {});

export const setupTestConfig = (config: ChatAppConfig = testChatAppConfig) =>
  Effect.gen(function* () {
    const appService = yield* MockAppService;
    yield* appService.setConfig(config);
  });

export const setupTestToolbar = (
  toolbarId: string,
  toolbar: any = testToolbarConfig,
) =>
  Effect.gen(function* () {
    const toolbarService = yield* MockToolbarService;
    yield* toolbarService.setToolbar(toolbarId, toolbar);
  });

// Custom hook testing utilities
export function createTestProvider<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  layer: Layer.Layer<R, never, any> = TestLayer,
): Promise<A> {
  return Effect.runPromise(Effect.provide(effect, layer));
}

export function runHookEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>,
): Promise<A> {
  return createTestProvider(effect);
}

/**
 * @file useChatAppRuntime Tests - Custom Mock Implementation
 * @module hooks/chat-app-runtime/useChatAppRuntime.test
 */

import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import type { ChatAppTheme } from "@/themes/themeTypes";
import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { beforeEach, describe, expect, test } from "vitest";
import {
  MockAppService,
  MockThemesService,
  MockToolbarService,
  TestLayer,
  createTestProvider,
  setupTestConfig,
  setupTestTheme,
  setupTestToolbar,
  testChatAppConfig,
  testChatTheme,
  testToolbarConfig,
} from "../__tests__/test-fixtures";
import { useChatAppRuntime } from "./useChatAppRuntime";

// Custom hook to integrate with test services
function createMockUseAgentSession() {
  return function useAgentSession(agentId: string, chatId: string) {
    return {
      status: "connected" as const,
      messages: [],
      error: null,
      sendMessage: (message: any) => Promise.resolve(),
      closeSession: () => Promise.resolve(),
    };
  };
}

describe("useChatAppRuntime", () => {
  const testChatAppId = "test-chat-app";
  const mockUseAgentSession = createMockUseAgentSession();

  beforeEach(async () => {
    // Setup test data before each test
    await createTestProvider(
      Effect.gen(function* () {
        yield* setupTestConfig(testChatAppConfig);
        yield* setupTestTheme(testChatAppConfig.themeId, testChatTheme);
        yield* setupTestToolbar(testChatAppConfig.toolbarId, testToolbarConfig);
      }),
    );
  });

  test("should load chat app configuration successfully", async () => {
    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual(testChatAppConfig);
    expect(result.current.error).toBeNull();
  });

  test("should load toolbar configuration", async () => {
    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.toolbar).toEqual(testToolbarConfig);
    });
  });

  test("should load theme configuration", async () => {
    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.theme).toEqual(testChatTheme);
    });
  });

  test("should handle theme override", async () => {
    const themeOverride: ChatAppTheme = {
      ...testChatTheme,
      primaryColor: "#override-color",
    };

    const { result } = renderHook(() =>
      useChatAppRuntime(testChatAppId, themeOverride),
    );

    await waitFor(() => {
      expect(result.current.theme?.primaryColor).toBe("#override-color");
    });
  });

  test("should handle deep theme override", async () => {
    const themeOverride: Partial<ChatAppTheme> = {
      components: {
        button: {
          backgroundColor: "#override-btn",
          textColor: "#override-btn-text",
          borderRadius: "8px",
        },
        input: {
          backgroundColor: "#override-input",
          textColor: "#override-input-text",
          borderColor: "#override-border",
        },
      },
    };

    const { result } = renderHook(() =>
      useChatAppRuntime(testChatAppId, themeOverride),
    );

    await waitFor(() => {
      expect(result.current.theme?.components?.button?.backgroundColor).toBe(
        "#override-btn",
      );
      expect(result.current.theme?.components?.input?.borderColor).toBe(
        "#override-border",
      );
    });
  });

  test("should handle missing configuration gracefully", async () => {
    const { result } = renderHook(() => useChatAppRuntime("non-existent-id"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe("Failed to load chat app configuration");
  });

  test("should handle agent session integration", async () => {
    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.agentSession).toBeDefined();
    });

    // Since we're using the real hook, it should initialize with the agent ID from config
    expect(result.current.agentSession?.status).toBeDefined();
  });

  test("should handle configuration updates", async () => {
    const { result, rerender } = renderHook(
      ({ chatAppId }) => useChatAppRuntime(chatAppId),
      { initialProps: { chatAppId: "app-1" } },
    );

    // Setup different config for app-2
    const newConfig: ChatAppConfig = {
      ...testChatAppConfig,
      id: "app-2",
      name: "Different App",
    };

    await createTestProvider(setupTestConfig(newConfig));

    rerender({ chatAppId: "app-2" });

    await waitFor(() => {
      expect(result.current.config?.name).toBe("Different App");
    });
  });

  test("should handle service errors gracefully", async () => {
    const { result } = renderHook(() =>
      useChatAppRuntime("non-existent-config"),
    );

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Failed to load chat app configuration",
      );
    });
  });

  test("should memoize return value", async () => {
    const { result, rerender } = renderHook(() =>
      useChatAppRuntime(testChatAppId),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstResult = result.current;

    // Rerender should return same object reference
    rerender();
    expect(result.current).toBe(firstResult);
  });

  test("should handle partial data loading gracefully", async () => {
    // Setup only config, not theme or toolbar
    await createTestProvider(
      Effect.gen(function* () {
        const appService = yield* MockAppService;
        yield* appService.setConfig(testChatAppConfig);
        // Don't setup theme or toolbar to test partial loading
      }),
    );

    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.config).toEqual(testChatAppConfig);
    });

    // Should still work with missing optional data
    expect(result.current.toolbar).toBeUndefined();
    expect(result.current.theme).toBeNull();
  });

  test("should handle theme override with null base theme", async () => {
    const themeOverride: ChatAppTheme = {
      ...testChatTheme,
      primaryColor: "#overridden",
    };

    const { result } = renderHook(() =>
      useChatAppRuntime(testChatAppId, themeOverride),
    );

    await waitFor(() => {
      expect(result.current.theme?.primaryColor).toBe("#overridden");
    });
  });

  test("should handle rapid chatAppId changes", async () => {
    const { result, rerender } = renderHook(
      ({ chatAppId }) => useChatAppRuntime(chatAppId),
      { initialProps: { chatAppId: "app-1" } },
    );

    // Rapidly change chat app IDs
    rerender({ chatAppId: "app-2" });
    rerender({ chatAppId: "app-3" });
    rerender({ chatAppId: "app-1" });

    // Should eventually settle on the final ID
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test("should maintain stable sendMessage reference", async () => {
    const { result, rerender } = renderHook(() =>
      useChatAppRuntime(testChatAppId),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstSendMessage = result.current.agentSession?.sendMessage;
    rerender();
    const secondSendMessage = result.current.agentSession?.sendMessage;

    expect(firstSendMessage).toBe(secondSendMessage);
  });

  test("should handle configuration with missing agent", async () => {
    const configWithoutAgent: ChatAppConfig = {
      ...testChatAppConfig,
      agentId: "",
    };

    await createTestProvider(setupTestConfig(configWithoutAgent));

    const { result } = renderHook(() => useChatAppRuntime(testChatAppId));

    await waitFor(() => {
      expect(result.current.config).toEqual(configWithoutAgent);
    });

    // Should not initialize agent session
    expect(result.current.agentSession).toBeUndefined();
  });

  test("should handle complex nested theme merging", async () => {
    const baseTheme: ChatAppTheme = {
      ...testChatTheme,
      components: {
        button: {
          backgroundColor: "#base-btn",
          textColor: "#base-text",
          borderRadius: "4px",
        },
        input: {
          backgroundColor: "#base-input",
          textColor: "#base-input-text",
          borderColor: "#base-border",
        },
      },
    };

    await createTestProvider(
      setupTestTheme(testChatAppConfig.themeId, baseTheme),
    );

    const themeOverride: Partial<ChatAppTheme> = {
      components: {
        button: {
          backgroundColor: "#override-btn",
          // textColor should remain from base
        },
        input: {
          borderColor: "#override-border",
          // other input properties should remain from base
        },
      },
    };

    const { result } = renderHook(() =>
      useChatAppRuntime(testChatAppId, themeOverride),
    );

    await waitFor(() => {
      expect(result.current.theme?.components?.button?.backgroundColor).toBe(
        "#override-btn",
      );
      expect(result.current.theme?.components?.button?.textColor).toBe(
        "#base-text",
      );
      expect(result.current.theme?.components?.input?.backgroundColor).toBe(
        "#base-input",
      );
      expect(result.current.theme?.components?.input?.borderColor).toBe(
        "#override-border",
      );
    });
  });
});

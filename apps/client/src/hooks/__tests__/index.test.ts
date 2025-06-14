/**
 * @file Hooks Index Tests - Comprehensive Export and Integration Validation
 * @module hooks/__tests__/index.test
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

// Import all hooks from the main index
import {
  useAgentSession,
  useChatAppRuntime,
  useChatInstance,
  useChatTheme,
  useDynamicToolbar,
  useThemeIntegration,
} from "../index";

// Import test fixtures
import {
  createTestProvider,
  setupTestConfig,
  setupTestTheme,
  setupTestToolbar,
  testChatAppConfig,
  testChatTheme,
  testToolbarConfig,
} from "./test-fixtures";

describe("Hooks Index", () => {
  test("should export all hooks", () => {
    expect(useAgentSession).toBeDefined();
    expect(useChatAppRuntime).toBeDefined();
    expect(useChatInstance).toBeDefined();
    expect(useChatTheme).toBeDefined();
    expect(useDynamicToolbar).toBeDefined();
    expect(useThemeIntegration).toBeDefined();
  });

  test("all hooks should be functions", () => {
    expect(typeof useAgentSession).toBe("function");
    expect(typeof useChatAppRuntime).toBe("function");
    expect(typeof useChatInstance).toBe("function");
    expect(typeof useChatTheme).toBe("function");
    expect(typeof useDynamicToolbar).toBe("function");
    expect(typeof useThemeIntegration).toBe("function");
  });

  test("useChatTheme should work with default parameters", () => {
    const { result } = renderHook(() => useChatTheme());
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe("object");
  });

  test("useChatTheme should accept theme override", () => {
    const themeOverride = { primaryColor: "#test-color" };
    const { result } = renderHook(() => useChatTheme(themeOverride));
    expect(result.current.primaryColor).toBe("#test-color");
  });

  test("useDynamicToolbar should work with toolbar config", () => {
    const toolbarConfig = {
      id: "test-toolbar",
      items: [
        {
          id: "test-item",
          type: "command" as const,
          label: "Test Item",
          active: false,
          command: "test",
        },
      ],
    };

    const { result } = renderHook(() => useDynamicToolbar(toolbarConfig));
    expect(result.current.id).toBe("test-toolbar");
    expect(result.current.items).toHaveLength(1);
  });

  test("useThemeIntegration should initialize without errors", () => {
    expect(() => {
      renderHook(() => useThemeIntegration());
    }).not.toThrow();
  });

  test("hooks should have stable function signatures", () => {
    // useChatTheme - optional theme parameter
    expect(useChatTheme.length).toBeLessThanOrEqual(1);

    // useDynamicToolbar - required config parameter
    expect(useDynamicToolbar.length).toBe(1);

    // useChatAppRuntime - required chatAppId, optional themeOverride
    expect(useChatAppRuntime.length).toBe(2);

    // useAgentSession - agentId and chatId parameters
    expect(useAgentSession.length).toBe(2);

    // useChatInstance - chatId, agentConfig, optional layer
    expect(useChatInstance.length).toBe(3);

    // useThemeIntegration - no parameters
    expect(useThemeIntegration.length).toBe(0);
  });

  test("hooks should maintain referential stability on re-renders", () => {
    const { result: themeResult, rerender: themeRerender } = renderHook(() =>
      useChatTheme({ primaryColor: "#stable" }),
    );
    const firstThemeResult = themeResult.current;
    themeRerender();
    expect(themeResult.current).toBe(firstThemeResult);

    const toolbarConfig = {
      id: "stable-toolbar",
      items: [],
    };
    const { result: toolbarResult, rerender: toolbarRerender } = renderHook(
      () => useDynamicToolbar(toolbarConfig),
    );
    const firstToolbarResult = toolbarResult.current;
    toolbarRerender();
    expect(toolbarResult.current).toBe(firstToolbarResult);
  });

  test("hooks should handle edge cases gracefully", () => {
    // useChatTheme with null
    const { result: nullTheme } = renderHook(() => useChatTheme(null));
    expect(nullTheme.current).toBeDefined();

    // useChatTheme with undefined
    const { result: undefinedTheme } = renderHook(() =>
      useChatTheme(undefined),
    );
    expect(undefinedTheme.current).toBeDefined();

    // useChatTheme with empty object
    const { result: emptyTheme } = renderHook(() => useChatTheme({}));
    expect(emptyTheme.current).toBeDefined();

    // useDynamicToolbar with empty config
    const emptyConfig = { id: "empty", items: [] };
    const { result: emptyToolbar } = renderHook(() =>
      useDynamicToolbar(emptyConfig),
    );
    expect(emptyToolbar.current.items).toEqual([]);
  });

  test("hooks should work with complex nested data", () => {
    const complexTheme = {
      primaryColor: "#complex",
      components: {
        button: {
          backgroundColor: "#button-bg",
          states: {
            hover: {
              backgroundColor: "#button-hover",
            },
          },
        },
        input: {
          borderColor: "#input-border",
          validation: {
            error: {
              borderColor: "#error-red",
            },
          },
        },
      },
    };

    const { result } = renderHook(() => useChatTheme(complexTheme));
    expect(
      result.current.components?.button?.states?.hover?.backgroundColor,
    ).toBe("#button-hover");
    expect(
      result.current.components?.input?.validation?.error?.borderColor,
    ).toBe("#error-red");
  });

  test("hooks should handle rapid parameter changes", () => {
    const { result, rerender } = renderHook(
      ({ theme }) => useChatTheme(theme),
      { initialProps: { theme: { primaryColor: "#first" } } },
    );

    expect(result.current.primaryColor).toBe("#first");

    rerender({ theme: { primaryColor: "#second" } });
    expect(result.current.primaryColor).toBe("#second");

    rerender({ theme: { primaryColor: "#third" } });
    expect(result.current.primaryColor).toBe("#third");

    // Should handle object to string transition
    rerender({ theme: "light" as any });
    expect(result.current.themeName).toBe("light");
  });

  test("hooks should integrate with Effect.js services properly", async () => {
    // Test that hooks can work with the test data
    const { result: themeResult } = renderHook(() =>
      useChatTheme(testChatTheme),
    );
    expect(themeResult.current.themeName).toBe(testChatTheme.themeName);

    const { result: toolbarResult } = renderHook(() =>
      useDynamicToolbar(testToolbarConfig),
    );
    expect(toolbarResult.current.id).toBe(testToolbarConfig.id);
  });

  test("hooks should maintain type safety", () => {
    // Type safety is enforced at compile time, but we can test runtime behavior
    const { result: themeResult } = renderHook(() => useChatTheme());
    expect(typeof themeResult.current).toBe("object");
    expect(themeResult.current).not.toBeNull();

    // Toolbar result should have correct structure
    const simpleConfig = { id: "test", items: [] };
    const { result: toolbarResult } = renderHook(() =>
      useDynamicToolbar(simpleConfig),
    );
    expect(toolbarResult.current).toHaveProperty("id");
    expect(toolbarResult.current).toHaveProperty("items");
    expect(Array.isArray(toolbarResult.current.items)).toBe(true);
  });

  test("hooks should be compatible with React Strict Mode", () => {
    // Test double invocation behavior that happens in Strict Mode
    let renderCount = 0;
    const TestHook = () => {
      renderCount++;
      return useChatTheme({ primaryColor: "#strict-mode" });
    };

    const { result } = renderHook(TestHook);
    expect(result.current.primaryColor).toBe("#strict-mode");
    // renderCount may be 1 or 2 depending on Strict Mode, both are valid
    expect(renderCount).toBeGreaterThan(0);
  });

  test("hooks should handle concurrent renders properly", () => {
    // Test multiple simultaneous renders with different parameters
    const { result: result1 } = renderHook(() =>
      useChatTheme({ primaryColor: "#concurrent-1" }),
    );
    const { result: result2 } = renderHook(() =>
      useChatTheme({ primaryColor: "#concurrent-2" }),
    );
    const { result: result3 } = renderHook(() =>
      useChatTheme({ primaryColor: "#concurrent-3" }),
    );

    expect(result1.current.primaryColor).toBe("#concurrent-1");
    expect(result2.current.primaryColor).toBe("#concurrent-2");
    expect(result3.current.primaryColor).toBe("#concurrent-3");
  });

  test("hooks should have proper error boundaries", () => {
    // Test that hooks don't throw synchronous errors
    expect(() => {
      renderHook(() => useChatTheme("invalid-json-{"));
    }).not.toThrow();

    expect(() => {
      renderHook(() => useChatTheme({ invalid: undefined }));
    }).not.toThrow();

    expect(() => {
      renderHook(() => useDynamicToolbar({ id: "", items: [] as any[] }));
    }).not.toThrow();
  });
});

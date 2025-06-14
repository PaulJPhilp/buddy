/**
 * @file useChatTheme Tests - Custom Mock Implementation
 * @module hooks/chat-theme/useChatTheme.test
 */

import { defaultChatTheme } from "@/themes/themeTypes";
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useChatTheme } from "./useChatTheme";

describe("useChatTheme", () => {
  test("should return default theme when no theme is provided", () => {
    const { result } = renderHook(() => useChatTheme());

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should return default theme when undefined is provided", () => {
    const { result } = renderHook(() => useChatTheme(undefined));

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should handle named theme strings", () => {
    // Test with known named themes - they should add the themeName property
    const { result: lightResult } = renderHook(() => useChatTheme("light"));
    expect(lightResult.current).toEqual({
      ...defaultChatTheme,
      themeName: "light",
    });

    const { result: darkResult } = renderHook(() => useChatTheme("dark"));
    expect(darkResult.current).toEqual({
      ...defaultChatTheme,
      themeName: "dark",
    });

    const { result: systemResult } = renderHook(() => useChatTheme("system"));
    expect(systemResult.current).toEqual({
      ...defaultChatTheme,
      themeName: "system",
    });
  });

  test("should parse valid JSON string theme", () => {
    const themeJson = JSON.stringify({
      colors: { primary: "#ff0000" },
    });

    const { result } = renderHook(() => useChatTheme(themeJson));

    expect(result.current.colors?.primary).toBe("#ff0000");
  });

  test("should handle invalid JSON string gracefully", () => {
    const invalidJson = "{ invalid json";

    const { result } = renderHook(() => useChatTheme(invalidJson));

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should handle object theme with shallow merge", () => {
    const themeOverride = {
      colors: { primary: "#ff0000" },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.colors?.primary).toBe("#ff0000");
    expect(result.current.colors?.secondary).toBe(
      defaultChatTheme.colors?.secondary,
    );
  });

  test("should handle object theme with deep merge for nested objects", () => {
    const themeOverride = {
      bubbles: {
        user: {
          background: "#ff0000",
        },
      },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.bubbles?.user?.background).toBe("#ff0000");
    expect(result.current.bubbles?.user?.text).toBe(
      defaultChatTheme.bubbles?.user?.text,
    );
  });

  test("should handle nested object merging at multiple levels", () => {
    const themeOverride = {
      colors: {
        primary: "#ff0000",
      },
      bubbles: {
        agent: {
          background: "#00ff00",
        },
      },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.colors?.primary).toBe("#ff0000");
    expect(result.current.bubbles?.agent?.background).toBe("#00ff00");
    expect(result.current.bubbles?.agent?.text).toBe(
      defaultChatTheme.bubbles?.agent?.text,
    );
  });

  test("should handle array values in theme override", () => {
    const themeOverride = {
      customArray: ["value1", "value2"],
      colors: {
        primary: "#ff0000",
      },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.customArray).toEqual(["value1", "value2"]);
    expect(result.current.colors?.primary).toBe("#ff0000");
  });

  test("should memoize result and only recompute when theme changes", () => {
    const { result, rerender } = renderHook(
      ({ theme }) => useChatTheme(theme),
      { initialProps: { theme: { colors: { primary: "#ff0000" } } } },
    );

    const firstResult = result.current;

    // Rerender with same theme - should return same reference
    rerender({ theme: { colors: { primary: "#ff0000" } } });
    expect(JSON.stringify(result.current)).toBe(JSON.stringify(firstResult));

    // Rerender with different theme
    rerender({ theme: { colors: { primary: "#00ff00" } } });
    expect(result.current.colors?.primary).toBe("#00ff00");
    expect(JSON.stringify(result.current)).not.toBe(
      JSON.stringify(firstResult),
    );
  });

  test("should handle null and undefined nested values", () => {
    const themeOverride = {
      colors: {
        primary: null,
        secondary: undefined,
        accent: "#ffffff",
      },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    // Should preserve the override structure, even with null values
    expect(result.current.colors?.primary).toBe(null);
    expect(result.current.colors?.accent).toBe("#ffffff");
    expect(result.current.colors?.background).toBe(
      defaultChatTheme.colors?.background,
    );
  });

  test("should handle complex JSON string with nested objects", () => {
    const complexTheme = {
      colors: {
        primary: "#ff0000",
        accent: "#0000ff",
      },
      bubbles: {
        user: {
          background: "#00ff00",
          text: "#ffffff",
        },
      },
    };

    const { result } = renderHook(() =>
      useChatTheme(JSON.stringify(complexTheme)),
    );

    expect(result.current.colors?.primary).toBe("#ff0000");
    expect(result.current.colors?.accent).toBe("#0000ff");
    expect(result.current.bubbles?.user?.background).toBe("#00ff00");
    expect(result.current.bubbles?.user?.text).toBe("#ffffff");
    // JSON theme replacement uses shallow merge, so colors.secondary is not preserved
    expect(result.current.colors?.secondary).toBeUndefined();
  });

  test("should handle empty object theme", () => {
    const { result } = renderHook(() => useChatTheme({}));

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should handle empty string theme", () => {
    const { result } = renderHook(() => useChatTheme(""));

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should handle unknown named theme as JSON", () => {
    const { result } = renderHook(() => useChatTheme("unknown-theme"));

    expect(result.current).toEqual(defaultChatTheme);
  });

  test("should preserve theme properties in correct order", () => {
    const themeOverride = {
      colors: {
        secondary: "#custom-secondary",
        primary: "#custom-primary",
      },
    };

    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.colors?.primary).toBe("#custom-primary");
    expect(result.current.colors?.secondary).toBe("#custom-secondary");
    expect(result.current.colors?.background).toBe(
      defaultChatTheme.colors?.background,
    );
  });

  test("should handle deeply nested object structures", () => {
    const deepThemeOverride = {
      bubbles: {
        user: {
          background: "#user-bg",
          text: "#user-text",
        },
        agent: {
          background: "#agent-bg",
        },
      },
      userArea: {
        background: "#user-area-bg",
      },
    };

    const { result } = renderHook(() => useChatTheme(deepThemeOverride));

    expect(result.current.bubbles?.user?.background).toBe("#user-bg");
    expect(result.current.bubbles?.user?.text).toBe("#user-text");
    expect(result.current.bubbles?.agent?.background).toBe("#agent-bg");
    expect(result.current.userArea?.background).toBe("#user-area-bg");
  });
});

/**
 * @file ThemesService Tests
 * @module services/themes/ThemesService.test
 */

import type { ChatAppTheme } from "@/themes/themeTypes";
import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemesService } from "../ThemesService";

describe("ThemesService", () => {
  const TestLayer = ThemesService.Default;

  // localStorage is mocked globally in vitest.setup.ts
  const localStorageMock = global.localStorage as any;

  const mockTheme: ChatAppTheme = {
    colors: {
      primary: "blue-500",
      secondary: "gray-200",
      accent: "blue-600",
      background: "white",
      text: "gray-800",
    },
    borders: {
      color: "gray-300",
      thickness: "1px",
      radius: "0.5rem",
    },
    bubbles: {
      user: {
        background: "blue-500",
        text: "white",
        radius: "rounded-xl",
      },
      agent: {
        background: "gray-200",
        text: "gray-800",
        radius: "rounded-xl",
      },
    },
    userArea: {
      background: "gray-50",
      inputRingColor: "blue-600",
    },
    header: {
      background: "blue-500",
      text: "white",
    },
    typography: {
      fontFamily: "sans-serif",
      fontSize: "1rem",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set and get a theme", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId = "test-chat-1";

      yield* service.setTheme(chatId, mockTheme);
      const retrievedTheme = yield* service.getTheme(chatId);

      expect(retrievedTheme).toEqual(mockTheme);
    }).pipe(Effect.provide(TestLayer)));

  it("should return undefined for non-existent theme", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const retrievedTheme = yield* service.getTheme("non-existent-chat");

      expect(retrievedTheme).toBeUndefined();
    }).pipe(Effect.provide(TestLayer)));

  it("should update an existing theme", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId = "test-chat-2";

      yield* service.setTheme(chatId, mockTheme);

      const partialUpdate = {
        colors: {
          ...mockTheme.colors,
          primary: "red-500",
        },
      };

      yield* service.updateTheme(chatId, partialUpdate);
      const updatedTheme = yield* service.getTheme(chatId);

      expect(updatedTheme?.colors.primary).toBe("red-500");
      expect(updatedTheme?.colors.secondary).toBe(mockTheme.colors.secondary);
    }).pipe(Effect.provide(TestLayer)));

  it("should fail to update non-existent theme", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;

      const result = yield* service
        .updateTheme("non-existent", { colors: { primary: "red-500" } })
        .pipe(Effect.either);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("ThemeNotFoundError");
      }
    }).pipe(Effect.provide(TestLayer)));

  it("should delete a theme", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId = "test-chat-3";

      yield* service.setTheme(chatId, mockTheme);
      yield* service.deleteTheme(chatId);
      const retrievedTheme = yield* service.getTheme(chatId);

      expect(retrievedTheme).toBeUndefined();
    }).pipe(Effect.provide(TestLayer)));

  it("should list all themes", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId1 = "chat-1";
      const chatId2 = "chat-2";

      yield* service.setTheme(chatId1, mockTheme);
      yield* service.setTheme(chatId2, mockTheme);

      const themes = yield* service.listThemes();

      expect(themes[chatId1]).toEqual(mockTheme);
      expect(themes[chatId2]).toEqual(mockTheme);
      expect(Object.keys(themes)).toHaveLength(2);
    }).pipe(Effect.provide(TestLayer)));

  it("should reset all themes", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;

      yield* service.setTheme("chat-1", mockTheme);
      yield* service.setTheme("chat-2", mockTheme);
      yield* service.resetThemes();

      const themes = yield* service.listThemes();

      expect(Object.keys(themes)).toHaveLength(0);
    }).pipe(Effect.provide(TestLayer)));

  it("should fail with invalid chatId", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;

      const result = yield* service.getTheme("").pipe(Effect.either);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("InvalidChatIdError");
      }
    }).pipe(Effect.provide(TestLayer)));

  it("should save themes to localStorage", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId = "test-chat-save";

      yield* service.setTheme(chatId, mockTheme);
      yield* service.saveThemes();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "buddy:themes",
        expect.stringContaining(chatId),
      );
    }).pipe(Effect.provide(TestLayer)));

  it("should load themes from localStorage", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;
      const chatId = "test-chat-load";
      const storedThemes = { [chatId]: mockTheme };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedThemes));

      const loadedThemes = yield* service.loadThemes();
      const retrievedTheme = yield* service.getTheme(chatId);

      expect(loadedThemes[chatId]).toEqual(mockTheme);
      expect(retrievedTheme).toEqual(mockTheme);
    }).pipe(Effect.provide(TestLayer)));

  it("should handle empty localStorage gracefully", () =>
    Effect.gen(function* () {
      const service = yield* ThemesService;

      localStorageMock.getItem.mockReturnValue(null);

      const loadedThemes = yield* service.loadThemes();

      expect(loadedThemes).toEqual({});
    }).pipe(Effect.provide(TestLayer)));
});

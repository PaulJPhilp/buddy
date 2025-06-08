import type { ThemeColors } from "@/contexts/ThemeContext";
import { Effect, Either } from "effect";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  ThemesService,
  type ThemesServiceApi,
  type ThemesServiceError
} from "./ThemesService";

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  let storageLength = 0;

  return {
    get length() {
      return storageLength;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
      storageLength = Object.keys(store).length;
    },
    removeItem(key: string): void {
      delete store[key];
      storageLength = Object.keys(store).length;
    },
    clear(): void {
      store = {};
      storageLength = 0;
    },
  } as Storage;
};

describe("ThemesService (Effect.Service)", () => {
  beforeAll(() => {
    // Setup localStorage mock
    global.localStorage = createLocalStorageMock();
  });

  afterEach(() => {
    // Clear localStorage between tests
    localStorage.clear();
  });
  const chatId = "chat-test";

  // Valid theme matching ThemeColors interface
  const validTheme: ThemeColors = {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#0ea5e9",
    secondary: "#64748b",
    border: "#e2e8f0",
    userArea: "#f8fafc",
    bubbleUser: "#0ea5e9",
    bubbleAgent: "#64748b",
    headerBg: "#f8fafc",
    headerText: "#000000",
  };

  // Invalid theme for testing validation
  const invalidTheme = {
    container: {
      borderColor: "#000",
      defaults: {
        headerBar: {
          height: 60,
          color: "#fff",
          font: "Arial",
          fontStyle: "normal",
          fontSize: 16,
          fontColor: "#000",
        },
        chatArea: {
          userBubble: {
            color: "#007AFF",
            font: "Arial",
            fontStyle: "normal",
            fontSize: 14,
            fontColor: "#fff",
            padding: "8px",
          },
          assistantBubble: {
            color: "#E9E9EB",
            font: "Arial",
            fontStyle: "normal",
            fontSize: 14,
            fontColor: "#000",
            padding: "8px",
          },
          userArea: {
            attachmentToolbar: {
              color: "#fff",
              iconColor: "#007AFF",
              iconSize: 24,
              font: "Arial",
              fontStyle: "normal",
              fontSize: 14,
              fontColor: "#000",
              padding: "8px",
            },
            inputArea: {
              inactiveRingColor: "#E9E9EB",
              inactiveRingWidth: 1,
              activeRingColor: "#007AFF",
              activeRingWidth: 2,
              inputAreaColor: "#fff",
              font: "Arial",
              fontStyle: "normal",
              fontSize: 14,
              fontColor: "#000",
            },
            agentToolbar: {
              color: "#fff",
              iconColor: "#007AFF",
              iconSize: 24,
              font: "Arial",
              fontStyle: "normal",
              fontSize: 14,
              fontColor: "#000",
              padding: "8px",
              selectorBackgroundColor: "#F5F5F5",
            },
          },
        },
      },
    },
    headerBar: {
      height: 60,
      color: "#fff",
      font: "Arial",
      fontStyle: "normal",
      fontSize: 16,
      fontColor: "#000",
    },
    chatArea: {
      userBubble: {
        color: "#007AFF",
        font: "Arial",
        fontStyle: "normal",
        fontSize: 14,
        fontColor: "#fff",
        padding: "8px",
      },
      assistantBubble: {
        color: "#E9E9EB",
        font: "Arial",
        fontStyle: "normal",
        fontSize: 14,
        fontColor: "#000",
        padding: "8px",
      },
      userArea: {
        attachmentToolbar: {
          color: "#fff",
          iconColor: "#007AFF",
          iconSize: 24,
          font: "Arial",
          fontStyle: "normal",
          fontSize: 14,
          fontColor: "#000",
          padding: "8px",
        },
        inputArea: {
          inactiveRingColor: "#E9E9EB",
          inactiveRingWidth: 1,
          activeRingColor: "#007AFF",
          activeRingWidth: 2,
          inputAreaColor: "#fff",
          font: "Arial",
          fontStyle: "normal",
          fontSize: 14,
          fontColor: "#000",
        },
        agentToolbar: {
          color: "#fff",
          iconColor: "#007AFF",
          iconSize: 24,
          font: "Arial",
          fontStyle: "normal",
          fontSize: 14,
          fontColor: "#000",
          padding: "8px",
          selectorBackgroundColor: "#F5F5F5",
        },
      },
    },
  } as unknown as ThemeColors;

  // Helper to run tests with proper error handling
  const runTest = <R, E extends ThemesServiceError, A>(
    test: Effect.Effect<A, E, ThemesServiceApi>,
  ) => Effect.runPromise(Effect.provide(test, ThemesService.Default));

  beforeEach(() =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.resetThemes();
      }),
    ),
  );

  it("sets and gets a theme by chatId", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        const result = yield* service.getTheme(chatId);
        expect(result).toEqual(validTheme);
      }),
    ));

  it("updates a theme partially", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        yield* service.updateTheme(chatId, { primary: "#ff0000" });
        const result = yield* service.getTheme(chatId);
        expect(result?.primary).toBe("#ff0000");
        // Other properties should remain unchanged
        expect(result?.background).toBe(validTheme.background);
      }),
    ));

  it("deletes a theme", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        yield* service.deleteTheme(chatId);
        const result = yield* service.getTheme(chatId);
        expect(result).toBeUndefined();
      }),
    ));

  it("lists all themes", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        const result = yield* service.listThemes();
        expect(result).toHaveProperty(chatId);
        expect(result[chatId]).toEqual(validTheme);
      }),
    ));

  it("resets all themes", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        yield* service.resetThemes();
        const result = yield* service.listThemes();
        expect(result).toEqual({});
      }),
    ));

  it("validates theme objects", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        const invalidTheme = { background: "#fff" } as any;

        const result = yield* Effect.either(
          service.setTheme(chatId, invalidTheme),
        );
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left._tag).toBe("ThemeValidationError");
        }
      }),
    ));

  it("validates chatId", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;

        const result = yield* Effect.either(service.setTheme("", validTheme));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left._tag).toBe("InvalidChatIdError");
        }
      }),
    ));

  it("handles theme not found error", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;

        const result = yield* Effect.either(
          service.updateTheme("non-existent", { primary: "#ff0000" }),
        );
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left._tag).toBe("ThemeNotFoundError");
        }
      }),
    ));

  it("saves and loads themes from localStorage", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        yield* service.setTheme(chatId, validTheme);
        yield* service.saveThemes();

        // Clear state and reload
        yield* service.resetThemes();
        const loaded = yield* service.loadThemes();
        expect(loaded[chatId]).toEqual(validTheme);
      }),
    ));

  it("loads themes with merge option", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        const chatId1 = "chat1";
        const chatId2 = "chat2";

        // Set initial themes
        yield* service.setTheme(chatId1, validTheme);
        yield* service.setTheme(chatId2, { ...validTheme, primary: "#ff0000" });
        yield* service.saveThemes();

        // Reset and load with merge=false
        yield* service.resetThemes();
        yield* service.setTheme("other-chat", validTheme);
        yield* service.loadThemes({ merge: false });

        const result = yield* service.listThemes();
        expect(result).toHaveProperty(chatId1);
        expect(result).toHaveProperty(chatId2);
        expect(result).not.toHaveProperty("other-chat");
      }),
    ));

  it("loads specific chat themes", () =>
    runTest(
      Effect.gen(function* (_) {
        const service = yield* ThemesService;
        const chatId1 = "chat1";
        const chatId2 = "chat2";

        // Set initial themes
        yield* service.setTheme(chatId1, validTheme);
        yield* service.setTheme(chatId2, { ...validTheme, primary: "#ff0000" });
        yield* service.saveThemes();

        // Reset and load specific chat
        yield* service.resetThemes();
        yield* service.loadThemes({ chatIds: [chatId1] });

        const result = yield* service.listThemes();
        expect(result).toHaveProperty(chatId1);
        expect(result).not.toHaveProperty(chatId2);
      }),
    ));
});

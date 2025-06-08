/**
 * @file Implements the ThemesService which provides access to chat themes by chatId.
 * @module services/dynamic/ThemesService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT     !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern !!!
 * !!! used here is the canonical implementation.                         !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

import { parseJsonEffect } from "@/utils/effectUtils";
import { Effect, Ref } from "effect";

import { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { isValidChatAppTheme } from "@/features/chat/themes/themeUtils";

// Migration: Convert legacy flat ChatAppTheme object to canonical ChatAppTheme
function migrateFlatThemeToChatAppTheme(flat: any): ChatAppTheme {
  return {
    colors: {
      primary: flat.primary ?? "blue-500",
      secondary: flat.secondary ?? "gray-200",
      accent: flat.accent ?? "blue-600",
      background: flat.background ?? "white",
      text: flat.foreground ?? "gray-800",
    },
    borders: {
      color: flat.border ?? "gray-300",
      thickness: "1px",
      radius: "0.5rem",
    },
    bubbles: {
      user: {
        background: flat.bubbleUser ?? flat.primary ?? "blue-500",
        text: "auto",
        radius: "rounded-xl",
      },
      agent: {
        background: flat.bubbleAgent ?? flat.secondary ?? "gray-200",
        text: "auto",
        radius: "rounded-xl",
      },
    },
    userArea: {
      background: flat.userArea ?? "gray-50",
      inputRingColor: flat.accent ?? "blue-600",
    },
    header: {
      background: flat.headerBg ?? flat.primary ?? "blue-500",
      text: flat.headerText ?? "auto",
    },
    typography: {
      fontFamily: "sans-serif",
      fontSize: "1rem",
    },
  };
}

// Storage key for themes in localStorage
const THEMES_STORAGE_KEY = "buddy:themes";

// Helper type for non-empty strings
type NonEmptyString<T extends string> = T extends "" ? never : T;

/**
 * Validates that a chatId is a non-empty string
 * @throws {InvalidChatIdError} If chatId is empty or not a string
 */
const validateChatId = <T extends string>(
  chatId: T,
): Effect.Effect<NonEmptyString<T>, InvalidChatIdError> => {
  if (typeof chatId !== "string" || chatId.trim() === "") {
    return Effect.fail<InvalidChatIdError>({
      _tag: "InvalidChatIdError",
      message: "chatId must be a non-empty string",
      chatId,
    });
  }
  return Effect.succeed(chatId as NonEmptyString<T>);
};

/**
 * Validates that an object matches the ChatAppTheme interface
 * Provides backward compatibility by adding default values for missing properties
 * @throws {ThemeValidationError} If the theme object is invalid
 */
const validateThemeObject = (
  theme: unknown,
): Effect.Effect<ChatAppTheme, ThemeValidationError> => {
  if (isValidChatAppTheme(theme)) {
    return Effect.succeed(theme);
  }
  // Try to migrate legacy flat theme
  if (typeof theme === "object" && theme !== null && "background" in theme) {
    try {
      const migrated = migrateFlatThemeToChatAppTheme(theme);
      if (isValidChatAppTheme(migrated)) {
        return Effect.succeed(migrated);
      }
    } catch (e) {
      // fall through
    }
  }
  return Effect.fail<ThemeValidationError>({
    _tag: "ThemeValidationError",
    message: "Theme is not a valid ChatAppTheme and could not be migrated.",
    details: JSON.stringify(theme),
  });
};

export type FileSystemUnavailableError = {
  _tag: "FileSystemUnavailableError";
  message: string;
  cause?: unknown;
};

export type FileReadError = {
  _tag: "FileReadError";
  message: string;
  path: string;
  cause?: unknown;
};

export type JsonParseError = {
  _tag: "JsonParseError";
  message: string;
  input: string;
  cause?: unknown;
};

export type ThemeValidationError = {
  readonly _tag: "ThemeValidationError";
  readonly message: string;
  readonly details: string;
  readonly path?: string[];
  readonly value?: unknown;
};

export type ThemeNotFoundError = {
  readonly _tag: "ThemeNotFoundError";
  readonly message: string;
  readonly chatId: string;
};

export type InvalidChatIdError = {
  readonly _tag: "InvalidChatIdError";
  readonly message: string;
  readonly chatId: string;
};

export type InvalidThemeError = {
  readonly _tag: "InvalidThemeError";
  readonly message: string;
  readonly details: string;
  readonly chatId?: string;
};

export type StorageError = {
  readonly _tag: "StorageError";
  readonly message: string;
  readonly cause?: unknown;
};

export type ThemesServiceError =
  | ThemeValidationError
  | ThemeNotFoundError
  | InvalidChatIdError
  | InvalidThemeError
  | StorageError;

export interface ThemesServiceApi {
  getTheme(
    chatId: string,
  ): Effect.Effect<ChatAppTheme | undefined, InvalidChatIdError>;
  setTheme(
    chatId: string,
    theme: ChatAppTheme,
  ): Effect.Effect<void, InvalidChatIdError | ThemeValidationError>;
  updateTheme(
    chatId: string,
    partial: Partial<ChatAppTheme>,
  ): Effect.Effect<
    void,
    InvalidChatIdError | ThemeNotFoundError | ThemeValidationError
  >;
  deleteTheme(chatId: string): Effect.Effect<void, InvalidChatIdError>;
  listThemes(): Effect.Effect<Record<string, ChatAppTheme>>;
  resetThemes(): Effect.Effect<void>;

  /**
   * Load themes from localStorage
   * @param options Configuration for loading themes
   * @returns Effect that resolves with the loaded themes
   */
  loadThemes(options?: {
    /** If specified, only loads themes for these chat IDs */
    chatIds?: string[];
    /** If true, merges with existing themes (default: true) */
    merge?: boolean;
    /** If true, validates theme objects (default: true) */
    validate?: boolean;
  }): Effect.Effect<
    Record<string, ChatAppTheme>,
    StorageError | ThemeValidationError | InvalidChatIdError
  >;

  /**
   * Save themes to localStorage
   * @param options Configuration for saving themes
   * @returns Effect that resolves when themes are saved
   */
  saveThemes(options?: {
    /** If specified, only saves these chat IDs (default: all themes) */
    chatIds?: string[];
  }): Effect.Effect<
    void,
    StorageError | ThemeNotFoundError | InvalidChatIdError
  >;
}

export class ThemesService extends Effect.Service<ThemesServiceApi>()(
  "ThemesService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* Ref.make<Record<string, ChatAppTheme>>({});

      const getTheme = (chatId: string) =>
        Effect.gen(function* () {
          const validChatId = yield* validateChatId(chatId);
          const themes = yield* Ref.get(ref);
          return themes[validChatId];
        }) as Effect.Effect<ChatAppTheme | undefined, InvalidChatIdError>;

      const setTheme = (chatId: string, theme: ChatAppTheme) =>
        Effect.gen(function* () {
          const validChatId = yield* validateChatId(chatId);
          const validTheme = yield* validateThemeObject(theme);
          yield* Ref.update(ref, (themes) => ({
            ...themes,
            [validChatId]: validTheme,
          }));
        }) as Effect.Effect<void, InvalidChatIdError | ThemeValidationError>;

      const updateTheme = (
        chatId: string,
        partialUpdates: Partial<ChatAppTheme>,
      ) =>
        Effect.gen(function* () {
          const validChatId = yield* validateChatId(chatId);
          const themes = yield* Ref.get(ref);
          if (!themes[validChatId]) {
            return yield* Effect.fail<ThemeNotFoundError>({
              _tag: "ThemeNotFoundError",
              message: `No theme found for chatId: ${validChatId}`,
              chatId: validChatId,
            });
          }
          const merged = { ...themes[validChatId], ...partialUpdates };
          yield* validateThemeObject(merged);
          yield* Ref.update(ref, (t) => ({
            ...t,
            [validChatId]: merged,
          }));
        }) as Effect.Effect<
          void,
          InvalidChatIdError | ThemeNotFoundError | ThemeValidationError
        >;

      const deleteTheme = (chatId: string) =>
        Effect.gen(function* () {
          const validChatId = yield* validateChatId(chatId);
          yield* Ref.update(ref, (themes) => {
            const { [validChatId]: _, ...rest } = themes;
            return rest;
          });
        }) as Effect.Effect<void, InvalidChatIdError>;

      const listThemes = () =>
        Effect.gen(function* () {
          const themes = yield* Ref.get(ref);
          return { ...themes };
        }) as Effect.Effect<Record<string, ChatAppTheme>>;

      const resetThemes = () =>
        Effect.gen(function* () {
          yield* Ref.set(ref, {});
        }) as Effect.Effect<void>;

      const loadThemes = (
        options: {
          chatIds?: string[];
          merge?: boolean;
          validate?: boolean;
        } = {},
      ) =>
        Effect.gen(function* () {
          const { chatIds, merge = true, validate = true } = options;
          try {
            const storedThemes = localStorage.getItem(THEMES_STORAGE_KEY);
            if (!storedThemes) return {};
            const parsedThemes = yield* parseJsonEffect(storedThemes);
            let themesToLoad: Record<string, unknown> = {};
            if (typeof parsedThemes === "object" && parsedThemes !== null) {
              themesToLoad = parsedThemes as Record<string, unknown>;
            } else {
              return yield* Effect.fail<ThemeValidationError>({
                _tag: "ThemeValidationError",
                message: "Invalid themes format in storage",
                details: "Expected an object with theme data",
              });
            }
            const filtered: Record<string, ChatAppTheme> = {};
            for (const [id, theme] of Object.entries(themesToLoad)) {
              if (chatIds && !chatIds.includes(id)) continue;
              if (validate) {
                const validTheme = yield* validateThemeObject(theme);
                filtered[id] = validTheme;
              } else {
                filtered[id] = theme as ChatAppTheme;
              }
            }
            if (merge) {
              yield* Ref.update(ref, (t) => ({ ...t, ...filtered }));
            } else {
              yield* Ref.set(ref, filtered);
            }
            return filtered;
          } catch (error) {
            return yield* Effect.fail<StorageError>({
              _tag: "StorageError",
              message: "Failed to load themes from storage",
              cause: error,
            });
          }
        }) as Effect.Effect<
          Record<string, ChatAppTheme>,
          StorageError | ThemeValidationError | InvalidChatIdError
        >;

      const saveThemes = (
        options: {
          chatIds?: string[];
        } = {},
      ) =>
        Effect.gen(function* () {
          const { chatIds } = options;
          try {
            const themes = yield* Ref.get(ref);
            let themesToSave: Record<string, ChatAppTheme>;
            if (chatIds) {
              const missing = chatIds.filter((id) => !(id in themes));
              if (missing.length > 0) {
                return yield* Effect.fail<ThemeNotFoundError>({
                  _tag: "ThemeNotFoundError",
                  message: `Themes not found for chatIds: ${missing.join(", ")}`,
                  chatId: missing[0],
                });
              }
              themesToSave = Object.fromEntries(
                Object.entries(themes).filter(([id]) => chatIds.includes(id)),
              );
            } else {
              themesToSave = { ...themes };
            }
            localStorage.setItem(
              THEMES_STORAGE_KEY,
              JSON.stringify(themesToSave),
            );
            return undefined;
          } catch (error) {
            return yield* Effect.fail<StorageError>({
              _tag: "StorageError",
              message: "Failed to save themes to storage",
              cause: error,
            });
          }
        }) as Effect.Effect<
          void,
          StorageError | ThemeNotFoundError | InvalidChatIdError
        >;

      return {
        getTheme,
        setTheme,
        updateTheme,
        deleteTheme,
        listThemes,
        resetThemes,
        loadThemes,
        saveThemes,
      } satisfies ThemesServiceApi;
    }),
    dependencies: [],
  },
) { }

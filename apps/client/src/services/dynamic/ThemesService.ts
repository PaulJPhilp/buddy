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

import { Effect, Ref, Schema } from "effect"
import type { ThemeColors } from "@/contexts/ThemeContext"
import { ChatThemeJsonSchema } from "@/schemas/ChatThemeJsonSchema"

const fs = typeof window === "undefined" ? require("fs/promises") : null

export interface ThemesServiceApi {
  getTheme(chatId: string): Effect.Effect<ThemeColors | undefined>
  setTheme(chatId: string, theme: ThemeColors): Effect.Effect<void>
  updateTheme(chatId: string, partial: Partial<ThemeColors>): Effect.Effect<void>
  deleteTheme(chatId: string): Effect.Effect<void>
  listThemes(): Effect.Effect<Record<string, ThemeColors>>
  resetThemes(): Effect.Effect<void>
  loadFromJsonFile(path: string): Effect.Effect<void>
  saveToJsonFile(path: string): Effect.Effect<void>
}

export const ThemesService = Effect.Service<ThemesServiceApi>()("ThemesService", {
  scoped: Effect.gen(function* () {
    const ref = yield* Ref.make<Record<string, ThemeColors>>({})
    return {
      getTheme: (chatId: string) => Effect.gen(function* () {
        const themes = yield* Ref.get(ref)
        return themes[chatId]
      }),

      setTheme: (chatId: string, theme: ThemeColors) => Effect.gen(function* () {
        yield* Ref.update(ref, themes => ({ ...themes, [chatId]: { ...theme } }))
      }),

      updateTheme: (chatId: string, partial: Partial<ThemeColors>) => Effect.gen(function* () {
        yield* Ref.update(ref, themes =>
          themes[chatId]
            ? { ...themes, [chatId]: { ...themes[chatId], ...partial } }
            : themes
        )
      }),

      deleteTheme: (chatId: string) => Effect.gen(function* () {
        yield* Ref.update(ref, themes => {
          const { [chatId]: _, ...rest } = themes
          return rest
        })
      }),

      listThemes: () => Effect.gen(function* () {
        const themes = yield* Ref.get(ref)
        return { ...themes }
      }),

      resetThemes: () => Effect.gen(function* () {
        yield* Ref.set(ref, {})
      }),

      loadFromJsonFile: (path: string) => Effect.gen(function* () {
        if (!fs) throw new Error("File system not available in browser")
        const data = yield* Effect.tryPromise(() => fs.readFile(path, "utf-8"))
        const json = JSON.parse(data)
        const parsed = yield* Schema.decode(ChatThemeJsonSchema)(json)
        yield* Ref.set(ref, { default: parsed })
      }),

      saveToJsonFile: (path: string) => Effect.gen(function* () {
        if (!fs) throw new Error("File system not available in browser")
        const themes = yield* Ref.get(ref)
        const json = JSON.stringify(themes.default, null, 2)
        yield* Effect.tryPromise(() => fs.writeFile(path, json, "utf-8"))
      })
    } satisfies ThemesServiceApi
  }),
  dependencies: []
})

export const Default = Effect.scoped(ThemesService)



import { Effect } from "effect"
import type { ThemeColors } from "@/contexts/ThemeContext"
import { ChatThemeJsonSchema, type ChatThemeJson } from "@/schemas/ChatThemeJsonSchema"
import * as Schema from "@effect/schema/Schema"
import type {
  FileSystemUnavailableError,
  FileReadError,
  JsonParseError,
  ThemeValidationError
} from "./ThemesService"

/**
 * Type representing any valid JSON value
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

type FileSystem = {
  readFile: (path: string, encoding: string, options: { signal?: AbortSignal }) => Promise<string>
}

/**
 * Safely reads a file with Effect-based error handling
 * @param fs FileSystem object from browser or Node.js
 * @param path Path to the file to read
 * @returns Effect containing the file contents or ThemesServiceError
 */
export const readFileEffect = (
  fs: FileSystem | null,
  path: string
): Effect.Effect<string, FileSystemUnavailableError | FileReadError> => {
  if (!fs) {
    return Effect.fail<FileSystemUnavailableError>({
      _tag: "FileSystemUnavailableError",
      message: "File system not available in browser"
    })
  }

  return Effect.tryPromise<string, FileReadError>({
    try: (signal) => fs.readFile(path, "utf-8", { signal }),
    catch: (e): FileReadError => ({
      _tag: "FileReadError",
      message: `Failed to read file: ${path}`,
      path,
      cause: e as Error
    })
  })
}

/**
 * Parse a JSON string with Effect-based error handling
 * @param data The JSON string to parse
 * @returns Effect containing the parsed JSON or ThemesServiceError
 */
export const parseJsonEffect = (data: string): Effect.Effect<JSONValue, JsonParseError> => {
  return Effect.try({
    try: () => JSON.parse(data) as JSONValue,
    catch: (e): JsonParseError => ({
      _tag: "JsonParseError",
      message: "Failed to parse JSON",
      cause: e,
      input: ""
    })
  })
}

/**
 * Validate and transform a JSON object into a ThemeColors object
 * @param json The JSON object to validate
 * @returns Effect containing the validated ThemeColors or ThemesServiceError
 */
/**
 * Type guard to check if an object has the required ChatThemeJson structure
 */
const isThemeJsonObject = (json: object): json is ChatThemeJson & Record<string, unknown> => {
  return (
    "container" in json &&
    typeof json.container === "object" &&
    json.container !== null &&
    "defaults" in json.container &&
    typeof json.container.defaults === "object" &&
    json.container.defaults !== null
  )
}

export const validateThemeJson = (json: JSONValue): Effect.Effect<ThemeColors, ThemeValidationError> => {
  return Effect.gen(function* () {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      return yield* Effect.fail<ThemeValidationError>({
        _tag: "ThemeValidationError",
        message: "Invalid theme format",
        details: "Expected a theme object but received invalid JSON"
      })
    }

    if (!isThemeJsonObject(json)) {
      return yield* Effect.fail<ThemeValidationError>({
        _tag: "ThemeValidationError",
        message: "Invalid theme format",
        details: "Missing required theme properties in JSON"
      })
    }

    const result = yield* Effect.try({
      try: () => Schema.decodeSync(ChatThemeJsonSchema)(json),
      catch: (e): ThemeValidationError => ({
        _tag: "ThemeValidationError",
        message: "Theme validation failed",
        details: e instanceof Error ? e.message : "Unknown validation error"
      })
    })

    const theme: ThemeColors = {
      background: result.container.defaults.chatArea.userArea.inputArea.inputAreaColor,
      foreground: result.container.defaults.chatArea.userArea.inputArea.fontColor,
      primary: result.container.borderColor,
      secondary: result.container.defaults.chatArea.assistantBubble.color,
      border: result.container.borderColor,
      userArea: result.container.defaults.chatArea.userArea.inputArea.inputAreaColor,
      bubbleUser: result.container.defaults.chatArea.userBubble.color,
      bubbleAgent: result.container.defaults.chatArea.assistantBubble.color,
      headerBg: result.container.defaults.headerBar.color,
      headerText: result.container.defaults.headerBar.fontColor
    }
    return theme
  })
}

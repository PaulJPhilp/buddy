import { Effect } from "effect"
import type {
  FileReadError,
  FileSystemUnavailableError,
  JsonParseError
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
      input: data
    })
  })
}

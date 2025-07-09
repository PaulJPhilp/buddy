import { homedir } from "os";
import { join } from "path";
import { Effect } from "effect";
import { StorageError } from "../errors";

export const DEFAULT_CONFIG_DIR = join(homedir(), ".buddy");
export const DEFAULT_CONFIG_FILE = "workspace.json";

export const getConfigPath = (configDir?: string): Effect.Effect<string, StorageError> => {
  return Effect.try(() => {
    return join(configDir || DEFAULT_CONFIG_DIR, DEFAULT_CONFIG_FILE);
  }).pipe(
    Effect.mapError((error) => new StorageError({ message: "Failed to construct config path", cause: error as Error }))
  );
};

export const getConfigDir = (configDir?: string): Effect.Effect<string, StorageError> => {
  return Effect.try(() => {
    return configDir || DEFAULT_CONFIG_DIR;
  }).pipe(
    Effect.mapError((error) => new StorageError({ message: "Failed to get config directory", cause: error as Error }))
  );
};

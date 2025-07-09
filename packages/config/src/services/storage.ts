import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { Effect, Layer } from "effect";
import { StorageError } from "../errors";
import { StorageData, StorageOptions } from "../types";

export class StorageOptionsService extends Effect.Service<StorageOptions>()(
  "StorageOptionsService",
  {
    effect: Effect.succeed({} as StorageOptions),
    dependencies: [],
  }
) {}

export interface StorageServiceApi {
  readonly getPath: () => Effect.Effect<string, StorageError>;
  readonly read: () => Effect.Effect<StorageData, StorageError>;
  readonly write: (data: StorageData) => Effect.Effect<void, StorageError>;
  readonly remove: () => Effect.Effect<void, StorageError>;
  readonly ensureStorage: () => Effect.Effect<void, StorageError>;
}

export class StorageService extends Effect.Service<StorageServiceApi>()(
  "StorageService",
  {
    effect: Effect.gen(function* () {
      const options = yield* StorageOptionsService;
      const configPath = join(
        options.configDir ?? process.cwd(),
        ".buddy",
        "config.json"
      );

      const getPath = () => Effect.succeed(configPath);

      const read = (): Effect.Effect<StorageData, StorageError> =>
        Effect.tryPromise({
          try: () => fs.readFile(configPath, "utf-8").then(JSON.parse),
          catch: (e) =>
            new StorageError({
              message: "Failed to read file",
              cause: e as Error,
            }),
        }).pipe(
          Effect.catchAll(() =>
            Effect.succeed({
              currentWorkspaceId: null,
              workspaces: {},
              chatApps: {},
            })
          )
        );

      const write = (data: StorageData): Effect.Effect<void, StorageError> =>
        Effect.gen(function* () {
          if (options.createBackup) {
            yield* Effect.ignore(
              Effect.tryPromise({
                try: () => fs.copyFile(configPath, `${configPath}.backup`),
                catch: (e) =>
                  new StorageError({
                    message: "Backup failed",
                    cause: e as Error,
                  }),
              })
            );
          }
          yield* Effect.tryPromise({
            try: () => fs.mkdir(dirname(configPath), { recursive: true }),
            catch: (e) =>
              new StorageError({
                message: "Failed to create storage directory",
                cause: e as Error,
              }),
          });
          yield* Effect.tryPromise({
            try: () => fs.writeFile(configPath, JSON.stringify(data, null, 2)),
            catch: (e) =>
              new StorageError({
                message: "Failed to write config file",
                cause: e as Error,
              }),
          });
        });

      const remove = (): Effect.Effect<void, StorageError> =>
        Effect.tryPromise({
          try: () => fs.unlink(configPath),
          catch: (e) =>
            new StorageError({
              message: "Failed to remove config file",
              cause: e as Error,
            }),
        });

      const ensureStorage = (): Effect.Effect<void, StorageError> =>
        read().pipe(Effect.flatMap(write));

      return {
        getPath,
        read,
        write,
        remove,
        ensureStorage,
      } satisfies StorageServiceApi;
    }),
    dependencies: [StorageOptionsService.Default],
  }
) {}

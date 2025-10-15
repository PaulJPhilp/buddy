import { ToolbarConfig } from "@/features/shared/toolbar/schema/ToolbarConfigSchema";
import { ConfigService } from "@/services/config";
import { Effect, HashMap, Layer, Ref } from "effect";
import { Schema as S } from "effect";
import type { ToolbarServiceApi } from "../api/api";
import {
  CommandNotFoundError,
  ConfigLoadError,
  ConfigValidationError,
  ToolbarError,
} from "../errors/errors";
import type { ToolbarCommand } from "../types/types";

/**
 * The ToolbarService is responsible for two main tasks:
 * 1. Loading and validating toolbar configurations from static files.
 * 2. Maintaining an in-memory registry of executable `ToolbarCommand` objects.
 *
 * This service acts as the data source for the rest of the Toolbar Assembly.
 */
export class ToolbarService extends Effect.Service<ToolbarServiceApi>()(
  "ToolbarService",
  {
    /**
     * The implementation of the ToolbarService, constructed within a Scoped Effect
     * to manage the lifecycle of the command registry.
     */
    scoped: Effect.gen(function* () {
      // Dependencies
      const configService = yield* ConfigService;
      const commandRegistry = yield* Ref.make(
        HashMap.empty<string, ToolbarCommand>()
      );

      /**
       * Loads a toolbar configuration from a JSON file.
       * @param id - The ID of the toolbar (e.g., "default-toolbar").
       */
      const loadToolbarConfig = (id: string) =>
        Effect.gen(function* () {
          const path = `/static/configs/toolbars/${id}.json`;
          const apiUrl = `/api/configs?path=${encodeURIComponent(path)}`;

          const response = yield* Effect.tryPromise({
            try: () => fetch(apiUrl),
            catch: (error) =>
              new ConfigLoadError({ path, message: "Failed to fetch config" }),
          });

          if (!response.ok) {
            yield* Effect.fail(
              new ConfigLoadError({ path, message: "Config not found" })
            );
          }

          const content = yield* Effect.tryPromise({
            try: () => response.json(),
            catch: (error) =>
              new ConfigLoadError({ path, message: "Failed to parse JSON" }),
          });

          const config = yield* S.decode(ToolbarConfig)(content).pipe(
            Effect.mapError(
              (cause) =>
                new ConfigValidationError({
                  message: `Invalid ToolbarConfig for ${id}`,
                  path,
                  cause,
                })
            )
          );

          return config;
        });

      /**
       * Registers a new command in the central registry.
       * @param command - The `ToolbarCommand` object to register.
       */
      const registerCommand = (command: ToolbarCommand) =>
        Ref.update(commandRegistry, HashMap.set(command.id, command));

      /**
       * Retrieves a registered command by its ID.
       * @param id - The ID of the command to retrieve.
       */
      const getRegisteredCommand = (id: string) =>
        Effect.gen(function* () {
          const registry = yield* Ref.get(commandRegistry);
          const command = HashMap.get(registry, id);
          if (command._tag === "None") {
            return yield* Effect.fail(
              new CommandNotFoundError({
                commandId: id,
                toolbarId: "unknown", // Context might need to be added here
              })
            );
          }
          return command.value;
        });

      // Expose the public API
      return {
        loadToolbarConfig,
        registerCommand,
        getRegisteredCommand,
      };
    }),
    dependencies: [ConfigService.Default],
  }
) {}

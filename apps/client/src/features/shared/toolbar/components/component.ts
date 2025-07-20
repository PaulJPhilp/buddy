import { ToolbarConfig } from "@/features/shared/toolbar/schemas/ToolbarConfigSchema";
import { Effect, HashMap, Layer, Ref } from "effect";
import type { ToolbarComponentApi } from "./api";
import { CommandExecutionError, ToolbarError } from "./errors";
import { ToolbarService } from "./service";
import type { ToolbarCommand, ToolbarInstance } from "./types";

/**
 * Manages the state and logic for a single instance of a toolbar.
 * It is responsible for initializing the toolbar with a configuration,
 * executing commands, and managing the state of its commands (e.g., enabled/disabled).
 */
export class ToolbarComponent extends Effect.Service<ToolbarComponentApi>()(
  "ToolbarComponent",
  {
    scoped: Effect.gen(function* () {
      // Dependencies
      const toolbarService = yield* ToolbarService;
      const instanceRef = yield* Ref.make<ToolbarInstance | null>(null);

      /**
       * Initializes the component with a specific toolbar configuration.
       */
      const initialize = (config: ToolbarConfig) =>
        Effect.gen(function* () {
          const commandIds = config.commands;
          const commands = yield* Effect.all(
            commandIds.map((id) => toolbarService.getRegisteredCommand(id))
          );

          const instance: ToolbarInstance = {
            config,
            commands,
            status: "active",
          };

          yield* Ref.set(instanceRef, instance);
        });

      /**
       * Executes a command by its ID.
       */
      const executeCommand = (commandId: string) =>
        Effect.gen(function* () {
          const instance = yield* Ref.get(instanceRef);
          if (!instance) {
            return yield* Effect.die(new Error("Component not initialized"));
          }

          const command = instance.commands.find((c) => c.id === commandId);
          if (!command || command.isDisabled) {
            return; // Silently ignore if command not found or disabled
          }

          yield* command.action.pipe(
            Effect.mapError(
              (cause) =>
                new CommandExecutionError({
                  commandId,
                  cause:
                    cause instanceof Error ? cause : new Error(String(cause)),
                })
            )
          );
        });

      /**
       * Updates the disabled state of a specific command.
       */
      const setCommandDisabled = (commandId: string, isDisabled: boolean) =>
        Effect.gen(function* () {
          const instance = yield* Ref.get(instanceRef);
          if (!instance) {
            return;
          }

          const updatedCommands = instance.commands.map((c) =>
            c.id === commandId ? { ...c, isDisabled } : c
          );

          yield* Ref.set(instanceRef, {
            ...instance,
            commands: updatedCommands,
          });
        });

      /**
       * Retrieves the current state of the toolbar instance.
       */
      const getInstance = () => Ref.get(instanceRef);

      return {
        initialize,
        executeCommand,
        setCommandDisabled,
        getInstance,
      };
    }),
    dependencies: [ToolbarService.Default],
  }
) {}

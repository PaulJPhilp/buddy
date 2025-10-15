import type { ToolbarConfig } from "@/features/shared/toolbar/schema/ToolbarConfigSchema";
import { Effect } from "effect";
import type { CommandExecutionError, ToolbarError } from "../errors/errors";
import type { ToolbarCommand, ToolbarInstance } from "../types/types";

/**
 * API for the ToolbarService layer.
 * Manages the loading of toolbar configurations and the registration of commands.
 */
export interface ToolbarServiceApi {
  readonly loadToolbarConfig: (
    id: string
  ) => Effect.Effect<ToolbarConfig, ToolbarError>;
  readonly registerCommand: (
    command: ToolbarCommand
  ) => Effect.Effect<void, never>;
  readonly getRegisteredCommand: (
    id: string
  ) => Effect.Effect<ToolbarCommand, ToolbarError>;
}

/**
 * API for the ToolbarComponent layer.
 * Manages the state and business logic for a single toolbar instance.
 */
export interface ToolbarComponentApi {
  readonly initialize: (
    config: ToolbarConfig
  ) => Effect.Effect<void, ToolbarError>;
  readonly executeCommand: (
    commandId: string
  ) => Effect.Effect<void, CommandExecutionError>;
  readonly setCommandDisabled: (
    commandId: string,
    isDisabled: boolean
  ) => Effect.Effect<void, never>;
  readonly getInstance: () => Effect.Effect<ToolbarInstance, never>;
}

/**
 * API for the ToolbarManager layer.
 * Orchestrates all toolbar instances and provides a public interface.
 */
export interface ToolbarManagerApi {
  readonly getToolbarInstance: (
    id: string
  ) => Effect.Effect<ToolbarInstance, ToolbarError>;
  readonly renderToolbar: (
    id: string
  ) => Effect.Effect<React.ReactNode, ToolbarError>;
}

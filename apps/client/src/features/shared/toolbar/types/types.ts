import type { ToolbarConfig } from "@/features/shared/toolbar/schema/ToolbarConfigSchema";
import { ToolbarStyle } from "@/features/shared/toolbar/schema/ToolbarConfigSchema";
import { Schema as S } from "effect";
import { Effect } from "effect";
import type { CommandExecutionError } from "../errors/errors";

/**
 * Represents a single, executable command in a toolbar.
 * Each command is a self-contained unit with an action.
 */
export class ToolbarCommand extends S.Class<ToolbarCommand>("ToolbarCommand")({
  id: S.String, // Unique identifier, e.g., "core.save"
  name: S.String, // Display name, e.g., "Save"
  icon: S.String, // Icon name from a library like Lucide
  tooltip: S.optional(S.String), // Tooltip for hover
  action: S.Any, // Placeholder for Effect.Effect<void, CommandExecutionError>
  isDisabled: S.optional(S.Boolean),
}) {}

/**
 * Represents a live instance of a toolbar in the application.
 */
export interface ToolbarInstance {
  readonly config: ToolbarConfig;
  readonly commands: ToolbarCommand[];
  readonly status: "active" | "inactive" | "error";
}

export { ToolbarConfig, ToolbarStyle };

import { Effect, Ref } from "effect";
import { WorkspaceCommand } from "./commands";
import { Workspace } from "./types";

/**
 * The WorkspaceManager service provides access to workspace state
 * and a method to dispatch workspace-related commands.
 *
 * It is the single source of truth for all workspace data in the application.
 */
export class WorkspaceManager extends Effect.Tag("WorkspaceManager")<
  WorkspaceManager,
  {
    /**
     * A Ref containing the current list of all workspaces.
     * UI components and other services can subscribe to this Ref
     * to react to changes in the workspace list.
     */
    readonly workspaces: Ref.Ref<readonly Workspace[]>;

    /**
     * Dispatches a command to be processed by the WorkspaceManager.
     * This is the sole entry point for initiating changes to workspace state.
     * The method returns an Effect that completes when the command
     * is successfully dispatched.
     */
    readonly dispatch: (command: WorkspaceCommand) => Effect.Effect<void>;
  }
>() {}

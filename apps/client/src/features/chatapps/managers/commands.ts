import { Schema as S } from "effect";
import type {
  ChatAppStatus,
  FocusModeConfig,
  LayoutConfig,
  WorkspaceLayoutConfig,
} from "./types";

// --- State Commands ---

/**
 * Command to set the chat apps manager state.
 * Updates the state with the provided partial state.
 */
export class SetChatAppsState extends S.Class<SetChatAppsState>(
  "SetChatAppsState"
)({
  _tag: S.Literal("SetChatAppsState"),
  updates: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * Command to reset the chat apps manager state.
 * Clears all app instances and resets to initial state.
 */
export class ResetChatAppsState extends S.Class<ResetChatAppsState>(
  "ResetChatAppsState"
)({
  _tag: S.Literal("ResetChatAppsState"),
}) {}

// --- Lifecycle Commands ---

/**
 * Command to register a new chat app instance.
 * Requires workspace ID, app ID, and configuration.
 */
export class RegisterChatApp extends S.Class<RegisterChatApp>(
  "RegisterChatApp"
)({
  _tag: S.Literal("RegisterChatApp"),
  workspaceId: S.String,
  appId: S.String,
  config: S.Record({ key: S.String, value: S.Unknown }),
  agentId: S.optional(S.String),
}) {}

/**
 * Command to unregister a chat app instance.
 * Requires the app ID.
 */
export class UnregisterChatApp extends S.Class<UnregisterChatApp>(
  "UnregisterChatApp"
)({
  _tag: S.Literal("UnregisterChatApp"),
  appId: S.String,
}) {}

/**
 * Command to close a chat app.
 * Requires the app ID.
 */
export class CloseChatApp extends S.Class<CloseChatApp>("CloseChatApp")({
  _tag: S.Literal("CloseChatApp"),
  appId: S.String,
}) {}

/**
 * Command to archive a chat app.
 * Requires the app ID.
 */
export class ArchiveChatApp extends S.Class<ArchiveChatApp>("ArchiveChatApp")({
  _tag: S.Literal("ArchiveChatApp"),
  appId: S.String,
}) {}

/**
 * Command to restore an archived chat app.
 * Requires the app ID.
 */
export class RestoreChatApp extends S.Class<RestoreChatApp>("RestoreChatApp")({
  _tag: S.Literal("RestoreChatApp"),
  appId: S.String,
}) {}

/**
 * Command to migrate chat apps to a different workspace.
 * Requires app IDs and target workspace ID.
 */
export class MigrateChatApps extends S.Class<MigrateChatApps>(
  "MigrateChatApps"
)({
  _tag: S.Literal("MigrateChatApps"),
  appIds: S.mutable(S.Array(S.String)),
  targetWorkspaceId: S.String,
}) {}

// --- Status Commands ---

/**
 * Command to set a chat app's status.
 * Requires app ID and new status.
 */
export class SetChatAppStatus extends S.Class<SetChatAppStatus>(
  "SetChatAppStatus"
)({
  _tag: S.Literal("SetChatAppStatus"),
  appId: S.String,
  status: S.Literal("stashed", "compact", "expanded", "archived", "closed"),
}) {}

/**
 * Command to expand a chat app.
 * Requires the app ID.
 */
export class ExpandChatApp extends S.Class<ExpandChatApp>("ExpandChatApp")({
  _tag: S.Literal("ExpandChatApp"),
  appId: S.String,
}) {}

/**
 * Command to compact a chat app.
 * Requires the app ID.
 */
export class CompactChatApp extends S.Class<CompactChatApp>("CompactChatApp")({
  _tag: S.Literal("CompactChatApp"),
  appId: S.String,
}) {}

/**
 * Command to stash a chat app.
 * Requires the app ID.
 */
export class StashChatApp extends S.Class<StashChatApp>("StashChatApp")({
  _tag: S.Literal("StashChatApp"),
  appId: S.String,
}) {}

/**
 * Command to set the active chat app.
 * Requires the app ID.
 */
export class SetActiveChatApp extends S.Class<SetActiveChatApp>(
  "SetActiveChatApp"
)({
  _tag: S.Literal("SetActiveChatApp"),
  appId: S.String,
}) {}

// --- Focus Commands ---

/**
 * Command to enter focus mode for a chat app.
 * Requires app ID and optional focus configuration.
 */
export class EnterFocusMode extends S.Class<EnterFocusMode>("EnterFocusMode")({
  _tag: S.Literal("EnterFocusMode"),
  appId: S.String,
  config: S.optional(
    S.Struct({
      hideOtherApps: S.Boolean,
      dimOtherApps: S.Boolean,
      disableOtherApps: S.Boolean,
      showExitButton: S.Boolean,
      autoExitTimeout: S.optional(S.Number),
    })
  ),
}) {}

/**
 * Command to exit focus mode.
 * No parameters required.
 */
export class ExitFocusMode extends S.Class<ExitFocusMode>("ExitFocusMode")({
  _tag: S.Literal("ExitFocusMode"),
}) {}

// --- Bulk Commands ---

/**
 * Command to expand multiple chat apps.
 * Requires array of app IDs.
 */
export class ExpandMultipleChatApps extends S.Class<ExpandMultipleChatApps>(
  "ExpandMultipleChatApps"
)({
  _tag: S.Literal("ExpandMultipleChatApps"),
  appIds: S.mutable(S.Array(S.String)),
}) {}

/**
 * Command to stash all apps in a workspace.
 * Requires workspace ID and optional exception app ID.
 */
export class StashAllAppsInWorkspace extends S.Class<StashAllAppsInWorkspace>(
  "StashAllAppsInWorkspace"
)({
  _tag: S.Literal("StashAllAppsInWorkspace"),
  workspaceId: S.String,
  exceptAppId: S.optional(S.String),
}) {}

/**
 * Command to close all apps in a workspace.
 * Requires the workspace ID.
 */
export class CloseAllAppsInWorkspace extends S.Class<CloseAllAppsInWorkspace>(
  "CloseAllAppsInWorkspace"
)({
  _tag: S.Literal("CloseAllAppsInWorkspace"),
  workspaceId: S.String,
}) {}

/**
 * Command to restore workspace layout.
 * Requires the workspace ID.
 */
export class RestoreWorkspaceLayout extends S.Class<RestoreWorkspaceLayout>(
  "RestoreWorkspaceLayout"
)({
  _tag: S.Literal("RestoreWorkspaceLayout"),
  workspaceId: S.String,
}) {}

// --- Configuration Commands ---

/**
 * Command to update a chat app's configuration.
 * Requires app ID and config updates.
 */
export class UpdateChatAppConfig extends S.Class<UpdateChatAppConfig>(
  "UpdateChatAppConfig"
)({
  _tag: S.Literal("UpdateChatAppConfig"),
  appId: S.String,
  config: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * Command to switch a chat app's agent.
 * Requires app ID and new agent ID.
 */
export class SwitchChatAppAgent extends S.Class<SwitchChatAppAgent>(
  "SwitchChatAppAgent"
)({
  _tag: S.Literal("SwitchChatAppAgent"),
  appId: S.String,
  agentId: S.String,
}) {}

/**
 * Command to set workspace maximum expanded apps.
 * Requires workspace ID and maximum number of apps.
 */
export class SetWorkspaceMaxExpandedApps extends S.Class<SetWorkspaceMaxExpandedApps>(
  "SetWorkspaceMaxExpandedApps"
)({
  _tag: S.Literal("SetWorkspaceMaxExpandedApps"),
  workspaceId: S.String,
  maxApps: S.Number,
}) {}

// --- Layout Commands ---

/**
 * Command to save a chat app's layout.
 * Requires app ID and layout configuration.
 */
export class SaveChatAppLayout extends S.Class<SaveChatAppLayout>(
  "SaveChatAppLayout"
)({
  _tag: S.Literal("SaveChatAppLayout"),
  appId: S.String,
  layout: S.Struct({
    position: S.Struct({ x: S.Number, y: S.Number }),
    size: S.Struct({ width: S.Number, height: S.Number }),
    zIndex: S.Number,
    isMinimized: S.Boolean,
    isMaximized: S.Boolean,
    customProperties: S.Record({ key: S.String, value: S.Unknown }),
  }),
}) {}

/**
 * Command to save workspace layout configuration.
 * Requires workspace ID and layout configuration.
 */
export class SaveWorkspaceLayout extends S.Class<SaveWorkspaceLayout>(
  "SaveWorkspaceLayout"
)({
  _tag: S.Literal("SaveWorkspaceLayout"),
  workspaceId: S.String,
  layout: S.Struct({
    gridSize: S.Struct({ rows: S.Number, columns: S.Number }),
    defaultAppSize: S.Struct({ width: S.Number, height: S.Number }),
    spacing: S.Struct({ horizontal: S.Number, vertical: S.Number }),
    autoLayout: S.Boolean,
    layoutMode: S.Literal("grid", "cascade", "custom"),
    customProperties: S.Record({ key: S.String, value: S.Unknown }),
  }),
}) {}

// --- Workspace Event Commands ---

/**
 * Command to handle workspace activation.
 * Requires the workspace ID.
 */
export class OnWorkspaceActivated extends S.Class<OnWorkspaceActivated>(
  "OnWorkspaceActivated"
)({
  _tag: S.Literal("OnWorkspaceActivated"),
  workspaceId: S.String,
}) {}

/**
 * Command to handle workspace archival.
 * Requires the workspace ID.
 */
export class OnWorkspaceArchived extends S.Class<OnWorkspaceArchived>(
  "OnWorkspaceArchived"
)({
  _tag: S.Literal("OnWorkspaceArchived"),
  workspaceId: S.String,
}) {}

/**
 * Command to enforce capacity limits for a workspace.
 * Requires the workspace ID.
 */
export class EnforceCapacityLimits extends S.Class<EnforceCapacityLimits>(
  "EnforceCapacityLimits"
)({
  _tag: S.Literal("EnforceCapacityLimits"),
  workspaceId: S.String,
}) {}

// --- Operation Commands ---

/**
 * Command to execute a chat apps operation.
 * Takes an operation object with type and parameters.
 */
export class ExecuteChatAppsOperation extends S.Class<ExecuteChatAppsOperation>(
  "ExecuteChatAppsOperation"
)({
  _tag: S.Literal("ExecuteChatAppsOperation"),
  operation: S.Struct({
    type: S.Literal(
      "register-app",
      "unregister-app",
      "set-status",
      "set-active",
      "enter-focus",
      "exit-focus",
      "expand-multiple",
      "stash-all",
      "close-all",
      "update-config",
      "switch-agent",
      "save-layout",
      "migrate-apps",
      "enforce-capacity",
      "bulk-operation"
    ),
    appId: S.optional(S.String),
    workspaceId: S.optional(S.String),
    params: S.Record({ key: S.String, value: S.Unknown }),
    timestamp: S.Date,
  }),
}) {}

/**
 * A union type representing all possible commands for the ChatApps domain.
 * This is useful for the CommandBus and handlers to perform type narrowing.
 */
export type ChatAppsCommand =
  | SetChatAppsState
  | ResetChatAppsState
  | RegisterChatApp
  | UnregisterChatApp
  | CloseChatApp
  | ArchiveChatApp
  | RestoreChatApp
  | MigrateChatApps
  | SetChatAppStatus
  | ExpandChatApp
  | CompactChatApp
  | StashChatApp
  | SetActiveChatApp
  | EnterFocusMode
  | ExitFocusMode
  | ExpandMultipleChatApps
  | StashAllAppsInWorkspace
  | CloseAllAppsInWorkspace
  | RestoreWorkspaceLayout
  | UpdateChatAppConfig
  | SwitchChatAppAgent
  | SetWorkspaceMaxExpandedApps
  | SaveChatAppLayout
  | SaveWorkspaceLayout
  | OnWorkspaceActivated
  | OnWorkspaceArchived
  | EnforceCapacityLimits
  | ExecuteChatAppsOperation;

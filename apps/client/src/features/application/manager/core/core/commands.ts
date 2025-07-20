import { Schema as S } from "effect";
import type { CoreManagerConfig, ManagerOperationType } from "./types";

// --- State Commands ---

/**
 * Command to set the core manager state.
 * Updates the state with the provided partial state.
 */
export class SetCoreState extends S.Class<SetCoreState>("SetCoreState")({
  _tag: S.Literal("SetCoreState"),
  updates: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * Command to reset the core manager state.
 * Resets to initial state with uninitialized status.
 */
export class ResetCoreState extends S.Class<ResetCoreState>("ResetCoreState")({
  _tag: S.Literal("ResetCoreState"),
}) {}

// --- Lifecycle Commands ---

/**
 * Command to initialize the core manager.
 * Requires configuration for the manager.
 */
export class InitializeCoreManager extends S.Class<InitializeCoreManager>(
  "InitializeCoreManager"
)({
  _tag: S.Literal("InitializeCoreManager"),
  config: S.Struct({
    id: S.String,
    name: S.String,
    autoStart: S.optional(S.Boolean),
    autoCleanup: S.optional(S.Boolean),
    debugMode: S.optional(S.Boolean),
    maxOperations: S.optional(S.Number),
  }),
}) {}

/**
 * Command to start the core manager.
 * No parameters required.
 */
export class StartCoreManager extends S.Class<StartCoreManager>(
  "StartCoreManager"
)({
  _tag: S.Literal("StartCoreManager"),
}) {}

/**
 * Command to stop the core manager.
 * No parameters required.
 */
export class StopCoreManager extends S.Class<StopCoreManager>(
  "StopCoreManager"
)({
  _tag: S.Literal("StopCoreManager"),
}) {}

/**
 * Command to restart the core manager.
 * No parameters required.
 */
export class RestartCoreManager extends S.Class<RestartCoreManager>(
  "RestartCoreManager"
)({
  _tag: S.Literal("RestartCoreManager"),
}) {}

/**
 * Command to cleanup the core manager.
 * No parameters required.
 */
export class CleanupCoreManager extends S.Class<CleanupCoreManager>(
  "CleanupCoreManager"
)({
  _tag: S.Literal("CleanupCoreManager"),
}) {}

// --- Operation Commands ---

/**
 * Command to coordinate operations across managers.
 * Requires operation type and parameters.
 */
export class CoordinateOperation extends S.Class<CoordinateOperation>(
  "CoordinateOperation"
)({
  _tag: S.Literal("CoordinateOperation"),
  operationType: S.Literal("coordinate", "orchestrate", "manage", "monitor"),
  params: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * Command to orchestrate complex multi-manager operations.
 * Requires operation type and parameters.
 */
export class OrchestrateOperation extends S.Class<OrchestrateOperation>(
  "OrchestrateOperation"
)({
  _tag: S.Literal("OrchestrateOperation"),
  operationType: S.Literal("coordinate", "orchestrate", "manage", "monitor"),
  params: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * A union type representing all possible commands for the Core domain.
 * This is useful for the CommandBus and handlers to perform type narrowing.
 */
export type CoreCommand =
  | SetCoreState
  | ResetCoreState
  | InitializeCoreManager
  | StartCoreManager
  | StopCoreManager
  | RestartCoreManager
  | CleanupCoreManager
  | CoordinateOperation
  | OrchestrateOperation;

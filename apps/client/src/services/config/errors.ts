import { Data } from "effect";

export class ConfigWatchError extends Data.TaggedError("ConfigWatchError")<{
  readonly message: string;
  readonly configPath: string;
  readonly cause?: unknown;
}> {}

export class ConfigMergeError extends Data.TaggedError("ConfigMergeError")<{
  readonly message: string;
  readonly conflictingFields?: string[];
  readonly cause?: unknown;
}> {}

export class ConfigBackupError extends Data.TaggedError("ConfigBackupError")<{
  readonly message: string;
  readonly configPath: string;
  readonly backupPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigRestoreError extends Data.TaggedError("ConfigRestoreError")<{
  readonly message: string;
  readonly backupPath: string;
  readonly configPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigMigrationError extends Data.TaggedError(
  "ConfigMigrationError"
)<{
  readonly message: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly cause?: unknown;
}> {}

export class ConfigExportError extends Data.TaggedError("ConfigExportError")<{
  readonly message: string;
  readonly format: string;
  readonly cause?: unknown;
}> {}

export class ConfigImportError extends Data.TaggedError("ConfigImportError")<{
  readonly message: string;
  readonly format: string;
  readonly cause?: unknown;
}> {}

export class ConfigHealthError extends Data.TaggedError("ConfigHealthError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly issues?: string[];
  readonly cause?: unknown;
}> {}

export class ConfigRepairError extends Data.TaggedError("ConfigRepairError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigResetError extends Data.TaggedError("ConfigResetError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigFileSystemError extends Data.TaggedError(
  "ConfigFileSystemError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class ConfigPermissionError extends Data.TaggedError(
  "ConfigPermissionError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class ConfigNetworkError extends Data.TaggedError("ConfigNetworkError")<{
  readonly message: string;
  readonly url: string;
  readonly cause?: unknown;
}> {}

export class ConfigTimeoutError extends Data.TaggedError("ConfigTimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly timeout: number;
  readonly cause?: unknown;
}> {}

export type ConfigServiceError =
  | ConfigWatchError
  | ConfigMergeError
  | ConfigBackupError
  | ConfigRestoreError
  | ConfigMigrationError
  | ConfigExportError
  | ConfigImportError
  | ConfigHealthError
  | ConfigRepairError
  | ConfigResetError
  | ConfigFileSystemError
  | ConfigPermissionError
  | ConfigNetworkError
  | ConfigTimeoutError;

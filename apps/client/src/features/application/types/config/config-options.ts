export interface ConfigLoadOptions {
  readonly validateOnLoad?: boolean;
  readonly mergeDefaults?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly backupOnLoad?: boolean;
  readonly format?: "json" | "yaml" | "toml";
}

export interface ConfigSaveOptions {
  readonly validateOnSave?: boolean;
  readonly createBackup?: boolean;
  readonly prettyPrint?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly format?: "json" | "yaml" | "toml";
}

export interface ConfigWatchOptions {
  readonly debounceMs?: number;
  readonly recursive?: boolean;
  readonly ignoreInitial?: boolean;
  readonly validateOnChange?: boolean;
  readonly reloadOnChange?: boolean;
}

export interface ConfigMergeOptions {
  readonly strategy?: "replace" | "merge" | "append";
  readonly conflictResolution?: "source" | "target" | "error";
  readonly preserveComments?: boolean;
  readonly validateResult?: boolean;
}

export interface ConfigValidationOptions {
  readonly strict?: boolean;
  readonly allowUnknownFields?: boolean;
  readonly validateReferences?: boolean;
  readonly checkDuplicates?: boolean;
  readonly validatePermissions?: boolean;
}

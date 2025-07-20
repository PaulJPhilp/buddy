import { AppConfig } from "./app";
import type { Workspace } from "./workspace";

export interface StorageData {
  readonly workspaces: Record<string, Workspace>;
  readonly currentWorkspaceId: string | null;
  readonly appConfig: AppConfig;
}

export interface StorageOptions {
  readonly configDir?: string;
  readonly validateOnLoad?: boolean;
  readonly validateOnSave?: boolean;
  readonly createBackup?: boolean;
}

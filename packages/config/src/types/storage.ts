import { Effect } from "effect";
import type { Workspace } from "./workspace";

export interface StorageData {
  readonly currentWorkspaceId: string | null;
  readonly workspaces: Record<string, Workspace>;
  readonly chatApps: Record<string, any>; // Will be typed properly later
}

export interface StorageOptions {
  readonly configDir?: string;
  readonly validateOnLoad?: boolean;
  readonly validateOnSave?: boolean;
  readonly createBackup?: boolean;
}

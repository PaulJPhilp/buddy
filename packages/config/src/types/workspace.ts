import { Effect } from "effect";

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly agentIds: readonly string[];
  readonly chatappIds: readonly string[];
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly isArchived: boolean;
  readonly maxExpandedApps: number;
  readonly activeAppId: string | null;
}

export interface WorkspaceCreateInput {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly agentIds?: readonly string[];
  readonly chatappIds?: readonly string[];
}

export interface WorkspaceUpdateInput extends Partial<WorkspaceCreateInput> {
  readonly isArchived?: boolean;
  readonly maxExpandedApps?: number;
  readonly activeAppId?: string | null;
}

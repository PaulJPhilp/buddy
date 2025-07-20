import { Effect } from "effect";
import type { WorkspaceError } from "./errors";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceManagerConfig,
  WorkspaceManagerState,
  WorkspaceManagerStats,
  WorkspaceUpdateInput,
} from "./types";

export interface WorkspaceManagerApi {
  // State Management
  readonly getState: () => Effect.Effect<WorkspaceManagerState, WorkspaceError>;
  readonly setState: (
    updates: Partial<WorkspaceManagerState>
  ) => Effect.Effect<void, WorkspaceError>;
  readonly resetState: () => Effect.Effect<void, WorkspaceError>;

  // Initialization and Configuration
  readonly initialize: (
    config?: WorkspaceManagerConfig
  ) => Effect.Effect<void, WorkspaceError>;
  readonly getConfig: () => Effect.Effect<
    WorkspaceManagerConfig | null,
    WorkspaceError
  >;
  readonly updateConfig: (
    updates: Partial<WorkspaceManagerConfig>
  ) => Effect.Effect<void, WorkspaceError>;

  // Workspace CRUD Operations
  readonly createWorkspace: (
    input: WorkspaceCreateInput
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly getWorkspace: (
    workspaceId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly updateWorkspace: (
    workspaceId: string,
    updates: WorkspaceUpdateInput
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly deleteWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError>;
  readonly archiveWorkspace: (
    workspaceId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly restoreWorkspace: (
    workspaceId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;

  // Workspace Queries
  readonly getAllWorkspaces: () => Effect.Effect<
    readonly Workspace[],
    WorkspaceError
  >;
  readonly getActiveWorkspaces: () => Effect.Effect<
    readonly Workspace[],
    WorkspaceError
  >;
  readonly getArchivedWorkspaces: () => Effect.Effect<
    readonly Workspace[],
    WorkspaceError
  >;
  readonly searchWorkspaces: (
    query: string
  ) => Effect.Effect<readonly Workspace[], WorkspaceError>;

  // Workspace Validation
  readonly validateWorkspace: (
    workspace: Workspace
  ) => Effect.Effect<void, WorkspaceError>;
  readonly validateWorkspaceInput: (
    input: WorkspaceCreateInput | WorkspaceUpdateInput
  ) => Effect.Effect<void, WorkspaceError>;

  // Workspace Utilities
  readonly duplicateWorkspace: (
    workspaceId: string,
    newName: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly exportWorkspace: (
    workspaceId: string
  ) => Effect.Effect<string, WorkspaceError>;
  readonly importWorkspace: (
    data: string
  ) => Effect.Effect<Workspace, WorkspaceError>;

  // Workspace Relationships
  readonly addAgentToWorkspace: (
    workspaceId: string,
    agentId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly removeAgentFromWorkspace: (
    workspaceId: string,
    agentId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly addChatAppToWorkspace: (
    workspaceId: string,
    chatAppId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly removeChatAppFromWorkspace: (
    workspaceId: string,
    chatAppId: string
  ) => Effect.Effect<Workspace, WorkspaceError>;

  // Statistics and Monitoring
  readonly getStats: () => Effect.Effect<WorkspaceManagerStats, WorkspaceError>;
  readonly getWorkspaceStats: (
    workspaceId: string
  ) => Effect.Effect<WorkspaceManagerStats, WorkspaceError>;

  // Subscription for state changes
  readonly subscribe: (
    callback: (state: WorkspaceManagerState) => void
  ) => Effect.Effect<() => void, WorkspaceError>;

  // Persistence
  readonly save: () => Effect.Effect<void, WorkspaceError>;
  readonly load: () => Effect.Effect<void, WorkspaceError>;
  readonly clear: () => Effect.Effect<void, WorkspaceError>;
}

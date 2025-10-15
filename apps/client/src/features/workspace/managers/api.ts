import type {
  AgentConfig,
  ChatAppConfig,
} from "@/features/application/types/AppConfig";
import type { WorkspaceConfig } from "./workspace-manager/types";
import { Effect } from "effect";
import type { WorkspaceComponentError } from "./errors";
import type {
  WorkspaceComponentConfig,
  WorkspaceComponentState,
  WorkspaceOperationType,
} from "./types";

export interface WorkspaceComponentApi {
  // Core component lifecycle (similar to CoreComponentApi but with Workspace-specific types)
  readonly initialize: (
    config: WorkspaceComponentConfig
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getState: () => Effect.Effect<
    WorkspaceComponentState,
    WorkspaceComponentError
  >;
  readonly setState: (
    state: Partial<WorkspaceComponentState>
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly subscribe: (
    callback: (state: WorkspaceComponentState) => void
  ) => Effect.Effect<() => void, WorkspaceComponentError>;
  readonly cleanup: () => Effect.Effect<void, WorkspaceComponentError>;

  // Workspace configuration management
  readonly loadWorkspace: (
    workspaceConfig: WorkspaceConfig
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getWorkspaceConfig: () => Effect.Effect<
    WorkspaceConfig | null,
    WorkspaceComponentError
  >;
  readonly switchWorkspace: (
    workspaceConfig: WorkspaceConfig
  ) => Effect.Effect<void, WorkspaceComponentError>;

  // ChatApp management
  readonly loadChatApps: (
    chatApps: ChatAppConfig[]
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getAvailableChatApps: () => Effect.Effect<
    ChatAppConfig[],
    WorkspaceComponentError
  >;
  readonly activateChatApp: (
    chatAppId: string
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly deactivateChatApp: (
    chatAppId: string
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getActiveChatApps: () => Effect.Effect<
    ChatAppConfig[],
    WorkspaceComponentError
  >;

  // Agent management
  readonly loadAgents: (
    agents: AgentConfig[]
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getAvailableAgents: () => Effect.Effect<
    AgentConfig[],
    WorkspaceComponentError
  >;
  readonly getAgentsForChatApp: (
    chatAppId: string
  ) => Effect.Effect<AgentConfig[], WorkspaceComponentError>;

  // UI rendering
  readonly renderWorkspaceUI: () => Effect.Effect<
    void,
    WorkspaceComponentError
  >;
  readonly isUIRendered: () => Effect.Effect<boolean, WorkspaceComponentError>;

  // Operation tracking
  readonly executeOperation: (
    operation: WorkspaceOperationType
  ) => Effect.Effect<void, WorkspaceComponentError>;
  readonly getLastOperation: () => Effect.Effect<
    WorkspaceOperationType | null,
    WorkspaceComponentError
  >;
}

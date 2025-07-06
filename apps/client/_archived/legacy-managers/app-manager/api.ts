import type { ChatAppConfig } from "../../types/global";
import type { ChatApp, Workspace } from "@buddy/schemas";
import type { Effect } from "effect";
import type { AppManagerError } from "./errors";

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string;
  readonly description?: string;
}

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly isArchived: boolean;
  readonly availableAgents: string[];
  readonly activeAppId: string | null;
  readonly maxExpandedApps: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ChatApp {
  readonly id: string;
  readonly workspaceId: string;
  readonly status: "stashed" | "compact" | "expanded" | "closed";
  readonly isArchived: boolean;
  readonly lastActiveAt: Date;
  readonly config: ChatAppConfig;
  readonly previousStatus?: "expanded" | "compact";
}

// Pure state interface - this is what the service manages internally
export interface AppManagerState {
  readonly currentWorkspaceId: string | null;
  readonly workspaces: Record<string, Workspace>;
  readonly chatApps: Record<string, ChatApp>;
  readonly agents: Record<string, Agent>;
  readonly isLoading: boolean;
  readonly expandedWorkspaces: Set<string>;
  readonly lastError: string | null;
}

// Service operations interface - this is what external consumers can call
export interface AppManagerApi {
  // State access - reactive streams
  readonly getState: () => Effect.Effect<
    AppManagerState,
    AppManagerError,
    never
  >;
  readonly subscribe: (
    listener: (state: AppManagerState) => void,
  ) => Effect.Effect<() => Effect.Effect<void>, AppManagerError, never>;

  // Workspace operations
  readonly getCurrentWorkspace: () => Effect.Effect<
    Workspace | null,
    AppManagerError,
    never
  >;
  readonly getActiveWorkspaces: () => Effect.Effect<
    Workspace[],
    AppManagerError,
    never
  >;
  readonly setCurrentWorkspace: (
    id: string,
  ) => Effect.Effect<void, AppManagerError, never>;
  readonly createWorkspace: (params: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    availableAgents: string[];
  }) => Effect.Effect<Workspace, AppManagerError, never>;
  readonly updateWorkspace: (
    id: string,
    updates: Partial<Omit<Workspace, "id" | "createdAt">>,
  ) => Effect.Effect<Workspace, AppManagerError, never>;
  readonly archiveWorkspace: (
    id: string,
  ) => Effect.Effect<void, AppManagerError, never>;
  readonly deleteWorkspace: (
    id: string,
  ) => Effect.Effect<void, AppManagerError, never>;

  // ChatApp operations within workspaces
  readonly getChatAppsInWorkspace: (
    workspaceId: string,
  ) => Effect.Effect<ChatApp[], AppManagerError, never>;
  readonly addChatAppToWorkspace: (
    workspaceId: string,
    chatApp: Omit<ChatApp, "id" | "workspaceId">,
  ) => Effect.Effect<ChatApp, AppManagerError, never>;
  readonly removeChatAppFromWorkspace: (
    workspaceId: string,
    chatAppId: string,
  ) => Effect.Effect<void, AppManagerError, never>;
  readonly updateChatAppStatus: (
    chatAppId: string,
    status: "stashed" | "compact" | "expanded" | "closed",
  ) => Effect.Effect<void, AppManagerError, never>;

  // Bulk operations
  readonly loadWorkspacesFromConfig: () => Effect.Effect<
    void,
    AppManagerError,
    never
  >;
  readonly loadChatAppsFromConfig: () => Effect.Effect<
    void,
    AppManagerError,
    never
  >;

  // Utility operations
  readonly ensureDefaultWorkspace: () => Effect.Effect<
    Workspace,
    AppManagerError,
    never
  >;
  readonly getWorkspaceStats: (workspaceId: string) => Effect.Effect<
    {
      totalChatApps: number;
      activeChatApps: number;
      expandedChatApps: number;
    },
    AppManagerError,
    never
  >;

  // Agent operations
  readonly addAgent: (
    agent: Omit<Agent, "id">,
  ) => Effect.Effect<Agent, AppManagerError, never>;

  readonly updateAgent: (
    agentId: string,
    updates: Partial<Pick<Agent, "name" | "avatar" | "description">>,
  ) => Effect.Effect<Agent, AppManagerError, never>;

  readonly removeAgent: (
    agentId: string,
  ) => Effect.Effect<void, AppManagerError, never>;

  // UI state operations (for sidebar, etc.)
  readonly toggleWorkspaceExpanded: (
    workspaceId: string,
  ) => Effect.Effect<void, AppManagerError, never>;

  readonly setWorkspaceExpanded: (
    workspaceId: string,
    expanded: boolean,
  ) => Effect.Effect<void, AppManagerError, never>;

  // Data loading
  readonly loadInitialData: () => Effect.Effect<void, AppManagerError, never>;
  readonly refreshWorkspaces: () => Effect.Effect<void, AppManagerError, never>;
  readonly refreshChatApps: () => Effect.Effect<void, AppManagerError, never>;
  readonly refreshAgents: () => Effect.Effect<void, AppManagerError, never>;

  // Selectors (computed state)
  readonly getActiveChatApp: () => Effect.Effect<
    ChatApp | null,
    AppManagerError,
    never
  >;
  readonly getStashedChatApps: (
    workspaceId: string,
  ) => Effect.Effect<ChatApp[], AppManagerError, never>;
}

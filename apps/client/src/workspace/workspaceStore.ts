import { createStoreHooks } from "@/stores/createStoreHooks";
import { createStore } from "@xstate/store";
import { ChatAppStatus, UIEvent, UIState, WorkspaceEntry } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_WORKSPACES = 10;
export const DEFAULT_WORKSPACE_NAME = "Untitled";
const DEFAULT_AGENTS = ["default-agent"]; // Default agent set

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

export function createDefaultWorkspace(): WorkspaceEntry {
  return {
    id: "default-workspace",
    name: DEFAULT_WORKSPACE_NAME,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    isArchived: false,
    availableAgents: [...DEFAULT_AGENTS],
    color: "#3b82f6",
    description: "",
    icon: "🚀",
  };
}

export function getActiveWorkspaces(
  workspaces: Record<string, WorkspaceEntry>,
): WorkspaceEntry[] {
  return Object.values(workspaces).filter((workspace) => !workspace.isArchived);
}

function ensureAtLeastOneWorkspace(
  workspaces: Record<string, WorkspaceEntry>,
): Record<string, WorkspaceEntry> {
  const activeWorkspaces = getActiveWorkspaces(workspaces);
  if (activeWorkspaces.length === 0) {
    const defaultWorkspace = createDefaultWorkspace();
    return {
      ...workspaces,
      [defaultWorkspace.id]: defaultWorkspace,
    };
  }
  return workspaces;
}

function getFirstActiveWorkspaceId(
  workspaces: Record<string, WorkspaceEntry>,
): string | null {
  const activeWorkspaces = getActiveWorkspaces(workspaces);
  return activeWorkspaces.length > 0 ? activeWorkspaces[0].id : null;
}

// ---------------------------------------------------------------------------
// Initial context
// ---------------------------------------------------------------------------

const defaultWorkspace = createDefaultWorkspace();
const initialContext: UIState = {
  currentWorkspaceId: defaultWorkspace.id,
  workspaces: {
    [defaultWorkspace.id]: defaultWorkspace,
  },
  chatApps: {},
};

// ---------------------------------------------------------------------------
// Event handlers (pure functions that return a NEW state)
// ---------------------------------------------------------------------------

const handlers = {
  RESET: (): UIState => {
    const defaultWorkspace = createDefaultWorkspace();
    return {
      currentWorkspaceId: defaultWorkspace.id,
      workspaces: {
        [defaultWorkspace.id]: defaultWorkspace,
      },
      chatApps: {},
    };
  },

  ENSURE_DEFAULT_WORKSPACE: (context: UIState): UIState => {
    if (
      Object.keys(context.workspaces).length === 0 ||
      getActiveWorkspaces(context.workspaces).length === 0
    ) {
      const defaultWorkspace = createDefaultWorkspace();
      return {
        ...context,
        currentWorkspaceId: defaultWorkspace.id,
        workspaces: {
          ...context.workspaces,
          [defaultWorkspace.id]: defaultWorkspace,
        },
      };
    }
    return context;
  },

  WORKSPACE_ADDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_ADDED" }>,
  ): UIState => {
    // Check if workspace already exists
    if (context.workspaces[event.workspaceId]) return context;

    // Check maximum workspaces limit (only count active workspaces)
    const activeWorkspaces = getActiveWorkspaces(context.workspaces);
    if (activeWorkspaces.length >= MAX_WORKSPACES) {
      console.warn(
        `[workspaceStore] Cannot add workspace: maximum ${MAX_WORKSPACES} workspaces allowed`,
      );
      return context;
    }

    // Validate available agents (must have at least 1)
    if (!event.availableAgents || event.availableAgents.length === 0) {
      console.warn(
        "[workspaceStore] Cannot add workspace: must have at least 1 available agent",
      );
      return context;
    }

    const now = new Date();
    const newWorkspace: WorkspaceEntry = {
      id: event.workspaceId,
      name: event.name,
      color: event.color ?? "#3b82f6",
      description: event.description ?? "",
      icon: event.icon ?? "📁",
      createdAt: now,
      lastActiveAt: now,
      isArchived: false,
      availableAgents: [...event.availableAgents],
    };

    const newWorkspaces = {
      ...context.workspaces,
      [event.workspaceId]: newWorkspace,
    };

    return {
      ...context,
      workspaces: newWorkspaces,
      currentWorkspaceId: event.workspaceId, // Activate the newly created workspace
    };
  },

  WORKSPACE_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_UPDATED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace) return context;

    // Validate available agents if provided (must have at least 1)
    if (event.availableAgents && event.availableAgents.length === 0) {
      console.warn(
        "[workspaceStore] Cannot update workspace: must have at least 1 available agent",
      );
      return context;
    }

    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      name: event.name ?? workspace.name,
      color: event.color ?? workspace.color,
      description: event.description ?? workspace.description,
      icon: event.icon ?? workspace.icon,
      availableAgents: event.availableAgents ?? workspace.availableAgents,
      layoutPreferences: event.layoutPreferences ?? workspace.layoutPreferences,
      lastActiveAt: new Date(),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
    };
  },

  WORKSPACE_ACTIVATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_ACTIVATED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace || workspace.isArchived) return context; // Cannot activate archived workspace
    if (context.currentWorkspaceId === event.workspaceId) return context;

    // Update last active time
    const updatedWorkspace = {
      ...workspace,
      lastActiveAt: new Date(),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      currentWorkspaceId: event.workspaceId,
    };
  },

  WORKSPACE_ARCHIVED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_ARCHIVED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace || workspace.isArchived) return context;

    // Check if this is the last active workspace - if so, don't archive
    const activeWorkspaces = getActiveWorkspaces(context.workspaces);
    if (activeWorkspaces.length <= 1) {
      console.warn("[workspaceStore] Cannot archive the last active workspace");
      return context;
    }

    // Archive the workspace
    const updatedWorkspaces = {
      ...context.workspaces,
      [event.workspaceId]: {
        ...workspace,
        isArchived: true,
      },
    };

    // Archive all chat apps in this workspace
    const updatedChatApps = Object.fromEntries(
      Object.entries(context.chatApps).map(([appId, app]) => [
        appId,
        app.workspaceId === event.workspaceId
          ? { ...app, isArchived: true }
          : app,
      ]),
    );

    // If the archived workspace was active, switch to first available active workspace
    const newCurrentWorkspaceId =
      context.currentWorkspaceId === event.workspaceId
        ? getFirstActiveWorkspaceId(updatedWorkspaces)
        : context.currentWorkspaceId;

    return {
      workspaces: updatedWorkspaces,
      chatApps: updatedChatApps,
      currentWorkspaceId: newCurrentWorkspaceId,
    };
  },

  WORKSPACE_RESTORED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_RESTORED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace || !workspace.isArchived) return context;

    const updatedWorkspaces = {
      ...context.workspaces,
      [event.workspaceId]: {
        ...workspace,
        isArchived: false,
        lastActiveAt: new Date(),
      },
    };

    // Also restore all chat apps within this workspace
    const updatedChatApps = Object.fromEntries(
      Object.entries(context.chatApps).map(([appId, app]) => [
        appId,
        app.workspaceId === event.workspaceId
          ? { ...app, isArchived: false }
          : app,
      ]),
    );

    return {
      ...context,
      workspaces: updatedWorkspaces,
      chatApps: updatedChatApps,
    };
  },

  WORKSPACE_AGENT_ADDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_AGENT_ADDED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace) return context;

    const agents = new Set(workspace.availableAgents);
    agents.add(event.agentId);

    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      availableAgents: Array.from(agents),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
    };
  },

  WORKSPACE_AGENT_REMOVED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_AGENT_REMOVED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace) return context;

    const agents = new Set(workspace.availableAgents);
    agents.delete(event.agentId);

    // Ensure at least one agent remains
    if (agents.size === 0) {
      console.warn(
        `[workspaceStore] Cannot remove last agent from workspace ${event.workspaceId}`,
      );
      return context;
    }

    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      availableAgents: Array.from(agents),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
    };
  },

  WORKSPACE_LAYOUT_PREFERENCES_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_LAYOUT_PREFERENCES_UPDATED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace) return context;

    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      layoutPreferences: event.layoutPreferences,
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
    };
  },

  CHAT_APP_ADDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_ADDED" }>,
  ): UIState => {
    // Cannot add to a non-existent workspace
    if (!context.workspaces[event.workspaceId]) return context;

    // Cannot add if it already exists
    if (context.chatApps[event.appId]) return context;

    const newApps = {
      ...context.chatApps,
      [event.appId]: {
        id: event.appId,
        workspaceId: event.workspaceId,
        status: "stashed" as ChatAppStatus,
        isArchived: false,
        config: event.config,
      },
    };

    return {
      ...context,
      chatApps: newApps,
    };
  },

  CHAT_APPS_ADDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APPS_ADDED" }>,
  ): UIState => {
    const { apps } = event;
    if (!apps || apps.length === 0) return context;

    const newChatAppsState = { ...context.chatApps };

    for (const config of apps) {
      const { workspaceId, id: appId } = config;

      if (!context.workspaces[workspaceId]) {
        console.warn(
          `[workspaceStore] Discarding app "${config.name}" - workspace "${workspaceId}" not found.`,
        );
        continue;
      }

      // Avoid adding duplicate apps
      if (newChatAppsState[appId]) {
        continue;
      }

      // Create the ChatAppEntry, NOW WITH CONFIG
      newChatAppsState[appId] = {
        id: appId,
        workspaceId,
        status: "stashed",
        isArchived: false,
        lastInteraction: new Date(),
        config,
      };
    }

    return {
      ...context,
      chatApps: newChatAppsState,
    };
  },

  CHAT_APP_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_UPDATED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app || app.workspaceId !== event.workspaceId) return context;

    const updatedApp = {
      ...app,
      status: event.status ?? app.status,
    };

    return {
      ...context,
      chatApps: {
        ...context.chatApps,
        [event.appId]: updatedApp,
      },
    };
  },

  CHAT_APP_REMOVED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_REMOVED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app) return context;

    const { [event.appId]: _removed, ...remainingApps } = context.chatApps;

    return {
      ...context,
      chatApps: remainingApps,
    };
  },

  CHAT_APP_EXPANDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_EXPANDED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app || app.workspaceId !== event.workspaceId) return context;

    return {
      ...context,
      chatApps: {
        ...context.chatApps,
        [event.appId]: {
          ...app,
          status: "expanded",
        },
      },
    };
  },

  CHAT_APP_COMPACTED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_COMPACTED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app || app.workspaceId !== event.workspaceId) return context;

    return {
      ...context,
      chatApps: {
        ...context.chatApps,
        [event.appId]: {
          ...app,
          status: "compact",
        },
      },
    };
  },

  CHAT_APP_CLOSED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_CLOSED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (
      !target ||
      target.workspaceId !== event.workspaceId ||
      target.isArchived
    )
      return context;

    const updatedApps = {
      ...context.chatApps,
      [event.appId]: { ...target, status: "closed" as ChatAppStatus },
    };

    return { ...context, chatApps: updatedApps };
  },

  CHAT_APP_ARCHIVED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_ARCHIVED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (
      !target ||
      target.workspaceId !== event.workspaceId ||
      target.isArchived
    )
      return context;

    const updatedApps = {
      ...context.chatApps,
      [event.appId]: {
        ...target,
        status: "archived" as ChatAppStatus,
        isArchived: true,
      },
    };

    return { ...context, chatApps: updatedApps };
  },

  CHAT_APP_RESTORED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_RESTORED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (
      !target ||
      target.workspaceId !== event.workspaceId ||
      !target.isArchived
    )
      return context;

    // Can only restore to active workspace
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace || workspace.isArchived) return context;

    const updatedApps = {
      ...context.chatApps,
      [event.appId]: {
        ...target,
        status: "compact" as ChatAppStatus,
        isArchived: false,
      },
    };

    return { ...context, chatApps: updatedApps };
  },
} as const;

// ---------------------------------------------------------------------------
// Store factory & default instance
// ---------------------------------------------------------------------------

export function createWorkspaceStore(initial?: UIState) {
  const store = createStore({
    context: initial ?? initialContext,
    on: {
      RESET: (context) => handlers.RESET(),
      ENSURE_DEFAULT_WORKSPACE: (context) =>
        handlers.ENSURE_DEFAULT_WORKSPACE(context),
      WORKSPACE_ADDED: (context, event) =>
        handlers.WORKSPACE_ADDED(context, event as any),
      WORKSPACE_UPDATED: (context, event) =>
        handlers.WORKSPACE_UPDATED(context, event as any),
      WORKSPACE_ACTIVATED: (context, event) =>
        handlers.WORKSPACE_ACTIVATED(context, event as any),
      WORKSPACE_ARCHIVED: (context, event) =>
        handlers.WORKSPACE_ARCHIVED(context, event as any),
      WORKSPACE_RESTORED: (context, event) =>
        handlers.WORKSPACE_RESTORED(context, event as any),
      WORKSPACE_AGENT_ADDED: (context, event) =>
        handlers.WORKSPACE_AGENT_ADDED(context, event as any),
      WORKSPACE_AGENT_REMOVED: (context, event) =>
        handlers.WORKSPACE_AGENT_REMOVED(context, event as any),
      WORKSPACE_LAYOUT_PREFERENCES_UPDATED: (context, event) =>
        handlers.WORKSPACE_LAYOUT_PREFERENCES_UPDATED(context, event as any),
      CHAT_APP_ADDED: (context, event) =>
        handlers.CHAT_APP_ADDED(context, event as any),
      CHAT_APPS_ADDED: (context, event) =>
        handlers.CHAT_APPS_ADDED(context, event as any),
      CHAT_APP_UPDATED: (context, event) =>
        handlers.CHAT_APP_UPDATED(context, event as any),
      CHAT_APP_REMOVED: (context, event) =>
        handlers.CHAT_APP_REMOVED(context, event as any),
      CHAT_APP_EXPANDED: (context, event) =>
        handlers.CHAT_APP_EXPANDED(context, event as any),
      CHAT_APP_COMPACTED: (context, event) =>
        handlers.CHAT_APP_COMPACTED(context, event as any),
      CHAT_APP_CLOSED: (context, event) =>
        handlers.CHAT_APP_CLOSED(context, event as any),
      CHAT_APP_ARCHIVED: (context, event) =>
        handlers.CHAT_APP_ARCHIVED(context, event as any),
      CHAT_APP_RESTORED: (context, event) =>
        handlers.CHAT_APP_RESTORED(context, event as any),
    },
  });

  return store;
}

// Default instance used by the app
export const workspaceStore = createWorkspaceStore();

// Create and export the hooks using the new factory
const { useSelector, useDispatch } = createStoreHooks(
  workspaceStore,
  initialContext,
);

export const useWorkspaceStore = useSelector;
export const useWorkspaceDispatch = useDispatch;

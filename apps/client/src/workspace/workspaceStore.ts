import { createStoreHooks } from "@/stores/createStoreHooks";
import { createStore } from "@xstate/store";
import { ChatAppStatus, UIEvent, UIState, WorkspaceEntry } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_WORKSPACES = 10;
export const DEFAULT_WORKSPACE_NAME = "Untitled";
export const DEFAULT_MAX_EXPANDED_APPS = 2; // Default maximum expanded apps per workspace
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
    maxExpandedApps: DEFAULT_MAX_EXPANDED_APPS,
    activeAppId: null,
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
      maxExpandedApps: DEFAULT_MAX_EXPANDED_APPS,
      activeAppId: null,
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

  WORKSPACE_MAX_EXPANDED_APPS_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];
    if (!workspace) return context;

    // Validate the new max value (must be at least 1)
    if (event.maxExpandedApps < 1) {
      console.warn(
        `[workspaceStore] Cannot set maxExpandedApps to ${event.maxExpandedApps}: must be at least 1`,
      );
      return context;
    }

    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      maxExpandedApps: event.maxExpandedApps,
    };

    // If the new limit is lower than current expanded apps, we need to compact some
    const workspaceChatApps = Object.values(context.chatApps).filter(
      (app) =>
        app.workspaceId === event.workspaceId && app.status === "expanded",
    );

    let updatedChatApps = context.chatApps;
    if (workspaceChatApps.length > event.maxExpandedApps) {
      // Compact the oldest expanded apps (keep the most recent ones)
      const sortedApps = workspaceChatApps.sort(
        (a, b) =>
          // Sort by lastActiveAt (oldest first, so we compact the oldest ones)
          a.lastActiveAt.getTime() - b.lastActiveAt.getTime(),
      );

      const appsToCompact = sortedApps.slice(
        0,
        workspaceChatApps.length - event.maxExpandedApps,
      );

      updatedChatApps = { ...context.chatApps };
      for (const app of appsToCompact) {
        updatedChatApps[app.id] = {
          ...app,
          status: "compact",
        };
      }
    }

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: updatedChatApps,
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
        lastActiveAt: new Date(),
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
        lastActiveAt: new Date(),
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
    const workspace = context.workspaces[event.workspaceId];

    if (!app || !workspace || app.workspaceId !== event.workspaceId) {
      return context;
    }

    // Get current expanded apps in this workspace
    const workspaceExpandedApps = Object.values(context.chatApps).filter(
      (chatApp) =>
        chatApp.workspaceId === event.workspaceId &&
        chatApp.status === "expanded" &&
        !chatApp.isArchived,
    );

    const updatedChatApps = { ...context.chatApps };

    // If we're at the max limit, compact the oldest expanded app
    if (workspaceExpandedApps.length >= workspace.maxExpandedApps) {
      // Sort by lastActiveAt (oldest first)
      const sortedExpandedApps = workspaceExpandedApps.sort(
        (a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime(),
      );

      // Compact the oldest expanded app
      const appToCompact = sortedExpandedApps[0];
      updatedChatApps[appToCompact.id] = {
        ...appToCompact,
        status: "compact",
      };
    }

    // Expand the target app and update its timestamp
    updatedChatApps[event.appId] = {
      ...app,
      status: "expanded",
      lastActiveAt: new Date(),
    };

    // Update workspace to track the new active app
    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      activeAppId: event.appId,
      lastActiveAt: new Date(),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: updatedChatApps,
    };
  },

  CHAT_APP_COMPACTED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_COMPACTED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    const workspace = context.workspaces[event.workspaceId];

    if (!app || !workspace || app.workspaceId !== event.workspaceId) {
      return context;
    }

    // Update the app status to compact and timestamp
    const updatedApp: ChatAppEntry = {
      ...app,
      status: "compact",
      lastActiveAt: new Date(),
    };

    let updatedWorkspace = workspace;

    // If this was the active app, we need to find a new active app
    // The most recently active expanded app should become the new active app
    if (workspace.activeAppId === event.appId) {
      const workspaceExpandedApps = Object.values(context.chatApps).filter(
        (chatApp) =>
          chatApp.workspaceId === event.workspaceId &&
          chatApp.status === "expanded" &&
          !chatApp.isArchived &&
          chatApp.id !== event.appId, // Exclude the app being compacted
      );

      // Find the most recently active expanded app
      const newActiveApp = workspaceExpandedApps.sort(
        (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime(),
      )[0];

      updatedWorkspace = {
        ...workspace,
        activeAppId: newActiveApp?.id || null,
        lastActiveAt: new Date(),
      };
    }

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: {
        ...context.chatApps,
        [event.appId]: updatedApp,
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

  // ---------------------------------------------------------------------------
  // Sophisticated Chat App State Machine Handlers
  // ---------------------------------------------------------------------------

  CHAT_APP_ACTIVATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_ACTIVATED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    const workspace = context.workspaces[event.workspaceId];

    if (!app || !workspace || app.workspaceId !== event.workspaceId) {
      return context;
    }

    // Update workspace to track the new active app
    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      activeAppId: event.appId,
      lastActiveAt: new Date(),
    };

    // Update the app's lastActiveAt timestamp
    const updatedApp: ChatAppEntry = {
      ...app,
      lastActiveAt: new Date(),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: {
        ...context.chatApps,
        [event.appId]: updatedApp,
      },
    };
  },

  CHAT_APP_STASHED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_STASHED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    const workspace = context.workspaces[event.workspaceId];

    if (!app || !workspace || app.workspaceId !== event.workspaceId) {
      return context;
    }

    // Update the app status to stashed
    const updatedApp: ChatAppEntry = {
      ...app,
      status: "stashed",
      lastActiveAt: new Date(),
    };

    let updatedWorkspace = workspace;

    // If this was the active app, clear the activeAppId
    if (workspace.activeAppId === event.appId) {
      updatedWorkspace = {
        ...workspace,
        activeAppId: null,
      };
    }

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: {
        ...context.chatApps,
        [event.appId]: updatedApp,
      },
    };
  },

  CHAT_APP_FOCUS_ENTERED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_FOCUS_ENTERED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    const workspace = context.workspaces[event.workspaceId];

    if (!app || !workspace || app.workspaceId !== event.workspaceId) {
      return context;
    }

    // In focus mode, the target app becomes expanded and all others in the workspace become hidden
    const workspaceChatApps = Object.values(context.chatApps).filter(
      (chatApp) =>
        chatApp.workspaceId === event.workspaceId && !chatApp.isArchived,
    );

    const updatedChatApps = { ...context.chatApps };

    // Set the focused app to expanded and update its timestamp
    updatedChatApps[event.appId] = {
      ...app,
      status: "expanded",
      lastActiveAt: new Date(),
    };

    // Store the previous states of other apps so we can restore them later
    // Only hide apps that were visible (expanded or compact), preserve stashed apps
    for (const chatApp of workspaceChatApps) {
      if (
        chatApp.id !== event.appId &&
        (chatApp.status === "expanded" || chatApp.status === "compact")
      ) {
        updatedChatApps[chatApp.id] = {
          ...chatApp,
          status: "stashed", // Hide other apps during focus mode
          // Store previous status for restoration
          previousStatus: chatApp.status as "expanded" | "compact",
        };
      }
    }

    // Update workspace to track the active app
    const updatedWorkspace: WorkspaceEntry = {
      ...workspace,
      activeAppId: event.appId,
      lastActiveAt: new Date(),
    };

    return {
      ...context,
      workspaces: {
        ...context.workspaces,
        [event.workspaceId]: updatedWorkspace,
      },
      chatApps: updatedChatApps,
    };
  },

  CHAT_APP_FOCUS_EXITED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_FOCUS_EXITED" }>,
  ): UIState => {
    const workspace = context.workspaces[event.workspaceId];

    if (!workspace) return context;

    // Exit focus mode - restore previous layout
    const workspaceChatApps = Object.values(context.chatApps).filter(
      (chatApp) =>
        chatApp.workspaceId === event.workspaceId && !chatApp.isArchived,
    );

    const updatedChatApps = { ...context.chatApps };

    // Restore apps that were hidden during focus mode to their previous status
    // Only restore apps that have a previousStatus (were hidden during focus)
    for (const chatApp of workspaceChatApps) {
      if (chatApp.status === "stashed" && (chatApp as any).previousStatus) {
        const { previousStatus, ...cleanApp } = chatApp as any;
        updatedChatApps[chatApp.id] = {
          ...cleanApp,
          status: previousStatus,
        };
      }
    }

    return {
      ...context,
      chatApps: updatedChatApps,
    };
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
      WORKSPACE_MAX_EXPANDED_APPS_UPDATED: (context, event) =>
        handlers.WORKSPACE_MAX_EXPANDED_APPS_UPDATED(context, event as any),
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
      CHAT_APP_ACTIVATED: (context, event) =>
        handlers.CHAT_APP_ACTIVATED(context, event as any),
      CHAT_APP_STASHED: (context, event) =>
        handlers.CHAT_APP_STASHED(context, event as any),
      CHAT_APP_FOCUS_ENTERED: (context, event) =>
        handlers.CHAT_APP_FOCUS_ENTERED(context, event as any),
      CHAT_APP_FOCUS_EXITED: (context, event) =>
        handlers.CHAT_APP_FOCUS_EXITED(context, event as any),
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

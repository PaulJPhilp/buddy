import { ChatAppEntry, SpaceEntry, UIState, WorkspaceEntry } from "./types";
import { MAX_WORKSPACES } from "./workspaceStore";

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates a workspace name.
 * - Must be between 1 and 50 characters.
 * - Cannot be only whitespace.
 */
export function validateWorkspaceName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  return name.length > 0 && name.length <= 50;
}

/**
 * Validates a list of available agents for a workspace.
 * - Must contain at least one agent ID.
 * - Agent IDs must be non-empty strings.
 */
export function validateAvailableAgents(agents: string[]): boolean {
  if (!agents || agents.length === 0) {
    return false;
  }
  return agents.every((agent) => agent && agent.trim().length > 0);
}

/**
 * Validates a workspace icon.
 * - Must be a non-empty string.
 */
export function validateWorkspaceIcon(icon: string): boolean {
  return !!icon && icon.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Creation Functions
// ---------------------------------------------------------------------------

let spaceCounter = 0;

/**
 * Generates a unique space ID
 */
export function generateSpaceId(): string {
  spaceCounter++;
  return `space-${Date.now()}-${spaceCounter}`;
}

/**
 * Creates a new SpaceEntry with defaults
 */
export function createSpaceEntry(
  name: string,
  options: {
    color?: string;
    description?: string;
    icon?: string;
    availableAgents: string[];
    layoutPreferences?: Record<string, any>;
  },
): SpaceEntry {
  const now = new Date();
  return {
    id: generateSpaceId(),
    name,
    color: options.color ?? "#3b82f6",
    description: options.description ?? "",
    icon: options.icon ?? "📁",
    createdAt: now,
    lastActiveAt: now,
    isArchived: false,
    availableAgents: [...options.availableAgents],
    layoutPreferences: options.layoutPreferences ?? {},
  };
}

// ---------------------------------------------------------------------------
// Query Functions
// ---------------------------------------------------------------------------

/**
 * Returns all active (non-archived) workspaces
 */
export function getActiveWorkspaces(
  workspaces: Record<string, WorkspaceEntry>,
): WorkspaceEntry[] {
  return Object.values(workspaces).filter((ws) => !ws.isArchived);
}

/**
 * Returns the currently active workspace
 */
export function getCurrentWorkspace(state: UIState): WorkspaceEntry | null {
  if (!state.currentWorkspaceId) return null;
  return state.workspaces[state.currentWorkspaceId] ?? null;
}

/**
 * Returns whether more workspaces can be added (under the limit)
 */
export function canAddMoreWorkspaces(
  workspaces: Record<string, WorkspaceEntry>,
): boolean {
  return getActiveWorkspaces(workspaces).length < MAX_WORKSPACES;
}

/**
 * Returns all active chat apps in a specific workspace
 */
export function getChatAppsInWorkspace(state: UIState, workspaceId: string) {
  return Object.values(state.chatApps).filter(
    (app) => app.workspaceId === workspaceId && !app.isArchived,
  );
}

/**
 * Returns the expanded chat app in a specific workspace (if any)
 */
export function getExpandedChatAppInWorkspace(
  state: UIState,
  workspaceId: string,
): ChatAppEntry | null {
  const apps = getChatAppsInWorkspace(state, workspaceId);
  return apps.find((app) => app.status === "expanded") ?? null;
}

// ---------------------------------------------------------------------------
// Agent Management Functions
// ---------------------------------------------------------------------------

/**
 * Adds an agent to a workspace's available agents
 */
export function addAgentToWorkspace(
  workspace: WorkspaceEntry,
  agentId: string,
): WorkspaceEntry {
  if (workspace.availableAgents.includes(agentId)) {
    return workspace; // Already exists
  }
  return {
    ...workspace,
    availableAgents: [...workspace.availableAgents, agentId],
    lastActiveAt: new Date(),
  };
}

/**
 * Removes an agent from a workspace's available agents
 */
export function removeAgentFromWorkspace(
  workspace: WorkspaceEntry,
  agentId: string,
): WorkspaceEntry {
  // Don't remove if it's the last agent
  if (workspace.availableAgents.length <= 1) {
    return workspace;
  }
  return {
    ...workspace,
    availableAgents: workspace.availableAgents.filter((id) => id !== agentId),
    lastActiveAt: new Date(),
  };
}

/**
 * Checks if an agent can be removed from a workspace
 */
export function canRemoveAgent(
  workspace: WorkspaceEntry,
  agentId: string,
): boolean {
  return (
    workspace.availableAgents.length > 1 &&
    workspace.availableAgents.includes(agentId)
  );
}

// ---------------------------------------------------------------------------
// Migration Functions (for transitioning from tabs to workspaces)
// ---------------------------------------------------------------------------

/**
 * Migrates old tab-based data to workspace-based data
 * This is a utility function for data migration
 */
export function migrateTabsToWorkspaces(oldData: any): {
  workspaces: Record<string, WorkspaceEntry>;
  chatApps: Record<string, ChatAppEntry>;
  currentWorkspaceId: string | null;
} {
  const workspaces: Record<string, WorkspaceEntry> = {};
  const chatApps: Record<string, ChatAppEntry> = {};
  let currentWorkspaceId: string | null = null;

  // Create a default workspace if no tabs exist
  if (!oldData.tabs || Object.keys(oldData.tabs).length === 0) {
    const defaultWorkspace = createSpaceEntry("My Workspace", {
      availableAgents: ["default-agent"],
      description: "Default workspace",
      icon: "🚀",
    });
    workspaces[defaultWorkspace.id] = defaultWorkspace;
    currentWorkspaceId = defaultWorkspace.id;
    return { workspaces, chatApps, currentWorkspaceId };
  }

  // Convert each tab to a workspace
  for (const [tabId, tab] of Object.entries(
    oldData.tabs as Record<string, any>,
  )) {
    const workspace = createSpaceEntry(tab.name || "Untitled", {
      color: tab.color || "#3b82f6",
      availableAgents: ["default-agent"], // Default agent
      description: "",
      icon: "📁",
    });
    workspaces[workspace.id] = workspace;

    // Set as current if this was the active tab
    if (oldData.activeTabId === tabId) {
      currentWorkspaceId = workspace.id;
    }

    // Convert chat apps in this tab to use the new workspace
    if (oldData.chatApps) {
      for (const [appId, app] of Object.entries(
        oldData.chatApps as Record<string, any>,
      )) {
        if (app.tabId === tabId) {
          chatApps[appId] = {
            ...app,
            workspaceId: workspace.id,
            // Remove tabId property
            tabId: undefined,
          };
        }
      }
    }
  }

  // If no current workspace was set, use the first one
  if (!currentWorkspaceId && Object.keys(workspaces).length > 0) {
    currentWorkspaceId = Object.keys(workspaces)[0];
  }

  return { workspaces, chatApps, currentWorkspaceId };
}

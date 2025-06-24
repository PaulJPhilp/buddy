"use client";

import { AppService } from "@/services/app";
import { ChatAppConfig } from "@/types/global";
import type { ChatAppEntry, WorkspaceEntry } from "@/workspace/types";
import {
  useActiveWorkspaces,
  useChatAppsInCurrentWorkspace,
  useCurrentWorkspace,
  useWorkspaceActions,
  useWorkspaceStats,
  useWorkspaceStore,
} from "@/workspace/useWorkspace";
import { Effect, Layer } from "effect";
import type {
  BuddyWorkspaceAPI,
  ChatAppStatus,
  CreateWorkspaceOptions,
  ListChatAppsOptions,
  ListWorkspacesOptions,
  WorkspaceStats,
} from "./llm-workspace-api";
import {
  ChatAppToolError,
  WorkspaceToolError,
  generateWorkspaceId,
  validateChatAppStatus,
  validateWorkspaceId,
} from "./llm-workspace-api";

// Service layer for app operations
const serviceLayer = Layer.mergeAll(AppService.Default);

// Store reference for direct access
let workspaceStoreRef: ReturnType<typeof useWorkspaceStore> | null = null;
let workspaceActionsRef: ReturnType<typeof useWorkspaceActions> | null = null;

/**
 * Initialize the global workspace API
 * This should be called from the app root after hooks are available
 */
export function initializeBuddyWorkspaceAPI(): void {
  console.log("[LLM API] Initializing Buddy Workspace API...");

  // Get store reference (this will be called from within React component)
  const store = useWorkspaceStore();
  const actions = useWorkspaceActions();

  workspaceStoreRef = store;
  workspaceActionsRef = actions;

  // Create the API implementation
  const api: BuddyWorkspaceAPI = {
    // Workspace operations
    createWorkspace: async (
      options: CreateWorkspaceOptions,
    ): Promise<string> => {
      try {
        console.log("[LLM API] Creating workspace:", options);

        if (!options.name?.trim()) {
          throw new WorkspaceToolError("create", "Workspace name is required");
        }

        if (!workspaceActionsRef) {
          throw new WorkspaceToolError(
            "create",
            "Workspace actions not available",
          );
        }

        const workspaceId = workspaceActionsRef.createWorkspace({
          name: options.name,
          description: options.description,
          icon: options.icon || "📁",
          color: options.color || "#3b82f6",
          availableAgents: options.availableAgents || ["default-agent"],
        });

        console.log("[LLM API] Created workspace:", workspaceId);
        return workspaceId;
      } catch (error) {
        console.error("[LLM API] Failed to create workspace:", error);
        throw new WorkspaceToolError("create", String(error), error);
      }
    },

    listWorkspaces: async (
      options?: ListWorkspacesOptions,
    ): Promise<WorkspaceEntry[]> => {
      try {
        console.log("[LLM API] Listing workspaces:", options);

        if (!workspaceStoreRef) {
          throw new WorkspaceToolError("list", "Workspace store not available");
        }

        const state = workspaceStoreRef.getSnapshot().context;
        const workspaces = Object.values(state.workspaces);

        const filtered = options?.includeArchived
          ? workspaces
          : workspaces.filter((w) => !w.isArchived);

        console.log("[LLM API] Found workspaces:", filtered.length);
        return filtered;
      } catch (error) {
        console.error("[LLM API] Failed to list workspaces:", error);
        throw new WorkspaceToolError("list", String(error), error);
      }
    },

    activateWorkspace: async (workspaceId: string): Promise<void> => {
      try {
        console.log("[LLM API] Activating workspace:", workspaceId);

        if (!validateWorkspaceId(workspaceId)) {
          throw new WorkspaceToolError("activate", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new WorkspaceToolError(
            "activate",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.activateWorkspace(workspaceId);
        console.log("[LLM API] Activated workspace:", workspaceId);
      } catch (error) {
        console.error("[LLM API] Failed to activate workspace:", error);
        throw new WorkspaceToolError("activate", String(error), error);
      }
    },

    updateWorkspace: async (
      workspaceId: string,
      updates: Partial<WorkspaceEntry>,
    ): Promise<void> => {
      try {
        console.log("[LLM API] Updating workspace:", workspaceId, updates);

        if (!validateWorkspaceId(workspaceId)) {
          throw new WorkspaceToolError("update", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new WorkspaceToolError(
            "update",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.updateWorkspace(workspaceId, updates);
        console.log("[LLM API] Updated workspace:", workspaceId);
      } catch (error) {
        console.error("[LLM API] Failed to update workspace:", error);
        throw new WorkspaceToolError("update", String(error), error);
      }
    },

    archiveWorkspace: async (workspaceId: string): Promise<void> => {
      try {
        console.log("[LLM API] Archiving workspace:", workspaceId);

        if (!validateWorkspaceId(workspaceId)) {
          throw new WorkspaceToolError("archive", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new WorkspaceToolError(
            "archive",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.archiveWorkspace(workspaceId);
        console.log("[LLM API] Archived workspace:", workspaceId);
      } catch (error) {
        console.error("[LLM API] Failed to archive workspace:", error);
        throw new WorkspaceToolError("archive", String(error), error);
      }
    },

    restoreWorkspace: async (workspaceId: string): Promise<void> => {
      try {
        console.log("[LLM API] Restoring workspace:", workspaceId);

        if (!validateWorkspaceId(workspaceId)) {
          throw new WorkspaceToolError("restore", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new WorkspaceToolError(
            "restore",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.restoreWorkspace(workspaceId);
        console.log("[LLM API] Restored workspace:", workspaceId);
      } catch (error) {
        console.error("[LLM API] Failed to restore workspace:", error);
        throw new WorkspaceToolError("restore", String(error), error);
      }
    },

    // Chat app operations
    addChatApp: async (
      workspaceId: string,
      config: ChatAppConfig | string,
    ): Promise<void> => {
      try {
        console.log("[LLM API] Adding chat app:", workspaceId, config);

        if (!validateWorkspaceId(workspaceId)) {
          throw new ChatAppToolError("add", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new ChatAppToolError("add", "Workspace actions not available");
        }

        let chatAppConfig: ChatAppConfig;

        if (typeof config === "string") {
          // Load predefined config
          const configs = await Effect.runPromise(
            Effect.gen(function* () {
              const appService = yield* AppService;
              return yield* appService.getAll();
            }).pipe(Effect.provide(serviceLayer)),
          );

          const foundConfig = configs.find((c) => c.id === config);
          if (!foundConfig) {
            throw new ChatAppToolError(
              "add",
              `Configuration '${config}' not found`,
            );
          }

          chatAppConfig = foundConfig;
        } else {
          chatAppConfig = config;
        }

        // Ensure the config has the correct workspace ID
        const configWithWorkspace = {
          ...chatAppConfig,
          spaceId: workspaceId,
          workspaceId: workspaceId,
        };

        workspaceActionsRef.addChatApps([configWithWorkspace]);
        console.log("[LLM API] Added chat app:", configWithWorkspace.id);
      } catch (error) {
        console.error("[LLM API] Failed to add chat app:", error);
        throw new ChatAppToolError("add", String(error), error);
      }
    },

    listChatApps: async (
      options?: ListChatAppsOptions,
    ): Promise<ChatAppEntry[]> => {
      try {
        console.log("[LLM API] Listing chat apps:", options);

        if (!workspaceStoreRef) {
          throw new ChatAppToolError("list", "Workspace store not available");
        }

        const state = workspaceStoreRef.getSnapshot().context;
        let chatApps = Object.values(state.chatApps);

        // Filter by workspace
        if (options?.workspaceId) {
          chatApps = chatApps.filter(
            (app) => app.workspaceId === options.workspaceId,
          );
        } else {
          // Use current workspace
          const currentWorkspaceId = state.currentWorkspaceId;
          if (currentWorkspaceId) {
            chatApps = chatApps.filter(
              (app) => app.workspaceId === currentWorkspaceId,
            );
          }
        }

        // Filter by status
        if (options?.status) {
          chatApps = chatApps.filter((app) => app.status === options.status);
        }

        // Filter archived
        if (!options?.includeArchived) {
          chatApps = chatApps.filter((app) => !app.isArchived);
        }

        console.log("[LLM API] Found chat apps:", chatApps.length);
        return chatApps;
      } catch (error) {
        console.error("[LLM API] Failed to list chat apps:", error);
        throw new ChatAppToolError("list", String(error), error);
      }
    },

    setChatAppStatus: async (
      workspaceId: string,
      appId: string,
      status: ChatAppStatus,
    ): Promise<void> => {
      try {
        console.log(
          "[LLM API] Setting chat app status:",
          workspaceId,
          appId,
          status,
        );

        if (!validateWorkspaceId(workspaceId)) {
          throw new ChatAppToolError("setStatus", "Invalid workspace ID");
        }

        if (!appId?.trim()) {
          throw new ChatAppToolError("setStatus", "App ID is required");
        }

        if (!validateChatAppStatus(status)) {
          throw new ChatAppToolError("setStatus", "Invalid status");
        }

        if (!workspaceActionsRef) {
          throw new ChatAppToolError(
            "setStatus",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.setChatAppStatus(workspaceId, appId, status);
        console.log("[LLM API] Set chat app status:", appId, status);
      } catch (error) {
        console.error("[LLM API] Failed to set chat app status:", error);
        throw new ChatAppToolError("setStatus", String(error), error);
      }
    },

    enterFocusMode: async (
      workspaceId: string,
      appId: string,
    ): Promise<void> => {
      try {
        console.log("[LLM API] Entering focus mode:", workspaceId, appId);

        if (!validateWorkspaceId(workspaceId)) {
          throw new ChatAppToolError("enterFocus", "Invalid workspace ID");
        }

        if (!appId?.trim()) {
          throw new ChatAppToolError("enterFocus", "App ID is required");
        }

        if (!workspaceActionsRef) {
          throw new ChatAppToolError(
            "enterFocus",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.enterFocusMode(workspaceId, appId);
        console.log("[LLM API] Entered focus mode:", appId);
      } catch (error) {
        console.error("[LLM API] Failed to enter focus mode:", error);
        throw new ChatAppToolError("enterFocus", String(error), error);
      }
    },

    exitFocusMode: async (workspaceId: string): Promise<void> => {
      try {
        console.log("[LLM API] Exiting focus mode:", workspaceId);

        if (!validateWorkspaceId(workspaceId)) {
          throw new ChatAppToolError("exitFocus", "Invalid workspace ID");
        }

        if (!workspaceActionsRef) {
          throw new ChatAppToolError(
            "exitFocus",
            "Workspace actions not available",
          );
        }

        workspaceActionsRef.exitFocusMode(workspaceId);
        console.log("[LLM API] Exited focus mode:", workspaceId);
      } catch (error) {
        console.error("[LLM API] Failed to exit focus mode:", error);
        throw new ChatAppToolError("exitFocus", String(error), error);
      }
    },

    // Utility operations
    getCurrentWorkspace: async (): Promise<WorkspaceEntry | null> => {
      try {
        console.log("[LLM API] Getting current workspace");

        if (!workspaceStoreRef) {
          throw new WorkspaceToolError(
            "getCurrent",
            "Workspace store not available",
          );
        }

        const state = workspaceStoreRef.getSnapshot().context;
        const currentWorkspaceId = state.currentWorkspaceId;

        if (!currentWorkspaceId) {
          return null;
        }

        const workspace = state.workspaces[currentWorkspaceId];
        console.log("[LLM API] Current workspace:", workspace?.name);
        return workspace || null;
      } catch (error) {
        console.error("[LLM API] Failed to get current workspace:", error);
        throw new WorkspaceToolError("getCurrent", String(error), error);
      }
    },

    getActiveWorkspaces: async (): Promise<WorkspaceEntry[]> => {
      try {
        console.log("[LLM API] Getting active workspaces");

        if (!workspaceStoreRef) {
          throw new WorkspaceToolError(
            "getActive",
            "Workspace store not available",
          );
        }

        const state = workspaceStoreRef.getSnapshot().context;
        const chatApps = Object.values(state.chatApps);
        const activeWorkspaceIds = new Set<string>();

        // Find workspaces with active chat apps
        for (const app of chatApps) {
          if (
            app.status !== "stashed" &&
            app.status !== "closed" &&
            !app.isArchived
          ) {
            activeWorkspaceIds.add(app.workspaceId);
          }
        }

        const activeWorkspaces = Array.from(activeWorkspaceIds)
          .map((id) => state.workspaces[id])
          .filter(Boolean)
          .filter((workspace) => !workspace.isArchived);

        console.log("[LLM API] Active workspaces:", activeWorkspaces.length);
        return activeWorkspaces;
      } catch (error) {
        console.error("[LLM API] Failed to get active workspaces:", error);
        throw new WorkspaceToolError("getActive", String(error), error);
      }
    },

    getWorkspaceStats: async (): Promise<WorkspaceStats> => {
      try {
        console.log("[LLM API] Getting workspace stats");

        if (!workspaceStoreRef) {
          throw new WorkspaceToolError(
            "getStats",
            "Workspace store not available",
          );
        }

        const state = workspaceStoreRef.getSnapshot().context;
        const workspaces = Object.values(state.workspaces);
        const chatApps = Object.values(state.chatApps);

        const activeWorkspaces = workspaces.filter((w) => !w.isArchived);
        const activeChatApps = chatApps.filter(
          (app) =>
            app.status !== "stashed" &&
            app.status !== "closed" &&
            !app.isArchived,
        );

        const stats: WorkspaceStats = {
          totalWorkspaces: workspaces.length,
          activeWorkspaces: activeWorkspaces.length,
          archivedWorkspaces: workspaces.length - activeWorkspaces.length,
          totalChatApps: chatApps.length,
          activeChatApps: activeChatApps.length,
        };

        console.log("[LLM API] Workspace stats:", stats);
        return stats;
      } catch (error) {
        console.error("[LLM API] Failed to get workspace stats:", error);
        throw new WorkspaceToolError("getStats", String(error), error);
      }
    },
  };

  // Attach to window object
  window.buddyWorkspace = api;
  console.log(
    "[LLM API] Buddy Workspace API initialized and attached to window.buddyWorkspace",
  );
}

/**
 * React hook to initialize the API
 * Call this from your main app component
 */
export function useBuddyWorkspaceAPI(): void {
  // Get workspace hooks
  const store = useWorkspaceStore();
  const actions = useWorkspaceActions();

  // Update references
  workspaceStoreRef = store;
  workspaceActionsRef = actions;

  // Initialize API if not already done
  if (!window.buddyWorkspace) {
    initializeBuddyWorkspaceAPI();
  }
}

/**
 * Tool function implementations for LLM
 * These can be called directly by LLMs that support function calling
 */
export const LLM_TOOL_FUNCTIONS = {
  create_workspace: async (args: CreateWorkspaceOptions) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.createWorkspace(args);
  },

  list_workspaces: async (args?: ListWorkspacesOptions) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.listWorkspaces(args);
  },

  activate_workspace: async (args: { workspaceId: string }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    await window.buddyWorkspace.activateWorkspace(args.workspaceId);
    return `Activated workspace: ${args.workspaceId}`;
  },

  update_workspace: async (
    args: { workspaceId: string } & Partial<WorkspaceEntry>,
  ) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    const { workspaceId, ...updates } = args;
    await window.buddyWorkspace.updateWorkspace(workspaceId, updates);
    return `Updated workspace: ${workspaceId}`;
  },

  archive_workspace: async (args: { workspaceId: string }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    await window.buddyWorkspace.archiveWorkspace(args.workspaceId);
    return `Archived workspace: ${args.workspaceId}`;
  },

  add_chat_app: async (args: {
    workspaceId: string;
    configId?: string;
    customConfig?: ChatAppConfig;
  }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    const config = args.configId || args.customConfig;
    if (!config) {
      throw new Error("Either configId or customConfig must be provided");
    }
    await window.buddyWorkspace.addChatApp(args.workspaceId, config);
    return `Added chat app to workspace: ${args.workspaceId}`;
  },

  list_chat_apps: async (args?: ListChatAppsOptions) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.listChatApps(args);
  },

  set_chat_app_status: async (args: {
    workspaceId: string;
    appId: string;
    status: ChatAppStatus;
  }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    await window.buddyWorkspace.setChatAppStatus(
      args.workspaceId,
      args.appId,
      args.status,
    );
    return `Set chat app ${args.appId} status to: ${args.status}`;
  },

  enter_focus_mode: async (args: { workspaceId: string; appId: string }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    await window.buddyWorkspace.enterFocusMode(args.workspaceId, args.appId);
    return `Entered focus mode on app: ${args.appId}`;
  },

  exit_focus_mode: async (args: { workspaceId: string }) => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    await window.buddyWorkspace.exitFocusMode(args.workspaceId);
    return `Exited focus mode in workspace: ${args.workspaceId}`;
  },

  get_current_workspace: async () => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.getCurrentWorkspace();
  },

  get_active_workspaces: async () => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.getActiveWorkspaces();
  },

  get_workspace_stats: async () => {
    if (!window.buddyWorkspace) {
      throw new Error("Buddy Workspace API not initialized");
    }
    return await window.buddyWorkspace.getWorkspaceStats();
  },
} as const;

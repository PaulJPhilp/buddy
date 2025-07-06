"use client";

import { ChatAppsManager } from "@/managers/chat-apps-manager";
import type {
  ChatAppInstance,
  ChatAppStatus,
  ChatAppsManagerError,
  ChatAppsManagerState,
  ChatAppsManagerStats,
} from "@/managers/chat-apps-manager";
import type { ChatAppConfig } from "@/managers/chat-apps-manager/types";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServiceLayer } from "./useServiceLayer";

export interface UseChatAppsManagerOptions {
  readonly workspaceId: string;
  readonly autoInitialize?: boolean;
}

export interface UseChatAppsManagerReturn {
  readonly state: ChatAppsManagerState | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly actions: ChatAppsManagerActions;
}

export interface ChatAppsManagerActions {
  // Lifecycle
  readonly initialize: (workspaceId: string) => Promise<void>;
  readonly cleanup: () => Promise<void>;

  // ChatApp Management
  readonly registerChatApp: (
    appId: string,
    config: ChatAppConfig
  ) => Promise<ChatAppInstance>;
  readonly unregisterChatApp: (appId: string) => Promise<void>;
  readonly updateChatAppConfig: (
    appId: string,
    config: Partial<ChatAppConfig>
  ) => Promise<void>;
  readonly getChatApp: (appId: string) => Promise<ChatAppInstance | null>;
  readonly getAllChatApps: () => Promise<ChatAppInstance[]>;
  readonly getActiveChatApps: () => Promise<ChatAppInstance[]>;

  // Status Management
  readonly activateChatApp: (appId: string) => Promise<void>;
  readonly deactivateChatApp: (appId: string) => Promise<void>;
  readonly expandChatApp: (appId: string) => Promise<void>;
  readonly compactChatApp: (appId: string) => Promise<void>;
  readonly stashChatApp: (appId: string) => Promise<void>;

  // Focus Mode
  readonly enterFocusMode: (appId: string) => Promise<void>;
  readonly exitFocusMode: () => Promise<void>;
  readonly getFocusedApp: () => Promise<string | null>;

  // Workspace Management
  readonly setWorkspaceCapacity: (
    workspaceId: string,
    capacity: number
  ) => Promise<void>;
  readonly getWorkspaceCapacity: (workspaceId: string) => Promise<number>;
  readonly getWorkspaceStats: (workspaceId: string) => Promise<any>;

  // Debug
  readonly debugGetAllWorkspaces: () => Promise<string[]>;
  readonly debugResetState: () => Promise<void>;

  // Additional actions
  readonly getChatAppsInWorkspace: (
    workspaceId: string
  ) => Promise<ChatAppInstance[]>;
  readonly setChatAppStatus: (
    appId: string,
    status: ChatAppStatus
  ) => Promise<void>;
  readonly stashAllAppsInWorkspace: (
    workspaceId: string,
    exceptAppId?: string
  ) => Promise<void>;
  readonly closeAllAppsInWorkspace: (workspaceId: string) => Promise<void>;
  readonly restoreWorkspaceLayout: (workspaceId: string) => Promise<void>;
  readonly getWorkspaceMaxExpandedApps: (
    workspaceId: string
  ) => Promise<number>;
  readonly enforceCapacityLimits: (workspaceId: string) => Promise<void>;
  readonly getExpandedAppsInWorkspace: (
    workspaceId: string
  ) => Promise<ChatAppInstance[]>;
  readonly getChatAppMetrics: (appId: string) => Promise<any>;
  readonly onWorkspaceActivated: (workspaceId: string) => Promise<void>;
  readonly onWorkspaceArchived: (workspaceId: string) => Promise<void>;
  readonly migrateChatAppsToWorkspace: (
    appIds: string[],
    targetWorkspaceId: string
  ) => Promise<void>;
  readonly saveChatAppLayout: (appId: string, layout: any) => Promise<void>;
  readonly restoreChatAppLayout: (appId: string) => Promise<any>;
  readonly saveWorkspaceLayout: (
    workspaceId: string,
    layout: any
  ) => Promise<void>;
  readonly debugGetAllInstances: () => Promise<Record<string, ChatAppInstance>>;
  readonly debugValidateState: () => Promise<boolean>;
  readonly switchChatAppAgent: (
    appId: string,
    agentId: string
  ) => Promise<void>;
  readonly getChatAppAgent: (appId: string) => Promise<string | null>;
}

/**
 * React hook for managing chat apps using ChatAppsManager.
 * Provides centralized management of all chat app instances.
 */
export function useChatAppsManager({
  workspaceId,
  autoInitialize = true,
}: UseChatAppsManagerOptions): UseChatAppsManagerReturn {
  const [state, setState] = useState<ChatAppsManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track subscriptions and prevent memory leaks
  const unsubscribeRef = useRef<(() => Effect.Effect<void>) | null>(null);
  const managerRef = useRef<ChatAppsManager | null>(null);

  // Helper to run Effect programs with error handling
  const runEffect = useCallback(
    <T>(effect: Effect.Effect<T, ChatAppsManagerError>) => {
      return Effect.runPromise(
        effect.pipe(
          Effect.provide(ChatAppsManager.Default),
          Effect.mapError((error) => {
            const message =
              error instanceof Error ? error.message : String(error);
            setError(message);
            throw new Error(message);
          })
        )
      );
    },
    []
  );

  // Initialize the ChatAppsManager service
  useEffect(() => {
    const initializeManager = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const program = Effect.gen(function* () {
          const manager = yield* ChatAppsManager;
          managerRef.current = manager;

          // Initialize the manager
          if (autoInitialize) {
            yield* manager.initialize(workspaceId);
          }

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((newState) => {
            setState(newState);
          });

          // Get initial state
          const initialState = yield* manager.getState();
          setState(initialState);

          return unsubscribe;
        });

        const unsubscribe = await Effect.runPromise(
          program.pipe(Effect.provide(ChatAppsManager.Default))
        );

        unsubscribeRef.current = unsubscribe;
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize ChatAppsManager:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };

    initializeManager();

    return () => {
      // Cleanup subscription
      if (unsubscribeRef.current) {
        Effect.runPromise(unsubscribeRef.current()).catch((err) => {
          console.error("Failed to cleanup subscription:", err);
        });
        unsubscribeRef.current = null;
      }

      // Cleanup manager if it was auto-initialized
      if (managerRef.current && autoInitialize) {
        Effect.runPromise(
          managerRef.current.cleanup().pipe(
            Effect.provide(ChatAppsManager.Default),
            Effect.catchAll((error) =>
              Effect.logWarning(`Failed to cleanup ChatAppsManager: ${error}`)
            )
          )
        ).catch(() => {
          // Silent cleanup
        });
      }

      managerRef.current = null;
    };
  }, [workspaceId, autoInitialize, runEffect]);

  // Action creators
  const actions: ChatAppsManagerActions = {
    initialize: useCallback(
      (workspaceId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.initialize(workspaceId);
          })
        ),
      [runEffect]
    ),

    cleanup: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.cleanup();
          })
        ),
      [runEffect]
    ),

    registerChatApp: useCallback(
      (appId: string, config: ChatAppConfig) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.registerChatApp(workspaceId, appId, config);
          })
        ),
      [workspaceId, runEffect]
    ),

    unregisterChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.unregisterChatApp(appId);
          })
        ),
      [runEffect]
    ),

    updateChatAppConfig: useCallback(
      (appId: string, config: Partial<ChatAppConfig>) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.updateChatAppConfig(appId, config);
          })
        ),
      [runEffect]
    ),

    getChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getChatApp(appId);
          })
        ),
      [runEffect]
    ),

    getAllChatApps: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getAllChatApps();
          })
        ),
      [runEffect]
    ),

    getActiveChatApps: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getActiveChatApps();
          })
        ),
      [runEffect]
    ),

    activateChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.activateChatApp(appId);
          })
        ),
      [runEffect]
    ),

    deactivateChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.deactivateChatApp(appId);
          })
        ),
      [runEffect]
    ),

    expandChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.expandChatApp(appId);
          })
        ),
      [runEffect]
    ),

    compactChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.compactChatApp(appId);
          })
        ),
      [runEffect]
    ),

    stashChatApp: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.stashChatApp(appId);
          })
        ),
      [runEffect]
    ),

    enterFocusMode: useCallback(
      (appId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.enterFocusMode(appId);
          })
        ),
      [runEffect]
    ),

    exitFocusMode: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.exitFocusMode();
          })
        ),
      [runEffect]
    ),

    getFocusedApp: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getFocusedApp();
          })
        ),
      [runEffect]
    ),

    setWorkspaceCapacity: useCallback(
      (workspaceId: string, capacity: number) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.setWorkspaceCapacity(workspaceId, capacity);
          })
        ),
      [runEffect]
    ),

    getWorkspaceCapacity: useCallback(
      (workspaceId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getWorkspaceCapacity(workspaceId);
          })
        ),
      [runEffect]
    ),

    getWorkspaceStats: useCallback(
      (workspaceId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.getWorkspaceStats(workspaceId);
          })
        ),
      [runEffect]
    ),

    debugGetAllWorkspaces: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            return yield* manager.debugGetAllWorkspaces();
          })
        ),
      [runEffect]
    ),

    debugResetState: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.debugResetState();
          })
        ),
      [runEffect]
    ),

    getChatAppsInWorkspace: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.getChatAppsInWorkspace(workspaceId);
      });
      return runEffect(program);
    },

    setChatAppStatus: async (appId, status) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.setChatAppStatus(appId, status);
      });
      return runEffect(program);
    },

    stashAllAppsInWorkspace: async (workspaceId, exceptAppId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.stashAllAppsInWorkspace(
          workspaceId,
          exceptAppId
        );
      });
      return runEffect(program);
    },

    closeAllAppsInWorkspace: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.closeAllAppsInWorkspace(workspaceId);
      });
      return runEffect(program);
    },

    restoreWorkspaceLayout: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.restoreWorkspaceLayout(workspaceId);
      });
      return runEffect(program);
    },

    getWorkspaceMaxExpandedApps: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.getWorkspaceMaxExpandedApps(workspaceId);
      });
      return runEffect(program);
    },

    enforceCapacityLimits: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.enforceCapacityLimits(workspaceId);
      });
      return runEffect(program);
    },

    getExpandedAppsInWorkspace: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.getExpandedAppsInWorkspace(workspaceId);
      });
      return runEffect(program);
    },

    getChatAppMetrics: async (appId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.getChatAppMetrics(appId);
      });
      return runEffect(program);
    },

    onWorkspaceActivated: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.onWorkspaceActivated(workspaceId);
      });
      return runEffect(program);
    },

    onWorkspaceArchived: async (workspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.onWorkspaceArchived(workspaceId);
      });
      return runEffect(program);
    },

    migrateChatAppsToWorkspace: async (appIds, targetWorkspaceId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.migrateChatAppsToWorkspace(
          appIds,
          targetWorkspaceId
        );
      });
      return runEffect(program);
    },

    saveChatAppLayout: async (appId, layout) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.saveChatAppLayout(appId, layout);
      });
      return runEffect(program);
    },

    restoreChatAppLayout: async (appId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.restoreChatAppLayout(appId);
      });
      return runEffect(program);
    },

    saveWorkspaceLayout: async (workspaceId, layout) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.saveWorkspaceLayout(workspaceId, layout);
      });
      return runEffect(program);
    },

    debugGetAllInstances: async () => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.debugGetAllInstances();
      });
      return runEffect(program);
    },

    debugValidateState: async () => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.debugValidateState();
      });
      return runEffect(program);
    },

    switchChatAppAgent: async (appId, agentId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.switchChatAppAgent(appId, agentId);
      });
      return runEffect(program);
    },

    getChatAppAgent: async (appId) => {
      const program = Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        return yield* chatAppsManager.getChatAppAgent(appId);
      });
      return runEffect(program);
    },
  };

  return {
    state,
    isLoading,
    error,
    actions,
  };
}

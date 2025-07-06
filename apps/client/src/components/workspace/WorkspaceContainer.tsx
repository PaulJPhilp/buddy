"use client";

import { useEffectContext } from "@/components/EffectProvider";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/types/global";
import { Effect } from "effect";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { WorkspaceComponent } from "./service";
import type {
  WorkspaceComponentConfig,
  WorkspaceComponentState,
} from "./types";

export interface WorkspaceContainerProps {
  config: WorkspaceComponentConfig;
  children?: React.ReactNode;
  onStateChange?: (state: WorkspaceComponentState) => void;
  onWorkspaceLoaded?: (workspace: WorkspaceConfig) => void;
  onChatAppActivated?: (chatApp: ChatAppConfig) => void;
}

/**
 * React wrapper for WorkspaceComponent v2 service
 *
 * This component provides a React interface to the WorkspaceComponent Effect service,
 * handling workspace management, chat app coordination, and UI rendering.
 *
 * Features:
 * - Workspace loading and switching
 * - Chat app management
 * - Agent coordination
 * - Real-time state updates
 * - Error handling
 */
export function WorkspaceContainer({
  config,
  children,
  onStateChange,
  onWorkspaceLoaded,
  onChatAppActivated,
}: WorkspaceContainerProps) {
  const { runWithServices } = useEffectContext();

  // Local React state for UI concerns
  const [state, setState] = useState<WorkspaceComponentState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the WorkspaceComponent service
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.initialize(config);

            // Get initial state
            const initialState = yield* workspaceComponent.getState();
            setState(initialState);
            setIsInitialized(true);

            // Set up state subscription
            const unsubscribe = yield* workspaceComponent.subscribe(
              (newState) => {
                setState(newState);
                onStateChange?.(newState);
              },
            );

            return unsubscribe;
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize workspace";
        setError(errorMessage);
        console.error("[WorkspaceContainer] Initialization error:", err);
      }
    };

    initializeWorkspace();
  }, [config, runWithServices, onStateChange]);

  // Load workspace
  const loadWorkspace = useCallback(
    async (workspace: WorkspaceConfig) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.loadWorkspace(workspace);
          }),
        );

        onWorkspaceLoaded?.(workspace);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load workspace";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onWorkspaceLoaded],
  );

  // Switch workspace
  const switchWorkspace = useCallback(
    async (workspace: WorkspaceConfig) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.switchWorkspace(workspace);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to switch workspace";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices],
  );

  // Load chat apps
  const loadChatApps = useCallback(
    async (chatApps: ChatAppConfig[]) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.loadChatApps(chatApps);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load chat apps";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices],
  );

  // Load agents
  const loadAgents = useCallback(
    async (agents: AgentConfig[]) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.loadAgents(agents);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load agents";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices],
  );

  // Get workspace configuration
  const getWorkspaceConfig = useCallback(async () => {
    try {
      return await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          return yield* workspaceComponent.getWorkspaceConfig();
        }),
      );
    } catch (err) {
      console.error(
        "[WorkspaceContainer] Failed to get workspace config:",
        err,
      );
      return null;
    }
  }, [runWithServices]);

  // Get available chat apps
  const getAvailableChatApps = useCallback(async () => {
    try {
      return await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          return yield* workspaceComponent.getAvailableChatApps();
        }),
      );
    } catch (err) {
      console.error(
        "[WorkspaceContainer] Failed to get available chat apps:",
        err,
      );
      return [];
    }
  }, [runWithServices]);

  // Get active chat apps
  const getActiveChatApps = useCallback(async () => {
    try {
      return await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          return yield* workspaceComponent.getActiveChatApps();
        }),
      );
    } catch (err) {
      console.error(
        "[WorkspaceContainer] Failed to get active chat apps:",
        err,
      );
      return [];
    }
  }, [runWithServices]);

  // Activate chat app
  const activateChatApp = useCallback(
    async (chatAppId: string) => {
      try {
        setError(null);
        const chatApp = await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.activateChatApp(chatAppId);

            // Get the activated chat app
            const activeChatApps =
              yield* workspaceComponent.getActiveChatApps();
            return activeChatApps.find((app) => app.id === chatAppId) || null;
          }),
        );

        if (chatApp) {
          onChatAppActivated?.(chatApp);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to activate chat app";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onChatAppActivated],
  );

  // Deactivate chat app
  const deactivateChatApp = useCallback(
    async (chatAppId: string) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.deactivateChatApp(chatAppId);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to deactivate chat app";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices],
  );

  // Render workspace UI
  const renderWorkspaceUI = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.renderWorkspaceUI();
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to render workspace UI";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.cleanup();
        }),
      ).catch(console.error);
    };
  }, [runWithServices]);

  // Provide context to children
  const contextValue = {
    state,
    isInitialized,
    error,
    loadWorkspace,
    switchWorkspace,
    loadChatApps,
    loadAgents,
    getWorkspaceConfig,
    getAvailableChatApps,
    getActiveChatApps,
    activateChatApp,
    deactivateChatApp,
    renderWorkspaceUI,
  };

  // Render with error boundary
  if (error && !isInitialized) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Workspace Initialization Error
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContainerContext.Provider value={contextValue}>
      {children}
    </WorkspaceContainerContext.Provider>
  );
}

// Context for child components to access workspace functionality
interface WorkspaceContainerContextValue {
  state: WorkspaceComponentState | null;
  isInitialized: boolean;
  error: string | null;
  loadWorkspace: (workspace: WorkspaceConfig) => Promise<void>;
  switchWorkspace: (workspace: WorkspaceConfig) => Promise<void>;
  loadChatApps: (chatApps: ChatAppConfig[]) => Promise<void>;
  loadAgents: (agents: AgentConfig[]) => Promise<void>;
  getWorkspaceConfig: () => Promise<WorkspaceConfig | null>;
  getAvailableChatApps: () => Promise<ChatAppConfig[]>;
  getActiveChatApps: () => Promise<ChatAppConfig[]>;
  activateChatApp: (chatAppId: string) => Promise<void>;
  deactivateChatApp: (chatAppId: string) => Promise<void>;
  renderWorkspaceUI: () => Promise<void>;
}

const WorkspaceContainerContext =
  createContext<WorkspaceContainerContextValue | null>(null);

export function useWorkspaceContainer() {
  const context = useContext(WorkspaceContainerContext);
  if (!context) {
    throw new Error(
      "useWorkspaceContainer must be used within a WorkspaceContainer",
    );
  }
  return context;
}

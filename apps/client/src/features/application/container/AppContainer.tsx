"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import type { AppDomainModel } from "../manager/types";
import type { Workspace as WorkspaceModel } from "@buddy/config/types/workspace";
import { ApplicationManager } from "../manager/service";
import type { AppComponentConfig, AppComponentState } from "../manager/types";

export interface AppContainerProps {
  config: AppComponentConfig;
  children?: React.ReactNode;
  onStateChangeAction?: (state: AppComponentState) => void;
  onConfigLoadedAction?: (config: AppDomainModel) => void;
  onWorkspaceChangedAction?: (workspace: WorkspaceModel | null) => void;
}

/**
 * React wrapper for ApplicationManager v2 service
 *
 * This component provides a React interface to the ApplicationManager Effect service,
 * handling initialization, state management, and lifecycle events.
 *
 * Features:
 * - Automatic service initialization
 * - Real-time state updates
 * - Configuration loading
 * - Workspace management
 * - Error handling
 */
export function AppContainer({
  config,
  children,
  onStateChangeAction,
  onConfigLoadedAction,
  onWorkspaceChangedAction,
}: AppContainerProps): React.ReactNode {
  const { runWithServices } = useEffectContext();

  // Local React state for UI concerns  
  const [state, setState] = useState<any>(null); // Using any since AppState and AppComponentState don't match
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the ApplicationManager service
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* ApplicationManager;
            const state = yield* ApplicationManager.pipe(
              Effect.flatMap((manager) => manager.getState())
            );
            setState(state);
            setIsInitialized(true);
            // Note: AppState doesn't match AppComponentState, so we cast it
            onStateChangeAction?.(state as any);
          }),
        );
      } catch (err) {
        console.error("[AppContainer] Failed to initialize:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize app",
        );
      }
    };

    initializeApp();
  }, [config, runWithServices, onStateChangeAction]);

  // Load configuration
  const loadConfig = useCallback(
    async (configPath?: string) => {
      try {
        setError(null);
        const appConfig = await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* ApplicationManager;
            return yield* appComponent.loadConfig(configPath);
          }),
        );

        onConfigLoadedAction?.(appConfig);
        return appConfig;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load config";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onConfigLoadedAction],
  );

  // Set current workspace - TODO: implement when API supports it
  const setCurrentWorkspace = useCallback(
    async (workspaceId: string) => {
      console.warn("[AppContainer] setCurrentWorkspace not implemented");
      // TODO: ApplicationManagerApi doesn't have this method yet
    },
    [],
  );

  // Get current workspace - TODO: implement when API supports it
  const getCurrentWorkspace = useCallback(async () => {
    console.warn("[AppContainer] getCurrentWorkspace not implemented");
    return null;
  }, []);

  // Get all workspaces - TODO: implement when API supports it
  const getWorkspaces = useCallback(async () => {
    console.warn("[AppContainer] getWorkspaces not implemented");
    return [];
  }, []);

  // Render app shell - TODO: implement when API supports it
  const renderAppShell = useCallback(async () => {
    console.warn("[AppContainer] renderAppShell not implemented");
  }, []);

  // Cleanup on unmount - TODO: implement when API supports it
  useEffect(() => {
    return () => {
      // TODO: ApplicationManagerApi doesn't have cleanup method yet
    };
  }, []);

  // Provide context to children
  const contextValue = {
    state,
    isInitialized,
    error,
    loadConfig,
    setCurrentWorkspace,
    getCurrentWorkspace,
    getWorkspaces,
    renderAppShell,
  };

  // Render with error boundary
  if (error && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            App Initialization Error
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContainerContext.Provider value={contextValue}>
      {children}
    </AppContainerContext.Provider>
  );
}

// Context for child components to access app functionality
import { createContext, useContext } from "react";

interface AppContainerContextValue {
  state: AppComponentState | null;
  isInitialized: boolean;
  error: string | null;
  loadConfig: (configPath?: string) => Promise<AppDomainModel>;
  setCurrentWorkspace: (workspaceId: string) => Promise<void>;
  getCurrentWorkspace: () => Promise<WorkspaceModel | null>;
  getWorkspaces: () => Promise<WorkspaceModel[]>;
  renderAppShell: () => Promise<void>;
}

const AppContainerContext = createContext<AppContainerContextValue | null>(
  null,
);

export function useAppContainer() {
  const context = useContext(AppContainerContext);
  if (!context) {
    throw new Error("useAppContainer must be used within an AppContainer");
  }
  return context;
}

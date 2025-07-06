"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import type { AppDomainModel, WorkspaceModel } from "../../domain";
import { AppComponent } from "./service";
import type { AppComponentConfig, AppComponentState } from "./types";

export interface AppContainerProps {
  config: AppComponentConfig;
  children?: React.ReactNode;
  onStateChange?: (state: AppComponentState) => void;
  onConfigLoaded?: (config: AppDomainModel) => void;
  onWorkspaceChanged?: (workspace: WorkspaceModel | null) => void;
}

/**
 * React wrapper for AppComponent v2 service
 *
 * This component provides a React interface to the AppComponent Effect service,
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
  onStateChange,
  onConfigLoaded,
  onWorkspaceChanged,
}: AppContainerProps) {
  const { runWithServices } = useEffectContext();

  // Local React state for UI concerns
  const [state, setState] = useState<AppComponentState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the AppComponent service
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            yield* appComponent.initialize(config);

            // Get initial state
            const initialState = yield* appComponent.getState();
            setState(initialState);
            setIsInitialized(true);

            // Set up state subscription
            const unsubscribe = yield* appComponent.subscribe((newState) => {
              setState(newState);
              onStateChange?.(newState);
            });

            return unsubscribe;
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize app";
        setError(errorMessage);
        console.error("[AppContainer] Initialization error:", err);
      }
    };

    initializeApp();
  }, [config, runWithServices, onStateChange]);

  // Load configuration
  const loadConfig = useCallback(
    async (configPath?: string) => {
      try {
        setError(null);
        const appConfig = await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            return yield* appComponent.loadConfig(configPath);
          }),
        );

        onConfigLoaded?.(appConfig);
        return appConfig;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load config";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onConfigLoaded],
  );

  // Set current workspace
  const setCurrentWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            yield* appComponent.setCurrentWorkspace(workspaceId);

            // Get the updated workspace
            const workspace = yield* appComponent.getCurrentWorkspace();
            onWorkspaceChanged?.(workspace);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to set workspace";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onWorkspaceChanged],
  );

  // Get current workspace
  const getCurrentWorkspace = useCallback(async () => {
    try {
      return await runWithServices(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          return yield* appComponent.getCurrentWorkspace();
        }),
      );
    } catch (err) {
      console.error("[AppContainer] Failed to get current workspace:", err);
      return null;
    }
  }, [runWithServices]);

  // Get all workspaces
  const getWorkspaces = useCallback(async () => {
    try {
      return await runWithServices(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          return yield* appComponent.getWorkspaces();
        }),
      );
    } catch (err) {
      console.error("[AppContainer] Failed to get workspaces:", err);
      return [];
    }
  }, [runWithServices]);

  // Render app shell
  const renderAppShell = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          yield* appComponent.renderAppShell();
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to render app shell";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runWithServices(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          yield* appComponent.cleanup();
        }),
      ).catch(console.error);
    };
  }, [runWithServices]);

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

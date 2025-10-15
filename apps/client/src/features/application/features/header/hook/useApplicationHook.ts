import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { ApplicationManager } from "@/features/application/manager/service";

import type { AppConfig } from "@/features/application/types/AppConfig";

interface ApplicationHookState {
  readonly appConfig: AppConfig | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isConfigLoaded: boolean; // From AppComponent's state
}

const createDefaultHookState = (): ApplicationHookState => ({
  appConfig: null,
  isLoading: false,
  error: null,
  isConfigLoaded: false,
});

export function useApplication() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<ApplicationHookState>(
    createDefaultHookState
  );

  const updateState = useCallback((updates: Partial<ApplicationHookState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const handleError = useCallback(
    (error: unknown, operation: string) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unknown error in ${operation}`;
      console.error(`useApplication hook ${operation} error:`, error);
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Function to load application config
  const loadAppConfig = useCallback(
    async (path?: string) => {
      updateState({ isLoading: true, error: null });
      try {
        const appConfig = await runWithServices(
          ApplicationManager.pipe(
            Effect.flatMap((manager) => manager.loadConfig(path))
          )
        );
        updateState({ appConfig, isLoading: false, isConfigLoaded: true });
      } catch (e) {
        handleError(e, "loadAppConfig");
        throw e;
      }
    },
    [runWithServices, updateState, handleError]
  );

  // Function to get current application config (from manager's state)
  const loadConfig = useCallback(() => {
    updateState({ isLoading: true, error: null });
    runWithServices(
      ApplicationManager.pipe(
        Effect.flatMap((manager) => manager.getState()),
        Effect.tap((config) => updateState({ appConfig: config as any, isLoading: false })),
        Effect.catchAll((err) =>
          Effect.succeed(handleError(err as any, "loadConfig"))
        )
      )
    ).catch((err) => {
      console.error("Error loading config:", err);
      handleError(err, "loadConfig");
    });
  }, [runWithServices, updateState, handleError]);

  // Initial load of config on mount
  useEffect(() => {
    // It might be loaded by AppComponent already if other services initialized it
    loadConfig();
  }, [loadConfig]);

  return {
    appConfig: state.appConfig,
    isLoading: state.isLoading,
    error: state.error,
    isConfigLoaded: state.isConfigLoaded,
    loadAppConfig,
    loadConfig,
  };
}

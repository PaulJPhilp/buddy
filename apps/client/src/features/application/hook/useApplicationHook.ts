import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { AppComponent } from "../managers/service"; // Still AppComponent, but will be renamed internally

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
    (path?: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          AppComponent.pipe(
            Effect.flatMap((manager) => manager.loadConfig(path)),
            Effect.tap((appConfig) =>
              updateState({ appConfig, isLoading: false, isConfigLoaded: true })
            ),
            Effect.catchAll((e) => {
              handleError(e, "loadAppConfig");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Function to get current application config (from manager's state)
  const getAppConfig = useCallback(() => {
    updateState({ isLoading: true, error: null });
    Effect.runPromiseExit(
      runWithServices(
        AppComponent.pipe(
          Effect.flatMap((manager) => manager.getAppConfig()),
          Effect.tap((appConfig) =>
            updateState({
              appConfig,
              isLoading: false,
              isConfigLoaded: !!appConfig,
            })
          ),
          Effect.catchAll((e) => {
            handleError(e, "getAppConfig");
            return Effect.fail(e); // Propagate error
          })
        )
      )
    );
  }, [runWithServices, updateState, handleError]);

  // Initial load of config on mount
  useEffect(() => {
    // It might be loaded by AppComponent already if other services initialized it
    getAppConfig();
  }, [getAppConfig]);

  return {
    appConfig: state.appConfig,
    isLoading: state.isLoading,
    error: state.error,
    isConfigLoaded: state.isConfigLoaded,
    loadAppConfig,
    getAppConfig,
  };
}

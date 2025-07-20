import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { ChatAppsEditorManager } from "../managers/service"; // Import the plural manager

import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";

interface ChatAppsEditorHookState {
  readonly chatApps: ChatAppConfig[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

const createDefaultHookState = (): ChatAppsEditorHookState => ({
  chatApps: [],
  isLoading: false,
  error: null,
});

export function useChatAppsEditor() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<ChatAppsEditorHookState>(
    createDefaultHookState
  );

  const updateState = useCallback(
    (updates: Partial<ChatAppsEditorHookState>) => {
      setState((prevState) => ({ ...prevState, ...updates }));
    },
    []
  );

  const handleError = useCallback(
    (error: unknown, operation: string) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unknown error in ${operation}`;
      console.error(`useChatAppsEditor hook ${operation} error:`, error);
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Functions to interact with the manager
  const loadAllChatApps = useCallback(() => {
    updateState({ isLoading: true, error: null });
    Effect.runPromiseExit(
      runWithServices(
        ChatAppsEditorManager.pipe(
          Effect.flatMap((manager) => manager.getAllChatApps()),
          Effect.tap((apps) =>
            updateState({ chatApps: apps, isLoading: false })
          ),
          Effect.catchAll((e) => {
            handleError(e, "getAllChatApps");
            return Effect.fail(e); // Propagate error
          })
        )
      )
    );
  }, [runWithServices, updateState, handleError]);

  const addChatApp = useCallback(
    (chatApp: ChatAppConfig) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppsEditorManager.pipe(
            Effect.flatMap((manager) => manager.addChatApp(chatApp)),
            Effect.tap(() => loadAllChatApps()), // Reload after adding
            Effect.catchAll((e) => {
              handleError(e, "addChatApp");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, loadAllChatApps, handleError]
  );

  const updateChatApp = useCallback(
    (chatApp: ChatAppConfig) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppsEditorManager.pipe(
            Effect.flatMap((manager) => manager.updateChatApp(chatApp)),
            Effect.tap(() => loadAllChatApps()), // Reload after updating
            Effect.catchAll((e) => {
              handleError(e, "updateChatApp");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, loadAllChatApps, handleError]
  );

  const deleteChatApp = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppsEditorManager.pipe(
            Effect.flatMap((manager) => manager.deleteChatApp(id)),
            Effect.tap(() => loadAllChatApps()), // Reload after deleting
            Effect.catchAll((e) => {
              handleError(e, "deleteChatApp");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, loadAllChatApps, handleError]
  );

  // Load chat apps on mount
  useEffect(() => {
    loadAllChatApps();
  }, [loadAllChatApps]);

  return {
    chatApps: state.chatApps,
    isLoading: state.isLoading,
    error: state.error,
    addChatApp,
    updateChatApp,
    deleteChatApp,
    loadAllChatApps, // Exposed for external triggers if needed
  };
}

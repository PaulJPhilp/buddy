import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { ChatAppEditor } from "../managers/service"; // Import the singular manager

import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";

interface ChatAppEditorHookState {
  readonly currentChatApp: ChatAppConfig | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const createDefaultHookState = (): ChatAppEditorHookState => ({
  currentChatApp: null,
  isLoading: false,
  error: null,
});

export function useChatAppEditor() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<ChatAppEditorHookState>(
    createDefaultHookState
  );

  const updateState = useCallback(
    (updates: Partial<ChatAppEditorHookState>) => {
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
      console.error(`useChatAppEditor hook ${operation} error:`, error);
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Function to set the chat app for editing (local state only)
  const setChatApp = useCallback(
    (chatApp: ChatAppConfig | null) => {
      Effect.runPromiseExit(
        runWithServices(
          ChatAppEditor.pipe(
            Effect.flatMap((manager) => manager.setChatApp(chatApp)),
            Effect.tap(() =>
              updateState({ currentChatApp: chatApp, error: null })
            ),
            Effect.catchAll((e) => {
              handleError(e, "setChatApp (local)");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Load a chat app by ID
  const loadChatAppById = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppEditor.pipe(
            Effect.flatMap((manager) => manager.loadChatAppById(id)),
            Effect.tap((chatApp) =>
              updateState({ currentChatApp: chatApp, isLoading: false })
            ),
            Effect.catchAll((e) => {
              handleError(e, "loadChatAppById");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Save (create or update) a chat app
  const saveChatApp = useCallback(
    (chatApp: ChatAppConfig) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppEditor.pipe(
            Effect.flatMap((manager) => manager.saveChatApp(chatApp)),
            Effect.tap((savedApp) =>
              updateState({ currentChatApp: savedApp, isLoading: false })
            ),
            Effect.catchAll((e) => {
              handleError(e, "saveChatApp");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Delete a chat app
  const deleteChatApp = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          ChatAppEditor.pipe(
            Effect.flatMap((manager) => manager.deleteChatApp(id)),
            Effect.tap(() =>
              updateState({ currentChatApp: null, isLoading: false })
            ),
            Effect.catchAll((e) => {
              handleError(e, "deleteChatApp");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Load initial chat app on mount if an ID is somehow pre-set (unlikely for singular editor without explicit ID)
  // This useEffect could be removed or modified if the container explicitly passes an ID.
  useEffect(() => {
    // If you need to load an initial chat app based on some context (e.g., URL param),
    // you would call loadChatAppById here.
    // For now, it will just get the initial Ref state.
    updateState({ isLoading: true, error: null });
    Effect.runPromiseExit(
      runWithServices(
        ChatAppEditor.pipe(
          Effect.flatMap((manager) => manager.getChatApp()),
          Effect.tap((chatApp) =>
            updateState({ currentChatApp: chatApp, isLoading: false })
          ),
          Effect.catchAll((e) => {
            handleError(e, "getChatApp (initial load)");
            return Effect.fail(e); // Propagate error
          })
        )
      )
    );
  }, [runWithServices, updateState, handleError]);

  return {
    currentChatApp: state.currentChatApp,
    isLoading: state.isLoading,
    error: state.error,
    setChatApp, // For local state manipulation by UI
    loadChatAppById,
    saveChatApp,
    deleteChatApp,
  };
}

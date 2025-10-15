import { useEffectContext } from "@/components/EffectProvider";
import { ChatAppsManager } from "@/features/chatapps/manager";
import type { ChatAppInstance, ChatMessage } from "@/features/chatapps/manager/types";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";

import type { WorkspaceId } from "@/features/workspace/managers/workspace-manager/types";

/**
 * Custom hook to manage chat applications within a workspace.
 * Provides state and actions for interacting with ChatAppsManager.
 */
export function useChatAppsManager(workspaceId?: WorkspaceId) {
  const { runWithServices } = useEffectContext();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatAppInstances, setChatAppInstances] = useState<
    Record<string, ChatAppInstance>
  >({});
  const [activeChatAppId, setActiveChatAppId] = useState<string | null>(null);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [stats, setStats] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<any>(null); // Use a more specific type if available

  // This effect provides the ChatAppsManager to the Effect runtime
  // and subscribes to its state changes.
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const run = runWithServices(
      Effect.gen(function* () {
        setIsLoading(true);
        const manager = yield* ChatAppsManager;

        // Initial state load
        const initialState = yield* manager.getState();
        setChatAppInstances(initialState.chatAppInstances);
        setActiveChatAppId(initialState.activeAppId);
        setFocusModeActive(initialState.focusMode.isActive);
        setStats(initialState.stats);
        setError(initialState.lastError);
        setLastOperation(initialState.lastOperation);

        // Subscribe to future state changes
        unsubscribe = yield* manager.subscribe((newState) => {
          setChatAppInstances(newState.chatAppInstances);
          setActiveChatAppId(newState.activeAppId);
          setFocusModeActive(newState.focusMode.isActive);
          setStats(newState.stats);
          setError(newState.lastError);
          setLastOperation(newState.lastOperation);
        });

        setIsReady(true);
        setIsLoading(false);
      }).pipe(
        Effect.catchAll((err) =>
          Effect.succeed({
            _tag: "ChatAppsManagerInitializationError",
            message: `Failed to initialize ChatAppsManager: ${err}`,
            error: err,
          })
        )
      )
    );

    run.catch((err) => {
      console.error("Error initializing ChatAppsManager in hook:", err);
      setError(err.message || String(err));
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [workspaceId, runWithServices]);

  // Commands/Actions
  const dispatch = useCallback((command: any) => {
    // Replace 'any' with specific command types as needed
    runWithServices(
      Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.dispatch(command);
      })
    ).catch((err) => {
      console.error("Error dispatching command:", err);
      setError(err.message || String(err));
    });
  }, [runWithServices]);

  const registerChatApp = (workspaceId: string, appId: string, config: any) =>
    dispatch({
      _tag: "RegisterChatApp",
      workspaceId,
      appId,
      config,
    });

  const unregisterChatApp = (appId: string) =>
    dispatch({ _tag: "UnregisterChatApp", appId });

  const setChatAppStatus = (appId: string, status: ChatAppInstance["status"]) =>
    dispatch({ _tag: "SetChatAppStatus", appId, status });

  const expandChatApp = (appId: string) =>
    dispatch({ _tag: "ExpandChatApp", appId });

  const compactChatApp = (appId: string) =>
    dispatch({ _tag: "CompactChatApp", appId });

  const stashChatApp = (appId: string) =>
    dispatch({ _tag: "StashChatApp", appId });

  const closeChatApp = (appId: string) =>
    dispatch({ _tag: "CloseChatApp", appId });

  const archiveChatApp = (appId: string) =>
    dispatch({ _tag: "ArchiveChatApp", appId });

  const restoreChatApp = (appId: string) =>
    dispatch({ _tag: "RestoreChatApp", appId });

  const setActiveChatApp = (appId: string) =>
    dispatch({ _tag: "SetActiveChatApp", appId });

  const clearActiveChatApp = () =>
    dispatch({ _tag: "SetActiveChatApp", conversationId: null });

  const enterFocusMode = (appId: string, config?: any) =>
    dispatch({ _tag: "EnterFocusMode", appId, config });

  const exitFocusMode = () => dispatch({ _tag: "ExitFocusMode" });

  const updateChatAppConfig = (appId: string, config: any) =>
    dispatch({ _tag: "UpdateChatAppConfig", appId, config });

  const switchChatAppAgent = (appId: string, agentId: string) =>
    dispatch({ _tag: "SwitchChatAppAgent", appId, agentId });

  const saveChatAppLayout = (appId: string, layout: any) =>
    dispatch({ _tag: "SaveChatAppLayout", appId, layout });

  const saveWorkspaceLayout = (workspaceId: string, layout: any) =>
    dispatch({ _tag: "SaveWorkspaceLayout", workspaceId, layout });

  const restoreWorkspaceLayout = (workspaceId: string) =>
    dispatch({ _tag: "RestoreWorkspaceLayout", workspaceId });

  const onWorkspaceActivated = (activatedWorkspaceId: WorkspaceId) =>
    dispatch({
      _tag: "OnWorkspaceActivated",
      workspaceId: activatedWorkspaceId,
    });

  const onWorkspaceArchived = (archivedWorkspaceId: WorkspaceId) =>
    dispatch({ _tag: "OnWorkspaceArchived", workspaceId: archivedWorkspaceId });

  const getChatAppMessages = useCallback((appId: string) =>
    runWithServices(
      Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        return yield* manager.getChatAppMessages(appId);
      })
    ), [runWithServices]);

  const addChatAppMessage = (appId: string, message: ChatMessage) =>
    dispatch({ _tag: "AddChatAppMessage", appId, message });

  const clearChatAppMessages = (appId: string) =>
    dispatch({ _tag: "ClearChatAppMessages", appId });

  const subscribeToBus = useCallback(() =>
    runWithServices(
      Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        return yield* manager.subscribeToBus();
      })
    ), [runWithServices]);

  const publishMessage = (message: any) =>
    // Replace 'any' with specific message types as needed
    dispatch({ _tag: "PublishMessage", message });

  const getAllChatAppInstances = useCallback(() =>
    runWithServices(
      Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        return yield* manager.getAllChatApps();
      })
    ), [runWithServices]);

  const debugResetState = useCallback(() =>
    runWithServices(
      Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        return yield* manager.debugResetState();
      })
    ), [runWithServices]);

  return {
    isReady,
    isLoading,
    chatAppInstances,
    activeChatAppId,
    focusModeActive,
    stats,
    error,
    lastOperation,
    registerChatApp,
    unregisterChatApp,
    setChatAppStatus,
    expandChatApp,
    compactChatApp,
    stashChatApp,
    closeChatApp,
    archiveChatApp,
    restoreChatApp,
    setActiveChatApp,
    clearActiveChatApp,
    enterFocusMode,
    exitFocusMode,
    updateChatAppConfig,
    switchChatAppAgent,
    saveChatAppLayout,
    saveWorkspaceLayout,
    restoreWorkspaceLayout,
    onWorkspaceActivated,
    onWorkspaceArchived,
    getChatAppMessages,
    addChatAppMessage,
    clearChatAppMessages,
    subscribeToBus,
    publishMessage,
    getAllChatAppInstances,
    debugResetState,
  };
}

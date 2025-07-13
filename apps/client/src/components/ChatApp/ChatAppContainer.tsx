"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { AgentConfig, ChatAppConfig } from "@/types/global";
import type { AgentModel, ChatAppModel } from "@services/config";
import { Effect } from "effect";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ChatAppManagerApi } from "./manager";
import { ChatAppManager } from "./manager-service";
import type {
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppUIState,
} from "./types";

// Utility function to convert ChatAppModel to ChatAppConfig
function convertChatAppModelToConfig(model: ChatAppModel): ChatAppConfig {
  return new ChatAppConfig({
    id: model.id,
    name: model.name,
    agentId: model.agentId || "default-agent",
    toolbarId: "default-toolbar", // Default value since not in model
    themeId: "default-theme", // Default value since not in model
    description: model.description,
    version: model.version,
    // Add other optional fields as needed
  });
}

// Utility function to convert ChatAppConfig to ChatAppModel
function convertChatAppConfigToModel(config: ChatAppConfig): ChatAppModel {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version || "1.0.0",
    agentId: config.agentId,
    workspaceId: undefined,
    permissions: {
      canSendMessages: true,
      canReceiveMessages: true,
      canViewHistory: true,
      canDeleteMessages: false,
      canModifySettings: false,
      canShareConversations: false,
    },
    isDefault: false,
    isShared: false,
    isArchived: false,
    plugins: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };
}

export interface ChatAppContainerProps {
  config: ChatAppComponentConfig;
  children?: React.ReactNode;
  onStateChange?: (state: ChatAppComponentState) => void;
  onChatAppLoaded?: (chatApp: ChatAppModel) => void;
  onAgentSwitched?: (agent: AgentModel) => void;
  onUIStateChanged?: (isVisible: boolean, isExpanded: boolean) => void;
}

/**
 * React wrapper for ChatAppComponent v2 service
 *
 * This component provides a React interface to the ChatAppComponent Effect service,
 * handling individual chat app management, agent coordination, and UI state.
 *
 * Features:
 * - Chat app initialization and management
 * - Agent switching and coordination
 * - UI state management (visibility, expansion)
 * - Real-time state updates
 * - Error handling
 */
export function ChatAppContainer({
  config,
  children,
  onStateChange,
  onChatAppLoaded,
  onAgentSwitched,
  onUIStateChanged,
}: ChatAppContainerProps) {
  const { runWithServices } = useEffectContext();

  // Local React state for UI concerns
  const [state, setState] = useState<ChatAppComponentState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the ChatAppManager service
  useEffect(() => {
    const initializeChatApp = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const chatAppManager = yield* ChatAppManager;

            // Convert config to ChatAppConfig format
            const chatAppConfig = new ChatAppConfig({
              id: config.chatAppId,
              name: config.chatAppId, // Use ID as name if not provided
              agentId: "default-agent", // Default agent
              toolbarId: "default-toolbar",
              themeId: "default-theme",
              description: `Chat app for ${config.chatAppId}`,
              version: "1.0.0",
            });

            yield* chatAppManager.initialize(chatAppConfig);

            // Get initial state
            const initialState = yield* chatAppManager.getState();
            setState(initialState);
            setIsInitialized(true);

            // Set up state subscription
            const unsubscribe = yield* chatAppManager.subscribe((newState) => {
              setState(newState);
              onStateChange?.(newState);

              // Notify about UI state changes
              if (
                newState.uiState.isWindowOpen !== undefined &&
                newState.uiState.isMinimized !== undefined
              ) {
                onUIStateChanged?.(
                  newState.uiState.isWindowOpen,
                  !newState.uiState.isMinimized,
                );
              }
            });

            return unsubscribe;
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize chat app";
        setError(errorMessage);
        console.error("[ChatAppContainer] Initialization error:", err);
      }
    };

    initializeChatApp();
  }, [config, runWithServices, onStateChange, onUIStateChanged]);

  // Load chat app (re-initialize with new config)
  const loadChatApp = useCallback(
    async (chatApp: ChatAppModel) => {
      try {
        setError(null);
        const chatAppConfig = convertChatAppModelToConfig(chatApp);
        await runWithServices(
          Effect.gen(function* () {
            const chatAppManager = yield* ChatAppManager;
            // Cleanup current instance and initialize with new config
            yield* chatAppManager.cleanup();
            yield* chatAppManager.initialize(chatAppConfig);
          }),
        );

        onChatAppLoaded?.(chatApp);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load chat app";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onChatAppLoaded],
  );

  // Switch agent (assign new agent)
  const switchAgent = useCallback(
    async (agent: AgentModel) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const chatAppManager = yield* ChatAppManager;
            // Convert AgentModel to AgentConfig (AgentModel)
            const agentConfig: AgentConfig = {
              id: agent.id,
              name: agent.name,
              description: agent.description,
              version: agent.version,
              provider: agent.provider || "openai",
              model: agent.model || "gpt-4",
              prompt: agent.prompt,
              capabilities: agent.capabilities || [],
              parameters: agent.parameters || {
                temperature: 0.7,
                maxTokens: 2048,
                topP: 1.0,
                frequencyPenalty: 0.0,
                presencePenalty: 0.0,
                stopSequences: [],
                customParameters: {},
              },
              permissions: agent.permissions || {
                canAccessInternet: false,
                canExecuteCode: false,
                canAccessFiles: false,
                canModifyFiles: false,
                canAccessDatabase: false,
                canSendEmails: false,
                allowedDomains: [],
                blockedDomains: [],
              },
              isDefault: agent.isDefault || false,
              isShared: agent.isShared || false,
              isArchived: agent.isArchived || false,
              createdAt: agent.createdAt,
              updatedAt: agent.updatedAt,
              metadata: agent.metadata || {},
            };
            yield* chatAppManager.assignAgent(agentConfig);
          }),
        );

        onAgentSwitched?.(agent);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to switch agent";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices, onAgentSwitched],
  );

  // Get chat app configuration (derived from state)
  const getChatAppConfig = useCallback(async () => {
    try {
      const state = await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          return yield* chatAppManager.getState();
        }),
      );

      if (state?.chatAppConfig) {
        return convertChatAppConfigToModel(state.chatAppConfig);
      }
      return null;
    } catch (err) {
      console.error("[ChatAppContainer] Failed to get chat app config:", err);
      return null;
    }
  }, [runWithServices]);

  // Get current agent
  const getCurrentAgent = useCallback(async () => {
    try {
      const agentConfig = await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          return yield* chatAppManager.getCurrentAgent();
        }),
      );

      if (agentConfig) {
        // Convert AgentConfig to AgentModel
        return {
          id: agentConfig.id,
          name: agentConfig.name,
          description: agentConfig.description,
          version: agentConfig.version,
          provider: agentConfig.provider,
          model: agentConfig.model,
          prompt: agentConfig.prompt,
          capabilities: agentConfig.capabilities,
          parameters: agentConfig.parameters,
          permissions: agentConfig.permissions,
          isDefault: agentConfig.isDefault,
          isShared: agentConfig.isShared,
          isArchived: agentConfig.isArchived,
          createdAt: agentConfig.createdAt,
          updatedAt: agentConfig.updatedAt,
          metadata: agentConfig.metadata,
        };
      }
      return null;
    } catch (err) {
      console.error("[ChatAppContainer] Failed to get current agent:", err);
      return null;
    }
  }, [runWithServices]);

  // Get available agents (return current agent if available)
  const getAvailableAgents = useCallback(async () => {
    try {
      const currentAgent = await getCurrentAgent();
      return currentAgent ? [currentAgent] : [];
    } catch (err) {
      console.error("[ChatAppContainer] Failed to get available agents:", err);
      return [];
    }
  }, [getCurrentAgent]);

  // Show chat app (open window)
  const showChatApp = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          yield* chatAppManager.setUIState({ isWindowOpen: true });
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to show chat app";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Hide chat app (close window)
  const hideChatApp = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          yield* chatAppManager.setUIState({ isWindowOpen: false });
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to hide chat app";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Expand chat app (restore window)
  const expandChatApp = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          yield* chatAppManager.setUIState({ isMinimized: false });
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to expand chat app";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Collapse chat app (minimize window)
  const collapseChatApp = useCallback(async () => {
    try {
      setError(null);
      await runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          yield* chatAppManager.setUIState({ isMinimized: true });
        }),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to collapse chat app";
      setError(errorMessage);
      throw err;
    }
  }, [runWithServices]);

  // Update UI state
  const updateUIState = useCallback(
    async (updates: { isVisible?: boolean; isExpanded?: boolean }) => {
      try {
        setError(null);
        await runWithServices(
          Effect.gen(function* () {
            const chatAppManager = yield* ChatAppManager;
            // Map the updates to the correct UI state properties
            const uiStateUpdates: Partial<ChatAppUIState> = {
              ...(updates.isVisible !== undefined && {
                isWindowOpen: updates.isVisible,
              }),
              ...(updates.isExpanded !== undefined && {
                isMinimized: !updates.isExpanded,
              }),
            };
            yield* chatAppManager.setUIState(uiStateUpdates);
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update UI state";
        setError(errorMessage);
        throw err;
      }
    },
    [runWithServices],
  );

  // Render chat app UI (no-op for ChatAppManager)
  const renderChatAppUI = useCallback(async () => {
    try {
      setError(null);
      // ChatAppManager doesn't have a renderChatAppUI method
      // UI rendering is handled by React components
      console.log("[ChatAppContainer] Render UI requested - handled by React");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to render chat app UI";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runWithServices(
        Effect.gen(function* () {
          const chatAppManager = yield* ChatAppManager;
          yield* chatAppManager.cleanup();
        }),
      ).catch(console.error);
    };
  }, [runWithServices]);

  // Provide context to children
  const contextValue = {
    state,
    isInitialized,
    error,
    loadChatApp,
    switchAgent,
    getChatAppConfig,
    getCurrentAgent,
    getAvailableAgents,
    showChatApp,
    hideChatApp,
    expandChatApp,
    collapseChatApp,
    updateUIState,
    renderChatAppUI,
  };

  // Render with error boundary
  if (error && !isInitialized) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-semibold text-red-800 text-sm mb-1">
          Chat App Error
        </h4>
        <p className="text-red-600 text-xs mb-2">{error}</p>
        <button
          type="button"
          onClick={() => setError(null)}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1" />
          <p className="text-gray-600 text-xs">Loading chat app...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatAppContainerContext.Provider value={contextValue}>
      {children}
    </ChatAppContainerContext.Provider>
  );
}

// Context for child components to access chat app functionality
interface ChatAppContainerContextValue {
  state: ChatAppComponentState | null;
  isInitialized: boolean;
  error: string | null;
  loadChatApp: (chatApp: ChatAppModel) => Promise<void>;
  switchAgent: (agent: AgentModel) => Promise<void>;
  getChatAppConfig: () => Promise<ChatAppModel | null>;
  getCurrentAgent: () => Promise<AgentModel | null>;
  getAvailableAgents: () => Promise<AgentModel[]>;
  showChatApp: () => Promise<void>;
  hideChatApp: () => Promise<void>;
  expandChatApp: () => Promise<void>;
  collapseChatApp: () => Promise<void>;
  updateUIState: (updates: {
    isVisible?: boolean;
    isExpanded?: boolean;
  }) => Promise<void>;
  renderChatAppUI: () => Promise<void>;
}

const ChatAppContainerContext =
  createContext<ChatAppContainerContextValue | null>(null);

export function useChatAppContainer() {
  const context = useContext(ChatAppContainerContext);
  if (!context) {
    throw new Error(
      "useChatAppContainer must be used within a ChatAppContainer",
    );
  }
  return context;
}

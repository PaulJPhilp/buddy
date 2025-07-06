import { CoreComponent } from "@/components/core";
import {
  CoreComponentCleanupError,
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
} from "@/components/core/errors";
import type { CoreComponentConfig } from "@/components/core/types";
import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect, Ref } from "effect";
import type { ChatAppComponentApi } from "./api";
import {
  ChatAppAgentError,
  ChatAppComponentError,
  ChatAppConversationError,
  ChatAppLoadError,
  ChatAppOperationError,
  ChatAppStateError,
  ChatAppUIError,
  ChatAppValidationError,
  ChatAppWindowBoundsError,
  ChatAppWindowError,
} from "./errors";
import type {
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppOperationType,
  ChatAppUIState,
  WindowPosition,
  WindowSize,
  WindowState,
} from "./types";
import {
  calculateNextZIndex,
  createDefaultChatAppState,
  createDefaultUIState,
  filterAgentsForChatApp,
  validateWindowBounds,
} from "./types";

export class ChatAppComponent extends Effect.Service<ChatAppComponentApi>()(
  "ChatAppComponent",
  {
    scoped: Effect.gen(function* () {
      // Get core component functionality
      const coreComponent = yield* CoreComponent;

      // ChatApp-specific state
      const chatAppStateRef = yield* Ref.make<ChatAppComponentState>(
        createDefaultChatAppState()
      );
      const lastOperationRef = yield* Ref.make<ChatAppOperationType | null>(
        null
      );

      // Helper to validate chat app config
      const validateChatAppConfig = (
        config: ChatAppConfig
      ): Effect.Effect<void, ChatAppValidationError> =>
        Effect.gen(function* () {
          if (!config.id) {
            yield* Effect.fail(
              new ChatAppValidationError({
                message: "Chat app must have an ID",
                chatAppId: config.id || "unknown",
                field: "id",
                value: config.id,
              })
            );
          }

          if (!config.name) {
            yield* Effect.fail(
              new ChatAppValidationError({
                message: "Chat app must have a name",
                chatAppId: config.id,
                field: "name",
                value: config.name,
              })
            );
          }
        });

      // Load chat app configuration
      const loadChatApp = (chatAppConfig: ChatAppConfig) =>
        Effect.gen(function* () {
          yield* validateChatAppConfig(chatAppConfig);
          yield* executeOperation("load_config");

          yield* setState({
            chatAppConfig,
            isChatAppLoaded: true,
          });

          yield* Effect.log(`Loaded chat app: ${chatAppConfig.name}`);
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof ChatAppValidationError
              ? cause
              : new ChatAppLoadError({
                  message: "Failed to load chat app",
                  chatAppId: chatAppConfig.id,
                  cause,
                })
          )
        );

      // Get chat app configuration
      const getChatAppConfig = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.chatAppConfig;
        });

      // Reload chat app
      const reloadChatApp = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          if (!state.chatAppConfig) {
            yield* Effect.fail(
              new ChatAppLoadError({
                message: "No chat app config to reload",
                chatAppId: "unknown",
              })
            );
          }
          yield* loadChatApp(state.chatAppConfig);
        });

      // Load agents for chat app
      const loadAgents = (agents: AgentConfig[]) =>
        Effect.gen(function* () {
          const state = yield* getState();

          if (!state.chatAppConfig) {
            yield* Effect.fail(
              new ChatAppAgentError({
                message: "No chat app loaded",
                chatAppId: "unknown",
                operation: "load",
              })
            );
          }

          yield* executeOperation("load_agents");

          const chatAppAgents = filterAgentsForChatApp(
            agents,
            state.chatAppConfig
          );

          yield* setState({
            assignedAgents: chatAppAgents,
          });

          yield* Effect.log(
            `Loaded ${chatAppAgents.length} agents for chat app`
          );
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof ChatAppAgentError
              ? cause
              : new ChatAppAgentError({
                  message: "Failed to load agents",
                  chatAppId: "unknown",
                  operation: "load",
                  cause,
                })
          )
        );

      // Get assigned agents
      const getAssignedAgents = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.assignedAgents;
        });

      // Check if chat app has specific agent
      const hasAgent = (agentId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.assignedAgents.some((agent) => agent.id === agentId);
        });

      // Open window
      const openWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          if (state.uiState.isWindowOpen) {
            return; // Already open
          }

          yield* executeOperation("open_window");

          yield* setUIState({
            isWindowOpen: true,
            isMinimized: false,
            isFocused: true,
            zIndex: calculateNextZIndex(state.uiState.zIndex),
          });

          yield* Effect.log(`Opened chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to open window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "open",
              cause,
            });
          })
        );

      // Close window
      const closeWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("close_window");

          yield* setUIState({
            isWindowOpen: false,
            isMinimized: false,
            isMaximized: false,
            isFocused: false,
          });

          yield* Effect.log(`Closed chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to close window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "close",
              cause,
            });
          })
        );

      // Minimize window
      const minimizeWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("minimize_window");

          yield* setUIState({
            isMinimized: true,
            isMaximized: false,
            isFocused: false,
          });

          yield* Effect.log(`Minimized chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to minimize window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "minimize",
              cause,
            });
          })
        );

      // Maximize window
      const maximizeWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("maximize_window");

          yield* setUIState({
            isMaximized: true,
            isMinimized: false,
            isFocused: true,
          });

          yield* Effect.log(`Maximized chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to maximize window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "maximize",
              cause,
            });
          })
        );

      // Restore window
      const restoreWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("restore_window");

          yield* setUIState({
            isMinimized: false,
            isMaximized: false,
            isFocused: true,
          });

          yield* Effect.log(`Restored chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to restore window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "restore",
              cause,
            });
          })
        );

      // Move window
      const moveWindow = (position: WindowPosition) =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          // Validate bounds (using default screen size for now)
          const screenBounds = { width: 1920, height: 1080 };
          const validated = validateWindowBounds(
            position,
            state.uiState.windowSize,
            screenBounds
          );

          yield* executeOperation("move_window");

          yield* setUIState({
            windowPosition: validated.position,
          });

          yield* Effect.log(`Moved chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to move window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "move",
              cause,
            });
          })
        );

      // Resize window
      const resizeWindow = (size: WindowSize) =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          // Validate bounds
          const screenBounds = { width: 1920, height: 1080 };
          const validated = validateWindowBounds(
            state.uiState.windowPosition,
            size,
            screenBounds
          );

          yield* executeOperation("resize_window");

          yield* setUIState({
            windowSize: validated.size,
            windowPosition: validated.position,
          });

          yield* Effect.log(`Resized chat app window: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to resize window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "resize",
              cause,
            });
          })
        );

      // Focus window
      const focusWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("focus_window");

          yield* setUIState({
            isFocused: true,
            zIndex: calculateNextZIndex(state.uiState.zIndex),
          });

          yield* updateActivity();
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to focus window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "focus",
              cause,
            });
          })
        );

      // Blur window
      const blurWindow = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("blur_window");

          yield* setUIState({
            isFocused: false,
          });
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppWindowError({
              message: "Failed to blur window",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "blur",
              cause,
            });
          })
        );

      // Get window state
      const getWindowState = (): Effect.Effect<
        WindowState,
        ChatAppComponentError
      > =>
        Effect.gen(function* () {
          const state = yield* getState();
          return {
            position: state.uiState.windowPosition,
            size: state.uiState.windowSize,
            isOpen: state.uiState.isWindowOpen,
            isMinimized: state.uiState.isMinimized,
            isMaximized: state.uiState.isMaximized,
            isFocused: state.uiState.isFocused,
            zIndex: state.uiState.zIndex,
          };
        });

      // Get UI state
      const getUIState = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.uiState;
        });

      // Set UI state
      const setUIState = (uiState: Partial<ChatAppUIState>) =>
        Effect.gen(function* () {
          const currentState = yield* getState();
          const newUIState: ChatAppUIState = {
            ...currentState.uiState,
            ...uiState,
          };

          yield* setState({
            uiState: newUIState,
          });
        });

      // Check if window is open
      const isWindowOpen = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.uiState.isWindowOpen;
        });

      // Check if window is focused
      const isWindowFocused = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.uiState.isFocused;
        });

      // Render chat app UI
      const renderChatAppUI = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          if (!state.isChatAppLoaded) {
            yield* Effect.fail(
              new ChatAppUIError({
                message: "Cannot render UI before chat app is loaded",
                chatAppId,
                operation: "render",
              })
            );
          }

          yield* executeOperation("render_ui");

          // In real implementation, this would trigger React rendering
          yield* Effect.log(`Rendering ChatApp UI: ${chatAppId}`);

          yield* setState({ isUIRendered: true });
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return cause instanceof ChatAppUIError
              ? cause
              : new ChatAppUIError({
                  message: "Failed to render chat app UI",
                  chatAppId: state.chatAppConfig?.id || "unknown",
                  operation: "render",
                  cause,
                });
          })
        );

      // Check if UI is rendered
      const isUIRendered = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.isUIRendered;
        });

      // Start conversation
      const startConversation = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("start_conversation");

          yield* setState({
            conversationCount: state.conversationCount + 1,
          });

          yield* updateActivity();
          yield* Effect.log(`Started conversation in chat app: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppConversationError({
              message: "Failed to start conversation",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "start",
              cause,
            });
          })
        );

      // End conversation
      const endConversation = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatAppId = state.chatAppConfig?.id || "unknown";

          yield* executeOperation("end_conversation");

          // Decrement conversation count but don't go below 0
          yield* setState({
            conversationCount: Math.max(0, state.conversationCount - 1),
          });

          yield* updateActivity();
          yield* Effect.log(`Ended conversation in chat app: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppConversationError({
              message: "Failed to end conversation",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation: "end",
              cause,
            });
          })
        );

      // Get conversation count
      const getConversationCount = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.conversationCount;
        });

      // Update activity timestamp
      const updateActivity = () =>
        Effect.gen(function* () {
          yield* setState({
            lastActivity: Date.now(),
          });
        });

      // Get last activity timestamp
      const getLastActivity = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.lastActivity;
        });

      // Execute operation and track it
      const executeOperation = (operation: ChatAppOperationType) =>
        Effect.gen(function* () {
          yield* Ref.set(lastOperationRef, operation);
          yield* Effect.log(`Executing chat app operation: ${operation}`);
        }).pipe(
          Effect.mapError((cause) => {
            const state = Effect.runSync(getState());
            return new ChatAppOperationError({
              message: "Failed to execute operation",
              chatAppId: state.chatAppConfig?.id || "unknown",
              operation,
              cause,
            });
          })
        );

      // Get last operation
      const getLastOperation = () =>
        Effect.gen(function* () {
          return yield* Ref.get(lastOperationRef);
        });

      // Get chat app state
      const getState = () =>
        Effect.gen(function* () {
          return yield* Ref.get(chatAppStateRef);
        });

      // Set chat app state
      const setState = (partialState: Partial<ChatAppComponentState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(chatAppStateRef);
          const newState: ChatAppComponentState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(chatAppStateRef, newState);

          // Also update core component state if needed
          if (
            partialState.isInitialized !== undefined ||
            partialState.isLoading !== undefined
          ) {
            yield* coreComponent.setState({
              isInitialized: newState.isInitialized,
              isLoading: newState.isLoading,
            });
          }
        });

      // Subscribe to state changes
      const subscribe = (callback: (state: ChatAppComponentState) => void) =>
        Effect.gen(function* () {
          // In real implementation, this would use a proper subscription mechanism
          return () => {
            // Unsubscribe logic
          };
        });

      // Initialize chat app component
      const initialize = (config: CoreComponentConfig) =>
        Effect.gen(function* () {
          // Cast to ChatAppComponentConfig since we know this is a chat app component
          const chatAppConfig = config as ChatAppComponentConfig;

          // Validate config first
          if (!chatAppConfig.chatAppId) {
            yield* Effect.fail(
              new ChatAppValidationError({
                message: "Chat app component must have a chatAppId",
                chatAppId: chatAppConfig.chatAppId || "unknown",
                field: "chatAppId",
                value: chatAppConfig.chatAppId,
              })
            );
          }

          yield* coreComponent.initialize(config);

          // Apply default window configuration
          const defaultUIState = createDefaultUIState();
          const uiState: ChatAppUIState = {
            ...defaultUIState,
            windowSize:
              chatAppConfig.defaultWindowSize || defaultUIState.windowSize,
            windowPosition:
              chatAppConfig.defaultWindowPosition ||
              defaultUIState.windowPosition,
          };

          yield* setState({
            isInitialized: true,
            uiState,
          });

          yield* Effect.log(
            `Initialized chat app component: ${chatAppConfig.chatAppId}`
          );
        }).pipe(
          Effect.mapError((cause) => {
            // Map chat app errors to core component errors for interface compliance
            if (
              cause instanceof ChatAppValidationError ||
              cause instanceof ChatAppLoadError
            ) {
              return new CoreComponentInitializationError({
                message: cause.message,
                cause,
              });
            }
            // If it's already a CoreComponentError, pass it through
            if (
              cause instanceof CoreComponentInitializationError ||
              cause instanceof CoreComponentStateError ||
              cause instanceof CoreComponentSubscriptionError ||
              cause instanceof CoreComponentCleanupError
            ) {
              return cause;
            }
            // For any other errors, wrap in CoreComponentInitializationError
            const chatAppConfig = config as ChatAppComponentConfig;
            return new CoreComponentInitializationError({
              message: "Failed to initialize chat app component",
              cause,
            });
          })
        );

      // Cleanup
      const cleanup = () =>
        Effect.gen(function* () {
          yield* coreComponent.cleanup();
          yield* Ref.set(chatAppStateRef, createDefaultChatAppState());
          yield* Ref.set(lastOperationRef, null);
        });

      return {
        // Core component methods
        initialize,
        getState,
        setState,
        subscribe,
        cleanup,

        // ChatApp-specific methods
        loadChatApp,
        getChatAppConfig,
        reloadChatApp,
        loadAgents,
        getAssignedAgents,
        hasAgent,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        moveWindow,
        resizeWindow,
        focusWindow,
        blurWindow,
        getWindowState,
        getUIState,
        setUIState,
        isWindowOpen,
        isWindowFocused,
        renderChatAppUI,
        isUIRendered,
        startConversation,
        endConversation,
        getConversationCount,
        updateActivity,
        getLastActivity,
        executeOperation,
        getLastOperation,
      } satisfies ChatAppComponentApi;
    }),
    dependencies: [CoreComponent.Default],
  }
) {}

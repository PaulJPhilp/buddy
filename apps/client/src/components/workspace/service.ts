import { CoreComponent } from "@/components/core";
import {
  CoreComponentCleanupError,
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
} from "@/components/core/errors";
import type { CoreComponentConfig } from "@/components/core/types";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/types/global";
import { ChatAppsManager } from "@managers/chatapps";
import { Effect, Ref } from "effect";
import type { WorkspaceComponentApi } from "./api";
import {
  WorkspaceAgentError,
  WorkspaceChatAppError,
  WorkspaceConfigurationError,
  WorkspaceInitializationError,
  WorkspaceLoadError,
  WorkspaceOperationError,
  WorkspaceStateError,
  WorkspaceSwitchError,
  WorkspaceUIError,
  WorkspaceValidationError,
} from "./errors";
import type {
  WorkspaceComponentConfig,
  WorkspaceComponentState,
  WorkspaceOperationType,
} from "./types";
import {
  createDefaultWorkspaceState,
  filterAgentsForWorkspace,
  filterChatAppsForWorkspace,
  validateWorkspaceConfig,
} from "./types";

export class WorkspaceComponent extends Effect.Service<WorkspaceComponentApi>()(
  "WorkspaceComponent",
  {
    scoped: Effect.gen(function* () {
      // Get core component functionality
      const coreComponent = yield* CoreComponent;

      // Get chat apps manager
      const chatAppsManager = yield* ChatAppsManager;

      // Workspace-specific state
      const workspaceStateRef = yield* Ref.make<WorkspaceComponentState>(
        createDefaultWorkspaceState()
      );
      const lastOperationRef = yield* Ref.make<WorkspaceOperationType | null>(
        null
      );

      // Helper to execute operations with tracking
      const executeOperation = (operation: WorkspaceOperationType) =>
        Effect.gen(function* () {
          yield* Ref.set(lastOperationRef, operation);
          yield* setState({ isLoading: true });

          // Operation execution is tracked but actual work is done by caller
          yield* setState({ isLoading: false });
        });

      // Helper to validate workspace configuration
      const validateWorkspaceConfigHelper = (
        config: WorkspaceConfig
      ): Effect.Effect<void, WorkspaceValidationError> =>
        Effect.gen(function* () {
          const validation = validateWorkspaceConfig(config);
          if (!validation.isValid) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                message: validation.errors.join(", "),
                workspaceId: config.id,
                field: "config",
                value: config,
              })
            );
          }
        });

      // Load workspace configuration
      const loadWorkspace = (workspaceConfig: WorkspaceConfig) =>
        Effect.gen(function* () {
          yield* validateWorkspaceConfigHelper(workspaceConfig);
          yield* executeOperation("load_config" as WorkspaceOperationType);

          // Set workspace capacity in ChatAppsManager
          yield* chatAppsManager
            .setWorkspaceMaxExpandedApps(
              workspaceConfig.id,
              workspaceConfig.maxExpandedApps || 3
            )
            .pipe(
              Effect.catchAll((error) => {
                console.warn(
                  `Failed to set workspace capacity for ${workspaceConfig.id}:`,
                  error
                );
                return Effect.succeed(undefined);
              })
            );

          yield* setState({
            workspaceConfig,
            isWorkspaceLoaded: true,
          });

          if (workspaceConfig.isDefault) {
            yield* Effect.log(
              `Loaded default workspace: ${workspaceConfig.name}`
            );
          }
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceValidationError
              ? cause
              : new WorkspaceConfigurationError({
                  message: "Failed to load workspace",
                  workspaceId: workspaceConfig.id,
                  cause,
                })
          )
        );

      // Get workspace configuration
      const getWorkspaceConfig = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.workspaceConfig;
        });

      // Switch workspace
      const switchWorkspace = (workspaceConfig: WorkspaceConfig) =>
        Effect.gen(function* () {
          yield* validateWorkspaceConfigHelper(workspaceConfig);
          yield* executeOperation("switch_workspace" as WorkspaceOperationType);

          // Notify ChatAppsManager about workspace activation
          yield* chatAppsManager.onWorkspaceActivated(workspaceConfig.id).pipe(
            Effect.catchAll((error) => {
              console.warn(
                `Failed to activate workspace ${workspaceConfig.id} in ChatAppsManager:`,
                error
              );
              return Effect.succeed(undefined);
            })
          );

          yield* setState({
            workspaceConfig,
            isWorkspaceLoaded: true,
          });

          yield* Effect.log(`Switched to workspace: ${workspaceConfig.name}`);
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceValidationError
              ? cause
              : new WorkspaceConfigurationError({
                  message: "Failed to switch workspace",
                  workspaceId: workspaceConfig.id,
                  cause,
                })
          )
        );

      // Load chat apps
      const loadChatApps = (chatApps: ChatAppConfig[]) =>
        Effect.gen(function* () {
          yield* executeOperation("load_chatapps" as WorkspaceOperationType);

          const state = yield* getState();
          if (!state.workspaceConfig) {
            yield* Effect.fail(
              new WorkspaceChatAppError({
                message: "No workspace loaded",
                workspaceId: "unknown",
                chatAppId: "multiple",
                operation: "load",
              })
            );
          }

          // Filter chat apps for current workspace
          const workspaceChatApps = filterChatAppsForWorkspace(
            chatApps,
            state.workspaceConfig.id
          );

          // Register chat apps with ChatAppsManager
          yield* Effect.forEach(
            workspaceChatApps,
            (chatApp) =>
              state.workspaceConfig
                ? chatAppsManager
                    .registerChatApp(
                      state.workspaceConfig.id,
                      chatApp.id,
                      chatApp
                    )
                    .pipe(
                      Effect.catchAll((error) => {
                        console.warn(
                          `Failed to register chat app ${chatApp.id}:`,
                          error
                        );
                        return Effect.succeed(undefined);
                      })
                    )
                : Effect.succeed(undefined),
            { concurrency: "unbounded" }
          );

          yield* setState({
            availableChatApps: workspaceChatApps,
          });

          yield* Effect.log(`Loaded ${workspaceChatApps.length} chat apps`);
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceChatAppError
              ? cause
              : new WorkspaceChatAppError({
                  message: "Failed to load chat apps",
                  workspaceId: "unknown",
                  chatAppId: "multiple",
                  operation: "load",
                  cause,
                })
          )
        );

      // Get available chat apps
      const getAvailableChatApps = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.availableChatApps;
        });

      // Activate chat app
      const activateChatApp = (chatAppId: string) =>
        Effect.gen(function* () {
          yield* executeOperation("activate_chatapp" as WorkspaceOperationType);

          const state = yield* getState();
          if (!state.workspaceConfig) {
            yield* Effect.fail(
              new WorkspaceChatAppError({
                message: "No workspace loaded",
                workspaceId: "unknown",
                chatAppId,
                operation: "activate",
              })
            );
          }

          // Check if chat app exists in available chat apps
          const chatApp = state.availableChatApps.find(
            (app) => app.id === chatAppId
          );
          if (!chatApp) {
            yield* Effect.fail(
              new WorkspaceChatAppError({
                message: `Chat app not found: ${chatAppId}`,
                workspaceId: state.workspaceConfig.id,
                chatAppId,
                operation: "activate",
              })
            );
          }

          // Set chat app as active in ChatAppsManager
          yield* chatAppsManager.setActiveChatApp(chatAppId);

          // Update active chat apps list
          const currentActive = state.activeChatApps;
          if (!currentActive.find((app) => app.id === chatAppId)) {
            yield* setState({
              activeChatApps: [...currentActive, chatApp],
            });
          }

          yield* Effect.log(`Activated chat app: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceChatAppError
              ? cause
              : new WorkspaceChatAppError({
                  message: "Failed to activate chat app",
                  workspaceId: "unknown",
                  chatAppId,
                  operation: "activate",
                  cause,
                })
          )
        );

      // Deactivate chat app
      const deactivateChatApp = (chatAppId: string) =>
        Effect.gen(function* () {
          yield* executeOperation(
            "deactivate_chatapp" as WorkspaceOperationType
          );

          // Stash chat app in ChatAppsManager
          yield* chatAppsManager.stashChatApp(chatAppId);

          // Update active chat apps list
          const state = yield* getState();
          const updatedActive = state.activeChatApps.filter(
            (app) => app.id !== chatAppId
          );
          yield* setState({
            activeChatApps: updatedActive,
          });

          yield* Effect.log(`Deactivated chat app: ${chatAppId}`);
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceChatAppError
              ? cause
              : new WorkspaceChatAppError({
                  message: "Failed to deactivate chat app",
                  workspaceId: "unknown",
                  chatAppId,
                  operation: "deactivate",
                  cause,
                })
          )
        );

      // Get active chat apps
      const getActiveChatApps = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.activeChatApps;
        });

      // Load agents
      const loadAgents = (agents: AgentConfig[]) =>
        Effect.gen(function* () {
          yield* executeOperation("load_agents" as WorkspaceOperationType);

          const state = yield* getState();
          if (!state.workspaceConfig) {
            yield* Effect.fail(
              new WorkspaceAgentError({
                message: "No workspace loaded",
                workspaceId: "unknown",
                agentId: "multiple",
                operation: "load",
              })
            );
          }

          // Filter agents for current workspace
          const workspaceAgents = filterAgentsForWorkspace(
            agents,
            state.workspaceConfig.agentIds
          );

          yield* setState({
            availableAgents: workspaceAgents,
          });

          yield* Effect.log(`Loaded ${workspaceAgents.length} agents`);
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceAgentError
              ? cause
              : new WorkspaceAgentError({
                  message: "Failed to load agents",
                  workspaceId: "unknown",
                  agentId: "multiple",
                  operation: "load",
                  cause,
                })
          )
        );

      // Get available agents
      const getAvailableAgents = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.availableAgents;
        });

      // Get agents for chat app
      const getAgentsForChatApp = (chatAppId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatApp = state.availableChatApps.find(
            (app) => app.id === chatAppId
          );

          if (!chatApp) {
            return [];
          }

          // Return the assigned agent for this chat app
          const assignedAgent = state.availableAgents.find(
            (agent) => agent.id === chatApp.agentId
          );

          return assignedAgent ? [assignedAgent] : [];
        });

      // Render workspace UI
      const renderWorkspaceUI = () =>
        Effect.gen(function* () {
          const state = yield* getState();

          if (!state.isWorkspaceLoaded) {
            yield* Effect.fail(
              new WorkspaceUIError({
                message: "Cannot render UI before workspace is loaded",
                workspaceId: state.workspaceConfig?.id || "unknown",
                operation: "render",
              })
            );
          }

          // In real implementation, this would trigger React rendering
          yield* Effect.log("Rendering WorkspaceUI...");

          yield* setState({ isUIRendered: true });
        }).pipe(
          Effect.mapError((cause: unknown) =>
            cause instanceof WorkspaceUIError
              ? cause
              : new WorkspaceUIError({
                  message: "Failed to render workspace UI",
                  workspaceId: "unknown",
                  operation: "render",
                  cause,
                })
          )
        );

      // Check if UI is rendered
      const isUIRendered = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.isUIRendered;
        });

      // Get workspace state
      const getState = () =>
        Effect.gen(function* () {
          return yield* Ref.get(workspaceStateRef);
        }).pipe(
          Effect.mapError(
            (cause: unknown) =>
              new WorkspaceStateError({
                message: "Failed to get workspace state",
                operation: "get",
                cause,
              })
          )
        );

      // Set workspace state
      const setState = (partialState: Partial<WorkspaceComponentState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(workspaceStateRef);
          const newState: WorkspaceComponentState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(workspaceStateRef, newState);

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
        }).pipe(
          Effect.mapError(
            (cause: unknown) =>
              new WorkspaceStateError({
                message: "Failed to set workspace state",
                operation: "set",
                cause,
              })
          )
        );

      // Subscribe to state changes
      const subscribe = (callback: (state: WorkspaceComponentState) => void) =>
        Effect.gen(function* () {
          // In real implementation, this would use a proper subscription mechanism
          return () => {
            // Unsubscribe logic
          };
        }).pipe(
          Effect.mapError(
            (cause: unknown) =>
              new WorkspaceStateError({
                message: "Failed to subscribe to workspace state",
                operation: "subscribe",
                cause,
              })
          )
        );

      // Initialize workspace component
      const initialize = (config: WorkspaceComponentConfig) =>
        Effect.gen(function* () {
          // Cast to CoreComponentConfig for core component initialization
          const coreConfig = config as CoreComponentConfig;

          yield* coreComponent.initialize(coreConfig);

          yield* setState({ isInitialized: true });

          yield* Effect.log(`Initialized workspace component: ${config.name}`);
        }).pipe(
          Effect.mapError((cause: unknown) => {
            // Map to workspace-specific errors
            if (cause instanceof WorkspaceInitializationError) {
              return cause;
            }
            // For any other errors, wrap in WorkspaceInitializationError
            return new WorkspaceInitializationError({
              message: "Failed to initialize workspace component",
              workspaceId: config.workspaceId,
              phase: "initialization",
              cause,
            });
          })
        );

      // Cleanup
      const cleanup = () =>
        Effect.gen(function* () {
          yield* coreComponent.cleanup();
          yield* Ref.set(workspaceStateRef, createDefaultWorkspaceState());
          yield* Ref.set(lastOperationRef, null);
        });

      // Operation tracking methods
      const getLastOperation = () =>
        Effect.gen(function* () {
          return yield* Ref.get(lastOperationRef);
        }).pipe(
          Effect.mapError(
            (cause: unknown) =>
              new WorkspaceOperationError({
                message: "Failed to get last operation",
                operation: "get_last",
                cause,
              })
          )
        );

      return {
        // Core component methods
        initialize,
        getState,
        setState,
        subscribe,
        cleanup,

        // Workspace-specific methods
        loadWorkspace,
        getWorkspaceConfig,
        switchWorkspace,
        loadChatApps,
        getAvailableChatApps,
        activateChatApp,
        deactivateChatApp,
        getActiveChatApps,
        loadAgents,
        getAvailableAgents,
        getAgentsForChatApp,
        renderWorkspaceUI,
        isUIRendered,

        // Operation tracking methods
        executeOperation,
        getLastOperation,
      } satisfies WorkspaceComponentApi;
    }),
    dependencies: [CoreComponent.Default, ChatAppsManager.Default],
  }

) {}

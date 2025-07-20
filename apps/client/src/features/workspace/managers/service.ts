import { filterAgentsForWorkspace } from "@/agents/utils/agent-utils";
import { CoreComponent } from "@/components/core";
import {
  CoreComponentCleanupError,
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
} from "@/components/core/errors";
import type { CoreComponentConfig } from "@/components/core/types";
import { AppComponent } from "@/features/application/managers/service";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/features/application/types/AppConfig";
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import {
  chatAppConfigToRecord,
  extractChatAppProperties,
} from "@/features/chatapps/utils/chatapp-converters";
import { filterChatAppsForWorkspace } from "@/features/workspace/utils/workspace-utils";
import { Effect, Ref } from "effect";
import { fetchChatAppConfigs } from "../app/service"; // Import the helper
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
import {
  WorkspaceComponentConfig,
  WorkspaceComponentState,
  WorkspaceOperationType,
  createDefaultWorkspaceState,
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

      // Get app component for accessing app config
      const appComponent = yield* AppComponent;

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

          // Set workspace capacity in ChatAppsManager via command
          yield* chatAppsManager
            .dispatch({
              _tag: "SetWorkspaceMaxExpandedApps",
              workspaceId: workspaceConfig.id,
              maxApps: workspaceConfig.maxExpandedApps || 3,
            })
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

      // Switch workspace with strict typing
      const switchWorkspace = (workspaceConfig: WorkspaceConfig) =>
        Effect.gen(function* () {
          console.log(
            "[WorkspaceComponent] switchWorkspace called with:",
            workspaceConfig
          );
          // Validate input type
          if (!workspaceConfig || typeof workspaceConfig !== "object") {
            console.error(
              "[WorkspaceComponent] switchWorkspace: Invalid workspace config provided",
              workspaceConfig
            );
            yield* Effect.fail(
              new CoreComponentStateError({
                message: "Invalid workspace config provided",
                operation: "switchWorkspace",
              })
            );
          }

          // Validate required fields
          if (!workspaceConfig.id || typeof workspaceConfig.id !== "string") {
            console.error(
              "[WorkspaceComponent] switchWorkspace: Workspace config must have a valid ID",
              workspaceConfig
            );
            yield* Effect.fail(
              new CoreComponentStateError({
                message: "Workspace config must have a valid ID",
                operation: "switchWorkspace",
              })
            );
          }

          if (
            !workspaceConfig.name ||
            typeof workspaceConfig.name !== "string"
          ) {
            console.error(
              "[WorkspaceComponent] switchWorkspace: Workspace config must have a valid name",
              workspaceConfig
            );
            yield* Effect.fail(
              new CoreComponentStateError({
                message: "Workspace config must have a valid name",
                operation: "switchWorkspace",
              })
            );
          }

          // Validate arrays
          if (!Array.isArray(workspaceConfig.chatappIds)) {
            console.error(
              "[WorkspaceComponent] switchWorkspace: chatappIds must be an array",
              workspaceConfig
            );
            yield* Effect.fail(
              new CoreComponentStateError({
                message: "Workspace config chatappIds must be an array",
                operation: "switchWorkspace",
              })
            );
          }

          if (!Array.isArray(workspaceConfig.agentIds)) {
            console.error(
              "[WorkspaceComponent] switchWorkspace: agentIds must be an array",
              workspaceConfig
            );
            yield* Effect.fail(
              new CoreComponentStateError({
                message: "Workspace config agentIds must be an array",
                operation: "switchWorkspace",
              })
            );
          }

          yield* validateWorkspaceConfigHelper(workspaceConfig);
          console.log(
            "[WorkspaceComponent] switchWorkspace: validated workspaceConfig"
          );

          // Notify ChatAppsManager about workspace activation via command
          yield* chatAppsManager
            .dispatch({
              _tag: "OnWorkspaceActivated",
              workspaceId: workspaceConfig.id,
            })
            .pipe(
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
          console.log(
            "[WorkspaceComponent] switchWorkspace: state updated with new workspaceConfig"
          );

          // Load chat apps for this workspace with strict typing
          yield* Effect.gen(function* () {
            // Get app config to access chat apps
            const appConfig = yield* appComponent.getAppConfig();
            console.log(
              "[WorkspaceComponent] switchWorkspace: got appConfig",
              appConfig
            );

            if (!appConfig) {
              console.error(
                "[WorkspaceComponent] switchWorkspace: No app config available"
              );
              yield* Effect.fail(
                new CoreComponentStateError({
                  message: "No app config available",
                  operation: "loadChatApps",
                })
              );
            }

            // --- ADDED: Fetch missing chat app configs for this workspace ---
            const workspaceChatAppIds = workspaceConfig.chatappIds || [];
            console.log(
              `[WorkspaceComponent] switchWorkspace: workspace has ${workspaceChatAppIds.length} chat app IDs:`,
              workspaceChatAppIds
            );

            // Find which chat app IDs are missing from appConfig.chatapps
            const loadedChatAppIds = (appConfig.chatapps || []).map(
              (c) => c.id
            );
            console.log(
              `[WorkspaceComponent] switchWorkspace: appConfig has ${loadedChatAppIds.length} loaded chat apps:`,
              loadedChatAppIds
            );

            const missingChatAppIds = workspaceChatAppIds.filter(
              (id) => !loadedChatAppIds.includes(id)
            );
            console.log(
              `[WorkspaceComponent] switchWorkspace: missing ${missingChatAppIds.length} chat app configs:`,
              missingChatAppIds
            );

            let mergedChatApps = appConfig.chatapps || [];
            if (missingChatAppIds.length > 0) {
              console.log(
                `[WorkspaceComponent] switchWorkspace: fetching missing chat app configs for:`,
                missingChatAppIds
              );
              // Fetch and cache missing chat app configs
              const fetched = yield* fetchChatAppConfigs(missingChatAppIds);
              console.log(
                `[WorkspaceComponent] switchWorkspace: fetched ${fetched.length} chat app configs:`,
                fetched.map((c) => c.id)
              );
              // Use a merged array for this run (do not mutate appConfig)
              mergedChatApps = [...mergedChatApps, ...fetched];
            }
            console.log(
              `[WorkspaceComponent] switchWorkspace: total merged chat apps: ${mergedChatApps.length}`
            );
            // --- END ADDED ---

            if (mergedChatApps && Array.isArray(mergedChatApps)) {
              // Validate and convert chat apps to ChatAppConfig format
              const validChatApps: ChatAppConfig[] = [];

              for (const chatApp of mergedChatApps) {
                console.log(
                  `[WorkspaceComponent] switchWorkspace: processing chat app:`,
                  chatApp
                );

                // Use a type guard to ensure chatApp is valid
                const extractedProps = extractChatAppProperties(chatApp);

                if (!extractedProps) {
                  console.warn(
                    "[WorkspaceComponent] switchWorkspace: Invalid chat app object, skipping:",
                    chatApp
                  );
                  continue;
                }

                console.log(
                  `[WorkspaceComponent] switchWorkspace: extracted props:`,
                  extractedProps
                );

                // Create strictly typed ChatAppConfig using extracted properties
                const validChatApp: ChatAppConfig = {
                  id: extractedProps.id,
                  name: extractedProps.name,
                  agentId: extractedProps.agentId || "",
                  toolbarId: extractedProps.toolbarId || "default-toolbar",
                  themeId: extractedProps.themeId || "default-theme",
                  description: extractedProps.description,
                  version: extractedProps.version,
                  updatedAt: extractedProps.updatedAt,
                  ownerId: extractedProps.ownerId,
                  spaceId: extractedProps.spaceId,
                  theme: extractedProps.theme,
                  isDefault: extractedProps.isDefault,
                  isShared: extractedProps.isShared,
                };

                console.log(
                  `[WorkspaceComponent] switchWorkspace: created valid chat app:`,
                  validChatApp
                );
                validChatApps.push(validChatApp);
              }

              console.log(
                `[WorkspaceComponent] switchWorkspace: Found ${validChatApps.length} valid chat apps in app config:`,
                validChatApps.map((app) => ({ id: app.id, name: app.name }))
              );
              if (validChatApps.length > 0) {
                console.log(
                  `[WorkspaceComponent] switchWorkspace: calling loadChatApps with ${validChatApps.length} chat apps`
                );
                yield* loadChatApps(validChatApps);
                console.log(
                  "[WorkspaceComponent] switchWorkspace: loadChatApps complete"
                );
              } else {
                console.warn(
                  "[WorkspaceComponent] switchWorkspace: No valid chat apps found in app config"
                );
              }
            } else {
              console.warn(
                "[WorkspaceComponent] switchWorkspace: No chat apps array found in app config"
              );
            }
          }).pipe(
            Effect.catchAll((error) => {
              console.warn(
                `[WorkspaceComponent] switchWorkspace: Failed to load chat apps for workspace ${workspaceConfig.id}:`,
                error
              );
              return Effect.succeed(undefined);
            })
          );

          yield* Effect.log(
            `[WorkspaceComponent] Switched to workspace: ${workspaceConfig.name}`
          );
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
          console.log(
            `[WorkspaceComponent] loadChatApps: called with ${chatApps.length} chat apps:`,
            chatApps.map((c) => c.id)
          );
          yield* executeOperation("load_chatapps" as WorkspaceOperationType);

          const state = yield* getState();
          if (!state.workspaceConfig) {
            console.error(
              "[WorkspaceComponent] loadChatApps: No workspace loaded"
            );
            yield* Effect.fail(
              new WorkspaceChatAppError({
                message: "No workspace loaded",
                workspaceId: "unknown",
                chatAppId: "multiple",
                operation: "load",
              })
            );
          }

          console.log(
            `[WorkspaceComponent] loadChatApps: current workspace: ${state.workspaceConfig.id}, chatappIds:`,
            state.workspaceConfig.chatappIds
          );

          // Filter chat apps for current workspace
          const workspaceChatApps = chatApps.filter((chatApp) =>
            state.workspaceConfig?.chatappIds.includes(chatApp.id)
          );

          console.log(
            `[WorkspaceComponent] loadChatApps: filtered to ${workspaceChatApps.length} workspace chat apps:`,
            workspaceChatApps.map((c) => c.id)
          );

          // Register all chat apps in parallel
          yield* Effect.forEach(
            workspaceChatApps,
            (chatApp) =>
              state.workspaceConfig
                ? Effect.gen(function* () {
                    console.log(
                      `DEBUG: Checking if chat app ${chatApp.id} is already registered`
                    );
                    const existingInstance = yield* chatAppsManager
                      .getChatAppInstance(chatApp.id)
                      .pipe(
                        Effect.catchTag("ChatAppNotFoundError", () =>
                          Effect.succeed(null)
                        )
                      );
                    if (existingInstance) {
                      console.log(
                        `DEBUG: Chat app ${chatApp.id} already registered, skipping registration`
                      );
                      return;
                    }
                    console.log(
                      `DEBUG: Registering chat app ${chatApp.id} directly with workspace ID: ${state.workspaceConfig.id}`
                    );
                    const instance = yield* chatAppsManager
                      .registerChatApp(
                        state.workspaceConfig.id,
                        chatApp.id,
                        chatAppConfigToRecord(chatApp)
                      )
                      .pipe(
                        Effect.catchTag(
                          "ChatAppAlreadyExistsError",
                          (error) => {
                            console.log(
                              `DEBUG: Chat app ${chatApp.id} was already registered by another process, getting existing instance`
                            );
                            return chatAppsManager.getChatAppInstance(
                              chatApp.id
                            );
                          }
                        )
                      );
                    console.log(
                      `DEBUG: Successfully registered chat app ${chatApp.id}:`,
                      {
                        id: instance.id,
                        workspaceId: instance.workspaceId,
                        status: instance.status,
                      }
                    );
                  }).pipe(
                    Effect.catchAll((error) => {
                      console.error(
                        `Failed to register chat app ${chatApp.id}:`,
                        error
                      );
                      return Effect.succeed(undefined);
                    })
                  )
                : Effect.succeed(undefined),
            { concurrency: "unbounded" }
          );

          // Atomic state update for availableChatApps
          yield* setState({
            availableChatApps: workspaceChatApps,
          });

          // Wait for state propagation
          yield* Effect.sleep("20 millis");

          // Get updated state
          const updatedState = yield* getState();

          // If no active chat apps, activate the first one
          if (
            updatedState.activeChatApps.length === 0 &&
            workspaceChatApps.length > 0
          ) {
            console.log(
              `DEBUG: No active chat apps, activating first: ${workspaceChatApps[0].id}`
            );
            yield* activateChatApp(workspaceChatApps[0].id);

            // Wait a bit and check the status
            yield* Effect.sleep("100 millis");
            const chatAppInstance = yield* chatAppsManager.getChatAppInstance(
              workspaceChatApps[0].id
            );
            console.log(
              `DEBUG: Chat app ${workspaceChatApps[0].id} status after activation:`,
              chatAppInstance.status
            );
          }

          // Set isLoading: false only after all steps
          yield* setState({ isLoading: false });

          console.log(
            `DEBUG: Loaded ${workspaceChatApps.length} chat apps for workspace ${state.workspaceConfig.id}:`,
            workspaceChatApps.map((app) => ({ id: app.id, name: app.name }))
          );
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
                workspaceId: state.workspaceConfig?.id,
                chatAppId,
                operation: "activate",
              })
            );
          }

          // Set chat app as active in ChatAppsManager via command
          console.log(
            `DEBUG: Dispatching ExpandChatApp command for ${chatAppId}`
          );
          yield* chatAppsManager.dispatch({
            _tag: "ExpandChatApp",
            appId: chatAppId,
          });

          // Wait for the command to be processed
          yield* Effect.sleep("50 millis");
          console.log(
            `DEBUG: ExpandChatApp command dispatched for ${chatAppId}`
          );

          // Update active chat apps list atomically
          yield* Ref.update(workspaceStateRef, (currentState) => {
            const currentActive = currentState.activeChatApps;
            if (!currentActive.find((app) => app.id === chatAppId)) {
              if (chatApp !== undefined) {
                return {
                  ...currentState,
                  activeChatApps: [...currentActive, chatApp],
                  activeChatAppIds: [
                    ...currentState.activeChatAppIds,
                    chatAppId,
                  ],
                };
              }
            }
            return currentState;
          });

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

      // Deactivate chat app
      const deactivateChatApp = (chatAppId: string) =>
        Effect.gen(function* () {
          yield* executeOperation(
            "deactivate_chatapp" as WorkspaceOperationType
          );

          // Stash chat app in ChatAppsManager via command
          yield* chatAppsManager.dispatch({
            _tag: "StashChatApp",
            appId: chatAppId,
          });

          // Wait for the command to be processed
          yield* Effect.sleep("50 millis");

          // Update active chat apps list atomically
          yield* Ref.update(workspaceStateRef, (currentState) => {
            const updatedActive = currentState.activeChatApps.filter(
              (app) => app.id !== chatAppId
            );
            const updatedActiveIds = currentState.activeChatAppIds.filter(
              (id) => id !== chatAppId
            );
            return {
              ...currentState,
              activeChatApps: updatedActive,
              activeChatAppIds: updatedActiveIds,
            };
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
          // TypeScript: state.workspaceConfig is guaranteed non-null due to check above
          const workspaceAgents = filterAgentsForWorkspace(
            agents,
            state.workspaceConfig?.agentIds
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

          // Handle both agentId (singular) and agentIds (plural) fields
          let agentIds: string[] = [];

          // Check for agentId field (from ChatAppConfig schema)
          if (
            "agentId" in chatApp &&
            typeof chatApp.agentId === "string" &&
            chatApp.agentId
          ) {
            agentIds = [chatApp.agentId];
          }

          // Check for agentIds field (from test data) with type safety
          const extractedProps = extractChatAppProperties(chatApp);
          if (extractedProps?.agentIds) {
            agentIds = extractedProps.agentIds;
          }

          // Return agents that match the agent IDs
          return state.availableAgents.filter((agent) =>
            agentIds.includes(agent.id)
          );
        });

      // Check if UI is rendered
      const isUIRendered = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.isUIRendered;
        });

      // Get workspace state
      const getState = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(workspaceStateRef);
          console.log("[WorkspaceComponent] getState: returning state:", state);
          return state;
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

          // Create the new state with all updates
          let newState: WorkspaceComponentState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          // Compute activeChatAppIds from activeChatApps if activeChatApps was updated
          if (partialState.activeChatApps !== undefined) {
            newState = {
              ...newState,
              activeChatAppIds: partialState.activeChatApps.map(
                (app) => app.id
              ),
            };
          }

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
    dependencies: [
      CoreComponent.Default,
      ChatAppsManager.Default,
      AppComponent.Default,
    ],
  }
) {}

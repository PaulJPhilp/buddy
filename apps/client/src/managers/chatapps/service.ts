import { Effect, Layer, Queue, Ref } from "effect";
import type { ChatAppsManagerApi } from "./api";
import type { ChatAppsCommand } from "./commands";
import {
  ArchiveChatApp,
  CloseAllAppsInWorkspace,
  CloseChatApp,
  CompactChatApp,
  EnforceCapacityLimits,
  EnterFocusMode,
  ExecuteChatAppsOperation,
  ExitFocusMode,
  ExpandChatApp,
  ExpandMultipleChatApps,
  MigrateChatApps,
  OnWorkspaceActivated,
  OnWorkspaceArchived,
  RegisterChatApp,
  ResetChatAppsState,
  RestoreChatApp,
  RestoreWorkspaceLayout,
  SaveChatAppLayout,
  SaveWorkspaceLayout,
  SetActiveChatApp,
  SetChatAppStatus,
  SetChatAppsState,
  SetWorkspaceMaxExpandedApps,
  StashAllAppsInWorkspace,
  StashChatApp,
  SwitchChatAppAgent,
  UnregisterChatApp,
  UpdateChatAppConfig,
} from "./commands";
import {
  ChatAppAlreadyExistsError,
  ChatAppNotFoundError,
  ChatAppsManagerOperationError,
  ChatAppsManagerStateError,
  ChatAppsManagerSubscriptionError,
} from "./errors";
import type {
  ChatAppInstance,
  ChatAppMetrics,
  ChatAppStatus,
  ChatAppsManagerState,
  ChatAppsManagerStats,
  FocusModeConfig,
  LayoutConfig,
  WorkspaceLayoutConfig,
  WorkspaceSpecificStats,
} from "./types";

export class ChatAppsManager extends Effect.Service<ChatAppsManagerApi>()(
  "ChatAppsManager",
  {
    scoped: Effect.gen(function* () {
      // Initialize state without CoreManager dependency
      const stateRef = yield* Ref.make<ChatAppsManagerState>({
        chatAppInstances: {},
        activeAppId: null,
        focusMode: {
          isActive: false,
          focusedAppId: null,
          config: null,
          enteredAt: null,
          previousAppStates: {},
        },
        workspaceCapacities: {},
        workspaceLayouts: {},
        stats: {
          totalApps: 0,
          activeApps: 0,
          expandedApps: 0,
          compactApps: 0,
          stashedApps: 0,
          archivedApps: 0,
          totalWorkspaces: 0,
          averageAppsPerWorkspace: 0,
          totalMessages: 0,
          totalInteractions: 0,
          averageResponseTime: 0,
          errorRate: 0,
          focusModeUsage: {
            totalSessions: 0,
            totalTimeInFocus: 0,
            averageSessionDuration: 0,
          },
          capacityUtilization: {},
          lastUpdated: new Date(),
        },
        lastUpdated: new Date(),
        isLoading: false,
        lastError: null,
        operationHistory: [],
        lastOperation: null,
      });

      const listenersRef = yield* Ref.make<
        Set<(state: ChatAppsManagerState) => void>
      >(new Set());

      // Command processing infrastructure
      const commandQueue = yield* Queue.unbounded<ChatAppsCommand>();

      // Process commands asynchronously
      yield* Effect.fork(
        Effect.forever(
          Effect.gen(function* () {
            const command = yield* Queue.take(commandQueue);
            yield* handleCommand(command);
          })
        )
      );

      // Helper functions
      const updateState = (
        updater: (state: ChatAppsManagerState) => ChatAppsManagerState
      ) =>
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, (state) => ({
            ...updater(state),
            lastUpdated: new Date(),
          }));
          yield* notifyListeners(newState);
          return newState;
        });

      const notifyListeners = (state: ChatAppsManagerState) =>
        Effect.gen(function* () {
          const listeners = yield* Ref.get(listenersRef);
          yield* Effect.forEach(Array.from(listeners), (listener) =>
            Effect.sync(() => listener(state))
          );
        });

      const validateChatAppExists = (appId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.chatAppInstances[appId]) {
            yield* Effect.fail(
              new ChatAppNotFoundError({
                message: `ChatApp not found: ${appId}`,
                appId,
              })
            );
          }
        });

      const createChatAppInstance = (
        workspaceId: string,
        appId: string,
        config: any
      ): ChatAppInstance => {
        const now = new Date();
        return {
          id: appId,
          workspaceId,
          config,
          status: "stashed",
          isActive: false,
          agentId: null,
          createdAt: now,
          lastActiveAt: now,
          lastStatusChangeAt: now,
          metadata: {
            totalMessages: 0,
            totalInteractions: 0,
            lastInteractionAt: null,
            averageResponseTime: 0,
            errorCount: 0,
            successRate: 100,
            tags: [],
            customData: {},
          },
        };
      };

      const calculateStats = (
        instances: Record<string, ChatAppInstance>
      ): ChatAppsManagerStats => {
        const apps = Object.values(instances);
        const workspaces = new Set(apps.map((app) => app.workspaceId));

        const statusCounts = apps.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {} as Record<ChatAppStatus, number>);

        return {
          totalApps: apps.length,
          activeApps: apps.filter((app) => app.isActive).length,
          expandedApps: statusCounts.expanded || 0,
          compactApps: statusCounts.compact || 0,
          stashedApps: statusCounts.stashed || 0,
          archivedApps: statusCounts.archived || 0,
          totalWorkspaces: workspaces.size,
          averageAppsPerWorkspace:
            workspaces.size > 0 ? apps.length / workspaces.size : 0,
          totalMessages: apps.reduce(
            (sum, app) => sum + app.metadata.totalMessages,
            0
          ),
          totalInteractions: apps.reduce(
            (sum, app) => sum + app.metadata.totalInteractions,
            0
          ),
          averageResponseTime:
            apps.length > 0
              ? apps.reduce(
                  (sum, app) => sum + app.metadata.averageResponseTime,
                  0
                ) / apps.length
              : 0,
          errorRate: 0,
          focusModeUsage: {
            totalSessions: 0,
            totalTimeInFocus: 0,
            averageSessionDuration: 0,
          },
          capacityUtilization: {},
          lastUpdated: new Date(),
        };
      };

      // Command handler
      const handleCommand = (
        command: ChatAppsCommand
      ): Effect.Effect<void, any, never> =>
        Effect.gen(function* () {
          switch (command._tag) {
            case "SetChatAppsState":
              yield* setState(command.updates);
              break;

            case "ResetChatAppsState":
              yield* resetState();
              break;

            case "RegisterChatApp":
              yield* registerChatApp(
                command.workspaceId,
                command.appId,
                command.config
              );
              break;

            case "UnregisterChatApp":
              yield* unregisterChatApp(command.appId);
              break;

            case "SetChatAppStatus":
              yield* setChatAppStatus(
                command.appId,
                command.status as ChatAppStatus
              );
              break;

            case "ExpandChatApp":
              yield* expandChatApp(command.appId);
              break;

            case "CompactChatApp":
              yield* compactChatApp(command.appId);
              break;

            case "StashChatApp":
              yield* stashChatApp(command.appId);
              break;

            case "CloseChatApp":
              yield* closeChatApp(command.appId);
              break;

            case "ArchiveChatApp":
              yield* archiveChatApp(command.appId);
              break;

            case "RestoreChatApp":
              yield* restoreChatApp(command.appId);
              break;

            case "SetActiveChatApp":
              yield* setActiveChatApp(command.appId);
              break;

            case "EnterFocusMode":
              yield* enterFocusMode(command.appId, command.config);
              break;

            case "ExitFocusMode":
              yield* exitFocusMode();
              break;

            case "ExpandMultipleChatApps":
              yield* expandMultipleChatApps(command.appIds);
              break;

            case "StashAllAppsInWorkspace":
              yield* stashAllAppsInWorkspace(
                command.workspaceId,
                command.exceptAppId
              );
              break;

            case "CloseAllAppsInWorkspace":
              yield* closeAllAppsInWorkspace(command.workspaceId);
              break;

            case "RestoreWorkspaceLayout":
              yield* restoreWorkspaceLayout(command.workspaceId);
              break;

            case "UpdateChatAppConfig":
              yield* updateChatAppConfig(command.appId, command.config);
              break;

            case "SwitchChatAppAgent":
              yield* switchChatAppAgent(command.appId, command.agentId);
              break;

            case "SetWorkspaceMaxExpandedApps":
              yield* setWorkspaceMaxExpandedApps(
                command.workspaceId,
                command.maxApps
              );
              break;

            case "SaveChatAppLayout":
              yield* saveChatAppLayout(
                command.appId,
                command.layout as LayoutConfig
              );
              break;

            case "SaveWorkspaceLayout":
              yield* saveWorkspaceLayout(
                command.workspaceId,
                command.layout as WorkspaceLayoutConfig
              );
              break;

            case "OnWorkspaceActivated":
              yield* onWorkspaceActivated(command.workspaceId);
              break;

            case "OnWorkspaceArchived":
              yield* onWorkspaceArchived(command.workspaceId);
              break;

            case "MigrateChatApps":
              yield* migrateChatAppsToWorkspace(
                command.appIds,
                command.targetWorkspaceId
              );
              break;

            case "EnforceCapacityLimits":
              yield* enforceCapacityLimits(command.workspaceId);
              break;

            case "ExecuteChatAppsOperation":
              yield* executeOperation(command.operation);
              break;

            default:
              // @ts-expect-error - exhaustive check
              throw new Error(`Unknown command: ${command._tag}`);
          }
        }).pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              console.error(`Failed to handle command ${command._tag}:`, error);
              // Update state with error if needed
              yield* updateState((state) => ({
                ...state,
                lastError:
                  error instanceof Error ? error.message : String(error),
              }));
            })
          )
        );

      // Core API Implementation
      const getState = () => Ref.get(stateRef);

      const setState = (updates: Partial<ChatAppsManagerState>) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, ...updates }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppsManagerStateError({
                message: "Failed to update state",
                operation: "setState",
                cause,
              })
          )
        );

      const resetState = () =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, {
            chatAppInstances: {},
            activeAppId: null,
            focusMode: {
              isActive: false,
              focusedAppId: null,
              config: null,
              enteredAt: null,
              previousAppStates: {},
            },
            workspaceCapacities: {},
            workspaceLayouts: {},
            stats: {
              totalApps: 0,
              activeApps: 0,
              expandedApps: 0,
              compactApps: 0,
              stashedApps: 0,
              archivedApps: 0,
              totalWorkspaces: 0,
              averageAppsPerWorkspace: 0,
              totalMessages: 0,
              totalInteractions: 0,
              averageResponseTime: 0,
              errorRate: 0,
              focusModeUsage: {
                totalSessions: 0,
                totalTimeInFocus: 0,
                averageSessionDuration: 0,
              },
              capacityUtilization: {},
              lastUpdated: new Date(),
            },
            lastUpdated: new Date(),
            isLoading: false,
            lastError: null,
            operationHistory: [],
            lastOperation: null,
          });
        });

      // ChatApp Instance Management
      const registerChatApp = (
        workspaceId: string,
        appId: string,
        config: any
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          // Check if app already exists
          if (state.chatAppInstances[appId]) {
            yield* Effect.fail(
              new ChatAppAlreadyExistsError({
                message: `ChatApp already exists: ${appId}`,
                appId,
                workspaceId,
                operation: "registerChatApp",
              })
            );
          }

          // Create new instance
          const instance = createChatAppInstance(workspaceId, appId, config);

          yield* updateState((state) => ({
            ...state,
            chatAppInstances: {
              ...state.chatAppInstances,
              [appId]: instance,
            },
            stats: calculateStats({
              ...state.chatAppInstances,
              [appId]: instance,
            }),
          }));

          return instance;
        }).pipe(
          Effect.mapError((cause) => {
            if (cause instanceof ChatAppAlreadyExistsError) {
              return cause;
            }
            return new ChatAppsManagerOperationError({
              message: `Failed to register ChatApp: ${appId}`,
              operation: "registerChatApp",
              appId,
              workspaceId,
              cause,
            });
          })
        );

      const unregisterChatApp = (appId: string) =>
        Effect.gen(function* () {
          yield* validateChatAppExists(appId);

          const state = yield* Ref.get(stateRef);

          // Remove from active if it was active
          const newActiveAppId =
            state.activeAppId === appId ? null : state.activeAppId;

          const { [appId]: removed, ...remainingInstances } =
            state.chatAppInstances;

          yield* updateState((state) => ({
            ...state,
            chatAppInstances: remainingInstances,
            activeAppId: newActiveAppId,
            stats: calculateStats(remainingInstances),
          }));
        }).pipe(
          Effect.mapError((cause) => {
            if (cause instanceof ChatAppNotFoundError) {
              return cause;
            }
            return new ChatAppsManagerOperationError({
              message: `Failed to unregister ChatApp: ${appId}`,
              operation: "unregisterChatApp",
              appId,
              cause,
            });
          })
        );

      const getChatAppInstance = (appId: string) =>
        Effect.gen(function* () {
          yield* validateChatAppExists(appId);
          const state = yield* Ref.get(stateRef);
          return state.chatAppInstances[appId];
        });

      const getAllChatApps = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return Object.values(state.chatAppInstances);
        });

      const getChatAppsInWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return Object.values(state.chatAppInstances).filter(
            (app) => app.workspaceId === workspaceId
          );
        });

      const subscribe = (callback: (state: ChatAppsManagerState) => void) =>
        Effect.gen(function* () {
          const listeners = yield* Ref.get(listenersRef);
          const newListeners = new Set(listeners);
          newListeners.add(callback);
          yield* Ref.set(listenersRef, newListeners);

          // Return unsubscribe function
          return () => {
            Effect.runSync(
              Effect.gen(function* () {
                const currentListeners = yield* Ref.get(listenersRef);
                const updatedListeners = new Set(currentListeners);
                updatedListeners.delete(callback);
                yield* Ref.set(listenersRef, updatedListeners);
              })
            );
          };
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppsManagerSubscriptionError({
                message: "Failed to subscribe to state changes",
                operation: "subscribe",
                cause,
              })
          )
        );

      const getStats = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.stats;
        });

      const getLastOperation = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.lastOperation;
        });

      const isOperationInProgress = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.operationHistory.some(
            (op) => op.status === "in-progress"
          );
        });

      const debugGetAllInstances = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.chatAppInstances;
        });

      const debugResetState = () => resetState();

      const debugValidateState = () => Effect.succeed(true);

      // Status management methods
      const setChatAppStatus = (appId: string, status: ChatAppStatus) =>
        Effect.gen(function* () {
          yield* validateChatAppExists(appId);

          yield* updateState((state) => ({
            ...state,
            chatAppInstances: {
              ...state.chatAppInstances,
              [appId]: {
                ...state.chatAppInstances[appId],
                status,
                lastStatusChangeAt: new Date(),
              },
            },
            stats: calculateStats({
              ...state.chatAppInstances,
              [appId]: {
                ...state.chatAppInstances[appId],
                status,
              },
            }),
          }));
        }).pipe(
          Effect.mapError((cause) => {
            if (cause instanceof ChatAppNotFoundError) {
              return cause;
            }
            return new ChatAppsManagerOperationError({
              message: `Failed to set ChatApp status: ${appId}`,
              operation: "setChatAppStatus",
              appId,
              cause,
            });
          })
        );

      const expandChatApp = (appId: string) =>
        setChatAppStatus(appId, "expanded");
      const compactChatApp = (appId: string) =>
        setChatAppStatus(appId, "compact");
      const stashChatApp = (appId: string) =>
        setChatAppStatus(appId, "stashed");
      const closeChatApp = (appId: string) => Effect.succeed(undefined);
      const archiveChatApp = (appId: string) => Effect.succeed(undefined);
      const restoreChatApp = (appId: string) => Effect.succeed(undefined);
      const setActiveChatApp = (appId: string) =>
        Effect.gen(function* () {
          yield* validateChatAppExists(appId);

          yield* updateState((state) => ({
            ...state,
            activeAppId: appId,
            chatAppInstances: {
              ...state.chatAppInstances,
              [appId]: {
                ...state.chatAppInstances[appId],
                isActive: true,
                lastActiveAt: new Date(),
              },
            },
          }));
        }).pipe(
          Effect.mapError((cause) => {
            if (cause instanceof ChatAppNotFoundError) {
              return cause;
            }
            return new ChatAppsManagerOperationError({
              message: `Failed to set active ChatApp: ${appId}`,
              operation: "setActiveChatApp",
              appId,
              cause,
            });
          })
        );
      const getActiveChatApp = () => Effect.succeed(null);
      const clearActiveChatApp = () => Effect.succeed(undefined);
      const setWorkspaceMaxExpandedApps = (
        workspaceId: string,
        maxApps: number
      ) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({
            ...state,
            workspaceCapacities: {
              ...state.workspaceCapacities,
              [workspaceId]: {
                ...state.workspaceCapacities[workspaceId],
                maxExpandedApps: maxApps,
              },
            },
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppsManagerOperationError({
                message: `Failed to set workspace max expanded apps: ${workspaceId}`,
                operation: "setWorkspaceMaxExpandedApps",
                workspaceId,
                cause,
              })
          )
        );

      const getWorkspaceMaxExpandedApps = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.workspaceCapacities[workspaceId]?.maxExpandedApps || 2;
        });
      const enforceCapacityLimits = (workspaceId: string) =>
        Effect.succeed(undefined);
      const getExpandedAppsInWorkspace = (workspaceId: string) =>
        Effect.succeed([]);
      const enterFocusMode = (appId: string, config?: FocusModeConfig) =>
        Effect.succeed(undefined);
      const exitFocusMode = () => Effect.succeed(undefined);
      const getFocusedApp = () => Effect.succeed(null);
      const isFocusModeActive = () => Effect.succeed(false);
      const expandMultipleChatApps = (appIds: string[]) =>
        Effect.succeed({ successful: [], failed: [] });
      const stashAllAppsInWorkspace = (
        workspaceId: string,
        exceptAppId?: string
      ) => Effect.succeed(undefined);
      const closeAllAppsInWorkspace = (workspaceId: string) =>
        Effect.succeed(undefined);
      const restoreWorkspaceLayout = (workspaceId: string) =>
        Effect.succeed(undefined);
      const updateChatAppConfig = (appId: string, config: any) =>
        Effect.succeed(undefined);
      const getChatAppConfig = (appId: string) => Effect.succeed({});
      const switchChatAppAgent = (appId: string, agentId: string) =>
        Effect.succeed(undefined);
      const getChatAppAgent = (appId: string) => Effect.succeed(null);
      const getWorkspaceStats = (workspaceId: string) =>
        Effect.succeed({} as WorkspaceSpecificStats);
      const getChatAppMetrics = (appId: string) =>
        Effect.succeed({} as ChatAppMetrics);
      const onWorkspaceActivated = (workspaceId: string) =>
        Effect.succeed(undefined);
      const onWorkspaceArchived = (workspaceId: string) =>
        Effect.succeed(undefined);
      const migrateChatAppsToWorkspace = (
        appIds: string[],
        targetWorkspaceId: string
      ) => Effect.succeed(undefined);
      const saveChatAppLayout = (appId: string, layout: LayoutConfig) =>
        Effect.succeed(undefined);
      const restoreChatAppLayout = (appId: string) => Effect.succeed(null);
      const saveWorkspaceLayout = (
        workspaceId: string,
        layout: WorkspaceLayoutConfig
      ) => Effect.succeed(undefined);
      const executeOperation = (operation: any) => Effect.succeed(undefined);

      // Command dispatch method
      const dispatch = (command: ChatAppsCommand) =>
        Queue.offer(commandQueue, command);

      return {
        getState,
        setState,
        resetState,
        registerChatApp,
        unregisterChatApp,
        getChatAppInstance,
        getAllChatApps,
        getChatAppsInWorkspace,
        setChatAppStatus,
        expandChatApp,
        compactChatApp,
        stashChatApp,
        closeChatApp,
        archiveChatApp,
        restoreChatApp,
        setActiveChatApp,
        getActiveChatApp,
        clearActiveChatApp,
        setWorkspaceMaxExpandedApps,
        getWorkspaceMaxExpandedApps,
        enforceCapacityLimits,
        getExpandedAppsInWorkspace,
        enterFocusMode,
        exitFocusMode,
        getFocusedApp,
        isFocusModeActive,
        expandMultipleChatApps,
        stashAllAppsInWorkspace,
        closeAllAppsInWorkspace,
        restoreWorkspaceLayout,
        updateChatAppConfig,
        getChatAppConfig,
        switchChatAppAgent,
        getChatAppAgent,
        getStats,
        getWorkspaceStats,
        getChatAppMetrics,
        subscribe,
        onWorkspaceActivated,
        onWorkspaceArchived,
        migrateChatAppsToWorkspace,
        saveChatAppLayout,
        restoreChatAppLayout,
        saveWorkspaceLayout,
        executeOperation,
        getLastOperation,
        isOperationInProgress,
        debugGetAllInstances,
        debugResetState,
        debugValidateState,
        dispatch,
      } satisfies ChatAppsManagerApi;
    }),
    dependencies: [],
  }
) {}

import { WorkspaceManager } from "@/managers/workspace-component";
import { AppService } from "@/services/app";
import type { ChatAppConfig } from "@/types/global";
import { Effect, Ref } from "effect";
import type { WorkspaceLLMApi } from "./api";
import {
  ChatAppToolError,
  LLMAPIInitializationError,
  LLMConfigurationError,
  LLMValidationError,
  WorkspaceLLMError,
  WorkspaceToolError,
} from "./errors";
import {
  type BuddyWorkspaceAPI,
  type ChatAppEntry,
  type ChatAppStatus,
  type CreateWorkspaceOptions,
  type LLMToolFunctions,
  type ListChatAppsOptions,
  type ListWorkspacesOptions,
  WORKSPACE_LLM_CONSTANTS,
  type WorkspaceEntry,
  type WorkspaceStats,
  generateWorkspaceId,
  validateChatAppStatus,
  validateWorkspaceId,
} from "./types";

export class WorkspaceLLMService extends Effect.Service<WorkspaceLLMApi>()(
  "WorkspaceLLMService",
  {
    scoped: Effect.gen(function* () {
      const workspaceManager = yield* WorkspaceManager;
      const appService = yield* AppService;

      // Track initialization state
      const isInitializedRef = yield* Ref.make(false);

      // Core initialization
      const initializeAPI = () =>
        Effect.gen(function* () {
          console.log("[LLM API] Initializing Buddy Workspace API...");

          // Create the API implementation
          const api = yield* createBuddyWorkspaceAPI();

          // Attach to window
          yield* attachToWindow(api);

          // Mark as initialized
          yield* Ref.set(isInitializedRef, true);

          console.log(
            "[LLM API] Buddy Workspace API initialized and attached to window.buddyWorkspace"
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new LLMAPIInitializationError({
                message: "Failed to initialize LLM API",
                cause,
              })
          )
        );

      const isInitialized = () => Ref.get(isInitializedRef);

      // Window API management
      const attachToWindow = (api: BuddyWorkspaceAPI) =>
        Effect.gen(function* () {
          if (typeof window !== "undefined") {
            window.buddyWorkspace = api;
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceLLMError({
                operation: "attachToWindow",
                message: "Failed to attach API to window",
                cause,
              })
          )
        );

      const getWindowAPI = () =>
        Effect.succeed(
          typeof window !== "undefined" ? window.buddyWorkspace ?? null : null
        );

      // Workspace operations
      const createWorkspace = (options: CreateWorkspaceOptions) =>
        Effect.gen(function* () {
          console.log("[LLM API] Creating workspace:", options);

          if (!options.name?.trim()) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "name",
                message: "Workspace name is required",
                value: options.name,
              })
            );
          }

          if (
            options.name.length >
            WORKSPACE_LLM_CONSTANTS.MAX_WORKSPACE_NAME_LENGTH
          ) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "name",
                message: `Workspace name must be ${WORKSPACE_LLM_CONSTANTS.MAX_WORKSPACE_NAME_LENGTH} characters or less`,
                value: options.name,
              })
            );
          }

          const workspaceId = yield* workspaceManager.createWorkspace({
            name: options.name,
            description: options.description,
            icon: options.icon || WORKSPACE_LLM_CONSTANTS.DEFAULT_ICON,
            color: options.color || WORKSPACE_LLM_CONSTANTS.DEFAULT_COLOR,
            availableAgents: options.availableAgents || [
              ...WORKSPACE_LLM_CONSTANTS.DEFAULT_AGENTS,
            ],
          });

          console.log("[LLM API] Created workspace:", workspaceId);
          return workspaceId;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "create",
                details: String(cause),
                cause,
              })
          )
        );

      const listWorkspaces = (options?: ListWorkspacesOptions) =>
        Effect.gen(function* () {
          console.log("[LLM API] Listing workspaces:", options);

          const state = yield* workspaceManager.getState();
          const workspaces = Object.values(state.workspaces);

          const filtered = options?.includeArchived
            ? workspaces
            : workspaces.filter((w) => !w.isArchived);

          console.log("[LLM API] Found workspaces:", filtered.length);
          return filtered;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "list",
                details: String(cause),
                cause,
              })
          )
        );

      const activateWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          console.log("[LLM API] Activating workspace:", workspaceId);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          yield* workspaceManager.setActiveWorkspace(workspaceId);
          console.log("[LLM API] Activated workspace:", workspaceId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "activate",
                details: String(cause),
                cause,
              })
          )
        );

      const updateWorkspace = (
        workspaceId: string,
        updates: Partial<WorkspaceEntry>
      ) =>
        Effect.gen(function* () {
          console.log("[LLM API] Updating workspace:", workspaceId, updates);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          yield* workspaceManager.updateWorkspace(workspaceId, updates);
          console.log("[LLM API] Updated workspace:", workspaceId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "update",
                details: String(cause),
                cause,
              })
          )
        );

      const archiveWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          console.log("[LLM API] Archiving workspace:", workspaceId);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          yield* workspaceManager.archiveWorkspace(workspaceId);
          console.log("[LLM API] Archived workspace:", workspaceId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "archive",
                details: String(cause),
                cause,
              })
          )
        );

      const restoreWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          console.log("[LLM API] Restoring workspace:", workspaceId);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          yield* workspaceManager.restoreWorkspace(workspaceId);
          console.log("[LLM API] Restored workspace:", workspaceId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "restore",
                details: String(cause),
                cause,
              })
          )
        );

      // Chat app operations
      const addChatApp = (
        workspaceId: string,
        config: ChatAppConfig | string
      ) =>
        Effect.gen(function* () {
          console.log("[LLM API] Adding chat app:", workspaceId, config);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          let chatAppConfig: ChatAppConfig;

          if (typeof config === "string") {
            // Load predefined config
            const configs = yield* appService.getAll();
            const foundConfig = configs.find((c) => c.id === config);

            if (!foundConfig) {
              return yield* Effect.fail(
                new LLMConfigurationError({
                  configId: config,
                  message: `Configuration '${config}' not found`,
                })
              );
            }

            chatAppConfig = foundConfig;
          } else {
            chatAppConfig = config;
          }

          // Ensure the config has the correct workspace ID
          const configWithWorkspace = {
            ...chatAppConfig,
            spaceId: workspaceId,
            workspaceId: workspaceId,
          };

          yield* workspaceManager.addChatApps([configWithWorkspace]);
          console.log("[LLM API] Added chat app:", configWithWorkspace.id);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppToolError({
                operation: "add",
                details: String(cause),
                cause,
              })
          )
        );

      const listChatApps = (options?: ListChatAppsOptions) =>
        Effect.gen(function* () {
          console.log("[LLM API] Listing chat apps:", options);

          const state = yield* workspaceManager.getState();
          let chatApps = Object.values(state.chatApps);

          // Filter by workspace
          if (options?.workspaceId) {
            chatApps = chatApps.filter(
              (app) => app.workspaceId === options.workspaceId
            );
          } else {
            // Use current workspace
            const currentWorkspaceId = state.currentWorkspaceId;
            if (currentWorkspaceId) {
              chatApps = chatApps.filter(
                (app) => app.workspaceId === currentWorkspaceId
              );
            }
          }

          // Filter by status
          if (options?.status) {
            chatApps = chatApps.filter((app) => app.status === options.status);
          }

          // Filter archived
          if (!options?.includeArchived) {
            chatApps = chatApps.filter((app) => !app.isArchived);
          }

          console.log("[LLM API] Found chat apps:", chatApps.length);
          return chatApps;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppToolError({
                operation: "list",
                details: String(cause),
                cause,
              })
          )
        );

      const setChatAppStatus = (
        workspaceId: string,
        appId: string,
        status: ChatAppStatus
      ) =>
        Effect.gen(function* () {
          console.log(
            "[LLM API] Setting chat app status:",
            workspaceId,
            appId,
            status
          );

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          if (!appId?.trim()) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "appId",
                message: "App ID is required",
                value: appId,
              })
            );
          }

          if (!validateChatAppStatus(status)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "status",
                message: "Invalid status",
                value: status,
              })
            );
          }

          // Map status to appropriate service method
          switch (status) {
            case "expanded":
              yield* workspaceManager.expandChatApp(appId);
              break;
            case "compact":
              yield* workspaceManager.compactChatApp(appId);
              break;
            case "stashed":
              yield* workspaceManager.stashChatApp(appId);
              break;
            case "closed":
              yield* workspaceManager.closeChatApp(appId);
              break;
          }

          console.log("[LLM API] Set chat app status:", appId, status);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppToolError({
                operation: "setStatus",
                details: String(cause),
                cause,
              })
          )
        );

      const enterFocusMode = (workspaceId: string, appId: string) =>
        Effect.gen(function* () {
          console.log("[LLM API] Entering focus mode:", workspaceId, appId);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          if (!appId?.trim()) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "appId",
                message: "App ID is required",
                value: appId,
              })
            );
          }

          yield* workspaceManager.enterFocusMode(workspaceId, appId);
          console.log("[LLM API] Entered focus mode:", appId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppToolError({
                operation: "enterFocus",
                details: String(cause),
                cause,
              })
          )
        );

      const exitFocusMode = (workspaceId: string) =>
        Effect.gen(function* () {
          console.log("[LLM API] Exiting focus mode:", workspaceId);

          if (!validateWorkspaceId(workspaceId)) {
            return yield* Effect.fail(
              new LLMValidationError({
                field: "workspaceId",
                message: "Invalid workspace ID",
                value: workspaceId,
              })
            );
          }

          yield* workspaceManager.exitFocusMode(workspaceId);
          console.log("[LLM API] Exited focus mode:", workspaceId);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatAppToolError({
                operation: "exitFocus",
                details: String(cause),
                cause,
              })
          )
        );

      // Utility operations
      const getCurrentWorkspace = () =>
        Effect.gen(function* () {
          console.log("[LLM API] Getting current workspace");

          const currentWorkspace =
            yield* workspaceManager.getCurrentWorkspace();
          console.log("[LLM API] Current workspace:", currentWorkspace?.name);
          return currentWorkspace;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "getCurrent",
                details: String(cause),
                cause,
              })
          )
        );

      const getActiveWorkspaces = () =>
        Effect.gen(function* () {
          console.log("[LLM API] Getting active workspaces");

          const activeWorkspaces =
            yield* workspaceManager.getActiveWorkspacesList();
          console.log("[LLM API] Active workspaces:", activeWorkspaces.length);
          return activeWorkspaces;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "getActive",
                details: String(cause),
                cause,
              })
          )
        );

      const getWorkspaceStats = () =>
        Effect.gen(function* () {
          console.log("[LLM API] Getting workspace stats");

          const stats = yield* workspaceManager.getWorkspaceStats();

          const workspaceStats: WorkspaceStats = {
            totalWorkspaces: stats.totalWorkspaces,
            activeWorkspaces: stats.activeWorkspaces,
            archivedWorkspaces: stats.archivedWorkspaces,
            totalChatApps: stats.totalChatApps,
            activeChatApps: stats.activeChatApps,
          };

          console.log("[LLM API] Workspace stats:", workspaceStats);
          return workspaceStats;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceToolError({
                operation: "getStats",
                details: String(cause),
                cause,
              })
          )
        );

      // LLM tool functions
      const getToolFunctions = () =>
        Effect.gen(function* () {
          const toolFunctions: LLMToolFunctions = {
            create_workspace: async (args: CreateWorkspaceOptions) => {
              return await createWorkspace(args).pipe(Effect.runPromise);
            },
            list_workspaces: async (args?: ListWorkspacesOptions) => {
              return await listWorkspaces(args).pipe(Effect.runPromise);
            },
            activate_workspace: async (args: { workspaceId: string }) => {
              await activateWorkspace(args.workspaceId).pipe(Effect.runPromise);
              return `Activated workspace: ${args.workspaceId}`;
            },
            update_workspace: async (
              args: { workspaceId: string } & Partial<WorkspaceEntry>
            ) => {
              const { workspaceId, ...updates } = args;
              await updateWorkspace(workspaceId, updates).pipe(
                Effect.runPromise
              );
              return `Updated workspace: ${workspaceId}`;
            },
            archive_workspace: async (args: { workspaceId: string }) => {
              await archiveWorkspace(args.workspaceId).pipe(Effect.runPromise);
              return `Archived workspace: ${args.workspaceId}`;
            },
            add_chat_app: async (args: {
              workspaceId: string;
              configId?: string;
              customConfig?: ChatAppConfig;
            }) => {
              const config = args.configId || args.customConfig;
              if (!config) {
                throw new Error(
                  "Either configId or customConfig must be provided"
                );
              }
              await addChatApp(args.workspaceId, config).pipe(
                Effect.runPromise
              );
              return `Added chat app to workspace: ${args.workspaceId}`;
            },
            list_chat_apps: async (args?: ListChatAppsOptions) => {
              return await listChatApps(args).pipe(Effect.runPromise);
            },
            set_chat_app_status: async (args: {
              workspaceId: string;
              appId: string;
              status: ChatAppStatus;
            }) => {
              await setChatAppStatus(
                args.workspaceId,
                args.appId,
                args.status
              ).pipe(Effect.runPromise);
              return `Set chat app ${args.appId} status to: ${args.status}`;
            },
            enter_focus_mode: async (args: {
              workspaceId: string;
              appId: string;
            }) => {
              await enterFocusMode(args.workspaceId, args.appId).pipe(
                Effect.runPromise
              );
              return `Entered focus mode on app: ${args.appId}`;
            },
            exit_focus_mode: async (args: { workspaceId: string }) => {
              await exitFocusMode(args.workspaceId).pipe(Effect.runPromise);
              return `Exited focus mode in workspace: ${args.workspaceId}`;
            },
            get_current_workspace: async () => {
              return await getCurrentWorkspace().pipe(Effect.runPromise);
            },
            get_active_workspaces: async () => {
              return await getActiveWorkspaces().pipe(Effect.runPromise);
            },
            get_workspace_stats: async () => {
              return await getWorkspaceStats().pipe(Effect.runPromise);
            },
          };

          return toolFunctions;
        });

      const createBuddyWorkspaceAPI = () =>
        Effect.gen(function* () {
          const api: BuddyWorkspaceAPI = {
            createWorkspace: async (options: CreateWorkspaceOptions) => {
              return await createWorkspace(options).pipe(Effect.runPromise);
            },
            listWorkspaces: async (options?: ListWorkspacesOptions) => {
              return await listWorkspaces(options).pipe(Effect.runPromise);
            },
            activateWorkspace: async (workspaceId: string) => {
              return await activateWorkspace(workspaceId).pipe(
                Effect.runPromise
              );
            },
            updateWorkspace: async (
              workspaceId: string,
              updates: Partial<WorkspaceEntry>
            ) => {
              return await updateWorkspace(workspaceId, updates).pipe(
                Effect.runPromise
              );
            },
            archiveWorkspace: async (workspaceId: string) => {
              return await archiveWorkspace(workspaceId).pipe(
                Effect.runPromise
              );
            },
            restoreWorkspace: async (workspaceId: string) => {
              return await restoreWorkspace(workspaceId).pipe(
                Effect.runPromise
              );
            },
            addChatApp: async (
              workspaceId: string,
              config: ChatAppConfig | string
            ) => {
              return await addChatApp(workspaceId, config).pipe(
                Effect.runPromise
              );
            },
            listChatApps: async (options?: ListChatAppsOptions) => {
              return await listChatApps(options).pipe(Effect.runPromise);
            },
            setChatAppStatus: async (
              workspaceId: string,
              appId: string,
              status: ChatAppStatus
            ) => {
              return await setChatAppStatus(workspaceId, appId, status).pipe(
                Effect.runPromise
              );
            },
            enterFocusMode: async (workspaceId: string, appId: string) => {
              return await enterFocusMode(workspaceId, appId).pipe(
                Effect.runPromise
              );
            },
            exitFocusMode: async (workspaceId: string) => {
              return await exitFocusMode(workspaceId).pipe(Effect.runPromise);
            },
            getCurrentWorkspace: async () => {
              return await getCurrentWorkspace().pipe(Effect.runPromise);
            },
            getActiveWorkspaces: async () => {
              return await getActiveWorkspaces().pipe(Effect.runPromise);
            },
            getWorkspaceStats: async () => {
              return await getWorkspaceStats().pipe(Effect.runPromise);
            },
          };

          return api;
        });

      return {
        initializeAPI,
        isInitialized,
        attachToWindow,
        getWindowAPI,
        createWorkspace,
        listWorkspaces,
        activateWorkspace,
        updateWorkspace,
        archiveWorkspace,
        restoreWorkspace,
        addChatApp,
        listChatApps,
        setChatAppStatus,
        enterFocusMode,
        exitFocusMode,
        getCurrentWorkspace,
        getActiveWorkspaces,
        getWorkspaceStats,
        getToolFunctions,
        createBuddyWorkspaceAPI,
      } satisfies WorkspaceLLMApi;
    }),
    dependencies: [WorkspaceManager.Default, AppService.Default],
  }
) {}

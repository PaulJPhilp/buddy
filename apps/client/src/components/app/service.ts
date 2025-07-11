import { ConfigService } from "@/services/config";
import type { AppDomainModel, WorkspaceModel } from "@domain/index";
import { Effect, Layer, Ref } from "effect";
import type { AppComponentApi } from "./api";
import {
  AppComponentError,
  AppConfigLoadError,
  AppWorkspaceError,
} from "./errors";
import type { AppComponentConfig, AppComponentState } from "./types";
import { createDefaultAppState } from "./types";

export class AppComponent extends Effect.Service<AppComponentApi>()(
  "AppComponent",
  {
    scoped: Effect.gen(function* () {
      const configService = yield* ConfigService;
      const stateRef = yield* Ref.make<AppComponentState>(
        createDefaultAppState()
      );
      const subscribersRef = yield* Ref.make<
        Array<(state: AppComponentState) => void>
      >([]);

      const setState = (updates: Partial<AppComponentState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const newState = {
            ...currentState,
            ...updates,
            lastUpdated: Date.now(),
          };
          yield* Ref.set(stateRef, newState);

          // Notify subscribers
          const subscribers = yield* Ref.get(subscribersRef);
          yield* Effect.forEach(subscribers, (callback) =>
            Effect.sync(() => callback(newState))
          );
        });

      const getState = () => Ref.get(stateRef);

      const loadConfig = (configPath?: string) =>
        Effect.gen(function* () {
          yield* setState({ isLoading: true });

          try {
            const path = configPath || "/static/configs/workspaces/index.json";

            // Fetch the configuration via API route
            const apiUrl = `/api/configs?path=${encodeURIComponent(path)}`;
            const response = yield* Effect.tryPromise({
              try: () => fetch(apiUrl),
              catch: (error) =>
                new AppConfigLoadError({
                  message: "Failed to fetch configuration",
                  configPath: path,
                  cause: error,
                }),
            });

            if (!response.ok) {
              yield* Effect.fail(
                new AppConfigLoadError({
                  message: `Configuration not found: ${response.status}`,
                  configPath: path,
                })
              );
            }

            const configData = yield* Effect.tryPromise({
              try: () => response.json(),
              catch: (error) =>
                new AppConfigLoadError({
                  message: "Failed to parse configuration JSON",
                  configPath: path,
                  cause: error,
                }),
            });

            // Load workspace configurations if available
            const workspaces: WorkspaceModel[] = [];
            if (configData.workspaces && Array.isArray(configData.workspaces)) {
              for (const workspaceRef of configData.workspaces) {
                try {
                  const workspacePath =
                    workspaceRef.configPath ||
                    `/static/configs/workspaces/${workspaceRef.id}/workspace.json`;
                  const wsApiUrl = `/api/configs?path=${encodeURIComponent(
                    workspacePath
                  )}`;
                  const wsResponse = yield* Effect.tryPromise({
                    try: () => fetch(wsApiUrl),
                    catch: () => null,
                  });

                  if (wsResponse?.ok) {
                    const workspaceData = yield* Effect.tryPromise({
                      try: () => wsResponse.json(),
                      catch: () => null,
                    });

                    if (workspaceData) {
                      const workspace: WorkspaceModel = {
                        id: workspaceData.id,
                        name: workspaceData.name,
                        description: workspaceData.description || "",
                        chatappIds: workspaceData.chatappIds || [],
                        agentIds: workspaceData.agentIds || [],
                        permissions: {
                          canAddApps: true,
                          canRemoveApps: true,
                          canModifyLayout: true,
                          canChangeSettings: true,
                          canInviteUsers: false,
                          canManagePermissions: false,
                        },
                        isDefault: false,
                        isArchived: workspaceData.isArchived || false,
                        maxExpandedApps: workspaceData.maxExpandedApps || 2,
                        createdAt:
                          workspaceData.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        metadata: {
                          icon: workspaceData.icon,
                          primaryColor:
                            workspaceData.primaryColor ||
                            workspaceData.style?.primaryColor,
                          activeAppId: workspaceData.activeAppId,
                          style: workspaceData.style,
                        },
                      };
                      workspaces.push(workspace);
                    }
                  }
                } catch (error) {
                  console.warn(
                    `Failed to load workspace ${workspaceRef.id}:`,
                    error
                  );
                }
              }
            }

            // Load chat apps referenced by workspaces
            const chatApps: any[] = [];
            const allChatAppIds = new Set<string>();

            // Collect all unique chat app IDs from workspaces
            for (const workspace of workspaces) {
              for (const chatAppId of workspace.chatappIds) {
                allChatAppIds.add(chatAppId);
              }
            }

            console.log(
              `DEBUG: Found ${allChatAppIds.size} unique chat app IDs from workspaces:`,
              Array.from(allChatAppIds)
            );

            // Load each chat app config
            for (const chatAppId of allChatAppIds) {
              try {
                // Remove '-chat' suffix to get the file name
                const fileName = chatAppId.replace("-chat", "");
                const chatAppPath = `/static/configs/chatapps/${fileName}.json`;
                const chatAppApiUrl = `/api/configs?path=${encodeURIComponent(
                  chatAppPath
                )}`;
                console.log(
                  `DEBUG: Loading chat app ${chatAppId} from ${chatAppPath}`
                );

                const chatAppResponse = yield* Effect.tryPromise({
                  try: () => fetch(chatAppApiUrl),
                  catch: () => null,
                });

                if (chatAppResponse?.ok) {
                  const chatAppData = yield* Effect.tryPromise({
                    try: () => chatAppResponse.json(),
                    catch: () => null,
                  });

                  if (chatAppData) {
                    console.log(`DEBUG: Successfully loaded chat app:`, {
                      id: chatAppData.id,
                      name: chatAppData.name,
                    });
                    chatApps.push(chatAppData);
                  } else {
                    console.warn(
                      `DEBUG: Failed to parse JSON for chat app ${chatAppId}`
                    );
                  }
                } else {
                  console.warn(
                    `DEBUG: Failed to fetch chat app ${chatAppId}, response status:`,
                    chatAppResponse?.status
                  );
                }
              } catch (error) {
                console.warn(`Failed to load chat app ${chatAppId}:`, error);
              }
            }

            console.log(
              `DEBUG: Successfully loaded ${chatApps.length} chat apps:`,
              chatApps.map((app) => ({ id: app.id, name: app.name }))
            );

            // Create app domain model from config data
            const appConfig: AppDomainModel = {
              app: {
                name: configData.app?.name || configData.name || "Buddy App",
                version:
                  configData.app?.version || configData.version || "1.0.0",
                description:
                  configData.app?.description || configData.description || "",
                environment: configData.app?.environment || "development",
                locale: configData.app?.locale || "en",
                timezone: configData.app?.timezone || "UTC",
              },
              workspaces: workspaces, // Use the processed workspaces array, not configData.workspaces
              chatapps: [...(configData.chatapps || []), ...chatApps], // Include both config and loaded chat apps
              agents: configData.agents || [],
              version: configData.version || "1.0.0",
              createdAt: configData.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: configData.metadata || {},
            };

            yield* setState({
              appConfig,
              isConfigLoaded: true,
              isLoading: false,
            });

            return appConfig;
          } catch (error) {
            yield* setState({ isLoading: false });
            yield* Effect.fail(error);
          }
        });

      const getWorkspaces = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          if (!state.appConfig?.workspaces) {
            return [];
          }

          return state.appConfig.workspaces;
        });

      return {
        initialize: (config: AppComponentConfig) =>
          Effect.gen(function* () {
            yield* setState({
              isInitialized: true,
              componentId: config.id,
              metadata: { config },
            });

            if (config.autoLoadConfig) {
              yield* loadConfig(config.configPath);
            }

            if (config.autoRenderShell) {
              yield* setState({ isAppShellRendered: true });
            }
          }),

        getState,

        setState,

        subscribe: (callback: (state: AppComponentState) => void) =>
          Effect.gen(function* () {
            const subscribers = yield* Ref.get(subscribersRef);
            yield* Ref.set(subscribersRef, [...subscribers, callback]);

            return () =>
              Effect.gen(function* () {
                const currentSubscribers = yield* Ref.get(subscribersRef);
                yield* Ref.set(
                  subscribersRef,
                  currentSubscribers.filter((s) => s !== callback)
                );
              });
          }),

        cleanup: () =>
          Effect.gen(function* () {
            yield* Ref.set(subscribersRef, []);
            yield* setState(createDefaultAppState());
          }),

        loadConfig,

        reloadConfig: () =>
          Effect.gen(function* () {
            const state = yield* getState();
            const config = state.metadata?.config as
              | AppComponentConfig
              | undefined;
            const configPath =
              config?.configPath || "/static/configs/workspaces/index.json";
            return yield* loadConfig(configPath);
          }),

        getAppConfig: () =>
          Effect.gen(function* () {
            const state = yield* getState();
            return state.appConfig;
          }),

        setCurrentWorkspace: (workspaceId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();

            // Check if config is loaded first
            if (!state.isConfigLoaded || !state.appConfig) {
              console.warn(
                "[AppComponent] setCurrentWorkspace called before config is loaded"
              );
              return; // Silently return instead of failing
            }

            const workspaces = yield* getWorkspaces();

            const workspace = workspaces.find((ws) => ws.id === workspaceId);

            if (!workspace) {
              console.warn(
                `[AppComponent] Workspace not found: ${workspaceId}, available: ${workspaces
                  .map((w) => w.id)
                  .join(", ")}`
              );
              return; // Silently return instead of failing
            }

            yield* setState({ currentWorkspaceId: workspaceId });
          }),

        getCurrentWorkspace: () =>
          Effect.gen(function* () {
            const state = yield* getState();
            if (!state.currentWorkspaceId) {
              return null;
            }

            const workspaces = yield* getWorkspaces();
            return (
              workspaces.find((ws) => ws.id === state.currentWorkspaceId) ||
              null
            );
          }),

        getWorkspaces,

        renderAppShell: () =>
          Effect.gen(function* () {
            yield* setState({ isAppShellRendered: true });
          }),

        isAppShellRendered: () =>
          Effect.gen(function* () {
            const state = yield* getState();
            return state.isAppShellRendered;
          }),
      };
    }),
    dependencies: [ConfigService.Default],
  }
) {}

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

// In-memory cache for chat app configs (session-scoped)
const chatAppConfigCache = new Map<string, any>(); // Use ChatAppConfig type if available

// Helper: Fetch chat app configs for a set of IDs (cache-aware, parallel)
function fetchChatAppConfigs(chatAppIds: string[]) {
  const fetchEffects = chatAppIds.map((chatAppId) => {
    // Remove '-chat' suffix to get the file name
    const fileName = chatAppId.replace("-chat", "");
    const chatAppPath = `/static/configs/chatapps/${fileName}.json`;
    if (chatAppConfigCache.has(chatAppId)) {
      return Effect.succeed(chatAppConfigCache.get(chatAppId));
    }
    const chatAppApiUrl = `/api/configs?path=${encodeURIComponent(
      chatAppPath
    )}`;
    return Effect.tryPromise({
      try: () => fetch(chatAppApiUrl),
      catch: () => null,
    }).pipe(
      Effect.flatMap((chatAppResponse) =>
        chatAppResponse?.ok
          ? Effect.tryPromise({
              try: () => chatAppResponse.json(),
              catch: () => null,
            }).pipe(
              Effect.tap((chatAppData) => {
                if (chatAppData) chatAppConfigCache.set(chatAppId, chatAppData);
                return Effect.void;
              })
            )
          : Effect.succeed(null)
      )
    );
  });
  return Effect.all(fetchEffects).pipe(
    Effect.map((results) => results.filter(Boolean))
  );
}

export { fetchChatAppConfigs };

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

            // Timing: Start config fetch
            const t0 = performance.now();

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

            const t1 = performance.now();
            console.log(
              `[AppComponent] Config index fetch took ${(t1 - t0).toFixed(1)}ms`
            );

            // Load workspace configurations in parallel
            let workspaces: WorkspaceModel[] = [];
            if (configData.workspaces && Array.isArray(configData.workspaces)) {
              const workspaceFetches = configData.workspaces.map(
                (workspaceRef: any) => {
                  const workspacePath =
                    workspaceRef.configPath ||
                    `/static/configs/workspaces/${workspaceRef.id}/workspace.json`;
                  const wsApiUrl = `/api/configs?path=${encodeURIComponent(
                    workspacePath
                  )}`;
                  return fetch(wsApiUrl)
                    .then((wsResponse) =>
                      wsResponse.ok ? wsResponse.json() : null
                    )
                    .then((workspaceData) => {
                      if (workspaceData) {
                        return {
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
                      }
                      return null;
                    })
                    .catch((error) => {
                      console.warn(
                        `Failed to load workspace ${workspaceRef.id}:`,
                        error
                      );
                      return null;
                    });
                }
              );
              const t2 = performance.now();
              // Await all workspace fetches in parallel
              const workspaceResults = yield* Effect.tryPromise({
                try: () => Promise.all(workspaceFetches),
                catch: (error) => error,
              });
              workspaces = workspaceResults.filter(Boolean);
              const t3 = performance.now();
              console.log(
                `[AppComponent] Workspace configs fetch took ${(
                  t3 - t2
                ).toFixed(1)}ms for ${workspaces.length} workspaces`
              );
            }

            // ADDED LOGGING: Log parsed workspaces after loading
            console.log(
              "[AppComponent] loadConfig: parsed workspaces:",
              workspaces
            );

            // Load chat apps referenced by workspaces
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

            // Determine the active workspace (first, or by some logic)
            const activeWorkspace = workspaces[0]; // Replace with actual logic if needed
            const activeChatAppIds = activeWorkspace
              ? activeWorkspace.chatappIds
              : [];

            // Only fetch/register chat apps for the active workspace at startup
            const t4 = performance.now();
            const chatApps = yield* fetchChatAppConfigs(activeChatAppIds);
            const t5 = performance.now();
            console.log(
              `[AppComponent] Chat app configs fetch took ${(t5 - t4).toFixed(
                1
              )}ms for ${activeChatAppIds.length} chat apps`
            );

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

            // After loading workspaces and chat apps
            if (workspaces.length > 0) {
              const activeWorkspace = workspaces[0];
              const activeChatAppIds = activeWorkspace
                ? activeWorkspace.chatappIds
                : [];
              const chatApps = yield* fetchChatAppConfigs(activeChatAppIds);

              // Set the first workspace as active in the state (only valid properties)
              yield* setState({
                appConfig: {
                  ...appConfig,
                  workspaces,
                  chatapps: [...(configData.chatapps || []), ...chatApps],
                },
                isConfigLoaded: true,
                isLoading: false,
                error: null,
              });
            } else {
              // No workspaces found, set error/empty state (only valid properties)
              yield* setState({
                appConfig: {
                  ...appConfig,
                  workspaces: [],
                  chatapps: [],
                },
                isConfigLoaded: true,
                isLoading: false,
                error: "No workspaces found in configuration.",
              });
            }

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
            console.log(
              "[AppComponent] getWorkspaces: no workspaces in appConfig"
            );
            return [];
          }
          console.log(
            "[AppComponent] getWorkspaces: returning workspaces:",
            state.appConfig.workspaces
          );
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

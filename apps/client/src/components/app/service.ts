import { CoreComponent } from "@/components/core";
import {
  CoreComponentCleanupError,
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
} from "@/components/core/errors";
import type { CoreComponentConfig } from "@/components/core/types";
import type { AppDomainModel, WorkspaceModel } from "@domain/index";
import { ConfigService } from "@services/config";
import { Effect, Ref } from "effect";
import { WorkspaceComponent } from "../workspace";
import type { AppComponentApi } from "./api";
import {
  AppConfigLoadError,
  AppConfigValidationError,
  AppInitializationError,
  AppShellRenderError,
  AppStateError,
  AppWorkspaceError,
} from "./errors";
import type { AppComponentConfig, AppComponentState } from "./types";
import { createDefaultAppState } from "./types";

export class AppComponent extends Effect.Service<AppComponentApi>()(
  "AppComponent",
  {
    scoped: Effect.gen(function* () {
      // Get core component functionality and config service
      const coreComponent = yield* CoreComponent;
      const configService = yield* ConfigService;
      const workspaceComponent = yield* WorkspaceComponent;

      // App-specific state
      const appStateRef = yield* Ref.make<AppComponentState>(
        createDefaultAppState()
      );
      const appConfigRef = yield* Ref.make<AppDomainModel | null>(null);
      const configPathRef = yield* Ref.make<string | null>(null);

      // Helper to validate app config using ConfigService
      const validateAppConfig = (
        config: unknown
      ): Effect.Effect<AppDomainModel, AppConfigValidationError> =>
        Effect.gen(function* () {
          const validation = yield* configService
            .validateConfig(config, {
              strict: true,
              checkDuplicates: true,
              validateReferences: true,
            })
            .pipe(
              Effect.mapError(
                (cause) =>
                  new AppConfigValidationError({
                    message: "Config service validation failed",
                    field: "root",
                    cause,
                  })
              )
            );

          if (!validation.isValid) {
            const errorMessages = validation.errors
              .map((e) => e.message)
              .join(", ");
            yield* Effect.fail(
              new AppConfigValidationError({
                message: `Config validation failed: ${errorMessages}`,
                field: "root",
              })
            );
          }

          return config as AppDomainModel;
        });

      // Load configuration
      const loadConfig = (configPath?: string) =>
        Effect.gen(function* () {
          const pathToUse =
            configPath || (yield* Ref.get(configPathRef)) || "./app.json";

          const config = yield* configService.loadConfig(pathToUse, {
            validateOnLoad: true,
            mergeDefaults: true,
          });

          const validatedConfig = yield* validateAppConfig(config);

          // Store config
          yield* Ref.set(appConfigRef, validatedConfig);
          yield* Ref.set(configPathRef, pathToUse);

          // Initialize workspace component with workspaces from config
          yield* Effect.forEach(
            validatedConfig.workspaces,
            (workspace) =>
              workspaceComponent.loadWorkspace(workspace).pipe(
                Effect.catchAll((error) => {
                  console.warn(
                    `Failed to load workspace ${workspace.id}:`,
                    error
                  );
                  return Effect.succeed(undefined);
                })
              ),
            { concurrency: "unbounded" }
          );

          // Load agents for workspace component
          yield* workspaceComponent.loadAgents(validatedConfig.agents).pipe(
            Effect.catchAll((error) => {
              console.warn("Failed to load agents:", error);
              return Effect.succeed(undefined);
            })
          );

          // Load chat apps for workspace component
          yield* workspaceComponent.loadChatApps(validatedConfig.chatapps).pipe(
            Effect.catchAll((error) => {
              console.warn("Failed to load chat apps:", error);
              return Effect.succeed(undefined);
            })
          );

          yield* setState({
            appConfig: validatedConfig,
            isConfigLoaded: true,
          });

          yield* Effect.log(`Configuration loaded from ${pathToUse}`);
          return validatedConfig;
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof AppConfigValidationError
              ? cause
              : new AppConfigLoadError({
                  message: "Failed to load configuration",
                  configPath: configPath || "unknown",
                  cause,
                })
          )
        );

      // Reload configuration
      const reloadConfig = () =>
        Effect.gen(function* () {
          const configPath = yield* Ref.get(configPathRef);
          if (!configPath) {
            yield* Effect.fail(
              new AppConfigLoadError({
                message: "No config path available for reload",
                configPath: "unknown",
              })
            );
          }

          return yield* loadConfig(configPath);
        });

      // Get app configuration
      const getAppConfig = () =>
        Effect.gen(function* () {
          return yield* Ref.get(appConfigRef);
        });

      // Set current workspace
      const setCurrentWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const config = yield* Ref.get(appConfigRef);
          if (!config) {
            yield* Effect.fail(
              new AppWorkspaceError({
                message: "No app config loaded",
                workspaceId,
                operation: "set",
              })
            );
          }

          const workspace = config.workspaces.find((w) => w.id === workspaceId);
          if (!workspace) {
            yield* Effect.fail(
              new AppWorkspaceError({
                message: `Workspace not found: ${workspaceId}`,
                workspaceId,
                operation: "set",
              })
            );
          }

          // Switch workspace in workspace component
          yield* workspaceComponent.switchWorkspace(workspace);

          yield* setState({ currentWorkspaceId: workspaceId });
          yield* Effect.log(`Current workspace set to: ${workspaceId}`);
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof AppWorkspaceError
              ? cause
              : new AppWorkspaceError({
                  message: "Failed to set current workspace",
                  workspaceId,
                  operation: "set",
                  cause,
                })
          )
        );

      // Get current workspace
      const getCurrentWorkspace = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          if (!state.currentWorkspaceId || !state.appConfig) {
            return null;
          }

          return (
            state.appConfig.workspaces.find(
              (w) => w.id === state.currentWorkspaceId
            ) || null
          );
        });

      // Get all workspaces
      const getWorkspaces = () =>
        Effect.gen(function* () {
          const config = yield* Ref.get(appConfigRef);
          return config?.workspaces || [];
        });

      // Render app shell
      const renderAppShell = () =>
        Effect.gen(function* () {
          const state = yield* getState();

          if (!state.isConfigLoaded) {
            yield* Effect.fail(
              new AppShellRenderError({
                message: "Cannot render app shell before config is loaded",
              })
            );
          }

          // Render workspace UI if we have a current workspace
          if (state.currentWorkspaceId) {
            yield* workspaceComponent.renderWorkspaceUI().pipe(
              Effect.catchAll((error) => {
                console.warn("Failed to render workspace UI:", error);
                return Effect.succeed(undefined);
              })
            );
          }

          yield* Effect.log("Rendering AppShell...");
          yield* setState({ isAppShellRendered: true });
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof AppShellRenderError
              ? cause
              : new AppShellRenderError({
                  message: "Failed to render app shell",
                  cause,
                })
          )
        );

      // Check if app shell is rendered
      const isAppShellRendered = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.isAppShellRendered;
        });

      // Get app state
      const getState = () =>
        Effect.gen(function* () {
          return yield* Ref.get(appStateRef);
        });

      // Set app state
      const setState = (partialState: Partial<AppComponentState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(appStateRef);
          const newState: AppComponentState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(appStateRef, newState);

          // Update appConfigRef if appConfig is provided
          if (partialState.appConfig !== undefined) {
            yield* Ref.set(appConfigRef, partialState.appConfig);
          }

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
      const subscribe = (callback: (state: AppComponentState) => void) =>
        Effect.gen(function* () {
          // In real implementation, this would use a proper subscription mechanism
          // For now, we'll use a simple approach
          return () => {
            // Unsubscribe logic
          };
        });

      // Initialize app component
      const initialize = (config: CoreComponentConfig) =>
        Effect.gen(function* () {
          // Cast to AppComponentConfig since we know this is an app component
          const appConfig = config as AppComponentConfig;

          yield* coreComponent.initialize(config);
          yield* Ref.set(configPathRef, appConfig.configPath);

          // Initialize workspace component
          yield* workspaceComponent.initialize({
            id: `${config.id}-workspace`,
            name: `${config.name} Workspace Manager`,
            debugMode: config.debugMode,
            workspaceId: `${config.id}-default-workspace`,
          });

          // Set initialized state
          yield* setState({ isInitialized: true });

          // Auto-load config if configured
          if (appConfig.autoLoadConfig) {
            yield* loadConfig(appConfig.configPath);
          }

          // Auto-render shell if configured
          if (appConfig.autoRenderShell && appConfig.autoLoadConfig) {
            yield* renderAppShell();
          }
        }).pipe(
          Effect.mapError((cause: unknown) => {
            // Map app-specific errors to core component errors for interface compliance
            if (cause instanceof AppInitializationError) {
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
            return new CoreComponentInitializationError({
              message: "Failed to initialize app component",
              cause,
            });
          })
        );

      // Cleanup
      const cleanup = () =>
        Effect.gen(function* () {
          yield* workspaceComponent.cleanup();
          yield* coreComponent.cleanup();
          yield* Ref.set(appStateRef, createDefaultAppState());
          yield* Ref.set(appConfigRef, null);
          yield* Ref.set(configPathRef, null);
        });

      return {
        // Core component methods
        initialize,
        getState,
        setState,
        subscribe,
        cleanup,

        // App-specific methods
        loadConfig,
        reloadConfig,
        getAppConfig,
        setCurrentWorkspace,
        getCurrentWorkspace,
        getWorkspaces,
        renderAppShell,
        isAppShellRendered,
      } satisfies AppComponentApi;
    }),
    dependencies: [
      CoreComponent.Default,
      ConfigService.Default,
      WorkspaceComponent.Default,
    ],
  }
) {}

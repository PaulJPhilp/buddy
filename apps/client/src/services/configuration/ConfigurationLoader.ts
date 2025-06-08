import {
  BuddyBootstrapConfig,
  BuddyBootstrapSchema,
} from "@/schemas/BuddyBootstrapSchema";
import { Effect, Schema } from "effect";
import { AgentService } from "../agent";
import { AppService } from "../app";
import { ThemesService } from "../themes/ThemesService";
import { ToolbarService } from "../toolbar";

/**
 * @file Configuration Loader Service
 * @module services/configuration/ConfigurationLoader
 * 
 * Loads and validates configuration objects, then initializes all
 * runtime services with the data. Handles bulk initialization of
 * agents, toolbars, themes, and chat apps from a unified configuration.
 */

/**
 * Initializes all services from a configuration object.
 * 
 * @param configObj - The parsed configuration object to validate and load
 * @returns An Effect that runs indefinitely after initialization
 */
export const initializeConfiguration = (
  configObj: unknown,
): Effect.Effect<never, Error, never> => {
  // First decode and validate the config
  const decodedEffect = Schema.decodeUnknown(BuddyBootstrapSchema)(
    configObj,
  ).pipe(
    Effect.mapError((e) => new Error(String(e))),
    Effect.map(
      (config): BuddyBootstrapConfig => config as BuddyBootstrapConfig,
    ),
  );

  // Then initialize all services
  const initializeEffect = Effect.gen(function* () {
    const config = yield* decodedEffect;

    // Initialize agents
    const agentsService = yield* AgentService;
    const agentEffects =
      config.agents?.map((agent) =>
        agentsService
          .create(agent)
          .pipe(Effect.mapError((e) => new Error(String(e)))),
      ) ?? [];

    // Initialize toolbars
    const toolbarsService = yield* ToolbarService;
    const toolbarEffects =
      config.toolbars?.map((toolbar) =>
        toolbarsService
          .create(toolbar)
          .pipe(Effect.mapError((e) => new Error(String(e)))),
      ) ?? [];

    // Initialize themes
    const themesService = yield* ThemesService;
    const themeEffects = config.themes
      ? Object.entries(config.themes).map(([themeId, themeObj]) =>
        themesService
          .setTheme(themeId, themeObj)
          .pipe(Effect.mapError((e) => new Error(String(e)))),
      )
      : [];

    // Initialize chat apps
    const appsService = yield* AppService;
    const appEffects =
      config.chatApps?.map((app) =>
        appsService
          .create(app)
          .pipe(Effect.mapError((e) => new Error(String(e)))),
      ) ?? [];

    // Process all effects
    yield* Effect.all([
      ...agentEffects,
      ...toolbarEffects,
      ...themeEffects,
      ...appEffects,
    ] as const);
  });

  // Chain the initialization with Effect.never to ensure it never completes
  return Effect.flatMap(initializeEffect, () => Effect.never) as Effect.Effect<
    never,
    Error,
    never
  >;
};

/**
 * Loads configuration from a JSON string and initializes all services.
 * 
 * @param json - JSON string containing the configuration data
 * @returns An Effect that runs indefinitely after initialization
 */
export const loadAndInitializeConfiguration = (
  json: string,
): Effect.Effect<never, Error, never> => {
  return Effect.try(() => JSON.parse(json)).pipe(
    Effect.flatMap((parsed) => initializeConfiguration(parsed)),
  ) as Effect.Effect<never, Error, never>;
};

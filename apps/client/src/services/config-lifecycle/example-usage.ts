/**
 * Example usage of ConfigLifecycleService
 *
 * This shows how to integrate the service into your application
 * to replace the current localStorage-based config management.
 */

import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import { ConfigLifecycleService } from "./ConfigLifecycleService";

// Example 1: Loading configs on app startup
export const initializeConfigs = Effect.gen(function* () {
  const configService = yield* ConfigLifecycleService;

  // Load all configs from files
  const configs = yield* configService.loadConfigs();
  console.log(`Loaded ${configs.length} configs from files`);

  // Set the first config as active if available
  if (configs.length > 0) {
    yield* configService.setActive(configs[0].id);
  }

  // Start file watcher for external changes
  yield* configService.startFileWatcher();

  return configs;
});

// Example 2: Adding a new config
export const addNewConfig = (config: ChatAppConfig) =>
  Effect.gen(function* () {
    const configService = yield* ConfigLifecycleService;

    // Add and save the config
    yield* configService.addConfig(config);

    // Set it as active
    yield* configService.setActive(config.id);

    // Open it in the UI
    yield* configService.toggleOpen(config.id);
  });

// Example 3: Updating an existing config
export const updateConfigTheme = (configId: string, theme: any) =>
  Effect.gen(function* () {
    const configService = yield* ConfigLifecycleService;

    // Update the config with new theme
    yield* configService.updateConfig(configId, { theme });

    console.log(`Updated theme for config ${configId}`);
  });

// Example 4: React Hook Integration
export const useConfigLifecycle = () => {
  const [state, setState] = React.useState({
    configs: [] as ChatAppConfig[],
    activeConfigId: null as string | null,
    loading: true,
    error: null as string | null,
  });

  React.useEffect(() => {
    const program = Effect.gen(function* () {
      const configService = yield* ConfigLifecycleService;

      // Subscribe to state changes
      const unsubscribe = yield* configService.subscribe((newState) => {
        setState({
          configs: newState.configs,
          activeConfigId: newState.activeConfigId,
          loading: newState.loading,
          error: newState.error,
        });
      });

      // Load initial configs
      yield* configService.loadConfigs();

      // Return cleanup function
      return unsubscribe;
    });

    const cleanup = Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    return () => {
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, []);

  return state;
};

// Example 5: Running the service in your app
export const runConfigLifecycleExample = async () => {
  const program = Effect.gen(function* () {
    // Initialize configs
    const configs = yield* initializeConfigs;

    // Add a new config
    const newConfig: ChatAppConfig = {
      id: "example-config",
      name: "Example Config",
      agentId: "example-agent",
      toolbarId: "example-toolbar",
      themeId: "example-theme",
    };

    yield* addNewConfig(newConfig);

    // Update the config
    yield* updateConfigTheme(newConfig.id, { primary: "blue-600" });

    // Get final state
    const configService = yield* ConfigLifecycleService;
    const finalState = yield* configService.getState();

    console.log("Final state:", finalState);

    return finalState;
  });

  // Run the program with the service
  const result = await Effect.runPromise(
    program.pipe(Effect.provide(ConfigLifecycleService.Default)),
  );

  return result;
};

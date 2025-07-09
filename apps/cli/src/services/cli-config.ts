import { Effect } from "effect";
import type { OutputFormat } from "./output-formatter";

// CLI configuration interface
export interface CliConfigModel {
  readonly format: OutputFormat;
  readonly verbose: boolean;
  readonly configDir: string;
  readonly server: {
    readonly httpUrl: string;
    readonly websocketUrl: string;
  };
  readonly workspace: {
    readonly defaultIcon: string;
    readonly defaultColor: string;
    readonly maxExpandedApps: number;
  };
}

// CLI configuration service interface
export interface CliConfigApi {
  readonly getConfig: () => Effect.Effect<CliConfigModel, never>;
  readonly updateConfig: (
    updates: Partial<CliConfigModel>
  ) => Effect.Effect<void, never>;
  readonly getConfigDir: () => Effect.Effect<string, never>;
  readonly getStatePath: () => Effect.Effect<string, never>;
}

// Default configuration
const DEFAULT_CONFIG: CliConfigModel = {
  format: "table",
  verbose: false,
  configDir: process.env.BUDDY_CONFIG_DIR || "~/.buddy",
  server: {
    httpUrl: process.env.BUDDY_HTTP_URL || "http://localhost:3000",
    websocketUrl: process.env.BUDDY_WS_URL || "ws://localhost:3000/cli-sync",
  },
  workspace: {
    defaultIcon: "📁",
    defaultColor: "#3b82f6",
    maxExpandedApps: 2,
  },
};

// CLI configuration service implementation
export class CliConfig extends Effect.Service<CliConfigApi>()("CliConfig", {
  effect: Effect.gen(function* () {
    return {
      getConfig: () =>
        Effect.gen(function* () {
          // Load from environment variables and merge with defaults
          const config = yield* Effect.succeed({
            ...DEFAULT_CONFIG,
            format:
              (process.env.BUDDY_FORMAT as OutputFormat) ||
              DEFAULT_CONFIG.format,
            verbose:
              process.env.BUDDY_VERBOSE === "true" || DEFAULT_CONFIG.verbose,
            configDir: process.env.BUDDY_CONFIG_DIR || DEFAULT_CONFIG.configDir,
            server: {
              httpUrl:
                process.env.BUDDY_HTTP_URL || DEFAULT_CONFIG.server.httpUrl,
              websocketUrl:
                process.env.BUDDY_WS_URL || DEFAULT_CONFIG.server.websocketUrl,
            },
            workspace: {
              defaultIcon:
                process.env.BUDDY_DEFAULT_ICON ||
                DEFAULT_CONFIG.workspace.defaultIcon,
              defaultColor:
                process.env.BUDDY_DEFAULT_COLOR ||
                DEFAULT_CONFIG.workspace.defaultColor,
              maxExpandedApps:
                Number.parseInt(process.env.BUDDY_MAX_EXPANDED_APPS || "2") ||
                DEFAULT_CONFIG.workspace.maxExpandedApps,
            },
          });

          return config;
        }),

      updateConfig: (updates: Partial<CliConfigModel>) =>
        Effect.gen(function* () {
          // For now, just log the update - we could implement file-based persistence later
          yield* Effect.log(`CLI config updated: ${JSON.stringify(updates)}`);
        }),

      getConfigDir: () =>
        Effect.gen(function* () {
          const config = yield* Effect.succeed(DEFAULT_CONFIG);
          return config.configDir.replace("~", process.env.HOME || "");
        }),

      getStatePath: () =>
        Effect.gen(function* () {
          const configDir = yield* Effect.succeed(
            DEFAULT_CONFIG.configDir.replace("~", process.env.HOME || "")
          );
          return `${configDir}/workspace.json`;
        }),
    };
  }),
  dependencies: [],
}) {}

// Configuration validation helper
export const validateConfig = (
  config: unknown
): Effect.Effect<CliConfigModel, Error> =>
  Effect.gen(function* () {
    // Basic validation - in a real app, you'd use a schema library
    if (typeof config !== "object" || config === null) {
      return yield* Effect.fail(
        new Error("Invalid configuration: must be an object")
      );
    }

    // Return validated config (simplified for demo)
    return config as CliConfigModel;
  });

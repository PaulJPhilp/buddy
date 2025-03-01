import { Context, Effect, Layer, Schema } from "effect";

/**
 * Application configuration interface
 */
export interface AppConfig {
  readonly server: {
    readonly port: number;
    readonly host: string;
  };
  readonly database: {
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly database: string;
    readonly ssl: boolean;
  };
  readonly logging: {
    readonly level: string;
    readonly format: "json" | "text";
  };
}

/**
 * Configuration service
 */
export class ConfigService extends Context.Tag("ConfigService")<
  ConfigService,
  AppConfig
>() {}

/**
 * Default configuration schema
 */
const configSchema = Schema.Struct({
  server: Schema.Struct({
    port: Schema.Number.pipe(Schema.optionalWith({ default: () => 3000 })),
    host: Schema.String.pipe(
      Schema.optionalWith({ default: () => "localhost" }),
    ),
  }),
  database: Schema.Struct({
    host: Schema.String.pipe(
      Schema.optionalWith({ default: () => "localhost" }),
    ),
    port: Schema.Number.pipe(Schema.optionalWith({ default: () => 5432 })),
    user: Schema.String.pipe(
      Schema.optionalWith({ default: () => "postgres" }),
    ),
    password: Schema.String.pipe(
      Schema.optionalWith({ default: () => "postgres" }),
    ),
    database: Schema.String.pipe(
      Schema.optionalWith({ default: () => "buddy" }),
    ),
    ssl: Schema.Boolean.pipe(Schema.optionalWith({ default: () => false })),
  }),
  logging: Schema.Struct({
    level: Schema.String.pipe(Schema.optionalWith({ default: () => "info" })),
    format: Schema.Literal("json", "text").pipe(
      Schema.optionalWith({ default: () => "text" }),
    ),
  }),
});

/**
 * Load configuration from environment variables
 */
export const loadConfig = Effect.sync(() => {
  // For now, just return a default config since we're using Schema instead of Config
  // In a real implementation, you would load from env vars and parse with Schema
  return Schema.decodeSync(configSchema)({
    server: {
      port: Number(process.env.PORT || "3000"),
      host: process.env.HOST || "localhost",
    },
    database: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "buddy",
      ssl: process.env.DB_SSL === "true",
    },
    logging: {
      level: process.env.LOG_LEVEL || "info",
      format: (process.env.LOG_FORMAT || "text") as "json" | "text",
    },
  });
});

/**
 * Configuration layer
 */
export const ConfigLive = Layer.effect(
  ConfigService,
  Effect.map(loadConfig, (config) => config),
);

/**
 * Get config utility
 */
export const getConfig = Effect.gen(function* () {
  const configService = yield* ConfigService;
  return configService;
});

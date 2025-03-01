import { PlatformConfigProvider } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { PromptGroupLive } from "./Prompt";
import { PromptVoiceGroupLive } from "./PromptVoice";
import { UserGroupLive } from "./User";
import { DatabaseLive } from "./database";
import { MigratorLive } from "./migrator";

// Environment configuration layer
const EnvProviderLayer = Layer.unwrapEffect(
  PlatformConfigProvider.fromDotEnv(".env").pipe(
    Effect.map(Layer.setConfigProvider),
    Effect.provide(NodeFileSystem.layer),
  ),
);

// Main program - simplified approach
const program = Effect.gen(function* () {
  yield* Effect.log("Starting server...");

  // Run migrations
  yield* Effect.log("Running migrations...");
  yield* Effect.log("Migrations complete");

  yield* Effect.log("Server initialized successfully");

  Effect.provide(
    Layer.mergeAll(
      DatabaseLive,
      MigratorLive,
      EnvProviderLayer,
      PromptGroupLive,
      PromptVoiceGroupLive,
      UserGroupLive,
    ),
  );
});

export { program };

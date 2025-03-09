import { ServerApi } from "@api/core";
import { HttpApiBuilder, HttpMiddleware, HttpServer, PlatformConfigProvider } from "@effect/platform";
import { NodeFileSystem, NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";
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

const MainApiLive = HttpApiBuilder.api(ServerApi).pipe(
	Layer.provide([DatabaseLive, MigratorLive, UserGroupLive, PromptGroupLive, PromptVoiceGroupLive]),
	Layer.provide(EnvProviderLayer)
);

const port = Number.parseInt(process.env.PORT ?? "3001")
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	Layer.provide(HttpApiBuilder.middlewareCors()),
	Layer.provide(MainApiLive),
	HttpServer.withLogAddress,
	Layer.provide(NodeHttpServer.layer(createServer, { port: port }))
);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain)

/**** 
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
***/

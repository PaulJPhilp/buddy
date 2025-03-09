import { ServerApi } from "@api/core";
import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Layer } from "effect";

// Create a client for the server API
export class ApiClient extends Effect.Service<ApiClient>()("ApiClient", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function* () {
    const client = yield* HttpApiClient.make(ServerApi, {
      baseUrl: "/api",
    });
    return client;
  }),
}) {}

// Export the layer for the ApiClient service
export const ApiClientLayer = Layer.effect(
  ApiClient,
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(ServerApi, {
      baseUrl: "/api",
    });
    return new ApiClient(client);
  }),
).pipe(Layer.provide(FetchHttpClient.layer));

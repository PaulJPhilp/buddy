import { ServerApi } from "@api/core";
import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Layer } from "effect";

// Create a client for the server API
export class ApiClient extends Effect.Service<ApiClient>()("ApiClient", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function* () {
    const client = yield* HttpApiClient.make(ServerApi, {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      // Add request transformer to ensure data is properly formatted
      request: {
        transformer: (request) => {
          // Ensure body is properly serialized as JSON
          if (request.body) {
            return {
              ...request,
              headers: {
                ...request.headers,
                "Content-Type": "application/json"
              }
            };
          }
          return request;
        }
      }
    });

    return client;
  }),
}) { }

// Export the layer for the ApiClient service
export const ApiClientLayer = Layer.effect(
  ApiClient,
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(ServerApi, {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      // Add request transformer to ensure data is properly formatted
      request: {
        transformer: (request) => {
          // Ensure body is properly serialized as JSON
          if (request.body) {
            return {
              ...request,
              headers: {
                ...request.headers,
                "Content-Type": "application/json"
              }
            };
          }
          return request;
        }
      }
    });
    return new ApiClient(client);
  }),
).pipe(Layer.provide(FetchHttpClient.layer));

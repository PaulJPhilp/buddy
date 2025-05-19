import { PromptApiGroup, PromptCreate } from "@api/src/PromptSchema";
import { HttpClient } from "@effect/platform";
import { Effect, Layer, Context } from "effect";

// Create a client for the server API
export interface ApiClient {
  readonly _: unique symbol;
  createPrompt(payload: PromptCreate): Effect.Effect<never, Error, unknown>;
}

export const ApiClient = Context.GenericTag<ApiClient>("ApiClient");

// Export the layer for the ApiClient service
export const ApiClientLayer = Layer.succeed(
  ApiClient,
  {
    createPrompt: (payload: PromptCreate) =>
      Effect.promise(() =>
        fetch("/api/prompt/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json())
      ),
  }
);

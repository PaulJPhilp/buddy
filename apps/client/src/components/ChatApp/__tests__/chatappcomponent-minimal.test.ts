import { CoreComponent } from "@/components/core";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatAppComponent } from "../service";

describe("ChatAppComponent minimal layer test", () => {
  it("should resolve ChatAppComponent from the Effect context", async () => {
    const testLayer = Layer.mergeAll(
      CoreComponent.Default,
      ChatAppComponent.Default
    );
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ChatAppComponent;
        return service;
      }).pipe(Effect.provide(testLayer))
    );
    expect(result).toBeDefined();
  });
});

import { CoreComponent } from "@/components/core";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatAppManager } from "../manager-service";
import { ChatAppComponent } from "../service";

describe("ChatAppManager minimal layer test", () => {
  it("should resolve ChatAppManager from the Effect context", async () => {
    const testLayer = Layer.mergeAll(
      CoreComponent.Default,
      ChatAppComponent.Default,
      ChatAppManager.Default
    );
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ChatAppManager;
        return service;
      }).pipe(Effect.provide(testLayer))
    );
    expect(result).toBeDefined();
  });
});

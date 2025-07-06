import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { CoreComponent } from "../index";
import type { CoreComponentConfig } from "../types";

describe("CoreComponent", () => {
  const testConfig: CoreComponentConfig = {
    id: "test-component",
    name: "Test Component",
    debugMode: true,
  };

  it("should initialize successfully", async () => {
    const program = Effect.gen(function* () {
      const coreComponent = yield* CoreComponent;
      yield* coreComponent.initialize(testConfig);
      const state = yield* coreComponent.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeUndefined();
    });

    const layer = CoreComponent.Default;
    const result = await Effect.provide(program, layer).pipe(Effect.runPromise);

    expect(result).toBeUndefined(); // Effect.gen returns void
  });

  it("should manage state correctly", async () => {
    const program = Effect.gen(function* () {
      const coreComponent = yield* CoreComponent;
      yield* coreComponent.initialize(testConfig);

      // Update state
      yield* coreComponent.setState({ isLoading: true });
      const state = yield* coreComponent.getState();

      expect(state.isLoading).toBe(true);
      expect(state.isInitialized).toBe(true);
    });

    const layer = CoreComponent.Default;
    await Effect.provide(program, layer).pipe(Effect.runPromise);
  });

  it("should handle subscriptions", async () => {
    const program = Effect.gen(function* () {
      const coreComponent = yield* CoreComponent;
      yield* coreComponent.initialize(testConfig);

      let callbackCount = 0;
      const unsubscribe = yield* coreComponent.subscribe((state) => {
        callbackCount++;
      });

      // Trigger state change
      yield* coreComponent.setState({ isLoading: true });

      // Wait a bit for callback
      yield* Effect.sleep(10);

      expect(callbackCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });

    const layer = CoreComponent.Default;
    await Effect.provide(program, layer).pipe(Effect.runPromise);
  });

  it("should cleanup properly", async () => {
    const program = Effect.gen(function* () {
      const coreComponent = yield* CoreComponent;
      yield* coreComponent.initialize(testConfig);

      // Verify initialized
      const initialState = yield* coreComponent.getState();
      expect(initialState.isInitialized).toBe(true);

      // Cleanup
      yield* coreComponent.cleanup();

      // Verify reset
      const finalState = yield* coreComponent.getState();
      expect(finalState.isInitialized).toBe(false);
    });

    const layer = CoreComponent.Default;
    await Effect.provide(program, layer).pipe(Effect.runPromise);
  });
});

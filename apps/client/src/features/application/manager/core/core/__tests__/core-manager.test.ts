import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { CoreManager } from "../service";
import type { CoreManagerConfig } from "../types";

describe("CoreManager", () => {
  const testConfig: CoreManagerConfig = {
    id: "test-manager",
    name: "Test Manager",
    debugMode: true,
  };

  const testLayer = CoreManager.Default;

  it("should initialize successfully", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(testConfig);
      const state = yield* coreManager.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isRunning).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.operationCount).toBe(0);
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });

  it("should start and stop correctly", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(testConfig);

      // Start manager
      yield* coreManager.start();
      const runningState = yield* coreManager.getState();
      expect(runningState.isRunning).toBe(true);
      expect(runningState.operationCount).toBe(1);

      // Stop manager
      yield* coreManager.stop();
      const stoppedState = yield* coreManager.getState();
      expect(stoppedState.isRunning).toBe(false);
      expect(stoppedState.operationCount).toBe(2);
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });

  it("should handle auto-start configuration", async () => {
    const autoStartConfig: CoreManagerConfig = {
      ...testConfig,
      autoStart: true,
    };

    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(autoStartConfig);

      // Should be running after initialization
      const state = yield* coreManager.getState();
      expect(state.isRunning).toBe(true);
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });

  it("should manage state correctly", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(testConfig);

      // Update state
      yield* coreManager.setState({ isLoading: true });
      const state = yield* coreManager.getState();

      expect(state.isLoading).toBe(true);
      expect(state.isInitialized).toBe(true);
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });

  it("should handle subscriptions", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(testConfig);

      let callbackCount = 0;
      const unsubscribe = yield* coreManager.subscribe((state) => {
        callbackCount++;
      });

      // Trigger state change
      yield* coreManager.start();

      // Wait a bit for callback
      yield* Effect.sleep(10);

      expect(callbackCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });

  it("should cleanup properly", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      yield* coreManager.initialize(testConfig);
      yield* coreManager.start();

      // Verify running
      const runningState = yield* coreManager.getState();
      expect(runningState.isRunning).toBe(true);

      // Cleanup
      yield* coreManager.cleanup();

      // Verify reset
      const finalState = yield* coreManager.getState();
      expect(finalState.isInitialized).toBe(false);
      expect(finalState.isRunning).toBe(false);
    });

    await Effect.provide(program, testLayer).pipe(Effect.runPromise);
  });
});

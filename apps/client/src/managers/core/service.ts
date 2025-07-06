import { Effect, Ref } from "effect";
import type { CoreManagerApi } from "./api";
import {
  CoreManagerCoordinationError,
  CoreManagerInitializationError,
  CoreManagerOperationError,
  CoreManagerStateError,
  CoreManagerSubscriptionError,
} from "./errors";
import type { CoreManagerConfig, CoreManagerState } from "./types";
import { createDefaultManagerState } from "./types";

export class CoreManager extends Effect.Service<CoreManagerApi>()(
  "CoreManager",
  {
    scoped: Effect.gen(function* () {
      // Core manager state
      const stateRef = yield* Ref.make<CoreManagerState>(
        createDefaultManagerState()
      );
      const subscriptionsRef = yield* Ref.make<
        Set<(state: CoreManagerState) => void>
      >(new Set());
      const configRef = yield* Ref.make<CoreManagerConfig | null>(null);

      // Helper to notify subscribers
      const notifySubscribers = (state: CoreManagerState) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscriptionsRef);
          yield* Effect.forEach(
            Array.from(subscribers),
            (callback) => Effect.sync(() => callback(state)),
            { concurrency: "unbounded" }
          );
        });

      // Helper to update operation count
      const incrementOperationCount = () =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const newState: CoreManagerState = {
            ...currentState,
            operationCount: currentState.operationCount + 1,
            lastUpdated: Date.now(),
          };
          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        });

      // Initialize manager
      const initialize = (config: CoreManagerConfig) =>
        Effect.gen(function* () {
          yield* Ref.set(configRef, config);

          const newState: CoreManagerState = {
            isInitialized: true,
            isRunning: false,
            isLoading: false,
            lastUpdated: Date.now(),
            operationCount: 0,
          };

          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);

          // Auto-start if configured
          if (config.autoStart) {
            yield* start();
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerInitializationError({
                message: `Failed to initialize manager: ${config.name}`,
                cause,
              })
          )
        );

      // Get current state
      const getState = () =>
        Effect.gen(function* () {
          return yield* Ref.get(stateRef);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerStateError({
                message: "Failed to get manager state",
                operation: "get",
                cause,
              })
          )
        );

      // Set state (partial update)
      const setState = (partialState: Partial<CoreManagerState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const newState: CoreManagerState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerStateError({
                message: "Failed to set manager state",
                operation: "set",
                cause,
              })
          )
        );

      // Subscribe to state changes
      const subscribe = (callback: (state: CoreManagerState) => void) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscriptionsRef);
          const newSubscribers = new Set(subscribers);
          newSubscribers.add(callback);
          yield* Ref.set(subscriptionsRef, newSubscribers);

          // Return unsubscribe function
          return () =>
            Effect.gen(function* () {
              const currentSubscribers = yield* Ref.get(subscriptionsRef);
              const updatedSubscribers = new Set(currentSubscribers);
              updatedSubscribers.delete(callback);
              yield* Ref.set(subscriptionsRef, updatedSubscribers);
            }).pipe(Effect.runSync);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerSubscriptionError({
                message: "Failed to subscribe to manager state",
                cause,
              })
          )
        );

      // Start manager operations
      const start = () =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const config = yield* Ref.get(configRef);

          if (!currentState.isInitialized) {
            yield* Effect.fail(
              new CoreManagerOperationError({
                message: "Cannot start uninitialized manager",
                operation: "start",
              })
            );
          }

          if (currentState.isRunning) {
            return; // Already running
          }

          yield* setState({ isRunning: true });
          yield* incrementOperationCount();

          if (config?.debugMode) {
            yield* Effect.log(`CoreManager ${config.name} started`);
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerOperationError({
                message: "Failed to start manager",
                operation: "start",
                cause,
              })
          )
        );

      // Stop manager operations
      const stop = () =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const config = yield* Ref.get(configRef);

          if (!currentState.isRunning) {
            return; // Already stopped
          }

          yield* setState({ isRunning: false });
          yield* incrementOperationCount();

          if (config?.debugMode) {
            yield* Effect.log(`CoreManager ${config.name} stopped`);
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerOperationError({
                message: "Failed to stop manager",
                operation: "stop",
                cause,
              })
          )
        );

      // Cleanup manager
      const cleanup = () =>
        Effect.gen(function* () {
          const config = yield* Ref.get(configRef);

          // Stop if running
          const currentState = yield* Ref.get(stateRef);
          if (currentState.isRunning) {
            yield* stop();
          }

          // Clear subscriptions
          yield* Ref.set(subscriptionsRef, new Set());

          // Reset state
          yield* Ref.set(stateRef, createDefaultManagerState());
          yield* Ref.set(configRef, null);

          if (config?.debugMode) {
            yield* Effect.log(`CoreManager ${config.name} cleaned up`);
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreManagerOperationError({
                message: "Failed to cleanup manager",
                operation: "cleanup",
                cause,
              })
          )
        );

      return {
        initialize,
        getState,
        setState,
        subscribe,
        start,
        stop,
        cleanup,
      } satisfies CoreManagerApi;
    }),
    dependencies: [],
  }
) {}

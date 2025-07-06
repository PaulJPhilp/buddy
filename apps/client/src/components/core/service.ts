import { Effect, Ref } from "effect";
import type { CoreComponentApi } from "./api";
import {
  CoreComponentCleanupError,
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
} from "./errors";
import type { CoreComponentConfig, CoreComponentState } from "./types";
import { createDefaultState } from "./types";

export class CoreComponent extends Effect.Service<CoreComponentApi>()(
  "CoreComponent",
  {
    scoped: Effect.gen(function* () {
      // Core component state
      const stateRef = yield* Ref.make<CoreComponentState>(
        createDefaultState()
      );
      const subscriptionsRef = yield* Ref.make<
        Set<(state: CoreComponentState) => void>
      >(new Set());
      const configRef = yield* Ref.make<CoreComponentConfig | null>(null);

      // Helper to notify subscribers
      const notifySubscribers = (state: CoreComponentState) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscriptionsRef);
          yield* Effect.forEach(
            Array.from(subscribers),
            (callback) => Effect.sync(() => callback(state)),
            { concurrency: "unbounded" }
          );
        });

      // Initialize component
      const initialize = (config: CoreComponentConfig) =>
        Effect.gen(function* () {
          yield* Ref.set(configRef, config);

          const newState: CoreComponentState = {
            isInitialized: true,
            isLoading: false,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreComponentInitializationError({
                message: `Failed to initialize component: ${config.name}`,
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
              new CoreComponentStateError({
                message: "Failed to get component state",
                operation: "get",
                cause,
              })
          )
        );

      // Set state (partial update)
      const setState = (partialState: Partial<CoreComponentState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const newState: CoreComponentState = {
            ...currentState,
            ...partialState,
            lastUpdated: Date.now(),
          };

          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreComponentStateError({
                message: "Failed to set component state",
                operation: "set",
                cause,
              })
          )
        );

      // Subscribe to state changes
      const subscribe = (callback: (state: CoreComponentState) => void) =>
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
              new CoreComponentSubscriptionError({
                message: "Failed to subscribe to component state",
                cause,
              })
          )
        );

      // Cleanup component
      const cleanup = () =>
        Effect.gen(function* () {
          const config = yield* Ref.get(configRef);

          // Clear subscriptions
          yield* Ref.set(subscriptionsRef, new Set());

          // Reset state
          yield* Ref.set(stateRef, createDefaultState());
          yield* Ref.set(configRef, null);

          if (config?.debugMode) {
            yield* Effect.log(`CoreComponent ${config.name} cleaned up`);
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CoreComponentCleanupError({
                message: "Failed to cleanup component",
                cause,
              })
          )
        );

      return {
        initialize,
        getState,
        setState,
        subscribe,
        cleanup,
      } satisfies CoreComponentApi;
    }),
    dependencies: [],
  }
) {}

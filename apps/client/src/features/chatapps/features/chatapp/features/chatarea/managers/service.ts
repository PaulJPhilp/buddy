import type { Message } from "@/features/chatapps/chatapp/types/chat";
import { Effect, Ref } from "effect";
import type { ChatAreaManagerApi } from "./api";
import { ChatAreaManagerError, ChatAreaManagerStateError } from "./errors";
import type {
  ChatAreaManagerConfig,
  ChatAreaManagerState,
  ChatAreaManagerStats,
} from "./types";

export class ChatAreaManager extends Effect.Service<ChatAreaManagerApi>()(
  "ChatAreaManager",
  {
    scoped: Effect.gen(function* () {
      // State refs
      const stateRef = yield* Ref.make<ChatAreaManagerState | null>(null);
      const subscribersRef = yield* Ref.make<
        Set<(state: ChatAreaManagerState) => void>
      >(new Set());

      // Helper: notify subscribers
      const notifySubscribers = (state: ChatAreaManagerState) =>
        subscribersRef.pipe(
          Effect.flatMap((subs) =>
            Effect.sync(() => {
              for (const cb of subs) cb(state);
            })
          )
        );

      // API implementation
      const api: ChatAreaManagerApi = {
        initialize: (config) =>
          Effect.gen(function* () {
            const initialState: ChatAreaManagerState = {
              messages: config.initialMessages ?? [],
              isTyping: false,
              isLoadingHistory: false,
              isNearBottom: true,
              showScrollButton: false,
            };
            yield* stateRef.pipe(Ref.set(initialState));
            yield* notifySubscribers(initialState);
          }).pipe(
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Failed to initialize",
                  cause: e,
                })
            )
          ),

        cleanup: () =>
          stateRef.pipe(
            Ref.set(null),
            Effect.asVoid,
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Cleanup failed",
                  cause: e,
                })
            )
          ),

        addMessage: (message) =>
          stateRef.pipe(
            Ref.update((state) =>
              state
                ? { ...state, messages: [...state.messages, message] }
                : state
            ),
            Effect.tap(() =>
              stateRef.pipe(
                Ref.get,
                Effect.flatMap((updatedState) =>
                  updatedState ? notifySubscribers(updatedState) : Effect.void
                )
              )
            ),
            Effect.asVoid,
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Add message failed",
                  cause: e,
                })
            )
          ),

        setTyping: (isTyping) =>
          stateRef.pipe(
            Ref.update((state) => (state ? { ...state, isTyping } : state)),
            Effect.tap(() =>
              stateRef.pipe(
                Ref.get,
                Effect.flatMap((updatedState) =>
                  updatedState ? notifySubscribers(updatedState) : Effect.void
                )
              )
            ),
            Effect.asVoid,
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Set typing failed",
                  cause: e,
                })
            )
          ),

        loadHistory: () =>
          stateRef.pipe(
            Ref.update((state) =>
              state ? { ...state, isLoadingHistory: true } : state
            ),
            Effect.tap(() =>
              stateRef.pipe(
                Ref.get,
                Effect.flatMap((updatedState) =>
                  updatedState ? notifySubscribers(updatedState) : Effect.void
                )
              )
            ),
            // Simulate async load, then set isLoadingHistory: false
            Effect.flatMap(() =>
              Effect.sleep("500 millis").pipe(
                Effect.tap(() =>
                  stateRef.pipe(
                    Ref.update((state) =>
                      state ? { ...state, isLoadingHistory: false } : state
                    ),
                    Effect.tap(() =>
                      stateRef.pipe(
                        Ref.get,
                        Effect.flatMap((updatedState) =>
                          updatedState
                            ? notifySubscribers(updatedState)
                            : Effect.void
                        )
                      )
                    )
                  )
                )
              )
            ),
            Effect.asVoid,
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Load history failed",
                  cause: e,
                })
            )
          ),

        getState: () =>
          stateRef.pipe(
            Ref.get,
            Effect.flatMap((state) =>
              state
                ? Effect.succeed(state)
                : Effect.fail(
                    new ChatAreaManagerStateError({
                      message: "State not initialized",
                      state: "uninitialized",
                    })
                  )
            ),
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Get state failed",
                  cause: e,
                })
            )
          ),

        subscribe: (callback) =>
          subscribersRef.pipe(
            Ref.update((subs) => {
              const newSubs = new Set(subs);
              newSubs.add(callback);
              return newSubs;
            }),
            Effect.map(() => () => {
              Effect.runSync(
                subscribersRef.pipe(
                  Ref.update((subs) => {
                    const newSubs = new Set(subs);
                    newSubs.delete(callback);
                    return newSubs;
                  })
                )
              );
            }),
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Subscribe failed",
                  cause: e,
                })
            )
          ),

        getStats: () =>
          stateRef.pipe(
            Ref.get,
            Effect.flatMap((state) =>
              state
                ? Effect.succeed({
                    totalMessages: state.messages.length,
                    lastMessageAt: state.messages.length
                      ? new Date(
                          state.messages[state.messages.length - 1].timestamp
                        )
                      : undefined,
                  })
                : Effect.fail(
                    new ChatAreaManagerStateError({
                      message: "State not initialized",
                      state: "uninitialized",
                    })
                  )
            ),
            Effect.mapError(
              (e) =>
                new ChatAreaManagerError({
                  message: "Get stats failed",
                  cause: e,
                })
            )
          ),
      };
      return api;
    }),
    dependencies: [],
  }
) {}

import { Effect, Fiber, Stream } from "effect";
import type { ChatBridgeApi } from "./api";
import {
  ChatBridgeError,
  ChatBridgeStartError,
  ChatBridgeStopError,
} from "./errors";

export class ChatBridge extends Effect.Service<ChatBridgeApi>()("ChatBridge", {
  scoped: Effect.gen(function* () {
    let isStarted = false;
    let messageHandlers: Array<(message: any) => void> = [];

    const noop = () => Effect.succeed(undefined);

    const start = () =>
      Effect.gen(function* () {
        if (isStarted) {
          return;
        }
        isStarted = true;
        console.log("[ChatBridge] Bridge started");
      }).pipe(
        Effect.mapError(
          (cause) =>
            new ChatBridgeStartError({
              message: "Failed to start chat bridge",
              cause,
            })
        )
      );

    const stop = () =>
      Effect.gen(function* () {
        if (!isStarted) {
          return;
        }
        isStarted = false;
        messageHandlers = [];
        console.log("[ChatBridge] Bridge stopped");
      }).pipe(
        Effect.mapError(
          (cause) =>
            new ChatBridgeStopError({
              message: "Failed to stop chat bridge",
              cause,
            })
        )
      );

    const registerHandler = (handler: (message: any) => void) =>
      Effect.gen(function* () {
        messageHandlers.push(handler);
        console.log("[ChatBridge] Message handler registered");
      });

    const getIsStarted = () => Effect.succeed(isStarted);

    return {
      noop,
      start,
      stop,
      registerHandler,
      isStarted: getIsStarted,
    } satisfies ChatBridgeApi;
  }),
  dependencies: [],
}) {}

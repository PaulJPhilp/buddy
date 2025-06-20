import { WebSocketService } from "@/services/websocket";
import { Effect, Fiber, Stream } from "effect";
import type { ChatBridgeApi } from "./api";
import {
  ChatBridgeError,
  ChatBridgeStartError,
  ChatBridgeStopError,
} from "./errors";

export class ChatBridge extends Effect.Service<ChatBridgeApi>()("ChatBridge", {
  scoped: Effect.gen(function* () {
    console.log("[ChatBridge] Service construction started");

    let isStarted = false;
    let streamFiber: Fiber.Fiber<void, never> | null = null;
    let messageHandlers: Array<(message: any) => void> = [];

    const start = () =>
      Effect.gen(function* () {
        console.log("[ChatBridge] Starting bridge...");

        if (isStarted) {
          console.log("[ChatBridge] Already started, skipping");
          return;
        }

        // Get WebSocketService from Effect context
        const webSocketService = yield* WebSocketService;
        console.log(
          "[ChatBridge] Got WebSocketService:",
          (webSocketService as any).instanceId,
        );

        // Start consuming messages within Effect context
        console.log("[ChatBridge] 🔧 About to fork stream consumption fiber");
        streamFiber = yield* Effect.fork(
          Effect.gen(function* () {
            console.log(
              "[ChatBridge] 🚀 Stream consumption fiber ACTUALLY started",
            );
            let messageCount = 0;

            yield* Stream.runForEach(
              webSocketService.messageStream,
              (protocolMessage) =>
                Effect.sync(() => {
                  messageCount++;
                  console.log(
                    `[ChatBridge] 🔥 BRIDGE CONSUMED message #${messageCount}:`,
                    {
                      type: protocolMessage.type,
                      payloadType: (protocolMessage.payload as any)?.type,
                      id: protocolMessage.id,
                    },
                  );

                  console.log(
                    `[ChatBridge] 📢 Dispatching to ${messageHandlers.length} handlers`,
                  );

                  // Dispatch to all registered handlers
                  for (let i = 0; i < messageHandlers.length; i++) {
                    const handler = messageHandlers[i];
                    try {
                      console.log(`[ChatBridge] 📤 Calling handler #${i + 1}`);
                      handler(protocolMessage);
                      console.log(
                        `[ChatBridge] ✅ Handler #${i + 1} completed successfully`,
                      );
                    } catch (error) {
                      console.error(
                        `[ChatBridge] ❌ Handler #${i + 1} error:`,
                        error,
                      );
                    }
                  }

                  console.log(
                    `[ChatBridge] ✅ Message #${messageCount} processing complete`,
                  );
                }),
            );
          }).pipe(
            Effect.catchAll((error) => {
              console.error("[ChatBridge] 💥 STREAM CONSUMPTION ERROR:", error);
              console.error("[ChatBridge] 💥 Error stack:", error?.stack);
              return Effect.succeed(undefined);
            }),
          ),
        );

        isStarted = true;
        console.log("[ChatBridge] Bridge started successfully");
      }).pipe(
        Effect.mapError(
          (error) =>
            new ChatBridgeStartError({
              message: "Failed to start chat bridge",
              cause: error,
            }),
        ),
      );

    const stop = () =>
      Effect.gen(function* () {
        console.log("[ChatBridge] Stopping bridge...");

        if (!isStarted) {
          console.log("[ChatBridge] Already stopped, skipping");
          return;
        }

        // Interrupt the stream fiber
        if (streamFiber) {
          yield* Fiber.interrupt(streamFiber);
          streamFiber = null;
          console.log("[ChatBridge] Stream fiber interrupted");
        }

        // Clear handlers
        messageHandlers = [];
        isStarted = false;
        console.log("[ChatBridge] Bridge stopped successfully");
      }).pipe(
        Effect.mapError(
          (error) =>
            new ChatBridgeStopError({
              message: "Failed to stop chat bridge",
              cause: error,
            }),
        ),
      );

    const isStartedEffect = () => Effect.succeed(isStarted);

    // Expose a way to register message handlers (for ChatService)
    const registerHandler = (handler: (message: any) => void) => {
      messageHandlers.push(handler);
      console.log(
        "[ChatBridge] Handler registered, total handlers:",
        messageHandlers.length,
      );
    };

    const unregisterHandler = (handler: (message: any) => void) => {
      const index = messageHandlers.indexOf(handler);
      if (index >= 0) {
        messageHandlers.splice(index, 1);
        console.log(
          "[ChatBridge] Handler unregistered, total handlers:",
          messageHandlers.length,
        );
      }
    };

    // Add these to the service interface (extend the API)
    const serviceObj = {
      start,
      stop,
      isStarted: isStartedEffect,
      registerHandler: (handler: (message: any) => void) =>
        Effect.sync(() => registerHandler(handler)),
      unregisterHandler: (handler: (message: any) => void) =>
        Effect.sync(() => unregisterHandler(handler)),
    } satisfies ChatBridgeApi & {
      unregisterHandler: (
        handler: (message: any) => void,
      ) => Effect.Effect<void, never>;
    };

    console.log("[ChatBridge] Service construction complete");
    return serviceObj;
  }),
  dependencies: [WebSocketService.Default],
}) {}

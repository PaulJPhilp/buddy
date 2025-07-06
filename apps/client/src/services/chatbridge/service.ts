import { Effect, Ref } from "effect";
import type { ChatBridgeApi } from "./api";
import {
  ChatBridgeStartError,
  ChatBridgeStopError,
  ChatBridgeStateError,
} from "./errors";
import type {
  ChatBridgeMessage,
  ChatBridgeConnection,
  ChatBridgeConnectionConfig,
  ChatBridgeHandler,
  ChatBridgeEventType,
  ChatBridgeHealthStatus,
  ChatBridgeState,
} from "./types";
import {
  createInitialChatBridgeState,
  generateConnectionId,
  generateHandlerId,
  generateSubscriptionId,
} from "./types";

export class ChatBridge extends Effect.Service<ChatBridgeApi>()(
  "ChatBridge",
  {
    scoped: Effect.gen(function* () {
      const serviceId = `chatbridge_${Date.now()}`;
      const startTime = Date.now();
      
      console.log(`[ChatBridge] Initializing service: ${serviceId}`);

      const stateRef = yield* Ref.make<ChatBridgeState>(
        createInitialChatBridgeState()
      );

      const noop = () => Effect.succeed(undefined);

      const start = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          
          if (state.isStarted) {
            return;
          }

          yield* Ref.update(stateRef, (s) => ({
            ...s,
            isStarted: true,
          }));

          console.log(`[ChatBridge] Bridge started: ${serviceId}`);
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
          const state = yield* Ref.get(stateRef);
          
          if (!state.isStarted) {
            return;
          }

          yield* Ref.update(stateRef, (s) => ({
            ...s,
            isStarted: false,
            handlers: new Map(),
            messageQueue: [],
          }));

          console.log(`[ChatBridge] Bridge stopped: ${serviceId}`);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatBridgeStopError({
                message: "Failed to stop chat bridge",
                cause,
              })
          )
        );

      const restart = () =>
        Effect.gen(function* () {
          yield* stop();
          yield* start();
        });

      const isStarted = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.isStarted;
        });

      const registerHandler = (handler: ChatBridgeHandler) =>
        Effect.gen(function* () {
          const handlerId = handler.id || generateHandlerId();
          const handlerWithId = { ...handler, id: handlerId };

          yield* Ref.update(stateRef, (s) => ({
            ...s,
            handlers: new Map(s.handlers).set(handlerId, handlerWithId),
          }));

          console.log(`[ChatBridge] Handler registered: ${handlerId}`);
          return handlerId;
        });

      const unregisterHandler = (handlerId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (s) => {
            const newHandlers = new Map(s.handlers);
            newHandlers.delete(handlerId);
            return {
              ...s,
              handlers: newHandlers,
            };
          });

          console.log(`[ChatBridge] Handler unregistered: ${handlerId}`);
        });

      const sendMessage = (message: ChatBridgeMessage) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          
          if (!state.isStarted) {
            return yield* Effect.fail(
              new ChatBridgeStateError({
                message: "Bridge not started",
                currentState: "stopped",
                expectedState: "started",
              })
            );
          }

          for (const [_, handler] of state.handlers) {
            if (!handler.messageTypes || handler.messageTypes.includes(message.type)) {
              try {
                const result = handler.handler(message);
                if (result instanceof Promise) {
                  yield* Effect.promise(() => result);
                }
              } catch (error) {
                console.warn(`[ChatBridge] Handler error:`, error);
              }
            }
          }

          console.log(`[ChatBridge] Message sent: ${message.id}`);
        });

      const broadcastMessage = (message: ChatBridgeMessage) =>
        Effect.gen(function* () {
          yield* sendMessage(message);
        });

      const establishConnection = (config: ChatBridgeConnectionConfig) =>
        Effect.gen(function* () {
          const connectionId = generateConnectionId();
          const connection: ChatBridgeConnection = {
            id: connectionId,
            endpoint: config.endpoint,
            protocol: config.protocol,
            status: "connected",
            createdAt: Date.now(),
            lastActivity: Date.now(),
            messageCount: 0,
            errorCount: 0,
          };

          yield* Ref.update(stateRef, (s) => ({
            ...s,
            connections: new Map(s.connections).set(connectionId, connection),
          }));

          console.log(`[ChatBridge] Connection established: ${connectionId}`);
          return connection;
        });

      const closeConnection = (connectionId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (s) => {
            const newConnections = new Map(s.connections);
            newConnections.delete(connectionId);
            return {
              ...s,
              connections: newConnections,
            };
          });

          console.log(`[ChatBridge] Connection closed: ${connectionId}`);
        });

      const getConnection = (connectionId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.connections.get(connectionId) || null;
        });

      const getAllConnections = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return Array.from(state.connections.values());
        });

      const emitEvent = (eventType: ChatBridgeEventType, payload: unknown) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          for (const [_, subscription] of state.eventSubscriptions) {
            if (subscription.eventType === eventType) {
              try {
                subscription.handler(payload);
              } catch (error) {
                console.warn(`[ChatBridge] Event handler error:`, error);
              }
            }
          }
        });

      const subscribeToEvents = (
        eventType: ChatBridgeEventType,
        handler: (payload: unknown) => void
      ) =>
        Effect.gen(function* () {
          const subscriptionId = generateSubscriptionId();
          const subscription = {
            id: subscriptionId,
            eventType,
            handler,
            createdAt: Date.now(),
          };

          yield* Ref.update(stateRef, (s) => ({
            ...s,
            eventSubscriptions: new Map(s.eventSubscriptions).set(
              subscriptionId,
              subscription
            ),
          }));

          return subscriptionId;
        });

      const unsubscribeFromEvents = (subscriptionId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (s) => {
            const newSubscriptions = new Map(s.eventSubscriptions);
            newSubscriptions.delete(subscriptionId);
            return {
              ...s,
              eventSubscriptions: newSubscriptions,
            };
          });
        });

      const getHealth = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const uptime = Date.now() - startTime;
          
          const health: ChatBridgeHealthStatus = {
            status: "healthy",
            serviceId,
            uptime,
            lastCheck: Date.now(),
            connections: {
              total: state.connections.size,
              active: state.connections.size,
              errors: 0,
            },
            messages: {
              sent: state.metrics.messageCount,
              received: state.metrics.messageCount,
              queued: state.messageQueue.length,
              errors: state.metrics.errorCount,
            },
            handlers: {
              registered: state.handlers.size,
              active: state.handlers.size,
            },
          };

          return health;
        });

      const getMetrics = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const uptime = Date.now() - startTime;
          
          return {
            ...state.metrics,
            uptime,
            connectionCount: state.connections.size,
            handlerCount: state.handlers.size,
          };
        });

      const reset = () =>
        Effect.gen(function* () {
          yield* stop();
          yield* Ref.set(stateRef, createInitialChatBridgeState());
          console.log(`[ChatBridge] Service reset: ${serviceId}`);
        });

      const updateConfig = (config: Partial<ChatBridgeConnectionConfig>) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (s) => ({
            ...s,
            config: s.config ? { ...s.config, ...config } : null,
          }));
        });

      const getConfig = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.config;
        });

      const ping = () =>
        Effect.gen(function* () {
          const startTime = Date.now();
          yield* Effect.sleep(Math.random() * 50);
          return Date.now() - startTime;
        });

      const getConnectionStatus = (connectionId: string) =>
        Effect.gen(function* () {
          const connection = yield* getConnection(connectionId);
          if (!connection) {
            return "disconnected" as const;
          }
          return connection.status;
        });

      const flushMessages = () =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (s) => ({
            ...s,
            messageQueue: [],
          }));
        });

      const getMessageQueue = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.messageQueue;
        });

      console.log(`[ChatBridge] Service initialized: ${serviceId}`);

      return {
        noop,
        start,
        stop,
        restart,
        isStarted,
        registerHandler,
        unregisterHandler,
        sendMessage,
        broadcastMessage,
        establishConnection,
        closeConnection,
        getConnection,
        getAllConnections,
        emitEvent,
        subscribeToEvents,
        unsubscribeFromEvents,
        getHealth,
        getMetrics,
        reset,
        updateConfig,
        getConfig,
        ping,
        getConnectionStatus,
        flushMessages,
        getMessageQueue,
      } satisfies ChatBridgeApi;
    }),
    dependencies: [],
  }
) {}

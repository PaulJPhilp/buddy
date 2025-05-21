import { Duration, Effect, Layer, Stream } from "effect";
import {
  WebSocketError as BaseWebSocketError,
  WebSocketMessage as BaseWebSocketMessage,
  WebSocketService,
  WebSocketServiceApi,
} from "../websocket/WebSocketService";

// --- Enums and Interfaces for Agent Runtime ---

export enum ClientAgentActivityType {
  RESPONSE = "RESPONSE",
  USER_MESSAGE = "USER_MESSAGE",
}

export interface AgentActivity {
  readonly id?: string;
  readonly type: ClientAgentActivityType | string;
  readonly sequence?: number;
  readonly payload?: ClientAgentActivityPayload | unknown;
  readonly timestamp?: number | string;
  readonly agentRuntimeId?: string;
  readonly metadata?: unknown;
}

export interface ClientAgentActivityPayload {
  readonly message?: string;
  readonly text?: string;
  readonly availableTools?: ReadonlyArray<{
    readonly name: string;
    readonly description: string;
  }>;
  readonly suggestedToolCall?: {
    readonly name: string;
    readonly input: unknown;
  };
}

// AgentRuntimeError as a class
export class AgentRuntimeError extends Error {
  readonly type = "RUNTIME_ERROR" as const; // Literal type for discrimination
  readonly code?: string;
  // 'cause' is inherited from Error in modern JS/TS, but can be explicit
  // readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message, options ? { cause: options.cause } : undefined);
    this.name = "AgentRuntimeError";
    this.code = options?.code;
    // if (options?.cause) this.cause = options.cause; // Handled by super in ES2022+
  }
}

export interface AgentRuntimeState {
  readonly id: string;
  readonly status: "idle" | "thinking" | "connected" | "error";
  readonly message?: string;
  readonly errorMessage?: string;
  readonly availableTools?: ReadonlyArray<{
    readonly name: string;
    readonly description: string;
  }>;
  readonly suggestedToolCall?: {
    readonly name: string;
    readonly input: unknown;
  };
}

export interface AgentRuntimeServiceApi {
  start: () => Effect.Effect<void, AgentRuntimeError>;
  stop: () => Effect.Effect<void, AgentRuntimeError>;
  sendMessage: (text: string) => Effect.Effect<void, AgentRuntimeError>;
  getState: Stream.Stream<AgentRuntimeState, AgentRuntimeError, never>; // Error must be AgentRuntimeError
}

export interface AgentRuntimeConfig {
  readonly agentId: string;
  readonly baseWsUrl?: string;
}

// --- Service Implementation ---

export class AgentRuntimeService extends Effect.Service<AgentRuntimeServiceApi>()(
  "AgentRuntimeService",
  {
    succeed: (
      config: AgentRuntimeConfig,
      ws: WebSocketServiceApi,
    ): Effect.Effect<AgentRuntimeServiceApi, never, never> =>
      Effect.gen(function* (_) {
        const { agentId } = config;

        const baseWsUrl =
          config.baseWsUrl ||
          process.env.NEXT_PUBLIC_WS_URL ||
          "ws://localhost:3001";
        const wsUrl = `${baseWsUrl}/ws/${agentId}`;

        // Refined mapError to always return AgentRuntimeError
        const mapError = (
          errorToMap: BaseWebSocketError | Error | unknown,
        ): AgentRuntimeError => {
          let message = "An unexpected AgentRuntime error occurred.";
          let code: string | undefined = undefined;
          const cause = errorToMap; // Preserve original error as cause

          if (errorToMap instanceof AgentRuntimeError) {
            // If it's already an AgentRuntimeError, we can choose to return it directly
            // or re-wrap. Re-wrapping ensures a consistent creation path.
            // For this case, let's re-wrap to be safe, though returning `errorToMap` is an optimization.
            message = errorToMap.message;
            code = errorToMap.code;
          } else if (errorToMap instanceof BaseWebSocketError) {
            message = errorToMap.message;
            code = errorToMap.code;
          } else if (errorToMap instanceof Error) {
            message = errorToMap.message;
          } else if (typeof errorToMap === "string") {
            message = errorToMap;
          }
          return new AgentRuntimeError(message, { code, cause });
        };

        const createClientMessage = (
          activity: AgentActivity,
        ): BaseWebSocketMessage => {
          return {
            text: JSON.stringify(activity),
            timestamp: new Date().toISOString(),
          };
        };

        return {
          start: (): Effect.Effect<void, AgentRuntimeError> =>
            Effect.logInfo(`Connecting AgentRuntime to: ${wsUrl}`).pipe(
              Effect.flatMap(() => ws.connect(wsUrl)),
              Effect.mapError(mapError), // Ensures error is AgentRuntimeError
            ),

          stop: (): Effect.Effect<void, AgentRuntimeError> =>
            ws.disconnect().pipe(
              Effect.mapError(mapError), // Ensures error is AgentRuntimeError
            ),

          sendMessage: (
            userInputText: string,
          ): Effect.Effect<void, AgentRuntimeError> => {
            const agentActivityPayload: AgentActivity = {
              type: ClientAgentActivityType.USER_MESSAGE,
              timestamp: new Date().getTime(),
              payload: {
                text: userInputText,
              },
            };
            const messageToSend = createClientMessage(agentActivityPayload);
            return ws.send(messageToSend).pipe(
              Effect.mapError(mapError), // Ensures error is AgentRuntimeError
            );
          },

          getState: ws.receive().pipe(
            // Stream<BaseWebSocketMessage, BaseWebSocketError, never>
            Stream.mapEffect(
              (
                baseMessage: BaseWebSocketMessage,
              ): Effect.Effect<AgentRuntimeState, AgentRuntimeError> =>
                // Effect fails only with AgentRuntimeError
                Effect.try({
                  try: () => {
                    const serverActivity = JSON.parse(
                      baseMessage.text,
                    ) as AgentActivity;
                    const payload = serverActivity.payload as
                      | ClientAgentActivityPayload
                      | undefined;

                    let currentMessage: string | undefined = undefined;
                    let currentStatus: AgentRuntimeState["status"] = "idle";
                    // ... (rest of parsing logic)
                    if (
                      serverActivity.type === ClientAgentActivityType.RESPONSE
                    ) {
                      currentStatus = "idle";
                      if (payload) {
                        currentMessage = payload.message;
                        // ...
                        if (serverActivity.id === "welcome-1") {
                          currentStatus = "connected";
                        }
                      }
                    } // ... other cases

                    return {
                      id: agentId,
                      status: currentStatus,
                      message: currentMessage,
                      // ...
                    } as AgentRuntimeState; // Explicit cast if needed, but should infer
                  },
                  catch: (parsingError: unknown) => {
                    // This catch ensures that errors from 'try' (e.g., JSON.parse)
                    // are converted to AgentRuntimeError.
                    // The 'Effect.try' itself will then fail with this AgentRuntimeError.
                    return mapError(
                      new Error("Failed to parse message from server.", {
                        cause: parsingError,
                      }),
                    );
                  },
                }),
            ), // Resulting Stream: Stream<AgentRuntimeState, BaseWebSocketError | AgentRuntimeError, never>
            Stream.mapError(mapError), // CRITICAL FIX: Maps (BaseWebSocketError | AgentRuntimeError) to AgentRuntimeError
          ), // Final Stream: Stream<AgentRuntimeState, AgentRuntimeError, never>
        };
      }),
    dependencies: [],
  },
) {}

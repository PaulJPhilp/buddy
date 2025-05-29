import {
  createUserMessage
} from "@buddy/protocol";
import { Effect, Stream } from "effect";
import {
  WebSocketError as BaseWebSocketError,
  WebSocketService
} from "../websocket/WebSocketService";
import { AgentRuntimeConfigService } from "./config";

// --- Enums and Interfaces for Agent Runtime ---

/**
 * Enumeration of client agent activity types.
 * These represent different types of activities that can occur in the agent runtime.
 */
export enum ClientAgentActivityType {
  /** Response from the agent */
  RESPONSE = "RESPONSE",
  /** User message activity */
  USER_MESSAGE = "USER_MESSAGE",
}

/**
 * Represents an activity within the agent runtime system.
 * Activities are discrete events or actions that occur during agent operation.
 */
export interface AgentActivity {
  /** Unique identifier for the activity */
  readonly id?: string;
  /** Type of activity - can be from ClientAgentActivityType or a custom string */
  readonly type: ClientAgentActivityType | string;
  /** Sequence number for ordering activities */
  readonly sequence?: number;
  /** Payload containing activity-specific data */
  readonly payload?: ClientAgentActivityPayload | unknown;
  /** Timestamp when the activity occurred */
  readonly timestamp?: number | string;
  /** ID of the agent runtime that generated this activity */
  readonly agentRuntimeId?: string;
  /** Additional metadata for the activity */
  readonly metadata?: unknown;
}

/**
 * Payload structure for client agent activities.
 * Contains the actual data and context for agent activities.
 */
export interface ClientAgentActivityPayload {
  /** Message content */
  readonly message?: string;
  /** Text content (alternative to message) */
  readonly text?: string;
  /** List of tools available to the agent */
  readonly availableTools?: ReadonlyArray<{
    readonly name: string;
    readonly description: string;
  }>;
  /** Suggested tool call from the agent */
  readonly suggestedToolCall?: {
    readonly name: string;
    readonly input: unknown;
  };
}

/**
 * Custom error class for agent runtime operations.
 * Extends the standard Error class with additional context for runtime-specific issues.
 */
export class AgentRuntimeError extends Error {
  /** Discriminator for error type checking */
  readonly type = "RUNTIME_ERROR" as const;
  /** Optional error code for categorization */
  readonly code?: string;
  /** Original cause of the error */
  readonly cause?: unknown;

  /**
   * Creates a new AgentRuntimeError.
   * @param options - Error options object
   * @param options.message - Human-readable error message
   * @param options.code - Optional error code for categorization
   * @param options.cause - Underlying cause of the error
   */
  constructor(options: { message: string; code?: string; cause?: unknown }) {
    super(options.message);
    this.name = "AgentRuntimeError";
    this.code = options.code;
    this.cause = options.cause;
  }
}

/**
 * Represents the current state of the agent runtime.
 * This is the primary state object that tracks the agent's operational status.
 */
export interface AgentRuntimeState {
  /** Unique identifier for the runtime instance */
  readonly id: string;
  /** Current operational status of the agent */
  readonly status: "idle" | "thinking" | "connected" | "error";
  /** Current status message */
  readonly message?: string;
  /** Error message if status is "error" */
  readonly errorMessage?: string;
  /** Tools currently available to the agent */
  readonly availableTools?: ReadonlyArray<{
    readonly name: string;
    readonly description: string;
  }>;
  /** Tool call suggested by the agent */
  readonly suggestedToolCall?: {
    readonly name: string;
    readonly input: unknown;
  };
}

/**
 * API interface for the Agent Runtime Service.
 * Defines all operations available for managing agent runtime lifecycle and communication.
 */
export interface AgentRuntimeServiceApi {
  /** 
   * Starts the agent runtime and establishes WebSocket connection.
   * @returns Effect that succeeds when the runtime is started or fails with AgentRuntimeError
   */
  readonly start: () => Effect.Effect<void, AgentRuntimeError>;

  /** 
   * Stops the agent runtime and closes WebSocket connection.
   * @returns Effect that succeeds when the runtime is stopped or fails with AgentRuntimeError
   */
  readonly stop: () => Effect.Effect<void, AgentRuntimeError>;

  /** 
   * Sends a text message to the agent.
   * @param text - The message text to send
   * @returns Effect that succeeds when the message is sent or fails with AgentRuntimeError
   */
  readonly sendMessage: (text: string) => Effect.Effect<void, AgentRuntimeError>;

  /** 
   * Gets a stream of agent runtime state updates.
   * @returns Stream of AgentRuntimeState updates that may fail with AgentRuntimeError
   */
  readonly getState: () => Stream.Stream<AgentRuntimeState, AgentRuntimeError, never>;
}

// --- Service Implementation ---

/**
 * Agent Runtime Service implementation using Effect.Service pattern.
 * 
 * This service manages the lifecycle and communication with an agent runtime over WebSocket.
 * It provides a high-level interface for starting/stopping the runtime, sending messages,
 * and receiving state updates.
 * 
 * The service uses the `effect` method to ensure proper resource management and singleton
 * behavior across the application. This prevents multiple instances from being created
 * and ensures that WebSocket connections are properly managed.
 * 
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const agentRuntime = yield* AgentRuntimeService;
 *   yield* agentRuntime.start();
 *   yield* agentRuntime.sendMessage("Hello, agent!");
 *   const stateStream = agentRuntime.getState();
 *   // Handle state updates...
 * });
 * ```
 */
export class AgentRuntimeService extends Effect.Service<AgentRuntimeServiceApi>()(
  "AgentRuntimeService",
  {
    scoped: Effect.gen(function* () {
      const ws = yield* WebSocketService;
      const config = yield* AgentRuntimeConfigService;
      const { agentId, baseWsUrl } = config;
      console.log("[AgentRuntimeService] Connecting with config:", { agentId, baseWsUrl });

      // Construct WebSocket URL
      const wsUrl = baseWsUrl || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
      console.log("[AgentRuntimeService] Using WebSocket URL:", wsUrl);

      const mapError = (error: unknown): AgentRuntimeError => {
        if (error instanceof AgentRuntimeError) return error;
        if (error instanceof BaseWebSocketError) {
          return new AgentRuntimeError({
            message: `WebSocket error: ${error.message}`,
            cause: error,
          });
        }
        return new AgentRuntimeError({
          message: `Unknown error: ${String(error)}`,
          cause: error,
        });
      };

      /**
       * Starts the agent runtime by establishing WebSocket connection.
       * 
       * @returns Effect that completes when connection is established
       */
      const start = () =>
        Effect.gen(function* () {
          yield* ws.connect(wsUrl);
        }).pipe(Effect.mapError(mapError));

      /**
       * Stops the agent runtime by closing WebSocket connection.
       * 
       * @returns Effect that completes when disconnection is complete
       */
      const stop = () =>
        Effect.gen(function* () {
          yield* ws.disconnect();
        }).pipe(Effect.mapError(mapError));

      /**
       * Sends a user message through the WebSocket connection.
       * 
       * @param text - The message text to send
       * @returns Effect that completes when the message is sent
       */
      const sendMessage = (text: string) =>
        Effect.gen(function* () {
          const userMessage = createUserMessage(text, {
            metadata: {
              chatId: config.chatId, // Include chatId for message routing
            } as any // Temporary fix for type issue
          });
          yield* ws.send(userMessage);
        }).pipe(Effect.mapError(mapError));

      /**
       * Creates a stream of incoming messages from the WebSocket connection.
       * This stream will emit protocol messages as they arrive from the server.
       * 
       * @returns Stream of AgentRuntimeState messages
       */
      const getState = () =>
        ws.receive().pipe(
          Stream.map((protocolMessage) => {
            // Convert protocol messages to runtime state
            // This is a simplified mapping - you may want to expand this based on your needs
            return {
              id: agentId,
              status: "connected" as const,
              message: "Runtime active",
            } as AgentRuntimeState;
          }),
          Stream.mapError(mapError)
        );

      return {
        start,
        stop,
        sendMessage,
        getState,
      } satisfies AgentRuntimeServiceApi;
    }),
    dependencies: [WebSocketService.Default, AgentRuntimeConfigService.Default],
  }
) { }

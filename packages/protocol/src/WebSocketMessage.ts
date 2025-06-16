import { Effect, Either, Schema, pipe } from "effect";

// Base types
export type MessageType =
  | "COMMAND"
  | "EVENT"
  | "QUERY"
  | "RESPONSE"
  | "ERROR"
  | "STATE_CHANGE"
  | "SYSTEM";

export interface Metadata {
  readonly sourceAgentRuntimeId?: string;
  readonly correlationId?: string;
  readonly processed?: boolean;
  readonly persisted?: boolean;
  readonly priority?: number;
  readonly __tag: "Metadata";
}

export interface PingPayload {
  readonly type: "ping";
  readonly __tag: "PingPayload";
}

export interface CommandPayload {
  readonly command: string;
  readonly data: unknown;
  readonly __tag: "CommandPayload";
}

export interface QueryPayload {
  readonly query: string;
  readonly params?: unknown;
  readonly __tag: "QueryPayload";
}

export interface EventPayload {
  readonly eventType: string;
  readonly data: unknown;
  readonly __tag: "EventPayload";
}

export type Payload =
  | PingPayload
  | CommandPayload
  | QueryPayload
  | EventPayload
  | Record<string, unknown>;

export interface WebSocketMessage {
  readonly id: string;
  readonly type: MessageType;
  readonly agentRuntimeId: string;
  readonly timestamp: number;
  readonly sequence: number;
  readonly payload: Payload;
  readonly metadata: Metadata;
  readonly __tag: "WebSocketMessage";
}

// Schema definitions
export const MetadataSchema: Schema.Schema<Metadata> = Schema.Struct({
  sourceAgentRuntimeId: Schema.optional(Schema.String),
  correlationId: Schema.optional(Schema.String),
  processed: Schema.optional(Schema.Boolean),
  persisted: Schema.optional(Schema.Boolean),
  priority: Schema.optional(Schema.Number),
  __tag: Schema.Literal("Metadata"),
});

export const PingPayloadSchema: Schema.Schema<PingPayload> = Schema.Struct({
  type: Schema.Literal("ping"),
  __tag: Schema.Literal("PingPayload"),
});

export const CommandPayloadSchema: Schema.Schema<CommandPayload> =
  Schema.Struct({
    command: Schema.String,
    data: Schema.Unknown,
    __tag: Schema.Literal("CommandPayload"),
  });

export const QueryPayloadSchema: Schema.Schema<QueryPayload> = Schema.Struct({
  query: Schema.String,
  params: Schema.optional(Schema.Unknown),
  __tag: Schema.Literal("QueryPayload"),
});

export const EventPayloadSchema: Schema.Schema<EventPayload> = Schema.Struct({
  eventType: Schema.String,
  data: Schema.Unknown,
  __tag: Schema.Literal("EventPayload"),
});

export const PayloadSchema: Schema.Schema<Payload> = Schema.Union(
  PingPayloadSchema,
  CommandPayloadSchema,
  QueryPayloadSchema,
  EventPayloadSchema,
  Schema.Record({ key: Schema.String, value: Schema.Unknown }),
);

export const WebSocketMessageSchema: Schema.Schema<WebSocketMessage> =
  Schema.Struct({
    id: Schema.String,
    type: Schema.Union(
      Schema.Literal("COMMAND"),
      Schema.Literal("EVENT"),
      Schema.Literal("QUERY"),
      Schema.Literal("RESPONSE"),
      Schema.Literal("ERROR"),
      Schema.Literal("STATE_CHANGE"),
      Schema.Literal("SYSTEM"),
    ),
    agentRuntimeId: Schema.String,
    timestamp: Schema.Number,
    sequence: Schema.Number,
    payload: PayloadSchema,
    metadata: MetadataSchema,
    __tag: Schema.Literal("WebSocketMessage"),
  });

// Helper function to parse JSON safely
const parseJson = (data: unknown): unknown => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      throw new Error(`Invalid JSON: ${data}`);
    }
  }

  // Handle Buffer objects (from WebSocket)
  if (Buffer.isBuffer(data)) {
    try {
      const str = data.toString("utf8");
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Invalid JSON from Buffer: ${data}`);
    }
  }

  return data;
};

// Parser function with error handling
export const parseMessage = (
  data: unknown,
): Effect.Effect<WebSocketMessage, Error> => {
  return Effect.gen(function* () {
    console.log(
      "[parseMessage] Input data type:",
      typeof data,
      "isBuffer:",
      Buffer.isBuffer(data),
    );

    if (Buffer.isBuffer(data)) {
      console.log("[parseMessage] Buffer length:", data.length);
      console.log(
        "[parseMessage] Buffer first 100 chars:",
        data.toString("utf8").substring(0, 100),
      );
    }

    // First try to parse as JSON if it's a string
    const parsed = yield* Effect.try({
      try: () => parseJson(data),
      catch: (error) => new Error(`Failed to parse message: ${error}`),
    });

    console.log("[parseMessage] Parsed JSON keys:", Object.keys(parsed as any));
    console.log("[parseMessage] Parsed JSON type:", (parsed as any).type);
    console.log("[parseMessage] Parsed JSON __tag:", (parsed as any).__tag);

    // Try to parse as a complete message
    const result = yield* Effect.either(
      Schema.decodeUnknown(WebSocketMessageSchema)(parsed, { errors: "all" }),
    );

    if (Either.isRight(result)) {
      console.log("[parseMessage] Schema validation successful");
      return result.right;
    }

    console.log("[parseMessage] Schema validation failed:");
    console.log("[parseMessage] Error details:", result.left);

    // If that fails, create a default message with the parsed data as payload
    const fallbackMessage: WebSocketMessage = {
      id: "unknown-id",
      type: "SYSTEM",
      agentRuntimeId: "unknown-agent",
      timestamp: Date.now(),
      sequence: 0,
      payload: parsed as Record<string, unknown>,
      metadata: {
        sourceAgentRuntimeId: undefined,
        correlationId: undefined,
        processed: false,
        persisted: false,
        priority: 0,
        __tag: "Metadata" as const,
      },
      __tag: "WebSocketMessage" as const,
    };

    console.log("[parseMessage] Using fallback message");
    return fallbackMessage;
  }).pipe(
    Effect.catchAll((error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("[parseMessage] Error:", errorMessage);
      return Effect.fail(new Error(`Failed to parse message: ${errorMessage}`));
    }),
  );
};

// Helper to create a new message
export const createMessage = (
  type: MessageType,
  payload: Payload,
  metadata: Partial<Omit<Metadata, "__tag">> = {},
): WebSocketMessage => ({
  id: crypto.randomUUID(),
  type,
  agentRuntimeId: "test-client",
  timestamp: Date.now(),
  sequence: 0,
  payload,
  metadata: {
    sourceAgentRuntimeId: "test-client",
    correlationId: undefined,
    processed: false,
    persisted: false,
    priority: 0,
    ...metadata,
    __tag: "Metadata" as const,
  },
  __tag: "WebSocketMessage" as const,
});

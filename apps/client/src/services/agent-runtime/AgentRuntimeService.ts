import { Effect, Stream } from "effect";
import {
  WebSocketError as BaseWebSocketError,
  WebSocketMessage as BaseWebSocketMessage,
  WebSocketService
} from "../websocket/WebSocketService";
import { AgentRuntimeConfigService } from "./config";

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
  readonly start: () => Effect.Effect<void, AgentRuntimeError>;
  readonly stop: () => Effect.Effect<void, AgentRuntimeError>;
  readonly sendMessage: (text: string) => Effect.Effect<void, AgentRuntimeError>;
  readonly getState: Stream.Stream<AgentRuntimeState, AgentRuntimeError, never>;
}

// --- Service Implementation ---

export class AgentRuntimeService extends Effect.Service<AgentRuntimeServiceApi>()(
  "AgentRuntimeService",
  {
    effect: Effect.gen(function* () {
      const ws = yield* WebSocketService;
      const config = yield* AgentRuntimeConfigService;
      const { agentId, baseWsUrl } = config;
      const wsUrl = `${baseWsUrl || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/ws/${agentId}`;

      const mapError = (error: unknown): AgentRuntimeError => {
        if (error instanceof AgentRuntimeError) return error;
        if (error instanceof BaseWebSocketError) return new AgentRuntimeError(error.message, { code: error.code });
        if (error instanceof Error) return new AgentRuntimeError(error.message);
        if (typeof error === "string") return new AgentRuntimeError(error);
        return new AgentRuntimeError("Unknown error");
      };

      const createClientMessage = (activity: AgentActivity): BaseWebSocketMessage => ({
        text: JSON.stringify(activity),
        timestamp: new Date().toISOString(),
      });

      return {
        start: () => ws.connect(wsUrl).pipe(Effect.mapError(mapError)),
        stop: () => ws.disconnect().pipe(Effect.mapError(mapError)),
        sendMessage: (text: string) => {
          const activity: AgentActivity = {
            type: ClientAgentActivityType.USER_MESSAGE,
            timestamp: new Date().getTime(),
            payload: { text },
          };
          const msg = createClientMessage(activity);
          return ws.send(msg).pipe(Effect.mapError(mapError));
        },
        getState: ws.receive().pipe(
          Stream.mapEffect((baseMsg) =>
            Effect.try({
              try: () => {
                const serverActivity = JSON.parse(baseMsg.text) as AgentActivity;
                const payload = serverActivity.payload as ClientAgentActivityPayload | undefined;
                let currentMessage: string | undefined = undefined;
                let currentStatus: AgentRuntimeState["status"] = "idle";
                if (serverActivity.type === ClientAgentActivityType.RESPONSE) {
                  currentStatus = "idle";
                  if (payload) {
                    currentMessage = payload.message;
                    if (serverActivity.id === "welcome-1") {
                      currentStatus = "connected";
                    }
                  }
                } else if (serverActivity.type === "AGENT_THINKING") {
                  currentStatus = "thinking";
                } else if (serverActivity.type === "AGENT_ERROR") {
                  currentStatus = "error";
                  currentMessage = payload?.message ?? "Unknown agent error";
                }
                return {
                  id: agentId,
                  status: currentStatus,
                  message: currentMessage,
                  errorMessage: currentStatus === "error" ? currentMessage : undefined,
                } as AgentRuntimeState;
              },
              catch: (e) => mapError(e)
            })
          ),
          Stream.mapError(mapError)
        )
      };
    }),
    dependencies: [WebSocketService.Default, AgentRuntimeConfigService.Default]
  }
) { }

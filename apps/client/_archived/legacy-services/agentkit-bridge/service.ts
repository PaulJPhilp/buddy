import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Data, Effect, Option, Ref, Schema, Stream } from "effect";
import { UrlService } from "../url";
import type { AgentKitBridgeApi } from "./api";

export interface AgentKitMessage {
  id: string;
  type: "USER_MESSAGE" | "COMMAND";
  content?: string;
  messages?: Array<{ role: string; content: string }>;
  agentRuntimeId?: string;
  timestamp: number;
}

export interface AgentKitResponse {
  id: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  timestamp: number;
}

export class AgentKitError extends Data.TaggedError("AgentKitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const AgentKitResponseSchema = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  usage: Schema.optional(
    Schema.Struct({
      promptTokens: Schema.Number,
      completionTokens: Schema.Number,
      totalTokens: Schema.Number,
    }),
  ),
  finishReason: Schema.optional(Schema.String),
  timestamp: Schema.Number,
});

export class AgentKitBridge extends Effect.Service<AgentKitBridgeApi>()(
  "AgentKitBridge",
  {
    scoped: Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      const config = yield* UrlService;
      const providerRef = yield* Ref.make({
        provider: "openai" as const,
        model: "gpt-4",
      });

      const setProvider = (provider: string, model?: string) =>
        Effect.gen(function* () {
          yield* Ref.update(providerRef, (current) => ({
            ...current,
            provider,
            model: model || current.model,
          }));
        });

      const getProvider = () => Ref.get(providerRef);

      const generateMessage = (request: AgentKitMessage) =>
        Effect.gen(function* () {
          console.log(
            "[AgentKitBridge.generateMessage] type:",
            request.type,
            "request:",
            request,
          );
          let isEvent = false;
          let parsed: any = undefined;
          if (request.content) {
            try {
              parsed = JSON.parse(request.content);
              if (parsed && parsed.type === "EVENT") {
                isEvent = true;
              }
            } catch {
              // Malformed payload: return dummy response
              return {
                id: request.id,
                content: "Invalid payload",
                timestamp: Date.now(),
              } as AgentKitResponse;
            }
          }
          if (isEvent) {
            // Generic EVENT: return dummy response
            return {
              id: request.id,
              content: "Event received (test dummy response)",
              timestamp: Date.now(),
            } as AgentKitResponse;
          }
          const url = yield* config.buildApiUrl("/api/agent/generate");
          return yield* HttpClientRequest.post(url).pipe(
            HttpClientRequest.bodyJson({
              messages: [{ role: "user", content: request.content }],
              agentId: request.agentRuntimeId,
            }),
            Effect.flatMap(http.execute),
            Effect.flatMap(
              HttpClientResponse.schemaBodyJson(AgentKitResponseSchema),
            ),
            Effect.map((body) => ({ id: request.id, ...body })),
            Effect.mapError(
              (cause) =>
                new AgentKitError({
                  message: "AgentKit API error: Failed to generate message",
                  cause,
                }),
            ),
          );
        });

      const streamMessage = (request: AgentKitMessage) =>
        Effect.gen(function* () {
          const url = yield* config.buildApiUrl("/api/agent/stream");
          const response = yield* http.post(url, {
            body: HttpClientRequest.bodyJson({
              messages: [{ role: "user", content: request.content }],
              agentId: request.agentRuntimeId,
            }),
          });

          return response.stream.pipe(
            Stream.decodeText(),
            Stream.splitLines,
            Stream.filterMap((line) =>
              Option.liftThrowable(
                () =>
                  JSON.parse(line) as {
                    type: string;
                    content: string;
                  } | null,
              )(),
            ),
            Stream.takeUntil((data) => data.type === "done"),
            Stream.filter(
              (data) =>
                data.type === "chunk" && typeof data.content === "string",
            ),
            Stream.map(
              (data) =>
                ({
                  id: request.id,
                  content: data.content,
                  timestamp: Date.now(),
                }) as AgentKitResponse,
            ),
          );
        }).pipe(
          Effect.flatten,
          Stream.mapError(
            (cause) =>
              new AgentKitError({
                message: "AgentKit stream API error",
                cause,
              }),
          ),
        );

      return {
        generateMessage,
        streamMessage,
        setProvider,
        getProvider,
      } satisfies AgentKitBridgeApi;
    }),
    dependencies: [UrlService.Default, FetchHttpClient.layer],
  },
) {}

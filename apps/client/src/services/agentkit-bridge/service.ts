import { Effect } from "effect";

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

export class AgentKitBridge extends Effect.Service<AgentKitBridge>()(
  "AgentKitBridge",
  {
    scoped: Effect.gen(function* () {
      // Generate messages using the embedded AgentKit directly
      const generateMessage = (request: AgentKitMessage) =>
        Effect.gen(function* () {
          // Convert request to messages format
          const messages = request.messages || [
            { role: "user", content: request.content || "" },
          ];

          // Use server-side API route for AgentKit
          const agentResult = yield* Effect.tryPromise({
            try: async () => {
              console.log(
                "[AgentKitBridge] Calling server API with messages:",
                messages,
              );

              const response = await fetch("/api/agent/generate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "API request failed");
              }

              const result = await response.json();

              console.log("[AgentKitBridge] Server API response:", {
                hasContent: !!result.content,
                contentLength: result.content?.length || 0,
                usage: result.usage,
              });

              return {
                content: result.content || "No response generated",
                usage: result.usage,
                finishReason: result.finishReason,
              };
            },
            catch: (error) => new Error(`AgentKit API error: ${error}`),
          });

          const result: AgentKitResponse = {
            id: request.id,
            content: agentResult.content,
            usage: agentResult.usage,
            finishReason: agentResult.finishReason,
            timestamp: Date.now(),
          };

          return result;
        });

      // Stream messages using the embedded AgentKit directly
      const streamMessage = (
        request: AgentKitMessage,
        onChunk: (chunk: AgentKitResponse) => Effect.Effect<void>,
      ) =>
        Effect.gen(function* () {
          const messages = request.messages || [
            { role: "user", content: request.content || "" },
          ];

          // Use server-side streaming API route
          yield* Effect.tryPromise({
            try: async () => {
              console.log(
                "[AgentKitBridge] Stream calling server API with messages:",
                messages,
              );

              const response = await fetch("/api/agent/stream", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Stream API request failed");
              }

              if (!response.body) {
                throw new Error("No response body for streaming");
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let accumulatedContent = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();

                  if (done) {
                    console.log("[AgentKitBridge] Stream completed");
                    break;
                  }

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split("\n");

                  for (const line of lines) {
                    if (line.startsWith("0:")) {
                      // Parse the streaming data
                      try {
                        const data = JSON.parse(line.slice(2));
                        if (data.type === "text-delta" && data.textDelta) {
                          accumulatedContent += data.textDelta;

                          // Create a chunk response
                          const chunkResponse: AgentKitResponse = {
                            id: request.id,
                            content: accumulatedContent,
                            timestamp: Date.now(),
                          };

                          // Send the chunk (we need to run this in the Effect context)
                          // For now, we'll collect all chunks and send at the end
                        }
                      } catch (parseError) {
                        console.warn(
                          "[AgentKitBridge] Failed to parse stream chunk:",
                          parseError,
                        );
                      }
                    }
                  }
                }

                // Send final accumulated content
                const finalChunk: AgentKitResponse = {
                  id: request.id,
                  content: accumulatedContent || "No response generated",
                  finishReason: "stop",
                  timestamp: Date.now(),
                };

                console.log("[AgentKitBridge] Final stream content:", {
                  hasContent: !!finalChunk.content,
                  contentLength: finalChunk.content?.length || 0,
                });

                return finalChunk;
              } finally {
                reader.releaseLock();
              }
            },
            catch: (error) => new Error(`AgentKit stream API error: ${error}`),
          });

          // For now, using the generate endpoint as fallback since streaming is complex
          // TODO: Implement proper streaming with real-time chunk delivery
          const fallbackResult = yield* Effect.tryPromise({
            try: async () => {
              const response = await fetch("/api/agent/generate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "API request failed");
              }

              const result = await response.json();
              return {
                content: result.content || "No response generated",
                usage: result.usage,
                finishReason: result.finishReason,
              };
            },
            catch: (error) => new Error(`AgentKit fallback error: ${error}`),
          });

          const chunk: AgentKitResponse = {
            id: request.id,
            content: fallbackResult.content,
            usage: fallbackResult.usage,
            finishReason: fallbackResult.finishReason,
            timestamp: Date.now(),
          };

          // Call the chunk handler
          yield* onChunk(chunk);
        });

      return {
        generateMessage,
        streamMessage,
      } as const;
    }),
    dependencies: [],
  },
) {}

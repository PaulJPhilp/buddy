import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "../../websocket/WebSocketService";
import { AgentEndpointResolverService } from "../AgentEndpointResolverService";
import { ChatRuntimeService } from "../ChatRuntimeService";

describe("ChatRuntimeService", () => {
  it("should start and stop successfully", () =>
    Effect.gen(function* () {
      const runtime = yield* ChatRuntimeService;
      yield* runtime.start();
      
      const stateStream = yield* runtime.stateStream;
      const finalState = yield* stateStream.take;
      expect(finalState).toBeDefined();
      
      yield* runtime.stop();
    }).pipe(Effect.provide(Layer.mergeAll(
      WebSocketService.Default,
      AgentEndpointResolverService.Default,
      ChatRuntimeService.Default
    ))));

  it("should handle message flow", () =>
    Effect.gen(function* () {
      const runtime = yield* ChatRuntimeService;
      yield* runtime.start();
      
      const message = { type: "TEST", content: "test" };
      yield* runtime.send(message);
      
      const response = yield* runtime.receive();
      expect(response).toBeDefined();
      
      yield* runtime.stop();
    }).pipe(Effect.provide(Layer.mergeAll(
      WebSocketService.Default,
      AgentEndpointResolverService.Default,
      ChatRuntimeService.Default
    ))));
});

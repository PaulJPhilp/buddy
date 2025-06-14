import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "../../websocket/WebSocketService";
import { AgentEndpointResolverService } from "../AgentEndpointResolverService";
import { ChatRuntimeService } from "../ChatRuntimeService";

describe("ChatRuntimeService", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(ChatRuntimeService.Default).toBeDefined();
      expect(typeof ChatRuntimeService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(ChatRuntimeService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* ChatRuntimeService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(
          Effect.provide(
            Layer.mergeAll(
              WebSocketService.Default,
              AgentEndpointResolverService.Default,
              ChatRuntimeService.Default,
            ),
          ),
        ),
      ).not.toThrow();
    });
  });
  it("should start and stop successfully", () =>
    Effect.gen(function* () {
      const runtime = yield* ChatRuntimeService;
      yield* runtime.start();

      const stateStream = yield* runtime.stateStream;
      const finalState = yield* stateStream.take;
      expect(finalState).toBeDefined();

      yield* runtime.stop();
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          WebSocketService.Default,
          AgentEndpointResolverService.Default,
          ChatRuntimeService.Default,
        ),
      ),
    ));

  it("should handle message flow", () =>
    Effect.gen(function* () {
      const runtime = yield* ChatRuntimeService;
      yield* runtime.start();

      const message = { type: "TEST", content: "test" };
      yield* runtime.send(message);

      const response = yield* runtime.receive();
      expect(response).toBeDefined();

      yield* runtime.stop();
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          WebSocketService.Default,
          AgentEndpointResolverService.Default,
          ChatRuntimeService.Default,
        ),
      ),
    ));
});

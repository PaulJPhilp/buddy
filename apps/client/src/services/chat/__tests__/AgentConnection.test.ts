import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentConnectionService } from "../AgentConnection";

describe("AgentConnectionService", () => {
  const TestLayer = AgentConnectionService.Default;

  it("should track connection state", () =>
    Effect.gen(function* () {
      const service = yield* AgentConnectionService;
      
      // Initially not connected
      const isConnected = yield* service.isConnected;
      expect(isConnected).toBe(false);
      
    }).pipe(Effect.provide(TestLayer)));
});

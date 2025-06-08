import { Effect, Stream, TestContext } from "effect";
import { describe, expect, it } from "vitest";

describe("AgentConnection", () => {
  it("should handle message stream", () =>
    Effect.gen(function* () {
      const messageStream = Stream.make({ text: "Hello, world!" });
      const firstMessage = yield* messageStream.pipe(
        Stream.runHead,
        Effect.map((msg) => (msg._tag === "Some" ? msg.value : undefined)),
      );
      expect(firstMessage).toEqual({ text: "Hello, world!" });
    }).pipe(Effect.provide(TestContext.TestContext), Effect.runPromise));
});

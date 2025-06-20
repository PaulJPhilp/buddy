import { Effect, Queue, Stream } from "effect";
import { describe, expect, it } from "vitest";

describe("Queue Stream Test", () => {
  it("should be able to add items to queue and read from stream", async () => {
    const program = Effect.gen(function* () {
      // Create queue and stream
      const queue = yield* Queue.unbounded<string>();
      const stream = Stream.fromQueue(queue);

      // Add some items to the queue
      yield* Queue.offer(queue, "message1");
      yield* Queue.offer(queue, "message2");
      yield* Queue.offer(queue, "message3");

      // Read from stream - try taking just a few items
      const messages = yield* Stream.take(stream, 3).pipe(Stream.runCollect);

      return Array.from(messages);
    });

    const result = await Effect.runPromise(program);

    expect(result).toEqual(["message1", "message2", "message3"]);
  });

  it("should be able to read from stream after adding items", async () => {
    const program = Effect.gen(function* () {
      // Create queue and stream
      const queue = yield* Queue.unbounded<string>();
      const stream = Stream.fromQueue(queue);

      // Start reading from stream with timeout
      const readPromise = Effect.fork(
        Stream.runHead(stream).pipe(Effect.timeout("1 second")),
      );

      // Add item to queue after a small delay
      yield* Effect.sleep("100 millis");
      yield* Queue.offer(queue, "test-message");

      // Wait for the read to complete
      const fiber = yield* readPromise;
      const result = yield* fiber.await;

      return result;
    });

    const result = await Effect.runPromise(program);

    expect(result._tag).toBe("Success");
    expect(result.value._tag).toBe("Some");
    expect(result.value.value).toBe("test-message");
  });
});

import { Effect, Queue, Stream } from "effect";
import { describe, expect, it } from "vitest";

describe("Stream.fromQueue Debug", () => {
  it("should consume messages from queue", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("Creating queue...");
        const queue = yield* Queue.unbounded<string>();

        console.log("Creating stream from queue...");
        const stream = Stream.fromQueue(queue);

        console.log("Adding messages to queue...");
        yield* Queue.offer(queue, "message1");
        yield* Queue.offer(queue, "message2");
        yield* Queue.offer(queue, "message3");

        console.log("Starting stream processing...");
        const messages: string[] = [];

        yield* Effect.fork(
          Stream.runForEach(stream, (message) =>
            Effect.sync(() => {
              console.log("Stream consumed:", message);
              messages.push(message);
            }),
          ),
        );

        // Wait a bit for processing
        yield* Effect.sleep("100 millis");

        console.log("Collected messages:", messages);
        return messages;
      }),
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("message1");
  });

  it("should consume messages added after stream creation", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("Creating queue and stream...");
        const queue = yield* Queue.unbounded<string>();
        const stream = Stream.fromQueue(queue);

        const messages: string[] = [];

        console.log("Starting stream processing fiber...");
        const fiber = yield* Effect.fork(
          Stream.runForEach(stream, (message) =>
            Effect.sync(() => {
              console.log("Stream consumed:", message);
              messages.push(message);
            }),
          ),
        );

        console.log("Adding messages after stream started...");
        yield* Effect.sleep("50 millis");
        yield* Queue.offer(queue, "delayed1");
        yield* Queue.offer(queue, "delayed2");

        // Wait for processing
        yield* Effect.sleep("200 millis");

        console.log("Final messages:", messages);
        return messages;
      }),
    );

    expect(result.length).toBe(2);
    expect(result).toContain("delayed1");
    expect(result).toContain("delayed2");
  });
});

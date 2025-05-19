import { Effect, Ref, Stream, Queue } from "effect";

export type AgentRuntimeState = {
  message?: string;
  status: "idle" | "thinking";
};

export interface AgentRuntimeServiceApi {
  /** Starts the agent runtime, initializing state if not already running. */
  start: () => Effect.Effect<void>;
  /** Stream of agent state updates (assistant thinking, new message, etc). */
  getState: Stream.Stream<AgentRuntimeState>;
  /** Sends a message to the agent, simulating an async response. */
  sendMessage: (text: string) => Effect.Effect<void>;
}

/**
 * Implementation of the AgentRuntimeService using Effect.Service pattern.
 * Provides a simulated agent runtime with state streaming and async responses.
 */
export class AgentRuntimeService extends Effect.Service<AgentRuntimeServiceApi>()(
  "AgentRuntimeService",
  {
    effect: Effect.gen(function* () {
      // Internal state
      const stateQueue = yield* Queue.unbounded<AgentRuntimeState>();
      const runningRef = yield* Ref.make(false);

      // Stream of agent state updates
      const getState = Stream.fromQueue(stateQueue);

      // Start the agent runtime
      const start = () =>
        Effect.gen(function* () {
          const running = yield* Ref.get(runningRef);
          if (!running) {
            yield* Ref.set(runningRef, true);
            yield* Queue.offer(stateQueue, { status: "idle" });
          }
        });

      // Simulate sending a message to the agent
      const sendMessage = (text: string) =>
        Effect.gen(function* () {
          yield* Queue.offer(stateQueue, { status: "thinking" });
          yield* Effect.sleep(1000); // Simulate async delay
          const responseText = `Echo: ${text}`;
          yield* Queue.offer(stateQueue, { message: responseText, status: "idle" });
        });

      return {
        start,
        getState,
        sendMessage,
      } satisfies AgentRuntimeServiceApi;
    }),
    dependencies: [],
  },
) {}
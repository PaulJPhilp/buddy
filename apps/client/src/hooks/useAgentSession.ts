import {
  AgentSession,
  ChatRuntimeService
} from "@/services/chat-runtime/ChatRuntimeService";
import type { ProtocolMessage } from "@buddy/protocol";
import { Effect, Fiber, Scope, Stream } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAgentSession hook manages the lifecycle and state of a single agent session.
 * - Establishes a session with the agent via ChatRuntimeService
 * - Subscribes to status and incoming message streams
 * - Exposes imperative sendMessage and closeSession methods
 * - Handles cleanup on unmount
 */
export function useAgentSession(agentId: string, chatId: string) {
  const [status, setStatus] = useState<string>("initializing");
  const [messages, setMessages] = useState<ProtocolMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<AgentSession | null>(null);
  const fiberRef = useRef<Fiber.Fiber<unknown, unknown> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const program = Effect.gen(function* (_) {
      // Get the ChatRuntimeService instance
      const runtimeService = yield* _(ChatRuntimeService);
      // Create a scope for the session
      const scope = yield* _(Scope.make());
      // Establish session within the scope
      const session = yield* _(
        runtimeService
          .establishSession(agentId, chatId)
          .pipe(Effect.provideService(Scope.Scope, scope)),
      );
      sessionRef.current = session;
      // Subscribe to status and message streams
      yield* _(
        Stream.runForEach((s: { _tag: string }) =>
          Effect.sync(() => {
            if (isMounted) setStatus(s._tag.toLowerCase());
          }),
        )(session.status$),
      );
      yield* _(
        Stream.runForEach((msg: ProtocolMessage) =>
          Effect.sync(() => {
            if (isMounted) setMessages((prev) => [...prev, msg]);
          }),
        )(session.incomingMessages$),
      );
      return session;
    }).pipe(
      Effect.catchAll((err) =>
        Effect.sync(() => {
          if (isMounted) setError(String(err));
        }),
      ),
      Effect.scoped as any,
    );
    fiberRef.current = Effect.runFork(program);
    return () => {
      isMounted = false;
      if (fiberRef.current) {
        Fiber.interrupt(fiberRef.current);
        fiberRef.current = null;
      }
    };
  }, [agentId, chatId]);

  // Imperative send method
  const sendMessage = useCallback((msg: ProtocolMessage) => {
    if (sessionRef.current) {
      Effect.runPromise(sessionRef.current.send(msg)).catch((e: any) => {
        setError(String(e));
      });
    }
  }, []);

  // Imperative close method
  const closeSession = useCallback(() => {
    if (sessionRef.current) {
      Effect.runPromise(sessionRef.current.close(true)).catch(() => { });
    }
  }, []);

  return { status, messages, error, sendMessage, closeSession };
}

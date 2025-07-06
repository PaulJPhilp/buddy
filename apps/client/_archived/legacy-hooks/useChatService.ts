import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import { ChatService } from "@/services/chat";
import { debugLog } from "@/utils/debugLogger";
import type { Layer } from "effect";

// Track hook usage
let useChatServiceCallCount = 0;

// This hook resolves a ChatService instance from the provided Layer and manages its lifecycle.
// It always cleans up the resolved service (calls cleanup if available) on unmount or dependency change using useRef.
// This pattern ensures:
// 1. The resolved service reference is not lost due to closure issues.
// 2. Cleanup is always performed, and errors are logged.
// 3. React's rules of hooks are followed for safe resource management.

/**
 * React hook for resolving and managing a ChatService instance from a provided Effect Layer.
 *
 * - Resolves a ChatService instance and keeps it stable for the lifetime of the component (until the layer reference changes).
 * - Cleans up the resolved service (calls cleanup if available) on unmount or dependency change using useRef.
 * - Hides Effect.runPromise so React code can work with the ready-to-use service instance.
 *
 * @param layer The Effect Layer to resolve the ChatService from, or null to disable.
 * @returns The resolved ChatService instance, or null if not available.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All resources are cleaned up on unmount or dependency change.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */

/**
 * Resolves a `ChatService` instance from the provided Layer and keeps it
 * stable for the lifetime of the component (until `layer` reference changes).
 *
 * The hook hides `Effect.runPromise` so that React code can work with the
 * ready-to-use service instance.
 */
export function useChatService(
  layer: Layer.Layer<any, never, never> | null,
): any | null {
  useChatServiceCallCount++;
  console.log(
    "[useChatService] Hook called, call count:",
    useChatServiceCallCount,
  );
  console.log(
    "[useChatService] Layer provided:",
    layer ? "YES" : "NO",
    layer ? typeof layer : "null",
  );

  const [service, setService] = useState<any | null>(null);
  const resolvedServiceRef = useRef<any | null>(null);

  useEffect(() => {
    // Cleanup previous resolved service if any
    if (resolvedServiceRef.current) {
      try {
        if (typeof resolvedServiceRef.current.cleanup === "function") {
          Effect.runPromise(resolvedServiceRef.current.cleanup()).catch(
            (err: unknown) => {
              console.error("[useChatService] Cleanup error:", err);
              debugLog("useChatService:cleanupError", err);
            },
          );
        }
      } catch (err) {
        console.error("[useChatService] Cleanup error:", err);
        debugLog("useChatService:cleanupError", err);
      }
      resolvedServiceRef.current = null;
    }

    if (!layer) {
      console.log(
        "[useChatService] No layer provided, setting service to null",
      );
      setService(null);
      return;
    }

    let cancelled = false;

    console.log(
      "[useChatService] Starting service resolution with layer:",
      typeof layer,
    );

    // Resolve ChatService once. Because the Layer may be expensive to build,
    // we do this asynchronously and ignore the result if the component unmounts.
    debugLog("useChatService:resolve", layer);
    Effect.runPromise(
      Effect.gen(function* () {
        console.log(
          "[useChatService] Inside Effect.gen, about to yield* ChatService",
        );
        const chat = yield* ChatService;
        console.log(
          "[useChatService] ChatService resolved, instanceId:",
          (chat as any)?.instanceId || "unknown",
        );
        return chat;
      }).pipe(Effect.provide(layer)),
    )
      .then((chat) => {
        console.log(
          "[useChatService] Service resolution successful, instanceId:",
          (chat as any)?.instanceId || "unknown",
        );
        resolvedServiceRef.current = chat;
        if (!cancelled) {
          debugLog("useChatService:resolved", chat);
          setService(chat);
        } else {
          console.log(
            "[useChatService] Service resolved but component was cancelled",
          );
        }
      })
      .catch((error) => {
        // Always surface the failure once so the stack-trace is visible even
        // if buddyDebug filtering is disabled.
        // eslint-disable-next-line no-console -- deliberate diagnostic output
        console.error("[useChatService] Failed to resolve ChatService", error);
        debugLog("useChatService:error", error);
        if (!cancelled) {
          setService(null);
        }
      });

    // Cleanup function ensures any resources (e.g., WebSocket connections)
    // held by the ChatService instance are released when the component unmounts
    // or when the `layer` reference changes.
    return () => {
      cancelled = true;
      if (resolvedServiceRef.current) {
        try {
          if (typeof resolvedServiceRef.current.cleanup === "function") {
            Effect.runPromise(resolvedServiceRef.current.cleanup()).catch(
              (err: unknown) => {
                console.error("[useChatService] Cleanup error:", err);
                debugLog("useChatService:cleanupError", err);
              },
            );
          }
        } catch (err) {
          console.error("[useChatService] Cleanup error:", err);
          debugLog("useChatService:cleanupError", err);
        }
        resolvedServiceRef.current = null;
      }
    };
  }, [layer]);

  console.log(
    "[useChatService] Returning service:",
    service ? "resolved" : "null",
    service ? (service as any)?.instanceId : "n/a",
  );
  return service;
}

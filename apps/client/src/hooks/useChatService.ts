import { Effect } from "effect";
import { useEffect, useState } from "react";

import { ChatService } from "@/services/chat";
import { debugLog } from "@/utils/debugLogger";
import type { Layer } from "effect";

// Track hook usage
let useChatServiceCallCount = 0;

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

  useEffect(() => {
    console.log(
      "[useChatService] useEffect triggered, layer:",
      layer ? "provided" : "null",
    );

    if (!layer) {
      console.log(
        "[useChatService] No layer provided, setting service to null",
      );
      setService(null);
      return;
    }

    let cancelled = false;
    let resolvedService: any | null = null;

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
        resolvedService = chat;
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
      console.log(
        "[useChatService] Cleanup function called, cancelled:",
        cancelled,
      );
      cancelled = true;
      if (resolvedService) {
        console.log(
          "[useChatService] Cleaning up resolved service, instanceId:",
          (resolvedService as any)?.instanceId || "unknown",
        );
        debugLog("useChatService:cleanup", resolvedService);
        // Best-effort cleanup; errors are logged but otherwise ignored.
        // We do not await here because React expects cleanup to be synchronous.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        Effect.runPromise(resolvedService.cleanup()).catch((err: unknown) => {
          console.log("[useChatService] Cleanup error:", err);
          debugLog("useChatService:cleanupError", err);
        });
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

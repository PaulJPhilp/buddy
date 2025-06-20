import { Effect, Layer } from "effect";
import { useMemo } from "react";

// Effect service imports
import { AgentService } from "@/services/agent";
import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { ToolbarService } from "@/services/toolbar";
import { WebSocketService } from "@/services/websocket";
import { debugLog } from "@/utils/debugLogger";

// Track layer creation
let layerCreationCount = 0;
let serviceLayerCallCount = 0;

// Create a minimal shared layer for fast testing
const sharedServiceLayer = Layer.mergeAll(
  AppService.Default,
  // Re-enabling essential services for input functionality
  AgentService.Default,
  ToolbarService.Default,
  ChatService.Default, // Essential for input field to be enabled
  ChatBridge.Default, // Needed for agent communication and responses
  // Keeping these disabled for now to maintain fast loading
  // MdxService.Default,
  // WebSocketService.Default,
  // ConfigService.Default,
);

console.log(
  "[useServiceLayer] Creating minimal service layer for fast testing, creation count:",
  ++layerCreationCount,
);

/**
 * Core service layer logic without React hooks for testing
 */
export function createServiceLayerLogic(deps: ReadonlyArray<unknown> = []): {
  readonly layer: Layer.Layer<any, never, never>;
  readonly runWithServices: <A, E = never>(
    effect: Effect.Effect<A, E, any>,
  ) => Promise<A>;
} {
  debugLog("createServiceLayerLogic:construct", deps);
  const layer = sharedServiceLayer;

  function runWithServices<A, E = never>(
    effect: Effect.Effect<A, E, any>,
  ): Promise<A> {
    debugLog("createServiceLayerLogic:run", effect);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // @ts-expect-error -- Effect.provide narrows the environment to `never`
    return Effect.runPromise(
      (effect as any).pipe(Effect.provide(layer as any)),
    );
  }

  return { layer, runWithServices } as const;
}

/**
 * Lazily constructs the full service Layer used by the chat client and
 * provides a small helper to run arbitrary effects within that Layer.
 *
 * The Layer is recreated whenever the provided `deps` array changes.
 */
export function useServiceLayer(deps: ReadonlyArray<unknown> = []): {
  readonly layer: Layer.Layer<any, never, never>;
  readonly runWithServices: <A, E = never>(
    effect: Effect.Effect<A, E, any>,
  ) => Promise<A>;
} {
  serviceLayerCallCount++;
  console.log(
    "[useServiceLayer] Hook called, call count:",
    serviceLayerCallCount,
  );

  // Always use the shared layer
  debugLog("useServiceLayer:construct", deps);
  console.log("[useServiceLayer] Using shared service layer");
  const layer = sharedServiceLayer;

  /**
   * Convenience helper so that callers do not need to repeat
   * `Effect.provide(layer)` and `Effect.runPromise`.
   */
  const runWithServices = useMemo(() => {
    console.log("[useServiceLayer] Creating runWithServices function");
    return function runWithServices<A, E = never>(
      effect: Effect.Effect<A, E, any>,
    ): Promise<A> {
      console.log(
        "[useServiceLayer] runWithServices called with effect:",
        effect._tag || "unknown",
      );
      debugLog("useServiceLayer:run", effect);
      // Back to the original approach
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      // @ts-expect-error -- Effect.provide narrows the environment to `never`
      return Effect.runPromise(
        (effect as any).pipe(Effect.provide(layer as any)),
      );
    };
  }, [layer]);

  console.log("[useServiceLayer] Returning layer and runWithServices");
  return { layer, runWithServices } as const;
}

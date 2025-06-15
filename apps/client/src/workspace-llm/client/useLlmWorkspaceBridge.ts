import { Effect } from "effect";
import { useEffect } from "react";
import { LlmWorkspaceBridge } from "./bridge";

/**
 * React hook that mounts the LLM→Workspace bridge.
 * Should be called once at the top level (e.g., inside WorkspaceProvider).
 */
export function useLlmWorkspaceBridge() {
  useEffect(() => {
    // Fork a fiber that ensures the service is initialised.
    const fiber = Effect.runFork(
      Effect.gen(function* () {
        yield* LlmWorkspaceBridge; // accessing service triggers scoped logic
      }),
    );

    return () => {
      // Interrupt on unmount
      Effect.runFork(Effect.interrupt(fiber));
    };
  }, []);
}

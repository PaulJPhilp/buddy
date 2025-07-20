import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { AppError, FatalError, HandledError } from "../errors";
import { ErrorManagerLive } from "../managers";

export function useErrorManager() {
  const { runWithServices } = useEffectContext();
  const [errors, setErrors] = useState<
    (AppError | FatalError | HandledError)[]
  >([]);

  const reportError = useCallback(
    (error: AppError | FatalError | HandledError) => {
      runWithServices(
        ErrorManagerLive.pipe(
          Effect.flatMap((manager) => manager.reportError(error))
        )
      );
    },
    [runWithServices]
  );

  const clearError = useCallback(
    (errorId: string) => {
      runWithServices(
        ErrorManagerLive.pipe(
          Effect.flatMap((manager) => manager.clearError(errorId))
        )
      );
    },
    [runWithServices]
  );

  // Effect to subscribe to error changes from the ErrorManager
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await runWithServices(
        Effect.gen(function* () {
          const manager = yield* ErrorManagerLive;
          // Polling for simplicity; a real-time subscription (e.g., via WebSocket) would be better
          const interval = setInterval(async () => {
            const currentErrors = await Effect.runPromise(manager.getErrors());
            setErrors(currentErrors);
          }, 1000); // Poll every 1 second
          return () => clearInterval(interval);
        })
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [runWithServices]);

  return {
    errors,
    reportError,
    clearError,
  };
}

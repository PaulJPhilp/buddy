import { Console, Effect, Layer, Ref } from "effect";
import { ErrorManagerApi } from "../api";
import { AppError, FatalError, HandledError } from "../errors";
import { ErrorState } from "../types";

export class ErrorManager extends Effect.Service<ErrorManagerApi>()(
  "ErrorManager",
  {
    effect: Effect.gen(function* () {
    const errorRef = yield* Ref.make<ErrorState>({ errors: [] });

    const reportError = (error: AppError | FatalError | HandledError) =>
      Ref.update(errorRef, (state) => ({
        errors: [...state.errors, error],
      })).pipe(
        Effect.tap(() => Console.error("Error Reported:", error.message)),
        Effect.tap(() => {
          if (error instanceof FatalError) {
            // In a real application, you might want to show a global critical error UI
            // or trigger a complete application restart/crash reporting.
            Console.error("FATAL ERROR ENCOUNTERED!", error);
          }
        })
      );

    const clearError = (errorId: string) =>
      Ref.update(errorRef, (state) => ({
        errors: state.errors.filter((err) => {
          // Assuming errors have a unique 'id' property or similar for identification.
          // For now, we'll use a simple check, but this might need refinement based on actual error objects.
          return !(err instanceof HandledError && err.details === errorId);
        }),
      }));

    const getErrors = () =>
      Ref.get(errorRef).pipe(Effect.map((state) => state.errors));

      return {
        reportError,
        clearError,
        getErrors,
      } satisfies ErrorManagerApi;
    }),
  }
) {}


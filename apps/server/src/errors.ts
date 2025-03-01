import { Data, Effect } from "effect";

/**
 * Base error class for all application errors
 */
export class AppError extends Data.TaggedError("AppError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Database-related errors
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

/**
 * Errors related to entity not being found
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entityType: string;
  readonly entityId: string;
  readonly message: string;
}> {}

/**
 * Authentication errors
 */
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Validation errors
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
}> {}

/**
 * Errors related to creating entities
 */
export class CreationError extends Data.TaggedError("CreationError")<{
  readonly entityType: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Utility function to handle errors and convert them to appropriate domain errors
 */
export const handleError = <A, E>(
  effect: Effect.Effect<A, E, never>,
  entityType: string,
  operation: string,
) => {
  return Effect.mapError(effect, (error: unknown) => {
    // Handle SQL errors
    if (typeof error === "object" && error !== null && "code" in error) {
      const sqlError = error as { code: string; message?: string };

      // Handle common SQL error codes
      if (sqlError.code === "23505") {
        // Unique violation
        return new ValidationError({
          message: `A ${entityType} with these details already exists`,
        });
      }

      if (sqlError.code === "23503") {
        // Foreign key violation
        return new ValidationError({
          message: `Referenced ${entityType} does not exist`,
        });
      }

      return new DatabaseError({
        message: sqlError.message || `Database error during ${operation}`,
        operation,
        cause: error,
      });
    }

    // Handle "not found" errors
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("not found")
    ) {
      return new NotFoundError({
        entityType,
        entityId: "unknown",
        message: `${entityType} not found`,
      });
    }

    // Default to generic app error
    return new AppError({
      message:
        error instanceof Error ? error.message : `Error during ${operation}`,
      cause: error,
    });
  });
};

/**
 * Formats error for API response
 */
export const formatErrorResponse = (error: unknown): string => {
  if (error instanceof NotFoundError) {
    return `Not Found: ${error.message}`;
  }

  if (error instanceof ValidationError) {
    return `Validation Error: ${error.message}`;
  }

  if (error instanceof DatabaseError) {
    return `Database Error: ${error.message}`;
  }

  if (error instanceof CreationError) {
    return `Creation Error: ${error.message}`;
  }

  if (error instanceof UnauthorizedError) {
    return `Unauthorized: ${error.message}`;
  }

  if (error instanceof AppError) {
    return `Application Error: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

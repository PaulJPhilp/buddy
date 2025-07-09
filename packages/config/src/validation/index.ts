import { Effect, Schema } from "effect";
import { WorkspaceError } from "../errors";
import {
  StorageData,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from "../types";
import {
  StorageDataSchema,
  WorkspaceCreateInputSchema,
  WorkspaceSchema,
  WorkspaceUpdateInputSchema,
} from "./schemas";

/**
 * Simplified validation functions for testing purposes.
 * These functions always succeed and return the input as-is.
 * In a real implementation, these would perform actual validation.
 */

/**
 * Validates workspace creation input
 */
export const validateWorkspaceCreate = (
  input: unknown
): Effect.Effect<WorkspaceCreateInput, WorkspaceError> => {
  return Schema.decodeUnknown(WorkspaceCreateInputSchema)(input).pipe(
    Effect.mapError(
      (error) =>
        new WorkspaceError({
          message: "Invalid workspace creation input",
          cause: error,
        })
    )
  );
};

/**
 * Validates workspace update input
 */
export const validateWorkspaceUpdate = (
  input: unknown
): Effect.Effect<WorkspaceUpdateInput, WorkspaceError> => {
  return Schema.decodeUnknown(WorkspaceUpdateInputSchema)(input).pipe(
    Effect.mapError(
      (error) =>
        new WorkspaceError({
          message: "Invalid workspace update input",
          cause: error,
        })
    )
  );
};

/**
 * Validates workspace data
 */
export const validateWorkspace = (
  input: unknown
): Effect.Effect<Workspace, WorkspaceError> => {
  return Schema.decodeUnknown(WorkspaceSchema)(input).pipe(
    Effect.mapError(
      (error) =>
        new WorkspaceError({
          message: "Invalid workspace data",
          cause: error,
        })
    )
  );
};

/**
 * Validates storage data
 */
export const validateStorage = (
  input: unknown
): Effect.Effect<StorageData, WorkspaceError> => {
  return Schema.decodeUnknown(StorageDataSchema)(input).pipe(
    Effect.mapError(
      (error) =>
        new WorkspaceError({
          message: "Invalid storage data",
          cause: error,
        })
    )
  );
};

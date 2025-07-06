import type { Effect } from "effect";
import type { IntegrityError } from "./errors";

export interface IntegrityService {
  /**
   * Checks the consistency of all data relationships in the application.
   * Gathers all workspaces, agents, and chat apps and ensures no references
   * point to non-existent entities.
   *
   * @returns A `void` Effect if successful, or an array of `IntegrityError`s if
   * validation fails.
   */
  readonly checkAll: () => Effect.Effect<void, IntegrityError[]>;
}

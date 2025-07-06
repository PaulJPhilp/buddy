import { Data } from "effect";

export type CorruptedEntityType = "Workspace" | "ChatApp";

export class MissingAgentError extends Data.TaggedError("MissingAgentError")<{
  readonly entityType: CorruptedEntityType;
  readonly entityId: string;
  readonly missingAgentId: string;
}> {}

export type IntegrityError = MissingAgentError;

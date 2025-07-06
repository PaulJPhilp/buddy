import { Data } from "effect";

export class AgentKitError extends Data.TaggedError("AgentKitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AgentKitBridgeError = AgentKitError;

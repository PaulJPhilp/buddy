export class InvalidAgentConfig extends Error {
  readonly _tag = "INVALID_AGENT_CONFIG";
  constructor(message: string) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "InvalidAgentConfig";
  }
}

export class ConnectError extends Error {
  readonly _tag = "CONNECT_ERROR";
  constructor(message: string) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "ConnectError";
  }
}

export class VercelAIError extends Error {
  readonly _tag = "VERCEL_AI_ERROR";
  constructor(message: string) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "VercelAIError";
  }
}

export type AgentServiceError =
  | InvalidAgentConfig
  | ConnectError
  | VercelAIError;

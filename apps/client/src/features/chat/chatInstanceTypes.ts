import { Data, Effect } from "effect";

// Domain types
export interface AgentConfigData {
    agentId: string;
    agentWsUrl: string;
    initialAgentName: string;
}

export interface Message {
    id: string;
    sender: "user" | "agent";
    text: string;
    timestamp: string;
}

export interface AgentEvent {
    type: "newMessage";
    payload: Message;
}

// Domain errors
export class AgentConfigError extends Data.TaggedError("AgentConfigError")<{
    readonly message: string;
    readonly cause?: unknown;
}> { }

// Service API interface
export interface AgentConfigApi {
    readonly _tag: "AgentConfig";
    readonly getConfig: () => Effect.Effect<AgentConfigData, AgentConfigError>;
}

// Service implementation
export class AgentConfig extends Effect.Service<AgentConfigData>()("AgentConfig", {
    effect: Effect.succeed({
        agentId: "test-agent-001",
        agentWsUrl: "ws://localhost:8080",
        initialAgentName: "TestAgent"
    }),
    dependencies: []
}) { }

export const defaultAgentConfig: AgentConfigData = {
    agentId: "test-agent-001",
    agentWsUrl: "ws://localhost:8080",
    initialAgentName: "TestAgent",
}; 
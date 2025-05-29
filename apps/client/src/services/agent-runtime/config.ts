import { Effect, Schema } from "effect"

export interface AgentRuntimeConfig {
    readonly agentId: string
    readonly baseWsUrl?: string
    readonly chatId?: string
}

export const AgentRuntimeConfigSchema = Schema.Struct({
    agentId: Schema.String,
    baseWsUrl: Schema.optional(Schema.String),
    chatId: Schema.optional(Schema.String)
})

export const AgentRuntimeConfigService = Effect.Service<AgentRuntimeConfig>()(
    "AgentRuntimeConfigService",
    {
        effect: Effect.succeed({
            agentId: "business-agent",
            baseWsUrl: "ws://localhost:8080",
            chatId: "business"
        })
    }
) 
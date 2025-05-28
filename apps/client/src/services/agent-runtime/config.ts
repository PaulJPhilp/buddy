import { Effect, Schema } from "effect"

export interface AgentRuntimeConfig {
    readonly agentId: string
    readonly baseWsUrl?: string
}

export const AgentRuntimeConfigSchema = Schema.Struct({
    agentId: Schema.String,
    baseWsUrl: Schema.optional(Schema.String)
})

export const AgentRuntimeConfigService = Effect.Service<AgentRuntimeConfig>()(
    "AgentRuntimeConfigService",
    {
        effect: Effect.succeed({
            agentId: "123",
            baseWsUrl: "ws://localhost:8080"
        })
    }
) 
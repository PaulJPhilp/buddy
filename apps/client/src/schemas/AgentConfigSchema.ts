import * as S from '@effect/schema/Schema'

export interface AgentConfig {
  id: string
  initialAgentName: string
}

export const AgentConfigSchema = S.Struct({
  id: S.String,
  initialAgentName: S.String,
})

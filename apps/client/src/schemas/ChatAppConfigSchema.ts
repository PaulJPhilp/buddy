import * as S from '@effect/schema/Schema'

export interface ChatAppConfig {
  id: string
  name: string
  agentId: string
  toolbarId: string
}

export const ChatAppConfigSchema = S.Struct({
  id: S.String,
  name: S.String,
  agentId: S.String,
  toolbarId: S.String,
})

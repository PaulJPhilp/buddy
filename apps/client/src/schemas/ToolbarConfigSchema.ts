import * as S from '@effect/schema/Schema'

export interface ToolbarConfig {
  id: string
  name: string
  tools: unknown[]
}

export const ToolbarConfigSchema = S.Struct({
  id: S.String,
  name: S.String,
  tools: S.Array(S.Unknown),
})

import { Schema } from 'effect'

export interface ToolbarConfig {
  id: string
  name: string
  tools: readonly unknown[]
}

export const ToolbarConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  tools: Schema.Array(Schema.Unknown),
})

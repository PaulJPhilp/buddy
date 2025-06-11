import { Schema } from "effect";

export const PromptType = Schema.Literal("user", "system", "template");

export class Prompt extends Schema.Class<Prompt>("Prompt")({
  id: Schema.String,
  name: Schema.String,
  type: PromptType,
  prompt: Schema.String,
  tags: Schema.Array(Schema.String),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class PromptCreate extends Schema.Class<PromptCreate>("PromptCreate")({
  name: Schema.String,
  type: PromptType,
  prompt: Schema.String,
  tags: Schema.Array(Schema.String),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

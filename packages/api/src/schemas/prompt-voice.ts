import { Schema } from "effect";
import { Prompt } from "./prompt";

export class PromptVoice extends Schema.Class<PromptVoice>("PromptVoice")({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
  type: Schema.String,
  label: Schema.String,
  key: Schema.String,
  prompt: Prompt,
}) {}

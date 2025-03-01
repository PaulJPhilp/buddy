import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { Prompt } from "./PromptSchema";

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

const promptVoiceCreateEndpoint = HttpApiEndpoint.post(
  "createPromptVoice",
)`/prompt/create`
  .setPayload(PromptVoice)
  .addError(Schema.String)
  .addSuccess(PromptVoice);

const promptVoiceGetEndpoint = HttpApiEndpoint.post(
  "getPromptVoice",
)`/user/get/${HttpApiSchema.param("id", Schema.NumberFromString)}`
  .setPayload(PromptVoice)
  .addError(Schema.String)
  .addSuccess(PromptVoice);

export class PromptVoiceApiGroup extends HttpApiGroup.make("prompt-voice")
  .add(promptVoiceCreateEndpoint)
  .add(promptVoiceGetEndpoint) {}

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { PromptVoice } from "../schemas/prompt-voice";

const promptVoiceCreateEndpoint = HttpApiEndpoint.post(
  "createPromptVoice",
)`/prompt-voice/create`
  .setPayload(PromptVoice)
  .addError(Schema.String)
  .addSuccess(PromptVoice);

const promptVoiceGetEndpoint = HttpApiEndpoint.post(
  "getPromptVoice",
)`/prompt-voice/get/${HttpApiSchema.param("id", Schema.NumberFromString)}`
  .setPayload(PromptVoice)
  .addError(Schema.String)
  .addSuccess(PromptVoice);

export const PromptVoiceApiGroup = HttpApiGroup.make("prompt-voice")
  .add(promptVoiceCreateEndpoint)
  .add(promptVoiceGetEndpoint);

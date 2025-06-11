import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { Prompt, PromptCreate } from "../schemas/prompt";

const promptCreateEndpoint = HttpApiEndpoint.post(
  "createPrompt",
)`/prompt/create`
  .setPayload(PromptCreate)
  .addError(Schema.String)
  .addSuccess(Prompt);

const promptGetEndpoint = HttpApiEndpoint.post(
  "getPrompt",
)`/user/get/${HttpApiSchema.param("id", Schema.NumberFromString)}`
  .setPayload(Prompt)
  .addError(Schema.String)
  .addSuccess(Prompt);

export const PromptApiGroup = HttpApiGroup.make("prompt")
  .add(promptCreateEndpoint)
  .add(promptGetEndpoint);

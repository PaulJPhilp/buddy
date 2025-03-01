import { HttpApi } from "@effect/platform";
import { Prompt, PromptApiGroup } from "./src/PromptSchema";
import { PromptVoice, PromptVoiceApiGroup } from "./src/PromptVoiceSchema";
import {
  AuthToken,
  User,
  UserApiGroup,
  UserCreate,
  UserLogin,
} from "./src/UserSchema";

export class ServerApi extends HttpApi.make("server-api")
  .add(PromptApiGroup)
  .add(PromptVoiceApiGroup)
  .add(UserApiGroup) {}

export {
  AuthToken,
  Prompt,
  PromptApiGroup,
  PromptVoice,
  PromptVoiceApiGroup,
  User,
  UserApiGroup,
  UserCreate,
  UserLogin,
};

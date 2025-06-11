import { HttpApi } from "@effect/platform";
import {
  PromptApiGroup,
  PromptVoiceApiGroup,
  UserApiGroup,
} from "./src/groups";

export const ServerApi = Object.assign(
  HttpApi.make("server-api")
    .add(PromptApiGroup)
    .add(PromptVoiceApiGroup)
    .add(UserApiGroup),
  {
    [HttpApi.TypeId]: HttpApi.TypeId,
  },
);

// Export all schemas
export * from "./src/schemas";

// Export all API groups
export * from "./src/groups";

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { AuthToken, User, UserCreate, UserLogin } from "../schemas/user";

const userCreateEndpoint = HttpApiEndpoint.post("createUser")`/user/create`
  .setPayload(UserCreate)
  .addError(Schema.String)
  .addSuccess(User);

const userGetEndpoint = HttpApiEndpoint.post(
  "getUser",
)`/user/get/${HttpApiSchema.param("id", Schema.NumberFromString)}`
  .setPayload(User)
  .addError(Schema.String)
  .addSuccess(User);

const userLoginEndpoint = HttpApiEndpoint.post("loginUser")`/user/login`
  .setPayload(UserLogin)
  .addError(Schema.String)
  .addSuccess(AuthToken);

export const UserApiGroup = HttpApiGroup.make("user")
  .add(userCreateEndpoint)
  .add(userGetEndpoint)
  .add(userLoginEndpoint);

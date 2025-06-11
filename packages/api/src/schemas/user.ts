import { Schema } from "effect";

export class User extends Schema.Class<User>("User")({
  id: Schema.String,
  firstName: Schema.String,
  fullName: Schema.String,
  email: Schema.String,
  password: Schema.Redacted(Schema.String),
  type: Schema.Literal("user", "admin"),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class UserCreate extends Schema.Class<UserCreate>("UserCreate")({
  firstName: Schema.String,
  fullName: Schema.String,
  email: Schema.String,
  password: Schema.Redacted(Schema.String),
  type: Schema.Literal("user", "admin"),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class UserLogin extends Schema.Class<UserLogin>("UserLogin")({
  email: Schema.String,
  password: Schema.Redacted(Schema.String),
}) {}

export class AuthToken extends Schema.Class<AuthToken>("AuthToken")({
  token: Schema.String,
  user: User,
}) {}

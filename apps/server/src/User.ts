import * as crypto from "node:crypto";
import { AuthToken, ServerApi, User, UserCreate, UserLogin } from "@api/core";
import { HttpApiBuilder } from "@effect/platform";
import { SqlResolver } from "@effect/sql";
import { SqlClient } from "@effect/sql/SqlClient";
import { Effect, Layer, Redacted, Schema } from "effect";
import { DatabaseLive } from "./database";
import {
  NotFoundError,
  UnauthorizedError,
  formatErrorResponse,
  handleError,
} from "./errors";
import { ConsoleLoggerLive, LoggerService, log, logEffect } from "./logging";

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Helper function to verify passwords
const verifyPassword = (
  plainPassword: string,
  hashedPassword: string,
): boolean => {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
};

// Helper function to generate JWT tokens
const generateToken = (user: User): string => {
  // In a real application, you would use a proper JWT library
  // This is a simplified version for demonstration purposes
  const payload = {
    id: user.id,
    email: user.email,
    type: user.type,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHmac("sha256", "your-secret-key") // In production, use an environment variable
    .update(base64Payload)
    .digest("base64");

  return `${base64Payload}.${signature}`;
};

export const UserGroupLive = HttpApiBuilder.group(
  ServerApi,
  "user",
  (handlers) =>
    handlers
      .handle("createUser", ({ payload }) =>
        Effect.gen(function* () {
          const user = payload as UserCreate;
          yield* log.info("Creating new user", { name: user.firstName });

          const sql = yield* SqlClient;
          // Hash the password before storing
          const hashedPassword = hashPassword(Redacted.value(user.password));

          const InsertUser = yield* SqlResolver.ordered("InsertUser", {
            Request: UserCreate,
            Result: User,
            execute: () =>
              sql<UserCreate>`
							INSERT INTO users (firstName, fullName, email, password, type) 
							VALUES (
								${user.firstName}, 
                ${user.fullName},
								${user.email}, 
								${hashedPassword}, 
								${user.type}
							)
							RETURNING id, firstName, fullName, email, password, type, created_at, updated_at
							`,
          });

          const result = yield* logEffect.after(
            InsertUser.execute({
              firstName: user.firstName,
              fullName: user.fullName,
              email: user.email,
              password: user.password,
              type: user.type,
              created_at: user.created_at,
              updated_at: user.updated_at,
            }),
            "User created successfully",
            true,
          );

          return result;
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "User", "creation"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to create user", error);
            return formatErrorResponse(error);
          }),
        ),
      )

      // Add the getUser handler
      .handle("getUser", ({ payload }) =>
        Effect.gen(function* () {
          const user = payload as User;
          yield* log.info("Retrieving user", { id: user.id });

          const sql = yield* SqlClient;

          // Execute the select query directly with the SQL client
          const result = yield* logEffect.after(
            sql<User>`SELECT id, fullName, firstName, email, password, type, created_at, updated_at FROM users WHERE id=${user.id}`,
            "Retrieved user data from database",
          );

          if (result.length === 0) {
            yield* log.warn(`User not found`, { id: user.id });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "User",
                entityId: String(user.id),
                message: `User with ID ${user.id} not found`,
              }),
            );
          }

          const row = result[0];
          if (row === undefined) {
            yield* log.warn(`User result undefined`, { id: user.id });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "User",
                entityId: String(user.id),
                message: `User with ID ${user.id} not found`,
              }),
            );
          }

          // Return the found User
          yield* log.info("User found successfully", { id: user.id });
          return Schema.decodeSync(User)({
            id: row.id,
            fullName: row.fullName,
            firstName: row.firstName,
            email: row.email,
            password: Redacted.value(row.password),
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "User", "retrieval"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to retrieve user", error);
            return formatErrorResponse(error);
          }),
        ),
      )

      // Add the login handler
      .handle("loginUser", ({ payload }) =>
        Effect.gen(function* () {
          const loginData = payload as UserLogin;
          yield* log.info("Attempting user login", { email: loginData.email });

          const sql = yield* SqlClient;

          // Find user by email
          const result = yield* logEffect.after(
            sql<User>`SELECT id, fullName, firstName, email, password, type, created_at, updated_at FROM users WHERE email=${loginData.email}`,
            "Retrieved user data for login",
          );

          if (result.length === 0) {
            yield* log.warn(`User not found for login`, {
              email: loginData.email,
            });
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Invalid email or password",
              }),
            );
          }

          const row = result[0];
          if (row === undefined) {
            yield* log.warn(`User result undefined for login`, {
              email: loginData.email,
            });
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Invalid email or password",
              }),
            );
          }

          // Verify password
          const isPasswordValid = verifyPassword(
            Redacted.value(loginData.password),
            Redacted.value(row.password),
          );

          if (!isPasswordValid) {
            yield* log.warn(`Invalid password for user`, {
              email: loginData.email,
            });
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Invalid email or password",
              }),
            );
          }

          // Create user object
          const user = Schema.decodeSync(User)({
            id: row.id,
            fullName: row.fullName,
            firstName: row.firstName,
            email: row.email,
            password: Redacted.value(row.password),
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });

          // Generate token
          const token = generateToken(user);

          // Return auth token with user
          yield* log.info("User logged in successfully", {
            email: loginData.email,
          });
          return Schema.decodeSync(AuthToken)({
            token,
            user: {
              ...user,
              password: Redacted.value(user.password),
            },
          });
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "User", "login"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to login user", error);
            return formatErrorResponse(error);
          }),
        ),
      ),
).pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(Layer.succeed(LoggerService, ConsoleLoggerLive)),
);

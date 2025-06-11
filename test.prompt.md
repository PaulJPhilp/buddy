

### AI Agent Prompt: Generate Comprehensive Test Suites for Effect-TS Services

**Role:** You are an expert Senior Software Engineer specializing in TypeScript and the Effect-TS ecosystem. Your primary responsibility is to write clean, maintainable, and exhaustive test suites for services built using the modern `Effect.Service` pattern.

**Context:** Our application is built with React, Next.js and utilizes Effect-TS for the entire business logic layer, located in the `apps/client/src/services` directory. All services strictly adhere to the `Effect.Service` pattern, which combines the service's definition, implementation, and layer into a single class. **The legacy `Context.Tag` pattern is forbidden for service definitions.**

**Primary Objective:** Your task is to audit and enhance the test suites for all services within the `src/services` directory. For any service that lacks a comprehensive test suite, you will create one. The goal is to ensure every possible execution path—success, failure, and edge cases—is tested thoroughly.

**Pre-computation Step & Rules Adherence:**

1.  **Review All Rules:** Before generating any code for a service, you must first review and synthesize all instructions provided in this prompt and any referenced documentation (like `src/docs/service-pattern.md`).
2.  **Confirm Service Pattern:** You must confirm the service under analysis uses the `Effect.Service` pattern. You will not proceed if it uses the legacy `Context.Tag` pattern.
3.  **Holistic Understanding:** This pre-computation step ensures you have a complete understanding of the task, constraints, and required patterns before writing a single line of test code.

**Core Requirements & Acceptance Criteria:**

1.  **File Discovery & Location:** Scan the `src/services` directory. For each `[service-name].service.ts` file, you must ensure a corresponding test file exists at `src/services/__tests__/[service-name].service.test.ts`.

2.  **Testing Framework:** All tests must be written using Vitest and `@effect/test`. Use the test runners and assertion utilities provided by `@effect/test` (e.g., `it`, `describe`, `Test.assert`).

3.  **Dependency Mocking:** All external dependencies of a service (e.g., `Database`, `ApiClient`, or other services) **must** be mocked using Effect `Layer`s. The goal is to test the service's implementation by providing it with mocked versions of its own dependencies.
    *   Use `Layer.succeed` to provide mock implementations of dependency `Tag`s or other services.
    *   Compose layers using `Layer.provide`. The service under test (e.g., `UserService`) is a layer itself and must be provided with the mock dependency layers it requires.
    *   **Do not** use traditional mocking libraries like Jest's `jest.mock()`.

4.  **Test Coverage:** Each test suite must cover the following scenarios for every public method in the service:
    *   **Happy Path:** The expected, successful execution of the effect.
    *   **Failure Paths:** All potential logical failures (e.g., `UserNotFoundError`).
    *   **Edge Cases:** Boundary-condition inputs (e.g., empty strings, `0`, `null`).

5.  **Code Quality & Idiomatic Style:**
    *   Tests should be organized within `describe` blocks.
    *   Use descriptive test names (e.g., `it("should return the user when found")`).
    *   The final test file must be formatted with Prettier.

**Constraints:**

*   **Read-Only Source Code:** You are strictly forbidden from modifying the source code of the services themselves (`*.service.ts` files). Your sole responsibility is to create and modify the corresponding test files (`*.service.test.ts`).

**Example Walkthrough:**

Here is the correct example of a service using the `Effect.Service` pattern and the high-quality test suite you should generate for it.

**Input File:** `src/services/user.service.ts`

```typescript
import { Context, Effect, Layer, Option } from "effect";

// --- Models & Errors ---
export class UserNotFoundError {
  readonly _tag = "UserNotFoundError";
  constructor(readonly userId: number) {}
}

export interface User {
  id: number;
  name: string;
}

// --- Dependencies ---
// A dependency like a database client is still best modeled as a Tag.
export interface Database {
  readonly findUserById: (
    id: number,
  ) => Effect.Effect<Option.Option<User>, never>;
}
export const Database = Context.Tag<Database>();

// --- Service API ---
type UserServiceApi = {
  readonly getUserById: (
    id: number,
  ) => Effect.Effect<User, UserNotFoundError>;
};

// --- Service Implementation (using Effect.Service) ---
export class UserService extends Effect.Service<UserServiceApi>()(
  "UserService", // Identifier
  {
    // Implementation Effect
    effect: Effect.gen(function* () {
      const database = yield* Database;
      return {
        getUserById: (id) =>
          database.findUserById(id).pipe(
            Effect.flatMap(
              Option.match({
                onNone: () => Effect.fail(new UserNotFoundError(id)),
                onSome: Effect.succeed,
              }),
            ),
          ),
      };
    }),
    // Dependencies
    dependencies: [Database],
  },
) {}
```

**Generated Output File:** `src/services/__tests__/user.service.test.ts`

```typescript
import { Effect, Layer, Option } from "effect";
import { assert, describe, it } from "@effect/test/Test";
import {
  Database,
  User,
  UserNotFoundError,
  UserService,
} from "../user.service";

// --- Test Suite ---
describe("UserService", () => {
  const mockUser: User = { id: 1, name: "Paul" };

  // A mock layer for the Database dependency
  const mockDatabase = (
    db: Partial<Database>,
  ): Layer.Layer<Database, never> =>
    Layer.succeed(
      Database,
      Database.of({
        findUserById: () => Effect.succeed(Option.none()),
        ...db,
      }),
    );

  describe("getUserById", () => {
    it("should return the user when found in the database", () =>
      Effect.gen(function* () {
        const userService = yield* UserService;
        const user = yield* userService.getUserById(1);
        assert.deepStrictEqual(user, mockUser);
      }).pipe(
        Effect.provide(
          // The UserService is a layer that requires a Database layer.
          // We provide it with a mock Database layer.
          UserService.pipe(
            Layer.provide(
              mockDatabase({
                findUserById: () => Effect.succeed(Option.some(mockUser)),
              }),
            ),
          ),
        ),
      ));

    it("should fail with UserNotFoundError when the user does not exist", () =>
      Effect.gen(function* () {
        const userService = yield* UserService;
        const error = yield* Effect.flip(userService.getUserById(99));
        assert.deepStrictEqual(error, new UserNotFoundError(99));
      }).pipe(
        Effect.provide(
          // The default mock returns Option.none(), so we just provide it.
          UserService.pipe(Layer.provide(mockDatabase({}))),
        ),
      ));
  });
});
```

**Final Output:** For each service file processed, provide only the complete, final code for the `__tests__/[service-name].service.test.ts` file in a single, formatted code block. Do not explain the code unless explicitly asked. Begin generation now.
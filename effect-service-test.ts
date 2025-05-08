import { Effect } from "effect";

// 1. Define the API interface
interface TestApi {
  foo: () => Effect.Effect<string>;
}

// 2. Implement the class-based service
export class TestService extends Effect.Service<TestApi>()(
  "TestService",
  {
    effect: Effect.succeed({
      foo: () => Effect.succeed("bar"),
    }),
    dependencies: [],
  }
) {}

// 3. Use the service in an Effect.gen block
const program = Effect.gen(function* () {
  const svc = yield* TestService;
  return yield* svc.foo();
});

// 4. Provide the service as a layer and run the effect
Effect.runPromise(
  program.pipe(Effect.provide(TestService.Default))
).then(console.log).catch(console.error);
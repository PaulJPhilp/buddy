import { Effect } from "effect";

// Most basic Effect test - no services, no layers
const basicTest = Effect.gen(function* (_) {
  yield* Effect.log("🔄 Basic Effect test starting...")
  return "basic-test-complete"
})

// Even simpler - just Effect.succeed
const simpleEffect = Effect.succeed("simple-success")

// Export test functions
export const runBasicTest = () => {
  console.log("🚀 runBasicTest called");
  return Effect.runPromise(basicTest);
};

export const runSimpleEffect = () => {
  console.log("🚀 runSimpleEffect called");
  return Effect.runPromise(simpleEffect);
};

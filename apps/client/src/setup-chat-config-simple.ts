import { Effect, Layer } from "effect";
import { AgentService } from "./services/agent";
import { AppService } from "./services/app";
import { ToolbarService } from "./services/toolbar";

// Simple test to isolate the issue
const simpleTest = Effect.gen(function* () {
  console.log("🔄 Simple test starting...");

  // Test 1: Just get one service
  console.log("🔄 Getting AgentService...");
  const agentService = yield* AgentService;
  console.log("✅ AgentService obtained:", agentService);

  return "test-complete";
});

// Create the service layer
const serviceLayer = Layer.mergeAll(
  AppService.Default,
  AgentService.Default,
  ToolbarService.Default,
);

// Export the simple test function
export const runSimpleTest = () => {
  console.log("🚀 runSimpleTest called");
  return Effect.runPromise(
    simpleTest.pipe(
      Effect.provide(serviceLayer),
      Effect.catchAll((error) => {
        console.error("❌ Simple test failed:", error);
        console.error("❌ Error type:", typeof error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return Effect.fail(error);
      }),
    ),
  );
};

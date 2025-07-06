import { describe, expect, it } from "vitest";
import { agentUrlServiceLayerWithPath } from "../service.js";
import { AgentUrlService } from "../../agent-config";
import { Effect } from "effect";

const TEST_PATH = "/tmp/test-agents";

const TestLayer = agentUrlServiceLayerWithPath(TEST_PATH);

describe("AgentUrlService minimal integration", () => {
  it("should provide agentsPath and getAgentsPath via Effect", async () => {
    const program = Effect.gen(function* () {
      const config = yield* AgentUrlService;
      expect(config.agentsPath).toBe(TEST_PATH);
      const path = yield* config.getAgentsPath();
      expect(path).toBe(TEST_PATH);
    });
    await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
  });
});

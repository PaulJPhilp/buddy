import fs from "node:fs";
import path from "node:path";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { agentUrlServiceLayerWithPath } from "../../agent-config/service.js";
import { AgentService } from "../service.js";

const MOCK_AGENTS_DATA = {
  buddy: { id: "buddy", initialAgentName: "Buddy" },
  researcher: { id: "researcher", initialAgentName: "Researcher" },
};
const tempDir = path.join(__dirname, "temp-agents");

// Use the real agentUrlServiceLayerWithPath for the test layer
const TestAgentConfigLayer = agentUrlServiceLayerWithPath(tempDir);

const TestLayer = Layer.provide(
  AgentService.Default,
  Layer.mergeAll(TestAgentConfigLayer, NodeFileSystem.layer)
);

describe("AgentService", () => {
  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
    for (const agent of Object.values(MOCK_AGENTS_DATA)) {
      fs.writeFileSync(
        path.join(tempDir, `${agent.id}.json`),
        JSON.stringify(agent, null, 2)
      );
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should get all agents from the real file system", async () => {
    const program = Effect.gen(function* () {
      const agentService = yield* AgentService;
      const agents = yield* agentService.getAll();
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.id).sort()).toEqual(["buddy", "researcher"]);
    });
    await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)) as Effect.Effect<
        void,
        never,
        never
      >
    );
  });

  it("should get an agent by ID when it exists", async () => {
    const program = Effect.gen(function* () {
      const agentService = yield* AgentService;
      const agent = yield* agentService.getById("buddy");
      expect(agent).toBeDefined();
      expect(agent?.id).toBe("buddy");
    });
    await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)) as Effect.Effect<
        void,
        never,
        never
      >
    );
  });

  it("should return undefined for a non-existent agent ID", async () => {
    const program = Effect.gen(function* () {
      const agentService = yield* AgentService;
      const agent = yield* agentService.getById("nonexistent");
      expect(agent).toBeUndefined();
    });
    await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)) as Effect.Effect<
        void,
        never,
        never
      >
    );
  });
});

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "./AgentService";

describe("AgentService", () => {
  it("creates and retrieves an agent", () => {
    const program = Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "test-agent",
        initialAgentName: "Test Agent",
      };
      yield* service.create(agent);
      const retrieved = yield* service.getById("test-agent");
      expect(retrieved).toEqual(agent);
    });
    return Effect.runPromise(Effect.provide(program, AgentService.Default));
  });

  it("updates an agent", () => {
    const program = Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "test-agent",
        initialAgentName: "Test Agent",
      };
      yield* service.create(agent);

      const update = { initialAgentName: "Updated Agent" };
      yield* service.update("test-agent", update);

      const updated = yield* service.getById("test-agent");
      expect(updated).toEqual({ ...agent, ...update });
    });
    return Effect.runPromise(Effect.provide(program, AgentService.Default));
  });

  it("deletes an agent", () => {
    const program = Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "test-agent",
        initialAgentName: "Test Agent",
      };
      yield* service.create(agent);
      yield* service.delete("test-agent");

      const deleted = yield* service.getById("test-agent");
      expect(deleted).toBeUndefined();
    });
    return Effect.runPromise(Effect.provide(program, AgentService.Default));
  });

  it("lists all agents", () => {
    const program = Effect.gen(function* () {
      const service = yield* AgentService;
      const agents = [
        { id: "agent-1", initialAgentName: "Agent 1" },
        { id: "agent-2", initialAgentName: "Agent 2" },
        { id: "agent-3", initialAgentName: "Agent 3" },
      ];

      for (const agent of agents) {
        yield* service.create(agent);
      }

      const all = yield* service.getAll();
      expect(all).toHaveLength(3);
      expect(all).toEqual(expect.arrayContaining(agents));
    });
    return Effect.runPromise(Effect.provide(program, AgentService.Default));
  });
});

import { Chunk, Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentServiceApi } from "../api";
import { AgentConfigValidationError, AgentPersistenceError } from "../errors";
import { AgentService } from "../service";
import type { AgentConfig } from "../types";

// Test layer using real service
const TestLayer = Layer.mergeAll(AgentService.Default);

describe("AgentService", () => {
  describe("Service Structure", () => {
    it("should have a valid service structure", () => {
      expect(AgentService.Default).toBeDefined();
      expect(typeof AgentService.Default).toBe("object");
      expect(AgentService.Default).toHaveProperty("pipe");
    });

    it("should provide proper service API", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          expect(service).toBeDefined();
          expect(typeof service.getAll).toBe("function");
          expect(typeof service.getById).toBe("function");
          expect(typeof service.create).toBe("function");
          expect(typeof service.update).toBe("function");
          expect(typeof service.delete).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Agent Management", () => {
    const testAgent: AgentConfig = {
      id: "test-agent-1",
      initialAgentName: "Test Agent",
      prompt: "You are a helpful test assistant",
    };

    it("should start with empty agent list", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          const agents = yield* service.getAll();

          expect(Array.isArray(agents)).toBe(true);
          expect(agents.length).toBe(0);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should create and retrieve agents", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Create agent
          yield* service.create(testAgent);

          // Retrieve all agents
          const agents = yield* service.getAll();
          expect(agents.length).toBe(1);
          expect(agents[0]).toEqual(testAgent);

          // Retrieve by ID
          const agent = yield* service.getById(testAgent.id);
          expect(agent).toEqual(testAgent);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should return undefined for non-existent agent", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          const agent = yield* service.getById("non-existent");

          expect(agent).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should update existing agents", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Create agent
          yield* service.create(testAgent);

          // Update agent
          const update = {
            initialAgentName: "Updated Test Agent",
            prompt: "Updated prompt",
          };
          yield* service.update(testAgent.id, update);

          // Verify update
          const updatedAgent = yield* service.getById(testAgent.id);
          expect(updatedAgent?.initialAgentName).toBe("Updated Test Agent");
          expect(updatedAgent?.prompt).toBe("Updated prompt");
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should delete agents", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Create agent
          yield* service.create(testAgent);

          // Verify it exists
          let agents = yield* service.getAll();
          expect(agents.length).toBe(1);

          // Delete agent
          yield* service.delete(testAgent.id);

          // Verify it's gone
          agents = yield* service.getAll();
          expect(agents.length).toBe(0);

          const agent = yield* service.getById(testAgent.id);
          expect(agent).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Multiple Agents", () => {
    const agents: AgentConfig[] = [
      {
        id: "agent-1",
        initialAgentName: "Agent One",
        prompt: "You are agent one",
      },
      {
        id: "agent-2",
        initialAgentName: "Agent Two",
        prompt: "You are agent two",
      },
    ];

    it("should handle multiple agents", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Create multiple agents
          for (const agent of agents) {
            yield* service.create(agent);
          }

          // Verify all agents exist
          const allAgents = yield* service.getAll();
          expect(allAgents.length).toBe(2);

          // Verify each agent can be retrieved by ID
          for (const agent of agents) {
            const retrieved = yield* service.getById(agent.id);
            expect(retrieved).toEqual(agent);
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle concurrent operations", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Create agents concurrently
          yield* Effect.all(
            agents.map((agent) => service.create(agent)),
            { concurrency: "unbounded" },
          );

          // Verify all agents exist
          const allAgents = yield* service.getAll();
          expect(allAgents.length).toBe(2);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Validation", () => {
    it("should validate agent config schema", async () => {
      const invalidAgent = {
        id: "invalid",
        // Missing required fields
      } as any;

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          return yield* service.create(invalidAgent);
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentConfigValidationError);
      }
    });

    it("should handle schema validation errors", async () => {
      const invalidAgent = {
        id: "test",
        initialAgentName: 123, // Should be string
        prompt: ["invalid", "array"], // Should be string
      } as any;

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          return yield* service.create(invalidAgent);
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentConfigValidationError);
        expect(result.left.message).toBe("Invalid agent config format");
      }
    });
  });

  describe("Error Handling", () => {
    it("should map persistence errors correctly", () => {
      const error = new AgentPersistenceError({
        message: "Failed to save agent",
        operation: "save",
        cause: new Error("Database error"),
      });

      expect(error.message).toBe("Failed to save agent");
      expect(error.operation).toBe("save");
      expect(error.cause).toBeInstanceOf(Error);
    });

    it("should map validation errors correctly", () => {
      const error = new AgentConfigValidationError({
        message: "Invalid config",
        cause: new Error("Schema error"),
      });

      expect(error.message).toBe("Invalid config");
      expect(error.cause).toBeInstanceOf(Error);
    });
  });

  describe("Service Integration", () => {
    it("should work with Effect combinators", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;

          // Test Effect.all with service methods
          const [allAgents, nonExistent] = yield* Effect.all([
            service.getAll(),
            service.getById("non-existent"),
          ]);

          expect(Array.isArray(allAgents)).toBe(true);
          expect(nonExistent).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle service scoping properly", async () => {
      // Test that multiple service instances work correctly
      const result1 = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          return yield* service.getAll();
        }).pipe(Effect.provide(TestLayer)),
      );

      const result2 = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AgentService;
          return yield* service.getAll();
        }).pipe(Effect.provide(TestLayer)),
      );

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });
  });
});

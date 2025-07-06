import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { AgentManager } from "../service";
import {
  AgentNotFoundError,
  AgentHealthError,
  AgentCommunicationError,
} from "../errors";

describe("AgentManager - Health Monitoring", () => {
  const TestLayer = Layer.mergeAll(NodeFileSystem.layer, AgentManager.Default);

  let cleanup: (() => Effect.Effect<void>) | null = null;

  beforeEach(async () => {
    cleanup = null;
  });

  afterEach(async () => {
    if (cleanup) {
      await Effect.runPromise(cleanup().pipe(Effect.provide(TestLayer)));
    }
  });

  describe("getAgentHealth", () => {
    test("should get health for active agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("health-test-agent");

        // Get health
        const health = yield* manager.getAgentHealth("health-test-agent");

        expect(health.status).toBe("healthy");
        expect(health.lastSeen).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when getting health for non-existent agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Try to get health for non-existent agent
        const result = yield* Effect.either(
          manager.getAgentHealth("non-existent-agent")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should detect unhealthy agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize and then terminate an agent
        yield* manager.initializeAgent("unhealthy-agent");
        yield* manager.terminateAgent("unhealthy-agent");

        // Try to get health (should fail since agent is terminated)
        const result = yield* Effect.either(
          manager.getAgentHealth("unhealthy-agent")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should include health status for active agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("metrics-agent");

        // Get health
        const health = yield* manager.getAgentHealth("metrics-agent");

        expect(health.status).toBe("healthy");
        expect(health.lastSeen).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should perform health check on agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("check-agent");

        // Perform health check
        yield* manager.performHealthCheck("check-agent");

        // Get health after check
        const health = yield* manager.getAgentHealth("check-agent");

        expect(health.status).toBe("healthy");
        expect(health.lastSeen).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update health check timestamp", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("timestamp-agent");

        // First health check
        const health1 = yield* manager.getAgentHealth("timestamp-agent");
        const firstCheck = health1.lastSeen;

        // Wait a bit
        yield* Effect.sleep("10 millis");

        // Perform another health check
        yield* manager.performHealthCheck("timestamp-agent");

        // Second health check
        const health2 = yield* manager.getAgentHealth("timestamp-agent");
        const secondCheck = health2.lastSeen;

        expect(secondCheck.getTime()).toBeGreaterThanOrEqual(
          firstCheck.getTime()
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("performHealthCheck", () => {
    test("should perform health check when no agents exist", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Perform health check on all agents (should complete without error)
        yield* manager.performHealthCheck();

        // Verify no active agents
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should perform health check for all active agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("health-agent-1");
        yield* manager.initializeAgent("health-agent-2");
        yield* manager.initializeAgent("health-agent-3");

        // Perform health check on all agents
        yield* manager.performHealthCheck();

        // Verify all agents are still active and healthy
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toHaveLength(3);
        expect(activeAgents).toContain("health-agent-1");
        expect(activeAgents).toContain("health-agent-2");
        expect(activeAgents).toContain("health-agent-3");

        // Check individual health
        const health1 = yield* manager.getAgentHealth("health-agent-1");
        const health2 = yield* manager.getAgentHealth("health-agent-2");
        const health3 = yield* manager.getAgentHealth("health-agent-3");

        expect(health1.status).toBe("healthy");
        expect(health2.status).toBe("healthy");
        expect(health3.status).toBe("healthy");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle health checks for agents with different states", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize agents
        yield* manager.initializeAgent("healthy-agent");
        yield* manager.initializeAgent("terminated-agent");

        // Terminate one agent
        yield* manager.terminateAgent("terminated-agent");

        // Perform health check
        yield* manager.performHealthCheck();

        // Verify only healthy agent remains active
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toHaveLength(1);
        expect(activeAgents).toContain("healthy-agent");
        expect(activeAgents).not.toContain("terminated-agent");

        // Check health of remaining agent
        const healthyAgentHealth = yield* manager.getAgentHealth(
          "healthy-agent"
        );
        expect(healthyAgentHealth.status).toBe("healthy");

        // Terminated agent should not be accessible
        const terminatedResult = yield* Effect.either(
          manager.getAgentHealth("terminated-agent")
        );
        expect(terminatedResult._tag).toBe("Left");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent health checks", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("concurrent-1");
        yield* manager.initializeAgent("concurrent-2");
        yield* manager.initializeAgent("concurrent-3");

        // Perform concurrent health checks on individual agents
        const healthChecks = [
          manager.getAgentHealth("concurrent-1"),
          manager.getAgentHealth("concurrent-2"),
          manager.getAgentHealth("concurrent-3"),
        ];

        const results = yield* Effect.all(healthChecks, {
          concurrency: "unbounded",
        });

        // All should succeed and return healthy status
        results.forEach((health) => {
          expect(health.status).toBe("healthy");
        });
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("agent health monitoring", () => {
    test("should track healthy agents correctly", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize healthy agents
        yield* manager.initializeAgent("healthy-1");
        yield* manager.initializeAgent("healthy-2");

        // Verify all agents are active and healthy
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toHaveLength(2);

        // Check health of each agent
        const health1 = yield* manager.getAgentHealth("healthy-1");
        const health2 = yield* manager.getAgentHealth("healthy-2");

        expect(health1.status).toBe("healthy");
        expect(health2.status).toBe("healthy");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should check individual agent health status", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize agents
        yield* manager.initializeAgent("healthy-agent");
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.initializeAgent("test-agent-2");

        // Terminate some agents
        yield* manager.terminateAgent("test-agent-1");
        yield* manager.terminateAgent("test-agent-2");

        // Check health of remaining agent
        const healthyAgentHealth = yield* manager.getAgentHealth(
          "healthy-agent"
        );
        expect(healthyAgentHealth.status).toBe("healthy");

        // Terminated agents should not be accessible
        const terminated1Result = yield* Effect.either(
          manager.getAgentHealth("test-agent-1")
        );
        expect(terminated1Result._tag).toBe("Left");

        const terminated2Result = yield* Effect.either(
          manager.getAgentHealth("test-agent-2")
        );
        expect(terminated2Result._tag).toBe("Left");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update dynamically as agent health changes", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("dynamic-health-agent");

        // Initially should be healthy
        const initialHealth = yield* manager.getAgentHealth(
          "dynamic-health-agent"
        );
        expect(initialHealth.status).toBe("healthy");

        // Terminate the agent
        yield* manager.terminateAgent("dynamic-health-agent");

        // Should not be accessible after termination
        const afterTermination = yield* Effect.either(
          manager.getAgentHealth("dynamic-health-agent")
        );
        expect(afterTermination._tag).toBe("Left");

        // Restart the agent
        yield* manager.restartAgent("dynamic-health-agent");

        // Should be healthy again
        const afterRestart = yield* manager.getAgentHealth(
          "dynamic-health-agent"
        );
        expect(afterRestart.status).toBe("healthy");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  // Note: enableHealthMonitoring and disableHealthMonitoring methods don't exist in the actual AgentManager API
  // These tests have been removed to match the actual implementation

  describe("Agent Statistics", () => {
    test("should get agent statistics", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("stats-agent-1");
        yield* manager.initializeAgent("stats-agent-2");

        // Get agent statistics
        const stats = yield* manager.getAgentStats();

        expect(stats.totalAgents).toBeGreaterThanOrEqual(2);
        expect(stats.activeAgents).toBeGreaterThanOrEqual(2);
        expect(stats.healthyAgents).toBeGreaterThanOrEqual(0);
        expect(stats.unhealthyAgents).toBeGreaterThanOrEqual(0);
        expect(stats.totalMessages).toBeGreaterThanOrEqual(0);
        expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Agent Metrics", () => {
    test("should get agent metrics", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("metrics-agent");

        // Get agent metrics
        const metrics = yield* manager.getAgentMetrics("metrics-agent");

        expect(metrics.messageCount).toBeGreaterThanOrEqual(0);
        expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
        expect(metrics.lastActivity).toBeInstanceOf(Date);
        expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when getting metrics for non-existent agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Try to get metrics for non-existent agent
        const result = yield* Effect.either(
          manager.getAgentMetrics("non-existent-agent")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});

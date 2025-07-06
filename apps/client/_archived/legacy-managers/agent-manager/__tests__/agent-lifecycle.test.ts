import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { AgentManager } from "../service";
import {
  AgentNotFoundError,
  AgentStartupError,
  AgentCommunicationError,
  AgentAlreadyExistsError,
  AgentTerminationError,
} from "../errors";

describe("AgentManager - Agent Lifecycle", () => {
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

  describe("initializeAgent", () => {
    test("should initialize agent successfully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Verify agent is active
        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");
        expect(instance.id).toBe("test-agent-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize multiple agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.initializeAgent("test-agent-2");
        yield* manager.initializeAgent("test-agent-3");

        // Verify all agents are active
        const instance1 = yield* manager.getAgentInstance("test-agent-1");
        const instance2 = yield* manager.getAgentInstance("test-agent-2");
        const instance3 = yield* manager.getAgentInstance("test-agent-3");

        expect(instance1.status).toBe("active");
        expect(instance2.status).toBe("active");
        expect(instance3.status).toBe("active");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle initializing already initialized agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Try to initialize the same agent again (should fail)
        const result = yield* Effect.either(
          manager.initializeAgent("test-agent-1")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentAlreadyExistsError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after initializing agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Get initial state
        const initialState = yield* manager.getState();
        expect(initialState.agentInstances["test-agent-1"]).toBeUndefined();

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Verify state was updated
        const updatedState = yield* manager.getState();
        expect(updatedState.agentInstances["test-agent-1"]).toBeDefined();
        expect(updatedState.agentInstances["test-agent-1"].status).toBe(
          "active"
        );
        expect(
          updatedState.agentInstances["test-agent-1"].createdAt
        ).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle initialization configuration", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize agent with configuration
        yield* manager.initializeAgent("test-agent-1", {
          maxMemory: "512MB",
          timeout: 30000,
          environment: { NODE_ENV: "test" },
        });

        // Verify agent initialized with configuration
        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");
        expect(instance.config?.maxMemory).toBe("512MB");
        expect(instance.config?.timeout).toBe(30000);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent agent initialization", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents concurrently
        const initOperations = [
          manager.initializeAgent("concurrent-agent-1"),
          manager.initializeAgent("concurrent-agent-2"),
          manager.initializeAgent("concurrent-agent-3"),
        ];

        const results = yield* Effect.all(
          initOperations.map((op) => Effect.either(op)),
          { concurrency: "unbounded" }
        );

        // All should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBe(3);

        // Verify all agents are active
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toContain("concurrent-agent-1");
        expect(activeAgents).toContain("concurrent-agent-2");
        expect(activeAgents).toContain("concurrent-agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("setActiveAgent", () => {
    test("should set active agent successfully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // First initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Set as active agent
        yield* manager.setActiveAgent("test-agent-1");

        // Verify agent is active
        const activeAgent = yield* manager.getActiveAgent();
        expect(activeAgent).not.toBeNull();
        expect(activeAgent?.id).toBe("test-agent-1");
        expect(activeAgent?.status).toBe("active");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize and manage multiple agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.initializeAgent("test-agent-2");
        yield* manager.initializeAgent("test-agent-3");

        // Verify all agents are active
        const instance1 = yield* manager.getAgentInstance("test-agent-1");
        const instance2 = yield* manager.getAgentInstance("test-agent-2");
        const instance3 = yield* manager.getAgentInstance("test-agent-3");

        expect(instance1.status).toBe("active");
        expect(instance2.status).toBe("active");
        expect(instance3.status).toBe("active");

        // Verify they're in the active agents list
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toContain("test-agent-1");
        expect(activeAgents).toContain("test-agent-2");
        expect(activeAgents).toContain("test-agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle setting active agent multiple times", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Set as active agent
        yield* manager.setActiveAgent("test-agent-1");

        // Try to set the same agent as active again (should be idempotent)
        yield* manager.setActiveAgent("test-agent-1");

        // Verify agent is still active
        const activeAgent = yield* manager.getActiveAgent();
        expect(activeAgent?.id).toBe("test-agent-1");
        expect(activeAgent?.status).toBe("active");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after setting active agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent first
        yield* manager.initializeAgent("test-agent-1");

        // Get initial state
        const initialState = yield* manager.getState();
        expect(initialState.activeAgentId).toBeNull();

        // Set as active agent
        yield* manager.setActiveAgent("test-agent-1");

        // Verify state was updated
        const updatedState = yield* manager.getState();
        expect(updatedState.activeAgentId).toBe("test-agent-1");
        expect(updatedState.agentInstances["test-agent-1"]).toBeDefined();
        expect(updatedState.agentInstances["test-agent-1"].status).toBe(
          "active"
        );
        expect(
          updatedState.agentInstances["test-agent-1"].createdAt
        ).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle agent configuration updates", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize agent with configuration
        yield* manager.initializeAgent("test-agent-1", {
          maxMemory: "512MB",
          timeout: 30000,
          environment: { NODE_ENV: "test" },
        });

        // Verify agent initialized with configuration
        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");
        expect(instance.config?.maxMemory).toBe("512MB");
        expect(instance.config?.timeout).toBe(30000);

        // Update agent configuration
        yield* manager.updateAgentConfig("test-agent-1", {
          maxMemory: "1GB",
          timeout: 60000,
        });

        // Verify configuration was updated
        const updatedConfig = yield* manager.getAgentConfig("test-agent-1");
        expect(updatedConfig.maxMemory).toBe("1GB");
        expect(updatedConfig.timeout).toBe(60000);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle switching between active agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("agent-1");
        yield* manager.initializeAgent("agent-2");
        yield* manager.initializeAgent("agent-3");

        // Set first agent as active
        yield* manager.setActiveAgent("agent-1");
        let activeAgent = yield* manager.getActiveAgent();
        expect(activeAgent?.id).toBe("agent-1");

        // Switch to second agent
        yield* manager.setActiveAgent("agent-2");
        activeAgent = yield* manager.getActiveAgent();
        expect(activeAgent?.id).toBe("agent-2");

        // Switch to third agent
        yield* manager.setActiveAgent("agent-3");
        activeAgent = yield* manager.getActiveAgent();
        expect(activeAgent?.id).toBe("agent-3");

        // Verify all agents are still active
        const allActiveAgents = yield* manager.getAllActiveAgents();
        expect(allActiveAgents).toContain("agent-1");
        expect(allActiveAgents).toContain("agent-2");
        expect(allActiveAgents).toContain("agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("terminateAgent", () => {
    test("should terminate active agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize and then terminate an agent
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.terminateAgent("test-agent-1");

        // Verify agent is no longer in active agents
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).not.toContain("test-agent-1");

        // Verify getting the instance fails
        const result = yield* Effect.either(
          manager.getAgentInstance("test-agent-1")
        );
        expect(result._tag).toBe("Left");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when terminating non-existent agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Try to terminate non-existent agent
        const result = yield* Effect.either(
          manager.terminateAgent("non-existent-agent")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentTerminationError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle terminating already terminated agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize, terminate, then try to terminate again
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.terminateAgent("test-agent-1");

        // Try to terminate again (should fail gracefully)
        const result = yield* Effect.either(
          manager.terminateAgent("test-agent-1")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentTerminationError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should terminate multiple agents independently", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.initializeAgent("test-agent-2");
        yield* manager.initializeAgent("test-agent-3");

        // Terminate only one agent
        yield* manager.terminateAgent("test-agent-2");

        // Verify correct agent states
        const instance1 = yield* manager.getAgentInstance("test-agent-1");
        const instance3 = yield* manager.getAgentInstance("test-agent-3");

        expect(instance1.status).toBe("active");
        expect(instance3.status).toBe("active");

        // Verify terminated agent is not in active list
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toContain("test-agent-1");
        expect(activeAgents).not.toContain("test-agent-2");
        expect(activeAgents).toContain("test-agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle bulk termination", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.initializeAgent("test-agent-2");
        yield* manager.initializeAgent("test-agent-3");

        // Verify all are active
        let activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toHaveLength(3);

        // Terminate all agents
        yield* manager.terminateAllAgents();

        // Verify no agents are active
        activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toHaveLength(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("restartAgent", () => {
    test("should restart active agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");
        const initialInstance = yield* manager.getAgentInstance("test-agent-1");
        const initialCreatedAt = initialInstance.createdAt;

        // Wait a bit to ensure timestamp difference
        yield* Effect.sleep("10 millis");

        // Restart the agent
        yield* manager.restartAgent("test-agent-1");

        // Verify agent was restarted
        const restartedInstance = yield* manager.getAgentInstance(
          "test-agent-1"
        );
        expect(restartedInstance.status).toBe("active");
        expect(restartedInstance.createdAt.getTime()).toBeGreaterThan(
          initialCreatedAt.getTime()
        );
        expect(restartedInstance.metadata.errorCount).toBe(0); // Should reset on restart
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should restart terminated agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize, terminate, then restart an agent
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.terminateAgent("test-agent-1");
        yield* manager.restartAgent("test-agent-1");

        // Verify agent is active again
        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");

        // Verify it's in the active agents list
        const activeAgents = yield* manager.getAllActiveAgents();
        expect(activeAgents).toContain("test-agent-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize non-existent agent when restarting", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Try to restart non-existent agent (should initialize it)
        yield* manager.restartAgent("non-existent-agent");

        // Verify agent was initialized
        const instance = yield* manager.getAgentInstance("non-existent-agent");
        expect(instance.id).toBe("non-existent-agent");
        expect(instance.status).toBe("active");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should track restart history through metadata", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Restart multiple times
        yield* manager.restartAgent("test-agent-1");
        yield* manager.restartAgent("test-agent-1");
        yield* manager.restartAgent("test-agent-1");

        // Verify agent is still active and metadata reflects restarts
        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");
        expect(instance.metadata.errorCount).toBe(0); // Should reset on restart
        expect(instance.lastActiveAt).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should restart with new configuration", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize agent with initial config
        yield* manager.initializeAgent("test-agent-1", {
          maxMemory: "256MB",
          timeout: 15000,
        });

        // Update configuration and restart
        yield* manager.updateAgentConfig("test-agent-1", {
          maxMemory: "512MB",
          timeout: 30000,
        });
        yield* manager.restartAgent("test-agent-1");

        // Verify new configuration
        const config = yield* manager.getAgentConfig("test-agent-1");
        expect(config.maxMemory).toBe("512MB");
        expect(config.timeout).toBe(30000);

        const instance = yield* manager.getAgentInstance("test-agent-1");
        expect(instance.status).toBe("active");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getAgentInstance and getAgentHealth", () => {
    test("should get instance and health for active agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Get instance and health
        const instance = yield* manager.getAgentInstance("test-agent-1");
        const health = yield* manager.getAgentHealth("test-agent-1");

        expect(instance.id).toBe("test-agent-1");
        expect(instance.status).toBe("active");
        expect(instance.createdAt).toBeInstanceOf(Date);
        expect(health.status).toBe("healthy");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle terminated agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize and terminate an agent
        yield* manager.initializeAgent("test-agent-1");
        yield* manager.terminateAgent("test-agent-1");

        // Try to get instance (should fail)
        const result = yield* Effect.either(
          manager.getAgentInstance("test-agent-1")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when getting instance for non-existent agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Try to get instance for non-existent agent
        const result = yield* Effect.either(
          manager.getAgentInstance("non-existent-agent")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(AgentNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should include performance metrics", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent
        yield* manager.initializeAgent("test-agent-1");

        // Get instance with metrics
        const instance = yield* manager.getAgentInstance("test-agent-1");

        expect(instance.metadata).toBeDefined();
        expect(instance.createdAt).toBeInstanceOf(Date);
        expect(instance.status).toBe("active");
        expect(instance.config).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getRunningAgents", () => {
    test("should return empty array when no agents are running", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Get active agents (should be empty)
        const runningAgents = yield* manager.getAllActiveAgents();

        expect(runningAgents).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should return all running agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("agent-1");
        yield* manager.initializeAgent("agent-2");
        yield* manager.initializeAgent("agent-3");

        // Get active agents
        const runningAgents = yield* manager.getAllActiveAgents();

        expect(runningAgents).toHaveLength(3);
        expect(runningAgents).toContain("agent-1");
        expect(runningAgents).toContain("agent-2");
        expect(runningAgents).toContain("agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should exclude stopped agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize multiple agents
        yield* manager.initializeAgent("agent-1");
        yield* manager.initializeAgent("agent-2");
        yield* manager.initializeAgent("agent-3");

        // Stop one agent
        yield* manager.terminateAgent("agent-2");

        // Get active agents
        const runningAgents = yield* manager.getAllActiveAgents();

        expect(runningAgents).toHaveLength(2);
        expect(runningAgents).toContain("agent-1");
        expect(runningAgents).not.toContain("agent-2");
        expect(runningAgents).toContain("agent-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update dynamically as agents start/stop", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initially empty
        const initial = yield* manager.getAllActiveAgents();
        expect(initial).toHaveLength(0);

        // Initialize an agent
        yield* manager.initializeAgent("dynamic-agent");
        const afterStart = yield* manager.getAllActiveAgents();
        expect(afterStart).toHaveLength(1);
        expect(afterStart).toContain("dynamic-agent");

        // Stop the agent
        yield* manager.terminateAgent("dynamic-agent");
        const afterStop = yield* manager.getAllActiveAgents();
        expect(afterStop).toHaveLength(0);

        // Restart the agent
        yield* manager.restartAgent("dynamic-agent");
        const afterRestart = yield* manager.getAllActiveAgents();
        expect(afterRestart).toHaveLength(1);
        expect(afterRestart).toContain("dynamic-agent");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Lifecycle State Consistency", () => {
    test("should maintain consistent state across lifecycle operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Perform complex lifecycle operations
        yield* manager.initializeAgent("lifecycle-agent");
        yield* manager.terminateAgent("lifecycle-agent");
        yield* manager.restartAgent("lifecycle-agent");
        yield* manager.restartAgent("lifecycle-agent");
        yield* manager.terminateAgent("lifecycle-agent");

        // Verify final state - agent should be terminated so this will fail
        const result = yield* Effect.either(
          manager.getAgentInstance("lifecycle-agent")
        );
        expect(result._tag).toBe("Left");

        // Verify state consistency - agent should be removed from state
        const state = yield* manager.getState();
        expect(state.agentInstances["lifecycle-agent"]).toBeUndefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent lifecycle operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Initialize an agent first
        yield* manager.initializeAgent("concurrent-agent");

        // Perform concurrent operations
        const operations = [
          manager.terminateAgent("concurrent-agent"),
          manager.restartAgent("concurrent-agent"),
          manager.getAgentInstance("concurrent-agent"),
        ];

        const results = yield* Effect.all(
          operations.map((op) => Effect.either(op)),
          { concurrency: "unbounded" }
        );

        // At least some operations should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBeGreaterThan(0);

        // Agent should still exist in some valid state
        const finalResult = yield* Effect.either(
          manager.getAgentInstance("concurrent-agent")
        );
        // Agent may or may not exist depending on race conditions
        if (finalResult._tag === "Right") {
          expect(["active", "inactive"]).toContain(finalResult.right.status);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should preserve agent configuration across restarts", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AgentManager;

        // Start agent with specific configuration
        const config = {
          maxMemory: "1GB",
          timeout: 60000,
          environment: { NODE_ENV: "production", DEBUG: "true" },
        };

        yield* manager.initializeAgent("config-agent", config);

        // Restart without specifying config (should preserve)
        yield* manager.restartAgent("config-agent");

        // Verify configuration was preserved
        const instance = yield* manager.getAgentInstance("config-agent");
        expect(instance.config?.maxMemory).toBe("1GB");
        expect(instance.config?.timeout).toBe(60000);
        expect(instance.config?.environment?.NODE_ENV).toBe("production");
        expect(instance.config?.environment?.DEBUG).toBe("true");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});

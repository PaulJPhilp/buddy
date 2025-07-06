import { Effect, Ref } from "effect";
// import { AgentService } from "../agent"; // Node.js only (FileSystem dependency)
import { AgentRegistryService } from "../../services/agent-registry";
import type { AgentManagerApi } from "./api";
import {
  AgentAlreadyExistsError,
  AgentCommunicationError,
  AgentConfigurationError,
  AgentHealthCheckError,
  AgentInitializationError,
  AgentManagerOperationError,
  AgentNotFoundError,
  AgentRegistryError,
  AgentTerminationError,
  NoActiveAgentError,
} from "./errors";
import type {
  AgentInstance,
  AgentInstanceMetadata,
  AgentManagerConfig,
  AgentManagerState,
  AgentManagerStats,
} from "./types";
import { AGENT_MANAGER_CONSTANTS } from "./types";
import { AppService } from "../../services/app";

export class AgentManager extends Effect.Service<AgentManagerApi>()(
  "AgentManager",
  {
    scoped: Effect.gen(function* () {
      // Initialize refs for state management
      const stateRef = yield* Ref.make<AgentManagerState>({
        activeAgentId: null,
        agentInstances: {},
        availableAgents: {},
        isLoading: false,
        lastError: null,
        stats: {
          totalAgents: 0,
          activeAgents: 0,
          healthyAgents: 0,
          unhealthyAgents: 0,
          totalMessages: 0,
          totalResponseTime: 0,
          averageResponseTime: 0,
          errorCount: 0,
          uptime: 0,
          lastUpdated: new Date(),
        },
        config: {
          maxActiveAgents: AGENT_MANAGER_CONSTANTS.DEFAULT_MAX_ACTIVE_AGENTS,
          healthCheckInterval:
            AGENT_MANAGER_CONSTANTS.DEFAULT_HEALTH_CHECK_INTERVAL,
          agentTimeout: AGENT_MANAGER_CONSTANTS.DEFAULT_AGENT_TIMEOUT,
          enableAutoRestart:
            AGENT_MANAGER_CONSTANTS.DEFAULT_ENABLE_AUTO_RESTART,
          defaultAgentConfig: {},
          enableMetrics: AGENT_MANAGER_CONSTANTS.DEFAULT_ENABLE_METRICS,
        },
        listeners: new Set(),
      });

      const listenersRef = yield* Ref.make<
        Set<(state: AgentManagerState) => void>
      >(new Set());

      // Helper functions
      const notifyListeners = (state: AgentManagerState) =>
        Effect.gen(function* () {
          const listeners = yield* Ref.get(listenersRef);
          yield* Effect.forEach(Array.from(listeners), (listener) =>
            Effect.sync(() => listener(state))
          );
        });

      const updateState = (
        updater: (state: AgentManagerState) => AgentManagerState
      ) =>
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, updater);
          yield* notifyListeners(newState);
          return newState;
        });

      const createAgentInstance = (
        agentId: string,
        config: any
      ): AgentInstance => ({
        id: agentId,
        config,
        service: {} as any, // Will be initialized properly
        status: "initializing" as const,
        health: "unknown" as const,
        metadata: {
          messageCount: 0,
          totalResponseTime: 0,
          averageResponseTime: 0,
          errorCount: 0,
          uptime: 0,
        },
        createdAt: new Date(),
        lastActiveAt: new Date(),
        lastHealthCheck: new Date(),
      });

      const calculateStats = (
        instances: Record<string, AgentInstance>
      ): AgentManagerStats => {
        const instanceArray = Object.values(instances);
        const totalMessages = instanceArray.reduce(
          (sum, instance) => sum + instance.metadata.messageCount,
          0
        );
        const totalResponseTime = instanceArray.reduce(
          (sum, instance) => sum + instance.metadata.totalResponseTime,
          0
        );

        return {
          totalAgents: instanceArray.length,
          activeAgents: instanceArray.filter((i) => i.status === "active")
            .length,
          healthyAgents: instanceArray.filter((i) => i.health === "healthy")
            .length,
          unhealthyAgents: instanceArray.filter((i) => i.health === "unhealthy")
            .length,
          totalMessages,
          totalResponseTime,
          averageResponseTime:
            totalMessages > 0 ? totalResponseTime / totalMessages : 0,
          errorCount: instanceArray.reduce(
            (sum, instance) => sum + instance.metadata.errorCount,
            0
          ),
          uptime:
            instanceArray.length > 0
              ? Date.now() -
                Math.min(...instanceArray.map((i) => i.createdAt.getTime()))
              : 0,
          lastUpdated: new Date(),
        };
      };

      // Agent instance management
      const initializeAgent = (agentId: string, config?: any) =>
        Ref.modify(stateRef, (state) => {
          if (state.agentInstances[agentId]) {
            return [
              Effect.fail(
                new AgentAlreadyExistsError({
                  agentId,
                  message: `Agent ${agentId} is already initialized`,
                })
              ),
              state,
            ];
          }
          const finalConfig = {
            ...state.config.defaultAgentConfig,
            ...config,
            id: agentId,
          };
          const instance = createAgentInstance(agentId, finalConfig);
          const newAgentInstances = {
            ...state.agentInstances,
            [agentId]: { ...instance, status: "active", health: "healthy" },
          };
          const newState = {
            ...state,
            agentInstances: newAgentInstances,
            stats: calculateStats(newAgentInstances),
          };
          return [Effect.succeed(undefined), newState];
        }).pipe(
          Effect.flatten,
          Effect.catchAll((cause) => {
            if (cause instanceof AgentAlreadyExistsError) {
              return Effect.fail(cause);
            }
            return Effect.fail(
              new AgentInitializationError({
                agentId,
                message: `Failed to initialize agent ${agentId}`,
                cause,
              })
            );
          })
        );

      const getAgentInstance = (agentId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const instance = state.agentInstances[agentId];

          if (!instance) {
            return yield* Effect.fail(
              new AgentNotFoundError({
                agentId,
                message: `Agent instance not found: ${agentId}`,
              })
            );
          }

          return instance;
        });

      const getAllActiveAgents = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return Object.keys(state.agentInstances).filter(
            (id) => state.agentInstances[id].status === "active"
          );
        });

      const terminateAgent = (agentId: string) =>
        Ref.modify(stateRef, (state) => {
          const instance = state.agentInstances[agentId];
          if (!instance) {
            return [
              Effect.fail(
                new AgentNotFoundError({
                  agentId,
                  message: `Agent not found: ${agentId}`,
                })
              ),
              state,
            ];
          }
          const { [agentId]: removed, ...remainingInstances } =
            state.agentInstances;
          const newState = {
            ...state,
            agentInstances: remainingInstances,
            activeAgentId:
              state.activeAgentId === agentId ? null : state.activeAgentId,
            stats: calculateStats(remainingInstances),
          };
          return [Effect.succeed(undefined), newState];
        }).pipe(
          Effect.flatten,
          Effect.catchAll((cause) =>
            Effect.fail(
              new AgentTerminationError({
                agentId,
                message: `Failed to terminate agent ${agentId}`,
                cause,
              })
            )
          )
        );

      const restartAgent = (agentId: string) =>
        Effect.gen(function* () {
          // Atomically remove and re-add the agent
          const state = yield* Ref.get(stateRef);
          const oldInstance = state.agentInstances[agentId];
          if (oldInstance) {
            yield* terminateAgent(agentId);
            yield* initializeAgent(agentId, oldInstance.config);
          } else {
            yield* initializeAgent(agentId);
          }
        });

      // Agent configuration management
      const updateAgentConfig = (agentId: string, config: any) =>
        Ref.modify(stateRef, (state) => {
          const instance = state.agentInstances[agentId];
          if (!instance) {
            return [
              Effect.fail(
                new AgentNotFoundError({
                  agentId,
                  message: `Agent instance not found: ${agentId}`,
                })
              ),
              state,
            ];
          }
          const updatedConfig = { ...instance.config, ...config };
          const newAgentInstances = {
            ...state.agentInstances,
            [agentId]: { ...instance, config: updatedConfig },
          };
          const newState = {
            ...state,
            agentInstances: newAgentInstances,
          };
          return [Effect.succeed(undefined), newState];
        }).pipe(
          Effect.flatten,
          Effect.catchAll((cause) =>
            Effect.fail(
              new AgentConfigurationError({
                agentId,
                message: `Failed to update agent configuration for ${agentId}`,
                cause,
              })
            )
          )
        );

      const getAgentConfig = (agentId: string) =>
        Effect.gen(function* () {
          const instance = yield* getAgentInstance(agentId);
          return instance.config;
        });

      const setActiveAgent = (agentId: string) =>
        Ref.modify(stateRef, (state) => {
          if (!state.agentInstances[agentId]) {
            return [
              Effect.fail(
                new AgentNotFoundError({
                  agentId,
                  message: `Agent instance not found: ${agentId}`,
                })
              ),
              state,
            ];
          }
          const newState = { ...state, activeAgentId: agentId };
          return [Effect.succeed(undefined), newState];
        }).pipe(Effect.flatten);

      const getActiveAgent = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.activeAgentId) {
            return null;
          }
          return yield* getAgentInstance(state.activeAgentId);
        });

      // Agent discovery and registry
      const discoverAvailableAgents = () =>
        Effect.gen(function* () {
          const agentRegistry = yield* AgentRegistryService;
          const agents = yield* agentRegistry.getAllAgents();

          yield* updateState((s) => ({
            ...s,
            availableAgents: agents.reduce((acc, agent) => {
              acc[agent.id] = {
                id: agent.id,
                initialAgentName: agent.name || agent.id,
              };
              return acc;
            }, {}),
          }));

          return agents.map((agent) => ({
            id: agent.id,
            initialAgentName: agent.name || agent.id,
          }));
        }).pipe(
          Effect.catchAll((cause) =>
            Effect.fail(
              new AgentRegistryError({
                message: "Failed to discover available agents",
                cause,
              })
            )
          )
        );

      const registerAgent = (config: any) =>
        Effect.gen(function* () {
          yield* updateState((s) => ({
            ...s,
            availableAgents: {
              ...s.availableAgents,
              [config.id]: config,
            },
          }));
        });

      const unregisterAgent = (agentId: string) =>
        Effect.gen(function* () {
          yield* updateState((s) => {
            const { [agentId]: removed, ...remaining } = s.availableAgents;
            return { ...s, availableAgents: remaining };
          });
        });

      // Health monitoring
      const getAgentHealth = (agentId: string) =>
        Effect.gen(function* () {
          const instance = yield* getAgentInstance(agentId);
          return {
            status: instance.health,
            lastSeen: instance.lastHealthCheck,
          };
        });

      const performHealthCheck = (agentId?: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const agentsToCheck = agentId
            ? [agentId]
            : Object.keys(state.agentInstances);

          yield* Effect.forEach(agentsToCheck, (id) =>
            Effect.gen(function* () {
              const instance = state.agentInstances[id];
              if (!instance) return;

              // Simulate health check
              const isHealthy = instance.status === "active";

              yield* updateState((s) => ({
                ...s,
                agentInstances: {
                  ...s.agentInstances,
                  [id]: {
                    ...instance,
                    health: isHealthy ? "healthy" : "unhealthy",
                    lastHealthCheck: new Date(),
                  },
                },
              }));
            }).pipe(
              Effect.catchAll((cause) =>
                Effect.fail(
                  new AgentHealthCheckError({
                    agentId: id,
                    message: `Health check failed for agent ${id}`,
                    cause,
                  })
                )
              )
            )
          );
        });

      // Bulk operations
      const initializeAllAgents = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const availableAgentIds = Object.keys(state.availableAgents);

          yield* Effect.forEach(availableAgentIds, (agentId) =>
            initializeAgent(agentId, state.availableAgents[agentId])
          );
        });

      const terminateAllAgents = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const activeAgentIds = Object.keys(state.agentInstances);

          yield* Effect.forEach(activeAgentIds, terminateAgent);
        });

      const refreshAgentRegistry = () =>
        discoverAvailableAgents().pipe(Effect.asVoid);

      // State management
      const getState = () => Ref.get(stateRef);

      const subscribe = (listener: (state: AgentManagerState) => void) =>
        Effect.gen(function* () {
          yield* Ref.update(
            listenersRef,
            (listeners) => new Set([...listeners, listener])
          );

          // Immediately notify the new listener with the current state
          const state = yield* Ref.get(stateRef);
          listener(state);

          const unsubscribe = () =>
            Effect.gen(function* () {
              yield* Ref.update(listenersRef, (listeners) => {
                const newListeners = new Set(listeners);
                newListeners.delete(listener);
                return newListeners;
              });
            });

          return unsubscribe;
        });

      // Agent communication
      const sendToAgent = (
        agentId: string,
        message: string,
        metadata?: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
          const instance = yield* getAgentInstance(agentId);

          // Update message count
          yield* updateState((s) => ({
            ...s,
            agentInstances: {
              ...s.agentInstances,
              [agentId]: {
                ...instance,
                metadata: {
                  ...instance.metadata,
                  messageCount: instance.metadata.messageCount + 1,
                },
                lastActiveAt: new Date(),
              },
            },
          }));
        }).pipe(
          Effect.catchAll((cause) =>
            Effect.fail(
              new AgentCommunicationError({
                agentId,
                message: `Failed to send message to agent ${agentId}`,
                cause,
              })
            )
          )
        );

      const sendToActiveAgent = (
        message: string,
        metadata?: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.activeAgentId) {
            return yield* Effect.fail(
              new NoActiveAgentError({
                message: "No active agent to send message to",
                operation: "sendToActiveAgent",
              })
            );
          }

          yield* sendToAgent(state.activeAgentId, message, metadata);
        });

      const broadcastToAllAgents = (
        message: string,
        metadata?: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
          const activeAgents = yield* getAllActiveAgents();
          yield* Effect.forEach(activeAgents, (agentId) =>
            sendToAgent(agentId, message, metadata)
          );
        });

      // Agent switching and management
      const switchToAgent = (
        fromAgentId: string,
        toAgentId: string,
        transferContext?: boolean
      ) =>
        Effect.gen(function* () {
          yield* getAgentInstance(fromAgentId); // Ensure from agent exists
          yield* getAgentInstance(toAgentId); // Ensure to agent exists

          yield* setActiveAgent(toAgentId);
        });

      const cloneAgent = (
        sourceAgentId: string,
        newAgentId: string,
        configOverrides?: any
      ) =>
        Effect.gen(function* () {
          const sourceInstance = yield* getAgentInstance(sourceAgentId);
          const newConfig = {
            ...sourceInstance.config,
            ...configOverrides,
            id: newAgentId,
          };

          yield* initializeAgent(newAgentId, newConfig);
          return yield* getAgentInstance(newAgentId);
        });

      // Statistics and monitoring
      const getAgentStats = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.stats;
        });

      const getAgentMetrics = (agentId: string) =>
        Effect.gen(function* () {
          const instance = yield* getAgentInstance(agentId);
          return {
            messageCount: instance.metadata.messageCount,
            averageResponseTime: instance.metadata.averageResponseTime,
            lastActivity: instance.lastActiveAt,
            uptime: Date.now() - instance.createdAt.getTime(),
          };
        });

      return {
        initializeAgent,
        getAgentInstance,
        getAllActiveAgents,
        terminateAgent,
        restartAgent,
        updateAgentConfig,
        getAgentConfig,
        setActiveAgent,
        getActiveAgent,
        discoverAvailableAgents,
        registerAgent,
        unregisterAgent,
        getAgentHealth,
        performHealthCheck,
        initializeAllAgents,
        terminateAllAgents,
        refreshAgentRegistry,
        getState,
        subscribe,
        sendToAgent,
        sendToActiveAgent,
        broadcastToAllAgents,
        switchToAgent,
        cloneAgent,
        getAgentStats,
        getAgentMetrics,
      } satisfies AgentManagerApi;
    }),
    dependencies: [AgentRegistryService.Default], // Removed AgentService.Default (Node.js only)
  }
) {}

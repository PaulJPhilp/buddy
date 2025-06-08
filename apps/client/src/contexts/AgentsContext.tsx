"use client";
import { Effect, Layer } from "effect";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AgentConfig } from "../schemas/AgentConfigSchema";

// Context value interface
export interface AgentsContextValue {
  agents: AgentConfig[];
  loading: boolean;
  error: Error | null;
  createAgent: (agent: AgentConfig) => Promise<void>;
  updateAgent: (id: string, patch: Partial<AgentConfig>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  getAgentById: (id: string) => AgentConfig | undefined;
}

const AgentsContext = createContext<AgentsContextValue | undefined>(undefined);

export const AgentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper to run Effect.js effects and unwrap Promise
  const runEffect = useCallback(async <T,>(effect: Effect.Effect<T>) => {
    try {
      // @ts-ignore: Effect.runPromise is the canonical way to run an Effect
      return await Effect.runPromise(effect);
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceLayer = Layer.succeed(AgentService, {
        getAll: () => Effect.succeed([]),
        getById: () => Effect.succeed(undefined),
        create: () => Effect.succeed(undefined),
        update: () => Effect.succeed(undefined),
        delete: () => Effect.succeed(undefined),
      });

      const program = Effect.gen(function* () {
        const service = yield* AgentService;
        return yield* service.getAll();
      });

      const result = (await Effect.runPromise(
        Effect.provide(serviceLayer)(program),
      )) as readonly AgentConfig[];
      setAgents([...result]);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const createAgent = useCallback(
    async (agent: AgentConfig) => {
      setLoading(true);
      setError(null);
      try {
        await Effect.runPromise(
          Effect.flatMap(AgentService, (s) => s.create(agent)).pipe(
            Effect.provide(AgentService.Default),
          ),
        );
        await loadAgents();
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [runEffect, loadAgents],
  );

  const updateAgent = useCallback(
    async (id: string, patch: Partial<AgentConfig>) => {
      setLoading(true);
      setError(null);
      try {
        await Effect.runPromise(
          Effect.flatMap(AgentService, (s) => s.update(id, patch)).pipe(
            Effect.provide(AgentService.Default),
          ),
        );
        await loadAgents();
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [runEffect, loadAgents],
  );

  const deleteAgent = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await Effect.runPromise(
          Effect.flatMap(AgentService, (s) => s.delete(id)).pipe(
            Effect.provide(AgentService.Default),
          ),
        );
        await loadAgents();
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [runEffect, loadAgents],
  );

  const refreshAgents = loadAgents;

  const getAgentById = useCallback(
    (id: string) => agents.find((agent) => agent.id === id),
    [agents],
  );

  const value: AgentsContextValue = {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    refreshAgents,
    getAgentById,
  };

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
};

export function useAgents(): AgentsContextValue {
  const ctx = useContext(AgentsContext);
  if (!ctx) {
    throw new Error("useAgents must be used within an AgentsProvider");
  }
  return ctx;
}

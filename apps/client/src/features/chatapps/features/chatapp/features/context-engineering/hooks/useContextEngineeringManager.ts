import { useEffectContext } from "@/components/EffectProvider";
import { ContextEngineeringManager } from "../managers";
import type { ContextEngineeringManagerApi } from "../managers/api";
import type {
  ContextElement,
  ContextEngineeringManagerState,
  ContextEngineeringManagerStats,
  FinalContext,
} from "../managers/types";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";

export interface UseContextEngineeringManagerReturn {
  // State
  state: ContextEngineeringManagerState | null;
  stats: ContextEngineeringManagerStats | null;
  isLoading: boolean;
  error: string | null;

  // Pre-prompt actions
  prePromptElements: readonly ContextElement[];
  addPrePromptElement: (
    element: ContextElement,
    index?: number
  ) => Promise<void>;
  updatePrePromptElement: (
    elementId: string,
    updates: Partial<ContextElement>
  ) => Promise<void>;
  removePrePromptElement: (elementId: string) => Promise<void>;
  reorderPrePromptElements: (elementIds: readonly string[]) => Promise<void>;

  // Post-prompt actions
  postPromptElements: readonly ContextElement[];
  addPostPromptElement: (
    element: ContextElement,
    index?: number
  ) => Promise<void>;
  updatePostPromptElement: (
    elementId: string,
    updates: Partial<ContextElement>
  ) => Promise<void>;
  removePostPromptElement: (elementId: string) => Promise<void>;
  reorderPostPromptElements: (elementIds: readonly string[]) => Promise<void>;

  // Context assembly
  getFinalContext: (
    userPrompt: string,
    userAttachedFiles: readonly string[]
  ) => Promise<FinalContext | null>;

  // Element queries
  getElementById: (elementId: string) => Promise<ContextElement | null>;
  getElementsByName: (name: string) => Promise<readonly ContextElement[]>;
  getElementsByType: (
    type: "NamedPrompt" | "NamedFile"
  ) => Promise<readonly ContextElement[]>;

  // Utility actions
  clear: () => Promise<void>;
  exportData: () => Promise<string | null>;
  importData: (data: string) => Promise<void>;

  // Initialization
  initialize: (chatAppId: string) => Promise<void>;
  isInitialized: boolean;
}

export function useContextEngineeringManager(): UseContextEngineeringManagerReturn {
  const { runWithServices } = useEffectContext();

  // Local state
  const [state, setState] = useState<ContextEngineeringManagerState | null>(
    null
  );
  const [stats, setStats] = useState<ContextEngineeringManagerStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to run service operations
  const runServiceOperation = useCallback(
    async <T>(
      operation: (
        manager: ContextEngineeringManagerApi
      ) => Effect.Effect<T, any, never>,
      operationName: string
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await runWithServices(
          Effect.gen(function* () {
            const manager = yield* ContextEngineeringManager;
            return yield* operation(manager);
          })
        );
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`${operationName} failed:`, err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [runWithServices]
  );

  // Load state and stats
  const loadStateAndStats = useCallback(async () => {
    await runServiceOperation(
      (manager) =>
        Effect.gen(function* () {
          const [currentState, currentStats] = yield* Effect.all([
            manager.getState(),
            manager.getStats(),
          ]);
          setState(currentState);
          setStats(currentStats);
        }),
      "loadStateAndStats"
    );
  }, [runServiceOperation]);

  // Initialize manager
  const initialize = useCallback(
    async (chatAppId: string) => {
      await runServiceOperation(
        (manager) =>
          manager.initialize({
            chatAppId,
            autoSave: true,
            maxElementsPerSection: 50,
            enableReordering: true,
          }),
        "initialize"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  // Pre-prompt element actions
  const addPrePromptElement = useCallback(
    async (element: ContextElement, index?: number) => {
      await runServiceOperation(
        (manager) => manager.addPrePromptElement(element, index),
        "addPrePromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const updatePrePromptElement = useCallback(
    async (elementId: string, updates: Partial<ContextElement>) => {
      await runServiceOperation(
        (manager) => manager.updatePrePromptElement(elementId, updates),
        "updatePrePromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const removePrePromptElement = useCallback(
    async (elementId: string) => {
      await runServiceOperation(
        (manager) => manager.removePrePromptElement(elementId),
        "removePrePromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const reorderPrePromptElements = useCallback(
    async (elementIds: readonly string[]) => {
      await runServiceOperation(
        (manager) => manager.reorderPrePromptElements(elementIds),
        "reorderPrePromptElements"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  // Post-prompt element actions
  const addPostPromptElement = useCallback(
    async (element: ContextElement, index?: number) => {
      await runServiceOperation(
        (manager) => manager.addPostPromptElement(element, index),
        "addPostPromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const updatePostPromptElement = useCallback(
    async (elementId: string, updates: Partial<ContextElement>) => {
      await runServiceOperation(
        (manager) => manager.updatePostPromptElement(elementId, updates),
        "updatePostPromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const removePostPromptElement = useCallback(
    async (elementId: string) => {
      await runServiceOperation(
        (manager) => manager.removePostPromptElement(elementId),
        "removePostPromptElement"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  const reorderPostPromptElements = useCallback(
    async (elementIds: readonly string[]) => {
      await runServiceOperation(
        (manager) => manager.reorderPostPromptElements(elementIds),
        "reorderPostPromptElements"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  // Context assembly
  const getFinalContext = useCallback(
    async (userPrompt: string, userAttachedFiles: readonly string[]) => {
      return await runServiceOperation(
        (manager) => manager.getFinalContext(userPrompt, userAttachedFiles),
        "getFinalContext"
      );
    },
    [runServiceOperation]
  );

  // Element queries
  const getElementById = useCallback(
    async (elementId: string) => {
      return await runServiceOperation(
        (manager) => manager.getElementById(elementId),
        "getElementById"
      );
    },
    [runServiceOperation]
  );

  const getElementsByName = useCallback(
    async (name: string) => {
      return (
        (await runServiceOperation(
          (manager) => manager.getElementsByName(name),
          "getElementsByName"
        )) || []
      );
    },
    [runServiceOperation]
  );

  const getElementsByType = useCallback(
    async (type: "NamedPrompt" | "NamedFile") => {
      return (
        (await runServiceOperation(
          (manager) => manager.getElementsByType(type),
          "getElementsByType"
        )) || []
      );
    },
    [runServiceOperation]
  );

  // Utility actions
  const clear = useCallback(async () => {
    await runServiceOperation((manager) => manager.clear(), "clear");
    await loadStateAndStats();
  }, [runServiceOperation, loadStateAndStats]);

  const exportData = useCallback(async () => {
    return await runServiceOperation(
      (manager) => manager.export(),
      "exportData"
    );
  }, [runServiceOperation]);

  const importData = useCallback(
    async (data: string) => {
      await runServiceOperation(
        (manager) => manager.import(data),
        "importData"
      );
      await loadStateAndStats();
    },
    [runServiceOperation, loadStateAndStats]
  );

  // Set up subscription for state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const manager = yield* ContextEngineeringManager;
            unsubscribe = yield* manager.subscribe((newState) => {
              setState(newState);
              // Also update stats when state changes
              runWithServices(
                Effect.gen(function* () {
                  const currentStats = yield* manager.getStats();
                  setStats(currentStats);
                })
              ).catch(console.error);
            });
          })
        );
      } catch (err) {
        console.error(
          "Failed to setup ContextEngineeringManager subscription:",
          err
        );
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [runWithServices]);

  // Load initial state
  useEffect(() => {
    loadStateAndStats();
  }, [loadStateAndStats]);

  return {
    // State
    state,
    stats,
    isLoading,
    error,

    // Pre-prompt actions
    prePromptElements: state?.prePromptElements || [],
    addPrePromptElement,
    updatePrePromptElement,
    removePrePromptElement,
    reorderPrePromptElements,

    // Post-prompt actions
    postPromptElements: state?.postPromptElements || [],
    addPostPromptElement,
    updatePostPromptElement,
    removePostPromptElement,
    reorderPostPromptElements,

    // Context assembly
    getFinalContext,

    // Element queries
    getElementById,
    getElementsByName,
    getElementsByType,

    // Utility actions
    clear,
    exportData,
    importData,

    // Initialization
    initialize,
    isInitialized: state?.isInitialized || false,
  };
}

"use client";

import { ToolbarConfig, isCommand } from "@/components/toolbar/types";
import { useCallback, useEffect, useState } from "react";

const createEmptyConfig = (): ToolbarConfig => ({
  id: "empty",
  name: "Empty",
  version: "1.0.0",
  commands: [],
});

export interface DynamicToolbarState {
  config: ToolbarConfig;
  isLoading: boolean;
  error: string | null;
}

export interface DynamicToolbarActions {
  loadConfig: (configId: string) => Promise<void>;
  executeCommand: (commandId: string) => Promise<void>;
  clearError: () => void;
}

export interface UseDynamicToolbarResult {
  state: DynamicToolbarState;
  actions: DynamicToolbarActions;
}

/**
 * React hook for managing a dynamic toolbar configuration and actions.
 *
 * - Loads and manages toolbar configuration state.
 * - Provides actions to load configs, execute commands, and clear errors.
 * - Returns the current toolbar state and action methods.
 *
 * @param initialConfig Optional initial ToolbarConfig to use.
 * @returns An object with state (config, isLoading, error) and actions (loadConfig, executeCommand, clearError).
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All state updates are performed atomically via setState.
 *   - React's rules of hooks are followed for safe resource management.
 */

export function useDynamicToolbar(
  initialConfig?: ToolbarConfig,
): UseDynamicToolbarResult {
  const [state, setState] = useState<DynamicToolbarState>({
    config: initialConfig || createEmptyConfig(),
    isLoading: !initialConfig,
    error: null,
  });

  useEffect(() => {
    if (initialConfig) {
      setState((prev) => ({
        ...prev,
        config: initialConfig,
        isLoading: false,
      }));
    }
  }, [initialConfig]);

  const loadConfig = useCallback(async (configId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const mockConfig: ToolbarConfig = {
        id: configId,
        name: `Config ${configId}`,
        version: "1.0.0",
        commands: [
          {
            id: "test-command",
            type: "button",
            label: "Test Command",
            icon: "play",
            action: {
              type: "function",
              handler: async () => console.log("Test command executed"),
            },
          },
        ],
      };
      setState((prev) => ({ ...prev, config: mockConfig, isLoading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load config",
        isLoading: false,
      }));
    }
  }, []);

  const executeCommand = useCallback(
    async (commandId: string) => {
      const command = state.config.commands.find((cmd) => cmd.id === commandId);
      if (!command) {
        throw new Error(`Command not found: ${commandId}`);
      }
      if (isCommand(command) && command.action.type === "function") {
        await command.action.handler();
      }
    },
    [state.config],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    actions: {
      loadConfig,
      executeCommand,
      clearError,
    },
  };
}

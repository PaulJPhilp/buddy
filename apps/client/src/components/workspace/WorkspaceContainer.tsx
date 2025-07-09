"use client";

import { useEffectContext } from "@/components/EffectProvider";
import {
  CreateWorkspace,
  DeleteWorkspace,
  UpdateWorkspace,
  WorkspaceManager,
} from "@/managers/workspace";
import type { Workspace } from "@/managers/workspace";
import { Effect, Fiber, Layer, Ref, Schedule, Stream } from "effect";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface WorkspaceContainerProps {
  children?: React.ReactNode;
  onStateChange?: (state: readonly Workspace[]) => void;
}

// --- React Context ---
interface WorkspaceContextValue {
  workspaces: readonly Workspace[];
  isInitialized: boolean;
  error: string | null;
  dispatch: (
    command: CreateWorkspace | UpdateWorkspace | DeleteWorkspace,
  ) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function WorkspaceContainer({
  children,
  onStateChange,
}: WorkspaceContainerProps) {
  const { runWithServices } = useEffectContext();
  const [workspaces, setWorkspaces] = useState<readonly Workspace[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useCallback(
    async (command: CreateWorkspace | UpdateWorkspace | DeleteWorkspace) => {
      const effect = Effect.gen(function* () {
        const manager = yield* WorkspaceManager;
        yield* manager.dispatch(command);
      });
      await runWithServices(effect);
    },
    [runWithServices],
  );

  useEffect(() => {
    const initializeAndSubscribe = Effect.gen(function* () {
      const manager = yield* WorkspaceManager;

      // Initial fetch
      const initialWorkspaces = yield* Ref.get(manager.workspaces);
      setWorkspaces(initialWorkspaces);
      setIsInitialized(true);
      if (onStateChange) onStateChange(initialWorkspaces);

      // Subscribe to changes via polling
      const workspaceStream = Stream.repeat(
        Ref.get(manager.workspaces),
        Schedule.spaced("1 second"),
      );

      const fiber = yield* Stream.runForEach(workspaceStream, (newWorkspaces) =>
        Effect.sync(() => {
          const typedWorkspaces = newWorkspaces as readonly Workspace[];
          setWorkspaces(typedWorkspaces);
          if (onStateChange) {
            onStateChange(typedWorkspaces);
          }
        }),
      ).pipe(Effect.fork);

      return fiber;
    });

    const execution = runWithServices(initializeAndSubscribe);
    let fiber: Fiber.Fiber<void, void> | undefined;

    execution
      .then((f) => {
        fiber = f;
      })
      .catch((e) => {
        console.error("Failed to initialize workspace container:", e);
        setError("Failed to initialize workspaces.");
      });

    return () => {
      if (fiber) {
        Effect.runFork(Fiber.interrupt(fiber));
      }
    };
  }, [runWithServices, onStateChange]);

  const contextValue: WorkspaceContextValue = {
    workspaces,
    isInitialized,
    error,
    dispatch,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContainer() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContainer must be used within a WorkspaceContainer",
    );
  }
  return context;
}

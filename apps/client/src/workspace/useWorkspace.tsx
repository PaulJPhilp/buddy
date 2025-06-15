import { useSelector } from "@xstate/store/react";
import React, { createContext, useContext } from "react";
import { UIEvent, UIState } from "./types";
import { createWorkspaceStore, workspaceStore } from "./workspaceStore";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WorkspaceContext = createContext(workspaceStore);

export interface WorkspaceProviderProps {
  readonly children: React.ReactNode;
  /**
   * Optional initial state – makes it easier to seed in tests or stories.
   */
  readonly initialState?: UIState;
}

export function WorkspaceProvider({
  children,
  initialState,
}: WorkspaceProviderProps) {
  // If an initialState is provided we spin up a fresh store; otherwise use the singleton.
  const store = initialState
    ? createWorkspaceStore(initialState)
    : workspaceStore;

  return (
    <WorkspaceContext.Provider value={store}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Access a slice of the workspace UI state using a selector function.
 * The component will re-render whenever the selected slice changes.
 */
export function useWorkspaceSelector<T>(selector: (state: UIState) => T): T {
  const store = useContext(WorkspaceContext);
  return useSelector(store, (snapshot) => selector(snapshot.context));
}

/**
 * Returns the send function to dispatch UIEvents to the workspace actor.
 */
export function useWorkspaceDispatch(): (event: UIEvent) => void {
  const store = useContext(WorkspaceContext);
  return store.send;
}

/**
 * Convenience hook that returns `[state, send]` similar to `useActor`.
 */
export function useWorkspace(): [UIState, (event: UIEvent) => void] {
  const store = useContext(WorkspaceContext);
  const state = useSelector(store, (snapshot) => snapshot.context);
  return [state, store.send];
}

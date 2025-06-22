"use client";

import type { Store } from "@xstate/store";
import { useSyncExternalStore } from "react";

/**
 * Creates a set of SSR-safe hooks for an XState store.
 * @param store The XState store instance.
 * @param initialContext The stable, initial context of the store.
 * @returns An object containing `useSelector` and `useDispatch` hooks.
 */
export function createStoreHooks<TContext, TEvent extends { type: string }>(
  store: Store<TContext, TEvent>,
  initialContext: TContext,
) {
  /**
   * A hook for selecting a slice of state from the store's context.
   * This is safe for server-side rendering.
   */
  function useSelector<T>(selector: (state: TContext) => T): T {
    const state = useSyncExternalStore(
      (callback) => {
        const subscription = store.subscribe(callback);
        return () => {
          if (typeof subscription === "function") {
            subscription();
          } else if (
            subscription &&
            typeof subscription.unsubscribe === "function"
          ) {
            subscription.unsubscribe();
          }
        };
      },
      () => store.getSnapshot().context,
      () => initialContext,
    );
    return selector(state);
  }

  /**
   * A hook for getting the store's dispatch function.
   * Returns an object with the send method.
   */
  function useDispatch(): { send: (event: TEvent) => void } {
    return { send: store.send };
  }

  return { useSelector, useDispatch };
}

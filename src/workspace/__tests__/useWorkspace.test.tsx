import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { UIState } from "../types";
import {
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceDispatch,
  useWorkspaceSelector,
} from "../useWorkspace";

describe("Workspace Hooks", () => {
  const createWrapper = (initialState?: UIState) => {
    return ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider initialState={initialState}>
        {children}
      </WorkspaceProvider>
    );
  };

  const defaultInitialState: UIState = {
    activeTabId: null,
    tabs: {},
    chatApps: {},
  };

  const populatedInitialState: UIState = {
    activeTabId: "tab-1",
    tabs: {
      "tab-1": { id: "tab-1", name: "First Tab", color: "#ff0000" },
      "tab-2": { id: "tab-2", name: "Second Tab" },
    },
    chatApps: {
      "app-1": { id: "app-1", tabId: "tab-1", status: "compact" },
      "app-2": { id: "app-2", tabId: "tab-1", status: "expanded" },
      "app-3": { id: "app-3", tabId: "tab-2", status: "stashed" },
    },
  };

  describe("useWorkspaceSelector", () => {
    describe("Basic Selectors", () => {
      it("should select activeTabId", () => {
        const { result } = renderHook(
          () => useWorkspaceSelector((state) => state.activeTabId),
          { wrapper: createWrapper(defaultInitialState) },
        );

        expect(result.current).toBe(null);
      });

      it("should select tabs object", () => {
        const { result } = renderHook(
          () => useWorkspaceSelector((state) => state.tabs),
          { wrapper: createWrapper(populatedInitialState) },
        );

        expect(Object.keys(result.current)).toHaveLength(2);
        expect(result.current["tab-1"]).toEqual({
          id: "tab-1",
          name: "First Tab",
          color: "#ff0000",
        });
      });

      it("should select specific tab", () => {
        const { result } = renderHook(
          () => useWorkspaceSelector((state) => state.tabs["tab-1"]),
          { wrapper: createWrapper(populatedInitialState) },
        );

        expect(result.current).toEqual({
          id: "tab-1",
          name: "First Tab",
          color: "#ff0000",
        });
      });

      it("should select tab count", () => {
        const { result } = renderHook(
          () => useWorkspaceSelector((state) => Object.keys(state.tabs).length),
          { wrapper: createWrapper(populatedInitialState) },
        );

        expect(result.current).toBe(2);
      });

      it("should select chat app count", () => {
        const { result } = renderHook(
          () =>
            useWorkspaceSelector((state) => Object.keys(state.chatApps).length),
          { wrapper: createWrapper(populatedInitialState) },
        );

        expect(result.current).toBe(3);
      });
    });

    describe("Reactivity", () => {
      it("should update when state changes", () => {
        const wrapper = createWrapper(defaultInitialState);
        const { result } = renderHook(
          () => {
            const activeTabId = useWorkspaceSelector(
              (state) => state.activeTabId,
            );
            const dispatch = useWorkspaceDispatch();
            return { activeTabId, dispatch };
          },
          { wrapper },
        );

        expect(result.current.activeTabId).toBe(null);

        act(() => {
          result.current.dispatch({
            type: "TAB_ADDED",
            tabId: "new-tab",
            name: "New Tab",
          });
        });

        expect(result.current.activeTabId).toBe("new-tab");
      });

      it("should handle multiple rapid changes", () => {
        const wrapper = createWrapper(defaultInitialState);
        const { result } = renderHook(
          () => {
            const tabCount = useWorkspaceSelector(
              (state) => Object.keys(state.tabs).length,
            );
            const dispatch = useWorkspaceDispatch();
            return { tabCount, dispatch };
          },
          { wrapper },
        );

        expect(result.current.tabCount).toBe(0);

        act(() => {
          result.current.dispatch({
            type: "TAB_ADDED",
            tabId: "tab-1",
            name: "Tab 1",
          });
          result.current.dispatch({
            type: "TAB_ADDED",
            tabId: "tab-2",
            name: "Tab 2",
          });
        });

        expect(result.current.tabCount).toBe(2);
      });
    });

    describe("Edge Cases", () => {
      it("should handle undefined selections", () => {
        const { result } = renderHook(
          () => useWorkspaceSelector((state) => state.tabs.nonexistent),
          { wrapper: createWrapper(defaultInitialState) },
        );

        expect(result.current).toBeUndefined();
      });

      it("should handle empty state", () => {
        const { result } = renderHook(
          () =>
            useWorkspaceSelector(
              (state) => Object.keys(state.tabs).length === 0,
            ),
          { wrapper: createWrapper(defaultInitialState) },
        );

        expect(result.current).toBe(true);
      });
    });
  });

  describe("useWorkspaceDispatch", () => {
    describe("Basic Functionality", () => {
      it("should return dispatch function", () => {
        const { result } = renderHook(() => useWorkspaceDispatch(), {
          wrapper: createWrapper(defaultInitialState),
        });

        expect(typeof result.current).toBe("function");
      });
    });

    describe("Tab Operations", () => {
      it("should add tabs", () => {
        const wrapper = createWrapper(defaultInitialState);
        const { result } = renderHook(
          () => {
            const state = useWorkspaceSelector((state) => state);
            const dispatch = useWorkspaceDispatch();
            return { state, dispatch };
          },
          { wrapper },
        );

        expect(Object.keys(result.current.state.tabs)).toHaveLength(0);

        act(() => {
          result.current.dispatch({
            type: "TAB_ADDED",
            tabId: "test-tab",
            name: "Test Tab",
            color: "#00ff00",
          });
        });

        expect(Object.keys(result.current.state.tabs)).toHaveLength(1);
        expect(result.current.state.activeTabId).toBe("test-tab");
      });

      it("should update tabs", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const tab = useWorkspaceSelector((state) => state.tabs["tab-1"]);
            const dispatch = useWorkspaceDispatch();
            return { tab, dispatch };
          },
          { wrapper },
        );

        expect(result.current.tab.name).toBe("First Tab");

        act(() => {
          result.current.dispatch({
            type: "TAB_UPDATED",
            tabId: "tab-1",
            name: "Updated Tab",
          });
        });

        expect(result.current.tab.name).toBe("Updated Tab");
      });

      it("should activate tabs", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const activeTabId = useWorkspaceSelector(
              (state) => state.activeTabId,
            );
            const dispatch = useWorkspaceDispatch();
            return { activeTabId, dispatch };
          },
          { wrapper },
        );

        expect(result.current.activeTabId).toBe("tab-1");

        act(() => {
          result.current.dispatch({
            type: "TAB_ACTIVATED",
            tabId: "tab-2",
          });
        });

        expect(result.current.activeTabId).toBe("tab-2");
      });

      it("should close tabs", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const tabCount = useWorkspaceSelector(
              (state) => Object.keys(state.tabs).length,
            );
            const activeTabId = useWorkspaceSelector(
              (state) => state.activeTabId,
            );
            const dispatch = useWorkspaceDispatch();
            return { tabCount, activeTabId, dispatch };
          },
          { wrapper },
        );

        expect(result.current.tabCount).toBe(2);
        expect(result.current.activeTabId).toBe("tab-1");

        act(() => {
          result.current.dispatch({
            type: "TAB_CLOSED",
            tabId: "tab-1",
          });
        });

        expect(result.current.tabCount).toBe(1);
        expect(result.current.activeTabId).toBe("tab-2");
      });
    });

    describe("Chat App Operations", () => {
      it("should add chat apps", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const appCount = useWorkspaceSelector(
              (state) => Object.keys(state.chatApps).length,
            );
            const dispatch = useWorkspaceDispatch();
            return { appCount, dispatch };
          },
          { wrapper },
        );

        expect(result.current.appCount).toBe(3);

        act(() => {
          result.current.dispatch({
            type: "CHAT_APP_ADDED",
            tabId: "tab-1",
            appId: "new-app",
          });
        });

        expect(result.current.appCount).toBe(4);
      });

      it("should expand chat apps", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const app1 = useWorkspaceSelector(
              (state) => state.chatApps["app-1"],
            );
            const app2 = useWorkspaceSelector(
              (state) => state.chatApps["app-2"],
            );
            const dispatch = useWorkspaceDispatch();
            return { app1, app2, dispatch };
          },
          { wrapper },
        );

        expect(result.current.app1.status).toBe("compact");
        expect(result.current.app2.status).toBe("expanded");

        act(() => {
          result.current.dispatch({
            type: "CHAT_APP_EXPANDED",
            tabId: "tab-1",
            appId: "app-1",
          });
        });

        expect(result.current.app1.status).toBe("expanded");
        expect(result.current.app2.status).toBe("stashed");
      });

      it("should remove chat apps", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const appCount = useWorkspaceSelector(
              (state) => Object.keys(state.chatApps).length,
            );
            const dispatch = useWorkspaceDispatch();
            return { appCount, dispatch };
          },
          { wrapper },
        );

        expect(result.current.appCount).toBe(3);

        act(() => {
          result.current.dispatch({
            type: "CHAT_APP_REMOVED",
            tabId: "tab-1",
            appId: "app-1",
          });
        });

        expect(result.current.appCount).toBe(2);
      });
    });

    describe("State Management", () => {
      it("should reset state", () => {
        const wrapper = createWrapper(populatedInitialState);
        const { result } = renderHook(
          () => {
            const state = useWorkspaceSelector((state) => state);
            const dispatch = useWorkspaceDispatch();
            return { state, dispatch };
          },
          { wrapper },
        );

        expect(Object.keys(result.current.state.tabs)).toHaveLength(2);

        act(() => {
          result.current.dispatch({ type: "RESET" });
        });

        expect(result.current.state).toEqual({
          activeTabId: null,
          tabs: {},
          chatApps: {},
        });
      });

      it("should handle invalid operations gracefully", () => {
        const wrapper = createWrapper(defaultInitialState);
        const { result } = renderHook(
          () => {
            const state = useWorkspaceSelector((state) => state);
            const dispatch = useWorkspaceDispatch();
            return { state, dispatch };
          },
          { wrapper },
        );

        act(() => {
          result.current.dispatch({
            type: "TAB_ACTIVATED",
            tabId: "nonexistent",
          });
        });

        expect(result.current.state.activeTabId).toBe(null);
      });
    });
  });

  describe("useWorkspace", () => {
    describe("Hook Structure", () => {
      it("should return [state, dispatch] tuple", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        expect(Array.isArray(result.current)).toBe(true);
        expect(result.current).toHaveLength(2);
        expect(typeof result.current[0]).toBe("object");
        expect(typeof result.current[1]).toBe("function");
      });

      it("should provide complete state", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(populatedInitialState),
        });

        const [state] = result.current;
        expect(state).toHaveProperty("activeTabId");
        expect(state).toHaveProperty("tabs");
        expect(state).toHaveProperty("chatApps");
        expect(state.activeTabId).toBe("tab-1");
        expect(Object.keys(state.tabs)).toHaveLength(2);
        expect(Object.keys(state.chatApps)).toHaveLength(3);
      });
    });

    describe("Integrated Workflows", () => {
      it("should handle tab lifecycle", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        let [state, dispatch] = result.current;

        expect(state.activeTabId).toBe(null);

        act(() => {
          dispatch({
            type: "TAB_ADDED",
            tabId: "lifecycle-tab",
            name: "Lifecycle Tab",
          });
        });

        [state] = result.current;
        expect(state.activeTabId).toBe("lifecycle-tab");

        act(() => {
          dispatch({
            type: "TAB_UPDATED",
            tabId: "lifecycle-tab",
            name: "Updated Lifecycle Tab",
          });
        });

        [state] = result.current;
        expect(state.tabs["lifecycle-tab"].name).toBe("Updated Lifecycle Tab");

        act(() => {
          dispatch({
            type: "TAB_CLOSED",
            tabId: "lifecycle-tab",
          });
        });

        [state] = result.current;
        expect(state.activeTabId).toBe(null);
        expect(state.tabs["lifecycle-tab"]).toBeUndefined();
      });

      it("should handle chat app lifecycle", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        let [state, dispatch] = result.current;

        act(() => {
          dispatch({
            type: "TAB_ADDED",
            tabId: "app-tab",
            name: "App Tab",
          });
        });

        act(() => {
          dispatch({
            type: "CHAT_APP_ADDED",
            tabId: "app-tab",
            appId: "lifecycle-app-1",
          });
          dispatch({
            type: "CHAT_APP_ADDED",
            tabId: "app-tab",
            appId: "lifecycle-app-2",
          });
        });

        [state] = result.current;
        expect(Object.keys(state.chatApps)).toHaveLength(2);

        act(() => {
          dispatch({
            type: "CHAT_APP_EXPANDED",
            tabId: "app-tab",
            appId: "lifecycle-app-1",
          });
        });

        [state] = result.current;
        expect(state.chatApps["lifecycle-app-1"].status).toBe("expanded");
        expect(state.chatApps["lifecycle-app-2"].status).toBe("stashed");

        act(() => {
          dispatch({
            type: "CHAT_APP_REMOVED",
            tabId: "app-tab",
            appId: "lifecycle-app-1",
          });
        });

        [state] = result.current;
        expect(Object.keys(state.chatApps)).toHaveLength(1);
        expect(state.chatApps["lifecycle-app-1"]).toBeUndefined();
      });

      it("should handle multi-tab scenarios", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        let [state, dispatch] = result.current;

        act(() => {
          dispatch({
            type: "TAB_ADDED",
            tabId: "multi-tab-1",
            name: "Multi Tab 1",
          });
          dispatch({
            type: "TAB_ADDED",
            tabId: "multi-tab-2",
            name: "Multi Tab 2",
          });
        });

        [state] = result.current;
        expect(Object.keys(state.tabs)).toHaveLength(2);
        expect(state.activeTabId).toBe("multi-tab-2");

        act(() => {
          dispatch({
            type: "CHAT_APP_ADDED",
            tabId: "multi-tab-1",
            appId: "multi-app-1",
          });
          dispatch({
            type: "CHAT_APP_ADDED",
            tabId: "multi-tab-2",
            appId: "multi-app-2",
          });
        });

        [state] = result.current;
        expect(Object.keys(state.chatApps)).toHaveLength(2);

        act(() => {
          dispatch({
            type: "TAB_CLOSED",
            tabId: "multi-tab-2",
          });
        });

        [state] = result.current;
        expect(Object.keys(state.tabs)).toHaveLength(1);
        expect(Object.keys(state.chatApps)).toHaveLength(1);
        expect(state.activeTabId).toBe("multi-tab-1");
      });
    });

    describe("Performance", () => {
      it("should handle rapid operations", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        const [, dispatch] = result.current;

        act(() => {
          for (let i = 0; i < 10; i++) {
            dispatch({
              type: "TAB_ADDED",
              tabId: `perf-tab-${i}`,
              name: `Performance Tab ${i}`,
            });
          }
        });

        const [state] = result.current;
        expect(Object.keys(state.tabs)).toHaveLength(10);
        expect(state.activeTabId).toBe("perf-tab-9");
      });

      it("should handle large state efficiently", () => {
        const largeState: UIState = {
          activeTabId: "tab-0",
          tabs: Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [
              `tab-${i}`,
              { id: `tab-${i}`, name: `Tab ${i}` },
            ]),
          ),
          chatApps: Object.fromEntries(
            Array.from({ length: 40 }, (_, i) => [
              `app-${i}`,
              {
                id: `app-${i}`,
                tabId: `tab-${i % 20}`,
                status: "compact" as const,
              },
            ]),
          ),
        };

        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(largeState),
        });

        const [state, dispatch] = result.current;
        expect(Object.keys(state.tabs)).toHaveLength(20);
        expect(Object.keys(state.chatApps)).toHaveLength(40);

        act(() => {
          dispatch({
            type: "TAB_ACTIVATED",
            tabId: "tab-10",
          });
        });

        const [newState] = result.current;
        expect(newState.activeTabId).toBe("tab-10");
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid operations", () => {
        const { result } = renderHook(() => useWorkspace(), {
          wrapper: createWrapper(defaultInitialState),
        });

        let [state, dispatch] = result.current;

        act(() => {
          dispatch({
            type: "TAB_UPDATED",
            tabId: "nonexistent",
            name: "Should not work",
          });
          dispatch({
            type: "CHAT_APP_UPDATED",
            tabId: "nonexistent",
            appId: "nonexistent",
            status: "expanded",
          });
        });

        [state] = result.current;
        expect(state).toEqual(defaultInitialState);
      });
    });
  });
});

import { beforeEach, describe, expect, test } from "vitest";
import type {
  ChatAppEntry,
  ChatAppStatus,
  TabEntry,
  UIEvent,
  UIState,
} from "../types";

// Extract core logic for testing without React dependencies
interface WorkspaceStoreLogic {
  readonly getState: () => UIState;
  readonly send: (event: UIEvent) => void;
  readonly subscribe: (callback: (state: UIState) => void) => () => void;
}

// Mock store implementation for testing
function createMockWorkspaceStore(initialState?: UIState): WorkspaceStoreLogic {
  let state: UIState = initialState ?? {
    activeTabId: null,
    tabs: {},
    chatApps: {},
  };

  const subscribers = new Set<(state: UIState) => void>();

  const handlers = {
    RESET: (): UIState => ({
      activeTabId: null,
      tabs: {},
      chatApps: {},
    }),

    TAB_ADDED: (
      context: UIState,
      event: Extract<UIEvent, { type: "TAB_ADDED" }>,
    ): UIState => {
      if (context.tabs[event.tabId]) return context;

      return {
        ...context,
        tabs: {
          ...context.tabs,
          [event.tabId]: {
            id: event.tabId,
            name: event.name,
            color: event.color,
          },
        },
        activeTabId: event.tabId,
      };
    },

    TAB_ACTIVATED: (
      context: UIState,
      event: Extract<UIEvent, { type: "TAB_ACTIVATED" }>,
    ): UIState => {
      if (!context.tabs[event.tabId] || context.activeTabId === event.tabId) {
        return context;
      }
      return {
        ...context,
        activeTabId: event.tabId,
      };
    },

    CHAT_APP_ADDED: (
      context: UIState,
      event: Extract<UIEvent, { type: "CHAT_APP_ADDED" }>,
    ): UIState => {
      if (!context.tabs[event.tabId] || context.chatApps[event.appId]) {
        return context;
      }

      return {
        ...context,
        chatApps: {
          ...context.chatApps,
          [event.appId]: {
            id: event.appId,
            tabId: event.tabId,
            status: "compact" as ChatAppStatus,
          },
        },
      };
    },

    CHAT_APP_EXPANDED: (
      context: UIState,
      event: Extract<UIEvent, { type: "CHAT_APP_EXPANDED" }>,
    ): UIState => {
      const target = context.chatApps[event.appId];
      if (!target || target.tabId !== event.tabId) return context;

      const updatedApps: Record<string, ChatAppEntry> = { ...context.chatApps };

      for (const [id, app] of Object.entries(updatedApps)) {
        if (app.tabId !== event.tabId) continue;
        if (id === event.appId) {
          updatedApps[id] = { ...app, status: "expanded" };
        } else if (app.status !== "closed") {
          updatedApps[id] = { ...app, status: "stashed" };
        }
      }

      return { ...context, chatApps: updatedApps };
    },
  };

  const send = (event: UIEvent) => {
    const handler = handlers[event.type as keyof typeof handlers];
    if (handler) {
      const newState = (handler as any)(state, event);
      if (newState !== state) {
        state = newState;
        for (const callback of subscribers) {
          callback(state);
        }
      }
    }
  };

  const getState = () => state;

  const subscribe = (callback: (state: UIState) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  return {
    getState,
    send,
    subscribe,
  };
}

// Extract selector logic for testing
function createWorkspaceSelectorLogic() {
  const selectActiveTab = (state: UIState): TabEntry | null => {
    if (!state.activeTabId) return null;
    return state.tabs[state.activeTabId] ?? null;
  };

  const selectTabById =
    (tabId: string) =>
    (state: UIState): TabEntry | null => {
      return state.tabs[tabId] ?? null;
    };

  const selectAllTabs = (state: UIState): TabEntry[] => {
    return Object.values(state.tabs);
  };

  const selectChatAppsByTab =
    (tabId: string) =>
    (state: UIState): ChatAppEntry[] => {
      return Object.values(state.chatApps).filter((app) => app.tabId === tabId);
    };

  const selectExpandedChatApp =
    (tabId: string) =>
    (state: UIState): ChatAppEntry | null => {
      return (
        Object.values(state.chatApps).find(
          (app) => app.tabId === tabId && app.status === "expanded",
        ) ?? null
      );
    };

  const selectCompactChatApps =
    (tabId: string) =>
    (state: UIState): ChatAppEntry[] => {
      return Object.values(state.chatApps).filter(
        (app) => app.tabId === tabId && app.status === "compact",
      );
    };

  const selectStashedChatApps =
    (tabId: string) =>
    (state: UIState): ChatAppEntry[] => {
      return Object.values(state.chatApps).filter(
        (app) => app.tabId === tabId && app.status === "stashed",
      );
    };

  const selectTabCount = (state: UIState): number => {
    return Object.keys(state.tabs).length;
  };

  const selectChatAppCount =
    (tabId: string) =>
    (state: UIState): number => {
      return Object.values(state.chatApps).filter((app) => app.tabId === tabId)
        .length;
    };

  const selectHasActiveTab = (state: UIState): boolean => {
    return state.activeTabId !== null && !!state.tabs[state.activeTabId];
  };

  return {
    selectActiveTab,
    selectTabById,
    selectAllTabs,
    selectChatAppsByTab,
    selectExpandedChatApp,
    selectCompactChatApps,
    selectStashedChatApps,
    selectTabCount,
    selectChatAppCount,
    selectHasActiveTab,
  };
}

// Extract dispatch logic for testing
function createWorkspaceDispatchLogic() {
  const createTabAddedEvent = (
    tabId: string,
    name: string,
    color?: string,
  ): UIEvent => ({
    type: "TAB_ADDED",
    tabId,
    name,
    color,
  });

  const createTabActivatedEvent = (tabId: string): UIEvent => ({
    type: "TAB_ACTIVATED",
    tabId,
  });

  const createChatAppAddedEvent = (tabId: string, appId: string): UIEvent => ({
    type: "CHAT_APP_ADDED",
    tabId,
    appId,
  });

  const createChatAppExpandedEvent = (
    tabId: string,
    appId: string,
  ): UIEvent => ({
    type: "CHAT_APP_EXPANDED",
    tabId,
    appId,
  });

  const createResetEvent = (): UIEvent => ({
    type: "RESET",
  });

  const validateTabEvent = (
    event: Extract<UIEvent, { type: "TAB_ADDED" | "TAB_ACTIVATED" }>,
  ): boolean => {
    return typeof event.tabId === "string" && event.tabId.length > 0;
  };

  const validateChatAppEvent = (
    event: Extract<UIEvent, { type: "CHAT_APP_ADDED" | "CHAT_APP_EXPANDED" }>,
  ): boolean => {
    return (
      typeof event.tabId === "string" &&
      typeof event.appId === "string" &&
      event.tabId.length > 0 &&
      event.appId.length > 0
    );
  };

  return {
    createTabAddedEvent,
    createTabActivatedEvent,
    createChatAppAddedEvent,
    createChatAppExpandedEvent,
    createResetEvent,
    validateTabEvent,
    validateChatAppEvent,
  };
}

describe("useWorkspace Core Logic", () => {
  let store: WorkspaceStoreLogic;
  let selectors: ReturnType<typeof createWorkspaceSelectorLogic>;
  let dispatchers: ReturnType<typeof createWorkspaceDispatchLogic>;

  beforeEach(() => {
    store = createMockWorkspaceStore();
    selectors = createWorkspaceSelectorLogic();
    dispatchers = createWorkspaceDispatchLogic();
  });

  describe("Selector Logic", () => {
    test("selectActiveTab returns null when no active tab", () => {
      const state = store.getState();
      const activeTab = selectors.selectActiveTab(state);

      expect(activeTab).toBeNull();
    });

    test("selectActiveTab returns correct tab when active", () => {
      const addTabEvent = dispatchers.createTabAddedEvent(
        "tab1",
        "My Tab",
        "#ff0000",
      );
      store.send(addTabEvent);

      const state = store.getState();
      const activeTab = selectors.selectActiveTab(state);

      expect(activeTab).toEqual({
        id: "tab1",
        name: "My Tab",
        color: "#ff0000",
      });
    });

    test("selectTabById returns specific tab", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createTabAddedEvent("tab2", "Tab 2"));

      const state = store.getState();
      const tab1 = selectors.selectTabById("tab1")(state);
      const tab2 = selectors.selectTabById("tab2")(state);

      expect(tab1?.name).toBe("Tab 1");
      expect(tab2?.name).toBe("Tab 2");
    });

    test("selectAllTabs returns all tabs", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createTabAddedEvent("tab2", "Tab 2"));

      const state = store.getState();
      const allTabs = selectors.selectAllTabs(state);

      expect(allTabs).toHaveLength(2);
      expect(allTabs.map((t) => t.name)).toEqual(["Tab 1", "Tab 2"]);
    });

    test("selectChatAppsByTab returns apps for specific tab", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app2"));

      const state = store.getState();
      const apps = selectors.selectChatAppsByTab("tab1")(state);

      expect(apps).toHaveLength(2);
      expect(apps.every((app) => app.tabId === "tab1")).toBe(true);
    });

    test("selectExpandedChatApp returns expanded app", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppExpandedEvent("tab1", "app1"));

      const state = store.getState();
      const expandedApp = selectors.selectExpandedChatApp("tab1")(state);

      expect(expandedApp?.id).toBe("app1");
      expect(expandedApp?.status).toBe("expanded");
    });

    test("selectCompactChatApps returns only compact apps", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app2"));
      store.send(dispatchers.createChatAppExpandedEvent("tab1", "app1"));

      const state = store.getState();
      const compactApps = selectors.selectCompactChatApps("tab1")(state);

      expect(compactApps).toHaveLength(0); // app2 should be stashed when app1 expanded
    });

    test("selectStashedChatApps returns only stashed apps", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app2"));
      store.send(dispatchers.createChatAppExpandedEvent("tab1", "app1"));

      const state = store.getState();
      const stashedApps = selectors.selectStashedChatApps("tab1")(state);

      expect(stashedApps).toHaveLength(1);
      expect(stashedApps[0].id).toBe("app2");
      expect(stashedApps[0].status).toBe("stashed");
    });

    test("selectTabCount returns correct count", () => {
      const initialState = store.getState();
      expect(selectors.selectTabCount(initialState)).toBe(0);

      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createTabAddedEvent("tab2", "Tab 2"));

      const updatedState = store.getState();
      expect(selectors.selectTabCount(updatedState)).toBe(2);
    });

    test("selectChatAppCount returns correct count for tab", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app2"));

      const state = store.getState();
      const count = selectors.selectChatAppCount("tab1")(state);

      expect(count).toBe(2);
    });

    test("selectHasActiveTab returns correct boolean", () => {
      const initialState = store.getState();
      expect(selectors.selectHasActiveTab(initialState)).toBe(false);

      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));

      const updatedState = store.getState();
      expect(selectors.selectHasActiveTab(updatedState)).toBe(true);
    });
  });

  describe("Dispatch Logic", () => {
    test("createTabAddedEvent creates correct event", () => {
      const event = dispatchers.createTabAddedEvent(
        "tab1",
        "My Tab",
        "#ff0000",
      );

      expect(event).toEqual({
        type: "TAB_ADDED",
        tabId: "tab1",
        name: "My Tab",
        color: "#ff0000",
      });
    });

    test("createTabActivatedEvent creates correct event", () => {
      const event = dispatchers.createTabActivatedEvent("tab1");

      expect(event).toEqual({
        type: "TAB_ACTIVATED",
        tabId: "tab1",
      });
    });

    test("createChatAppAddedEvent creates correct event", () => {
      const event = dispatchers.createChatAppAddedEvent("tab1", "app1");

      expect(event).toEqual({
        type: "CHAT_APP_ADDED",
        tabId: "tab1",
        appId: "app1",
      });
    });

    test("createChatAppExpandedEvent creates correct event", () => {
      const event = dispatchers.createChatAppExpandedEvent("tab1", "app1");

      expect(event).toEqual({
        type: "CHAT_APP_EXPANDED",
        tabId: "tab1",
        appId: "app1",
      });
    });

    test("createResetEvent creates correct event", () => {
      const event = dispatchers.createResetEvent();

      expect(event).toEqual({
        type: "RESET",
      });
    });

    test("validateTabEvent validates tab events correctly", () => {
      const validEvent = dispatchers.createTabAddedEvent("tab1", "Tab 1");
      const invalidEvent = { ...validEvent, tabId: "" };

      expect(dispatchers.validateTabEvent(validEvent)).toBe(true);
      expect(dispatchers.validateTabEvent(invalidEvent as any)).toBe(false);
    });

    test("validateChatAppEvent validates chat app events correctly", () => {
      const validEvent = dispatchers.createChatAppAddedEvent("tab1", "app1");
      const invalidEvent1 = { ...validEvent, tabId: "" };
      const invalidEvent2 = { ...validEvent, appId: "" };

      expect(dispatchers.validateChatAppEvent(validEvent)).toBe(true);
      expect(dispatchers.validateChatAppEvent(invalidEvent1 as any)).toBe(
        false,
      );
      expect(dispatchers.validateChatAppEvent(invalidEvent2 as any)).toBe(
        false,
      );
    });
  });

  describe("Store Integration", () => {
    test("store state updates correctly on events", () => {
      const initialState = store.getState();
      expect(initialState.activeTabId).toBeNull();

      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));

      const updatedState = store.getState();
      expect(updatedState.activeTabId).toBe("tab1");
      expect(updatedState.tabs.tab1.name).toBe("Tab 1");
    });

    test("store subscription works correctly", () => {
      let callCount = 0;
      let lastState: UIState | null = null;

      const unsubscribe = store.subscribe((state) => {
        callCount++;
        lastState = state;
      });

      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));

      expect(callCount).toBe(1);
      expect(lastState?.activeTabId).toBe("tab1");

      unsubscribe();

      store.send(dispatchers.createTabAddedEvent("tab2", "Tab 2"));

      expect(callCount).toBe(1); // Should not increment after unsubscribe
    });

    test("complex workflow with multiple operations", () => {
      // Add tabs
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createTabAddedEvent("tab2", "Tab 2"));

      // Add chat apps
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app1"));
      store.send(dispatchers.createChatAppAddedEvent("tab1", "app2"));

      // Expand app
      store.send(dispatchers.createChatAppExpandedEvent("tab1", "app1"));

      const state = store.getState();

      // Verify state
      expect(selectors.selectTabCount(state)).toBe(2);
      expect(selectors.selectChatAppCount("tab1")(state)).toBe(2);
      expect(selectors.selectExpandedChatApp("tab1")(state)?.id).toBe("app1");
      expect(selectors.selectStashedChatApps("tab1")(state)).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty state gracefully", () => {
      const state = store.getState();

      expect(selectors.selectActiveTab(state)).toBeNull();
      expect(selectors.selectAllTabs(state)).toEqual([]);
      expect(selectors.selectTabCount(state)).toBe(0);
      expect(selectors.selectHasActiveTab(state)).toBe(false);
    });

    test("handles invalid tab ID lookups", () => {
      const state = store.getState();

      expect(selectors.selectTabById("nonexistent")(state)).toBeNull();
      expect(selectors.selectChatAppsByTab("nonexistent")(state)).toEqual([]);
      expect(selectors.selectChatAppCount("nonexistent")(state)).toBe(0);
    });

    test("handles duplicate operations gracefully", () => {
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1"));
      store.send(dispatchers.createTabAddedEvent("tab1", "Tab 1 Duplicate"));

      const state = store.getState();
      expect(selectors.selectTabCount(state)).toBe(1);
      expect(selectors.selectTabById("tab1")(state)?.name).toBe("Tab 1");
    });

    test("handles operations on non-existent tabs", () => {
      store.send(dispatchers.createChatAppAddedEvent("nonexistent", "app1"));

      const state = store.getState();
      expect(Object.keys(state.chatApps)).toHaveLength(0);
    });
  });

  describe("Performance", () => {
    test("handles large number of tabs efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        store.send(dispatchers.createTabAddedEvent(`tab${i}`, `Tab ${i}`));
      }

      const state = store.getState();
      const tabCount = selectors.selectTabCount(state);
      const endTime = performance.now();

      expect(tabCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(150); // Should complete in < 150ms
    });

    test("selector performance with large state", () => {
      // Setup large state
      for (let i = 0; i < 100; i++) {
        store.send(dispatchers.createTabAddedEvent(`tab${i}`, `Tab ${i}`));
        for (let j = 0; j < 10; j++) {
          store.send(
            dispatchers.createChatAppAddedEvent(`tab${i}`, `app${i}-${j}`),
          );
        }
      }

      const state = store.getState();
      const startTime = performance.now();

      // Run multiple selector operations
      for (let i = 0; i < 100; i++) {
        selectors.selectChatAppsByTab(`tab${i}`)(state);
        selectors.selectChatAppCount(`tab${i}`)(state);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in < 50ms
    });
  });
});

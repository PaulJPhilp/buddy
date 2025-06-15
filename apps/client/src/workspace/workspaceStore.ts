import { createStore } from "@xstate/store";
import { ChatAppStatus, UIEvent, UIState } from "./types";

// ---------------------------------------------------------------------------
// Initial context
// ---------------------------------------------------------------------------

const initialContext: UIState = {
  activeTabId: null,
  tabs: {},
  chatApps: {},
};

// ---------------------------------------------------------------------------
// Event handlers (pure functions that return a NEW state)
// ---------------------------------------------------------------------------

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
    // Disallow duplicates – no-op if tab already exists
    if (context.tabs[event.tabId]) return context;

    const newTabs = {
      ...context.tabs,
      [event.tabId]: {
        id: event.tabId,
        name: event.name,
        color: event.color,
      },
    } as const;

    return {
      ...context,
      tabs: newTabs,
      activeTabId: event.tabId,
    };
  },

  TAB_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "TAB_UPDATED" }>,
  ): UIState => {
    const tab = context.tabs[event.tabId];
    if (!tab) return context;

    return {
      ...context,
      tabs: {
        ...context.tabs,
        [event.tabId]: {
          ...tab,
          name: event.name ?? tab.name,
          color: event.color ?? tab.color,
        },
      },
    };
  },

  TAB_ACTIVATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "TAB_ACTIVATED" }>,
  ): UIState => {
    if (!context.tabs[event.tabId]) return context; // invalid id, ignore
    if (context.activeTabId === event.tabId) return context;
    return {
      ...context,
      activeTabId: event.tabId,
    };
  },

  TAB_CLOSED: (
    context: UIState,
    event: Extract<UIEvent, { type: "TAB_CLOSED" }>,
  ): UIState => {
    if (!context.tabs[event.tabId]) return context;

    // Remove tab and any chat apps belonging to it
    const { [event.tabId]: _removed, ...remainingTabs } = context.tabs;
    const remainingChatApps = Object.fromEntries(
      Object.entries(context.chatApps).filter(
        ([, app]) => app.tabId !== event.tabId,
      ),
    );

    // Determine new active tab (pick first available or null)
    const remainingTabIds = Object.keys(remainingTabs);
    const newActive =
      context.activeTabId === event.tabId
        ? (remainingTabIds[0] ?? null)
        : context.activeTabId;

    return {
      ...context,
      tabs: remainingTabs,
      chatApps: remainingChatApps,
      activeTabId: newActive,
    };
  },

  CHAT_APP_ADDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_ADDED" }>,
  ): UIState => {
    if (!context.tabs[event.tabId]) return context; // invalid tab

    if (context.chatApps[event.appId]) return context; // duplicate

    const newApps = {
      ...context.chatApps,
      [event.appId]: {
        id: event.appId,
        tabId: event.tabId,
        status: "compact" as ChatAppStatus,
      },
    };

    return {
      ...context,
      chatApps: newApps,
    };
  },

  CHAT_APP_UPDATED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_UPDATED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app || app.tabId !== event.tabId) return context;

    return {
      ...context,
      chatApps: {
        ...context.chatApps,
        [event.appId]: {
          ...app,
          status: event.status ?? app.status,
        },
      },
    };
  },

  CHAT_APP_REMOVED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_REMOVED" }>,
  ): UIState => {
    const app = context.chatApps[event.appId];
    if (!app || app.tabId !== event.tabId) return context;

    const { [event.appId]: _removed, ...remainingApps } = context.chatApps;

    return {
      ...context,
      chatApps: remainingApps,
    };
  },

  CHAT_APP_EXPANDED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_EXPANDED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (!target || target.tabId !== event.tabId) return context;

    const updatedApps: Record<string, typeof target> = { ...context.chatApps };

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

  CHAT_APP_COMPACTED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_COMPACTED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (!target || target.tabId !== event.tabId) return context;

    // Identify any existing expanded app in same tab
    let expandedId: string | null = null;
    for (const app of Object.values(context.chatApps)) {
      if (app.tabId === event.tabId && app.status === "expanded") {
        expandedId = app.id;
        break;
      }
    }

    const updatedApps: Record<string, typeof target> = { ...context.chatApps };

    // Make target compact
    updatedApps[event.appId] = { ...target, status: "compact" };

    // If there was an expanded app, reduce it to compact as well
    if (expandedId && expandedId !== event.appId) {
      const exp = updatedApps[expandedId];
      if (exp) updatedApps[expandedId] = { ...exp, status: "compact" };
    }

    return { ...context, chatApps: updatedApps };
  },

  CHAT_APP_CLOSED: (
    context: UIState,
    event: Extract<UIEvent, { type: "CHAT_APP_CLOSED" }>,
  ): UIState => {
    const target = context.chatApps[event.appId];
    if (!target || target.tabId !== event.tabId) return context;

    const updatedApps = {
      ...context.chatApps,
      [event.appId]: { ...target, status: "closed" as ChatAppStatus },
    };

    return { ...context, chatApps: updatedApps };
  },
} as const;

// ---------------------------------------------------------------------------
// Store factory & default instance
// ---------------------------------------------------------------------------

export function createWorkspaceStore(initial?: UIState) {
  const store = createStore<UIState, UIEvent>({
    context: initial ?? initialContext,
    on: {
      RESET: (context, event) => handlers.RESET(),
      TAB_ADDED: (context, event) => handlers.TAB_ADDED(context, event),
      TAB_UPDATED: (context, event) => handlers.TAB_UPDATED(context, event),
      TAB_ACTIVATED: (context, event) => handlers.TAB_ACTIVATED(context, event),
      TAB_CLOSED: (context, event) => handlers.TAB_CLOSED(context, event),
      CHAT_APP_ADDED: (context, event) =>
        handlers.CHAT_APP_ADDED(context, event),
      CHAT_APP_UPDATED: (context, event) =>
        handlers.CHAT_APP_UPDATED(context, event),
      CHAT_APP_REMOVED: (context, event) =>
        handlers.CHAT_APP_REMOVED(context, event),
      CHAT_APP_EXPANDED: (context, event) =>
        handlers.CHAT_APP_EXPANDED(context, event),
      CHAT_APP_COMPACTED: (context, event) =>
        handlers.CHAT_APP_COMPACTED(context, event),
      CHAT_APP_CLOSED: (context, event) =>
        handlers.CHAT_APP_CLOSED(context, event),
    },
  });

  return store;
}

// Default instance used by the app
export const workspaceStore = createWorkspaceStore();

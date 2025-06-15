export interface TabEntry {
  readonly id: string;
  readonly name: string;
  /**
   * Optional hex color (e.g., #ff00aa) chosen by the user.
   */
  readonly color?: string;
}

export type ChatAppStatus = "compact" | "expanded" | "stashed" | "closed";

export interface ChatAppEntry {
  readonly id: string;
  /**
   * The tab this app belongs to.
   */
  readonly tabId: string;
  readonly status: ChatAppStatus;
}

export interface UIState {
  /**
   * Id of the currently-active tab.
   * `null` when no tab has been created yet.
   */
  readonly activeTabId: string | null;
  /**
   * Map of tabId → tab record.
   */
  readonly tabs: Record<string, TabEntry>;
  /**
   * Map of chatAppId → chat-app UI entry.
   */
  readonly chatApps: Record<string, ChatAppEntry>;
}

// ---------------------------------------------------------------------------
// UI Events – the ONLY way to mutate the state machine from the outside.
// ---------------------------------------------------------------------------

export type UIEvent =
  | {
      type: "TAB_ADDED";
      tabId: string;
      name: string;
      color?: string;
    }
  | {
      type: "TAB_UPDATED";
      tabId: string;
      name?: string;
      color?: string;
    }
  | {
      type: "TAB_ACTIVATED";
      tabId: string;
    }
  | {
      type: "TAB_CLOSED";
      tabId: string;
    }
  | {
      type: "CHAT_APP_ADDED";
      tabId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_UPDATED";
      tabId: string;
      appId: string;
      status?: ChatAppStatus;
    }
  | {
      type: "CHAT_APP_REMOVED";
      tabId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_EXPANDED";
      tabId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_COMPACTED";
      tabId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_CLOSED";
      tabId: string;
      appId: string;
    }
  | {
      type: "RESET";
    };

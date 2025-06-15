import { beforeEach, describe, expect, it } from "vitest";
import { UIState } from "../types";
import { createWorkspaceStore } from "../workspaceStore";

// Helper to build a fresh store for each test
const initial: UIState = {
  activeTabId: null,
  tabs: {},
  chatApps: {},
};

describe("workspaceStore", () => {
  let store: ReturnType<typeof createWorkspaceStore>;

  beforeEach(() => {
    store = createWorkspaceStore(initial);
  });

  describe("Tab Management", () => {
    it("adds a tab and sets it active", () => {
      store.send({
        type: "TAB_ADDED",
        tabId: "t1",
        name: "Tab 1",
        color: "#ff0000",
      });

      const state = store.getSnapshot().context;
      expect(state.activeTabId).toBe("t1");
      expect(state.tabs).toHaveProperty("t1");
      expect(state.tabs["t1"].color).toBe("#ff0000");
    });

    it("updates tab properties", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({
        type: "TAB_UPDATED",
        tabId: "t1",
        name: "Updated Tab",
        color: "#00ff00",
      });

      const state = store.getSnapshot().context;
      expect(state.tabs["t1"].name).toBe("Updated Tab");
      expect(state.tabs["t1"].color).toBe("#00ff00");
    });

    it("removes tab and its associated chat apps", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" });
      store.send({ type: "TAB_CLOSED", tabId: "t1" });

      const state = store.getSnapshot().context;
      expect(state.tabs).not.toHaveProperty("t1");
      expect(state.chatApps).not.toHaveProperty("a1");
    });

    it("switches active tab", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "TAB_ADDED", tabId: "t2", name: "Tab 2" });
      store.send({ type: "TAB_ACTIVATED", tabId: "t1" });

      const state = store.getSnapshot().context;
      expect(state.activeTabId).toBe("t1");
    });
  });

  describe("Chat App Management", () => {
    it("adds a chat app in compact mode", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "appA" });

      const { chatApps } = store.getSnapshot().context;
      expect(chatApps).toHaveProperty("appA");
      expect(chatApps["appA"].status).toBe("compact");
    });

    it("expands a chat app and stashes siblings", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a2" });

      store.send({ type: "CHAT_APP_EXPANDED", tabId: "t1", appId: "a1" });

      const { chatApps } = store.getSnapshot().context;
      expect(chatApps["a1"].status).toBe("expanded");
      expect(chatApps["a2"].status).toBe("stashed");
    });

    it("compacts a stashed app and un-expands the current expanded one", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a2" });
      store.send({ type: "CHAT_APP_EXPANDED", tabId: "t1", appId: "a1" });

      store.send({ type: "CHAT_APP_COMPACTED", tabId: "t1", appId: "a2" });

      const { chatApps } = store.getSnapshot().context;
      expect(chatApps["a2"].status).toBe("compact");
      expect(chatApps["a1"].status).toBe("compact");
    });

    it("removes chat app", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" });
      store.send({ type: "CHAT_APP_REMOVED", tabId: "t1", appId: "a1" });

      const { chatApps } = store.getSnapshot().context;
      expect(chatApps).not.toHaveProperty("a1");
    });

    it("updates chat app properties", () => {
      store.send({ type: "TAB_ADDED", tabId: "t1", name: "Tab 1" });
      store.send({ type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" });
      store.send({
        type: "CHAT_APP_UPDATED",
        tabId: "t1",
        appId: "a1",
        status: "expanded",
      });

      const { chatApps } = store.getSnapshot().context;
      expect(chatApps["a1"].status).toBe("expanded");
    });
  });

  describe("Error Handling", () => {
    it("handles invalid tab operations gracefully", () => {
      // Try to update non-existent tab
      store.send({
        type: "TAB_UPDATED",
        tabId: "nonexistent",
        name: "Invalid",
      });

      const state = store.getSnapshot().context;
      expect(state.tabs).toEqual({});
    });

    it("handles invalid chat app operations gracefully", () => {
      // Try to expand chat app in non-existent tab
      store.send({
        type: "CHAT_APP_EXPANDED",
        tabId: "nonexistent",
        appId: "a1",
      });

      const state = store.getSnapshot().context;
      expect(state.chatApps).toEqual({});
    });
  });
});

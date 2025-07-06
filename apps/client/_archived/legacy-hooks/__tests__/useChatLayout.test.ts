import { beforeEach, describe, expect, test } from "vitest";

// Extract core logic from useChatLayout for testing
interface ChatLayoutState {
  readonly isExpanded: boolean;
}

interface ChatLayoutActions {
  readonly expand: () => void;
}

interface MockStorage {
  [key: string]: string;
}

function createChatLayoutLogic(mockStorage: MockStorage = {}) {
  // Mock localStorage for testing
  const storage = {
    getItem: (key: string): string | null => mockStorage[key] || null,
    setItem: (key: string, value: string): void => {
      mockStorage[key] = value;
    },
    removeItem: (key: string): void => {
      delete mockStorage[key];
    },
  };

  return {
    getStorageKey: (chatId: string): string => `chat-expanded-${chatId}`,

    getInitialState: (chatId: string): boolean => {
      const storageKey = `chat-expanded-${chatId}`;
      return storage.getItem(storageKey) === "1";
    },

    updateStorage: (chatId: string, isExpanded: boolean): void => {
      const storageKey = `chat-expanded-${chatId}`;
      if (isExpanded) {
        storage.setItem(storageKey, "1");
      } else {
        storage.removeItem(storageKey);
      }
    },

    createLayoutManager: (chatId: string) => {
      let state = {
        isExpanded: storage.getItem(`chat-expanded-${chatId}`) === "1",
      };

      const updateState = (newExpanded: boolean) => {
        state = { isExpanded: newExpanded };
        const storageKey = `chat-expanded-${chatId}`;
        if (newExpanded) {
          storage.setItem(storageKey, "1");
        } else {
          storage.removeItem(storageKey);
        }
      };

      return {
        getState: () => state,
        expand: () => updateState(true),
        collapse: () => updateState(false),
        toggle: () => updateState(!state.isExpanded),
        reset: (newChatId: string) => {
          const newStorageKey = `chat-expanded-${newChatId}`;
          state = { isExpanded: storage.getItem(newStorageKey) === "1" };
        },
      };
    },

    // Expose storage for testing
    _storage: storage,
    _mockStorage: mockStorage,
  };
}

describe("useChatLayout Core Logic", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = {};
  });

  describe("Storage Key Generation", () => {
    test("should generate correct storage key for chat ID", () => {
      const logic = createChatLayoutLogic(mockStorage);

      expect(logic.getStorageKey("chat-123")).toBe("chat-expanded-chat-123");
      expect(logic.getStorageKey("my-chat")).toBe("chat-expanded-my-chat");
      expect(logic.getStorageKey("")).toBe("chat-expanded-");
    });

    test("should handle special characters in chat ID", () => {
      const logic = createChatLayoutLogic(mockStorage);

      expect(logic.getStorageKey("chat-with-spaces")).toBe(
        "chat-expanded-chat-with-spaces",
      );
      expect(logic.getStorageKey("chat@123")).toBe("chat-expanded-chat@123");
      expect(logic.getStorageKey("chat_with_underscores")).toBe(
        "chat-expanded-chat_with_underscores",
      );
    });
  });

  describe("Initial State Loading", () => {
    test("should return false when no storage value exists", () => {
      const logic = createChatLayoutLogic(mockStorage);

      const isExpanded = logic.getInitialState("new-chat");

      expect(isExpanded).toBe(false);
    });

    test("should return true when storage value is '1'", () => {
      mockStorage["chat-expanded-expanded-chat"] = "1";
      const logic = createChatLayoutLogic(mockStorage);

      const isExpanded = logic.getInitialState("expanded-chat");

      expect(isExpanded).toBe(true);
    });

    test("should return false when storage value is not '1'", () => {
      mockStorage["chat-expanded-test-chat"] = "0";
      const logic = createChatLayoutLogic(mockStorage);

      const isExpanded = logic.getInitialState("test-chat");

      expect(isExpanded).toBe(false);
    });

    test("should handle different chat IDs independently", () => {
      mockStorage["chat-expanded-chat1"] = "1";
      mockStorage["chat-expanded-chat2"] = "0";
      const logic = createChatLayoutLogic(mockStorage);

      expect(logic.getInitialState("chat1")).toBe(true);
      expect(logic.getInitialState("chat2")).toBe(false);
      expect(logic.getInitialState("chat3")).toBe(false);
    });
  });

  describe("Storage Updates", () => {
    test("should set storage to '1' when expanded", () => {
      const logic = createChatLayoutLogic(mockStorage);

      logic.updateStorage("test-chat", true);

      expect(mockStorage["chat-expanded-test-chat"]).toBe("1");
    });

    test("should remove storage when collapsed", () => {
      mockStorage["chat-expanded-test-chat"] = "1";
      const logic = createChatLayoutLogic(mockStorage);

      logic.updateStorage("test-chat", false);

      expect(mockStorage["chat-expanded-test-chat"]).toBeUndefined();
    });

    test("should handle multiple chat storage independently", () => {
      const logic = createChatLayoutLogic(mockStorage);

      logic.updateStorage("chat1", true);
      logic.updateStorage("chat2", false);
      logic.updateStorage("chat3", true);

      expect(mockStorage["chat-expanded-chat1"]).toBe("1");
      expect(mockStorage["chat-expanded-chat2"]).toBeUndefined();
      expect(mockStorage["chat-expanded-chat3"]).toBe("1");
    });
  });

  describe("Layout Manager", () => {
    test("should initialize with correct state from storage", () => {
      mockStorage["chat-expanded-test-chat"] = "1";
      const logic = createChatLayoutLogic(mockStorage);

      const manager = logic.createLayoutManager("test-chat");

      expect(manager.getState().isExpanded).toBe(true);
    });

    test("should expand and update storage", () => {
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("test-chat");

      expect(manager.getState().isExpanded).toBe(false);

      manager.expand();

      expect(manager.getState().isExpanded).toBe(true);
      expect(mockStorage["chat-expanded-test-chat"]).toBe("1");
    });

    test("should collapse and remove from storage", () => {
      mockStorage["chat-expanded-test-chat"] = "1";
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("test-chat");

      expect(manager.getState().isExpanded).toBe(true);

      manager.collapse();

      expect(manager.getState().isExpanded).toBe(false);
      expect(mockStorage["chat-expanded-test-chat"]).toBeUndefined();
    });

    test("should toggle state correctly", () => {
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("test-chat");

      // Initially false
      expect(manager.getState().isExpanded).toBe(false);

      // Toggle to true
      manager.toggle();
      expect(manager.getState().isExpanded).toBe(true);
      expect(mockStorage["chat-expanded-test-chat"]).toBe("1");

      // Toggle back to false
      manager.toggle();
      expect(manager.getState().isExpanded).toBe(false);
      expect(mockStorage["chat-expanded-test-chat"]).toBeUndefined();
    });

    test("should reset state when chat ID changes", () => {
      mockStorage["chat-expanded-chat1"] = "1";
      mockStorage["chat-expanded-chat2"] = "0";

      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("chat1");

      expect(manager.getState().isExpanded).toBe(true);

      manager.reset("chat2");
      expect(manager.getState().isExpanded).toBe(false);

      manager.reset("chat3"); // No storage for chat3
      expect(manager.getState().isExpanded).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty chat ID", () => {
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("");

      expect(manager.getState().isExpanded).toBe(false);

      manager.expand();
      expect(manager.getState().isExpanded).toBe(true);
      expect(mockStorage["chat-expanded-"]).toBe("1");
    });

    test("should handle very long chat IDs", () => {
      const longChatId = "a".repeat(1000);
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager(longChatId);

      manager.expand();

      expect(manager.getState().isExpanded).toBe(true);
      expect(mockStorage[`chat-expanded-${longChatId}`]).toBe("1");
    });

    test("should handle rapid state changes", () => {
      const logic = createChatLayoutLogic(mockStorage);
      const manager = logic.createLayoutManager("rapid-test");

      // Rapid expand/collapse
      for (let i = 0; i < 100; i++) {
        manager.toggle();
      }

      // Should end up in collapsed state (even number of toggles)
      expect(manager.getState().isExpanded).toBe(false);
      expect(mockStorage["chat-expanded-rapid-test"]).toBeUndefined();
    });

    test("should maintain state consistency across multiple managers", () => {
      const logic = createChatLayoutLogic(mockStorage);
      const manager1 = logic.createLayoutManager("shared-chat");
      const manager2 = logic.createLayoutManager("shared-chat");

      // Both should start with same state
      expect(manager1.getState().isExpanded).toBe(false);
      expect(manager2.getState().isExpanded).toBe(false);

      // Expand via manager1
      manager1.expand();

      // Storage should be updated
      expect(mockStorage["chat-expanded-shared-chat"]).toBe("1");

      // Create new manager3 - should read updated storage
      const manager3 = logic.createLayoutManager("shared-chat");
      expect(manager3.getState().isExpanded).toBe(true);
    });
  });

  describe("Performance", () => {
    test("should handle storage operations efficiently", () => {
      const logic = createChatLayoutLogic(mockStorage);

      const start = performance.now();

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        logic.updateStorage(`chat-${i}`, i % 2 === 0);
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(Object.keys(mockStorage)).toHaveLength(500); // Half should be stored
    });
  });
});

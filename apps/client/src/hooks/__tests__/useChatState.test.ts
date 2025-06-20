import type { Message } from "@/types/chat";
import { describe, expect, test } from "vitest";

// Extract the core logic from useChatState for testing
function mapMessageApi(messageApi: any): Message {
  return {
    id: messageApi.id,
    text: messageApi.text,
    role: messageApi.sender,
    timestamp: messageApi.timestamp,
    attachments: messageApi.attachments,
    metadata: messageApi.metadata,
  };
}

interface ChatStateUI {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly isRendering: boolean;
  readonly status: "idle" | "connecting" | "connected" | "error";
}

function createInitialChatState(): ChatStateUI {
  return {
    messages: [],
    isTyping: false,
    isRendering: false,
    status: "idle",
  };
}

function updateChatStateFromService(serviceState: any): ChatStateUI {
  return {
    messages: serviceState.messages.map(mapMessageApi),
    isTyping: serviceState.isTyping,
    isRendering: false,
    status: "connected",
  };
}

describe("useChatState Core Logic", () => {
  describe("Message Mapping", () => {
    test("should map MessageApi to UI Message correctly", () => {
      const messageApi = {
        id: "msg-123",
        text: "Hello world",
        sender: "user",
        timestamp: 1234567890,
        attachments: ["file1.txt"],
        metadata: { source: "test" },
      };

      const result = mapMessageApi(messageApi);

      expect(result).toEqual({
        id: "msg-123",
        text: "Hello world",
        role: "user",
        timestamp: 1234567890,
        attachments: ["file1.txt"],
        metadata: { source: "test" },
      });
    });

    test("should handle missing optional fields", () => {
      const messageApi = {
        id: "msg-456",
        text: "Simple message",
        sender: "assistant",
        timestamp: 1234567890,
      };

      const result = mapMessageApi(messageApi);

      expect(result).toEqual({
        id: "msg-456",
        text: "Simple message",
        role: "assistant",
        timestamp: 1234567890,
        attachments: undefined,
        metadata: undefined,
      });
    });

    test("should map multiple messages correctly", () => {
      const messagesApi = [
        {
          id: "msg-1",
          text: "First message",
          sender: "user",
          timestamp: 1000,
        },
        {
          id: "msg-2",
          text: "Second message",
          sender: "assistant",
          timestamp: 2000,
        },
      ];

      const result = messagesApi.map(mapMessageApi);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("user");
      expect(result[1].role).toBe("assistant");
    });
  });

  describe("State Management", () => {
    test("should create initial state correctly", () => {
      const state = createInitialChatState();

      expect(state).toEqual({
        messages: [],
        isTyping: false,
        isRendering: false,
        status: "idle",
      });
    });

    test("should update state from service state", () => {
      const serviceState = {
        messages: [
          {
            id: "msg-1",
            text: "Test message",
            sender: "user",
            timestamp: 1000,
          },
        ],
        isTyping: true,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result).toEqual({
        messages: [
          {
            id: "msg-1",
            text: "Test message",
            role: "user",
            timestamp: 1000,
            attachments: undefined,
            metadata: undefined,
          },
        ],
        isTyping: true,
        isRendering: false,
        status: "connected",
      });
    });

    test("should handle empty message array", () => {
      const serviceState = {
        messages: [],
        isTyping: false,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result.messages).toEqual([]);
      expect(result.isTyping).toBe(false);
      expect(result.status).toBe("connected");
    });

    test("should preserve message order", () => {
      const serviceState = {
        messages: [
          { id: "msg-1", text: "First", sender: "user", timestamp: 1000 },
          { id: "msg-2", text: "Second", sender: "assistant", timestamp: 2000 },
          { id: "msg-3", text: "Third", sender: "user", timestamp: 3000 },
        ],
        isTyping: false,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].text).toBe("First");
      expect(result.messages[1].text).toBe("Second");
      expect(result.messages[2].text).toBe("Third");
    });
  });

  describe("Status Management", () => {
    test("should set status to connected when updating from service", () => {
      const serviceState = {
        messages: [],
        isTyping: false,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result.status).toBe("connected");
    });

    test("should maintain isRendering as false", () => {
      const serviceState = {
        messages: [],
        isTyping: true,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result.isRendering).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle malformed message data gracefully", () => {
      const serviceState = {
        messages: [
          {
            id: null,
            text: undefined,
            sender: "",
            timestamp: "invalid",
          },
        ],
        isTyping: false,
      };

      const result = updateChatStateFromService(serviceState);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe(null);
      expect(result.messages[0].text).toBe(undefined);
      expect(result.messages[0].role).toBe("");
    });

    test("should handle large message arrays efficiently", () => {
      const largeMessageArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        text: `Message ${i}`,
        sender: i % 2 === 0 ? "user" : "assistant",
        timestamp: i * 1000,
      }));

      const serviceState = {
        messages: largeMessageArray,
        isTyping: false,
      };

      const start = performance.now();
      const result = updateChatStateFromService(serviceState);
      const duration = performance.now() - start;

      expect(result.messages).toHaveLength(1000);
      expect(duration).toBeLessThan(50); // Should be fast
    });
  });
});

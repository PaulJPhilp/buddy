import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vitest";
import { WebSocketError } from "../websocket/WebSocketService";
import { ChatService } from "./ChatService";
import { ChatState } from "./ChatServiceApi";
import {
  HistoryError,
  MessageCreationError,
  StateUpdateError,
} from "./ChatServiceErrors";

// Constants
const MAX_MESSAGES_PER_CHAT = 100;
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 1;

describe("ChatService", () => {
  // Create a Layer that provides both ChatService and MockChatStateApi
  const TestLayer = ChatService.Default;

  describe("getState", () => {
    it("should return the initial state", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;
        const state = yield* service.getState();

        expect(state).toEqual({
          id: "default",
          messages: [],
          isTyping: false,
        });

        return undefined;
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("setState", () => {
    it("should update the state successfully", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const newState: ChatState = {
          id: "test-chat",
          messages: [],
          isTyping: true,
        };

        const updatedState = yield* service.setState(newState);
        expect(updatedState).toEqual(newState);

        // Verify state was actually updated
        const currentState = yield* service.getState();
        expect(currentState).toEqual(newState);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should fail when setting invalid state", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Create an invalid state without required properties
        const invalidState = { messages: [] } as any;

        try {
          yield* service.setState(invalidState);
          // If we get here, the test should fail
          expect(true).toBe(false); // This should never be reached
        } catch (error) {
          // Type assertion for the error
          const typedError = error as StateUpdateError;
          expect(typedError).toBeInstanceOf(StateUpdateError);
          expect(typedError.description).toContain("Invalid state object");
          expect(typedError.method).toBe("setState");
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("sendMessage", () => {
    it("should add a message to the state", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;
        const messageText = "Hello, world!";

        const message = yield* service.sendMessage(messageText);
        expect(message).toMatchObject({
          text: messageText,
          sender: "user",
        });

        // Verify message was added to state
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toEqual(message);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should fail when sending empty message", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        try {
          yield* service.sendMessage("");
          // If we get here, the test should fail
          expect(true).toBe(false); // This should never be reached
        } catch (error) {
          // Type assertion for the error
          const typedError = error as MessageCreationError;
          expect(typedError).toBeInstanceOf(MessageCreationError);
          expect(typedError.description).toContain(
            "Message text cannot be empty",
          );
          expect(typedError.method).toBe("sendMessage");
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should fail when sending whitespace-only message", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        try {
          yield* service.sendMessage("   ");
          // If we get here, the test should fail
          expect(true).toBe(false); // This should never be reached
        } catch (error) {
          // Type assertion for the error
          const typedError = error as MessageCreationError;
          expect(typedError).toBeInstanceOf(MessageCreationError);
          expect(typedError.description).toContain(
            "Message text cannot be empty",
          );
          expect(typedError.method).toBe("sendMessage");
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should send multiple messages and maintain order", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        yield* service.sendMessage("First message");
        yield* service.sendMessage("Second message");
        yield* service.sendMessage("Third message");

        const state = yield* service.getState();
        expect(state.messages).toHaveLength(3);
        expect(state.messages.map((m) => m.text)).toEqual([
          "First message",
          "Second message",
          "Third message",
        ]);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("setTyping", () => {
    it("should update isTyping state to true", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const state = yield* service.setTyping(true);
        expect(state.isTyping).toBe(true);

        // Verify state was updated
        const currentState = yield* service.getState();
        expect(currentState.isTyping).toBe(true);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should update isTyping state to false", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // First set to true
        yield* service.setTyping(true);

        // Then set to false
        const state = yield* service.setTyping(false);
        expect(state.isTyping).toBe(false);

        // Verify state was updated
        const currentState = yield* service.getState();
        expect(currentState.isTyping).toBe(false);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("Error cases with state manipulation", () => {
    it("should handle state corruption", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Set up an initial state
        const initialState: ChatState = {
          id: "test-chat",
          messages: [],
          isTyping: false,
        };

        yield* service.setState(initialState);
        // Rest of test would go here...
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("Integration tests", () => {
    it("should perform a complete chat flow", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Set initial state
        const chatId = `chat-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // User starts typing
        yield* service.setTyping(true);

        // User sends a message
        const userMessage = yield* service.sendMessage("Hello, AI assistant!");

        // User stops typing
        yield* service.setTyping(false);

        // Get final state and verify
        const finalState = yield* service.getState();

        expect(finalState).toEqual({
          id: chatId,
          messages: [userMessage],
          isTyping: false,
        });
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("Message Validation", () => {
    it("should validate message length constraints", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Test minimum length
        const tooShort = yield* service.validateMessage("");
        expect(tooShort.isValid).toBe(false);
        expect(tooShort.errors).toContain(
          `Message must be at least ${MIN_MESSAGE_LENGTH} character long`,
        );

        // Test maximum length
        const longMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);
        const tooLong = yield* service.validateMessage(longMessage);
        expect(tooLong.isValid).toBe(false);
        expect(tooLong.errors).toContain(
          `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
        );

        // Test valid message
        const validMessage = yield* service.validateMessage("Hello, world!");
        expect(validMessage.isValid).toBe(true);
        expect(validMessage.errors).toHaveLength(0);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should detect and prevent unsafe content", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const unsafeMessages = [
          "<script>alert('xss')</script>",
          "javascript:alert('xss')",
          'data:text/html,<script>alert("xss")</script>',
        ];

        for (const msg of unsafeMessages) {
          const validation = yield* service.validateMessage(msg);
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain(
            "Message contains potentially unsafe content",
          );
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should sanitize messages when sending", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const unsafeMessage = "<p>Hello</p> <script>alert('xss')</script>";
        try {
          yield* service.sendMessage(unsafeMessage);
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          const typedError = error as MessageCreationError;
          expect(typedError).toBeInstanceOf(MessageCreationError);
          expect(typedError.description).toContain(
            "potentially unsafe content",
          );
        }

        // Test sanitization of valid message
        const message = yield* service.sendMessage("Hello, world! 123");
        expect(message.text).toBe("Hello, world! 123");
        expect(message.metadata?.validation?.isValid).toBe(true);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should handle concurrent message validation", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Simulate concurrent validation requests
        const validations = yield* Effect.all(
          [
            service.validateMessage("Message 1"),
            service.validateMessage("Message 2"),
            service.validateMessage("Message 3"),
          ],
          { concurrency: "unbounded" },
        );

        expect(validations).toHaveLength(3);
        for (const validation of validations) {
          expect(validation.isValid).toBe(true);
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should maintain message metadata through the pipeline", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const message = yield* service.sendMessage(
          "Test message with metadata",
        );

        expect(message.metadata).toBeDefined();
        expect(message.metadata?.length).toBe(message.text.length);
        expect(message.metadata?.validation?.isValid).toBe(true);

        const state = yield* service.getState();
        expect(state.metadata?.messageCount).toBe(1);
        expect(state.metadata?.lastMessageAt).toBeDefined();
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });

  describe("Chat History Management", () => {
    it("should enforce maximum message limit", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Set up initial state with max - 1 messages
        const messages = Array.from(
          { length: MAX_MESSAGES_PER_CHAT - 1 },
          (_, i) => ({
            id: `msg-${i}`,
            text: `Message ${i}`,
            sender: "user" as const,
            timestamp: Date.now() + i,
          }),
        );

        yield* service.setState({
          id: "test-chat",
          messages,
          isTyping: false,
        });

        // Should allow one more message
        const lastMessage = yield* service.sendMessage("Last allowed message");
        expect(lastMessage.text).toBe("Last allowed message");

        // Should reject additional messages
        try {
          yield* service.sendMessage("This should fail");
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          const typedError = error as MessageCreationError;
          expect(typedError).toBeInstanceOf(MessageCreationError);
          expect(typedError.description).toContain(
            `maximum message limit of ${MAX_MESSAGES_PER_CHAT}`,
          );
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should paginate chat history correctly", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Create 100 test messages
        for (let i = 0; i < 100; i++) {
          yield* service.sendMessage(`Message ${i}`);
        }

        // Test default pagination (most recent 50)
        const firstPage = yield* service.getHistory();
        expect(firstPage.messages).toHaveLength(50);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.nextCursor).toBeDefined();

        // Test pagination with cursor
        const secondPage = yield* service.getHistory(firstPage.nextCursor);
        expect(secondPage.messages).toHaveLength(50);
        expect(secondPage.hasMore).toBe(false);

        // Verify message order
        const allMessages = [...secondPage.messages, ...firstPage.messages];
        expect(allMessages).toHaveLength(100);
        allMessages.forEach((msg, i) => {
          expect(msg.text).toBe(`Message ${i}`);
        });
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should handle invalid cursors gracefully", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        yield* service.sendMessage("Test message");

        try {
          yield* service.getHistory("invalid-cursor");
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          const typedError = error as HistoryError;
          expect(typedError).toBeInstanceOf(HistoryError);
          expect(typedError.description).toContain("Invalid cursor");
        }
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should clear chat history", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Add some messages
        yield* service.sendMessage("Message 1");
        yield* service.sendMessage("Message 2");

        // Clear history
        yield* service.clearHistory();

        // Verify state
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(0);
        expect(state.metadata?.messageCount).toBe(0);
        expect(state.metadata?.lastMessageAt).toBeUndefined();

        // Verify history is empty
        const history = yield* service.getHistory();
        expect(history.messages).toHaveLength(0);
        expect(history.hasMore).toBe(false);
        expect(history.nextCursor).toBeUndefined();
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);

    it("should handle concurrent history operations", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Set up concurrent operations
        const ops = Effect.all(
          [
            service.sendMessage("Message 1"),
            service.getHistory(),
            service.sendMessage("Message 2"),
            service.getHistory(),
          ],
          { concurrency: "unbounded" },
        );

        const results = yield* ops;

        // Verify all operations completed
        expect(results).toHaveLength(4);

        // Verify final state
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(2);
        expect(state.metadata?.messageCount).toBe(2);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.catchAll((error) =>
          Effect.fail(new WebSocketError(String(error))),
        ),
      ) as Effect.Effect<undefined, WebSocketError, never>);
  });
});

import { createStore } from "@xstate/store";
import { Effect, Stream } from "effect";
import type {
  ChatStateApi,
  MessageApi,
} from "../../../services/chat/ChatServiceApi";
import type { Message } from "../types";

// Chat instance store state interface
interface ChatInstanceState {
  readonly chatId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly isTyping: boolean;
  readonly isLoadingHistory: boolean;
  readonly isSending: boolean;
  readonly error: string | null;
  readonly status: "initializing" | "connected" | "disconnected" | "error";
  readonly hasMoreHistory: boolean;
  readonly nextCursor?: string;
}

// Events that can be sent to the store
type ChatInstanceEvent =
  | { type: "sendMessage"; text: string; attachments?: File[] }
  | { type: "messageReceived"; message: Message }
  | { type: "setTyping"; isTyping: boolean }
  | { type: "loadMoreHistory" }
  | {
      type: "historyLoaded";
      messages: Message[];
      hasMore: boolean;
      nextCursor?: string;
    }
  | { type: "setError"; error: string | null }
  | { type: "setStatus"; status: ChatInstanceState["status"] }
  | { type: "setSending"; isSending: boolean }
  | { type: "setLoadingHistory"; isLoadingHistory: boolean }
  | { type: "clearHistory" };

// Initial state factory
const createInitialState = (chatId: string): ChatInstanceState => ({
  chatId,
  messages: [],
  isTyping: false,
  isLoadingHistory: false,
  isSending: false,
  error: null,
  status: "initializing",
  hasMoreHistory: true,
  nextCursor: undefined,
});

// Helper to convert MessageApi to Message
const convertApiMessageToMessage = (apiMessage: MessageApi): Message => {
  console.log(
    "[ChatInstanceStore] Converting API message to UI message:",
    apiMessage,
  );
  const converted = {
    id: apiMessage.id,
    text: apiMessage.text,
    role: apiMessage.sender as "user" | "assistant",
    timestamp: apiMessage.timestamp,
    attachments: apiMessage.attachments,
    metadata: apiMessage.metadata || {},
  };
  console.log("[ChatInstanceStore] Converted UI message:", converted);
  return converted;
};

// Helper to convert Message to MessageApi
const convertMessageToApiMessage = (message: Message): MessageApi => ({
  id: message.id,
  text: message.text,
  sender: message.role as "user" | "assistant",
  timestamp: message.timestamp,
  attachments: message.attachments,
  metadata: message.metadata,
});

// Factory function to create a chat instance store
export function createChatInstanceStore(
  chatId: string,
  chatService: ChatStateApi,
) {
  const store = createStore({
    context: createInitialState(chatId),
    on: {
      sendMessage: (context, event: { text: string; attachments?: File[] }) => {
        // Optimistically add user message
        const userMessage: Message = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: event.text,
          role: "user",
          timestamp: Date.now(),
          attachments: event.attachments?.map((file) => ({
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            size: file.size,
            type: file.type,
          })),
          metadata: {
            length: event.text.length,
            hasAttachments: event.attachments && event.attachments.length > 0,
            attachedFileCount: event.attachments?.length ?? 0,
            fileNames: event.attachments?.map((file) => file.name) ?? [],
          } as Record<string, unknown>,
        };

        return {
          ...context,
          messages: [...context.messages, userMessage],
          isSending: true,
          error: null,
        };
      },

      messageReceived: (context, event: { message: Message }) => {
        console.log(
          "[ChatInstanceStore] messageReceived action called with:",
          event.message,
        );
        console.log(
          "[ChatInstanceStore] Current context messages before:",
          context.messages.length,
        );

        const existingIndex = context.messages.findIndex(
          (m) => m.id === event.message.id,
        );

        // If message already exists (e.g., streaming update) merge / replace it, otherwise append
        let updatedMessages: ReadonlyArray<Message>;
        if (existingIndex >= 0) {
          const copy = [...context.messages];
          // Replace to get fresh text / metadata
          copy[existingIndex] = {
            ...copy[existingIndex],
            ...event.message,
          };
          updatedMessages = copy;
        } else {
          updatedMessages = [...context.messages, event.message];
        }

        const newState = {
          ...context,
          messages: updatedMessages,
          isTyping: false,
        };
        console.log(
          "[ChatInstanceStore] Updated state messages count:",
          newState.messages.length,
        );
        return newState;
      },

      setTyping: (context, event: { isTyping: boolean }) => ({
        ...context,
        isTyping: event.isTyping,
      }),

      loadMoreHistory: (context) => ({
        ...context,
        isLoadingHistory: true,
        error: null,
      }),

      historyLoaded: (
        context,
        event: { messages: Message[]; hasMore: boolean; nextCursor?: string },
      ) => ({
        ...context,
        messages: [...event.messages, ...context.messages],
        hasMoreHistory: event.hasMore,
        nextCursor: event.nextCursor,
        isLoadingHistory: false,
      }),

      setError: (context, event: { error: string | null }) => ({
        ...context,
        error: event.error,
        isSending: false,
        isLoadingHistory: false,
      }),

      setStatus: (context, event: { status: ChatInstanceState["status"] }) => ({
        ...context,
        status: event.status,
      }),

      setSending: (context, event: { isSending: boolean }) => ({
        ...context,
        isSending: event.isSending,
      }),

      setLoadingHistory: (context, event: { isLoadingHistory: boolean }) => ({
        ...context,
        isLoadingHistory: event.isLoadingHistory,
      }),

      clearHistory: (context) => ({
        ...context,
        messages: [],
        hasMoreHistory: true,
        nextCursor: undefined,
        error: null,
      }),
    },
  });

  // Effect program to handle side effects
  const handleSendMessage = (text: string, attachments?: File[]) =>
    Effect.gen(function* () {
      // Send message via service
      const apiMessage = yield* chatService.sendMessage(text, attachments);

      // Convert and dispatch the response
      const responseMessage = convertApiMessageToMessage(apiMessage);
      store.send({ type: "messageReceived", message: responseMessage });

      // Update sending state
      store.send({ type: "setSending", isSending: false });
    }).pipe(
      Effect.catchAll((error: unknown) =>
        Effect.sync(() => {
          store.send({
            type: "setError",
            error: error instanceof Error ? error.message : String(error),
          });
        }),
      ),
    );

  const handleLoadHistory = () =>
    Effect.gen(function* () {
      const currentState = store.getSnapshot().context;
      const historyPage = yield* chatService.getHistory(
        currentState.nextCursor,
        20,
      );

      const messages = historyPage.messages.map(convertApiMessageToMessage);
      store.send({
        type: "historyLoaded",
        messages,
        hasMore: historyPage.hasMore,
        nextCursor: historyPage.nextCursor,
      });
    }).pipe(
      Effect.catchAll((error: unknown) =>
        Effect.sync(() => {
          store.send({
            type: "setError",
            error: error instanceof Error ? error.message : String(error),
          });
        }),
      ),
    );

  const handleClearHistory = () =>
    Effect.gen(function* () {
      yield* chatService.clearHistory();
      store.send({ type: "clearHistory" });
    }).pipe(
      Effect.catchAll((error: unknown) =>
        Effect.sync(() => {
          store.send({
            type: "setError",
            error: error instanceof Error ? error.message : String(error),
          });
        }),
      ),
    );

  // Subscribe to message stream for real-time updates
  const subscribeToMessageStream = () =>
    Effect.gen(function* () {
      console.log(
        "[ChatInstanceStore] Starting message stream subscription for chatId:",
        chatId,
      );
      const messageStream = chatService.messageStream;

      yield* Stream.runForEach(messageStream, (apiMessage) =>
        Effect.gen(function* () {
          console.log(
            "[ChatInstanceStore] Received message from stream:",
            apiMessage,
          );
          const message = convertApiMessageToMessage(apiMessage);
          console.log("[ChatInstanceStore] Converted message:", message);
          yield* Effect.sync(() => {
            store.send({ type: "messageReceived", message });
          });
        }),
      );
    }).pipe(
      Effect.catchAll((error: unknown) =>
        Effect.gen(function* () {
          console.error("[ChatInstanceStore] Message stream error:", error);
          yield* Effect.sync(() => {
            store.send({
              type: "setError",
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }),
      ),
    );

  // Initialize the store
  const initialize = () =>
    Effect.gen(function* () {
      console.log("[ChatInstanceStore] Initializing store for chatId:", chatId);
      store.send({ type: "setStatus", status: "initializing" });

      // Load initial state from service
      const initialState = yield* chatService.getState();
      const messages = initialState.messages.map(convertApiMessageToMessage);

      // Update store with initial messages
      store.send({
        type: "historyLoaded",
        messages,
        hasMore: true, // Assume there might be more history
        nextCursor: undefined,
      });

      // Set typing state
      store.send({ type: "setTyping", isTyping: initialState.isTyping });

      // Start message stream subscription - use runFork to ensure it runs
      console.log(
        "[ChatInstanceStore] Starting message stream subscription...",
      );
      const streamFiber = yield* Effect.fork(subscribeToMessageStream());
      console.log(
        "[ChatInstanceStore] Message stream fiber started:",
        streamFiber,
      );

      store.send({ type: "setStatus", status: "connected" });
      console.log("[ChatInstanceStore] Store initialized successfully");
    }).pipe(
      Effect.catchAll((error: unknown) =>
        Effect.gen(function* () {
          console.error("[ChatInstanceStore] Initialization error:", error);
          yield* Effect.sync(() => {
            store.send({
              type: "setError",
              error: error instanceof Error ? error.message : String(error),
            });
            store.send({ type: "setStatus", status: "error" });
          });
        }),
      ),
    );

  // Public API
  return {
    store,
    actions: {
      sendMessage: (text: string, attachments?: File[]) => {
        store.send({ type: "sendMessage", text, attachments });
        return Effect.runPromise(handleSendMessage(text, attachments));
      },
      loadMoreHistory: () => {
        store.send({ type: "loadMoreHistory" });
        return Effect.runPromise(handleLoadHistory());
      },
      clearHistory: () => {
        return Effect.runPromise(handleClearHistory());
      },
      setTyping: (isTyping: boolean) => {
        store.send({ type: "setTyping", isTyping });
        return Effect.runPromise(chatService.setTyping(isTyping));
      },
      initialize: () => {
        return Effect.runPromise(initialize());
      },
    },
  };
}

export type ChatInstanceStore = ReturnType<typeof createChatInstanceStore>;

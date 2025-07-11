import { Effect, Queue, Ref } from "effect";
import type { ChatManagerApi } from "./api";
import type { ChatCommand } from "./commands";
import {
  ClearConversationHistory,
  DeleteMessage,
  EndConversation,
  ExecuteChatOperation,
  ResetChatState,
  SearchConversations,
  SearchMessages,
  SendMessage,
  SetActiveConversation,
  SetChatState,
  SetConversationAgent,
  StartConversation,
  UpdateMessage,
} from "./commands";
import {
  ChatManagerAgentError,
  ChatManagerConversationError,
  ChatManagerInitializationError,
  ChatManagerMessageError,
  ChatManagerOperationError,
  ChatManagerSearchError,
  ChatManagerStateError,
  ChatManagerValidationError,
} from "./errors";
import type {
  AgentId,
  ChatManagerConfig,
  ChatManagerState,
  ChatOperation,
  ConversationFilter,
  ConversationId,
  ConversationState,
  MessageFilter,
  MessageId,
  MessageState,
  SearchOptions,
} from "./types";
import { CHAT_MANAGER_CONSTANTS } from "./types";

// Helper function to create a new conversation
function createConversation(command: StartConversation): ConversationState {
  const now = new Date();
  return {
    id: command.conversationId,
    title: command.title || CHAT_MANAGER_CONSTANTS.DEFAULT_CONVERSATION_TITLE,
    status: "active",
    agentId: command.agentId,
    createdAt: now,
    updatedAt: now,
    lastActivity: now,
    messageCount: 0,
    messages: [],
    metadata: {},
    tags: [],
    isArchived: false,
  };
}

// Helper function to create a new message
function createMessage(command: SendMessage): MessageState {
  const now = new Date();
  return {
    id: command.messageId,
    conversationId: command.conversationId,
    role: "user",
    content: command.content,
    status: "sent",
    timestamp: now,
    metadata: {},
    isEdited: false,
    editHistory: [],
  };
}

export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    scoped: Effect.gen(function* () {
      // Initialize chat manager state
      const config = {
        id: "chat-manager",
        name: "ChatManager",
        autoStart: false,
        autoCleanup: true,
        debugMode: false,
        maxOperations: 1000,
        maxConversations: CHAT_MANAGER_CONSTANTS.MAX_CONVERSATIONS,
        maxMessagesPerConversation:
          CHAT_MANAGER_CONSTANTS.MAX_MESSAGES_PER_CONVERSATION,
        autoArchiveAfterDays: CHAT_MANAGER_CONSTANTS.AUTO_ARCHIVE_AFTER_DAYS,
        enableSearch: true,
        searchIndexSize: CHAT_MANAGER_CONSTANTS.SEARCH_INDEX_SIZE,
        messageRetentionDays: CHAT_MANAGER_CONSTANTS.MESSAGE_RETENTION_DAYS,
        enableMessageHistory: true,
        maxMessageHistorySize: CHAT_MANAGER_CONSTANTS.MAX_MESSAGE_HISTORY_SIZE,
      } as const;

      const initialState: ChatManagerState = {
        isInitialized: false,
        isRunning: false,
        isLoading: false,
        lastUpdated: Date.now(),
        operationCount: 0,
        conversations: {},
        activeConversationId: null,
        messageIndex: {},
        conversationsByAgent: {},
        searchIndex: {},
        operationHistory: [],
        currentOperation: null,
        config,
        stats: {
          totalConversations: 0,
          totalMessages: 0,
          activeConversations: 0,
          archivedConversations: 0,
          lastActivity: null,
        },
      };

      // The state of all chat data, held in a Ref
      const stateRef = yield* Ref.make(initialState);

      // A simple, unbounded queue to act as our command bus
      const commandQueue = yield* Queue.unbounded<ChatCommand>();

      // Helper functions
      const updateStats = (state: ChatManagerState): ChatManagerState => {
        const conversations = Object.values(state.conversations);
        const activeConversations = conversations.filter(
          (c) => c.status === "active"
        ).length;
        const archivedConversations = conversations.filter(
          (c) => c.isArchived
        ).length;
        const totalMessages = conversations.reduce(
          (sum, c) => sum + c.messageCount,
          0
        );
        const lastActivity = conversations.reduce((latest, c) => {
          return !latest || c.lastActivity > latest ? c.lastActivity : latest;
        }, null as Date | null);

        return {
          ...state,
          stats: {
            totalConversations: conversations.length,
            totalMessages,
            activeConversations,
            archivedConversations,
            lastActivity,
          },
          lastUpdated: Date.now(),
        };
      };

      const updateSearchIndex = (
        state: ChatManagerState,
        conversation: ConversationState
      ): ChatManagerState => {
        const searchTerms = [
          conversation.title,
          ...conversation.messages.map((m) => m.content),
          ...(conversation.tags || []),
        ];

        const newIndex = { ...state.searchIndex };

        // Add conversation to search index
        for (const term of searchTerms) {
          const words = term.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 2) {
              const existing = newIndex[word] || [];
              if (!existing.includes(conversation.id)) {
                newIndex[word] = [...existing, conversation.id];
              }
            }
          }
        }

        return { ...state, searchIndex: newIndex };
      };

      // The handler logic for each command type
      const handleCommand = (
        command: ChatCommand
      ): Effect.Effect<
        void,
        | ChatManagerStateError
        | ChatManagerConversationError
        | ChatManagerMessageError
        | ChatManagerAgentError
        | ChatManagerSearchError
        | ChatManagerOperationError
      > => {
        switch (command._tag) {
          case "SetChatState":
            return Ref.update(stateRef, (state) =>
              updateStats({
                ...state,
                ...command.updates,
              })
            );

          case "ResetChatState":
            return Ref.set(stateRef, initialState);

          case "StartConversation":
            return Effect.gen(function* () {
              const conversation = createConversation(command);
              yield* Ref.update(stateRef, (state) => {
                const agentConversations =
                  state.conversationsByAgent[command.agentId] || [];
                const updatedState = updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [conversation.id]: conversation,
                  },
                  conversationsByAgent: {
                    ...state.conversationsByAgent,
                    [command.agentId]: [...agentConversations, conversation.id],
                  },
                  activeConversationId: conversation.id,
                });
                return updateSearchIndex(updatedState, conversation);
              });
            });

          case "EndConversation":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const conversation = state.conversations[command.conversationId];
              if (!conversation) {
                return yield* Effect.fail(
                  new ChatManagerConversationError({
                    message: "Conversation not found",
                    conversationId: command.conversationId,
                    operation: "EndConversation",
                  })
                );
              }

              yield* Ref.update(stateRef, (state) => {
                const updatedConversation = {
                  ...conversation,
                  status: "ended" as const,
                  updatedAt: new Date(),
                };

                return updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [command.conversationId]: updatedConversation,
                  },
                  activeConversationId:
                    state.activeConversationId === command.conversationId
                      ? null
                      : state.activeConversationId,
                });
              });
            });

          case "SetActiveConversation":
            return Effect.gen(function* () {
              if (command.conversationId) {
                const state = yield* Ref.get(stateRef);
                if (!state.conversations[command.conversationId]) {
                  return yield* Effect.fail(
                    new ChatManagerConversationError({
                      message: "Conversation not found",
                      conversationId: command.conversationId,
                      operation: "SetActiveConversation",
                    })
                  );
                }
              }

              yield* Ref.update(stateRef, (state) => ({
                ...state,
                activeConversationId: command.conversationId,
                lastUpdated: Date.now(),
              }));
            });

          case "ClearConversationHistory":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const conversation = state.conversations[command.conversationId];
              if (!conversation) {
                return yield* Effect.fail(
                  new ChatManagerConversationError({
                    message: "Conversation not found",
                    conversationId: command.conversationId,
                    operation: "ClearConversationHistory",
                  })
                );
              }

              const now = new Date();
              const updatedConversation = {
                ...conversation,
                messages: [],
                messageCount: 0,
                lastActivity: now,
                updatedAt: now,
              };

              // Remove messages from index
              const messageIds = conversation.messages.map((m) => m.id);
              const updatedMessageIndex = { ...state.messageIndex };
              for (const id of messageIds) {
                delete updatedMessageIndex[id];
              }

              yield* Ref.update(stateRef, (state) => {
                const updatedState = updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [command.conversationId]: updatedConversation,
                  },
                  messageIndex: updatedMessageIndex,
                });
                return updateSearchIndex(updatedState, updatedConversation);
              });
            });

          case "SendMessage":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const conversation = state.conversations[command.conversationId];
              if (!conversation) {
                return yield* Effect.fail(
                  new ChatManagerConversationError({
                    message: "Conversation not found",
                    conversationId: command.conversationId,
                    operation: "SendMessage",
                  })
                );
              }

              const message = createMessage(command);
              const now = new Date();
              const updatedConversation = {
                ...conversation,
                messages: [...conversation.messages, message],
                messageCount: conversation.messageCount + 1,
                lastActivity: now,
                updatedAt: now,
              };

              yield* Ref.update(stateRef, (state) => {
                const updatedState = updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [command.conversationId]: updatedConversation,
                  },
                  messageIndex: {
                    ...state.messageIndex,
                    [message.id]: message,
                  },
                });
                return updateSearchIndex(updatedState, updatedConversation);
              });
            });

          case "UpdateMessage":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const message = state.messageIndex[command.messageId];
              if (!message) {
                return yield* Effect.fail(
                  new ChatManagerMessageError({
                    message: "Message not found",
                    messageId: command.messageId,
                    operation: "UpdateMessage",
                  })
                );
              }

              const now = new Date();
              const updatedMessage = {
                ...message,
                ...command.updates,
                timestamp: now,
              };

              const conversation = state.conversations[message.conversationId];
              const updatedMessages = conversation.messages.map((m) =>
                m.id === command.messageId ? updatedMessage : m
              );
              const updatedConversation = {
                ...conversation,
                messages: updatedMessages,
                lastActivity: now,
                updatedAt: now,
              };

              yield* Ref.update(stateRef, (state) => {
                const updatedState = updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [message.conversationId]: updatedConversation,
                  },
                  messageIndex: {
                    ...state.messageIndex,
                    [command.messageId]: updatedMessage,
                  },
                });
                return updateSearchIndex(updatedState, updatedConversation);
              });
            });

          case "DeleteMessage":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const message = state.messageIndex[command.messageId];
              if (!message) {
                return yield* Effect.fail(
                  new ChatManagerMessageError({
                    message: "Message not found",
                    messageId: command.messageId,
                    operation: "DeleteMessage",
                  })
                );
              }

              const now = new Date();
              const conversation = state.conversations[message.conversationId];
              const updatedMessages = conversation.messages.filter(
                (m) => m.id !== command.messageId
              );
              const updatedConversation = {
                ...conversation,
                messages: updatedMessages,
                messageCount: conversation.messageCount - 1,
                lastActivity: now,
                updatedAt: now,
              };

              const { [command.messageId]: _, ...remainingMessages } =
                state.messageIndex;

              yield* Ref.update(stateRef, (state) => {
                const updatedState = updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [message.conversationId]: updatedConversation,
                  },
                  messageIndex: remainingMessages,
                });
                return updateSearchIndex(updatedState, updatedConversation);
              });
            });

          case "SetConversationAgent":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const conversation = state.conversations[command.conversationId];
              if (!conversation) {
                return yield* Effect.fail(
                  new ChatManagerConversationError({
                    message: "Conversation not found",
                    conversationId: command.conversationId,
                    operation: "SetConversationAgent",
                  })
                );
              }

              const now = new Date();
              const oldAgentId = conversation.agentId;
              const updatedConversation = {
                ...conversation,
                agentId: command.agentId,
                updatedAt: now,
              };

              // Update agent conversation mapping
              const newAgentConversations =
                state.conversationsByAgent[command.agentId] || [];
              const updatedAgentMapping = {
                ...state.conversationsByAgent,
                [command.agentId]: newAgentConversations.includes(
                  command.conversationId
                )
                  ? newAgentConversations
                  : [...newAgentConversations, command.conversationId],
              };

              // Remove from old agent if needed
              if (oldAgentId && oldAgentId !== command.agentId) {
                const oldAgentConversations =
                  state.conversationsByAgent[oldAgentId] || [];
                updatedAgentMapping[oldAgentId] = oldAgentConversations.filter(
                  (id) => id !== command.conversationId
                );
              }

              yield* Ref.update(stateRef, (state) =>
                updateStats({
                  ...state,
                  conversations: {
                    ...state.conversations,
                    [command.conversationId]: updatedConversation,
                  },
                  conversationsByAgent: updatedAgentMapping,
                })
              );
            });

          case "ExecuteChatOperation":
            return Effect.gen(function* () {
              yield* Ref.update(stateRef, (state) => {
                const history = [...state.operationHistory, command.operation];
                const trimmedHistory = history.slice(
                  -CHAT_MANAGER_CONSTANTS.OPERATION_HISTORY_LIMIT
                );
                return updateStats({
                  ...state,
                  operationHistory: trimmedHistory,
                  currentOperation: command.operation,
                });
              });
            });

          case "SearchConversations":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const searchTerms = command.query.toLowerCase().split(/\s+/);
              const matchingConversationIds = new Set<ConversationId>();

              for (const term of searchTerms) {
                const conversationIds = state.searchIndex[term] || [];
                for (const id of conversationIds) {
                  matchingConversationIds.add(id);
                }
              }

              const results = Array.from(matchingConversationIds)
                .map((id) => state.conversations[id])
                .filter(Boolean)
                .sort(
                  (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
                );

              // Record operation in history
              const operation: ChatOperation = {
                type: "search_conversations",
                timestamp: new Date(),
                parameters: { query: command.query },
                result: results.length,
              };

              yield* Ref.update(stateRef, (state) => {
                const history = [...state.operationHistory, operation];
                const trimmedHistory = history.slice(
                  -CHAT_MANAGER_CONSTANTS.OPERATION_HISTORY_LIMIT
                );
                return updateStats({
                  ...state,
                  operationHistory: trimmedHistory,
                  currentOperation: operation,
                });
              });
            });

          case "SearchMessages":
            return Effect.gen(function* () {
              const state = yield* Ref.get(stateRef);
              const conversation = state.conversations[command.conversationId];
              if (!conversation) {
                return yield* Effect.fail(
                  new ChatManagerConversationError({
                    message: "Conversation not found",
                    conversationId: command.conversationId,
                    operation: "SearchMessages",
                  })
                );
              }

              const searchTerms = command.query.toLowerCase().split(/\s+/);
              const matchingMessages = conversation.messages.filter(
                (message) => {
                  const messageText = message.content.toLowerCase();
                  return searchTerms.every((term) =>
                    messageText.includes(term)
                  );
                }
              );

              // Record operation in history
              const operation: ChatOperation = {
                type: "search_messages",
                timestamp: new Date(),
                conversationId: command.conversationId,
                parameters: { query: command.query },
                result: matchingMessages.length,
              };

              yield* Ref.update(stateRef, (state) => {
                const history = [...state.operationHistory, operation];
                const trimmedHistory = history.slice(
                  -CHAT_MANAGER_CONSTANTS.OPERATION_HISTORY_LIMIT
                );
                return updateStats({
                  ...state,
                  operationHistory: trimmedHistory,
                  currentOperation: operation,
                });
              });
            });

          default:
            return Effect.fail(
              new ChatManagerOperationError({
                message: `Unknown command type: ${(command as any)._tag}`,
                operation: "handleCommand",
              })
            );
        }
      };

      // Fork a fiber that continuously takes commands from the queue and processes them
      yield* Effect.forkDaemon(
        Queue.take(commandQueue).pipe(
          Effect.flatMap(handleCommand),
          Effect.forever
        )
      );

      // The public API of the service - implementing the original API with command dispatch
      return {
        // State Management - these should be synchronous for testing
        getState: () => Ref.get(stateRef),
        setState: (updates) =>
          Ref.update(stateRef, (state) =>
            updateStats({
              ...state,
              ...updates,
            })
          ),
        resetState: () => Ref.set(stateRef, initialState),

        // Conversation Management
        startConversation: (agentId, initialMessage) =>
          Effect.gen(function* () {
            const conversationId = `conv_${Date.now()}`;

            // Create and track the operation
            const operation: ChatOperation = {
              type: "start_conversation",
              timestamp: new Date(),
              conversationId,
              agentId,
              parameters: initialMessage ? { initialMessage } : undefined,
            };

            const command = new StartConversation({
              _tag: "StartConversation",
              conversationId,
              agentId,
              title: undefined, // Use default title
            });
            yield* Queue.offer(commandQueue, command);
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");

            // If an initial message is provided, send it
            if (initialMessage) {
              const messageId = `msg_${Date.now()}`;
              const messageCommand = new SendMessage({
                _tag: "SendMessage",
                messageId,
                conversationId,
                content: initialMessage,
              });
              yield* Queue.offer(commandQueue, messageCommand);
              // Wait for the message command to be processed
              yield* Effect.sleep("50 millis");
            }

            // Update the current operation in state
            yield* Ref.update(stateRef, (state) => ({
              ...state,
              currentOperation: operation,
              operationHistory: [...state.operationHistory, operation].slice(
                -CHAT_MANAGER_CONSTANTS.OPERATION_HISTORY_LIMIT
              ),
            }));

            return conversationId;
          }),
        endConversation: (conversationId) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new EndConversation({ _tag: "EndConversation", conversationId })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),
        getConversation: (conversationId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Failed to get conversation",
                  conversationId,
                  operation: "getConversation",
                })
              );
            }
            return conversation;
          }),
        getAllConversations: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return Object.values(state.conversations);
          }),
        getActiveConversation: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return state.activeConversationId
              ? state.conversations[state.activeConversationId] || null
              : null;
          }),
        setActiveConversation: (conversationId) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new SetActiveConversation({
                _tag: "SetActiveConversation",
                conversationId,
              })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),

        // Message Management
        sendMessage: (conversationId, content) =>
          Effect.gen(function* () {
            const messageId = `msg_${Date.now()}`;
            const command = new SendMessage({
              _tag: "SendMessage",
              conversationId,
              content,
              messageId,
            });
            yield* Queue.offer(commandQueue, command);
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
            return messageId;
          }),
        getMessages: (conversationId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "getMessages",
                })
              );
            }
            return conversation.messages;
          }),
        getMessage: (messageId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const message = state.messageIndex[messageId];
            if (!message) {
              return yield* Effect.fail(
                new ChatManagerMessageError({
                  message: "Failed to get message",
                  messageId,
                  operation: "getMessage",
                })
              );
            }
            return message;
          }),
        updateMessage: (messageId, updates) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new UpdateMessage({ _tag: "UpdateMessage", messageId, updates })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),
        deleteMessage: (messageId) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new DeleteMessage({ _tag: "DeleteMessage", messageId })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),

        // Operation Management
        executeOperation: (operation) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new ExecuteChatOperation({
                _tag: "ExecuteChatOperation",
                operation,
              })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
            return operation.result;
          }),
        getLastOperation: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return state.currentOperation;
          }),
        isOperationInProgress: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return state.currentOperation !== null;
          }),

        // Agent Management
        setConversationAgent: (conversationId, agentId) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new SetConversationAgent({
                _tag: "SetConversationAgent",
                conversationId,
                agentId,
              })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),
        getConversationAgent: (conversationId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "getConversationAgent",
                })
              );
            }
            return conversation.agentId;
          }),

        // Conversation History
        getConversationHistory: (conversationId, limit) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "getConversationHistory",
                })
              );
            }
            const messages = conversation.messages;
            return limit ? messages.slice(-limit) : messages;
          }),
        clearConversationHistory: (conversationId) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new ClearConversationHistory({
                _tag: "ClearConversationHistory",
                conversationId,
              })
            );
            // Wait for the command to be processed
            yield* Effect.sleep("50 millis");
          }),
        exportConversation: (conversationId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "exportConversation",
                })
              );
            }

            const exportData = {
              id: conversation.id,
              title: conversation.title,
              status: conversation.status,
              agentId: conversation.agentId,
              createdAt: conversation.createdAt.toISOString(),
              updatedAt: conversation.updatedAt.toISOString(),
              messages: conversation.messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString(),
                agentId: m.agentId,
              })),
            };

            return JSON.stringify(exportData, null, 2);
          }),

        // Search
        searchConversations: (query) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new SearchConversations({ _tag: "SearchConversations", query })
            );
            // Get results from state after command processing
            const state = yield* Ref.get(stateRef);
            const searchTerms = query.toLowerCase().split(/\s+/);
            const matchingConversationIds = new Set<ConversationId>();

            for (const term of searchTerms) {
              const conversationIds = state.searchIndex[term] || [];
              for (const id of conversationIds) {
                matchingConversationIds.add(id);
              }
            }

            return Array.from(matchingConversationIds)
              .map((id) => state.conversations[id])
              .filter(Boolean)
              .sort(
                (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
              );
          }),
        searchMessages: (conversationId, query) =>
          Effect.gen(function* () {
            yield* Queue.offer(
              commandQueue,
              new SearchMessages({
                _tag: "SearchMessages",
                conversationId,
                query,
              })
            );
            // Get results from state after command processing
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "searchMessages",
                })
              );
            }

            const searchTerms = query.toLowerCase().split(/\s+/);
            return conversation.messages.filter((message) => {
              const messageText = message.content.toLowerCase();
              return searchTerms.every((term) => messageText.includes(term));
            });
          }),

        // Statistics
        getConversationStats: (conversationId) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const conversation = state.conversations[conversationId];
            if (!conversation) {
              return yield* Effect.fail(
                new ChatManagerConversationError({
                  message: "Conversation not found",
                  conversationId,
                  operation: "getConversationStats",
                })
              );
            }

            return {
              messageCount: conversation.messageCount,
              lastActivity: conversation.lastActivity,
            };
          }),
        getAllConversationStats: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return state.stats;
          }),

        // Command Bus - NEW: Expose dispatch method
        dispatch: (command) => Queue.offer(commandQueue, command),
      } satisfies ChatManagerApi;
    }),
    dependencies: [],
  }
) {}

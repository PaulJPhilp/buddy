import { Effect, Layer, Ref } from "effect";
import { AgentRegistryService } from "../../services/agent-registry";
import { AgentKitBridge } from "../../services/agentkit-bridge";
import { ChatBridge } from "../../services/chat-bridge";
import { ChatService } from "../../services/chat/service";
import { MdxService } from "../../services/mdx";
import { UrlService } from "../../services/url";
import { WebSocketService } from "../../services/websocket";

import type { ChatManagerApi, ChatManagerState } from "./api";
import {
  ChatInstanceCreationError,
  ChatInstanceNotFoundError,
  ChatManagerOperationError,
  NoChatActiveError,
} from "./errors";
import type { ChatInstanceEntry, ChatInstanceMetadata } from "./types";

export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    scoped: Effect.gen(function* () {
      const instanceId = crypto.randomUUID();
      console.log(
        `[ChatManager] Service construction started, instanceId: ${instanceId}`
      );

      // Central registry of chat instances
      const chatInstancesRef = yield* Ref.make<Map<string, ChatInstanceEntry>>(
        new Map()
      );
      const activeChatRef = yield* Ref.make<string | null>(null);
      const listenersRef = yield* Ref.make<
        Set<(state: ChatManagerState) => void>
      >(new Set());

      // Dependencies for creating new chat instances
      const chatBridge = yield* ChatBridge;
      const configService = yield* UrlService;
      const mdxService = yield* MdxService;
      const webSocketService = yield* WebSocketService;
      const agentRegistryService = yield* AgentRegistryService;
      const agentKitBridge = yield* AgentKitBridge;

      console.log(
        `[ChatManager:${instanceId}] Dependencies injected successfully`
      );

      // Helper: Create service layer for new chat instances
      const createChatServiceLayer = () =>
        Layer.mergeAll(
          ChatBridge.Default,
          UrlService.Default,
          MdxService.Default,
          WebSocketService.Default,
          AgentRegistryService.Default,
          AgentKitBridge.Default,
          ChatService.Default
        );

      // Helper: Update state and notify listeners
      const notifyStateChange = () =>
        Effect.gen(function* () {
          const instances = yield* Ref.get(chatInstancesRef);
          const activeChatId = yield* Ref.get(activeChatRef);
          const listeners = yield* Ref.get(listenersRef);

          const state: ChatManagerState = {
            activeChatId,
            activeChats: Array.from(instances.keys()),
            totalMessages: Array.from(instances.values()).reduce(
              (sum, entry) => sum + entry.metadata.messageCount,
              0
            ),
          };

          console.log(`[ChatManager:${instanceId}] State update:`, {
            activeChatId: state.activeChatId,
            activeChatCount: state.activeChats.length,
            totalMessages: state.totalMessages,
          });

          // Notify all listeners
          yield* Effect.forEach(Array.from(listeners), (listener) =>
            Effect.sync(() => listener(state))
          );
        });

      // Helper: Get or create chat instance
      const getChatInstance = (chatId: string, agentId?: string) =>
        Effect.gen(function* () {
          const instances = yield* Ref.get(chatInstancesRef);
          const existing = instances.get(chatId);

          if (existing) {
            console.log(
              `[ChatManager:${instanceId}] Using existing ChatService for: ${chatId}`
            );
            // Update last active time
            yield* Ref.update(chatInstancesRef, (map) => {
              const newMap = new Map(map);
              const entry = newMap.get(chatId);
              if (entry) {
                newMap.set(chatId, {
                  ...entry,
                  metadata: {
                    ...entry.metadata,
                    lastActiveAt: new Date(),
                  },
                });
              }
              return newMap;
            });
            return existing.service;
          }

          // Create ChatService directly
          console.log(
            `[ChatManager:${instanceId}] Creating new ChatService for: ${chatId}`
          );

          const chatServiceLayer = createChatServiceLayer();

          // Create and initialize the ChatService
          const chatService = yield* ChatService.pipe(
            Effect.provide(chatServiceLayer)
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ChatInstanceCreationError({
                  chatId,
                  message: `Failed to create ChatService for ${chatId}`,
                  cause,
                })
            )
          );

          yield* chatService.initialize(chatId, undefined, agentId).pipe(
            Effect.mapError(
              (cause) =>
                new ChatInstanceCreationError({
                  chatId,
                  message: `Failed to initialize ChatService for ${chatId}`,
                  cause,
                })
            )
          );

          // Create metadata
          const metadata: ChatInstanceMetadata = {
            chatId,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            currentAgentId: agentId,
          };

          const entry: ChatInstanceEntry = {
            service: chatService,
            metadata,
          };

          // Store the instance
          yield* Ref.update(chatInstancesRef, (map) =>
            new Map(map).set(chatId, entry)
          );

          console.log(
            `[ChatManager:${instanceId}] ChatService created successfully for: ${chatId}`
          );

          yield* notifyStateChange();
          return chatService;
        });

      // Helper: Update message count for a chat
      const updateMessageCount = (chatId: string, increment = 1) =>
        Effect.gen(function* () {
          yield* Ref.update(chatInstancesRef, (map) => {
            const newMap = new Map(map);
            const entry = newMap.get(chatId);
            if (entry) {
              newMap.set(chatId, {
                ...entry,
                metadata: {
                  ...entry.metadata,
                  messageCount: entry.metadata.messageCount + increment,
                  lastActiveAt: new Date(),
                },
              });
            }
            return newMap;
          });
        });

      // Core API implementation
      const initializeChatInstance = (chatId: string, agentId?: string) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Initializing chat instance: ${chatId}`
          );
          yield* getChatInstance(chatId, agentId);
          console.log(
            `[ChatManager:${instanceId}] Chat instance initialized: ${chatId}`
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "initializeChatInstance",
                chatId,
                message: `Failed to initialize chat instance ${chatId}`,
                cause,
              })
          )
        );

      const sendMessage = (
        chatId: string,
        content: string,
        attachments?: File[]
      ) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Sending message to chat: ${chatId}`
          );

          // Check if chat instance exists (don't auto-create)
          const instances = yield* Ref.get(chatInstancesRef);
          const existing = instances.get(chatId);

          if (!existing) {
            return yield* Effect.fail(
              new ChatInstanceNotFoundError({
                chatId,
                message: `Cannot send message: Chat instance not found: ${chatId}`,
              })
            );
          }

          const chatService = existing.service;
          yield* chatService.sendMessage(content, attachments);

          // Update both ChatManager metadata and ChatService metadata
          yield* updateMessageCount(chatId);

          // Also update the ChatService metadata to ensure consistency
          const chatState = yield* chatService.getState();
          const updatedChatState = {
            ...chatState,
            metadata: {
              ...chatState.metadata,
              lastActiveAt: new Date(),
            },
          };
          yield* chatService.setState(updatedChatState);

          yield* notifyStateChange();
          console.log(
            `[ChatManager:${instanceId}] Message sent successfully to: ${chatId}`
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "sendMessage",
                chatId,
                message: `Failed to send message to chat ${chatId}`,
                cause,
              })
          )
        );

      const sendMessageToActiveChat = (content: string, attachments?: File[]) =>
        Effect.gen(function* () {
          const activeChatId = yield* Ref.get(activeChatRef);
          if (!activeChatId) {
            return yield* Effect.fail(
              new NoChatActiveError({
                message: "No active chat selected",
                operation: "sendMessageToActiveChat",
              })
            );
          }
          return yield* sendMessage(activeChatId, content, attachments);
        });

      const setActiveChat = (chatId: string) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Setting active chat to: ${chatId}`
          );

          // Check if the chat instance exists (don't create it)
          const instances = yield* Ref.get(chatInstancesRef);
          const existing = instances.get(chatId);

          if (!existing) {
            return yield* Effect.fail(
              new ChatInstanceNotFoundError({
                chatId,
                message: `Cannot set active chat: Chat instance not found: ${chatId}`,
              })
            );
          }

          // Set as active
          yield* Ref.set(activeChatRef, chatId);

          yield* notifyStateChange();
          console.log(
            `[ChatManager:${instanceId}] Active chat set to: ${chatId}`
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "setActiveChat",
                chatId,
                message: `Failed to set active chat to ${chatId}`,
                cause,
              })
          )
        );

      const getChatState = (chatId: string) =>
        Effect.gen(function* () {
          const instances = yield* Ref.get(chatInstancesRef);
          const entry = instances.get(chatId);

          if (!entry) {
            return yield* Effect.fail(
              new ChatInstanceNotFoundError({
                chatId,
                message: `Chat instance not found: ${chatId}`,
              })
            );
          }

          return yield* entry.service.getState().pipe(
            Effect.mapError(
              (cause) =>
                new ChatManagerOperationError({
                  operation: "getChatState",
                  chatId,
                  message: `Failed to get chat state for ${chatId}`,
                  cause,
                })
            )
          );
        });

      const getActiveChatState = () =>
        Effect.gen(function* () {
          const activeChatId = yield* Ref.get(activeChatRef);
          if (!activeChatId) {
            return null;
          }
          return yield* getChatState(activeChatId);
        });

      const getAllActiveChats = () =>
        Effect.gen(function* () {
          const instances = yield* Ref.get(chatInstancesRef);
          return Array.from(instances.keys());
        });

      const closeChatInstance = (chatId: string) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Closing chat instance: ${chatId}`
          );
          const instances = yield* Ref.get(chatInstancesRef);
          const entry = instances.get(chatId);

          if (entry) {
            // Cleanup the chat service
            yield* entry.service.cleanup();

            // Remove from instances map
            yield* Ref.update(chatInstancesRef, (map) => {
              const newMap = new Map(map);
              newMap.delete(chatId);
              return newMap;
            });

            // Clear active chat if it was this one
            const activeChatId = yield* Ref.get(activeChatRef);
            if (activeChatId === chatId) {
              yield* Ref.set(activeChatRef, null);
            }

            yield* notifyStateChange();
            console.log(
              `[ChatManager:${instanceId}] Chat instance closed: ${chatId}`
            );
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "closeChatInstance",
                chatId,
                message: `Failed to close chat instance ${chatId}`,
                cause,
              })
          )
        );

      const switchAgent = (chatId: string, agentId: string) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Switching agent in chat ${chatId} to: ${agentId}`
          );

          // Check if chat instance exists (don't auto-create)
          const instances = yield* Ref.get(chatInstancesRef);
          const existing = instances.get(chatId);

          if (!existing) {
            return yield* Effect.fail(
              new ChatInstanceNotFoundError({
                chatId,
                message: `Cannot switch agent: Chat instance not found: ${chatId}`,
              })
            );
          }

          const chatService = existing.service;

          // Switch agent and handle any errors
          yield* chatService.switchAgent(agentId).pipe(
            Effect.mapError(
              (cause) =>
                new ChatManagerOperationError({
                  operation: "switchAgent",
                  chatId,
                  message: `Failed to switch agent in chat ${chatId} to ${agentId}`,
                  cause,
                })
            )
          );

          // Update ChatService metadata for consistency
          const chatState = yield* chatService.getState();
          const updatedChatState = {
            ...chatState,
            metadata: {
              ...chatState.metadata,
              lastActiveAt: new Date(),
            },
          };
          yield* chatService.setState(updatedChatState);

          // Update ChatManager metadata
          yield* Ref.update(chatInstancesRef, (map) => {
            const newMap = new Map(map);
            const entry = newMap.get(chatId);
            if (entry) {
              newMap.set(chatId, {
                ...entry,
                metadata: {
                  ...entry.metadata,
                  currentAgentId: agentId,
                  lastActiveAt: new Date(),
                },
              });
            }
            return newMap;
          });

          yield* notifyStateChange();
          console.log(
            `[ChatManager:${instanceId}] Agent switched successfully in chat ${chatId} to: ${agentId}`
          );
        });

      const switchAgentInActiveChat = (agentId: string) =>
        Effect.gen(function* () {
          const activeChatId = yield* Ref.get(activeChatRef);
          if (!activeChatId) {
            return yield* Effect.fail(
              new NoChatActiveError({
                message: "No active chat selected",
                operation: "switchAgentInActiveChat",
              })
            );
          }
          return yield* switchAgent(activeChatId, agentId);
        });

      const getState = () =>
        Effect.gen(function* () {
          const instances = yield* Ref.get(chatInstancesRef);
          const activeChatId = yield* Ref.get(activeChatRef);

          return {
            activeChatId,
            activeChats: Array.from(instances.keys()),
            totalMessages: Array.from(instances.values()).reduce(
              (sum, entry) => sum + entry.metadata.messageCount,
              0
            ),
          } satisfies ChatManagerState;
        });

      const subscribe = (listener: (state: ChatManagerState) => void) =>
        Effect.gen(function* () {
          yield* Ref.update(
            listenersRef,
            (listeners) => new Set([...listeners, listener])
          );

          // Immediately send current state
          const currentState = yield* getState();
          yield* Effect.sync(() => listener(currentState));

          // Return unsubscribe function
          return () =>
            Effect.gen(function* () {
              yield* Ref.update(listenersRef, (listeners) => {
                const newListeners = new Set(listeners);
                newListeners.delete(listener);
                return newListeners;
              });
            });
        });

      const clearAllChats = () =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Clearing all chat instances`
          );
          const instances = yield* Ref.get(chatInstancesRef);

          // Cleanup all chat services
          yield* Effect.forEach(
            Array.from(instances.values()),
            (entry) => entry.service.cleanup(),
            { concurrency: "unbounded" }
          );

          // Clear all references
          yield* Ref.set(chatInstancesRef, new Map());
          yield* Ref.set(activeChatRef, null);

          yield* notifyStateChange();
          console.log(`[ChatManager:${instanceId}] All chat instances cleared`);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "clearAllChats",
                message: "Failed to clear all chat instances",
                cause,
              })
          )
        );

      const broadcastMessage = (content: string) =>
        Effect.gen(function* () {
          console.log(
            `[ChatManager:${instanceId}] Broadcasting message to all chats`
          );
          const instances = yield* Ref.get(chatInstancesRef);
          const chatIds = Array.from(instances.keys());

          if (chatIds.length === 0) {
            console.log(
              `[ChatManager:${instanceId}] No active chats for broadcast`
            );
            return;
          }

          // Send to all chats concurrently
          yield* Effect.forEach(
            chatIds,
            (chatId) => sendMessage(chatId, content),
            { concurrency: "unbounded" }
          );

          console.log(
            `[ChatManager:${instanceId}] Message broadcasted to ${chatIds.length} chats`
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                operation: "broadcastMessage",
                message: "Failed to broadcast message",
                cause,
              })
          )
        );

      const getChatHistory = (chatId: string) =>
        Effect.gen(function* () {
          const chatState = yield* getChatState(chatId);
          return chatState.messages;
        });

      const clearChatHistory = (chatId: string) =>
        Effect.gen(function* () {
          // Check if chat instance exists (don't auto-create)
          const instances = yield* Ref.get(chatInstancesRef);
          const existing = instances.get(chatId);

          if (!existing) {
            return yield* Effect.fail(
              new ChatInstanceNotFoundError({
                chatId,
                message: `Cannot clear history: Chat instance not found: ${chatId}`,
              })
            );
          }

          const chatService = existing.service;

          // Clear history and handle any errors
          yield* chatService.clearHistory().pipe(
            Effect.mapError(
              (cause) =>
                new ChatManagerOperationError({
                  operation: "clearChatHistory",
                  chatId,
                  message: `Failed to clear chat history for ${chatId}`,
                  cause,
                })
            )
          );

          // Update ChatService metadata for consistency
          const chatState = yield* chatService.getState();
          const updatedChatState = {
            ...chatState,
            metadata: {
              ...chatState.metadata,
              lastActiveAt: new Date(),
            },
          };
          yield* chatService.setState(updatedChatState);

          // Reset message count in ChatManager metadata
          yield* Ref.update(chatInstancesRef, (map) => {
            const newMap = new Map(map);
            const entry = newMap.get(chatId);
            if (entry) {
              newMap.set(chatId, {
                ...entry,
                metadata: {
                  ...entry.metadata,
                  messageCount: 0,
                  lastActiveAt: new Date(),
                },
              });
            }
            return newMap;
          });

          yield* notifyStateChange();
        });

      console.log(
        `[ChatManager:${instanceId}] Service construction completed successfully`
      );

      // Return the complete API
      return {
        // Message operations
        sendMessage,
        sendMessageToActiveChat,

        // Chat management
        setActiveChat,
        getChatState,
        getActiveChatState,
        getAllActiveChats,
        closeChatInstance,
        initializeChatInstance,

        // Agent operations
        switchAgent,
        switchAgentInActiveChat,

        // State management
        getState,
        subscribe,

        // Advanced operations
        getChatInstance,
        clearAllChats,
        broadcastMessage,

        // History operations
        getChatHistory,
        clearChatHistory,
      } satisfies ChatManagerApi;
    }),
    dependencies: [
      ChatBridge.Default,
      UrlService.Default,
      MdxService.Default,
      WebSocketService.Default,
      AgentRegistryService.Default,
      AgentKitBridge.Default,
    ],
  }
) {}

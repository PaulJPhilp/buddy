import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect, Ref } from "effect";
import type { Message } from "./ChatBubble";
import { ChatBubbleManager } from "./chatbubble-manager";
import type { ChatBubbleAction } from "./chatbubble-manager/api";
import type { ChatBubbleState } from "./chatbubble-manager/types";
import type { ChatAppManagerApi } from "./manager";
import { ChatAppManagerError } from "./manager";
import { ChatAppComponent } from "./service";
import type {
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppUIState,
} from "./types";

export class ChatAppManager extends Effect.Service<ChatAppManagerApi>()(
  "ChatAppManager",
  {
    scoped: Effect.gen(function* () {
      // State refs
      const stateRef = yield* Ref.make<ChatAppComponentState | null>(null);
      const messagesRef = yield* Ref.make<Message[]>([]);
      const agentRef = yield* Ref.make<AgentConfig | null>(null);
      const subscribersRef = yield* Ref.make<
        Set<(state: ChatAppComponentState) => void>
      >(new Set());

      // Compose with ChatAppComponent
      const chatAppComponent = yield* ChatAppComponent;
      // Compose with ChatBubbleManager
      const chatBubbleManager = yield* ChatBubbleManager;

      // Helper: notify subscribers
      const notifySubscribers = (state: ChatAppComponentState) =>
        subscribersRef.pipe(
          Effect.flatMap((subs) =>
            Effect.sync(() => {
              for (const cb of subs) {
                cb(state);
              }
            })
          )
        );

      // Bubble-level API methods (delegation)
      const getBubbleState = (messageId: string) =>
        chatBubbleManager.getBubbleState(messageId);
      const setBubbleState = (
        messageId: string,
        state: Partial<ChatBubbleState>
      ) => chatBubbleManager.setBubbleState(messageId, state);
      const performBubbleAction = (
        messageId: string,
        action: ChatBubbleAction
      ) => chatBubbleManager.performAction(messageId, action);
      const formatBubbleMessage = (message) =>
        chatBubbleManager.formatMessage(message);

      // API implementation
      const api: ChatAppManagerApi = {
        initialize: (config) => {
          const componentConfig: ChatAppComponentConfig = {
            ...config,
            chatAppId: config.id,
          };
          return chatAppComponent.initialize(componentConfig).pipe(
            Effect.flatMap(() => chatAppComponent.getState()),
            Effect.tap((state) =>
              stateRef.pipe(
                Ref.set(state),
                Effect.flatMap(() => notifySubscribers(state))
              )
            ),
            Effect.asVoid,
            Effect.mapError(
              (e) => new ChatAppManagerError("Failed to initialize", e)
            )
          );
        },
        cleanup: () =>
          chatAppComponent.cleanup().pipe(
            Effect.tap(() => stateRef.pipe(Ref.set(null))),
            Effect.asVoid,
            Effect.mapError((e) => new ChatAppManagerError("Cleanup failed", e))
          ),
        sendMessage: (content) =>
          Effect.gen(function* () {
            // Add user message
            const msg: Message = {
              id: Date.now().toString(),
              content,
              sender: "user",
              timestamp: new Date(),
            };
            yield* messagesRef.pipe(Ref.update((msgs) => [...msgs, msg]));
            // (Optional) Could call chatAppComponent for LLM response here
          }).pipe(
            Effect.mapError(
              (e) => new ChatAppManagerError("Send message failed", e)
            )
          ),
        receiveMessage: (message) =>
          messagesRef.pipe(
            Ref.update((msgs) => [...msgs, message]),
            Effect.asVoid,
            Effect.mapError(
              (e) => new ChatAppManagerError("Receive message failed", e)
            )
          ),
        getMessages: () =>
          messagesRef.pipe(
            Ref.get,
            Effect.mapError(
              (e) => new ChatAppManagerError("Get messages failed", e)
            )
          ),
        clearMessages: () =>
          messagesRef.pipe(
            Ref.set([]),
            Effect.asVoid,
            Effect.mapError(
              (e) => new ChatAppManagerError("Clear messages failed", e)
            )
          ),
        getState: () =>
          stateRef.pipe(
            Ref.get,
            Effect.flatMap((state) =>
              state
                ? Effect.succeed(state)
                : Effect.fail(new ChatAppManagerError("State not initialized"))
            ),
            Effect.mapError(
              (e) => new ChatAppManagerError("Get state failed", e)
            )
          ),
        setUIState: (uiState) =>
          stateRef.pipe(
            Ref.update((state) =>
              state
                ? {
                    ...state,
                    uiState: { ...state.uiState, ...uiState },
                  }
                : state
            ),
            Effect.tap(() =>
              stateRef.pipe(
                Ref.get,
                Effect.flatMap((updatedState) =>
                  updatedState ? notifySubscribers(updatedState) : Effect.void
                )
              )
            ),
            Effect.asVoid,
            Effect.mapError(
              (e) => new ChatAppManagerError("Set UI state failed", e)
            )
          ),
        getUIState: () =>
          stateRef.pipe(
            Ref.get,
            Effect.flatMap((state) =>
              state
                ? Effect.succeed(state.uiState)
                : Effect.fail(new ChatAppManagerError("State not initialized"))
            ),
            Effect.mapError(
              (e) => new ChatAppManagerError("Get UI state failed", e)
            )
          ),
        assignAgent: (agent) =>
          agentRef.pipe(
            Ref.set(agent),
            Effect.asVoid,
            Effect.mapError(
              (e) => new ChatAppManagerError("Assign agent failed", e)
            )
          ),
        switchAgent: (agentId) =>
          Effect.gen(function* () {
            // In a real implementation, look up agent by ID
            // For now, just clear agentRef
            yield* agentRef.pipe(Ref.set(null));
          }).pipe(
            Effect.mapError(
              (e) => new ChatAppManagerError("Switch agent failed", e)
            )
          ),
        getCurrentAgent: () =>
          agentRef.pipe(
            Ref.get,
            Effect.mapError(
              (e) => new ChatAppManagerError("Get current agent failed", e)
            )
          ),
        subscribe: (callback) =>
          subscribersRef.pipe(
            Ref.update((subs) => {
              const newSubs = new Set(subs);
              newSubs.add(callback);
              return newSubs;
            }),
            Effect.map(() => () => {
              Effect.runSync(
                subscribersRef.pipe(
                  Ref.update((subs) => {
                    const newSubs = new Set(subs);
                    newSubs.delete(callback);
                    return newSubs;
                  })
                )
              );
            }),
            Effect.mapError(
              (e) => new ChatAppManagerError("Subscribe failed", e)
            )
          ),
        getBubbleState,
        setBubbleState,
        performBubbleAction,
        formatBubbleMessage,
      };
      return api;
    }),
    dependencies: [ChatAppComponent.Default, ChatBubbleManager.Default],
  }
) {}

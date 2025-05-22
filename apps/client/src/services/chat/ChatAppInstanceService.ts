import { Chunk, Context, Effect, HashMap, Layer, Option, Ref } from "effect";
import type { Agent } from "../../features/chat/components/UserArea/AgentToolBar";
import type { AttachmentFile } from "../../features/chat/components/UserArea/AttachmentBar";
import {
  type ChatState,
  type ChatStateApi,
  ChatStateApiTag,
  type MessageApi,
} from "./ChatServiceApi"; // Updated to ChatStateApiTag
import type {
  AgentInstanceId,
  Cents,
  TimestampedAgentError,
  TokenUsage,
} from "./chatInstanceTypes";

// Define the interface for our service
export interface ChatAppInstanceService {
  // Refs for state
  readonly messagesRef: Ref.Ref<Chunk.Chunk<ChatState["messages"][0]>>;
  readonly isTypingRef: Ref.Ref<boolean>;
  readonly isSendingRef: Ref.Ref<boolean>;
  readonly currentErrorRef: Ref.Ref<Option.Option<string>>;
  readonly agentsRef: Ref.Ref<Chunk.Chunk<Agent>>;
  readonly selectedAgentRef: Ref.Ref<string>;
  readonly attachmentsRef: Ref.Ref<Chunk.Chunk<AttachmentFile>>; // Or manage locally in UserArea?
  readonly tokenCostRef: Ref.Ref<TokenUsage>;
  readonly agentErrorHistoryRef: Ref.Ref<Chunk.Chunk<TimestampedAgentError>>;
  readonly threadTitleRef: Ref.Ref<Option.Option<string>>; // Simplified from HashMap for now

  // Core operations
  initialize: (
    initialAgents: Chunk.Chunk<Agent>,
    initialSelectedAgent: string,
  ) => Effect.Effect<void, Error, ChatStateApi>;
  sendMessage: (
    text: string,
    files?: File[],
  ) => Effect.Effect<void, Error, ChatStateApi>;
  setSelectedAgent: (agentId: string) => Effect.Effect<void, Error>;
  // handleRemoveAttachment: (file: File) => Effect.Effect<void, Error>; // If managed here
  dispose: () => Effect.Effect<void, never>;
}

// Create a Tag for the service
export const ChatAppInstanceServiceTag = Context.Tag<ChatAppInstanceService>(
  "@services/ChatAppInstanceServiceTag",
);

// Live implementation / Layer
export const ChatAppInstanceServiceLive = Layer.effect(
  ChatAppInstanceServiceTag,
  Effect.gen(function* (_) {
    // Initialize Refs
    const messagesRef = yield* _(
      Ref.make(Chunk.empty<ChatState["messages"][0]>()),
    );
    const isTypingRef = yield* _(Ref.make(false));
    const isSendingRef = yield* _(Ref.make(false));
    const currentErrorRef = yield* _(Ref.make(Option.none<string>()));
    const agentsRef = yield* _(Ref.make(Chunk.empty<Agent>()));
    const selectedAgentRef = yield* _(Ref.make("")); // Default or require initial
    const attachmentsRef = yield* _(Ref.make(Chunk.empty<AttachmentFile>()));
    const tokenCostRef = yield* _(
      Ref.make<TokenUsage>({ totalTokens: 0, totalCost: 0 as Cents }),
    );
    const agentErrorHistoryRef = yield* _(
      Ref.make(Chunk.empty<TimestampedAgentError>()),
    );
    const threadTitleRef = yield* _(Ref.make(Option.none<string>()));

    // Placeholder for ChatService, will be injected
    const chatService = yield* _(ChatStateApiTag);

    const makeOptimisticUserMessage = (
      text: string,
      files?: File[],
    ): MessageApi => ({
      id: `optimistic-${Date.now()}`,
      text,
      sender: "user" as const,
      timestamp: Date.now(),
      status: "sent" as const,
      // attachments: files?.map(f => ({ id: `file-${Date.now()}`, name: f.name, size: f.size, type: f.type })), // More detailed if needed
      metadata: {
        length: text.length,
        hasAttachments: !!(files && files.length > 0),
        attachedFileCount: files?.length ?? 0,
        fileNames: files?.map((f) => f.name) ?? [],
      },
    });

    // Define methods
    const initialize = (
      initialAgents: Chunk.Chunk<Agent>,
      initialSelectedAgent: string,
    ) =>
      Effect.gen(function* (_) {
        yield* _(Ref.set(agentsRef, initialAgents));
        yield* _(Ref.set(selectedAgentRef, initialSelectedAgent));

        const initialState = yield* _(chatService.getState());
        yield* _(
          Ref.set(messagesRef, Chunk.fromIterable(initialState.messages)),
        );
        yield* _(Ref.set(isTypingRef, initialState.isTyping));
        // TODO: If ChatService exposes a stateStream: Stream<ChatState> or messageStream: Stream<MessageApi>
        // yield* _(Effect.forkScoped(
        //   chatService.stateUpdatesStream.pipe(
        //     Stream.runForEach(newState =>
        //       Ref.set(messagesRef, Chunk.fromIterable(newState.messages)).pipe(
        //         Effect.andThen(Ref.set(isTypingRef, newState.isTyping)),
        //       )
        //     )
        //   )
        // ));
        console.log(
          "ChatAppInstanceService initialized with state:",
          initialState,
        );
      }).pipe(
        Effect.tapErrorTag("NoSuchElementException", () =>
          // This can happen if ChatService is not available in the context
          Effect.logError(
            "ChatService not found in context for ChatAppInstanceService",
          ),
        ),
      );

    const sendMessage = (text: string, files?: File[]) =>
      Effect.gen(function* (_) {
        yield* _(Ref.set(isSendingRef, true));
        yield* _(Ref.set(currentErrorRef, Option.none())); // Clear previous error

        const optimisticMessage = makeOptimisticUserMessage(text, files);
        yield* _(Ref.update(messagesRef, Chunk.append(optimisticMessage)));

        const result = yield* _(
          Effect.either(chatService.sendMessage(text, files)),
        );

        if (result._tag === "Left") {
          // Error
          const error = result.left;
          yield* _(Ref.set(currentErrorRef, Option.some(error.message)));
          const timestampedError: TimestampedAgentError = {
            timestamp: new Date(),
            error: error.message, // Or error object itself if serializable/useful
            message: `Failed to send message: ${error.message}`,
            context: "sendMessage",
          };
          yield* _(
            Ref.update(agentErrorHistoryRef, Chunk.append(timestampedError)),
          );
          // Optionally remove optimistic message or mark as failed
          yield* _(
            Ref.update(messagesRef, (msgs) =>
              Chunk.filter(msgs, (msg) => msg.id !== optimisticMessage.id),
            ),
          );
          // Or update its status:
          // yield* _(Ref.update(messagesRef, msgs => Chunk.map(msgs, msg =>
          //   msg.id === optimisticMessage.id ? { ...msg, status: "failed" as const } : msg
          // )));
        } else {
          // Success
          const assistantMessage = result.right;
          // Replace optimistic message if backend returns user message too, or just add assistant's
          // Assuming sendMessage in API returns only assistant's message:
          yield* _(
            Ref.update(messagesRef, (msgs) =>
              Chunk.filter(msgs, (msg) => msg.id !== optimisticMessage.id),
            ),
          );
          // If ChatService sendMessage confirmed the user message, that would be part of assistantMessage or a separate field
          // For now, re-add a confirmed user message if not part of assistant's response structure
          // yield* _(Ref.update(messagesRef, Chunk.append({...optimisticMessage, id: assistantMessage.id + "-user-ack"}))); // Example if needed
          yield* _(Ref.update(messagesRef, Chunk.append(assistantMessage)));

          // TODO: Update tokenCostRef based on assistantMessage metadata if available
          // const currentTokenCost = yield* _(Ref.get(tokenCostRef));
          // yield* _(Ref.set(tokenCostRef, {
          //   totalTokens: currentTokenCost.totalTokens + (assistantMessage.metadata?.tokens ?? 0),
          //   totalCost: currentTokenCost.totalCost + (assistantMessage.metadata?.costInCents ?? 0),
          // }));

          // Refresh full state from ChatService to get latest typing status etc.
          const latestChatState = yield* _(chatService.getState());
          yield* _(Ref.set(isTypingRef, latestChatState.isTyping));
          // Potentially update messagesRef again if getState has more recent/complete data
          // yield* _(Ref.set(messagesRef, Chunk.fromIterable(latestChatState.messages)));
        }
        yield* _(Ref.set(isSendingRef, false));
      }).pipe(
        Effect.tapErrorTag("NoSuchElementException", () =>
          Effect.logError(
            "ChatStateApiTag not found in context for ChatAppInstanceService.sendMessage",
          ),
        ),
      );

    const setSelectedAgent = (agentId: string) =>
      Effect.gen(function* (_) {
        yield* _(Ref.set(selectedAgentRef, agentId));
        // TODO: If changing agent needs to clear messages or fetch agent-specific context from backend:
        // yield* _(Ref.set(messagesRef, Chunk.empty()));
        // yield* _(chatService.notifyAgentChange(agentId)); // Hypothetical
        // const agentSpecificData = yield* _(chatService.getAgentData(agentId));
        // yield* _(Ref.update(messagesRef, Chunk.append(agentSpecificData.greetingMessage)));
        console.log("Agent selected:", agentId);
      });

    const dispose = () =>
      Effect.sync(() => {
        // TODO: If initialize started any scoped Effects (e.g., stream subscriptions),
        // they should be managed by Effect.forkScoped and will be auto-cleaned.
        // Explicit cleanup for other resources if any.
        console.log("ChatAppInstanceService disposed");
      });

    return ChatAppInstanceServiceTag.of({
      messagesRef,
      isTypingRef,
      isSendingRef,
      currentErrorRef,
      agentsRef,
      selectedAgentRef,
      attachmentsRef,
      tokenCostRef,
      agentErrorHistoryRef,
      threadTitleRef,
      initialize,
      sendMessage,
      setSelectedAgent,
      dispose,
    });
  }),
);

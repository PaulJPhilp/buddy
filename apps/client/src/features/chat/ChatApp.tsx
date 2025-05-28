"use client";

import { ChatService } from "@/services/chat/ChatService";
import type { ChatState } from "@/services/chat/ChatServiceApi";
import { WebSocketService } from "@/services/websocket/WebSocketService";
import type { ChatMessage as AppChatMessage } from "@ui/components/MessageArea";
import { type ToolBarItem } from "@ui/components/ui/toolbar";
import { Effect, Layer, Ref, Runtime, Schedule, Stream } from "effect";
import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import type { MessageApi } from "@/services/chat/ChatServiceApi";
import { AcknowledgmentMessage, ErrorMessage, LLMResponseMessage, LLMStreamMessage, ThinkingStateMessage, isServerMessage } from "@buddy/protocol";
import ChatArea from "./components/ChatArea";
import { HeaderBar } from "./components/HeaderBar";
import UserArea from "./components/UserArea";
import type { Agent } from "./components/UserArea/AgentToolBar";

// Style constants for reusable classes
const STYLE_CONSTANTS = {
  container:
    "h-full p-0.5 flex flex-col relative bg-background text-foreground min-h-0 max-w-6xl mx-auto w-full",
  innerContainer:
    "flex-1 border rounded-lg border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200",
  chatAreaWrapper:
    "flex-grow overflow-hidden transition-all duration-200 ease-in-out",
};

export interface ChatAppProps {
  // App name
  appName: string;

  // Active state
  isActive?: boolean;
  onActivate?: () => void;

  // Theme colors
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;

  // Messages
  isTyping?: boolean;
  isSending?: boolean;
  error?: string | null;

  // Agents
  agents: Agent[];
  selectedAgent: string;
  onSelectedAgentChange: (agentId: string) => void | Promise<void>;

  // Actions
  onSendMessage: (text: string, files?: File[]) => void | Promise<void>;

  // Toolbar configurations
  messageToolbarConfig?: (message: ChatState["messages"][0]) => ToolBarItem[];
  agentToolbarConfig?: (agent: Agent) => ToolBarItem[];
  minimalInputToolbarConfig?: ToolBarItem[];
}

export default function ChatApp(props: ChatAppProps) {
  const {
    appName: appNameProp,
    isActive = false,
    onActivate,
    primaryColor,
    secondaryColor,
    activePrimaryColor,
    activeSecondaryColor,
    messageToolbarConfig,
    agentToolbarConfig,
    minimalInputToolbarConfig,
    isTyping,
    isSending,
    error,
    agents,
    selectedAgent,
    onSelectedAgentChange,
    onSendMessage: onSendMessageProp,
  } = props;

  // Effect Runtime and state
  const [runtime] = useState(() => Runtime.defaultRuntime);
  const [displayMessages, setDisplayMessages] = useState<AppChatMessage[]>([]);

  // Use the global WebSocket service instance and ChatService
  const [webSocketLayer] = useState(() => WebSocketService.Default);
  const [chatServiceLayer] = useState(() => ChatService.Default);

  // New Refs and state for attachments and errors
  const [attachedFilesRef] = useState(() => Effect.runSync(Ref.make<File[]>([])));
  const [displayAttachedFiles, setDisplayAttachedFiles] = useState<File[]>([]);
  const [errorRef] = useState(() => Effect.runSync(Ref.make<string | null>(null)));
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Add typing state
  const [isLocalTyping, setIsLocalTyping] = useState(false);

  // Add connection state
  const [isConnected, setIsConnected] = useState(false);

  // Add streaming state
  const [streamingMessageRef] = useState(() => Effect.runSync(Ref.make<AppChatMessage | null>(null)));
  const [displayStreamingMessage, setDisplayStreamingMessage] = useState<AppChatMessage | null>(null);

  const handleFileAdd = useCallback(
    (newFiles: File[]) => {
      const effect = Effect.gen(function* () {
        const currentFiles = yield* Ref.get(attachedFilesRef);
        const filesToAdd = newFiles.filter(
          (nf) => !currentFiles.some((cf) => cf.name === nf.name && cf.lastModified === nf.lastModified)
        );
        if (filesToAdd.length > 0) {
          const updatedFiles = [...currentFiles, ...filesToAdd];
          yield* Ref.set(attachedFilesRef, updatedFiles);
          setDisplayAttachedFiles(updatedFiles);
        }
      });
      Runtime.runFork(runtime)(effect);
    },
    [runtime, attachedFilesRef]
  );

  const handleFileRemove = useCallback(
    (fileToRemove: File) => {
      const effect = Effect.gen(function* () {
        const currentFiles = yield* Ref.get(attachedFilesRef);
        const updatedFiles = currentFiles.filter(
          (f) => !(f.name === fileToRemove.name && f.lastModified === fileToRemove.lastModified)
        );
        if (updatedFiles.length !== currentFiles.length) {
          yield* Ref.set(attachedFilesRef, updatedFiles);
          setDisplayAttachedFiles(updatedFiles);
        }
      });
      Runtime.runFork(runtime)(effect);
    },
    [runtime, attachedFilesRef]
  );

  const handleUserSubmit = useCallback(
    async (text: string, files?: File[]) => {
      if (!text.trim() && (!files || files.length === 0)) {
        return;
      }

      if (!isConnected) {
        setDisplayError("Not connected to server. Please wait for connection.");
        return;
      }

      const effect = Effect.gen(function* () {
        // Use ChatService to send message
        const chatService = yield* ChatService;
        const message = yield* chatService.sendMessage(text, files);

        console.log("[ChatApp] Message sent via ChatService:", message);

        // Update display messages directly
        const updatedChatState = yield* chatService.getState();
        const updatedAppMessages: AppChatMessage[] = updatedChatState.messages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          isUser: msg.sender === "user",
          timestamp: new Date(msg.timestamp),
        }));
        yield* Effect.sync(() => setDisplayMessages(updatedAppMessages));

        // Clear attached files
        yield* Ref.set(attachedFilesRef, []);
        setDisplayAttachedFiles([]);

        // Call the original prop for external handling
        if (onSendMessageProp) {
          onSendMessageProp(text, files);
        }
      }).pipe(
        Effect.provide(chatServiceLayer),
        Effect.catchAll((err) => Effect.gen(function* () {
          console.error("Error sending message:", err);
          yield* Effect.sync(() => setDisplayError((err as any)?.message ?? String(err)));
          return yield* Effect.succeed(void 0);
        }))
      );

      await Runtime.runPromise(runtime)(effect as Effect.Effect<void, never, never>);
    },
    [runtime, attachedFilesRef, onSendMessageProp, isConnected, chatServiceLayer]
  );

  // Set up ChatService state monitoring and WebSocket message handling
  useEffect(() => {
    const effect = Effect.gen(function* () {
      console.log("[ChatApp] Setting up ChatService and WebSocket connection");
      const chatService = yield* ChatService;
      const ws = yield* WebSocketService;

      // Create a Ref to track current stream ID within the Effect
      const currentStreamIdRef = yield* Ref.make<string | null>(null);

      // Connect with retries
      yield* Effect.retry(
        Effect.gen(function* () {
          console.log("[ChatApp] Attempting WebSocket connection...");
          yield* ws.connect(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080");
          console.log("[ChatApp] WebSocket connected successfully");
          yield* Effect.sync(() => setIsConnected(true));
          yield* Effect.sync(() => setDisplayError(null)); // Clear any previous errors
          return yield* Effect.succeed(void 0);
        }),
        Schedule.recurs(3)
      ).pipe(
        Effect.catchAll(error => Effect.gen(function* () {
          console.error("[ChatApp] Failed to establish WebSocket connection:", error);
          yield* Effect.sync(() => setIsConnected(false));

          // Provide more specific error messages
          const errorMessage = error instanceof Error
            ? error.message.includes("CONNECT_ERROR")
              ? "Cannot connect to server. Please ensure the server is running on port 8080."
              : error.message.includes("timeout")
                ? "Connection timeout. Please check your network connection."
                : `Connection failed: ${error.message}`
            : "Failed to connect to server. Please try again.";

          yield* Effect.sync(() => setDisplayError(errorMessage));
          return Effect.succeed(void 0);
        }))
      );

      // Get initial ChatService state
      const initialChatState = yield* chatService.getState();
      const initialAppMessages: AppChatMessage[] = initialChatState.messages.map((msg) => ({
        id: msg.id,
        text: msg.text,
        isUser: msg.sender === "user",
        timestamp: new Date(msg.timestamp),
      }));

      yield* Effect.sync(() => {
        setDisplayMessages(initialAppMessages);
        setIsLocalTyping(initialChatState.isTyping);
      });

      // Handle WebSocket messages
      return yield* Stream.runForEach(
        ws.receive(),
        (protocolMessage) => Effect.gen(function* () {
          console.log("[ChatApp] Received protocol message:", protocolMessage);

          if (!isServerMessage(protocolMessage)) {
            console.warn("[ChatApp] Received non-server message, ignoring:", protocolMessage);
            return yield* Effect.succeed(void 0);
          }

          // Handle different message types
          switch (protocolMessage.type) {
            case "LLM_RESPONSE": {
              const llmMessage = protocolMessage as LLMResponseMessage;
              console.log("[ChatApp] Processing LLM_RESPONSE:", llmMessage);

              // Clear typing state when we get a response
              yield* chatService.setTyping(false);
              yield* Effect.sync(() => setIsLocalTyping(false));

              if (llmMessage.content) {
                // Add assistant message to ChatService
                yield* chatService.addAssistantMessage(llmMessage.content);
                console.log("[ChatApp] Added LLM response to ChatService");

                // Update display messages directly
                const updatedChatState = yield* chatService.getState();
                const updatedAppMessages: AppChatMessage[] = updatedChatState.messages.map((msg) => ({
                  id: msg.id,
                  text: msg.text,
                  isUser: msg.sender === "user",
                  timestamp: new Date(msg.timestamp),
                }));
                yield* Effect.sync(() => setDisplayMessages(updatedAppMessages));
              }
              break;
            }

            case "LLM_STREAM": {
              const streamMessage = protocolMessage as LLMStreamMessage;

              if (streamMessage.isComplete) {
                // Stream is complete, finalize the message
                const currentStreamingMessage = yield* Ref.get(streamingMessageRef);
                if (currentStreamingMessage) {
                  // Add the completed streaming message to ChatService
                  yield* chatService.addAssistantMessage(currentStreamingMessage.text);
                  console.log("[ChatApp] Added completed stream to ChatService:", currentStreamingMessage.text);

                  // Update display messages directly
                  const updatedChatState = yield* chatService.getState();
                  const updatedAppMessages: AppChatMessage[] = updatedChatState.messages.map((msg) => ({
                    id: msg.id,
                    text: msg.text,
                    isUser: msg.sender === "user",
                    timestamp: new Date(msg.timestamp),
                  }));
                  yield* Effect.sync(() => setDisplayMessages(updatedAppMessages));

                  // Clear streaming state
                  yield* Ref.set(streamingMessageRef, null);
                  yield* Effect.sync(() => setDisplayStreamingMessage(null));
                  yield* Ref.set(currentStreamIdRef, null);
                  yield* chatService.setTyping(false);
                  yield* Effect.sync(() => setIsLocalTyping(false));
                }
              } else {
                // Handle streaming chunk
                const streamId = streamMessage.streamId || 'default';
                const currentStreamId = yield* Ref.get(currentStreamIdRef);

                // If this is a new stream, create a new message
                if (currentStreamId !== streamId) {
                  const newStreamingMessage: AppChatMessage = {
                    id: nanoid(),
                    text: streamMessage.content,
                    isUser: false,
                    timestamp: new Date(),
                  };
                  yield* Ref.set(streamingMessageRef, newStreamingMessage);
                  yield* Effect.sync(() => setDisplayStreamingMessage(newStreamingMessage));
                  yield* Ref.set(currentStreamIdRef, streamId);
                  yield* chatService.setTyping(false); // Stop typing indicator when streaming starts
                } else {
                  // Append to existing streaming message
                  const currentStreamingMessage = yield* Ref.get(streamingMessageRef);
                  if (currentStreamingMessage) {
                    const updatedMessage = {
                      ...currentStreamingMessage,
                      text: currentStreamingMessage.text + streamMessage.content
                    };
                    yield* Ref.set(streamingMessageRef, updatedMessage);
                    yield* Effect.sync(() => setDisplayStreamingMessage(updatedMessage));
                  }
                }
              }
              break;
            }

            case "ACK": {
              const ackMessage = protocolMessage as AcknowledgmentMessage;
              if (ackMessage.status === "PROCESSING") {
                // Update UI to show thinking state when LLM is processing
                yield* chatService.setTyping(true);
                yield* Effect.sync(() => setIsLocalTyping(true));
              }
              break;
            }

            case "THINKING": {
              const thinkingMessage = protocolMessage as ThinkingStateMessage;
              yield* chatService.setTyping(thinkingMessage.isThinking);
              yield* Effect.sync(() => setIsLocalTyping(thinkingMessage.isThinking));
              break;
            }

            case "ERROR": {
              const errorMessage = protocolMessage as ErrorMessage;
              // Handle error state and clear typing
              yield* chatService.setTyping(false);
              yield* Effect.sync(() => setIsLocalTyping(false));
              yield* Effect.sync(() => setDisplayError(errorMessage.message));
              break;
            }

            case "WELCOME": {
              console.log("[ChatApp] Received welcome message:", protocolMessage);
              // Could show a welcome notification or update connection status
              break;
            }

            default: {
              console.warn("[ChatApp] Unknown message type:", protocolMessage);
              break;
            }
          }

          return yield* Effect.succeed(void 0);
        })
      );
    }).pipe(
      Effect.provide(Layer.merge(chatServiceLayer, webSocketLayer)),
      Effect.catchAll(error => {
        console.error("ChatApp error:", error);
        setIsConnected(false);

        // Provide more specific error messages based on error type
        const errorMessage = error instanceof Error
          ? error.message.includes("WebSocket not connected")
            ? "Connection lost. Attempting to reconnect..."
            : error.message.includes("RECEIVE_ERROR")
              ? "Error receiving messages. Connection may be unstable."
              : `ChatApp error: ${error.message}`
          : "Connection lost. Please refresh to reconnect.";

        setDisplayError(errorMessage);
        return Effect.succeed(void 0);
      })
    );

    Runtime.runFork(runtime)(effect as Effect.Effect<undefined, never, never>);

    return () => {
      const cleanup = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.disconnect();
        yield* Effect.sync(() => setIsConnected(false));
        return yield* Effect.succeed(void 0);
      }).pipe(
        Effect.provide(webSocketLayer),
        Effect.catchAll((error) => Effect.gen(function* () {
          console.error("Error during cleanup:", error);
          return yield* Effect.succeed(void 0);
        }))
      );

      Runtime.runPromise(runtime)(cleanup as Effect.Effect<undefined, never, never>);
    };
  }, [runtime, chatServiceLayer, webSocketLayer, streamingMessageRef]);

  const headerProps = {
    title: appNameProp || "Buddy Chat",
    errorInfo: displayError
      ? { message: displayError, severity: "error" as const }
      : undefined,
    isSelected: isActive,
    statusInfo: undefined,
    onToggleStatusPanel: () => { },
    primaryColor: isActive ? activePrimaryColor : primaryColor,
    secondaryColor: isActive ? activeSecondaryColor : secondaryColor,
  };

  const { theme } = useTheme();

  const mapAppMessagesToApiMessages = (
    appMessages: AppChatMessage[],
    streamingMessage?: AppChatMessage | null,
  ): MessageApi[] => {
    const allMessages = streamingMessage
      ? [...appMessages, streamingMessage]
      : appMessages;

    console.log("[ChatApp] Mapping messages:", {
      appMessagesCount: appMessages.length,
      hasStreamingMessage: !!streamingMessage,
      totalMessages: allMessages.length
    });

    const mapped = allMessages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.isUser ? ("user" as const) : ("assistant" as const),
      timestamp: typeof msg.timestamp === 'number'
        ? msg.timestamp
        : msg.timestamp instanceof Date
          ? msg.timestamp.getTime()
          : Date.parse(msg.timestamp),
    }));

    console.log("[ChatApp] Mapped messages:", mapped);
    return mapped;
  };

  return (
    <div
      className={STYLE_CONSTANTS.container}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Space") {
          e.preventDefault();
          onActivate?.();
        }
      }}
    >
      <div className={STYLE_CONSTANTS.innerContainer}>
        <HeaderBar {...headerProps} />
        <div className={STYLE_CONSTANTS.chatAreaWrapper}>
          <ChatArea
            messages={mapAppMessagesToApiMessages(displayMessages, displayStreamingMessage)}
            isTyping={isLocalTyping}
            className="flex-1"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            activePrimaryColor={activePrimaryColor}
            activeSecondaryColor={activeSecondaryColor}
            assistantMessageToolbarConfig={messageToolbarConfig}
          />
        </div>
        <UserArea
          onSendMessage={handleUserSubmit}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectedAgentChange={onSelectedAgentChange}
          currentAttachments={displayAttachedFiles}
          onRemoveAttachment={handleFileRemove}
          onAddAttachments={handleFileAdd}
          disabled={isSending}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activePrimaryColor={activePrimaryColor}
          activeSecondaryColor={activeSecondaryColor}
          agentToolbarConfig={agentToolbarConfig}
          minimalInputToolbarConfig={minimalInputToolbarConfig}
        />
      </div>
    </div>
  );
}

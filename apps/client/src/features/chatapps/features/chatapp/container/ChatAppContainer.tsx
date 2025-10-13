import { useEffectContext } from "@/components/EffectProvider";
import { useChatAppsManager } from "@/features/chatapps/hooks/useChatAppsManager";
import type {
  ChatAppInstance,
  ChatMessage,
} from "@/features/chatapps/managers/chatapps/types";
import { Effect } from "effect";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatAppUI } from "../components/ChatAppUI";
import { useContextEngineeringManager } from "../hooks/useContextEngineeringManager";

export interface ChatAppContainerProps {
  instance: ChatAppInstance;
  className?: string;
}

export function ChatAppContainer({
  instance,
  className = "",
}: ChatAppContainerProps) {
  const { runWithServices } = useEffectContext();
  const {
    sendMessage,
    clearChat,
    expandChatApp,
    compactChatApp,
    stashChatApp,
    archiveChatApp,
    restoreChatApp,
    closeChatApp,
  } = useChatAppsManager(instance.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isContextEngineeringOpen, setIsContextEngineeringOpen] =
    useState(false);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [scrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setUserScrollingWithTimeout = useCallback(() => {
    setIsUserScrolling(true);

    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }

    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      userScrollTimeoutRef.current = null;
    }, 1000);
  }, []);

  const {
    initialize: initializeContextEngineering,
    isInitialized: isContextEngineeringInitialized,
    stats: contextStats,
    getFinalContext,
  } = useContextEngineeringManager();

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsLoading(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: text,
          role: "user",
          timestamp: new Date(),
        },
      ]);

      await runWithServices(
        sendMessage(instance.id, text),
        Effect.catchAll((e) => {
          console.error("Failed to send message:", e);
          return Effect.succeed(null);
        }),
      );
      setIsLoading(false);
    },
    [instance.id, runWithServices, sendMessage],
  );

  const handleExpand = useCallback(async () => {
    await runWithServices(expandChatApp(instance.id));
  }, [instance.id, runWithServices, expandChatApp]);

  const handleCompact = useCallback(async () => {
    await runWithServices(compactChatApp(instance.id));
  }, [instance.id, runWithServices, compactChatApp]);

  const handleStash = useCallback(async () => {
    await runWithServices(stashChatApp(instance.id));
  }, [instance.id, runWithServices, stashChatApp]);

  const handleArchive = useCallback(async () => {
    await runWithServices(archiveChatApp(instance.id));
  }, [instance.id, runWithServices, archiveChatApp]);

  const handleRestore = useCallback(async () => {
    await runWithServices(restoreChatApp(instance.id));
  }, [instance.id, runWithServices, restoreChatApp]);

  const handleClose = useCallback(async () => {
    await runWithServices(closeChatApp(instance.id));
  }, [instance.id, runWithServices, closeChatApp]);

  const handleClear = useCallback(async () => {
    await runWithServices(
      clearChat(instance.id),
      Effect.tap(() => setMessages([])),
      Effect.catchAll((e) => {
        console.error("Failed to clear chat:", e);
        return Effect.succeed(null);
      }),
    );
  }, [instance.id, runWithServices, clearChat]);

  return (
    <ChatAppUI
      instance={instance}
      messages={messages}
      isLoading={isLoading}
      showTimestamps={showTimestamps}
      isContextEngineeringOpen={isContextEngineeringOpen}
      scrollableAreaRef={scrollableAreaRef}
      isNearBottom={isNearBottom}
      scrollThumbPosition={scrollThumbPosition}
      scrollThumbHeight={scrollThumbHeight}
      isDragging={isDragging}
      isUserScrolling={isUserScrolling}
      setUserScrollingWithTimeout={setUserScrollingWithTimeout}
      onSendMessage={handleSendMessage}
      onToggleTimestamps={() => setShowTimestamps((prev) => !prev)}
      onToggleContextEngineering={() =>
        setIsContextEngineeringOpen((prev) => !prev)
      }
      onSetScrollThumbPosition={setScrollThumbPosition}
      onSetIsDragging={setIsDragging}
      onExpand={handleExpand}
      onCompact={handleCompact}
      onStash={handleStash}
      onArchive={handleArchive}
      onRestore={handleRestore}
      onClose={handleClose}
      onClear={handleClear}
      className={className}
      contextEngineering={{
        initialize: initializeContextEngineering,
        isInitialized: isContextEngineeringInitialized,
        stats: contextStats,
        getFinalContext,
      }}
    />
  );
}

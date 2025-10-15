import { useEffectContext } from "@/components/EffectProvider";
import { useChatAppsManager } from "@/features/chatapps/hooks/useChatAppsManager";
import type {
  ChatAppInstance,
  ChatMessage,
} from "@/features/chatapps/manager/types";
import { Effect } from "effect";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatAppUI } from "../components/ChatAppUI";
import { useContextEngineeringManager } from "../features/context-engineering/hooks/useContextEngineeringManager";

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
    addChatAppMessage,
    clearChatAppMessages,
    expandChatApp,
    compactChatApp,
    stashChatApp,
    archiveChatApp,
    restoreChatApp,
    closeChatApp,
  } = useChatAppsManager();

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
          sender: "user",
        },
      ]);

      await addChatAppMessage(instance.id, {
        id: new Date().toString(),
        content: text,
        role: "user",
        timestamp: Date.now(),
      } as any);
      setIsLoading(false);
    },
    [instance.id, addChatAppMessage],
  );

  const handleExpand = useCallback(async () => {
    await expandChatApp(instance.id);
  }, [instance.id, expandChatApp]);

  const handleCompact = useCallback(async () => {
    await compactChatApp(instance.id);
  }, [instance.id, compactChatApp]);

  const handleStash = useCallback(async () => {
    await stashChatApp(instance.id);
  }, [instance.id, stashChatApp]);

  const handleArchive = useCallback(async () => {
    await archiveChatApp(instance.id);
  }, [instance.id, archiveChatApp]);

  const handleRestore = useCallback(async () => {
    await restoreChatApp(instance.id);
  }, [instance.id, restoreChatApp]);

  const handleClose = useCallback(async () => {
    await closeChatApp(instance.id);
  }, [instance.id, closeChatApp]);

  const handleClear = useCallback(async () => {
    await clearChatAppMessages(instance.id);
    setMessages([]);
  }, [instance.id, clearChatAppMessages]);

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
        initialize: () => Effect.gen(function* () {
          yield* Effect.promise(() => initializeContextEngineering(instance.id));
        }),
        isInitialized: isContextEngineeringInitialized,
        stats: contextStats,
        getFinalContext: (question: string) => Effect.gen(function* () {
          const result = yield* Effect.promise(() => getFinalContext(question, []));
          return String(result);
        }),
      }}
    />
  );
}

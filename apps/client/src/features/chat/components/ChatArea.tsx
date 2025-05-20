import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Copy, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-react';
import { ChatBubble } from '@ui/components/chat/ChatBubble';
import { ToolBar, type ToolBarItem } from '@ui/components/ui/toolbar';
import type { ChatState } from '@/services/chat/ChatServiceApi';
import { cn } from '@ui/lib/utils';
import { Button } from '@ui/components/ui/button';
import { Skeleton } from '@ui/components/ui/skeleton';

export interface ChatAreaProps {
  messages: ChatState['messages'];
  isTyping?: boolean;
  isLoadingHistory?: boolean;
  className?: string;
  userBubbleColor?: string;
  userTextColor?: string;
  onLoadMoreMessages?: () => void;
  onMessageFeedback?: (messageId: string, type: 'thumbsUp' | 'thumbsDown') => void;
  onMessageCopy?: (messageId: string) => void;
  onMessageRead?: (messageId: string) => void;
  assistantMessageToolbarConfig?: (message: ChatState['messages'][0]) => ToolBarItem[];
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isTyping,
  isLoadingHistory,
  className,
  userBubbleColor,
  userTextColor,
  onLoadMoreMessages,
  onMessageFeedback,
  onMessageCopy,
  onMessageRead,
  assistantMessageToolbarConfig,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
}) => {
  // State for scroll-to-bottom button visibility
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollableAreaRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollableAreaRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(scrolledToBottom);
    setShowScrollButton(!scrolledToBottom);

    // Check if we're near the top and should load more messages
    if (scrollTop < 100 && onLoadMoreMessages && !isLoadingHistory) {
      onLoadMoreMessages();
    }
  };

  // Scroll to bottom handler
  const scrollToBottom = () => {
    if (scrollableAreaRef.current) {
      scrollableAreaRef.current.scrollTo({
        top: scrollableAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollableAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom for new messages if we're already near the bottom
  useEffect(() => {
    if (scrollableAreaRef.current && isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isTyping, isNearBottom]);

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollableAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={scrollableAreaRef}
        className={cn(
          'flex-1 overflow-y-auto p-4 space-y-4',
          isLoadingHistory && 'opacity-80',
          className
        )}
        role="log"
        aria-live="polite"
      >
        {/* Loading History Indicator */}
        {isLoadingHistory && (
          <div className="flex flex-col space-y-2 mb-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        )}

        {messages.map((msg) => {
          // Generate toolbar items for assistant messages
          const toolbarItems = msg.sender === "assistant" ? (
            assistantMessageToolbarConfig?.(msg) || [
              {
                id: `thumbs-up-${msg.id}`,
                icon: <ThumbsUp className="h-4 w-4" />,
                action: () => onMessageFeedback?.(msg.id, 'thumbsUp'),
                tooltip: 'Helpful',
                intent: 'primary'
              },
              {
                id: `thumbs-down-${msg.id}`,
                icon: <ThumbsDown className="h-4 w-4" />,
                action: () => onMessageFeedback?.(msg.id, 'thumbsDown'),
                tooltip: 'Not Helpful',
                intent: 'secondary'
              },
              { id: `spacer-${msg.id}`, type: 'spacer-expand' },
              {
                id: `copy-${msg.id}`,
                icon: <Copy className="h-4 w-4" />,
                action: () => onMessageCopy?.(msg.id),
                tooltip: 'Copy to Clipboard'
              },
              {
                id: `read-${msg.id}`,
                icon: <Volume2 className="h-4 w-4" />,
                action: () => onMessageRead?.(msg.id),
                tooltip: 'Read Aloud'
              }
            ]
          ) : [];

          return (
            <div
              key={msg.id}
              className={cn(
                'group relative w-full flex',
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className="relative max-w-[80%]">
                <ChatBubble
                  content={msg.text}
                  role={msg.sender}
                  userBubbleColor={msg.sender === 'user' ? userBubbleColor : undefined}
                  userTextColor={msg.sender === 'user' ? userTextColor : undefined}
                />
                {msg.sender === "assistant" && toolbarItems.length > 0 && (
                  <div className="absolute left-0 bottom-0 translate-y-full pt-1 w-full">
                    <ToolBar
                      commands={toolbarItems}
                      variant="tiny"
                      className="w-full justify-start bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      activePrimaryColor={activePrimaryColor}
                      activeSecondaryColor={activeSecondaryColor}
                    />
                  </div>
                )}
                {msg.timestamp && (
                  <div className="absolute right-0 bottom-0 translate-y-full pt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 text-sm rounded-lg bg-muted text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-90 hover:opacity-100"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ChatArea;

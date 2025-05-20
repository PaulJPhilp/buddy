import React, { useCallback, useEffect } from 'react';
import { Effect, pipe } from 'effect';
import { HeaderBar, type StatusInfo } from './components/HeaderBar';
import { ChatService } from '@/services/chat/ChatService';
import type { ChatState } from '@/services/chat/ChatServiceApi';
import ChatArea from './components/ChatArea';
import UserArea, { type UserAreaProps } from './components/UserArea';
import type { AttachmentFile } from './components/UserArea/AttachmentBar';
import type { Agent } from './components/UserArea/AgentToolBar';
import { useAppShellStore } from '@/stores/appShellStore';

// Style constants for reusable classes
const STYLE_CONSTANTS = {
  container: "h-full p-2 sm:p-4 md:p-6 flex flex-col relative bg-background text-foreground min-h-0 max-w-7xl mx-auto w-full",
  innerContainer: "flex-1 border rounded-lg border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200",
  chatAreaWrapper: "flex-grow overflow-hidden transition-all duration-200 ease-in-out"
};

export interface ChatAppProps {
  // App name
  appName: string;

  // Theme colors
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;

  // Messages
  messages: ChatState['messages'];
  isTyping?: boolean;
  isSending?: boolean;
  error?: string | null;

  // Agents
  agents: Agent[];
  selectedAgent: string;
  onSelectedAgentChange: (agentId: string) => void;

  // Actions
  onSendMessage: (text: string, files?: File[]) => Promise<void>;

  // Rating toolbar
  hasRatingToolbar?: boolean;
  onRateMessage?: (messageId: string, rating: 'up' | 'down') => void;
}

export default function ChatApp({
  appName: appNameProp,
  primaryColor,                 // Renamed
  secondaryColor,               // Renamed
  activePrimaryColor,           // Renamed
  activeSecondaryColor,         // Renamed
  hasRatingToolbar,
  onRateMessage,
}: ChatAppProps) {
  // Create a wrapper for setSelectedAgent that matches React's setState type
  const handleAgentChange: React.Dispatch<React.SetStateAction<string>> = (value) => {
    if (typeof value === 'function') {
      const newValue = value(selectedAgent);
      setSelectedAgent(newValue);
    } else {
      setSelectedAgent(value);
    }
  };

  const {
    messages,
    addMessage,
    error,
    setError,
    isTyping,
    setIsTyping,
    isSending,
    setIsSending,
    attachments,
    setAttachments,
    removeAttachment,
    selectedAgent,
    setSelectedAgent,
    agents,
    isStatusPanelOpen,
    setIsStatusPanelOpen,
    statusInfo,
    sendMessage
  } = useAppShellStore();

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  // Load initial data
  useEffect(() => {
    // TODO: Load initial messages and agent list from API
    return () => {};
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setIsTyping(false);
      setIsSending(false);
    };
  }, []);

  const handleSendMessage = useCallback(async (text: string, files?: File[]) => {
    if (!text.trim() && (!files || files.length === 0)) {
      // Optionally set an error if trying to send empty with no files
      // setError("Cannot send an empty message without attachments.");
      return;
    }

    await sendMessage(text, files);
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setIsTyping(false);
      setIsSending(false);
    };
  }, []);

  const headerProps = {
    title: appNameProp || "Buddy Chat",
    errorInfo: error ? { message: error, severity: 'error' as const } : undefined,
    isSelected: true,
    statusInfo,
    onToggleStatusPanel: setIsStatusPanelOpen,
    primaryColor,
    secondaryColor,
    activePrimaryColor,
    activeSecondaryColor
  };

  return (
    <div className={STYLE_CONSTANTS.container}>
      <div className={STYLE_CONSTANTS.innerContainer}>
        <HeaderBar {...headerProps} />
        <div className={STYLE_CONSTANTS.chatAreaWrapper}>
          <ChatArea 
            messages={messages} 
            isTyping={isTyping} 
            className="flex-1"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            activePrimaryColor={activePrimaryColor}
            activeSecondaryColor={activeSecondaryColor}
            onMessageFeedback={hasRatingToolbar ? (messageId, type) => 
              onRateMessage?.(messageId, type === 'thumbsUp' ? 'up' : 'down')
            : undefined}
          />
        </div>
        <UserArea
          onSendMessage={handleSendMessage}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectedAgentChange={handleAgentChange}
          currentAttachments={attachments}
          onRemoveAttachment={removeAttachment}
          disabled={isSending}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activePrimaryColor={activePrimaryColor}
          activeSecondaryColor={activeSecondaryColor}
          agentToolbarConfig={(agent) => [
            {
              id: 'start',
              icon: '▶️',
              action: () => console.log('Start agent:', agent.id),
              tooltip: 'Start agent',
              intent: 'primary'
            },
            {
              id: 'stop',
              icon: '⏹️',
              action: () => console.log('Stop agent:', agent.id),
              tooltip: 'Stop agent',
              intent: 'secondary'
            },
            {
              id: 'restart',
              icon: '🔄',
              action: () => console.log('Restart agent:', agent.id),
              tooltip: 'Restart agent'
            }
          ]}
          minimalInputToolbarConfig={[]}
        />
      </div>
    </div>
  );
}

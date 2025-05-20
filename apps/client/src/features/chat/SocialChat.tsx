import React from 'react';
import { useSocialChatStore } from '../../stores/chatStores';
import ChatApp from './ChatApp';

export default function SocialChat() {
  const {
    theme,
    messages,
    agents,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    isTyping,
    isSending,
    error,
    hasRatingToolbar,
    rateMessage
  } = useSocialChatStore();

  return (
    <ChatApp
      appName="Social Companion"
      {...theme}
      messages={messages}
      agents={agents}
      selectedAgent={selectedAgent}
      onSelectedAgentChange={setSelectedAgent}
      onSendMessage={sendMessage}
      isTyping={isTyping}
      isSending={isSending}
      error={error}
      hasRatingToolbar={hasRatingToolbar}
      onRateMessage={rateMessage}
    />
  );
}

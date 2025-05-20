import React from 'react';
import { useBusinessChatStore } from '../../stores/chatStores';
import ChatApp from './ChatApp';

export default function BusinessChat() {
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
  } = useBusinessChatStore();

  return (
    <ChatApp
      appName="Business Analytics"
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

import { useState } from 'react';
import { MessageArea } from './MessageArea';
import { UserArea } from './UserArea';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatAppProps {
  error?: string | null;
}

export function ChatApp({ error }: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hi! How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage = {
      content,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Simulate response after a delay
    setTimeout(() => {
      const responseMessage = {
        content: `I received your message: "${content}"`,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, responseMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <MessageArea messages={messages} isLoading={isLoading} />
      <UserArea 
        onSendMessage={handleSendMessage}
        isDisabled={isLoading}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import BusinessChat from "@/features/chat/BusinessChat";
import SocialChat from "@/features/chat/SocialChat";

export default function ChatContainer() {
  const [activeChat, setActiveChat] = useState<'business' | 'social'>('business');

  return (
    <div className="flex h-full w-full p-4 gap-4">
      <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
        <BusinessChat 
          isActive={activeChat === 'business'}
          onActivate={() => setActiveChat('business')}
        />
      </div>
      <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
        <SocialChat 
          isActive={activeChat === 'social'}
          onActivate={() => setActiveChat('social')}
        />
      </div>
    </div>
  );
}

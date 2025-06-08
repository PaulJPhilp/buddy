"use client";

import React, { createContext, useContext, useState } from "react";

interface ActiveChatContextType {
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
}

const ActiveChatContext = createContext<ActiveChatContextType | undefined>(
  undefined,
);

export const ActiveChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize with chat1 as the default active chat
  const [activeChatId, setActiveChatId] = useState<string | null>("chat1");

  return (
    <ActiveChatContext.Provider value={{ activeChatId, setActiveChatId }}>
      {children}
    </ActiveChatContext.Provider>
  );
};

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within an ActiveChatProvider");
  }
  return context;
}

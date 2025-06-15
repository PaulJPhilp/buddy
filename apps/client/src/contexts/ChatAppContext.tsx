"use client";

import { ChatAppConfig } from "@/types/global";
import { ReactNode, createContext, useContext } from "react";

interface ChatAppContextValue {
  activeChatAppConfig: ChatAppConfig | null;
  onThemeChange: (theme: any) => void;
}

const ChatAppContext = createContext<ChatAppContextValue | null>(null);

export interface ChatAppProviderProps {
  children: ReactNode;
  activeChatAppConfig: ChatAppConfig | null;
  onThemeChange: (theme: any) => void;
}

export function ChatAppProvider({
  children,
  activeChatAppConfig,
  onThemeChange,
}: ChatAppProviderProps) {
  return (
    <ChatAppContext.Provider value={{ activeChatAppConfig, onThemeChange }}>
      {children}
    </ChatAppContext.Provider>
  );
}

export function useChatAppContext() {
  const context = useContext(ChatAppContext);
  if (!context) {
    throw new Error("useChatAppContext must be used within a ChatAppProvider");
  }
  return context;
}

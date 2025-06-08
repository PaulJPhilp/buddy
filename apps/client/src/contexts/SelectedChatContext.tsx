"use client";

import React, { createContext, useContext, useState } from "react";

interface SelectedChatContextType {
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
}

const SelectedChatContext = createContext<SelectedChatContextType | undefined>(
  undefined,
);

export function SelectedChatProvider({
  children,
}: { children: React.ReactNode }) {
  const [selectedChatId, setSelectedChatId] = useState("chat1");

  return (
    <SelectedChatContext.Provider value={{ selectedChatId, setSelectedChatId }}>
      {children}
    </SelectedChatContext.Provider>
  );
}

export function useSelectedChat() {
  const context = useContext(SelectedChatContext);
  if (!context) {
    throw new Error(
      "useSelectedChat must be used within a SelectedChatProvider",
    );
  }
  return context;
}

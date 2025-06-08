"use client";

import {
  ChatAppTheme,
  defaultChatTheme,
} from "@/features/chat/themes/themeTypes";
import { useSelectedChat } from "@/hooks/useSelectedChat";
import { useTheme } from "next-themes";
import React, { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppToolbar } from "./AppToolbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme: rawTheme } = useTheme();
  const [currentTheme, setCurrentTheme] =
    useState<ChatAppTheme>(defaultChatTheme);

  // Parse theme in an effect to avoid infinite loops
  useEffect(() => {
    // Safely parse theme with error handling
    let parsedTheme = defaultChatTheme;
    try {
      if (rawTheme) {
        // Handle special theme names like 'system', 'dark', 'light'
        if (
          typeof rawTheme === "string" &&
          !["system", "dark", "light"].includes(rawTheme)
        ) {
          parsedTheme = JSON.parse(rawTheme) as ChatAppTheme;
        } else if (typeof rawTheme === "object") {
          parsedTheme = rawTheme as ChatAppTheme;
        }
      }
    } catch (error) {
      console.error("Error parsing theme:", error);
      // Fall back to default theme on parsing error
    }

    setCurrentTheme(parsedTheme);
  }, [rawTheme]); // Only re-run when rawTheme changes

  // Compute theme styles
  const themeStyles = {
    "--color-chat-background":
      currentTheme.colors?.background || defaultChatTheme.colors.background,
    "--color-chat-foreground":
      currentTheme.colors?.text || defaultChatTheme.colors.text,
    "--color-chat-primary":
      currentTheme.colors?.primary || defaultChatTheme.colors.primary,
    "--color-chat-secondary":
      currentTheme.colors?.secondary || defaultChatTheme.colors.secondary,
    "--color-chat-border":
      currentTheme.borders?.color || defaultChatTheme.borders?.color,
  } as React.CSSProperties;

  function toggleSidebar() {
    setIsSidebarOpen((open) => !open);
  }

  return (
    <div
      className="h-screen w-full flex"
      style={{
        ...themeStyles,
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
      }}
    >
      <AppSidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
      <main
        className="flex-1 flex flex-col"
        id="main-content"
        style={{
          backgroundColor: "var(--color-chat-background)",
          color: "var(--color-chat-foreground)",
        }}
      >
        <AppToolbar onToggleSidebarAction={toggleSidebar} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

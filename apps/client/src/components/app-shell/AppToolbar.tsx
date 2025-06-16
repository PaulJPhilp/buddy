"use client";

import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState, useEffect } from "react";

interface AppToolbarProps {
  onToggleSidebarAction: () => void;
}

export function AppToolbar({ onToggleSidebarAction }: AppToolbarProps) {
  const { theme: rawTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<any>(null);

  // Parse theme in an effect to avoid infinite loops
  useEffect(() => {
    // Safely parse theme with error handling
    try {
      let parsedTheme = null;
      if (rawTheme) {
        // Handle special theme names like 'system', 'dark', 'light'
        if (
          typeof rawTheme === "string" &&
          !["system", "dark", "light"].includes(rawTheme)
        ) {
          parsedTheme = JSON.parse(rawTheme);
        } else if (typeof rawTheme === "object") {
          parsedTheme = rawTheme;
        }
      }
      setCurrentTheme(parsedTheme);
    } catch (error) {
      console.error("Error parsing theme in AppToolbar:", error);
      // Fall back to default theme on parsing error
      setCurrentTheme(null);
    }
  }, [rawTheme]); // Only re-run when rawTheme changes

  // Compute theme styles
  const themeStyles = {
    "--color-chat-header-bg": currentTheme?.header?.background || "#f8fafc",
    "--color-chat-header-text": currentTheme?.header?.text || "#1e293b",
    "--color-chat-border": currentTheme?.borders?.color || "#e2e8f0",
  } as React.CSSProperties;

  return (
    <header
      className="flex items-center h-6 px-4 border-b"
      style={{
        backgroundColor: "var(--color-chat-header-bg)",
        color: "var(--color-chat-header-text)",
        borderColor: "var(--color-chat-border)",
        ...themeStyles,
      }}
    >
      <button
        type="button"
        onClick={onToggleSidebarAction}
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex-1 flex items-center justify-between ml-4">
        {/* Add additional toolbar content here */}
        {/* <span className="font-semibold text-lg">Buddy</span> */}
      </div>
    </header>
  );
}

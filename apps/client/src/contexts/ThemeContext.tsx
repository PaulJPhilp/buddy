"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ChatAppTheme, ChatAppColors } from "../features/chat/themes/themeTypes";

// This interface aligns with ChatAppColors but with simplified property names
// for easier management in the theme editor
export interface ThemeColors {
  background: string;  // maps to colors.background
  foreground: string;  // maps to colors.text
  primary: string;     // maps to colors.primary
  secondary: string;   // maps to colors.secondary
  border: string;      // maps to border.color
  userArea: string;    // maps to userArea.background
  bubbleUser: string;  // maps to bubbles.user.background
  bubbleAgent: string; // maps to bubbles.agent.background
  headerBg: string;    // maps to header.background
  headerText: string;  // maps to header.text
};

// Utility to convert ThemeColors to ChatAppTheme
const themeColorsToAppTheme = (colors: ThemeColors): ChatAppTheme => {
  return {
    colors: {
      background: colors.background,
      text: colors.foreground,
      primary: colors.primary,
      secondary: colors.secondary
    },
    borders: {
      color: colors.border,
      thickness: "1px",
      radius: "0.5rem"
    },
    userArea: {
      background: colors.userArea
    },
    bubbles: {
      user: {
        background: colors.bubbleUser,
        text: "#ffffff"
      },
      agent: {
        background: colors.bubbleAgent,
        text: "#ffffff"
      }
    },
    header: {
      background: colors.headerBg,
      text: colors.headerText
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "1rem"
    }
  };
};

// Utility to convert ChatAppTheme to ThemeColors
const appThemeToThemeColors = (theme: ChatAppTheme): ThemeColors => {
  return {
    background: theme.colors.background || '#ffffff',
    foreground: theme.colors.text || '#000000',
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    border: theme.borders?.color || '#e2e8f0',
    userArea: theme.userArea?.background || '#f8fafc',
    bubbleUser: theme.bubbles?.user?.background || theme.colors.primary,
    bubbleAgent: theme.bubbles?.agent?.background || theme.colors.secondary,
    headerBg: theme.header?.background || '#f8fafc',
    headerText: theme.header?.text || '#000000'
  };
};

export const defaultTheme: ThemeColors = {
  background: "#ffffff",
  foreground: "#000000",
  primary: "#0ea5e9",
  secondary: "#64748b",
  border: "#e2e8f0",
  userArea: "#f8fafc",
  bubbleUser: "#0ea5e9",
  bubbleAgent: "#64748b",
  headerBg: "#f8fafc",
  headerText: "#000000"
};

export const defaultThemeNames = {
  "spike-light": "Spike Light",
  "spike-dark": "Spike Dark",
  "minimal-test": "Minimal Test",
};

// Predefined themes that match the theme names
export const defaultThemes: Record<string, ThemeColors> = {
  "spike-light": {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#0ea5e9",
    secondary: "#64748b",
    border: "#e2e8f0",
    userArea: "#f8fafc",
    bubbleUser: "#0ea5e9",
    bubbleAgent: "#64748b",
    headerBg: "#f8fafc",
    headerText: "#000000"
  },
  "spike-dark": {
    background: "#1e293b",
    foreground: "#f8fafc",
    primary: "#38bdf8",
    secondary: "#64748b",
    border: "#475569",
    userArea: "#0f172a",
    bubbleUser: "#38bdf8",
    bubbleAgent: "#475569",
    headerBg: "#0f172a",
    headerText: "#f8fafc"
  },
  "minimal-test": {
    background: "#f9fafb",
    foreground: "#111827",
    primary: "#4f46e5",
    secondary: "#9ca3af",
    border: "#e5e7eb",
    userArea: "#f3f4f6",
    bubbleUser: "#4f46e5",
    bubbleAgent: "#9ca3af",
    headerBg: "#f3f4f6",
    headerText: "#111827"
  }
} as const;

export interface ThemeContextType {
  currentTheme: string;
  chatThemes: Record<string, ThemeColors>;
  updateChatColor: (chatId: string, key: keyof ThemeColors, value: string) => void;
  getChatStyle: (chatId: string) => React.CSSProperties;
  setGlobalTheme: (themeName: string) => void;
  defaultThemes: Record<string, ThemeColors>;
  getAppTheme: (chatId: string) => ChatAppTheme;
  themeUpdateCount: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to ensure a chat theme exists
function ensureChatTheme(themes: Record<string, ThemeColors>, chatId: string): Record<string, ThemeColors> {
  if (!themes[chatId]) {
    return {
      ...themes,
      [chatId]: { ...defaultTheme }
    };
  }
  return themes;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<string>("spike-light");
  const [themeUpdateCount, setThemeUpdateCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<{chatId: string, key: string, value: string} | null>(null);
  
  // Initialize with default themes
  const [chatThemes, setChatThemes] = useState<Record<string, ThemeColors>>({
    shell: { ...defaultTheme },
    preview: { ...defaultTheme }
  });

  const updateChatColor = useCallback((chatId: string, key: keyof ThemeColors, value: string) => {
    // Update the theme colors
    setChatThemes(prev => {
      // Make sure we're working with a copy of the previous state
      const newThemes = { ...prev };
      
      // Create or update the theme for this chat ID
      if (!newThemes[chatId]) {
        newThemes[chatId] = { ...defaultTheme };
      }
      
      // Update the specific color
      newThemes[chatId] = {
        ...newThemes[chatId],
        [key]: value
      };
      
      return newThemes;
    });
    
    // Then update the theme update count to trigger re-renders
    setThemeUpdateCount(prev => prev + 1);
    setLastUpdate({chatId, key, value});
  }, []);

  const getChatStyle = useCallback((chatId: string): React.CSSProperties => {
    const colors = chatThemes[chatId] || defaultTheme;
    
    // Create CSS variables from the theme colors
    const cssVars = {
      "--color-chat-background": colors.background,
      "--color-chat-foreground": colors.foreground,
      "--color-chat-primary": colors.primary,
      "--color-chat-secondary": colors.secondary,
      "--color-chat-border": colors.border,
      "--color-chat-user-area": colors.userArea,
      "--color-chat-bubble-user": colors.bubbleUser,
      "--color-chat-bubble-agent": colors.bubbleAgent,
      "--color-chat-header-bg": colors.headerBg,
      "--color-chat-header-text": colors.headerText,
    } as React.CSSProperties;
    
    return cssVars;
  }, [chatThemes, themeUpdateCount]);

  // Convert ThemeColors to ChatAppTheme for components that need the full theme structure
  const getAppTheme = useCallback((chatId: string): ChatAppTheme => {
    const colors = chatThemes[chatId] || defaultTheme;
    return themeColorsToAppTheme(colors);
  }, [chatThemes]);

  const setGlobalTheme = useCallback((themeName: string) => {
    setCurrentTheme(themeName);
    // If it's a predefined theme, update the shell theme
    if (defaultThemes[themeName]) {
      setChatThemes(prev => ({
        ...prev,
        shell: { ...defaultThemes[themeName] }
      }));
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        chatThemes,
        updateChatColor,
        getChatStyle,
        setGlobalTheme,
        defaultThemes,
        getAppTheme,
        themeUpdateCount
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}



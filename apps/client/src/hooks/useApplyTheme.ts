import { ChatAppTheme } from "@/themes/themeTypes";
import { useEffect } from "react";

/**
 * Applies a ChatAppTheme by writing CSS variables to :root
 */
export function useApplyTheme(theme: ChatAppTheme | undefined | null) {
  useEffect(() => {
    if (!theme || typeof window === "undefined") return;

    const vars = buildCssVars(theme)
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }, [theme])
}

// Minimal CSS variable generator (avoids importing store internals)
const buildCssVars = (theme: ChatAppTheme): Record<string, string> => {
  return {
    "--color-chat-background": theme.colors.background,
    "--color-chat-foreground": theme.colors.text,
    "--color-chat-primary": theme.colors.primary,
    "--color-chat-secondary": theme.colors.secondary,
    "--color-chat-border": theme.borders?.color ?? theme.colors.secondary,
    "--color-chat-bubble-user":
      theme.bubbles?.user?.background ?? theme.colors.primary,
    "--color-chat-bubble-user-foreground":
      theme.bubbles?.user?.text ?? "#ffffff",
    "--color-chat-bubble-agent":
      theme.bubbles?.agent?.background ?? theme.colors.secondary,
    "--color-chat-bubble-agent-foreground":
      theme.bubbles?.agent?.text ?? "#000000",
    "--color-chat-header-bg": theme.header?.background ?? theme.colors.primary,
    "--color-chat-header-text": theme.header?.text ?? "#ffffff",
    "--color-chat-user-area":
      theme.userArea?.background ?? theme.colors.background,
  };
};

// Export helper for other components
export const buildChatCssVars = buildCssVars;

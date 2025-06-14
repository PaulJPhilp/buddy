import { useEffect } from "react";

interface ChatAppStyle {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  borders?: {
    color?: string;
    thickness?: string;
    radius?: string;
  };
  bubbles?: {
    user?: {
      background?: string;
      text?: string;
      radius?: string;
      border?: string;
      padding?: string;
    };
    agent?: {
      background?: string;
      text?: string;
      radius?: string;
      border?: string;
      padding?: string;
    };
  };
  userArea?: {
    background?: string;
    inputRingColor?: string;
    padding?: string;
  };
  header?: {
    background?: string;
    text?: string;
    borderBottom?: string;
    padding?: string;
  };
  chatArea?: {
    background?: string;
    border?: string;
    radius?: string;
    padding?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
  };
}

/**
 * Hook that directly applies ChatApp styling to CSS variables
 * This bypasses the complex theme system and applies styles directly
 */
export function useApplyChatStyle(style: ChatAppStyle | null | undefined) {
  useEffect(() => {
    if (!style || typeof window === "undefined") {
      console.log("🎨 useApplyChatStyle: No style or window unavailable");
      return;
    }

    console.log("🎨 useApplyChatStyle: Applying style:", style);

    const root = document.documentElement;

    // Apply color variables
    if (style.colors) {
      if (style.colors.primary) {
        root.style.setProperty("--color-chat-primary", style.colors.primary);
      }
      if (style.colors.secondary) {
        root.style.setProperty(
          "--color-chat-secondary",
          style.colors.secondary,
        );
      }
      if (style.colors.accent) {
        root.style.setProperty("--color-chat-accent", style.colors.accent);
      }
      if (style.colors.background) {
        root.style.setProperty(
          "--color-chat-background",
          style.colors.background,
        );
      }
      if (style.colors.text) {
        root.style.setProperty("--color-chat-foreground", style.colors.text);
      }
    }

    // Apply border variables
    if (style.borders) {
      if (style.borders.color) {
        root.style.setProperty("--color-chat-border", style.borders.color);
      }
      if (style.borders.thickness) {
        root.style.setProperty(
          "--chat-border-thickness",
          style.borders.thickness,
        );
      }
      if (style.borders.radius) {
        root.style.setProperty("--chat-border-radius", style.borders.radius);
      }
    }

    // Apply bubble variables
    if (style.bubbles?.user) {
      if (style.bubbles.user.background) {
        root.style.setProperty(
          "--color-chat-bubble-user",
          style.bubbles.user.background,
        );
      }
      if (style.bubbles.user.text) {
        root.style.setProperty(
          "--color-chat-bubble-user-foreground",
          style.bubbles.user.text,
        );
      }
    }

    if (style.bubbles?.agent) {
      if (style.bubbles.agent.background) {
        root.style.setProperty(
          "--color-chat-bubble-agent",
          style.bubbles.agent.background,
        );
      }
      if (style.bubbles.agent.text) {
        root.style.setProperty(
          "--color-chat-bubble-agent-foreground",
          style.bubbles.agent.text,
        );
      }
    }

    // Apply header variables
    if (style.header) {
      if (style.header.background) {
        root.style.setProperty(
          "--color-chat-header-bg",
          style.header.background,
        );
      }
      if (style.header.text) {
        root.style.setProperty("--color-chat-header-text", style.header.text);
      }
    }

    // Apply user area variables
    if (style.userArea) {
      if (style.userArea.background) {
        root.style.setProperty(
          "--color-chat-user-area",
          style.userArea.background,
        );
      }
      if (style.userArea.inputRingColor) {
        root.style.setProperty(
          "--color-chat-user-area-border",
          style.userArea.inputRingColor,
        );
      }
    }

    console.log("🎨 useApplyChatStyle: Style applied successfully");
  }, [style]);
}

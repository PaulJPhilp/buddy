import { useEffect, useRef } from "react";

interface ChatStyle {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  borders: {
    color: string;
    thickness: string;
    radius: string;
  };
  bubbles: {
    user: {
      background: string;
      text: string;
      radius: string;
      border: string;
      padding: string;
    };
    agent: {
      background: string;
      text: string;
      radius: string;
      border: string;
      padding: string;
    };
  };
  userArea: {
    background: string;
    inputRingColor: string;
    padding: string;
  };
  header: {
    background: string;
    text: string;
    borderBottom: string;
    padding: string;
  };
  chatArea: {
    background: string;
    border: string;
    radius: string;
    padding: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
  };
}

/**
 * React hook for applying chat app styling to a specific container element.
 *
 * - Applies scoped CSS variables to the container and its children based on the provided ChatStyle.
 * - Returns a ref to be attached to the container element.
 * - Cleans up and reapplies styles on style or container changes.
 *
 * @param style The ChatStyle object defining colors, borders, bubbles, and other style properties.
 * @returns A ref to be attached to the chat container div.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All style updates are performed atomically and scoped to the container.
 *   - React's rules of hooks are followed for safe resource management.
 */
export function useApplyChatContainerStyle(style: ChatStyle | undefined) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !style) {
      console.log(
        "🎨 useApplyChatContainerStyle: No container or style, skipping",
      );
      return;
    }

    const container = containerRef.current;
    console.log(
      "🎨 useApplyChatContainerStyle: Applying style to container:",
      style,
    );

    try {
      // Apply color variables (with null checks) - using correct CSS variable names
      if (style.colors) {
        container.style.setProperty(
          "--color-chat-primary",
          style.colors.primary || "#3b82f6",
        );
        container.style.setProperty(
          "--color-chat-secondary",
          style.colors.secondary || "#e5e7eb",
        );
        container.style.setProperty(
          "--color-chat-accent",
          style.colors.accent || "#6366f1",
        );
        container.style.setProperty(
          "--color-chat-background",
          style.colors.background || "white",
        );
        container.style.setProperty(
          "--color-chat-foreground",
          style.colors.text || "#111827",
        );
      }

      // Apply border variables (with null checks)
      if (style.borders) {
        container.style.setProperty(
          "--color-chat-border",
          style.borders.color || "#e5e7eb",
        );
        container.style.setProperty(
          "--chat-border-thickness",
          style.borders.thickness || "1px",
        );
        container.style.setProperty(
          "--chat-border-radius",
          style.borders.radius || "0.5rem",
        );
      }

      // Apply bubble variables (with null checks)
      if (style.bubbles?.user) {
        container.style.setProperty(
          "--color-chat-bubble-user",
          style.bubbles.user.background || "#3b82f6",
        );
        container.style.setProperty(
          "--color-chat-bubble-user-foreground",
          style.bubbles.user.text || "white",
        );
        container.style.setProperty(
          "--chat-bubble-user-radius",
          style.bubbles.user.radius || "rounded-lg",
        );
        container.style.setProperty(
          "--chat-bubble-user-border",
          style.bubbles.user.border || "none",
        );
        container.style.setProperty(
          "--chat-bubble-user-padding",
          style.bubbles.user.padding || "0.5rem",
        );
      }

      if (style.bubbles?.agent) {
        container.style.setProperty(
          "--color-chat-bubble-agent",
          style.bubbles.agent.background || "#f3f4f6",
        );
        container.style.setProperty(
          "--color-chat-bubble-agent-foreground",
          style.bubbles.agent.text || "#111827",
        );
        container.style.setProperty(
          "--chat-bubble-agent-radius",
          style.bubbles.agent.radius || "rounded-lg",
        );
        container.style.setProperty(
          "--chat-bubble-agent-border",
          style.bubbles.agent.border || "none",
        );
        container.style.setProperty(
          "--chat-bubble-agent-padding",
          style.bubbles.agent.padding || "0.5rem",
        );
      }

      // Apply user area variables (with null checks)
      if (style.userArea) {
        container.style.setProperty(
          "--color-chat-user-area",
          style.userArea.background || "#f9fafb",
        );
        container.style.setProperty(
          "--color-chat-user-area-border",
          style.userArea.inputRingColor || "blue-500",
        );
        container.style.setProperty(
          "--chat-user-area-padding",
          style.userArea.padding || "0.5rem",
        );
      }

      // Apply header variables (with null checks)
      if (style.header) {
        container.style.setProperty(
          "--color-chat-header-bg",
          style.header.background || "#3b82f6",
        );
        container.style.setProperty(
          "--color-chat-header-text",
          style.header.text || "white",
        );
        container.style.setProperty(
          "--chat-header-border",
          style.header.borderBottom || "none",
        );
        container.style.setProperty(
          "--chat-header-padding",
          style.header.padding || "0.5rem 1rem",
        );
      }

      // Apply chat area variables (with null checks)
      if (style.chatArea) {
        container.style.setProperty(
          "--chat-area-bg",
          style.chatArea.background || "white",
        );
        container.style.setProperty(
          "--chat-area-border",
          style.chatArea.border || "1px solid #e5e7eb",
        );
        container.style.setProperty(
          "--chat-area-radius",
          style.chatArea.radius || "0.5rem",
        );
        container.style.setProperty(
          "--chat-area-padding",
          style.chatArea.padding || "0.75rem",
        );
      }

      // Apply typography variables (with null checks)
      if (style.typography) {
        container.style.setProperty(
          "--chat-font-family",
          style.typography.fontFamily || "Inter, sans-serif",
        );
        container.style.setProperty(
          "--chat-font-size",
          style.typography.fontSize || "0.875rem",
        );
      }

      console.log(
        "🎨 useApplyChatContainerStyle: Style applied successfully to container",
      );
    } catch (error) {
      console.error(
        "🎨 useApplyChatContainerStyle: Error applying style:",
        error,
      );
    }
  }, [style]);

  return containerRef;
}

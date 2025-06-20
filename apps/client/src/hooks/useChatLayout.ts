import { useCallback, useEffect, useState } from "react";

/**
 * Stores per-chat UI layout preferences (currently just the "expanded" flag)
 * in `localStorage` so that the choice survives page reloads.  The hook is
 * intentionally generic so more properties (panel width, theme…) can be added
 * later without changing call-sites.
 */
export function useChatLayout(chatId: string): {
  readonly isExpanded: boolean;
  readonly expand: () => void;
  readonly compact: () => void;
} {
  const storageKey = `chat-expanded-${chatId}`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  });

  // Reset state when chatId changes to read from localStorage for the new chat
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey) === "1";
    setIsExpanded(stored);
  }, [storageKey]);

  // Persist to localStorage whenever the flag changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isExpanded) {
      window.localStorage.setItem(storageKey, "1");
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }, [isExpanded, storageKey]);

  const expand = useCallback(() => {
    setIsExpanded(true);
    // Dispatch workspace event to expand this chat app
    window.dispatchEvent(
      new CustomEvent("buddy:chatAppExpanded", {
        detail: { appId: chatId, tabId: "default-tab" },
      }),
    );
  }, [chatId]);

  const compact = useCallback(() => {
    setIsExpanded(false);
    // Dispatch workspace event to compact this chat app
    window.dispatchEvent(
      new CustomEvent("buddy:chatAppCompacted", {
        detail: { appId: chatId, tabId: "default-tab" },
      }),
    );
  }, [chatId]);

  return { isExpanded, expand, compact } as const;
}

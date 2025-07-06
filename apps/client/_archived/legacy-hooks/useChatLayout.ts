import { useChatAppActions, useWorkspaceState } from "@/hooks/useWorkspace";
import { useCallback } from "react";

/**
 * React hook for managing chat layout state by interacting with the workspace store.
 *
 * - Provides expand, compact, and close actions that dispatch events to update the state of a specific chat application.
 * - Returns the current expansion state and action methods for the chat app.
 *
 * @param chatId The ID of the chat app to manage layout for.
 * @returns An object with isExpanded, isCompact, expand, compact, and close methods.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All state updates are performed via the workspace store and are atomic.
 *   - React's rules of hooks are followed for safe resource management.
 */
export function useChatLayout(chatId: string) {
  const { state } = useWorkspaceState();
  const chatAppActions = useChatAppActions();

  const chatApp = state.chatApps[chatId];

  const isExpanded = chatApp?.isExpanded ?? false;

  const expand = useCallback(() => {
    chatAppActions.expandChatApp(chatId);
  }, [chatAppActions, chatId]);

  const compact = useCallback(() => {
    chatAppActions.compactChatApp(chatId);
  }, [chatAppActions, chatId]);

  const close = useCallback(() => {
    chatAppActions.closeChatApp(chatId);
  }, [chatAppActions, chatId]);

  return {
    isExpanded,
    isCompact: !isExpanded,
    expand,
    compact,
    close,
  } as const;
}

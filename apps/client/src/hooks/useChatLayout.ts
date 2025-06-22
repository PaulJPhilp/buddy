import {
  useWorkspaceDispatch,
  useWorkspaceStore,
} from "@/workspace/workspaceStore";
import { useSelector } from "@xstate/store/react";
import { useCallback, useEffect } from "react";

/**
 * Hook for managing chat layout state by interacting with the workspace store.
 * Provides expand and compact actions that dispatch events to update the
 * state of a specific chat application.
 */
export function useChatLayout(chatId: string) {
  const store = useWorkspaceStore();
  const dispatch = useWorkspaceDispatch();

  const chatApp = useSelector(store, (state) => state.context.chatApps[chatId]);

  const isExpanded = chatApp?.status === "expanded";
  const isCompact = chatApp?.status === "compact";

  const expand = useCallback(() => {
    if (chatApp) {
      dispatch({
        type: "CHAT_APP_EXPANDED",
        appId: chatId,
        spaceId: chatApp.spaceId,
      });
    }
  }, [chatApp, dispatch, chatId]);

  const compact = useCallback(() => {
    if (chatApp) {
      dispatch({
        type: "CHAT_APP_COMPACTED",
        appId: chatId,
        spaceId: chatApp.spaceId,
      });
    }
  }, [chatApp, dispatch, chatId]);

  const close = useCallback(() => {
    if (chatApp) {
      dispatch({
        type: "CHAT_APP_CLOSED",
        appId: chatId,
        spaceId: chatApp.spaceId,
      });
    }
  }, [chatApp, dispatch, chatId]);

  return {
    isExpanded,
    isCompact,
    expand,
    compact,
    close,
  } as const;
}

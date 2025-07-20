import type { ChatAppConfig } from "@/features/application/types/AppConfig";

export function isValidWorkspaceId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Helper to filter chat apps for workspace
export function filterChatAppsForWorkspace(
  chatApps: ChatAppConfig[],
  workspaceId: string
): ChatAppConfig[] {
  // Since ChatAppConfig doesn't have workspaceId, we need to filter by the chatapp IDs
  // This function should be called with the workspace's chatappIds
  // For now, return all chat apps since the filtering should be done at the workspace level
  return chatApps;
}

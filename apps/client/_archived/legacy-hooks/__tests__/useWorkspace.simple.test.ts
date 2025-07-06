import { describe, it, expect } from "vitest";
import {
  useWorkspaceState,
  useWorkspaceActions,
  useChatAppActions,
  useFocusModeActions,
  useWorkspaceLoading,
  useCurrentWorkspace,
  useActiveWorkspaces,
  useArchivedWorkspaces,
  useChatAppsForWorkspace,
  useActiveChatAppsInWorkspace,
  useStashedChatAppsInWorkspace,
  useWorkspaceStats,
  useIsFocusMode,
  useWorkspaceLoadingState,
} from "../useWorkspace";

describe("useWorkspace hooks imports", () => {
  it("should import all workspace hooks successfully", () => {
    // Verify all hooks are functions
    expect(typeof useWorkspaceState).toBe("function");
    expect(typeof useWorkspaceActions).toBe("function");
    expect(typeof useChatAppActions).toBe("function");
    expect(typeof useFocusModeActions).toBe("function");
    expect(typeof useWorkspaceLoading).toBe("function");
    expect(typeof useCurrentWorkspace).toBe("function");
    expect(typeof useActiveWorkspaces).toBe("function");
    expect(typeof useArchivedWorkspaces).toBe("function");
    expect(typeof useChatAppsForWorkspace).toBe("function");
    expect(typeof useActiveChatAppsInWorkspace).toBe("function");
    expect(typeof useStashedChatAppsInWorkspace).toBe("function");
    expect(typeof useWorkspaceStats).toBe("function");
    expect(typeof useIsFocusMode).toBe("function");
    expect(typeof useWorkspaceLoadingState).toBe("function");
  });

  it("should have proper hook naming convention", () => {
    const hooks = [
      useWorkspaceState,
      useWorkspaceActions,
      useChatAppActions,
      useFocusModeActions,
      useWorkspaceLoading,
      useCurrentWorkspace,
      useActiveWorkspaces,
      useArchivedWorkspaces,
      useChatAppsForWorkspace,
      useActiveChatAppsInWorkspace,
      useStashedChatAppsInWorkspace,
      useWorkspaceStats,
      useIsFocusMode,
      useWorkspaceLoadingState,
    ];

    // All should be functions (React hooks)
    hooks.forEach((hook) => {
      expect(typeof hook).toBe("function");
      expect(hook.name).toMatch(/^use[A-Z]/); // Should start with 'use' followed by capital letter
    });
  });
});

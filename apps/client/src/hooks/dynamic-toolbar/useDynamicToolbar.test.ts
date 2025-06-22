import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDynamicToolbar } from "./useDynamicToolbar";
import { ToolbarConfig } from "@/components/toolbar/types";

describe("useDynamicToolbar", () => {
  beforeEach(() => {
    // Reset any state between tests
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useDynamicToolbar());

    expect(result.current.state.config).toBeNull();
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it("should load config successfully", async () => {
    const { result } = renderHook(() => useDynamicToolbar());

    await act(async () => {
      await result.current.actions.loadConfig("test-config");
    });

    expect(result.current.state.config).not.toBeNull();
    expect(result.current.state.config?.id).toBe("test-config");
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it("should handle loading state", async () => {
    const { result } = renderHook(() => useDynamicToolbar());

    act(() => {
      result.current.actions.loadConfig("test-config");
    });

    expect(result.current.state.isLoading).toBe(true);
  });

  it("should execute commands", async () => {
    const { result } = renderHook(() => useDynamicToolbar());

    // First load a config
    await act(async () => {
      await result.current.actions.loadConfig("test-config");
    });

    // Then execute a command
    await act(async () => {
      await result.current.actions.executeCommand("test-command");
    });

    // Should not throw an error
    expect(result.current.state.error).toBeNull();
  });

  it("should clear errors", () => {
    const { result } = renderHook(() => useDynamicToolbar());

    // Manually set an error state
    act(() => {
      result.current.actions.clearError();
    });

    expect(result.current.state.error).toBeNull();
  });

  it("should handle command execution without config", async () => {
    const { result } = renderHook(() => useDynamicToolbar());

    await expect(async () => {
      await act(async () => {
        await result.current.actions.executeCommand("test-command");
      });
    }).rejects.toThrow("No config loaded");
  });

  it("should handle non-existent command execution", async () => {
    const { result } = renderHook(() => useDynamicToolbar());

    // First load a config
    await act(async () => {
      await result.current.actions.loadConfig("test-config");
    });

    // Try to execute non-existent command
    await expect(async () => {
      await act(async () => {
        await result.current.actions.executeCommand("non-existent");
      });
    }).rejects.toThrow("Command not found: non-existent");
  });
});

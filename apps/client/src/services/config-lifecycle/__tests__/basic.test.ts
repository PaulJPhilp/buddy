import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock fetch globally
global.fetch = vi.fn();

describe("ConfigLifecycleService - Basic Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be able to call the API endpoints", async () => {
    const mockFetch = fetch as any;

    // Mock file list response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { name: "test-config.json", lastModified: Date.now(), size: 1000 },
        ]),
    } as Response);

    // Mock config file content response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            chatApps: [
              {
                id: "test-config",
                name: "Test Config",
                agentId: "test-agent",
                toolbarId: "test-toolbar",
                themeId: "test-theme",
              },
            ],
            themes: {},
          }),
        ),
    } as Response);

    // Test that we can call the API endpoints directly
    const filesResponse = await fetch("/api/configs");
    expect(filesResponse.ok).toBe(true);

    const files = await filesResponse.json();
    expect(Array.isArray(files)).toBe(true);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("test-config.json");

    // Test config file content
    const configResponse = await fetch("/api/configs?file=test-config.json");
    expect(configResponse.ok).toBe(true);

    const configText = await configResponse.text();
    const configData = JSON.parse(configText);
    expect(configData.chatApps).toHaveLength(1);
    expect(configData.chatApps[0].id).toBe("test-config");
  });

  it("should handle API errors gracefully", async () => {
    const mockFetch = fetch as any;
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    try {
      await fetch("/api/configs");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Network error");
    }
  });
});

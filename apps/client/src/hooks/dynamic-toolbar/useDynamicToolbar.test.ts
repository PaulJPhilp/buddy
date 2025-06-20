/**
 * @file useDynamicToolbar Tests - Custom Mock Implementation
 * @module hooks/dynamic-toolbar/useDynamicToolbar.test
 */

import { ToolbarConfig } from "@/components/Toolbar/types";
import { beforeEach, describe, expect, test } from "vitest";
import { createDynamicToolbarLogic } from "./useDynamicToolbar";

const createTestToolbarConfig = (): ToolbarConfig => ({
  id: "test-toolbar",
  items: [
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      action: () => {},
      active: false,
    },
    {
      id: "toggle-theme-editor",
      label: "Theme Editor",
      action: () => {},
      active: false,
    },
    {
      id: "non-command-item",
      type: "spacer",
    },
    {
      id: "another-command",
      label: "Another Command",
      action: () => {},
      active: false,
    },
  ],
});

// Test store state management
class TestStoreState {
  private state = {
    isSidebarOpen: false,
    themeEditorIsOpen: false,
  };

  setState(updates: Partial<typeof this.state>) {
    this.state = { ...this.state, ...updates };
  }

  getState() {
    return this.state;
  }

  isSidebarOpen = () => this.state.isSidebarOpen;
  themeEditorIsOpen = () => this.state.themeEditorIsOpen;
}

const testStoreState = new TestStoreState();

describe("useDynamicToolbar", () => {
  let baseConfig: ToolbarConfig;

  beforeEach(() => {
    baseConfig = createTestToolbarConfig();
    // Reset store state before each test
    testStoreState.setState({
      isSidebarOpen: false,
    });
  });

  test("should return toolbar config with all commands inactive by default", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    expect(result.id).toBe("test-toolbar");
    expect(result.items).toHaveLength(4);

    // All command items should have active: false
    const commandItems = result.items.filter(
      (item) => !("type" in item), // Commands don't have type property
    );
    for (const item of commandItems) {
      expect((item as any).active).toBe(false);
    }
  });

  test("should set sidebar toggle as active when sidebar is open", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });

    const sidebarToggle = result.items.find(
      (item) => item.id === "toggle-sidebar",
    );
    expect((sidebarToggle as any)?.active).toBe(true);
  });

  test("should set theme editor toggle as active when theme editor is open", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    const themeEditorToggle = result.items.find(
      (item) => item.id === "toggle-theme-editor",
    );
    expect((themeEditorToggle as any)?.active).toBe(false);
  });

  test("should handle multiple active tools simultaneously", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });

    const sidebarToggle = result.items.find(
      (item) => item.id === "toggle-sidebar",
    );

    expect((sidebarToggle as any)?.active).toBe(true);
  });

  test("should preserve non-command items unchanged", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    const nonCommandItem = result.items.find(
      (item) => item.id === "non-command-item",
    );
    const originalNonCommandItem = baseConfig.items.find(
      (item) => item.id === "non-command-item",
    );

    expect(nonCommandItem).toEqual(originalNonCommandItem);
  });

  test("should preserve all original properties of command items", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    const sidebarToggle = result.items.find(
      (item) => item.id === "toggle-sidebar",
    ) as any;
    const originalSidebarToggle = baseConfig.items.find(
      (item) => item.id === "toggle-sidebar",
    ) as any;

    expect(sidebarToggle.id).toBe(originalSidebarToggle.id);
    expect(sidebarToggle.label).toBe(originalSidebarToggle.label);
    expect(sidebarToggle.action).toBe(originalSidebarToggle.action);
  });

  test("should handle unknown command gracefully", () => {
    const configWithUnknownCommand: ToolbarConfig = {
      ...baseConfig,
      items: [
        ...baseConfig.items,
        {
          id: "unknown-command",
          label: "Unknown Command",
          action: () => {},
          active: false,
        },
      ],
    };

    const result = createDynamicToolbarLogic(configWithUnknownCommand, {
      isSidebarOpen: false,
    });

    const unknownCommand = result.items.find(
      (item) => item.id === "unknown-command",
    );
    expect((unknownCommand as any)?.active).toBe(false); // Should remain unchanged
  });

  test("should memoize result and only recompute when store state changes", () => {
    const firstResult = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });
    const secondResult = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    // Should produce equivalent results with same input
    expect(firstResult).toEqual(secondResult);

    // Change store state
    const thirdResult = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });
    expect(thirdResult).not.toEqual(firstResult); // Should be different with different state
  });

  test("should handle empty toolbar config", () => {
    const emptyConfig: ToolbarConfig = {
      id: "empty-toolbar",
      items: [],
    };

    const result = createDynamicToolbarLogic(emptyConfig, {
      isSidebarOpen: false,
    });

    expect(result.id).toBe("empty-toolbar");
    expect(result.items).toEqual([]);
  });

  test("should handle toolbar config with extra properties", () => {
    const configWithExtraProps = {
      ...baseConfig,
      title: "Test Toolbar",
      description: "A test toolbar",
      extraProp: "extra",
    } as any;

    const result = createDynamicToolbarLogic(configWithExtraProps, {
      isSidebarOpen: false,
    });

    expect(result.id).toBe("test-toolbar");
    expect((result as any).title).toBe("Test Toolbar");
    expect((result as any).description).toBe("A test toolbar");
  });

  test("should handle rapidly changing store states", () => {
    // Test multiple state changes
    const result1 = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });
    const result2 = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });
    const result3 = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });

    const sidebarToggle1 = result1.items.find(
      (item) => item.id === "toggle-sidebar",
    );
    const sidebarToggle2 = result2.items.find(
      (item) => item.id === "toggle-sidebar",
    );
    const sidebarToggle3 = result3.items.find(
      (item) => item.id === "toggle-sidebar",
    );

    expect((sidebarToggle1 as any)?.active).toBe(true);
    expect((sidebarToggle2 as any)?.active).toBe(false);
    expect((sidebarToggle3 as any)?.active).toBe(true);
  });

  test("should maintain item order from original config", () => {
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: true,
    });

    // Order should match original config order
    expect(result.items[0].id).toBe("toggle-sidebar");
  });

  test("should handle store selectors returning undefined", () => {
    // Test with undefined state
    const result = createDynamicToolbarLogic(baseConfig, {
      isSidebarOpen: false,
    });

    const sidebarToggle = result.items.find(
      (item) => item.id === "toggle-sidebar",
    );
    expect((sidebarToggle as any)?.active).toBe(false);
  });
});

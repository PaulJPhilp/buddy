import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ToolbarService } from "../service";

const sampleToolbar = { id: "toolbar1", name: "Main Toolbar", tools: [] };

describe("ToolbarService", () => {
  it("creates and retrieves a toolbar", () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarService;
      const toolbar = {
        id: "test-toolbar",
        name: "Test Toolbar",
        tools: [],
      };
      yield* service.create(toolbar);
      const retrieved = yield* service.getById("test-toolbar");
      expect(retrieved).toEqual(toolbar);
    });
    return Effect.runPromise(Effect.provide(program, ToolbarService.Default));
  });

  it("updates a toolbar", () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarService;
      const toolbar = {
        id: "test-toolbar",
        name: "Test Toolbar",
        tools: [],
      };
      yield* service.create(toolbar);

      const update = { name: "Updated Toolbar" };
      yield* service.update("test-toolbar", update);

      const updated = yield* service.getById("test-toolbar");
      expect(updated).toEqual({ ...toolbar, ...update });
    });
    return Effect.runPromise(Effect.provide(program, ToolbarService.Default));
  });

  it("deletes a toolbar", () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarService;
      const toolbar = {
        id: "test-toolbar",
        name: "Test Toolbar",
        tools: [],
      };
      yield* service.create(toolbar);
      yield* service.delete("test-toolbar");

      const deleted = yield* service.getById("test-toolbar");
      expect(deleted).toBeUndefined();
    });
    return Effect.runPromise(Effect.provide(program, ToolbarService.Default));
  });

  it("lists all toolbars", () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarService;
      const toolbars = [
        { id: "toolbar-1", name: "Toolbar 1", tools: [] },
        { id: "toolbar-2", name: "Toolbar 2", tools: [] },
        { id: "toolbar-3", name: "Toolbar 3", tools: [] },
      ];

      for (const toolbar of toolbars) {
        yield* service.create(toolbar);
      }

      const all = yield* service.getAll();
      expect(all).toHaveLength(3);
      expect(all).toEqual(expect.arrayContaining(toolbars));
    });
    return Effect.runPromise(Effect.provide(program, ToolbarService.Default));
  });

  describe("getState", () => {
    it("should return the initial state", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;
        const state = yield* service.getState();
        expect(state.isVisible).toBe(true);
        expect(state.position).toBe("top");
        expect(state.items).toEqual([]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should return consistent state across multiple calls", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;
        const state1 = yield* service.getState();
        const state2 = yield* service.getState();
        expect(state1).toEqual(state2);
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("setState", () => {
    it("should update the state successfully", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const newState = {
          isVisible: false,
          position: "bottom" as const,
          items: [
            { id: "item1", label: "Item 1", action: "action1" },
            { id: "item2", label: "Item 2", action: "action2" },
          ],
        };

        const updatedState = yield* service.setState(newState);
        expect(updatedState).toEqual(newState);

        // Verify state was actually updated
        const currentState = yield* service.getState();
        expect(currentState).toEqual(newState);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle partial state updates", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Set initial state
        const initialState = {
          isVisible: true,
          position: "top" as const,
          items: [{ id: "item1", label: "Item 1", action: "action1" }],
        };
        yield* service.setState(initialState);

        // Update only visibility
        const partialUpdate = { isVisible: false };
        const updatedState = yield* service.setState(partialUpdate);

        expect(updatedState.isVisible).toBe(false);
        expect(updatedState.position).toBe("top"); // Should remain unchanged
        expect(updatedState.items).toEqual(initialState.items); // Should remain unchanged
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle empty items array", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const stateWithEmptyItems = {
          isVisible: true,
          position: "left" as const,
          items: [],
        };

        const updatedState = yield* service.setState(stateWithEmptyItems);
        expect(updatedState.items).toEqual([]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle large number of items", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const manyItems = Array.from({ length: 100 }, (_, i) => ({
          id: `item${i}`,
          label: `Item ${i}`,
          action: `action${i}`,
        }));

        const stateWithManyItems = {
          isVisible: true,
          position: "right" as const,
          items: manyItems,
        };

        const updatedState = yield* service.setState(stateWithManyItems);
        expect(updatedState.items).toHaveLength(100);
        expect(updatedState.items[0]).toEqual({
          id: "item0",
          label: "Item 0",
          action: "action0",
        });
        expect(updatedState.items[99]).toEqual({
          id: "item99",
          label: "Item 99",
          action: "action99",
        });
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle items with special characters", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const specialItems = [
          {
            id: "special-1",
            label: "Item with émojis 🚀",
            action: "emoji-action",
          },
          { id: "special-2", label: "Item with <tags>", action: "tag-action" },
          {
            id: "special-3",
            label: "Item with symbols @#$%",
            action: "symbol-action",
          },
        ];

        const stateWithSpecialItems = {
          isVisible: true,
          position: "bottom" as const,
          items: specialItems,
        };

        const updatedState = yield* service.setState(stateWithSpecialItems);
        expect(updatedState.items).toEqual(specialItems);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle all position values", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const positions = ["top", "bottom", "left", "right"] as const;

        for (const position of positions) {
          const state = { position };
          const updatedState = yield* service.setState(state);
          expect(updatedState.position).toBe(position);
        }
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("addItem", () => {
    it("should add a single item", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const item = {
          id: "new-item",
          label: "New Item",
          action: "new-action",
        };
        const updatedState = yield* service.addItem(item);

        expect(updatedState.items).toHaveLength(1);
        expect(updatedState.items[0]).toEqual(item);

        // Verify state was updated
        const currentState = yield* service.getState();
        expect(currentState.items).toEqual([item]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should add multiple items sequentially", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const item1 = { id: "item1", label: "Item 1", action: "action1" };
        const item2 = { id: "item2", label: "Item 2", action: "action2" };
        const item3 = { id: "item3", label: "Item 3", action: "action3" };

        yield* service.addItem(item1);
        yield* service.addItem(item2);
        const finalState = yield* service.addItem(item3);

        expect(finalState.items).toHaveLength(3);
        expect(finalState.items).toEqual([item1, item2, item3]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should preserve existing items when adding new ones", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Set initial state with existing items
        const existingItems = [
          { id: "existing1", label: "Existing 1", action: "existing-action1" },
          { id: "existing2", label: "Existing 2", action: "existing-action2" },
        ];
        yield* service.setState({ items: existingItems });

        // Add new item
        const newItem = {
          id: "new-item",
          label: "New Item",
          action: "new-action",
        };
        const updatedState = yield* service.addItem(newItem);

        expect(updatedState.items).toHaveLength(3);
        expect(updatedState.items).toEqual([...existingItems, newItem]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle duplicate IDs", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const item1 = {
          id: "duplicate",
          label: "First Item",
          action: "action1",
        };
        const item2 = {
          id: "duplicate",
          label: "Second Item",
          action: "action2",
        };

        yield* service.addItem(item1);
        const finalState = yield* service.addItem(item2);

        // Both items should be added (service doesn't prevent duplicates)
        expect(finalState.items).toHaveLength(2);
        expect(finalState.items[0]).toEqual(item1);
        expect(finalState.items[1]).toEqual(item2);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle items with empty strings", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const emptyItem = { id: "", label: "", action: "" };
        const updatedState = yield* service.addItem(emptyItem);

        expect(updatedState.items).toHaveLength(1);
        expect(updatedState.items[0]).toEqual(emptyItem);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle items with very long strings", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const longItem = {
          id: "a".repeat(1000),
          label: "b".repeat(2000),
          action: "c".repeat(500),
        };
        const updatedState = yield* service.addItem(longItem);

        expect(updatedState.items).toHaveLength(1);
        expect(updatedState.items[0]).toEqual(longItem);
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("removeItem", () => {
    it("should remove an existing item", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add items first
        const items = [
          { id: "item1", label: "Item 1", action: "action1" },
          { id: "item2", label: "Item 2", action: "action2" },
          { id: "item3", label: "Item 3", action: "action3" },
        ];
        yield* service.setState({ items });

        // Remove middle item
        const updatedState = yield* service.removeItem("item2");

        expect(updatedState.items).toHaveLength(2);
        expect(updatedState.items).toEqual([
          { id: "item1", label: "Item 1", action: "action1" },
          { id: "item3", label: "Item 3", action: "action3" },
        ]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle removal of non-existent item", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add some items
        const items = [
          { id: "item1", label: "Item 1", action: "action1" },
          { id: "item2", label: "Item 2", action: "action2" },
        ];
        yield* service.setState({ items });

        // Try to remove non-existent item
        const updatedState = yield* service.removeItem("non-existent");

        // Items should remain unchanged
        expect(updatedState.items).toHaveLength(2);
        expect(updatedState.items).toEqual(items);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle removal from empty toolbar", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Ensure toolbar is empty
        yield* service.setState({ items: [] });

        // Try to remove from empty toolbar
        const updatedState = yield* service.removeItem("any-id");

        expect(updatedState.items).toEqual([]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should remove all instances of duplicate IDs", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add items with duplicate IDs
        const items = [
          { id: "duplicate", label: "First", action: "action1" },
          { id: "unique", label: "Unique", action: "action2" },
          { id: "duplicate", label: "Second", action: "action3" },
          { id: "duplicate", label: "Third", action: "action4" },
        ];
        yield* service.setState({ items });

        // Remove all instances of "duplicate"
        const updatedState = yield* service.removeItem("duplicate");

        expect(updatedState.items).toHaveLength(1);
        expect(updatedState.items[0]).toEqual({
          id: "unique",
          label: "Unique",
          action: "action2",
        });
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle removal of last item", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add single item
        const item = {
          id: "only-item",
          label: "Only Item",
          action: "only-action",
        };
        yield* service.setState({ items: [item] });

        // Remove the only item
        const updatedState = yield* service.removeItem("only-item");

        expect(updatedState.items).toEqual([]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle empty string ID removal", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add items including one with empty ID
        const items = [
          { id: "", label: "Empty ID", action: "empty-action" },
          { id: "normal", label: "Normal", action: "normal-action" },
        ];
        yield* service.setState({ items });

        // Remove empty ID item
        const updatedState = yield* service.removeItem("");

        expect(updatedState.items).toHaveLength(1);
        expect(updatedState.items[0]).toEqual({
          id: "normal",
          label: "Normal",
          action: "normal-action",
        });
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("toggleVisibility", () => {
    it("should toggle visibility from true to false", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Ensure initial state is visible
        yield* service.setState({ isVisible: true });

        const updatedState = yield* service.toggleVisibility();
        expect(updatedState.isVisible).toBe(false);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should toggle visibility from false to true", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Set initial state to hidden
        yield* service.setState({ isVisible: false });

        const updatedState = yield* service.toggleVisibility();
        expect(updatedState.isVisible).toBe(true);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should preserve other state properties when toggling", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const initialState = {
          isVisible: true,
          position: "bottom" as const,
          items: [
            { id: "item1", label: "Item 1", action: "action1" },
            { id: "item2", label: "Item 2", action: "action2" },
          ],
        };
        yield* service.setState(initialState);

        const updatedState = yield* service.toggleVisibility();

        expect(updatedState.isVisible).toBe(false);
        expect(updatedState.position).toBe("bottom");
        expect(updatedState.items).toEqual(initialState.items);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should toggle multiple times correctly", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Start with visible
        yield* service.setState({ isVisible: true });

        // Toggle to hidden
        let state = yield* service.toggleVisibility();
        expect(state.isVisible).toBe(false);

        // Toggle back to visible
        state = yield* service.toggleVisibility();
        expect(state.isVisible).toBe(true);

        // Toggle to hidden again
        state = yield* service.toggleVisibility();
        expect(state.isVisible).toBe(false);
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("concurrent operations", () => {
    it("should handle concurrent addItem operations", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const items = Array.from({ length: 10 }, (_, i) => ({
          id: `concurrent-item-${i}`,
          label: `Concurrent Item ${i}`,
          action: `concurrent-action-${i}`,
        }));

        yield* Effect.all(
          items.map((item) => service.addItem(item)),
          { concurrency: "unbounded" },
        );

        const finalState = yield* service.getState();
        expect(finalState.items).toHaveLength(10);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle concurrent removeItem operations", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Add initial items
        const items = Array.from({ length: 20 }, (_, i) => ({
          id: `remove-item-${i}`,
          label: `Remove Item ${i}`,
          action: `remove-action-${i}`,
        }));
        yield* service.setState({ items });

        // Remove half of them concurrently
        const idsToRemove = Array.from(
          { length: 10 },
          (_, i) => `remove-item-${i}`,
        );
        yield* Effect.all(
          idsToRemove.map((id) => service.removeItem(id)),
          { concurrency: "unbounded" },
        );

        const finalState = yield* service.getState();
        expect(finalState.items).toHaveLength(10);

        // Verify remaining items are the ones we didn't remove
        const remainingIds = finalState.items.map((item) => item.id);
        const expectedIds = Array.from(
          { length: 10 },
          (_, i) => `remove-item-${i + 10}`,
        );
        expect(remainingIds.sort()).toEqual(expectedIds.sort());
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle mixed concurrent operations", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Initial state
        const initialItems = [
          { id: "initial-1", label: "Initial 1", action: "initial-action-1" },
          { id: "initial-2", label: "Initial 2", action: "initial-action-2" },
        ];
        yield* service.setState({ items: initialItems });

        // Mix of operations
        const operations = [
          service.addItem({
            id: "new-1",
            label: "New 1",
            action: "new-action-1",
          }),
          service.addItem({
            id: "new-2",
            label: "New 2",
            action: "new-action-2",
          }),
          service.removeItem("initial-1"),
          service.toggleVisibility(),
          service.setState({ position: "right" }),
        ];

        yield* Effect.all(operations, { concurrency: "unbounded" });

        const finalState = yield* service.getState();

        // Should have 3 items (1 initial + 2 new - 1 removed)
        expect(finalState.items).toHaveLength(3);
        expect(finalState.position).toBe("right");
        // Visibility should be toggled from default true to false
        expect(finalState.isVisible).toBe(false);
      }).pipe(Effect.provide(ToolbarService.Default)));
  });

  describe("edge cases", () => {
    it("should handle null and undefined values gracefully", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // These should not crash the service
        yield* service.removeItem(null as any);
        yield* service.removeItem(undefined as any);

        const state = yield* service.getState();
        expect(state.items).toEqual([]);
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should handle very large state objects", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        const largeItems = Array.from({ length: 1000 }, (_, i) => ({
          id: `large-item-${i}`,
          label: `Large Item ${i}`.repeat(10), // Make labels longer
          action: `large-action-${i}`.repeat(5), // Make actions longer
        }));

        const largeState = {
          isVisible: true,
          position: "top" as const,
          items: largeItems,
        };

        const updatedState = yield* service.setState(largeState);
        expect(updatedState.items).toHaveLength(1000);
        expect(updatedState.items[0].id).toBe("large-item-0");
        expect(updatedState.items[999].id).toBe("large-item-999");
      }).pipe(Effect.provide(ToolbarService.Default)));

    it("should maintain state consistency across rapid operations", () =>
      Effect.gen(function* () {
        const service = yield* ToolbarService;

        // Rapid sequence of operations
        for (let i = 0; i < 50; i++) {
          yield* service.addItem({
            id: `rapid-${i}`,
            label: `Rapid ${i}`,
            action: `rapid-action-${i}`,
          });

          if (i % 3 === 0) {
            yield* service.toggleVisibility();
          }

          if (i % 5 === 0 && i > 0) {
            yield* service.removeItem(`rapid-${i - 1}`);
          }
        }

        const finalState = yield* service.getState();

        // Should have items (some were removed)
        expect(finalState.items.length).toBeGreaterThan(0);
        expect(finalState.items.length).toBeLessThan(50);

        // All remaining items should have valid structure
        for (const item of finalState.items) {
          expect(item).toHaveProperty("id");
          expect(item).toHaveProperty("label");
          expect(item).toHaveProperty("action");
          expect(typeof item.id).toBe("string");
          expect(typeof item.label).toBe("string");
          expect(typeof item.action).toBe("string");
        }
      }).pipe(Effect.provide(ToolbarService.Default)));
  });
});

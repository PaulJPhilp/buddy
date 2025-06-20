import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ToolbarServiceApi } from "../api";
import { ToolbarPersistenceError } from "../errors";
import { ToolbarService } from "../service";
import type { ToolbarConfig } from "../types";

// Test layer using real service
const TestLayer = Layer.mergeAll(ToolbarService.Default);

describe("ToolbarService", () => {
  describe("Service Structure", () => {
    it("should have a valid service structure", () => {
      expect(ToolbarService.Default).toBeDefined();
      expect(typeof ToolbarService.Default).toBe("object");
      expect(ToolbarService.Default).toHaveProperty("pipe");
    });

    it("should provide proper service API", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          expect(service).toBeDefined();
          expect(typeof service.getAll).toBe("function");
          expect(typeof service.getById).toBe("function");
          expect(typeof service.create).toBe("function");
          expect(typeof service.update).toBe("function");
          expect(typeof service.delete).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Toolbar Management", () => {
    const testToolbar: ToolbarConfig = {
      id: "test-toolbar-1",
      name: "Test Toolbar",
      description: "A test toolbar configuration",
      items: [
        {
          id: "item-1",
          type: "button",
          label: "Test Button",
          action: "test-action",
          icon: "test-icon",
          position: 0,
        },
        {
          id: "item-2",
          type: "separator",
          position: 1,
        },
      ],
      position: "top",
      visible: true,
      metadata: {
        version: "1.0.0",
        author: "test",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    it("should start with empty toolbar list", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;
          const toolbars = yield* service.getAll();

          expect(Array.isArray(toolbars)).toBe(true);
          expect(toolbars.length).toBe(0);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should create and retrieve toolbars", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create toolbar
          yield* service.create(testToolbar);

          // Retrieve all toolbars
          const toolbars = yield* service.getAll();
          expect(toolbars.length).toBe(1);
          expect(toolbars[0]).toEqual(testToolbar);

          // Retrieve by ID
          const toolbar = yield* service.getById(testToolbar.id);
          expect(toolbar).toEqual(testToolbar);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should return undefined for non-existent toolbar", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;
          const toolbar = yield* service.getById("non-existent");

          expect(toolbar).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should update existing toolbars", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create toolbar
          yield* service.create(testToolbar);

          // Update toolbar
          const update = {
            name: "Updated Test Toolbar",
            visible: false,
            position: "bottom" as const,
          };
          yield* service.update(testToolbar.id, update);

          // Verify update
          const updatedToolbar = yield* service.getById(testToolbar.id);
          expect(updatedToolbar?.name).toBe("Updated Test Toolbar");
          expect(updatedToolbar?.visible).toBe(false);
          expect(updatedToolbar?.position).toBe("bottom");
          expect(updatedToolbar?.description).toBe(testToolbar.description); // unchanged
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should delete toolbars", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create toolbar
          yield* service.create(testToolbar);

          // Verify it exists
          let toolbars = yield* service.getAll();
          expect(toolbars.length).toBe(1);

          // Delete toolbar
          yield* service.delete(testToolbar.id);

          // Verify it's gone
          toolbars = yield* service.getAll();
          expect(toolbars.length).toBe(0);

          const toolbar = yield* service.getById(testToolbar.id);
          expect(toolbar).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Multiple Toolbars", () => {
    const toolbars: ToolbarConfig[] = [
      {
        id: "toolbar-1",
        name: "Main Toolbar",
        description: "Primary toolbar",
        items: [
          {
            id: "main-1",
            type: "button",
            label: "Main Action",
            action: "main-action",
            position: 0,
          },
        ],
        position: "top",
        visible: true,
        metadata: {
          version: "1.0.0",
          author: "test",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      },
      {
        id: "toolbar-2",
        name: "Secondary Toolbar",
        description: "Secondary toolbar",
        items: [
          {
            id: "sec-1",
            type: "dropdown",
            label: "Options",
            action: "options",
            position: 0,
            options: [
              { id: "opt-1", label: "Option 1", action: "opt-1" },
              { id: "opt-2", label: "Option 2", action: "opt-2" },
            ],
          },
        ],
        position: "bottom",
        visible: false,
        metadata: {
          version: "1.0.0",
          author: "test",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      },
    ];

    it("should handle multiple toolbars", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create multiple toolbars
          for (const toolbar of toolbars) {
            yield* service.create(toolbar);
          }

          // Verify all toolbars exist
          const allToolbars = yield* service.getAll();
          expect(allToolbars.length).toBe(2);

          // Verify each toolbar can be retrieved by ID
          for (const toolbar of toolbars) {
            const retrieved = yield* service.getById(toolbar.id);
            expect(retrieved).toEqual(toolbar);
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle concurrent operations", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create toolbars concurrently
          yield* Effect.all(
            toolbars.map((toolbar) => service.create(toolbar)),
            { concurrency: "unbounded" },
          );

          // Verify all toolbars exist
          const allToolbars = yield* service.getAll();
          expect(allToolbars.length).toBe(2);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle batch updates", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create toolbars
          for (const toolbar of toolbars) {
            yield* service.create(toolbar);
          }

          // Update all toolbars concurrently
          yield* Effect.all(
            toolbars.map((toolbar) =>
              service.update(toolbar.id, { visible: !toolbar.visible }),
            ),
            { concurrency: "unbounded" },
          );

          // Verify updates
          const updatedToolbars = yield* service.getAll();
          expect(updatedToolbars.length).toBe(2);

          const toolbar1 = yield* service.getById("toolbar-1");
          const toolbar2 = yield* service.getById("toolbar-2");

          expect(toolbar1?.visible).toBe(false); // was true
          expect(toolbar2?.visible).toBe(true); // was false
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Toolbar Items", () => {
    it("should handle complex toolbar items", async () => {
      const complexToolbar: ToolbarConfig = {
        id: "complex-toolbar",
        name: "Complex Toolbar",
        description: "Toolbar with various item types",
        items: [
          {
            id: "btn-1",
            type: "button",
            label: "Button",
            action: "button-action",
            icon: "button-icon",
            position: 0,
            disabled: false,
            tooltip: "Button tooltip",
          },
          {
            id: "sep-1",
            type: "separator",
            position: 1,
          },
          {
            id: "dropdown-1",
            type: "dropdown",
            label: "Dropdown",
            action: "dropdown-action",
            position: 2,
            options: [
              { id: "opt-1", label: "Option 1", action: "action-1" },
              { id: "opt-2", label: "Option 2", action: "action-2" },
              { id: "opt-3", label: "Option 3", action: "action-3" },
            ],
          },
          {
            id: "toggle-1",
            type: "toggle",
            label: "Toggle",
            action: "toggle-action",
            position: 3,
            checked: true,
          },
        ],
        position: "top",
        visible: true,
        metadata: {
          version: "1.0.0",
          author: "test",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      };

      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Create complex toolbar
          yield* service.create(complexToolbar);

          // Retrieve and verify
          const retrieved = yield* service.getById(complexToolbar.id);
          expect(retrieved).toEqual(complexToolbar);
          expect(retrieved?.items.length).toBe(4);

          // Verify specific item types
          const button = retrieved?.items.find(
            (item) => item.type === "button",
          );
          const separator = retrieved?.items.find(
            (item) => item.type === "separator",
          );
          const dropdown = retrieved?.items.find(
            (item) => item.type === "dropdown",
          );
          const toggle = retrieved?.items.find(
            (item) => item.type === "toggle",
          );

          expect(button).toBeDefined();
          expect(separator).toBeDefined();
          expect(dropdown).toBeDefined();
          expect(toggle).toBeDefined();

          expect(dropdown?.options?.length).toBe(3);
          expect(toggle?.checked).toBe(true);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Error Handling", () => {
    it("should map persistence errors correctly", () => {
      const error = new ToolbarPersistenceError({
        message: "Failed to save toolbar",
        operation: "save",
        cause: new Error("Storage error"),
      });

      expect(error.message).toBe("Failed to save toolbar");
      expect(error.operation).toBe("save");
      expect(error.cause).toBeInstanceOf(Error);
    });

    it("should handle load errors", async () => {
      // This test would be more meaningful with actual persistence layer
      // For now, we test the error structure
      const error = new ToolbarPersistenceError({
        message: "Failed to retrieve toolbar configs",
        operation: "load",
        cause: new Error("Database connection failed"),
      });

      expect(error.message).toBe("Failed to retrieve toolbar configs");
      expect(error.operation).toBe("load");
    });

    it("should handle delete errors", async () => {
      const error = new ToolbarPersistenceError({
        message: "Failed to delete toolbar config",
        operation: "delete",
        cause: new Error("Permission denied"),
      });

      expect(error.message).toBe("Failed to delete toolbar config");
      expect(error.operation).toBe("delete");
    });
  });

  describe("Service Integration", () => {
    it("should work with Effect combinators", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Test Effect.all with service methods
          const [allToolbars, nonExistent] = yield* Effect.all([
            service.getAll(),
            service.getById("non-existent"),
          ]);

          expect(Array.isArray(allToolbars)).toBe(true);
          expect(nonExistent).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle service scoping properly", async () => {
      // Test that multiple service instances work correctly
      const result1 = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;
          return yield* service.getAll();
        }).pipe(Effect.provide(TestLayer)),
      );

      const result2 = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;
          return yield* service.getAll();
        }).pipe(Effect.provide(TestLayer)),
      );

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });

    it("should handle effect composition", async () => {
      const testToolbar: ToolbarConfig = {
        id: "compose-test",
        name: "Composition Test",
        description: "Test toolbar for composition",
        items: [],
        position: "top",
        visible: true,
        metadata: {
          version: "1.0.0",
          author: "test",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      };

      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;

          // Compose multiple operations
          yield* service.create(testToolbar);
          const created = yield* service.getById(testToolbar.id);
          yield* service.update(testToolbar.id, { name: "Updated Name" });
          const updated = yield* service.getById(testToolbar.id);
          yield* service.delete(testToolbar.id);
          const deleted = yield* service.getById(testToolbar.id);

          expect(created).toEqual(testToolbar);
          expect(updated?.name).toBe("Updated Name");
          expect(deleted).toBeUndefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });
});

import { Effect } from "effect";
import { ToolbarService } from "./ToolbarService";

import { describe, expect, it } from "vitest";

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
});

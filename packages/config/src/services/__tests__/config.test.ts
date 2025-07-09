import { describe, it, expect, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import { ConfigService, ConfigServiceLive } from "../config";
import { StorageServiceLive, StorageService, StorageOptionsTag } from "../storage";
import { StorageOptions, Workspace } from "../../types";

describe("ConfigService", () => {
  const testDir = join(tmpdir(), "buddy-config-test");
  const testOptions: StorageOptions = { configDir: testDir };
  
  const runTest = <E, A>(
    effect: Effect.Effect<A, E, ConfigService>
  ) => Effect.gen(function* (_) {
    const storageLayer = Layer.succeed(StorageOptionsTag, testOptions);
    const serviceLayer = Layer.provide(StorageServiceLive, storageLayer);
    const configLayer = Layer.provide(ConfigServiceLive, serviceLayer);
    const result = yield* _(Effect.provide(effect, configLayer));
    return result;
  }).pipe(Effect.runPromise);

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should create and list workspaces", () => {
    return runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        const workspace = yield* _(config.createWorkspace({
          name: "Test Workspace",
          description: "Test Description"
        }));

        expect(workspace).toMatchObject({
          name: "Test Workspace",
          description: "Test Description"
        });

        const workspaces = yield* _(config.listWorkspaces());
        expect(workspaces).toHaveLength(1);
        expect(workspaces[0]).toEqual(workspace);

        const currentId = yield* _(config.getCurrentWorkspaceId());
        expect(currentId).toBe(workspace.id);
      })
    );
  });

  it("should update workspace", () => {
    return runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        const workspace = yield* _(config.createWorkspace({ name: "Test Workspace" }));
        const updated = yield* _(config.updateWorkspace(workspace.id, {
          description: "Updated Description",
          icon: "new-icon"
        }));

        expect(updated).toEqual({
          ...workspace,
          description: "Updated Description",
          icon: "new-icon",
          lastActiveAt: updated.lastActiveAt
        });

        const retrieved = yield* _(config.getWorkspace(workspace.id));
        expect(retrieved).toEqual(updated);
      })
    );
  });

  it("should delete workspace", () => {
    return runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        const workspace = yield* _(config.createWorkspace({ name: "Test Workspace" }));
        yield* _(config.deleteWorkspace(workspace.id));

        const retrieved = yield* _(config.getWorkspace(workspace.id));
        expect(retrieved).toBeNull();

        const currentId = yield* _(config.getCurrentWorkspaceId());
        expect(currentId).toBeNull();
      })
    );
  });

  it("should manage multiple workspaces", () => {
    return runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        const ws1 = yield* _(config.createWorkspace({ name: "First" }));
        const ws2 = yield* _(config.createWorkspace({ name: "Second" }));

        let currentId = yield* _(config.getCurrentWorkspaceId());
        expect(currentId).toBe(ws1.id);

        yield* _(config.setCurrentWorkspaceId(ws2.id));
        currentId = yield* _(config.getCurrentWorkspaceId());
        expect(currentId).toBe(ws2.id);

        yield* _(config.deleteWorkspace(ws1.id));
        const workspaces = yield* _(config.listWorkspaces());
        expect(workspaces).toHaveLength(1);
        expect(workspaces[0]?.id).toBe(ws2.id);
      })
    );
  });

  it("should handle errors for non-existent workspaces", async () => {
    await expect(runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        return yield* _(config.getWorkspace("non-existent"));
      })
    )).resolves.toBeNull();

    await expect(runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        return yield* _(config.updateWorkspace("non-existent", { name: "New Name" }));
      })
    )).rejects.toThrow("Workspace not found");

    await expect(runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        return yield* _(config.deleteWorkspace("non-existent"));
      })
    )).rejects.toThrow("Workspace not found");

    await expect(runTest(
      Effect.gen(function* (_) {
        const config = yield* _(ConfigService);
        return yield* _(config.setCurrentWorkspaceId("non-existent"));
      })
    )).rejects.toThrow("Workspace not found");
  });
});

import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StorageData, StorageOptions, Workspace } from "../../types";
import {
  StorageOptionsService,
  StorageService,
  StorageServiceLive,
} from "../storage";

describe("StorageService", () => {
  const testDir = join(tmpdir(), "buddy-test");
  const testOptions: StorageOptions = {
    configDir: testDir,
    createBackup: false,
  };

  const runTest = <E, A>(effect: Effect.Effect<A, E, StorageService>) =>
    Effect.gen(function* (_) {
      const storageOptionsLayer = Layer.succeed(
        StorageOptionsService,
        StorageOptionsService.of(testOptions)
      );
      const serviceLayer = Layer.provide(
        StorageServiceLive,
        storageOptionsLayer
      );
      const result = yield* _(Effect.provide(effect, serviceLayer));
      return result;
    }).pipe(Effect.runPromise);

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should return the correct config path", () => {
    return runTest(
      Effect.gen(function* (_) {
        const storage = yield* _(StorageService);
        const path = yield* _(storage.getPath());
        expect(path).toBe(join(testDir, ".buddy", "config.json"));
      })
    );
  });

  it("should write and read a file", () => {
    return runTest(
      Effect.gen(function* (_) {
        const storage = yield* _(StorageService);
        const workspace: Workspace = {
          id: "123",
          name: "test",
          description: "A test workspace",
          color: "#ffffff",
          icon: "test-icon",
          agentIds: [],
          chatappIds: [],
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isArchived: false,
          maxExpandedApps: 1,
          activeAppId: null,
        };

        const data: StorageData = {
          currentWorkspaceId: "123",
          workspaces: { "123": workspace },
          chatApps: {},
        };

        yield* _(storage.write(data));
        const readData = yield* _(storage.read());
        expect(readData).toEqual(data);
      })
    );
  });
});

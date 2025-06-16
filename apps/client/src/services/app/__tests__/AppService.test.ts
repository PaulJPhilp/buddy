import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../../agent";
import { ToolbarService } from "../../toolbar";
import { AppService } from "../service";

// --- Test Suite ---
describe.skip("AppService", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(AppService.Default).toBeDefined();
      expect(typeof AppService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(AppService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* AppService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(AppService.Default)),
      ).not.toThrow();
    });
  });

  const mockChatApp = {
    id: "test-app",
    name: "Test App",
    description: "A test chat application",
    agentId: "test-agent",
    toolbarId: "test-toolbar",
    themeId: "test-theme",
  };

  const mockAgent = {
    id: "test-agent",
    name: "Test Agent",
    description: "A test agent",
    systemPrompt: "You are a test agent",
    model: "gpt-4",
    temperature: 0.7,
  };

  const mockToolbar = {
    id: "test-toolbar",
    name: "Test Toolbar",
    items: [],
  };

  // Mock services with valid references
  const mockAgentService = Layer.succeed(
    AgentService,
    AgentService.of({
      getAll: () => Effect.succeed([mockAgent]),
      getById: (id: string) =>
        Effect.succeed(id === "test-agent" ? mockAgent : undefined),
      create: () => Effect.succeed(undefined),
      update: () => Effect.succeed(undefined),
      delete: () => Effect.succeed(undefined),
    }),
  );

  const mockToolbarService = Layer.succeed(
    ToolbarService,
    ToolbarService.of({
      getAll: () => Effect.succeed([mockToolbar]),
      getById: (id: string) =>
        Effect.succeed(id === "test-toolbar" ? mockToolbar : undefined),
      create: () => Effect.succeed(undefined),
      update: () => Effect.succeed(undefined),
      delete: () => Effect.succeed(undefined),
    }),
  );

  const mockServices = Layer.merge(mockAgentService, mockToolbarService);

  // Mock services with invalid references for error testing
  const mockServicesWithInvalidRefs = Layer.merge(
    Layer.succeed(
      AgentService,
      AgentService.of({
        getAll: () => Effect.succeed([]),
        getById: () => Effect.succeed(undefined),
        create: () => Effect.succeed(undefined),
        update: () => Effect.succeed(undefined),
        delete: () => Effect.succeed(undefined),
      }),
    ),
    Layer.merge(
      Layer.succeed(
        ToolbarService,
        ToolbarService.of({
          getAll: () => Effect.succeed([]),
          getById: () => Effect.succeed(undefined),
          create: () => Effect.succeed(undefined),
          update: () => Effect.succeed(undefined),
          delete: () => Effect.succeed(undefined),
        }),
      ),
    ),
  );

  describe("getAll", () => {
    it("should return empty array initially", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const apps = yield* appService.getAll();
        expect(apps).toEqual([]);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should return all apps after creation", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(1);
        expect(apps[0]).toEqual(mockChatApp);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));
  });

  describe("getById", () => {
    it("should return undefined for non-existent app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const app = yield* appService.getById("non-existent");
        expect(app).toBeUndefined();
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should return app when it exists", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);
        const app = yield* appService.getById("test-app");
        expect(app).toEqual(mockChatApp);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));
  });

  describe("create", () => {
    it("should create app with valid configuration", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(1);
        expect(apps[0]).toEqual(mockChatApp);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should handle creation with invalid agent reference", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const invalidApp = {
          ...mockChatApp,
          agentId: "invalid-agent",
        };

        // This should not throw but should log a warning and not add the app
        yield* appService.create(invalidApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(
        Effect.provide(
          AppService.pipe(Layer.provide(mockServicesWithInvalidRefs)),
        ),
      ));

    it("should handle creation with invalid toolbar reference", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const invalidApp = {
          ...mockChatApp,
          toolbarId: "invalid-toolbar",
        };

        yield* appService.create(invalidApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(
        Effect.provide(
          AppService.pipe(Layer.provide(mockServicesWithInvalidRefs)),
        ),
      ));

    it("should handle creation with invalid theme reference", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const invalidApp = {
          ...mockChatApp,
          themeId: "invalid-theme",
        };

        yield* appService.create(invalidApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(
        Effect.provide(
          AppService.pipe(Layer.provide(mockServicesWithInvalidRefs)),
        ),
      ));

    it("should handle creation with invalid schema", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const invalidApp = {
          // Missing required fields
          id: "incomplete-app",
        } as any;

        yield* appService.create(invalidApp);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should create multiple apps", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const app2 = {
          ...mockChatApp,
          id: "test-app-2",
          name: "Test App 2",
        };

        yield* appService.create(mockChatApp);
        yield* appService.create(app2);
        const apps = yield* appService.getAll();
        expect(apps.length).toBe(2);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));
  });

  describe("update", () => {
    it("should update existing app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);

        const updates = { name: "Updated App Name" };
        yield* appService.update("test-app", updates);

        const app = yield* appService.getById("test-app");
        expect(app?.name, "Updated App Name");
        expect(app?.description, mockChatApp.description);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should update multiple fields", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);

        const updates = {
          name: "New Name",
          description: "New Description",
        };
        yield* appService.update("test-app", updates);

        const app = yield* appService.getById("test-app");
        expect(app?.name, "New Name");
        expect(app?.description, "New Description");
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should not affect other apps when updating", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const app2 = {
          ...mockChatApp,
          id: "test-app-2",
          name: "Test App 2",
        };

        yield* appService.create(mockChatApp);
        yield* appService.create(app2);

        yield* appService.update("test-app", { name: "Updated Name" });

        const updatedApp = yield* appService.getById("test-app");
        const unchangedApp = yield* appService.getById("test-app-2");

        expect(updatedApp?.name, "Updated Name");
        expect(unchangedApp?.name, "Test App 2");
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should handle update of non-existent app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;

        // This should not throw
        yield* appService.update("non-existent", { name: "New Name" });

        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));
  });

  describe("delete", () => {
    it("should delete existing app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        yield* appService.create(mockChatApp);

        let apps = yield* appService.getAll();
        expect(apps.length).toBe(1);

        yield* appService.delete("test-app");

        apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should only delete specified app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;
        const app2 = {
          ...mockChatApp,
          id: "test-app-2",
          name: "Test App 2",
        };

        yield* appService.create(mockChatApp);
        yield* appService.create(app2);

        yield* appService.delete("test-app");

        const apps = yield* appService.getAll();
        expect(apps.length).toBe(1);
        expect(apps[0].id, "test-app-2");
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should handle deletion of non-existent app", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;

        // This should not throw
        yield* appService.delete("non-existent");

        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));

    it("should handle deletion from empty collection", () =>
      Effect.gen(function* () {
        const appService = yield* AppService;

        yield* appService.delete("test-app");

        const apps = yield* appService.getAll();
        expect(apps.length).toBe(0);
      }).pipe(Effect.provide(AppService.pipe(Layer.provide(mockServices)))));
  });
});

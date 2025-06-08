import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../agent";
import { ThemesService } from "../themes";
import { ToolbarService } from "../toolbar";
import { AppService } from "./AppService";

describe("AppService", () => {
  it("creates and retrieves an app", () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppService;
      const agentsService = yield* AgentService;
      const toolbarsService = yield* ToolbarService;
      const themesService = yield* ThemesService;

      // Create dependencies first
      const agent = { id: "test-agent", initialAgentName: "Test Agent" };
      yield* agentsService.create(agent);

      const toolbar = { id: "test-toolbar", name: "Test Toolbar", tools: [] };
      yield* toolbarsService.create(toolbar);

      const theme = {
        colors: { primary: "blue-500", secondary: "gray-200", accent: "blue-600", background: "white", text: "gray-800" },
        borders: { color: "gray-300", thickness: "1px", radius: "0.5rem" },
        bubbles: { user: { background: "blue-500", text: "auto", radius: "rounded-xl" }, agent: { background: "gray-200", text: "auto", radius: "rounded-xl" } },
        userArea: { background: "gray-50", inputRingColor: "blue-600" },
        header: { background: "blue-500", text: "auto" },
        typography: { fontFamily: "sans-serif", fontSize: "1rem" }
      };
      yield* themesService.setTheme("default", theme);

      // Create the app
      const app = {
        id: "test-app",
        name: "Test App",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "default",
      };
      yield* appsService.create(app);

      // Retrieve and verify
      const retrieved = yield* appsService.getById("test-app");
      expect(retrieved).toEqual(app);
    });

    // Provide all dependencies in the correct order
    return Effect.runPromise(
      Effect.provide(
        program,
        Layer.mergeAll(
          AgentService.Default,
          ToolbarService.Default,
          ThemesService.Default,
          AppService.Default,
        ),
      ),
    );
  });

  it("updates an app", () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppService;
      const agentsService = yield* AgentService;
      const toolbarsService = yield* ToolbarService;
      const themesService = yield* ThemesService;

      // Create dependencies first
      const agent = { id: "test-agent", initialAgentName: "Test Agent" };
      yield* agentsService.create(agent);

      const toolbar = { id: "test-toolbar", name: "Test Toolbar", tools: [] };
      yield* toolbarsService.create(toolbar);

      const theme = {
        colors: { primary: "blue-500", secondary: "gray-200", accent: "blue-600", background: "white", text: "gray-800" },
        borders: { color: "gray-300", thickness: "1px", radius: "0.5rem" },
        bubbles: { user: { background: "blue-500", text: "auto", radius: "rounded-xl" }, agent: { background: "gray-200", text: "auto", radius: "rounded-xl" } },
        userArea: { background: "gray-50", inputRingColor: "blue-600" },
        header: { background: "blue-500", text: "auto" },
        typography: { fontFamily: "sans-serif", fontSize: "1rem" }
      };
      yield* themesService.setTheme("default", theme);

      // Create the app
      const app = {
        id: "test-app",
        name: "Test App",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "default",
      };
      yield* appsService.create(app);

      // Update the app
      const update = { name: "Updated App" };
      yield* appsService.update("test-app", update);

      // Retrieve and verify
      const retrieved = yield* appsService.getById("test-app");
      expect(retrieved).toEqual({ ...app, ...update });
    });

    return Effect.runPromise(
      Effect.provide(
        program,
        Layer.mergeAll(
          AgentService.Default,
          ToolbarService.Default,
          ThemesService.Default,
          AppService.Default,
        ),
      ),
    );
  });

  it("deletes an app", () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppService;
      const agentsService = yield* AgentService;
      const toolbarsService = yield* ToolbarService;
      const themesService = yield* ThemesService;

      // Create dependencies first
      const agent = { id: "test-agent", initialAgentName: "Test Agent" };
      yield* agentsService.create(agent);

      const toolbar = { id: "test-toolbar", name: "Test Toolbar", tools: [] };
      yield* toolbarsService.create(toolbar);

      const theme = {
        colors: { primary: "blue-500", secondary: "gray-200", accent: "blue-600", background: "white", text: "gray-800" },
        borders: { color: "gray-300", thickness: "1px", radius: "0.5rem" },
        bubbles: { user: { background: "blue-500", text: "auto", radius: "rounded-xl" }, agent: { background: "gray-200", text: "auto", radius: "rounded-xl" } },
        userArea: { background: "gray-50", inputRingColor: "blue-600" },
        header: { background: "blue-500", text: "auto" },
        typography: { fontFamily: "sans-serif", fontSize: "1rem" }
      };
      yield* themesService.setTheme("default", theme);

      // Create the app
      const app = {
        id: "test-app",
        name: "Test App",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "default",
      };
      yield* appsService.create(app);

      // Delete the app
      yield* appsService.delete("test-app");

      // Verify it's gone
      const retrieved = yield* appsService.getById("test-app");
      expect(retrieved).toBeUndefined();
    });

    return Effect.runPromise(
      Effect.provide(
        program,
        Layer.mergeAll(
          AgentService.Default,
          ToolbarService.Default,
          ThemesService.Default,
          AppService.Default,
        ),
      ),
    );
  });

  it("lists all apps", () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppService;
      const agentsService = yield* AgentService;
      const toolbarsService = yield* ToolbarService;
      const themesService = yield* ThemesService;

      // Create dependencies first
      const agent = { id: "test-agent", initialAgentName: "Test Agent" };
      yield* agentsService.create(agent);

      const toolbar = { id: "test-toolbar", name: "Test Toolbar", tools: [] };
      yield* toolbarsService.create(toolbar);

      const theme = {
        colors: { primary: "blue-500", secondary: "gray-200", accent: "blue-600", background: "white", text: "gray-800" },
        borders: { color: "gray-300", thickness: "1px", radius: "0.5rem" },
        bubbles: { user: { background: "blue-500", text: "auto", radius: "rounded-xl" }, agent: { background: "gray-200", text: "auto", radius: "rounded-xl" } },
        userArea: { background: "gray-50", inputRingColor: "blue-600" },
        header: { background: "blue-500", text: "auto" },
        typography: { fontFamily: "sans-serif", fontSize: "1rem" }
      };
      yield* themesService.setTheme("default", theme);

      // Create multiple apps
      const app1 = {
        id: "test-app-1",
        name: "Test App 1",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "default",
      };
      const app2 = {
        id: "test-app-2",
        name: "Test App 2",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "default",
      };

      yield* appsService.create(app1);
      yield* appsService.create(app2);

      // List all apps and verify
      const apps = yield* appsService.getAll();
      expect(apps.length).toBe(2);
      expect(apps).toContainEqual(app1);
      expect(apps).toContainEqual(app2);
    });

    return Effect.runPromise(
      Effect.provide(
        program,
        Layer.mergeAll(
          AgentService.Default,
          ToolbarService.Default,
          ThemesService.Default,
          AppService.Default,
        ),
      ),
    );
  });
});

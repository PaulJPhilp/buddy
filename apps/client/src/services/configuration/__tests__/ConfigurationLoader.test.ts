import { Duration, Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../../agent";
import { AppService } from "../../app";
import { ThemesService } from "../../themes/ThemesService";
import { ToolbarService } from "../../toolbar";

// --- Test Suite ---
describe("ConfigurationLoader", () => {
  // Test individual service defaults first
  describe("Service Dependencies", () => {
    it("should have valid AgentService.Default", () => {
      expect(AgentService.Default).toBeDefined();
      expect(typeof AgentService.Default).toBe("object");
    });

    it("should have valid AppService.Default", () => {
      expect(AppService.Default).toBeDefined();
      expect(typeof AppService.Default).toBe("object");
    });

    it("should have valid ThemesService.Default", () => {
      expect(ThemesService.Default).toBeDefined();
      expect(typeof ThemesService.Default).toBe("object");
    });

    it("should have valid ToolbarService.Default", () => {
      expect(ToolbarService.Default).toBeDefined();
      expect(typeof ToolbarService.Default).toBe("object");
    });

    it("should be able to use AgentService alone", async () => {
      const testEffect = Effect.gen(function* () {
        const agentService = yield* AgentService;
        const agents = yield* agentService.getAll();
        expect(Array.isArray(agents)).toBe(true);
        return "agent_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(AgentService.Default))
      );

      expect(result).toBe("agent_success");
    });

    it("should be able to use ThemesService alone", async () => {
      const testEffect = Effect.gen(function* () {
        const themesService = yield* ThemesService;
        const themes = yield* themesService.listThemes();
        expect(typeof themes).toBe("object");
        return "themes_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(ThemesService.Default))
      );

      expect(result).toBe("themes_success");
    });

    it("should be able to use ToolbarService alone", async () => {
      const testEffect = Effect.gen(function* () {
        const toolbarService = yield* ToolbarService;
        const toolbars = yield* toolbarService.getAll();
        expect(Array.isArray(toolbars)).toBe(true);
        return "toolbar_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(ToolbarService.Default))
      );

      expect(result).toBe("toolbar_success");
    });

    it("should be able to check AppService.Default type", () => {
      // Let's inspect what AppService.Default actually is
      console.log("AppService.Default:", AppService.Default);
      console.log("AppService.Default constructor:", AppService.Default.constructor.name);
      console.log("AppService.Default keys:", Object.keys(AppService.Default));
      
      expect(AppService.Default).toBeDefined();
    });

    it("should be able to use AppService with its dependencies", async () => {
      const appServiceLayer = Layer.mergeAll(
        AgentService.Default,
        ThemesService.Default,
        ToolbarService.Default,
        AppService.Default
      );

      const testEffect = Effect.gen(function* () {
        const appService = yield* AppService;
        const apps = yield* appService.getAll();
        expect(Array.isArray(apps)).toBe(true);
        return "app_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(appServiceLayer))
      );

      expect(result).toBe("app_success");
    });

    it("should be able to merge AgentService and ThemesService", async () => {
      const testServices = Layer.mergeAll(
        AgentService.Default,
        ThemesService.Default
      );

      const testEffect = Effect.gen(function* () {
        const agentService = yield* AgentService;
        const themesService = yield* ThemesService;
        
        const agents = yield* agentService.getAll();
        const themes = yield* themesService.listThemes();
        
        expect(Array.isArray(agents)).toBe(true);
        expect(typeof themes).toBe("object");
        return "merge_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(testServices))
      );

      expect(result).toBe("merge_success");
    });

    it("should be able to merge all three base services", async () => {
      const testServices = Layer.mergeAll(
        AgentService.Default,
        ThemesService.Default,
        ToolbarService.Default
      );

      const testEffect = Effect.gen(function* () {
        const agentService = yield* AgentService;
        const themesService = yield* ThemesService;
        const toolbarService = yield* ToolbarService;
        
        const agents = yield* agentService.getAll();
        const themes = yield* themesService.listThemes();
        const toolbars = yield* toolbarService.getAll();
        
        expect(Array.isArray(agents)).toBe(true);
        expect(typeof themes).toBe("object");
        expect(Array.isArray(toolbars)).toBe(true);
        return "all_base_success";
      });

      const result = await Effect.runPromise(
        testEffect.pipe(Effect.provide(testServices))
      );

      expect(result).toBe("all_base_success");
    });
  });
}); 
import { Effect, HashMap, Layer, Ref } from "effect";
import React from "react";
import type { ToolbarManagerApi, ToolbarComponentApi } from "./api";
import { ToolbarComponent } from "./component";
import { ToolbarError } from "./errors";
import { ToolbarService } from "./service";
import type { ToolbarInstance } from "./types";
// Import ToolbarContainer once it's created
// import { ToolbarContainer } from "@/packages/ui/components/Toolbar/Toolbar";

/**
 * Orchestrates all toolbar instances within the application.
 * It caches instances of ToolbarComponent for performance and provides
 * a single entry point for accessing and rendering toolbars.
 */
export class ToolbarManager extends Effect.Service<ToolbarManagerApi>()(
  "ToolbarManager",
  {
    scoped: Effect.gen(function* () {
      // Dependencies
      const toolbarService = yield* ToolbarService;
      const componentCache = yield* Ref.make(
        HashMap.empty<string, ToolbarComponentApi>()
      );

      /**
       * Gets or creates a ToolbarComponent instance for a given toolbar ID.
       */
      const getOrCreateComponent = (id: string) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(componentCache);
          const cached = HashMap.get(cache, id);

          if (cached._tag === "Some") {
            return cached.value;
          }

          // Create a new component if not in cache
          const component = yield* ToolbarComponent;
          const config = yield* toolbarService.loadToolbarConfig(id);
          yield* component.initialize(config);

          // Add to cache
          yield* Ref.update(componentCache, HashMap.set(id, component));
          return component;
        });

      /**
       * Retrieves a toolbar instance by its ID.
       */
      const getToolbarInstance = (id: string) =>
        Effect.gen(function* () {
          const component = yield* getOrCreateComponent(id);
          return yield* component.getInstance();
        }).pipe(Effect.mapError((e) => new ToolbarError({ 
          message: "Failed to get toolbar instance", 
          cause: e instanceof Error ? e : new Error(String(e))
        })));

      /**
       * Renders a toolbar React component.
       * NOTE: This is a placeholder. It will be implemented once ToolbarContainer is built.
       */
      const renderToolbar = (id: string) =>
        Effect.gen(function* () {
          const instance = yield* getToolbarInstance(id);
          // return React.createElement(ToolbarContainer, { instance });
          return React.createElement("div", {}, `Toolbar: ${id}`); // Placeholder
        });

      return {
        getToolbarInstance,
        renderToolbar,
      };
    }),
    dependencies: [ToolbarService.Default],
  }
) {}

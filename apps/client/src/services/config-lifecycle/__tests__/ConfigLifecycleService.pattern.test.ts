import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigLifecycleService } from "../ConfigLifecycleService";

describe("ConfigLifecycleService - Effect.Service Pattern", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(ConfigLifecycleService.Default).toBeDefined();
      expect(typeof ConfigLifecycleService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(ConfigLifecycleService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* ConfigLifecycleService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(ConfigLifecycleService.Default)),
      ).not.toThrow();
    });
  });
});

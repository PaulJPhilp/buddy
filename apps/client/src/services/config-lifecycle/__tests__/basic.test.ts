import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigLifecycleService } from "../ConfigLifecycleService";
import "./setup"; // Import setup to start real API server

describe("ConfigLifecycleService - Basic Integration", () => {
  it("should be able to call the API endpoints", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConfigLifecycleService;

        // Test real API call to external service
        const configs = yield* service.loadConfigs();

        return {
          success: true,
          configCount: configs.length,
          hasConfigs: configs.length > 0,
        };
      }).pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    expect(result.success).toBe(true);
    expect(typeof result.configCount).toBe("number");
    expect(result.configCount).toBeGreaterThanOrEqual(0);
  });

  it("should handle API errors gracefully", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConfigLifecycleService;

        // Try to perform operation that might fail with real external service
        const saveResult = yield* service
          .saveConfig("non-existent-config")
          .pipe(Effect.either);

        return saveResult;
      }).pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    // Real external service should return proper error response
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toHaveProperty("_tag");
    }
  });
});

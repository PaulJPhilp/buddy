import { Effect, Runtime } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigService } from "../service";

describe("ConfigService", () => {
  describe("buildApiUrl", () => {
    it("should build API URLs with leading slash", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ConfigService;
        return yield* service.buildApiUrl("/users");
      });

      const url = await Effect.runPromise(
        program.pipe(Effect.provide(ConfigService.Default)),
      );
      expect(url).toBe("http://localhost:3000/users");
    });

    it("should build API URLs without leading slash", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ConfigService;
        return yield* service.buildApiUrl("users");
      });

      const url = await Effect.runPromise(
        program.pipe(Effect.provide(ConfigService.Default)),
      );
      expect(url).toBe("http://localhost:3000/users");
    });
  });

  describe("buildChatUrl", () => {
    it("should build chat URLs with chatId parameter", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ConfigService;
        return yield* service.buildChatUrl("test-chat-123");
      });

      const url = await Effect.runPromise(
        program.pipe(Effect.provide(ConfigService.Default)),
      );
      expect(url).toBe("ws://localhost:8080/chat?chatId=test-chat-123");
    });
  });
});

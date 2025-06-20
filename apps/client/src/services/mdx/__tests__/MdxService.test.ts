/**
 * @file MdxService Tests
 * @module services/mdx/MdxService.test
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { MdxService } from "../service";

describe("MdxService", () => {
  const TestLayer = MdxService.Default;

  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(MdxService.Default).toBeDefined();
      expect(typeof MdxService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(MdxService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* MdxService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(MdxService.Default)),
      ).not.toThrow();
    });
  });

  it("should compile simple markdown for llm-ui", () =>
    Effect.gen(function* () {
      const service = yield* MdxService;
      const result = yield* service.compileForLlmUi(
        "# Hello World\n\nThis is **bold** text.",
      );

      expect(result.rawMarkdown).toBe(
        "# Hello World\n\nThis is **bold** text.",
      );
      expect(result.frontmatter).toEqual({});
      expect(result.metadata).toEqual({ llmUiMode: true });
    }).pipe(Effect.provide(TestLayer)));

  it("should parse frontmatter correctly for llm-ui", () =>
    Effect.gen(function* () {
      const service = yield* MdxService;
      const mdxWithFrontmatter = `---
title: Test Document
author: Test Author
---

# Content

This is the main content.`;

      const result = yield* service.compileForLlmUi(mdxWithFrontmatter);

      expect(result.frontmatter).toEqual({
        title: "Test Document",
        author: "Test Author",
      });
      expect(result.rawMarkdown).toBe("# Content\n\nThis is the main content.");
      expect(result.metadata).toEqual({ llmUiMode: true });
    }).pipe(Effect.provide(TestLayer)));

  it("should handle empty content for llm-ui", () =>
    Effect.gen(function* () {
      const service = yield* MdxService;
      const result = yield* service.compileForLlmUi("");

      expect(result.rawMarkdown).toBe("");
      expect(result.frontmatter).toEqual({});
      expect(result.metadata).toEqual({ llmUiMode: true });
    }).pipe(Effect.provide(TestLayer)));
});

/**
 * @file MdxService Tests
 * @module services/mdx/MdxService.test
 */

import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { MdxService } from "../service"

describe("MdxService", () => {
  const TestLayer = MdxService.Default

  it("should compile simple markdown to HTML", () =>
    Effect.gen(function* () {
      const service = yield* MdxService
      const result = yield* service.compile("# Hello World\n\nThis is **bold** text.")

      expect(result.compiledSource).toContain("<h1>Hello World</h1>")
      expect(result.compiledSource).toContain("<strong>bold</strong>")
      expect(result.frontmatter).toEqual({})
    }).pipe(Effect.provide(TestLayer)))

  it("should parse frontmatter correctly", () =>
    Effect.gen(function* () {
      const service = yield* MdxService
      const mdxWithFrontmatter = `---
title: Test Document
author: Test Author
---

# Content

This is the main content.`

      const result = yield* service.compile(mdxWithFrontmatter)

      expect(result.frontmatter).toEqual({
        title: "Test Document",
        author: "Test Author"
      })
      expect(result.compiledSource).toContain("<h1>Content</h1>")
      expect(result.compiledSource).not.toContain("title: Test Document")
    }).pipe(Effect.provide(TestLayer)))

  it("should handle GitHub Flavored Markdown features", () =>
    Effect.gen(function* () {
      const service = yield* MdxService
      const gfmContent = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

~~strikethrough~~
`

      const result = yield* service.compile(gfmContent)

      expect(result.compiledSource).toContain("<table>")
      expect(result.compiledSource).toContain("<del>strikethrough</del>")
    }).pipe(Effect.provide(TestLayer)))

  it("should handle empty content", () =>
    Effect.gen(function* () {
      const service = yield* MdxService
      const result = yield* service.compile("")

      expect(result.compiledSource).toBe("")
      expect(result.frontmatter).toEqual({})
    }).pipe(Effect.provide(TestLayer)))

  it("should fail when compileFile is called in browser environment", () =>
    Effect.gen(function* () {
      const service = yield* MdxService
      
      const result = yield* service.compileFile().pipe(
        Effect.either
      )

      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("MdxCompilationError")
      }
    }).pipe(Effect.provide(TestLayer)))
}) 
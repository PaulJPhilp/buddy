import { Effect, Layer } from "effect";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { MdxServiceApi } from "./api";
import { MdxCompilationError, MdxParsingError } from "./errors";
import type { MdxCompileOptions } from "./types";

/**
 * MDX service implementation using Effect.Service pattern.
 * Provides MDX compilation capabilities with proper error handling.
 *
 * DEBUG: To re-enable debug logging, uncomment the console.log statements
 * marked with "DEBUG:" comments throughout this file.
 */
export class MdxService extends Effect.Service<MdxServiceApi>()("MdxService", {
  scoped: Effect.gen(function* () {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify);

    const compile = (mdxContent: string, options?: MdxCompileOptions) =>
      Effect.gen(function* () {
        try {
          // Parse frontmatter
          const { content, data: frontmatter } = matter(mdxContent);

          // Process MDX content
          const result = yield* Effect.promise(() => processor.process(content));

          return {
            html: String(result),
            frontmatter,
          };
        } catch (error) {
          throw new MdxCompilationError({
            message: "Failed to compile MDX content",
            cause: error,
          });
        }
      });

    const compileFile = (filePath: string, options?: MdxCompileOptions) =>
      Effect.gen(function* () {
        try {
          // Read file content
          const content = yield* Effect.promise(() =>
            Bun.file(filePath).text(),
          );

          // Compile MDX
          return yield* compile(content, options);
        } catch (error) {
          throw new MdxParsingError({
            message: "Failed to parse MDX file",
            filePath,
            cause: error,
          });
        }
      });

    return {
      compile,
      compileFile,
    };
  }),
  dependencies: [],
});

// Create the layer for dependency injection
export const MdxServiceLive = Layer.effect(
  MdxService,
  Effect.succeed({
    compile: (mdxContent: string, options?: MdxCompileOptions) =>
      Effect.gen(function* () {
        // Parse frontmatter
        const { content, data: frontmatter } = yield* Effect.try({
          try: () => matter(mdxContent),
          catch: (err) =>
            new MdxParsingError({
              underlyingError: err,
              details: "Failed to parse frontmatter",
            }),
        });

        // Create unified processor pipeline for markdown to HTML with GFM support
        const processor = unified()
          .use(remarkParse) // Parse markdown
          .use(remarkGfm) // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
          .use(remarkRehype) // Convert to HTML AST
          .use(rehypeStringify); // Stringify to HTML

        // Process the markdown content
        const result = yield* Effect.tryPromise({
          try: () => processor.process(content),
          catch: (err) =>
            new MdxCompilationError({
              underlyingError: err,
              details: "Markdown to HTML compilation failed",
            }),
        });

        const htmlOutput = String(result.value);

        return {
          compiledSource: htmlOutput,
          frontmatter,
          metadata: result.data || {},
        };
      }).pipe(
        Effect.tapError((e) => {
          console.log(`MDX processing error: ${e._tag}`);
          return Effect.succeed(undefined);
        }),
      ),

    compileFile: () =>
      Effect.fail(
        new MdxCompilationError({
          underlyingError: new Error("compileFile not supported in browser"),
          details:
            "File system operations are not available in the browser environment",
        }),
      ),
  }),
);

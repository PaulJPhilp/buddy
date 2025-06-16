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
        // Parse frontmatter
        const { content, data: frontmatter } = yield* Effect.try({
          try: () => matter(mdxContent),
          catch: (err) =>
            new MdxParsingError({
              message: "Failed to parse frontmatter",
              cause: err,
            }),
        });

        // Process the markdown content
        const result = yield* Effect.tryPromise({
          try: () => processor.process(content),
          catch: (err) =>
            new MdxCompilationError({
              message: "Markdown to HTML compilation failed",
              cause: err,
            }),
        });

        const htmlOutput = String(result.value);

        return {
          compiledSource: htmlOutput,
          frontmatter,
          metadata: result.data || {},
        };
      }).pipe(
        Effect.mapError(
          (error) =>
            new MdxCompilationError({
              message: "Failed to compile MDX content",
              cause: error,
            }),
        ),
      );

    const compileFile = (filePath: string, options?: MdxCompileOptions) =>
      Effect.gen(function* () {
        // Read file content
        const content = yield* Effect.tryPromise({
          try: () => Bun.file(filePath).text(),
          catch: (err) =>
            new MdxParsingError({
              message: "Failed to read MDX file",
              filePath,
              cause: err,
            }),
        });

        // Compile MDX
        return yield* compile(content, options);
      });

    return {
      compile,
      compileFile,
    } satisfies MdxServiceApi;
  }),
  dependencies: [],
}) {}

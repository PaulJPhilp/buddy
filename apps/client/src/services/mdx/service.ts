import { Effect } from "effect";
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

    const compileForLlmUi = (mdxContent: string, options?: MdxCompileOptions) =>
      Effect.gen(function* () {
        // Parse frontmatter (same as regular compile)
        const { content, data: frontmatter } = yield* Effect.try({
          try: () => matter(mdxContent),
          catch: (err) =>
            new MdxParsingError({
              message: "Failed to parse frontmatter",
              cause: err,
            }),
        });

        // For llm-ui, we return the raw markdown instead of compiled HTML
        // llm-ui will handle the markdown processing itself
        return {
          rawMarkdown: content,
          frontmatter,
          metadata: { llmUiMode: true },
        };
      }).pipe(
        Effect.mapError(
          (error) =>
            new MdxCompilationError({
              message: "Failed to prepare content for llm-ui",
              cause: error,
            }),
        ),
      );

    return {
      compileForLlmUi,
    } satisfies MdxServiceApi;
  }),
  dependencies: [],
}) {}

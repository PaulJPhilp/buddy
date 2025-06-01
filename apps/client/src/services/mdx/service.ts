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
export class MdxService extends Effect.Service<MdxServiceApi>()(
    "MdxService",
    {
        effect: Effect.succeed({
            compile: (mdxContent: string, options?: MdxCompileOptions) =>
                Effect.gen(function* () {
                    // DEBUG: Uncomment for detailed compilation logging
                    // console.log("[MdxService] 🔄 Starting compilation for content:", {
                    //     content: mdxContent,
                    //     contentLength: mdxContent.length,
                    //     options
                    // });

                    // Parse frontmatter
                    const { content, data: frontmatter } = yield* Effect.try({
                        try: () => matter(mdxContent),
                        catch: (err) => new MdxParsingError({
                            underlyingError: err,
                            details: "Failed to parse frontmatter",
                        }),
                    });

                    // DEBUG: Uncomment for frontmatter parsing details
                    // console.log("[MdxService] 📝 Parsed frontmatter:", {
                    //     content,
                    //     frontmatter,
                    //     contentAfterFrontmatter: content
                    // });

                    // Create unified processor pipeline for markdown to HTML with GFM support
                    const processor = unified()
                        .use(remarkParse) // Parse markdown
                        .use(remarkGfm) // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
                        .use(remarkRehype) // Convert to HTML AST
                        .use(rehypeStringify); // Stringify to HTML

                    // DEBUG: Uncomment for processor pipeline status
                    // console.log("[MdxService] 🏗️ Created unified processor, processing content...");

                    // Process the markdown content
                    const result = yield* Effect.tryPromise({
                        try: () => processor.process(content),
                        catch: (err) => new MdxCompilationError({
                            underlyingError: err,
                            details: "Markdown to HTML compilation failed",
                        }),
                    });

                    const htmlOutput = String(result.value);
                    // DEBUG: Uncomment for compilation results
                    // console.log("[MdxService] ✅ Compilation complete:", {
                    //     originalContent: content,
                    //     htmlOutput,
                    //     htmlLength: htmlOutput.length,
                    //     hasStrongTags: htmlOutput.includes('<strong>'),
                    //     hasBoldTags: htmlOutput.includes('<b>'),
                    //     resultData: result.data
                    // });

                    return {
                        compiledSource: htmlOutput,
                        frontmatter,
                        metadata: result.data || {},
                    };
                }).pipe(
                    Effect.tapError((e) =>
                        Effect.logDebug(`MDX processing error: ${e._tag}`)
                    )
                ),

            compileFile: () =>
                Effect.fail(new MdxCompilationError({
                    underlyingError: new Error("compileFile not supported in browser"),
                    details: "File system operations are not available in the browser environment",
                })),
        }),
        dependencies: [],
    },
) { }

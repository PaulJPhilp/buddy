import type { PluggableList } from "unified";

// --- Types ---
export interface MdxCompileOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  development?: boolean;
  outputFormat?: "function-body" | "program";
}

export interface MdxCompilationResult {
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

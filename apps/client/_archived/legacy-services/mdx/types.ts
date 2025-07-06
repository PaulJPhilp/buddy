import type { PluggableList } from "unified";

// --- Types ---
export interface MdxCompileOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  development?: boolean;
  outputFormat?: "function-body" | "program";
}

// --- llm-ui Integration Types ---
export interface LlmUiCompilationResult {
  rawMarkdown: string;
  frontmatter: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  // llm-ui will handle the actual rendering
}

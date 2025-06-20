import { Effect } from "effect";
import type { MdxError } from "./errors";
import type { LlmUiCompilationResult, MdxCompileOptions } from "./types";

export interface MdxServiceApi {
  readonly compileForLlmUi: (
    mdxContent: string,
    options?: MdxCompileOptions,
  ) => Effect.Effect<LlmUiCompilationResult, MdxError>;
}

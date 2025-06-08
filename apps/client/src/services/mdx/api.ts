import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import type { MdxError } from "./errors";
import type { MdxCompilationResult, MdxCompileOptions } from "./types";

export interface MdxServiceApi {
  readonly compile: (
    mdxContent: string,
    options?: MdxCompileOptions,
  ) => Effect.Effect<MdxCompilationResult, MdxError>;

  readonly compileFile: (
    filePath: string,
    options?: MdxCompileOptions,
  ) => Effect.Effect<MdxCompilationResult, MdxError | NoSuchElementException>;
}

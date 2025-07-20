export class WorkspaceToolError extends Error {
  constructor(
    public readonly operation: string,
    public readonly details: string,
    public readonly cause?: unknown
  ) {
    super(`WorkspaceToolError during ${operation}: ${details}`);
    this.name = "WorkspaceToolError";
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${
        cause instanceof Error ? cause.stack : String(cause)
      }`;
    }
  }
}

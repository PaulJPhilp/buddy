import { Effect } from "effect";
import type { WorkspaceModel } from "../../../client/src/domain";

// Output format types
export type OutputFormat = "table" | "json" | "yaml";

// Output formatter service interface
export interface OutputFormatterApi {
  readonly formatWorkspaces: (
    workspaces: WorkspaceModel[],
    format: OutputFormat
  ) => Effect.Effect<string, never>;
  readonly formatWorkspace: (
    workspace: WorkspaceModel,
    format: OutputFormat
  ) => Effect.Effect<string, never>;
  readonly formatError: (error: unknown) => Effect.Effect<string, never>;
  readonly formatSuccess: (message: string) => Effect.Effect<string, never>;
  readonly formatWarning: (message: string) => Effect.Effect<string, never>;
}

// Output formatter implementation
export class OutputFormatter extends Effect.Service<OutputFormatterApi>()(
  "OutputFormatter",
  {
    effect: Effect.succeed({
      formatWorkspaces: (workspaces: WorkspaceModel[], format: OutputFormat) =>
        Effect.gen(function* () {
          switch (format) {
            case "json":
              return JSON.stringify(workspaces, null, 2);
            case "yaml":
              return yield* formatAsYaml(workspaces);
            case "table":
            default:
              return yield* formatWorkspacesAsTable(workspaces);
          }
        }),

      formatWorkspace: (workspace: WorkspaceModel, format: OutputFormat) =>
        Effect.gen(function* () {
          switch (format) {
            case "json":
              return JSON.stringify(workspace, null, 2);
            case "yaml":
              return yield* formatAsYaml(workspace);
            case "table":
            default:
              return yield* formatWorkspaceAsTable(workspace);
          }
        }),

      formatError: (error: unknown) =>
        Effect.succeed(
          `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        ),

      formatSuccess: (message: string) => Effect.succeed(`✅ ${message}`),

      formatWarning: (message: string) => Effect.succeed(`⚠️ ${message}`),
    }),
    dependencies: [],
  }
) {}

// Helper functions
const formatWorkspacesAsTable = (workspaces: WorkspaceModel[]) =>
  Effect.gen(function* () {
    if (workspaces.length === 0) {
      return "No workspaces found.";
    }

    const headers = ["ID", "Name", "Description", "Chat Apps", "Created"];
    const rows = workspaces.map((workspace) => [
      workspace.id,
      workspace.name,
      workspace.description || "-",
      workspace.chatappIds.length.toString(),
      formatRelativeTime(new Date(workspace.createdAt)),
    ]);

    return createTable(headers, rows);
  });

const formatWorkspaceAsTable = (workspace: WorkspaceModel) =>
  Effect.gen(function* () {
    const details = [
      ["ID", workspace.id],
      ["Name", workspace.name],
      ["Description", workspace.description || "-"],
      ["Chat Apps", workspace.chatappIds.length.toString()],
      ["Agents", workspace.agentIds.length.toString()],
      ["Created", formatRelativeTime(new Date(workspace.createdAt))],
      ["Updated", formatRelativeTime(new Date(workspace.updatedAt))],
    ];

    return createTable(["Property", "Value"], details);
  });

const formatAsYaml = (data: unknown) =>
  Effect.gen(function* () {
    // Simple YAML formatting (for basic objects)
    return JSON.stringify(data, null, 2)
      .replace(/"/g, "")
      .replace(/,$/gm, "")
      .replace(/^\s*{$/gm, "")
      .replace(/^\s*}$/gm, "");
  });

const createTable = (headers: string[], rows: string[][]) => {
  const colWidths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] || "").length))
  );

  const separator =
    "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";

  const headerRow =
    "|" +
    headers.map((header, i) => ` ${header.padEnd(colWidths[i])} `).join("|") +
    "|";

  const dataRows = rows.map(
    (row) =>
      "|" +
      row.map((cell, i) => ` ${(cell || "").padEnd(colWidths[i])} `).join("|") +
      "|"
  );

  return [separator, headerRow, separator, ...dataRows, separator].join("\n");
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

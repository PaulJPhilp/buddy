import { Args, Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import { ConfigService } from "../../../client/src/services/config";
import { CliConfig } from "../services/cli-config";
import { OutputFormatter } from "../services/output-formatter";

// ChatApp create command
const createChatApp = Command.make(
  "create",
  {
    name: Args.text({ name: "name" }),
    workspaceId: Options.text("workspace").pipe(Options.withAlias("w")),
    agentId: Options.text("agent").pipe(Options.optional),
    description: Options.text("description").pipe(Options.optional),
    verify: Options.boolean("verify").pipe(Options.optional),
  },
  ({ name, workspaceId, agentId, description, verify }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;

      // Verify workspace exists
      const workspace = yield* configService.getWorkspace(workspaceId).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Workspace not found: ${workspaceId}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(
              new Error(`Workspace not found: ${workspaceId}`)
            );
          })
        )
      );

      // Create chat app
      const chatApp = yield* configService.createChatApp({
        name,
        description: description || `${name} chat app`,
        workspaceId,
        agentId: agentId || workspace.agentIds[0] || "default-agent",
        config: {
          systemPrompt: `You are ${name}, a helpful AI assistant.`,
          model: "gpt-4",
          temperature: 0.7,
        },
      });

      const successMessage = yield* formatter.formatSuccess(
        `Created chat app "${chatApp.name}" in workspace "${workspace.name}"`
      );

      yield* Console.log(successMessage);
      yield* Console.log(`Chat App ID: ${chatApp.id}`);

      // Auto-verify if requested
      if (verify) {
        yield* Console.log("\n🔍 Verifying created chat app...");

        // Check if chat app can be retrieved
        const retrievedChatApp = yield* configService
          .getChatApp(chatApp.id)
          .pipe(
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                const errorMsg = yield* formatter.formatError(
                  `❌ Verification failed: ${error.message}`
                );
                yield* Console.error(errorMsg);
                return yield* Effect.fail(error);
              })
            )
          );

        // Verify workspace reference
        const workspaceExists = yield* configService
          .getWorkspace(retrievedChatApp.workspaceId)
          .pipe(
            Effect.map(() => true),
            Effect.catchAll(() => Effect.succeed(false))
          );

        // Verify agent reference
        const agentExists = retrievedChatApp.agentId
          ? yield* configService.getAgent(retrievedChatApp.agentId).pipe(
              Effect.map(() => true),
              Effect.catchAll(() => Effect.succeed(false))
            )
          : Effect.succeed(true);

        const issues = [];
        if (!workspaceExists) {
          issues.push(
            `Referenced workspace not found: ${retrievedChatApp.workspaceId}`
          );
        }
        if (!agentExists && retrievedChatApp.agentId) {
          issues.push(
            `Referenced agent not found: ${retrievedChatApp.agentId}`
          );
        }

        if (issues.length > 0) {
          const warningMsg = yield* formatter.formatWarning(
            `⚠️ Warning: ${issues.join(", ")}`
          );
          yield* Console.log(warningMsg);
        } else {
          const verifySuccess = yield* formatter.formatSuccess(
            "✅ Chat app verification passed"
          );
          yield* Console.log(verifySuccess);
        }
      }
    })
);

// ChatApp list command
const listChatApps = Command.make(
  "list",
  {
    workspaceId: Options.text("workspace").pipe(
      Options.withAlias("w"),
      Options.optional
    ),
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
  },
  ({ workspaceId, format }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;

      // Get chat apps (filtered by workspace if specified)
      const chatApps = workspaceId
        ? yield* configService.getChatAppsInWorkspace(workspaceId)
        : yield* configService.getAllChatApps();

      if (chatApps.length === 0) {
        const message = workspaceId
          ? `No chat apps found in workspace: ${workspaceId}`
          : "No chat apps found. Create one with 'buddy chatapp create <name> --workspace=<id>'";
        yield* Console.log(message);
        return;
      }

      // Format output (simplified table for chat apps)
      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(chatApps, null, 2);
          case "yaml":
            return JSON.stringify(chatApps, null, 2).replace(/"/g, "");
          default: {
            const headers = ["ID", "Name", "Workspace", "Agent", "Created"];
            const rows = chatApps.map((app) => [
              app.id,
              app.name,
              app.workspaceId,
              app.agentId || "-",
              new Date(app.createdAt).toLocaleDateString(),
            ]);
            return createSimpleTable(headers, rows);
          }
        }
      })();

      yield* Console.log(output);
      yield* Console.log(`\nTotal: ${chatApps.length} chat app(s)`);
    })
);

// ChatApp show command
const showChatApp = Command.make(
  "show",
  {
    id: Args.text({ name: "id" }),
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
  },
  ({ id, format }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;

      // Get chat app by ID
      const chatApp = yield* configService.getChatApp(id).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Chat app not found: ${id}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(new Error(`Chat app not found: ${id}`));
          })
        )
      );

      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(chatApp, null, 2);
          case "yaml":
            return JSON.stringify(chatApp, null, 2).replace(/"/g, "");
          default: {
            const details = [
              ["ID", chatApp.id],
              ["Name", chatApp.name],
              ["Description", chatApp.description || "-"],
              ["Workspace", chatApp.workspaceId],
              ["Agent", chatApp.agentId || "-"],
              ["Created", new Date(chatApp.createdAt).toLocaleDateString()],
              ["Updated", new Date(chatApp.updatedAt).toLocaleDateString()],
            ];
            return createSimpleTable(["Property", "Value"], details);
          }
        }
      })();

      yield* Console.log(output);
    })
);

// ChatApp delete command
const deleteChatApp = Command.make(
  "delete",
  {
    id: Args.text({ name: "id" }),
    force: Options.boolean("force").pipe(Options.optional),
  },
  ({ id, force }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;

      if (!force) {
        yield* Console.log(
          "⚠️  This will permanently delete the chat app and all its messages."
        );
        yield* Console.log("Use --force to confirm deletion.");
        return;
      }

      // Delete chat app
      yield* configService.deleteChatApp(id).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Failed to delete chat app: ${id}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(
              new Error(`Failed to delete chat app: ${id}`)
            );
          })
        )
      );

      const successMessage = yield* formatter.formatSuccess(
        `Deleted chat app: ${id}`
      );

      yield* Console.log(successMessage);
    })
);

// Helper function for simple table formatting
const createSimpleTable = (headers: string[], rows: string[][]) => {
  const colWidths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] || "").length))
  );

  const separator = `+${colWidths.map((w) => "-".repeat(w + 2)).join("+")}+`;

  const headerRow = `|${headers
    .map((header, i) => ` ${header.padEnd(colWidths[i])} `)
    .join("|")}|`;

  const dataRows = rows.map(
    (row) =>
      `|${row
        .map((cell, i) => ` ${(cell || "").padEnd(colWidths[i])} `)
        .join("|")}|`
  );

  return [separator, headerRow, separator, ...dataRows, separator].join("\n");
};

// Main chatapp command with subcommands
export const chatAppCommand = Command.make(
  "chatapp",
  {},
  () => Effect.void
).pipe(
  Command.withSubcommands([
    createChatApp,
    listChatApps,
    showChatApp,
    deleteChatApp,
  ])
);

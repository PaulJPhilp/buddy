import { Args, Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import type { WorkspaceModel } from "../../../client/src/domain";
import { ConfigService } from "../../../client/src/services/config";
import { CliConfig } from "../services/cli-config";
import { OutputFormatter } from "../services/output-formatter";

// Workspace create command
const createWorkspace = Command.make(
  "create",
  {
    name: Args.text({ name: "name" }),
    description: Options.text("description").pipe(Options.optional),
    icon: Options.text("icon").pipe(Options.optional),
    color: Options.text("color").pipe(Options.optional),
    agents: Options.text("agents").pipe(Options.optional),
    verify: Options.boolean("verify").pipe(Options.optional),
  },
  ({ name, description, icon, color, agents, verify }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();

      // Parse agents list
      const agentIds = agents ? agents.split(",").map((a) => a.trim()) : [];

      // Create workspace using ConfigService
      const workspace = yield* configService.createWorkspace({
        name,
        description: description || `${name} workspace`,
        icon: icon || config.workspace.defaultIcon,
        color: color || config.workspace.defaultColor,
        agentIds,
        chatappIds: [],
      });

      const successMessage = yield* formatter.formatSuccess(
        `Created workspace "${workspace.name}" with ID: ${workspace.id}`
      );

      yield* Console.log(successMessage);

      if (config.verbose) {
        const details = yield* formatter.formatWorkspace(
          workspace,
          config.format
        );
        yield* Console.log(details);
      }

      // Auto-verify if requested
      if (verify) {
        yield* Console.log("\n🔍 Verifying created workspace...");

        // Check if workspace can be retrieved
        const retrievedWorkspace = yield* configService
          .getWorkspace(workspace.id)
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

        // Verify agent references
        const invalidAgents = [];
        for (const agentId of retrievedWorkspace.agentIds) {
          const agentExists = yield* configService.getAgent(agentId).pipe(
            Effect.map(() => true),
            Effect.catchAll(() => Effect.succeed(false))
          );

          if (!agentExists) {
            invalidAgents.push(agentId);
          }
        }

        if (invalidAgents.length > 0) {
          const warningMsg = yield* formatter.formatWarning(
            `⚠️ Warning: Referenced agents not found: ${invalidAgents.join(
              ", "
            )}`
          );
          yield* Console.log(warningMsg);
        } else {
          const verifySuccess = yield* formatter.formatSuccess(
            "✅ Workspace verification passed"
          );
          yield* Console.log(verifySuccess);
        }
      }
    })
);

// Workspace list command
const listWorkspaces = Command.make(
  "list",
  {
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
    verbose: Options.boolean("verbose").pipe(Options.optional),
  },
  ({ format, verbose }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;
      const isVerbose = verbose || config.verbose;

      // Get all workspaces
      const workspaces = yield* configService.getAllWorkspaces();

      if (workspaces.length === 0) {
        yield* Console.log(
          "No workspaces found. Create one with 'buddy workspace create <name>'"
        );
        return;
      }

      const output = yield* formatter.formatWorkspaces(
        workspaces,
        outputFormat
      );
      yield* Console.log(output);

      if (isVerbose) {
        yield* Console.log(`\nTotal: ${workspaces.length} workspace(s)`);
      }
    })
);

// Workspace show command
const showWorkspace = Command.make(
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

      // Get workspace by ID
      const workspace = yield* configService.getWorkspace(id).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Workspace not found: ${id}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(new Error(`Workspace not found: ${id}`));
          })
        )
      );

      const output = yield* formatter.formatWorkspace(workspace, outputFormat);
      yield* Console.log(output);
    })
);

// Workspace update command
const updateWorkspace = Command.make(
  "update",
  {
    id: Args.text({ name: "id" }),
    name: Options.text("name").pipe(Options.optional),
    description: Options.text("description").pipe(Options.optional),
    icon: Options.text("icon").pipe(Options.optional),
    color: Options.text("color").pipe(Options.optional),
  },
  ({ id, name, description, icon, color }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;

      // Build updates object
      const updates: Partial<WorkspaceModel> = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (icon) updates.icon = icon;
      if (color) updates.color = color;

      if (Object.keys(updates).length === 0) {
        const error = yield* formatter.formatError("No updates provided");
        yield* Console.error(error);
        return;
      }

      // Update workspace
      const workspace = yield* configService.updateWorkspace(id, updates).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Failed to update workspace: ${id}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(
              new Error(`Failed to update workspace: ${id}`)
            );
          })
        )
      );

      const successMessage = yield* formatter.formatSuccess(
        `Updated workspace "${workspace.name}"`
      );

      yield* Console.log(successMessage);
    })
);

// Workspace delete command
const deleteWorkspace = Command.make(
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
          "⚠️  This will permanently delete the workspace and all its chat apps."
        );
        yield* Console.log("Use --force to confirm deletion.");
        return;
      }

      // Delete workspace
      yield* configService.deleteWorkspace(id).pipe(
        Effect.catchAll(() =>
          Effect.gen(function* () {
            const error = yield* formatter.formatError(
              `Failed to delete workspace: ${id}`
            );
            yield* Console.error(error);
            return yield* Effect.fail(
              new Error(`Failed to delete workspace: ${id}`)
            );
          })
        )
      );

      const successMessage = yield* formatter.formatSuccess(
        `Deleted workspace: ${id}`
      );

      yield* Console.log(successMessage);
    })
);

// Main workspace command with subcommands
export const workspaceCommand = Command.make(
  "workspace",
  {},
  () => Effect.void
).pipe(
  Command.withSubcommands([
    createWorkspace,
    listWorkspaces,
    showWorkspace,
    updateWorkspace,
    deleteWorkspace,
  ])
);

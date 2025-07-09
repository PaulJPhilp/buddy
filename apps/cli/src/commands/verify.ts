import { Args, Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import { ConfigService } from "../../../client/src/services/config";
import { CliConfig } from "../services/cli-config";
import { OutputFormatter } from "../services/output-formatter";

// Verify config integrity command
const verifyConfig = Command.make(
  "config",
  {
    configPath: Options.text("config-path").pipe(Options.optional),
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
    verbose: Options.boolean("verbose").pipe(Options.optional),
  },
  ({ configPath, format, verbose }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;
      const isVerbose = verbose || config.verbose;

      yield* Console.log("🔍 Verifying configuration integrity...");

      // Check config health
      const healthCheck = yield* configService
        .checkConfigHealth(configPath)
        .pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              const errorMsg = yield* formatter.formatError(
                `Health check failed: ${error.message}`
              );
              yield* Console.error(errorMsg);
              return {
                isHealthy: false,
                issues: [error.message],
                recommendations: [
                  "Check if config file exists and is valid JSON",
                ],
              };
            })
          )
        );

      // Display health status
      if (healthCheck.isHealthy) {
        const successMsg = yield* formatter.formatSuccess(
          "✅ Configuration is healthy"
        );
        yield* Console.log(successMsg);
      } else {
        const errorMsg = yield* formatter.formatError(
          "❌ Configuration has issues"
        );
        yield* Console.error(errorMsg);

        if (healthCheck.issues.length > 0) {
          yield* Console.log("\n🚨 Issues found:");
          for (const issue of healthCheck.issues) {
            yield* Console.log(`  • ${issue}`);
          }
        }

        if (healthCheck.recommendations.length > 0) {
          yield* Console.log("\n💡 Recommendations:");
          for (const rec of healthCheck.recommendations) {
            yield* Console.log(`  • ${rec}`);
          }
        }
      }

      // If verbose, show detailed validation
      if (isVerbose) {
        yield* Console.log("\n📊 Detailed validation:");

        const currentConfig = yield* configService.loadConfig(configPath).pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* Console.error(`Failed to load config: ${error.message}`);
              return yield* configService.createDefaultConfig();
            })
          )
        );

        const validation = yield* configService.validateConfig(currentConfig, {
          strict: true,
          checkDuplicates: true,
          validateReferences: true,
        });

        const output = (() => {
          switch (outputFormat) {
            case "json":
              return JSON.stringify(validation, null, 2);
            case "yaml":
              return formatValidationAsYaml(validation);
            default:
              return formatValidationAsTable(validation);
          }
        })();

        yield* Console.log(output);
      }
    })
);

// Verify workspace command
const verifyWorkspace = Command.make(
  "workspace",
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

      yield* Console.log(`🔍 Verifying workspace: ${id}`);

      // Try to get workspace
      const workspace = yield* configService.getWorkspace(id).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            const errorMsg = yield* formatter.formatError(
              `❌ Workspace not found: ${id}`
            );
            yield* Console.error(errorMsg);
            return yield* Effect.fail(error);
          })
        )
      );

      // Verify workspace structure
      const verification = {
        exists: true,
        id: workspace.id,
        name: workspace.name,
        hasAgents: workspace.agentIds.length > 0,
        agentCount: workspace.agentIds.length,
        hasChatApps: workspace.chatappIds.length > 0,
        chatAppCount: workspace.chatappIds.length,
        hasValidReferences: true, // We'll check this
        issues: [] as string[],
      };

      // Check agent references
      for (const agentId of workspace.agentIds) {
        const agentExists = yield* configService.getAgent(agentId).pipe(
          Effect.map(() => true),
          Effect.catchAll(() => Effect.succeed(false))
        );

        if (!agentExists) {
          verification.issues.push(`Referenced agent not found: ${agentId}`);
          verification.hasValidReferences = false;
        }
      }

      // Check chat app references
      for (const chatAppId of workspace.chatappIds) {
        const chatAppExists = yield* configService.getChatApp(chatAppId).pipe(
          Effect.map(() => true),
          Effect.catchAll(() => Effect.succeed(false))
        );

        if (!chatAppExists) {
          verification.issues.push(
            `Referenced chat app not found: ${chatAppId}`
          );
          verification.hasValidReferences = false;
        }
      }

      // Display results
      if (verification.hasValidReferences && verification.issues.length === 0) {
        const successMsg = yield* formatter.formatSuccess(
          `✅ Workspace "${workspace.name}" is valid`
        );
        yield* Console.log(successMsg);
      } else {
        const errorMsg = yield* formatter.formatError(
          `❌ Workspace "${workspace.name}" has issues`
        );
        yield* Console.error(errorMsg);

        for (const issue of verification.issues) {
          yield* Console.log(`  • ${issue}`);
        }
      }

      // Format detailed output
      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(verification, null, 2);
          case "yaml":
            return formatObjectAsYaml(verification);
          default:
            return formatVerificationAsTable(verification);
        }
      })();

      yield* Console.log("\n📊 Verification Details:");
      yield* Console.log(output);
    })
);

// Verify chat app command
const verifyChatApp = Command.make(
  "chatapp",
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

      yield* Console.log(`🔍 Verifying chat app: ${id}`);

      // Try to get chat app
      const chatApp = yield* configService.getChatApp(id).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            const errorMsg = yield* formatter.formatError(
              `❌ Chat app not found: ${id}`
            );
            yield* Console.error(errorMsg);
            return yield* Effect.fail(error);
          })
        )
      );

      // Verify chat app structure
      const verification = {
        exists: true,
        id: chatApp.id,
        name: chatApp.name,
        hasValidWorkspace: true,
        workspaceId: chatApp.workspaceId,
        hasValidAgent: true,
        agentId: chatApp.agentId,
        issues: [] as string[],
      };

      // Check workspace reference
      if (chatApp.workspaceId) {
        const workspaceExists = yield* configService
          .getWorkspace(chatApp.workspaceId)
          .pipe(
            Effect.map(() => true),
            Effect.catchAll(() => Effect.succeed(false))
          );

        if (!workspaceExists) {
          verification.issues.push(
            `Referenced workspace not found: ${chatApp.workspaceId}`
          );
          verification.hasValidWorkspace = false;
        }
      }

      // Check agent reference
      if (chatApp.agentId) {
        const agentExists = yield* configService.getAgent(chatApp.agentId).pipe(
          Effect.map(() => true),
          Effect.catchAll(() => Effect.succeed(false))
        );

        if (!agentExists) {
          verification.issues.push(
            `Referenced agent not found: ${chatApp.agentId}`
          );
          verification.hasValidAgent = false;
        }
      }

      // Display results
      if (
        verification.hasValidWorkspace &&
        verification.hasValidAgent &&
        verification.issues.length === 0
      ) {
        const successMsg = yield* formatter.formatSuccess(
          `✅ Chat app "${chatApp.name}" is valid`
        );
        yield* Console.log(successMsg);
      } else {
        const errorMsg = yield* formatter.formatError(
          `❌ Chat app "${chatApp.name}" has issues`
        );
        yield* Console.error(errorMsg);

        for (const issue of verification.issues) {
          yield* Console.log(`  • ${issue}`);
        }
      }

      // Format detailed output
      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(verification, null, 2);
          case "yaml":
            return formatObjectAsYaml(verification);
          default:
            return formatVerificationAsTable(verification);
        }
      })();

      yield* Console.log("\n📊 Verification Details:");
      yield* Console.log(output);
    })
);

// Compare configs command
const compareConfigs = Command.make(
  "compare",
  {
    beforePath: Args.text({ name: "before-path" }),
    afterPath: Args.text({ name: "after-path" }),
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
  },
  ({ beforePath, afterPath, format }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService;
      const formatter = yield* OutputFormatter;
      const cliConfig = yield* CliConfig;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;

      yield* Console.log(`🔍 Comparing configurations:`);
      yield* Console.log(`  Before: ${beforePath}`);
      yield* Console.log(`  After:  ${afterPath}`);

      // Load both configs
      const beforeConfig = yield* configService.loadConfig(beforePath).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            const errorMsg = yield* formatter.formatError(
              `Failed to load before config: ${error.message}`
            );
            yield* Console.error(errorMsg);
            return yield* Effect.fail(error);
          })
        )
      );

      const afterConfig = yield* configService.loadConfig(afterPath).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            const errorMsg = yield* formatter.formatError(
              `Failed to load after config: ${error.message}`
            );
            yield* Console.error(errorMsg);
            return yield* Effect.fail(error);
          })
        )
      );

      // Compare configurations
      const comparison = compareConfigObjects(beforeConfig, afterConfig);

      // Display results
      if (comparison.differences.length === 0) {
        const successMsg = yield* formatter.formatSuccess(
          "✅ Configurations are identical"
        );
        yield* Console.log(successMsg);
      } else {
        yield* Console.log(
          `📊 Found ${comparison.differences.length} difference(s):`
        );

        for (const diff of comparison.differences) {
          yield* Console.log(
            `  ${
              diff.type === "added"
                ? "➕"
                : diff.type === "removed"
                ? "➖"
                : "🔄"
            } ${diff.path}`
          );
          if (diff.type === "changed") {
            yield* Console.log(`    Before: ${JSON.stringify(diff.before)}`);
            yield* Console.log(`    After:  ${JSON.stringify(diff.after)}`);
          } else if (diff.type === "added") {
            yield* Console.log(`    Added:  ${JSON.stringify(diff.value)}`);
          } else if (diff.type === "removed") {
            yield* Console.log(`    Removed: ${JSON.stringify(diff.value)}`);
          }
        }
      }

      // Format detailed output
      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(comparison, null, 2);
          case "yaml":
            return formatObjectAsYaml(comparison);
          default:
            return formatComparisonAsTable(comparison);
        }
      })();

      yield* Console.log("\n📊 Detailed Comparison:");
      yield* Console.log(output);
    })
);

// Helper functions
const formatValidationAsTable = (validation: any) => {
  const headers = ["Property", "Status", "Details"];
  const rows = [
    ["Valid", validation.isValid ? "✅ Yes" : "❌ No", ""],
    [
      "Errors",
      validation.errors?.length || 0,
      validation.errors?.map((e: any) => e.message).join(", ") || "",
    ],
    [
      "Warnings",
      validation.warnings?.length || 0,
      validation.warnings?.map((w: any) => w.message).join(", ") || "",
    ],
    [
      "Suggestions",
      validation.suggestions?.length || 0,
      validation.suggestions?.map((s: any) => s.message).join(", ") || "",
    ],
  ];

  return createSimpleTable(headers, rows);
};

const formatValidationAsYaml = (validation: any) => {
  return `valid: ${validation.isValid}
errors: ${validation.errors?.length || 0}
warnings: ${validation.warnings?.length || 0}
suggestions: ${validation.suggestions?.length || 0}`;
};

const formatVerificationAsTable = (verification: any) => {
  const headers = ["Property", "Value"];
  const rows = Object.entries(verification).map(([key, value]) => [
    key,
    typeof value === "boolean" ? (value ? "✅ Yes" : "❌ No") : String(value),
  ]);

  return createSimpleTable(headers, rows);
};

const formatObjectAsYaml = (obj: any) => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
};

const formatComparisonAsTable = (comparison: any) => {
  const headers = ["Type", "Path", "Details"];
  const rows = comparison.differences.map((diff: any) => [
    diff.type === "added"
      ? "➕ Added"
      : diff.type === "removed"
      ? "➖ Removed"
      : "🔄 Changed",
    diff.path,
    diff.type === "changed"
      ? `${JSON.stringify(diff.before)} → ${JSON.stringify(diff.after)}`
      : JSON.stringify(diff.value),
  ]);

  return createSimpleTable(headers, rows);
};

const compareConfigObjects = (before: any, after: any, path = "") => {
  const differences: any[] = [];

  const beforeKeys = new Set(Object.keys(before || {}));
  const afterKeys = new Set(Object.keys(after || {}));

  // Check for removed keys
  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      differences.push({
        type: "removed",
        path: path ? `${path}.${key}` : key,
        value: before[key],
      });
    }
  }

  // Check for added keys
  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) {
      differences.push({
        type: "added",
        path: path ? `${path}.${key}` : key,
        value: after[key],
      });
    }
  }

  // Check for changed values
  for (const key of beforeKeys) {
    if (afterKeys.has(key)) {
      const beforeValue = before[key];
      const afterValue = after[key];

      if (typeof beforeValue === "object" && typeof afterValue === "object") {
        const nested = compareConfigObjects(
          beforeValue,
          afterValue,
          path ? `${path}.${key}` : key
        );
        differences.push(...nested.differences);
      } else if (beforeValue !== afterValue) {
        differences.push({
          type: "changed",
          path: path ? `${path}.${key}` : key,
          before: beforeValue,
          after: afterValue,
        });
      }
    }
  }

  return { differences };
};

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

// Main verify command with subcommands
export const verifyCommand = Command.make("verify", {}, () => Effect.void).pipe(
  Command.withSubcommands([
    verifyConfig,
    verifyWorkspace,
    verifyChatApp,
    compareConfigs,
  ])
);

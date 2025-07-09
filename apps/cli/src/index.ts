#!/usr/bin/env bun

import { CliApp, HelpDoc } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
// TODO: Add managers back after fixing TypeScript compilation issues
// import { ChatManager } from "../../client/src/managers/chat/service";
// import { ChatAppsManager } from "../../client/src/managers/chatapps/service";
// import { CoreManager } from "../../client/src/managers/core/service";
// import { WorkspaceManager } from "../../client/src/managers/workspace/service";
import { ConfigService } from "../../client/src/services/config";
import { chatAppCommand } from "./commands/chatapp";
import { configCommand } from "./commands/config";
import { demoCommand } from "./commands/demo";
import { verifyCommand } from "./commands/verify";
import { workspaceCommand } from "./commands/workspace";
import { CliConfig } from "./services/cli-config";
import { OutputFormatter } from "./services/output-formatter";

// CLI application definition
const cliApp = CliApp.make({
  name: "buddy",
  version: "0.1.0",
  summary: HelpDoc.p(
    "Buddy CLI - Manage workspaces, chat apps, and configuration"
  ),
  commands: [
    workspaceCommand,
    chatAppCommand,
    configCommand,
    verifyCommand,
    demoCommand,
  ],
});

// Main CLI layer with all dependencies
const CliLayer = Layer.mergeAll(
  OutputFormatter.Default,
  CliConfig.Default,
  ConfigService.Default
  // TODO: Add managers back after fixing TypeScript compilation issues
  // CoreManager.Default,
  // ChatManager.Default,
  // ChatAppsManager.Default,
  // WorkspaceManager.Default
);

// Main program
const program = Effect.gen(function* () {
  const args = yield* Effect.sync(() => process.argv.slice(2));

  yield* CliApp.run(cliApp, args, (command) =>
    Effect.provide(command, CliLayer)
  );
});

// Run the CLI
NodeRuntime.runMain(
  program.pipe(
    Effect.provide(NodeContext.layer),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Effect.logError("CLI Error:", error);
        yield* Effect.sync(() => process.exit(1));
      })
    )
  )
);

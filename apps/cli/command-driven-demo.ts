#!/usr/bin/env bun

/**
 * Command-Driven Architecture Demonstration
 *
 * This script demonstrates how the CLI can use the command-driven architecture
 * pattern to interact with managers. It shows:
 *
 * 1. Command creation based on user input
 * 2. Command dispatch to appropriate managers
 * 3. Simulated command processing
 * 4. Result handling
 */

import { Console, Effect } from "effect";

// Command types for each manager
interface CoreCommand {
  readonly _tag: string;
  readonly payload?: any;
}

interface ChatCommand {
  readonly _tag: string;
  readonly payload?: any;
}

interface ChatAppsCommand {
  readonly _tag: string;
  readonly payload?: any;
}

interface WorkspaceCommand {
  readonly _tag: string;
  readonly payload?: any;
}

type ManagerCommand =
  | CoreCommand
  | ChatCommand
  | ChatAppsCommand
  | WorkspaceCommand;

// Command factory functions
const createCoreCommand = (action: string): CoreCommand => {
  switch (action) {
    case "start":
      return { _tag: "StartCoreManager" };
    case "stop":
      return { _tag: "StopCoreManager" };
    case "restart":
      return { _tag: "RestartCoreManager" };
    case "status":
      return { _tag: "GetCoreStatus" };
    case "coordinate":
      return { _tag: "CoordinateOperation", payload: { operation: "example" } };
    default:
      return { _tag: "UnknownCommand" };
  }
};

const createChatCommand = (action: string): ChatCommand => {
  switch (action) {
    case "create":
      return { _tag: "CreateConversation" };
    case "send":
      return {
        _tag: "SendMessage",
        payload: { message: "Hello from CLI!", conversationId: "conv-123" },
      };
    case "list":
      return { _tag: "ListConversations" };
    case "status":
      return { _tag: "GetChatStatus" };
    default:
      return { _tag: "UnknownCommand" };
  }
};

const createChatAppsCommand = (action: string): ChatAppsCommand => {
  switch (action) {
    case "register":
      return {
        _tag: "RegisterChatApp",
        payload: { appId: "demo-app", config: {} },
      };
    case "activate":
      return { _tag: "SetActiveChatApp", payload: { appId: "demo-app" } };
    case "expand":
      return { _tag: "ExpandChatApp", payload: { appId: "demo-app" } };
    case "stash":
      return { _tag: "StashChatApp", payload: { appId: "demo-app" } };
    case "list":
      return { _tag: "ListChatApps" };
    case "status":
      return { _tag: "GetChatAppsStatus" };
    default:
      return { _tag: "UnknownCommand" };
  }
};

const createWorkspaceCommand = (action: string): WorkspaceCommand => {
  switch (action) {
    case "activate":
      return {
        _tag: "OnWorkspaceActivated",
        payload: { workspaceId: "demo-workspace" },
      };
    case "archive":
      return {
        _tag: "OnWorkspaceArchived",
        payload: { workspaceId: "demo-workspace" },
      };
    case "set-max":
      return { _tag: "SetWorkspaceMaxExpandedApps", payload: { maxApps: 3 } };
    case "list":
      return { _tag: "ListWorkspaces" };
    case "status":
      return { _tag: "GetWorkspaceStatus" };
    default:
      return { _tag: "UnknownCommand" };
  }
};

// Command dispatcher
const dispatchCommand = (manager: string, action: string): ManagerCommand => {
  switch (manager) {
    case "core":
      return createCoreCommand(action);
    case "chat":
      return createChatCommand(action);
    case "chatapps":
      return createChatAppsCommand(action);
    case "workspace":
      return createWorkspaceCommand(action);
    default:
      return { _tag: "UnknownCommand" };
  }
};

// Simulate command execution
const executeCommand = (command: ManagerCommand, manager: string) =>
  Effect.gen(function* () {
    yield* Console.log(`🔄 Executing command: ${command._tag}`);

    // Simulate processing delay
    yield* Effect.sleep("300 millis");

    if (command._tag === "UnknownCommand") {
      yield* Console.log("❌ Command execution failed: Unknown command");
      return { success: false, error: "Unknown command" };
    }

    // Simulate different results based on command type
    let result: any;

    if (command._tag.includes("Status") || command._tag.includes("List")) {
      result = {
        state: "Running",
        lastCommand: command._tag,
        operations: 42,
        timestamp: new Date().toISOString(),
      };
    } else if (
      command._tag.includes("Start") ||
      command._tag.includes("Create") ||
      command._tag.includes("Register")
    ) {
      result = {
        success: true,
        id: `${manager}-${Date.now()}`,
        message: "Service started successfully",
      };
    } else if (
      command._tag.includes("Stop") ||
      command._tag.includes("Archive")
    ) {
      result = {
        success: true,
        message: "Service stopped successfully",
      };
    } else {
      result = {
        success: true,
        message: "Command executed successfully",
      };
    }

    yield* Console.log(`✅ Command completed: ${command._tag}`);
    return { success: true, result };
  });

// Main demonstration function
const runDemo = Effect.gen(function* () {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    yield* Console.log("🎯 Command-Driven Architecture Demo");
    yield* Console.log("");
    yield* Console.log(
      "Usage: bun command-driven-demo.ts <manager> <action> [--verbose]"
    );
    yield* Console.log("");
    yield* Console.log("Managers:");
    yield* Console.log("  core      - Core manager operations");
    yield* Console.log("  chat      - Chat manager operations");
    yield* Console.log("  chatapps  - ChatApps manager operations");
    yield* Console.log("  workspace - Workspace manager operations");
    yield* Console.log("");
    yield* Console.log("Actions:");
    yield* Console.log("  start, stop, restart, status, list");
    yield* Console.log("  (specific actions vary by manager)");
    yield* Console.log("");
    yield* Console.log("Examples:");
    yield* Console.log("  bun command-driven-demo.ts core start");
    yield* Console.log("  bun command-driven-demo.ts chat create --verbose");
    yield* Console.log("  bun command-driven-demo.ts chatapps register");
    yield* Console.log("  bun command-driven-demo.ts workspace activate");
    return;
  }

  const [manager, action] = args;
  const verbose = args.includes("--verbose");

  yield* Console.log("🎯 Command-Driven Architecture Demo");
  yield* Console.log("=====================================");
  yield* Console.log("");
  yield* Console.log(`Manager: ${manager}`);
  yield* Console.log(`Action: ${action}`);
  yield* Console.log(`Verbose: ${verbose}`);
  yield* Console.log("");

  // Create command
  yield* Console.log("📤 Creating command...");
  const command = dispatchCommand(manager, action);

  if (verbose) {
    yield* Console.log(`Command details:`);
    yield* Console.log(`  Type: ${command._tag}`);
    if ("payload" in command && command.payload) {
      yield* Console.log(
        `  Payload: ${JSON.stringify(command.payload, null, 2)}`
      );
    }
    yield* Console.log("");
  }

  // Execute command
  yield* Console.log("🚀 Dispatching to manager...");
  const executionResult = yield* executeCommand(command, manager);

  yield* Console.log("");
  yield* Console.log("📊 Execution Result:");

  if (executionResult.success) {
    yield* Console.log("✅ Status: Success");
    if (verbose && executionResult.result) {
      yield* Console.log("📋 Details:");
      yield* Console.log(JSON.stringify(executionResult.result, null, 2));
    }
  } else {
    yield* Console.log("❌ Status: Failed");
    if (executionResult.error) {
      yield* Console.log(`💥 Error: ${executionResult.error}`);
    }
  }

  yield* Console.log("");
  yield* Console.log("🎉 Demo completed!");
  yield* Console.log("");
  yield* Console.log("💡 Key Concepts Demonstrated:");
  yield* Console.log("   • Command creation based on user input");
  yield* Console.log("   • Type-safe command dispatching");
  yield* Console.log("   • Async command execution");
  yield* Console.log("   • Result handling and feedback");
  yield* Console.log("   • Manager-specific command types");
});

// Run the demonstration
await Effect.runPromise(runDemo);

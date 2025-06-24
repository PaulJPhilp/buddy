#!/usr/bin/env bun

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { WebSocket } from "ws";

// Types from the main application
interface WorkspaceEntry {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly isArchived: boolean;
  readonly availableAgents: string[];
  readonly maxExpandedApps: number;
  readonly activeAppId: string | null;
}

interface ChatAppEntry {
  readonly id: string;
  readonly workspaceId: string;
  readonly status: "stashed" | "compact" | "expanded" | "closed";
  readonly isArchived: boolean;
  readonly lastActiveAt: Date;
  readonly config: any;
}

interface UIState {
  readonly currentWorkspaceId: string | null;
  readonly workspaces: Record<string, WorkspaceEntry>;
  readonly chatApps: Record<string, ChatAppEntry>;
}

interface CreateWorkspaceOptions {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  availableAgents: string[];
}

interface ListWorkspacesOptions {
  includeArchived?: boolean;
}

// CLI Configuration
interface CLIConfig {
  format: "table" | "json" | "yaml";
  verbose: boolean;
  autoSync: boolean;
  server: {
    httpUrl: string;
    websocketUrl: string;
  };
  workspace: {
    defaultIcon: string;
    defaultColor: string;
    maxExpandedApps: number;
  };
}

const DEFAULT_CONFIG: CLIConfig = {
  format: "table",
  verbose: false,
  autoSync: true,
  server: {
    httpUrl: "http://localhost:3000",
    websocketUrl: "ws://localhost:3000/cli-sync",
  },
  workspace: {
    defaultIcon: "📁",
    defaultColor: "#3b82f6",
    maxExpandedApps: 2,
  },
};

// Local workspace store implementation
class WorkspaceStore {
  private configDir: string;
  private statePath: string;
  private configPath: string;
  private config: CLIConfig;

  constructor() {
    this.configDir = join(homedir(), ".buddy");
    this.statePath = join(this.configDir, "workspace.json");
    this.configPath = join(this.configDir, "config.json");
    this.config = DEFAULT_CONFIG;
  }

  async initialize(): Promise<void> {
    await this.ensureConfigDir();
    await this.loadConfig();
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    } catch (error) {
      // Use default config if file doesn't exist
      await this.saveConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    const data = JSON.stringify(this.config, null, 2);
    await fs.writeFile(this.configPath, data, "utf-8");
  }

  async loadState(): Promise<UIState> {
    try {
      const data = await fs.readFile(this.statePath, "utf-8");
      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      for (const workspace of Object.values(parsed.workspaces) as any[]) {
        workspace.createdAt = new Date(workspace.createdAt);
        workspace.lastActiveAt = new Date(workspace.lastActiveAt);
      }

      for (const chatApp of Object.values(parsed.chatApps) as any[]) {
        chatApp.lastActiveAt = new Date(chatApp.lastActiveAt);
      }

      return parsed;
    } catch (error) {
      // Return default state if file doesn't exist
      return {
        currentWorkspaceId: null,
        workspaces: {},
        chatApps: {},
      };
    }
  }

  private async saveState(state: UIState): Promise<void> {
    const data = JSON.stringify(state, null, 2);
    await fs.writeFile(this.statePath, data, "utf-8");
  }

  async createWorkspace(options: CreateWorkspaceOptions): Promise<string> {
    const state = await this.loadState();
    const workspaceId = `workspace-${options.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

    const newWorkspace: WorkspaceEntry = {
      id: workspaceId,
      name: options.name,
      icon: options.icon || this.config.workspace.defaultIcon,
      color: options.color || this.config.workspace.defaultColor,
      description: options.description || "",
      availableAgents: options.availableAgents,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isArchived: false,
      maxExpandedApps: this.config.workspace.maxExpandedApps,
      activeAppId: null,
    };

    state.workspaces[workspaceId] = newWorkspace;
    state.currentWorkspaceId = workspaceId;

    await this.saveState(state);

    if (this.config.autoSync) {
      await this.syncWithWebUI(state);
    }

    return workspaceId;
  }

  async listWorkspaces(
    options: ListWorkspacesOptions = {},
  ): Promise<WorkspaceEntry[]> {
    const state = await this.loadState();
    let workspaces = Object.values(state.workspaces);

    if (!options.includeArchived) {
      workspaces = workspaces.filter((w) => !w.isArchived);
    }

    return workspaces.sort(
      (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime(),
    );
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceEntry | null> {
    const state = await this.loadState();
    return state.workspaces[workspaceId] || null;
  }

  async updateWorkspace(
    workspaceId: string,
    updates: Partial<WorkspaceEntry>,
  ): Promise<void> {
    const state = await this.loadState();
    const workspace = state.workspaces[workspaceId];

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    state.workspaces[workspaceId] = {
      ...workspace,
      ...updates,
      lastActiveAt: new Date(),
    };

    await this.saveState(state);

    if (this.config.autoSync) {
      await this.syncWithWebUI(state);
    }
  }

  async archiveWorkspace(workspaceId: string): Promise<void> {
    await this.updateWorkspace(workspaceId, { isArchived: true });
  }

  async activateWorkspace(workspaceId: string): Promise<void> {
    const state = await this.loadState();
    const workspace = state.workspaces[workspaceId];

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    if (workspace.isArchived) {
      throw new Error(`Cannot activate archived workspace: ${workspaceId}`);
    }

    state.currentWorkspaceId = workspaceId;
    state.workspaces[workspaceId] = {
      ...workspace,
      lastActiveAt: new Date(),
    };

    await this.saveState(state);

    if (this.config.autoSync) {
      await this.syncWithWebUI(state);
    }
  }

  async getCurrentWorkspace(): Promise<WorkspaceEntry | null> {
    const state = await this.loadState();
    if (!state.currentWorkspaceId) return null;
    return state.workspaces[state.currentWorkspaceId] || null;
  }

  async getActiveWorkspaces(): Promise<WorkspaceEntry[]> {
    const state = await this.loadState();
    const activeWorkspaceIds = new Set<string>();

    // Find workspaces with active chat apps
    for (const app of Object.values(state.chatApps)) {
      if (
        app.status !== "stashed" &&
        app.status !== "closed" &&
        !app.isArchived
      ) {
        activeWorkspaceIds.add(app.workspaceId);
      }
    }

    return Array.from(activeWorkspaceIds)
      .map((id) => state.workspaces[id])
      .filter(Boolean)
      .filter((workspace) => !workspace.isArchived);
  }

  async getChatAppsInWorkspace(workspaceId: string): Promise<ChatAppEntry[]> {
    const state = await this.loadState();
    return Object.values(state.chatApps).filter(
      (app) => app.workspaceId === workspaceId,
    );
  }

  private async syncWithWebUI(state: UIState): Promise<void> {
    try {
      const ws = new WebSocket(this.config.server.websocketUrl);

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            type: "CLI_STATE_SYNC",
            state,
            timestamp: new Date().toISOString(),
          }),
        );
        ws.close();
      });

      ws.on("error", (error) => {
        if (this.config.verbose) {
          console.warn(`⚠️  WebSocket sync failed: ${error.message}`);
        }
      });
    } catch (error) {
      if (this.config.verbose) {
        console.warn(`⚠️  Sync with web UI failed: ${error.message}`);
      }
    }
  }

  getConfig(): CLIConfig {
    return this.config;
  }

  async updateConfig(updates: Partial<CLIConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }
}

// Output formatting utilities
const OutputFormatter = {
  formatWorkspaces(workspaces: WorkspaceEntry[], format: string): string {
    switch (format) {
      case "json":
        return JSON.stringify(workspaces, null, 2);
      case "yaml":
        return this.toYaml(workspaces);
      default:
        return this.toTable(workspaces);
    }
  },

  formatWorkspace(
    workspace: WorkspaceEntry,
    chatApps: ChatAppEntry[],
    format: string,
  ): string {
    const data = { workspace, chatApps };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "yaml":
        return this.toYaml(data);
      default:
        return this.workspaceToTable(workspace, chatApps);
    }
  },

  toTable(workspaces: WorkspaceEntry[]): string {
    if (workspaces.length === 0) {
      return "No workspaces found.";
    }

    const headers = ["ID", "Name", "Icon", "Status", "Last Active"];
    const rows = workspaces.map((w) => [
      w.id.substring(0, 20) + (w.id.length > 20 ? "..." : ""),
      w.name,
      w.icon || "📁",
      w.isArchived ? "Archived" : "Active",
      this.formatRelativeTime(w.lastActiveAt),
    ]);

    return this.createTable(headers, rows);
  },

  workspaceToTable(
    workspace: WorkspaceEntry,
    chatApps: ChatAppEntry[],
  ): string {
    const activeApps = chatApps.filter((app) => !app.isArchived);

    return `
Workspace Details:
  ID: ${workspace.id}
  Name: ${workspace.name}
  Icon: ${workspace.icon}
  Color: ${workspace.color}
  Description: ${workspace.description || "None"}
  Created: ${workspace.createdAt.toLocaleDateString()}
  Last Active: ${this.formatRelativeTime(workspace.lastActiveAt)}
  Status: ${workspace.isArchived ? "Archived" : "Active"}
  Available Agents: ${workspace.availableAgents.join(", ")}
  Max Expanded Apps: ${workspace.maxExpandedApps}
  Active App: ${workspace.activeAppId || "None"}

Chat Apps (${activeApps.length}):
${
  activeApps.length === 0
    ? "  None"
    : activeApps
        .map(
          (app) =>
            `  • ${app.id} (${app.status}) - ${this.formatRelativeTime(app.lastActiveAt)}`,
        )
        .join("\n")
}
    `.trim();
  },

  createTable(headers: string[], rows: string[][]): string {
    const colWidths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map((row) => row[i]?.length || 0)),
    );

    const separator = `┌${colWidths.map((w) => "─".repeat(w + 2)).join("┬")}┐`;
    const headerRow = `│ ${headers.map((h, i) => h.padEnd(colWidths[i])).join(" │ ")} │`;
    const divider = `├${colWidths.map((w) => "─".repeat(w + 2)).join("┼")}┤`;
    const dataRows = rows.map(
      (row) =>
        `│ ${row.map((cell, i) => (cell || "").padEnd(colWidths[i])).join(" │ ")} │`,
    );
    const bottom = `└${colWidths.map((w) => "─".repeat(w + 2)).join("┴")}┘`;

    return [separator, headerRow, divider, ...dataRows, bottom].join("\n");
  },

  toYaml(data: any): string {
    // Simple YAML serialization (for demonstration)
    return JSON.stringify(data, null, 2)
      .replace(/^{$/, "---")
      .replace(/^}$/, "")
      .replace(/": /g, ": ")
      .replace(/^ {2}"/gm, "  ")
      .replace(/",?$/gm, "");
  },

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  },
};

// Main CLI implementation
class BuddyWorkspaceCLI {
  private store: WorkspaceStore;
  private program: Command;

  constructor() {
    this.store = new WorkspaceStore();
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name("buddy")
      .description("Buddy workspace management CLI")
      .version("1.0.0");

    // Global options
    this.program
      .option("--format <type>", "Output format (table, json, yaml)", "table")
      .option("--verbose", "Verbose output", false)
      .option("--config <path>", "Config file path");

    this.setupWorkspaceCommands();
    this.setupChatAppCommands();
    this.setupConfigCommands();
  }

  private setupWorkspaceCommands(): void {
    const workspace = this.program
      .command("workspace")
      .alias("ws")
      .description("Workspace management commands");

    // Create workspace
    workspace
      .command("create <name>")
      .description("Create a new workspace")
      .option("--icon <emoji>", "Workspace icon")
      .option("--color <hex>", "Workspace color")
      .option("--description <text>", "Workspace description")
      .option(
        "--agents <list>",
        "Available agents (comma-separated)",
        "default-agent",
      )
      .action(async (name, options) => {
        try {
          await this.store.initialize();
          const workspaceId = await this.store.createWorkspace({
            name,
            icon: options.icon,
            color: options.color,
            description: options.description,
            availableAgents: options.agents
              .split(",")
              .map((s: string) => s.trim()),
          });

          console.log(`✅ Created workspace: ${workspaceId}`);
          console.log(`📁 Name: ${name}`);
          console.log(
            `🎨 Icon: ${options.icon || this.store.getConfig().workspace.defaultIcon}`,
          );
        } catch (error) {
          console.error(`❌ Failed to create workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // List workspaces
    workspace
      .command("list")
      .alias("ls")
      .description("List all workspaces")
      .option("--include-archived", "Include archived workspaces")
      .action(async (options) => {
        try {
          await this.store.initialize();
          const format = this.program.opts().format || "table";
          const workspaces = await this.store.listWorkspaces({
            includeArchived: options.includeArchived,
          });

          const output = OutputFormatter.formatWorkspaces(workspaces, format);
          console.log(output);
        } catch (error) {
          console.error(`❌ Failed to list workspaces: ${error.message}`);
          process.exit(1);
        }
      });

    // Show workspace
    workspace
      .command("show <workspace-id>")
      .description("Show workspace details")
      .action(async (workspaceId) => {
        try {
          await this.store.initialize();
          const format = this.program.opts().format || "table";
          const workspace = await this.store.getWorkspace(workspaceId);

          if (!workspace) {
            console.error(`❌ Workspace not found: ${workspaceId}`);
            process.exit(1);
          }

          const chatApps = await this.store.getChatAppsInWorkspace(workspaceId);
          const output = OutputFormatter.formatWorkspace(
            workspace,
            chatApps,
            format,
          );
          console.log(output);
        } catch (error) {
          console.error(`❌ Failed to show workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // Update workspace
    workspace
      .command("update <workspace-id>")
      .description("Update workspace properties")
      .option("--name <name>", "New workspace name")
      .option("--description <text>", "New description")
      .option("--color <hex>", "New color")
      .option("--icon <emoji>", "New icon")
      .action(async (workspaceId, options) => {
        try {
          await this.store.initialize();
          const updates: any = {};

          if (options.name) updates.name = options.name;
          if (options.description) updates.description = options.description;
          if (options.color) updates.color = options.color;
          if (options.icon) updates.icon = options.icon;

          if (Object.keys(updates).length === 0) {
            console.error(
              "❌ No updates specified. Use --name, --description, --color, or --icon",
            );
            process.exit(1);
          }

          await this.store.updateWorkspace(workspaceId, updates);
          console.log(`✅ Updated workspace: ${workspaceId}`);
        } catch (error) {
          console.error(`❌ Failed to update workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // Archive workspace
    workspace
      .command("archive <workspace-id>")
      .description("Archive a workspace")
      .action(async (workspaceId) => {
        try {
          await this.store.initialize();
          await this.store.archiveWorkspace(workspaceId);
          console.log(`✅ Archived workspace: ${workspaceId}`);
        } catch (error) {
          console.error(`❌ Failed to archive workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // Activate workspace
    workspace
      .command("activate <workspace-id>")
      .description("Activate a workspace (set as current)")
      .action(async (workspaceId) => {
        try {
          await this.store.initialize();
          await this.store.activateWorkspace(workspaceId);
          console.log(`✅ Activated workspace: ${workspaceId}`);
        } catch (error) {
          console.error(`❌ Failed to activate workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // Get current workspace
    workspace
      .command("current")
      .description("Show current workspace")
      .action(async () => {
        try {
          await this.store.initialize();
          const workspace = await this.store.getCurrentWorkspace();

          if (!workspace) {
            console.log("No current workspace set.");
            return;
          }

          const format = this.program.opts().format || "table";
          const chatApps = await this.store.getChatAppsInWorkspace(
            workspace.id,
          );
          const output = OutputFormatter.formatWorkspace(
            workspace,
            chatApps,
            format,
          );
          console.log(output);
        } catch (error) {
          console.error(`❌ Failed to get current workspace: ${error.message}`);
          process.exit(1);
        }
      });

    // Get active workspaces
    workspace
      .command("active")
      .description("List workspaces with active chat apps")
      .action(async () => {
        try {
          await this.store.initialize();
          const format = this.program.opts().format || "table";
          const workspaces = await this.store.getActiveWorkspaces();
          const output = OutputFormatter.formatWorkspaces(workspaces, format);
          console.log(output);
        } catch (error) {
          console.error(`❌ Failed to get active workspaces: ${error.message}`);
          process.exit(1);
        }
      });
  }

  private setupChatAppCommands(): void {
    const chatapp = this.program
      .command("chatapp")
      .alias("app")
      .description("Chat app management commands");

    chatapp
      .command("list [workspace-id]")
      .description("List chat apps in workspace")
      .option(
        "--status <status>",
        "Filter by status (expanded, compact, stashed)",
      )
      .action(async (workspaceId, options) => {
        try {
          await this.store.initialize();

          let resolvedWorkspaceId = workspaceId;
          if (!resolvedWorkspaceId) {
            const current = await this.store.getCurrentWorkspace();
            if (!current) {
              console.error(
                "❌ No workspace specified and no current workspace set",
              );
              process.exit(1);
            }
            resolvedWorkspaceId = current.id;
          }

          const chatApps =
            await this.store.getChatAppsInWorkspace(resolvedWorkspaceId);
          let filtered = chatApps;

          if (options.status) {
            filtered = chatApps.filter((app) => app.status === options.status);
          }

          const format = this.program.opts().format || "table";
          const output = OutputFormatter.formatWorkspaces(
            filtered as any,
            format,
          );
          console.log(output);
        } catch (error) {
          console.error(`❌ Failed to list chat apps: ${error.message}`);
          process.exit(1);
        }
      });
  }

  private setupConfigCommands(): void {
    const config = this.program
      .command("config")
      .description("Configuration management commands");

    config
      .command("show")
      .description("Show current configuration")
      .action(async () => {
        try {
          await this.store.initialize();
          const config = this.store.getConfig();
          console.log(JSON.stringify(config, null, 2));
        } catch (error) {
          console.error(`❌ Failed to show config: ${error.message}`);
          process.exit(1);
        }
      });

    config
      .command("set <key> <value>")
      .description("Set configuration value")
      .action(async (key, value) => {
        try {
          await this.store.initialize();
          const config = this.store.getConfig();

          // Simple key path support (e.g., "workspace.defaultIcon")
          const keys = key.split(".");
          let target = config as any;

          for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) target[keys[i]] = {};
            target = target[keys[i]];
          }

          // Type conversion for common values
          const finalValue =
            value === "true"
              ? true
              : value === "false"
                ? false
                : !Number.isNaN(Number(value))
                  ? Number(value)
                  : value;

          target[keys[keys.length - 1]] = finalValue;

          await this.store.updateConfig(config);
          console.log(`✅ Set ${key} = ${finalValue}`);
        } catch (error) {
          console.error(`❌ Failed to set config: ${error.message}`);
          process.exit(1);
        }
      });
  }

  async run(): Promise<void> {
    await this.program.parseAsync();
  }
}

// Main execution
async function main() {
  const cli = new BuddyWorkspaceCLI();
  await cli.run();
}

if (import.meta.main) {
  main().catch(console.error);
}

export { BuddyWorkspaceCLI, WorkspaceStore, OutputFormatter };

#!/usr/bin/env bun

// ARCHIVED: Original Commander.js CLI implementation
// This file was moved from apps/cli/src/buddy-workspace-cli.ts
// The new Effect CLI is now in apps/cli/src/

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "path";
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
    httpUrl: process.env.BUDDY_CLI_HTTP_URL || "http://localhost:3000",
    websocketUrl:
      process.env.BUDDY_CLI_WS_URL || "ws://localhost:3000/cli-sync",
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
    const workspaceId = `workspace-${options.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

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
    options: ListWorkspacesOptions = {}
  ): Promise<WorkspaceEntry[]> {
    const state = await this.loadState();
    let workspaces = Object.values(state.workspaces);

    if (!options.includeArchived) {
      workspaces = workspaces.filter((w) => !w.isArchived);
    }

    return workspaces.sort(
      (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
    );
  }

  async updateWorkspace(
    workspaceId: string,
    updates: Partial<WorkspaceEntry>
  ): Promise<void> {
    const state = await this.loadState();
    if (state.workspaces[workspaceId]) {
      state.workspaces[workspaceId] = {
        ...state.workspaces[workspaceId],
        ...updates,
      };
      await this.saveState(state);

      if (this.config.autoSync) {
        await this.syncWithWebUI(state);
      }
    }
  }

  async archiveWorkspace(workspaceId: string): Promise<void> {
    await this.updateWorkspace(workspaceId, { isArchived: true });
  }

  async activateWorkspace(workspaceId: string): Promise<void> {
    const state = await this.loadState();
    if (state.workspaces[workspaceId]) {
      state.currentWorkspaceId = workspaceId;
      state.workspaces[workspaceId] = {
        ...state.workspaces[workspaceId],
        lastActiveAt: new Date(),
      };
      await this.saveState(state);

      if (this.config.autoSync) {
        await this.syncWithWebUI(state);
      }
    }
  }

  async getCurrentWorkspace(): Promise<WorkspaceEntry | null> {
    const state = await this.loadState();
    return state.currentWorkspaceId
      ? state.workspaces[state.currentWorkspaceId] || null
      : null;
  }

  async getActiveWorkspaces(): Promise<WorkspaceEntry[]> {
    const state = await this.loadState();
    return Object.values(state.workspaces)
      .filter((w) => !w.isArchived)
      .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())
      .slice(0, 5);
  }

  async getChatAppsInWorkspace(workspaceId: string): Promise<ChatAppEntry[]> {
    const state = await this.loadState();
    return Object.values(state.chatApps)
      .filter((app) => app.workspaceId === workspaceId)
      .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
  }

  private async syncWithWebUI(state: UIState): Promise<void> {
    try {
      const ws = new WebSocket(this.config.server.websocketUrl);

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            type: "cli-sync",
            data: state,
          })
        );
        ws.close();
      });

      ws.on("error", (error) => {
        // Silently fail if web UI is not available
        console.debug("WebSocket sync failed:", error.message);
      });
    } catch (error) {
      // Silently fail if web UI is not available
      console.debug("WebSocket sync failed:", error);
    }
  }

  getConfig(): CLIConfig {
    return this.config;
  }

  async updateConfig(updates: Partial<CLIConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  formatWorkspaces(workspaces: WorkspaceEntry[], format: string): string {
    switch (format) {
      case "json":
        return JSON.stringify(workspaces, null, 2);
      case "yaml":
        return this.toYaml(workspaces);
      default:
        return this.toTable(workspaces);
    }
  }

  formatWorkspace(
    workspace: WorkspaceEntry,
    chatApps: ChatAppEntry[],
    format: string
  ): string {
    switch (format) {
      case "json":
        return JSON.stringify({ workspace, chatApps }, null, 2);
      case "yaml":
        return this.toYaml({ workspace, chatApps });
      default:
        return this.workspaceToTable(workspace, chatApps);
    }
  }

  toTable(workspaces: WorkspaceEntry[]): string {
    if (workspaces.length === 0) {
      return "No workspaces found.";
    }

    const headers = ["ID", "Name", "Description", "Apps", "Last Active"];
    const rows = workspaces.map((workspace) => [
      workspace.id,
      workspace.name,
      workspace.description || "-",
      workspace.availableAgents.length.toString(),
      this.formatRelativeTime(workspace.lastActiveAt),
    ]);

    return this.createTable(headers, rows);
  }

  workspaceToTable(
    workspace: WorkspaceEntry,
    chatApps: ChatAppEntry[]
  ): string {
    const details = [
      ["ID", workspace.id],
      ["Name", workspace.name],
      ["Description", workspace.description || "-"],
      ["Icon", workspace.icon || "-"],
      ["Color", workspace.color || "-"],
      ["Created", this.formatRelativeTime(workspace.createdAt)],
      ["Last Active", this.formatRelativeTime(workspace.lastActiveAt)],
      ["Agents", workspace.availableAgents.length.toString()],
      ["Chat Apps", chatApps.length.toString()],
      ["Max Expanded", workspace.maxExpandedApps.toString()],
      ["Active App", workspace.activeAppId || "-"],
      ["Archived", workspace.isArchived ? "Yes" : "No"],
    ];

    let result = this.createTable(["Property", "Value"], details);

    if (chatApps.length > 0) {
      result += "\n\nChat Apps:\n";
      const appHeaders = ["ID", "Status", "Last Active"];
      const appRows = chatApps.map((app) => [
        app.id,
        app.status,
        this.formatRelativeTime(app.lastActiveAt),
      ]);
      result += this.createTable(appHeaders, appRows);
    }

    return result;
  }

  createTable(headers: string[], rows: string[][]): string {
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
        row
          .map((cell, i) => ` ${(cell || "").padEnd(colWidths[i])} `)
          .join("|") +
        "|"
    );

    return [separator, headerRow, separator, ...dataRows, separator].join("\n");
  }

  toYaml(data: any): string {
    return JSON.stringify(data, null, 2)
      .replace(/"/g, "")
      .replace(/,$/gm, "")
      .replace(/^\s*{$/gm, "")
      .replace(/^\s*}$/gm, "");
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }
}

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
      .description("Buddy Workspace CLI")
      .version("1.0.0")
      .option("--verbose", "Enable verbose output")
      .option("--format <format>", "Output format (table, json, yaml)", "table")
      .hook("preAction", async (thisCommand) => {
        await this.store.initialize();
        const options = thisCommand.opts();
        if (options.verbose || options.format) {
          await this.store.updateConfig({
            verbose: options.verbose || this.store.getConfig().verbose,
            format: options.format || this.store.getConfig().format,
          });
        }
      });

    this.setupWorkspaceCommands();
    this.setupChatAppCommands();
    this.setupConfigCommands();
  }

  private setupWorkspaceCommands(): void {
    const workspace = this.program
      .command("workspace")
      .alias("ws")
      .description("Manage workspaces");

    workspace
      .command("create")
      .description("Create a new workspace")
      .argument("<name>", "Workspace name")
      .option("--icon <icon>", "Workspace icon")
      .option("--color <color>", "Workspace color")
      .option("--description <description>", "Workspace description")
      .option("--agents <agents>", "Comma-separated list of agent IDs")
      .action(async (name, options) => {
        try {
          const workspaceId = await this.store.createWorkspace({
            name,
            icon: options.icon,
            color: options.color,
            description: options.description,
            availableAgents: options.agents
              ? options.agents.split(",").map((a: string) => a.trim())
              : [],
          });

          console.log(`✅ Created workspace: ${name}`);
          console.log(`   ID: ${workspaceId}`);

          if (this.store.getConfig().verbose) {
            const workspace = await this.store.getCurrentWorkspace();
            if (workspace) {
              console.log("\nWorkspace Details:");
              console.log(
                this.store.formatWorkspace(
                  workspace,
                  [],
                  this.store.getConfig().format
                )
              );
            }
          }
        } catch (error) {
          console.error("❌ Failed to create workspace:", error);
          process.exit(1);
        }
      });

    workspace
      .command("list")
      .description("List all workspaces")
      .option("--include-archived", "Include archived workspaces")
      .action(async (options) => {
        try {
          const workspaces = await this.store.listWorkspaces({
            includeArchived: options.includeArchived,
          });

          if (workspaces.length === 0) {
            console.log("No workspaces found.");
            return;
          }

          console.log(
            this.store.formatWorkspaces(
              workspaces,
              this.store.getConfig().format
            )
          );

          if (this.store.getConfig().verbose) {
            console.log(`\nTotal: ${workspaces.length} workspace(s)`);
          }
        } catch (error) {
          console.error("❌ Failed to list workspaces:", error);
          process.exit(1);
        }
      });

    workspace
      .command("show")
      .description("Show workspace details")
      .argument("<id>", "Workspace ID")
      .action(async (id) => {
        try {
          const state = await this.store.loadState();
          const workspace = state.workspaces[id];

          if (!workspace) {
            console.error(`❌ Workspace not found: ${id}`);
            process.exit(1);
          }

          const chatApps = await this.store.getChatAppsInWorkspace(id);
          console.log(
            this.store.formatWorkspace(
              workspace,
              chatApps,
              this.store.getConfig().format
            )
          );
        } catch (error) {
          console.error("❌ Failed to show workspace:", error);
          process.exit(1);
        }
      });

    workspace
      .command("current")
      .description("Show current workspace")
      .action(async () => {
        try {
          const workspace = await this.store.getCurrentWorkspace();

          if (!workspace) {
            console.log("No current workspace set.");
            return;
          }

          const chatApps = await this.store.getChatAppsInWorkspace(
            workspace.id
          );
          console.log(
            this.store.formatWorkspace(
              workspace,
              chatApps,
              this.store.getConfig().format
            )
          );
        } catch (error) {
          console.error("❌ Failed to show current workspace:", error);
          process.exit(1);
        }
      });

    workspace
      .command("activate")
      .description("Activate a workspace")
      .argument("<id>", "Workspace ID")
      .action(async (id) => {
        try {
          const state = await this.store.loadState();
          if (!state.workspaces[id]) {
            console.error(`❌ Workspace not found: ${id}`);
            process.exit(1);
          }

          await this.store.activateWorkspace(id);
          console.log(`✅ Activated workspace: ${state.workspaces[id].name}`);
        } catch (error) {
          console.error("❌ Failed to activate workspace:", error);
          process.exit(1);
        }
      });

    workspace
      .command("archive")
      .description("Archive a workspace")
      .argument("<id>", "Workspace ID")
      .action(async (id) => {
        try {
          const state = await this.store.loadState();
          if (!state.workspaces[id]) {
            console.error(`❌ Workspace not found: ${id}`);
            process.exit(1);
          }

          await this.store.archiveWorkspace(id);
          console.log(`✅ Archived workspace: ${state.workspaces[id].name}`);
        } catch (error) {
          console.error("❌ Failed to archive workspace:", error);
          process.exit(1);
        }
      });
  }

  private setupChatAppCommands(): void {
    const chatapp = this.program
      .command("chatapp")
      .alias("app")
      .description("Manage chat applications");

    chatapp
      .command("list")
      .description("List chat applications")
      .option("--workspace <id>", "Filter by workspace ID")
      .action(async (options) => {
        try {
          let chatApps: ChatAppEntry[];

          if (options.workspace) {
            chatApps = await this.store.getChatAppsInWorkspace(
              options.workspace
            );
          } else {
            const state = await this.store.loadState();
            chatApps = Object.values(state.chatApps);
          }

          if (chatApps.length === 0) {
            console.log("No chat applications found.");
            return;
          }

          const headers = ["ID", "Workspace", "Status", "Last Active"];
          const rows = chatApps.map((app) => [
            app.id,
            app.workspaceId,
            app.status,
            this.store.formatRelativeTime(app.lastActiveAt),
          ]);

          console.log(this.store.createTable(headers, rows));

          if (this.store.getConfig().verbose) {
            console.log(`\nTotal: ${chatApps.length} chat app(s)`);
          }
        } catch (error) {
          console.error("❌ Failed to list chat apps:", error);
          process.exit(1);
        }
      });

    chatapp
      .command("show")
      .description("Show chat application details")
      .argument("<id>", "Chat app ID")
      .action(async (id) => {
        try {
          const state = await this.store.loadState();
          const chatApp = state.chatApps[id];

          if (!chatApp) {
            console.error(`❌ Chat app not found: ${id}`);
            process.exit(1);
          }

          const details = [
            ["ID", chatApp.id],
            ["Workspace", chatApp.workspaceId],
            ["Status", chatApp.status],
            [
              "Last Active",
              this.store.formatRelativeTime(chatApp.lastActiveAt),
            ],
            ["Archived", chatApp.isArchived ? "Yes" : "No"],
          ];

          console.log(this.store.createTable(["Property", "Value"], details));
        } catch (error) {
          console.error("❌ Failed to show chat app:", error);
          process.exit(1);
        }
      });
  }

  private setupConfigCommands(): void {
    const config = this.program
      .command("config")
      .description("Manage configuration");

    config
      .command("show")
      .description("Show current configuration")
      .action(async () => {
        try {
          const config = this.store.getConfig();
          console.log(
            this.store.formatWorkspaces(
              [config as any],
              this.store.getConfig().format
            )
          );
        } catch (error) {
          console.error("❌ Failed to show configuration:", error);
          process.exit(1);
        }
      });

    config
      .command("set")
      .description("Set configuration value")
      .argument("<key>", "Configuration key")
      .argument("<value>", "Configuration value")
      .action(async (key, value) => {
        try {
          const updates: any = {};
          const keys = key.split(".");
          let current = updates;

          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
          }

          // Parse value
          let parsedValue: any = value;
          if (value === "true") parsedValue = true;
          else if (value === "false") parsedValue = false;
          else if (!isNaN(Number(value))) parsedValue = Number(value);

          current[keys[keys.length - 1]] = parsedValue;

          await this.store.updateConfig(updates);
          console.log(`✅ Updated configuration: ${key} = ${value}`);
        } catch (error) {
          console.error("❌ Failed to update configuration:", error);
          process.exit(1);
        }
      });
  }

  async run(): Promise<void> {
    await this.program.parseAsync(process.argv);
  }
}

async function main() {
  const cli = new BuddyWorkspaceCLI();
  await cli.run();
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("❌ CLI Error:", error);
    process.exit(1);
  });
}

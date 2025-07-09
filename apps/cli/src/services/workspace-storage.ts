import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  availableAgents: string[];
  createdAt: string;
  lastActiveAt: string;
  isArchived: boolean;
  maxExpandedApps: number;
  activeAppId: string | null;
}

export interface WorkspaceStorage {
  currentWorkspaceId: string | null;
  workspaces: Record<string, Workspace>;
  chatApps: Record<string, any>;
}

export class WorkspaceStorageService {
  private configPath: string;

  constructor() {
    this.configPath = process.env.BUDDY_CONFIG_DIR 
      ? join(process.env.BUDDY_CONFIG_DIR, "workspace.json")
      : join(homedir(), ".buddy", "workspace.json");
  }

  async readStorage(): Promise<WorkspaceStorage> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      // If file doesn't exist or is invalid, return empty storage
      return {
        currentWorkspaceId: null,
        workspaces: {},
        chatApps: {}
      };
    }
  }

  async writeStorage(storage: WorkspaceStorage): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(join(homedir(), ".buddy"), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(storage, null, 2));
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const storage = await this.readStorage();
    return Object.values(storage.workspaces);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const storage = await this.readStorage();
    return storage.workspaces[id] || null;
  }

  async createWorkspace(workspace: Omit<Workspace, "id">): Promise<Workspace> {
    const storage = await this.readStorage();
    
    // Generate a unique ID
    const id = `workspace-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    
    const newWorkspace: Workspace = {
      ...workspace,
      id,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isArchived: false,
      maxExpandedApps: 2,
      activeAppId: null
    };

    storage.workspaces[id] = newWorkspace;
    await this.writeStorage(storage);

    return newWorkspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const storage = await this.readStorage();
    
    if (!storage.workspaces[id]) {
      throw new Error(`Workspace not found: ${id}`);
    }

    storage.workspaces[id] = {
      ...storage.workspaces[id],
      ...updates,
      lastActiveAt: new Date().toISOString()
    };

    await this.writeStorage(storage);
    return storage.workspaces[id];
  }

  async deleteWorkspace(id: string): Promise<void> {
    const storage = await this.readStorage();
    
    if (!storage.workspaces[id]) {
      throw new Error(`Workspace not found: ${id}`);
    }

    delete storage.workspaces[id];
    if (storage.currentWorkspaceId === id) {
      storage.currentWorkspaceId = null;
    }

    await this.writeStorage(storage);
  }
}

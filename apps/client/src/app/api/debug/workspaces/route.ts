import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    // Read the workspace index file directly
    const publicDir = join(process.cwd(), "public");
    const indexPath = join(publicDir, "static/configs/workspaces/index.json");
    
    const indexContent = await readFile(indexPath, "utf-8");
    const indexData = JSON.parse(indexContent);

    // Load individual workspace configs
    const workspaces = [];
    for (const workspaceRef of indexData.workspaces || []) {
      try {
        const workspacePath = join(publicDir, workspaceRef.configPath);
        const workspaceContent = await readFile(workspacePath, "utf-8");
        const workspaceData = JSON.parse(workspaceContent);
        
        // Transform to WorkspaceModel format
        const workspace = {
          id: workspaceData.id,
          name: workspaceData.name,
          description: workspaceData.description || "",
          chatappIds: workspaceData.chatappIds || [],
          agentIds: workspaceData.agentIds || [],
          permissions: {
            canAddApps: true,
            canRemoveApps: true,
            canModifyLayout: true,
            canChangeSettings: true,
            canInviteUsers: false,
            canManagePermissions: false,
          },
          isDefault: false,
          isArchived: workspaceData.isArchived || false,
          maxExpandedApps: workspaceData.maxExpandedApps || 2,
          createdAt: workspaceData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            icon: workspaceData.icon,
            primaryColor: workspaceData.primaryColor || workspaceData.style?.primaryColor,
            activeAppId: workspaceData.activeAppId,
            style: workspaceData.style,
          },
        };
        
        workspaces.push(workspace);
      } catch (error) {
        console.warn(`Failed to load workspace ${workspaceRef.id}:`, error);
      }
    }

    return NextResponse.json({
      workspaces,
      currentWorkspace: null, // No current workspace initially
      count: workspaces.length,
      firstWorkspace: workspaces[0] || null,
    });
  } catch (error) {
    console.error("Debug workspaces error:", error);
    return NextResponse.json(
      { error: "Failed to load workspaces", details: String(error) },
      { status: 500 }
    );
  }
}

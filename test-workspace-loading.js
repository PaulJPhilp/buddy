import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function testWorkspaceLoading() {
  try {
    console.log("Testing workspace loading...");

    // Test the path resolution
    const workspaceIndexPath = join(
      process.cwd(),
      "..",
      "..",
      "public",
      "static/configs/workspaces/index.json",
    );
    console.log("Workspace index path:", workspaceIndexPath);

    // Read the workspace index
    const indexContent = await readFile(workspaceIndexPath, "utf-8");
    const indexData = JSON.parse(indexContent);
    console.log("Workspace index loaded:", indexData);

    // Test loading individual workspace configs
    for (const workspace of indexData.workspaces) {
      const workspacePath = join(
        process.cwd(),
        "..",
        "..",
        "public",
        workspace.configPath,
      );
      console.log(`Loading workspace ${workspace.id} from:`, workspacePath);

      try {
        const workspaceContent = await readFile(workspacePath, "utf-8");
        const workspaceData = JSON.parse(workspaceContent);
        console.log(`✅ Workspace ${workspace.id}:`, {
          name: workspaceData.name,
          chatAppIds: workspaceData.chatAppIds,
          availableAgents: workspaceData.availableAgents,
        });
      } catch (error) {
        console.log(
          `❌ Failed to load workspace ${workspace.id}:`,
          error.message,
        );
      }
    }
  } catch (error) {
    console.error("❌ Workspace loading test failed:", error.message);
  }
}

testWorkspaceLoading();

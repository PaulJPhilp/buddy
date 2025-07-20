import { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { ConfigService } from "@/services/config/service"; // Import ConfigService
import { Effect, Ref } from "effect";
import { v4 as uuidv4 } from "uuid";
import {
  WorkspacesEditorManagerApi,
  WorkspacesEditorManagerError,
} from "./workspaces-editor-api";

export class WorkspacesEditorManager extends Effect.Service<WorkspacesEditorManagerApi>()(
  "WorkspacesEditorManager",
  {
    effect: Effect.gen(function* () {
      const editingWorkspaceRef = yield* Ref.make<WorkspaceConfig | null>(null);
      const configService = yield* ConfigService; // Get ConfigService instance

      return {
        setEditingWorkspace: (workspace) =>
          Ref.set(editingWorkspaceRef, workspace),
        getEditingWorkspace: Ref.get(editingWorkspaceRef).pipe(
          Effect.mapError(
            () =>
              new WorkspacesEditorManagerError({
                message: "Failed to get editing workspace state",
              })
          )
        ),
        getAllWorkspaces: Effect.gen(function* () {
          const currentConfig = yield* configService.getConfig();
          return currentConfig.workspaces;
        }).pipe(
          Effect.mapError(
            () =>
              new WorkspacesEditorManagerError({
                message: "Failed to get all workspaces from config.",
              })
          )
        ),
        createWorkspace: (input: Partial<WorkspaceConfig>) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const newWorkspace: WorkspaceConfig = {
              id: uuidv4(),
              name: input.name || `New Workspace ${new Date().getTime()}`,
              description: input.description || "",
              chatappIds: input.chatappIds || [],
              agentIds: input.agentIds || [],
              permissions: input.permissions || {
                canAddApps: true,
                canRemoveApps: true,
                canModifyLayout: true,
                canChangeSettings: true,
                canInviteUsers: false,
                canManagePermissions: false,
              },
              isDefault: input.isDefault || false,
              isArchived: input.isArchived || false,
              maxExpandedApps: input.maxExpandedApps || 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            currentConfig.workspaces.push(newWorkspace);
            yield* configService.saveConfig(currentConfig);
            return newWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to create workspace in config.",
                })
            )
          ),
        updateWorkspace: (id: string, updates: Partial<WorkspaceConfig>) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            let updatedWorkspace: WorkspaceConfig | undefined;
            currentConfig.workspaces = currentConfig.workspaces.map((ws) => {
              if (ws.id === id) {
                updatedWorkspace = {
                  ...ws,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };
                return updatedWorkspace;
              }
              return ws;
            });

            if (!updatedWorkspace) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for update.`,
                })
              );
            }
            yield* configService.saveConfig(currentConfig);
            return updatedWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to update workspace in config.",
                })
            )
          ),
        deleteWorkspace: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const initialLength = currentConfig.workspaces.length;
            currentConfig.workspaces = currentConfig.workspaces.filter(
              (ws) => ws.id !== id
            );

            if (currentConfig.workspaces.length === initialLength) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for deletion.`,
                })
              );
            }

            yield* configService.saveConfig(currentConfig);
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to delete workspace from config.",
                })
            )
          ),
        archiveWorkspace: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            let archivedWorkspace: WorkspaceConfig | undefined;
            currentConfig.workspaces = currentConfig.workspaces.map((ws) => {
              if (ws.id === id) {
                archivedWorkspace = {
                  ...ws,
                  isArchived: true,
                  updatedAt: new Date().toISOString(),
                };
                return archivedWorkspace;
              }
              return ws;
            });
            if (!archivedWorkspace) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for archival.`,
                })
              );
            }
            yield* configService.saveConfig(currentConfig);
            return archivedWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to archive workspace.",
                })
            )
          ),
        restoreWorkspace: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            let restoredWorkspace: WorkspaceConfig | undefined;
            currentConfig.workspaces = currentConfig.workspaces.map((ws) => {
              if (ws.id === id) {
                restoredWorkspace = {
                  ...ws,
                  isArchived: false,
                  updatedAt: new Date().toISOString(),
                };
                return restoredWorkspace;
              }
              return ws;
            });
            if (!restoredWorkspace) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for restoration.`,
                })
              );
            }
            yield* configService.saveConfig(currentConfig);
            return restoredWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to restore workspace.",
                })
            )
          ),
        duplicateWorkspace: (id: string, newName?: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const sourceWorkspace = currentConfig.workspaces.find(
              (ws) => ws.id === id
            );

            if (!sourceWorkspace) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for duplication.`,
                })
              );
            }

            const duplicatedWorkspace: WorkspaceConfig = {
              ...sourceWorkspace,
              id: uuidv4(),
              name: newName || `${sourceWorkspace.name} (Copy)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: false, // Duplicates are typically not default
            };
            currentConfig.workspaces.push(duplicatedWorkspace);
            yield* configService.saveConfig(currentConfig);
            return duplicatedWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to duplicate workspace.",
                })
            )
          ),
        exportWorkspace: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const workspaceToExport = currentConfig.workspaces.find(
              (ws) => ws.id === id
            );

            if (!workspaceToExport) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: `Workspace with ID ${id} not found for export.`,
                })
              );
            }
            return JSON.stringify(workspaceToExport, null, 2);
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to export workspace.",
                })
            )
          ),
        importWorkspace: (data: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            let importedWorkspace: WorkspaceConfig;

            try {
              importedWorkspace = JSON.parse(data);
            } catch (error) {
              return yield* Effect.fail(
                new WorkspacesEditorManagerError({
                  message: "Failed to parse imported workspace data.",
                  cause: error,
                })
              );
            }

            // Ensure the imported workspace has a unique ID, or overwrite if ID exists
            // For now, let's assume new ID for imported, or a specific prompt for overwrite.
            // For simplicity, generate new ID always for import
            importedWorkspace = {
              ...importedWorkspace,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            currentConfig.workspaces.push(importedWorkspace);
            yield* configService.saveConfig(currentConfig);
            return importedWorkspace;
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspacesEditorManagerError({
                  message: "Failed to import workspace.",
                })
            )
          ),
      };
    }),
    dependencies: [ConfigService],
  }
) {}

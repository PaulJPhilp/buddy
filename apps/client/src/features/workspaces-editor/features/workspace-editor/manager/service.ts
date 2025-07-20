import { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { ConfigService } from "@/services/config/service"; // Import ConfigService
import { Effect, Ref } from "effect";
import { v4 as uuidv4 } from "uuid";
import { WorkspaceEditorApi, WorkspaceEditorError } from "./api";

export class WorkspaceEditor extends Effect.Service<WorkspaceEditorApi>()(
  "WorkspaceEditor",
  {
    effect: Effect.gen(function* () {
      const currentWorkspaceRef = yield* Ref.make<WorkspaceConfig | null>(null);
      const configService = yield* ConfigService; // Get the ConfigService instance

      return {
        setWorkspace: (workspace) => Ref.set(currentWorkspaceRef, workspace),
        getWorkspace: Ref.get(currentWorkspaceRef).pipe(
          Effect.mapError(
            () =>
              new WorkspaceEditorError({
                message: "Failed to get singular workspace editor state",
              })
          )
        ),
        loadWorkspaceById: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const workspace = currentConfig.workspaces.find(
              (ws) => ws.id === id
            );

            if (!workspace) {
              return yield* Effect.fail(
                new WorkspaceEditorError({
                  message: `Workspace with ID ${id} not found.`,
                })
              );
            }
            yield* Ref.set(currentWorkspaceRef, workspace); // Set it in local ref
            return workspace;
          }).pipe(
            Effect.mapError((e) =>
              e instanceof WorkspaceEditorError
                ? e
                : new WorkspaceEditorError({
                    message: "Failed to load workspace by ID",
                    cause: e,
                  })
            )
          ),
        saveWorkspace: (workspace: WorkspaceConfig) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const isNew = !currentConfig.workspaces.some(
              (ws) => ws.id === workspace.id
            );

            let updatedWorkspace: WorkspaceConfig = {
              ...workspace,
              updatedAt: new Date().toISOString(),
            };

            if (isNew) {
              updatedWorkspace = {
                ...updatedWorkspace,
                id: uuidv4(), // Assign new ID for new workspaces
                createdAt: new Date().toISOString(),
              };
              currentConfig.workspaces.push(updatedWorkspace);
            } else {
              currentConfig.workspaces = currentConfig.workspaces.map((ws) =>
                ws.id === updatedWorkspace.id ? updatedWorkspace : ws
              );
            }

            yield* configService.saveConfig(currentConfig);
            yield* Ref.set(currentWorkspaceRef, updatedWorkspace); // Update local ref
            return updatedWorkspace;
          }).pipe(
            Effect.mapError(
              (e) =>
                new WorkspaceEditorError({
                  message: "Failed to save workspace",
                  cause: e,
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
                new WorkspaceEditorError({
                  message: `Workspace with ID ${id} not found for deletion.`,
                })
              );
            }

            yield* configService.saveConfig(currentConfig);
            if ((yield* Ref.get(currentWorkspaceRef))?.id === id) {
              yield* Ref.set(currentWorkspaceRef, null);
            }
          }).pipe(
            Effect.mapError((e) =>
              e instanceof WorkspaceEditorError
                ? e
                : new WorkspaceEditorError({
                    message: "Failed to delete workspace",
                    cause: e,
                  })
            )
          ),
      };
    }),
    dependencies: [ConfigService],
  }
) {}

import { Effect, Layer } from "effect";
import { WorkspaceError } from "../errors";
import type {
  StorageData,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from "../types";
import {
  validateStorage,
  validateWorkspace,
  validateWorkspaceCreate,
  validateWorkspaceUpdate,
} from "../validation";
import { StorageService } from "./storage";

export interface ConfigServiceApi {
  readonly getAllWorkspaces: () => Effect.Effect<Workspace[], WorkspaceError>;
  readonly getWorkspace: (
    id: string
  ) => Effect.Effect<Workspace | null, WorkspaceError>;
  readonly createWorkspace: (
    input: WorkspaceCreateInput
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly createWorkspaceWithId: (
    id: string,
    input: WorkspaceCreateInput
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly updateWorkspace: (
    id: string,
    updates: WorkspaceUpdateInput
  ) => Effect.Effect<Workspace, WorkspaceError>;
  readonly deleteWorkspace: (id: string) => Effect.Effect<void, WorkspaceError>;
  readonly getCurrentWorkspaceId: () => Effect.Effect<
    string | null,
    WorkspaceError
  >;
  readonly setCurrentWorkspace: (
    id: string | null
  ) => Effect.Effect<void, WorkspaceError>;
}

export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    effect: Effect.gen(function* () {
      const storage = yield* StorageService;

      // Explicitly type the return value for correct inference
      const readAndValidate = (
        errorMessage: string
      ): Effect.Effect<StorageData, WorkspaceError> =>
        storage.read().pipe(
          Effect.mapError(
            (error) =>
              new WorkspaceError({ message: errorMessage, cause: error })
          ),
          Effect.flatMap((data) =>
            validateStorage(data).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({ message: errorMessage, cause: error })
              )
            )
          )
        );

      return {
        getAllWorkspaces: () =>
          readAndValidate("Failed to list workspaces").pipe(
            Effect.map((data) => Object.values(data.workspaces))
          ),

        getWorkspace: (id: string) =>
          readAndValidate("Failed to get workspace").pipe(
            Effect.map((data) => data.workspaces[id] || null)
          ),

        createWorkspace: (input: WorkspaceCreateInput) =>
          Effect.gen(function* () {
            const validInput = yield* validateWorkspaceCreate(input).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace input",
                    cause: error,
                  })
              )
            );
            const data = yield* readAndValidate("Failed to create workspace");
            const now = new Date().toISOString();
            const id = `workspace-${validInput.name
              .toLowerCase()
              .replace(/\s+/g, "-")}-${Date.now()}`;
            const workspace: Workspace = {
              id,
              name: validInput.name,
              description:
                validInput.description || `${validInput.name} workspace`,
              icon: validInput.icon || "default",
              color: validInput.color || "#000000",
              agentIds: validInput.agentIds || [],
              chatappIds: validInput.chatappIds || [],
              createdAt: now,
              lastActiveAt: now,
              isArchived: false,
              maxExpandedApps: 2,
              activeAppId: null,
            };
            const validWorkspace = yield* validateWorkspace(workspace).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace",
                    cause: error,
                  })
              )
            );
            const updatedData: StorageData = {
              ...data,
              workspaces: { ...data.workspaces, [id]: validWorkspace },
              currentWorkspaceId: data.currentWorkspaceId ?? id,
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to save workspace",
                    cause: error,
                  })
              )
            );
            return validWorkspace;
          }),

        createWorkspaceWithId: (id: string, input: WorkspaceCreateInput) =>
          Effect.gen(function* () {
            const validInput = yield* validateWorkspaceCreate(input).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace input",
                    cause: error,
                  })
              )
            );
            const data = yield* readAndValidate("Failed to create workspace");
            const now = new Date().toISOString();
            const workspace: Workspace = {
              id,
              name: validInput.name,
              description:
                validInput.description || `${validInput.name} workspace`,
              icon: validInput.icon || "default",
              color: validInput.color || "#000000",
              agentIds: validInput.agentIds || [],
              chatappIds: validInput.chatappIds || [],
              createdAt: now,
              lastActiveAt: now,
              isArchived: false,
              maxExpandedApps: 2,
              activeAppId: null,
            };
            const validWorkspace = yield* validateWorkspace(workspace).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace",
                    cause: error,
                  })
              )
            );
            const updatedData: StorageData = {
              ...data,
              workspaces: { ...data.workspaces, [id]: validWorkspace },
              currentWorkspaceId: data.currentWorkspaceId ?? id,
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to save workspace",
                    cause: error,
                  })
              )
            );
            return validWorkspace;
          }),

        updateWorkspace: (id: string, updates: WorkspaceUpdateInput) =>
          Effect.gen(function* () {
            const validUpdates = yield* validateWorkspaceUpdate(updates).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace update",
                    cause: error,
                  })
              )
            );
            const data = yield* readAndValidate("Failed to update workspace");
            const workspace = data.workspaces[id];
            if (!workspace) {
              return yield* Effect.fail(
                new WorkspaceError({ message: `Workspace not found: ${id}` })
              );
            }
            const updatedWorkspace: Workspace = {
              ...workspace,
              ...validUpdates,
              lastActiveAt: new Date().toISOString(),
            };
            const validWorkspace = yield* validateWorkspace(
              updatedWorkspace
            ).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate workspace",
                    cause: error,
                  })
              )
            );
            const updatedData: StorageData = {
              ...data,
              workspaces: { ...data.workspaces, [id]: validWorkspace },
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to save workspace update",
                    cause: error,
                  })
              )
            );
            return validWorkspace;
          }),

        deleteWorkspace: (id: string) =>
          Effect.gen(function* () {
            const data = yield* readAndValidate("Failed to delete workspace");
            if (!data.workspaces[id]) {
              return yield* Effect.fail(
                new WorkspaceError({ message: `Workspace not found: ${id}` })
              );
            }
            const newWorkspaces = { ...data.workspaces };
            delete newWorkspaces[id];
            const newCurrentWorkspaceId =
              data.currentWorkspaceId === id
                ? Object.keys(newWorkspaces)[0] || null
                : data.currentWorkspaceId;

            const updatedData: StorageData = {
              ...data,
              workspaces: newWorkspaces,
              currentWorkspaceId: newCurrentWorkspaceId,
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to save workspace deletion",
                    cause: error,
                  })
              )
            );
          }),

        getCurrentWorkspaceId: () =>
          readAndValidate("Failed to get current workspace").pipe(
            Effect.map((data) => data.currentWorkspaceId)
          ),

        setCurrentWorkspace: (id: string | null) =>
          Effect.gen(function* () {
            const data = yield* readAndValidate(
              "Failed to set current workspace"
            );
            if (id && !data.workspaces[id]) {
              return yield* Effect.fail(
                new WorkspaceError({ message: `Workspace not found: ${id}` })
              );
            }
            const updatedData: StorageData = {
              ...data,
              currentWorkspaceId: id,
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new WorkspaceError({
                    message: "Failed to save current workspace",
                    cause: error,
                  })
              )
            );
          }),
      } satisfies ConfigServiceApi;
    }),
    dependencies: [StorageService.Default],
  }
) {}

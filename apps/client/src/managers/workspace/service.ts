import { Effect, Layer, Queue, Ref } from "effect";
import { WorkspaceManager } from "./api";
import {
  CreateWorkspace,
  DeleteWorkspace,
  UpdateWorkspace,
  WorkspaceCommand,
} from "./commands";
import { WorkspaceNotFoundError } from "./errors";
import { Workspace } from "./types";

// Helper function to create a new workspace with default values.
function createWorkspace(command: CreateWorkspace): Workspace {
  const now = new Date().toISOString();
  return {
    id: `ws_${Date.now()}`, // Simple unique ID for now
    name: command.name,
    description: command.description,
    chatappIds: [],
    agentIds: [],
    permissions: {
      canAddApps: true,
      canRemoveApps: true,
      canModifyLayout: true,
      canChangeSettings: true,
      canInviteUsers: false,
      canManagePermissions: false,
    },
    isDefault: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const WorkspaceManagerLive = Layer.scoped(
  WorkspaceManager,
  Effect.gen(function* () {
    // The state of all workspaces, held in a Ref.
    const workspaces = yield* Ref.make<readonly Workspace[]>([]);

    // A simple, unbounded queue to act as our command bus.
    const commandQueue = yield* Queue.unbounded<WorkspaceCommand>();

    // The handler logic for each command type.
    const handleCommand = (
      command: WorkspaceCommand
    ): Effect.Effect<void, WorkspaceNotFoundError> => {
      switch (command._tag) {
        case "CreateWorkspace":
          return Ref.update(workspaces, (list) => [
            ...list,
            createWorkspace(command),
          ]);

        case "UpdateWorkspace":
          return Effect.gen(function* () {
            const list = yield* Ref.get(workspaces);
            const index = list.findIndex((ws) => ws.id === command.workspaceId);
            if (index === -1) {
              return yield* Effect.fail(
                new WorkspaceNotFoundError({ workspaceId: command.workspaceId })
              );
            }
            const updatedWs = {
              ...list[index],
              ...command.updates,
              updatedAt: new Date().toISOString(),
            };
            const newList = [...list];
            newList[index] = updatedWs;
            return yield* Ref.set(workspaces, newList);
          });

        case "DeleteWorkspace":
          return Effect.gen(function* () {
            const list = yield* Ref.get(workspaces);
            const index = list.findIndex((ws) => ws.id === command.workspaceId);
            if (index === -1) {
              return yield* Effect.fail(
                new WorkspaceNotFoundError({ workspaceId: command.workspaceId })
              );
            }
            const newList = list.filter((ws) => ws.id !== command.workspaceId);
            return yield* Ref.set(workspaces, newList);
          });
      }
    };

    // Fork a fiber that continuously takes commands from the queue and processes them.
    yield* Effect.forkDaemon(
      Queue.take(commandQueue).pipe(
        Effect.flatMap(handleCommand),
        Effect.forever
      )
    );

    // The public API of the service.
    return {
      workspaces,
      dispatch: (command) => Queue.offer(commandQueue, command),
    };
  })
);

import { WorkspaceManager } from "@/managers/workspace-component";
import { AgentService } from "@/services/agent";
import { ChatAppLoaderServiceLive } from "@/services/chatapp-loader";
import { Effect } from "effect";
import type { IntegrityService } from "./api";
import { IntegrityError, MissingAgentError } from "./errors";

export class IntegrityServiceLive extends Effect.Service<IntegrityService>()(
  "IntegrityService",
  {
    scoped: Effect.gen(function* () {
      const agentService = yield* AgentService;
      const workspaceManager = yield* WorkspaceManager;
      const chatAppLoaderService = yield* ChatAppLoaderServiceLive;

      const checkAll = () =>
        Effect.gen(function* () {
          const errors: IntegrityError[] = [];

          // 1. Fetch all agents and create a lookup set
          const allAgents = yield* agentService.getAll();
          const agentIdSet = new Set(allAgents.map((a) => a.id));

          // 2. Fetch all workspaces
          const allWorkspaces = yield* workspaceManager.loadWorkspaces();

          for (const workspace of allWorkspaces) {
            // 3. Check workspace's availableAgents
            if (workspace.availableAgents) {
              for (const agentId of workspace.availableAgents) {
                if (!agentIdSet.has(agentId)) {
                  errors.push(
                    new MissingAgentError({
                      entityType: "Workspace",
                      entityId: workspace.id,
                      missingAgentId: agentId,
                    })
                  );
                }
              }
            }

            // 4. Fetch and check chat apps for the workspace
            const chatApps = yield* chatAppLoaderService.getAppsForWorkspace(
              workspace.id
            );
            for (const app of chatApps) {
              if (!agentIdSet.has(app.config.agentId)) {
                errors.push(
                  new MissingAgentError({
                    entityType: "ChatApp",
                    entityId: app.id,
                    missingAgentId: app.config.agentId,
                  })
                );
              }
            }
          }

          if (errors.length > 0) {
            return yield* Effect.fail(errors);
          }
        });

      return {
        checkAll,
      };
    }),
    dependencies: [
      AgentService.Default,
      WorkspaceManager.Default,
      ChatAppLoaderServiceLive,
    ],
  }
) {}

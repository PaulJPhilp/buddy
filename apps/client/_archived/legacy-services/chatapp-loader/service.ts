import type { ChatAppEntry } from "@/managers/workspace-component/types";
import { ChatAppConfigSchema } from "@/types/global";
import { Effect } from "effect";
import type { ChatAppLoaderService } from "./api";
import { ChatAppLoadError } from "./errors";

// List of all chatapp config files (should be kept in sync with the directory)
const CHATAPP_CONFIG_FILES = [
  "building-ai.json",
  "learning-ai.json",
  "social-media.json",
  "tasks.json",
  "building-ai-new.json",
  "learning-ai-new.json",
  "science.json",
  "science-fiction.json",
  "literature.json",
  "email.json",
];

function isValidConfigFile(filename: string): boolean {
  return filename.endsWith(".json") && !filename.endsWith("-schema.json");
}

export class ChatAppLoaderService extends Effect.Service<ChatAppLoaderService>()(
  "ChatAppLoaderService",
  {
    effect: Effect.succeed({
      getAppsForWorkspace: (workspaceId: string) =>
        Effect.tryPromise({
          try: async () => {
            const entries: ChatAppEntry[] = [];
            for (const filename of CHATAPP_CONFIG_FILES) {
              if (!isValidConfigFile(filename)) continue;
              try {
                const res = await fetch(`/static/configs/chatapps/${filename}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const config = ChatAppConfigSchema.parse(json);
                // Only include if workspaceId matches (or if workspaceId is 'all')
                if (
                  workspaceId === "all" ||
                  config.spaceId === workspaceId ||
                  config.workspaceId === workspaceId
                ) {
                  entries.push({
                    id: config.id,
                    workspaceId:
                      config.spaceId || config.workspaceId || "default-space",
                    status: "stashed",
                    isArchived: false,
                    lastActiveAt: new Date(),
                    config,
                  });
                }
              } catch (err) {
                // Log and skip invalid files
                // eslint-disable-next-line no-console
                console.warn(
                  `[ChatAppLoaderService] Failed to load ${filename}:`,
                  err
                );
                continue;
              }
            }
            return entries;
          },
          catch: (cause) =>
            new ChatAppLoadError({
              message: `Failed to load chat apps for workspace ${workspaceId}`,
              cause,
            }),
        }),
    }),
    dependencies: [],
  }
) {}

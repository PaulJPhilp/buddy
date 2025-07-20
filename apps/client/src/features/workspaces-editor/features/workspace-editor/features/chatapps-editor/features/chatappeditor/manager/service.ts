import { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { ConfigService } from "@/services/config/service"; // Import ConfigService
import { Effect, Ref } from "effect";
import { v4 as uuidv4 } from "uuid";
import { ChatAppEditorApi, ChatAppEditorError } from "./api";

export class ChatAppEditor extends Effect.Service<ChatAppEditorApi>()(
  "ChatAppEditor",
  {
    effect: Effect.gen(function* () {
      const currentChatAppRef = yield* Ref.make<ChatAppConfig | null>(null);
      const configService = yield* ConfigService; // Get the ConfigService instance

      return {
        setChatApp: (chatApp) => Ref.set(currentChatAppRef, chatApp),
        getChatApp: Ref.get(currentChatAppRef).pipe(
          Effect.mapError(
            () =>
              new ChatAppEditorError({
                message: "Failed to get singular chat app editor state",
              })
          )
        ),
        loadChatAppById: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const chatApp = currentConfig.chatapps.find((app) => app.id === id);

            if (!chatApp) {
              return yield* Effect.fail(
                new ChatAppEditorError({
                  message: `Chat App with ID ${id} not found.`,
                })
              );
            }
            yield* Ref.set(currentChatAppRef, chatApp); // Set it in local ref
            return chatApp;
          }).pipe(
            Effect.mapError((e) =>
              e instanceof ChatAppEditorError
                ? e
                : new ChatAppEditorError({
                    message: "Failed to load chat app by ID",
                    cause: e,
                  })
            )
          ),
        saveChatApp: (chatApp: ChatAppConfig) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const isNew = !currentConfig.chatapps.some(
              (app) => app.id === chatApp.id
            );

            let updatedChatApp: ChatAppConfig = {
              ...chatApp,
              updatedAt: new Date().toISOString(),
            };

            if (isNew) {
              updatedChatApp = {
                ...updatedChatApp,
                id: uuidv4(), // Assign new ID for new chat apps
                createdAt: new Date().toISOString(),
              };
              currentConfig.chatapps.push(updatedChatApp);
            } else {
              currentConfig.chatapps = currentConfig.chatapps.map((app) =>
                app.id === updatedChatApp.id ? updatedChatApp : app
              );
            }

            yield* configService.saveConfig(currentConfig);
            yield* Ref.set(currentChatAppRef, updatedChatApp); // Update local ref
            return updatedChatApp;
          }).pipe(
            Effect.mapError(
              (e) =>
                new ChatAppEditorError({
                  message: "Failed to save chat app",
                  cause: e,
                })
            )
          ),
        deleteChatApp: (id: string) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const initialLength = currentConfig.chatapps.length;
            currentConfig.chatapps = currentConfig.chatapps.filter(
              (app) => app.id !== id
            );

            if (currentConfig.chatapps.length === initialLength) {
              return yield* Effect.fail(
                new ChatAppEditorError({
                  message: `Chat App with ID ${id} not found for deletion.`,
                })
              );
            }

            yield* configService.saveConfig(currentConfig);
            if ((yield* Ref.get(currentChatAppRef))?.id === id) {
              yield* Ref.set(currentChatAppRef, null);
            }
          }).pipe(
            Effect.mapError((e) =>
              e instanceof ChatAppEditorError
                ? e
                : new ChatAppEditorError({
                    message: "Failed to delete chat app",
                    cause: e,
                  })
            )
          ),
      };
    }),
    dependencies: [ConfigService],
  }
) {}

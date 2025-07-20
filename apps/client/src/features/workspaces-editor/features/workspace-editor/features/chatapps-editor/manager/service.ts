import { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { ConfigService } from "@/services/config/service"; // Import ConfigService
import { Effect, Ref } from "effect";
import { v4 as uuidv4 } from "uuid";
import { ChatAppsEditorError, ChatAppsEditorManagerApi } from "./api";

export class ChatAppsEditorManager extends Effect.Service<ChatAppsEditorManagerApi>()(
  "ChatAppsEditorManager",
  {
    effect: Effect.gen(function* () {
      const chatAppsRef = yield* Ref.make<ChatAppConfig[]>([]);
      const configService = yield* ConfigService; // Get ConfigService instance

      return {
        getAllChatApps: Effect.gen(function* () {
          const currentConfig = yield* configService.getConfig();
          yield* Ref.set(chatAppsRef, currentConfig.chatapps); // Sync local ref
          return currentConfig.chatapps;
        }).pipe(
          Effect.mapError(
            () =>
              new ChatAppsEditorError({
                message: "Failed to get all chat applications from config.",
              })
          )
        ),
        addChatApp: (chatApp) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const newChatApp: ChatAppConfig = {
              ...chatApp,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            currentConfig.chatapps.push(newChatApp);
            yield* configService.saveConfig(currentConfig);
            yield* Ref.update(chatAppsRef, (apps) => [...apps, newChatApp]); // Update local ref
            return newChatApp;
          }).pipe(
            Effect.mapError(
              () =>
                new ChatAppsEditorError({
                  message: "Failed to add chat application to config.",
                })
            )
          ),
        updateChatApp: (updatedChatApp) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const originalLength = currentConfig.chatapps.length;
            currentConfig.chatapps = currentConfig.chatapps.map((app) =>
              app.id === updatedChatApp.id
                ? { ...updatedChatApp, updatedAt: new Date().toISOString() }
                : app
            );

            if (currentConfig.chatapps.length === originalLength) {
              // If length is the same, but no app was updated, it means ID not found
              return yield* Effect.fail(
                new ChatAppsEditorError({
                  message: `Chat App with ID ${updatedChatApp.id} not found for update.`,
                })
              );
            }

            yield* configService.saveConfig(currentConfig);
            yield* Ref.update(chatAppsRef, (apps) =>
              apps.map((app) =>
                app.id === updatedChatApp.id
                  ? { ...updatedChatApp, updatedAt: new Date().toISOString() }
                  : app
              )
            ); // Update local ref
            return { ...updatedChatApp, updatedAt: new Date().toISOString() };
          }).pipe(
            Effect.mapError(
              () =>
                new ChatAppsEditorError({
                  message: "Failed to update chat application in config.",
                })
            )
          ),
        deleteChatApp: (id) =>
          Effect.gen(function* () {
            const currentConfig = yield* configService.getConfig();
            const initialLength = currentConfig.chatapps.length;
            currentConfig.chatapps = currentConfig.chatapps.filter(
              (app) => app.id !== id
            );

            if (currentConfig.chatapps.length === initialLength) {
              return yield* Effect.fail(
                new ChatAppsEditorError({
                  message: `Chat App with ID ${id} not found for deletion.`,
                })
              );
            }

            yield* configService.saveConfig(currentConfig);
            yield* Ref.update(chatAppsRef, (apps) =>
              apps.filter((app) => app.id !== id)
            ); // Update local ref
          }).pipe(
            Effect.mapError(
              () =>
                new ChatAppsEditorError({
                  message: "Failed to delete chat application from config.",
                })
            )
          ),
      };
    }),
    dependencies: [ConfigService],
  }
) {}

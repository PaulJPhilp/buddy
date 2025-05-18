import { Effect, Ref } from "effect";
import type { ChatMessage, ChatServiceApi } from "./api";
import {
    FileOperationError,
    MessageAddError,
    MessageRetrievalError
} from "./errors";

/**
 * Implementation of the ChatService using the Effect.Service pattern.
 */
export class ChatService extends Effect.Service<ChatServiceApi>()("ChatService", {
    effect: Effect.gen(function* () {
        // Initialize state with Refs
        const messagesRef = yield* Ref.make<ChatMessage[]>([
            {
                id: "welcome-msg",
                text: "Hello! How can I help you today?",
                isUser: false,
                timestamp: new Date(),
            },
        ]);
        const filesRef = yield* Ref.make<File[]>([]);

        // Return the service implementation
        return {
            addMessage: (text: string, isUser: boolean) =>
                Effect.try({
                    try: () =>
                        Effect.gen(function* () {
                            const messages = yield* Ref.get(messagesRef);
                            const newMessage: ChatMessage = {
                                id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                                text,
                                isUser,
                                timestamp: new Date(),
                            };
                            yield* Ref.set(messagesRef, [...messages, newMessage]);
                        }),
                    catch: (error) => new MessageAddError("Failed to add message", error),
                }),

            getMessages: () =>
                Effect.try({
                    try: () => Ref.get(messagesRef),
                    catch: (error) =>
                        new MessageRetrievalError("Failed to get messages", error),
                }),

            addFile: (file: File) =>
                Effect.try({
                    try: () =>
                        Effect.gen(function* () {
                            const files = yield* Ref.get(filesRef);
                            yield* Ref.set(filesRef, [...files, file]);
                        }),
                    catch: (error) =>
                        new FileOperationError("Failed to add file", "addFile", error),
                }),

            removeFile: (file: File) =>
                Effect.try({
                    try: () =>
                        Effect.gen(function* () {
                            const files = yield* Ref.get(filesRef);
                            const updatedFiles = files.filter((f) => f !== file);
                            yield* Ref.set(filesRef, updatedFiles);
                        }),
                    catch: (error) =>
                        new FileOperationError(
                            "Failed to remove file",
                            "removeFile",
                            error,
                        ),
                }),

            getFiles: () =>
                Effect.try({
                    try: () => Ref.get(filesRef),
                    catch: (error) =>
                        new FileOperationError("Failed to get files", "getFiles", error),
                }),
        };
    }),
    dependencies: [], // No dependencies for this service
}) { }

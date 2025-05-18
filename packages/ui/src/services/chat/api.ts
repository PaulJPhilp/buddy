import { Effect } from "effect";
import { ChatServiceError } from "./errors";

/**
 * Defines the chat message data structure
 */
export interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

/**
 * Defines the ChatService API
 * 
 * Service for managing chat messages and file attachments.
 *
 * @example
 * ```typescript
 * const result = yield* ChatService.addMessage("Hello", true)
 * ```
 */
export interface ChatServiceApi {
    /**
     * Add a new message to the chat
     * 
     * @param text - The message text
     * @param isUser - Whether the message is from the user (true) or assistant (false)
     * @returns Effect with void result
     */
    readonly addMessage: (text: string, isUser: boolean) => Effect.Effect<void, ChatServiceError>;

    /**
     * Get all messages in the chat
     * 
     * @returns Effect with array of chat messages
     */
    readonly getMessages: () => Effect.Effect<ReadonlyArray<ChatMessage>, ChatServiceError>;

    /**
     * Add a file attachment to the chat
     * 
     * @param file - The file to attach
     * @returns Effect with void result
     */
    readonly addFile: (file: File) => Effect.Effect<void, ChatServiceError>;

    /**
     * Remove a file attachment from the chat
     * 
     * @param file - The file to remove
     * @returns Effect with void result
     */
    readonly removeFile: (file: File) => Effect.Effect<void, ChatServiceError>;

    /**
     * Get all file attachments in the chat
     * 
     * @returns Effect with array of files
     */
    readonly getFiles: () => Effect.Effect<ReadonlyArray<File>, ChatServiceError>;
}

import { Data } from "effect";

/**
 * Base error for ChatService operations
 */
export class ChatServiceError extends Data.TaggedError("ChatServiceError")<{
    readonly message: string;
    readonly method: string;
    readonly cause?: unknown;
}> { }

/**
 * Error thrown when adding a message fails
 */
export class MessageAddError extends ChatServiceError {
    constructor(message: string, cause?: unknown) {
        super({ message, method: "addMessage", cause });
    }
}

/**
 * Error thrown when retrieving messages fails
 */
export class MessageRetrievalError extends ChatServiceError {
    constructor(message: string, cause?: unknown) {
        super({ message, method: "getMessages", cause });
    }
}
/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends ChatServiceError {
    constructor(message: string, method: string, cause?: unknown) {
        super({ message, method, cause });
    }
}
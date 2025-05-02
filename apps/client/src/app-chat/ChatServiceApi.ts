import type { Effect } from "effect"

export const MAX_MESSAGE_LENGTH = 2000
export const MIN_MESSAGE_LENGTH = 1
export const MAX_MESSAGES_PER_CHAT = 1000
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES_PER_MESSAGE = 10

export interface MessageValidation {
    readonly isValid: boolean
    readonly errors: string[]
}

export interface FileAttachment {
    readonly id: string
    readonly name: string
    readonly size: number
    readonly type: string
    readonly url?: string
}

// Message represents a single chat message
export interface MessageApi {
    readonly id: string
    readonly text: string
    readonly sender: "user" | "assistant"
    readonly timestamp: number
    readonly status?: "sent" | "delivered" | "read"
    readonly attachments?: FileAttachment[]
    readonly metadata?: {
        readonly length: number
        readonly validation?: MessageValidation
        readonly hasAttachments?: boolean
    }
}

export interface ChatHistoryPage {
    readonly messages: MessageApi[]
    readonly hasMore: boolean
    readonly nextCursor?: string
}

export interface ChatState {
    readonly id: string
    readonly messages: MessageApi[]
    readonly isTyping: boolean
    readonly metadata?: {
        readonly messageCount: number
        readonly lastMessageAt?: number
        readonly totalAttachments?: number
    }
}

// ChatService API represents the operations available on the chat
export interface ChatStateApi {
    readonly getState: () => Effect.Effect<ChatState>
    readonly setState: (state: ChatState) => Effect.Effect<ChatState>
    readonly sendMessage: (text: string, attachments?: File[]) => Effect.Effect<MessageApi>
    readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatState>
    readonly validateMessage: (text: string) => Effect.Effect<MessageValidation>
    readonly getHistory: (cursor?: string, limit?: number) => Effect.Effect<ChatHistoryPage>
    readonly clearHistory: () => Effect.Effect<void>
}

export interface ChatServiceApi {
    readonly getState: () => Effect.Effect<ChatStateApi, Error>
    readonly setState: (state: ChatStateApi) => Effect.Effect<ChatStateApi, Error>
    readonly sendMessage: (text: string, attachments?: File[]) => Effect.Effect<MessageApi, Error>
    readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatStateApi, Error>
    readonly validateMessage: (text: string) => Effect.Effect<MessageValidation, Error>
    readonly getHistory: (cursor?: string, limit?: number) => Effect.Effect<ChatHistoryPage, Error>
    readonly clearHistory: () => Effect.Effect<void, Error>
}
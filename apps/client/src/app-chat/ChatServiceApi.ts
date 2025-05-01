import type { Effect } from "effect"

export const MAX_MESSAGE_LENGTH = 2000
export const MIN_MESSAGE_LENGTH = 1
export const MAX_MESSAGES_PER_CHAT = 1000

export interface MessageValidation {
    readonly isValid: boolean
    readonly errors: string[]
}

// Message represents a single chat message
export interface MessageApi {
    readonly id: string
    readonly text: string
    readonly sender: "user" | "assistant"
    readonly timestamp: number
    readonly status?: "sent" | "delivered" | "read"
    readonly metadata?: {
        readonly length: number
        readonly validation?: MessageValidation
    }
}

export interface ChatHistoryPage {
    readonly messages: MessageApi[]
    readonly hasMore: boolean
    readonly nextCursor?: string
}

// ChatState represents the current state of the chat
export interface ChatStateApi {
    readonly id: string
    readonly messages: MessageApi[]
    readonly isTyping: boolean
    readonly metadata?: {
        readonly messageCount: number
        readonly lastMessageAt?: number
    }
}

export interface ChatServiceApi {
    readonly getState: () => Effect.Effect<ChatStateApi, Error>
    readonly setState: (state: ChatStateApi) => Effect.Effect<ChatStateApi, Error>
    readonly sendMessage: (text: string) => Effect.Effect<MessageApi, Error>
    readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatStateApi, Error>
    readonly validateMessage: (text: string) => Effect.Effect<MessageValidation, Error>
    readonly getHistory: (cursor?: string, limit?: number) => Effect.Effect<ChatHistoryPage, Error>
    readonly clearHistory: () => Effect.Effect<void, Error>
}
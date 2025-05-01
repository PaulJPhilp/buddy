import { Effect } from "effect"

// Message represents a single chat message
export interface MessageApi {
    id: string
    text: string
    sender: "user" | "assistant"
    timestamp: number
}

// ChatState represents the current state of the chat
export interface ChatStateApi {
    id: string
    messages: MessageApi[]
    isTyping: boolean
}

export interface ChatServiceApi {
    readonly getState: () => Effect.Effect<ChatStateApi, Error, never>;
    readonly setState: (
        state: ChatStateApi,
    ) => Effect.Effect<ChatStateApi, Error, never>;
    readonly sendMessage: (text: string) => Effect.Effect<MessageApi, Error, never>;
    readonly setTyping: (
        isTyping: boolean,
    ) => Effect.Effect<ChatStateApi, Error, never>;
}
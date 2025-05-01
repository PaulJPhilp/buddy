import { Effect } from "effect"

export interface Message {
    id: string
    text: string
    sender: "user" | "assistant"
    timestamp: number
}

export interface ChatState {
    id: string
    messages: Message[]
    isTyping: boolean
}

export interface ChatServiceApi {
    readonly getState: () => Effect.Effect<ChatState, Error, never>
    readonly setState: (state: ChatState) => Effect.Effect<ChatState, Error, never>
    readonly sendMessage: (text: string) => Effect.Effect<Message, Error, never>
    readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatState, Error, never>
}

export const ChatServiceApi = Effect.Service<ChatServiceApi>() 
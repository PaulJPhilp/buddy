import { Effect } from "effect"
import { ChatService } from "./ChatService"
import { ChatState, Message } from "./ChatServiceApi"

export class MockChatService extends ChatService {
    readonly effect = Effect.gen(function* () {
        let state: ChatState = {
            id: "mock-1",
            messages: [],
            isTyping: false
        }

        return {
            getState: Effect.succeed(state),

            setState: (newState: ChatState) =>
                Effect.sync(() => {
                    state = newState
                    return state
                }),

            sendMessage: (text: string) =>
                Effect.sync(() => {
                    const message: Message = {
                        id: `mock-msg-${Date.now()}`,
                        text,
                        sender: "user",
                        timestamp: Date.now()
                    }
                    state = {
                        ...state,
                        messages: [...state.messages, message]
                    }
                    return message
                }),

            setTyping: (isTyping: boolean) =>
                Effect.sync(() => {
                    state = {
                        ...state,
                        isTyping
                    }
                    return state
                })
        }
    })
}

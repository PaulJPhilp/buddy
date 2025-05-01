import { Effect } from "effect"
import { ChatService } from "./ChatService"

// Helper to log chat state changes
const logChatState = (message: string) =>
    Effect.tap((state: any) =>
        Effect.log(`${message}: ${JSON.stringify(state, null, 2)}`)
            .pipe(Effect.annotateLogs({ app: "ChatApp" }))
    )

// Main chat app program
const program = Effect.gen(function* () {
    const service = yield* ChatService

    // Initialize chat state
    const initialState = {
        id: `chat-${Date.now()}`,
        messages: [],
        isTyping: false
    }
    yield* service.setState(initialState)
        .pipe(logChatState("Chat initialized"))

    // Example: Send a test message
    yield* service.sendMessage("Hello from ChatApp!")
        .pipe(logChatState("Message sent"))

    // Get updated state
    const state = yield* service.getState()
    yield* Effect.log(`Current chat state: ${JSON.stringify(state, null, 2)}`)
        .pipe(Effect.annotateLogs({ app: "ChatApp" }))
})

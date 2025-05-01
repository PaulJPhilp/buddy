import { chatAppEffect } from "@/app-chat/ChatApp"
import { ChatService, make } from "@/app-chat/ChatService"
import { Effect } from "effect"

// Supervisor Effect that manages all child Effects
export const appSupervisorEffect = Effect.gen(function* () {
    // Start chat apps
    yield* Effect.logDebug("Starting chat apps")

    // Create chat instances with their own services
    const chat1 = chatAppEffect.pipe(
        Effect.provideService(ChatService, make("chat-1"))
    )

    const chat2 = chatAppEffect.pipe(
        Effect.provideService(ChatService, make("chat-2"))
    )

    // Fork chat apps
    yield* Effect.forkDaemon(chat1)
    yield* Effect.forkDaemon(chat2)

    // Keep supervisor alive
    return Effect.never
}).pipe(
    Effect.interruptible,
    Effect.annotateLogs({ supervisor: "AppSupervisor" })
) 
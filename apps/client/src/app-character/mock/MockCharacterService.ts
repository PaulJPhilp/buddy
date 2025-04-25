import { Effect, Queue, Stream } from "effect"
import { nanoid } from "nanoid"
import { Character, CharacterCommand, CharacterEvent, CharacterService, ChatMessage } from "../types"
import { mockCharacters } from "./mockCharacters"

export class MockCharacterService implements CharacterService {
    private character: Character
    private history: ChatMessage[] = []
    private eventQueue: Queue.Queue<CharacterEvent>

    constructor(initialCharacter: Character = mockCharacters.buddy) {
        this.character = initialCharacter
    }

    static create(character: Character): Effect.Effect<never, never, MockCharacterService> {
        return Effect.gen(function* (_) {
            const service = new MockCharacterService(character)
            service.eventQueue = yield* _(Queue.unbounded<CharacterEvent>())
            return service
        })
    }

    sendCommand(command: CharacterCommand): Effect.Effect<never, Error, void> {
        return Effect.gen(function* (_) {
            switch (command.type) {
                case "SEND_MESSAGE": {
                    // Create user message
                    const userMessage: ChatMessage = {
                        id: nanoid(),
                        content: command.content,
                        timestamp: new Date(),
                        role: "user",
                        appId: "mock-app",
                        characterId: this.character.id
                    }
                    this.history.push(userMessage)

                    // Emit received event
                    yield* _(Queue.offer(this.eventQueue, {
                        type: "MESSAGE_RECEIVED",
                        message: userMessage
                    }))

                    // Simulate thinking
                    yield* _(Queue.offer(this.eventQueue, { type: "THINKING_STARTED" }))
                    yield* _(Effect.sleep("1 seconds"))

                    // Simulate response
                    const responseId = nanoid()
                    yield* _(Queue.offer(this.eventQueue, {
                        type: "RESPONSE_STARTED",
                        messageId: responseId
                    }))

                    // Mock response content
                    const response = `This is a mock response from ${this.character.name} to: "${command.content}"`
                    yield* _(Queue.offer(this.eventQueue, {
                        type: "RESPONSE_CHUNK",
                        messageId: responseId,
                        content: response
                    }))

                    // Complete response
                    const assistantMessage: ChatMessage = {
                        id: responseId,
                        content: response,
                        timestamp: new Date(),
                        role: "assistant",
                        appId: "mock-app",
                        characterId: this.character.id
                    }
                    this.history.push(assistantMessage)

                    yield* _(Queue.offer(this.eventQueue, {
                        type: "RESPONSE_COMPLETED",
                        messageId: responseId
                    }))
                    break
                }
                // Handle other commands...
            }
        })
    }

    getCharacterInfo(): Effect.Effect<never, Error, Character> {
        return Effect.succeed(this.character)
    }

    getChatHistory(): Effect.Effect<never, Error, ChatMessage[]> {
        return Effect.succeed(this.history)
    }

    get events(): Effect.Effect<never, never, CharacterEvent> {
        return Stream.fromQueue(this.eventQueue)
    }

    initialize(): Effect.Effect<never, Error, void> {
        return Effect.unit
    }

    cleanup(): Effect.Effect<never, Error, void> {
        return Effect.unit
    }

    // Return the current character
    getCharacter(): Effect.Effect<never, never, Character> {
        return Effect.succeed(this.character)
    }

    // Update character status
    updateStatus(status: Character["status"]): Effect.Effect<never, never, Character> {
        this.character = {
            ...this.character,
            status
        }
        return Effect.succeed(this.character)
    }

    // Update character capabilities
    updateCapabilities(capabilities: Character["capabilities"]): Effect.Effect<never, never, Character> {
        this.character = {
            ...this.character,
            capabilities
        }
        return Effect.succeed(this.character)
    }
} 
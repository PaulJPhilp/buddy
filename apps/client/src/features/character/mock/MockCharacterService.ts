import { Effect, Queue, Stream } from "effect";
import { nanoid } from "nanoid";
import {
  Character,
  CharacterCommand,
  CharacterEvent,
  CharacterService,
  ChatMessage,
} from "../types";
import { mockCharacters } from "./mockCharacters";

export class MockCharacterService implements CharacterService {
  private character: Character;
  private history: ChatMessage[] = [];
  private eventQueue!: Queue.Queue<CharacterEvent>;

  constructor(initialCharacter: Character = mockCharacters.buddy) {
    this.character = initialCharacter;
  }

  static create(
    character: Character,
  ): Effect.Effect<MockCharacterService, never, never> {
    return Queue.unbounded<CharacterEvent>().pipe(
      Effect.flatMap((eventQueue) => {
        const service = new MockCharacterService(character);
        service.eventQueue = eventQueue;
        return Effect.succeed(service);
      })
    );
  }

  sendCommand(command: CharacterCommand): Effect.Effect<void, Error, never> {
    const self = this;
    return Effect.gen(function* () {
      switch (command.type) {
        case "SEND_MESSAGE": {
          // Create user message
          const userMessage: ChatMessage = {
            id: nanoid(),
            content: command.content,
            timestamp: new Date(),
            role: "user",
            appId: "mock-app",
            characterId: self.character.id,
          };
          self.history.push(userMessage);

          // Emit received event
          yield* Queue.offer(self.eventQueue, {
            type: "MESSAGE_RECEIVED",
            message: userMessage,
          });

          // Simulate thinking
          yield* Queue.offer(self.eventQueue, { type: "THINKING_STARTED" });
          yield* Effect.sleep("1 seconds");

          // Simulate response
          const responseId = nanoid();
          yield* Queue.offer(self.eventQueue, {
            type: "RESPONSE_STARTED",
            messageId: responseId,
          });

          // Mock response content
          const response = `This is a mock response from ${self.character.name} to: "${command.content}"`;
          yield* Queue.offer(self.eventQueue, {
            type: "RESPONSE_CHUNK",
            messageId: responseId,
            content: response,
          });

          // Complete response
          const assistantMessage: ChatMessage = {
            id: responseId,
            content: response,
            timestamp: new Date(),
            role: "assistant",
            appId: "mock-app",
            characterId: self.character.id,
          };
          self.history.push(assistantMessage);

          yield* Queue.offer(self.eventQueue, {
            type: "RESPONSE_COMPLETED",
            messageId: responseId,
          });
          break;
        }
      }
    });
  }

  getCharacter(id: string): Effect.Effect<Character, Error, never> {
    return Effect.succeed(this.character).pipe(
      Effect.map((char) => char as Character),
      Effect.mapError(() => new Error("Failed to get character info"))
    );
  }

  getChatHistory(): Effect.Effect<ChatMessage[], Error, never> {
    return Effect.succeed(this.history).pipe(
      Effect.map((hist) => hist as ChatMessage[]),
      Effect.mapError(() => new Error("Failed to get chat history"))
    );
  }

  get events(): Effect.Effect<CharacterEvent, never, never> {
    return Stream.fromQueue(this.eventQueue).pipe(
      Stream.take(1),
      Stream.map((event) => event),
      Stream.runHead,
      Effect.flatMap((option) => 
        option._tag === "Some" 
          ? Effect.succeed(option.value)
          : Effect.never
      )
    );
  }

  initialize(): Effect.Effect<void, Error, never> {
    return Effect.succeed(void 0).pipe(
      Effect.map(() => void 0 as void),
      Effect.mapError(() => new Error("Failed to initialize"))
    );
  }

  cleanup(): Effect.Effect<void, Error, never> {
    return Effect.succeed(void 0).pipe(
      Effect.mapError(() => new Error("Failed to cleanup"))
    );
  }

  // Update character status
  updateStatus(
    id: string,
    status: Partial<Character["status"]>,
  ): Effect.Effect<Character, Error, never> {
    this.character = {
      ...this.character,
      status: { ...this.character.status, ...status },
    };
    return Effect.succeed(this.character);
  }

  // Update character capabilities
  updateCapabilities(
    id: string,
    capabilities: Partial<Character["capabilities"]>,
  ): Effect.Effect<Character, Error, never> {
    this.character = {
      ...this.character,
      capabilities: { ...this.character.capabilities, ...capabilities },
    };
    return Effect.succeed(this.character);
  }
}

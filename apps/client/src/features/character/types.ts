import { Effect } from "effect";

/**
 * Represents a Character's core data and state
 */
export interface Character {
  id: string;
  name: string;
  description: string;
  status: {
    mood: number; // 0-100
    energy: number; // 0-100
    health: number; // 0-100
  };
  capabilities: {
    canSpeak: boolean;
    canMove: boolean;
    canLearn: boolean;
  };
}

/**
 * Commands that can be sent to a Character
 */
export type CharacterCommand =
  | { type: "SEND_MESSAGE"; content: string }
  | { type: "REQUEST_CLARIFICATION"; messageId: string }
  | { type: "CANCEL_RESPONSE" };

/**
 * Events that a Character can emit
 */
export type CharacterEvent =
  | { type: "MESSAGE_RECEIVED"; message: ChatMessage }
  | { type: "THINKING_STARTED" }
  | { type: "RESPONSE_STARTED"; messageId: string }
  | { type: "RESPONSE_CHUNK"; messageId: string; content: string }
  | { type: "RESPONSE_COMPLETED"; messageId: string }
  | { type: "ERROR_OCCURRED"; error: string };

/**
 * Represents a message in the chat history
 */
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: "user" | "assistant";
  appId: string;
  characterId: string;
}

/**
 * The Character Service interface
 */
export interface CharacterService {
  // Core operations
  sendCommand(command: CharacterCommand): Effect.Effect<void, Error, never>;
  getCharacter(id: string): Effect.Effect<Character, Error, never>;
  updateStatus(
    id: string,
    status: Partial<Character["status"]>,
  ): Effect.Effect<Character, Error, never>;
  updateCapabilities(
    id: string,
    capabilities: Partial<Character["capabilities"]>,
  ): Effect.Effect<Character, Error, never>;

  // Chat operations
  getChatHistory(): Effect.Effect<ChatMessage[], Error, never>;
  events: Effect.Effect<CharacterEvent, never, never>;

  // Lifecycle
  initialize(): Effect.Effect<void, Error, never>;
  cleanup(): Effect.Effect<void, Error, never>;
}

/**
 * Tag for the Character Service
 */
export const CharacterService = {
  Tag: Symbol.for("@buddy/character-service"),
} as const;

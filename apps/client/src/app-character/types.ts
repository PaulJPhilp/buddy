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
  sendCommand(command: CharacterCommand): Effect.Effect<never, Error, void>;
  getCharacter(id: string): Effect.Effect<never, Error, Character>;
  updateStatus(
    id: string,
    status: Partial<Character["status"]>,
  ): Effect.Effect<never, Error, Character>;
  updateCapabilities(
    id: string,
    capabilities: Partial<Character["capabilities"]>,
  ): Effect.Effect<never, Error, Character>;

  // Chat operations
  getChatHistory(): Effect.Effect<never, Error, ChatMessage[]>;
  events: Effect.Effect<never, never, CharacterEvent>;

  // Lifecycle
  initialize(): Effect.Effect<never, Error, void>;
  cleanup(): Effect.Effect<never, Error, void>;
}

/**
 * Tag for the Character Service
 */
export const CharacterService = {
  Tag: Symbol.for("@buddy/character-service"),
} as const;

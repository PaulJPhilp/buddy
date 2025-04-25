import { Effect } from "effect"
import { Character } from "../types"
import { MockCharacterService } from "./MockCharacterService"
import { mockCharacters } from "./mockCharacters"

export function createMockCharacterService(
    character: Character = mockCharacters.buddy
): Effect.Effect<never, never, MockCharacterService> {
    return Effect.succeed(new MockCharacterService(character))
}

// Helper to create a service with a specific character
export const withCharacter = (characterId: keyof typeof mockCharacters) =>
    createMockCharacterService(mockCharacters[characterId]) 
import { Effect } from "effect"
import { Character } from "./CharacterServiceApi"

// In-memory state for the mock implementation
let currentCharacter: Character = {
    id: "buddy-1",
    name: "Buddy",
    description: "A friendly AI companion",
    status: {
        mood: 75,
        energy: 100,
        health: 90
    },
    capabilities: {
        intelligence: 85,
        creativity: 80,
        charisma: 90
    }
}

// Service method implementations
const getCharacter = () =>
    Effect.succeed(currentCharacter)

const setCharacter = (character: Character) => {
    currentCharacter = character
    return Effect.succeed(currentCharacter)
}

const updateStatus = (status: Character["status"]) => {
    currentCharacter = {
        ...currentCharacter,
        status: {
            ...currentCharacter.status,
            ...status
        }
    }
    return Effect.succeed(currentCharacter)
}

const updateCapabilities = (capabilities: Character["capabilities"]) => {
    currentCharacter = {
        ...currentCharacter,
        capabilities: {
            ...currentCharacter.capabilities,
            ...capabilities
        }
    }
    return Effect.succeed(currentCharacter)
} 
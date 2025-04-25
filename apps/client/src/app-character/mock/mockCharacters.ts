import { Character } from "../types"

export const mockCharacters = {
    buddy: {
        id: "buddy-1",
        name: "Buddy",
        description: "Your friendly AI companion",
        status: {
            mood: 75,
            energy: 80,
            health: 90
        },
        capabilities: {
            canSpeak: true,
            canMove: true,
            canLearn: true
        }
    } satisfies Character
} as const satisfies Record<string, Character> 
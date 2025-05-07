import { Effect } from "effect";
import { Character, CharacterServiceApi } from "./CharacterServiceApi";

// Initial mock character state
let currentCharacter: Character = {
  id: "buddy-1",
  name: "Buddy",
  description: "A friendly AI companion",
  status: {
    mood: 75,
    energy: 100,
    health: 90,
  },
  capabilities: {
    intelligence: 85,
    creativity: 80,
    charisma: 90,
  },
};

// Mock implementation
export const MockCharacterService: CharacterServiceApi = {
  getCharacter: () => Effect.succeed(currentCharacter),

  setCharacter: (character) => {
    currentCharacter = character;
    return Effect.succeed(currentCharacter);
  },

  updateStatus: (status) => {
    currentCharacter = {
      ...currentCharacter,
      status: {
        ...currentCharacter.status,
        ...status,
      },
    };
    return Effect.succeed(currentCharacter);
  },

  updateCapabilities: (capabilities) => {
    currentCharacter = {
      ...currentCharacter,
      capabilities: {
        ...currentCharacter.capabilities,
        ...capabilities,
      },
    };
    return Effect.succeed(currentCharacter);
  },
};

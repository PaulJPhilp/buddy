import { Effect, Ref } from "effect";

/**
 * Character data model
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
    intelligence: number;
    creativity: number;
    charisma: number;
  };
}

/**
 * Character Service API interface
 */
export interface CharacterServiceApi {
  readonly getCharacter: () => Effect.Effect<Character, Error, never>;
  readonly setCharacter: (
    character: Character,
  ) => Effect.Effect<Character, Error, never>;
  readonly updateStatus: (
    status: Character["status"],
  ) => Effect.Effect<Character, Error, never>;
  readonly updateCapabilities: (
    capabilities: Character["capabilities"],
  ) => Effect.Effect<Character, Error, never>;
}

/**
 * Character Service definition using Effect.Service
 */
export class CharacterService extends Effect.Service<CharacterServiceApi>()(
  "CharacterService",
  {
    effect: Effect.gen(function* () {
      let characterRef: Ref.Ref<Character>;

      const getCharacter = () =>
        Effect.gen(function* () {
          if (!characterRef) {
            return Effect.fail(
              new Error("Character reference not initialized"),
            );
          }
          const character = yield* characterRef.get;
          return character;
        });

      const setCharacter = (character: Character) =>
        Effect.gen(function* () {
          if (!characterRef)
            characterRef = yield* Ref.make<Character>(character);
          yield* characterRef.modify(() => [character, character]);
        });

      const updateStatus = (status: Character["status"]) =>
        Effect.gen(function* () {
          const character = yield* characterRef.get;
          characterRef.modify((character) => [
            character,
            { ...character, status },
          ]);
        });

      const updateCapabilities = (capabilities: Character["capabilities"]) =>
        Effect.gen(function* () {
          const character = yield* characterRef.get;
          characterRef.modify((character) => [
            character,
            { ...character, capabilities },
          ]);
        });

      return { getCharacter, setCharacter, updateStatus, updateCapabilities };
    }),
  },
) {}

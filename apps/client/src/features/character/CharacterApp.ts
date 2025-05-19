import { Chunk, Duration, Effect, Schedule } from "effect";
import { Character, CharacterService } from "./CharacterServiceApi";
import { MockCharacterService } from "./MockCharacterService";

// Initial character state
const initialCharacter = {
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

const characterSchedule = (
  schedule: Schedule.Schedule<unknown>,
  delay: Duration.DurationInput = 0,
): void => {
  const maxRecurs = 1;
  const delays = Chunk.toArray(
    Effect.runSync(
      Schedule.run(
        Schedule.delays(Schedule.addDelay(schedule, () => delay)),
        Date.now(),
        Chunk.range(0, maxRecurs),
      ),
    ),
  );
  delays.forEach((duration, i) => {
    const updateEffect = Effect.gen(function* () {
      const service = yield* CharacterService;

      // Initialize character if needed
      yield* service.setCharacter(initialCharacter);

      const character: Character = yield* service.getCharacter();

      // Randomly adjust mood between -5 and +5
      const moodDelta = Math.floor(Math.random() * 11) - 5;
      const newMood = Math.max(
        0,
        Math.min(100, character.status.mood + moodDelta),
      );

      yield* service.updateStatus({
        mood: newMood,
        energy: character.status.energy,
        health: character.status.health,
      });

      yield* Effect.log(`Character mood updated to: ${newMood}`).pipe(
        Effect.annotateLogs({ app: "CharacterApp" }),
      );
    }).pipe(
      Effect.provideService(CharacterService, MockCharacterService),
      Effect.map(() => void 0),
    );

    Effect.runSync<undefined, Error>(updateEffect);
  });
};

const schedule = Schedule.forever;

characterSchedule(schedule);

// Main character app program
export const characterAppEffect = Effect.gen(function* () {
  const service = yield* CharacterService;

  // Get initial character state
  const character = yield* service.getCharacter();
  yield* Effect.log(`Character ${character.name} initialized`).pipe(
    Effect.annotateLogs({ app: "CharacterApp" }),
  );

  // Keep the character app alive
  return Effect.never;
}).pipe(Effect.interruptible, Effect.annotateLogs({ app: "CharacterApp" }));

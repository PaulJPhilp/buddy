import { Effect, Schedule } from "effect";

// Define the logic for our simple Applet as an Effect program
export const simpleAppEffect = Effect.log("SimpleApp fiber reporting in!")
    .pipe(
        Effect.repeat(Schedule.spaced("7 seconds")) // Log every 7 seconds
    )
    .pipe(
        Effect.interruptible, // Make it interruptible
        Effect.annotateLogs({ app: "SimpleApp" }) // Add context to logs
    ) 
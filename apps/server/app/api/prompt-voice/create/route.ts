import { PromptVoice } from "@api/core/src/PromptVoiceSchema";
import { PromptVoiceGroupLive } from "@server/PromptVoice";
import { Effect, Schema, pipe } from "effect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const program = pipe(
    Effect.tryPromise(() => request.json()),
    Effect.flatMap((data) => Schema.decode(PromptVoice)(data as PromptVoice)),
    Effect.provide(PromptVoiceGroupLive),
    Effect.catchAll((error) =>
      Effect.succeed(NextResponse.json({ error }, { status: 400 })),
    ),
  );

  const result = await Effect.runPromise(program);
  return NextResponse.json(result);
}

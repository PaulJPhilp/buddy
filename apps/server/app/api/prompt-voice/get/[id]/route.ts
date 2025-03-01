import { PromptVoiceGroupLive } from "@server/PromptVoice";
import { Effect, pipe } from "effect";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const program = pipe(
    Effect.try(() => Number.parseInt(params.id)),
    Effect.provide(PromptVoiceGroupLive),
    Effect.catchAll((error) =>
      Effect.succeed(NextResponse.json({ error }, { status: 404 })),
    ),
  );

  const result = await Effect.runPromise(program);
  return NextResponse.json(result);
}

import { PromptCreate } from "@api/core/src/PromptSchema";
import { PromptGroupLive } from "@server/Prompt";
import { Effect, Schema, pipe } from "effect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const program = pipe(
    Effect.tryPromise(() => request.json()),
    Effect.flatMap((data) => Schema.decode(PromptCreate)(data as PromptCreate)),
    Effect.flatMap((prompt) =>
      Effect.provide(
        Effect.flatMap(Effect.succeed(prompt), (data) =>
          Schema.decode(PromptCreate)({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        ),
        PromptGroupLive,
      ),
    ),
    Effect.catchAll((error) =>
      Effect.succeed(NextResponse.json({ error }, { status: 400 })),
    ),
  );

  const result = await Effect.runPromise(program);
  return NextResponse.json(result);
}

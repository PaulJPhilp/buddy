import { UserGroupLive } from "@server/User";
import { Effect, pipe } from "effect";
import { NextResponse } from "next/server";

const x = UserGroupLive;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Parse the ID parameter
    const userId = Number.parseInt(params.id);

    // Create a specific program for this operation with the layer
    const program = Effect.succeed(userId).pipe(Effect.provide(UserGroupLive));

    // Run the effect and handle errors
    try {
      const result = await Effect.runPromise(program);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 404 });
  }
}

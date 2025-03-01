import { UserGroupLive } from "@server/User";
import { Effect } from "effect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the request data
    const data = await request.json();

    // Add timestamps
    const userData = {
      ...(data as Record<string, unknown>),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create a program with the user data
    const program = Effect.succeed(userData).pipe(
      Effect.provide(UserGroupLive)
    );

    // Run the program and handle errors
    try {
      const result = await Effect.runPromise(program);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error }, { status: 400 });
  }
}

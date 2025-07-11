import { AppComponent } from "@/components/app/service";
import { ConfigService } from "@/services/config/service";
import { Effect, Layer } from "effect";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const program = Effect.gen(function* () {
      const appComponent = yield* AppComponent;

      // Load config first
      yield* appComponent.loadConfig("/static/configs/workspaces/index.json");

      // Get workspaces
      const workspaces = yield* appComponent.getWorkspaces();
      const currentWorkspace = yield* appComponent.getCurrentWorkspace();

      return {
        workspaces,
        currentWorkspace,
        count: workspaces.length,
        firstWorkspace: workspaces[0] || null,
      };
    });

    const serviceLayer = Layer.merge(
      ConfigService.Default,
      AppComponent.Default
    );
    const result = await Effect.provide(program, serviceLayer).pipe(
      Effect.runPromise
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Debug workspaces error:", error);
    return NextResponse.json(
      { error: "Failed to load workspaces", details: String(error) },
      { status: 500 }
    );
  }
}

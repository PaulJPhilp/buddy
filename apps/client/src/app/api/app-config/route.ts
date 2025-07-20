import { AppConfigService } from "@buddy/config/services/app-config";
import {
  StorageOptionsService,
  StorageService,
} from "@buddy/config/services/storage";
import { Effect, Layer } from "effect";
import { NextRequest, NextResponse } from "next/server";

// Compose the full layer required for AppConfigService
// @ts-ignore - Effect 3.x strict typing
const AppConfigLive = Layer.mergeAll([
  AppConfigService.Default,
  StorageService.Default,
  StorageOptionsService.Default,
]);

export async function GET() {
  console.log("🔥 API: GET /api/app-config called");
  return NextResponse.json({
    message: "API route is working",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // @ts-ignore - Effect 3.x strict typing
  const program = Effect.gen(function* () {
    const service = yield* AppConfigService;
    return yield* service.updateAppConfig(body);
  });

  // @ts-ignore - Effect 3.x strict typing
  const updatedConfig = await Effect.runPromise(
    // @ts-ignore - Effect 3.x strict typing
    Effect.provide(program, AppConfigLive)
  );
  return NextResponse.json(updatedConfig);
}

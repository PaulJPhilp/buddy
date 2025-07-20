import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("API route called: /api/agent/generate");
  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { messages } = body;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = google("gemini-1.5-flash");

    const result = await streamText({
      model,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Agent generate error:", error);
    return new Response(JSON.stringify({ error: `Agent error: ${error}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

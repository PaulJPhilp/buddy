import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" },
        { status: 500 }
      );
    }

    const model = google("gemini-1.5-flash");

    const result = await generateText({
      model,
      messages,
    });

    return NextResponse.json({
      content: result.text || "No response generated",
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("Agent generate error:", error);
    return NextResponse.json(
      { error: `Agent error: ${error}` },
      { status: 500 }
    );
  }
}

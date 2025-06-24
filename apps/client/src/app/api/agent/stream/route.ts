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
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const model = google("gemini-1.5-flash", {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const result = await streamText({
      model,
      messages,
    });

    // Create a simple streaming response that sends chunks as JSON
    const encoder = new TextEncoder();
    let accumulatedText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            accumulatedText += chunk;

            const chunkData = {
              type: "chunk",
              content: chunk,
              accumulated: accumulatedText,
              timestamp: Date.now(),
            };

            // Send as JSON with newline delimiter
            const chunkText = `${JSON.stringify(chunkData)}\n`;
            controller.enqueue(encoder.encode(chunkText));
          }

          // Send final chunk
          const finalData = {
            type: "done",
            content: accumulatedText,
            usage: await result.usage,
            finishReason: await result.finishReason,
            timestamp: Date.now(),
          };

          const finalText = `${JSON.stringify(finalData)}\n`;
          controller.enqueue(encoder.encode(finalText));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = {
            type: "error",
            error: `Stream error: ${error}`,
            timestamp: Date.now(),
          };
          const errorText = `${JSON.stringify(errorData)}\n`;
          controller.enqueue(encoder.encode(errorText));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent stream error:", error);
    return new Response(
      JSON.stringify({ error: `Agent stream error: ${error}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, ".env") });

import { google } from "@ai-sdk/google";
import { streamText } from "ai";

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

  const model = google("gemini-2.0-flash");
  const prompt = `Tell me a detailed story about a robot and a cat who go on an adventure across the world, encountering many challenges and learning important lessons along the way. Please be as descriptive as possible and make the story at least 300 words.`;

  const { textStream } = await streamText({
    model,
    prompt,
  });

  let chunkCount = 0;
  let fullText = "";
  for await (const chunk of textStream) {
    chunkCount++;
    console.log(`[Minimal Script] Received chunk #${chunkCount}:`, chunk);
    fullText += chunk;
  }
  if (chunkCount === 0) {
    console.log(
      "[Minimal Script] No chunks received (streaming not supported or empty response).",
    );
  } else {
    console.log(
      `[Minimal Script] Streaming complete. Total chunks: ${chunkCount}`,
    );
    console.log(fullText);
  }
}

main().catch((err) => {
  console.error("[Minimal Script] Error:", err);
  process.exit(1);
});

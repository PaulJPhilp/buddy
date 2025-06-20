#!/usr/bin/env node

import * as http from "node:http";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { config } from "dotenv";
import { WebSocket, WebSocketServer } from "ws";

// Load environment variables
config();

const PORT = process.env.PORT || 8080;
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Simple logging (not complex like the original)
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : "");
};

// Check API key
if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  log("ERROR: Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

log("Starting LLM Agent Server...");

// SIMPLIFIED PROTOCOL
interface SimpleMessage {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

const createMessage = (type: string, content: string): SimpleMessage => ({
  id: Math.random().toString(36).substring(7),
  type,
  content,
  timestamp: Date.now(),
});

const parseMessage = (data: string): SimpleMessage | null => {
  try {
    const parsed = JSON.parse(data);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type &&
      parsed.content !== undefined
    ) {
      return parsed as SimpleMessage;
    }
    return null;
  } catch {
    return null;
  }
};

const sendMessage = (ws: WebSocket, type: string, content: string) => {
  if (ws.readyState === WebSocket.OPEN) {
    const message = createMessage(type, content);
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
};

// Conversation history storage
const conversationHistory = new WeakMap<
  WebSocket,
  Array<{ role: "user" | "assistant" | "system"; content: string }>
>();

// System prompt
const SYSTEM_PROMPT = `You are an intelligent assistant that responds using rich Markdown formatting.`;

// LLM function
async function callLLM(inputText: string, ws: WebSocket) {
  log(`Processing LLM request: ${inputText.substring(0, 100)}...`);

  // Get or create conversation history
  let history = conversationHistory.get(ws);
  if (!history) {
    history = [{ role: "system", content: SYSTEM_PROMPT }];
    conversationHistory.set(ws, history);
  }

  // Add user message
  history.push({ role: "user", content: inputText });

  // Send acknowledgment and thinking state
  sendMessage(ws, "PROCESSING", "Processing your message...");
  sendMessage(ws, "THINKING", "true");

  try {
    const stream = await streamText({
      model: google("gemini-1.5-flash"),
      messages: history,
    });

    let fullContent = "";
    let thinkingStateSent = false;

    for await (const delta of stream.textStream) {
      if (ws.readyState !== WebSocket.OPEN) break;

      fullContent += delta;

      // Turn off thinking state on first chunk
      if (!thinkingStateSent) {
        sendMessage(ws, "THINKING", "false");
        thinkingStateSent = true;
      }

      // Send stream chunk
      sendMessage(ws, "LLM_STREAM", delta);
    }

    // Send completion
    sendMessage(ws, "LLM_RESPONSE", fullContent);

    // Add to history
    history.push({ role: "assistant", content: fullContent });

    log(`LLM response completed: ${fullContent.length} characters`);
  } catch (error) {
    log(`LLM error: ${error}`);
    sendMessage(ws, "LLM_ERROR", "Failed to generate response");
    sendMessage(ws, "THINKING", "false");
  }
}

// Create server using WORKING ULTRA MINIMAL structure
const server = http.createServer();

const wss = new WebSocketServer({
  server,
  path: "/chat",
  perMessageDeflate: false,
  extensions: [],
});

// Connection tracking (simplified)
let connectionCounter = 0;
const connections = new Map();

wss.on("connection", (ws, req) => {
  connectionCounter++;
  const connId = connectionCounter;
  const connInfo = { id: connId, connectedAt: new Date() };
  connections.set(ws, connInfo);

  log(`Client ${connId} connected`);

  // Message handler
  ws.on("message", async (message) => {
    try {
      const messageString = message.toString();
      const parsedMessage = parseMessage(messageString);

      if (!parsedMessage) {
        sendMessage(ws, "ERROR", "Invalid message format");
        return;
      }

      // Handle user messages
      if (
        parsedMessage.type === "USER_MESSAGE" &&
        parsedMessage.content.trim()
      ) {
        await callLLM(parsedMessage.content, ws);
      } else {
        sendMessage(ws, "ACK", `Received ${parsedMessage.type} message`);
      }
    } catch (error) {
      log(`Message error: ${error}`);
      sendMessage(ws, "ERROR", "Failed to process message");
    }
  });

  ws.on("close", (code, reason) => {
    connections.delete(ws);
    conversationHistory.delete(ws);
    log(`Client ${connId} disconnected - Code: ${code}`);
  });

  ws.on("error", (error) => {
    log(`Client ${connId} error: ${error.message}`);
  });
});

server.listen(Number(PORT), () => {
  log(`Server started on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("Shutting down...");
  server.close(() => process.exit(0));
});

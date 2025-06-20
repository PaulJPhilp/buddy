import * as http from "node:http";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { config } from "dotenv";
import { WebSocket, WebSocketServer } from "ws";

// SIMPLIFIED PROTOCOL - No external imports to avoid RSV1 issues
interface SimpleMessage {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

const createSimpleMessage = (type: string, content: string): SimpleMessage => ({
  id: Math.random().toString(36).substring(7),
  type,
  content,
  timestamp: Date.now(),
});

const parseSimpleMessage = (data: string): SimpleMessage | null => {
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

// Load environment variables from .env file
config();

const PORT = process.env.PORT || 8083; // Changed from 8080 to debug RSV1 issue
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Enhanced logging with timestamps and connection tracking
const log = (level: string, category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${category}] ${message}`;

  if (level === "ERROR") {
    console.error(logMessage, data ? JSON.stringify(data, null, 2) : "");
  } else if (level === "WARN") {
    console.warn(logMessage, data ? JSON.stringify(data, null, 2) : "");
  } else {
    console.log(logMessage, data ? JSON.stringify(data, null, 2) : "");
  }
};

// Connection tracking
let connectionCounter = 0;
const connections = new Map<WebSocket, { id: number; connectedAt: Date }>();

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  log(
    "ERROR",
    "STARTUP",
    "Missing GOOGLE_GENERATIVE_AI_API_KEY in .env file. Please set it.",
  );
  process.exit(1);
}

log("INFO", "STARTUP", "Starting LLM Agent Server...");
log("INFO", "CONFIG", `Port: ${PORT}`);
log(
  "INFO",
  "CONFIG",
  `Google API Key: ${GOOGLE_GENERATIVE_AI_API_KEY ? "***configured***" : "MISSING"}`,
);

// Simple user message detection
const isUserMessage = (message: SimpleMessage): boolean => {
  return message.type === "USER_MESSAGE" || message.type === "user_message";
};

// Store conversation history per WebSocket connection
const conversationHistory = new WeakMap<
  WebSocket,
  Array<{ role: "user" | "assistant" | "system"; content: string }>
>();

// System prompt for rich MDX responses
const SYSTEM_PROMPT = `You are an intelligent assistant that responds using rich Markdown formatting. 

**FORMATTING GUIDELINES:**
- Use **bold** and *italic* text for emphasis
- Create ## Headers and ### Sub-headers to organize information
- Use \`inline code\` for technical terms and \`\`\`code blocks\`\`\` for multi-line code
- Create bulleted lists with - or numbered lists with 1. 2. 3.
- Use > blockquotes for important notes or quotes
- Add horizontal rules (---) to separate major sections
- Use tables when displaying structured data
- Include links [like this](https://example.com) when relevant

**CONTENT STYLE:**
- Be comprehensive and detailed in your responses
- Break down complex topics into clear sections
- Use examples and analogies to illustrate points
- Include practical tips and actionable advice
- Vary your formatting to make responses visually engaging

**EXAMPLES OF RICH FORMATTING:**
When discussing concepts, use headers and lists:
## Main Topic
### Key Points
- **Important point** with *emphasis*
- Another point with \`technical terms\`

> **Note:** Always prioritize clarity and readability

For code or technical content, use proper code blocks:
\`\`\`javascript
const example = "formatted code";
\`\`\`

Always respond with well-structured, visually appealing markdown that showcases various formatting elements.`;

// Helper to send simple messages
const sendMessage = (ws: WebSocket, type: string, content: string) => {
  if (ws.readyState === WebSocket.OPEN) {
    const message = createSimpleMessage(type, content);
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
};

// Define the callLLM function
async function callLLM(inputText: string, ws: WebSocket, chatId?: string) {
  const connectionInfo = connections.get(ws);
  const connId = connectionInfo?.id || "unknown";

  log("INFO", "LLM", `Starting LLM call for connection ${connId}`, {
    chatId: chatId || "default",
    inputLength: inputText.length,
    inputPreview: inputText.substring(0, 100),
  });

  // Get or create conversation history for this WebSocket connection
  let history = conversationHistory.get(ws);
  if (!history) {
    history = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];
    conversationHistory.set(ws, history);
    log(
      "INFO",
      "LLM",
      `Created new conversation history for connection ${connId}`,
    );
  }

  // Add user message to history
  history.push({
    role: "user",
    content: inputText,
  });

  log(
    "DEBUG",
    "LLM",
    `Added user message to history for connection ${connId}`,
    { historyLength: history.length },
  );

  // Send acknowledgment using simplified protocol
  sendMessage(ws, "PROCESSING", "Processing your message...");
  log("INFO", "LLM", `Sent ACK message to connection ${connId}`);

  // Send thinking state using simplified protocol
  sendMessage(ws, "THINKING", "true");
  log("INFO", "LLM", `Sent thinking state ON to connection ${connId}`);

  try {
    log("INFO", "LLM", `Calling Google Gemini API for connection ${connId}`);
    const result = await streamText({
      model: google("models/gemini-1.5-flash-latest"),
      messages: history.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      temperature: 0.7, // Add some creativity for richer responses
      maxTokens: 2000, // Allow for longer, more detailed responses
    });

    log(
      "INFO",
      "LLM",
      `Google API call successful, starting stream processing for connection ${connId}`,
    );

    // Generate a unique stream ID for this conversation
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let chunkIndex = 0;
    let fullContent = "";

    // Send thinking state off when we start receiving content
    let thinkingStateSent = false;

    log(
      "DEBUG",
      "LLM",
      `Starting stream processing with ID: ${streamId} for connection ${connId}`,
    );

    // Process the stream
    for await (const delta of result.textStream) {
      // Check if WebSocket is still open
      if (ws.readyState !== WebSocket.OPEN) {
        log(
          "WARN",
          "LLM",
          `WebSocket closed during streaming for connection ${connId}`,
        );
        break;
      }

      // Send thinking state off on first chunk
      if (!thinkingStateSent) {
        sendMessage(ws, "THINKING", "false");
        log(
          "INFO",
          "LLM",
          `Sent thinking state OFF (streaming started) for connection ${connId}`,
        );
        thinkingStateSent = true;
      }

      // Accumulate content
      fullContent += delta;

      // Send stream chunk using simplified protocol
      sendMessage(ws, "LLM_STREAM", delta);
      log(
        "DEBUG",
        "LLM",
        `Sent stream chunk ${chunkIndex} for connection ${connId}`,
        {
          chatId: chatId || "default",
          chunkLength: delta.length,
          chunkPreview: delta.substring(0, 50),
          totalLength: fullContent.length,
        },
      );
      chunkIndex++;
    }

    // Send completion message using simplified protocol
    sendMessage(ws, "LLM_RESPONSE", fullContent);
    log("INFO", "LLM", `Sent completion message for connection ${connId}`, {
      chatId: chatId || "default",
      totalChunks: chunkIndex,
      responseLength: fullContent.length,
      responsePreview: fullContent.substring(0, 200),
    });

    // Add assistant response to history
    history.push({
      role: "assistant",
      content: fullContent,
    });

    log("INFO", "LLM", `Completed response for connection ${connId}`, {
      chatId: chatId || "default",
      finalHistoryLength: history.length,
      responseLength: fullContent.length,
    });
  } catch (error) {
    log(
      "ERROR",
      "LLM",
      `Error during streaming for connection ${connId}`,
      error,
    );

    // Send error message using simplified protocol
    sendMessage(ws, "LLM_ERROR", "Failed to generate response");

    // Send thinking state off using simplified protocol
    sendMessage(ws, "THINKING", "false");

    log(
      "INFO",
      "LLM",
      `Sent error and thinking OFF messages for connection ${connId}`,
    );
  }
}

// Simplified server - no complex validation needed

try {
  log("INFO", "STARTUP", "Creating WebSocket servers...");

  // Create a single HTTP server
  const server = http.createServer();

  // Create WebSocket server for /chat using WORKING minimal config
  const wss = new WebSocketServer({
    server,
    path: "/chat",
    // Use exact same config as working minimal server
    perMessageDeflate: false,
    extensions: [],
    handleProtocols: () => false,
    verifyClient: (info) => {
      log(
        "DEBUG",
        "CONNECTION",
        "Client connecting with headers",
        info.req.headers,
      );
      // Strip all extension headers like the working minimal server
      delete info.req.headers["sec-websocket-extensions"];
      return true;
    },
  });

  wss.on("connection", (ws, req) => {
    connectionCounter++;
    const connId = connectionCounter;
    const connInfo = { id: connId, connectedAt: new Date() };
    connections.set(ws, connInfo);

    log("INFO", "CONNECTION", `Client connected`, {
      connectionId: connId,
      totalConnections: connections.size,
      path: "/chat",
      url: req.url,
    });

    // MINIMAL SERVER APPROACH: No messages, no heartbeat, just basic handlers
    log(
      "DEBUG",
      "CONNECTION",
      `Using minimal server approach - no automatic messages`,
    );
    const heartbeatInterval = null; // Completely disabled

    // SIMPLIFIED MESSAGE HANDLER - Using simplified protocol
    ws.on("message", async (message) => {
      try {
        const messageString = message.toString();
        log("INFO", "MESSAGE", `Message received from connection ${connId}`, {
          messageLength: messageString.length,
        });

        // Parse using simplified protocol
        const parsedMessage = parseSimpleMessage(messageString);
        if (!parsedMessage) {
          log(
            "WARN",
            "MESSAGE",
            `Invalid message format from connection ${connId}`,
          );
          sendMessage(ws, "ERROR", "Invalid message format");
          return;
        }

        log("INFO", "MESSAGE", `Parsed message from connection ${connId}`, {
          type: parsedMessage.type,
          contentLength: parsedMessage.content.length,
        });

        // Handle user messages
        if (isUserMessage(parsedMessage)) {
          if (parsedMessage.content && parsedMessage.content.trim() !== "") {
            log(
              "INFO",
              "MESSAGE",
              `Processing user message from connection ${connId}`,
            );
            await callLLM(parsedMessage.content, ws);
          } else {
            log(
              "WARN",
              "MESSAGE",
              `Empty user message from connection ${connId}`,
            );
            sendMessage(ws, "ERROR", "Message cannot be empty");
          }
        } else {
          log(
            "INFO",
            "MESSAGE",
            `Received ${parsedMessage.type} message from connection ${connId}`,
          );
          sendMessage(ws, "ACK", `Received ${parsedMessage.type} message`);
        }
      } catch (error) {
        log(
          "ERROR",
          "MESSAGE",
          `Error processing message from connection ${connId}`,
          error,
        );
        sendMessage(ws, "ERROR", "Failed to process message");
      }
    });

    ws.on("close", (code, reason) => {
      connections.delete(ws);
      log("INFO", "CONNECTION", `Client disconnected`, {
        connectionId: connId,
        totalConnections: connections.size,
        connectionDuration: Date.now() - connInfo.connectedAt.getTime(),
        closeCode: code,
        closeReason: reason?.toString() || "No reason provided",
        wasExpected: code === 1000 || code === 1001, // Normal closure or going away
        wasProtocolError: code === 1002, // Protocol error
        wasInvalidData: code === 1003, // Invalid data
        wasFrameError: code === 1006, // Abnormal closure (often frame header issues)
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Clean up conversation history for this connection
      conversationHistory.delete(ws);
    });

    ws.on("error", (error) => {
      log("ERROR", "CONNECTION", `WebSocket error for connection ${connId}`, {
        error: error.message,
        errorCode: (error as any).code,
        errorType: error.constructor.name,
        connectionId: connId,
        readyState: ws.readyState,
        stack: error.stack,
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    });

    ws.on("pong", () => {
      log("DEBUG", "HEARTBEAT", `Received pong from connection ${connId}`);
    });
  });

  // Create WebSocket server for /agent using WORKING minimal config
  const wssAgent = new WebSocketServer({
    server,
    path: "/agent",
    // Use exact same config as working minimal server
    perMessageDeflate: false,
    extensions: [],
    handleProtocols: () => false,
    verifyClient: (info) => {
      log(
        "DEBUG",
        "CONNECTION",
        "Agent client connecting with headers",
        info.req.headers,
      );
      // Strip all extension headers like the working minimal server
      delete info.req.headers["sec-websocket-extensions"];
      return true;
    },
  });
  wssAgent.on("connection", (ws) => {
    connectionCounter++;
    const connId = connectionCounter;
    const connInfo = { id: connId, connectedAt: new Date() };
    connections.set(ws, connInfo);

    log("INFO", "CONNECTION", `Agent client connected`, {
      connectionId: connId,
      totalConnections: connections.size,
      path: "/agent",
    });

    // TEMPORARILY DISABLE agent welcome message to debug frame errors
    log(
      "DEBUG",
      "CONNECTION",
      `Skipping agent welcome message for connection ${connId} - debugging frame errors`,
    );

    ws.on("close", () => {
      connections.delete(ws);
      log("INFO", "CONNECTION", `Agent client disconnected`, {
        connectionId: connId,
        totalConnections: connections.size,
        connectionDuration: Date.now() - connInfo.connectedAt.getTime(),
      });
    });

    ws.on("error", (error) => {
      log(
        "ERROR",
        "CONNECTION",
        `Agent WebSocket error for connection ${connId}`,
        error,
      );
    });
  });

  // Start the HTTP server
  server.listen(Number(PORT), () => {
    log("INFO", "STARTUP", `Buddy LLM WebSocket server started successfully`, {
      port: PORT,
      chatPath: "/chat",
      agentPath: "/agent",
    });
    log("INFO", "STARTUP", "Server setup complete. Ready for connections.");
  });

  // Handle graceful shutdown
  for (const signal of ["SIGTERM", "SIGINT", "SIGUSR2"] as const) {
    process.on(signal, () => {
      log("INFO", "SHUTDOWN", `Received ${signal}, shutting down...`);
      server.close(() => {
        log("INFO", "SHUTDOWN", "Server shutdown complete");
        process.exit(0);
      });
    });
  }
} catch (error) {
  console.error("Startup error:", error);
  log("ERROR", "STARTUP", "Failed to start server", error);
  process.exit(1);
}

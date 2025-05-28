import { google } from '@ai-sdk/google';
import {
  type UserMessage,
  type WebSocketEnvelope,
  createAckMessage,
  createErrorMessage,
  createLLMStreamMessage,
  createThinkingMessage,
  createWebSocketEnvelope,
  createWelcomeMessage,
  isClientMessage,
  parseWebSocketMessage
} from '@buddy/protocol';
import { streamText } from 'ai';
import { config } from 'dotenv';
import { WebSocket, WebSocketServer } from 'ws';

// Load environment variables from .env file
config();

const PORT = process.env.PORT || 8080;
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY in .env file. Please set it.');
  process.exit(1);
}

// We don't directly need genAI instance if using the Vercel SDK's google adapter for streamText
// const genAI = new GoogleGenerativeAI(GOOGLE_GENERATIVE_AI_API_KEY);

// Store conversation history per WebSocket connection
const conversationHistory = new WeakMap<WebSocket, Array<{ role: 'user' | 'assistant', content: string }>>();

// Define the callLLM function
async function callLLM(inputText: string, ws: WebSocket) {
  console.log(`[LLM] Calling LLM with input: "${inputText}"`);

  // Check if WebSocket is still open before proceeding
  if (ws.readyState !== WebSocket.OPEN) {
    console.warn('[LLM] WebSocket is not open, skipping LLM call');
    return;
  }

  // Get or initialize conversation history for this connection
  if (!conversationHistory.has(ws)) {
    conversationHistory.set(ws, []);
  }
  const history = conversationHistory.get(ws) || [];

  // Add user message to history
  history.push({ role: 'user', content: inputText });

  // Send thinking state
  try {
    const thinkingMessage = createThinkingMessage(true);
    const thinkingEnvelope = createWebSocketEnvelope(thinkingMessage);
    ws.send(thinkingEnvelope.text);
    console.log('[LLM] Sent thinking state:', thinkingMessage);
  } catch (error) {
    console.error('[LLM] Error sending thinking state:', error);
  }

  try {
    const result = await streamText({
      model: google('models/gemini-1.5-flash-latest'),
      messages: history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    });

    console.log('[LLM] Starting stream processing');

    // Generate a unique stream ID for this conversation
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let chunkIndex = 0;
    let fullContent = '';

    // Send thinking state off when we start receiving content
    let thinkingStateSent = false;

    // Process the stream
    for await (const delta of result.textStream) {
      // Check if WebSocket is still open
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn('[LLM] WebSocket closed during streaming');
        break;
      }

      // Send thinking state off on first chunk
      if (!thinkingStateSent) {
        const thinkingOffMessage = createThinkingMessage(false);
        const thinkingOffEnvelope = createWebSocketEnvelope(thinkingOffMessage);
        ws.send(thinkingOffEnvelope.text);
        console.log('[LLM] Sent thinking state off (streaming started)');
        thinkingStateSent = true;
      }

      // Accumulate content
      fullContent += delta;

      // Send stream chunk
      const streamMessage = createLLMStreamMessage(delta, false, {
        streamId,
        metadata: {
          model: 'gemini-1.5-flash-latest',
          chunkIndex: chunkIndex++
        }
      });
      const streamEnvelope = createWebSocketEnvelope(streamMessage);
      ws.send(streamEnvelope.text);
      console.log(`[LLM] Sent stream chunk ${chunkIndex}: "${delta}"`);
    }

    // Send final completion message
    if (ws.readyState === WebSocket.OPEN) {
      const finalMessage = createLLMStreamMessage('', true, {
        streamId,
        metadata: {
          model: 'gemini-1.5-flash-latest',
          chunkIndex: chunkIndex,
          totalChunks: chunkIndex
        }
      });
      const finalEnvelope = createWebSocketEnvelope(finalMessage);
      ws.send(finalEnvelope.text);
      console.log('[LLM] Sent stream completion');
    }

    // Get final result for logging
    const { usage, finishReason, toolCalls, toolResults } = await result;

    console.log('[LLM] Stream completed');
    console.log('[LLM] Full content:', fullContent);

    // Add assistant response to conversation history
    history.push({ role: 'assistant', content: fullContent });
    console.log(`[LLM] Updated conversation history. Total messages: ${history.length}`);

    console.log('[LLM] API Usage:', usage);
    console.log('[LLM] Finish Reason:', finishReason);
    if (toolCalls) console.log('[LLM] Tool Calls:', toolCalls);
    if (toolResults) console.log('[LLM] Tool Results:', toolResults);

  } catch (error: any) {
    console.error('[LLM] Error calling LLM:');
    console.error('[LLM] Error Message:', error.message);
    if (error.stack) {
      console.error('[LLM] Error Stack:', error.stack);
    }
    if (error.cause) {
      console.error('[LLM] Error Cause:', error.cause);
    }
    if (error.response?.data) {
      console.error('[LLM] Detailed API Error Response:', error.response.data);
    }

    // Send thinking state off
    if (ws.readyState === WebSocket.OPEN) {
      const thinkingOffMessage = createThinkingMessage(false);
      const thinkingOffEnvelope = createWebSocketEnvelope(thinkingOffMessage);
      ws.send(thinkingOffEnvelope.text);
    }

    // Send error message
    if (ws.readyState === WebSocket.OPEN) {
      const errorMessage = createErrorMessage('LLM_ERROR', `LLM call failed: ${error.message}`);
      const errorEnvelope = createWebSocketEnvelope(errorMessage);
      ws.send(errorEnvelope.text);
      console.log('[LLM] Sent error:', errorMessage);
    } else {
      console.warn('[LLM] WebSocket closed before sending error response');
    }
  }
}

try {
  // Create WebSocket server directly
  const wss = new WebSocketServer({ port: Number(PORT) });

  wss.on('connection', (ws) => {
    console.log('[Server] Client connected');

    // Send welcome message
    try {
      const welcomeMessage = createWelcomeMessage('Connected to Buddy LLM Server');
      const welcomeEnvelope = createWebSocketEnvelope(welcomeMessage);
      ws.send(welcomeEnvelope.text);
      console.log('[Server] Sent welcome message:', welcomeMessage);
    } catch (error) {
      console.error('[Server] Error sending welcome message:', error);
    }

    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Ping every 30 seconds

    ws.on('message', async (message) => {
      try {
        const messageString = message.toString();
        console.log('[Server] Raw message received:', messageString);

        // The client sends envelope.text, which is the JSON string of the protocol message
        // So we need to create an envelope wrapper for parsing
        const envelope: WebSocketEnvelope = {
          text: messageString,
          timestamp: new Date().toISOString()
        };
        console.log('[Server] Created envelope for parsing:', envelope);

        // Parse the protocol message from the envelope
        const parseResult = parseWebSocketMessage(envelope);
        if (!parseResult.message) {
          console.error('[Server] Failed to parse protocol message:', parseResult.validation.errors);
          const errorMessage = createErrorMessage('PARSE_ERROR', 'Invalid message format');
          const errorEnvelope = createWebSocketEnvelope(errorMessage);
          ws.send(errorEnvelope.text);
          return;
        }

        const protocolMessage = parseResult.message;
        console.log('[Server] Parsed protocol message:', protocolMessage);

        // Validate it's a client message
        if (!isClientMessage(protocolMessage)) {
          console.warn('[Server] Received non-client message, ignoring:', protocolMessage);
          return;
        }

        // Send acknowledgment
        const ackMessage = createAckMessage('RECEIVED', {
          message: 'Message received, processing...'
        });
        const ackEnvelope = createWebSocketEnvelope(ackMessage);
        ws.send(ackEnvelope.text);
        console.log('[Server] Sent acknowledgment:', ackMessage);

        // Handle USER_MESSAGE
        if (protocolMessage.type === 'USER_MESSAGE') {
          const userMessage = protocolMessage as UserMessage;
          if (userMessage.text && userMessage.text.trim() !== '') {
            await callLLM(userMessage.text, ws);
          } else {
            console.log('[Server] User message has no text content:', userMessage);
            const errorMessage = createErrorMessage('VALIDATION_ERROR', 'Message must contain text');
            const errorEnvelope = createWebSocketEnvelope(errorMessage);
            ws.send(errorEnvelope.text);
          }
        } else {
          console.log('[Server] Unhandled message type:', protocolMessage.type);
        }

      } catch (error) {
        console.error('[Server] Error handling message:', error);
        try {
          const errorMessage = createErrorMessage('PROCESSING_ERROR', 'Failed to process message');
          const errorEnvelope = createWebSocketEnvelope(errorMessage);
          ws.send(errorEnvelope.text);
        } catch (sendError) {
          console.error('[Server] Error sending error message:', sendError);
        }
      }
    });

    ws.on('close', () => {
      console.log('[Server] Client disconnected');
      clearInterval(heartbeatInterval);
      // Clean up conversation history for this connection
      conversationHistory.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[Server] WebSocket error:', error);
      clearInterval(heartbeatInterval);
    });

    ws.on('pong', () => {
      console.log('[Server] Received pong from client');
    });
  });

  // Log server start
  console.log(`[Server] Buddy LLM WebSocket server started on port ${PORT}`);
  console.log('[Server] Server setup complete. Ready for connections.');

  // Handle graceful shutdown
  for (const signal of ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const) {
    process.on(signal, () => {
      console.log(`\n[Server] Received ${signal}, shutting down...`);
      wss.close(() => {
        process.exit(0);
      });
    });
  }

} catch (error) {
  console.error('[Server] Failed to start server:', error);
  process.exit(1);
}
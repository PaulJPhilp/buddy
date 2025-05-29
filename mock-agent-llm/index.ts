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
async function callLLM(inputText: string, ws: WebSocket, chatId?: string) {
  console.log(`[LLM] Calling LLM with input: "${inputText}" for chatId: ${chatId || 'default'}`);

  // Get or create conversation history for this WebSocket connection
  let history = conversationHistory.get(ws);
  if (!history) {
    history = [];
    conversationHistory.set(ws, history);
  }

  // Add user message to history
  history.push({
    role: 'user',
    content: inputText
  });

  // Send acknowledgment
  const ackMessage = createAckMessage('PROCESSING', {
    message: 'Processing your message...'
  });
  const ackEnvelope = createWebSocketEnvelope(ackMessage);
  ws.send(ackEnvelope.text);
  console.log('[LLM] Sent ACK message');

  // Send thinking state
  const thinkingMessage = createThinkingMessage(true);
  const thinkingEnvelope = createWebSocketEnvelope(thinkingMessage);
  ws.send(thinkingEnvelope.text);
  console.log('[LLM] Sent thinking state on');

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

      // Send stream chunk with chatId
      const streamMessage = createLLMStreamMessage(delta, false, {
        streamId,
        metadata: {
          model: 'gemini-1.5-flash-latest',
          chunkIndex: chunkIndex++,
          chatId: chatId // Include chatId for routing
        } as any // Temporary fix for type issue
      });
      const streamEnvelope = createWebSocketEnvelope(streamMessage);
      ws.send(streamEnvelope.text);
      console.log(`[LLM] Sent stream chunk ${chunkIndex} for chatId ${chatId || 'default'}: "${delta}"`);
    }

    // Send completion message with chatId
    const completionMessage = createLLMStreamMessage('', true, {
      streamId,
      metadata: {
        model: 'gemini-1.5-flash-latest',
        chunkIndex: chunkIndex,
        chatId: chatId // Include chatId for routing
      } as any // Temporary fix for type issue
    });
    const completionEnvelope = createWebSocketEnvelope(completionMessage);
    ws.send(completionEnvelope.text);
    console.log(`[LLM] Sent completion message for chatId ${chatId || 'default'}`);

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: fullContent
    });

    console.log(`[LLM] Completed response for chatId ${chatId || 'default'}. Full content: "${fullContent}"`);

  } catch (error) {
    console.error('[LLM] Error during streaming:', error);

    // Send error message
    const errorMessage = createErrorMessage('LLM_ERROR', 'Failed to generate response');
    const errorEnvelope = createWebSocketEnvelope(errorMessage);
    ws.send(errorEnvelope.text);

    // Send thinking state off
    const thinkingOffMessage = createThinkingMessage(false);
    const thinkingOffEnvelope = createWebSocketEnvelope(thinkingOffMessage);
    ws.send(thinkingOffEnvelope.text);
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
            const chatId = (userMessage.metadata as any)?.chatId;
            console.log(`[Server] Processing message for chatId: ${chatId || 'default'}`);
            await callLLM(userMessage.text, ws, chatId);
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
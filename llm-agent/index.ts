import { google } from '@ai-sdk/google';
import { WebSocketMessage, createMessage, parseMessage } from '@buddy/protocol';
import { streamText } from 'ai';
import { config } from 'dotenv';
import { Effect } from 'effect';
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

// Simple message interface for server responses
interface SimpleMessage {
  text: string;
  timestamp: string;
}

// Add missing types and functions
interface UserMessage {
  type: string;
  text: string;
  metadata?: any;
}

// Add missing isClientMessage function
const isClientMessage = (message: any): boolean => {
  return message && (message.type === 'USER_MESSAGE' || message.type === 'COMMAND');
};

// Store conversation history per WebSocket connection
const conversationHistory = new WeakMap<WebSocket, Array<{ role: 'user' | 'assistant' | 'system', content: string }>>();

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

// Helper to create simple protocol message
function createSimpleMessage(messageType: string, content?: string): SimpleMessage {
  const message = createMessage('RESPONSE' as any, {
    type: messageType,
    content: content || '',
    __tag: 'ResponsePayload'
  });
  
  return {
    text: JSON.stringify(message),
    timestamp: new Date().toISOString()
  };
}

// Define the callLLM function
async function callLLM(inputText: string, ws: WebSocket, chatId?: string) {
  console.log(`[LLM] Calling LLM with input: "${inputText}" for chatId: ${chatId || 'default'}`);

  // Get or create conversation history for this WebSocket connection
  let history = conversationHistory.get(ws);
  if (!history) {
    history = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];
    conversationHistory.set(ws, history);
  }

  // Add user message to history
  history.push({
    role: 'user',
    content: inputText
  });

  // Send acknowledgment
  const ackMessage = createSimpleMessage('PROCESSING', 'Processing your message...');
  ws.send(ackMessage.text);
  console.log('[LLM] Sent ACK message');

  // Send thinking state
  const thinkingMessage = createSimpleMessage('THINKING', 'true');
  ws.send(thinkingMessage.text);
  console.log('[LLM] Sent thinking state on');

  try {
    const result = await streamText({
      model: google('models/gemini-1.5-flash-latest'),
      messages: history.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      temperature: 0.7, // Add some creativity for richer responses
      maxTokens: 2000,  // Allow for longer, more detailed responses
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
        const thinkingOffMessage = createSimpleMessage('THINKING', 'false');
        ws.send(thinkingOffMessage.text);
        console.log('[LLM] Sent thinking state off (streaming started)');
        thinkingStateSent = true;
      }

      // Accumulate content
      fullContent += delta;

      // Send stream chunk with chatId
      const streamMessage = createSimpleMessage('LLM_STREAM', delta);
      ws.send(streamMessage.text);
      console.log(`[LLM] Sent stream chunk ${chunkIndex} for chatId ${chatId || 'default'}: "${delta}"`);
      chunkIndex++;
    }

    // Send completion message with chatId
    const completionMessage = createSimpleMessage('LLM_RESPONSE', fullContent);
    ws.send(completionMessage.text);
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
    const errorMessage = createSimpleMessage('LLM_ERROR', 'Failed to generate response');
    ws.send(errorMessage.text);

    // Send thinking state off
    const thinkingOffMessage = createSimpleMessage('THINKING', 'false');
    ws.send(thinkingOffMessage.text);
  }
}

try {
  // Create WebSocket server directly
  const wss = new WebSocketServer({ port: Number(PORT), path: "/chat" });

  wss.on('connection', (ws) => {
    console.log('[Server] Client connected');

    // Send welcome message
    try {
      const welcomeMessage = createSimpleMessage('WELCOME', 'Connected to Buddy LLM Server');
      ws.send(welcomeMessage.text);
      console.log('[Server] Sent welcome message');
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

        // Parse the incoming message using Effect's parseMessage
        const parseEffect = parseMessage(messageString);
        const result = await Effect.runPromise(parseEffect.pipe(
          Effect.catchAll((error) => Effect.succeed(null))
        ));

        if (!result) {
          console.error('[Server] Failed to parse protocol message');
          const errorMessage = createSimpleMessage('PARSE_ERROR', 'Invalid message format');
          ws.send(errorMessage.text);
          return;
        }

        const protocolMessage = result;
        console.log('[Server] Parsed protocol message:', protocolMessage);

        // Validate it's a client message
        if (!isClientMessage(protocolMessage)) {
          console.warn('[Server] Received non-client message, ignoring:', protocolMessage);
          return;
        }

        // Send acknowledgment
        const ackMessage = createSimpleMessage('RECEIVED', 'Message received, processing...');
        ws.send(ackMessage.text);
        console.log('[Server] Sent acknowledgment');

        // Handle USER_MESSAGE or COMMAND
        if (protocolMessage.type === 'USER_MESSAGE') {
          const userMessage = protocolMessage as UserMessage;
          if (userMessage.text && userMessage.text.trim() !== '') {
            const chatId = (userMessage.metadata as any)?.chatId;
            console.log(`[Server] Processing message for chatId: ${chatId || 'default'}`);
            await callLLM(userMessage.text, ws, chatId);
          } else {
            console.log('[Server] User message has no text content:', userMessage);
            const errorMessage = createSimpleMessage('VALIDATION_ERROR', 'Message must contain text');
            ws.send(errorMessage.text);
          }
        } else if (protocolMessage.type === 'COMMAND') {
          // Handle COMMAND type messages
          const payload = protocolMessage.payload as any;
          if (payload.command === 'userMessage' && payload.data?.text) {
            const chatId = payload.data.chatId;
            console.log(`[Server] Processing command message for chatId: ${chatId || 'default'}`);
            await callLLM(payload.data.text, ws, chatId);
          } else {
            console.log('[Server] Unknown command:', payload.command);
            const errorMessage = createSimpleMessage('UNSUPPORTED_COMMAND', `Unknown command: ${payload.command}`);
            ws.send(errorMessage.text);
          }
        } else {
          console.log('[Server] Unhandled message type:', protocolMessage.type);
        }

      } catch (error) {
        console.error('[Server] Error handling message:', error);
        try {
          const errorMessage = createSimpleMessage('PROCESSING_ERROR', 'Failed to process message');
          ws.send(errorMessage.text);
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
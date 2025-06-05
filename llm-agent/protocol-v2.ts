import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Types for the protocol
type MessageType = 'COMMAND' | 'EVENT' | 'QUERY' | 'RESPONSE' | 'ERROR' | 'STATE_CHANGE' | 'SYSTEM';
type PriorityLevel = 0 | 1 | 2 | 3;

interface MessageMetadata {
  sourceAgentRuntimeId?: string;
  correlationId?: string;
  processed?: boolean;
  persisted?: boolean;
  priority?: PriorityLevel;
  scheduledFor?: number;
  timeout?: number;
  [key: string]: unknown;
}

export interface WebSocketMessage {
  id: string;
  type: MessageType;
  agentRuntimeId: string;
  timestamp: number;
  sequence: number;
  payload: unknown;
  metadata: MessageMetadata;
}

interface CommandPayload {
  command: string;
  parameters?: Record<string, unknown>;
  data?: unknown;
}

interface QueryPayload {
  query: string;
  parameters?: Record<string, unknown>;
}

interface EventPayload {
  event: string;
  data?: unknown;
}

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

interface StateChangePayload {
  from: string;
  to: string;
  reason?: string;
}

interface SystemPayload {
  action: string;
  [key: string]: unknown;
}

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
- Include links [like this](https://example.com) when relevant`;

class LLMAgentService {
  private wss: WebSocketServer;
  private port: number;
  private clients = new Map<WebSocket, {
    sequence: number;
    agentRuntimeId: string;
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  }>();

  constructor(port: number) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws) => this.handleConnection(ws));
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private async handleConnection(ws: WebSocket) {
    const clientId = `client-${Date.now()}`;
    console.log(`[${clientId}] Client connected`);

    // Initialize client state
    this.clients.set(ws, {
      sequence: 1,
      agentRuntimeId: 'unauthenticated',
      conversationHistory: [{
        role: 'system',
        content: SYSTEM_PROMPT
      }]
    });

    // Send welcome message
    await this.sendMessage(ws, {
      type: 'SYSTEM',
      payload: {
        action: 'connection_established',
        message: 'Connected to LLM Agent Service',
        capabilities: ['chat', 'streaming', 'commands']
      },
      metadata: {}
    });

    // Set up message handler
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error(`[${clientId}] Error processing message:`, error);
        this.sendError(ws, {
          code: 'INVALID_MESSAGE',
          message: 'Failed to parse message',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Clean up on disconnect
    ws.on('close', () => {
      console.log(`[${clientId}] Client disconnected`);
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error(`[${clientId}] WebSocket error:`, error);
      this.clients.delete(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage) {
    const clientId = this.getClientId(ws) || 'unknown';
    console.log(`[${clientId}] Received ${message.type} message:`, message.id);

    // Update client's agent runtime ID if not set
    const client = this.clients.get(ws);
    if (client && client.agentRuntimeId === 'unauthenticated' && message.agentRuntimeId) {
      client.agentRuntimeId = message.agentRuntimeId;
      console.log(`[${clientId}] Updated agentRuntimeId to:`, message.agentRuntimeId);
    }

    // Route message to appropriate handler
    try {
      switch (message.type) {
        case 'COMMAND':
          await this.handleCommand(ws, message);
          break;
        case 'QUERY':
          await this.handleQuery(ws, message);
          break;
        case 'EVENT':
          await this.handleEvent(ws, message);
          break;
        case 'SYSTEM':
          await this.handleSystem(ws, message);
          break;
        default:
          throw new Error(`Unsupported message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[${clientId}] Error handling ${message.type} message:`, error);
      this.sendError(ws, {
        code: 'PROCESSING_ERROR',
        message: `Failed to process ${message.type} message`,
        details: error instanceof Error ? error.message : String(error)
      }, { correlationId: message.id });
    }
  }

  private async handleCommand(ws: WebSocket, message: WebSocketMessage) {
    const command = message.payload as CommandPayload;
    const clientId = this.getClientId(ws) || 'unknown';
    
    console.log(`[${clientId}] Handling command:`, command.command);

    // Acknowledge command receipt
    await this.sendMessage(ws, {
      type: 'RESPONSE',
      payload: {
        status: 'processing',
        command: command.command,
        timestamp: Date.now()
      },
      metadata: {
        correlationId: message.id,
        processed: true
      }
    });

    // Handle different commands
    switch (command.command) {
      case 'process':
        await this.processMessage(ws, command.data as string, message.id);
        break;
      case 'reset':
        await this.resetConversation(ws, message.id);
        break;
      default:
        throw new Error(`Unknown command: ${command.command}`);
    }
  }

  private async processMessage(ws: WebSocket, text: string, correlationId: string) {
    const client = this.clients.get(ws);
    if (!client) throw new Error('Client not found');

    // Add user message to history
    client.conversationHistory.push({
      role: 'user',
      content: text
    });

    // Send state change
    await this.sendMessage(ws, {
      type: 'STATE_CHANGE',
      payload: {
        from: 'idle',
        to: 'processing',
        reason: 'processing_user_message'
      },
      metadata: { correlationId }
    });

    // Send thinking state
    await this.sendMessage(ws, {
      type: 'SYSTEM',
      payload: { action: 'thinking', isThinking: true },
      metadata: { correlationId }
    });

    try {
      // Call the LLM
      const result = await streamText({
        model: google('models/gemini-1.5-flash-latest'),
        messages: client.conversationHistory,
        temperature: 0.7,
        maxTokens: 2000,
      });

      let fullResponse = '';
      let chunkIndex = 0;
      const streamId = `stream-${Date.now()}`;

      // Process the stream
      for await (const chunk of result.textStream) {
        if (ws.readyState !== WebSocket.OPEN) break;
        
        fullResponse += chunk;
        
        // Send stream chunk
        await this.sendMessage(ws, {
          type: 'RESPONSE',
          payload: {
            type: 'stream_chunk',
            streamId,
            chunk,
            chunkIndex: chunkIndex++,
            isComplete: false
          },
          metadata: { correlationId }
        });
      }

      // Send completion
      await this.sendMessage(ws, {
        type: 'RESPONSE',
        payload: {
          type: 'stream_complete',
          streamId,
          chunkIndex,
          isComplete: true
        },
        metadata: { correlationId }
      });

      // Add assistant response to history
      client.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

    } catch (error) {
      console.error('Error processing message:', error);
      throw new Error('Failed to generate response');
    } finally {
      // Send thinking state off
      await this.sendMessage(ws, {
        type: 'SYSTEM',
        payload: { action: 'thinking', isThinking: false },
        metadata: { correlationId }
      });

      // Update state
      await this.sendMessage(ws, {
        type: 'STATE_CHANGE',
        payload: {
          from: 'processing',
          to: 'idle',
          reason: 'processing_complete'
        },
        metadata: { correlationId }
      });
    }
  }

  private async resetConversation(ws: WebSocket, correlationId: string) {
    const client = this.clients.get(ws);
    if (!client) throw new Error('Client not found');

    // Reset conversation history to just the system prompt
    client.conversationHistory = [{
      role: 'system',
      content: SYSTEM_PROMPT
    }];

    await this.sendMessage(ws, {
      type: 'RESPONSE',
      payload: {
        status: 'success',
        message: 'Conversation reset',
        timestamp: Date.now()
      },
      metadata: { correlationId, processed: true }
    });
  }

  private async handleQuery(ws: WebSocket, message: WebSocketMessage) {
    const query = message.payload as QueryPayload;
    const clientId = this.getClientId(ws) || 'unknown';
    
    console.log(`[${clientId}] Handling query:`, query.query);

    // In a real implementation, you would process the query here
    const response = {
      query: query.query,
      result: `Result for ${query.query}`,
      timestamp: Date.now()
    };

    await this.sendMessage(ws, {
      type: 'RESPONSE',
      payload: response,
      metadata: {
        correlationId: message.id,
        processed: true
      }
    });
  }

  private async handleEvent(ws: WebSocket, message: WebSocketMessage) {
    const event = message.payload as EventPayload;
    const clientId = this.getClientId(ws) || 'unknown';
    
    console.log(`[${clientId}] Handling event:`, event.event);

    // Acknowledge event
    await this.sendMessage(ws, {
      type: 'RESPONSE',
      payload: {
        status: 'received',
        event: event.event,
        timestamp: Date.now()
      },
      metadata: {
        correlationId: message.id,
        processed: true
      }
    });
  }

  private async handleSystem(ws: WebSocket, message: WebSocketMessage) {
    const system = message.payload as SystemPayload;
    const clientId = this.getClientId(ws) || 'unknown';
    
    console.log(`[${clientId}] Handling system action:`, system.action);

    switch (system.action) {
      case 'ping':
        await this.sendMessage(ws, {
          type: 'SYSTEM',
          payload: { action: 'pong', timestamp: Date.now() },
          metadata: { correlationId: message.id }
        });
        break;
      default:
        throw new Error(`Unsupported system action: ${system.action}`);
    }
  }

  private async sendMessage(
    ws: WebSocket,
    message: Omit<WebSocketMessage, 'id' | 'agentRuntimeId' | 'sequence' | 'timestamp'>
  ) {
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return;
    }

    const client = this.clients.get(ws);
    if (!client) {
      console.warn('Cannot send message: Client not found');
      return;
    }

    const fullMessage: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentRuntimeId: client.agentRuntimeId,
      sequence: client.sequence++,
      timestamp: Date.now(),
      ...message
    };

    ws.send(JSON.stringify(fullMessage));
    return fullMessage;
  }

  private async sendError(
    ws: WebSocket,
    error: ErrorPayload,
    metadata: Partial<MessageMetadata> = {}
  ) {
    return this.sendMessage(ws, {
      type: 'ERROR',
      payload: error,
      metadata: {
        ...metadata,
        processed: true
      }
    });
  }

  private getClientId(ws: WebSocket): string | undefined {
    const client = this.clients.get(ws);
    return client ? client.agentRuntimeId : undefined;
  }

  public start() {
    console.log(`LLM Agent Service started on port ${this.port}`);
    return this.wss;
  }

  public stop() {
    this.wss.close();
    console.log('LLM Agent Service stopped');
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const service = new LLMAgentService(PORT);
  service.start();

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('Shutting down...');
    service.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export { LLMAgentService };

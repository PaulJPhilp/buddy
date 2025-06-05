import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

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

interface WebSocketMessage {
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
  [key: string]: unknown;
}

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

interface StateChangePayload {
  from: string;
  to: string;
  [key: string]: unknown;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.get('/', (req, res) => {
  res.send('WebSocket test server');
});

// Track connected clients and their sequence numbers
const clients = new Map<WebSocket, { sequence: number; agentRuntimeId: string }>();

function sendMessage(ws: WebSocket, message: Omit<WebSocketMessage, 'sequence' | 'timestamp'>) {
  const client = clients.get(ws);
  if (!client) return;

  const sequence = client.sequence++;
  const fullMessage: WebSocketMessage = {
    ...message,
    sequence,
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(fullMessage));
  return fullMessage;
}

function sendError(ws: WebSocket, error: ErrorPayload, metadata: Partial<MessageMetadata> = {}) {
  return sendMessage(ws, {
    id: uuidv4(),
    type: 'ERROR',
    agentRuntimeId: clients.get(ws)?.agentRuntimeId || 'unknown',
    payload: error,
    metadata: {
      ...metadata,
      processed: true,
    },
  });
}

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  const sequence = 1;
  
  // Initialize client state
  clients.set(ws, { sequence, agentRuntimeId: 'unauthenticated' });

  // Send welcome message
  sendMessage(ws, {
    id: uuidv4(),
    type: 'SYSTEM',
    agentRuntimeId: 'system',
    payload: {
      action: 'connection_established',
      message: 'Connection established. Please authenticate.',
    },
    metadata: {}
  });

  ws.on('message', (data: string) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      console.log('Received message:', message);

      // Update client's agent runtime ID if not set
      const client = clients.get(ws);
      if (client && client.agentRuntimeId === 'unauthenticated' && message.agentRuntimeId) {
        client.agentRuntimeId = message.agentRuntimeId;
      }

      // Handle different message types
      switch (message.type) {
        case 'COMMAND':
          handleCommand(ws, message);
          break;
        case 'QUERY':
          handleQuery(ws, message);
          break;
        case 'SYSTEM':
          handleSystem(ws, message);
          break;
        case 'EVENT':
          handleEvent(ws, message);
          break;
        default:
          sendError(ws, {
            code: 'UNSUPPORTED_MESSAGE_TYPE',
            message: `Unsupported message type: ${message.type}`
          }, { correlationId: message.id });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendError(ws, {
        code: 'INVALID_MESSAGE',
        message: 'Failed to process message',
        details: errorMessage
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Command handler
function handleCommand(ws: WebSocket, message: WebSocketMessage) {
  const command = message.payload as CommandPayload;
  console.log(`Processing command: ${command.command}`);
  
  // Acknowledge command receipt
  const response = sendMessage(ws, {
    id: uuidv4(),
    type: 'RESPONSE',
    agentRuntimeId: message.agentRuntimeId,
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

  // Simulate processing and send state change
  if (response) {
    setTimeout(() => {
      sendMessage(ws, {
        id: uuidv4(),
        type: 'STATE_CHANGE',
        agentRuntimeId: message.agentRuntimeId,
        payload: {
          from: 'IDLE',
          to: 'PROCESSING',
          command: command.command
        },
        metadata: {
          correlationId: message.id
        }
      });
      
      // Simulate completion
      setTimeout(() => {
        sendMessage(ws, {
          id: uuidv4(),
          type: 'RESPONSE',
          agentRuntimeId: message.agentRuntimeId,
          payload: {
            status: 'completed',
            command: command.command,
            result: `Processed ${command.command} successfully`,
            timestamp: Date.now()
          },
          metadata: {
            correlationId: message.id,
            processed: true
          }
        });

        sendMessage(ws, {
          id: uuidv4(),
          type: 'STATE_CHANGE',
          agentRuntimeId: message.agentRuntimeId,
          payload: {
            from: 'PROCESSING',
            to: 'IDLE',
            command: command.command
          },
          metadata: {
            correlationId: message.id
          }
        });
      }, 1000);
    }, 100);
  }
}

// Query handler
function handleQuery(ws: WebSocket, message: WebSocketMessage) {
  const query = message.payload as { query: string; [key: string]: unknown };
  console.log(`Processing query: ${query.query}`);
  
  sendMessage(ws, {
    id: uuidv4(),
    type: 'RESPONSE',
    agentRuntimeId: message.agentRuntimeId,
    payload: {
      query: query.query,
      result: `Result for ${query.query}`,
      timestamp: Date.now()
    },
    metadata: {
      correlationId: message.id,
      processed: true
    }
  });
}

// System message handler
function handleSystem(ws: WebSocket, message: WebSocketMessage) {
  const systemAction = (message.payload as { action: string }).action;
  console.log(`System action: ${systemAction}`);
  
  if (systemAction === 'ping') {
    sendMessage(ws, {
      id: uuidv4(),
      type: 'SYSTEM',
      agentRuntimeId: message.agentRuntimeId,
      payload: {
        action: 'pong',
        timestamp: Date.now()
      },
      metadata: {
        correlationId: message.id
      }
    });
  }
}

// Event handler
function handleEvent(ws: WebSocket, message: WebSocketMessage) {
  const event = message.payload as { event: string; [key: string]: unknown };
  console.log(`Processing event: ${event.event}`);
  
  // Acknowledge event receipt
  sendMessage(ws, {
    id: uuidv4(),
    type: 'RESPONSE',
    agentRuntimeId: message.agentRuntimeId,
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

wss.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(8081, () => {
  console.log('WebSocket server is running on port 8081');
});

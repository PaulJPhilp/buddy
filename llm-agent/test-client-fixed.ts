import WebSocket from 'isomorphic-ws';
import { v4 as uuidv4 } from 'uuid';

type MessageType = 'COMMAND' | 'EVENT' | 'QUERY' | 'RESPONSE' | 'ERROR' | 'STATE_CHANGE' | 'SYSTEM';

interface WebSocketMessage {
  id: string;
  type: MessageType;
  agentRuntimeId: string;
  timestamp: number;
  sequence: number;
  payload: unknown;
  metadata: {
    sourceAgentRuntimeId?: string;
    correlationId?: string;
    processed?: boolean;
    persisted?: boolean;
    priority?: number;
    [key: string]: unknown;
  };
}

class TestClient {
  private ws: WebSocket;
  private sequence = 1;
  private agentRuntimeId = `test-client-${Math.random().toString(36).substring(2, 8)}`;
  private pendingRequests = new Map<string, (response: WebSocketMessage) => void>();

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.ws.on('open', () => {
      console.log('✅ Connected to WebSocket server');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        console.log('📥 Received:', {
          type: message.type,
          id: message.id,
          correlationId: message.metadata.correlationId,
          payload: message.payload
        });

        // Handle pending requests
        if (message.metadata.correlationId) {
          const resolve = this.pendingRequests.get(message.metadata.correlationId);
          if (resolve) {
            resolve(message);
            this.pendingRequests.delete(message.metadata.correlationId);
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('👋 Disconnected from WebSocket server');
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }


  private sendMessage(type: MessageType, payload: unknown, correlationId?: string): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        reject(new Error('WebSocket is not open'));
        return;
      }

      const message: WebSocketMessage = {
        id: uuidv4(),
        type,
        agentRuntimeId: this.agentRuntimeId,
        timestamp: Date.now(),
        sequence: this.sequence++,
        payload,
        metadata: {
          correlationId,
          sourceAgentRuntimeId: this.agentRuntimeId,
        },
      };

      this.ws.send(JSON.stringify(message));
      
      if (correlationId) {
        this.pendingRequests.set(correlationId, resolve);
        
        // Set a timeout to clean up pending requests
        setTimeout(() => {
          if (this.pendingRequests.has(correlationId)) {
            this.pendingRequests.delete(correlationId);
            reject(new Error('Request timed out'));
          }
        }, 10000); // 10 second timeout
      } else {
        resolve(message);
      }
    });
  }

  async ping(): Promise<WebSocketMessage> {
    console.log('🏓 Sending PING');
    return this.sendMessage('COMMAND', { type: 'ping' });
  }

  async sendCommand(command: string, data: unknown): Promise<WebSocketMessage> {
    console.log(`🚀 Sending COMMAND: ${command}`);
    const correlationId = uuidv4();
    return this.sendMessage('COMMAND', { command, data }, correlationId);
  }

  async sendQuery(query: string, params?: unknown): Promise<WebSocketMessage> {
    console.log(`❓ Sending QUERY: ${query}`);
    const correlationId = uuidv4();
    return this.sendMessage('QUERY', { query, params }, correlationId);
  }

  async sendEvent(eventType: string, data: unknown): Promise<WebSocketMessage> {
    console.log(`🎫 Sending EVENT: ${eventType}`);
    return this.sendMessage('EVENT', { eventType, data });
  }

  close() {
    this.ws.close();
  }
}

// Example usage
async function runTest() {
  // Updated URL to match the server's port (8080)
  const client = new TestClient('ws://localhost:8080');
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Test ping/pong
    await client.ping();
    
    // Test command
    await client.sendCommand('process', { data: 'Test data' });
    
    // Test query
    await client.sendQuery('getStatus');
    
    // Test event
    await client.sendEvent('userMessage', { text: 'Hello, agent!' });
    
    // Keep the connection open for a bit to receive all responses
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    client.close();
  }
}

// Run the test
runTest().catch(console.error);

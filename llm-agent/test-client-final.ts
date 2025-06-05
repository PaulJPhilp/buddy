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

class FinalClient {
  private ws: WebSocket | null = null;
  private sequence = 1;
  private agentRuntimeId = `test-client-${Math.random().toString(36).substring(2, 8)}`;
  private pendingRequests = new Map<string, (response: WebSocketMessage) => void>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000; // 1 second

  constructor(private url: string) {}

  async connect(): Promise<void> {
    console.log(`🔌 Attempting to connect to ${this.url}...`);
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      const connectTimeout = setTimeout(() => {
        console.error('❌ Connection timeout');
        reject(new Error('Connection timeout'));
      }, 5000);
      
      this.ws.on('open', () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Connected to WebSocket server');
        resolve();
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
        this.isConnected = false;
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clearTimeout(connectTimeout);
        reject(error);
      });
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
  }

  private sendMessage(type: MessageType, payload: unknown, correlationId?: string): Promise<WebSocketMessage> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.ensureConnected();
        
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket is not open');
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

        console.log(`📤 Sending ${type} message:`, { 
          id: message.id, 
          correlationId,
          payload 
        });
        
        this.ws.send(JSON.stringify(message));
        
        if (correlationId) {
          this.pendingRequests.set(correlationId, resolve);
          
          // Set a timeout to clean up pending requests
          setTimeout(() => {
            if (this.pendingRequests.has(correlationId)) {
              this.pendingRequests.delete(correlationId);
              reject(new Error(`Request ${correlationId} timed out after 10s`));
            }
          }, 10000); // 10 second timeout
        } else {
          resolve(message);
        }
      } catch (error) {
        console.error('Error in sendMessage:', error);
        reject(error);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Example usage
async function runTest() {
  // Updated URL to include the /chat path
  const client = new FinalClient('ws://localhost:8080/chat');
  
  try {
    // Connect to the server
    console.log('\n--- Connecting to WebSocket server ---');
    await client.connect();
    
    // Wait a bit to ensure connection is established
    console.log('\n--- Waiting for connection to stabilize ---');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test ping/pong
    console.log('\n--- Testing Ping ---');
    const pingResponse = await client.ping();
    console.log('Ping response:', JSON.stringify(pingResponse, null, 2));
    
    // Test command
    console.log('\n--- Testing Command ---');
    const commandResponse = await client.sendCommand('process', { data: 'Test data' });
    console.log('Command response:', JSON.stringify(commandResponse, null, 2));
    
    // Test query
    console.log('\n--- Testing Query ---');
    const queryResponse = await client.sendQuery('getStatus');
    console.log('Query response:', JSON.stringify(queryResponse, null, 2));
    
    // Test event
    console.log('\n--- Testing Event ---');
    const eventResponse = await client.sendEvent('userMessage', { text: 'Hello, agent!' });
    console.log('Event response:', JSON.stringify(eventResponse, null, 2));
    
    // Keep the connection open for a bit to receive any additional messages
    console.log('\n--- Waiting for any additional messages (5s) ---');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n--- Closing connection ---');
    client.close();
  }
}

// Run the test
runTest().catch(console.error);

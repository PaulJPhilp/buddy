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
      console.log('🔌 Connected to WebSocket server');
      this.sendSystemMessage('client_ready');
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('👋 Disconnected from WebSocket server');
      this.pendingRequests.clear();
    });
  }

  private handleIncomingMessage(message: WebSocketMessage) {
    const timestamp = new Date(message.timestamp).toISOString();
    console.log(`\n📥 [${timestamp}] Received ${message.type} (seq: ${message.sequence}):`);
    
    // Handle correlation for request/response
    if (message.metadata?.correlationId && this.pendingRequests.has(message.metadata.correlationId)) {
      const resolve = this.pendingRequests.get(message.metadata.correlationId)!;
      this.pendingRequests.delete(message.metadata.correlationId);
      resolve(message);
    }

    // Handle different message types
    switch (message.type) {
      case 'STATE_CHANGE':
        const state = message.payload as { from: string; to: string };
        console.log(`   State changed: ${state.from} → ${state.to}`);
        break;
      case 'ERROR':
        const error = message.payload as { code: string; message: string };
        console.error(`   Error ${error.code}: ${error.message}`);
        break;
      default:
        console.log('   Payload:', JSON.stringify(message.payload, null, 2));
    }
  }

  private sendMessage(message: Omit<WebSocketMessage, 'sequence' | 'timestamp'>): Promise<WebSocketMessage> {
    const msgId = message.id;
    const fullMessage: WebSocketMessage = {
      ...message,
      sequence: this.sequence++,
      timestamp: Date.now(),
    };

    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(fullMessage));
        
        // Only wait for response if it's a request that expects one
        if (['COMMAND', 'QUERY', 'SYSTEM'].includes(message.type)) {
          this.pendingRequests.set(msgId, resolve);
          
          // Set a timeout to clean up the pending request
          setTimeout(() => {
            if (this.pendingRequests.has(msgId)) {
              this.pendingRequests.delete(msgId);
              console.warn(`⚠️ Timeout waiting for response to ${message.type} ${msgId}`);
            }
          }, 10000); // 10 second timeout
        } else {
          resolve(fullMessage);
        }
      } else {
        console.error('WebSocket is not open');
        resolve(fullMessage);
      }
    });
  }

  // Public API methods
  async sendCommand(command: string, data: unknown = {}) {
    console.log(`\n🚀 Sending COMMAND: ${command}`);
    const response = await this.sendMessage({
      id: `cmd-${uuidv4()}`,
      type: 'COMMAND',
      agentRuntimeId: this.agentRuntimeId,
      payload: { command, data },
      metadata: { priority: 1 }
    });
    return response;
  }

  async sendQuery(query: string, params: Record<string, unknown> = {}) {
    console.log(`\n❓ Sending QUERY: ${query}`);
    const response = await this.sendMessage({
      id: `qry-${uuidv4()}`,
      type: 'QUERY',
      agentRuntimeId: this.agentRuntimeId,
      payload: { query, ...params },
      metadata: {}
    });
    return response;
  }

  async sendEvent(event: string, data: unknown = {}) {
    console.log(`\n🎫 Sending EVENT: ${event}`);
    const response = await this.sendMessage({
      id: `evt-${uuidv4()}`,
      type: 'EVENT',
      agentRuntimeId: this.agentRuntimeId,
      payload: { event, data },
      metadata: {}
    });
    return response;
  }

  private async sendSystemMessage(action: string, data: unknown = {}) {
    return this.sendMessage({
      id: `sys-${uuidv4()}`,
      type: 'SYSTEM',
      agentRuntimeId: this.agentRuntimeId,
      payload: { action, ...(typeof data === 'object' ? data : { data }) },
      metadata: {}
    });
  }

  async ping() {
    console.log('\n🏓 Sending PING');
    const response = await this.sendSystemMessage('ping');
    if (response.type === 'SYSTEM' && (response.payload as any)?.action === 'pong') {
      console.log('🏸 Received PONG');
    }
    return response;
  }

  close() {
    this.ws.close();
  }
}

// Example usage
async function runTest() {
  const client = new TestClient('ws://localhost:8081');
  
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
